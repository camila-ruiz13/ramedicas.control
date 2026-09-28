import { Fragment } from "react";
import { TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { ServerSearchInput } from "@/components/server-search-input";
import { SortableHead } from "@/components/sortable-head";
import { PaginationControls } from "@/components/pagination-controls";
import { cn } from "@/lib/utils";
import { ANALISIS_PRECIOS_LISTA_NUMBERS, type AnalisisPrecioRow } from "@/lib/analisis-precios";
import {
  listaField,
  pctField,
  headClass,
  CONTROL_DIRECTO_HEAD_BG,
  LISTA_HEAD_BG,
  TwoLineHead,
  SCROLL_CONTAINER_CLASS,
  STICKY_HEAD_CLASS,
  RAW_TABLE_CLASS,
} from "./shared";
import { CodigoRow } from "./codigo-row";

export function DetailTable({
  rows,
  page,
  totalPages,
  totalCount,
  search,
  sortField,
  sortDir,
}: {
  rows: AnalisisPrecioRow[];
  page: number;
  totalPages: number;
  totalCount: number;
  search: string;
  sortField: string;
  sortDir: "asc" | "desc";
}) {
  const colSpan = 4 + ANALISIS_PRECIOS_LISTA_NUMBERS.length * 2;

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <ServerSearchInput placeholder="Buscar código, descripción o nombre comercial..." defaultValue={search} />
      {/* 100 filas por página con scroll interno + encabezado fijo (ver
          shared.tsx SCROLL_CONTAINER_CLASS para el porqué de no usar el
          componente <Table> compartido acá). */}
      <div className={SCROLL_CONTAINER_CLASS}>
        <table className={RAW_TABLE_CLASS}>
          <TableHeader className={STICKY_HEAD_CLASS}>
            <TableRow>
              <SortableHead field="codigo" initialField={sortField} initialDir={sortDir}>
                Código
              </SortableHead>
              <SortableHead field="precioRegulacion" initialField={sortField} initialDir={sortDir} className={cn(headClass, CONTROL_DIRECTO_HEAD_BG)}>
                <TwoLineHead a="Control" b="Directo" />
              </SortableHead>
              <SortableHead field="costoReferencia1" initialField={sortField} initialDir={sortDir} className={cn(headClass, CONTROL_DIRECTO_HEAD_BG)}>
                <TwoLineHead a="Costo" b="Referencia 1" />
              </SortableHead>
              <SortableHead field="costoReferencia2" initialField={sortField} initialDir={sortDir} className={cn(headClass, CONTROL_DIRECTO_HEAD_BG)}>
                <TwoLineHead a="Costo" b="Referencia 2" />
              </SortableHead>
              {ANALISIS_PRECIOS_LISTA_NUMBERS.map((n) => (
                <Fragment key={n}>
                  <SortableHead field={listaField(n)} initialField={sortField} initialDir={sortDir} className={cn(headClass, LISTA_HEAD_BG[n])}>
                    <TwoLineHead a="Lista" b={String(n)} />
                  </SortableHead>
                  <SortableHead field={pctField(n)} initialField={sortField} initialDir={sortDir} className={cn(headClass, LISTA_HEAD_BG[n])}>
                    <TwoLineHead a="%Rentab." b={`Lista ${n}`} />
                  </SortableHead>
                </Fragment>
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
              <CodigoRow key={r.codigo} r={r} listaNumbers={ANALISIS_PRECIOS_LISTA_NUMBERS} />
            ))}
          </TableBody>
        </table>
      </div>
      <PaginationControls page={page} totalPages={totalPages} totalCount={totalCount} />
    </div>
  );
}
