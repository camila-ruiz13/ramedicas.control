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
import { displayFecha, fmtCOP, fmtNum, fmtPct } from "@/lib/autorizacion-compras-constants";
import type { AutorizacionRow } from "@/lib/autorizacion-compras-constants";
import { cn } from "@/lib/utils";

export function DetailTable({
  rows,
  page,
  totalPages,
  totalCount,
  search,
  sortField,
  sortDir,
}: {
  rows: AutorizacionRow[];
  page: number;
  totalPages: number;
  totalCount: number;
  search: string;
  sortField: string;
  sortDir: "asc" | "desc";
}) {
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <ServerSearchInput placeholder="Buscar código, artículo, factura, proveedor..." defaultValue={search} />
      <div className="overflow-x-auto rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHead field="fechaFactura" initialField={sortField} initialDir={sortDir}>
                Fecha Factura
              </SortableHead>
              <SortableHead field="nroFactura" initialField={sortField} initialDir={sortDir}>
                Factura
              </SortableHead>
              <SortableHead field="codArticulo" initialField={sortField} initialDir={sortDir}>
                Código
              </SortableHead>
              <SortableHead field="nombreArticulo" initialField={sortField} initialDir={sortDir}>
                Artículo
              </SortableHead>
              <SortableHead field="unidades" initialField={sortField} initialDir={sortDir}>
                Unid.
              </SortableHead>
              <SortableHead field="costo" initialField={sortField} initialDir={sortDir}>
                Costo
              </SortableHead>
              <SortableHead field="costoLista" initialField={sortField} initialDir={sortDir}>
                Costo Lista
              </SortableHead>
              <SortableHead field="difValor" initialField={sortField} initialDir={sortDir}>
                Dif. Valor
              </SortableHead>
              <SortableHead field="difPct" initialField={sortField} initialDir={sortDir}>
                Dif %
              </SortableHead>
              <SortableHead field="variacion" initialField={sortField} initialDir={sortDir}>
                Variación
              </SortableHead>
              <SortableHead field="proveedor" initialField={sortField} initialDir={sortDir}>
                Proveedor
              </SortableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={11} className="text-center text-muted-foreground">
                  No se encontraron registros.
                </TableCell>
              </TableRow>
            )}
            {rows.map((d, i) => {
              const porEncima = d.variacion === "POR ENCIMA";
              return (
                <TableRow
                  key={`${d.nroFactura}-${d.codArticulo}-${i}`}
                  className={cn("border-l-2", porEncima ? "border-l-red-500" : "border-l-emerald-500")}
                >
                  <TableCell className="whitespace-nowrap">{displayFecha(d.fechaFactura)}</TableCell>
                  <TableCell className="max-w-28 truncate" title={d.nroFactura}>
                    {d.nroFactura}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{d.codArticulo}</TableCell>
                  <TableCell className="max-w-56 truncate font-medium" title={d.nombreArticulo}>
                    {d.nombreArticulo}
                  </TableCell>
                  <TableCell className="text-right font-mono">{fmtNum.format(d.unidades)}</TableCell>
                  <TableCell className="text-right font-mono">{fmtCOP.format(d.costo)}</TableCell>
                  <TableCell className="text-right font-mono">{fmtCOP.format(d.costoLista)}</TableCell>
                  <TableCell className="text-right font-mono">{fmtCOP.format(d.difValor)}</TableCell>
                  <TableCell className="text-right font-mono">{fmtPct(d.difPct)}</TableCell>
                  <TableCell
                    className={cn(
                      "font-medium",
                      porEncima ? "text-red-700 dark:text-red-400" : "text-emerald-700 dark:text-emerald-400",
                    )}
                  >
                    {d.variacion}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{d.proveedor}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <PaginationControls page={page} totalPages={totalPages} totalCount={totalCount} />
    </div>
  );
}
