import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  private normalizeIdentifier(identifier: string): string {
    return identifier.trim();
  }

  private normalizePassword(password: string): string {
    return password;
  }

  async login(loginDto: LoginDto): Promise<{
    success: boolean;
    message: string;
    accessToken: string;
    user: { id: string; name: string; email: string; mobile: string; role: string };
  }> {
    const identifier = this.normalizeIdentifier(loginDto.identifier);
    const password = this.normalizePassword(loginDto.password);
    const userCount = await this.prisma.user.count();

    if (userCount === 0) {
      throw new BadRequestException({
        success: false,
        message: 'Setup not completed yet',
      });
    }

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: identifier, mode: 'insensitive' } },
          { mobile: identifier },
        ],
        isActive: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      success: true,
      message: 'Login successful',
      accessToken: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
      },
    };
  }

  async getMe(userId: string): Promise<{
    success: boolean;
    user: { id: string; name: string; email: string; mobile: string; role: string };
    studioSettings: {
      studioName: string;
      ownerName: string;
      mobile: string;
      email: string;
      address: string;
      logoUrl: string | null;
    };
  }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        mobile: true,
        role: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException({
        success: false,
        message: 'Unauthorized',
      });
    }

    const studioSettings = await this.prisma.studioSettings.findFirst({
      select: {
        studioName: true,
        ownerName: true,
        mobile: true,
        email: true,
        address: true,
        logoUrl: true,
      },
    });

    if (!studioSettings) {
      throw new UnauthorizedException({
        success: false,
        message: 'Studio settings not found',
      });
    }

    return {
      success: true,
      user,
      studioSettings,
    };
  }
}
