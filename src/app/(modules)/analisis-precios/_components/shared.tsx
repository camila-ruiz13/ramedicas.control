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

// Contenedor de scroll con encabezado fijo, para las 5 tablas del módulo
// (2026-09-28, a pedido de Camila: 100 filas por página con scroll interno
// en vez de crecer la página, y el encabezado "inmovilizado" al bajar).
//
// OJO: no se usa el componente <Table> compartido (@/components/ui/table)
// para el <table> en sí — Table envuelve el <table> en su PROPIO div con
// overflow-x-auto, y anidar ese wrapper dentro de este contenedor rompe
// position:sticky en el thead (el wrapper interno de Table termina siendo,
// por cómo se computa overflow-x/y, el "ancestro con scroll" más cercano
// para efectos de sticky, pero nunca se desborda él mismo porque no tiene
// alto propio — el sticky queda inerte). Se usa <table> plano en su lugar,
// con la misma clase que trae el componente Table, para no perder nada de
// estilo. TableHeader/TableBody/TableRow/TableHead/TableCell sí se siguen
// usando normalmente, esos no traen ese wrapper.
export const SCROLL_CONTAINER_CLASS = "max-h-[65vh] overflow-auto rounded-xl border bg-card";
export const STICKY_HEAD_CLASS = "sticky top-0 z-20 bg-card";
export const RAW_TABLE_CLASS = "w-full caption-bottom text-sm";

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

// Metas fijas confirmadas por Camila (2026-09-28) — mismas que ya usa el
// cálculo real de %Rentabilidad en la tabla (ver pctLista1VsCosto y
// pctVsLista24 en analisis-precios.ts), en sentido inverso: en vez de
// calcular el % a partir del precio real de cada lista, se parte de la meta
// para simular qué precio debería tener. Único origen de esta lógica —
// tanto el simulador (SimuladorListas) como el "+" de cada código en la
// tabla (CodigoRow) llaman a computeSugeridas en vez de tener su propia
// copia de las metas.
export const METAS = [
  { lista: 1, base: "costoRef2" as const, pct: 16 },
  { lista: 2, base: "lista24" as const, pct: -1 },
  { lista: 3, base: "lista24" as const, pct: 2 },
  { lista: 6, base: "lista24" as const, pct: 4 },
  { lista: 7, base: "lista24" as const, pct: 15 },
  { lista: 9, base: "lista24" as const, pct: 2 },
];

export type Sugerida = (typeof METAS)[number] & { valor: number | null; topeAplicado: boolean };

// Ninguna lista puede vender por encima de Control Directo (misma regla que
// ya aplica la alerta "Listas por encima del Precio Regulación") — el
// sugerido no es la excepción: si la meta cruda supera el tope, el valor
// que se muestra queda recortado a Control Directo, no el número inválido
// (corregido 2026-09-28, a pedido de Camila — antes solo se marcaba en rojo
// sin ajustar el valor). controlDirecto en 0/null = artículo no regulado,
// no "regulado a $0" — mismo criterio que esSobrePrecioRegulado en
// analisis-precios.ts.
export function computeSugeridas(
  costoRef2: number | null,
  lista24: number | null,
  controlDirecto: number | null,
): Sugerida[] {
  const hayTope = controlDirecto !== null && controlDirecto > 0;
  return METAS.map((m) => {
    const base = m.base === "costoRef2" ? costoRef2 : lista24;
    const crudo = base !== null ? base * (1 + m.pct / 100) : null;
    const topeAplicado = hayTope && crudo !== null && crudo > controlDirecto;
    const valor = topeAplicado ? controlDirecto : crudo;
    return { ...m, valor, topeAplicado };
  });
}
