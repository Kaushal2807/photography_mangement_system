import { Body, Controller, Get, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SettingsService } from './settings.service';
import { UpdateStudioDto } from './dto/update-studio.dto';
import { UpdateInvoiceSettingsDto } from './dto/update-invoice.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@UseGuards(JwtAuthGuard)
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('studio')
  getStudio() {
    return this.settingsService.getStudioSettings();
  }

  @Patch('studio')
  updateStudio(@Body() body: UpdateStudioDto) {
    return this.settingsService.updateStudioSettings(body);
  }

  @Get('invoice')
  getInvoiceSettings() {
    return this.settingsService.getInvoiceSettings();
  }

  @Patch('invoice')
  updateInvoiceSettings(@Body() body: UpdateInvoiceSettingsDto) {
    return this.settingsService.updateInvoiceSettings(body);
  }

  @Get('account')
  getAccount(@Request() req: any) {
    return this.settingsService.getAccount(req.user.sub);
  }

  @Patch('account')
  updateAccount(@Request() req: any, @Body() body: UpdateAccountDto) {
    return this.settingsService.updateAccount(req.user.sub, body);
  }

  @Post('account/change-password')
  async changePassword(@Request() req: any, @Body() body: ChangePasswordDto) {
    return this.settingsService.changePassword(req.user.sub, body.currentPassword, body.newPassword);
  }
}
