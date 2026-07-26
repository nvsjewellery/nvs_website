-- CreateEnum
CREATE TYPE "Metal" AS ENUM ('Gold', 'Silver');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('Active', 'Inactive', 'Draft');

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "metal" "Metal" NOT NULL,
    "category" TEXT NOT NULL,
    "purity" TEXT NOT NULL,
    "grossWeight" DOUBLE PRECISION,
    "stoneWeight" DOUBLE PRECISION,
    "stoneCost" DOUBLE PRECISION,
    "hallmarkId" TEXT,
    "sku" TEXT NOT NULL,
    "va" DOUBLE PRECISION,
    "isDirectSterling" BOOLEAN NOT NULL DEFAULT false,
    "pieceCost" DOUBLE PRECISION,
    "image" TEXT NOT NULL DEFAULT '',
    "status" "ProductStatus" NOT NULL DEFAULT 'Draft',
    "stock" INTEGER NOT NULL DEFAULT 0,
    "sold" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "products_sku_key" ON "products"("sku");
