import { Card, CardContent } from "@/components/ui/card";
import { fmtNum } from "@/lib/cambios-precios-constants";

export function KpiCardsPredevoluciones({
  unidadesDevueltas,
  registros,
  codigosDistintos,
  proveedoresActivos,
}: {
  unidadesDevueltas: number;
  registros: number;
  codigosDistintos: number;
  proveedoresActivos: number;
}) {
  const items = [
    { label: "Unidades devueltas", value: fmtNum.format(unidadesDevueltas) },
    { label: "Registros", value: fmtNum.format(registros) },
    { label: "Códigos distintos", value: fmtNum.format(codigosDistintos) },
    { label: "Proveedores con devoluciones", value: fmtNum.format(proveedoresActivos) },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label}>
          <CardContent className="flex flex-col items-center gap-1 py-4 text-center">
            <span className="text-2xl font-bold">{item.value}</span>
            <span className="text-xs text-muted-foreground">{item.label}</span>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
