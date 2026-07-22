import { PageHeaderSkeleton, KpiCardsSkeleton, DonutSkeleton } from "@/components/loading-skeletons";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeaderSkeleton />
      <div className="h-16 rounded-xl border bg-card" />
      <KpiCardsSkeleton count={4} />
      <DonutSkeleton />
    </div>
  );
}
