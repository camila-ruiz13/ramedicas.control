"use client";

import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useQueryParams } from "./use-query-params";

export function ServerSearchInput({
  placeholder,
  queryParam = "q",
  pageParam = "page",
  defaultValue = "",
}: {
  placeholder: string;
  queryParam?: string;
  pageParam?: string;
  defaultValue?: string;
}) {
  const { update } = useQueryParams();
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    const timeout = setTimeout(() => {
      update({ [queryParam]: value || null, [pageParam]: null });
    }, 400);
    return () => clearTimeout(timeout);
    // Only re-run when the debounced value itself changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="relative w-full max-w-sm">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="pl-9 pr-8"
      />
      {value && (
        <button
          type="button"
          onClick={() => setValue("")}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <X className="size-4" />
          <span className="sr-only">Limpiar</span>
        </button>
      )}
    </div>
  );
}
