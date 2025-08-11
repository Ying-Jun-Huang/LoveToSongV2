import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuthV2';

const SingerDetailFullScreen = ({ singer, onBack }) => {
  const { user, hasAnyPermission } = useAuth();
  const [activeSection, setActiveSection] = useState('songs');
  const [requestHistory, setRequestHistory] = useState([]);

  // 模擬歌手詳細資料
  const singerDetail = {
    ...singer,
    bio: `${singer.name}是一位充滿才華的歌手，以其獨特的${singer.genre.join('、')}風格著稱。從小就對音樂充滿熱忱，多年來在音樂路上不斷精進，深受觀眾喜愛。`,
    songs: [
      { id: 1, title: '夜空中最亮的星', artist: '逃跑計劃', difficulty: '中等', duration: '4:12', requestCount: 23, lastRequestedAt: '2024-01-15' },
      { id: 2, title: '告白氣球', artist: '周杰倫', difficulty: '簡單', duration: '3:33', requestCount: 45, lastRequestedAt: '2024-01-15' },
      { id: 3, title: '小幸運', artist: '田馥甄', difficulty: '中等', duration: '4:28', requestCount: 38, lastRequestedAt: '2024-01-14' },
      { id: 4, title: '演員', artist: '薛之謙', difficulty: '困難', duration: '4:20', requestCount: 12, lastRequestedAt: '2024-01-13' },
      { id: 5, title: '體面', artist: '于文文', difficulty: '中等', duration: '3:47', requestCount: 31, lastRequestedAt: '2024-01-15' },
      { id: 6, title: '後來', artist: '劉若英', difficulty: '簡單', duration: '4:38', requestCount: 56, lastRequestedAt: '2024-01-14' },
      { id: 7, title: '匆匆那年', artist: '王菲', difficulty: '中等', duration: '3:56', requestCount: 19, lastRequestedAt: '2024-01-12' },
      { id: 8, title: '南山南', artist: '馬頔', difficulty: '困難', duration: '5:23', requestCount: 8, lastRequestedAt: '2024-01-10' }
    ],
    recentPerformances: [
      { date: '2024-01-10', event: '新年音樂會', venue: '信義威秀', rating: 4.8 },
      { date: '2024-01-05', event: '街頭演唱', venue: '西門町', rating: 4.6 },
      { date: '2023-12-25', event: '聖誕演出', venue: '咖啡廳', rating: 4.9 }
    ],
    requestHistory: [
      { id: 1, song: '告白氣球', requestedBy: '小明', requestedAt: '2024-01-15 19:30', status: '已完成' },
      { id: 2, song: '小幸運', requestedBy: '小華', requestedAt: '2024-01-15 18:45', status: '已完成' },
      { id: 3, song: '體面', requestedBy: '小美', requestedAt: '2024-01-15 20:15', status: '進行中' },
      { id: 4, song: '後來', requestedBy: '大雄', requestedAt: '2024-01-15 17:20', status: '已完成' }
    ]
  };

  // 判斷是否有點歌權限
  const canRequestSong = hasAnyPermission(['SONG_REQUEST']);

  // 處理點歌
  const handleSongRequest = (song) => {
    if (!canRequestSong) {
      alert('您沒有點歌權限');
      return;
    }

    const newRequest = {
      id: Date.now(),
      song: song.title,
      requestedBy: user.displayName,
      requestedAt: new Date().toLocaleString('zh-TW'),
      status: '待演出'
    };

    // 這裡應該發送API請求
    console.log('點歌請求:', {
      singer: singer.name,
      song: song.title,
      requester: user.displayName
    });

    // 更新歌曲的點歌次數
    const songIndex = singerDetail.songs.findIndex(s => s.id === song.id);
    if (songIndex !== -1) {
      singerDetail.songs[songIndex].requestCount += 1;
      singerDetail.songs[songIndex].lastRequestedAt = new Date().toLocaleDateString('zh-TW');
    }

    alert(`已成功點歌：${song.title}`);
    
    // 更新點歌紀錄
    singerDetail.requestHistory.unshift(newRequest);
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case '簡單': return '#10b981';
      case '中等': return '#f59e0b';
      case '困難': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const sections = [
    { id: 'songs', label: '會的歌', icon: '🎵' },
    { id: 'requests', label: '點歌紀錄', icon: '📋' },
    { id: 'performance', label: '演出紀錄', icon: '🎭' }
  ];

  return (
    <div className="singer-detail-fullscreen">
      <div className="detail-header">
        <button className="back-button" onClick={onBack}>
          ← 返回列表
        </button>
        
        <div className="singer-summary">
          <div className="singer-avatar-large" style={{ backgroundColor: singer.color }}>
            <span className="avatar-emoji">{singer.avatar}</span>
          </div>
          
          <div className="singer-main-info">
            <h1>{singer.name}</h1>
            <div className="singer-genres">
              {singer.genre.map((genre, index) => (
                <span key={index} className="genre-tag">
                  {genre}
                </span>
              ))}
            </div>
            <p className="singer-description">{singer.description}</p>
            <div className="singer-quick-stats">
              <span className="stat-item">📀 {singer.songsCount} 首歌</span>
              <span className="stat-item">⭐ 4.7 評分</span>
            </div>
          </div>
        </div>
      </div>

      <div className="detail-content">
        <div className="section-tabs">
          {sections.map(section => (
            <button
              key={section.id}
              className={`tab-button ${activeSection === section.id ? 'active' : ''}`}
              onClick={() => setActiveSection(section.id)}
            >
              <span className="tab-icon">{section.icon}</span>
              <span className="tab-label">{section.label}</span>
            </button>
          ))}
        </div>

        <div className="section-content">
          {activeSection === 'songs' && (
            <div className="songs-section">
              <div className="section-header">
                <h3>會唱的歌曲</h3>
                <span className="song-count">{singerDetail.songs.length} 首</span>
              </div>
              
              <div className="songs-list">
                {singerDetail.songs
                  .sort((a, b) => b.requestCount - a.requestCount) // 按點歌次數排序
                  .map((song, index) => (
                  <div key={song.id} className={`song-item ${song.requestCount >= 30 ? 'popular' : ''}`}>
                    <div className="song-ranking">
                      {index < 3 && (
                        <span className={`rank-badge rank-${index + 1}`}>
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                        </span>
                      )}
                    </div>
                    
                    <div className="song-info">
                      <h4 className="song-title">
                        {song.title}
                        {song.requestCount >= 50 && <span className="hot-badge">🔥</span>}
                      </h4>
                      <p className="song-artist">原唱：{song.artist}</p>
                      <div className="song-stats">
                        <span className="request-count">
                          🎤 被點 {song.requestCount} 次
                        </span>
                        <span className="last-requested">
                          最後點歌：{song.lastRequestedAt}
                        </span>
                      </div>
                    </div>
                    
                    <div className="song-meta">
                      <span 
                        className="difficulty-tag"
                        style={{ backgroundColor: getDifficultyColor(song.difficulty) }}
                      >
                        {song.difficulty}
                      </span>
                      <span className="song-duration">{song.duration}</span>
                      {canRequestSong && (
                        <button 
                          className="request-btn"
                          onClick={() => handleSongRequest(song)}
                        >
                          點歌
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'requests' && (
            <div className="requests-section">
              <div className="section-header">
                <h3>點歌紀錄</h3>
                <span className="request-count">{singerDetail.requestHistory.length} 筆記錄</span>
              </div>
              
              <div className="requests-list">
                {singerDetail.requestHistory.length === 0 ? (
                  <div className="empty-requests">
                    <div className="empty-icon">🎤</div>
                    <h4>還沒有點歌紀錄</h4>
                    <p>成為第一個點歌的人吧！</p>
                  </div>
                ) : (
                  singerDetail.requestHistory.map(request => (
                    <div key={request.id} className="request-item">
                      <div className="request-info">
                        <h4 className="request-song">{request.song}</h4>
                        <div className="request-meta">
                          <span className="requester">點歌人：{request.requestedBy}</span>
                          <span className="request-time">{request.requestedAt}</span>
                        </div>
                      </div>
                      <div className="request-status">
                        <span className={`status-badge ${request.status === '已完成' ? 'completed' : request.status === '進行中' ? 'ongoing' : 'pending'}`}>
                          {request.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeSection === 'performance' && (
            <div className="performance-section">
              <div className="section-header">
                <h3>最近演出紀錄</h3>
              </div>
              
              <div className="performances-list">
                {singerDetail.recentPerformances.map((perf, index) => (
                  <div key={index} className="performance-item">
                    <div className="performance-date">
                      <span className="date">{perf.date}</span>
                    </div>
                    <div className="performance-info">
                      <h4 className="event-name">{perf.event}</h4>
                      <p className="venue">📍 {perf.venue}</p>
                    </div>
                    <div className="performance-rating">
                      <span className="rating">⭐ {perf.rating}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx="true">{`
        .singer-detail-fullscreen {
          height: 100%;
          display: flex;
          flex-direction: column;
          background: #f8fafc;
        }

        .detail-header {
          background: white;
          padding: 24px 32px;
          border-bottom: 1px solid #e2e8f0;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          flex-shrink: 0;
        }

        .back-button {
          background: #f1f5f9;
          color: #475569;
          border: 1px solid #e2e8f0;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 14px;
          cursor: pointer;
          margin-bottom: 20px;
          transition: all 0.2s ease;
        }

        .back-button:hover {
          background: #e2e8f0;
        }

        .singer-summary {
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .singer-avatar-large {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
          flex-shrink: 0;
        }

        .avatar-emoji {
          font-size: 48px;
        }

        .singer-main-info h1 {
          margin: 0 0 12px 0;
          color: #1e293b;
          font-size: 32px;
          font-weight: 700;
        }

        .singer-genres {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 12px;
        }

        .genre-tag {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          padding: 6px 12px;
          border-radius: 16px;
          font-size: 14px;
          font-weight: 500;
        }

        .singer-description {
          margin: 0 0 16px 0;
          color: #64748b;
          font-size: 16px;
          line-height: 1.5;
        }

        .singer-quick-stats {
          display: flex;
          gap: 24px;
          flex-wrap: wrap;
        }

        .stat-item {
          color: #64748b;
          font-size: 14px;
          font-weight: 500;
        }

        .detail-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .section-tabs {
          display: flex;
          background: white;
          border-bottom: 1px solid #e2e8f0;
          padding: 0 32px;
          flex-shrink: 0;
        }

        .tab-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 16px 24px;
          border: none;
          background: none;
          cursor: pointer;
          color: #64748b;
          font-weight: 500;
          border-bottom: 3px solid transparent;
          transition: all 0.2s ease;
        }

        .tab-button.active {
          color: #667eea;
          border-bottom-color: #667eea;
        }

        .tab-button:hover {
          color: #667eea;
        }

        .tab-icon {
          font-size: 18px;
        }

        .section-content {
          flex: 1;
          overflow-y: auto;
          padding: 32px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .section-header h3 {
          margin: 0;
          color: #1e293b;
          font-size: 20px;
          font-weight: 600;
        }

        .song-count {
          color: #64748b;
          font-size: 14px;
          background: #f1f5f9;
          padding: 4px 8px;
          border-radius: 8px;
        }

        .songs-list {
          display: grid;
          gap: 12px;
        }

        .song-item {
          background: white;
          padding: 16px 20px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          display: flex;
          align-items: center;
          gap: 16px;
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
        }

        .song-item:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .song-item.popular {
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.05), rgba(118, 75, 162, 0.05));
          border: 1px solid rgba(102, 126, 234, 0.2);
        }

        .song-ranking {
          flex-shrink: 0;
          width: 40px;
          display: flex;
          justify-content: center;
        }

        .rank-badge {
          font-size: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .song-info {
          flex: 1;
        }

        .song-info h4 {
          margin: 0 0 4px 0;
          color: #1e293b;
          font-size: 16px;
          font-weight: 600;
        }

        .song-artist {
          margin: 0;
          color: #64748b;
          font-size: 14px;
        }

        .song-title {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .hot-badge {
          font-size: 16px;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        .song-stats {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-top: 8px;
        }

        .request-count {
          font-size: 12px;
          color: #667eea;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .last-requested {
          font-size: 11px;
          color: #94a3b8;
        }

        .song-meta {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
        }

        .difficulty-tag {
          color: white;
          padding: 4px 8px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
        }

        .song-duration {
          color: #64748b;
          font-size: 14px;
        }

        .performances-list {
          display: grid;
          gap: 16px;
        }

        .performance-item {
          background: white;
          padding: 20px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: 20px;
          align-items: center;
        }

        .performance-date .date {
          color: #667eea;
          font-weight: 600;
          font-size: 14px;
        }

        .event-name {
          margin: 0 0 4px 0;
          color: #1e293b;
          font-size: 16px;
          font-weight: 600;
        }

        .venue {
          margin: 0;
          color: #64748b;
          font-size: 14px;
        }

        .rating {
          color: #f59e0b;
          font-weight: 600;
        }

        /* 點歌按鈕樣式 */
        .request-btn {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-left: 12px;
        }

        .request-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }

        /* 點歌紀錄樣式 */
        .request-count {
          color: #64748b;
          font-size: 14px;
          background: #f1f5f9;
          padding: 4px 8px;
          border-radius: 8px;
        }

        .requests-list {
          display: grid;
          gap: 12px;
        }

        .request-item {
          background: white;
          padding: 16px 20px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-left: 4px solid #e2e8f0;
        }

        .request-info {
          flex: 1;
        }

        .request-song {
          margin: 0 0 8px 0;
          color: #1e293b;
          font-size: 16px;
          font-weight: 600;
        }

        .request-meta {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .requester {
          color: #64748b;
          font-size: 13px;
          font-weight: 500;
        }

        .request-time {
          color: #94a3b8;
          font-size: 12px;
        }

        .request-status {
          flex-shrink: 0;
        }

        .status-badge {
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          color: white;
        }

        .status-badge.completed {
          background: #10b981;
        }

        .status-badge.ongoing {
          background: #f59e0b;
        }

        .status-badge.pending {
          background: #6b7280;
        }

        .empty-requests {
          text-align: center;
          padding: 60px 20px;
          color: #64748b;
        }

        .empty-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .empty-requests h4 {
          margin: 0 0 8px 0;
          color: #374151;
          font-size: 18px;
          font-weight: 600;
        }

        .empty-requests p {
          margin: 0;
          font-size: 14px;
        }

        @media (max-width: 768px) {
          .detail-header {
            padding: 16px 20px;
          }

          .singer-summary {
            flex-direction: column;
            text-align: center;
            gap: 16px;
          }

          .singer-avatar-large {
            width: 80px;
            height: 80px;
          }

          .avatar-emoji {
            font-size: 32px;
          }

          .singer-main-info h1 {
            font-size: 24px;
          }

          .singer-quick-stats {
            justify-content: center;
            gap: 16px;
          }

          .section-tabs {
            padding: 0 16px;
          }

          .tab-button {
            padding: 12px 16px;
          }

          .section-content {
            padding: 20px 16px;
          }

          .performance-item {
            grid-template-columns: 1fr;
            gap: 12px;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
};

export default SingerDetailFullScreen;