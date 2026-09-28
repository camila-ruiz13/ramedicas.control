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
  computeCodigosEnCeroEnTodasLasListas,
  applyDescontinuadoCompraFilter,
  applyDescontinuadoVentaFilter,
  applyProveedorFilter,
  applyControlDirectoFilter,
  applySoloAlertaFilter,
  applyExcluirOperandoFilter,
  esControlDirecto,
  getProveedoresDisponibles,
} from "@/lib/analisis-precios";
import { actualizarAnalisisPrecios } from "./actions";
import { DetailTable } from "./_components/detail-table";
import { AlertaTable } from "./_components/alerta-table";
import { AlertaSimpleTable } from "./_components/alerta-simple-table";
import { AlertaCeroListasTable } from "./_components/alerta-cero-listas-table";
import { EstadoFilterRow } from "./_components/estado-filter-row";
import { ProveedorFilter } from "./_components/proveedor-filter";
import { SoloAlertaToggle } from "./_components/solo-alerta-toggle";
import { ExcluirOperandoToggle } from "./_components/excluir-operando-toggle";
import { SimuladorListas } from "./_components/simulador-listas";

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
  const proveedor = one("proveedor");
  const controlDirecto = one("controlDirecto");
  const excluirOperando = one("excluirOperando");
  const soloAlerta = one("soloAlerta");

  // Filtros de primer nivel (Activos/Descontinuados, Proveedor, Control
  // Directo, Excluir OPERANDO) — a pedido de Camila (2026-09-23/24/28),
  // alimentan TODO lo demás de la página (tabla, todas las alertas), no
  // solo la tabla principal. Se aplican en cascada, igual que el patrón ya
  // usado en precios-regulados/portafolio-vs-circular.
  const compraFiltered = applyDescontinuadoCompraFilter(articulos, compra);
  const ventaFiltered = applyDescontinuadoVentaFilter(compraFiltered, venta);
  const proveedorFiltered = applyProveedorFilter(ventaFiltered, proveedor);
  const controlDirectoFiltered = applyControlDirectoFilter(proveedorFiltered, controlDirecto);
  const filteredRows = applyExcluirOperandoFilter(controlDirectoFiltered, excluirOperando);

  const compraSiCount = articulos.filter((r) => r.descontinuadoCompra).length;
  const ventaSiCount = compraFiltered.filter((r) => r.descontinuadoVenta).length;
  const proveedoresDisponibles = getProveedoresDisponibles(ventaFiltered);
  const controlDirectoSiCount = proveedorFiltered.filter(esControlDirecto).length;

  // "Solo con alerta" solo acota la tabla principal — las alertas de abajo
  // ya están, por definición, restringidas a filas con esa condición (o, en
  // el caso de las de dato faltante, no tienen nada que ver con el
  // resaltado rojo), así que no debe tocar `filteredRows` compartido.
  const tableRows = applySoloAlertaFilter(filteredRows, soloAlerta);

  // A pedido de Camila (2026-09-28): página más grande (100 en vez de 25) —
  // la tabla queda con scroll interno propio (ver DetailTable) para no
  // agrandar el alto de la página, así que menos clics de "Siguiente" no
  // significa perder el encabezado de vista.
  const params = parsePageParams(sp, { defaultSort: "codigo", defaultDir: "asc", pageSize: 100 });
  const { rows, page, totalCount, totalPages } = paginate(tableRows, params, [
    "codigo",
    "descripcion",
    "nombreComercial",
  ]);

  const alertasSobreRegulado = computeAlertasSobrePrecioRegulado(filteredRows);
  const regParams = parsePageParams(sp, { prefix: "reg", defaultSort: "diferencia", defaultDir: "desc", pageSize: 100 });
  const reg = paginate(alertasSobreRegulado, regParams, ["codigo", "descripcion", "nombreComercial"]);

  const alertasBajoCosto = computeAlertasBajoCostoReferencia2(filteredRows);
  const costoParams = parsePageParams(sp, { prefix: "costo", defaultSort: "diferencia", defaultDir: "asc", pageSize: 100 });
  const costo = paginate(alertasBajoCosto, costoParams, ["codigo", "descripcion", "nombreComercial"]);

  const alertasSinCosto = computeAlertaSinCostoReferencia(filteredRows);
  const scParams = parsePageParams(sp, { prefix: "sc", defaultSort: "codigo", defaultDir: "asc", pageSize: 100 });
  const sinCosto = paginate(alertasSinCosto, scParams, ["codigo", "descripcion", "nombreComercial"]);

  const codigosEnCero = computeCodigosEnCeroEnTodasLasListas(filteredRows);
  const slParams = parsePageParams(sp, { prefix: "sl", defaultSort: "codigo", defaultDir: "asc", pageSize: 100 });
  const sinLista = paginate(codigosEnCero, slParams, ["codigo", "descripcion", "nombreComercial"]);

  // Para el buscador del simulador — todo el portafolio (sin filtros de la
  // página), solo los 4 campos que necesita para no mandar el detalle
  // completo (código, descripción, presentación, etc.) por cada uno de los
  // 12.000 artículos.
  const codigosParaSimulador = articulos.map((a) => ({
    codigo: a.codigo,
    nombreComercial: a.nombreComercial,
    costoReferencia1: a.costoReferencia1,
    costoReferencia2: a.costoReferencia2,
    precioRegulacion: a.precioRegulacion,
    lista24: a.lista24,
  }));

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
        <div className="flex items-center gap-2">
          <SimuladorListas codigos={codigosParaSimulador} />
          <form action={actualizarAnalisisPrecios}>
            <SubmitButton variant="outline" size="sm" pendingText="Actualizando...">
              <RefreshCw className="size-4" />
              Actualizar
            </SubmitButton>
          </form>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-4">
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
        <ProveedorFilter proveedores={proveedoresDisponibles} value={proveedor} />
        <EstadoFilterRow
          label="Control Directo"
          queryParam="controlDirecto"
          total={proveedorFiltered.length}
          si={controlDirectoSiCount}
          no={proveedorFiltered.length - controlDirectoSiCount}
          value={controlDirecto}
        />
        <ExcluirOperandoToggle checked={excluirOperando === "1"} />
        <SoloAlertaToggle checked={soloAlerta === "1"} />
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

      <AlertaCeroListasTable
        title="Activos en $0 en las 7 listas"
        description="Códigos no descontinuados (ni compra ni venta) cuyo precio está en $0 en todas las listas a la vez."
        emptyMessage="Todos los códigos activos tienen precio distinto de $0 en al menos una lista."
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
