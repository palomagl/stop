import { EventEmitter } from 'node:events';
import { randomBytes, randomUUID } from 'node:crypto';
import {
  ALFABETO,
  CONFIG_PADRAO,
  MAX_JOGADORES,
  MIN_JOGADORES,
  anuladaPorVotos,
  calcularPosicoes,
  limparTexto,
  motivoAnulacaoAutomatica,
  normalizar,
  pontuarCategoria,
  type Config,
  type Duracoes,
  type EstadoSala,
  type Fase,
  type FimDePartida,
  type JogadorPublico,
  type LinhaPlacar,
  type Reacao,
  type RespostaEmCorrecao,
  type ResumoPartida,
  type Voto,
} from '@rabisco/shared';

export interface Jogador {
  id: string;
  token: string;
  apelido: string;
  avatar: number;
  online: boolean;
  socketId: string | null;
  /** Pronto no lobby. Na correção e no resultado vale o conjunto de prontos da etapa. */
  pronto: boolean;
  pontos: number;
  respostas: Map<string, string>;
  participando: boolean;
  stops: number;
  timerFora: ReturnType<typeof setTimeout> | null;
}

export type MotivoSaida = 'saiu' | 'removido' | 'tempo';

interface EventosSala {
  mudou: [];
  stop: [{ jogadorId: string; apelido: string }];
  reacao: [{ id: string; jogadorId: string; emoji: Reacao }];
  removido: [Jogador, MotivoSaida];
  vazia: [];
}

interface CorrecaoInterna {
  indice: number;
  porCategoria: RespostaEmCorrecao[][];
  prontos: Set<string>;
}

interface RegistroResposta {
  categoria: string;
  apelido: string;
  texto: string;
  anulada: boolean;
  votosSim: number;
}

export interface OpcoesSala {
  duracoes: Duracoes;
  aleatorio: () => number;
}

const INTERVALO_REACAO_MS = 400;

/**
 * Uma sala e a máquina de estados da partida.
 * Os métodos devolvem uma mensagem quando a ação faz sentido para a pessoa saber
 * que deu errado, e `null` quando deu certo ou quando a ação chegou fora da hora
 * (nesse caso ela é só ignorada).
 */
export class Sala extends EventEmitter<EventosSala> {
  readonly codigo: string;
  config: Config = structuredClone(CONFIG_PADRAO);
  fase: Fase = 'lobby';
  readonly jogadores = new Map<string, Jogador>();
  donoId: string | null = null;
  rodada = 0;
  letra: string | null = null;
  letrasUsadas: string[] = [];
  terminaEm: number | null = null;
  stopPor: string | null = null;
  /** Desde quando ninguém está conectado. Usado para apagar salas abandonadas. */
  semNinguemDesde: number | null = Date.now();

  private timer: ReturnType<typeof setTimeout> | null = null;
  private correcao: CorrecaoInterna | null = null;
  private resultado: { linhas: LinhaPlacar[]; prontos: Set<string> } | null = null;
  private fim: FimDePartida | null = null;
  private historico: RegistroResposta[] = [];
  private ultimaReacao = new Map<string, number>();

  constructor(
    codigo: string,
    private readonly opcoes: OpcoesSala,
  ) {
    super();
    this.codigo = codigo;
  }

  // ── Entrada e saída ────────────────────────────────────────────────

  adicionarJogador(apelido: string, avatar: number): Jogador | string {
    if (this.jogadores.size >= MAX_JOGADORES) return 'A sala está cheia.';
    const repetido = [...this.jogadores.values()].some((j) => normalizar(j.apelido) === normalizar(apelido));
    if (repetido) return 'Já tem alguém com esse apelido nessa sala.';

    const jogador: Jogador = {
      id: randomUUID(),
      token: randomBytes(24).toString('hex'),
      apelido,
      avatar,
      online: false,
      socketId: null,
      pronto: false,
      pontos: 0,
      respostas: new Map(),
      participando: !this.emPartida(),
      stops: 0,
      timerFora: null,
    };
    this.jogadores.set(jogador.id, jogador);
    this.donoId ??= jogador.id;
    this.emit('mudou');
    return jogador;
  }

  porToken(token: string): Jogador | undefined {
    return [...this.jogadores.values()].find((j) => j.token === token);
  }

  conectar(jogador: Jogador, socketId: string): void {
    this.limparTimerFora(jogador);
    jogador.online = true;
    jogador.socketId = socketId;
    this.semNinguemDesde = null;
    this.emit('mudou');
  }

  desconectar(jogadorId: string, socketId: string): void {
    const jogador = this.jogadores.get(jogadorId);
    // Ignora o aviso de um socket antigo quando a pessoa já voltou por outro.
    if (!jogador || jogador.socketId !== socketId) return;
    jogador.online = false;
    jogador.socketId = null;
    this.agendarFora(jogador);
    if (![...this.jogadores.values()].some((j) => j.online)) this.semNinguemDesde = Date.now();
    this.verificarAvanco();
    this.emit('mudou');
  }

  sair(jogadorId: string): void {
    this.tirar(jogadorId, 'saiu');
  }

  remover(quemPede: string, alvoId: string): string | null {
    if (quemPede !== this.donoId) return 'Só quem é dono da sala pode remover alguém.';
    if (alvoId === quemPede) return null;
    if (!this.jogadores.has(alvoId)) return null;
    this.tirar(alvoId, 'removido');
    return null;
  }

  // ── Lobby ──────────────────────────────────────────────────────────

  configurar(jogadorId: string, config: Config): string | null {
    if (jogadorId !== this.donoId) return 'Só quem é dono da sala muda as configurações.';
    if (this.fase !== 'lobby') return null;
    this.config = config;
    this.emit('mudou');
    return null;
  }

  marcarPronto(jogadorId: string, pronto: boolean): string | null {
    const jogador = this.jogadores.get(jogadorId);
    if (!jogador || this.fase !== 'lobby') return null;
    jogador.pronto = pronto;
    this.emit('mudou');
    return null;
  }

  iniciar(jogadorId: string): string | null {
    if (jogadorId !== this.donoId) return 'Só quem é dono da sala pode começar.';
    if (this.fase !== 'lobby') return null;
    const online = [...this.jogadores.values()].filter((j) => j.online);
    if (online.length < MIN_JOGADORES) return `Precisa de pelo menos ${MIN_JOGADORES} pessoas online.`;
    if (online.some((j) => j.id !== this.donoId && !j.pronto)) return 'Ainda tem gente que não está pronta.';
    this.novaPartida();
    return null;
  }

  // ── Rodada ─────────────────────────────────────────────────────────

  rascunho(jogadorId: string, categoria: string, texto: string): void {
    const jogador = this.jogadores.get(jogadorId);
    if (!jogador?.participando) return;
    if (this.fase !== 'respostas' && this.fase !== 'travando') return;
    if (!this.config.categorias.includes(categoria)) return;
    const antes = Boolean(limparTexto(jogador.respostas.get(categoria) ?? ''));
    jogador.respostas.set(categoria, texto);
    // Os outros só veem quantos campos cada um preencheu, então só avisa quando isso muda.
    if (antes !== Boolean(limparTexto(texto))) this.emit('mudou');
  }

  stop(jogadorId: string, respostas: Record<string, string>): string | null {
    const jogador = this.jogadores.get(jogadorId);
    if (!jogador?.participando || this.fase !== 'respostas') return null;
    if (this.terminaEm !== null && Date.now() >= this.terminaEm) return null;

    for (const categoria of this.config.categorias) {
      if (Object.hasOwn(respostas, categoria)) jogador.respostas.set(categoria, respostas[categoria]!);
    }
    const faltando = this.config.categorias.some((c) => !limparTexto(jogador.respostas.get(c) ?? ''));
    if (faltando) return 'Preencha todas as categorias antes de apertar STOP.';

    jogador.stops++;
    this.stopPor = jogador.id;
    this.fase = 'travando';
    this.definirPrazo(this.opcoes.duracoes.trava, () => this.fecharRespostas());
    this.emit('stop', { jogadorId: jogador.id, apelido: jogador.apelido });
    this.emit('mudou');
    return null;
  }

  // ── Correção ───────────────────────────────────────────────────────

  votar(jogadorId: string, indice: number, alvoId: string, voto: Voto): string | null {
    const jogador = this.jogadores.get(jogadorId);
    if (!jogador?.participando || this.fase !== 'correcao' || !this.correcao) return null;
    if (this.correcao.indice !== indice) return null;
    if (alvoId === jogadorId) return 'Não dá para votar na própria resposta.';
    const resposta = this.correcao.porCategoria[indice]!.find((r) => r.jogadorId === alvoId);
    if (!resposta || resposta.motivo) return null;
    resposta.votos[jogadorId] = voto;
    this.emit('mudou');
    return null;
  }

  prontoCorrecao(jogadorId: string, indice: number): void {
    const jogador = this.jogadores.get(jogadorId);
    if (!jogador?.participando || this.fase !== 'correcao' || this.correcao?.indice !== indice) return;
    this.correcao.prontos.add(jogadorId);
    this.verificarAvanco();
    this.emit('mudou');
  }

  prontoResultado(jogadorId: string, rodada: number): void {
    if (this.fase !== 'resultado' || !this.resultado || rodada !== this.rodada) return;
    if (!this.jogadores.has(jogadorId)) return;
    this.resultado.prontos.add(jogadorId);
    this.verificarAvanco();
    this.emit('mudou');
  }

  // ── Fim ────────────────────────────────────────────────────────────

  jogarDeNovo(jogadorId: string, voltarParaSala: boolean): string | null {
    if (jogadorId !== this.donoId) return 'Só quem é dono da sala decide.';
    if (this.fase !== 'fim') return null;
    if (voltarParaSala) {
      this.zerarPartida();
      this.fase = 'lobby';
      this.emit('mudou');
      return null;
    }
    const online = [...this.jogadores.values()].filter((j) => j.online).length;
    if (online < MIN_JOGADORES) return `Precisa de pelo menos ${MIN_JOGADORES} pessoas online.`;
    this.novaPartida();
    return null;
  }

  reagir(jogadorId: string, emoji: Reacao): void {
    if (!this.jogadores.has(jogadorId)) return;
    const agora = Date.now();
    if (agora - (this.ultimaReacao.get(jogadorId) ?? 0) < INTERVALO_REACAO_MS) return;
    this.ultimaReacao.set(jogadorId, agora);
    this.emit('reacao', { id: randomUUID(), jogadorId, emoji });
  }

  destruir(): void {
    this.limparTimer();
    for (const jogador of this.jogadores.values()) this.limparTimerFora(jogador);
    this.removeAllListeners();
  }

  // ── Retrato para o navegador ───────────────────────────────────────

  estadoPara(jogadorId: string): EstadoSala {
    const eu = this.jogadores.get(jogadorId);
    const prontosDaEtapa =
      this.fase === 'correcao' ? this.correcao?.prontos : this.fase === 'resultado' ? this.resultado?.prontos : null;

    const jogadores: JogadorPublico[] = [...this.jogadores.values()].map((j) => ({
      id: j.id,
      apelido: j.apelido,
      avatar: j.avatar,
      dono: j.id === this.donoId,
      online: j.online,
      pronto: prontosDaEtapa ? prontosDaEtapa.has(j.id) : j.pronto,
      pontos: j.pontos,
      preenchidas: this.config.categorias.filter((c) => limparTexto(j.respostas.get(c) ?? '')).length,
      participando: j.participando,
    }));

    const correcao = this.fase === 'correcao' && this.correcao ? this.correcao : null;

    return {
      codigo: this.codigo,
      fase: this.fase,
      config: this.config,
      jogadores,
      meuId: jogadorId,
      rodada: this.rodada,
      letra: this.letra,
      letrasUsadas: this.letrasUsadas,
      terminaEm: this.terminaEm,
      agora: Date.now(),
      stopPor: this.stopPor,
      minhasRespostas: eu ? Object.fromEntries(eu.respostas) : {},
      correcao: correcao && {
        indice: correcao.indice,
        categoria: this.config.categorias[correcao.indice]!,
        respostas: correcao.porCategoria[correcao.indice]!,
        prontos: [...correcao.prontos],
      },
      resultado:
        this.fase === 'resultado' && this.resultado
          ? { linhas: this.resultado.linhas, prontos: [...this.resultado.prontos] }
          : null,
      fim: this.fase === 'fim' ? this.fim : null,
    };
  }

  // ── Transições internas ────────────────────────────────────────────

  private emPartida(): boolean {
    return this.fase !== 'lobby' && this.fase !== 'fim';
  }

  private zerarPartida(): void {
    this.limparTimer();
    for (const j of this.jogadores.values()) {
      j.pontos = 0;
      j.stops = 0;
      j.pronto = false;
      j.respostas = new Map();
      j.participando = true;
    }
    this.rodada = 0;
    this.letra = null;
    this.letrasUsadas = [];
    this.stopPor = null;
    this.correcao = null;
    this.resultado = null;
    this.fim = null;
    this.historico = [];
  }

  private novaPartida(): void {
    this.zerarPartida();
    for (const j of this.jogadores.values()) if (!j.online) this.agendarFora(j);
    this.iniciarRodada();
  }

  private iniciarRodada(): void {
    const disponiveis = ALFABETO.filter(
      (l) => !this.config.letrasExcluidas.includes(l) && !this.letrasUsadas.includes(l),
    );
    if (disponiveis.length === 0) {
      this.irParaFim();
      return;
    }
    this.rodada++;
    this.letra = disponiveis[Math.floor(this.opcoes.aleatorio() * disponiveis.length)]!;
    this.letrasUsadas.push(this.letra);
    for (const j of this.jogadores.values()) {
      j.participando = true;
      j.respostas = new Map();
    }
    this.stopPor = null;
    this.correcao = null;
    this.resultado = null;
    this.fase = 'sorteio';
    this.definirPrazo(this.opcoes.duracoes.sorteio, () => this.abrirRespostas());
    this.emit('mudou');
  }

  private abrirRespostas(): void {
    this.fase = 'respostas';
    this.definirPrazo(
      this.config.tempoRodadaSeg * 1000,
      () => this.fecharRespostas(),
      this.opcoes.duracoes.folgaRespostas,
    );
    this.emit('mudou');
  }

  private fecharRespostas(): void {
    const participantes = [...this.jogadores.values()].filter((j) => j.participando);
    const porCategoria = this.config.categorias.map((categoria) =>
      participantes.map((j) => {
        const texto = limparTexto(j.respostas.get(categoria) ?? '');
        return {
          jogadorId: j.id,
          apelido: j.apelido,
          avatar: j.avatar,
          texto,
          motivo: motivoAnulacaoAutomatica(texto, this.letra!),
          votos: {},
        };
      }),
    );
    this.correcao = { indice: 0, porCategoria, prontos: new Set() };
    this.abrirCategoria(0);
  }

  private abrirCategoria(indice: number): void {
    const correcao = this.correcao!;
    correcao.indice = indice;
    correcao.prontos = new Set();
    this.fase = 'correcao';
    const respostas = correcao.porCategoria[indice]!;
    const temOQueVotar = respostas.filter((r) => !r.motivo).length > 0 && respostas.length > 1;
    this.definirPrazo(
      temOQueVotar ? this.opcoes.duracoes.correcao : this.opcoes.duracoes.correcaoSemVotos,
      () => this.avancarCorrecao(),
    );
    this.emit('mudou');
  }

  private avancarCorrecao(): void {
    const correcao = this.correcao!;
    if (correcao.indice + 1 < this.config.categorias.length) this.abrirCategoria(correcao.indice + 1);
    else this.encerrarRodada();
  }

  private encerrarRodada(): void {
    const correcao = this.correcao!;
    const presentes = [...this.jogadores.values()];
    const totaisAntes = Object.fromEntries(presentes.map((j) => [j.id, j.pontos]));
    const posicaoAnterior = calcularPosicoes(totaisAntes);

    const pontosRodada: Record<string, number> = Object.fromEntries(presentes.map((j) => [j.id, 0]));
    this.config.categorias.forEach((categoria, i) => {
      const respostas = correcao.porCategoria[i]!.filter((r) => this.jogadores.has(r.jogadorId));
      const avaliadas = respostas.map((r) => ({
        jogadorId: r.jogadorId,
        texto: r.texto,
        anulada: r.motivo !== null || anuladaPorVotos(r.votos),
      }));
      const pontos = pontuarCategoria(avaliadas);
      for (const r of avaliadas) {
        pontosRodada[r.jogadorId]! += pontos[r.jogadorId] ?? 0;
        const original = respostas.find((o) => o.jogadorId === r.jogadorId)!;
        this.historico.push({
          categoria,
          apelido: original.apelido,
          texto: r.texto,
          anulada: r.anulada,
          votosSim: Object.values(original.votos).filter((v) => v === 'sim').length,
        });
      }
    });

    for (const j of presentes) j.pontos += pontosRodada[j.id]!;
    const posicao = calcularPosicoes(Object.fromEntries(presentes.map((j) => [j.id, j.pontos])));

    const linhas: LinhaPlacar[] = presentes
      .map((j) => ({
        jogadorId: j.id,
        apelido: j.apelido,
        avatar: j.avatar,
        pontosRodada: pontosRodada[j.id]!,
        total: j.pontos,
        posicao: posicao[j.id]!,
        posicaoAnterior: posicaoAnterior[j.id]!,
      }))
      .sort((a, b) => a.posicao - b.posicao || a.apelido.localeCompare(b.apelido));

    this.correcao = null;
    this.resultado = { linhas, prontos: new Set() };
    this.fase = 'resultado';
    this.definirPrazo(this.opcoes.duracoes.resultado, () => this.proximaEtapa());
    this.emit('mudou');
  }

  private proximaEtapa(): void {
    if (this.rodada >= this.config.rodadas) this.irParaFim();
    else this.iniciarRodada();
  }

  private irParaFim(): void {
    this.limparTimer();
    this.terminaEm = null;
    const presentes = [...this.jogadores.values()];
    const posicao = calcularPosicoes(Object.fromEntries(presentes.map((j) => [j.id, j.pontos])));
    this.fim = {
      classificacao: presentes
        .map((j) => ({ jogadorId: j.id, apelido: j.apelido, avatar: j.avatar, pontos: j.pontos, posicao: posicao[j.id]! }))
        .sort((a, b) => a.posicao - b.posicao || a.apelido.localeCompare(b.apelido)),
      resumo: this.montarResumo(presentes),
    };
    this.correcao = null;
    this.resultado = null;
    this.fase = 'fim';
    this.emit('mudou');
  }

  private montarResumo(presentes: Jogador[]): ResumoPartida {
    const votadas = this.historico.filter((r) => !r.anulada && r.votosSim > 0);
    const maisVotada = votadas.reduce<RegistroResposta | null>(
      (melhor, r) => (!melhor || r.votosSim > melhor.votosSim ? r : melhor),
      null,
    );

    const quemMaisParou = presentes.reduce<Jogador | null>(
      (melhor, j) => (j.stops > 0 && (!melhor || j.stops > melhor.stops) ? j : melhor),
      null,
    );

    const anuladas = new Map<string, number>();
    for (const r of this.historico) if (r.anulada) anuladas.set(r.categoria, (anuladas.get(r.categoria) ?? 0) + 1);
    const piorCategoria = [...anuladas.entries()].reduce<[string, number] | null>(
      (pior, atual) => (!pior || atual[1] > pior[1] ? atual : pior),
      null,
    );

    return {
      maisVotada: maisVotada && {
        apelido: maisVotada.apelido,
        texto: maisVotada.texto,
        categoria: maisVotada.categoria,
        votos: maisVotada.votosSim,
      },
      maisStops: quemMaisParou && { apelido: quemMaisParou.apelido, quantidade: quemMaisParou.stops },
      categoriaMaisErrada: piorCategoria && { categoria: piorCategoria[0], anuladas: piorCategoria[1] },
    };
  }

  /** Avança a correção ou o resultado quando todo mundo online já apertou "Pronto". */
  private verificarAvanco(): void {
    const prontos =
      this.fase === 'correcao' ? this.correcao?.prontos : this.fase === 'resultado' ? this.resultado?.prontos : null;
    if (!prontos) return;
    const esperando = [...this.jogadores.values()].filter(
      (j) => j.online && (this.fase === 'resultado' || j.participando),
    );
    if (esperando.length === 0 || esperando.some((j) => !prontos.has(j.id))) return;
    if (this.fase === 'correcao') this.avancarCorrecao();
    else this.proximaEtapa();
  }

  private tirar(jogadorId: string, motivo: MotivoSaida): void {
    const jogador = this.jogadores.get(jogadorId);
    if (!jogador) return;
    this.limparTimerFora(jogador);
    this.jogadores.delete(jogadorId);
    this.ultimaReacao.delete(jogadorId);
    if (this.donoId === jogadorId) this.passarDono();
    this.emit('removido', jogador, motivo);

    if (this.jogadores.size === 0) {
      this.destruirEAvisar();
      return;
    }
    if (this.emPartida() && this.jogadores.size < MIN_JOGADORES) this.irParaFim();
    else this.verificarAvanco();
    this.emit('mudou');
  }

  private destruirEAvisar(): void {
    this.limparTimer();
    this.emit('vazia');
    this.destruir();
  }

  private passarDono(): void {
    const restantes = [...this.jogadores.values()];
    this.donoId = (restantes.find((j) => j.online) ?? restantes[0])?.id ?? null;
  }

  /**
   * Quem fica fora por mais de 2 minutos sai da partida.
   * Fora da partida (lobby e fim) a pessoa continua na sala, mas deixa de ser dona.
   */
  private agendarFora(jogador: Jogador): void {
    this.limparTimerFora(jogador);
    jogador.timerFora = setTimeout(() => {
      jogador.timerFora = null;
      if (jogador.online || !this.jogadores.has(jogador.id)) return;
      if (this.emPartida()) {
        this.tirar(jogador.id, 'tempo');
      } else if (this.donoId === jogador.id && [...this.jogadores.values()].some((j) => j.online)) {
        this.passarDono();
        this.emit('mudou');
      }
    }, this.opcoes.duracoes.foraDaPartida);
  }

  private limparTimerFora(jogador: Jogador): void {
    if (jogador.timerFora) clearTimeout(jogador.timerFora);
    jogador.timerFora = null;
  }

  /** Marca quando a fase termina e agenda a transição. A folga não aparece para o navegador. */
  private definirPrazo(ms: number, aoTerminar: () => void, folga = 0): void {
    this.limparTimer();
    this.terminaEm = Date.now() + ms;
    this.timer = setTimeout(() => {
      this.timer = null;
      aoTerminar();
    }, ms + folga);
  }

  private limparTimer(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
  }
}
