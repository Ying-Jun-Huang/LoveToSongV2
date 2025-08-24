import React, { useState, useEffect } from 'react';
import NotificationCenter from './NotificationCenter';

const NotificationButton = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasNewNotification, setHasNewNotification] = useState(false);

  // 模擬未讀通知數量
  useEffect(() => {
    // 這裡應該定期從API獲取未讀通知數量
    const fetchUnreadCount = async () => {
      try {
        // const response = await fetch('/api/notifications/unread-count');
        // const data = await response.json();
        // setUnreadCount(data.unreadCount);
        
        // 使用模擬數據
        setUnreadCount(3);
      } catch (error) {
        console.error('獲取未讀通知數量失敗:', error);
      }
    };

    fetchUnreadCount();
    
    // 設置定期更新
    const interval = setInterval(fetchUnreadCount, 30000); // 每30秒更新一次
    
    return () => clearInterval(interval);
  }, []);

  // 模擬新通知到達的動畫效果
  useEffect(() => {
    if (unreadCount > 0) {
      setHasNewNotification(true);
      const timer = setTimeout(() => setHasNewNotification(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [unreadCount]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    setHasNewNotification(false);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <>
      <div className={`notification-button-container ${className}`}>
        <button
          onClick={handleToggle}
          className={`notification-button ${hasNewNotification ? 'has-new' : ''}`}
          title={`通知中心${unreadCount > 0 ? ` (${unreadCount} 條未讀)` : ''}`}
        >
          <div className="notification-icon">
            🔔
          </div>
          
          {unreadCount > 0 && (
            <div className="notification-badge">
              <span className="badge-count">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            </div>
          )}
          
          {hasNewNotification && (
            <div className="notification-pulse" />
          )}
        </button>
      </div>

      <NotificationCenter 
        isOpen={isOpen} 
        onClose={handleClose}
      />

      <style jsx="true">{`
        .notification-button-container {
          position: relative;
        }

        .notification-button {
          position: relative;
          background: rgba(255, 215, 0, 0.1);
          border: 2px solid rgba(218, 165, 32, 0.3);
          border-radius: 50%;
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
          overflow: hidden;
        }

        .notification-button:hover {
          background: rgba(255, 215, 0, 0.2);
          border-color: #daa520;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
        }

        .notification-button.has-new {
          animation: shake 0.5s ease-in-out;
          border-color: #ffd700;
        }

        .notification-icon {
          font-size: 18px;
          color: #ffd700;
          transition: transform 0.2s ease;
        }

        .notification-button:hover .notification-icon {
          transform: scale(1.1);
        }

        .notification-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          border: 2px solid #1a1a1a;
          border-radius: 12px;
          min-width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);
        }

        .badge-count {
          color: white;
          font-size: 10px;
          font-weight: bold;
          line-height: 1;
          padding: 0 4px;
        }

        .notification-pulse {
          position: absolute;
          top: -4px;
          right: -4px;
          width: 20px;
          height: 20px;
          background: #ef4444;
          border-radius: 50%;
          opacity: 0.8;
          animation: pulse-ring 2s infinite ease-out;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-2px); }
          75% { transform: translateX(2px); }
        }

        @keyframes pulse-ring {
          0% {
            transform: scale(1);
            opacity: 0.8;
          }
          50% {
            transform: scale(1.8);
            opacity: 0.4;
          }
          100% {
            transform: scale(2.5);
            opacity: 0;
          }
        }

        /* 響應式設計 */
        @media (max-width: 768px) {
          .notification-button {
            width: 40px;
            height: 40px;
          }

          .notification-icon {
            font-size: 16px;
          }

          .notification-badge {
            min-width: 18px;
            height: 18px;
          }

          .badge-count {
            font-size: 9px;
          }
        }

        /* 深色主題適配 */
        @media (prefers-color-scheme: dark) {
          .notification-button {
            background: rgba(255, 215, 0, 0.15);
            border-color: rgba(218, 165, 32, 0.4);
          }

          .notification-button:hover {
            background: rgba(255, 215, 0, 0.25);
          }
        }

        /* 減少動畫效果（可訪問性） */
        @media (prefers-reduced-motion: reduce) {
          .notification-button,
          .notification-icon,
          .notification-pulse {
            animation: none !important;
            transition: none !important;
          }

          .notification-button.has-new {
            border-color: #ffd700;
            box-shadow: 0 0 0 2px rgba(255, 215, 0, 0.3);
          }
        }

        /* 高對比度模式 */
        @media (prefers-contrast: high) {
          .notification-button {
            border-width: 3px;
            border-color: #ffd700;
          }

          .notification-badge {
            border-width: 3px;
            border-color: #ffffff;
          }
        }
      `}</style>
    </>
  );
};

export default NotificationButton;