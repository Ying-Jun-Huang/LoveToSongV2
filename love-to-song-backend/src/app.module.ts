import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SongsModule } from './songs/songs.module';
import { LayoutModule } from './layout/layout.module';
import { PlayersModule } from './players/players.module';
import { UploadModule } from './upload/upload.module';
import { SongRequestsModule } from './song-requests/song-requests.module';
import { SingersModule } from './singers/singers.module';
// New v2 modules
import { EventsModule } from './events/events.module';
import { QueueModule } from './queue/queue.module';
import { WishSongModule } from './wishsong/wishsong.module';
// import { AuditModule } from './audit/audit.module';
import { NotificationModule } from './notifications/notification.module';
import { ReportModule } from './reports/report.module';
import { WebSocketModule } from './websocket/websocket.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '7d' },
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    SongsModule,
    LayoutModule,
    PlayersModule,
    UploadModule,
    SongRequestsModule,
    SingersModule,
    // New v2 modules
    EventsModule,
    QueueModule,
    WishSongModule,
    // AuditModule,
    NotificationModule,
    ReportModule,
    WebSocketModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
