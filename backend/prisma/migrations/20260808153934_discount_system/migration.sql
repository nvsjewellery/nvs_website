/*
  Warnings:

  - You are about to drop the column `productIds` on the `discounts` table. All the data in the column will be lost.
  - You are about to drop the column `scope` on the `discounts` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[code]` on the table `discounts` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `target` to the `discounts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `discounts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `discounts` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('SEASONAL', 'COUPON', 'CUSTOMER');

-- CreateEnum
CREATE TYPE "DiscountTarget" AS ENUM ('PRODUCT', 'CATEGORY', 'CART', 'CUSTOMER');

-- AlterTable
ALTER TABLE "discounts" DROP COLUMN "productIds",
DROP COLUMN "scope",
ADD COLUMN     "code" TEXT,
ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "name" TEXT,
ADD COLUMN     "startDate" TIMESTAMP(3),
ADD COLUMN     "target" "DiscountTarget" NOT NULL,
ADD COLUMN     "type" "DiscountType" NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "usageCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "usageLimit" INTEGER,
ADD COLUMN     "userId" TEXT,
ALTER COLUMN "metal" DROP NOT NULL,
ALTER COLUMN "category" DROP NOT NULL;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "discountCode" TEXT,
ADD COLUMN     "discountType" "DiscountType";

-- DropEnum
DROP TYPE "DiscountScope";

-- CreateTable
CREATE TABLE "_DiscountProducts" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_DiscountProducts_AB_unique" ON "_DiscountProducts"("A", "B");

-- CreateIndex
CREATE INDEX "_DiscountProducts_B_index" ON "_DiscountProducts"("B");

-- CreateIndex
CREATE UNIQUE INDEX "discounts_code_key" ON "discounts"("code");

-- CreateIndex
CREATE INDEX "discounts_type_idx" ON "discounts"("type");

-- CreateIndex
CREATE INDEX "discounts_target_idx" ON "discounts"("target");

-- CreateIndex
CREATE INDEX "discounts_userId_idx" ON "discounts"("userId");

-- CreateIndex
CREATE INDEX "discounts_code_idx" ON "discounts"("code");

-- AddForeignKey
ALTER TABLE "discounts" ADD CONSTRAINT "discounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DiscountProducts" ADD CONSTRAINT "_DiscountProducts_A_fkey" FOREIGN KEY ("A") REFERENCES "discounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DiscountProducts" ADD CONSTRAINT "_DiscountProducts_B_fkey" FOREIGN KEY ("B") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
