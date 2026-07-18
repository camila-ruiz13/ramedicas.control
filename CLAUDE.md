@AGENTS.md

# Ramedicas Control

App interna para gestionar funciones laborales, con login y módulos que se agregan de forma incremental. Uso: Jenny + algunos compañeros de Control Online International / Ramedicas.

## Stack

- **Next.js 16 (App Router) + TypeScript** — frontend y backend en un solo proyecto.
- **Supabase** — Postgres gestionado + Auth (login). Ver `.env.example` para las variables requeridas.
- **Prisma** (`prisma/schema.prisma`) — ORM sobre el esquema `public` de la misma base de Supabase. Supabase Auth es dueño de `auth.users`; Prisma solo gestiona `profiles` (perfil + rol) y las tablas de cada módulo.
- **Tailwind CSS + shadcn/ui** (`src/components/ui`) — componentes base ya instalados: button, input, label, card, table, dialog, dropdown-menu, avatar, separator, sonner.
- Hosting: sin decidir todavía (repo solo local por ahora).

## Cómo agregar un módulo nuevo

1. Crear carpeta de ruta en `src/app/(modules)/nombre-modulo/page.tsx` (queda protegida automáticamente por el layout del grupo y el middleware).
2. Agregar la entrada correspondiente en `src/lib/modules.ts` (aparece sola en el sidebar).
3. Si necesita datos propios, agregar el modelo en `prisma/schema.prisma` y correr `npx prisma migrate dev --name nombre_modulo` (requiere `DATABASE_URL`/`DIRECT_URL` reales de Supabase en `.env`).
4. Usar `src/app/(modules)/tareas/page.tsx` como plantilla de referencia.

## Auth y roles

- Login vive en `src/app/login` (página + server actions `login`/`logout`).
- `middleware.ts` + `src/lib/supabase/middleware.ts` protegen todas las rutas excepto `/login`.
- `src/lib/supabase/{client,server}.ts` son los helpers de Supabase para Client/Server Components — no crear clientes de Supabase de otra forma.
- Rol de cada usuario vive en el modelo `Profile` (`prisma/schema.prisma`), no en Supabase Auth directamente. Roles: `ADMIN`, `EDITOR`, `VIEWER`.

## Setup local (primera vez)

1. Crear proyecto gratis en supabase.com.
2. Copiar `.env.example` a `.env` y `.env.local`, completar con las credenciales del proyecto (Settings > API y Settings > Database).
3. `npx prisma migrate dev --name init` para crear la tabla `profiles`.
4. `npm run dev`.

## Memoria de contexto

Las decisiones de alcance y arquitectura de este proyecto también están guardadas en la memoria persistente de Claude Code (fuera del repo), no solo en este archivo.
