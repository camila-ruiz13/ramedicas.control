"use server";

import ExcelJS from "exceljs";
import { revalidatePath, revalidateTag } from "next/cache";
import { requireModuleInteract, requireModuleView } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import {
  getSupplierDocuments,
  getSupplierProducts,
  FASE1_CACHE_TAG,
  FASE2_CACHE_TAG,
} from "@/lib/proveedores";
import type { DocStatus } from "@/generated/prisma/client";

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

function cellText(row: ExcelJS.Row, col: number): string {
  const value = row.getCell(col).value;
  if (value === null || value === undefined) return "";
  if (typeof value === "object" && "text" in value) return String(value.text ?? "");
  return String(value).trim();
}

function findSheet(workbook: ExcelJS.Workbook, name: string) {
  return workbook.worksheets.find(
    (ws) => ws.name.trim().toLowerCase() === name.toLowerCase(),
  );
}

function readHeaders(sheet: ExcelJS.Worksheet, firstCol: number) {
  const headerRow = sheet.getRow(1);
  const headers: { col: number; name: string }[] = [];
  for (let c = firstCol; c <= sheet.columnCount; c++) {
    const name = cellText(headerRow, c);
    if (name) headers.push({ col: c, name });
  }
  return headers;
}

export async function importarProveedores(formData: FormData) {
  const profile = await requireModuleInteract("proveedores");

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Seleccioná un archivo Excel (.xlsx)");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const workbook = new ExcelJS.Workbook();
  // exceljs's bundled types reference a different (older) @types/node Buffer
  // shape than this project's — the runtime value is a plain Buffer either way.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await workbook.xlsx.load(buffer as any);

  const fase1Sheet = workbook.worksheets[0];
  const fase2Sheet = findSheet(workbook, "segunda fase");
  if (!fase1Sheet) {
    throw new Error("El archivo no tiene ninguna hoja para la Primera Fase");
  }

  const headers1 = readHeaders(fase1Sheet, 2);
  const headers2 = fase2Sheet ? readHeaders(fase2Sheet, 4) : [];

  type Fase1Row = { proveedor: string; statuses: { col: number; status: DocStatus }[] };
  const fase1Rows: Fase1Row[] = [];
  fase1Sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const proveedor = cellText(row, 1);
    if (!proveedor) return;
    const statuses = headers1
      .map((h) => ({ col: h.col, status: parseStatus(row.getCell(h.col).value) }))
      .filter((s): s is { col: number; status: DocStatus } => s.status !== null);
    fase1Rows.push({ proveedor, statuses });
  });

  type Fase2Row = {
    codigo: string;
    articulo: string;
    proveedor: string;
    statuses: { col: number; status: DocStatus }[];
  };
  const fase2Rows: Fase2Row[] = [];
  if (fase2Sheet) {
    fase2Sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const codigo = cellText(row, 1);
      const articulo = cellText(row, 2);
      if (!codigo && !articulo) return;
      const proveedor = cellText(row, 3) || "Sin proveedor asignado";
      const statuses = headers2
        .map((h) => ({ col: h.col, status: parseStatus(row.getCell(h.col).value) }))
        .filter((s): s is { col: number; status: DocStatus } => s.status !== null);
      fase2Rows.push({ codigo, articulo, proveedor, statuses });
    });
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
      // uploaded file. DocumentType rows are upserted (not wiped) so ids stay
      // stable across imports.
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
      if (fase2Sheet) {
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
    { timeout: 60_000 },
  );

  // Next.js 16 requires a second "profile" argument here even though we're
  // not using the new Cache Components / cacheLife model — { expire: 0 }
  // just means "treat as expired now" for these unstable_cache entries.
  revalidateTag(FASE1_CACHE_TAG, { expire: 0 });
  revalidateTag(FASE2_CACHE_TAG, { expire: 0 });
  revalidatePath("/proveedores");
  revalidatePath("/proveedores/fase-2");

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
