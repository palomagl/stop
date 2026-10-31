/** Apelidos dos robôs. Curtos, para caber na placa do pódio, e com cara de robô simpático. */
export const NOMES_DE_ROBO = ['Bip', 'Chip', 'Pixel', 'Byte', 'Faísca', 'Parafuso', 'Teco', 'Zapt', 'Lumi', 'Nino'];

/** Robô no arquivo de partidas: o "aparelho" dele começa assim. */
export const PREFIXO_ROBO = 'robo-';

export function ehRobo(dispositivo: string): boolean {
  return dispositivo.startsWith(PREFIXO_ROBO);
}
