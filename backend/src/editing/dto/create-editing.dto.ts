import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export enum EditingWorkflowStatusDto {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

export enum EditingOverallStatusDto {
  PENDING = 'pending',
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
}

export class CreateEditingDto {
  @IsString()
  @IsNotEmpty()
  bookingId: string;

  @IsString()
  @IsNotEmpty()
  editorName: string;

  @IsDateString()
  @IsOptional()
  assignedDate?: string;

  @IsOptional()
  @IsEnum(EditingWorkflowStatusDto)
  selectionStatus?: EditingWorkflowStatusDto;

  @IsOptional()
  @IsEnum(EditingWorkflowStatusDto)
  albumStatus?: EditingWorkflowStatusDto;

  @IsOptional()
  @IsEnum(EditingWorkflowStatusDto)
  videoStatus?: EditingWorkflowStatusDto;

  @IsOptional()
  @IsEnum(EditingWorkflowStatusDto)
  coverStatus?: EditingWorkflowStatusDto;

  @IsOptional()
  @IsEnum(EditingWorkflowStatusDto)
  pendriveStatus?: EditingWorkflowStatusDto;

  @IsOptional()
  @IsEnum(EditingWorkflowStatusDto)
  handoverStatus?: EditingWorkflowStatusDto;

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsOptional()
  @IsEnum(EditingOverallStatusDto)
  overallStatus?: EditingOverallStatusDto;
}