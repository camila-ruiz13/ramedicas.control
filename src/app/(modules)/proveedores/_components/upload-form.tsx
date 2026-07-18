"use client";

import { useActionState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IndeterminateProgress } from "@/components/indeterminate-progress";
import { importarProveedores } from "../actions";

type ImportResult = Awaited<ReturnType<typeof importarProveedores>>;
type State =
  | { status: "idle" }
  | { status: "success"; resumen: ImportResult }
  | { status: "error"; message: string };

async function runImport(_prev: State, formData: FormData): Promise<State> {
  try {
    const resumen = await importarProveedores(formData);
    return { status: "success", resumen };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "No se pudo importar el archivo",
    };
  }
}

export function UploadForm() {
  const [state, formAction, pending] = useActionState<State, FormData>(runImport, {
    status: "idle",
  });

  return (
    <div className="rounded-xl border bg-card p-4">
      {pending ? (
        <IndeterminateProgress />
      ) : (
        <form action={formAction} className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <Input type="file" name="file" accept=".xlsx" required className="max-w-xs" />
            <Button type="submit" className="gap-2">
              <Upload className="size-4" />
              Subir Excel
            </Button>
          </div>
          {state.status === "success" && (
            <p className="text-sm text-emerald-700 dark:text-emerald-400">
              Importado: {state.resumen.fase1.proveedores} proveedores /{" "}
              {state.resumen.fase1.documentos} documentos (Primera Fase){" "}
              {state.resumen.fase2.articulos > 0 &&
                `— ${state.resumen.fase2.proveedores} proveedores / ${state.resumen.fase2.articulos} artículos / ${state.resumen.fase2.documentos} documentos (Segunda Fase)`}
            </p>
          )}
          {state.status === "error" && (
            <p className="text-sm text-destructive">{state.message}</p>
          )}
        </form>
      )}
    </div>
  );
}
