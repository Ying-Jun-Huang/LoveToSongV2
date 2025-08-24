import React, { useState, useEffect, useCallback } from 'react';
import websocketService from '../services/websocket-simple';
import audioNotificationService from '../services/audioNotifications';

const FloatingNotifications = () => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((type, message, duration = 4000, audioType = null) => {
    const id = Date.now();
    const notification = {
      id,
      type,
      message,
      timestamp: Date.now(),
      duration
    };

    setNotifications(prev => [...prev, notification]);

    // 播放音效
    if (audioType) {
      audioNotificationService.playNotificationSound(audioType);
    } else {
      // 根據通知類型播放相應音效
      audioNotificationService.playNotificationSound(type);
    }

    // 自動移除通知
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, duration);
  }, []);

  // 監聽 WebSocket 事件並創建通知
  useEffect(() => {
    const handleRequestUpdate = (data) => {
      if (data.type === 'request_created') {
        addNotification('success', '新點歌已加入隊列！', 3000, 'new_request');
      } else if (data.type === 'request_updated') {
        addNotification('info', '點歌狀態已更新', 2500, 'queue_update');
      } else if (data.type === 'request_deleted') {
        addNotification('warning', '點歌已被取消', 2500);
      }
    };

    const handleEventUpdate = (data) => {
      if (data.type === 'event_started') {
        addNotification('success', '🎪 活動開始了！', 4000, 'event_start');
      } else if (data.type === 'event_ended') {
        addNotification('info', '🏁 活動已結束', 3000);
      }
    };

    const handleSystemNotification = (data) => {
      addNotification(data.type, data.message, 5000);
    };

    const handleConnect = () => {
      addNotification('success', '🔗 即時連線已恢復', 2000, 'connected');
    };

    const handleDisconnect = () => {
      addNotification('error', '🔌 連線中斷，正在重新連接...', 3000, 'disconnected');
    };

    websocketService.on('request_update', handleRequestUpdate);
    websocketService.on('event_update', handleEventUpdate);
    websocketService.on('system_notification', handleSystemNotification);
    websocketService.on('connect', handleConnect);
    websocketService.on('disconnect', handleDisconnect);

    return () => {
      websocketService.off('request_update', handleRequestUpdate);
      websocketService.off('event_update', handleEventUpdate);
      websocketService.off('system_notification', handleSystemNotification);
      websocketService.off('connect', handleConnect);
      websocketService.off('disconnect', handleDisconnect);
    };
  }, [addNotification]);

  const getNotificationColor = (type) => {
    switch (type) {
      case 'success': return '#4caf50';
      case 'warning': return '#ff9800';
      case 'error': return '#f44336';
      case 'info': 
      default: return '#2196f3';
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      case 'info':
      default: return 'ℹ️';
    }
  };

  return (
    <div className="floating-notifications">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`notification notification-${notification.type}`}
          style={{ '--color': getNotificationColor(notification.type) }}
        >
          <div className="notification-icon">
            {getNotificationIcon(notification.type)}
          </div>
          <div className="notification-message">
            {notification.message}
          </div>
          <div className="notification-close" onClick={() => {
            setNotifications(prev => prev.filter(n => n.id !== notification.id));
          }}>
            ×
          </div>
        </div>
      ))}

      <style jsx="true">{`
        .floating-notifications {
          position: fixed;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 1100;
          pointer-events: none;
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-width: 400px;
          width: 90%;
        }

        .notification {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.95);
          border-radius: 8px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
          border-left: 4px solid var(--color);
          backdrop-filter: blur(10px);
          animation: notificationSlideIn 0.3s ease-out;
          pointer-events: auto;
          position: relative;
          overflow: hidden;
        }

        .notification::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: var(--color);
          animation: notificationProgress 4s linear forwards;
        }

        .notification-icon {
          font-size: 18px;
          flex-shrink: 0;
        }

        .notification-message {
          flex: 1;
          font-size: 14px;
          font-weight: 500;
          color: #333333;
          line-height: 1.4;
        }

        .notification-close {
          font-size: 18px;
          color: #666666;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .notification-close:hover {
          background: rgba(0, 0, 0, 0.1);
          color: #333333;
        }

        .notification-success {
          border-left-color: #4caf50;
        }

        .notification-warning {
          border-left-color: #ff9800;
        }

        .notification-error {
          border-left-color: #f44336;
        }

        .notification-info {
          border-left-color: #2196f3;
        }

        @keyframes notificationSlideIn {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes notificationProgress {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }

        /* 響應式設計 */
        @media (max-width: 768px) {
          .floating-notifications {
            top: 10px;
            left: 10px;
            right: 10px;
            transform: none;
            max-width: none;
            width: auto;
          }

          .notification {
            padding: 10px 12px;
            gap: 8px;
          }

          .notification-message {
            font-size: 13px;
          }

          .notification-icon {
            font-size: 16px;
          }
        }

        /* 減少動畫偏好支持 */
        @media (prefers-reduced-motion: reduce) {
          .notification {
            animation: none;
          }
          
          .notification::before {
            animation: none;
          }
        }

        /* 深色模式支持 */
        @media (prefers-color-scheme: dark) {
          .notification {
            background: rgba(30, 30, 30, 0.95);
            color: #ffffff;
          }

          .notification-message {
            color: #ffffff;
          }

          .notification-close {
            color: #cccccc;
          }

          .notification-close:hover {
            background: rgba(255, 255, 255, 0.1);
            color: #ffffff;
          }
        }
      `}</style>
    </div>
  );
};

export default FloatingNotifications;