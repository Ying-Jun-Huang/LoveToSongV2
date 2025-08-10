import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { usePermissions } from '../hooks/usePermissions';

const HomepageWidget = () => {
  const { user, permissions, getRoleInfo } = usePermissions();
  const [singerInfo, setSingerInfo] = useState({
    name: '',
    description: '',
    avatar: null,
    totalSongs: 0,
    totalPerformances: 0,
  });
  const [featuredPlayers, setFeaturedPlayers] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [systemStats, setSystemStats] = useState({
    totalPlayers: 0,
    totalSongs: 0,
    todayRequests: 0,
    onlineUsers: 0,
  });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    fetchHomepageData();
    
    // 每秒更新時間
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // 每30秒更新數據
    const dataInterval = setInterval(() => {
      fetchSystemStats();
      fetchRecentActivities();
    }, 30000);

    return () => {
      clearInterval(timeInterval);
      clearInterval(dataInterval);
    };
  }, []);

  const fetchHomepageData = async () => {
    try {
      await Promise.all([
        fetchSingerInfo(),
        fetchFeaturedPlayers(),
        fetchSystemStats(),
        fetchRecentActivities(),
      ]);
    } catch (error) {
      console.error('Failed to fetch homepage data:', error);
    }
  };

  const fetchSingerInfo = async () => {
    try {
      const userResponse = await api.get('/users/me');
      const songsResponse = await api.get('/songs/my');
      const statsResponse = await api.get('/song-requests/stats');
      
      setSingerInfo({
        name: userResponse.data.username || '歌手',
        description: userResponse.data.description || '歡迎來到我的歌唱世界！',
        avatar: userResponse.data.avatar,
        totalSongs: songsResponse.data.length || 0,
        totalPerformances: statsResponse.data.totalCompleted || 0,
      });

      setProfileForm({
        name: userResponse.data.username || '',
        description: userResponse.data.description || '歡迎來到我的歌唱世界！',
      });
    } catch (error) {
      console.error('Failed to fetch singer info:', error);
      // 設置默認值避免組件崩潰
      setSingerInfo({
        name: '歌手',
        description: '歡迎來到點歌系統',
        avatar: null,
        totalSongs: 0,
        totalPerformances: 0,
      });
    }
  };

  const fetchFeaturedPlayers = async () => {
    try {
      const response = await api.get('/players');
      // 取最活躍的前6位玩家
      const sortedPlayers = response.data
        .sort((a, b) => b.songCount - a.songCount)
        .slice(0, 6);
      setFeaturedPlayers(sortedPlayers);
    } catch (error) {
      console.error('Failed to fetch featured players:', error);
    }
  };

  const fetchSystemStats = async () => {
    try {
      const [playersResponse, songsResponse, requestsResponse] = await Promise.all([
        api.get('/players/stats'),
        api.get('/songs'),
        api.get('/song-requests/stats'),
      ]);

      setSystemStats({
        totalPlayers: playersResponse.data.totalPlayers || 0,
        totalSongs: songsResponse.data.length || 0,
        todayRequests: requestsResponse.data.totalCompleted || 0,
        onlineUsers: Math.floor(Math.random() * 10) + 1, // 模擬在線用戶
      });
    } catch (error) {
      console.error('Failed to fetch system stats:', error);
    }
  };

  const fetchRecentActivities = async () => {
    try {
      const response = await api.get('/song-requests?limit=10&status=COMPLETED');
      setRecentActivities(response.data.requests || []);
    } catch (error) {
      console.error('Failed to fetch recent activities:', error);
    }
  };

  const updateProfile = async (e) => {
    e.preventDefault();
    try {
      await api.patch('/users/me', profileForm);
      setSingerInfo(prev => ({
        ...prev,
        name: profileForm.name,
        description: profileForm.description,
      }));
      setIsEditingProfile(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('更新個人資料失敗');
    }
  };

  const formatTime = (date) => {
    return date.toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 6) return '深夜好';
    if (hour < 12) return '早安';
    if (hour < 18) return '午安';
    return '晚安';
  };

  return (
    <div className="homepage-widget">
      {/* 頂部時間和問候 */}
      <div className="header-section">
        <div className="time-display">
          <div className="current-time">{formatTime(currentTime)}</div>
          <div className="greeting">{getGreeting()}，{singerInfo.name || '用戶'}！</div>
        </div>
        <div className="system-status">
          <span className="status-indicator online"></span>
          系統運行中
        </div>
      </div>

      {/* 歌手資訊卡片 */}
      <div className="singer-profile">
        <div className="profile-header">
          <div className="avatar-section">
            {singerInfo.avatar ? (
              <img src={singerInfo.avatar} alt="歌手頭像" className="singer-avatar" />
            ) : (
              <div className="avatar-placeholder">
                {singerInfo.name ? singerInfo.name.charAt(0) : '?'}
              </div>
            )}
          </div>
          <div className="profile-info">
            <div className="profile-header-info">
              <h2 className="singer-name">{singerInfo.name || '歌手'}</h2>
              {user && (
                <div 
                  className="user-role-badge"
                  style={{ backgroundColor: getRoleInfo(user.role).color }}
                >
                  {getRoleInfo(user.role).name}
                </div>
              )}
            </div>
            <p className="singer-description">{singerInfo.description || '歡迎來到點歌系統'}</p>
            
            {/* 權限資訊 */}
            {user && (
              <div className="permissions-info">
                <h4>權限範圍</h4>
                <div className="permission-badges">
                  {permissions.canManageUsers && <span className="permission-badge admin">用戶管理</span>}
                  {permissions.canManageContent && <span className="permission-badge admin">內容管理</span>}
                  {permissions.canManagePlayers && <span className="permission-badge manager">玩家管理</span>}
                  {permissions.canManageSongs && <span className="permission-badge manager">歌曲管理</span>}
                  {permissions.canRequestSongs && <span className="permission-badge user">點歌功能</span>}
                  {permissions.canViewOnly && <span className="permission-badge guest">瀏覽權限</span>}
                </div>
              </div>
            )}
            
            <div className="singer-stats">
              <div className="stat-item">
                <span className="stat-number">{singerInfo.totalSongs}</span>
                <span className="stat-label">首歌曲</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{singerInfo.totalPerformances}</span>
                <span className="stat-label">次演出</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsEditingProfile(!isEditingProfile)}
            className="edit-profile-btn"
          >
            {isEditingProfile ? '取消' : '編輯'}
          </button>
        </div>

        {isEditingProfile && (
          <form onSubmit={updateProfile} className="profile-edit-form">
            <div className="form-row">
              <label>歌手名稱:</label>
              <input
                type="text"
                value={profileForm.name}
                onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                required
              />
            </div>
            <div className="form-row">
              <label>個人簡介:</label>
              <textarea
                value={profileForm.description}
                onChange={(e) => setProfileForm({...profileForm, description: e.target.value})}
                rows="3"
              />
            </div>
            <div className="form-actions">
              <button type="submit">保存</button>
            </div>
          </form>
        )}
      </div>

      {/* 系統統計 */}
      <div className="system-stats">
        <h3>今日概況</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon players-icon">👥</div>
            <div className="stat-content">
              <div className="stat-number">{systemStats.totalPlayers}</div>
              <div className="stat-label">總玩家數</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon songs-icon">🎵</div>
            <div className="stat-content">
              <div className="stat-number">{systemStats.totalSongs}</div>
              <div className="stat-label">歌曲庫</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon requests-icon">🎤</div>
            <div className="stat-content">
              <div className="stat-number">{systemStats.todayRequests}</div>
              <div className="stat-label">今日點歌</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon online-icon">💚</div>
            <div className="stat-content">
              <div className="stat-number">{systemStats.onlineUsers}</div>
              <div className="stat-label">在線用戶</div>
            </div>
          </div>
        </div>
      </div>

      {/* 精選玩家 */}
      <div className="featured-players">
        <h3>活躍玩家</h3>
        {featuredPlayers.length === 0 ? (
          <div className="empty-state">暫無玩家資料</div>
        ) : (
          <div className="players-grid">
            {featuredPlayers.map(player => (
              <div key={player.id} className="player-card">
                <div className="player-avatar">
                  {player.photoPath ? (
                    <img src={player.photoPath} alt={player.name} />
                  ) : (
                    <div className="avatar-placeholder">
                      {player.name ? player.name.charAt(0) : '?'}
                    </div>
                  )}
                </div>
                <div className="player-info">
                  <div className="player-name">{player.name}</div>
                  <div className="player-id">{player.playerId}</div>
                  <div className="player-stats">
                    <span className="song-count">{player.songCount} 首點歌</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 最近活動 */}
      <div className="recent-activities">
        <h3>最近演出</h3>
        {recentActivities.length === 0 ? (
          <div className="empty-state">暫無演出記錄</div>
        ) : (
          <div className="activities-list">
            {recentActivities.slice(0, 5).map(activity => (
              <div key={activity.id} className="activity-item">
                <div className="activity-time">
                  {new Date(activity.completedAt || activity.requestedAt).toLocaleTimeString('zh-TW', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
                <div className="activity-content">
                  <div className="activity-song">{activity.song?.title}</div>
                  <div className="activity-player">
                    {activity.player?.name || activity.user?.username}
                  </div>
                </div>
                <div className="activity-status">
                  {activity.status === 'COMPLETED' ? '✅' : '⏳'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx="true">{`
        .homepage-widget {
          background: transparent;
          border-radius: 0;
          padding: 24px;
          box-shadow: none;
          border: none;
          height: 100%;
          display: flex;
          flex-direction: column;
          gap: 24px;
          overflow-y: auto;
        }

        .header-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 12px;
        }

        .time-display .current-time {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 4px;
        }

        .time-display .greeting {
          font-size: 14px;
          opacity: 0.9;
        }

        .system-status {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
        }

        .status-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #4caf50;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }

        .singer-profile {
          background: #f8f9fa;
          border-radius: 12px;
          padding: 20px;
          border: 1px solid #e9ecef;
        }

        .profile-header {
          display: flex;
          align-items: flex-start;
          gap: 20px;
        }

        .avatar-section {
          flex-shrink: 0;
        }

        .singer-avatar {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          object-fit: cover;
        }

        .avatar-placeholder {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          font-weight: bold;
        }

        .profile-info {
          flex: 1;
        }

        .profile-header-info {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
        }

        .singer-name {
          font-size: 24px;
          font-weight: bold;
          color: #333;
          margin: 0;
        }

        .user-role-badge {
          padding: 4px 12px;
          border-radius: 12px;
          color: white;
          font-size: 12px;
          font-weight: bold;
          text-shadow: 0 1px 2px rgba(0,0,0,0.2);
        }

        .singer-description {
          color: #666;
          margin: 0 0 16px 0;
          line-height: 1.5;
        }

        .permissions-info {
          margin-bottom: 16px;
        }

        .permissions-info h4 {
          font-size: 14px;
          color: #333;
          margin: 0 0 8px 0;
        }

        .permission-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .permission-badge {
          padding: 2px 8px;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 500;
          color: white;
        }

        .permission-badge.admin {
          background: linear-gradient(135deg, #e53e3e, #d69e2e);
        }

        .permission-badge.manager {
          background: linear-gradient(135deg, #38a169, #3182ce);
        }

        .permission-badge.user {
          background: linear-gradient(135deg, #3182ce, #805ad5);
        }

        .permission-badge.guest {
          background: #718096;
        }

        .singer-stats {
          display: flex;
          gap: 24px;
        }

        .stat-item {
          text-align: center;
        }

        .stat-number {
          display: block;
          font-size: 24px;
          font-weight: bold;
          color: #667eea;
        }

        .stat-label {
          font-size: 12px;
          color: #666;
        }

        .edit-profile-btn {
          padding: 8px 16px;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
        }

        .profile-edit-form {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #e9ecef;
        }

        .form-row {
          margin-bottom: 15px;
        }

        .form-row label {
          display: block;
          margin-bottom: 5px;
          font-weight: bold;
          color: #333;
        }

        .form-row input,
        .form-row textarea {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
        }

        .form-actions button {
          padding: 8px 16px;
          background: #28a745;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        .system-stats h3 {
          margin: 0 0 16px 0;
          color: #333;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 16px;
        }

        .stat-card {
          background: white;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          transition: box-shadow 0.2s ease;
        }

        .stat-card:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .stat-icon {
          font-size: 24px;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          background: #f8f9fa;
        }

        .stat-content .stat-number {
          font-size: 20px;
          font-weight: bold;
          color: #333;
          margin-bottom: 2px;
        }

        .stat-content .stat-label {
          font-size: 12px;
          color: #666;
        }

        .featured-players h3,
        .recent-activities h3 {
          margin: 0 0 16px 0;
          color: #333;
        }

        .players-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 12px;
        }

        .player-card {
          background: white;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          padding: 12px;
          text-align: center;
          transition: transform 0.2s ease;
        }

        .player-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .player-avatar {
          margin-bottom: 8px;
        }

        .player-avatar img {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          object-fit: cover;
        }

        .player-avatar .avatar-placeholder {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: linear-gradient(135deg, #ff9a9e, #fecfef);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          font-weight: bold;
          margin: 0 auto;
        }

        .player-name {
          font-weight: bold;
          color: #333;
          margin-bottom: 2px;
        }

        .player-id {
          font-size: 12px;
          color: #666;
          margin-bottom: 4px;
        }

        .song-count {
          font-size: 11px;
          background: #e3f2fd;
          color: #1976d2;
          padding: 2px 6px;
          border-radius: 10px;
        }

        .activities-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .activity-item {
          display: flex;
          align-items: center;
          padding: 12px;
          background: #f8f9fa;
          border-radius: 6px;
          border: 1px solid #e9ecef;
        }

        .activity-time {
          font-size: 12px;
          color: #666;
          margin-right: 16px;
          min-width: 60px;
        }

        .activity-content {
          flex: 1;
        }

        .activity-song {
          font-weight: bold;
          color: #333;
          margin-bottom: 2px;
        }

        .activity-player {
          font-size: 12px;
          color: #666;
        }

        .activity-status {
          margin-left: 12px;
        }

        .empty-state {
          text-align: center;
          color: #666;
          padding: 20px;
          font-style: italic;
        }
      `}</style>
    </div>
  );
};

export default HomepageWidget;