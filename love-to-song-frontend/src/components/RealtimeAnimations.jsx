import React, { useState, useEffect, useCallback } from 'react';
import websocketService from '../services/websocket-simple';

const RealtimeAnimations = () => {
  const [animations, setAnimations] = useState([]);

  // 全局計數器確保唯一性
  const [animationCounter, setAnimationCounter] = useState(0);

  // 創建動畫項目
  const createAnimation = useCallback((type, data, duration = 3000) => {
    setAnimationCounter(prev => {
      const newCounter = prev + 1;
      const id = `animation-${Date.now()}-${newCounter}-${Math.random().toString(36).substr(2, 9)}`; // 確保絕對唯一的ID
      
      const animation = {
        id,
        type,
        data,
        timestamp: Date.now(),
        duration,
        isVisible: true
      };

      setAnimations(prev => [...prev, animation]);

      // 自動移除動畫
      setTimeout(() => {
        setAnimations(prev => prev.filter(anim => anim.id !== id));
      }, duration);

      return newCounter;
    });
  }, []);

  // 獲取動畫圖標和顏色
  const getAnimationConfig = (type, data) => {
    switch (type) {
      case 'request_update':
        if (data.type === 'request_created') {
          return { icon: '🎤', color: '#4caf50', label: '新點歌' };
        } else if (data.type === 'request_updated') {
          return { icon: '📝', color: '#2196f3', label: '點歌更新' };
        } else if (data.type === 'request_deleted') {
          return { icon: '❌', color: '#f44336', label: '取消點歌' };
        } else if (data.type === 'queue_reordered') {
          return { icon: '🔄', color: '#ff9800', label: '隊列調整' };
        }
        break;
      
      case 'event_update':
        if (data.type === 'event_started') {
          return { icon: '🎪', color: '#9c27b0', label: '活動開始' };
        } else if (data.type === 'event_ended') {
          return { icon: '🏁', color: '#795548', label: '活動結束' };
        } else if (data.type === 'event_updated') {
          return { icon: '📢', color: '#607d8b', label: '活動更新' };
        }
        break;
      
      case 'queue_update':
        return { icon: '📋', color: '#3f51b5', label: '隊列狀態' };
      
      case 'system_notification':
        if (data.type === 'success') {
          return { icon: '✅', color: '#4caf50', label: '成功' };
        } else if (data.type === 'warning') {
          return { icon: '⚠️', color: '#ff9800', label: '警告' };
        } else if (data.type === 'error') {
          return { icon: '🚨', color: '#f44336', label: '錯誤' };
        } else {
          return { icon: 'ℹ️', color: '#2196f3', label: '通知' };
        }
      
      case 'connection':
        if (data.status === 'connected') {
          return { icon: '🔗', color: '#4caf50', label: '已連接' };
        } else if (data.status === 'disconnected') {
          return { icon: '🔌', color: '#f44336', label: '連接中斷' };
        } else if (data.status === 'reconnecting') {
          return { icon: '🔄', color: '#ff9800', label: '重新連接' };
        }
        break;
      
      default:
        return { icon: '📡', color: '#9e9e9e', label: '即時更新' };
    }
  };

  // 監聽 WebSocket 事件
  useEffect(() => {
    const handleRequestUpdate = (data) => {
      createAnimation('request_update', data, 4000);
    };

    const handleEventUpdate = (data) => {
      createAnimation('event_update', data, 3500);
    };

    const handleQueueUpdate = (data) => {
      createAnimation('queue_update', data, 3000);
    };

    const handleSystemNotification = (data) => {
      createAnimation('system_notification', data, 5000);
    };

    const handleConnection = (status) => {
      createAnimation('connection', { status }, 2500);
    };

    // 註冊事件監聽器
    websocketService.on('request_update', handleRequestUpdate);
    websocketService.on('event_update', handleEventUpdate);
    websocketService.on('queue_update', handleQueueUpdate);
    websocketService.on('system_notification', handleSystemNotification);
    
    // 連接狀態事件
    websocketService.on('connect', () => handleConnection('connected'));
    websocketService.on('disconnect', () => handleConnection('disconnected'));
    websocketService.on('connecting', () => handleConnection('reconnecting'));

    return () => {
      websocketService.off('request_update', handleRequestUpdate);
      websocketService.off('event_update', handleEventUpdate);
      websocketService.off('queue_update', handleQueueUpdate);
      websocketService.off('system_notification', handleSystemNotification);
      websocketService.off('connect', () => handleConnection('connected'));
      websocketService.off('disconnect', () => handleConnection('disconnected'));
      websocketService.off('connecting', () => handleConnection('reconnecting'));
    };
  }, [createAnimation]);

  return (
    <div className="realtime-animations">
      {animations.map((animation) => {
        const config = getAnimationConfig(animation.type, animation.data);
        const age = Date.now() - animation.timestamp;
        const progress = age / animation.duration;
        
        return (
          <div
            key={animation.id}
            className="animation-item"
            style={{
              '--progress': progress,
              '--color': config.color
            }}
          >
            <div className="animation-icon">{config.icon}</div>
            <div className="animation-content">
              <div className="animation-label">{config.label}</div>
              {animation.data.message && (
                <div className="animation-message">{animation.data.message}</div>
              )}
            </div>
            <div className="animation-progress"></div>
          </div>
        );
      })}

      <style jsx="true">{`
        .realtime-animations {
          position: fixed;
          top: 100px;
          right: 20px;
          z-index: 1000;
          pointer-events: none;
          max-width: 300px;
        }

        .animation-item {
          display: flex;
          align-items: center;
          margin-bottom: 12px;
          padding: 12px 16px;
          background: rgba(0, 0, 0, 0.85);
          border-radius: 12px;
          border-left: 4px solid var(--color);
          backdrop-filter: blur(10px);
          animation: slideInRight 0.3s ease-out, slideOutRight 0.3s ease-in ${(props) => props.duration - 300}ms forwards;
          position: relative;
          overflow: hidden;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
        }

        .animation-icon {
          font-size: 24px;
          margin-right: 12px;
          animation: bounce 0.6s ease-out;
        }

        .animation-content {
          flex: 1;
          min-width: 0;
        }

        .animation-label {
          font-size: 14px;
          font-weight: 600;
          color: #ffffff;
          margin-bottom: 2px;
        }

        .animation-message {
          font-size: 12px;
          color: #cccccc;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .animation-progress {
          position: absolute;
          bottom: 0;
          left: 0;
          height: 2px;
          background: var(--color);
          width: calc((1 - var(--progress)) * 100%);
          transition: width 0.1s linear;
        }

        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes slideOutRight {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }

        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-10px);
          }
          60% {
            transform: translateY(-5px);
          }
        }

        @keyframes pulse {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
          }
        }

        /* 響應式設計 */
        @media (max-width: 768px) {
          .realtime-animations {
            top: 80px;
            right: 10px;
            left: 10px;
            max-width: none;
          }

          .animation-item {
            padding: 10px 12px;
            margin-bottom: 8px;
          }

          .animation-icon {
            font-size: 20px;
            margin-right: 8px;
          }

          .animation-label {
            font-size: 13px;
          }

          .animation-message {
            font-size: 11px;
          }
        }

        /* 當動畫數量過多時的處理 */
        .realtime-animations:has(.animation-item:nth-child(5)) .animation-item:nth-child(n+5) {
          animation-duration: 0.2s;
          animation-delay: 0s;
        }

        /* 高對比度模式支持 */
        @media (prefers-contrast: high) {
          .animation-item {
            background: #000000;
            border-width: 2px;
          }
        }

        /* 減少動畫偏好支持 */
        @media (prefers-reduced-motion: reduce) {
          .animation-item {
            animation: none;
          }
          
          .animation-icon {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
};

export default RealtimeAnimations;