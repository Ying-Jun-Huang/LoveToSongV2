import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { WebSocketGatewayService } from './websocket.gateway';
import { WebSocketService } from './websocket.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  providers: [WebSocketGatewayService, WebSocketService],
  exports: [WebSocketService, WebSocketGatewayService],
})
export class WebSocketModule {}