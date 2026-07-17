import { PrismaClient } from '@prisma/client';

const query = "((ao:*))";
const prisma = new PrismaClient();

async function main() {
  try {
    // ... logic
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
