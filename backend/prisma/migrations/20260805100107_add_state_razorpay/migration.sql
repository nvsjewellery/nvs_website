-- AlterTable
ALTER TABLE "addresses" ADD COLUMN     "state" TEXT NOT NULL DEFAULT 'Andhra Pradesh';

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "razorpayOrderId" TEXT,
ADD COLUMN     "razorpayPaymentId" TEXT;
