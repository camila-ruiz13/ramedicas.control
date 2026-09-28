"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useQueryParams } from "@/components/use-query-params";

// A pedido de Camila (2026-09-28): atajo para excluir de un clic al
// proveedor "OPERANDO MÉDICO QUIRURGICOS S.A.S" (1.679 códigos) sin tener
// que usar el combo de Proveedor — a diferencia de "Solo con alerta", este
// sí acota también las 4 alertas de abajo (es un filtro de proveedor más,
// no una vista de solo-tabla).
export function ExcluirOperandoToggle({ checked }: { checked: boolean }) {
  const { update } = useQueryParams();

  return (
    <div className="flex items-center gap-2 pb-2">
      <Checkbox
        id="excluir-operando"
        checked={checked}
        onCheckedChange={(next) => update({ excluirOperando: next ? "1" : null, page: null })}
      />
      <Label htmlFor="excluir-operando" className="text-sm font-normal">
        Excluir proveedor OPERANDO
      </Label>
    </div>
  );
}
