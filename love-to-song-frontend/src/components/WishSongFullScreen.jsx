import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuthV2';

const WishSongFullScreen = () => {
  const { user, hasAnyPermission } = useAuth();
  const [currentView, setCurrentView] = useState('wishList'); // wishList, submitWish
  const [selectedSinger, setSelectedSinger] = useState(null);
  const [wishForm, setWishForm] = useState({
    songTitle: '',
    artist: '',
    description: '',
    priority: 'normal'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // 模擬歌手數據
  const mockSingers = [
    {
      id: 1,
      name: '張小美',
      genre: ['流行', '抒情'],
      avatar: '👩‍🎤',
      color: '#ff6b9d',
      description: '溫柔嗓音，擅長抒情歌曲'
    },
    {
      id: 2,
      name: '李搖滾',
      genre: ['搖滾', '流行'],
      avatar: '🎸',
      color: '#4ecdc4',
      description: '搖滾魂，熱愛現場演出'
    },
    {
      id: 3,
      name: '王民謠',
      genre: ['民謠', '鄉村'],
      avatar: '🎻',
      color: '#45b7d1',
      description: '吉他詩人，原創民謠'
    },
    {
      id: 4,
      name: '陳爵士',
      genre: ['爵士', '藍調'],
      avatar: '🎺',
      color: '#f39c12',
      description: '爵士風格，即興演奏'
    }
  ];

  // 模擬願望歌數據
  const [mockWishSongs] = useState([
    {
      id: 1,
      songTitle: '夢中的婚禮',
      artist: 'Richard Clayderman',
      singer: '張小美',
      requestedBy: '小明',
      requestedAt: '2024-01-15 14:30',
      status: '已回應',
      priority: 'high',
      singerResponse: '這是一首很美的鋼琴曲，我會嘗試學習演唱版本！',
      responseAt: '2024-01-15 18:20'
    },
    {
      id: 2,
      songTitle: '千里之外',
      artist: '周杰倫',
      singer: '李搖滾',
      requestedBy: '小華',
      requestedAt: '2024-01-14 19:15',
      status: '考慮中',
      priority: 'normal',
      description: '希望能聽到搖滾版本的千里之外'
    },
    {
      id: 3,
      songTitle: '成都',
      artist: '趙雷',
      singer: '王民謠',
      requestedBy: '小美',
      requestedAt: '2024-01-13 16:45',
      status: '已回應',
      priority: 'normal',
      singerResponse: '這是我最愛的民謠之一，下次演出一定安排！',
      responseAt: '2024-01-13 20:10'
    },
    {
      id: 4,
      songTitle: 'Fly Me to the Moon',
      artist: 'Frank Sinatra',
      singer: '陳爵士',
      requestedBy: '大雄',
      requestedAt: '2024-01-12 21:00',
      status: '待回應',
      priority: 'high',
      description: '希望能聽到爵士版本，特別是薩克斯風的部分'
    }
  ]);

  // 判斷是否有願望歌權限
  const canSubmitWish = hasAnyPermission(['WISH_SONG_SUBMIT']);
  const canManageWish = hasAnyPermission(['WISH_SONG_MANAGEMENT']);

  // 過濾願望歌
  const filteredWishSongs = mockWishSongs.filter(wish => {
    const matchesSearch = 
      wish.songTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wish.artist.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wish.singer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wish.requestedBy.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'ALL' || wish.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  // 過濾歌手
  const filteredSingers = mockSingers.filter(singer =>
    singer.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmitWish = (e) => {
    e.preventDefault();
    
    if (!selectedSinger || !wishForm.songTitle.trim()) {
      alert('請選擇歌手並填寫歌曲名稱');
      return;
    }

    const newWish = {
      id: Date.now(),
      songTitle: wishForm.songTitle,
      artist: wishForm.artist || '未知',
      singer: selectedSinger.name,
      requestedBy: user.displayName,
      requestedAt: new Date().toLocaleString('zh-TW'),
      status: '待回應',
      priority: wishForm.priority,
      description: wishForm.description
    };

    // 願望歌提交
    
    // 重置表單
    setWishForm({
      songTitle: '',
      artist: '',
      description: '',
      priority: 'normal'
    });
    setSelectedSinger(null);
    setCurrentView('wishList');
    
    alert(`已成功提交願望歌：${wishForm.songTitle} 給 ${selectedSinger.name}`);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case '已回應': return '#10b981';
      case '考慮中': return '#f59e0b';
      case '待回應': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case '已回應': return '✅';
      case '考慮中': return '🤔';
      case '待回應': return '⏳';
      default: return '⏳';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high': return '🔥';
      case 'low': return '💙';
      default: return '⭐';
    }
  };

  return (
    <div className="wish-song-fullscreen">
      <div className="wish-header">
        <div className="header-info">
          <h2>⭐ 願望歌系統</h2>
          <p>向您喜愛的歌手許願想聽的歌曲</p>
        </div>
        
        <div className="header-actions">
          <button 
            className={`view-btn ${currentView === 'wishList' ? 'active' : ''}`}
            onClick={() => setCurrentView('wishList')}
          >
            📋 願望清單
          </button>
          {canSubmitWish && (
            <button 
              className={`view-btn ${currentView === 'submitWish' ? 'active' : ''}`}
              onClick={() => setCurrentView('submitWish')}
            >
              ⭐ 許願
            </button>
          )}
        </div>
      </div>

      {currentView === 'wishList' && (
        <div className="wish-list-view">
          <div className="list-controls">
            <div className="search-box">
              <input
                type="text"
                placeholder="搜尋願望歌..."
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
              <option value="已回應">已回應</option>
              <option value="考慮中">考慮中</option>
              <option value="待回應">待回應</option>
            </select>
          </div>

          <div className="wish-list">
            {filteredWishSongs.length === 0 ? (
              <div className="empty-wishes">
                <div className="empty-icon">🌟</div>
                <h3>還沒有願望歌</h3>
                <p>快去向喜愛的歌手許願吧！</p>
              </div>
            ) : (
              filteredWishSongs.map(wish => (
                <div key={wish.id} className="wish-item">
                  <div className="wish-status">
                    <span className="status-icon">{getStatusIcon(wish.status)}</span>
                    <span className="priority-icon">{getPriorityIcon(wish.priority)}</span>
                  </div>
                  
                  <div className="wish-content">
                    <div className="wish-main">
                      <h4 className="wish-song-title">{wish.songTitle}</h4>
                      <p className="wish-details">
                        原唱：{wish.artist} | 許願給：{wish.singer}
                      </p>
                      {wish.description && (
                        <p className="wish-description">{wish.description}</p>
                      )}
                    </div>
                    
                    <div className="wish-meta">
                      <div className="meta-row">
                        <span className="meta-label">許願人：</span>
                        <span className="meta-value">{wish.requestedBy}</span>
                      </div>
                      <div className="meta-row">
                        <span className="meta-label">許願時間：</span>
                        <span className="meta-value">{wish.requestedAt}</span>
                      </div>
                      {wish.singerResponse && (
                        <div className="singer-response">
                          <div className="response-header">歌手回應：</div>
                          <div className="response-content">{wish.singerResponse}</div>
                          <div className="response-time">回應時間：{wish.responseAt}</div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="wish-actions">
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(wish.status) }}
                    >
                      {wish.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {currentView === 'submitWish' && (
        <div className="submit-wish-view">
          <div className="submit-container">
            <div className="submit-header">
              <h3>🌟 許下您的願望歌</h3>
              <p>選擇一位歌手，告訴他您想聽的歌曲</p>
            </div>

            <form onSubmit={handleSubmitWish} className="wish-form">
              <div className="form-section">
                <label className="form-label">選擇歌手 *</label>
                <div className="singers-selection">
                  {mockSingers.map(singer => (
                    <div
                      key={singer.id}
                      className={`singer-option ${selectedSinger?.id === singer.id ? 'selected' : ''}`}
                      onClick={() => setSelectedSinger(singer)}
                    >
                      <div className="singer-avatar-small" style={{ backgroundColor: singer.color }}>
                        <span className="avatar-emoji">{singer.avatar}</span>
                      </div>
                      <div className="singer-info">
                        <div className="singer-name">{singer.name}</div>
                        <div className="singer-genres">
                          {singer.genre.join('、')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-section">
                <label className="form-label">歌曲名稱 *</label>
                <input
                  type="text"
                  value={wishForm.songTitle}
                  onChange={(e) => setWishForm({...wishForm, songTitle: e.target.value})}
                  placeholder="請輸入您想聽的歌曲名稱"
                  className="form-input"
                  required
                />
              </div>

              <div className="form-section">
                <label className="form-label">原唱歌手</label>
                <input
                  type="text"
                  value={wishForm.artist}
                  onChange={(e) => setWishForm({...wishForm, artist: e.target.value})}
                  placeholder="請輸入原唱歌手名稱（選填）"
                  className="form-input"
                />
              </div>

              <div className="form-section">
                <label className="form-label">優先級</label>
                <select
                  value={wishForm.priority}
                  onChange={(e) => setWishForm({...wishForm, priority: e.target.value})}
                  className="form-select"
                >
                  <option value="normal">⭐ 普通</option>
                  <option value="high">🔥 高優先級</option>
                  <option value="low">💙 低優先級</option>
                </select>
              </div>

              <div className="form-section">
                <label className="form-label">願望描述</label>
                <textarea
                  value={wishForm.description}
                  onChange={(e) => setWishForm({...wishForm, description: e.target.value})}
                  placeholder="告訴歌手您為什麼想聽這首歌，或是您的特殊要求（選填）"
                  className="form-textarea"
                  rows="4"
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="submit-btn">
                  🌟 提交願望
                </button>
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => setCurrentView('wishList')}
                >
                  取消
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx="true">{`
        .wish-song-fullscreen {
          height: 100%;
          display: flex;
          flex-direction: column;
          background: transparent;
          color: #ffffff;
        }

        .wish-header {
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

        .header-actions {
          display: flex;
          gap: 12px;
        }

        .view-btn {
          padding: 10px 20px;
          border: 2px solid rgba(255, 215, 0, 0.3);
          border-radius: 8px;
          background: rgba(255, 215, 0, 0.1);
          color: rgba(255, 215, 0, 0.8);
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          backdrop-filter: blur(10px);
        }

        .view-btn:hover {
          border-color: rgba(255, 215, 0, 0.6);
          color: #ffd700;
          background: rgba(255, 215, 0, 0.2);
        }

        .view-btn.active {
          background: linear-gradient(135deg, #ffd700 0%, #daa520 100%);
          color: #000000;
          border-color: #ffd700;
          font-weight: 600;
        }

        .wish-list-view {
          flex: 1;
          overflow-y: auto;
          padding: 32px;
        }

        .list-controls {
          display: flex;
          gap: 16px;
          margin-bottom: 24px;
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

        .wish-list {
          display: grid;
          gap: 16px;
        }

        .wish-item {
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

        .wish-item:hover {
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4), 0 0 25px rgba(218, 165, 32, 0.2);
          border-color: #ffd700;
          transform: translateY(-2px);
        }
        
        .wish-item::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, #daa520, transparent);
          opacity: 0.5;
        }

        .wish-status {
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
          align-items: center;
        }

        .status-icon, .priority-icon {
          font-size: 18px;
        }

        .wish-content {
          flex: 1;
        }

        .wish-main {
          margin-bottom: 12px;
        }

        .wish-song-title {
          margin: 0 0 4px 0;
          color: #ffd700;
          font-size: 18px;
          font-weight: 600;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
        }

        .wish-details {
          margin: 0 0 8px 0;
          color: #cccccc;
          font-size: 14px;
        }

        .wish-description {
          margin: 0;
          color: #ffffff;
          font-size: 14px;
          font-style: italic;
          background: linear-gradient(135deg, #3a3a3a 0%, #4d4d4d 100%);
          padding: 8px 12px;
          border-radius: 6px;
          border-left: 3px solid #daa520;
          border: 1px solid rgba(218, 165, 32, 0.3);
        }

        .wish-meta {
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

        .singer-response {
          margin-top: 12px;
          background: linear-gradient(135deg, #3a3a3a 0%, #4d4d4d 100%);
          padding: 12px;
          border-radius: 8px;
          border-left: 3px solid #daa520;
          border: 1px solid rgba(218, 165, 32, 0.3);
        }

        .response-header {
          font-weight: 600;
          color: #ffd700;
          margin-bottom: 4px;
          font-size: 13px;
        }

        .response-content {
          color: #ffffff;
          font-size: 14px;
          margin-bottom: 4px;
        }

        .response-time {
          font-size: 12px;
          color: #cccccc;
        }

        .wish-actions {
          flex-shrink: 0;
        }

        .status-badge {
          padding: 4px 12px;
          border-radius: 12px;
          color: white;
          font-size: 12px;
          font-weight: 600;
          text-align: center;
        }

        .empty-wishes {
          text-align: center;
          padding: 80px 20px;
          color: #cccccc;
        }

        .empty-icon {
          font-size: 64px;
          margin-bottom: 20px;
        }

        .empty-wishes h3 {
          margin: 0 0 8px 0;
          color: #ffd700;
          font-size: 20px;
          font-weight: 600;
        }

        .empty-wishes p {
          margin: 0;
          font-size: 16px;
        }

        .submit-wish-view {
          flex: 1;
          overflow-y: auto;
          padding: 32px;
          display: flex;
          justify-content: center;
        }

        .submit-container {
          max-width: 600px;
          width: 100%;
        }

        .submit-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .submit-header h3 {
          margin: 0 0 8px 0;
          color: #ffd700;
          font-size: 24px;
          font-weight: 700;
        }

        .submit-header p {
          margin: 0;
          color: #cccccc;
          font-size: 16px;
        }

        .wish-form {
          background: linear-gradient(135deg, #2a2a2a 0%, #3d3d3d 100%);
          padding: 32px;
          border-radius: 16px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
          border: 1px solid #daa520;
        }

        .form-section {
          margin-bottom: 24px;
        }

        .form-label {
          display: block;
          margin-bottom: 8px;
          color: #ffd700;
          font-weight: 600;
          font-size: 14px;
        }

        .singers-selection {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
        }

        .singer-option {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border: 2px solid rgba(218, 165, 32, 0.3);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          background: rgba(255, 215, 0, 0.05);
        }

        .singer-option:hover {
          border-color: rgba(218, 165, 32, 0.6);
          background: rgba(255, 215, 0, 0.1);
        }

        .singer-option.selected {
          border-color: #daa520;
          background: rgba(218, 165, 32, 0.2);
        }

        .singer-avatar-small {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          flex-shrink: 0;
        }

        .singer-option .singer-info {
          flex: 1;
        }

        .singer-option .singer-name {
          font-weight: 600;
          color: #ffd700;
          margin-bottom: 2px;
        }

        .singer-option .singer-genres {
          font-size: 12px;
          color: #cccccc;
        }

        .form-input, .form-select, .form-textarea {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid #daa520;
          border-radius: 8px;
          font-size: 14px;
          background: linear-gradient(135deg, #333333, #404040);
          color: #ffffff;
          transition: all 0.2s ease;
        }

        .form-input:focus, .form-select:focus, .form-textarea:focus {
          outline: none;
          border-color: #ffd700;
          box-shadow: 0 0 0 3px rgba(255, 215, 0, 0.2);
          background: linear-gradient(135deg, #404040, #4a4a4a);
        }
        
        .form-input::placeholder, .form-textarea::placeholder {
          color: #aaaaaa;
        }

        .form-textarea {
          resize: vertical;
          min-height: 100px;
        }

        .form-actions {
          display: flex;
          gap: 16px;
          justify-content: center;
          margin-top: 32px;
        }

        .submit-btn {
          background: linear-gradient(135deg, #daa520 0%, #b8860b 100%);
          color: white;
          border: 1px solid #daa520;
          padding: 12px 32px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(218, 165, 32, 0.3);
        }

        .submit-btn:hover {
          background: linear-gradient(135deg, #b8860b 0%, #9a7209 100%);
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(218, 165, 32, 0.4);
        }

        .cancel-btn {
          background: rgba(255, 215, 0, 0.1);
          color: #cccccc;
          border: 2px solid rgba(218, 165, 32, 0.3);
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .cancel-btn:hover {
          background: rgba(255, 215, 0, 0.2);
          border-color: rgba(218, 165, 32, 0.6);
        }

        @media (max-width: 768px) {
          .wish-header {
            flex-direction: column;
            gap: 16px;
            padding: 16px;
          }

          .list-controls {
            flex-direction: column;
            align-items: stretch;
          }

          .search-input {
            width: 100%;
          }

          .wish-list-view, .submit-wish-view {
            padding: 16px;
          }

          .wish-item {
            flex-direction: column;
          }

          .singers-selection {
            grid-template-columns: 1fr;
          }

          .wish-form {
            padding: 20px;
          }

          .form-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default WishSongFullScreen;