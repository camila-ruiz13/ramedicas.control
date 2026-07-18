"use client";

import { ArrowUpDown } from "lucide-react";
import { TableHead } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useQueryParams } from "./use-query-params";

export function SortableHead({
  field,
  children,
  initialField,
  initialDir = "asc",
  sortParam = "sort",
  dirParam = "dir",
  pageParam = "page",
  className,
}: {
  field: string;
  children: React.ReactNode;
  initialField?: string;
  initialDir?: "asc" | "desc";
  sortParam?: string;
  dirParam?: string;
  pageParam?: string;
  className?: string;
}) {
  const { update, searchParams } = useQueryParams();
  const currentField = searchParams.get(sortParam) ?? initialField;
  const currentDir = (searchParams.get(dirParam) as "asc" | "desc" | null) ?? initialDir;
  const active = currentField === field;

  function toggle() {
    const nextDir = active && currentDir === "asc" ? "desc" : "asc";
    update({ [sortParam]: field, [dirParam]: nextDir, [pageParam]: null });
  }

  return (
    <TableHead className={cn("cursor-pointer select-none", className)} onClick={toggle}>
      <span className="inline-flex items-center gap-1">
        {children}
        <ArrowUpDown className={cn("size-3", active ? "opacity-100" : "opacity-30")} />
      </span>
    </TableHead>
  );
}
