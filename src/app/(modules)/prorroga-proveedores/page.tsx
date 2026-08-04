import { RefreshCw } from "lucide-react";
import { MODULES, MODULE_COLOR_CLASSES } from "@/lib/modules";
import { requireModuleView } from "@/lib/permissions";
import { parsePageParams, paginate } from "@/lib/pagination";
import { SubmitButton } from "@/components/submit-button";
import {
  getProrrogaProveedores,
  applyVistaFilter,
  applyEstadoFilter,
  computeKpis,
  computeEstadoCounts,
  computeControlDirectoEnviadoCounts,
  computeSistemaCounts,
  computeControlDirectoKpis,
  type Vista,
} from "@/lib/prorroga-proveedores";
import { ESTADO_LABELS, ESTADO_COLORS, SI_NO_PENDIENTE_LABELS, SI_NO_PENDIENTE_COLORS } from "@/lib/prorroga-proveedores-constants";
import { actualizarProrroga } from "./actions";
import { KpiCards } from "./_components/kpi-cards";
import { EstadoDonut } from "./_components/estado-donut";
import { EstadoBarChart } from "./_components/estado-bar-chart";
import { ControlDirectoKpiCards } from "./_components/control-directo-kpi-cards";
import { VistaTabs } from "./_components/vista-tabs";
import { EstadoFilterRow } from "./_components/estado-filter-row";
import { DetailTable } from "./_components/detail-table";

const VISTAS: Vista[] = ["todos", "excepcion", "observacion", "pendientes"];

export default async function ProrrogaProveedoresPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireModuleView("prorroga-proveedores");
  const sp = await searchParams;
  const one = (key: string) => (Array.isArray(sp[key]) ? sp[key]![0] : sp[key]) ?? "";

  const moduleDef = MODULES.find((m) => m.slug === "prorroga-proveedores")!;
  const colors = MODULE_COLOR_CLASSES[moduleDef.color];
  const Icon = moduleDef.icon;

  const vistaRaw = one("vista");
  const vista: Vista = VISTAS.includes(vistaRaw as Vista) ? (vistaRaw as Vista) : "todos";
  const estado = one("estado");

  const all = await getProrrogaProveedores();
  const kpis = computeKpis(all);
  const estadoCounts = computeEstadoCounts(all);
  const controlDirectoEnviadoCounts = computeControlDirectoEnviadoCounts(all);
  const sistemaCounts = computeSistemaCounts(all);
  const controlDirectoKpis = computeControlDirectoKpis(all);

  const vistaRows = applyVistaFilter(all, vista);
  const filteredRows = applyEstadoFilter(vistaRows, estado);

  const params = parsePageParams(sp, { defaultSort: "proveedor", defaultDir: "asc", pageSize: 25 });
  const { rows, page, totalCount, totalPages } = paginate(filteredRows, params, ["proveedor", "nit"]);

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`flex size-10 items-center justify-center rounded-xl ${colors.badge}`}>
            <Icon className={`size-5 ${colors.icon}`} />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight">Prórroga Proveedores</h1>
            <p className="text-muted-foreground">
              Negociación de prórrogas 2025-2026 — {all.length} proveedores
            </p>
          </div>
        </div>
        <form action={actualizarProrroga}>
          <SubmitButton variant="outline" size="sm" pendingText="Actualizando...">
            <RefreshCw className="size-4" />
            Actualizar
          </SubmitButton>
        </form>
      </div>

      <KpiCards total={kpis.total} conteo={kpis.conteo} />

      <div className="grid min-w-0 items-start gap-4 lg:grid-cols-2">
        <div className="min-w-0 rounded-xl border bg-card p-4">
          <h3 className="mb-3 text-sm font-semibold">Por categoría</h3>
          <EstadoDonut counts={estadoCounts} labels={ESTADO_LABELS} colors={ESTADO_COLORS} />
        </div>
        <div className="min-w-0 rounded-xl border bg-card p-4">
          <h3 className="mb-3 text-sm font-semibold">Cantidad por respuesta</h3>
          <EstadoBarChart counts={estadoCounts} labels={ESTADO_LABELS} colors={ESTADO_COLORS} />
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-4">
        <div>
          <h2 className="font-heading text-lg font-bold tracking-tight">Control Directo</h2>
          <p className="text-sm text-muted-foreground">
            Trazabilidad del documento de Control Directo por proveedor: envío, códigos y registro en el sistema.
          </p>
        </div>

        <ControlDirectoKpiCards
          enviado={controlDirectoKpis.enviado}
          sistema={controlDirectoKpis.sistema}
          totalArticulos={controlDirectoKpis.totalArticulos}
        />

        <div className="grid min-w-0 items-start gap-4 lg:grid-cols-2">
          <div className="min-w-0 rounded-xl border bg-card p-4">
            <h3 className="mb-3 text-sm font-semibold">¿Ya enviaron documento de Control Directo?</h3>
            <EstadoDonut counts={controlDirectoEnviadoCounts} labels={SI_NO_PENDIENTE_LABELS} colors={SI_NO_PENDIENTE_COLORS} />
          </div>
          <div className="min-w-0 rounded-xl border bg-card p-4">
            <h3 className="mb-3 text-sm font-semibold">¿Ya se realizó en el sistema?</h3>
            <EstadoBarChart counts={sistemaCounts} labels={SI_NO_PENDIENTE_LABELS} colors={SI_NO_PENDIENTE_COLORS} />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <VistaTabs vista={vista} />
        {vista === "todos" && <EstadoFilterRow counts={estadoCounts} estado={estado} />}
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
