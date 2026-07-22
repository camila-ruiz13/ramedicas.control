import { PageHeaderSkeleton, KpiCardsSkeleton, FormCardSkeleton } from "@/components/loading-skeletons";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeaderSkeleton />
      <FormCardSkeleton fields={1} />
      <KpiCardsSkeleton count={5} />
    </div>
  );
}
