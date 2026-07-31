import "server-only";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { DocStatus } from "@/generated/prisma/client";

// Tags used to invalidate the cached aggregations below — the import action
// calls revalidateTag with these same strings after a successful replace.
export const FASE1_CACHE_TAG = "proveedores-fase1";
export const FASE2_CACHE_TAG = "proveedores-fase2";

export type StatusCounts = Record<DocStatus, number>;

function emptyCounts(): StatusCounts {
  return { APROBADO: 0, RECHAZADO: 0, NO_APLICA: 0, SIN_VALIDAR: 0, NO_SUBIDO: 0 };
}

function totalOf(counts: StatusCounts) {
  return Object.values(counts).reduce((a, b) => a + b, 0);
}

// A pedido de Camila (2026-07-31): el incumplimiento es únicamente "No
// subido" — Rechazado y Sin Validar sí se subieron (solo faltan corregir o
// revisar), así que no cuentan en contra del % de cumplimiento como antes.
function pctCumplimiento(counts: StatusCounts) {
  const denom = totalOf(counts) - counts.NO_APLICA;
  return denom > 0 ? Math.round(((denom - counts.NO_SUBIDO) / denom) * 1000) / 10 : 0;
}

export function applyStatusFilter<T extends { pct: number; pendientes: number }>(
  all: T[],
  filter: string | undefined,
): T[] {
  switch (filter) {
    case "criticos":
      return all.filter((p) => p.pct < 60);
    case "completos":
      return all.filter((p) => p.pct === 100);
    case "pendientes":
      return all.filter((p) => p.pendientes > 0);
    default:
      return all;
  }
}

export type ProviderRow = {
  id: string;
  proveedor: string;
  total: number;
  aprobados: number;
  pendientes: number;
  pct: number;
  counts: StatusCounts;
};

export type ProviderRowFase2 = ProviderRow & {
  articulos: number;
  sinValidar: number;
  subidoParaValidar: number;
  validados: number;
  pctValidacion: number;
};

async function fetchFase1AllProviders(): Promise<ProviderRow[]> {
  const grouped = await prisma.documentStatus.groupBy({
    by: ["supplierId", "status"],
    where: { phase: "FASE_1", supplierId: { not: null } },
    _count: { _all: true },
  });

  const bySupplier = new Map<string, StatusCounts>();
  for (const row of grouped) {
    const id = row.supplierId!;
    if (!bySupplier.has(id)) bySupplier.set(id, emptyCounts());
    bySupplier.get(id)![row.status] += row._count._all;
  }

  const suppliers = await prisma.supplier.findMany({
    where: { id: { in: [...bySupplier.keys()] } },
    select: { id: true, name: true },
  });
  const nameById = new Map(suppliers.map((s) => [s.id, s.name]));

  return [...bySupplier.entries()].map(([id, counts]) => ({
    id,
    proveedor: nameById.get(id) ?? "—",
    total: totalOf(counts),
    aprobados: counts.APROBADO,
    pendientes: counts.RECHAZADO + counts.SIN_VALIDAR + counts.NO_SUBIDO,
    pct: pctCumplimiento(counts),
    counts,
  }));
}

async function fetchFase2AllProviders(): Promise<ProviderRowFase2[]> {
  // Fase 2's DocumentStatus only has productId, not supplierId — the
  // supplier rollup needs a join, done here in SQL rather than in JS so we
  // never pull the ~43k individual document rows into Node. This query and
  // the article-count query below don't depend on each other, so they run
  // concurrently instead of one-after-another.
  const [grouped, articleCounts] = await Promise.all([
    prisma.$queryRaw<{ supplierId: string; status: DocStatus; count: bigint }[]>`
      SELECT p."supplierId" as "supplierId", ds.status as "status", COUNT(*)::bigint as "count"
      FROM document_statuses ds
      JOIN products p ON p.id = ds."productId"
      WHERE ds.phase = 'FASE_2'
      GROUP BY p."supplierId", ds.status
    `,
    prisma.product.groupBy({ by: ["supplierId"], _count: { _all: true } }),
  ]);
  const articulosById = new Map(articleCounts.map((a) => [a.supplierId, a._count._all]));

  const bySupplier = new Map<string, StatusCounts>();
  for (const row of grouped) {
    if (!bySupplier.has(row.supplierId)) bySupplier.set(row.supplierId, emptyCounts());
    bySupplier.get(row.supplierId)![row.status] += Number(row.count);
  }

  const suppliers = await prisma.supplier.findMany({
    where: { id: { in: [...bySupplier.keys()] } },
    select: { id: true, name: true },
  });
  const nameById = new Map(suppliers.map((s) => [s.id, s.name]));

  return [...bySupplier.entries()].map(([id, counts]) => {
    const subidoParaValidar = counts.APROBADO + counts.RECHAZADO + counts.SIN_VALIDAR;
    const validados = counts.APROBADO + counts.RECHAZADO;
    return {
      id,
      proveedor: nameById.get(id) ?? "—",
      articulos: articulosById.get(id) ?? 0,
      total: totalOf(counts),
      aprobados: counts.APROBADO,
      pendientes: counts.RECHAZADO + counts.SIN_VALIDAR + counts.NO_SUBIDO,
      sinValidar: counts.SIN_VALIDAR,
      subidoParaValidar,
      validados,
      pctValidacion:
        subidoParaValidar > 0 ? Math.round((validados / subidoParaValidar) * 1000) / 10 : 0,
      pct: pctCumplimiento(counts),
      counts,
    };
  });
}

// Aggregates in the database (GROUP BY), never pulls one row per document —
// that's what made the old version slow: ~2.4k rows for Fase 1 and ~43k rows
// for Fase 2, fully joined and shipped to Node, on every page load.
//
// Also cached: every DB round trip to Supabase costs ~150-800ms of pure
// network latency regardless of how fast the query itself runs (measured via
// EXPLAIN ANALYZE — the heaviest query here executes in ~33ms server-side).
// Since this data only changes when someone re-imports the Excel, redoing
// the round trips on every page view/filter/sort was the main reason pages
// sat in "Rendering..." for seconds. `importarProveedores` calls
// revalidateTag(FASE1_CACHE_TAG / FASE2_CACHE_TAG) right after a successful
// import, so the cache never serves stale data.
export const getFase1AllProviders = unstable_cache(fetchFase1AllProviders, ["proveedores-fase1-all"], {
  tags: [FASE1_CACHE_TAG],
  revalidate: 300,
});

export const getFase2AllProviders = unstable_cache(fetchFase2AllProviders, ["proveedores-fase2-all"], {
  tags: [FASE2_CACHE_TAG],
  revalidate: 300,
});

export function summarizeStatus<T extends { pct: number; counts: StatusCounts }>(all: T[]) {
  const overall = emptyCounts();
  for (const p of all) {
    for (const key of Object.keys(overall) as DocStatus[]) overall[key] += p.counts[key];
  }
  const avgPct = all.length
    ? Math.round((all.reduce((s, p) => s + p.pct, 0) / all.length) * 10) / 10
    : 0;
  return {
    overall,
    totalProveedores: all.length,
    avgPct,
    completos: all.filter((p) => p.pct === 100).length,
    criticos: all.filter((p) => p.pct < 60).length,
  };
}

// ----- On-demand detail (only fetched when a single provider's dialog opens) -----

export type DocEntry = { doc: string; status: DocStatus };
export type ProductEntry = { codigo: string; articulo: string; docs: DocEntry[] };

export async function getSupplierDocuments(supplierId: string): Promise<DocEntry[]> {
  const rows = await prisma.documentStatus.findMany({
    where: { phase: "FASE_1", supplierId },
    include: { documentType: true },
    orderBy: { documentType: { order: "asc" } },
  });
  return rows.map((r) => ({ doc: r.documentType.name, status: r.status }));
}

export async function getSupplierProducts(supplierId: string): Promise<ProductEntry[]> {
  const products = await prisma.product.findMany({
    where: { supplierId },
    include: {
      documentStatuses: { include: { documentType: true }, orderBy: { documentType: { order: "asc" } } },
    },
    orderBy: { name: "asc" },
  });
  return products.map((p) => ({
    codigo: p.code,
    articulo: p.name,
    docs: p.documentStatuses.map((d) => ({ doc: d.documentType.name, status: d.status })),
  }));
}

export async function getLastImportDates() {
  const imports = await prisma.proveedoresImport.findMany();
  const map: Partial<Record<"FASE_1" | "FASE_2", { importedAt: Date; importedBy: string }>> = {};
  for (const imp of imports) map[imp.phase] = imp;
  return map;
}
