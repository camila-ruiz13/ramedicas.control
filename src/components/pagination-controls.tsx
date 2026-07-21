"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useQueryParams } from "./use-query-params";

export function PaginationControls({
  page,
  totalPages,
  totalCount,
  pageParam = "page",
}: {
  page: number;
  totalPages: number;
  totalCount: number;
  pageParam?: string;
}) {
  const { update, isPending } = useQueryParams();

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
      <span>{totalCount} resultado(s)</span>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1 || isPending}
          onClick={() => update({ [pageParam]: String(page - 1) })}
        >
          <ChevronLeft className="size-4" />
          Anterior
        </Button>
        <span className="inline-flex items-center gap-1.5 tabular-nums">
          {isPending && <Spinner className="size-3.5" />}
          Página {page} de {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages || isPending}
          onClick={() => update({ [pageParam]: String(page + 1) })}
        >
          Siguiente
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
