import "server-only";
import { unstable_cache } from "next/cache";
import { getSheetValues, getSheetTitles } from "./google-sheets";
import {
  type ProrrogaRow,
  type Estado,
  type EstadoCount,
  ESTADO_ORDER,
  normalizarEstado,
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
    rows.push({
      proveedor,
      nit: String(row[1] ?? "").trim(),
      aceptaRaw,
      estado: normalizarEstado(aceptaRaw),
      excepcion: String(row[3] ?? "").trim(),
      observacion: String(row[4] ?? "").trim(),
      anexo: String(row[5] ?? "").trim(),
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
