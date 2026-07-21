import { fmtCOP } from "@/lib/autorizacion-compras-constants";
import type { ProviderRanking } from "@/lib/autorizacion-compras";

export function ProviderRankingList({ rows }: { rows: ProviderRanking[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">Sin datos para este filtro.</p>;
  }

  const max = Math.max(1, ...rows.map((r) => r.ahorro + r.sobrecosto));

  return (
    <div className="flex flex-col">
      {rows.map((r) => {
        const total = r.ahorro + r.sobrecosto;
        const ahorroPct = total ? (r.ahorro / max) * 100 : 0;
        const sobrecostoPct = total ? (r.sobrecosto / max) * 100 : 0;
        return (
          <div key={r.proveedor} className="min-w-0 border-b py-2 last:border-0">
            <div className="mb-1.5 flex items-baseline justify-between gap-2 text-sm">
              <span className="min-w-0 truncate font-semibold">{r.proveedor}</span>
              <span className="shrink-0 font-mono text-xs text-muted-foreground">
                {fmtCOP.format(r.neto)}
              </span>
            </div>
            <div className="flex h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-emerald-500" style={{ width: `${ahorroPct}%` }} />
              <div className="h-full bg-red-500" style={{ width: `${sobrecostoPct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
