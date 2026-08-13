import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { MeetingsModule } from './meetings/meetings.module';
import { SetupModule } from './setup/setup.module';
import { BookingsModule } from './bookings/bookings.module';
import { EditingModule } from './editing/editing.module';
import { InvoiceModule } from './invoice/invoice.module';
import { SettingsModule } from './settings/settings.module';

@Module({
  imports: [PrismaModule, SetupModule, AuthModule, MeetingsModule, BookingsModule, EditingModule, InvoiceModule, SettingsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

