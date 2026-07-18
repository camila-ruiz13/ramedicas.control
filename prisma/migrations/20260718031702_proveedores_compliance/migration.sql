-- CreateEnum
CREATE TYPE "DocPhase" AS ENUM ('FASE_1', 'FASE_2');

-- CreateEnum
CREATE TYPE "DocStatus" AS ENUM ('APROBADO', 'RECHAZADO', 'NO_APLICA', 'SIN_VALIDAR', 'NO_SUBIDO');

-- CreateTable
CREATE TABLE "suppliers" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "supplierId" UUID NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_types" (
    "id" UUID NOT NULL,
    "phase" "DocPhase" NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "document_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_statuses" (
    "id" UUID NOT NULL,
    "phase" "DocPhase" NOT NULL,
    "documentTypeId" UUID NOT NULL,
    "supplierId" UUID,
    "productId" UUID,
    "status" "DocStatus" NOT NULL,

    CONSTRAINT "document_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proveedores_imports" (
    "id" UUID NOT NULL,
    "phase" "DocPhase" NOT NULL,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "importedBy" TEXT NOT NULL,

    CONSTRAINT "proveedores_imports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_name_key" ON "suppliers"("name");

-- CreateIndex
CREATE UNIQUE INDEX "products_code_supplierId_key" ON "products"("code", "supplierId");

-- CreateIndex
CREATE UNIQUE INDEX "document_types_phase_name_key" ON "document_types"("phase", "name");

-- CreateIndex
CREATE UNIQUE INDEX "document_statuses_documentTypeId_supplierId_productId_key" ON "document_statuses"("documentTypeId", "supplierId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "proveedores_imports_phase_key" ON "proveedores_imports"("phase");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_statuses" ADD CONSTRAINT "document_statuses_documentTypeId_fkey" FOREIGN KEY ("documentTypeId") REFERENCES "document_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_statuses" ADD CONSTRAINT "document_statuses_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_statuses" ADD CONSTRAINT "document_statuses_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
