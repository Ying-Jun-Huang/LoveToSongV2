import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuthV2';

const PlayerSongRequestsFullScreen = () => {
  const { user } = useAuth();
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // 模擬玩家的點歌記錄
  const [playerRequests] = useState([
    {
      id: 1,
      song: '告白氣球',
      artist: '周杰倫',
      singer: '張小美',
      requestedAt: '2024-01-15 19:30',
      completedAt: '2024-01-15 19:45',
      status: '已完成',
      duration: '3:33',
      rating: 4.8,
      note: '很棒的演唱！'
    },
    {
      id: 2,
      song: '小幸運',
      artist: '田馥甄',
      singer: '張小美',
      requestedAt: '2024-01-15 18:45',
      completedAt: '2024-01-15 19:02',
      status: '已完成',
      duration: '4:28',
      rating: 4.6,
      note: '感動人心的演出'
    },
    {
      id: 3,
      song: '體面',
      artist: '于文文',
      singer: '張小美',
      requestedAt: '2024-01-15 20:15',
      status: '進行中',
      duration: '3:47'
    },
    {
      id: 4,
      song: '倔強',
      artist: '五月天',
      singer: '李搖滾',
      requestedAt: '2024-01-15 17:20',
      completedAt: '2024-01-15 17:35',
      status: '已完成',
      duration: '3:52',
      rating: 4.9,
      note: '超棒的搖滾版本！'
    },
    {
      id: 5,
      song: '南山南',
      artist: '馬頔',
      singer: '王民謠',
      requestedAt: '2024-01-15 16:30',
      status: '待演出',
      duration: '5:23'
    },
    {
      id: 6,
      song: '成都',
      artist: '趙雷',
      singer: '王民謠',
      requestedAt: '2024-01-14 21:15',
      completedAt: '2024-01-14 21:45',
      status: '已完成',
      duration: '5:28',
      rating: 5.0,
      note: '完美的民謠演出，太感動了！'
    }
  ]);

  // 過濾點歌記錄
  const filteredRequests = playerRequests.filter(request => {
    const matchesSearch = 
      request.song.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.artist.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.singer.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'ALL' || request.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case '已完成': return '#10b981';
      case '進行中': return '#f59e0b';
      case '待演出': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case '已完成': return '✅';
      case '進行中': return '🎤';
      case '待演出': return '⏳';
      default: return '⏳';
    }
  };

  // 統計數據
  const stats = {
    total: playerRequests.length,
    completed: playerRequests.filter(r => r.status === '已完成').length,
    ongoing: playerRequests.filter(r => r.status === '進行中').length,
    pending: playerRequests.filter(r => r.status === '待演出').length,
    averageRating: playerRequests
      .filter(r => r.rating)
      .reduce((sum, r) => sum + r.rating, 0) / 
      playerRequests.filter(r => r.rating).length || 0
  };

  return (
    <div className="player-requests-fullscreen">
      <div className="requests-header">
        <div className="header-info">
          <h2>🎤 我的點歌記錄</h2>
          <p>查看您的所有點歌記錄和演出狀態</p>
        </div>
        
        <div className="header-controls">
          <div className="search-box">
            <input
              type="text"
              placeholder="搜尋歌曲、歌手、演唱者..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="status-filter"
          >
            <option value="ALL">所有狀態</option>
            <option value="已完成">已完成</option>
            <option value="進行中">進行中</option>
            <option value="待演出">待演出</option>
          </select>
        </div>
      </div>

      {/* 統計卡片 */}
      <div className="stats-section">
        <div className="stats-grid">
          <div className="stat-card total">
            <div className="stat-icon">🎵</div>
            <div className="stat-content">
              <div className="stat-number">{stats.total}</div>
              <div className="stat-label">總點歌數</div>
            </div>
          </div>
          <div className="stat-card completed">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <div className="stat-number">{stats.completed}</div>
              <div className="stat-label">已完成</div>
            </div>
          </div>
          <div className="stat-card ongoing">
            <div className="stat-icon">🎤</div>
            <div className="stat-content">
              <div className="stat-number">{stats.ongoing}</div>
              <div className="stat-label">進行中</div>
            </div>
          </div>
          <div className="stat-card pending">
            <div className="stat-icon">⏳</div>
            <div className="stat-content">
              <div className="stat-number">{stats.pending}</div>
              <div className="stat-label">待演出</div>
            </div>
          </div>
          <div className="stat-card rating">
            <div className="stat-icon">⭐</div>
            <div className="stat-content">
              <div className="stat-number">{stats.averageRating.toFixed(1)}</div>
              <div className="stat-label">平均評分</div>
            </div>
          </div>
        </div>
      </div>

      {/* 點歌記錄列表 */}
      <div className="requests-content">
        <div className="requests-list">
          {filteredRequests.length === 0 ? (
            <div className="empty-requests">
              <div className="empty-icon">🔍</div>
              <h3>找不到記錄</h3>
              <p>請嘗試調整搜尋條件或去點歌吧！</p>
            </div>
          ) : (
            filteredRequests.map(request => (
              <div key={request.id} className="request-item">
                <div className="item-status">
                  <span className="status-icon">{getStatusIcon(request.status)}</span>
                </div>
                
                <div className="item-content">
                  <div className="item-main">
                    <h4 className="song-title">{request.song}</h4>
                    <p className="song-details">
                      原唱：{request.artist} | 演唱：{request.singer}
                    </p>
                  </div>
                  
                  <div className="item-meta">
                    <div className="meta-row">
                      <span className="meta-label">點歌時間：</span>
                      <span className="meta-value">{request.requestedAt}</span>
                    </div>
                    {request.completedAt && (
                      <div className="meta-row">
                        <span className="meta-label">完成時間：</span>
                        <span className="meta-value">{request.completedAt}</span>
                      </div>
                    )}
                    <div className="meta-row">
                      <span className="meta-label">時長：</span>
                      <span className="meta-value">{request.duration}</span>
                    </div>
                    {request.note && (
                      <div className="request-note">
                        <div className="note-header">我的評語：</div>
                        <div className="note-content">{request.note}</div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="item-actions">
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(request.status) }}
                  >
                    {request.status}
                  </span>
                  {request.rating && (
                    <div className="rating-display">
                      <span className="rating-stars">⭐</span>
                      <span className="rating-value">{request.rating}</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <style jsx="true">{`
        .player-requests-fullscreen {
          height: 100%;
          display: flex;
          flex-direction: column;
          background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
          color: #ffffff;
        }

        .requests-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px 32px;
          background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
          border-bottom: 2px solid #ffd700;
          box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
          flex-shrink: 0;
        }

        .header-info h2 {
          margin: 0 0 4px 0;
          color: #ffd700;
          font-size: 24px;
          font-weight: 700;
        }

        .header-info p {
          margin: 0;
          color: #d4af37;
          font-size: 14px;
        }

        .header-controls {
          display: flex;
          gap: 16px;
          align-items: center;
        }

        .search-input, .status-filter {
          padding: 10px 16px;
          border: 2px solid #daa520;
          border-radius: 8px;
          font-size: 14px;
          background: linear-gradient(135deg, #333333, #404040);
          color: #ffffff;
          transition: all 0.2s ease;
        }

        .search-input:focus, .status-filter:focus {
          outline: none;
          border-color: #ffd700;
          box-shadow: 0 0 0 3px rgba(255, 215, 0, 0.2);
          background: linear-gradient(135deg, #404040, #4a4a4a);
        }

        .search-input::placeholder {
          color: #aaaaaa;
        }

        .search-input {
          width: 300px;
        }

        .stats-section {
          padding: 24px 32px;
          background: rgba(255, 255, 255, 0.1);
          border-bottom: 2px solid #daa520;
          backdrop-filter: blur(10px);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 20px;
        }

        .stat-card {
          background: linear-gradient(135deg, #2a2a2a 0%, #3d3d3d 100%);
          border: 1px solid #daa520;
          border-radius: 12px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 215, 0, 0.1);
          position: relative;
          overflow: hidden;
        }

        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4), 0 0 25px rgba(218, 165, 32, 0.2);
          border-color: #ffd700;
        }

        .stat-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, #daa520, transparent);
          opacity: 0.5;
        }

        .stat-card.total {
          border-color: #667eea;
          background: linear-gradient(135deg, #2a2a2a 0%, #3d3d3d 100%);
        }

        .stat-card.completed {
          border-color: #10b981;
          background: linear-gradient(135deg, #2a2a2a 0%, #3d3d3d 100%);
        }

        .stat-card.ongoing {
          border-color: #f59e0b;
          background: linear-gradient(135deg, #2a2a2a 0%, #3d3d3d 100%);
        }

        .stat-card.pending {
          border-color: #6b7280;
          background: linear-gradient(135deg, #2a2a2a 0%, #3d3d3d 100%);
        }

        .stat-card.rating {
          border-color: #f59e0b;
          background: linear-gradient(135deg, #2a2a2a 0%, #3d3d3d 100%);
        }

        .stat-icon {
          font-size: 32px;
          flex-shrink: 0;
        }

        .stat-content {
          flex: 1;
        }

        .stat-number {
          font-size: 24px;
          font-weight: 700;
          color: #ffd700;
          line-height: 1;
          margin-bottom: 4px;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
        }

        .stat-label {
          font-size: 14px;
          color: #cccccc;
          font-weight: 500;
        }

        .requests-content {
          flex: 1;
          overflow-y: auto;
          padding: 32px;
        }

        .requests-list {
          display: grid;
          gap: 16px;
        }

        .request-item {
          background: linear-gradient(135deg, #2a2a2a 0%, #3d3d3d 100%);
          border: 1px solid #daa520;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 215, 0, 0.1);
          display: flex;
          gap: 16px;
          align-items: flex-start;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .request-item:hover {
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4), 0 0 25px rgba(218, 165, 32, 0.2);
          border-color: #ffd700;
          transform: translateY(-2px);
        }

        .request-item::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, #daa520, transparent);
          opacity: 0.5;
        }

        .item-status {
          flex-shrink: 0;
          width: 40px;
          display: flex;
          justify-content: center;
        }

        .status-icon {
          font-size: 20px;
        }

        .item-content {
          flex: 1;
        }

        .item-main {
          margin-bottom: 12px;
        }

        .song-title {
          margin: 0 0 4px 0;
          color: #ffd700;
          font-size: 18px;
          font-weight: 600;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
        }

        .song-details {
          margin: 0;
          color: #cccccc;
          font-size: 14px;
        }

        .item-meta {
          display: grid;
          gap: 4px;
        }

        .meta-row {
          display: flex;
          gap: 8px;
          font-size: 13px;
        }

        .meta-label {
          color: #daa520;
          min-width: 80px;
          font-weight: 500;
        }

        .meta-value {
          color: #ffffff;
        }

        .request-note {
          margin-top: 12px;
          background: linear-gradient(135deg, #3a3a3a 0%, #4d4d4d 100%);
          padding: 12px;
          border-radius: 8px;
          border-left: 3px solid #daa520;
          border: 1px solid rgba(218, 165, 32, 0.3);
          box-shadow: inset 0 1px 0 rgba(255, 215, 0, 0.1);
        }

        .note-header {
          font-weight: 600;
          color: #ffd700;
          margin-bottom: 4px;
          font-size: 13px;
        }

        .note-content {
          color: #ffffff;
          font-size: 14px;
        }

        .item-actions {
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 8px;
        }

        .status-badge {
          padding: 4px 12px;
          border-radius: 12px;
          color: white;
          font-size: 12px;
          font-weight: 600;
          text-align: center;
          min-width: 60px;
        }

        .rating-display {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 14px;
        }

        .rating-stars {
          color: #f59e0b;
        }

        .rating-value {
          color: #ffffff;
          font-weight: 600;
        }

        .empty-requests {
          text-align: center;
          padding: 80px 20px;
          color: #cccccc;
        }

        .empty-icon {
          font-size: 64px;
          margin-bottom: 20px;
        }

        .empty-requests h3 {
          margin: 0 0 8px 0;
          color: #ffd700;
          font-size: 20px;
          font-weight: 600;
        }

        .empty-requests p {
          margin: 0;
          font-size: 16px;
        }

        @media (max-width: 768px) {
          .requests-header {
            flex-direction: column;
            gap: 16px;
            padding: 16px;
          }

          .header-controls {
            width: 100%;
            justify-content: stretch;
          }

          .search-input {
            flex: 1;
            width: auto;
          }

          .stats-section {
            padding: 16px;
          }

          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }

          .stat-card {
            padding: 16px;
          }

          .requests-content {
            padding: 16px;
          }

          .request-item {
            flex-direction: column;
            align-items: stretch;
          }

          .item-actions {
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
          }
        }
      `}</style>
    </div>
  );
};

export default PlayerSongRequestsFullScreen;