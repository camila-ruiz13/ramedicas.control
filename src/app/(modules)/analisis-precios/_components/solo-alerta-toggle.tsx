"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useQueryParams } from "@/components/use-query-params";

// A pedido de Camila (2026-09-24): con 11.993 artículos, quiere poder ver
// solo los que tienen alguna lista marcada en rojo (por encima del precio
// regulado o por debajo del costo de referencia 2) sin tener que revisar
// hoja por hoja.
export function SoloAlertaToggle({ checked }: { checked: boolean }) {
  const { update } = useQueryParams();

  return (
    <div className="flex items-center gap-2 pb-2">
      <Checkbox
        id="solo-alerta"
        checked={checked}
        onCheckedChange={(next) => update({ soloAlerta: next ? "1" : null, page: null })}
      />
      <Label htmlFor="solo-alerta" className="text-sm font-normal">
        Solo con alerta (precio en rojo)
      </Label>
    </div>
  );
}
