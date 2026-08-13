import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { existsSync, readFileSync } from 'fs';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { GetInvoicesQueryDto } from './dto/get-invoices-query.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { InvoiceService } from './invoice.service';

@Controller('invoice')
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Get()
  findAll(@Query() query: GetInvoicesQueryDto) {
    return this.invoiceService.findAll(query);
  }

  @Post()
  create(@Body() createInvoiceDto: CreateInvoiceDto) {
    return this.invoiceService.create(createInvoiceDto);
  }

  @Get('booking/:bookingId/context')
  getBookingContext(@Param('bookingId') bookingId: string) {
    return this.invoiceService.getBookingContext(bookingId);
  }

  @Post('logo')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const dir = join(process.cwd(), 'uploads', 'logos');
          require('fs').mkdirSync(dir, { recursive: true });
          cb(null, dir);
        },
        filename: (req, file, cb) => {
          const ext = extname(file.originalname) || '.png';
          cb(null, `logo-${Date.now()}${ext}`);
        },
      }),
    }),
  )
  async uploadLogo(@UploadedFile() file: any) {
    if (!file) {
      throw new BadRequestException('No logo file uploaded');
    }
    return this.invoiceService.updateStudioLogo(file.path);
  }

  @Get('logo/file')
  async getLogoFile(@Res({ passthrough: true }) res: Response) {
    const studioSettings = await (this.invoiceService as any).getStudioSettings();
    if (studioSettings?.logoUrl && existsSync(studioSettings.logoUrl)) {
      const buffer = readFileSync(studioSettings.logoUrl);
      const ext = extname(studioSettings.logoUrl).toLowerCase();
      const mime = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : ext === '.svg' ? 'image/svg+xml' : 'image/png';
      res.set({ 'Content-Type': mime });
      return new StreamableFile(buffer);
    }
    res.status(404);
    return null;
  }

  @Get(':id/pdf')
  async downloadPdf(@Param('id') id: string, @Res({ passthrough: true }) res: Response) {
    const file = await this.invoiceService.downloadPdf(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${file.filename}"`,
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      Pragma: 'no-cache',
      Expires: '0',
    });
    return new StreamableFile(file.buffer);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.invoiceService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateInvoiceDto: UpdateInvoiceDto) {
    return this.invoiceService.update(id, updateInvoiceDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.invoiceService.remove(id);
  }
}