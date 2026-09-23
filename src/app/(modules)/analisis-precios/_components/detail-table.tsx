import { Fragment } from "react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { ServerSearchInput } from "@/components/server-search-input";
import { SortableHead } from "@/components/sortable-head";
import { PaginationControls } from "@/components/pagination-controls";
import { cn } from "@/lib/utils";
import { fmtCOP } from "@/lib/autorizacion-compras-constants";
import {
  ANALISIS_PRECIOS_LISTA_NUMBERS,
  esSobrePrecioRegulado,
  esBajoCostoReferencia2,
  type AnalisisPrecioRow,
} from "@/lib/analisis-precios";

function fmtPct(v: number | null): string {
  return v === null ? "—" : `${v.toFixed(2)}%`;
}

function pctClass(v: number | null): string {
  return v !== null && v < 0 ? "text-red-600 dark:text-red-400" : "text-muted-foreground";
}

// Encabezados largos ("%Rentabilidad Lista 24") ensanchaban demasiado las
// columnas. whitespace-normal por sí solo dejaba que el wrap se solapara con
// la columna vecina (el ancho de columna en table-layout:auto no se puede
// forzar de forma confiable con max-width), y mezclar encabezados de una
// línea con otros de dos hacía que el texto de una columna cayera en la
// misma fila visual que la de al lado. Ahora TODOS los encabezados
// numéricos son de exactamente dos líneas (altura pareja, sin solapes).
const headClass = "text-right";
// Separador visual al inicio de cada grupo "Lista N" para distinguir dónde
// empieza cada lista dentro de las 7 columnas seguidas.
const groupStartClass = "border-l-2 border-border";

function TwoLineHead({ a, b }: { a: string; b: string }) {
  return (
    <span className="block leading-tight">
      <span className="block">{a}</span>
      <span className="block">{b}</span>
    </span>
  );
}

function fmtMoney(v: number | null): string {
  return v === null ? "—" : fmtCOP.format(v);
}

const listaField = (n: number) => `lista${n}` as keyof AnalisisPrecioRow;
const pctField = (n: number) => `pctLista${n}` as keyof AnalisisPrecioRow;

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
      <div className="overflow-x-auto rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHead field="codigo" initialField={sortField} initialDir={sortDir}>
                Código
              </SortableHead>
              <SortableHead field="precioRegulacion" initialField={sortField} initialDir={sortDir} className={headClass}>
                <TwoLineHead a="Precio" b="Regulación" />
              </SortableHead>
              <SortableHead field="costoReferencia1" initialField={sortField} initialDir={sortDir} className={headClass}>
                <TwoLineHead a="Costo" b="Referencia 1" />
              </SortableHead>
              <SortableHead field="costoReferencia2" initialField={sortField} initialDir={sortDir} className={headClass}>
                <TwoLineHead a="Costo" b="Referencia 2" />
              </SortableHead>
              {ANALISIS_PRECIOS_LISTA_NUMBERS.map((n) => (
                <Fragment key={n}>
                  <SortableHead field={listaField(n)} initialField={sortField} initialDir={sortDir} className={cn(headClass, groupStartClass)}>
                    <TwoLineHead a="Lista" b={String(n)} />
                  </SortableHead>
                  <SortableHead field={pctField(n)} initialField={sortField} initialDir={sortDir} className={headClass}>
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
              <TableRow key={r.codigo}>
                <TableCell
                  className="font-mono text-xs text-muted-foreground"
                  title={[r.descripcion, r.nombreComercial].filter(Boolean).join(" — ")}
                >
                  {r.codigo}
                </TableCell>
                <TableCell className="text-right font-mono">{fmtMoney(r.precioRegulacion)}</TableCell>
                <TableCell className="text-right font-mono">{fmtMoney(r.costoReferencia1)}</TableCell>
                <TableCell className="text-right font-mono">{fmtMoney(r.costoReferencia2)}</TableCell>
                {ANALISIS_PRECIOS_LISTA_NUMBERS.map((n) => {
                  const precioLista = r[listaField(n)] as number | null;
                  const alerta = esSobrePrecioRegulado(r, precioLista) || esBajoCostoReferencia2(r, precioLista);
                  return (
                    <Fragment key={n}>
                      <TableCell
                        className={cn(
                          "text-right font-mono",
                          groupStartClass,
                          alerta && "font-semibold text-red-600 dark:text-red-400",
                        )}
                      >
                        {fmtMoney(precioLista)}
                      </TableCell>
                      <TableCell className={cn("text-right font-mono text-xs", pctClass(r[pctField(n)] as number | null))}>
                        {fmtPct(r[pctField(n)] as number | null)}
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
