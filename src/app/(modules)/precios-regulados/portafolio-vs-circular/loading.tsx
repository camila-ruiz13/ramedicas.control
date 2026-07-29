import { PageHeaderSkeleton, DonutSkeleton } from "@/components/loading-skeletons";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeaderSkeleton />
      <div className="h-9 rounded-lg border bg-card" />
      <DonutSkeleton />
    </div>
  );
}
