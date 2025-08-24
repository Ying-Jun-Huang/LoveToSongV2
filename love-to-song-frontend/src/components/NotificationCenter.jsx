import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuthV2';

const NotificationCenter = ({ isOpen, onClose, className = '' }) => {
  const { canViewWidget } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState('ALL');
  const [stats, setStats] = useState(null);

  // 模擬通知數據
  const mockNotifications = [
    {
      id: 1,
      title: '新的點歌請求',
      content: '用戶 Alice 點了歌曲《告白氣球》',
      type: 'REQUEST',
      priority: 'NORMAL',
      readAt: null,
      createdAt: new Date('2024-01-15T10:30:00'),
      sender: { displayName: '系統' },
      payload: { requestId: 123, songTitle: '告白氣球' }
    },
    {
      id: 2,
      title: '活動即將開始',
      content: '春季卡拉OK大賽將在30分鐘後開始',
      type: 'EVENT',
      priority: 'HIGH',
      readAt: null,
      createdAt: new Date('2024-01-15T10:15:00'),
      sender: { displayName: '活動管理' },
      payload: { eventId: 1, eventTitle: '春季卡拉OK大賽' }
    },
    {
      id: 3,
      title: '歌手上線通知',
      content: '歌手 Bob 已上線，現在可以接受點歌',
      type: 'SINGER',
      priority: 'LOW',
      readAt: new Date('2024-01-15T09:45:00'),
      createdAt: new Date('2024-01-15T09:30:00'),
      sender: { displayName: '歌手管理' },
      payload: { singerId: 2, singerName: 'Bob' }
    },
    {
      id: 4,
      title: '系統維護通知',
      content: '系統將在今晚23:00-24:00進行維護升級',
      type: 'SYSTEM',
      priority: 'CRITICAL',
      readAt: null,
      createdAt: new Date('2024-01-15T08:00:00'),
      sender: { displayName: '系統管理員' },
      payload: { maintenanceStart: '23:00', maintenanceEnd: '24:00' }
    },
    {
      id: 5,
      title: '願望歌審核通過',
      content: '您提交的願望歌《稻香》已通過審核',
      type: 'WISH_SONG',
      priority: 'NORMAL',
      readAt: new Date('2024-01-15T07:20:00'),
      createdAt: new Date('2024-01-15T07:00:00'),
      sender: { displayName: '審核系統' },
      payload: { songTitle: '稻香', status: 'APPROVED' }
    }
  ];

  const mockStats = {
    total: 15,
    unread: 3,
    byType: {
      SYSTEM: 4,
      REQUEST: 5,
      EVENT: 3,
      SINGER: 2,
      WISH_SONG: 1
    },
    byPriority: {
      CRITICAL: 1,
      HIGH: 2,
      NORMAL: 10,
      LOW: 2
    }
  };

  // 載入通知數據
  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      // 這裡應該調用API
      // const response = await fetch('/api/notifications/my');
      // const data = await response.json();
      
      // 使用模擬數據
      setTimeout(() => {
        setNotifications(mockNotifications);
        setUnreadCount(mockNotifications.filter(n => !n.readAt).length);
        setStats(mockStats);
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('載入通知失敗:', error);
      setLoading(false);
    }
  }, []);

  // 初始載入
  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen, loadNotifications]);

  // 過濾通知
  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'ALL') return true;
    if (filter === 'UNREAD') return !notification.readAt;
    if (filter === 'READ') return notification.readAt;
    return notification.type === filter;
  });

  // 獲取通知類型顯示
  const getNotificationType = (type) => {
    const types = {
      'SYSTEM': { text: '系統', icon: '⚙️', color: '#6b7280' },
      'REQUEST': { text: '點歌', icon: '🎵', color: '#3b82f6' },
      'EVENT': { text: '活動', icon: '🎪', color: '#10b981' },
      'SINGER': { text: '歌手', icon: '🎤', color: '#8b5cf6' },
      'WISH_SONG': { text: '願望歌', icon: '⭐', color: '#f59e0b' },
      'PERSONAL': { text: '個人', icon: '👤', color: '#ef4444' }
    };
    return types[type] || { text: type, icon: '📢', color: '#6b7280' };
  };

  // 獲取優先級顯示
  const getPriority = (priority) => {
    const priorities = {
      'CRITICAL': { text: '緊急', color: '#dc2626', bg: 'rgba(220, 38, 38, 0.2)' },
      'HIGH': { text: '重要', color: '#ea580c', bg: 'rgba(234, 88, 12, 0.2)' },
      'NORMAL': { text: '一般', color: '#16a34a', bg: 'rgba(22, 163, 74, 0.2)' },
      'LOW': { text: '低', color: '#6b7280', bg: 'rgba(107, 114, 128, 0.2)' }
    };
    return priorities[priority] || priorities['NORMAL'];
  };

  // 標記為已讀
  const markAsRead = async (notificationIds) => {
    try {
      // 這裡應該調用API
      // await fetch('/api/notifications/read', {
      //   method: 'PUT',
      //   body: JSON.stringify({ notificationIds })
      // });

      // 更新本地狀態
      setNotifications(prev => 
        prev.map(notification => 
          notificationIds.includes(notification.id)
            ? { ...notification, readAt: new Date() }
            : notification
        )
      );
      setUnreadCount(prev => Math.max(0, prev - notificationIds.length));
    } catch (error) {
      console.error('標記已讀失敗:', error);
    }
  };

  // 標記全部為已讀
  const markAllAsRead = async () => {
    try {
      // 這裡應該調用API
      // await fetch('/api/notifications/read-all', { method: 'PUT' });

      setNotifications(prev => 
        prev.map(notification => 
          !notification.readAt 
            ? { ...notification, readAt: new Date() }
            : notification
        )
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('標記全部已讀失敗:', error);
    }
  };

  // 刪除通知
  const deleteNotifications = async (notificationIds) => {
    try {
      // 這裡應該調用API
      // await fetch('/api/notifications', {
      //   method: 'DELETE',
      //   body: JSON.stringify({ notificationIds })
      // });

      setNotifications(prev => 
        prev.filter(notification => !notificationIds.includes(notification.id))
      );
      
      // 更新未讀數量
      const deletedUnreadCount = notifications.filter(n => 
        notificationIds.includes(n.id) && !n.readAt
      ).length;
      setUnreadCount(prev => Math.max(0, prev - deletedUnreadCount));
    } catch (error) {
      console.error('刪除通知失敗:', error);
    }
  };

  // 處理通知點擊
  const handleNotificationClick = (notification) => {
    if (!notification.readAt) {
      markAsRead([notification.id]);
    }

    // 根據通知類型執行相應操作
    if (notification.payload) {
      const { type, payload } = notification;
      // 處理通知
      
      // 這裡可以根據不同類型的通知跳轉到相應頁面
      // 例如：點歌請求 -> 跳轉到點歌管理頁面
      // 活動通知 -> 跳轉到活動詳情頁面
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`notification-center ${className}`}>
      <div className="notification-overlay" onClick={onClose} />
      
      <div className="notification-panel">
        <div className="notification-header">
          <div className="header-info">
            <h3>通知中心</h3>
            <span className="notification-count">
              {unreadCount > 0 && (
                <span className="unread-badge">{unreadCount}</span>
              )}
            </span>
          </div>
          
          <div className="header-actions">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="mark-all-read-btn"
                title="標記全部為已讀"
              >
                ✓
              </button>
            )}
            <button
              onClick={onClose}
              className="close-btn"
              title="關閉"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="notification-filters">
          <div className="filter-tabs">
            {['ALL', 'UNREAD', 'SYSTEM', 'REQUEST', 'EVENT', 'SINGER', 'WISH_SONG'].map(filterType => (
              <button
                key={filterType}
                className={`filter-tab ${filter === filterType ? 'active' : ''}`}
                onClick={() => setFilter(filterType)}
              >
                {filterType === 'ALL' ? '全部' : 
                 filterType === 'UNREAD' ? '未讀' : 
                 getNotificationType(filterType).text}
                {filterType === 'UNREAD' && unreadCount > 0 && (
                  <span className="filter-count">{unreadCount}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="notification-list">
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner">⏳</div>
              <p>載入通知中...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <h4>暫無通知</h4>
              <p>
                {filter === 'UNREAD' ? '您已閱讀了所有通知' : 
                 filter === 'ALL' ? '您還沒有收到任何通知' :
                 `沒有${getNotificationType(filter).text}類型的通知`}
              </p>
            </div>
          ) : (
            filteredNotifications.map(notification => {
              const notificationType = getNotificationType(notification.type);
              const priority = getPriority(notification.priority);
              const isUnread = !notification.readAt;
              
              return (
                <div
                  key={notification.id}
                  className={`notification-item ${isUnread ? 'unread' : 'read'}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-indicator">
                    {isUnread && <div className="unread-dot" />}
                  </div>
                  
                  <div className="notification-icon" style={{ color: notificationType.color }}>
                    {notificationType.icon}
                  </div>
                  
                  <div className="notification-content">
                    <div className="notification-header-row">
                      <div className="notification-title">{notification.title}</div>
                      <div className="notification-meta">
                        <span 
                          className="notification-priority"
                          style={{ 
                            color: priority.color,
                            backgroundColor: priority.bg 
                          }}
                        >
                          {priority.text}
                        </span>
                        <span className="notification-time">
                          {notification.createdAt.toLocaleTimeString('zh-TW', {
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                    
                    <div className="notification-message">
                      {notification.content}
                    </div>
                    
                    <div className="notification-footer">
                      <span className="notification-sender">
                        來自: {notification.sender.displayName}
                      </span>
                      <div className="notification-actions">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotifications([notification.id]);
                          }}
                          className="delete-btn"
                          title="刪除通知"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {stats && (
          <div className="notification-stats">
            <div className="stats-summary">
              <div className="stats-item">
                <span className="stats-label">總計:</span>
                <span className="stats-value">{stats.total}</span>
              </div>
              <div className="stats-item">
                <span className="stats-label">未讀:</span>
                <span className="stats-value unread">{stats.unread}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx="true">{`
        .notification-center {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 1000;
          display: flex;
          align-items: flex-start;
          justify-content: flex-end;
          padding: 20px;
        }

        .notification-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          cursor: pointer;
        }

        .notification-panel {
          position: relative;
          width: 420px;
          max-width: 90vw;
          max-height: 80vh;
          background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
          border: 2px solid #daa520;
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 60px rgba(255, 215, 0, 0.3);
          overflow: hidden;
        }

        .notification-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
          border-bottom: 2px solid rgba(218, 165, 32, 0.3);
        }

        .header-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .header-info h3 {
          margin: 0;
          color: #ffd700;
          font-size: 18px;
          font-weight: 600;
        }

        .unread-badge {
          background: #ef4444;
          color: white;
          border-radius: 12px;
          padding: 2px 8px;
          font-size: 12px;
          font-weight: bold;
        }

        .header-actions {
          display: flex;
          gap: 8px;
        }

        .mark-all-read-btn, .close-btn {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 6px;
          padding: 6px 10px;
          color: #cccccc;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s ease;
        }

        .mark-all-read-btn:hover, .close-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          border-color: #ffd700;
        }

        .notification-filters {
          padding: 16px 24px;
          background: rgba(0, 0, 0, 0.3);
          border-bottom: 1px solid rgba(218, 165, 32, 0.2);
        }

        .filter-tabs {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .filter-tab {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 20px;
          padding: 6px 12px;
          color: #cccccc;
          cursor: pointer;
          font-size: 12px;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .filter-tab.active {
          background: rgba(218, 165, 32, 0.3);
          border-color: #daa520;
          color: #ffd700;
        }

        .filter-tab:hover:not(.active) {
          background: rgba(255, 255, 255, 0.15);
        }

        .filter-count {
          background: #ef4444;
          color: white;
          border-radius: 8px;
          padding: 1px 5px;
          font-size: 10px;
          font-weight: bold;
        }

        .notification-list {
          flex: 1;
          overflow-y: auto;
          padding: 8px;
        }

        .loading-state, .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          text-align: center;
          color: #cccccc;
        }

        .loading-spinner, .empty-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .loading-spinner {
          animation: spin 2s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .empty-state h4 {
          margin: 0 0 8px 0;
          color: #ffd700;
          font-size: 16px;
        }

        .empty-state p {
          margin: 0;
          font-size: 14px;
        }

        .notification-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 16px;
          margin-bottom: 8px;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 1px solid transparent;
        }

        .notification-item.unread {
          background: rgba(255, 215, 0, 0.05);
          border-color: rgba(218, 165, 32, 0.2);
        }

        .notification-item.read {
          background: rgba(255, 255, 255, 0.02);
        }

        .notification-item:hover {
          background: rgba(255, 215, 0, 0.1);
          border-color: rgba(218, 165, 32, 0.4);
        }

        .notification-indicator {
          flex-shrink: 0;
          width: 8px;
          height: 8px;
          margin-top: 6px;
        }

        .unread-dot {
          width: 8px;
          height: 8px;
          background: #ef4444;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        .notification-icon {
          flex-shrink: 0;
          font-size: 20px;
          margin-top: 2px;
        }

        .notification-content {
          flex: 1;
        }

        .notification-header-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 8px;
          gap: 12px;
        }

        .notification-title {
          font-weight: 600;
          color: #ffffff;
          font-size: 14px;
          line-height: 1.4;
        }

        .notification-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }

        .notification-priority {
          padding: 2px 6px;
          border-radius: 10px;
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .notification-time {
          color: #999999;
          font-size: 11px;
          white-space: nowrap;
        }

        .notification-message {
          color: #cccccc;
          font-size: 13px;
          line-height: 1.4;
          margin-bottom: 12px;
        }

        .notification-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        }

        .notification-sender {
          color: #999999;
          font-size: 12px;
        }

        .notification-actions {
          display: flex;
          gap: 8px;
        }

        .delete-btn {
          background: none;
          border: none;
          color: #999999;
          cursor: pointer;
          font-size: 14px;
          padding: 4px;
          border-radius: 4px;
          transition: all 0.2s ease;
        }

        .delete-btn:hover {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }

        .notification-stats {
          padding: 16px 24px;
          background: rgba(0, 0, 0, 0.3);
          border-top: 1px solid rgba(218, 165, 32, 0.2);
        }

        .stats-summary {
          display: flex;
          justify-content: center;
          gap: 24px;
        }

        .stats-item {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 13px;
        }

        .stats-label {
          color: #cccccc;
        }

        .stats-value {
          color: #ffffff;
          font-weight: 600;
        }

        .stats-value.unread {
          color: #ef4444;
        }

        @media (max-width: 768px) {
          .notification-center {
            padding: 10px;
            align-items: stretch;
            justify-content: stretch;
          }

          .notification-panel {
            width: 100%;
            max-width: none;
            max-height: 90vh;
          }

          .filter-tabs {
            justify-content: center;
          }

          .notification-header-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }

          .notification-meta {
            align-self: flex-end;
          }
        }
      `}</style>
    </div>
  );
};

export default NotificationCenter;