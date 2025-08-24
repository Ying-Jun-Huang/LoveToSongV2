import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

export interface RequestUpdate {
  type: 'request_created' | 'request_updated' | 'request_deleted' | 'queue_reordered';
  eventId: number;
  data: any;
  timestamp: Date;
}

export interface EventUpdate {
  type: 'event_started' | 'event_ended' | 'event_updated';
  eventId: number;
  data: any;
  timestamp: Date;
}

@Injectable()
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/realtime'
})
export class WebSocketGatewayService implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private logger = new Logger('WebSocketGateway');
  private connectedClients = new Map<string, { socket: Socket; userId: number; eventIds: Set<number> }>();

  constructor(private jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      // 驗證JWT token
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.replace('Bearer ', '');
      
      if (!token) {
        this.logger.warn(`客戶端連接被拒絕: 缺少認證token`);
        client.disconnect(true);
        return;
      }

      const payload = await this.jwtService.verifyAsync(token);
      const userId = payload.sub || payload.userId;

      if (!userId) {
        this.logger.warn(`客戶端連接被拒絕: 無效的token payload`);
        client.disconnect(true);
        return;
      }

      // 保存客戶端信息
      this.connectedClients.set(client.id, {
        socket: client,
        userId,
        eventIds: new Set()
      });

      this.logger.log(`用戶 ${userId} 已連接 WebSocket (客戶端: ${client.id})`);
      
      // 發送連接確認
      client.emit('connected', {
        message: '即時通信已連接',
        userId,
        timestamp: new Date()
      });

    } catch (error) {
      this.logger.error(`WebSocket 認證失敗: ${error.message}`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    const clientInfo = this.connectedClients.get(client.id);
    if (clientInfo) {
      this.logger.log(`用戶 ${clientInfo.userId} 已斷開 WebSocket (客戶端: ${client.id})`);
      this.connectedClients.delete(client.id);
    }
  }

  // 客戶端訂閱特定活動的更新
  @SubscribeMessage('subscribe_event')
  handleSubscribeEvent(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { eventId: number }
  ) {
    const clientInfo = this.connectedClients.get(client.id);
    if (!clientInfo) {
      client.emit('error', { message: '未認證的連接' });
      return;
    }

    clientInfo.eventIds.add(data.eventId);
    client.join(`event_${data.eventId}`);
    
    this.logger.log(`用戶 ${clientInfo.userId} 訂閱活動 ${data.eventId}`);
    client.emit('subscribed', { 
      eventId: data.eventId,
      message: `已訂閱活動 ${data.eventId} 的即時更新`
    });
  }

  // 客戶端取消訂閱活動更新
  @SubscribeMessage('unsubscribe_event')
  handleUnsubscribeEvent(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { eventId: number }
  ) {
    const clientInfo = this.connectedClients.get(client.id);
    if (!clientInfo) {
      client.emit('error', { message: '未認證的連接' });
      return;
    }

    clientInfo.eventIds.delete(data.eventId);
    client.leave(`event_${data.eventId}`);
    
    this.logger.log(`用戶 ${clientInfo.userId} 取消訂閱活動 ${data.eventId}`);
    client.emit('unsubscribed', { 
      eventId: data.eventId,
      message: `已取消訂閱活動 ${data.eventId} 的即時更新`
    });
  }

  // 廣播點歌請求更新
  broadcastRequestUpdate(update: RequestUpdate) {
    const room = `event_${update.eventId}`;
    this.server.to(room).emit('request_update', update);
    this.logger.log(`廣播點歌更新到活動 ${update.eventId}: ${update.type}`);
  }

  // 廣播活動更新
  broadcastEventUpdate(update: EventUpdate) {
    const room = `event_${update.eventId}`;
    this.server.to(room).emit('event_update', update);
    this.logger.log(`廣播活動更新到活動 ${update.eventId}: ${update.type}`);
  }

  // 廣播隊列變化（當前播放歌曲、下一首等）
  broadcastQueueUpdate(eventId: number, queueData: any) {
    const room = `event_${eventId}`;
    this.server.to(room).emit('queue_update', {
      type: 'queue_changed',
      eventId,
      data: queueData,
      timestamp: new Date()
    });
    this.logger.log(`廣播隊列更新到活動 ${eventId}`);
  }

  // 發送系統通知
  broadcastSystemNotification(notification: {
    type: 'info' | 'warning' | 'error' | 'success';
    message: string;
    targetUsers?: number[];
    targetEvents?: number[];
  }) {
    if (notification.targetUsers && notification.targetUsers.length > 0) {
      // 發送給特定用戶
      this.connectedClients.forEach((clientInfo, clientId) => {
        if (notification.targetUsers!.includes(clientInfo.userId)) {
          clientInfo.socket.emit('system_notification', {
            ...notification,
            timestamp: new Date()
          });
        }
      });
    } else if (notification.targetEvents && notification.targetEvents.length > 0) {
      // 發送給特定活動的所有用戶
      notification.targetEvents.forEach(eventId => {
        const room = `event_${eventId}`;
        this.server.to(room).emit('system_notification', {
          ...notification,
          timestamp: new Date()
        });
      });
    } else {
      // 廣播給所有用戶
      this.server.emit('system_notification', {
        ...notification,
        timestamp: new Date()
      });
    }
    
    this.logger.log(`廣播系統通知: ${notification.message}`);
  }

  // 獲取在線用戶統計
  getOnlineStats() {
    const totalConnections = this.connectedClients.size;
    const uniqueUsers = new Set([...this.connectedClients.values()].map(info => info.userId)).size;
    const eventSubscriptions = new Map<number, number>();

    this.connectedClients.forEach(clientInfo => {
      clientInfo.eventIds.forEach(eventId => {
        eventSubscriptions.set(eventId, (eventSubscriptions.get(eventId) || 0) + 1);
      });
    });

    return {
      totalConnections,
      uniqueUsers,
      eventSubscriptions: Object.fromEntries(eventSubscriptions),
      timestamp: new Date()
    };
  }

  // Ping/Pong 保持連接
  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    client.emit('pong', { timestamp: new Date() });
  }

  // 客戶端請求在線統計
  @SubscribeMessage('get_stats')
  handleGetStats(@ConnectedSocket() client: Socket) {
    const clientInfo = this.connectedClients.get(client.id);
    if (!clientInfo) {
      client.emit('error', { message: '未認證的連接' });
      return;
    }

    // 只有管理員可以查看詳細統計
    // 這裡可以根據用戶權限進行過濾
    const stats = this.getOnlineStats();
    client.emit('stats', stats);
  }
}