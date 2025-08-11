import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuthV2';

const SongRequestHistoryFullScreen = () => {
  const { user } = useAuth();
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // 模擬點歌歷史數據
  const mockRequestHistory = [
    {
      id: 1,
      song: '告白氣球',
      artist: '周杰倫',
      singer: '張小美',
      requestedBy: '小明',
      requestedAt: '2024-01-15 19:30',
      completedAt: '2024-01-15 19:45',
      status: '已完成',
      duration: '3:33',
      rating: 4.8
    },
    {
      id: 2,
      song: '小幸運',
      artist: '田馥甄',
      singer: '張小美',
      requestedBy: '小華',
      requestedAt: '2024-01-15 18:45',
      completedAt: '2024-01-15 19:02',
      status: '已完成',
      duration: '4:28',
      rating: 4.6
    },
    {
      id: 3,
      song: '體面',
      artist: '于文文',
      singer: '張小美',
      requestedBy: '小美',
      requestedAt: '2024-01-15 20:15',
      status: '進行中',
      duration: '3:47'
    },
    {
      id: 4,
      song: '倔強',
      artist: '五月天',
      singer: '李搖滾',
      requestedBy: '大雄',
      requestedAt: '2024-01-15 17:20',
      completedAt: '2024-01-15 17:35',
      status: '已完成',
      duration: '3:52',
      rating: 4.9
    },
    {
      id: 5,
      song: '南山南',
      artist: '馬頔',
      singer: '王民謠',
      requestedBy: '小玲',
      requestedAt: '2024-01-15 16:30',
      status: '待演出',
      duration: '5:23'
    }
  ];

  // 過濾歷史記錄
  const filteredHistory = mockRequestHistory.filter(request => {
    const matchesSearch = 
      request.song.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.artist.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.singer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.requestedBy.toLowerCase().includes(searchTerm.toLowerCase());
    
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
    total: mockRequestHistory.length,
    completed: mockRequestHistory.filter(r => r.status === '已完成').length,
    ongoing: mockRequestHistory.filter(r => r.status === '進行中').length,
    pending: mockRequestHistory.filter(r => r.status === '待演出').length
  };

  return (
    <div className="request-history-fullscreen">
      <div className="history-header">
        <div className="header-info">
          <h2>📋 點歌歷史</h2>
          <p>查看所有點歌記錄和狀態</p>
        </div>
        
        <div className="header-controls">
          <div className="search-box">
            <input
              type="text"
              placeholder="搜尋歌曲、歌手、點歌人..."
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
        </div>
      </div>

      {/* 歷史記錄列表 */}
      <div className="history-content">
        <div className="history-list">
          {filteredHistory.length === 0 ? (
            <div className="empty-history">
              <div className="empty-icon">🔍</div>
              <h3>找不到記錄</h3>
              <p>請嘗試調整搜尋條件</p>
            </div>
          ) : (
            filteredHistory.map(request => (
              <div key={request.id} className="history-item">
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
                      <span className="meta-label">點歌人：</span>
                      <span className="meta-value">{request.requestedBy}</span>
                    </div>
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
        .request-history-fullscreen {
          height: 100%;
          display: flex;
          flex-direction: column;
          background: #f8fafc;
        }

        .history-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px 32px;
          background: white;
          border-bottom: 1px solid #e2e8f0;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          flex-shrink: 0;
        }

        .header-info h2 {
          margin: 0 0 4px 0;
          color: #1e293b;
          font-size: 24px;
          font-weight: 700;
        }

        .header-info p {
          margin: 0;
          color: #64748b;
          font-size: 14px;
        }

        .header-controls {
          display: flex;
          gap: 16px;
          align-items: center;
        }

        .search-input, .status-filter {
          padding: 10px 16px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 14px;
          background: white;
          transition: all 0.2s ease;
        }

        .search-input:focus, .status-filter:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .search-input {
          width: 300px;
        }

        .stats-section {
          padding: 24px 32px;
          background: white;
          border-bottom: 1px solid #e2e8f0;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
        }

        .stat-card {
          background: #f8fafc;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          transition: all 0.3s ease;
        }

        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .stat-card.total {
          border-color: #667eea;
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
        }

        .stat-card.completed {
          border-color: #10b981;
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.1));
        }

        .stat-card.ongoing {
          border-color: #f59e0b;
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(217, 119, 6, 0.1));
        }

        .stat-card.pending {
          border-color: #6b7280;
          background: linear-gradient(135deg, rgba(107, 114, 128, 0.1), rgba(75, 85, 99, 0.1));
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
          color: #1e293b;
          line-height: 1;
          margin-bottom: 4px;
        }

        .stat-label {
          font-size: 14px;
          color: #64748b;
          font-weight: 500;
        }

        .history-content {
          flex: 1;
          overflow-y: auto;
          padding: 32px;
        }

        .history-list {
          display: grid;
          gap: 16px;
        }

        .history-item {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
          display: flex;
          gap: 16px;
          align-items: flex-start;
          transition: box-shadow 0.3s ease;
        }

        .history-item:hover {
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
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
          color: #1e293b;
          font-size: 18px;
          font-weight: 600;
        }

        .song-details {
          margin: 0;
          color: #64748b;
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
          color: #64748b;
          min-width: 80px;
          font-weight: 500;
        }

        .meta-value {
          color: #374151;
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
          color: #374151;
          font-weight: 600;
        }

        .empty-history {
          text-align: center;
          padding: 80px 20px;
          color: #64748b;
        }

        .empty-icon {
          font-size: 64px;
          margin-bottom: 20px;
        }

        .empty-history h3 {
          margin: 0 0 8px 0;
          color: #374151;
          font-size: 20px;
          font-weight: 600;
        }

        .empty-history p {
          margin: 0;
          font-size: 16px;
        }

        @media (max-width: 768px) {
          .history-header {
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

          .history-content {
            padding: 16px;
          }

          .history-item {
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

export default SongRequestHistoryFullScreen;