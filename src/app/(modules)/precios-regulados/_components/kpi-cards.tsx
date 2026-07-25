import { Card, CardContent } from "@/components/ui/card";
import { fmtNum } from "@/lib/cambios-precios-constants";
import { CAMBIO_ORDER, CAMBIO_LABELS, CAMBIO_COLORS, type CambioRegulacion } from "@/lib/precios-regulados-constants";

export function KpiCards({ total, conteo }: { total: number; conteo: Record<CambioRegulacion, number> }) {
  const items = [
    { label: "Total regulados", value: total, color: undefined },
    ...CAMBIO_ORDER.map((cambio) => ({
      label: CAMBIO_LABELS[cambio],
      value: conteo[cambio],
      color: CAMBIO_COLORS[cambio],
    })),
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
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
