import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MODULES } from "@/lib/modules";

export default function HomePage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Inicio</h1>
        <p className="text-muted-foreground">
          Resumen de tus módulos de gestión.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MODULES.map((module) => (
          <Card key={module.slug}>
            <CardHeader>
              <CardTitle>{module.label}</CardTitle>
              <CardDescription>Módulo activo</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
