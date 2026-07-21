import { Truck } from "lucide-react";
import { requireModuleView, canInteract } from "@/lib/permissions";
import { getFase1AllProviders, summarizeStatus, applyStatusFilter } from "@/lib/proveedores";
import { parsePageParams, paginate } from "@/lib/pagination";
import { MODULE_COLOR_CLASSES } from "@/lib/modules";
import { ProveedoresSubNav } from "./_components/sub-nav";
import { SyncForm } from "./_components/sync-form";
import { KpiCards } from "./_components/kpi-cards";
import { StatusDonut } from "./_components/status-donut";
import { ProviderTable } from "./_components/provider-table";

export default async function ProveedoresPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const profile = await requireModuleView("proveedores");
  const sp = await searchParams;
  const params = parsePageParams(sp, { defaultSort: "pct", pageSize: 20 });
  const filterValue = (Array.isArray(sp.filter) ? sp.filter[0] : sp.filter) ?? "all";

  const all = await getFase1AllProviders();
  const filtered = applyStatusFilter(all, filterValue);
  const { rows, page, totalCount, totalPages } = paginate(filtered, params, ["proveedor"]);
  const summary = summarizeStatus(all);
  const colors = MODULE_COLOR_CLASSES.amber;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className={`flex size-10 items-center justify-center rounded-xl ${colors.badge}`}>
          <Truck className={`size-5 ${colors.icon}`} />
        </div>
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            Cumplimiento Documental — Primera Fase
          </h1>
          <p className="text-muted-foreground">Documentación legal y administrativa por proveedor.</p>
        </div>
      </div>

      <ProveedoresSubNav />

      {canInteract(profile, "proveedores") && <SyncForm />}

      <KpiCards
        totalProveedores={summary.totalProveedores}
        avgPct={summary.avgPct}
        completos={summary.completos}
        criticos={summary.criticos}
      />

      <div className="grid items-start gap-4 lg:grid-cols-[300px_1fr]">
        <div className="rounded-xl border bg-card p-4">
          <h3 className="mb-2 text-sm font-semibold">Estado global de todos los documentos</h3>
          <StatusDonut counts={summary.overall} />
        </div>
        <ProviderTable
          providers={rows}
          page={page}
          totalPages={totalPages}
          totalCount={totalCount}
          search={params.search}
          sortField={params.sortField}
          sortDir={params.sortDir}
          filterValue={filterValue}
        />
      </div>
    </div>
  );
}
