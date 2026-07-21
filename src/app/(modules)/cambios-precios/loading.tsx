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
      <KpiCardsSkeleton count={5} />
      <Skeleton className="h-24 w-full rounded-xl" />
      <Skeleton className="h-20 w-full rounded-xl" />
      <Skeleton className="h-32 w-full rounded-xl" />
      <KpiCardsSkeleton count={4} />
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-56 w-full rounded-xl" />
        <Skeleton className="h-56 w-full rounded-xl" />
        <Skeleton className="h-56 w-full rounded-xl" />
      </div>
      <TableSkeleton rows={6} cols={10} withToolbar={false} />
    </div>
  );
}
