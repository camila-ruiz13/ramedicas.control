import { AlertTriangle } from "lucide-react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { ServerSearchInput } from "@/components/server-search-input";
import { SortableHead } from "@/components/sortable-head";
import { PaginationControls } from "@/components/pagination-controls";
import { cn } from "@/lib/utils";
import { ANALISIS_PRECIOS_LISTA_NUMBERS, type AnalisisPrecioRow } from "@/lib/analisis-precios";
import { fmtMoney, listaField, headClass, LISTA_HEAD_BG } from "./shared";

// Mismo formato ancho (código + una columna por lista) que la tabla
// principal, a pedido de Camila (2026-09-28) — antes esta alerta salía como
// lista plana código+lista, y prefirió verla en el mismo formato de arriba.
export function AlertaCeroListasTable({
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
  rows: AnalisisPrecioRow[];
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
  const colSpan = 1 + ANALISIS_PRECIOS_LISTA_NUMBERS.length;

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
                  {ANALISIS_PRECIOS_LISTA_NUMBERS.map((n) => (
                    <SortableHead
                      key={n}
                      field={listaField(n)}
                      initialField={sortField}
                      initialDir={sortDir}
                      sortParam={sortParam}
                      dirParam={dirParam}
                      pageParam={pageParam}
                      className={cn(headClass, LISTA_HEAD_BG[n])}
                    >
                      Lista {n}
                    </SortableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={colSpan} className="text-center text-muted-foreground">
                      No se encontraron resultados.
                    </TableCell>
                  </TableRow>
                )}
                {rows.map((r) => (
                  <TableRow key={r.codigo}>
                    <TableCell
                      className="font-mono text-xs text-muted-foreground"
                      title={[r.descripcion, r.nombreComercial].filter(Boolean).join(" — ")}
                    >
                      {r.codigo}
                    </TableCell>
                    {ANALISIS_PRECIOS_LISTA_NUMBERS.map((n) => (
                      <TableCell key={n} className="text-right font-mono">
                        {fmtMoney(r[listaField(n)] as number | null)}
                      </TableCell>
                    ))}
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
