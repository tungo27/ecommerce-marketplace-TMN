-- CreateEnum
CREATE TYPE "ChatStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "ProductReportStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- DropForeignKey
ALTER TABLE "Dispute" DROP CONSTRAINT "Dispute_customerId_fkey";
ALTER TABLE "Dispute" DROP CONSTRAINT "Dispute_orderId_fkey";
ALTER TABLE "DisputeMessage" DROP CONSTRAINT "DisputeMessage_disputeId_fkey";
ALTER TABLE "DisputeMessage" DROP CONSTRAINT "DisputeMessage_senderId_fkey";

-- DropTable
DROP TABLE "DisputeMessage";
DROP TABLE "Dispute";

-- DropEnum
DROP TYPE "DisputeStatus";

-- CreateTable
CREATE TABLE "OrderChat" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "status" "ChatStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OrderChat_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OrderChatMessage" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "message" VARCHAR(1000) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OrderChatMessage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProductReport" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reason" VARCHAR(100) NOT NULL,
    "description" VARCHAR(2000) NOT NULL,
    "status" "ProductReportStatus" NOT NULL DEFAULT 'PENDING',
    "adminNote" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProductReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrderChat_orderId_key" ON "OrderChat"("orderId");
CREATE UNIQUE INDEX "ProductReport_productId_reporterId_key" ON "ProductReport"("productId", "reporterId");

-- AddForeignKey
ALTER TABLE "OrderChat" ADD CONSTRAINT "OrderChat_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OrderChat" ADD CONSTRAINT "OrderChat_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OrderChatMessage" ADD CONSTRAINT "OrderChatMessage_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "OrderChat"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrderChatMessage" ADD CONSTRAINT "OrderChatMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProductReport" ADD CONSTRAINT "ProductReport_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProductReport" ADD CONSTRAINT "ProductReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
