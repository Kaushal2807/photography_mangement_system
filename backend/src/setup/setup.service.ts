import { BadRequestException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSetupDto } from './dto/create-setup.dto';

@Injectable()
export class SetupService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private normalizeText(value: string): string {
    return value.trim();
  }

  async getSetupStatus(): Promise<{ isSetupCompleted: boolean }> {
    const userCount = await this.prisma.user.count();
    return { isSetupCompleted: userCount > 0 };
  }

  async completeSetup(
    createSetupDto: CreateSetupDto,
  ): Promise<{ success: boolean; message: string }> {
    const studioName = this.normalizeText(createSetupDto.studioName);
    const ownerName = this.normalizeText(createSetupDto.ownerName);
    const mobile = this.normalizeText(createSetupDto.mobile);
    const email = this.normalizeEmail(createSetupDto.email);
    const passwordHash = await bcrypt.hash(createSetupDto.password, 10);

    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const existingUsers = await tx.user.count();

      if (existingUsers > 0) {
        throw new BadRequestException({
          success: false,
          message: 'Setup already completed',
        });
      }

      await tx.user.create({
        data: {
          name: ownerName,
          mobile,
          email,
          passwordHash,
          role: UserRole.ADMIN,
          isActive: true,
        },
      });

      await tx.studioSettings.create({
        data: {
          studioName,
          ownerName,
          mobile,
          email,
          address: '',
          gstNumber: null,
          invoicePrefix: 'INV',
          invoiceStartingNumber: 1,
          defaultTaxPercentage: 0,
          invoiceTerms: null,
          invoiceFooter: null,
          logoUrl: null,
        } as any,
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    return {
      success: true,
      message: 'Studio setup completed successfully',
    };
  }
}
