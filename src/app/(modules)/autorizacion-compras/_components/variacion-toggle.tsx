"use client";

import { cn } from "@/lib/utils";
import { useQueryParams } from "@/components/use-query-params";

const OPTIONS: { value: string; label: string; activeClass: string }[] = [
  { value: "", label: "Todas", activeClass: "bg-foreground text-background" },
  { value: "POR DEBAJO", label: "Por debajo", activeClass: "bg-emerald-600 text-white" },
  { value: "POR ENCIMA", label: "Por encima", activeClass: "bg-red-600 text-white" },
];

export function VariacionToggle({
  value,
  param = "variacion",
  pageParam = "page",
}: {
  value: string;
  param?: string;
  pageParam?: string;
}) {
  const { update } = useQueryParams();

  return (
    <div className="flex overflow-hidden rounded-md border">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={cn(
            "border-r px-3 py-1.5 text-xs font-medium text-muted-foreground last:border-r-0",
            value === opt.value && opt.activeClass,
          )}
          onClick={() => update({ [param]: opt.value || null, [pageParam]: null })}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
