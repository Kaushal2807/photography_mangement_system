import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class UpdateInvoiceSettingsDto {
  @IsString()
  @IsNotEmpty()
  invoicePrefix: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  invoiceStartingNumber?: number;

  @IsOptional()
  defaultTaxPercentage?: number;

  @IsString()
  @IsOptional()
  invoiceTerms?: string;

  @IsString()
  @IsOptional()
  invoiceFooter?: string;
}
