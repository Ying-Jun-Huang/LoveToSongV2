import { Module } from '@nestjs/common';
import { SongRequestsController } from './song-requests.controller';
import { SongRequestsService } from './song-requests.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SongRequestsController],
  providers: [SongRequestsService],
  exports: [SongRequestsService],
})
export class SongRequestsModule {}