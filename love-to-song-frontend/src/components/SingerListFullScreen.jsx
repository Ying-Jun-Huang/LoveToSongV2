import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SingerListFullScreen = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGenre, setFilterGenre] = useState('ALL');

  // 模擬歌手數據
  const mockSingers = [
    {
      id: 1,
      name: '張小美',
      genre: ['流行', '抒情'],
      avatar: '👩‍🎤',
      color: '#ff6b9d',
      songsCount: 45,
      description: '溫柔嗓音，擅長抒情歌曲',
      status: 'active'
    },
    {
      id: 2,
      name: '李搖滾',
      genre: ['搖滾', '流行'],
      avatar: '🎸',
      color: '#4ecdc4',
      songsCount: 38,
      description: '搖滾魂，熱愛現場演出',
      status: 'active'
    },
    {
      id: 3,
      name: '王民謠',
      genre: ['民謠', '鄉村'],
      avatar: '🎻',
      color: '#45b7d1',
      songsCount: 52,
      description: '吉他詩人，原創民謠',
      status: 'active'
    },
    {
      id: 4,
      name: '陳爵士',
      genre: ['爵士', '藍調'],
      avatar: '🎺',
      color: '#f39c12',
      songsCount: 29,
      description: '爵士風格，即興演奏',
      status: 'active'
    },
    {
      id: 5,
      name: '林嘻哈',
      genre: ['嘻哈', 'R&B'],
      avatar: '🎤',
      color: '#9b59b6',
      songsCount: 33,
      description: '節奏感強，原創rapper',
      status: 'active'
    },
    {
      id: 6,
      name: '黃古典',
      genre: ['古典', '器樂'],
      avatar: '🎹',
      color: '#e74c3c',
      songsCount: 41,
      description: '古典音樂，鋼琴演奏',
      status: 'active'
    },
    {
      id: 7,
      name: '吳電音',
      genre: ['電音', 'EDM'],
      avatar: '🎧',
      color: '#1abc9c',
      songsCount: 27,
      description: '電子音樂製作人',
      status: 'active'
    },
    {
      id: 8,
      name: '趙國語',
      genre: ['國語', '懷舊'],
      avatar: '🎙️',
      color: '#34495e',
      songsCount: 68,
      description: '經典國語歌曲演唱',
      status: 'active'
    }
  ];

  // 取得所有曲風類型
  const allGenres = [...new Set(mockSingers.flatMap(singer => singer.genre))];

  // 過濾歌手
  const filteredSingers = mockSingers.filter(singer => {
    const matchesSearch = singer.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGenre = filterGenre === 'ALL' || singer.genre.includes(filterGenre);
    return matchesSearch && matchesGenre;
  });

  const handleSingerClick = (singer) => {
    // 跳轉到獨立的歌手歌單頁面，與首頁保持一致
    navigate(`/singer-songs?id=${singer.id}&name=${encodeURIComponent(singer.name)}`);
  };

  return (
    <div className="singer-list-fullscreen">
      <div className="list-header">
        <div className="header-info">
          <h2>🎤 歌手列表</h2>
          <p>選擇您要查看的歌手資訊</p>
        </div>
        
        <div className="header-controls">
          <div className="search-box">
            <input
              type="text"
              placeholder="搜尋歌手..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          <select
            value={filterGenre}
            onChange={(e) => setFilterGenre(e.target.value)}
            className="genre-filter"
          >
            <option value="ALL">所有曲風</option>
            {allGenres.map(genre => (
              <option key={genre} value={genre}>{genre}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="singers-grid">
        {filteredSingers.map(singer => (
          <div
            key={singer.id}
            className="singer-card"
            onClick={() => handleSingerClick(singer)}
          >
            <div className="singer-avatar" style={{ backgroundColor: singer.color }}>
              <span className="avatar-emoji">{singer.avatar}</span>
            </div>
            
            <div className="singer-info">
              <h3 className="singer-name">{singer.name}</h3>
              <div className="singer-genres">
                {singer.genre.map((genre, index) => (
                  <span key={index} className="genre-tag">
                    {genre}
                  </span>
                ))}
              </div>
              <div className="singer-stats">
                <span className="songs-count">📀 {singer.songsCount} 首歌</span>
              </div>
              <p className="singer-description">{singer.description}</p>
            </div>
            
            <div className="card-hover-overlay">
              <span>點擊查看詳細資訊</span>
            </div>
          </div>
        ))}
      </div>

      {filteredSingers.length === 0 && (
        <div className="no-results">
          <div className="no-results-content">
            <div className="no-results-icon">🔍</div>
            <h3>找不到歌手</h3>
            <p>請嘗試其他搜尋條件</p>
          </div>
        </div>
      )}

      <style jsx="true">{`
        .singer-list-fullscreen {
          height: 100%;
          display: flex;
          flex-direction: column;
          background: transparent;
          color: #ffffff;
        }

        .list-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px 32px;
          background: linear-gradient(135deg, #2a2a2a 0%, #3d3d3d 100%);
          border: 1px solid #daa520;
          border-bottom: 2px solid #daa520;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          flex-shrink: 0;
          border-radius: 8px 8px 0 0;
          margin-bottom: 20px;
        }

        .header-info h2 {
          margin: 0 0 4px 0;
          color: #ffd700;
          font-size: 24px;
          font-weight: 700;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
        }

        .header-info p {
          margin: 0;
          color: #cccccc;
          font-size: 14px;
        }

        .header-controls {
          display: flex;
          gap: 16px;
          align-items: center;
        }

        .search-input, .genre-filter {
          padding: 10px 16px;
          border: 1px solid #daa520;
          border-radius: 8px;
          font-size: 14px;
          background: linear-gradient(135deg, #333333, #404040);
          color: #ffffff;
          transition: all 0.2s ease;
        }

        .search-input:focus, .genre-filter:focus {
          outline: none;
          border-color: #ffd700;
          box-shadow: 0 0 0 3px rgba(255, 215, 0, 0.2);
          background: linear-gradient(135deg, #404040, #4a4a4a);
        }

        .search-input::placeholder {
          color: #aaaaaa;
        }

        .search-input {
          width: 250px;
        }

        .singers-grid {
          flex: 1;
          padding: 32px;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 24px;
          overflow-y: auto;
        }

        .singer-card {
          background: linear-gradient(135deg, #2a2a2a 0%, #3d3d3d 100%);
          border: 1px solid #daa520;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3), 0 0 20px rgba(218, 165, 32, 0.1);
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .singer-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, #ffd700, transparent);
          opacity: 0.6;
        }

        .singer-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4), 0 0 30px rgba(218, 165, 32, 0.3);
          border-color: #ffd700;
        }

        .singer-avatar {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
        }

        .avatar-emoji {
          font-size: 32px;
        }

        .singer-info {
          text-align: center;
        }

        .singer-name {
          margin: 0 0 12px 0;
          color: #ffd700;
          font-size: 20px;
          font-weight: 700;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
        }

        .singer-genres {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          justify-content: center;
          margin-bottom: 12px;
        }

        .genre-tag {
          background: linear-gradient(135deg, #daa520, #b8860b);
          color: white;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
        }

        .singer-stats {
          margin-bottom: 12px;
          color: #cccccc;
          font-size: 14px;
        }

        .singer-description {
          margin: 0;
          color: #b8b8b8;
          font-size: 14px;
          line-height: 1.5;
        }

        .card-hover-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(218, 165, 32, 0.9), rgba(184, 134, 11, 0.9));
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.3s ease;
          font-weight: 600;
          font-size: 16px;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
        }

        .singer-card:hover .card-hover-overlay {
          opacity: 1;
        }

        .no-results {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .no-results-content {
          text-align: center;
          color: #cccccc;
        }

        .no-results-icon {
          font-size: 64px;
          margin-bottom: 16px;
          opacity: 0.7;
        }

        .no-results-content h3 {
          margin: 0 0 8px 0;
          color: #ffd700;
          font-size: 20px;
          font-weight: 600;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
        }

        .no-results-content p {
          margin: 0;
          font-size: 16px;
          color: #b8b8b8;
        }

        @media (max-width: 768px) {
          .list-header {
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

          .singers-grid {
            padding: 16px;
            grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
            gap: 16px;
          }

          .singer-card {
            padding: 20px;
          }

          .singer-avatar {
            width: 60px;
            height: 60px;
          }

          .avatar-emoji {
            font-size: 24px;
          }

          .singer-name {
            font-size: 18px;
          }
        }
      `}</style>
    </div>
  );
};

export default SingerListFullScreen;