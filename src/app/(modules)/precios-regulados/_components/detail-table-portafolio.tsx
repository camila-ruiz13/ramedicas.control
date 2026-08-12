import { Badge } from "@/components/ui/badge";
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
import { cn } from "@/lib/utils";
import { fmtCOP } from "@/lib/autorizacion-compras-constants";
import {
  PORTAFOLIO_LABELS,
  PORTAFOLIO_BADGE_CLASSES,
  fmtPctSigned,
  type PrecioReguladoRow,
} from "@/lib/precios-regulados-constants";

// Tabla de la pestaña "Portafolio vs Circular 22": compara costo/precio de
// portafolio contra precioCircular22. El badge de "Portafolio vs circular"
// muestra el comentario tal cual está en la columna AB
// (portafolioVsCircularRaw) — a pedido de Camila, no una etiqueta traducida
// — PORTAFOLIO_LABELS solo se usa como respaldo si por algo viniera vacío.
// No mezcla nada del análisis circular 19 vs 22 — ese vive en
// detail-table-cambio.tsx.
export function DetailTablePortafolio({
  rows,
  page,
  totalPages,
  totalCount,
  search,
  sortField,
  sortDir,
}: {
  rows: PrecioReguladoRow[];
  page: number;
  totalPages: number;
  totalCount: number;
  search: string;
  sortField: string;
  sortDir: "asc" | "desc";
}) {
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <ServerSearchInput placeholder="Buscar código, proveedor o producto..." defaultValue={search} />
      <div className="overflow-x-auto rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHead field="codigo" initialField={sortField} initialDir={sortDir}>
                Código
              </SortableHead>
              <SortableHead field="proveedor" initialField={sortField} initialDir={sortDir}>
                Proveedor
              </SortableHead>
              <SortableHead field="nombreComercial" initialField={sortField} initialDir={sortDir}>
                Producto
              </SortableHead>
              <SortableHead field="costo" initialField={sortField} initialDir={sortDir} className="text-right">
                Costo (portafolio)
              </SortableHead>
              <SortableHead field="precioCircular22" initialField={sortField} initialDir={sortDir} className="text-right">
                Precio Circular 22
              </SortableHead>
              <SortableHead field="diferencia" initialField={sortField} initialDir={sortDir} className="text-right">
                Diferencia
              </SortableHead>
              <SortableHead field="pctCambio" initialField={sortField} initialDir={sortDir} className="text-right">
                % cambio
              </SortableHead>
              <SortableHead field="portafolioVsCircular" initialField={sortField} initialDir={sortDir}>
                Portafolio vs circular
              </SortableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  No se encontraron productos.
                </TableCell>
              </TableRow>
            )}
            {rows.map((r) => (
              <TableRow key={r.codigo}>
                <TableCell className="font-mono text-xs">{r.codigo}</TableCell>
                <TableCell className="max-w-56 truncate font-medium" title={r.proveedor}>
                  {r.proveedor}
                </TableCell>
                <TableCell className="max-w-64 truncate text-muted-foreground" title={r.nombreComercial || r.principioActivo}>
                  {r.nombreComercial || r.principioActivo || "—"}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {r.costo === null ? "—" : fmtCOP.format(r.costo)}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {r.precioCircular22 !== null ? (
                    fmtCOP.format(r.precioCircular22)
                  ) : r.circular22Comentario ? (
                    <span className="font-sans text-xs italic text-muted-foreground" title={r.circular22Comentario}>
                      {r.circular22Comentario}
                    </span>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell
                  className={cn(
                    "text-right font-mono",
                    r.diferencia !== null && r.diferencia > 0 && "text-red-600 dark:text-red-400",
                    r.diferencia !== null && r.diferencia < 0 && "text-emerald-600 dark:text-emerald-400",
                  )}
                >
                  {r.diferencia === null ? "—" : fmtCOP.format(r.diferencia)}
                </TableCell>
                <TableCell
                  className={cn(
                    "text-right font-mono",
                    r.pctCambio !== null && r.pctCambio < 0 && "text-red-600 dark:text-red-400",
                    r.pctCambio !== null && r.pctCambio > 0 && "text-emerald-600 dark:text-emerald-400",
                  )}
                >
                  {r.pctCambio === null ? "—" : fmtPctSigned(r.pctCambio)}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn("border-none", PORTAFOLIO_BADGE_CLASSES[r.portafolioVsCircular])}>
                    {r.portafolioVsCircularRaw || PORTAFOLIO_LABELS[r.portafolioVsCircular]}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <PaginationControls page={page} totalPages={totalPages} totalCount={totalCount} />
    </div>
  );
}
