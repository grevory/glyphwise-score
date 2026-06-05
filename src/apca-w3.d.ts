declare module 'apca-w3' {
  export function sRGBtoY(rgb: [number, number, number]): number;
  export function APCAcontrast(textY: number, backgroundY: number): number;
}
