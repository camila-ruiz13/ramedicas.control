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
  CAMBIO_LABELS,
  CAMBIO_BADGE_CLASSES,
  type PrecioReguladoRow,
} from "@/lib/precios-regulados-constants";

// Tabla de la pestaña "Circular 19 vs 22": compara precioCircular19 (PRECIO
// MÁX EMB) contra precioCircular22 (Circular 22 emb). El badge de "Cambio
// regulación" muestra el comentario tal cual está en la columna AA
// (cambioRegulacionRaw) — a pedido de Camila, no una etiqueta traducida —
// CAMBIO_LABELS solo se usa como respaldo si por algo viniera vacío. No
// mezcla nada del análisis portafolio vs circular — ese vive en
// detail-table-portafolio.tsx.
export function DetailTableCambio({
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
              <SortableHead field="precioCircular19" initialField={sortField} initialDir={sortDir} className="text-right">
                Precio Circular 19
              </SortableHead>
              <SortableHead field="precioCircular22" initialField={sortField} initialDir={sortDir} className="text-right">
                Precio Circular 22
              </SortableHead>
              <SortableHead field="diferenciaCircular" initialField={sortField} initialDir={sortDir} className="text-right">
                Diferencia
              </SortableHead>
              <SortableHead field="cambioRegulacion" initialField={sortField} initialDir={sortDir}>
                Cambio regulación
              </SortableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
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
                  {r.precioCircular19 !== null ? (
                    fmtCOP.format(r.precioCircular19)
                  ) : r.circular19Comentario ? (
                    <span className="font-sans text-xs italic text-muted-foreground" title={r.circular19Comentario}>
                      {r.circular19Comentario}
                    </span>
                  ) : (
                    "—"
                  )}
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
                    r.diferenciaCircular !== null && r.diferenciaCircular > 0 && "text-red-600 dark:text-red-400",
                    r.diferenciaCircular !== null && r.diferenciaCircular < 0 && "text-emerald-600 dark:text-emerald-400",
                  )}
                >
                  {r.diferenciaCircular === null ? "—" : fmtCOP.format(r.diferenciaCircular)}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn("border-none", CAMBIO_BADGE_CLASSES[r.cambioRegulacion])}>
                    {r.cambioRegulacionRaw || CAMBIO_LABELS[r.cambioRegulacion]}
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
