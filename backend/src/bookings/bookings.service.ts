import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, BookingStatus as PrismaBookingStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BookingStatusDto, CreateBookingDto } from './dto/create-booking.dto';
import { GetBookingsQueryDto, SortOrder } from './dto/get-bookings-query.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';

@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizeText(value?: string): string | undefined {
    return value?.trim();
  }

  private mapStatusToPrisma(status?: string): PrismaBookingStatus | undefined {
    if (!status || status === 'all') return undefined;
    switch (status.toLowerCase()) {
      case 'completed':
        return PrismaBookingStatus.COMPLETED;
      case 'ongoing':
        return PrismaBookingStatus.ONGOING;
      case 'pending':
        return PrismaBookingStatus.PENDING;
      default:
        return undefined;
    }
  }

  private toResponse(booking: {
    id: string;
    bookingNumber: string;
    clientName: string;
    mobile: string;
    eventName: string;
    eventDate: Date;
    photographerName: string | null;
    totalAmount: number;
    advanceAmount: number;
    balanceAmount: number;
    status: PrismaBookingStatus;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: booking.id,
      bookingNumber: booking.bookingNumber,
      clientName: booking.clientName,
      mobile: booking.mobile,
      eventName: booking.eventName,
      eventDate: booking.eventDate.toISOString(),
      photographerName: booking.photographerName,
      totalAmount: Number(booking.totalAmount),
      advanceAmount: Number(booking.advanceAmount),
      balanceAmount: Number(booking.balanceAmount),
      status: booking.status.toLowerCase(),
      createdAt: booking.createdAt.toISOString(),
      updatedAt: booking.updatedAt.toISOString(),
    };
  }

  private generateBookingNumber(): string {
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    return `BK-${Date.now().toString().slice(-4)}${randomDigits}`;
  }

  async findAll(query: GetBookingsQueryDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Number(query.limit) || 10);
    const skip = (page - 1) * limit;

    const where: Prisma.BookingWhereInput = {};

    // Search filter across bookingNumber, clientName, mobile, eventName
    const search = this.normalizeText(query.search);
    if (search) {
      where.OR = [
        { bookingNumber: { contains: search, mode: 'insensitive' } },
        { clientName: { contains: search, mode: 'insensitive' } },
        { mobile: { contains: search, mode: 'insensitive' } },
        { eventName: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Status filter
    const statusEnum = this.mapStatusToPrisma(query.status);
    if (statusEnum) {
      where.status = statusEnum;
    }

    // Sorting
    const validSortFields = [
      'eventDate',
      'createdAt',
      'totalAmount',
      'balanceAmount',
      'clientName',
      'bookingNumber',
    ];
    const sortBy = validSortFields.includes(query.sortBy || '')
      ? (query.sortBy as string)
      : 'eventDate';
    const sortOrder = query.sortOrder === SortOrder.ASC ? 'asc' : 'desc';

    const [total, bookings] = await Promise.all([
      this.prisma.booking.count({ where }),
      this.prisma.booking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      success: true,
      data: bookings.map((booking) => this.toResponse(booking)),
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  async findOne(id: string) {
    const booking = await this.prisma.booking.findUnique({ where: { id } });

    if (!booking) {
      throw new NotFoundException({
        success: false,
        message: 'Booking not found',
      });
    }

    return {
      success: true,
      data: this.toResponse(booking),
    };
  }

  async create(createBookingDto: CreateBookingDto) {
    const clientName = this.normalizeText(createBookingDto.clientName);
    const mobile = this.normalizeText(createBookingDto.mobile);
    const eventName = this.normalizeText(createBookingDto.eventName);
    const photographerName = this.normalizeText(createBookingDto.photographerName);
    const bookingNumber =
      this.normalizeText(createBookingDto.bookingNumber) || this.generateBookingNumber();

    if (!clientName || !mobile || !eventName || !createBookingDto.eventDate) {
      throw new BadRequestException({
        success: false,
        message: 'clientName, mobile, eventName, and eventDate are required',
      });
    }

    const totalAmount = Math.max(0, Number(createBookingDto.totalAmount) || 0);
    const advanceAmount = Math.max(0, Number(createBookingDto.advanceAmount) || 0);
    const balanceAmount = Math.max(0, totalAmount - advanceAmount);

    const status =
      this.mapStatusToPrisma(createBookingDto.status) || PrismaBookingStatus.PENDING;

    const booking = await this.prisma.booking.create({
      data: {
        bookingNumber,
        clientName,
        mobile,
        eventName,
        eventDate: new Date(createBookingDto.eventDate),
        photographerName: photographerName ?? null,
        totalAmount,
        advanceAmount,
        balanceAmount,
        status,
      },
    });

    return {
      success: true,
      data: this.toResponse(booking),
    };
  }

  async updateStatus(id: string, updateBookingStatusDto: UpdateBookingStatusDto) {
    const existing = await this.prisma.booking.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException({
        success: false,
        message: 'Booking not found',
      });
    }

    const status = this.mapStatusToPrisma(updateBookingStatusDto.status);
    if (!status) {
      throw new BadRequestException({
        success: false,
        message: 'Invalid status. Allowed values: completed, ongoing, pending',
      });
    }

    const booking = await this.prisma.booking.update({
      where: { id },
      data: { status },
    });

    return {
      success: true,
      data: this.toResponse(booking),
    };
  }

  async update(id: string, updateBookingDto: UpdateBookingDto) {
    const existing = await this.prisma.booking.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException({
        success: false,
        message: 'Booking not found',
      });
    }

    const totalAmount =
      updateBookingDto.totalAmount !== undefined
        ? Math.max(0, Number(updateBookingDto.totalAmount))
        : Number(existing.totalAmount);

    const advanceAmount =
      updateBookingDto.advanceAmount !== undefined
        ? Math.max(0, Number(updateBookingDto.advanceAmount))
        : Number(existing.advanceAmount);

    const balanceAmount = Math.max(0, totalAmount - advanceAmount);

    const booking = await this.prisma.booking.update({
      where: { id },
      data: {
        ...(updateBookingDto.bookingNumber !== undefined
          ? { bookingNumber: updateBookingDto.bookingNumber.trim() }
          : {}),
        ...(updateBookingDto.clientName !== undefined
          ? { clientName: updateBookingDto.clientName.trim() }
          : {}),
        ...(updateBookingDto.mobile !== undefined
          ? { mobile: updateBookingDto.mobile.trim() }
          : {}),
        ...(updateBookingDto.eventName !== undefined
          ? { eventName: updateBookingDto.eventName.trim() }
          : {}),
        ...(updateBookingDto.eventDate !== undefined
          ? { eventDate: new Date(updateBookingDto.eventDate) }
          : {}),
        ...(updateBookingDto.photographerName !== undefined
          ? { photographerName: updateBookingDto.photographerName.trim() }
          : {}),
        totalAmount,
        advanceAmount,
        balanceAmount,
        ...(updateBookingDto.status !== undefined
          ? { status: this.mapStatusToPrisma(updateBookingDto.status) }
          : {}),
      },
    });

    return {
      success: true,
      data: this.toResponse(booking),
    };
  }

  async remove(id: string) {
    const existing = await this.prisma.booking.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException({
        success: false,
        message: 'Booking not found',
      });
    }

    await this.prisma.booking.delete({ where: { id } });

    return {
      success: true,
      message: 'Booking deleted successfully',
    };
  }
}
