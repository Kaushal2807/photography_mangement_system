import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  EditingOverallStatus as PrismaEditingOverallStatus,
  EditingWorkflowStatus as PrismaEditingWorkflowStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEditingDto } from './dto/create-editing.dto';
import { GetEditingQueryDto } from './dto/get-editing-query.dto';
import { UpdateEditingProgressDto } from './dto/update-editing-progress.dto';
import { UpdateEditingDto } from './dto/update-editing.dto';

type EditingWithBooking = Prisma.EditingProjectGetPayload<{
  include: { booking: true };
}>;

@Injectable()
export class EditingService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizeText(value?: string): string | undefined {
    return value?.trim();
  }

  private mapWorkflowStatus(status?: string | null): PrismaEditingWorkflowStatus {
    switch (status?.toLowerCase()) {
      case 'in_progress':
        return PrismaEditingWorkflowStatus.IN_PROGRESS;
      case 'completed':
        return PrismaEditingWorkflowStatus.COMPLETED;
      default:
        return PrismaEditingWorkflowStatus.PENDING;
    }
  }

  private mapOverallStatus(status?: string | null): PrismaEditingOverallStatus {
    switch (status?.toLowerCase()) {
      case 'ongoing':
        return PrismaEditingOverallStatus.ONGOING;
      case 'completed':
        return PrismaEditingOverallStatus.COMPLETED;
      default:
        return PrismaEditingOverallStatus.PENDING;
    }
  }

  private calculateOverallStatus(statuses: {
    selectionStatus: PrismaEditingWorkflowStatus;
    albumStatus: PrismaEditingWorkflowStatus;
    videoStatus: PrismaEditingWorkflowStatus;
    coverStatus: PrismaEditingWorkflowStatus;
    pendriveStatus: PrismaEditingWorkflowStatus;
    handoverStatus: PrismaEditingWorkflowStatus;
  }): PrismaEditingOverallStatus {
    const values = [
      statuses.selectionStatus,
      statuses.albumStatus,
      statuses.videoStatus,
      statuses.coverStatus,
      statuses.pendriveStatus,
      statuses.handoverStatus,
    ];

    if (values.every((status) => status === PrismaEditingWorkflowStatus.COMPLETED)) {
      return PrismaEditingOverallStatus.COMPLETED;
    }

    if (values.some((status) => status === PrismaEditingWorkflowStatus.IN_PROGRESS)) {
      return PrismaEditingOverallStatus.ONGOING;
    }

    return PrismaEditingOverallStatus.PENDING;
  }

  private toResponse(editingProject: EditingWithBooking) {
    return {
      id: editingProject.id,
      bookingId: editingProject.bookingId,
      bookingNumber: editingProject.booking.bookingNumber,
      clientName: editingProject.booking.clientName,
      mobile: editingProject.booking.mobile,
      eventName: editingProject.booking.eventName,
      eventDate: editingProject.booking.eventDate.toISOString(),
      photographerName: editingProject.booking.photographerName,
      totalAmount: Number(editingProject.booking.totalAmount),
      advanceAmount: Number(editingProject.booking.advanceAmount),
      balanceAmount: Number(editingProject.booking.balanceAmount),
      bookingStatus: editingProject.booking.status.toLowerCase(),
      editorName: editingProject.editorName,
      assignedDate: editingProject.assignedDate.toISOString(),
      selectionStatus: editingProject.selectionStatus.toLowerCase(),
      albumStatus: editingProject.albumStatus.toLowerCase(),
      videoStatus: editingProject.videoStatus.toLowerCase(),
      coverStatus: editingProject.coverStatus.toLowerCase(),
      pendriveStatus: editingProject.pendriveStatus.toLowerCase(),
      handoverStatus: editingProject.handoverStatus.toLowerCase(),
      overallStatus: editingProject.overallStatus.toLowerCase(),
      remarks: editingProject.remarks,
      booking: {
        id: editingProject.booking.id,
        bookingNumber: editingProject.booking.bookingNumber,
        clientName: editingProject.booking.clientName,
        mobile: editingProject.booking.mobile,
        eventName: editingProject.booking.eventName,
        eventDate: editingProject.booking.eventDate.toISOString(),
        photographerName: editingProject.booking.photographerName,
        totalAmount: Number(editingProject.booking.totalAmount),
        advanceAmount: Number(editingProject.booking.advanceAmount),
        balanceAmount: Number(editingProject.booking.balanceAmount),
        status: editingProject.booking.status.toLowerCase(),
        createdAt: editingProject.booking.createdAt.toISOString(),
        updatedAt: editingProject.booking.updatedAt.toISOString(),
      },
      createdAt: editingProject.createdAt.toISOString(),
      updatedAt: editingProject.updatedAt.toISOString(),
    };
  }

  private async findById(id: string) {
    const editingProject = await this.prisma.editingProject.findUnique({
      where: { id },
      include: { booking: true },
    });

    if (!editingProject) {
      throw new NotFoundException({
        success: false,
        message: 'Editing project not found',
      });
    }

    return editingProject;
  }

  async findAll(query: GetEditingQueryDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Number(query.limit) || 10);
    const skip = (page - 1) * limit;

    const where: Prisma.EditingProjectWhereInput = {};
    const search = this.normalizeText(query.search);

    if (search) {
      where.OR = [
        { editorName: { contains: search, mode: 'insensitive' } },
        {
          booking: {
            is: {
              OR: [
                { bookingNumber: { contains: search, mode: 'insensitive' } },
                { clientName: { contains: search, mode: 'insensitive' } },
                { eventName: { contains: search, mode: 'insensitive' } },
              ],
            },
          },
        },
      ];
    }

    const status = this.normalizeText(query.status);
    if (status && status !== 'all') {
      where.overallStatus = this.mapOverallStatus(status);
    }

    const [total, projects] = await Promise.all([
      this.prisma.editingProject.count({ where }),
      this.prisma.editingProject.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ assignedDate: 'desc' }, { createdAt: 'desc' }],
        include: { booking: true },
      }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      success: true,
      data: projects.map((project) => this.toResponse(project)),
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  async findOne(id: string) {
    const editingProject = await this.findById(id);

    return {
      success: true,
      data: this.toResponse(editingProject),
    };
  }

  async create(createEditingDto: CreateEditingDto) {
    const bookingId = this.normalizeText(createEditingDto.bookingId);
    const editorName = this.normalizeText(createEditingDto.editorName);

    if (!bookingId || !editorName) {
      throw new BadRequestException({
        success: false,
        message: 'bookingId and editorName are required',
      });
    }

    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) {
      throw new NotFoundException({
        success: false,
        message: 'Booking not found',
      });
    }

    const existingProject = await this.prisma.editingProject.findUnique({
      where: { bookingId },
    });

    if (existingProject) {
      throw new ConflictException({
        success: false,
        message: 'Editing project already exists for this booking',
      });
    }

    const selectionStatus = this.mapWorkflowStatus(createEditingDto.selectionStatus);
    const albumStatus = this.mapWorkflowStatus(createEditingDto.albumStatus);
    const videoStatus = this.mapWorkflowStatus(createEditingDto.videoStatus);
    const coverStatus = this.mapWorkflowStatus(createEditingDto.coverStatus);
    const pendriveStatus = this.mapWorkflowStatus(createEditingDto.pendriveStatus);
    const handoverStatus = this.mapWorkflowStatus(createEditingDto.handoverStatus);

    const editingProject = await this.prisma.editingProject.create({
      data: {
        bookingId,
        editorName,
        assignedDate: createEditingDto.assignedDate
          ? new Date(createEditingDto.assignedDate)
          : new Date(),
        selectionStatus,
        albumStatus,
        videoStatus,
        coverStatus,
        pendriveStatus,
        handoverStatus,
        overallStatus: this.calculateOverallStatus({
          selectionStatus,
          albumStatus,
          videoStatus,
          coverStatus,
          pendriveStatus,
          handoverStatus,
        }),
        remarks: this.normalizeText(createEditingDto.remarks) ?? null,
      },
      include: { booking: true },
    });

    return {
      success: true,
      data: this.toResponse(editingProject),
    };
  }

  async update(id: string, updateEditingDto: UpdateEditingDto) {
    await this.findById(id);

    const editingProject = await this.prisma.editingProject.update({
      where: { id },
      data: {
        ...(updateEditingDto.editorName !== undefined
          ? { editorName: updateEditingDto.editorName.trim() }
          : {}),
        ...(updateEditingDto.remarks !== undefined
          ? { remarks: updateEditingDto.remarks.trim() || null }
          : {}),
        ...(updateEditingDto.overallStatus !== undefined
          ? { overallStatus: this.mapOverallStatus(updateEditingDto.overallStatus) }
          : {}),
      },
      include: { booking: true },
    });

    return {
      success: true,
      data: this.toResponse(editingProject),
    };
  }

  async updateProgress(id: string, updateEditingProgressDto: UpdateEditingProgressDto) {
    const existing = await this.findById(id);

    const selectionStatus = updateEditingProgressDto.selectionStatus
      ? this.mapWorkflowStatus(updateEditingProgressDto.selectionStatus)
      : existing.selectionStatus;
    const albumStatus = updateEditingProgressDto.albumStatus
      ? this.mapWorkflowStatus(updateEditingProgressDto.albumStatus)
      : existing.albumStatus;
    const videoStatus = updateEditingProgressDto.videoStatus
      ? this.mapWorkflowStatus(updateEditingProgressDto.videoStatus)
      : existing.videoStatus;
    const coverStatus = updateEditingProgressDto.coverStatus
      ? this.mapWorkflowStatus(updateEditingProgressDto.coverStatus)
      : existing.coverStatus;
    const pendriveStatus = updateEditingProgressDto.pendriveStatus
      ? this.mapWorkflowStatus(updateEditingProgressDto.pendriveStatus)
      : existing.pendriveStatus;
    const handoverStatus = updateEditingProgressDto.handoverStatus
      ? this.mapWorkflowStatus(updateEditingProgressDto.handoverStatus)
      : existing.handoverStatus;

    const overallStatus = this.calculateOverallStatus({
      selectionStatus,
      albumStatus,
      videoStatus,
      coverStatus,
      pendriveStatus,
      handoverStatus,
    });

    const editingProject = await this.prisma.editingProject.update({
      where: { id },
      data: {
        selectionStatus,
        albumStatus,
        videoStatus,
        coverStatus,
        pendriveStatus,
        handoverStatus,
        overallStatus,
      },
      include: { booking: true },
    });

    return {
      success: true,
      data: this.toResponse(editingProject),
    };
  }

  async remove(id: string) {
    await this.findById(id);

    await this.prisma.editingProject.delete({ where: { id } });

    return {
      success: true,
      message: 'Editing project deleted successfully',
    };
  }
}