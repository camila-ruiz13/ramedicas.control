import { RefreshCw } from "lucide-react";
import { MODULES, MODULE_COLOR_CLASSES } from "@/lib/modules";
import { requireModuleView } from "@/lib/permissions";
import { parsePageParams, paginate } from "@/lib/pagination";
import {
  getCambiosPrecios,
  applyBaseFilters,
  applyCondicionFilter,
  computeKpisGlobales,
  computeProgreso,
  computeCondicionCounts,
  computeProviderCounts,
  type CambiosPreciosFilters,
} from "@/lib/cambios-precios";
import { SubmitButton } from "@/components/submit-button";
import { actualizarCambiosPrecios } from "./actions";
import { CambiosPreciosKpiCards } from "./_components/kpi-cards";
import { ProgresoBar } from "./_components/progreso-bar";
import { FiltrosBar } from "./_components/filtros-bar";
import { CondicionCards } from "./_components/condicion-cards";
import { MiniKpis } from "./_components/mini-kpis";
import { ProveedoresWidget } from "./_components/proveedores-widget";
import { CondicionWidget } from "./_components/condicion-widget";
import { DetailTable } from "./_components/detail-table";

export default async function CambiosPreciosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireModuleView("cambios-precios");
  const sp = await searchParams;
  const one = (key: string) => (Array.isArray(sp[key]) ? sp[key]![0] : sp[key]) ?? "";

  const moduleDef = MODULES.find((m) => m.slug === "cambios-precios")!;
  const colors = MODULE_COLOR_CLASSES[moduleDef.color];
  const Icon = moduleDef.icon;

  const all = await getCambiosPrecios();
  const allProveedores = [...new Set(all.map((r) => r.proveedor).filter(Boolean))].sort();

  const filters: CambiosPreciosFilters = {
    condicion: one("condicion"),
    proveedor: one("proveedor"),
    lista: (one("lista") as CambiosPreciosFilters["lista"]) || "",
    desde: one("desde"),
    hasta: one("hasta"),
  };
  const hayFiltro = Boolean(
    filters.condicion || filters.proveedor || filters.lista || filters.desde || filters.hasta,
  );

  const baseRows = applyBaseFilters(all, filters);
  const filteredRows = applyCondicionFilter(baseRows, filters.condicion);

  const kpisGlobales = computeKpisGlobales(all);
  const progreso = computeProgreso(filteredRows);
  const condicionCounts = computeCondicionCounts(baseRows);
  const providerCounts = computeProviderCounts(filteredRows);

  const miniProveedores = new Set(filteredRows.map((r) => r.proveedor).filter(Boolean)).size;
  let sumaVar = 0;
  let cuentaVar = 0;
  for (const r of filteredRows) {
    const aum = r.condicion.toLowerCase().includes("aumento");
    const dis = /disminu|baja|reduc/.test(r.condicion.toLowerCase());
    if ((aum || dis) && r.variacionPct !== null) {
      sumaVar += r.variacionPct;
      cuentaVar++;
    }
  }
  const miniVariacion = cuentaVar ? sumaVar / cuentaVar : null;

  const params = parsePageParams(sp, { defaultSort: "fecha", defaultDir: "desc", pageSize: 25 });
  const { rows, page, totalCount, totalPages } = paginate(filteredRows, params, [
    "codigo",
    "nombre",
    "observacion",
    "cur",
  ]);

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`flex size-10 items-center justify-center rounded-xl ${colors.badge}`}>
            <Icon className={`size-5 ${colors.icon}`} />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight">Cambios de Precios</h1>
            <p className="text-muted-foreground">
              Análisis de cambios de precios por proveedor — {all.length} registros cargados
            </p>
          </div>
        </div>
        <form action={actualizarCambiosPrecios}>
          <SubmitButton variant="outline" size="sm" pendingText="Actualizando...">
            <RefreshCw className="size-4" />
            Actualizar
          </SubmitButton>
        </form>
      </div>

      <CambiosPreciosKpiCards
        total={kpisGlobales.total}
        proveedores={kpisGlobales.proveedores}
        aumentos={kpisGlobales.aumentos}
        disminuciones={kpisGlobales.disminuciones}
        variacionPromedio={kpisGlobales.variacionPromedio}
      />

      <ProgresoBar
        realizado={progreso.realizado}
        pendiente={progreso.pendiente}
        pct={progreso.pct}
        filtrado={hayFiltro}
      />

      <FiltrosBar
        allProveedores={allProveedores}
        proveedor={filters.proveedor ?? ""}
        lista={filters.lista ?? ""}
        desde={filters.desde ?? ""}
        hasta={filters.hasta ?? ""}
        condicion={filters.condicion ?? ""}
      />

      <div className="min-w-0 rounded-xl border bg-card p-4">
        <h3 className="mb-3 text-sm font-semibold">
          Haz clic en una condición para ver su desglose completo
        </h3>
        <CondicionCards counts={condicionCounts} total={baseRows.length} selected={filters.condicion ?? ""} />
      </div>

      <MiniKpis
        total={filteredRows.length}
        pctDelTotal={all.length ? Math.round((filteredRows.length / all.length) * 100) : 0}
        proveedores={miniProveedores}
        variacionPromedio={miniVariacion}
      />

      <div className="grid min-w-0 items-start gap-4 lg:grid-cols-2">
        <div className="min-w-0 rounded-xl border bg-card p-4">
          <h3 className="mb-3 text-sm font-semibold">Proveedores en este desglose</h3>
          <ProveedoresWidget rows={providerCounts} />
        </div>
        <div className="min-w-0 rounded-xl border bg-card p-4">
          <h3 className="mb-3 text-sm font-semibold">Por condición</h3>
          <CondicionWidget rows={computeCondicionCounts(filteredRows)} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold">Registros del desglose</h3>
        <DetailTable
          rows={rows}
          page={page}
          totalPages={totalPages}
          totalCount={totalCount}
          search={params.search}
          sortField={params.sortField}
          sortDir={params.sortDir}
        />
      </div>
    </div>
  );
}
