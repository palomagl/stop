import { z } from 'zod';
import {
  ALFABETO,
  MAX_APELIDO,
  MAX_CATEGORIA,
  MAX_CATEGORIAS,
  MAX_RESPOSTA,
  MAX_RODADAS,
  MAX_TEMPO_RODADA,
  MIN_RODADAS,
  MIN_TEMPO_RODADA,
  REACOES,
  TAMANHO_CODIGO,
  TOTAL_AVATARES,
} from './constantes';
import { normalizar } from './normalizar';
import { contemPalavrao } from './palavroes';

const texto = z.string().transform((t) => t.replace(/\s+/g, ' ').trim());

export const apelidoSchema = texto.pipe(
  z
    .string()
    .min(1, 'Escolha um apelido.')
    .max(MAX_APELIDO, `O apelido pode ter até ${MAX_APELIDO} caracteres.`)
    .refine((a) => !contemPalavrao(a), 'Esse apelido não rola. Tenta outro?'),
);

export const avatarSchema = z.number().int().min(0).max(TOTAL_AVATARES - 1);

export const codigoSchema = z
  .string()
  .transform((c) => c.trim().toUpperCase())
  .pipe(z.string().regex(new RegExp(`^[A-Z]{${TAMANHO_CODIGO}}$`), 'O código tem 5 letras.'));

const idSchema = z.string().min(1).max(64);

/** Identificador anônimo do aparelho, usado só para histórico e ranking. */
export const dispositivoSchema = z.string().regex(/^[A-Za-z0-9-]{8,64}$/, 'Identificador de aparelho inválido.');

export const configSchema = z
  .object({
    categorias: z
      .array(texto.pipe(z.string().min(1).max(MAX_CATEGORIA)))
      .min(1, 'Deixe pelo menos uma categoria.')
      .max(MAX_CATEGORIAS, `Dá para usar até ${MAX_CATEGORIAS} categorias.`)
      .refine(
        (cats) => new Set(cats.map(normalizar)).size === cats.length,
        'Tem categoria repetida.',
      ),
    rodadas: z.number().int().min(MIN_RODADAS).max(MAX_RODADAS),
    tempoRodadaSeg: z.number().int().min(MIN_TEMPO_RODADA).max(MAX_TEMPO_RODADA),
    letrasExcluidas: z.array(z.enum(ALFABETO as [string, ...string[]])).transform((l) => [...new Set(l)]),
    publica: z.boolean(),
  })
  .refine((c) => ALFABETO.length - c.letrasExcluidas.length >= c.rodadas, {
    message: 'Sobram menos letras do que rodadas.',
  });

/** Um schema por evento que o navegador manda. O servidor ignora o que não passar. */
export const esquemasCliente = {
  'sala:criar': z.object({ apelido: apelidoSchema, avatar: avatarSchema, dispositivo: dispositivoSchema }),
  'sala:entrar': z.object({
    codigo: codigoSchema,
    apelido: apelidoSchema,
    avatar: avatarSchema,
    dispositivo: dispositivoSchema,
  }),
  'sala:jogarAgora': z.object({ apelido: apelidoSchema, avatar: avatarSchema, dispositivo: dispositivoSchema }),
  'sala:reconectar': z.object({ codigo: codigoSchema, token: z.string().min(10).max(128) }),
  'sala:sair': z.undefined().optional(),
  'sala:configurar': configSchema,
  'sala:remover': z.object({ jogadorId: idSchema }),
  'jogador:denunciar': z.object({ jogadorId: idSchema }),
  'jogador:pronto': z.object({ pronto: z.boolean() }),
  'partida:iniciar': z.undefined().optional(),
  'partida:jogarDeNovo': z.object({ voltarParaSala: z.boolean() }),
  'resposta:rascunho': z.object({ categoria: z.string().max(MAX_CATEGORIA), texto: z.string().max(MAX_RESPOSTA) }),
  'rodada:stop': z.object({
    respostas: z.record(z.string().max(MAX_CATEGORIA), z.string().max(MAX_RESPOSTA)),
  }),
  'voto:enviar': z.object({
    indice: z.number().int().min(0),
    jogadorId: idSchema,
    voto: z.enum(['sim', 'nao']),
  }),
  'correcao:pronto': z.object({ indice: z.number().int().min(0) }),
  'resultado:pronto': z.object({ rodada: z.number().int().min(1) }),
  'reacao:enviar': z.object({ emoji: z.enum(REACOES) }),
} as const;

export type EventoCliente = keyof typeof esquemasCliente;
export type DadosEvento<E extends EventoCliente> = z.output<(typeof esquemasCliente)[E]>;
