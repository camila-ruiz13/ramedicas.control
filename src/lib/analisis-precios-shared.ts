// Funciones puras sin dependencias de servidor (fs/xlsx) — a diferencia de
// analisis-precios.ts, este archivo NO tiene "server-only", así que también
// lo pueden importar componentes cliente (ej. codigo-row.tsx para resaltar
// celdas y calcular "listas sugeridas" en el navegador) sin arrastrar el
// resto de analisis-precios.ts (que rompe el build si un Client Component
// llega a importar "server-only" transitivamente).

// precioRegulacion === 0 significa "no regulado" (la mayoría del portafolio),
// no "regulado a $0" — solo se evalúa cuando hay un precio regulado real.
export function esSobrePrecioRegulado(
  row: { precioRegulacion: number | null },
  precioLista: number | null,
): boolean {
  return (
    precioLista !== null &&
    row.precioRegulacion !== null &&
    row.precioRegulacion > 0 &&
    precioLista > row.precioRegulacion
  );
}

export function esBajoCostoReferencia2(row: { costoReferencia2: number | null }, precioLista: number | null): boolean {
  return precioLista !== null && row.costoReferencia2 !== null && precioLista < row.costoReferencia2;
}
