import React from 'react';
import { useAuth } from '../hooks/useAuthV2';

// 靜態版本但支持權限檢查
const TabNavigationStatic = ({ activeTab, onTabChange, tabs = [] }) => {
  const { hasAnyPermission } = useAuth();
  // 硬編碼的可見標籤，包含高層管理員應該看到的所有功能
  const staticVisibleTabs = [
    {
      id: 'homepage',
      label: '首頁',
      icon: '🏠',
      permissions: []
    },
    {
      id: 'songList',
      label: '會的歌',
      icon: '🎵',
      permissions: ['SONG_MANAGEMENT']
    },
    {
      id: 'singerList', 
      label: '歌手列表',
      icon: '🎤',
      permissions: ['VIEW_SINGERS']
    },
    {
      id: 'players',
      label: '用戶管理',
      icon: '🧑‍💼',
      permissions: ['USER_MANAGEMENT']
    },
    {
      id: 'upload',
      label: '檔案管理',
      icon: '📁',
      permissions: ['USER_MANAGEMENT']
    },
    {
      id: 'stats',
      label: '統計資訊',
      icon: '📊',
      permissions: ['SYSTEM_STATS']
    },
    {
      id: 'events',
      label: '活動管理',
      icon: '🎪',
      permissions: ['EVENT_MANAGEMENT']
    },
    {
      id: 'playerRequests',
      label: '我的點歌',
      icon: '🎶',
      permissions: ['SONG_REQUEST']
    },
    {
      id: 'requestSong',
      label: '點歌',
      icon: '🎤',
      permissions: ['SONG_REQUEST']
    },
    {
      id: 'wishSongs',
      label: '願望歌',
      icon: '⭐',
      permissions: ['WISH_SONG_SUBMIT', 'WISH_SONG_MANAGEMENT']
    },
    {
      id: 'reports',
      label: '報告中心',
      icon: '📊',
      permissions: ['DATA_EXPORT']
    },
    {
      id: 'permissions',
      label: '權限管理',
      icon: '🔑',
      permissions: ['USER_MANAGEMENT']
    }
  ];

  // 根據權限過濾可見標籤
  const visibleTabs = staticVisibleTabs.filter(tab => {
    if (tab.permissions.length === 0) return true; // 無權限要求的標籤
    return hasAnyPermission(tab.permissions); // 有任何權限就顯示
  });

  return (
    <div className="tab-navigation">
      <div className="tab-list">
        {visibleTabs.map(tab => (
          <button
            key={tab.id}
            className="tab-button"
            onClick={() => onTabChange(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      <style jsx="true">{`
        .tab-navigation {
          background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
          border-radius: 12px;
          padding: 8px;
          margin-bottom: 20px;
          box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
          border: 1px solid #ffd700;
        }

        .tab-list {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .tab-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          border: 1px solid rgba(255, 215, 0, 0.3);
          border-radius: 8px;
          background: rgba(255, 215, 0, 0.1);
          color: rgba(255, 215, 0, 0.8);
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 14px;
          font-weight: 500;
          white-space: nowrap;
        }

        .tab-button:hover {
          background: rgba(255, 215, 0, 0.2);
          color: #ffd700;
          border-color: rgba(255, 215, 0, 0.6);
        }


        .tab-icon {
          font-size: 18px;
        }

        .tab-label {
          font-size: 14px;
        }
      `}</style>
    </div>
  );
};

export default TabNavigationStatic;