import { Card, CardContent } from "@/components/ui/card";
import { fmtNum } from "@/lib/cambios-precios-constants";
import { ESTADO_ORDER, ESTADO_LABELS, ESTADO_COLORS, type Estado } from "@/lib/prorroga-proveedores-constants";

export function KpiCards({ total, conteo }: { total: number; conteo: Record<Estado, number> }) {
  const items = [
    { label: "Total", value: total, color: undefined },
    ...ESTADO_ORDER.filter((e) => e !== "OTRO").map((estado) => ({
      label: ESTADO_LABELS[estado],
      value: conteo[estado],
      color: ESTADO_COLORS[estado],
    })),
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-7">
      {items.map((item) => (
        <Card key={item.label} style={item.color ? { borderTopColor: item.color, borderTopWidth: 3 } : undefined}>
          <CardContent className="flex flex-col items-center gap-1 py-4 text-center">
            <span className="text-2xl font-bold">{fmtNum.format(item.value)}</span>
            <span className="text-xs text-muted-foreground">{item.label}</span>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
