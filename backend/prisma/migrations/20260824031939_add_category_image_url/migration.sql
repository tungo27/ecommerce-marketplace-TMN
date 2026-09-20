/*
  Warnings:

  - Added the required column `targetType` to the `AuditLog` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'CANCELLATION_REQUESTED';

-- DropForeignKey
ALTER TABLE "AuditLog" DROP CONSTRAINT "AuditLog_productId_fkey";

-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "details" JSONB,
ADD COLUMN     "targetId" TEXT,
ADD COLUMN     "targetType" TEXT NOT NULL,
ALTER COLUMN "productId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "imageUrl" TEXT;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "adminNote" VARCHAR(500);

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
