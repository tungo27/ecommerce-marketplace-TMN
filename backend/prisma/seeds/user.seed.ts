import { PrismaClient, Role, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';

export async function seedUsers(prisma: PrismaClient): Promise<User[]> {
  console.log('--- Seed users ---');

  const passwordHash = await bcrypt.hash('Password123@', 10);
  const usersData = [
    {
      name: 'Nguyen Van Admin',
      email: 'admin@marketplace.com',
      passwordHash,
      role: Role.ADMIN,
      isActive: true,
    },
    {
      name: 'Tran Thi Seller',
      email: 'seller@marketplace.com',
      passwordHash,
      role: Role.SELLER,
      isActive: true,
    },
    {
      name: 'Le Van Customer',
      email: 'customer@marketplace.com',
      passwordHash,
      role: Role.CUSTOMER,
      isActive: true,
    },
  ];

  const users: User[] = [];

  for (const user of usersData) {
    const savedUser = await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        passwordHash: user.passwordHash,
        role: user.role,
        isActive: user.isActive,
      },
      create: user,
    });

    console.log(`Upserted user [${savedUser.role}]: ${savedUser.email}`);
    users.push(savedUser);
  }

  return users;
}
