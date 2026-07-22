import "server-only";
import fs from "node:fs";
import path from "node:path";
import ExcelJS from "exceljs";
import * as XLSX from "xlsx";
import { prisma } from "./prisma";

// These 3 folders live on this machine's synced Google Drive (mounted as
// G:\), the same Drive used for the other Sheets-based modules — but here
// the sources are real Excel files, not Google Sheets, so we just read them
// off disk. Only works while the app runs on this Windows machine (hosting
// is still undecided per CLAUDE.md) — revisit if that ever changes.
const BASE_DIR = "G:\\Mi unidad\\SEGUIMIENTO Y CONTROL DE PRECIOS";
const COMPRA_DIR = path.join(BASE_DIR, "COMPRA");
const PREDEVOLUCIONES_DIR = path.join(BASE_DIR, "PREDEVOLUCIONES");
const OFERTAS_DIR = path.join(BASE_DIR, "OFERTAS");

function listDataFiles(dir: string, ext: string): string[] {
  return fs
    .readdirSync(dir)
    .filter((name) => name.toLowerCase().endsWith(ext) && !name.startsWith("~$"))
    .map((name) => path.join(dir, name));
}

function findColIndex(headers: string[], variants: readonly string[]): number {
  const lower = headers.map((h) => h.trim().toLowerCase());
  for (const variant of variants) {
    const idx = lower.indexOf(variant.toLowerCase());
    if (idx !== -1) return idx;
  }
  return -1;
}

function mesDeFecha(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

// Excel date cells come back from ExcelJS as JS Date objects at UTC
// midnight — re-deriving via UTC getters (not local ones) avoids the
// timezone off-by-one bug already hit once in this project (see tareas).
function excelDateToUTC(value: unknown): Date | null {
  if (!(value instanceof Date) || isNaN(value.getTime())) return null;
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}

// ---------- COMPRAS (.xlsx, uno por mes, encabezados en la fila 4) ----------

const COMPRA_HEADER_ROW = 4;
const COMPRA_HEADERS = {
  numero: ["Número"],
  fechaFactura: ["Fecha Factura"],
  nroFactura: ["Nro Factura"],
  nitProveedor: ["Nit Proveedor"],
  nombreProveedor: ["Nombre Proveedor"],
  codigo: ["Código"],
  articulo: ["Artículo"],
  unidades: ["Unidades"],
  subtotal: ["Subtotal"],
} as const;
type CompraKey = keyof typeof COMPRA_HEADERS;

export type ParsedCompraLinea = {
  mes: string;
  numero: string;
  fechaFactura: Date;
  nroFactura: string;
  nitProveedor: string;
  nombreProveedor: string;
  codigo: string;
  articulo: string;
  unidades: number;
  subtotal: number;
};

async function parseComprasFile(filePath: string): Promise<ParsedCompraLinea[]> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(filePath);
  const sheet = wb.worksheets[0];

  const headerRow = sheet.getRow(COMPRA_HEADER_ROW);
  const headers: string[] = [];
  for (let c = 1; c <= sheet.columnCount; c++) headers.push(String(headerRow.getCell(c).value ?? "").trim());

  const col = {} as Record<CompraKey, number>;
  for (const key of Object.keys(COMPRA_HEADERS) as CompraKey[]) {
    col[key] = findColIndex(headers, COMPRA_HEADERS[key]) + 1; // ExcelJS cells are 1-indexed
  }

  const rows: ParsedCompraLinea[] = [];
  for (let r = COMPRA_HEADER_ROW + 1; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);
    const numero = String(row.getCell(col.numero).value ?? "").trim();
    if (!numero) continue;
    const fecha = excelDateToUTC(row.getCell(col.fechaFactura).value);
    if (!fecha) continue;
    rows.push({
      mes: mesDeFecha(fecha),
      numero,
      fechaFactura: fecha,
      nroFactura: String(row.getCell(col.nroFactura).value ?? "").trim(),
      nitProveedor: String(row.getCell(col.nitProveedor).value ?? "").trim(),
      nombreProveedor: String(row.getCell(col.nombreProveedor).value ?? "").trim(),
      codigo: String(row.getCell(col.codigo).value ?? "").trim(),
      articulo: String(row.getCell(col.articulo).value ?? "").trim(),
      unidades: Number(row.getCell(col.unidades).value) || 0,
      subtotal: Number(row.getCell(col.subtotal).value) || 0,
    });
  }
  return rows;
}

export async function parseAllCompras(): Promise<ParsedCompraLinea[]> {
  const files = listDataFiles(COMPRA_DIR, ".xlsx");
  const all: ParsedCompraLinea[] = [];
  for (const file of files) all.push(...(await parseComprasFile(file)));
  return all;
}

// ---------- PREDEVOLUCIONES (.xls legacy, uno por mes, encabezados fila 4) ----------

const PREDEVOL_HEADER_ROW = 4;
const PREDEVOL_HEADERS = {
  numero: ["Número"],
  fecha: ["Fecha"],
  nit: ["Nit"],
  codigo: ["Código"],
  unidades: ["Unidades"],
  docCruce: ["Doc. Cruce", "Doc Cruce"],
} as const;
type PredevolKey = keyof typeof PREDEVOL_HEADERS;

export type ParsedPredevolucionLinea = {
  mes: string;
  numero: string;
  fecha: Date;
  nit: string;
  codigo: string;
  unidades: number;
  docCruce: string;
};

// The source's own "Fecha" column comes through as ambiguous text like
// "7/10/26" — confirmed month-first (M/D/YY) by cross-checking against the
// file's own "Fecha desde/hasta" range and the linked Doc. Cruce COM numbers.
function parsePredevolucionFecha(raw: string): Date | null {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/.exec(raw.trim());
  if (!m) return null;
  const month = Number(m[1]);
  const day = Number(m[2]);
  let year = Number(m[3]);
  if (year < 100) year += 2000;
  return new Date(Date.UTC(year, month - 1, day));
}

async function parsePredevolucionesFile(filePath: string): Promise<ParsedPredevolucionLinea[]> {
  const buf = fs.readFileSync(filePath);
  const wb = XLSX.read(buf, { cellDates: true });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: "" });

  const headers = (rows[PREDEVOL_HEADER_ROW - 1] ?? []).map((h) => String(h).trim());
  const col = {} as Record<PredevolKey, number>;
  for (const key of Object.keys(PREDEVOL_HEADERS) as PredevolKey[]) {
    col[key] = findColIndex(headers, PREDEVOL_HEADERS[key]);
  }

  const result: ParsedPredevolucionLinea[] = [];
  for (let r = PREDEVOL_HEADER_ROW; r < rows.length; r++) {
    const row = rows[r];
    const numero = String(row[col.numero] ?? "").trim();
    if (!numero) continue;
    const fecha = parsePredevolucionFecha(String(row[col.fecha] ?? ""));
    if (!fecha) continue;
    result.push({
      mes: mesDeFecha(fecha),
      numero,
      fecha,
      nit: String(row[col.nit] ?? "").trim(),
      codigo: String(row[col.codigo] ?? "").trim(),
      unidades: Number(row[col.unidades]) || 0,
      docCruce: String(row[col.docCruce] ?? "").trim(),
    });
  }
  return result;
}

export async function parseAllPredevoluciones(): Promise<ParsedPredevolucionLinea[]> {
  const files = listDataFiles(PREDEVOLUCIONES_DIR, ".xls");
  const all: ParsedPredevolucionLinea[] = [];
  for (const file of files) all.push(...(await parsePredevolucionesFile(file)));
  return all;
}

// ---------- OFERTAS (.xlsx único, 3 hojas) ----------

const OFERTAS_PARAM_HEADER_ROW = 2;
const OFERTAS_PARAM_HEADERS = {
  idOferta: ["ID Oferta"],
  nit: ["NIT"],
  nombreProveedor: ["Nombre Proveedor"],
  concepto: ["Nombre Oferta"],
  fechaInicial: ["Fecha Inicial"],
  fechaFinal: ["Fecha Final"],
} as const;

const OFERTAS_CORTE_HEADERS = {
  idOferta: ["ID Oferta"],
  corte: ["Cortes"],
  fechaInicio: ["Fecha Inicio Corte"],
  fechaFin: ["Fecha Fin Corte"],
} as const;

const OFERTAS_PRODUCTO_HEADERS = {
  idOferta: ["ID Oferta"],
  codArticulo: ["Cod Artículo", "Cod Articulo"],
  rango1: ["Rango 1"],
  rango2: ["Rango 2"],
  porPct: ["Por (%)"],
} as const;

export type ParsedOferta = {
  id: string;
  nit: string;
  nombreProveedor: string;
  concepto: string;
  fechaInicial: Date;
  fechaFinal: Date;
};
export type ParsedOfertaCorte = {
  ofertaId: string;
  corteNumero: number;
  fechaInicioCorte: Date;
  fechaFinCorte: Date;
};
export type ParsedOfertaProducto = {
  ofertaId: string;
  codArticulo: string;
  rango1: number;
  rango2: number;
  porPct: number;
};

// "DD/MM/YYYY" text — unambiguous (values like "26/12/2025" rule out
// month-first, unlike Predevoluciones' format).
function parseOfertaFecha(raw: unknown): Date | null {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(String(raw ?? "").trim());
  if (!m) return null;
  const [, d, mo, y] = m;
  return new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d)));
}

function sheetHeaders(sheet: ExcelJS.Worksheet, headerRow: number): string[] {
  const row = sheet.getRow(headerRow);
  const headers: string[] = [];
  for (let c = 1; c <= sheet.columnCount; c++) headers.push(String(row.getCell(c).value ?? "").trim());
  return headers;
}

export async function parseOfertas(): Promise<{
  ofertas: ParsedOferta[];
  cortes: ParsedOfertaCorte[];
  productos: ParsedOfertaProducto[];
}> {
  const files = listDataFiles(OFERTAS_DIR, ".xlsx");
  if (files.length === 0) {
    throw new Error(`No se encontró ningún archivo .xlsx en ${OFERTAS_DIR}`);
  }
  // Multiple files could exist if a new consolidado gets dropped without
  // removing the old one — use whichever was touched most recently.
  const filePath = files
    .map((f) => ({ f, mtime: fs.statSync(f).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime)[0].f;

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(filePath);

  const paramSheet = wb.worksheets.find((s) => s.name.trim().toLowerCase() === "parametrica inicial");
  const corteSheet = wb.worksheets.find((s) => s.name.trim().toLowerCase() === "cortes");
  const productoSheet = wb.worksheets.find((s) => s.name.trim().toLowerCase() === "productos");
  if (!paramSheet || !productoSheet) {
    throw new Error(
      "El archivo de Ofertas no tiene las hojas esperadas ('Parametrica Inicial' / 'Productos')",
    );
  }

  const pHeaders = sheetHeaders(paramSheet, OFERTAS_PARAM_HEADER_ROW);
  const pCol = {} as Record<keyof typeof OFERTAS_PARAM_HEADERS, number>;
  for (const key of Object.keys(OFERTAS_PARAM_HEADERS) as (keyof typeof OFERTAS_PARAM_HEADERS)[]) {
    pCol[key] = findColIndex(pHeaders, OFERTAS_PARAM_HEADERS[key]) + 1;
  }
  const ofertas: ParsedOferta[] = [];
  for (let r = OFERTAS_PARAM_HEADER_ROW + 1; r <= paramSheet.rowCount; r++) {
    const row = paramSheet.getRow(r);
    const id = String(row.getCell(pCol.idOferta).value ?? "").trim();
    if (!id) continue;
    const fechaInicial = parseOfertaFecha(row.getCell(pCol.fechaInicial).value);
    const fechaFinal = parseOfertaFecha(row.getCell(pCol.fechaFinal).value);
    if (!fechaInicial || !fechaFinal) continue;
    ofertas.push({
      id,
      nit: String(row.getCell(pCol.nit).value ?? "").trim(),
      nombreProveedor: String(row.getCell(pCol.nombreProveedor).value ?? "").trim(),
      concepto: String(row.getCell(pCol.concepto).value ?? "").trim(),
      fechaInicial,
      fechaFinal,
    });
  }
  const ofertaIds = new Set(ofertas.map((o) => o.id));

  const cortes: ParsedOfertaCorte[] = [];
  if (corteSheet) {
    const cHeaders = sheetHeaders(corteSheet, 1);
    const cCol = {} as Record<keyof typeof OFERTAS_CORTE_HEADERS, number>;
    for (const key of Object.keys(OFERTAS_CORTE_HEADERS) as (keyof typeof OFERTAS_CORTE_HEADERS)[]) {
      cCol[key] = findColIndex(cHeaders, OFERTAS_CORTE_HEADERS[key]) + 1;
    }
    for (let r = 2; r <= corteSheet.rowCount; r++) {
      const row = corteSheet.getRow(r);
      const ofertaId = String(row.getCell(cCol.idOferta).value ?? "").trim();
      if (!ofertaId || !ofertaIds.has(ofertaId)) continue;
      const fechaInicioCorte = parseOfertaFecha(row.getCell(cCol.fechaInicio).value);
      const fechaFinCorte = parseOfertaFecha(row.getCell(cCol.fechaFin).value);
      if (!fechaInicioCorte || !fechaFinCorte) continue;
      const corteTexto = String(row.getCell(cCol.corte).value ?? "");
      const corteNumero = Number(/(\d+)/.exec(corteTexto)?.[1] ?? 0);
      cortes.push({ ofertaId, corteNumero, fechaInicioCorte, fechaFinCorte });
    }
  }

  const prodHeaders = sheetHeaders(productoSheet, 1);
  const prodCol = {} as Record<keyof typeof OFERTAS_PRODUCTO_HEADERS, number>;
  for (const key of Object.keys(OFERTAS_PRODUCTO_HEADERS) as (keyof typeof OFERTAS_PRODUCTO_HEADERS)[]) {
    prodCol[key] = findColIndex(prodHeaders, OFERTAS_PRODUCTO_HEADERS[key]) + 1;
  }
  const productos: ParsedOfertaProducto[] = [];
  for (let r = 2; r <= productoSheet.rowCount; r++) {
    const row = productoSheet.getRow(r);
    const ofertaId = String(row.getCell(prodCol.idOferta).value ?? "").trim();
    const codArticulo = String(row.getCell(prodCol.codArticulo).value ?? "").trim();
    if (!ofertaId || !codArticulo || !ofertaIds.has(ofertaId)) continue;
    productos.push({
      ofertaId,
      codArticulo,
      rango1: Number(row.getCell(prodCol.rango1).value) || 0,
      rango2: Number(row.getCell(prodCol.rango2).value) || 0,
      porPct: Number(row.getCell(prodCol.porPct).value) || 0,
    });
  }

  return { ofertas, cortes, productos };
}

// ---------- Sincronización (reemplazo completo, como Proveedores) ----------

export async function sincronizarDescuentos(importedBy: string) {
  const [compras, predevoluciones, ofertasData] = await Promise.all([
    parseAllCompras(),
    parseAllPredevoluciones(),
    parseOfertas(),
  ]);

  return prisma.$transaction(
    async (tx) => {
      // Oferta cascades to OfertaProducto/OfertaCorte on delete.
      await tx.oferta.deleteMany({});
      await tx.compraLinea.deleteMany({});
      await tx.predevolucionLinea.deleteMany({});

      if (ofertasData.ofertas.length > 0) await tx.oferta.createMany({ data: ofertasData.ofertas });
      if (ofertasData.productos.length > 0) await tx.ofertaProducto.createMany({ data: ofertasData.productos });
      if (ofertasData.cortes.length > 0) await tx.ofertaCorte.createMany({ data: ofertasData.cortes });
      if (compras.length > 0) await tx.compraLinea.createMany({ data: compras });
      if (predevoluciones.length > 0) await tx.predevolucionLinea.createMany({ data: predevoluciones });

      await tx.descuentosImport.deleteMany({});
      await tx.descuentosImport.create({ data: { importedBy } });

      return {
        compras: compras.length,
        predevoluciones: predevoluciones.length,
        ofertas: ofertasData.ofertas.length,
        productos: ofertasData.productos.length,
        cortes: ofertasData.cortes.length,
      };
    },
    // ~60-70k filas totales vía createMany sobre el pooler de Supabase —
    // en pruebas reales una sincronización completa puede tardar varios
    // minutos; esto es una acción manual e infrecuente, no algo que bloquee
    // el uso normal del módulo, así que un timeout generoso es aceptable.
    { timeout: 600_000 },
  );
}

export async function getMesesDisponibles(): Promise<string[]> {
  const rows = await prisma.compraLinea.findMany({
    distinct: ["mes"],
    select: { mes: true },
    orderBy: { mes: "desc" },
  });
  return rows.map((r) => r.mes);
}

export async function getProveedoresDisponibles(mes: string): Promise<{ nit: string; nombre: string }[]> {
  const rows = await prisma.compraLinea.findMany({
    where: { mes },
    distinct: ["nitProveedor"],
    select: { nitProveedor: true, nombreProveedor: true },
    orderBy: { nombreProveedor: "asc" },
  });
  return rows.map((r) => ({ nit: r.nitProveedor, nombre: r.nombreProveedor }));
}

export async function getUltimaSincronizacion() {
  return prisma.descuentosImport.findFirst();
}

export async function getResumenActual() {
  const [compras, predevoluciones, ofertas, productos, cortes] = await Promise.all([
    prisma.compraLinea.count(),
    prisma.predevolucionLinea.count(),
    prisma.oferta.count(),
    prisma.ofertaProducto.count(),
    prisma.ofertaCorte.count(),
  ]);
  return { compras, predevoluciones, ofertas, productos, cortes };
}

// ---------- Motor de cálculo (funciones puras — sin acceso a DB) ----------

export type CompraParaCalculo = {
  id: string;
  mes: string;
  numero: string;
  fechaFactura: Date;
  nroFactura: string;
  nitProveedor: string;
  nombreProveedor: string;
  codigo: string;
  articulo: string;
  unidades: number;
  subtotal: number;
};

export type DevolucionParaCalculo = {
  mes: string;
  numero: string;
  nit: string;
  codigo: string;
  unidades: number;
  docCruce: string;
};

export type OfertaConProductos = {
  id: string;
  nit: string;
  nombreProveedor: string;
  concepto: string;
  fechaInicial: Date;
  fechaFinal: Date;
  productos: { codArticulo: string; rango1: number; rango2: number; porPct: number }[];
};

// Un proveedor puede tener MÁS DE UNA oferta activa bajo el mismo concepto a
// la vez (ej. "COMERCIAL PORCENTAJE" general + una promocional puntual,
// confirmado comparando contra Atenea: ABBVIE SAS/ABV002 en julio tiene dos
// ofertas COMERCIAL — 3% y 4.51% — que Atenea combina en una sola fila del
// 7.51%). Por eso se agrupa por concepto, no por "ID Oferta": el % mostrado
// es la suma de todas las ofertas de ese concepto que aplican a esa línea.
export type OfertaAplicada = { ofertaId: string; porPct: number; esperado: number };

export type LineaCalculada = {
  compra: CompraParaCalculo;
  concepto: string;
  porPct: number; // suma de % de todas las ofertas de este concepto que aplican
  unidadesNetasMes: number; // tramo usado para elegir el %, para mostrar/depurar
  esperado: number; // suma de esperado de todas las ofertas de este concepto
  ofertasAplicadas: OfertaAplicada[]; // detalle de cada oferta individual sumada
};

export type CalculoOpciones = {
  // Si es true: (1) el tramo de unidades que decide el % se evalúa neto de
  // devoluciones del mes, y (2) el valor base de cada línea se reduce en la
  // misma proporción (unidadesNetas/unidadesCompradas) antes de aplicar el %,
  // para que la suma de "Esperado" por línea cuadre con el agregado "por
  // artículo". Si es false, se usa la compra bruta tal cual.
  incluirDevoluciones: boolean;
};

// Compara solo por día (fechaFactura/fechaInicial/fechaFinal son @db.Date,
// vienen como Date a medianoche UTC) — evita cualquier desfase de huso.
function dentroDeVigencia(fecha: Date, inicio: Date, fin: Date): boolean {
  return fecha.getTime() >= inicio.getTime() && fecha.getTime() <= fin.getTime();
}

export function calcularEsperadoPorCompra(
  compras: CompraParaCalculo[],
  predevoluciones: DevolucionParaCalculo[],
  ofertas: OfertaConProductos[],
  opciones: CalculoOpciones,
): LineaCalculada[] {
  const devolPorClave = new Map<string, number>();
  for (const d of predevoluciones) {
    const key = `${d.nit}||${d.codigo}||${d.mes}`;
    devolPorClave.set(key, (devolPorClave.get(key) ?? 0) + d.unidades);
  }

  const compraAgg = new Map<string, number>(); // unidades totales por nit+codigo+mes
  for (const c of compras) {
    const key = `${c.nitProveedor}||${c.codigo}||${c.mes}`;
    compraAgg.set(key, (compraAgg.get(key) ?? 0) + c.unidades);
  }

  const ofertasPorNit = new Map<string, OfertaConProductos[]>();
  const productosPorOfertaCodigo = new Map<string, OfertaConProductos["productos"]>();
  for (const o of ofertas) {
    const arr = ofertasPorNit.get(o.nit) ?? [];
    arr.push(o);
    ofertasPorNit.set(o.nit, arr);
    for (const p of o.productos) {
      const k = `${o.id}||${p.codArticulo}`;
      const arr2 = productosPorOfertaCodigo.get(k) ?? [];
      arr2.push(p);
      productosPorOfertaCodigo.set(k, arr2);
    }
  }

  const resultado: LineaCalculada[] = [];

  for (const c of compras) {
    const key = `${c.nitProveedor}||${c.codigo}||${c.mes}`;
    const unidadesCompradas = compraAgg.get(key) ?? c.unidades;
    const devueltas = devolPorClave.get(key) ?? 0;

    const unidadesNetas = opciones.incluirDevoluciones
      ? Math.max(unidadesCompradas - devueltas, 0)
      : unidadesCompradas;
    const factor =
      opciones.incluirDevoluciones && unidadesCompradas > 0 ? unidadesNetas / unidadesCompradas : 1;
    const baseLinea = c.subtotal * factor;

    const ofertasProveedor = ofertasPorNit.get(c.nitProveedor) ?? [];
    const porConcepto = new Map<string, OfertaAplicada[]>();
    for (const oferta of ofertasProveedor) {
      if (!dentroDeVigencia(c.fechaFactura, oferta.fechaInicial, oferta.fechaFinal)) continue;
      const candidatos = productosPorOfertaCodigo.get(`${oferta.id}||${c.codigo}`) ?? [];
      const producto = candidatos.find((p) => unidadesNetas >= p.rango1 && unidadesNetas <= p.rango2);
      if (!producto) continue;

      const aplicada: OfertaAplicada = {
        ofertaId: oferta.id,
        porPct: producto.porPct,
        esperado: baseLinea * (producto.porPct / 100),
      };
      const arr = porConcepto.get(oferta.concepto) ?? [];
      arr.push(aplicada);
      porConcepto.set(oferta.concepto, arr);
    }

    for (const [concepto, ofertasAplicadas] of porConcepto) {
      resultado.push({
        compra: c,
        concepto,
        porPct: ofertasAplicadas.reduce((s, o) => s + o.porPct, 0),
        unidadesNetasMes: unidadesNetas,
        esperado: ofertasAplicadas.reduce((s, o) => s + o.esperado, 0),
        ofertasAplicadas,
      });
    }
  }

  return resultado;
}

// Trae de la base de datos solo lo necesario para un mes (y opcionalmente un
// proveedor) — nunca toda la tabla de compras a la vez.
export async function fetchDatosParaCalculo(mes: string, nit?: string) {
  const whereCompra = { mes, ...(nit ? { nitProveedor: nit } : {}) };
  const whereDevol = { mes, ...(nit ? { nit } : {}) };

  const [comprasRaw, predevoluciones, ofertasRaw] = await Promise.all([
    prisma.compraLinea.findMany({ where: whereCompra }),
    prisma.predevolucionLinea.findMany({ where: whereDevol }),
    prisma.oferta.findMany({ where: nit ? { nit } : undefined, include: { productos: true } }),
  ]);

  const compras: CompraParaCalculo[] = comprasRaw.map((c) => ({
    ...c,
    subtotal: Number(c.subtotal),
  }));
  const ofertas: OfertaConProductos[] = ofertasRaw.map((o) => ({
    ...o,
    productos: o.productos.map((p) => ({
      codArticulo: p.codArticulo,
      rango1: Number(p.rango1),
      rango2: Number(p.rango2),
      porPct: Number(p.porPct),
    })),
  }));

  return { compras, predevoluciones, ofertas };
}

// ---------- Vista "Por artículo" (agrega por código+proveedor+mes) ----------

export type ArticuloConcepto = { concepto: string; porPct: number; descuento: number };

export type ArticuloAgregado = {
  mes: string;
  nitProveedor: string;
  nombreProveedor: string;
  codigo: string;
  articulo: string;
  unidadesCompradas: number;
  unidadesDevueltas: number;
  unidadesNetas: number;
  precioUnidad: number;
  precioTotalNeto: number;
  precioTotalBruto: number;
  conceptos: ArticuloConcepto[];
};

// Reusa el resultado de calcularEsperadoPorCompra (ya validado línea a línea)
// y lo consolida en una fila por código — mismo criterio que la hoja de
// referencia de Camila: Precio Unidad es un promedio ponderado (subtotal
// bruto / unidades brutas) para que Precio Total y "precio sin pre" salgan
// exactos multiplicando por unidades netas/brutas respectivamente.
export function agregarPorArticulo(
  compras: CompraParaCalculo[],
  predevoluciones: DevolucionParaCalculo[],
  lineasCalculadas: LineaCalculada[],
): ArticuloAgregado[] {
  type Acumulador = {
    nitProveedor: string;
    nombreProveedor: string;
    codigo: string;
    articulo: string;
    mes: string;
    unidadesCompradas: number;
    subtotalBruto: number;
  };
  const base = new Map<string, Acumulador>();
  for (const c of compras) {
    const key = `${c.nitProveedor}||${c.codigo}||${c.mes}`;
    const cur =
      base.get(key) ??
      ({
        nitProveedor: c.nitProveedor,
        nombreProveedor: c.nombreProveedor,
        codigo: c.codigo,
        articulo: c.articulo,
        mes: c.mes,
        unidadesCompradas: 0,
        subtotalBruto: 0,
      } satisfies Acumulador);
    cur.unidadesCompradas += c.unidades;
    cur.subtotalBruto += c.subtotal;
    base.set(key, cur);
  }

  const devolPorClave = new Map<string, number>();
  for (const d of predevoluciones) {
    const key = `${d.nit}||${d.codigo}||${d.mes}`;
    devolPorClave.set(key, (devolPorClave.get(key) ?? 0) + d.unidades);
  }

  const conceptosPorClave = new Map<string, Map<string, { porPct: number; descuento: number }>>();
  for (const l of lineasCalculadas) {
    const key = `${l.compra.nitProveedor}||${l.compra.codigo}||${l.compra.mes}`;
    const m = conceptosPorClave.get(key) ?? new Map();
    const cur = m.get(l.concepto) ?? { porPct: l.porPct, descuento: 0 };
    cur.descuento += l.esperado; // el % ya es el mismo para todas las líneas del grupo
    m.set(l.concepto, cur);
    conceptosPorClave.set(key, m);
  }

  const resultado: ArticuloAgregado[] = [];
  for (const [key, acc] of base) {
    const unidadesDevueltas = devolPorClave.get(key) ?? 0;
    const unidadesNetas = Math.max(acc.unidadesCompradas - unidadesDevueltas, 0);
    const precioUnidad = acc.unidadesCompradas > 0 ? acc.subtotalBruto / acc.unidadesCompradas : 0;

    const conceptosMap = conceptosPorClave.get(key);
    const conceptos: ArticuloConcepto[] = conceptosMap
      ? [...conceptosMap.entries()].map(([concepto, v]) => ({ concepto, porPct: v.porPct, descuento: v.descuento }))
      : [];

    resultado.push({
      mes: acc.mes,
      nitProveedor: acc.nitProveedor,
      nombreProveedor: acc.nombreProveedor,
      codigo: acc.codigo,
      articulo: acc.articulo,
      unidadesCompradas: acc.unidadesCompradas,
      unidadesDevueltas,
      unidadesNetas,
      precioUnidad,
      precioTotalNeto: unidadesNetas * precioUnidad,
      precioTotalBruto: acc.unidadesCompradas * precioUnidad,
      conceptos,
    });
  }

  return resultado;
}
