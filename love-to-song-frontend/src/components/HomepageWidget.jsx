import React, { useState, useEffect } from 'react';

const HomepageWidget = () => {
  const [featuredSingers, setFeaturedSingers] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [systemStats, setSystemStats] = useState({
    totalPlayers: 0,
    totalSongs: 0,
    todayRequests: 0,
    onlineUsers: 0,
  });
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // 所有用戶都使用相同的首頁內容
    fetchUnifiedHomepageData();
    
    // 每秒更新時間
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // 每30秒更新數據
    const dataInterval = setInterval(() => {
      fetchFeaturedSingers();
      fetchUpcomingEvents();
      fetchSystemStats();
    }, 30000);

    return () => {
      clearInterval(timeInterval);
      clearInterval(dataInterval);
    };
  }, []);


  const fetchSystemStats = async () => {
    try {
      // 使用模擬數據
      setSystemStats({
        totalPlayers: 156,
        totalSongs: 1250,
        todayRequests: 42,
        onlineUsers: Math.floor(Math.random() * 15) + 5, // 模擬在線用戶
      });
    } catch (error) {
      console.error('Failed to fetch system stats:', error);
    }
  };


  // 統一首頁數據獲取
  const fetchUnifiedHomepageData = async () => {
    try {
      await Promise.all([
        fetchFeaturedSingers(),
        fetchUpcomingEvents(),
        fetchSystemStats(),
      ]);
    } catch (error) {
      console.error('Failed to fetch homepage data:', error);
    }
  };

  // 獲取推薦歌手
  const fetchFeaturedSingers = async () => {
    try {
      // 模擬推薦歌手數據
      const mockFeaturedSingers = [
        {
          id: 1,
          name: '張小美',
          genre: ['流行', '抒情'],
          avatar: '👩‍🎤',
          color: '#ff6b9d',
          songsCount: 45,
          rating: 4.8,
          description: '溫柔嗓音，擅長抒情歌曲'
        },
        {
          id: 2,
          name: '李搖滾',
          genre: ['搖滾', '流行'],
          avatar: '🎸',
          color: '#4ecdc4',
          songsCount: 38,
          rating: 4.7,
          description: '搖滾魂，熱愛現場演出'
        },
        {
          id: 3,
          name: '王民謠',
          genre: ['民謠', '鄉村'],
          avatar: '🎻',
          color: '#45b7d1',
          songsCount: 52,
          rating: 4.9,
          description: '吉他詩人，原創民謠'
        }
      ];
      setFeaturedSingers(mockFeaturedSingers);
    } catch (error) {
      console.error('Failed to fetch featured singers:', error);
    }
  };

  // 獲取即將到來的活動
  const fetchUpcomingEvents = async () => {
    try {
      // 模擬活動數據
      const mockEvents = [
        {
          id: 1,
          title: '週末音樂夜',
          date: '2024-01-20',
          time: '19:00',
          location: '咖啡廳',
          type: '現場演出',
          description: '多位歌手現場演唱，歡迎大家來欣賞！',
          participants: 5
        },
        {
          id: 2,
          title: '新歌發表會',
          date: '2024-01-25',
          time: '20:00',
          location: '小型演出廳',
          type: '新歌首唱',
          description: '張小美最新創作歌曲首次演唱',
          participants: 1
        },
        {
          id: 3,
          title: '民謠之夜',
          date: '2024-01-28',
          time: '18:30',
          location: '戶外舞台',
          type: '主題演出',
          description: '民謠愛好者聚會，分享原創作品',
          participants: 3
        }
      ];
      setUpcomingEvents(mockEvents);
    } catch (error) {
      console.error('Failed to fetch upcoming events:', error);
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
          <div className="greeting">
            {`${getGreeting()}，歡迎來到點歌系統！`}
          </div>
        </div>
        <div className="system-status">
          <span className="status-indicator online"></span>
          系統運行中
        </div>
      </div>

      {/* 推薦歌手 */}
      <div className="featured-singers-section">
        <h3>🌟 推薦歌手</h3>
        <div className="singers-grid">
          {featuredSingers.map(singer => (
            <div key={singer.id} className="featured-singer-card">
              <div className="singer-avatar" style={{ backgroundColor: singer.color }}>
                <span className="avatar-emoji">{singer.avatar}</span>
              </div>
              <div className="singer-info">
                <h4 className="singer-name">{singer.name}</h4>
                <div className="singer-genres">
                  {singer.genre.map((genre, index) => (
                    <span key={index} className="genre-tag">{genre}</span>
                  ))}
                </div>
                <div className="singer-stats">
                  <span className="rating">⭐ {singer.rating}</span>
                  <span className="songs-count">{singer.songsCount} 首歌</span>
                </div>
                <p className="singer-description">{singer.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 即將到來的活動 */}
      <div className="upcoming-events-section">
        <h3>📅 即將到來的活動</h3>
        <div className="events-list">
          {upcomingEvents.map(event => (
            <div key={event.id} className="event-card">
              <div className="event-date">
                <div className="date">{new Date(event.date).getDate()}</div>
                <div className="month">{new Date(event.date).toLocaleDateString('zh-TW', { month: 'short' })}</div>
              </div>
              <div className="event-info">
                <h4 className="event-title">{event.title}</h4>
                <div className="event-meta">
                  <span className="event-time">🕐 {event.time}</span>
                  <span className="event-location">📍 {event.location}</span>
                  <span className="event-type">🎪 {event.type}</span>
                </div>
                <p className="event-description">{event.description}</p>
                <div className="event-participants">
                  {event.participants} 位歌手參與
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 系統統計 */}
      <div className="system-stats">
        <h3>系統概況</h3>
        <div className="stats-grid">
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
          color: #ffffff;
        }

        .header-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
          color: #ffd700;
          border-radius: 12px;
          border: 1px solid #ffd700;
          box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
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


        .system-stats h3 {
          margin: 0 0 16px 0;
          color: #ffd700;
          font-weight: 600;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 16px;
        }

        .stat-card {
          background: linear-gradient(135deg, #333333 0%, #404040 100%);
          border: 1px solid #daa520;
          border-radius: 8px;
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 215, 0, 0.1);
          position: relative;
        }

        .stat-card:hover {
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.5), 0 0 20px rgba(218, 165, 32, 0.3);
          transform: translateY(-3px);
          border-color: #ffd700;
        }

        .stat-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border-radius: 7px;
          background: linear-gradient(135deg, rgba(255, 215, 0, 0.05), rgba(218, 165, 32, 0.05));
          pointer-events: none;
        }

        .stat-icon {
          font-size: 24px;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          background: linear-gradient(135deg, #ffd700, #daa520);
          color: #000000;
          box-shadow: 0 2px 8px rgba(255, 215, 0, 0.3);
          position: relative;
          z-index: 1;
        }

        .stat-content .stat-number {
          font-size: 20px;
          font-weight: bold;
          color: #ffd700;
          margin-bottom: 2px;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }

        .stat-content .stat-label {
          font-size: 12px;
          color: #cccccc;
        }

        .empty-state {
          text-align: center;
          color: #666;
          padding: 20px;
          font-style: italic;
        }

        /* 首頁樣式 */
        .featured-singers-section h3,
        .upcoming-events-section h3 {
          margin: 0 0 20px 0;
          color: #ffd700;
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
        }

        .singers-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
          margin-bottom: 32px;
        }

        .featured-singer-card {
          background: linear-gradient(135deg, #2a2a2a 0%, #3d3d3d 100%);
          border: 1px solid #daa520;
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3), 0 0 20px rgba(218, 165, 32, 0.1);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .featured-singer-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4), 0 0 30px rgba(218, 165, 32, 0.3);
          border-color: #ffd700;
        }

        .featured-singer-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, #ffd700, transparent);
          opacity: 0.6;
        }

        .featured-singer-card .singer-avatar {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        }

        .featured-singer-card .avatar-emoji {
          font-size: 24px;
        }

        .featured-singer-card .singer-info {
          text-align: center;
        }

        .featured-singer-card .singer-name {
          margin: 0 0 8px 0;
          color: #ffd700;
          font-size: 18px;
          font-weight: 600;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
        }

        .featured-singer-card .singer-genres {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          justify-content: center;
          margin-bottom: 8px;
        }

        .featured-singer-card .genre-tag {
          background: linear-gradient(135deg, #daa520, #b8860b);
          color: #ffffff;
          padding: 2px 8px;
          border-radius: 10px;
          font-size: 11px;
          font-weight: 500;
        }

        .featured-singer-card .singer-stats {
          display: flex;
          justify-content: center;
          gap: 12px;
          margin-bottom: 8px;
          font-size: 12px;
          color: #cccccc;
        }

        .featured-singer-card .rating {
          color: #ffd700;
          font-weight: 600;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }

        .featured-singer-card .singer-description {
          margin: 0;
          color: #b8b8b8;
          font-size: 13px;
          line-height: 1.4;
        }

        .events-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .event-card {
          background: linear-gradient(135deg, #2a2a2a 0%, #3d3d3d 100%);
          border: 1px solid #daa520;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 215, 0, 0.1);
          display: flex;
          gap: 16px;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .event-card:hover {
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4), 0 0 30px rgba(218, 165, 32, 0.2);
          border-color: #ffd700;
          transform: translateY(-2px);
        }

        .event-card::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, #daa520, transparent);
          opacity: 0.4;
        }

        .event-date {
          background: linear-gradient(135deg, #ffd700, #daa520);
          color: #000000;
          padding: 12px;
          border-radius: 8px;
          text-align: center;
          min-width: 60px;
          flex-shrink: 0;
          font-weight: 600;
        }

        .event-date .date {
          font-size: 20px;
          font-weight: bold;
          line-height: 1;
        }

        .event-date .month {
          font-size: 12px;
          opacity: 0.9;
          margin-top: 2px;
        }

        .event-info {
          flex: 1;
        }

        .event-title {
          margin: 0 0 8px 0;
          color: #ffd700;
          font-size: 18px;
          font-weight: 600;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
        }

        .event-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 8px;
          font-size: 13px;
          color: #cccccc;
        }

        .event-description {
          margin: 0 0 8px 0;
          color: #b8b8b8;
          font-size: 14px;
          line-height: 1.5;
        }

        .event-participants {
          font-size: 12px;
          color: #daa520;
          font-weight: 500;
        }

        @media (max-width: 768px) {
          .singers-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }

          .event-card {
            flex-direction: column;
            text-align: center;
          }

          .event-date {
            align-self: center;
          }

          .event-meta {
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default HomepageWidget;