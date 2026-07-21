"use client";

import { Filter, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQueryParams } from "@/components/use-query-params";

const OPTIONS = [
  { value: "all", label: "Todos los proveedores" },
  { value: "criticos", label: "Críticos (< 60%)" },
  { value: "completos", label: "Completos (100%)" },
  { value: "pendientes", label: "Con pendientes" },
];

const ITEMS = Object.fromEntries(OPTIONS.map((o) => [o.value, o.label]));

export function StatusFilter({
  value,
  filterParam = "filter",
  pageParam = "page",
}: {
  value: string;
  filterParam?: string;
  pageParam?: string;
}) {
  const { update, isPending } = useQueryParams();

  return (
    <Select
      items={ITEMS}
      value={value}
      onValueChange={(next) =>
        update({ [filterParam]: next === "all" ? null : String(next), [pageParam]: null })
      }
    >
      <SelectTrigger className="w-full sm:w-52">
        {isPending ? (
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
        ) : (
          <Filter className="size-4 text-muted-foreground" />
        )}
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {OPTIONS.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
