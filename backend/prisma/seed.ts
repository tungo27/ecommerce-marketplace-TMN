import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

// Set DATABASE_URL directly
process.env.DATABASE_URL = 'postgresql://postgres:root@localhost:5432/ecommerce_TMN_db?schema=public';

console.log('DATABASE_URL set to:', process.env.DATABASE_URL?.substring(0, 50) + '...');

const prisma = new PrismaClient();

async function main() {
  // Check if admin already exists
  const adminExists = await prisma.user.findUnique({
    where: { email: 'admin@tmn.com' },
  });

  if (adminExists) {
    console.log('Admin account already exists');
    return;
  }

  // Hash the default password
  const defaultPassword = 'Admin@123456';
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  // Create default admin
  const admin = await prisma.user.create({
    data: {
      email: 'admin@tmn.com',
      name: 'Administrator',
      passwordHash: hashedPassword,
      role: 'ADMIN',
      isActive: true,
    },
  });

  console.log('Admin account created:', admin);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
