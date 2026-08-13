import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  async getHealth() {
    return this.appService.getHealth();
  }

  @Get('dashboard/stats')
  async getDashboardStats() {
    return this.appService.getDashboardStats();
  }
}

