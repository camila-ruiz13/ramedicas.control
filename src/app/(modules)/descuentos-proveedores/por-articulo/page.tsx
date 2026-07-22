import { MODULES, MODULE_COLOR_CLASSES } from "@/lib/modules";
import { requireModuleView } from "@/lib/permissions";
import { parsePageParams, paginate } from "@/lib/pagination";
import {
  getMesesDisponibles,
  getProveedoresDisponibles,
  fetchDatosParaCalculo,
  calcularEsperadoPorCompra,
  agregarPorArticulo,
} from "@/lib/descuentos-proveedores";
import { DescuentosSubNav } from "../_components/sub-nav";
import { FiltrosBar } from "./_components/filtros-bar";
import { DetailTable } from "./_components/detail-table";

export default async function PorArticuloPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireModuleView("descuentos-proveedores");
  const sp = await searchParams;
  const one = (key: string) => (Array.isArray(sp[key]) ? sp[key]![0] : sp[key]) ?? "";

  const moduleDef = MODULES.find((m) => m.slug === "descuentos-proveedores")!;
  const colors = MODULE_COLOR_CLASSES[moduleDef.color];
  const Icon = moduleDef.icon;

  const meses = await getMesesDisponibles();
  const mes = one("mes") || meses[0] || "";
  const nit = one("nit");
  const incluirDevoluciones = one("incluirDevoluciones") !== "0";

  const proveedores = mes ? await getProveedoresDisponibles(mes) : [];

  let articulos: Awaited<ReturnType<typeof agregarPorArticulo>> = [];
  if (mes) {
    const { compras, predevoluciones, ofertas } = await fetchDatosParaCalculo(mes, nit || undefined);
    const lineas = calcularEsperadoPorCompra(compras, predevoluciones, ofertas, { incluirDevoluciones });
    articulos = agregarPorArticulo(compras, predevoluciones, lineas);
  }

  // El universo de conceptos debe salir del set completo (antes de buscar/paginar)
  // para que las columnas no cambien de una página a otra.
  const conceptos = [...new Set(articulos.flatMap((a) => a.conceptos.map((c) => c.concepto)))].sort();

  const params = parsePageParams(sp, { defaultSort: "codigo", defaultDir: "asc", pageSize: 25 });
  const { rows, page, totalCount, totalPages } = paginate(articulos, params, ["codigo", "articulo"]);

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className={`flex size-10 items-center justify-center rounded-xl ${colors.badge}`}>
          <Icon className={`size-5 ${colors.icon}`} />
        </div>
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">Descuentos y Rebates</h1>
          <p className="text-muted-foreground">
            Consolidado por artículo — {mes || "sin datos sincronizados"}
          </p>
        </div>
      </div>

      <DescuentosSubNav />

      {meses.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Todavía no hay compras sincronizadas. Ve a &quot;Resumen&quot; y sincroniza desde Drive primero.
        </p>
      ) : (
        <>
          <FiltrosBar
            meses={meses}
            mes={mes}
            proveedores={proveedores}
            nit={nit}
            incluirDevoluciones={incluirDevoluciones}
          />

          <DetailTable
            rows={rows}
            conceptos={conceptos}
            page={page}
            totalPages={totalPages}
            totalCount={totalCount}
            search={params.search}
            sortField={params.sortField}
            sortDir={params.sortDir}
            mostrarProveedor={!nit}
          />
        </>
      )}
    </div>
  );
}
