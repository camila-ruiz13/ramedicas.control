import "server-only";
import { unstable_cache } from "next/cache";
import { getSheetValues, getSheetTitles } from "./google-sheets";
import {
  type ProrrogaRow,
  type Estado,
  type EstadoCount,
  type SiNoPendiente,
  type SiNoPendienteCount,
  ESTADO_ORDER,
  SI_NO_PENDIENTE_ORDER,
  normalizarEstado,
  normalizarSiNoPendiente,
  esPendiente,
} from "./prorroga-proveedores-constants";

// Ported from the "Dashboard Prórrogas Proveedores 2025-2026" Apps Script —
// same spreadsheet. leerDatos() searches for a sheet whose name contains both
// "PRORROGA" and "PROVEEDORES"; this spreadsheet only has the one tab, so we
// just take the first title instead of re-implementing that search (and to
// avoid hardcoding the exact tab name, which has trailing whitespace).
const SPREADSHEET_ID = "1nP5TJEDMQV4D1duZSWKk3DuaWEl3bFlStOEzAoGrtL0";

async function fetchProrrogaRaw(): Promise<ProrrogaRow[]> {
  const titles = await getSheetTitles(SPREADSHEET_ID);
  const sheetName = titles[0];
  if (!sheetName) return [];

  const values = await getSheetValues(SPREADSHEET_ID, sheetName, "FORMATTED_VALUE");
  if (values.length < 2) return [];

  const rows: ProrrogaRow[] = [];
  for (let r = 1; r < values.length; r++) {
    const row = values[r] ?? [];
    const proveedor = String(row[0] ?? "").trim();
    if (!proveedor) continue;

    const aceptaRaw = String(row[2] ?? "").trim();
    // Columna G es un VLOOKUP en la hoja — para varios proveedores devuelve
    // "#N/A (Did not find value...)" en vez de un número cuando el nombre no
    // matchea exacto en la tabla de origen. Number() de eso da NaN, que
    // tratamos como "sin dato" en vez de forzar un 0 engañoso.
    const numeroArticulosRaw = Number(String(row[6] ?? "").trim());
    const controlDirectoEnviadoRaw = String(row[7] ?? "").trim();
    // Columna I: igual que la G, se deja null en celdas vacías en vez de un
    // 0 engañoso (Number("") es 0, no NaN).
    const articulosCDRaw = String(row[8] ?? "").trim();
    const sistemaRealizadoRaw = String(row[10] ?? "").trim();
    rows.push({
      proveedor,
      nit: String(row[1] ?? "").trim(),
      aceptaRaw,
      estado: normalizarEstado(aceptaRaw),
      excepcion: String(row[3] ?? "").trim(),
      observacion: String(row[4] ?? "").trim(),
      anexo: String(row[5] ?? "").trim(),
      numeroArticulos: Number.isFinite(numeroArticulosRaw) ? numeroArticulosRaw : null,
      controlDirectoEnviadoRaw,
      controlDirectoEnviado: normalizarSiNoPendiente(controlDirectoEnviadoRaw),
      articulosControlDirecto: articulosCDRaw && Number.isFinite(Number(articulosCDRaw)) ? Number(articulosCDRaw) : null,
      fechaInicialControlDirecto: String(row[9] ?? "").trim(),
      sistemaRealizadoRaw,
      sistemaRealizado: normalizarSiNoPendiente(sistemaRealizadoRaw),
    });
  }
  return rows;
}

// La hoja solo cambia cuando alguien registra una respuesta de negociación —
// cacheado 5 min igual que Cambios de Precios, con botón "Actualizar" manual.
export const PRORROGA_CACHE_TAG = "prorroga-proveedores";

export const getProrrogaProveedores = unstable_cache(fetchProrrogaRaw, ["prorroga-proveedores-all"], {
  tags: [PRORROGA_CACHE_TAG],
  revalidate: 300,
});

// ---------- Filtros ----------

export type Vista = "todos" | "excepcion" | "observacion" | "pendientes";

export function applyVistaFilter(rows: ProrrogaRow[], vista: Vista): ProrrogaRow[] {
  switch (vista) {
    case "excepcion":
      return rows.filter((r) => r.excepcion);
    case "observacion":
      return rows.filter((r) => r.observacion);
    case "pendientes":
      return rows.filter((r) => esPendiente(r.estado));
    default:
      return rows;
  }
}

export function applyEstadoFilter(rows: ProrrogaRow[], estado?: string): ProrrogaRow[] {
  if (!estado) return rows;
  return rows.filter((r) => r.estado === estado);
}

// ---------- Agregaciones ----------

export function computeKpis(rows: ProrrogaRow[]) {
  const conteo = Object.fromEntries(ESTADO_ORDER.map((e) => [e, 0])) as Record<Estado, number>;
  for (const r of rows) conteo[r.estado]++;
  return { total: rows.length, conteo };
}

export function computeEstadoCounts(rows: ProrrogaRow[]): EstadoCount[] {
  const conteo = Object.fromEntries(ESTADO_ORDER.map((e) => [e, 0])) as Record<Estado, number>;
  for (const r of rows) conteo[r.estado]++;
  return ESTADO_ORDER.map((estado) => ({ estado, count: conteo[estado] })).filter((c) => c.count > 0);
}

// ---------- Control Directo (columnas H, I, J, K) ----------

export function computeControlDirectoEnviadoCounts(rows: ProrrogaRow[]): SiNoPendienteCount[] {
  const conteo = Object.fromEntries(SI_NO_PENDIENTE_ORDER.map((e) => [e, 0])) as Record<SiNoPendiente, number>;
  for (const r of rows) conteo[r.controlDirectoEnviado]++;
  return SI_NO_PENDIENTE_ORDER.map((estado) => ({ estado, count: conteo[estado] })).filter((c) => c.count > 0);
}

export function computeSistemaCounts(rows: ProrrogaRow[]): SiNoPendienteCount[] {
  const conteo = Object.fromEntries(SI_NO_PENDIENTE_ORDER.map((e) => [e, 0])) as Record<SiNoPendiente, number>;
  for (const r of rows) conteo[r.sistemaRealizado]++;
  return SI_NO_PENDIENTE_ORDER.map((estado) => ({ estado, count: conteo[estado] })).filter((c) => c.count > 0);
}

export function computeControlDirectoKpis(rows: ProrrogaRow[]) {
  const conteoEnviado = Object.fromEntries(SI_NO_PENDIENTE_ORDER.map((e) => [e, 0])) as Record<SiNoPendiente, number>;
  const conteoSistema = Object.fromEntries(SI_NO_PENDIENTE_ORDER.map((e) => [e, 0])) as Record<SiNoPendiente, number>;
  let totalArticulos = 0;
  for (const r of rows) {
    conteoEnviado[r.controlDirectoEnviado]++;
    conteoSistema[r.sistemaRealizado]++;
    totalArticulos += r.articulosControlDirecto ?? 0;
  }
  return { enviado: conteoEnviado, sistema: conteoSistema, totalArticulos };
}
