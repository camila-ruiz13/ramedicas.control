import "server-only";
import { prisma } from "./prisma";

// Este módulo NO sincroniza nada por su cuenta — lee las mismas tablas
// CompraLinea/PredevolucionLinea que ya llena el "Actualizar desde Drive"
// del módulo Descuentos y Rebates (misma fuente, misma sincronización).

const NOMBRES_MES = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
] as const;

export function anioDeMes(mes: string): string {
  return mes.slice(0, 4);
}
export function mesIndiceDeMes(mes: string): number {
  return Number(mes.slice(5, 7)) - 1;
}
export function nombreMes(mes: string): string {
  return NOMBRES_MES[mesIndiceDeMes(mes)] ?? mes;
}

export type Filtro = { anio?: string; mes?: string; nit?: string };

// "YYYY-MM" completo si hay año+mes, prefijo "YYYY-" si solo hay año, o
// "-MM" al final (cualquier año, ej. comparar julio de todos los años) si
// solo hay mes.
function whereMes(filtro: Filtro): { mes?: string | { startsWith: string } | { endsWith: string } } {
  if (filtro.anio && filtro.mes) return { mes: `${filtro.anio}-${filtro.mes}` };
  if (filtro.anio) return { mes: { startsWith: `${filtro.anio}-` } };
  if (filtro.mes) return { mes: { endsWith: `-${filtro.mes}` } };
  return {};
}

export async function getAniosDisponibles(): Promise<string[]> {
  const rows = await prisma.compraLinea.findMany({ distinct: ["mes"], select: { mes: true } });
  return [...new Set(rows.map((r) => anioDeMes(r.mes)))].sort().reverse();
}

export async function getTodosLosProveedores(): Promise<{ nit: string; nombre: string }[]> {
  const rows = await prisma.compraLinea.findMany({
    distinct: ["nitProveedor"],
    select: { nitProveedor: true, nombreProveedor: true },
    orderBy: { nombreProveedor: "asc" },
  });
  return rows.map((r) => ({ nit: r.nitProveedor, nombre: r.nombreProveedor }));
}

export type EvolucionPunto = { mesIndex: number; mesLabel: string; porAnio: Record<string, number> };

function armarEvolucion(filas: { mes: string; valor: number }[]): { anios: string[]; puntos: EvolucionPunto[] } {
  const anios = [...new Set(filas.map((f) => anioDeMes(f.mes)))].sort();
  const puntos: EvolucionPunto[] = Array.from({ length: 12 }, (_, i) => ({
    mesIndex: i,
    mesLabel: NOMBRES_MES[i],
    porAnio: Object.fromEntries(anios.map((a) => [a, 0])),
  }));
  for (const f of filas) {
    puntos[mesIndiceDeMes(f.mes)].porAnio[anioDeMes(f.mes)] += f.valor;
  }
  return { anios, puntos };
}

// ---------- Compras ----------

export type CompraDetalleRow = {
  id: string;
  mes: string;
  numero: string;
  fechaFactura: Date;
  nroFactura: string;
  codigo: string;
  articulo: string;
  unidades: number;
  subtotal: number;
};

export async function getComprasDashboard(filtro: Filtro) {
  const where = { ...whereMes(filtro), ...(filtro.nit ? { nitProveedor: filtro.nit } : {}) };

  const [agg, facturas, proveedores, porMes] = await Promise.all([
    prisma.compraLinea.aggregate({ where, _sum: { subtotal: true, unidades: true }, _count: { _all: true } }),
    prisma.compraLinea.findMany({ where, distinct: ["nroFactura"], select: { nroFactura: true } }),
    prisma.compraLinea.findMany({ where, distinct: ["nitProveedor"], select: { nitProveedor: true } }),
    prisma.compraLinea.groupBy({ by: ["mes"], where, _sum: { subtotal: true } }),
  ]);

  const { anios, puntos } = armarEvolucion(porMes.map((p) => ({ mes: p.mes, valor: Number(p._sum.subtotal ?? 0) })));

  let detalle: CompraDetalleRow[] = [];
  if (filtro.nit) {
    const rows = await prisma.compraLinea.findMany({ where, orderBy: { fechaFactura: "desc" } });
    detalle = rows.map((r) => ({ ...r, subtotal: Number(r.subtotal) }));
  }

  return {
    kpis: {
      compraTotal: Number(agg._sum.subtotal ?? 0),
      unidades: agg._sum.unidades ?? 0,
      facturas: facturas.length,
      proveedoresActivos: proveedores.length,
      registros: agg._count._all,
    },
    evolucion: { anios, puntos },
    detalle,
  };
}

// ---------- Predevoluciones ----------

export type PredevolucionDetalleRow = {
  id: string;
  mes: string;
  numero: string;
  fecha: Date;
  codigo: string;
  unidades: number;
  docCruce: string;
};

export async function getPredevolucionesDashboard(filtro: Filtro) {
  const where = { ...whereMes(filtro), ...(filtro.nit ? { nit: filtro.nit } : {}) };

  const [agg, codigos, proveedores, porMes] = await Promise.all([
    prisma.predevolucionLinea.aggregate({ where, _sum: { unidades: true }, _count: { _all: true } }),
    prisma.predevolucionLinea.findMany({ where, distinct: ["codigo"], select: { codigo: true } }),
    prisma.predevolucionLinea.findMany({ where, distinct: ["nit"], select: { nit: true } }),
    prisma.predevolucionLinea.groupBy({ by: ["mes"], where, _sum: { unidades: true } }),
  ]);

  const { anios, puntos } = armarEvolucion(porMes.map((p) => ({ mes: p.mes, valor: p._sum.unidades ?? 0 })));

  let detalle: PredevolucionDetalleRow[] = [];
  if (filtro.nit) {
    detalle = await prisma.predevolucionLinea.findMany({ where, orderBy: { fecha: "desc" } });
  }

  return {
    kpis: {
      unidadesDevueltas: agg._sum.unidades ?? 0,
      registros: agg._count._all,
      codigosDistintos: codigos.length,
      proveedoresActivos: proveedores.length,
    },
    evolucion: { anios, puntos },
    detalle,
  };
}
