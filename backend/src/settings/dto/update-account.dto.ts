import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class UpdateAccountDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{10,15}$/, {
    message: 'mobile must be a valid number with 10 to 15 digits',
  })
  mobile: string;

  @IsEmail()
  @IsOptional()
  email?: string;
}
