import { Module } from '@nestjs/common';
import { WishSongService } from './wishsong.service';
import { WishSongController } from './wishsong.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  providers: [WishSongService, PrismaService],
  controllers: [WishSongController],
  exports: [WishSongService],
})
export class WishSongModule {}