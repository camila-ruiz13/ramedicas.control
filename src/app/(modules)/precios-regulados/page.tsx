import { RefreshCw } from "lucide-react";
import { MODULES, MODULE_COLOR_CLASSES } from "@/lib/modules";
import { requireModuleView } from "@/lib/permissions";
import { parsePageParams, paginate } from "@/lib/pagination";
import { SubmitButton } from "@/components/submit-button";
import {
  getPreciosRegulados,
  applyCambioFilter,
  applyPortafolioFilter,
  computeKpis,
  computeCambioCounts,
  computePortafolioCounts,
  computeProveedoresPorEncima,
} from "@/lib/precios-regulados";
import { actualizarPreciosRegulados } from "./actions";
import { KpiCards } from "./_components/kpi-cards";
import { PortafolioDonut } from "./_components/portafolio-donut";
import { ProveedoresPorEncimaList } from "./_components/proveedores-por-encima-list";
import { PortafolioFilterRow } from "./_components/portafolio-filter-row";
import { CambioFilterRow } from "./_components/cambio-filter-row";
import { DetailTable } from "./_components/detail-table";

export default async function PreciosReguladosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireModuleView("precios-regulados");
  const sp = await searchParams;
  const one = (key: string) => (Array.isArray(sp[key]) ? sp[key]![0] : sp[key]) ?? "";

  const moduleDef = MODULES.find((m) => m.slug === "precios-regulados")!;
  const colors = MODULE_COLOR_CLASSES[moduleDef.color];
  const Icon = moduleDef.icon;

  const portafolio = one("portafolio");
  const cambio = one("cambio");

  const { rows: all, totalPortafolio } = await getPreciosRegulados();
  const kpis = computeKpis(all);
  const cambioCounts = computeCambioCounts(all);
  const portafolioCounts = computePortafolioCounts(all);
  const proveedoresPorEncima = computeProveedoresPorEncima(all);

  const cambioFiltered = applyCambioFilter(all, cambio);
  const filteredRows = applyPortafolioFilter(cambioFiltered, portafolio);

  const params = parsePageParams(sp, { defaultSort: "codigo", defaultDir: "asc", pageSize: 25 });
  const { rows, page, totalCount, totalPages } = paginate(filteredRows, params, ["codigo", "proveedor", "nombreComercial", "principioActivo"]);

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`flex size-10 items-center justify-center rounded-xl ${colors.badge}`}>
            <Icon className={`size-5 ${colors.icon}`} />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight">Precios Regulados</h1>
            <p className="text-muted-foreground">
              Portafolio de proveedores vs. circular de regulación — {all.length} productos regulados de {totalPortafolio} en portafolio
            </p>
          </div>
        </div>
        <form action={actualizarPreciosRegulados}>
          <SubmitButton variant="outline" size="sm" pendingText="Actualizando...">
            <RefreshCw className="size-4" />
            Actualizar
          </SubmitButton>
        </form>
      </div>

      <KpiCards total={kpis.total} conteo={kpis.conteo} />

      <div className="grid min-w-0 items-start gap-4 lg:grid-cols-[1.3fr_1fr]">
        <div className="min-w-0 rounded-xl border bg-card p-4">
          <h3 className="text-sm font-semibold">Proveedores por encima del precio regulado</h3>
          <p className="mb-2 text-xs text-muted-foreground">
            Clic en un proveedor para ver el detalle de sus productos.
          </p>
          <ProveedoresPorEncimaList groups={proveedoresPorEncima} />
        </div>
        <div className="min-w-0 rounded-xl border bg-card p-4">
          <h3 className="mb-3 text-sm font-semibold">Portafolio vs. circular 22</h3>
          <PortafolioDonut counts={portafolioCounts} />
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-4 rounded-xl border bg-card p-4">
        <h3 className="text-sm font-semibold">Detalle de productos regulados</h3>
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-muted-foreground">Comparación vs. circular</p>
          <PortafolioFilterRow counts={portafolioCounts} portafolio={portafolio} />
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-muted-foreground">Cambio de regulación</p>
          <CambioFilterRow counts={cambioCounts} cambio={cambio} />
        </div>
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
