import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, MeetingStatus as PrismaMeetingStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMeetingDto, MeetingStatus } from './dto/create-meeting.dto';
import { UpdateMeetingDto } from './dto/update-meeting.dto';

@Injectable()
export class MeetingsService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizeText(value?: string): string | undefined {
    return value?.trim();
  }

  private mapStatus(status?: MeetingStatus): PrismaMeetingStatus {
    switch (status) {
      case MeetingStatus.COMPLETED:
        return PrismaMeetingStatus.COMPLETED;
      case MeetingStatus.CANCELLED:
        return PrismaMeetingStatus.CANCELLED;
      case MeetingStatus.CONVERTED:
        return PrismaMeetingStatus.CONVERTED;
      default:
        return PrismaMeetingStatus.SCHEDULED;
    }
  }

  private toResponse(meeting: {
    id: string;
    clientName: string;
    mobile: string;
    email: string | null;
    meetingDate: Date;
    meetingTime: string;
    eventType: string;
    photographerName: string | null;
    eventLocation: string | null;
    notes: string | null;
    status: PrismaMeetingStatus;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      ...meeting,
      meetingDate: meeting.meetingDate.toISOString(),
      status: meeting.status.toLowerCase(),
    };
  }

  async findAll() {
    const meetings = await this.prisma.meeting.findMany({
      orderBy: [{ meetingDate: 'asc' }, { meetingTime: 'asc' }],
    });

    return meetings.map((meeting) => this.toResponse(meeting));
  }

  async findOne(id: string) {
    const meeting = await this.prisma.meeting.findUnique({ where: { id } });

    if (!meeting) {
      throw new NotFoundException({
        success: false,
        message: 'Meeting not found',
      });
    }

    return this.toResponse(meeting);
  }

  async create(createMeetingDto: CreateMeetingDto) {
    const clientName = this.normalizeText(createMeetingDto.clientName);
    const mobile = this.normalizeText(createMeetingDto.mobile);
    const email = this.normalizeText(createMeetingDto.email)?.toLowerCase();
    const meetingTime = this.normalizeText(createMeetingDto.meetingTime);
    const eventType = this.normalizeText(createMeetingDto.eventType);
    const photographerName = this.normalizeText(createMeetingDto.photographerName);
    const eventLocation = this.normalizeText(createMeetingDto.eventLocation);
    const notes = this.normalizeText(createMeetingDto.notes);

    if (!clientName || !mobile || !createMeetingDto.meetingDate) {
      throw new BadRequestException({
        success: false,
        message: 'clientName, mobile, and meetingDate are required',
      });
    }

    const meeting = await this.prisma.meeting.create({
      data: {
        clientName,
        mobile,
        email: email ?? null,
        meetingDate: new Date(createMeetingDto.meetingDate),
        meetingTime: meetingTime ?? '',
        eventType: eventType ?? '',
        photographerName: photographerName ?? null,
        eventLocation: eventLocation ?? null,
        notes: notes ?? null,
        status: this.mapStatus(createMeetingDto.status),
      },
    });

    return this.toResponse(meeting);
  }

  async update(id: string, updateMeetingDto: UpdateMeetingDto) {
    await this.findOne(id);

    const meeting = await this.prisma.meeting.update({
      where: { id },
      data: {
        ...(updateMeetingDto.clientName !== undefined
          ? { clientName: updateMeetingDto.clientName.trim() }
          : {}),
        ...(updateMeetingDto.mobile !== undefined
          ? { mobile: updateMeetingDto.mobile.trim() }
          : {}),
        ...(updateMeetingDto.email !== undefined
          ? { email: updateMeetingDto.email.trim().toLowerCase() }
          : {}),
        ...(updateMeetingDto.meetingDate !== undefined
          ? { meetingDate: new Date(updateMeetingDto.meetingDate) }
          : {}),
        ...(updateMeetingDto.meetingTime !== undefined
          ? { meetingTime: updateMeetingDto.meetingTime.trim() }
          : {}),
        ...(updateMeetingDto.eventType !== undefined
          ? { eventType: updateMeetingDto.eventType.trim() }
          : {}),
        ...(updateMeetingDto.photographerName !== undefined
          ? { photographerName: updateMeetingDto.photographerName.trim() }
          : {}),
        ...(updateMeetingDto.eventLocation !== undefined
          ? { eventLocation: updateMeetingDto.eventLocation.trim() }
          : {}),
        ...(updateMeetingDto.notes !== undefined
          ? { notes: updateMeetingDto.notes.trim() }
          : {}),
        ...(updateMeetingDto.status !== undefined
          ? { status: this.mapStatus(updateMeetingDto.status) }
          : {}),
      },
    });

    return this.toResponse(meeting);
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.meeting.delete({ where: { id } });

    return {
      success: true,
      message: 'Meeting deleted successfully',
    };
  }
}
