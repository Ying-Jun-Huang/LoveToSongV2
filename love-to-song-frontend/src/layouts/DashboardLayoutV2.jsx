import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuthV2';
import TabNavigation from '../components/TabNavigationStatic';
import TabContainer from '../components/TabContainer';
import PermissionManagementFullScreen from '../components/PermissionManagementFullScreen';
import SingerListFullScreen from '../components/SingerListFullScreen';
import SingerDetailFullScreen from '../components/SingerDetailFullScreen';
import SongRequestFullScreen from '../components/SongRequestFullScreen';
import WishSongFullScreen from '../components/WishSongFullScreen';
import PlayerSongRequestsFullScreen from '../components/PlayerSongRequestsFullScreen';
import EventManagementFullScreen from '../components/EventManagementFullScreen';
import NotificationButton from '../components/NotificationButton';
import RealtimeAnimations from '../components/RealtimeAnimations';
import FloatingNotifications from '../components/FloatingNotifications';
import AudioNotificationSettings from '../components/AudioNotificationSettings';
import ReportSystemFullScreen from '../components/ReportSystemFullScreen';
import SystemSettingsFullScreen from '../components/SystemSettingsFullScreen';

// 組件導入
import HomepageWidget from '../components/HomepageWidget';
import SongListWidget from '../components/SongListWidget';
import StatsWidget from '../components/StatsWidget';
import PlayersWidget from '../components/PlayersWidget';
import UploadWidget from '../components/UploadWidget';
import SongRequestWidget from '../components/SongRequestWidget';
import PermissionManagement from '../components/PermissionManagement';
import AuthDebugger from '../components/AuthDebugger';
import ErrorBoundary from '../components/ErrorBoundary';
import MyRequestDashboard from '../components/MyRequestDashboard';
import SystemNotifications from '../components/SystemNotifications';
import SongRequestForm from '../components/SongRequestForm';


const DashboardLayoutV2 = () => {
  // 清理版本 - 移除所有調試日誌 2024-08-12
  const { canViewWidget, user, getPrimaryRole, logout, loading, isAuthenticated, permissions } = useAuth();

  const [activeTab, setActiveTab] = useState('homepage');
  const [showAudioSettings, setShowAudioSettings] = useState(false);

  // 暫時移除所有 useEffect 以防止重新渲染循環
  // React.useEffect(() => {
  //   // 在需要時可以添加相關的處理邏輯  
  // }, [user, isAuthenticated, loading, permissions]);

  // 暫時完全禁用全局錯誤處理器以避免刷新循環
  // React.useEffect(() => {
  //   const handleError = (event) => {
  //     console.error('Global error caught:', event.error);
  //   };
  //   
  //   const handleUnhandledRejection = (event) => {
  //     console.error('Unhandled promise rejection:', event.reason);
  //   };

  //   window.addEventListener('error', handleError);
  //   window.addEventListener('unhandledrejection', handleUnhandledRejection);

  //   return () => {
  //     window.removeEventListener('error', handleError);
  //     window.removeEventListener('unhandledrejection', handleUnhandledRejection);
  //   };
  // }, []);

  // 定義分頁配置 - 基於原有widget功能
  const tabs = [
    {
      id: 'homepage',
      label: '首頁',
      icon: '🏠',
      permissions: [], // 移除權限限制，所有用戶都能看到首頁
      description: '系統首頁與歌手資訊展示'
    },
    {
      id: 'songList',
      label: '會的歌',
      icon: '🎵',
      permissions: ['SONG_MANAGEMENT'],
      description: '歌曲庫管理（僅限歌手和管理員）'
    },
    {
      id: 'singerList',
      label: '歌手列表',
      icon: '👥',
      permissions: ['VIEW_SINGERS'],
      description: '選擇歌手查看資訊並點歌'
    },
    {
      id: 'players',
      label: '用戶管理',
      icon: '🧑‍💼',
      permissions: ['USER_MANAGEMENT', 'SINGER_MANAGEMENT'],
      description: '用戶與歌手管理'
    },
    {
      id: 'upload',
      label: '檔案管理',
      icon: '📁',
      permissions: ['USER_MANAGEMENT', 'EVENT_MANAGEMENT'],
      description: '檔案上傳與批量導入'
    },
    {
      id: 'stats',
      label: '統計資訊',
      icon: '📊',
      permissions: ['SYSTEM_STATS', 'EVENT_STATS'],
      description: '系統統計與分析'
    },
    {
      id: 'playerRequests',
      label: '我的點歌',
      icon: '🎶',
      permissions: ['SONG_REQUEST'],
      description: '個人點歌歷史與統計分析'
    },
    {
      id: 'requestSong',
      label: '點歌',
      icon: '🎤',
      permissions: ['SONG_REQUEST'],
      description: '點歌功能 - 選擇歌手和歌曲'
    },
    {
      id: 'wishSongs',
      label: '願望歌',
      icon: '⭐',
      permissions: ['WISH_SONG_SUBMIT', 'WISH_SONG_MANAGEMENT', 'WISH_SONG_RESPONSE'],
      description: '願望歌提交與管理'
    },
    {
      id: 'events',
      label: '活動管理',
      icon: '🎪',
      permissions: ['EVENT_MANAGEMENT'],
      description: '活動創建與管理'
    },
    {
      id: 'reports',
      label: '報告中心',
      icon: '📊',
      permissions: ['SYSTEM_STATS', 'EVENT_STATS', 'DATA_EXPORT'],
      description: '數據分析與報表生成'
    },
    {
      id: 'settings',
      label: '系統設定',
      icon: '⚙️',
      permissions: ['SYSTEM_SETTINGS', 'SECURITY_SETTINGS'],
      description: '系統配置和管理設定'
    },
    {
      id: 'permissions',
      label: '權限管理',
      icon: '🔑',
      permissions: ['USER_MANAGEMENT'],
      description: '用戶權限個人化管理'
    }
  ];


  // 渲染分頁內容
  // 權限管理分頁渲染函數
  const renderPermissionsTab = () => (
    <div className="fullscreen-tab-content">
      <div className="tab-content-header">
        <h2>🔑 權限管理</h2>
        <p>用戶權限個人化管理</p>
      </div>
      <div className="tab-widget-content">
        <PermissionManagement />
      </div>
    </div>
  );

  const renderTabContent = () => {

    switch (activeTab) {
      case 'homepage':
        return renderHomepageTab();
      case 'songList':
        return renderSongListTab();
      case 'singerList':
        return (
          <div className="fullscreen-tab-content">
            <div className="tab-content-header">
              <h2>👥 歌手列表</h2>
              <p>瀏覽所有歌手，點擊查看詳細歌單</p>
            </div>
            <div className="tab-widget-content">
              <SingerListFullScreen />
            </div>
          </div>
        );
      case 'players':
        return renderPlayersTab();
      case 'upload':
        return renderUploadTab();
      case 'stats':
        return renderStatsTab();
      case 'playerRequests':
        return (
          <div className="fullscreen-tab-content">
            <div className="tab-content-header">
              <h2>🎶 我的點歌管理</h2>
              <p>查看個人點歌歷史、狀態追蹤和統計分析</p>
            </div>
            <div className="tab-widget-content">
              <MyRequestDashboard />
            </div>
          </div>
        );
      case 'requestSong':
        return (
          <div className="fullscreen-tab-content">
            <div className="tab-content-header">
              <h2>🎤 點歌</h2>
              <p>選擇歌手和歌曲進行點歌</p>
            </div>
            <div className="tab-widget-content">
              <div className="p-4">
                <SongRequestForm 
                  onRequestSuccess={() => {
                    // 點歌成功後可以切換到我的點歌頁面
                    setActiveTab('playerRequests');
                  }}
                />
              </div>
            </div>
          </div>
        );
      case 'wishSongs':
        return <WishSongFullScreen />;
      case 'events':
        return <EventManagementFullScreen />;
      case 'reports':
        return <ReportSystemFullScreen />;
      case 'settings':
        return <SystemSettingsFullScreen />;
      case 'permissions':
        return renderPermissionsTab();
      default:
        return renderHomepageTab();
    }
  };

  // 全螢幕分頁組件
  const renderHomepageTab = () => (
    <div className="fullscreen-tab-content">
      <div className="tab-content-header">
        <h2>🏠 系統首頁</h2>
        <p>歌手資訊展示與系統概覽</p>
      </div>
      <div className="tab-widget-content">
        <HomepageWidget />
      </div>
    </div>
  );


  const renderSongListTab = () => (
    <div className="fullscreen-tab-content">
      <div className="tab-content-header">
        <h2>🎵 會的歌</h2>
        <p>歌曲庫管理與瀏覽</p>
      </div>
      <div className="tab-widget-content">
        <SongListWidget />
      </div>
    </div>
  );


  const renderPlayersTab = () => (
    <div className="fullscreen-tab-content">
      <div className="tab-content-header">
        <h2>👥 用戶管理</h2>
        <p>用戶與歌手管理</p>
      </div>
      <div className="tab-widget-content">
        <PlayersWidget />
      </div>
    </div>
  );

  const renderUploadTab = () => (
    <div className="fullscreen-tab-content">
      <div className="tab-content-header">
        <h2>📁 檔案管理</h2>
        <p>檔案上傳與批量導入</p>
      </div>
      <div className="tab-widget-content">
        <UploadWidget />
      </div>
    </div>
  );

  const renderStatsTab = () => (
    <div className="fullscreen-tab-content">
      <div className="tab-content-header">
        <h2>📊 統計資訊</h2>
        <p>系統統計與分析</p>
      </div>
      <div className="tab-widget-content">
        <StatsWidget />
      </div>
    </div>
  );

  const renderEventsTab = () => (
    <div className="fullscreen-tab-content">
      <div className="tab-content-header">
        <h2>🎪 活動管理</h2>
        <p>活動創建與管理</p>
      </div>
      <div className="tab-widget-content">
        <EventsWidget />
      </div>
    </div>
  );

  const userRole = getPrimaryRole();

  // 檢查用戶是否存在（包括訪客）
  if (!user || loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-content">
          <div className="loading-spinner">⏳</div>
          <p>載入用戶資訊中...</p>
        </div>
        
        <style jsx="true">{`
          .dashboard-loading {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          }
          
          .loading-content {
            text-align: center;
            color: #6b7280;
          }
          
          .loading-spinner {
            font-size: 48px;
            margin-bottom: 20px;
            animation: spin 2s linear infinite;
          }
          
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
      <div className="dashboard-layout-container">
        <div className="dashboard-header">
          <div className="user-info">
            <div className="user-avatar" style={{ backgroundColor: userRole.color }}>
              {user.displayName.charAt(0).toUpperCase()}
            </div>
            <div className="user-details">
              <h3>{user.displayName}</h3>
              <span className="user-role" style={{ color: userRole.color }}>
                {userRole.displayName}
              </span>
            </div>
            <NotificationButton className="notification-button" />
            <button 
              className="audio-settings-button"
              onClick={() => setShowAudioSettings(true)}
              title="音效設置"
            >
              🔊
            </button>
            {user.roles.includes('GUEST') ? (
              <a href="/login" className="login-button">
                🔐 登入
              </a>
            ) : (
              <button className="logout-button" onClick={logout}>
                🚪 登出
              </button>
            )}
          </div>
        </div>
        
        <TabNavigation
          activeTab={activeTab}
          onTabChange={(newTab) => {
            setActiveTab(newTab);
          }}
          tabs={tabs}
        />
        
        <ErrorBoundary>
          <TabContainer activeTab={activeTab}>
            {renderTabContent()}
          </TabContainer>
        </ErrorBoundary>
        
        <RealtimeAnimations />
        <FloatingNotifications />
        <AudioNotificationSettings 
          isOpen={showAudioSettings}
          onClose={() => setShowAudioSettings(false)}
        />
        
        <style jsx="true">{`
          .dashboard-layout-container {
            padding: 20px;
            background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
          }

          .dashboard-layout-container .dashboard-header {
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            margin-bottom: 20px !important;
            background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%) !important;
            padding: 24px 32px !important;
            border-radius: 12px !important;
            box-shadow: 0 4px 16px rgba(255, 215, 0, 0.3) !important;
            border: 1px solid #ffd700 !important;
            flex-shrink: 0 !important;
            min-height: 88px !important;
            height: 88px !important;
            box-sizing: border-box !important;
          }

          body .dashboard-layout-container .dashboard-header .user-info {
            display: flex !important;
            align-items: center !important;
            gap: 0 !important;
            flex: 1 !important;
            padding: 0 !important;
            margin: 0 !important;
            justify-content: flex-start !important;
            align-content: normal !important;
            flex-direction: row !important;
            flex-wrap: nowrap !important;
            min-height: 40px !important;
            height: auto !important;
            box-sizing: border-box !important;
            column-gap: 0 !important;
            row-gap: 0 !important;
          }

          body .dashboard-layout-container .dashboard-header .user-info > * {
            margin: 0 !important;
            flex-shrink: 0 !important;
            flex-grow: 0 !important;
            flex-basis: auto !important;
          }

          body .dashboard-layout-container .dashboard-header .user-info > *:not(:last-child) {
            margin-right: 12px !important;
          }

          body .dashboard-layout-container .dashboard-header .realtime-status,
          body .dashboard-layout-container .dashboard-header .notification-button {
            padding: 0 !important;
          }


          .user-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
            color: #000000;
            font-weight: bold;
            font-size: 16px;
            border: 2px solid #ffd700;
          }

          .dashboard-layout-container .dashboard-header .user-details {
            display: flex !important;
            flex-direction: column !important;
            justify-content: center !important;
            min-height: 40px !important;
            height: 40px !important;
            overflow: hidden !important;
            width: 120px !important;
            min-width: 120px !important;
            max-width: 120px !important;
            flex-shrink: 0 !important;
            flex-grow: 0 !important;
          }

          .dashboard-layout-container .dashboard-header .user-details h3 {
            margin: 0 !important;
            font-size: 16px !important;
            color: #ffd700 !important;
            font-weight: 600 !important;
            line-height: 20px !important;
            height: 20px !important;
            overflow: hidden !important;
            white-space: nowrap !important;
            text-overflow: ellipsis !important;
          }

          .dashboard-layout-container .dashboard-header .user-role {
            font-size: 12px !important;
            font-weight: 500 !important;
            color: #d4af37 !important;
            line-height: 16px !important;
            height: 16px !important;
            overflow: hidden !important;
            white-space: nowrap !important;
            text-overflow: ellipsis !important;
            margin: 0 !important;
          }

          .logout-button {
            background: linear-gradient(135deg, #ffd700 0%, #daa520 100%);
            color: #000000;
            border: 1px solid #ffd700;
            padding: 10px 20px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 2px 8px rgba(255, 215, 0, 0.3);
            margin-left: 15px;
            white-space: nowrap;
          }

          .logout-button:hover {
            background: linear-gradient(135deg, #daa520 0%, #b8860b 100%);
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(255, 215, 0, 0.5);
          }

          .login-button {
            background: linear-gradient(135deg, #ffd700 0%, #daa520 100%);
            color: #000000;
            border: 1px solid #ffd700;
            padding: 10px 20px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 2px 8px rgba(255, 215, 0, 0.3);
            margin-left: 15px;
            white-space: nowrap;
            text-decoration: none;
            display: inline-block;
          }

          .login-button:hover {
            background: linear-gradient(135deg, #daa520 0%, #b8860b 100%);
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(255, 215, 0, 0.5);
          }

          .audio-settings-button {
            background: rgba(255, 215, 0, 0.1);
            border: 1px solid rgba(255, 215, 0, 0.3);
            color: #ffd700;
            padding: 8px 10px;
            border-radius: 8px;
            font-size: 16px;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            min-width: 40px;
            height: 40px;
          }

          .audio-settings-button:hover {
            background: rgba(255, 215, 0, 0.2);
            border-color: #ffd700;
            transform: translateY(-1px);
            box-shadow: 0 2px 8px rgba(255, 215, 0, 0.3);
          }

          .no-widgets {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 400px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }

          .no-widgets-content {
            text-align: center;
            color: #6b7280;
          }

          .no-widgets-icon {
            font-size: 64px;
            margin-bottom: 20px;
            opacity: 0.7;
          }

          .no-widgets-content h3 {
            margin: 0 0 8px 0;
            color: #374151;
            font-size: 20px;
            font-weight: 600;
          }

          .no-widgets-content p {
            margin: 0 0 8px 0;
            color: #6b7280;
            font-size: 14px;
            max-width: 300px;
          }

          .no-widgets-content small {
            color: #9ca3af;
            font-size: 12px;
          }

          /* 全螢幕分頁樣式 */
          .fullscreen-tab-content {
            height: 100%;
            display: flex;
            flex-direction: column;
            background: transparent;
            border-radius: 16px;
            overflow: hidden;
          }

          .tab-content-header {
            padding: 24px 32px;
            background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
            color: #ffd700;
            border-bottom: 2px solid #ffd700;
            flex-shrink: 0;
          }

          .tab-content-header h2 {
            margin: 0 0 8px 0;
            font-size: 28px;
            font-weight: 700;
          }

          .tab-content-header p {
            margin: 0;
            opacity: 0.9;
            font-size: 16px;
          }

          .tab-widget-content {
            flex: 1;
            overflow: auto;
            padding: 0;
            background: transparent;
          }

          .tab-widget-content > div {
            height: 100%;
            border-radius: 0;
            box-shadow: none;
          }

          /* 手機優化 */
          @media (max-width: 768px) {
            .dashboard-layout-container {
              padding: 10px;
            }

            .dashboard-header {
              padding: 10px 15px;
              flex-direction: column;
              gap: 15px;
            }

            .dashboard-header .user-info {
              width: 100%;
              justify-content: space-between;
            }

            .tab-content-header {
              padding: 16px 20px;
            }

            .tab-content-header h2 {
              font-size: 22px;
            }

            .tab-content-header p {
              font-size: 14px;
            }
          }
        `}</style>
      </div>
  );
};

// 暫時的組件占位符
const SingersWidget = () => (
  <div style={{ padding: '20px', textAlign: 'center' }}>
    <h3>歌手資訊</h3>
    <p>查看所有歌手的檔案與資訊</p>
    <div style={{ marginTop: '15px', fontSize: '14px', color: '#666' }}>
      <div>• 歌手基本資料</div>
      <div>• 演出紀錄</div>
      <div>• 擅長歌曲類型</div>
    </div>
  </div>
);

const WishSongsWidget = () => (
  <div style={{ padding: '20px', textAlign: 'center' }}>
    <h3>願望歌系統</h3>
    <p>願望歌提交與管理功能</p>
  </div>
);

const EventsWidget = () => (
  <div style={{ 
    padding: '20px', 
    textAlign: 'center',
    color: '#ffffff',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center'
  }}>
    <h3 style={{ 
      color: '#ffd700', 
      fontSize: '24px', 
      fontWeight: '600',
      margin: '0 0 16px 0'
    }}>
      活動管理
    </h3>
    <p style={{ 
      color: '#cccccc',
      fontSize: '16px',
      margin: '0'
    }}>
      活動創建與管理功能
    </p>
    <div style={{
      marginTop: '20px',
      padding: '16px',
      background: 'linear-gradient(135deg, #3a3a3a 0%, #4d4d4d 100%)',
      border: '1px solid rgba(218, 165, 32, 0.3)',
      borderRadius: '8px',
      color: '#cccccc'
    }}>
      此功能正在開發中...
    </div>
  </div>
);

// 現在讓我找到主返回語句並添加系統通知
const DashboardLayoutV2WithNotifications = () => {
  const dashboard = DashboardLayoutV2();
  return (
    <>
      {dashboard}
      <SystemNotifications />
    </>
  );
};

export default DashboardLayoutV2WithNotifications;