import { RefreshCw } from "lucide-react";
import { MODULES, MODULE_COLOR_CLASSES } from "@/lib/modules";
import { requireModuleView } from "@/lib/permissions";
import { parsePageParams, paginate } from "@/lib/pagination";
import { SubmitButton } from "@/components/submit-button";
import {
  getPreciosRegulados,
  getProveedoresEnvio,
  getNitPorCodigo,
  buildCodigoEnvioInfo,
  applyReguladoPortafolioFilter,
  applyPortafolioFilter,
  computePortafolioCounts,
  computeProveedoresPorEncima,
  NO_REGULADO_PORTAFOLIO,
} from "@/lib/precios-regulados";
import {
  PORTAFOLIO_LABELS,
  PORTAFOLIO_COLORS,
  computeEnvioEstadoProveedor,
  type PortafolioVsCircular,
} from "@/lib/precios-regulados-constants";
import { actualizarPreciosRegulados } from "../actions";
import { PreciosReguladosSubNav } from "../_components/sub-nav";
import { PortafolioDonut } from "../_components/portafolio-donut";
import { RegulacionBarChart, type DrilldownBar } from "../_components/regulacion-bar-chart";
import { ReguladoFilterRow } from "../_components/regulado-filter-row";
import { ProveedoresPorEncimaList } from "../_components/proveedores-por-encima-list";
import { PortafolioFilterRow } from "../_components/portafolio-filter-row";
import { DetailTablePortafolio } from "../_components/detail-table-portafolio";
import { EnvioDonut, type EnvioDonutSlice, type ProveedorEnvioResumen } from "../_components/envio-donut";

// Pestaña "Portafolio vs Circular 22": BS (precio portafolio) vs BU (precio
// circular 22), con el resultado ya calculado en la hoja en la columna BX.
// La otra comparación (circular 19 vs 22, columnas AN/BW) vive en
// /precios-regulados/circular-19-vs-22 — son dos análisis separados.
export default async function PortafolioVsCircularPage({
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
  const portafolio = one("portafolio");

  const { rows: all, totalPortafolio } = await getPreciosRegulados();
  // Si falla la lectura de "proveedores" o de "PORTAFOLIO ..." (ej. la
  // pestaña no existe todavía, o Camila la está resubiendo en ese momento),
  // que degrade a "sin dato de envío" en vez de tumbar toda la página — lo
  // demás (todo lo que ya funcionaba antes de esta función) no depende de
  // estas dos hojas.
  const [envioRows, nitPorCodigo] = await Promise.all([
    getProveedoresEnvio().catch((err) => {
      console.error("No se pudo leer la hoja 'proveedores':", err);
      return [];
    }),
    getNitPorCodigo().catch((err) => {
      console.error("No se pudo leer la pestaña 'PORTAFOLIO ...':", err);
      return new Map<string, string>();
    }),
  ]);
  const codigoEnvioInfo = buildCodigoEnvioInfo(all.map((r) => r.codigo), nitPorCodigo, envioRows);

  // Filtro de primer nivel (Todos/Regulados/No regulados) — a pedido de
  // Camila, ahora alimenta TODO lo demás de la página (dona, chips finos,
  // desglose, ranking de proveedores, tabla), no solo la tabla. Excepción:
  // nivel0 de la gráfica en cascada sigue viniendo de `all` sin filtrar,
  // porque es el panorama fijo de referencia desde el que se navega.
  const reguladoFiltered = applyReguladoPortafolioFilter(all, regulado);
  const filteredRows = applyPortafolioFilter(reguladoFiltered, portafolio);

  const portafolioCounts = computePortafolioCounts(reguladoFiltered);

  // El ranking de proveedores sigue el filtro activo: sin filtro muestra
  // todo, con un filtro seleccionado muestra solo esa categoría (ej.
  // "Regulados" o "Descontinuado").
  const proveedoresPorEncima = computeProveedoresPorEncima(filteredRows);
  const portafolioLabel = PORTAFOLIO_LABELS[portafolio as PortafolioVsCircular] ?? null;

  // Torta "Aviso a proveedores" — a pedido de Camila (2026-08-12), cuenta
  // PROVEEDORES (no códigos): reusa la misma agrupación de
  // proveedoresPorEncima (ya filtrada por Regulación + Comparación vs.
  // circular) y el mismo criterio de computeEnvioEstadoProveedor que usa la
  // lista de proveedores, para que ambas coincidan. Clic en la torta (a
  // pedido de Camila) lista los proveedores de esa categoría — se arma acá
  // proveedoresPorBucket, liviano (solo nombre + cantidad), en vez de
  // mandarle al cliente los `productos` completos de cada grupo.
  const proveedoresPorBucket: Record<string, ProveedorEnvioResumen[]> = {
    ENVIADO: [],
    NO_ENVIADO: [],
    PARCIAL: [],
    SIN_DATO: [],
  };
  for (const g of proveedoresPorEncima) {
    const { bucket } = computeEnvioEstadoProveedor(g.productos.map((p) => p.codigo), codigoEnvioInfo);
    proveedoresPorBucket[bucket].push({ proveedor: g.proveedor, count: g.count });
  }
  const envioDonutData: EnvioDonutSlice[] = [
    { label: "Enviado", value: proveedoresPorBucket.ENVIADO.length, fill: "#22c55e", bucket: "ENVIADO" },
    { label: "No enviado", value: proveedoresPorBucket.NO_ENVIADO.length, fill: "#ef4444", bucket: "NO_ENVIADO" },
    { label: "Parcial", value: proveedoresPorBucket.PARCIAL.length, fill: "#f59e0b", bucket: "PARCIAL" },
    { label: "Sin dato", value: proveedoresPorBucket.SIN_DATO.length, fill: "#94a3b8", bucket: "SIN_DATO" },
  ].filter((d) => d.value > 0);

  const reguladosCount = all.filter((r) => !NO_REGULADO_PORTAFOLIO.includes(r.portafolioVsCircular)).length;
  const nivel0: DrilldownBar[] = [
    { label: "Control directo", value: reguladosCount, fill: "#2563eb" },
    { label: "No control directo", value: totalPortafolio - reguladosCount, fill: "#94a3b8" },
  ];
  const nivel1: DrilldownBar[] = portafolioCounts
    .filter((c) => !NO_REGULADO_PORTAFOLIO.includes(c.portafolio))
    .map((c) => ({ label: PORTAFOLIO_LABELS[c.portafolio], value: c.count, fill: PORTAFOLIO_COLORS[c.portafolio] }));

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
              Portafolio de proveedores vs. circular 22 — {all.length} productos de control directo de {totalPortafolio} en portafolio
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

      <div className="min-w-0 rounded-xl border bg-card p-4 lg:w-1/2">
        <h3 className="mb-3 text-sm font-semibold">Todos los artículos vs. control directo</h3>
        <RegulacionBarChart nivel0={nivel0} nivel1={nivel1} />
      </div>

      <div className="grid min-w-0 items-start gap-4 lg:grid-cols-[1.2fr_0.9fr_0.9fr]">
        <div className="min-w-0 rounded-xl border bg-card p-4">
          <h3 className="text-sm font-semibold">
            Proveedores {portafolioLabel ? `— ${portafolioLabel}` : "(todos los de control directo)"}
          </h3>
          <p className="mb-2 text-xs text-muted-foreground">
            Clic en un proveedor para ver el detalle de sus productos.
          </p>
          <ProveedoresPorEncimaList groups={proveedoresPorEncima} codigoEnvioInfo={codigoEnvioInfo} />
        </div>
        <div className="min-w-0 rounded-xl border bg-card p-4">
          <h3 className="mb-3 text-sm font-semibold">Aviso a proveedores</h3>
          <EnvioDonut data={envioDonutData} proveedoresPorBucket={proveedoresPorBucket} />
        </div>
        <div className="min-w-0 rounded-xl border bg-card p-4">
          <h3 className="mb-3 text-sm font-semibold">Portafolio vs. circular 22</h3>
          <PortafolioDonut counts={portafolioCounts} />
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
          <p className="text-xs font-medium text-muted-foreground">Comparación vs. circular</p>
          <PortafolioFilterRow counts={portafolioCounts} portafolio={portafolio} />
        </div>
        <DetailTablePortafolio
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
