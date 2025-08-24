import { Injectable } from '@nestjs/common';
import { WebSocketGatewayService as WSGateway, RequestUpdate, EventUpdate } from './websocket.gateway';

@Injectable()
export class WebSocketService {
  constructor(private wsGateway: WSGateway) {}

  // 點歌請求相關通知
  notifyRequestCreated(eventId: number, request: any) {
    const update: RequestUpdate = {
      type: 'request_created',
      eventId,
      data: {
        request,
        message: `新的點歌請求：${request.song?.title || '未知歌曲'}`
      },
      timestamp: new Date()
    };
    this.wsGateway.broadcastRequestUpdate(update);
  }

  notifyRequestUpdated(eventId: number, request: any, oldStatus?: string) {
    const update: RequestUpdate = {
      type: 'request_updated',
      eventId,
      data: {
        request,
        oldStatus,
        message: this.getRequestStatusMessage(request.status, request.song?.title)
      },
      timestamp: new Date()
    };
    this.wsGateway.broadcastRequestUpdate(update);
  }

  notifyRequestDeleted(eventId: number, requestId: number, songTitle?: string) {
    const update: RequestUpdate = {
      type: 'request_deleted',
      eventId,
      data: {
        requestId,
        message: `點歌請求已刪除${songTitle ? `：${songTitle}` : ''}`
      },
      timestamp: new Date()
    };
    this.wsGateway.broadcastRequestUpdate(update);
  }

  notifyQueueReordered(eventId: number, newOrder: any[]) {
    const update: RequestUpdate = {
      type: 'queue_reordered',
      eventId,
      data: {
        newOrder,
        message: '點歌隊列已重新排序'
      },
      timestamp: new Date()
    };
    this.wsGateway.broadcastRequestUpdate(update);
  }

  // 活動相關通知
  notifyEventStarted(eventId: number, event: any) {
    const update: EventUpdate = {
      type: 'event_started',
      eventId,
      data: {
        event,
        message: `活動「${event.title}」已開始！`
      },
      timestamp: new Date()
    };
    this.wsGateway.broadcastEventUpdate(update);

    // 系統通知
    this.wsGateway.broadcastSystemNotification({
      type: 'success',
      message: `🎉 活動「${event.title}」現在開始！歡迎大家點歌！`,
      targetEvents: [eventId]
    });
  }

  notifyEventEnded(eventId: number, event: any, stats?: any) {
    const update: EventUpdate = {
      type: 'event_ended',
      eventId,
      data: {
        event,
        stats,
        message: `活動「${event.title}」已結束`
      },
      timestamp: new Date()
    };
    this.wsGateway.broadcastEventUpdate(update);

    // 系統通知
    const statsMessage = stats ? 
      `本次活動共完成 ${stats.completedRequests || 0} 首點歌` : '';
    
    this.wsGateway.broadcastSystemNotification({
      type: 'info',
      message: `🎊 活動「${event.title}」已結束！${statsMessage} 感謝大家的參與！`,
      targetEvents: [eventId]
    });
  }

  notifyEventUpdated(eventId: number, event: any, changes: string[]) {
    const update: EventUpdate = {
      type: 'event_updated',
      eventId,
      data: {
        event,
        changes,
        message: `活動「${event.title}」資訊已更新`
      },
      timestamp: new Date()
    };
    this.wsGateway.broadcastEventUpdate(update);
  }

  // 隊列更新通知
  notifyQueueUpdate(eventId: number, queueData: {
    currentlyPlaying?: any;
    nextInQueue?: any;
    totalInQueue: number;
    estimatedWaitTime?: number;
  }) {
    this.wsGateway.broadcastQueueUpdate(eventId, queueData);
  }

  // 系統通知
  notifySystemMessage(options: {
    type: 'info' | 'warning' | 'error' | 'success';
    message: string;
    targetUsers?: number[];
    targetEvents?: number[];
  }) {
    this.wsGateway.broadcastSystemNotification(options);
  }

  // 歌手相關通知
  notifySingerStatusUpdate(eventId: number, singer: any, status: 'online' | 'offline' | 'busy') {
    this.wsGateway.broadcastSystemNotification({
      type: status === 'online' ? 'success' : 'info',
      message: `歌手 ${singer.stageName} 現在${this.getSingerStatusText(status)}`,
      targetEvents: [eventId]
    });
  }

  // 點歌統計更新
  notifyStatsUpdate(eventId: number, stats: {
    totalRequests: number;
    completedRequests: number;
    averageWaitTime: number;
    popularSongs?: any[];
  }) {
    this.wsGateway.broadcastSystemNotification({
      type: 'info',
      message: `📊 活動統計更新：共 ${stats.totalRequests} 首點歌，已完成 ${stats.completedRequests} 首`,
      targetEvents: [eventId]
    });
  }

  // 緊急通知（需要用戶確認的重要消息）
  notifyEmergency(message: string, targetEvents?: number[], targetUsers?: number[]) {
    this.wsGateway.broadcastSystemNotification({
      type: 'error',
      message: `🚨 緊急通知：${message}`,
      targetEvents,
      targetUsers
    });
  }

  // 獲取在線統計
  getOnlineStats() {
    return this.wsGateway.getOnlineStats();
  }

  // 輔助方法
  private getRequestStatusMessage(status: string, songTitle?: string): string {
    const song = songTitle ? `《${songTitle}》` : '點歌請求';
    
    switch (status) {
      case 'QUEUED':
        return `${song} 已加入隊列`;
      case 'ASSIGNED':
        return `${song} 已指派歌手`;
      case 'ACCEPTED':
        return `${song} 歌手已接受`;
      case 'DECLINED':
        return `${song} 歌手已拒絕`;
      case 'PERFORMING':
        return `🎤 正在演唱 ${song}`;
      case 'COMPLETED':
        return `✅ ${song} 演唱完成`;
      case 'CANCELLED':
        return `❌ ${song} 已取消`;
      default:
        return `${song} 狀態已更新`;
    }
  }

  private getSingerStatusText(status: string): string {
    switch (status) {
      case 'online':
        return '上線了 🎤';
      case 'offline':
        return '下線了';
      case 'busy':
        return '忙碌中 🎵';
      default:
        return '狀態已更新';
    }
  }
}