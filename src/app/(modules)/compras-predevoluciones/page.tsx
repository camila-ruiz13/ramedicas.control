import { MODULES, MODULE_COLOR_CLASSES } from "@/lib/modules";
import { requireModuleView } from "@/lib/permissions";
import { parsePageParams, paginate } from "@/lib/pagination";
import {
  getAniosDisponibles,
  getTodosLosProveedores,
  getComprasDashboard,
} from "@/lib/compras-predevoluciones";
import { ComprasSubNav } from "./_components/sub-nav";
import { FiltrosBar } from "./_components/filtros-bar";
import { KpiCardsCompras } from "./_components/kpi-cards-compras";
import { EvolucionChart } from "./_components/evolucion-chart";
import { DetailTableCompras } from "./_components/detail-table-compras";

export default async function ComprasPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireModuleView("compras-predevoluciones");
  const sp = await searchParams;
  const one = (key: string) => (Array.isArray(sp[key]) ? sp[key]![0] : sp[key]) ?? "";

  const moduleDef = MODULES.find((m) => m.slug === "compras-predevoluciones")!;
  const colors = MODULE_COLOR_CLASSES[moduleDef.color];
  const Icon = moduleDef.icon;

  const anio = one("anio");
  const mes = one("mes");
  const nit = one("nit");

  const [anios, proveedores, dashboard] = await Promise.all([
    getAniosDisponibles(),
    getTodosLosProveedores(),
    getComprasDashboard({ anio: anio || undefined, mes: mes || undefined, nit: nit || undefined }),
  ]);

  const params = parsePageParams(sp, { defaultSort: "fechaFactura", defaultDir: "desc", pageSize: 25 });
  const { rows, page, totalCount, totalPages } = paginate(dashboard.detalle, params, [
    "numero",
    "nroFactura",
    "codigo",
    "articulo",
  ]);

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className={`flex size-10 items-center justify-center rounded-xl ${colors.badge}`}>
          <Icon className={`size-5 ${colors.icon}`} />
        </div>
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">Compras y Predevoluciones</h1>
          <p className="text-muted-foreground">Panorama consolidado de compras</p>
        </div>
      </div>

      <ComprasSubNav />

      <FiltrosBar anios={anios} anio={anio} mes={mes} proveedores={proveedores} nit={nit} />

      <KpiCardsCompras {...dashboard.kpis} />

      <div className="rounded-xl border bg-card p-4">
        <h3 className="mb-3 text-sm font-semibold">Evolución mensual de compras</h3>
        <EvolucionChart anios={dashboard.evolucion.anios} puntos={dashboard.evolucion.puntos} unidad="money" />
      </div>

      {nit ? (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold">Desglose de compras — {proveedores.find((p) => p.nit === nit)?.nombre ?? nit}</h3>
          <DetailTableCompras
            rows={rows}
            page={page}
            totalPages={totalPages}
            totalCount={totalCount}
            search={params.search}
            sortField={params.sortField}
            sortDir={params.sortDir}
          />
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Selecciona un proveedor en los filtros para ver el desglose de sus compras línea por línea.
        </p>
      )}
    </div>
  );
}
