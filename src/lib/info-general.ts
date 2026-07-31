import "server-only";
import { getSheetValues } from "./google-sheets";
import { normalizar } from "./precios-regulados-constants";

// Hoja "BASE MANTIS ARTÍCULOS" — mismo spreadsheet que precios-regulados.ts
// (VALIDACIÓN), pestaña distinta. A pedido de Camila (2026-07-31): un
// resumen simple del portafolio completo de artículos, sin cruzarlo con la
// circular de regulación.
const SPREADSHEET_ID = "1A63G0Yg7iIKiYtA6Lipe9Tsnzl_5dsD1DtIAm8uPznk";
const SHEET_NAME = "BASE MANTIS ARTÍCULOS";

// Columnas fijas por posición (a pedido de Camila, no por encabezado como en
// precios-regulados.ts): B = Código, M = Sub Categoria (trae "CONT DIRECTO"
// para los artículos de control directo), AV = Descontinuado para compra
// ("S"/"N").
function colIndex(letters: string): number {
  let n = 0;
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}
const COL_CODIGO = colIndex("B");
const COL_SUBCATEGORIA = colIndex("M");
const COL_DESCONTINUADO = colIndex("AV");

export type InfoGeneralCounts = {
  total: number;
  descontinuados: number;
  activos: number;
  controlDirecto: number;
};

async function fetchInfoGeneralRaw(): Promise<InfoGeneralCounts> {
  const values = await getSheetValues(SPREADSHEET_ID, SHEET_NAME, "FORMATTED_VALUE");

  let total = 0;
  let descontinuados = 0;
  let activos = 0;
  let controlDirecto = 0;

  // Fila 1 = encabezados, los datos arrancan en la fila 2.
  for (let r = 1; r < values.length; r++) {
    const row = values[r] ?? [];
    const codigo = String(row[COL_CODIGO] ?? "").trim();
    if (!codigo) continue;

    total++;

    const descontinuado = String(row[COL_DESCONTINUADO] ?? "").trim().toUpperCase();
    if (descontinuado === "S") descontinuados++;
    if (descontinuado === "N") activos++;

    const subCategoria = normalizar(String(row[COL_SUBCATEGORIA] ?? ""));
    if (subCategoria.includes("DIRECTO")) controlDirecto++;
  }

  return { total, descontinuados, activos, controlDirecto };
}

// Mismo patrón de caché en memoria que precios-regulados.ts (~11.450 filas,
// unstable_cache fallaría silenciosamente por el límite de 2MB del data
// cache de Next.js).
let cache: { data: InfoGeneralCounts; expiresAt: number } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000;

export async function getInfoGeneral(): Promise<InfoGeneralCounts> {
  if (cache && cache.expiresAt > Date.now()) return cache.data;
  const data = await fetchInfoGeneralRaw();
  cache = { data, expiresAt: Date.now() + CACHE_TTL_MS };
  return data;
}

export function invalidateInfoGeneralCache(): void {
  cache = null;
}
