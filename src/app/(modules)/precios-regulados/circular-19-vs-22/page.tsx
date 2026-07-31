import { RefreshCw } from "lucide-react";
import { MODULES, MODULE_COLOR_CLASSES } from "@/lib/modules";
import { requireModuleView } from "@/lib/permissions";
import { parsePageParams, paginate } from "@/lib/pagination";
import { SubmitButton } from "@/components/submit-button";
import {
  getPreciosRegulados,
  applyReguladoCambioFilter,
  applyCambioFilter,
  computeKpis,
  computeCambioCounts,
  computeProveedoresPorSubio,
  NO_REGULADO_CAMBIO,
} from "@/lib/precios-regulados";
import { CAMBIO_LABELS, CAMBIO_COLORS, type CambioRegulacion } from "@/lib/precios-regulados-constants";
import { actualizarPreciosRegulados } from "../actions";
import { PreciosReguladosSubNav } from "../_components/sub-nav";
import { KpiCards } from "../_components/kpi-cards";
import { CambioDonut } from "../_components/cambio-donut";
import { RegulacionBarChart, type DrilldownBar } from "../_components/regulacion-bar-chart";
import { ReguladoFilterRow } from "../_components/regulado-filter-row";
import { ProveedoresPorSubioList } from "../_components/proveedores-por-subio-list";
import { CambioFilterRow } from "../_components/cambio-filter-row";
import { DetailTableCambio } from "../_components/detail-table-cambio";

// Pestaña "Circular 19 vs 22": AN (precio circular 19) vs BU (precio
// circular 22), con el resultado ya calculado en la hoja en la columna BW.
// La otra comparación (portafolio vs circular 22, columnas BS/BX) vive en
// /precios-regulados/portafolio-vs-circular — son dos análisis separados,
// cada uno con su propio filtro, gráfica y tabla. A pedido de Camila
// (2026-07-31), esta pestaña ya no es la principal de Astapor — esa es
// ahora /precios-regulados (Info General).
export default async function CircularDiecinueveVsVeintidosPage({
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

  const regulado = one("regulado");
  const cambio = one("cambio");

  const { rows: all, totalPortafolio } = await getPreciosRegulados();

  // Filtro de primer nivel (Todos/Regulados/No regulados) — a pedido de
  // Camila, ahora alimenta TODO lo demás de la página (KPIs, dona, chips
  // finos, desglose, ranking de proveedores, tabla), no solo la tabla.
  // Excepción: nivel0 de la gráfica en cascada sigue viniendo de `all` sin
  // filtrar, porque es el panorama fijo de referencia (Regulados vs No
  // regulados) desde el que se navega, no algo que deba autofiltrarse.
  const reguladoFiltered = applyReguladoCambioFilter(all, regulado);
  const filteredRows = applyCambioFilter(reguladoFiltered, cambio);

  const kpis = computeKpis(reguladoFiltered);
  const cambioCounts = computeCambioCounts(reguladoFiltered);
  // El ranking de proveedores sigue el filtro activo: sin filtro muestra
  // todo, con un filtro seleccionado muestra solo esa categoría (ej.
  // "Regulados" o "Bajó de regulación").
  const proveedoresPorSubio = computeProveedoresPorSubio(filteredRows);
  const cambioLabel = CAMBIO_LABELS[cambio as CambioRegulacion] ?? null;

  const reguladosCount = all.filter((r) => !NO_REGULADO_CAMBIO.includes(r.cambioRegulacion)).length;
  const nivel0: DrilldownBar[] = [
    { label: "Control directo", value: reguladosCount, fill: "#2563eb" },
    { label: "No control directo", value: totalPortafolio - reguladosCount, fill: "#94a3b8" },
  ];
  const nivel1: DrilldownBar[] = cambioCounts
    .filter((c) => !NO_REGULADO_CAMBIO.includes(c.cambio))
    .map((c) => ({ label: CAMBIO_LABELS[c.cambio], value: c.count, fill: CAMBIO_COLORS[c.cambio] }));

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
            <h1 className="font-heading text-2xl font-bold tracking-tight">Control Directo</h1>
            <p className="text-muted-foreground">
              Circular 19 vs. circular 22 — {all.length} productos de control directo de {totalPortafolio} en portafolio
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

      <PreciosReguladosSubNav />

      <KpiCards total={kpis.total} conteo={kpis.conteo} />

      <div className="min-w-0 rounded-xl border bg-card p-4 lg:w-1/2">
        <h3 className="mb-3 text-sm font-semibold">Todos los artículos vs. control directo</h3>
        <RegulacionBarChart nivel0={nivel0} nivel1={nivel1} />
      </div>

      <div className="grid min-w-0 items-start gap-4 lg:grid-cols-[1.3fr_1fr]">
        <div className="min-w-0 rounded-xl border bg-card p-4">
          <h3 className="text-sm font-semibold">
            Proveedores {cambioLabel ? `— ${cambioLabel}` : "(todos los de control directo)"}
          </h3>
          <p className="mb-2 text-xs text-muted-foreground">
            Clic en un proveedor para ver el detalle de sus productos.
          </p>
          <ProveedoresPorSubioList groups={proveedoresPorSubio} />
        </div>
        <div className="min-w-0 rounded-xl border bg-card p-4">
          <h3 className="mb-3 text-sm font-semibold">Circular 19 vs. circular 22</h3>
          <CambioDonut counts={cambioCounts} />
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-4 rounded-xl border bg-card p-4">
        <h3 className="text-sm font-semibold">Detalle de productos de control directo</h3>
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-muted-foreground">Regulación</p>
          <ReguladoFilterRow
            total={totalPortafolio}
            regulados={reguladosCount}
            noRegulados={totalPortafolio - reguladosCount}
            value={regulado}
          />
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-muted-foreground">Cambio de regulación</p>
          <CambioFilterRow counts={cambioCounts} cambio={cambio} />
        </div>
        <DetailTableCambio
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
