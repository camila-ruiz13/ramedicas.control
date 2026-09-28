import { fmtCOP } from "@/lib/autorizacion-compras-constants";
import type { AnalisisPrecioRow } from "@/lib/analisis-precios";

// Compartido entre DetailTable y las tablas de alerta que muestran columnas
// por lista (2026-09-28), para que ambas usen exactamente los mismos
// colores/formato en vez de mantener dos copias que se puedan desincronizar.

export function fmtMoney(v: number | null): string {
  return v === null ? "—" : fmtCOP.format(v);
}

export const listaField = (n: number) => `lista${n}` as keyof AnalisisPrecioRow;
export const pctField = (n: number) => `pctLista${n}` as keyof AnalisisPrecioRow;

export const headClass = "text-right";

// Color pastel SOLO en el encabezado de cada grupo (2026-09-24, a pedido de
// Camila — el primer intento coloreaba también las celdas y quedó muy
// cargado): un color para "Control Directo" y uno distinto por cada Lista.
// Opacidad muy baja (/6) para que quede apenas insinuado; mismos tonos que
// ya usa el resto de la app en MODULE_COLOR_CLASSES.
export const CONTROL_DIRECTO_HEAD_BG = "bg-sky-500/6";
export const LISTA_HEAD_BG: Record<number, string> = {
  24: "bg-violet-500/6",
  1: "bg-rose-500/6",
  2: "bg-amber-500/6",
  3: "bg-emerald-500/6",
  6: "bg-cyan-500/6",
  7: "bg-fuchsia-500/6",
  9: "bg-teal-500/6",
};

export function TwoLineHead({ a, b }: { a: string; b: string }) {
  return (
    <span className="block leading-tight">
      <span className="block">{a}</span>
      <span className="block">{b}</span>
    </span>
  );
}
