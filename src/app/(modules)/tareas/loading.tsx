import {
  PageHeaderSkeleton,
  KpiCardsSkeleton,
  FormCardSkeleton,
  TableSkeleton,
} from "@/components/loading-skeletons";

export default function Loading() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeaderSkeleton />
      <KpiCardsSkeleton count={3} />
      <FormCardSkeleton fields={2} />
      <TableSkeleton rows={5} cols={6} withToolbar={false} />
    </div>
  );
}
