"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requireModuleInteract, requireModuleView } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getSheetValues, getSheetTitles } from "@/lib/google-sheets";
import {
  getSupplierDocuments,
  getSupplierProducts,
  FASE1_CACHE_TAG,
  FASE2_CACHE_TAG,
} from "@/lib/proveedores";
import type { DocStatus } from "@/generated/prisma/client";

// Same spreadsheet the "AUTORIZACIÓN COMPRAS PROVEEDORES" Excel used to be
// exported from — first tab is Primera Fase, whichever tab is named
// "segunda fase" (any case) is Segunda Fase, matching the old
// workbook.worksheets[0] / findSheet(workbook, "segunda fase") logic.
const SPREADSHEET_ID = "1JLPDVOElrx2-MDeRtvTcQssVzAgh1etqn5tkWLycZpw";
const FASE2_SHEET_NAME_MATCH = "segunda fase";

const STATUS_BY_LABEL: Record<string, DocStatus> = {
  aprobado: "APROBADO",
  rechazado: "RECHAZADO",
  "no aplica": "NO_APLICA",
  "sin validar": "SIN_VALIDAR",
  "no subido": "NO_SUBIDO",
};

function parseStatus(raw: unknown): DocStatus | null {
  const text = String(raw ?? "").trim().toLowerCase();
  if (!text) return null;
  return STATUS_BY_LABEL[text] ?? null;
}

// firstCol is 0-based here (plain arrays from the Sheets API), unlike
// ExcelJS's 1-based cell columns the old Excel-upload version indexed by.
function readHeaders(headerRow: unknown[], firstCol: number) {
  const headers: { col: number; name: string }[] = [];
  for (let c = firstCol; c < headerRow.length; c++) {
    const name = String(headerRow[c] ?? "").trim();
    if (name) headers.push({ col: c, name });
  }
  return headers;
}

// Replaces the old Excel-upload flow: pulls both tabs live from the Google
// Sheet and does the same full-replace-into-Postgres import the upload used
// to do. Triggered by the "Actualizar" button on either Proveedores page.
export async function sincronizarProveedores() {
  const profile = await requireModuleInteract("proveedores");

  const titles = await getSheetTitles(SPREADSHEET_ID);
  const fase1SheetName = titles[0];
  const fase2SheetName = titles.find(
    (t) => t.trim().toLowerCase() === FASE2_SHEET_NAME_MATCH,
  );
  if (!fase1SheetName) {
    throw new Error("La hoja de Google no tiene ninguna pestaña para la Primera Fase");
  }

  const [values1, values2] = await Promise.all([
    getSheetValues(SPREADSHEET_ID, fase1SheetName),
    fase2SheetName ? getSheetValues(SPREADSHEET_ID, fase2SheetName) : Promise.resolve([]),
  ]);

  if (values1.length < 1) {
    throw new Error(`La pestaña "${fase1SheetName}" está vacía`);
  }

  const headers1 = readHeaders(values1[0] ?? [], 1);
  const headers2 = values2.length > 0 ? readHeaders(values2[0] ?? [], 3) : [];

  type Fase1Row = { proveedor: string; statuses: { col: number; status: DocStatus }[] };
  const fase1Rows: Fase1Row[] = [];
  for (const row of values1.slice(1)) {
    if (!row || row.join("") === "") continue;
    const proveedor = String(row[0] ?? "").trim();
    if (!proveedor) continue;
    const statuses = headers1
      .map((h) => ({ col: h.col, status: parseStatus(row[h.col]) }))
      .filter((s): s is { col: number; status: DocStatus } => s.status !== null);
    fase1Rows.push({ proveedor, statuses });
  }

  type Fase2Row = {
    codigo: string;
    articulo: string;
    proveedor: string;
    statuses: { col: number; status: DocStatus }[];
  };
  const fase2Rows: Fase2Row[] = [];
  for (const row of values2.slice(1)) {
    if (!row || row.join("") === "") continue;
    const codigo = String(row[0] ?? "").trim();
    const articulo = String(row[1] ?? "").trim();
    if (!codigo && !articulo) continue;
    const proveedor = String(row[2] ?? "").trim() || "Sin proveedor asignado";
    const statuses = headers2
      .map((h) => ({ col: h.col, status: parseStatus(row[h.col]) }))
      .filter((s): s is { col: number; status: DocStatus } => s.status !== null);
    fase2Rows.push({ codigo, articulo, proveedor, statuses });
  }

  const allSupplierNames = new Set<string>([
    ...fase1Rows.map((r) => r.proveedor),
    ...fase2Rows.map((r) => r.proveedor),
  ]);

  // Dedupe Fase 2 products by (codigo, proveedor) — last row wins, matching
  // what a plain overwrite of the sheet would do.
  const productByKey = new Map<string, Fase2Row>();
  for (const row of fase2Rows) productByKey.set(`${row.codigo}||${row.proveedor}`, row);

  const resumen = await prisma.$transaction(
    async (tx) => {
      // Full replace: wipe the dimension + fact tables and rebuild from the
      // sheet. DocumentType rows are upserted (not wiped) so ids stay
      // stable across syncs.
      await tx.documentStatus.deleteMany({});
      await tx.product.deleteMany({});
      await tx.supplier.deleteMany({});

      const docTypes1 = new Map<string, string>();
      for (const [order, h] of headers1.entries()) {
        const dt = await tx.documentType.upsert({
          where: { phase_name: { phase: "FASE_1", name: h.name } },
          create: { phase: "FASE_1", name: h.name, order },
          update: { order },
        });
        docTypes1.set(h.name, dt.id);
      }
      const docTypes2 = new Map<string, string>();
      for (const [order, h] of headers2.entries()) {
        const dt = await tx.documentType.upsert({
          where: { phase_name: { phase: "FASE_2", name: h.name } },
          create: { phase: "FASE_2", name: h.name, order },
          update: { order },
        });
        docTypes2.set(h.name, dt.id);
      }

      if (allSupplierNames.size > 0) {
        await tx.supplier.createMany({
          data: [...allSupplierNames].map((name) => ({ name })),
        });
      }
      const suppliers = await tx.supplier.findMany({ select: { id: true, name: true } });
      const supplierIdByName = new Map(suppliers.map((s) => [s.name, s.id]));

      const docStatus1 = fase1Rows.flatMap((row) => {
        const supplierId = supplierIdByName.get(row.proveedor);
        if (!supplierId) return [];
        return row.statuses.map((s) => ({
          phase: "FASE_1" as const,
          documentTypeId: docTypes1.get(headers1.find((h) => h.col === s.col)!.name)!,
          supplierId,
          status: s.status,
        }));
      });
      if (docStatus1.length > 0) {
        await tx.documentStatus.createMany({ data: docStatus1 });
      }

      const productList = [...productByKey.values()];
      if (productList.length > 0) {
        await tx.product.createMany({
          data: productList.map((row) => ({
            code: row.codigo,
            name: row.articulo,
            supplierId: supplierIdByName.get(row.proveedor)!,
          })),
        });
      }
      const products = await tx.product.findMany({
        select: { id: true, code: true, supplierId: true },
      });
      const productIdByKey = new Map(
        products.map((p) => [`${p.code}||${p.supplierId}`, p.id]),
      );

      const docStatus2 = productList.flatMap((row) => {
        const supplierId = supplierIdByName.get(row.proveedor);
        const productId = supplierId
          ? productIdByKey.get(`${row.codigo}||${supplierId}`)
          : undefined;
        if (!productId) return [];
        return row.statuses.map((s) => ({
          phase: "FASE_2" as const,
          documentTypeId: docTypes2.get(headers2.find((h) => h.col === s.col)!.name)!,
          productId,
          status: s.status,
        }));
      });
      if (docStatus2.length > 0) {
        await tx.documentStatus.createMany({ data: docStatus2 });
      }

      await tx.proveedoresImport.upsert({
        where: { phase: "FASE_1" },
        create: { phase: "FASE_1", importedBy: profile.email },
        update: { importedAt: new Date(), importedBy: profile.email },
      });
      if (fase2SheetName) {
        await tx.proveedoresImport.upsert({
          where: { phase: "FASE_2" },
          create: { phase: "FASE_2", importedBy: profile.email },
          update: { importedAt: new Date(), importedBy: profile.email },
        });
      }

      return {
        fase1: { proveedores: new Set(fase1Rows.map((r) => r.proveedor)).size, documentos: docStatus1.length },
        fase2: {
          proveedores: new Set(productList.map((r) => r.proveedor)).size,
          articulos: productList.length,
          documentos: docStatus2.length,
        },
      };
    },
    // El full-replace (borrar + recrear todo) venía fallando: la hoja ya
    // creció lo suficiente (183 proveedores, Fase 2 por artículo) para que la
    // transacción tardara más de los 60s originales — Prisma la aborta con
    // "Transaction API error: expired transaction" y no queda nada
    // sincronizado. 5 minutos de margen sobre lo observado (~67s).
    { timeout: 300_000 },
  );

  // Next.js 16 requires a second "profile" argument here even though we're
  // not using the new Cache Components / cacheLife model — { expire: 0 }
  // just means "treat as expired now" for these unstable_cache entries.
  revalidateTag(FASE1_CACHE_TAG, { expire: 0 });
  revalidateTag(FASE2_CACHE_TAG, { expire: 0 });
  revalidatePath("/proveedores");
  revalidatePath("/proveedores/fase-1");

  return resumen;
}

// Fetched on demand when a provider's row is clicked — the summary tables
// intentionally don't preload every provider's full document list.
export async function fetchSupplierDocsFase1(supplierId: string) {
  await requireModuleView("proveedores");
  return getSupplierDocuments(supplierId);
}

export async function fetchSupplierProductsFase2(supplierId: string) {
  await requireModuleView("proveedores");
  return getSupplierProducts(supplierId);
}
