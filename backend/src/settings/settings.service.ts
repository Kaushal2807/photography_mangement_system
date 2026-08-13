import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getStudioSettings() {
    const studio = await this.prisma.studioSettings.findFirst({ orderBy: { createdAt: 'asc' } });
    if (!studio) {
      return { success: true, data: null };
    }
    return { success: true, data: studio };
  }

  async updateStudioSettings(payload: Partial<any>) {
    const studio = await this.prisma.studioSettings.findFirst({ orderBy: { createdAt: 'asc' } });
    if (!studio) {
      const created = await this.prisma.studioSettings.create({ data: payload as Prisma.StudioSettingsCreateInput });
      return { success: true, data: created };
    }
    const updated = await this.prisma.studioSettings.update({ where: { id: studio.id }, data: payload as Prisma.StudioSettingsUpdateInput });
    return { success: true, data: updated };
  }

  async getInvoiceSettings() {
    const studio = await this.prisma.studioSettings.findFirst({ orderBy: { createdAt: 'asc' } });
    const data = {
      invoicePrefix: studio?.invoicePrefix ?? 'INV',
      invoiceStartingNumber: (studio as any)?.invoiceStartingNumber ?? 1,
      defaultTaxPercentage: (studio as any)?.defaultTaxPercentage ?? 0,
      invoiceTerms: (studio as any)?.invoiceTerms ?? null,
      invoiceFooter: (studio as any)?.invoiceFooter ?? null,
    };
    return { success: true, data };
  }

  async updateInvoiceSettings(payload: Partial<any>) {
    const studio = await this.prisma.studioSettings.findFirst({ orderBy: { createdAt: 'asc' } });
    if (!studio) {
      const created = await this.prisma.studioSettings.create({ data: payload as Prisma.StudioSettingsCreateInput });
      return { success: true, data: created };
    }
    const updated = await this.prisma.studioSettings.update({ where: { id: studio.id }, data: payload as Prisma.StudioSettingsUpdateInput });
    return { success: true, data: updated };
  }

  async getAccount(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException({ success: false, message: 'User not found' });
    return { success: true, data: { name: user.name, mobile: user.mobile, email: user.email } };
  }

  async updateAccount(userId: string, payload: Partial<any>) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException({ success: false, message: 'User not found' });
    const updated = await this.prisma.user.update({ where: { id: userId }, data: payload });
    return { success: true, data: { name: updated.name, mobile: updated.mobile, email: updated.email } };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException({ success: false, message: 'User not found' });
    const match = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!match) throw new BadRequestException({ success: false, message: 'Invalid current password' });
    const hash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash: hash } });
    return { success: true, message: 'Password changed successfully' };
  }
}
