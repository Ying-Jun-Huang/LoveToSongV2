import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuthV2';

const SongRequestFullScreen = () => {
  const { user, getPrimaryRole } = useAuth();
  const [currentStep, setCurrentStep] = useState('selectSinger'); // selectSinger, selectSong, confirmRequest
  const [selectedSinger, setSelectedSinger] = useState(null);
  const [selectedSong, setSelectedSong] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [songSearchTerm, setSongSearchTerm] = useState('');

  // 模擬歌手數據（與歌手列表相同）
  const mockSingers = [
    {
      id: 1,
      name: '張小美',
      genre: ['流行', '抒情'],
      avatar: '👩‍🎤',
      color: '#ff6b9d',
      songsCount: 45,
      description: '溫柔嗓音，擅長抒情歌曲',
      songs: [
        { id: 1, title: '告白氣球', artist: '周杰倫', difficulty: '簡單', duration: '3:33' },
        { id: 2, title: '小幸運', artist: '田馥甄', difficulty: '中等', duration: '4:28' },
        { id: 3, title: '體面', artist: '于文文', difficulty: '中等', duration: '3:47' },
        { id: 4, title: '後來', artist: '劉若英', difficulty: '簡單', duration: '4:38' },
        { id: 5, title: '匆匆那年', artist: '王菲', difficulty: '中等', duration: '3:56' }
      ]
    },
    {
      id: 2,
      name: '李搖滾',
      genre: ['搖滾', '流行'],
      avatar: '🎸',
      color: '#4ecdc4',
      songsCount: 38,
      description: '搖滾魂，熱愛現場演出',
      songs: [
        { id: 6, title: '倔強', artist: '五月天', difficulty: '中等', duration: '3:52' },
        { id: 7, title: '相信自己', artist: '五月天', difficulty: '困難', duration: '4:15' },
        { id: 8, title: '海闊天空', artist: 'Beyond', difficulty: '困難', duration: '5:23' },
        { id: 9, title: '光輝歲月', artist: 'Beyond', difficulty: '中等', duration: '4:10' },
        { id: 10, title: '真的愛你', artist: 'Beyond', difficulty: '中等', duration: '4:32' }
      ]
    },
    {
      id: 3,
      name: '王民謠',
      genre: ['民謠', '鄉村'],
      avatar: '🎻',
      color: '#45b7d1',
      songsCount: 52,
      description: '吉他詩人，原創民謠',
      songs: [
        { id: 11, title: '南山南', artist: '馬頔', difficulty: '困難', duration: '5:23' },
        { id: 12, title: '董小姐', artist: '宋冬野', difficulty: '中等', duration: '4:56' },
        { id: 13, title: '斑馬斑馬', artist: '宋冬野', difficulty: '中等', duration: '4:21' },
        { id: 14, title: '成都', artist: '趙雷', difficulty: '簡單', duration: '5:28' },
        { id: 15, title: '理想', artist: '趙雷', difficulty: '中等', duration: '4:43' }
      ]
    }
  ];

  // 過濾歌手
  const filteredSingers = mockSingers.filter(singer =>
    singer.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 過濾歌曲
  const filteredSongs = selectedSinger ? 
    selectedSinger.songs.filter(song =>
      song.title.toLowerCase().includes(songSearchTerm.toLowerCase()) ||
      song.artist.toLowerCase().includes(songSearchTerm.toLowerCase())
    ) : [];

  const handleSingerSelect = (singer) => {
    setSelectedSinger(singer);
    setCurrentStep('selectSong');
    setSongSearchTerm('');
  };

  const handleSongSelect = (song) => {
    setSelectedSong(song);
    setCurrentStep('confirmRequest');
  };

  const handleConfirmRequest = () => {
    // 這裡處理點歌請求
    // 處理點歌請求
    
    // 重置狀態
    setCurrentStep('selectSinger');
    setSelectedSinger(null);
    setSelectedSong(null);
    setSearchTerm('');
    setSongSearchTerm('');
    
    alert(`已成功點歌：${selectedSong.title} - ${selectedSinger.name}`);
  };

  const handleBackStep = () => {
    if (currentStep === 'selectSong') {
      setCurrentStep('selectSinger');
      setSelectedSinger(null);
    } else if (currentStep === 'confirmRequest') {
      setCurrentStep('selectSong');
      setSelectedSong(null);
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case '簡單': return '#10b981';
      case '中等': return '#f59e0b';
      case '困難': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const renderStepIndicator = () => (
    <div className="step-indicator">
      <div className={`step ${currentStep === 'selectSinger' ? 'active' : currentStep !== 'selectSinger' ? 'completed' : ''}`}>
        <span className="step-number">1</span>
        <span className="step-label">選擇歌手</span>
      </div>
      <div className="step-divider"></div>
      <div className={`step ${currentStep === 'selectSong' ? 'active' : currentStep === 'confirmRequest' ? 'completed' : ''}`}>
        <span className="step-number">2</span>
        <span className="step-label">選擇歌曲</span>
      </div>
      <div className="step-divider"></div>
      <div className={`step ${currentStep === 'confirmRequest' ? 'active' : ''}`}>
        <span className="step-number">3</span>
        <span className="step-label">確認點歌</span>
      </div>
    </div>
  );

  return (
    <div className="song-request-fullscreen">
      <div className="request-header">
        <div className="header-info">
          <h2>🎤 點歌系統</h2>
          <p>選擇您喜歡的歌手和歌曲</p>
        </div>
        {(currentStep !== 'selectSinger') && (
          <button className="back-button" onClick={handleBackStep}>
            ← 返回上一步
          </button>
        )}
      </div>

      {renderStepIndicator()}

      <div className="request-content">
        {currentStep === 'selectSinger' && (
          <div className="singer-selection">
            <div className="search-section">
              <input
                type="text"
                placeholder="搜尋歌手..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="singers-grid">
              {filteredSingers.map(singer => (
                <div
                  key={singer.id}
                  className="singer-card"
                  onClick={() => handleSingerSelect(singer)}
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
                  </div>
                  <div className="select-overlay">
                    <span>點擊選擇</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentStep === 'selectSong' && selectedSinger && (
          <div className="song-selection">
            <div className="selected-singer-info">
              <div className="singer-avatar-small" style={{ backgroundColor: selectedSinger.color }}>
                <span className="avatar-emoji">{selectedSinger.avatar}</span>
              </div>
              <div>
                <h3>{selectedSinger.name} 的歌曲</h3>
                <p>{selectedSinger.description}</p>
              </div>
            </div>

            <div className="search-section">
              <input
                type="text"
                placeholder="搜尋歌曲..."
                value={songSearchTerm}
                onChange={(e) => setSongSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="songs-list">
              {filteredSongs.map(song => (
                <div
                  key={song.id}
                  className="song-item"
                  onClick={() => handleSongSelect(song)}
                >
                  <div className="song-info">
                    <h4 className="song-title">{song.title}</h4>
                    <p className="song-artist">原唱：{song.artist}</p>
                  </div>
                  <div className="song-meta">
                    <span 
                      className="difficulty-tag"
                      style={{ backgroundColor: getDifficultyColor(song.difficulty) }}
                    >
                      {song.difficulty}
                    </span>
                    <span className="song-duration">{song.duration}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentStep === 'confirmRequest' && selectedSinger && selectedSong && (
          <div className="confirm-request">
            <div className="confirmation-card">
              <div className="confirm-header">
                <h3>確認點歌資訊</h3>
              </div>
              
              <div className="request-details">
                <div className="detail-row">
                  <span className="label">歌手：</span>
                  <span className="value">{selectedSinger.name}</span>
                </div>
                <div className="detail-row">
                  <span className="label">歌曲：</span>
                  <span className="value">{selectedSong.title}</span>
                </div>
                <div className="detail-row">
                  <span className="label">原唱：</span>
                  <span className="value">{selectedSong.artist}</span>
                </div>
                <div className="detail-row">
                  <span className="label">難度：</span>
                  <span 
                    className="value difficulty"
                    style={{ color: getDifficultyColor(selectedSong.difficulty) }}
                  >
                    {selectedSong.difficulty}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="label">時長：</span>
                  <span className="value">{selectedSong.duration}</span>
                </div>
                <div className="detail-row">
                  <span className="label">點歌人：</span>
                  <span className="value">{user.displayName}</span>
                </div>
              </div>

              <div className="confirm-actions">
                <button className="confirm-button" onClick={handleConfirmRequest}>
                  確認點歌
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx="true">{`
        .song-request-fullscreen {
          height: 100%;
          display: flex;
          flex-direction: column;
          background: #f8fafc;
        }

        .request-header {
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

        .back-button {
          background: #f1f5f9;
          color: #475569;
          border: 1px solid #e2e8f0;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .back-button:hover {
          background: #e2e8f0;
        }

        .step-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px 32px;
          background: white;
          border-bottom: 1px solid #e2e8f0;
        }

        .step {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          opacity: 0.5;
        }

        .step.active, .step.completed {
          opacity: 1;
        }

        .step-number {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #e2e8f0;
          color: #64748b;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
        }

        .step.active .step-number {
          background: #667eea;
          color: white;
        }

        .step.completed .step-number {
          background: #10b981;
          color: white;
        }

        .step-label {
          font-size: 12px;
          color: #64748b;
          font-weight: 500;
        }

        .step-divider {
          width: 60px;
          height: 2px;
          background: #e2e8f0;
          margin: 0 20px;
        }

        .request-content {
          flex: 1;
          overflow-y: auto;
          padding: 32px;
        }

        .search-section {
          margin-bottom: 24px;
        }

        .search-input {
          width: 100%;
          max-width: 400px;
          padding: 12px 16px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 14px;
          background: white;
          transition: all 0.2s ease;
        }

        .search-input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .singers-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 20px;
        }

        .singer-card {
          background: white;
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .singer-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
        }

        .singer-avatar {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 12px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
        }

        .avatar-emoji {
          font-size: 24px;
        }

        .singer-info {
          text-align: center;
        }

        .singer-name {
          margin: 0 0 8px 0;
          color: #1e293b;
          font-size: 18px;
          font-weight: 600;
        }

        .singer-genres {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          justify-content: center;
          margin-bottom: 8px;
        }

        .genre-tag {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          padding: 2px 8px;
          border-radius: 10px;
          font-size: 11px;
          font-weight: 500;
        }

        .singer-stats {
          color: #64748b;
          font-size: 14px;
        }

        .select-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.9), rgba(118, 75, 162, 0.9));
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.3s ease;
          font-weight: 600;
          font-size: 16px;
        }

        .singer-card:hover .select-overlay {
          opacity: 1;
        }

        .selected-singer-info {
          display: flex;
          align-items: center;
          gap: 16px;
          background: white;
          padding: 20px;
          border-radius: 12px;
          margin-bottom: 24px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .singer-avatar-small {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          flex-shrink: 0;
        }

        .selected-singer-info h3 {
          margin: 0 0 4px 0;
          color: #1e293b;
          font-size: 18px;
          font-weight: 600;
        }

        .selected-singer-info p {
          margin: 0;
          color: #64748b;
          font-size: 14px;
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
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .song-item:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
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

        .song-meta {
          display: flex;
          align-items: center;
          gap: 12px;
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

        .confirm-request {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 400px;
        }

        .confirmation-card {
          background: white;
          border-radius: 16px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
          max-width: 500px;
          width: 100%;
        }

        .confirm-header {
          padding: 24px 24px 0;
          text-align: center;
        }

        .confirm-header h3 {
          margin: 0;
          color: #1e293b;
          font-size: 20px;
          font-weight: 600;
        }

        .request-details {
          padding: 24px;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid #f1f5f9;
        }

        .detail-row:last-child {
          border-bottom: none;
        }

        .label {
          color: #64748b;
          font-weight: 500;
        }

        .value {
          color: #1e293b;
          font-weight: 600;
        }

        .value.difficulty {
          font-weight: 600;
        }

        .confirm-actions {
          padding: 0 24px 24px;
          text-align: center;
        }

        .confirm-button {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 12px 32px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }

        .confirm-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
        }

        @media (max-width: 768px) {
          .request-header {
            flex-direction: column;
            gap: 16px;
            padding: 16px;
          }

          .step-indicator {
            padding: 16px;
          }

          .step-divider {
            width: 30px;
            margin: 0 10px;
          }

          .request-content {
            padding: 16px;
          }

          .singers-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }

          .selected-singer-info {
            flex-direction: column;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
};

export default SongRequestFullScreen;