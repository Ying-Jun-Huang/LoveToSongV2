import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuthV2';
import api from '../services/api';
import websocketService from '../services/websocket-simple';

const SingerSongsWidget = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const singerId = searchParams.get('id');
  const singerName = searchParams.get('name');
  
  const [singer, setSinger] = useState(null);
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('title');
  const [requestingStates, setRequestingStates] = useState({}); // 追蹤每個按鈕的狀態

  useEffect(() => {
    if (singerId) {
      fetchSingerInfo();
      fetchSingerSongs();
    }
  }, [singerId]);

  const fetchSingerInfo = async () => {
    try {
      // 模擬獲取歌手詳細資訊
      const mockSingers = {
        1: {
          id: 1,
          name: '張小美',
          genre: ['流行', '抒情'],
          avatar: '👩‍🎤',
          color: '#ff6b9d',
          songsCount: 45,
          rating: 4.8,
          description: '溫柔嗓音，擅長抒情歌曲',
          biography: '張小美是一位才華洋溢的歌手，以她獨特的溫柔嗓音和深情的演唱風格聞名。她擅長將情感融入歌曲中，每一首歌都能觸動人心。',
          experience: '5年',
          specialty: '抒情歌曲、情歌對唱'
        },
        2: {
          id: 2,
          name: '李搖滾',
          genre: ['搖滾', '流行'],
          avatar: '🎸',
          color: '#4ecdc4',
          songsCount: 38,
          rating: 4.7,
          description: '搖滾魂，熱愛現場演出',
          biography: '李搖滾是一位充滿活力的搖滾歌手，他的演出總是充滿激情和能量。他不僅擅長演唱，也是一位出色的吉他手。',
          experience: '7年',
          specialty: '搖滾樂、現場演出、吉他演奏'
        },
        3: {
          id: 3,
          name: '王民謠',
          genre: ['民謠', '鄉村'],
          avatar: '🎻',
          color: '#45b7d1',
          songsCount: 52,
          rating: 4.9,
          description: '吉他詩人，原創民謠',
          biography: '王民謠是一位創作型歌手，他的歌曲充滿詩意和故事性。他擅長用簡單的旋律訴說深刻的情感。',
          experience: '8年',
          specialty: '民謠創作、吉他彈唱、原創歌曲'
        },
        4: {
          id: 4,
          name: '陳爵士',
          genre: ['爵士', '藍調'],
          avatar: '🎺',
          color: '#f39c12',
          songsCount: 29,
          rating: 4.6,
          description: '爵士風格，即興演奏',
          biography: '陳爵士是一位專業的爵士樂手，精通多種樂器。他的演奏風格自由奔放，充滿即興創意。',
          experience: '12年',
          specialty: '爵士樂、藍調、薩克斯風、即興演奏'
        },
        5: {
          id: 5,
          name: '林嘻哈',
          genre: ['嘻哈', 'R&B'],
          avatar: '🎤',
          color: '#9b59b6',
          songsCount: 33,
          rating: 4.5,
          description: '節奏感強，原創rapper',
          biography: '林嘻哈是新生代的嘻哈歌手，他的作品融合了東西方文化，節奏感強烈且富有創意。',
          experience: '6年',
          specialty: '嘻哈說唱、R&B、原創詞曲、節奏製作'
        },
        6: {
          id: 6,
          name: '黃古典',
          genre: ['古典', '器樂'],
          avatar: '🎹',
          color: '#e74c3c',
          songsCount: 41,
          rating: 4.8,
          description: '古典音樂，鋼琴演奏',
          biography: '黃古典是一位古典音樂演奏家，精通鋼琴和小提琴。她的演奏技巧精湛，情感表達深刻。',
          experience: '15年',
          specialty: '古典音樂、鋼琴演奏、室內樂、協奏曲'
        },
        7: {
          id: 7,
          name: '吳電音',
          genre: ['電音', 'EDM'],
          avatar: '🎧',
          color: '#1abc9c',
          songsCount: 27,
          rating: 4.4,
          description: '電子音樂製作人',
          biography: '吳電音是一位前衛的電子音樂製作人，他善於運用各種電子合成器創造出獨特的音樂世界。',
          experience: '9年',
          specialty: 'EDM製作、電子合成、音樂編程、混音工程'
        },
        8: {
          id: 8,
          name: '趙國語',
          genre: ['國語', '懷舊'],
          avatar: '🎙️',
          color: '#34495e',
          songsCount: 68,
          rating: 4.7,
          description: '經典國語歌曲演唱',
          biography: '趙國語是經典國語歌曲的傳承者，他的嗓音溫厚有力，擅長演唱各個年代的經典曲目。',
          experience: '20年',
          specialty: '經典國語歌曲、懷舊金曲、情歌對唱、舞台演出'
        }
      };
      
      setSinger(mockSingers[singerId] || null);
    } catch (error) {
      console.error('獲取歌手資訊失敗:', error);
    }
  };

  const fetchSingerSongs = async () => {
    try {
      setLoading(true);
      
      // 嘗試從後端獲取歌手歌曲
      try {
        const response = await api.get(`/singers/${singerId}/songs`);
        if (response.data && response.data.length > 0) {
          setSongs(response.data);
          return;
        }
      } catch (apiError) {
        console.warn('無法從後端獲取歌曲，使用模擬數據:', apiError);
      }
      
      // 如果後端沒有數據，使用模擬數據（使用真實的歌曲ID）
      const mockSongsBySinger = {
        1: [
          { id: 5, title: '愛你', originalArtist: '王心凌', category: '流行', difficulty: '中等', duration: '4:12' },
          { id: 6, title: '小幸運', originalArtist: '田馥甄', category: '流行', difficulty: '中等', duration: '4:28' },
          { id: 7, title: '演員', originalArtist: '薛之謙', category: '抒情', difficulty: '困難', duration: '4:20' },
          { id: 8, title: '告白氣球', originalArtist: '周杰倫', category: '流行', difficulty: '簡單', duration: '3:52' },
        ],
        3: [
          { id: 5, title: '愛你', originalArtist: '王心凌', category: '流行', difficulty: '中等', duration: '4:12' },
          { id: 6, title: '小幸運', originalArtist: '田馥甄', category: '流行', difficulty: '中等', duration: '4:28' },
          { id: 7, title: '演員', originalArtist: '薛之謙', category: '抒情', difficulty: '困難', duration: '4:20' },
        ],
        2: [
          { id: 5, title: '愛你', originalArtist: '王心凌', category: '流行', difficulty: '中等', duration: '4:12' },
          { id: 6, title: '小幸運', originalArtist: '田馥甄', category: '流行', difficulty: '中等', duration: '4:28' },
        ]
      };

      const singerSongs = mockSongsBySinger[singerId] || [];
      
      // 模擬API延遲
      await new Promise(resolve => setTimeout(resolve, 600));
      
      setSongs(singerSongs);
    } catch (error) {
      console.error('獲取歌手歌單失敗:', error);
      setSongs([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredSongs = songs.filter(song => {
    const matchesSearch = song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (song.originalArtist || song.artist || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || song.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    if (sortBy === 'title') return a.title.localeCompare(b.title);
    if (sortBy === 'category') return a.category.localeCompare(b.category);
    if (sortBy === 'difficulty') {
      const difficultyOrder = { '簡單': 1, '中等': 2, '困難': 3 };
      return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
    }
    return 0;
  });

  const categories = [...new Set(songs.map(song => song.category))];

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case '簡單': return '#4caf50';
      case '中等': return '#ff9800';
      case '困難': return '#f44336';
      default: return '#9e9e9e';
    }
  };

  // 檢查用戶是否可以點歌
  const canRequestSong = () => {
    if (!user) return false;
    if (user.roles.includes('GUEST')) return false;
    return true;
  };

  // 處理點歌請求
  const handleSongRequest = async (song) => {
    if (!canRequestSong()) {
      alert('您沒有權限點歌，請先登入');
      return;
    }

    // 設置該按鈕為載入狀態
    setRequestingStates(prev => ({ ...prev, [song.id]: true }));

    try {
      const requestData = {
        eventId: 1, // 預設活動ID
        userId: user.id,
        singerId: parseInt(singerId), // 使用當前歌手ID
        songId: song.id,
        notes: `透過歌手頁面點歌 - ${song.title}`
      };

      console.log('發送點歌請求:', requestData);
      const response = await api.post('/song-requests', requestData);
      console.log('點歌成功:', response.data);
      
      alert(`點歌成功！\n歌曲：${song.title}\n演唱者：${singer.name}\n已加入排隊隊列`);
      
    } catch (error) {
      console.error('點歌失敗:', error);
      const errorMessage = error.response?.data?.message || '點歌失敗，請稍後重試';
      alert(`點歌失敗：${errorMessage}`);
    } finally {
      // 移除載入狀態
      setRequestingStates(prev => ({ ...prev, [song.id]: false }));
    }
  };

  if (!singer) {
    return (
      <div className="singer-songs-widget">
        <div className="error-state">
          <h2>找不到歌手資訊</h2>
          <p>請檢查歌手ID是否正確</p>
          <button onClick={() => navigate('/')} className="back-btn">
            返回首頁
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="singer-songs-widget">
      {/* 歌手資訊頭部 */}
      <div className="singer-header">
        <button onClick={() => navigate(-1)} className="back-button">
          ← 返回
        </button>
        <div className="singer-profile">
          <div className="singer-avatar-large" style={{ backgroundColor: singer.color }}>
            <span className="avatar-emoji">{singer.avatar}</span>
          </div>
          <div className="singer-details">
            <h1 className="singer-name">{singer.name}</h1>
            <div className="singer-genres">
              {singer.genre.map((genre, index) => (
                <span key={index} className="genre-tag">{genre}</span>
              ))}
            </div>
            <div className="singer-stats">
              <div className="stat">
                <span className="stat-label">評分</span>
                <span className="stat-value">⭐ {singer.rating}</span>
              </div>
              <div className="stat">
                <span className="stat-label">歌曲數量</span>
                <span className="stat-value">{singer.songsCount} 首</span>
              </div>
              <div className="stat">
                <span className="stat-label">經驗</span>
                <span className="stat-value">{singer.experience}</span>
              </div>
            </div>
            <p className="singer-biography">{singer.biography}</p>
            <div className="singer-specialty">
              <strong>擅長領域：</strong>{singer.specialty}
            </div>
          </div>
        </div>
      </div>

      {/* 搜尋和篩選控制 */}
      <div className="controls-section">
        <div className="search-controls">
          <input
            type="text"
            placeholder="搜尋歌曲..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <select 
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="category-filter"
          >
            <option key="all-categories" value="">所有分類</option>
            {categories.map((category, index) => (
              <option key={`category-${index}-${category}`} value={category}>{category}</option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option key="sort-title" value="title">按標題排序</option>
            <option key="sort-category" value="category">按分類排序</option>
            <option key="sort-difficulty" value="difficulty">按難度排序</option>
          </select>
        </div>
        <div className="results-info">
          顯示 {filteredSongs.length} / {songs.length} 首歌曲
        </div>
      </div>

      {/* 歌曲列表 */}
      <div className="songs-section">
        <h3>歌曲列表</h3>
        {loading ? (
          <div className="loading-state">載入中...</div>
        ) : filteredSongs.length === 0 ? (
          <div className="empty-state">
            {searchQuery || selectedCategory ? '沒有符合條件的歌曲' : '暫無歌曲'}
          </div>
        ) : (
          <div className="songs-grid">
            {filteredSongs.map(song => (
              <div key={song.id} className="song-card">
                <div className="song-info">
                  <h4 className="song-title">{song.title}</h4>
                  <p className="song-artist">{song.originalArtist || song.artist}</p>
                  <div className="song-meta">
                    <span className="song-category">{song.category}</span>
                    <span 
                      className="song-difficulty"
                      style={{ color: getDifficultyColor(song.difficulty) }}
                    >
                      {song.difficulty}
                    </span>
                    <span className="song-duration">{song.duration}</span>
                  </div>
                </div>
                <div className="song-actions">
                  <button 
                    className="request-btn" 
                    title="點歌"
                    disabled={requestingStates[song.id] || !canRequestSong()}
                    onClick={() => handleSongRequest(song)}
                  >
                    {requestingStates[song.id] ? '⏳ 點歌中...' : '🎤 點歌'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx="true">{`
        .singer-songs-widget {
          padding: 20px;
          background: transparent;
          color: #ffffff;
          min-height: 100vh;
        }

        .singer-header {
          margin-bottom: 30px;
        }

        .back-button {
          padding: 8px 16px;
          background: linear-gradient(135deg, #daa520, #b8860b);
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          margin-bottom: 20px;
          transition: all 0.2s ease;
        }

        .back-button:hover {
          background: linear-gradient(135deg, #b8860b, #9a7209);
          transform: translateY(-1px);
        }

        .singer-profile {
          display: flex;
          gap: 30px;
          align-items: flex-start;
          background: linear-gradient(135deg, #2a2a2a 0%, #3d3d3d 100%);
          border: 1px solid #daa520;
          border-radius: 16px;
          padding: 30px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        .singer-avatar-large {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        }

        .singer-avatar-large .avatar-emoji {
          font-size: 48px;
        }

        .singer-details {
          flex: 1;
        }

        .singer-name {
          margin: 0 0 15px 0;
          color: #ffd700;
          font-size: 2.5rem;
          font-weight: 600;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
        }

        .singer-genres {
          display: flex;
          gap: 8px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }

        .genre-tag {
          background: linear-gradient(135deg, #daa520, #b8860b);
          color: white;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 500;
        }

        .singer-stats {
          display: flex;
          gap: 30px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }

        .stat {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .stat-label {
          font-size: 12px;
          color: #cccccc;
          text-transform: uppercase;
        }

        .stat-value {
          font-size: 16px;
          font-weight: 600;
          color: #ffd700;
        }

        .singer-biography {
          margin: 0 0 15px 0;
          color: #cccccc;
          line-height: 1.6;
          font-size: 15px;
        }

        .singer-specialty {
          color: #b8b8b8;
          font-size: 14px;
        }

        .controls-section {
          margin-bottom: 30px;
          background: linear-gradient(135deg, #2a2a2a 0%, #3d3d3d 100%);
          border: 1px solid #daa520;
          border-radius: 8px;
          padding: 20px;
        }

        .search-controls {
          display: flex;
          gap: 15px;
          margin-bottom: 15px;
          flex-wrap: wrap;
        }

        .search-input,
        .category-filter,
        .sort-select {
          padding: 8px 12px;
          border: 1px solid #daa520;
          border-radius: 4px;
          background: linear-gradient(135deg, #333333, #404040);
          color: #ffffff;
          font-size: 14px;
        }

        .search-input {
          flex: 2;
          min-width: 200px;
        }

        .category-filter,
        .sort-select {
          flex: 1;
          min-width: 120px;
        }

        .search-input:focus,
        .category-filter:focus,
        .sort-select:focus {
          outline: none;
          border-color: #ffd700;
          box-shadow: 0 0 0 2px rgba(255, 215, 0, 0.2);
        }

        .results-info {
          color: #ffd700;
          font-size: 14px;
          font-weight: 500;
        }

        .songs-section h3 {
          margin: 0 0 20px 0;
          color: #ffd700;
          font-size: 1.5rem;
          font-weight: 600;
        }

        .loading-state,
        .empty-state {
          text-align: center;
          color: #cccccc;
          padding: 40px 0;
          font-style: italic;
        }

        .songs-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 20px;
        }

        .song-card {
          background: linear-gradient(135deg, #2a2a2a 0%, #3d3d3d 100%);
          border: 1px solid #daa520;
          border-radius: 8px;
          padding: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        .song-card:hover {
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4), 0 0 25px rgba(218, 165, 32, 0.2);
          border-color: #ffd700;
          transform: translateY(-2px);
        }

        .song-info {
          flex: 1;
        }

        .song-title {
          margin: 0 0 8px 0;
          color: #ffd700;
          font-size: 18px;
          font-weight: 600;
        }

        .song-artist {
          margin: 0 0 10px 0;
          color: #cccccc;
          font-size: 14px;
        }

        .song-meta {
          display: flex;
          gap: 12px;
          font-size: 12px;
          flex-wrap: wrap;
        }

        .song-category {
          background: linear-gradient(135deg, #666666, #555555);
          color: white;
          padding: 2px 6px;
          border-radius: 10px;
        }

        .song-difficulty {
          font-weight: 600;
        }

        .song-duration {
          color: #aaaaaa;
        }

        .song-actions {
          margin-left: 15px;
        }

        .request-btn {
          padding: 8px 16px;
          background: linear-gradient(135deg, #4caf50, #45a049);
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
          transition: all 0.2s ease;
        }

        .request-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #45a049, #3d8b40);
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(76, 175, 80, 0.3);
        }

        .request-btn:disabled {
          background: linear-gradient(135deg, #666666, #555555);
          cursor: not-allowed;
          opacity: 0.6;
        }

        .error-state {
          text-align: center;
          padding: 60px 20px;
          color: #cccccc;
        }

        .error-state h2 {
          color: #ffd700;
          margin-bottom: 15px;
        }

        .back-btn {
          margin-top: 20px;
          padding: 10px 20px;
          background: linear-gradient(135deg, #daa520, #b8860b);
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 600;
        }

        @media (max-width: 768px) {
          .singer-profile {
            flex-direction: column;
            text-align: center;
            gap: 20px;
          }

          .singer-stats {
            justify-content: center;
          }

          .search-controls {
            flex-direction: column;
          }

          .search-input,
          .category-filter,
          .sort-select {
            width: 100%;
          }

          .songs-grid {
            grid-template-columns: 1fr;
          }

          .song-card {
            flex-direction: column;
            text-align: center;
            gap: 15px;
          }

          .song-actions {
            margin-left: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default SingerSongsWidget;