import { useEffect, useState } from 'react';
import websocketService from '../services/websocket-simple';

// 專用的點歌隊列更新Hook
export const useQueueUpdates = (eventId = 1, onUpdate) => {
  const [queueData, setQueueData] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // 連接 WebSocket
    const connectWebSocket = async () => {
      try {
        const connected = await websocketService.connect();
        setIsConnected(connected);
        if (connected && eventId) {
          websocketService.joinEvent(eventId);
        }
      } catch (error) {
        console.error('[Queue Hook] WebSocket 連接失敗:', error);
        setIsConnected(false);
      }
    };

    connectWebSocket();

    // 設置事件監聽
    const handleRequestUpdate = (update) => {
      console.log('[Queue Hook] 點歌請求更新:', update);
      setLastUpdate(new Date());
      if (onUpdate) onUpdate(update);
    };

    const handleQueueUpdate = (update) => {
      console.log('[Queue Hook] 隊列更新:', update);
      setQueueData(update);
      setLastUpdate(new Date());
      if (onUpdate) onUpdate(update);
    };

    const handleEventUpdate = (update) => {
      console.log('[Queue Hook] 活動更新:', update);
      setLastUpdate(new Date());
      if (onUpdate) onUpdate(update);
    };

    websocketService.on('request_update', handleRequestUpdate);
    websocketService.on('queue_update', handleQueueUpdate);
    websocketService.on('event_update', handleEventUpdate);

    // 定期檢查連接狀態
    const statusInterval = setInterval(() => {
      const status = websocketService.getConnectionStatus();
      setIsConnected(status.isConnected);
    }, 1000);

    return () => {
      clearInterval(statusInterval);
      websocketService.off('request_update', handleRequestUpdate);
      websocketService.off('queue_update', handleQueueUpdate);
      websocketService.off('event_update', handleEventUpdate);
      if (eventId) {
        websocketService.leaveEvent(eventId);
      }
    };
  }, [eventId, onUpdate]);

  return {
    queueData,
    lastUpdate,
    isConnected
  };
};

// 系統通知Hook
export const useSystemNotifications = (onNotification) => {
  const [notifications, setNotifications] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // 連接 WebSocket
    const connectWebSocket = async () => {
      try {
        const connected = await websocketService.connect();
        setIsConnected(connected);
      } catch (error) {
        console.error('[Notification Hook] WebSocket 連接失敗:', error);
        setIsConnected(false);
      }
    };

    connectWebSocket();

    const handleNotification = (notification) => {
      console.log('[Notification Hook] 系統通知:', notification);
      setNotifications(prev => [notification, ...prev.slice(0, 9)]); // 保留最新10條
      if (onNotification) onNotification(notification);
    };

    websocketService.on('system_notification', handleNotification);

    // 定期檢查連接狀態
    const statusInterval = setInterval(() => {
      const status = websocketService.getConnectionStatus();
      setIsConnected(status.isConnected);
    }, 1000);

    return () => {
      clearInterval(statusInterval);
      websocketService.off('system_notification', handleNotification);
    };
  }, [onNotification]);

  return {
    notifications,
    isConnected
  };
};