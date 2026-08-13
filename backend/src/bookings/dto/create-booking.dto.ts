import { IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum BookingStatusDto {
  COMPLETED = 'completed',
  ONGOING = 'ongoing',
  PENDING = 'pending',
}

export class CreateBookingDto {
  @IsString()
  @IsOptional()
  bookingNumber?: string;

  @IsString()
  @IsNotEmpty()
  clientName: string;

  @IsString()
  @IsNotEmpty()
  mobile: string;

  @IsString()
  @IsNotEmpty()
  eventName: string;

  @IsDateString()
  @IsNotEmpty()
  eventDate: string;

  @IsString()
  @IsOptional()
  photographerName?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  totalAmount: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  advanceAmount?: number;

  @IsOptional()
  @IsEnum(BookingStatusDto)
  status?: BookingStatusDto;
}
