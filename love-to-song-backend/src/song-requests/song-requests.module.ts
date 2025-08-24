import { Module, forwardRef } from '@nestjs/common';
import { SongRequestsController } from './song-requests.controller';
import { SongRequestsService } from './song-requests.service';
import { PrismaModule } from '../prisma/prisma.module';
import { WebSocketModule } from '../websocket/websocket.module';

@Module({
  imports: [PrismaModule, forwardRef(() => WebSocketModule)],
  controllers: [SongRequestsController],
  providers: [SongRequestsService],
  exports: [SongRequestsService],
})
export class SongRequestsModule {}