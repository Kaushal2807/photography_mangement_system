import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EditingController } from './editing.controller';
import { EditingService } from './editing.service';

@Module({
  imports: [PrismaModule],
  controllers: [EditingController],
  providers: [EditingService],
})
export class EditingModule {}