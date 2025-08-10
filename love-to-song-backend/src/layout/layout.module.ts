// file: love-to-song-backend/src/layout/layout.module.ts
import { Module } from '@nestjs/common';
import { LayoutController } from './layout.controller';
import { LayoutService } from './layout.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [LayoutController],
  providers: [LayoutService],
})
export class LayoutModule {}
