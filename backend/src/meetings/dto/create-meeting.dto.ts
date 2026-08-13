import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum MeetingStatus {
  SCHEDULED = 'scheduled',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  CONVERTED = 'converted',
}

export class CreateMeetingDto {
  @IsString()
  @IsNotEmpty()
  clientName: string;

  @IsString()
  @IsNotEmpty()
  mobile: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsDateString()
  @IsNotEmpty()
  meetingDate: string;

  @IsString()
  @IsNotEmpty()
  meetingTime: string;

  @IsString()
  @IsNotEmpty()
  eventType: string;

  @IsString()
  @IsOptional()
  photographerName?: string;

  @IsString()
  @IsOptional()
  eventLocation?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsEnum(MeetingStatus)
  @IsOptional()
  status?: MeetingStatus;
}
