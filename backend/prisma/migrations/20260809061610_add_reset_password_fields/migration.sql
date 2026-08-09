-- AlterTable
ALTER TABLE "users" ADD COLUMN     "resetPasswordExpire" TIMESTAMP(3),
ADD COLUMN     "resetPasswordToken" TEXT;
