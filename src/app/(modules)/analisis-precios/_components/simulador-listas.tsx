"use client";

import { useMemo, useRef, useState } from "react";
import { Calculator, GripVertical, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fmtCOP } from "@/lib/autorizacion-compras-constants";
import { computeSugeridas } from "./shared";

function parseNum(v: string): number | null {
  const trimmed = v.trim();
  if (!trimmed) return null;
  const n = Number(trimmed.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function fmtPctSigned(pct: number): string {
  return `${pct > 0 ? "+" : ""}${pct}%`;
}

export type SimuladorCodigo = {
  codigo: string;
  nombreComercial: string;
  costoReferencia1: number | null;
  costoReferencia2: number | null;
  precioRegulacion: number | null;
  lista24: number | null;
};

// Ventana flotante (no modal): a pedido de Camila (2026-09-28) no debe
// oscurecer ni bloquear la tabla de atrás, y se puede arrastrar por el
// encabezado para dejarla al lado de la tabla mientras compara valores. Por
// eso no usa el componente <Dialog> compartido (ese trae overlay y bloquea
// el resto de la página) — es un panel fixed propio con arrastre a mano.
export function SimuladorListas({ codigos }: { codigos: SimuladorCodigo[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [costoRef1, setCostoRef1] = useState("");
  const [costoRef2, setCostoRef2] = useState("");
  const [controlDirecto, setControlDirecto] = useState("");
  // Lista 24 ya no se escribe directo — se calcula desde Costo Ref. 2 + este
  // % (a pedido de Camila, 2026-09-28: "Costo Ref 2 + porcentaje que ponga
  // es la Lista 24"). Al elegir un código real se precarga con el % que su
  // Lista 24 actual ya representa sobre su Costo Ref. 2, como punto de
  // partida para ajustar.
  const [porcentaje, setPorcentaje] = useState("");
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);

  const matches = useMemo(() => {
    const q = query.trim().toUpperCase();
    if (q.length < 2) return [];
    return codigos
      .filter((c) => c.codigo.toUpperCase().includes(q) || c.nombreComercial.toUpperCase().includes(q))
      .slice(0, 20);
  }, [query, codigos]);

  function seleccionar(c: SimuladorCodigo) {
    setQuery(`${c.codigo} — ${c.nombreComercial}`);
    setCostoRef1(c.costoReferencia1 !== null ? String(c.costoReferencia1) : "");
    setCostoRef2(c.costoReferencia2 !== null ? String(c.costoReferencia2) : "");
    setControlDirecto(c.precioRegulacion !== null ? String(c.precioRegulacion) : "");
    const impliedPct =
      c.costoReferencia2 !== null && c.costoReferencia2 !== 0 && c.lista24 !== null
        ? Math.round(((c.lista24 / c.costoReferencia2 - 1) * 100) * 100) / 100
        : null;
    setPorcentaje(impliedPct !== null ? String(impliedPct) : "");
    setDropdownOpen(false);
  }

  const nCostoRef2 = parseNum(costoRef2);
  const nPorcentaje = parseNum(porcentaje);
  const nControlDirecto = parseNum(controlDirecto);
  const hayTope = nControlDirecto !== null && nControlDirecto > 0;

  const lista24Crudo = nCostoRef2 !== null && nPorcentaje !== null ? nCostoRef2 * (1 + nPorcentaje / 100) : null;
  const lista24TopeAplicado = hayTope && lista24Crudo !== null && lista24Crudo > nControlDirecto;
  const lista24Valor = lista24TopeAplicado ? nControlDirecto : lista24Crudo;

  const resultados = computeSugeridas(nCostoRef2, lista24Valor, nControlDirecto);
  const algunTopeAplicado = lista24TopeAplicado || resultados.some((r) => r.topeAplicado);

  function limpiar() {
    setQuery("");
    setCostoRef1("");
    setCostoRef2("");
    setControlDirecto("");
    setPorcentaje("");
    setDropdownOpen(false);
  }

  function onDragMove(e: MouseEvent) {
    const start = dragRef.current;
    if (!start) return;
    setPos({ x: start.origX + (e.clientX - start.startX), y: start.origY + (e.clientY - start.startY) });
  }
  function onDragEnd() {
    dragRef.current = null;
    window.removeEventListener("mousemove", onDragMove);
    window.removeEventListener("mouseup", onDragEnd);
  }
  function onDragStart(e: React.MouseEvent) {
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y };
    window.addEventListener("mousemove", onDragMove);
    window.addEventListener("mouseup", onDragEnd);
  }

  function cerrar() {
    setOpen(false);
    setPos({ x: 0, y: 0 });
  }

  return (
    <>
      <Button variant="outline" size="sm" className="gap-2" onClick={() => setOpen(true)}>
        <Calculator className="size-4" />
        Simular
      </Button>

      {open && (
        <div
          className="fixed top-20 right-6 z-50 w-[460px] rounded-xl border bg-card shadow-2xl"
          style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
        >
          <div
            className="flex cursor-move items-center justify-between rounded-t-xl border-b bg-muted/50 px-4 py-2 select-none"
            onMouseDown={onDragStart}
          >
            <div className="flex items-center gap-2 text-sm font-semibold">
              <GripVertical className="size-4 text-muted-foreground" />
              Simulador de listas
            </div>
            <button type="button" onClick={cerrar} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
              <X className="size-4" />
            </button>
          </div>

          <div className="flex flex-col gap-3 p-4">
            <p className="text-xs text-muted-foreground">
              Busca un código para traer sus datos, o escribe Costo Referencia 2 y el % directamente. Lista 24 = Costo
              Referencia 2 × (1 + %).
            </p>

            <div className="relative flex flex-col gap-1.5">
              <Label htmlFor="sim-buscar">Código</Label>
              <Input
                id="sim-buscar"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setDropdownOpen(true);
                }}
                onFocus={() => setDropdownOpen(true)}
                placeholder="Buscar código o nombre comercial..."
                autoComplete="off"
              />
              {dropdownOpen && matches.length > 0 && (
                <div className="absolute top-full z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border bg-card shadow-md">
                  {matches.map((c) => (
                    <button
                      key={c.codigo}
                      type="button"
                      className="flex w-full flex-col items-start gap-0.5 px-3 py-1.5 text-left text-sm hover:bg-muted"
                      onClick={() => seleccionar(c)}
                    >
                      <span className="font-mono text-xs text-muted-foreground">{c.codigo}</span>
                      <span className="truncate">{c.nombreComercial || "—"}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="sim-costoref1">Costo Ref. 1</Label>
                <Input
                  id="sim-costoref1"
                  inputMode="decimal"
                  value={costoRef1}
                  onChange={(e) => setCostoRef1(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="sim-costoref2">Costo Ref. 2</Label>
                <Input
                  id="sim-costoref2"
                  inputMode="decimal"
                  value={costoRef2}
                  onChange={(e) => setCostoRef2(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="sim-control-directo">Control Directo</Label>
                <Input
                  id="sim-control-directo"
                  inputMode="decimal"
                  value={controlDirecto}
                  onChange={(e) => setControlDirecto(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="sim-porcentaje">Porcentaje (Lista 24)</Label>
                <Input
                  id="sim-porcentaje"
                  inputMode="decimal"
                  value={porcentaje}
                  onChange={(e) => setPorcentaje(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>

            {algunTopeAplicado && (
              <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400">
                Algunas listas quedaron topadas a Control Directo — la meta cruda las pasaba.
              </p>
            )}

            <div className="overflow-hidden rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="p-2 text-left font-medium">Lista</th>
                    <th className="p-2 text-right font-medium">%</th>
                    <th className="p-2 text-right font-medium">Precio simulado</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t bg-sky-500/5">
                    <td className="p-2 font-medium">Lista 24</td>
                    <td className="p-2 text-right font-mono text-xs text-muted-foreground">
                      {nPorcentaje !== null ? fmtPctSigned(nPorcentaje) : "—"}
                    </td>
                    <td
                      className={
                        lista24TopeAplicado
                          ? "p-2 text-right font-mono font-semibold text-red-600 dark:text-red-400"
                          : "p-2 text-right font-mono font-semibold"
                      }
                    >
                      {lista24Valor !== null ? fmtCOP.format(lista24Valor) : "—"}
                    </td>
                  </tr>
                  {resultados.map((r) => (
                    <tr key={r.lista} className="border-t">
                      <td className="p-2 font-medium">Lista {r.lista}</td>
                      <td className="p-2 text-right font-mono text-xs text-muted-foreground">{fmtPctSigned(r.pct)}</td>
                      <td
                        className={
                          r.topeAplicado
                            ? "p-2 text-right font-mono font-semibold text-red-600 dark:text-red-400"
                            : "p-2 text-right font-mono font-semibold"
                        }
                      >
                        {r.valor !== null ? fmtCOP.format(r.valor) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={limpiar}>
                Limpiar
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
