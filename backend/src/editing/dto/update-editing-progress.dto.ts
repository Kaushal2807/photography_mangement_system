import { IsEnum, IsOptional } from 'class-validator';
import { EditingWorkflowStatusDto } from './create-editing.dto';

export class UpdateEditingProgressDto {
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
}