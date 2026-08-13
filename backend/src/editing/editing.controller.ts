import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CreateEditingDto } from './dto/create-editing.dto';
import { GetEditingQueryDto } from './dto/get-editing-query.dto';
import { UpdateEditingProgressDto } from './dto/update-editing-progress.dto';
import { UpdateEditingDto } from './dto/update-editing.dto';
import { EditingService } from './editing.service';

@Controller('editing')
export class EditingController {
  constructor(private readonly editingService: EditingService) {}

  @Get()
  findAll(@Query() query: GetEditingQueryDto) {
    return this.editingService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.editingService.findOne(id);
  }

  @Post()
  create(@Body() createEditingDto: CreateEditingDto) {
    return this.editingService.create(createEditingDto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateEditingDto: UpdateEditingDto) {
    return this.editingService.update(id, updateEditingDto);
  }

  @Patch(':id/progress')
  updateProgress(
    @Param('id') id: string,
    @Body() updateEditingProgressDto: UpdateEditingProgressDto,
  ) {
    return this.editingService.updateProgress(id, updateEditingProgressDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.editingService.remove(id);
  }
}