import { io, Socket } from 'socket.io-client';

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

export interface SystemNotification {
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
  timestamp: Date;
  targetUsers?: number[];
  targetEvents?: number[];
}

export interface QueueUpdate {
  type: 'queue_reordered' | 'queue_updated';
  eventId: number;
  data: any;
  timestamp: Date;
}

class WebSocketServiceSimple {
  private socket: Socket | null = null;
  private isConnected = false;
  private isConnecting = false;
  private eventListeners = new Map<string, Set<Function>>();
  private connectionTimeout: NodeJS.Timeout | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private serverDisconnected = false; // 標記服務器是否主動斷開

  // 連接到 WebSocket
  async connect(token?: string): Promise<boolean> {
    // 如果服務器主動斷開，不允許重連
    if (this.serverDisconnected) {
      console.log('[WebSocket] 服務器已斷開連接，停止嘗試連接');
      return false;
    }

    if (this.isConnected && this.socket) {
      return true;
    }

    if (this.isConnecting) {
      return false;
    }

    this.isConnecting = true;

    try {
      const wsToken = token || localStorage.getItem('token');
      
      if (!wsToken) {
        console.log('[WebSocket] 沒有認證token，跳過連接');
        this.isConnecting = false;
        return false;
      }

      // 清理舊連接
      if (this.socket) {
        this.socket.disconnect();
        this.socket = null;
      }

      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
      
      this.socket = io(`${apiUrl}/realtime`, {
        auth: { token: wsToken },
        transports: ['websocket'],
        timeout: 10000,
        reconnection: false, // 手動控制重連
      });

      return new Promise((resolve) => {
        if (!this.socket) {
          resolve(false);
          return;
        }

        // 設置連接超時
        this.connectionTimeout = setTimeout(() => {
          console.warn('[WebSocket] 連接超時');
          this.cleanup();
          resolve(false);
        }, 10000);

        this.socket.on('connect', () => {
          console.log('[WebSocket] 連接成功');
          this.isConnected = true;
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.serverDisconnected = false; // 重置服務器斷開標記
          
          if (this.connectionTimeout) {
            clearTimeout(this.connectionTimeout);
            this.connectionTimeout = null;
          }
          
          this.setupEventListeners();
          resolve(true);
        });

        this.socket.on('connect_error', (error) => {
          console.error('[WebSocket] 連接錯誤:', error);
          this.handleConnectionError();
          resolve(false);
        });

        this.socket.on('disconnect', (reason) => {
          console.log('[WebSocket] 斷開連接:', reason);
          this.isConnected = false;
          this.isConnecting = false;
          
          if (reason === 'io server disconnect') {
            // 服務器主動斷開，標記並停止重連
            console.log('[WebSocket] 服務器主動斷開，停止重連');
            this.serverDisconnected = true;
            return;
          }
          
          this.scheduleReconnect();
        });
      });
    } catch (error) {
      console.error('[WebSocket] 連接失敗:', error);
      this.isConnecting = false;
      return false;
    }
  }

  private setupEventListeners() {
    if (!this.socket) return;

    // 請求更新
    this.socket.on('request_update', (update: RequestUpdate) => {
      this.emit('request_update', update);
    });

    // 事件更新
    this.socket.on('event_update', (update: EventUpdate) => {
      this.emit('event_update', update);
    });

    // 系統通知
    this.socket.on('system_notification', (notification: SystemNotification) => {
      this.emit('system_notification', notification);
    });

    // 隊列更新
    this.socket.on('queue_update', (data: any) => {
      this.emit('queue_update', data);
    });
  }

  private handleConnectionError() {
    this.cleanup();
    this.scheduleReconnect();
  }

  private scheduleReconnect() {
    if (this.serverDisconnected) {
      console.log('[WebSocket] 服務器已斷開，跳過重連');
      return;
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('[WebSocket] 達到最大重連次數，停止重連');
      return;
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
    this.reconnectAttempts++;

    console.log(`[WebSocket] 將在 ${delay}ms 後嘗試重連 (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private cleanup() {
    this.isConnected = false;
    this.isConnecting = false;

    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // 斷開連接
  disconnect() {
    console.log('[WebSocket] 手動斷開連接');
    this.reconnectAttempts = this.maxReconnectAttempts; // 防止自動重連
    this.cleanup();
  }

  // 重置連接狀態（允許重新連接）
  resetConnection() {
    console.log('[WebSocket] 重置連接狀態');
    this.serverDisconnected = false;
    this.reconnectAttempts = 0;
    this.cleanup();
  }

  // 添加事件監聽器
  on(event: string, listener: Function) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(listener);
  }

  // 移除事件監聽器
  off(event: string, listener: Function) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  // 發送事件
  private emit(event: string, data: any) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`[WebSocket] 事件監聽器錯誤 (${event}):`, error);
        }
      });
    }
  }

  // 訂閱事件
  subscribeToEvent(eventId: number) {
    if (this.socket && this.isConnected) {
      this.socket.emit('subscribe_event', { eventId });
    }
  }

  // 取消訂閱事件
  unsubscribeFromEvent(eventId: number) {
    if (this.socket && this.isConnected) {
      this.socket.emit('unsubscribe_event', { eventId });
    }
  }

  // 獲取連接狀態
  get connected() {
    return this.isConnected;
  }

  // 加入事件房間
  joinEvent(eventId: number) {
    if (this.socket && this.isConnected) {
      this.socket.emit('join_event', { eventId });
      console.log(`[WebSocket] 加入事件房間: ${eventId}`);
    }
  }

  // 離開事件房間
  leaveEvent(eventId: number) {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave_event', { eventId });
      console.log(`[WebSocket] 離開事件房間: ${eventId}`);
    }
  }

  // 發送消息
  send(event: string, data?: any) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    } else {
      console.warn('[WebSocket] 無法發送消息 - 未連接');
    }
  }

  // 獲取連接狀態詳情
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      isConnecting: this.isConnecting,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts
    };
  }
}

// 導出單例
const websocketService = new WebSocketServiceSimple();
export default websocketService;