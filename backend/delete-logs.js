const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.auditLog.deleteMany().then(() => {
  console.log('Deleted all logs');
  return prisma.$disconnect();
});
