import { Fragment } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ServerSearchInput } from "@/components/server-search-input";
import { SortableHead } from "@/components/sortable-head";
import { PaginationControls } from "@/components/pagination-controls";
import { fmtCOP } from "@/lib/autorizacion-compras-constants";
import { fmtNum } from "@/lib/cambios-precios-constants";
import type { ArticuloAgregado } from "@/lib/descuentos-proveedores";

export function DetailTable({
  rows,
  conceptos,
  page,
  totalPages,
  totalCount,
  search,
  sortField,
  sortDir,
  mostrarProveedor,
}: {
  rows: ArticuloAgregado[];
  conceptos: string[];
  page: number;
  totalPages: number;
  totalCount: number;
  search: string;
  sortField: string;
  sortDir: "asc" | "desc";
  mostrarProveedor: boolean;
}) {
  const colSpan = 8 + (mostrarProveedor ? 1 : 0) + conceptos.length * 2;

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <ServerSearchInput placeholder="Buscar código o artículo..." defaultValue={search} />
      <div className="overflow-x-auto rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHead field="codigo" initialField={sortField} initialDir={sortDir}>
                Código
              </SortableHead>
              <SortableHead field="articulo" initialField={sortField} initialDir={sortDir}>
                Artículo
              </SortableHead>
              {mostrarProveedor && (
                <SortableHead field="nombreProveedor" initialField={sortField} initialDir={sortDir}>
                  Proveedor
                </SortableHead>
              )}
              <SortableHead field="unidadesCompradas" initialField={sortField} initialDir={sortDir} className="text-right">
                Compra
              </SortableHead>
              <SortableHead field="unidadesDevueltas" initialField={sortField} initialDir={sortDir} className="text-right">
                Predevoluciones
              </SortableHead>
              <SortableHead field="unidadesNetas" initialField={sortField} initialDir={sortDir} className="text-right">
                Total
              </SortableHead>
              <SortableHead field="precioUnidad" initialField={sortField} initialDir={sortDir} className="text-right">
                Precio Unidad
              </SortableHead>
              <SortableHead field="precioTotalNeto" initialField={sortField} initialDir={sortDir} className="text-right">
                Precio total
              </SortableHead>
              <SortableHead field="precioTotalBruto" initialField={sortField} initialDir={sortDir} className="text-right">
                Precio sin pre
              </SortableHead>
              {conceptos.map((concepto) => (
                <TableHeadConcepto key={concepto} concepto={concepto} />
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={colSpan} className="text-center text-muted-foreground">
                  No se encontraron artículos.
                </TableCell>
              </TableRow>
            )}
            {rows.map((r) => (
              <TableRow key={`${r.nitProveedor}-${r.codigo}-${r.mes}`}>
                <TableCell className="font-mono text-xs text-muted-foreground">{r.codigo}</TableCell>
                <TableCell className="max-w-56 truncate font-medium" title={r.articulo}>
                  {r.articulo}
                </TableCell>
                {mostrarProveedor && (
                  <TableCell className="max-w-40 truncate" title={r.nombreProveedor}>
                    {r.nombreProveedor}
                  </TableCell>
                )}
                <TableCell className="text-right font-mono">{fmtNum.format(r.unidadesCompradas)}</TableCell>
                <TableCell className="text-right font-mono">{fmtNum.format(r.unidadesDevueltas)}</TableCell>
                <TableCell className="text-right font-mono">{fmtNum.format(r.unidadesNetas)}</TableCell>
                <TableCell className="text-right font-mono">{fmtCOP.format(r.precioUnidad)}</TableCell>
                <TableCell className="text-right font-mono">{fmtCOP.format(r.precioTotalNeto)}</TableCell>
                <TableCell className="text-right font-mono">{fmtCOP.format(r.precioTotalBruto)}</TableCell>
                {conceptos.map((concepto) => {
                  const c = r.conceptos.find((x) => x.concepto === concepto);
                  return (
                    <Fragment key={concepto}>
                      <TableCell className="text-right font-mono text-xs text-muted-foreground">
                        {c ? `${c.porPct.toFixed(2)}%` : "—"}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {c ? fmtCOP.format(c.descuento) : "—"}
                      </TableCell>
                    </Fragment>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <PaginationControls page={page} totalPages={totalPages} totalCount={totalCount} />
    </div>
  );
}

function TableHeadConcepto({ concepto }: { concepto: string }) {
  return (
    <th
      className="whitespace-nowrap px-3 py-2 text-center text-xs font-medium text-muted-foreground"
      colSpan={2}
      title="% pactado y $ esperado"
    >
      {concepto}
    </th>
  );
}
