import { PageHeaderSkeleton, TableSkeleton } from "@/components/loading-skeletons";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeaderSkeleton />
      <div className="h-14 rounded-xl border bg-card" />
      <TableSkeleton rows={8} cols={9} />
    </div>
  );
}
