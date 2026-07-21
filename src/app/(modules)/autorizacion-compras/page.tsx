import { RefreshCw } from "lucide-react";
import { MODULES, MODULE_COLOR_CLASSES } from "@/lib/modules";
import { requireModuleView } from "@/lib/permissions";
import { parsePageParams, paginate } from "@/lib/pagination";
import {
  getAutorizaciones,
  computeKpis,
  computeTrend,
  computeProviderRanking,
  computePriorityList,
} from "@/lib/autorizacion-compras";
import { NONE_SENTINEL, type AutorizacionRow } from "@/lib/autorizacion-compras-constants";
import { SubmitButton } from "@/components/submit-button";
import { actualizarAutorizaciones } from "./actions";
import { AutorizacionKpiCards } from "./_components/kpi-cards";
import { TrendChart } from "./_components/trend-chart";
import { ProviderRankingList } from "./_components/provider-ranking";
import { PriorityList } from "./_components/priority-list";
import { DetailTable } from "./_components/detail-table";
import { ProviderMultiselect } from "./_components/provider-multiselect";
import { VariacionToggle } from "./_components/variacion-toggle";

export default async function AutorizacionComprasPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireModuleView("autorizacion-compras");
  const sp = await searchParams;
  const one = (key: string) => (Array.isArray(sp[key]) ? sp[key]![0] : sp[key]) ?? "";

  const moduleDef = MODULES.find((m) => m.slug === "autorizacion-compras")!;
  const colors = MODULE_COLOR_CLASSES[moduleDef.color];
  const Icon = moduleDef.icon;

  const all = await getAutorizaciones();
  const allProviders = [...new Set(all.map((d) => d.proveedor))].sort();

  const provParam = one("prov");
  const selectedProv =
    provParam === NONE_SENTINEL ? new Set<string>() : provParam ? new Set(provParam.split(",")) : null;
  const variacion = one("variacion");

  const filtered = all.filter((d: AutorizacionRow) => {
    if (selectedProv && !selectedProv.has(d.proveedor)) return false;
    if (variacion && d.variacion !== variacion) return false;
    return true;
  });

  const kpis = computeKpis(filtered);
  const trend = computeTrend(filtered);
  const providerRanking = computeProviderRanking(filtered);
  const priorityList = computePriorityList(filtered);

  const params = parsePageParams(sp, { defaultSort: "fechaFactura", defaultDir: "desc", pageSize: 20 });
  const { rows, page, totalCount, totalPages } = paginate(filtered, params, [
    "nombreArticulo",
    "codArticulo",
    "nroFactura",
    "proveedor",
  ]);

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`flex size-10 items-center justify-center rounded-xl ${colors.badge}`}>
            <Icon className={`size-5 ${colors.icon}`} />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight">Autorización de Compras</h1>
            <p className="text-muted-foreground">
              Costo autorizado vs. costo lista del portafolio — {all.length} autorizaciones cargadas
            </p>
          </div>
        </div>
        <form action={actualizarAutorizaciones}>
          <SubmitButton variant="outline" size="sm" pendingText="Actualizando...">
            <RefreshCw className="size-4" />
            Actualizar
          </SubmitButton>
        </form>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <ProviderMultiselect allProviders={allProviders} selected={selectedProv} />
        <VariacionToggle value={variacion} />
        <span className="font-mono text-xs text-muted-foreground sm:ml-auto">
          {filtered.length} de {all.length}
        </span>
      </div>

      <AutorizacionKpiCards
        count={kpis.count}
        totalCosto={kpis.totalCosto}
        totalLista={kpis.totalLista}
        totalDif={kpis.totalDif}
        porEncima={kpis.porEncima}
        porDebajo={kpis.porDebajo}
        avgPct={kpis.avgPct}
        proveedoresActivos={kpis.proveedoresActivos}
      />

      <div className="grid min-w-0 items-start gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div className="min-w-0 rounded-xl border bg-card p-4">
          <h3 className="mb-1 text-sm font-semibold">Tendencia diaria de autorizaciones</h3>
          <p className="mb-2 text-xs text-muted-foreground">
            Cantidad de autorizaciones por fecha de factura
          </p>
          <TrendChart points={trend} />
        </div>
        <div className="min-w-0 rounded-xl border bg-card p-4">
          <h3 className="mb-1 text-sm font-semibold">Por proveedor</h3>
          <p className="mb-2 text-xs text-muted-foreground">Ahorro vs. sobrecosto acumulado</p>
          <ProviderRankingList rows={providerRanking} />
        </div>
      </div>

      <div className="min-w-0 rounded-xl border bg-card p-4">
        <h3 className="mb-1 text-sm font-semibold">Top 10 — prioridad de revisión</h3>
        <p className="mb-2 text-xs text-muted-foreground">
          Ordenado por mayor diferencia en pesos entre autorizado y portafolio
        </p>
        <PriorityList groups={priorityList} />
      </div>

      <div className="flex min-w-0 flex-col gap-2">
        <h3 className="text-sm font-semibold">Detalle por línea</h3>
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
