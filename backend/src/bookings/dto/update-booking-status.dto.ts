import { IsEnum, IsNotEmpty } from 'class-validator';
import { BookingStatusDto } from './create-booking.dto';

export class UpdateBookingStatusDto {
  @IsEnum(BookingStatusDto, {
    message: 'Status must be one of: completed, ongoing, pending',
  })
  @IsNotEmpty()
  status: BookingStatusDto;
}
