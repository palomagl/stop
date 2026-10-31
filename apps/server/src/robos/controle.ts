import type { EstadoSala, NivelRobo } from '@rabisco/shared';
import type { Sala } from '../jogo/sala';
import type { Cerebro } from './cerebro';
import { PERFIS, decidirVoto, planejarRodada, sortearEntre } from './plano';

/** Chance de um robô levar susto (😱) quando alguém aperta STOP antes dele. */
const CHANCE_SUSTO = 0.25;

/**
 * Os robôs de uma sala. Eles olham a sala do mesmo jeito que uma pessoa olharia (o retrato
 * de `estadoPara`) e agem pelos mesmos caminhos: rascunho, STOP, voto e "Pronto". Nada de
 * atalho: a regra do jogo vale igual para robô e para gente.
 */
export class ControleDeRobos {
  private readonly timers = new Set<ReturnType<typeof setTimeout>>();
  /** Fase, rodada e letra (ou categoria em correção) que os robôs estão jogando agora. */
  private etapa = '';
  private ideias: { rodada: string; promessa: Promise<string[][]> } | null = null;
  /** Se cada resposta da rodada vale, para os votos. Chave: `jogadorId|categoria`. */
  private validade = new Map<string, boolean | null>();
  private apressou = '';

  constructor(
    private readonly sala: Sala,
    private readonly cerebro: Cerebro,
    private readonly aleatorio: () => number,
  ) {
    sala.on('mudou', () => this.observar());
    sala.on('stop', ({ jogadorId }) => this.levarSusto(jogadorId));
    sala.once('destruida', () => this.cancelar());
  }

  /** Chamado a cada mudança da sala. Nunca age na hora: tudo vai para um timer, como reflexo de gente. */
  private observar(): void {
    const robos = this.sala.robos();
    if (robos.length === 0) {
      this.cancelar();
      this.etapa = '';
      return;
    }
    const visao = this.sala.estadoPara(robos[0]!.id);
    const etapa = this.chaveDaEtapa(visao);
    if (etapa === this.etapa) {
      this.apressarSePrecisar(visao);
      return;
    }

    // Quando alguém aperta STOP, ainda dá para terminar a palavra que estava digitando.
    const continuaEscrevendo = visao.fase === 'travando' && this.etapa === `respostas:${visao.rodada}:${visao.letra}`;
    this.etapa = etapa;
    if (!continuaEscrevendo) this.cancelar();

    if (visao.fase === 'sorteio') this.comecarAPensar(visao);
    else if (visao.fase === 'respostas') this.escrever(visao);
    else if (visao.fase === 'correcao') this.corrigir(visao);
    else if (visao.fase === 'resultado') this.lerResultado(visao);
  }

  private chaveDaEtapa(visao: EstadoSala): string {
    const detalhe = visao.fase === 'correcao' ? visao.correcao?.indice : visao.letra;
    return `${visao.fase}:${visao.rodada}:${detalhe}`;
  }

  /** A letra saiu: dá para ir pensando enquanto a animação do sorteio roda. */
  private comecarAPensar(visao: EstadoSala): void {
    const categorias = visao.config.categorias;
    this.validade = new Map();
    this.ideias = {
      rodada: `${visao.rodada}:${visao.letra}`,
      promessa: this.cerebro.pensar(visao.letra!, categorias).catch(() => categorias.map(() => [])),
    };
  }

  private escrever(visao: EstadoSala): void {
    const rodada = `${visao.rodada}:${visao.letra}`;
    if (this.ideias?.rodada !== rodada) this.comecarAPensar(visao);
    const categorias = visao.config.categorias;

    void this.ideias!.promessa.then((ideias) => {
      // A rodada pode ter mudado enquanto a IA pensava (alguém pulou a letra, por exemplo).
      if (!this.etapa.endsWith(`:${rodada}`) || !/^(respostas|travando):/.test(this.etapa)) return;
      for (const robo of this.sala.robos()) {
        const plano = planejarRodada(robo.robo!, categorias, ideias, this.aleatorio);
        for (const passo of plano.passos) {
          this.validade.set(`${robo.id}|${passo.categoria}`, passo.vale);
          this.agendar(passo.emMs, () => this.sala.rascunho(robo.id, passo.categoria, passo.texto));
        }
        if (plano.stopEmMs !== null) this.agendar(plano.stopEmMs, () => this.sala.stop(robo.id, {}));
      }
    });
  }

  private corrigir(visao: EstadoSala): void {
    const correcao = visao.correcao!;
    if (correcao.indice === 0) this.julgarRodada(visao);

    for (const robo of this.sala.robos()) {
      const nivel = robo.robo as NivelRobo;
      let quando = sortearEntre([1200, 2600], this.aleatorio);
      for (const resposta of correcao.respostas) {
        if (resposta.jogadorId === robo.id || resposta.motivo) continue;
        quando += sortearEntre([700, 2200], this.aleatorio);
        this.agendar(quando, () => {
          const vale = this.validade.get(`${resposta.jogadorId}|${correcao.categoria}`) ?? null;
          const voto = decidirVoto(nivel, vale, this.aleatorio);
          if (voto) this.sala.votar(robo.id, correcao.indice, resposta.jogadorId, voto);
        });
      }
      this.agendar(quando + sortearEntre([800, 2500], this.aleatorio), () =>
        this.sala.prontoCorrecao(robo.id, correcao.indice),
      );
    }
  }

  /** Um pedido só por rodada: julga de uma vez tudo o que as pessoas escreveram. */
  private julgarRodada(visao: EstadoSala): void {
    const todas = this.sala.respostasEmCorrecao();
    if (!todas) return;
    const robos = new Set(this.sala.robos().map((r) => r.id));
    const itens = todas.flatMap((respostas, i) =>
      respostas
        .filter((r) => !r.motivo && !robos.has(r.jogadorId))
        .map((r) => ({ jogadorId: r.jogadorId, categoria: visao.config.categorias[i]!, texto: r.texto })),
    );
    if (itens.length === 0) return;

    const rodada = visao.rodada;
    this.cerebro
      .julgar(
        visao.letra!,
        itens.map(({ categoria, texto }) => ({ categoria, texto })),
      )
      .then((vereditos) => {
        if (this.sala.rodada !== rodada) return;
        itens.forEach((item, k) => this.validade.set(`${item.jogadorId}|${item.categoria}`, vereditos[k] ?? null));
      })
      .catch(() => {});
  }

  private lerResultado(visao: EstadoSala): void {
    for (const robo of this.sala.robos()) {
      const tempo = sortearEntre(PERFIS[robo.robo!].lerResultado, this.aleatorio);
      this.agendar(tempo, () => this.sala.prontoResultado(robo.id, visao.rodada));
    }
  }

  /** Todo mundo de verdade já apertou "Pronto": os robôs não seguram a turma. */
  private apressarSePrecisar(visao: EstadoSala): void {
    if ((visao.fase !== 'correcao' && visao.fase !== 'resultado') || this.apressou === this.etapa) return;
    const naVez = visao.jogadores.filter((j) => j.online && (visao.fase === 'resultado' || j.participando));
    const pessoas = naVez.filter((j) => !j.robo);
    if (pessoas.length === 0 || pessoas.some((j) => !j.pronto)) return;

    this.apressou = this.etapa;
    for (const robo of naVez.filter((j) => j.robo && !j.pronto)) {
      this.agendar(sortearEntre([500, 1300], this.aleatorio), () => {
        if (visao.fase === 'correcao') this.sala.prontoCorrecao(robo.id, visao.correcao!.indice);
        else this.sala.prontoResultado(robo.id, visao.rodada);
      });
    }
  }

  private levarSusto(quemParou: string): void {
    for (const robo of this.sala.robos()) {
      if (robo.id === quemParou || this.aleatorio() >= CHANCE_SUSTO) continue;
      this.agendar(sortearEntre([400, 1200], this.aleatorio), () => this.sala.reagir(robo.id, '😱'));
    }
  }

  private agendar(ms: number, acao: () => void): void {
    const timer = setTimeout(() => {
      this.timers.delete(timer);
      acao();
    }, Math.max(0, ms));
    this.timers.add(timer);
  }

  private cancelar(): void {
    for (const timer of this.timers) clearTimeout(timer);
    this.timers.clear();
  }
}
