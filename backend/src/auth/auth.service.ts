import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { RegisterResponseDto } from './dto/register-response.dto';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<RegisterResponseDto> {
    const { email, password, name, role } = registerDto;

    // Check if email already exists (case-insensitive)
    const existingUser = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash: hashedPassword,
        name,
        role: role as any,
        isActive: true,
      },
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }

  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    const { email, password } = loginDto;

    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException('This account was registered via Google. Please log in with Google.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, email: user.email, role: user.role, name: user.name };
    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }
  async validateGoogleUser(profile: any, state?: string): Promise<{ accessToken: string }> {
    const { id, emails, displayName, photos } = profile;
    const email = emails[0].value.toLowerCase();
    const picture = photos && photos.length > 0 ? photos[0].value : undefined;

    let user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      if (!user.googleId) {
        user = await this.prisma.user.update({
          where: { email },
          data: { googleId: id },
        });
      }
    } else {
      let role = 'CUSTOMER';
      if (state === 'seller') role = 'SELLER';
      if (state === 'admin') role = 'ADMIN';

      user = await this.prisma.user.create({
        data: {
          email,
          name: displayName,
          googleId: id,
          role: role as any,
          isActive: true,
          // passwordHash is now optional, so we can omit it for OAuth users
        },
      });
    }

    const payload = { sub: user.id, email: user.email, role: user.role, picture, name: user.name };
    const accessToken = await this.jwtService.signAsync(payload);

    return { accessToken };
  }
}
