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
import {
  colorDeCondicion,
  displayFecha,
  esAumento,
  esDisminucion,
  esRealizado,
  fmtPct,
  type CambioPrecioRow,
} from "@/lib/cambios-precios-constants";
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
  rows: CambioPrecioRow[];
  page: number;
  totalPages: number;
  totalCount: number;
  search: string;
  sortField: string;
  sortDir: "asc" | "desc";
}) {
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <ServerSearchInput placeholder="Buscar código, nombre, observación..." defaultValue={search} />
      <div className="overflow-x-auto rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHead field="fecha" initialField={sortField} initialDir={sortDir}>
                Fecha
              </SortableHead>
              <SortableHead field="codigo" initialField={sortField} initialDir={sortDir}>
                Código
              </SortableHead>
              <SortableHead field="cur" initialField={sortField} initialDir={sortDir}>
                CUR
              </SortableHead>
              <SortableHead field="nombre" initialField={sortField} initialDir={sortDir}>
                Nombre
              </SortableHead>
              <SortableHead field="proveedor" initialField={sortField} initialDir={sortDir}>
                Proveedor
              </SortableHead>
              <SortableHead field="condicion" initialField={sortField} initialDir={sortDir}>
                Condición
              </SortableHead>
              <SortableHead field="anterior" initialField={sortField} initialDir={sortDir}>
                Anterior
              </SortableHead>
              <SortableHead field="nuevo" initialField={sortField} initialDir={sortDir}>
                Nuevo
              </SortableHead>
              <SortableHead field="variacionPct" initialField={sortField} initialDir={sortDir} className="text-right">
                Variación
              </SortableHead>
              <SortableHead field="listaRaw" initialField={sortField} initialDir={sortDir}>
                Listas de Precios
              </SortableHead>
              <SortableHead field="observacion" initialField={sortField} initialDir={sortDir}>
                Observación
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
            {rows.map((r, i) => {
              const aumento = esAumento(r.condicion);
              const disminucion = esDisminucion(r.condicion);
              const col = colorDeCondicion(r.condicion);
              const realizado = esRealizado(r.listaRaw);
              return (
                <TableRow
                  key={`${r.codigo}-${r.fecha}-${i}`}
                  className={cn(
                    "border-l-2",
                    aumento && "border-l-red-500",
                    disminucion && "border-l-emerald-500",
                    !aumento && !disminucion && "border-l-transparent",
                  )}
                >
                  <TableCell className="whitespace-nowrap">{displayFecha(r.fecha)}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{r.codigo}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{r.cur}</TableCell>
                  <TableCell className="max-w-56 truncate font-medium" title={r.nombre}>
                    {r.nombre}
                  </TableCell>
                  <TableCell className="max-w-40 truncate" title={r.proveedor}>
                    {r.proveedor}
                  </TableCell>
                  <TableCell className="font-medium" style={{ color: col.color }}>
                    {r.condicion}
                  </TableCell>
                  <TableCell className="text-right font-mono">{r.anteriorRaw || "—"}</TableCell>
                  <TableCell className="text-right font-mono">{r.nuevoRaw || "—"}</TableCell>
                  <TableCell
                    className={cn(
                      "text-right font-mono",
                      r.variacionPct !== null && r.variacionPct > 0 && "text-red-600 dark:text-red-400",
                      r.variacionPct !== null && r.variacionPct < 0 && "text-emerald-600 dark:text-emerald-400",
                    )}
                  >
                    {r.variacionPct !== null ? fmtPct(r.variacionPct) : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        "border-none",
                        realizado
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                          : "bg-amber-500/15 text-amber-700 dark:text-amber-400",
                      )}
                    >
                      {r.listaRaw || (realizado ? "Realizado" : "Pendiente")}
                    </Badge>
                  </TableCell>
                  <TableCell className="min-w-[26rem] whitespace-normal break-words" title={r.observacion}>
                    {r.observacion || "—"}
                  </TableCell>
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
