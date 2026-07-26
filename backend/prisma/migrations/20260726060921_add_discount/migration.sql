-- CreateEnum
CREATE TYPE "DiscountScope" AS ENUM ('VA', 'Total');

-- CreateEnum
CREATE TYPE "DiscountKind" AS ENUM ('percent', 'flat');

-- CreateTable
CREATE TABLE "discounts" (
    "id" TEXT NOT NULL,
    "metal" "Metal" NOT NULL,
    "category" TEXT NOT NULL,
    "productIds" TEXT[],
    "scope" "DiscountScope" NOT NULL,
    "kind" "DiscountKind" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "discounts_pkey" PRIMARY KEY ("id")
);
