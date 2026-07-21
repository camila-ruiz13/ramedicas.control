import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function PageHeaderSkeleton() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
        <Spinner className="size-5" />
      </div>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
    </div>
  );
}

export function KpiCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardContent className="flex flex-col items-center gap-2 py-4">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-24" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function DonutSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-4">
      <Skeleton className="mb-3 h-4 w-56" />
      <div className="flex items-center justify-center py-6">
        <Skeleton className="size-40 rounded-full" />
      </div>
    </div>
  );
}

export function TableSkeleton({
  rows = 6,
  cols = 4,
  withToolbar = true,
}: {
  rows?: number;
  cols?: number;
  withToolbar?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      {withToolbar && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Skeleton className="h-9 w-full max-w-sm" />
          <Skeleton className="h-9 w-full sm:w-52" />
        </div>
      )}
      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="flex gap-4 border-b bg-muted/40 px-4 py-3">
          {Array.from({ length: cols }).map((_, i) => (
            <Skeleton key={i} className="h-4 flex-1" />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex gap-4 border-b px-4 py-3 last:border-0">
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton key={c} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function FormCardSkeleton({ fields = 3 }: { fields?: number }) {
  return (
    <Card className="max-w-xl">
      <CardHeader>
        <Skeleton className="h-5 w-32" />
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
        <Skeleton className="h-9 w-32" />
      </CardContent>
    </Card>
  );
}
