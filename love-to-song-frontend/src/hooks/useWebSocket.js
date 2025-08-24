import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const useWebSocket = (options = {}) => {
  const {
    autoConnect = true,
    reconnectAttempts = 5,
    reconnectDelay = 1000,
    debug = false
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [stableConnection, setStableConnection] = useState(false);
  const [notifications, setNotifications] = useState([]);
  
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const subscribedEventsRef = useRef(new Set());
  const stableTimeoutRef = useRef(null);
  const lastConnectAttemptRef = useRef(0);
  const connectionDebounceMs = 2000; // 防止2秒內重複連接

  // 日志函数 - 完全禁用調試日誌 2024-08-12
  const log = useCallback((message, data = null) => {
    // 完全禁用所有 WebSocket 日誌
    // if (debug) {
    //   console.log(`[WebSocket] ${message}`, data || '');
    // }
  }, [debug]);

  // 獲取認證token
  const getAuthToken = useCallback(() => {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  }, []);

  // 連接WebSocket
  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      log('WebSocket已連接，跳過重複連接');
      return;
    }

    // 防抖檢查
    const now = Date.now();
    if (now - lastConnectAttemptRef.current < connectionDebounceMs) {
      log('連接請求過於頻繁，跳過此次連接');
      return;
    }
    lastConnectAttemptRef.current = now;

    const token = getAuthToken();
    if (!token) {
      log('未找到認證token，無法連接WebSocket');
      setError('需要登錄才能使用即時功能');
      return;
    }

    setIsConnecting(true);
    setError(null);

    const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
    
    log('正在連接WebSocket...', { url: `${backendUrl}/realtime` });

    const socket = io(`${backendUrl}/realtime`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true
    });

    // 連接成功
    socket.on('connect', () => {
      log('WebSocket連接成功', { id: socket.id });
      setIsConnected(true);
      setIsConnecting(false);
      setError(null);
      reconnectAttemptsRef.current = 0;
      
      // 設置穩定連接狀態的延遲檢查 (3秒後標記為穩定)
      if (stableTimeoutRef.current) {
        clearTimeout(stableTimeoutRef.current);
      }
      stableTimeoutRef.current = setTimeout(() => {
        setStableConnection(true);
        log('連接已穩定');
      }, 3000);
      
      // 重新訂閱之前的活動
      subscribedEventsRef.current.forEach(eventId => {
        socket.emit('subscribe_event', { eventId });
      });
    });

    // 連接確認
    socket.on('connected', (data) => {
      log('收到連接確認', data);
    });

    // 連接失敗
    socket.on('connect_error', (err) => {
      log('WebSocket連接失敗', err.message);
      setError(`連接失敗: ${err.message}`);
      setIsConnecting(false);
      handleReconnect();
    });

    // 斷開連接
    socket.on('disconnect', (reason) => {
      log('WebSocket已斷開', reason);
      setIsConnected(false);
      setIsConnecting(false);
      setStableConnection(false);
      
      // 清除穩定性檢查
      if (stableTimeoutRef.current) {
        clearTimeout(stableTimeoutRef.current);
        stableTimeoutRef.current = null;
      }
      
      if (reason === 'io server disconnect') {
        // 服務器主動斷開，需要重新連接
        handleReconnect();
      }
    });

    // 錯誤處理
    socket.on('error', (err) => {
      log('WebSocket錯誤', err);
      setError(err.message || '連接錯誤');
    });

    // 系統通知
    socket.on('system_notification', (notification) => {
      log('收到系統通知', notification);
      setNotifications(prev => [...prev, {
        ...notification,
        id: Date.now() + Math.random(),
        timestamp: new Date(notification.timestamp)
      }]);
    });

    socketRef.current = socket;
  }, [getAuthToken, log]);

  // 重連機制
  const handleReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= reconnectAttempts) {
      log('達到最大重連次數，停止重連');
      setError('連接失敗，請檢查網絡或刷新頁面重試');
      return;
    }

    const delay = reconnectDelay * Math.pow(2, reconnectAttemptsRef.current); // 指數退避
    reconnectAttemptsRef.current += 1;

    log(`${delay}ms後進行第${reconnectAttemptsRef.current}次重連...`);
    
    reconnectTimeoutRef.current = setTimeout(() => {
      connect();
    }, delay);
  }, [reconnectAttempts, reconnectDelay, connect, log]);

  // 斷開連接
  const disconnect = useCallback(() => {
    log('手動斷開WebSocket連接');
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (stableTimeoutRef.current) {
      clearTimeout(stableTimeoutRef.current);
      stableTimeoutRef.current = null;
    }
    
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    
    setIsConnected(false);
    setIsConnecting(false);
    setStableConnection(false);
    setError(null);
    subscribedEventsRef.current.clear();
  }, [log]);

  // 訂閱活動更新
  const subscribeToEvent = useCallback((eventId) => {
    if (!socketRef.current?.connected) {
      log('WebSocket未連接，無法訂閱活動', eventId);
      return false;
    }

    log('訂閱活動更新', eventId);
    socketRef.current.emit('subscribe_event', { eventId });
    subscribedEventsRef.current.add(eventId);
    return true;
  }, [log]);

  // 取消訂閱活動更新
  const unsubscribeFromEvent = useCallback((eventId) => {
    if (!socketRef.current?.connected) {
      log('WebSocket未連接，無法取消訂閱', eventId);
      return false;
    }

    log('取消訂閱活動更新', eventId);
    socketRef.current.emit('unsubscribe_event', { eventId });
    subscribedEventsRef.current.delete(eventId);
    return true;
  }, [log]);

  // 監聽特定事件
  const on = useCallback((event, callback) => {
    if (!socketRef.current) {
      log('WebSocket未初始化，無法監聽事件', event);
      return false;
    }

    log('添加事件監聽器', event);
    socketRef.current.on(event, callback);
    return true;
  }, [log]);

  // 移除事件監聽器
  const off = useCallback((event, callback) => {
    if (!socketRef.current) {
      log('WebSocket未初始化，無法移除事件監聽器', event);
      return false;
    }

    log('移除事件監聽器', event);
    socketRef.current.off(event, callback);
    return true;
  }, [log]);

  // 發送消息
  const emit = useCallback((event, data) => {
    if (!socketRef.current?.connected) {
      log('WebSocket未連接，無法發送消息', { event, data });
      return false;
    }

    log('發送WebSocket消息', { event, data });
    socketRef.current.emit(event, data);
    return true;
  }, [log]);

  // 清除通知
  const clearNotification = useCallback((notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  }, []);

  // 清除所有通知
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // 獲取在線統計
  const getStats = useCallback(() => {
    if (!socketRef.current?.connected) {
      log('WebSocket未連接，無法獲取統計');
      return false;
    }

    socketRef.current.emit('get_stats');
    return true;
  }, [log]);

  // Ping測試
  const ping = useCallback(() => {
    if (!socketRef.current?.connected) {
      return false;
    }

    const startTime = Date.now();
    socketRef.current.emit('ping');
    
    const handlePong = () => {
      const latency = Date.now() - startTime;
      log('Ping響應時間', `${latency}ms`);
      socketRef.current.off('pong', handlePong);
    };
    
    socketRef.current.on('pong', handlePong);
    return true;
  }, [log]);

  // 初始化連接
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  // 清理定時器
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (stableTimeoutRef.current) {
        clearTimeout(stableTimeoutRef.current);
      }
    };
  }, []);

  return {
    // 連接狀態
    isConnected,
    isConnecting,
    stableConnection,
    error,
    
    // 連接控制
    connect,
    disconnect,
    
    // 活動訂閱
    subscribeToEvent,
    unsubscribeFromEvent,
    
    // 事件處理
    on,
    off,
    emit,
    
    // 通知管理
    notifications,
    clearNotification,
    clearAllNotifications,
    
    // 工具方法
    getStats,
    ping,
    
    // 調試信息
    subscribedEvents: Array.from(subscribedEventsRef.current),
    socketId: socketRef.current?.id || null,
  };
};

export default useWebSocket;