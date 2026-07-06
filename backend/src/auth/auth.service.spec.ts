import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              create: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should register a new user', async () => {
    const registerDto = {
      email: 'test@example.com',
      password: 'Password123',
      name: 'Test User',
      role: 'CUSTOMER',
    };

    jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);
    jest.spyOn(prisma.user, 'create').mockResolvedValue({
      id: 'uuid-123',
      email: registerDto.email,
      name: registerDto.name,
      passwordHash: 'hashed',
      role: 'CUSTOMER',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await service.register(registerDto);
    expect(result).toHaveProperty('id');
    expect(result.email).toBe(registerDto.email);
  });

  it('should throw ConflictException if email exists', async () => {
    const registerDto = {
      email: 'existing@example.com',
      password: 'Password123',
      name: 'Test User',
      role: 'CUSTOMER',
    };

    jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({
      id: 'uuid-456',
      email: registerDto.email,
      name: 'Existing User',
      passwordHash: 'hashed',
      role: 'CUSTOMER',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
  });
});
