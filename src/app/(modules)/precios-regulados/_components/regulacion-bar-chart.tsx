"use client";

import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

export type DrilldownBar = { label: string; value: number; fill: string };

// Gráfica de barras en cascada, a pedido de Camila (2026-07-29): primero
// muestra el universo completo del portafolio partido en Regulados/No
// regulados, y al hacer clic en "Regulados" baja al desglose fino (Nuevo,
// Subió, Bajó, etc. — o Por encima/Por debajo/Descontinuado, según la
// pestaña). Se agrega aparte de la dona y las KPI cards que ya existían, no
// las reemplaza.
export function RegulacionBarChart({ nivel0, nivel1 }: { nivel0: DrilldownBar[]; nivel1: DrilldownBar[] }) {
  const [drill, setDrill] = useState(false);
  const data = drill ? nivel1 : nivel0;
  const manyBars = data.length > 4;

  if (data.length === 0) {
    return (
      <div className="flex h-52 items-center justify-center text-sm text-muted-foreground">
        Sin datos
      </div>
    );
  }

  const config: ChartConfig = Object.fromEntries(data.map((d) => [d.label, { label: d.label, color: d.fill }]));

  return (
    <div className="flex flex-col gap-2">
      {drill ? (
        <button
          type="button"
          onClick={() => setDrill(false)}
          className="flex w-fit items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-3.5" />
          Todos los artículos
        </button>
      ) : (
        <p className="text-xs text-muted-foreground">Clic en &quot;Control directo&quot; para ver el desglose.</p>
      )}
      <ChartContainer config={config} className="aspect-auto h-52 w-full">
        <BarChart data={data} margin={{ left: 4, right: 12 }}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            fontSize={11}
            interval={0}
            angle={manyBars ? -25 : 0}
            textAnchor={manyBars ? "end" : "middle"}
            height={manyBars ? 56 : 30}
          />
          <YAxis tickLine={false} axisLine={false} width={40} allowDecimals={false} />
          <ChartTooltip content={<ChartTooltipContent hideLabel />} />
          <Bar
            dataKey="value"
            radius={[4, 4, 0, 0]}
            cursor={!drill ? "pointer" : "default"}
            onClick={(entry) => {
              if (!drill && entry && (entry as { label?: string }).label === "Control directo") setDrill(true);
            }}
          >
            {data.map((d) => (
              <Cell key={d.label} fill={d.fill} />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
    </div>
  );
}
