const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  await prisma.transaction.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  console.log("Deleted all orders");
}
main().catch(console.error).finally(() => prisma.$disconnect());
