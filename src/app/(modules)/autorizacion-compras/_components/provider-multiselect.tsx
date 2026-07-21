"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { useQueryParams } from "@/components/use-query-params";
import { NONE_SENTINEL } from "@/lib/autorizacion-compras-constants";

export function ProviderMultiselect({
  allProviders,
  selected,
  param = "prov",
  pageParam = "page",
}: {
  allProviders: string[];
  /** null means "no filter applied" — every provider counts as selected. */
  selected: Set<string> | null;
  param?: string;
  pageParam?: string;
}) {
  const { update } = useQueryParams();
  const [search, setSearch] = useState("");

  const effectiveSelected = selected ?? new Set(allProviders);
  const visible = allProviders.filter((p) => p.toLowerCase().includes(search.toLowerCase()));

  function setSelection(next: Set<string>) {
    // Encode "all selected" as an absent param so the URL stays clean and
    // newly-added providers in the sheet show up without needing an update.
    // "Ninguno" needs its own sentinel — an empty string param would parse
    // back as absent (falsy) and get misread as "all selected" again.
    const value =
      next.size === allProviders.length ? null : next.size === 0 ? NONE_SENTINEL : [...next].join(",");
    update({ [param]: value, [pageParam]: null });
  }

  function toggle(prov: string, checked: boolean) {
    const next = new Set(effectiveSelected);
    if (checked) next.add(prov);
    else next.delete(prov);
    setSelection(next);
  }

  let label = "Todos los proveedores";
  if (effectiveSelected.size === 0) label = "Ningún proveedor";
  else if (effectiveSelected.size === allProviders.length) label = "Todos los proveedores";
  else if (effectiveSelected.size === 1) label = [...effectiveSelected][0];
  else label = `${effectiveSelected.size} proveedores seleccionados`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" className="w-full justify-between font-normal sm:w-56">
            <span className="truncate">{label}</span>
            <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
          </Button>
        }
      />
      <DropdownMenuContent className="w-72 p-0">
        <div className="flex gap-1.5 border-b p-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="flex-1"
            onClick={() => setSelection(new Set(allProviders))}
          >
            Todos
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="flex-1"
            onClick={() => setSelection(new Set())}
          >
            Ninguno
          </Button>
        </div>
        <div className="p-2">
          <Input
            placeholder="Buscar proveedor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            // The menu's own type-to-select behavior intercepts keystrokes
            // before they reach the input unless we stop them here — without
            // this, typing highlights matching menu items instead of filtering.
            onKeyDown={(e) => e.stopPropagation()}
            className="h-8"
          />
        </div>
        <div className="max-h-64 overflow-y-auto p-1">
          {visible.map((prov) => (
            <DropdownMenuCheckboxItem
              key={prov}
              checked={effectiveSelected.has(prov)}
              onCheckedChange={(checked) => toggle(prov, checked === true)}
              closeOnClick={false}
              className="truncate"
            >
              {prov}
            </DropdownMenuCheckboxItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
