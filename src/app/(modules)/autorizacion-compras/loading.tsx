import { Skeleton } from "@/components/ui/skeleton";
import {
  PageHeaderSkeleton,
  KpiCardsSkeleton,
  TableSkeleton,
} from "@/components/loading-skeletons";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeaderSkeleton />
      <div className="flex gap-2">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-9 w-40" />
      </div>
      <KpiCardsSkeleton count={5} />
      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
      <Skeleton className="h-72 w-full rounded-xl" />
      <TableSkeleton rows={6} cols={11} withToolbar={false} />
    </div>
  );
}
