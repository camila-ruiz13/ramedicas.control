import { PageHeaderSkeleton, TableSkeleton } from "@/components/loading-skeletons";

export default function Loading() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeaderSkeleton />
      <TableSkeleton rows={4} cols={2} withToolbar={false} />
    </div>
  );
}
