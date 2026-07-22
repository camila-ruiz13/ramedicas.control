-- CreateTable
CREATE TABLE "compra_lineas" (
    "id" UUID NOT NULL,
    "mes" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "fechaFactura" DATE NOT NULL,
    "nroFactura" TEXT NOT NULL,
    "nitProveedor" TEXT NOT NULL,
    "nombreProveedor" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "articulo" TEXT NOT NULL,
    "unidades" INTEGER NOT NULL,
    "subtotal" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "compra_lineas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "predevolucion_lineas" (
    "id" UUID NOT NULL,
    "mes" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "nit" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "unidades" INTEGER NOT NULL,
    "docCruce" TEXT NOT NULL,

    CONSTRAINT "predevolucion_lineas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ofertas" (
    "id" TEXT NOT NULL,
    "nit" TEXT NOT NULL,
    "nombreProveedor" TEXT NOT NULL,
    "concepto" TEXT NOT NULL,
    "fechaInicial" DATE NOT NULL,
    "fechaFinal" DATE NOT NULL,

    CONSTRAINT "ofertas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oferta_cortes" (
    "id" UUID NOT NULL,
    "ofertaId" TEXT NOT NULL,
    "corteNumero" INTEGER NOT NULL,
    "fechaInicioCorte" DATE NOT NULL,
    "fechaFinCorte" DATE NOT NULL,

    CONSTRAINT "oferta_cortes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oferta_productos" (
    "id" UUID NOT NULL,
    "ofertaId" TEXT NOT NULL,
    "codArticulo" TEXT NOT NULL,
    "rango1" DECIMAL(65,30) NOT NULL,
    "rango2" DECIMAL(65,30) NOT NULL,
    "porPct" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "oferta_productos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "descuentos_imports" (
    "id" TEXT NOT NULL,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "importedBy" TEXT NOT NULL,

    CONSTRAINT "descuentos_imports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "compra_lineas_mes_codigo_idx" ON "compra_lineas"("mes", "codigo");

-- CreateIndex
CREATE INDEX "compra_lineas_nitProveedor_idx" ON "compra_lineas"("nitProveedor");

-- CreateIndex
CREATE INDEX "compra_lineas_numero_idx" ON "compra_lineas"("numero");

-- CreateIndex
CREATE INDEX "predevolucion_lineas_mes_codigo_idx" ON "predevolucion_lineas"("mes", "codigo");

-- CreateIndex
CREATE INDEX "predevolucion_lineas_docCruce_idx" ON "predevolucion_lineas"("docCruce");

-- CreateIndex
CREATE INDEX "ofertas_nit_idx" ON "ofertas"("nit");

-- CreateIndex
CREATE INDEX "oferta_cortes_ofertaId_idx" ON "oferta_cortes"("ofertaId");

-- CreateIndex
CREATE INDEX "oferta_productos_ofertaId_codArticulo_idx" ON "oferta_productos"("ofertaId", "codArticulo");

-- AddForeignKey
ALTER TABLE "oferta_cortes" ADD CONSTRAINT "oferta_cortes_ofertaId_fkey" FOREIGN KEY ("ofertaId") REFERENCES "ofertas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oferta_productos" ADD CONSTRAINT "oferta_productos_ofertaId_fkey" FOREIGN KEY ("ofertaId") REFERENCES "ofertas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
