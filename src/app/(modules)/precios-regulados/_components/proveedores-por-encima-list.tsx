"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { fmtCOP } from "@/lib/autorizacion-compras-constants";
import type { ProveedorPorEncima } from "@/lib/precios-regulados";
import { fmtPctSigned, computeEnvioEstadoProveedor, type CodigoEnvioInfo } from "@/lib/precios-regulados-constants";

// El ranking sigue el filtro activo (ver page.tsx: se calcula sobre las
// filas ya filtradas) — no siempre son sobrecostos, así que el signo puede
// ser negativo (ej. filtrando "Por debajo del precio regulado"). +prefijo
// solo cuando es positivo, fmtCOP ya antepone "-" cuando es negativo.
function fmtSigned(n: number): string {
  return n > 0 ? `+${fmtCOP.format(n)}` : fmtCOP.format(n);
}

type EnvioEstado = { label: string; textClassName: string };

// Etiqueta/color a nivel de proveedor (texto plano en frente del nombre en
// la lista) — a pedido de Camila (2026-08-11), el estado se resuelve por
// NIT, no por código puntual: si a ese NIT ya se le avisó (según la hoja
// "proveedores"), TODOS sus productos de control directo cuentan como
// enviados, aunque el código específico no esté listado ahí. El cálculo en
// sí vive en computeEnvioEstadoProveedor (compartido con la torta de
// page.tsx, para no divergir en el criterio de conteo).
function computeEnvioEstado(
  productos: ProveedorPorEncima["productos"],
  codigoEnvioInfo: Record<string, CodigoEnvioInfo>,
): EnvioEstado {
  const { bucket, enviados, conDato } = computeEnvioEstadoProveedor(
    productos.map((p) => p.codigo),
    codigoEnvioInfo,
  );
  switch (bucket) {
    case "SIN_DATO":
      return { label: "Sin dato", textClassName: "text-slate-500 dark:text-slate-400" };
    case "ENVIADO":
      return { label: "Enviado", textClassName: "text-emerald-600 dark:text-emerald-400" };
    case "NO_ENVIADO":
      return { label: "No", textClassName: "text-red-600 dark:text-red-400" };
    case "PARCIAL":
      return { label: `Parcial (${enviados}/${conDato})`, textClassName: "text-amber-600 dark:text-amber-400" };
  }
}

// Mismo patrón que ProviderTable en el módulo Proveedores: clic en la fila
// abre un Dialog con el detalle, en vez de desplegar/apilar contenido en la
// misma tarjeta.
export function ProveedoresPorEncimaList({
  groups,
  codigoEnvioInfo,
}: {
  groups: ProveedorPorEncima[];
  codigoEnvioInfo: Record<string, CodigoEnvioInfo>;
}) {
  const [selected, setSelected] = useState<ProveedorPorEncima | null>(null);

  if (groups.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-center text-sm text-muted-foreground">
        Ningún proveedor tiene productos por encima del precio de control directo.
      </div>
    );
  }

  const max = Math.max(...groups.map((g) => g.count));

  return (
    <>
      <div className="flex max-h-[280px] flex-col overflow-y-auto">
        {groups.map((g) => {
          const pct = (g.count / max) * 100;
          const envioEstado = computeEnvioEstado(g.productos, codigoEnvioInfo);
          return (
            <button
              key={g.proveedor}
              type="button"
              onClick={() => setSelected(g)}
              className="flex w-full items-center gap-3 border-b py-2.5 text-left last:border-0 hover:bg-muted/40"
            >
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
                  <span className="min-w-0 truncate font-medium">
                    <span className={cn("mr-1.5 font-semibold", envioEstado.textClassName)}>{envioEstado.label}</span>
                    {g.proveedor}
                  </span>
                  <span className="shrink-0 font-mono text-xs text-muted-foreground">
                    {fmtSigned(g.sobrecostoTotal)}
                    {g.pctPromedio !== null && ` (${fmtPctSigned(g.pctPromedio)})`}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-red-500" style={{ width: `${pct}%` }} />
                </div>
              </div>
              <span className="flex shrink-0 items-center gap-1 rounded-full bg-red-500/15 py-0.5 pr-2 pl-1.5 text-xs font-semibold text-red-700 dark:text-red-400">
                <Plus className="size-3" />
                {g.count}
              </span>
            </button>
          );
        })}
      </div>

      <Dialog open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-4xl sm:max-w-4xl">
          {selected && (
            <>
              <DialogHeader className="-mx-4 -mt-4 border-b px-5 pt-4 pb-3">
                <DialogTitle>{selected.proveedor}</DialogTitle>
                <DialogDescription>
                  {selected.count} productos — diferencia acumulada vs. circular 22{" "}
                  <span
                    className={cn(
                      "font-mono font-semibold",
                      selected.sobrecostoTotal > 0 && "text-red-600 dark:text-red-400",
                      selected.sobrecostoTotal < 0 && "text-emerald-600 dark:text-emerald-400",
                    )}
                  >
                    {fmtSigned(selected.sobrecostoTotal)}
                  </span>
                </DialogDescription>
              </DialogHeader>
              <div className="max-h-[28rem] overflow-y-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-card">
                    <tr className="text-xs text-muted-foreground">
                      <th className="p-2.5 text-left font-medium">Producto</th>
                      <th className="p-2.5 text-left font-medium">Descontinuado</th>
                      <th className="p-2.5 text-right font-medium">Costo (portafolio)</th>
                      <th className="p-2.5 text-right font-medium">Precio circular 22</th>
                      <th className="p-2.5 text-right font-medium">Diferencia</th>
                      <th className="p-2.5 text-right font-medium">% cambio</th>
                      <th className="p-2.5 text-right font-medium">Precio anterior</th>
                      <th className="p-2.5 text-right font-medium">Precio nuevo</th>
                      <th className="p-2.5 text-right font-medium">% bajó</th>
                      <th className="p-2.5 text-left font-medium">Enviado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.productos.map((p) => {
                      const info = codigoEnvioInfo[p.codigo];
                      return (
                        <tr key={p.codigo} className="border-t">
                          <td className="min-w-0 max-w-56 truncate p-2.5" title={p.nombreComercial || p.principioActivo}>
                            <span className="font-mono text-xs text-muted-foreground">{p.codigo}</span>{" "}
                            {p.nombreComercial || p.principioActivo || "—"}
                          </td>
                          <td className="p-2.5">
                            {p.descontinuado ? (
                              <Badge variant="outline" className="border-none bg-amber-500/15 text-amber-700 dark:text-amber-400">
                                Sí
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">No</span>
                            )}
                          </td>
                          <td className="p-2.5 text-right font-mono">
                            {p.costo === null ? "—" : fmtCOP.format(p.costo)}
                          </td>
                          <td className="p-2.5 text-right font-mono">
                            {p.precioCircular22 !== null
                              ? fmtCOP.format(p.precioCircular22)
                              : (p.circular22Comentario ?? "—")}
                          </td>
                          <td
                            className={cn(
                              "p-2.5 text-right font-mono font-medium",
                              p.diferencia !== null && p.diferencia > 0 && "text-red-600 dark:text-red-400",
                              p.diferencia !== null && p.diferencia < 0 && "text-emerald-600 dark:text-emerald-400",
                            )}
                          >
                            {p.diferencia !== null ? fmtSigned(p.diferencia) : "—"}
                          </td>
                          <td
                            className={cn(
                              "p-2.5 text-right font-mono font-medium",
                              p.pctCambio !== null && p.pctCambio < 0 && "text-red-600 dark:text-red-400",
                              p.pctCambio !== null && p.pctCambio > 0 && "text-emerald-600 dark:text-emerald-400",
                            )}
                          >
                            {p.pctCambio !== null ? fmtPctSigned(p.pctCambio) : "—"}
                          </td>
                          <td className="p-2.5 text-right font-mono">
                            {info?.precioAnterior != null ? fmtCOP.format(info.precioAnterior) : "—"}
                          </td>
                          <td className="p-2.5 text-right font-mono">
                            {info?.precioNuevo != null ? fmtCOP.format(info.precioNuevo) : "—"}
                          </td>
                          <td
                            className={cn(
                              "p-2.5 text-right font-mono font-medium",
                              info?.pctBajo != null && info.pctBajo > 0 && "text-emerald-600 dark:text-emerald-400",
                              info?.pctBajo != null && info.pctBajo < 0 && "text-red-600 dark:text-red-400",
                            )}
                          >
                            {info?.pctBajo != null ? fmtPctSigned(info.pctBajo) : "—"}
                          </td>
                          <td className="p-2.5">
                            {info?.enviado != null ? (
                              <Badge
                                variant="outline"
                                className={cn(
                                  "border-none",
                                  info.enviado
                                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                                    : "bg-red-500/15 text-red-700 dark:text-red-400",
                                )}
                              >
                                {info.enviado ? "Enviado" : "No enviado"}
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <DialogFooter>
                <DialogClose render={<Button variant="outline" />}>Cerrar</DialogClose>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
