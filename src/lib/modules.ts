export type ModuleRole = "ADMIN" | "EDITOR" | "VIEWER";

export type ModuleDefinition = {
  slug: string;
  label: string;
  href: string;
  minRole: ModuleRole;
};

// Add one entry here per new module folder under src/app/(modules).
export const MODULES: ModuleDefinition[] = [
  { slug: "tareas", label: "Tareas", href: "/tareas", minRole: "VIEWER" },
];
