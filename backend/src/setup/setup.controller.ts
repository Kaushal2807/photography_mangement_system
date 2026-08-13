import { Body, Controller, Get, Post } from '@nestjs/common';
import { CreateSetupDto } from './dto/create-setup.dto';
import { SetupService } from './setup.service';

@Controller('setup')
export class SetupController {
  constructor(private readonly setupService: SetupService) {}

  @Get('status')
  getStatus(): Promise<{ isSetupCompleted: boolean }> {
    return this.setupService.getSetupStatus();
  }

  @Post()
  createSetup(
    @Body() createSetupDto: CreateSetupDto,
  ): Promise<{ success: boolean; message: string }> {
    return this.setupService.completeSetup(createSetupDto);
  }
}
