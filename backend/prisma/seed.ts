import 'dotenv/config';
import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { seedProducts } from './seeds/product.seed';
import { seedUsers } from './seeds/user.seed';

const prisma = new PrismaClient();

/**
 * Ensures the legacy admin account (admin@tmn.com) always exists.
 * Uses a strong dedicated password separate from the Faker seed password.
 */
async function ensureLegacyAdmin() {
  const passwordHash = await bcrypt.hash('Admin@123456', 10);

  await prisma.user.upsert({
    where: { email: 'admin@tmn.com' },
    update: {
      name: 'Administrator',
      passwordHash,
      role: Role.ADMIN,
      isActive: true,
    },
    create: {
      email: 'admin@tmn.com',
      name: 'Administrator',
      passwordHash,
      role: Role.ADMIN,
      isActive: true,
    },
  });
}

async function main() {
  console.log('=== Start database seed ===');

  // 1. Seed users first (generates Admins, Sellers, Customers via Faker.js)
  await seedUsers(prisma);

  // 2. Ensure the legacy admin account always exists
  await ensureLegacyAdmin();

  // 3. Seed products — sellers are fetched internally by seedProducts
  await seedProducts(prisma);

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
    `=== Seed completed: ${userCount} users, ${productCount} products, ${publicProductCount} public products. ===`,
  );
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
