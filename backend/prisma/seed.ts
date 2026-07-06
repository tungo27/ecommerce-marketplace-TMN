import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { seedProducts } from './seeds/product.seed';
import { seedUsers } from './seeds/user.seed';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  console.log('=== Start database seed ===');

  const users = await seedUsers(prisma);
  const sellerAccount = users.find((user) => user.role === 'SELLER');

  if (!sellerAccount) {
    throw new Error('Cannot find a SELLER account to link seeded products.');
  }

  console.log(`Using seller ID for products: ${sellerAccount.id}`);
  await seedProducts(prisma, sellerAccount.id);

  const [userCount, productCount, publicProductCount] = await Promise.all([
    prisma.user.count(),
    prisma.product.count(),
    prisma.product.count({
      where: {
        status: 'Published',
        stock: { gt: 0 },
      },
    }),
  ]);

  console.log(
    `Seed completed: ${userCount} users, ${productCount} products, ${publicProductCount} public products.`,
  );
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
