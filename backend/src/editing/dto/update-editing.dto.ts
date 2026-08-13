import { IsEnum, IsOptional, IsString } from 'class-validator';
import { EditingOverallStatusDto } from './create-editing.dto';

export class UpdateEditingDto {
  @IsOptional()
  @IsString()
  editorName?: string;

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsOptional()
  @IsEnum(EditingOverallStatusDto)
  overallStatus?: EditingOverallStatusDto;
}