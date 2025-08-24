import { Module } from '@nestjs/common';
import { UploadService } from './upload.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [UploadService],
  exports: [UploadService],
})
export class UploadModule {}