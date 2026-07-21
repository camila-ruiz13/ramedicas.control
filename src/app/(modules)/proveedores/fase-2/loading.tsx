import { Skeleton } from "@/components/ui/skeleton";
import {
  PageHeaderSkeleton,
  KpiCardsSkeleton,
  DonutSkeleton,
  TableSkeleton,
} from "@/components/loading-skeletons";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeaderSkeleton />
      <div className="flex gap-4 border-b pb-2">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-5 w-24" />
      </div>
      <Skeleton className="h-20 w-full rounded-xl" />
      <KpiCardsSkeleton />
      <div className="grid items-start gap-4 lg:grid-cols-[300px_1fr]">
        <DonutSkeleton />
        <TableSkeleton rows={6} cols={5} />
      </div>
      <div className="rounded-xl border bg-card p-4">
        <Skeleton className="mb-1 h-4 w-64" />
        <Skeleton className="mb-3 h-3.5 w-80" />
        <TableSkeleton rows={5} cols={5} withToolbar={false} />
      </div>
    </div>
  );
}
