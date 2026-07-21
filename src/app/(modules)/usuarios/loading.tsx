import { Skeleton } from "@/components/ui/skeleton";
import { PageHeaderSkeleton, FormCardSkeleton, TableSkeleton } from "@/components/loading-skeletons";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeaderSkeleton />
      <div className="flex gap-4 border-b pb-2">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-5 w-16" />
      </div>
      <FormCardSkeleton fields={3} />
      <TableSkeleton rows={5} cols={3} withToolbar={false} />
    </div>
  );
}
