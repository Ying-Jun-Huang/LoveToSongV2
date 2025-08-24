import { useEffect, useRef, useCallback, useState } from 'react';
import websocketService, { RequestUpdate, EventUpdate, SystemNotification, QueueUpdate } from '../services/websocket-simple';

export interface WebSocketHookOptions {
  autoConnect?: boolean;
  eventId?: number;
}

export interface WebSocketState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  lastMessage: any;
  connectionAttempts: number;
}

export const useWebSocket = (options: WebSocketHookOptions = {}) => {
  const { autoConnect = true, eventId } = options;
  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    isConnecting: false,
    error: null,
    lastMessage: null,
    connectionAttempts: 0
  });

  const eventListeners = useRef<Map<string, Function>>(new Map());

  // 連接WebSocket
  const connect = useCallback(async () => {
    setState(prev => ({ ...prev, isConnecting: true, error: null }));
    
    try {
      const success = await websocketService.connect();
      setState(prev => ({
        ...prev,
        isConnected: success,
        isConnecting: false,
        connectionAttempts: prev.connectionAttempts + 1
      }));

      if (success && eventId) {
        websocketService.joinEvent(eventId);
      }

      return success;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isConnected: false,
        isConnecting: false,
        error: error.message || 'WebSocket連接失敗',
        connectionAttempts: prev.connectionAttempts + 1
      }));
      return false;
    }
  }, [eventId]);

  // 斷開連接
  const disconnect = useCallback(() => {
    if (eventId) {
      websocketService.leaveEvent(eventId);
    }
    websocketService.disconnect();
    setState(prev => ({
      ...prev,
      isConnected: false,
      isConnecting: false,
      error: null
    }));
  }, [eventId]);

  // 監聽事件
  const on = useCallback((event: string, callback: Function) => {
    websocketService.on(event, callback);
    eventListeners.current.set(event, callback);
  }, []);

  // 取消監聽事件
  const off = useCallback((event: string) => {
    const callback = eventListeners.current.get(event);
    if (callback) {
      websocketService.off(event, callback);
      eventListeners.current.delete(event);
    }
  }, []);

  // 發送消息
  const send = useCallback((event: string, data?: any) => {
    websocketService.send(event, data);
  }, []);

  // 初始化和清理
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      // 清理所有監聽器
      eventListeners.current.forEach((callback, event) => {
        websocketService.off(event, callback);
      });
      eventListeners.current.clear();
    };
  }, [autoConnect, connect]);

  // 更新連接狀態
  useEffect(() => {
    const updateConnectionStatus = () => {
      const status = websocketService.getConnectionStatus();
      setState(prev => ({
        ...prev,
        isConnected: status.isConnected,
        connectionAttempts: status.reconnectAttempts
      }));
    };

    const intervalId = setInterval(updateConnectionStatus, 1000);
    return () => clearInterval(intervalId);
  }, []);

  return {
    // 狀態
    ...state,
    
    // 方法
    connect,
    disconnect,
    on,
    off,
    send,

    // WebSocket狀態
    websocketStatus: websocketService.getConnectionStatus()
  };
};

// 專用的點歌隊列更新Hook  
const useQueueUpdates = (eventId: number = 1, onUpdate?: (data: any) => void) => {
  const { on, off, isConnected } = useWebSocket({ eventId });
  const [queueData, setQueueData] = useState<any>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    const handleRequestUpdate = (update: RequestUpdate) => {
      console.log('[Queue Hook] 點歌請求更新:', update);
      setLastUpdate(new Date());
      if (onUpdate) onUpdate(update);
    };

    const handleQueueUpdate = (update: QueueUpdate) => {
      console.log('[Queue Hook] 隊列更新:', update);
      setQueueData(update);
      setLastUpdate(new Date());
      if (onUpdate) onUpdate(update);
    };

    const handleEventUpdate = (update: EventUpdate) => {
      console.log('[Queue Hook] 活動更新:', update);
      setLastUpdate(new Date());
      if (onUpdate) onUpdate(update);
    };

    if (isConnected) {
      on('request_update', handleRequestUpdate);
      on('queue_update', handleQueueUpdate);
      on('event_update', handleEventUpdate);
    }

    return () => {
      off('request_update');
      off('queue_update');
      off('event_update');
    };
  }, [isConnected, on, off, onUpdate]);

  return {
    queueData,
    lastUpdate,
    isConnected
  };
};

// 系統通知Hook
const useSystemNotifications = (onNotification?: (notification: SystemNotification) => void) => {
  const { on, off, isConnected } = useWebSocket();
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);

  useEffect(() => {
    const handleNotification = (notification: SystemNotification) => {
      console.log('[Notification Hook] 系統通知:', notification);
      setNotifications(prev => [notification, ...prev.slice(0, 9)]); // 保留最新10條
      if (onNotification) onNotification(notification);
    };

    if (isConnected) {
      on('system_notification', handleNotification);
    }

    return () => {
      off('system_notification');
    };
  }, [isConnected, on, off, onNotification]);

  return {
    notifications,
    isConnected
  };
};

export default useWebSocket;

// Export other hooks for named imports
export { useQueueUpdates, useSystemNotifications };