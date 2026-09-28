"use client";

import { Fragment, useState } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import { TableRow, TableCell } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { esSobrePrecioRegulado, esBajoCostoReferencia2 } from "@/lib/analisis-precios-shared";
import type { AnalisisPrecioRow } from "@/lib/analisis-precios";
import { fmtMoney, listaField, pctField, computeSugeridas } from "./shared";

function fmtPct(v: number | null): string {
  return v === null ? "—" : `${v.toFixed(2)}%`;
}

function pctClass(v: number | null): string {
  return v !== null && v < 0 ? "text-red-600 dark:text-red-400" : "text-muted-foreground";
}

// Fila con un "+" que despliega, debajo de la misma fila, las listas
// sugeridas para ese código (misma lógica/metas que SimuladorListas, vía
// computeSugeridas) — a pedido de Camila (2026-09-28), para ver de un
// vistazo qué debería valer cada lista sin tener que abrir el simulador y
// buscar el código a mano.
export function CodigoRow({
  r,
  listaNumbers,
}: {
  r: AnalisisPrecioRow;
  listaNumbers: readonly number[];
}) {
  const [expanded, setExpanded] = useState(false);
  const sugeridas = computeSugeridas(r.costoReferencia2, r.lista24, r.precioRegulacion);
  const sugeridaPorLista = new Map(sugeridas.map((s) => [s.lista, s]));

  return (
    <Fragment>
      <TableRow>
        <TableCell
          className="font-mono text-xs text-muted-foreground"
          title={[r.descripcion, r.nombreComercial].filter(Boolean).join(" — ")}
        >
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            aria-label={expanded ? "Ocultar listas sugeridas" : "Ver listas sugeridas"}
            className="mr-1 inline-flex size-4 items-center justify-center rounded align-middle hover:bg-muted"
          >
            {expanded ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
          </button>
          {r.codigo}
        </TableCell>
        <TableCell className="text-right font-mono">{fmtMoney(r.precioRegulacion)}</TableCell>
        <TableCell className="text-right font-mono">{fmtMoney(r.costoReferencia1)}</TableCell>
        <TableCell className="text-right font-mono">{fmtMoney(r.costoReferencia2)}</TableCell>
        {listaNumbers.map((n) => {
          const precioLista = r[listaField(n)] as number | null;
          const alerta = esSobrePrecioRegulado(r, precioLista) || esBajoCostoReferencia2(r, precioLista);
          return (
            <Fragment key={n}>
              <TableCell className={cn("text-right font-mono", alerta && "font-semibold text-red-600 dark:text-red-400")}>
                {fmtMoney(precioLista)}
              </TableCell>
              <TableCell className={cn("text-right font-mono text-xs", pctClass(r[pctField(n)] as number | null))}>
                {fmtPct(r[pctField(n)] as number | null)}
              </TableCell>
            </Fragment>
          );
        })}
      </TableRow>
      {expanded && (
        <TableRow className="bg-emerald-500/5 hover:bg-emerald-500/5">
          <TableCell className="text-xs font-medium text-muted-foreground">Sugerido</TableCell>
          <TableCell className="text-right text-xs text-muted-foreground">—</TableCell>
          <TableCell className="text-right text-xs text-muted-foreground">—</TableCell>
          <TableCell className="text-right text-xs text-muted-foreground">—</TableCell>
          {listaNumbers.map((n) => {
            const s = sugeridaPorLista.get(n);
            if (!s) {
              // Lista 24 no tiene sugerida propia — es la base contra la que
              // se calculan las demás, no algo que este panel proponga.
              return (
                <Fragment key={n}>
                  <TableCell className="text-right text-xs text-muted-foreground">—</TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">—</TableCell>
                </Fragment>
              );
            }
            const precioReal = r[listaField(n)] as number | null;
            // Redondeado al peso para no marcar en rojo por ruido de punto
            // flotante — a pedido de Camila (2026-09-28): si el precio real
            // no coincide con el sugerido (ya topado a Control Directo si
            // aplicaba), se resalta.
            const noCoincide =
              s.valor !== null && precioReal !== null && Math.round(s.valor) !== Math.round(precioReal);
            const enRojo = noCoincide || s.topeAplicado;
            return (
              <Fragment key={n}>
                <TableCell
                  className={cn("text-right font-mono text-xs", enRojo ? "font-semibold text-red-600 dark:text-red-400" : "text-foreground")}
                  title={s.topeAplicado ? "Topado a Control Directo" : undefined}
                >
                  {s.valor !== null ? fmtMoney(s.valor) : "—"}
                </TableCell>
                <TableCell className="text-right font-mono text-[10px] text-muted-foreground">
                  {s.pct > 0 ? `+${s.pct}` : s.pct}%
                </TableCell>
              </Fragment>
            );
          })}
        </TableRow>
      )}
    </Fragment>
  );
}
