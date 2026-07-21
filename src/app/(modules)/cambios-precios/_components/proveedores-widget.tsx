import { fmtNum } from "@/lib/cambios-precios-constants";
import type { ProviderCount } from "@/lib/cambios-precios";

export function ProveedoresWidget({ rows }: { rows: ProviderCount[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">Sin datos para mostrar</p>;
  }
  const max = Math.max(...rows.map((r) => r.count));

  return (
    <div className="flex flex-col gap-2.5">
      {rows.map((r) => (
        <div key={r.proveedor}>
          <div className="mb-1 flex items-baseline justify-between gap-2 text-xs">
            <span className="truncate font-medium">{r.proveedor}</span>
            <span className="shrink-0 text-muted-foreground">{fmtNum.format(r.count)}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-red-500"
              style={{ width: `${(r.count / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
