import { PrismaClient, Role, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { faker } from '@faker-js/faker';

const DEFAULT_PASSWORD = 'password123';

/**
 * Seeds the database with:
 *  - 3 Admin users
 *  - 10 Seller users
 *  - 50 Customer users
 * All with a bcrypt-hashed default password.
 */
export async function seedUsers(prisma: PrismaClient): Promise<User[]> {
  console.log('--- Seed users ---');

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  type UserSeedData = {
    name: string;
    email: string;
    passwordHash: string;
    role: Role;
    isActive: boolean;
  };

  const usersData: UserSeedData[] = [];

  // 5 Admin users
  for (let i = 1; i <= 5; i++) {
    usersData.push({
      name: faker.person.fullName(),
      email: `admin${i}@marketplace.com`,
      passwordHash,
      role: Role.ADMIN,
      isActive: true,
    });
  }

  // 30 Seller users
  for (let i = 1; i <= 30; i++) {
    usersData.push({
      name: faker.company.name(),
      email: `seller${i}@marketplace.com`,
      passwordHash,
      role: Role.SELLER,
      isActive: true,
    });
  }

  // 200 Customer users
  for (let i = 1; i <= 200; i++) {
    usersData.push({
      name: faker.person.fullName(),
      email: faker.internet.email({ provider: 'marketplace.com' }).toLowerCase().replace(/@/, `+cust${i}@`),
      passwordHash,
      role: Role.CUSTOMER,
      isActive: true,
    });
  }

  const users: User[] = [];

  for (const userData of usersData) {
    const savedUser = await prisma.user.upsert({
      where: { email: userData.email },
      update: {
        name: userData.name,
        passwordHash: userData.passwordHash,
        role: userData.role,
        isActive: userData.isActive,
      },
      create: userData,
    });

    console.log(`Upserted user [${savedUser.role}]: ${savedUser.email}`);
    users.push(savedUser);
  }

  console.log(
    `seedUsers done: ${users.filter((u) => u.role === Role.ADMIN).length} admins, ` +
    `${users.filter((u) => u.role === Role.SELLER).length} sellers, ` +
    `${users.filter((u) => u.role === Role.CUSTOMER).length} customers.`,
  );

  return users;
}
