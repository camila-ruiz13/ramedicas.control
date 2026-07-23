import { PageHeaderSkeleton, KpiCardsSkeleton, DonutSkeleton, TableSkeleton } from "@/components/loading-skeletons";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeaderSkeleton />
      <KpiCardsSkeleton count={7} />
      <div className="grid gap-4 lg:grid-cols-2">
        <DonutSkeleton />
        <DonutSkeleton />
      </div>
      <TableSkeleton rows={8} cols={6} />
    </div>
  );
}
