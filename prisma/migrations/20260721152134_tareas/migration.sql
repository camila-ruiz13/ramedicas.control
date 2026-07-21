-- CreateEnum
CREATE TYPE "TareaEstado" AS ENUM ('PENDIENTE', 'EN_PROGRESO', 'COMPLETADA', 'CANCELADA');

-- CreateTable
CREATE TABLE "tareas" (
    "id" UUID NOT NULL,
    "titulo" TEXT NOT NULL,
    "fechaObjetivo" DATE NOT NULL,
    "fechaCompletada" DATE,
    "estado" "TareaEstado" NOT NULL DEFAULT 'PENDIENTE',
    "profileId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tareas_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "tareas" ADD CONSTRAINT "tareas_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
