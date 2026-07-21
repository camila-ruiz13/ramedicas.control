import { Card, CardContent } from "@/components/ui/card";
import { fmtCOP, fmtNum, fmtPct } from "@/lib/autorizacion-compras-constants";
import { cn } from "@/lib/utils";

export function AutorizacionKpiCards({
  count,
  totalCosto,
  totalLista,
  totalDif,
  porEncima,
  porDebajo,
  avgPct,
  proveedoresActivos,
}: {
  count: number;
  totalCosto: number;
  totalLista: number;
  totalDif: number;
  porEncima: number;
  porDebajo: number;
  avgPct: number;
  proveedoresActivos: number;
}) {
  const items = [
    {
      label: "Autorizaciones",
      value: fmtNum.format(count),
      foot: `${porEncima} por encima · ${porDebajo} por debajo`,
    },
    { label: "Costo autorizado", value: fmtCOP.format(totalCosto), foot: "Suma de costo de orden" },
    { label: "Costo lista (portafolio)", value: fmtCOP.format(totalLista), foot: "Valor de referencia" },
    {
      label: "Diferencia neta",
      value: fmtCOP.format(totalDif),
      className: totalDif >= 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400",
      foot: totalDif >= 0 ? "Sobrecosto neto" : "Ahorro neto",
    },
    {
      label: "Proveedores activos",
      value: fmtNum.format(proveedoresActivos),
      foot: `Desviación prom. ${fmtPct(avgPct)}`,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
      {items.map((item) => (
        <Card key={item.label}>
          <CardContent className="flex flex-col items-center gap-1 py-4 text-center">
            <span className={cn("text-2xl font-bold", item.className)}>{item.value}</span>
            <span className="text-xs text-muted-foreground">{item.label}</span>
            <span className="text-[11px] text-muted-foreground/70">{item.foot}</span>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
