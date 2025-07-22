// file: love-to-song-backend/src/songs/songs.module.ts
import { Module } from '@nestjs/common';
import { SongsService } from './songs.service';
import { SongsController } from './songs.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SongsController],
  providers: [SongsService],
})
export class SongsModule {}
