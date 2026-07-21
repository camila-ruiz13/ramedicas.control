import { Card, CardContent } from "@/components/ui/card";
import { fmtNum, fmtPct } from "@/lib/cambios-precios-constants";

export function MiniKpis({
  total,
  pctDelTotal,
  proveedores,
  variacionPromedio,
}: {
  total: number;
  pctDelTotal: number;
  proveedores: number;
  variacionPromedio: number | null;
}) {
  const items = [
    { label: "Registros en este filtro", value: fmtNum.format(total) },
    { label: "% del total general", value: `${pctDelTotal}%` },
    { label: "Proveedores involucrados", value: fmtNum.format(proveedores) },
    {
      label: "Variación promedio (aumento/disminución)",
      value: variacionPromedio === null ? "—" : fmtPct(variacionPromedio),
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label}>
          <CardContent className="py-3">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {item.label}
            </div>
            <div className="text-xl font-bold">{item.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
