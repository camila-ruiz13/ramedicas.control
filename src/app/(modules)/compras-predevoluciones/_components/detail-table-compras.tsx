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
import type { CompraDetalleRow } from "@/lib/compras-predevoluciones";

function displayFecha(d: Date): string {
  return `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}/${d.getUTCFullYear()}`;
}

export function DetailTableCompras({
  rows,
  page,
  totalPages,
  totalCount,
  search,
  sortField,
  sortDir,
}: {
  rows: CompraDetalleRow[];
  page: number;
  totalPages: number;
  totalCount: number;
  search: string;
  sortField: string;
  sortDir: "asc" | "desc";
}) {
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <ServerSearchInput placeholder="Buscar número, factura, código o artículo..." defaultValue={search} />
      <div className="overflow-x-auto rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHead field="numero" initialField={sortField} initialDir={sortDir}>Compra</SortableHead>
              <SortableHead field="nroFactura" initialField={sortField} initialDir={sortDir}>Factura</SortableHead>
              <SortableHead field="fechaFactura" initialField={sortField} initialDir={sortDir}>Fecha</SortableHead>
              <SortableHead field="codigo" initialField={sortField} initialDir={sortDir}>Código</SortableHead>
              <SortableHead field="articulo" initialField={sortField} initialDir={sortDir}>Artículo</SortableHead>
              <SortableHead field="unidades" initialField={sortField} initialDir={sortDir} className="text-right">Unidades</SortableHead>
              <SortableHead field="subtotal" initialField={sortField} initialDir={sortDir} className="text-right">Subtotal</SortableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No se encontraron compras.
                </TableCell>
              </TableRow>
            )}
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-mono text-xs text-muted-foreground">{r.numero}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{r.nroFactura}</TableCell>
                <TableCell className="whitespace-nowrap">{displayFecha(r.fechaFactura)}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{r.codigo}</TableCell>
                <TableCell className="max-w-64 truncate font-medium" title={r.articulo}>{r.articulo}</TableCell>
                <TableCell className="text-right font-mono">{fmtNum.format(r.unidades)}</TableCell>
                <TableCell className="text-right font-mono">{fmtCOP.format(r.subtotal)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <PaginationControls page={page} totalPages={totalPages} totalCount={totalCount} />
    </div>
  );
}
