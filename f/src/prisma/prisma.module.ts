// file: love-to-song-backend/src/prisma/prisma.module.ts
import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Module({
  providers: [PrismaService],
  exports: [PrismaService],  // export so other modules can use it
})
export class PrismaModule {}
