import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader } from "@/components/ui/card";
import { PageHeaderSkeleton } from "@/components/loading-skeletons";

export default function Loading() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeaderSkeleton />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <Skeleton className="size-10 rounded-lg" />
                <Skeleton className="size-4" />
              </div>
              <Skeleton className="mt-2 h-5 w-24" />
              <Skeleton className="h-3.5 w-20" />
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
