import { AlertTriangle } from "lucide-react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { ServerSearchInput } from "@/components/server-search-input";
import { SortableHead } from "@/components/sortable-head";
import { PaginationControls } from "@/components/pagination-controls";
import type { AlertaListaFaltanteRow } from "@/lib/analisis-precios";

// Igual a AlertaSimpleTable pero con una columna "Lista" — una fila por cada
// combinación código+lista donde falta el precio (2026-09-23).
export function AlertaListaFaltanteTable({
  title,
  description,
  emptyMessage,
  paramPrefix,
  rows,
  page,
  totalPages,
  totalCount,
  search,
  sortField,
  sortDir,
}: {
  title: string;
  description: string;
  emptyMessage: string;
  paramPrefix: string;
  rows: AlertaListaFaltanteRow[];
  page: number;
  totalPages: number;
  totalCount: number;
  search: string;
  sortField: string;
  sortDir: "asc" | "desc";
}) {
  const q = `${paramPrefix}q`;
  const pageParam = `${paramPrefix}page`;
  const sortParam = `${paramPrefix}sort`;
  const dirParam = `${paramPrefix}dir`;

  return (
    <div className="flex min-w-0 flex-col gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
      <div className="flex items-center gap-2">
        <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400" />
        <h3 className="text-sm font-semibold text-amber-700 dark:text-amber-400">{title}</h3>
        <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
          {totalCount}
        </span>
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>

      {totalCount === 0 && !search ? (
        <p className="py-4 text-center text-sm text-muted-foreground">{emptyMessage}</p>
      ) : (
        <>
          <ServerSearchInput
            placeholder="Buscar código, descripción o nombre comercial..."
            defaultValue={search}
            queryParam={q}
            pageParam={pageParam}
          />
          <div className="overflow-x-auto rounded-xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHead field="codigo" initialField={sortField} initialDir={sortDir} sortParam={sortParam} dirParam={dirParam} pageParam={pageParam}>
                    Código
                  </SortableHead>
                  <SortableHead field="descripcion" initialField={sortField} initialDir={sortDir} sortParam={sortParam} dirParam={dirParam} pageParam={pageParam}>
                    Descripción
                  </SortableHead>
                  <SortableHead field="nombreComercial" initialField={sortField} initialDir={sortDir} sortParam={sortParam} dirParam={dirParam} pageParam={pageParam}>
                    Nombre Comercial
                  </SortableHead>
                  <SortableHead field="lista" initialField={sortField} initialDir={sortDir} sortParam={sortParam} dirParam={dirParam} pageParam={pageParam} className="text-right">
                    Lista sin precio
                  </SortableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No se encontraron resultados.
                    </TableCell>
                  </TableRow>
                )}
                {rows.map((r) => (
                  <TableRow key={`${r.codigo}-${r.lista}`}>
                    <TableCell className="font-mono text-xs text-muted-foreground">{r.codigo}</TableCell>
                    <TableCell className="max-w-64 truncate font-medium" title={r.descripcion}>
                      {r.descripcion}
                    </TableCell>
                    <TableCell className="max-w-48 truncate" title={r.nombreComercial}>
                      {r.nombreComercial}
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold text-amber-700 dark:text-amber-400">
                      {r.lista}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <PaginationControls page={page} totalPages={totalPages} totalCount={totalCount} pageParam={pageParam} />
        </>
      )}
    </div>
  );
}
