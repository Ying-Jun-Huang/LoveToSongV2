import React, { useState, useEffect } from 'react';
import { useSystemNotifications } from '../hooks/useWebSocketHooks';

const SystemNotifications = () => {
  const [visibleNotifications, setVisibleNotifications] = useState([]);
  const { notifications, isConnected } = useSystemNotifications((notification) => {
    // 新通知到達時的處理
    console.log('[Notifications] 新通知:', notification);
    
    // 添加唯一ID用於移除
    const notificationWithId = {
      ...notification,
      id: Date.now() + Math.random(),
      timestamp: new Date(notification.timestamp)
    };
    
    setVisibleNotifications(prev => [notificationWithId, ...prev.slice(0, 4)]); // 最多顯示5條
    
    // 5秒後自動移除
    setTimeout(() => {
      setVisibleNotifications(prev => prev.filter(n => n.id !== notificationWithId.id));
    }, 5000);
  });

  const removeNotification = (id) => {
    setVisibleNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '📢';
    }
  };

  const getNotificationColors = (type) => {
    switch (type) {
      case 'success': 
        return 'bg-green-100 border-green-400 text-green-700';
      case 'error': 
        return 'bg-red-100 border-red-400 text-red-700';
      case 'warning': 
        return 'bg-yellow-100 border-yellow-400 text-yellow-700';
      case 'info': 
        return 'bg-blue-100 border-blue-400 text-blue-700';
      default: 
        return 'bg-gray-100 border-gray-400 text-gray-700';
    }
  };

  if (!isConnected || visibleNotifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {visibleNotifications.map((notification) => (
        <div
          key={notification.id}
          className={`p-4 border rounded-lg shadow-lg animate-slide-in ${getNotificationColors(notification.type)}`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-2 flex-1">
              <span className="text-lg">{getNotificationIcon(notification.type)}</span>
              <div className="flex-1">
                <p className="text-sm font-medium">{notification.message}</p>
                <p className="text-xs opacity-75 mt-1">
                  {notification.timestamp.toLocaleTimeString('zh-TW', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  })}
                </p>
              </div>
            </div>
            <button
              onClick={() => removeNotification(notification.id)}
              className="ml-2 text-lg opacity-60 hover:opacity-100 focus:outline-none"
            >
              ×
            </button>
          </div>
        </div>
      ))}
      
      <style jsx="true">{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
        
        @keyframes slide-out {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }
        
        .animate-slide-out {
          animation: slide-out 0.2s ease-in;
        }
      `}</style>
    </div>
  );
};

export default SystemNotifications;