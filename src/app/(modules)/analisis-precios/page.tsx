import { RefreshCw } from "lucide-react";
import { MODULES, MODULE_COLOR_CLASSES } from "@/lib/modules";
import { requireModuleView } from "@/lib/permissions";
import { SubmitButton } from "@/components/submit-button";
import { parsePageParams, paginate } from "@/lib/pagination";
import {
  getAnalisisPrecios,
  computeAlertasSobrePrecioRegulado,
  computeAlertasBajoCostoReferencia2,
  computeAlertaSinCostoReferencia,
  computeAlertasListaFaltante,
  applyDescontinuadoCompraFilter,
  applyDescontinuadoVentaFilter,
} from "@/lib/analisis-precios";
import { actualizarAnalisisPrecios } from "./actions";
import { DetailTable } from "./_components/detail-table";
import { AlertaTable } from "./_components/alerta-table";
import { AlertaSimpleTable } from "./_components/alerta-simple-table";
import { AlertaListaFaltanteTable } from "./_components/alerta-lista-faltante-table";
import { EstadoFilterRow } from "./_components/estado-filter-row";

export default async function AnalisisPreciosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireModuleView("analisis-precios");
  const sp = await searchParams;

  const moduleDef = MODULES.find((m) => m.slug === "analisis-precios")!;
  const colors = MODULE_COLOR_CLASSES[moduleDef.color];
  const Icon = moduleDef.icon;

  const articulos = await getAnalisisPrecios();

  const one = (key: string) => (Array.isArray(sp[key]) ? sp[key]![0] : sp[key]) ?? "";
  const compra = one("compra");
  const venta = one("venta");

  // Filtros de primer nivel (Activos/Descontinuados) — a pedido de Camila
  // (2026-09-23), alimentan TODO lo demás de la página (tabla, ambas
  // alertas), no solo la tabla principal. Se aplican en cascada, igual que
  // el patrón ya usado en precios-regulados/portafolio-vs-circular.
  const compraFiltered = applyDescontinuadoCompraFilter(articulos, compra);
  const filteredRows = applyDescontinuadoVentaFilter(compraFiltered, venta);

  const compraSiCount = articulos.filter((r) => r.descontinuadoCompra).length;
  const ventaSiCount = compraFiltered.filter((r) => r.descontinuadoVenta).length;

  const params = parsePageParams(sp, { defaultSort: "codigo", defaultDir: "asc", pageSize: 25 });
  const { rows, page, totalCount, totalPages } = paginate(filteredRows, params, [
    "codigo",
    "descripcion",
    "nombreComercial",
  ]);

  const alertasSobreRegulado = computeAlertasSobrePrecioRegulado(filteredRows);
  const regParams = parsePageParams(sp, { prefix: "reg", defaultSort: "diferencia", defaultDir: "desc", pageSize: 15 });
  const reg = paginate(alertasSobreRegulado, regParams, ["codigo", "descripcion", "nombreComercial"]);

  const alertasBajoCosto = computeAlertasBajoCostoReferencia2(filteredRows);
  const costoParams = parsePageParams(sp, { prefix: "costo", defaultSort: "diferencia", defaultDir: "asc", pageSize: 15 });
  const costo = paginate(alertasBajoCosto, costoParams, ["codigo", "descripcion", "nombreComercial"]);

  const alertasSinCosto = computeAlertaSinCostoReferencia(filteredRows);
  const scParams = parsePageParams(sp, { prefix: "sc", defaultSort: "codigo", defaultDir: "asc", pageSize: 15 });
  const sinCosto = paginate(alertasSinCosto, scParams, ["codigo", "descripcion", "nombreComercial"]);

  const alertasSinLista = computeAlertasListaFaltante(filteredRows);
  const slParams = parsePageParams(sp, { prefix: "sl", defaultSort: "codigo", defaultDir: "asc", pageSize: 15 });
  const sinLista = paginate(alertasSinLista, slParams, ["codigo", "descripcion", "nombreComercial"]);

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`flex size-10 items-center justify-center rounded-xl ${colors.badge}`}>
            <Icon className={`size-5 ${colors.icon}`} />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight">Análisis de Precios</h1>
            <p className="text-muted-foreground">
              {articulos.length} artículos — costo de referencia y rentabilidad por lista de precios
            </p>
          </div>
        </div>
        <form action={actualizarAnalisisPrecios}>
          <SubmitButton variant="outline" size="sm" pendingText="Actualizando...">
            <RefreshCw className="size-4" />
            Actualizar
          </SubmitButton>
        </form>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-6">
        <EstadoFilterRow
          label="Descontinuado compra"
          queryParam="compra"
          total={articulos.length}
          si={compraSiCount}
          no={articulos.length - compraSiCount}
          value={compra}
        />
        <EstadoFilterRow
          label="Descontinuado venta"
          queryParam="venta"
          total={compraFiltered.length}
          si={ventaSiCount}
          no={compraFiltered.length - ventaSiCount}
          value={venta}
        />
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

      <AlertaTable
        title="Listas por encima del Precio Regulación"
        description="Productos con precio regulado donde alguna lista vende por encima de ese máximo."
        emptyMessage="Ninguna lista está por encima del precio regulado."
        referenciaLabel="Precio Regulación"
        paramPrefix="reg"
        rows={reg.rows}
        page={reg.page}
        totalPages={reg.totalPages}
        totalCount={reg.totalCount}
        search={regParams.search}
        sortField={regParams.sortField}
        sortDir={regParams.sortDir}
      />

      <AlertaTable
        title="Listas por debajo del Costo Referencia 2"
        description="Productos donde alguna lista vende por debajo del costo de referencia 2."
        emptyMessage="Ninguna lista está por debajo del costo de referencia 2."
        referenciaLabel="Costo Referencia 2"
        paramPrefix="costo"
        rows={costo.rows}
        page={costo.page}
        totalPages={costo.totalPages}
        totalCount={costo.totalCount}
        search={costoParams.search}
        sortField={costoParams.sortField}
        sortDir={costoParams.sortDir}
      />

      <AlertaSimpleTable
        title="Activos sin Costo de Referencia"
        description="Códigos no descontinuados (ni compra ni venta) sin Costo Referencia 1 ni Costo Referencia 2."
        emptyMessage="Todos los códigos activos tienen algún costo de referencia."
        paramPrefix="sc"
        rows={sinCosto.rows}
        page={sinCosto.page}
        totalPages={sinCosto.totalPages}
        totalCount={sinCosto.totalCount}
        search={scParams.search}
        sortField={scParams.sortField}
        sortDir={scParams.sortDir}
      />

      <AlertaListaFaltanteTable
        title="Activos sin precio en alguna lista"
        description="Códigos no descontinuados (ni compra ni venta) — una fila por cada lista puntual donde falta el precio."
        emptyMessage="Todos los códigos activos tienen precio en las 7 listas."
        paramPrefix="sl"
        rows={sinLista.rows}
        page={sinLista.page}
        totalPages={sinLista.totalPages}
        totalCount={sinLista.totalCount}
        search={slParams.search}
        sortField={slParams.sortField}
        sortDir={slParams.sortDir}
      />
    </div>
  );
}
