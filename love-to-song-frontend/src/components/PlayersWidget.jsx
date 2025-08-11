import React, { useState, useEffect } from 'react';
import api from '../services/api';

const PlayersWidget = () => {
  const [players, setPlayers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({ totalPlayers: 0, totalRequests: 0, activeToday: 0 });
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPlayer, setNewPlayer] = useState({
    playerId: '',
    name: '',
    nickname: '',
    gender: '',
    birthday: '',
    joinDate: '',
    note: ''
  });
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    fetchPlayers();
    fetchStats();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      handleSearch();
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  }, [searchQuery]);

  const fetchPlayers = async () => {
    try {
      const response = await api.get('/players');
      setPlayers(response.data);
    } catch (error) {
      console.error('Error fetching players:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/players/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      setIsSearching(true);
      const response = await api.get(`/players/search?q=${searchQuery}`);
      setSearchResults(response.data);
    } catch (error) {
      console.error('Error searching players:', error);
    }
  };

  const addPlayer = async (e) => {
    e.preventDefault();
    if (!newPlayer.playerId || !newPlayer.name) return;

    setLoading(true);
    try {
      const response = await api.post('/players', newPlayer);
      setPlayers([...players, response.data]);
      setNewPlayer({
        playerId: '',
        name: '',
        nickname: '',
        gender: '',
        birthday: '',
        joinDate: '',
        note: ''
      });
      setShowAddForm(false);
      fetchStats(); // Update stats
    } catch (error) {
      console.error('Error adding player:', error);
      alert(error.response?.data?.message || 'Failed to add player');
    }
    setLoading(false);
  };

  const deletePlayer = async (id) => {
    if (!window.confirm('確定要刪除這位玩家嗎？')) return;

    try {
      await api.delete(`/players/${id}`);
      setPlayers(players.filter(p => p.id !== id));
      fetchStats(); // Update stats
    } catch (error) {
      console.error('Error deleting player:', error);
      alert('刪除失敗');
    }
  };

  const incrementSongCount = async (id) => {
    try {
      const response = await api.post(`/players/${id}/increment-song-count`);
      setPlayers(players.map(p => p.id === id ? response.data : p));
    } catch (error) {
      console.error('Error incrementing song count:', error);
    }
  };

  const displayPlayers = isSearching && searchQuery.trim() ? searchResults : players;

  return (
    <div className="widget players-widget">
      <div className="widget-header">
        <h3>玩家管理</h3>
        <div className="player-stats">
          <span>總玩家: {stats.totalPlayers}</span>
          <span>總點歌: {stats.totalRequests}</span>
          <span>今日活躍: {stats.activeToday}</span>
        </div>
      </div>

      <div className="players-controls">
        <div className="search-section">
          <input
            type="text"
            placeholder="搜尋玩家 (編號/姓名/暱稱)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
        
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="add-button"
        >
          {showAddForm ? '取消' : '新增玩家'}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={addPlayer} className="add-player-form">
          <div className="form-row">
            <input
              type="text"
              placeholder="玩家編號 *"
              value={newPlayer.playerId}
              onChange={(e) => setNewPlayer({...newPlayer, playerId: e.target.value})}
              required
            />
            <input
              type="text"
              placeholder="姓名 *"
              value={newPlayer.name}
              onChange={(e) => setNewPlayer({...newPlayer, name: e.target.value})}
              required
            />
          </div>
          <div className="form-row">
            <input
              type="text"
              placeholder="暱稱"
              value={newPlayer.nickname}
              onChange={(e) => setNewPlayer({...newPlayer, nickname: e.target.value})}
            />
            <select
              value={newPlayer.gender}
              onChange={(e) => setNewPlayer({...newPlayer, gender: e.target.value})}
            >
              <option value="">選擇性別</option>
              <option value="M">男</option>
              <option value="F">女</option>
            </select>
          </div>
          <div className="form-row">
            <input
              type="date"
              placeholder="生日"
              value={newPlayer.birthday}
              onChange={(e) => setNewPlayer({...newPlayer, birthday: e.target.value})}
            />
            <input
              type="date"
              placeholder="加入日期"
              value={newPlayer.joinDate}
              onChange={(e) => setNewPlayer({...newPlayer, joinDate: e.target.value})}
            />
          </div>
          <div className="form-row">
            <textarea
              placeholder="備註"
              value={newPlayer.note}
              onChange={(e) => setNewPlayer({...newPlayer, note: e.target.value})}
              rows="2"
            />
          </div>
          <div className="form-actions">
            <button type="submit" disabled={loading}>
              {loading ? '新增中...' : '新增玩家'}
            </button>
          </div>
        </form>
      )}

      <div className="players-list">
        {isSearching && searchQuery.trim() && (
          <div className="search-info">
            搜尋結果: "{searchQuery}" ({searchResults.length} 位玩家)
          </div>
        )}
        
        {displayPlayers.length === 0 ? (
          <div className="empty-state">
            {isSearching && searchQuery.trim() ? '沒有找到符合的玩家' : '尚無玩家資料'}
          </div>
        ) : (
          <div className="players-grid">
            {displayPlayers.map(player => (
              <div key={player.id} className="player-card">
                <div className="player-header">
                  <div className="player-id">{player.playerId}</div>
                  <div className="player-actions">
                    <button 
                      onClick={() => incrementSongCount(player.id)}
                      className="song-count-btn"
                      title="增加點歌次數"
                    >
                      點歌 +1
                    </button>
                    <button 
                      onClick={() => deletePlayer(player.id)}
                      className="delete-btn"
                      title="刪除玩家"
                    >
                      ×
                    </button>
                  </div>
                </div>
                <div className="player-info">
                  <div className="player-name">
                    {player.name}
                    {player.nickname && <span className="nickname"> ({player.nickname})</span>}
                  </div>
                  <div className="player-details">
                    {player.gender && <span>性別: {player.gender === 'M' ? '男' : '女'}</span>}
                    <span>點歌次數: {player.songCount}</span>
                  </div>
                  {player.birthday && (
                    <div className="player-birthday">
                      生日: {new Date(player.birthday).toLocaleDateString('zh-TW')}
                    </div>
                  )}
                  {player.note && (
                    <div className="player-note">{player.note}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx="true">{`
        .players-widget {
          background: transparent;
          border-radius: 0;
          padding: 20px;
          box-shadow: none;
          border: none;
          height: 100%;
          display: flex;
          flex-direction: column;
          color: #ffffff;
        }

        .widget-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          border-bottom: 2px solid #daa520;
          padding-bottom: 10px;
        }

        .widget-header h3 {
          margin: 0;
          color: #ffd700;
          font-weight: 600;
        }

        .player-stats {
          display: flex;
          gap: 15px;
          font-size: 14px;
          color: #cccccc;
          font-weight: 500;
        }

        .players-controls {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
          align-items: center;
        }

        .search-section {
          flex: 1;
        }

        .search-input {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #daa520;
          border-radius: 4px;
          font-size: 14px;
          background: linear-gradient(135deg, #333333, #404040);
          color: #ffffff;
          transition: all 0.2s ease;
        }
        
        .search-input:focus {
          outline: none;
          border-color: #ffd700;
          box-shadow: 0 0 0 3px rgba(255, 215, 0, 0.2);
          background: linear-gradient(135deg, #404040, #4a4a4a);
        }
        
        .search-input::placeholder {
          color: #aaaaaa;
        }

        .add-button {
          padding: 8px 16px;
          background: linear-gradient(135deg, #daa520, #b8860b);
          color: white;
          border: 1px solid #daa520;
          border-radius: 4px;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s ease;
          font-weight: 600;
        }

        .add-button:hover {
          background: linear-gradient(135deg, #b8860b, #9a7209);
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(218, 165, 32, 0.3);
        }

        .add-player-form {
          background: linear-gradient(135deg, #2a2a2a 0%, #3d3d3d 100%);
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
          border: 1px solid #daa520;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 215, 0, 0.1);
        }

        .form-row {
          display: flex;
          gap: 10px;
          margin-bottom: 10px;
        }

        .form-row input, .form-row select, .form-row textarea {
          flex: 1;
          padding: 8px 12px;
          border: 1px solid #daa520;
          border-radius: 4px;
          font-size: 14px;
          background: linear-gradient(135deg, #333333, #404040);
          color: #ffffff;
          transition: all 0.2s ease;
        }
        
        .form-row input:focus, .form-row select:focus, .form-row textarea:focus {
          outline: none;
          border-color: #ffd700;
          box-shadow: 0 0 0 3px rgba(255, 215, 0, 0.2);
          background: linear-gradient(135deg, #404040, #4a4a4a);
        }
        
        .form-row input::placeholder, .form-row textarea::placeholder {
          color: #aaaaaa;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          margin-top: 15px;
        }

        .form-actions button {
          padding: 10px 20px;
          background: linear-gradient(135deg, #daa520, #b8860b);
          color: white;
          border: 1px solid #daa520;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-weight: 600;
        }

        .form-actions button:hover {
          background: linear-gradient(135deg, #b8860b, #9a7209);
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(218, 165, 32, 0.3);
        }

        .form-actions button:disabled {
          background: linear-gradient(135deg, #666666, #555555);
          cursor: not-allowed;
          border-color: #666666;
        }

        .search-info {
          background: linear-gradient(135deg, #404040 0%, #4a4a4a 100%);
          padding: 8px 12px;
          border-radius: 4px;
          margin-bottom: 15px;
          font-size: 14px;
          color: #ffd700;
          border: 1px solid rgba(218, 165, 32, 0.3);
          box-shadow: inset 0 1px 0 rgba(255, 215, 0, 0.1);
        }

        .players-list {
          flex: 1;
          overflow: auto;
        }

        .empty-state {
          text-align: center;
          color: #cccccc;
          padding: 40px 0;
          font-style: italic;
        }

        .players-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 15px;
        }

        .player-card {
          border: 1px solid #daa520;
          border-radius: 8px;
          padding: 15px;
          background: linear-gradient(135deg, #2a2a2a 0%, #3d3d3d 100%);
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 215, 0, 0.1);
          position: relative;
          overflow: hidden;
        }

        .player-card:hover {
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4), 0 0 25px rgba(218, 165, 32, 0.2);
          border-color: #ffd700;
          transform: translateY(-2px);
        }
        
        .player-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, #daa520, transparent);
          opacity: 0.5;
        }

        .player-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .player-id {
          font-weight: bold;
          color: #ffd700;
          font-size: 16px;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
        }

        .player-actions {
          display: flex;
          gap: 5px;
        }

        .song-count-btn {
          padding: 4px 8px;
          background: linear-gradient(135deg, #daa520, #b8860b);
          color: white;
          border: 1px solid #daa520;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          transition: all 0.2s ease;
          font-weight: 600;
        }

        .song-count-btn:hover {
          background: linear-gradient(135deg, #b8860b, #9a7209);
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(218, 165, 32, 0.3);
        }

        .delete-btn {
          padding: 4px 8px;
          background: linear-gradient(135deg, #dc3545, #c82333);
          color: white;
          border: 1px solid #dc3545;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          font-weight: bold;
          transition: all 0.2s ease;
        }

        .delete-btn:hover {
          background: linear-gradient(135deg, #c82333, #a71e2a);
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(220, 53, 69, 0.3);
        }

        .player-name {
          font-weight: bold;
          margin-bottom: 5px;
          color: #ffd700;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
        }

        .nickname {
          font-weight: normal;
          color: #cccccc;
        }

        .player-details {
          font-size: 14px;
          color: #cccccc;
          margin-bottom: 5px;
        }

        .player-details span {
          margin-right: 10px;
        }

        .player-birthday, .player-note {
          font-size: 13px;
          color: #aaaaaa;
          margin-top: 5px;
        }

        .player-note {
          font-style: italic;
          background: linear-gradient(135deg, #404040 0%, #4a4a4a 100%);
          padding: 5px 8px;
          border-radius: 4px;
          border: 1px solid rgba(218, 165, 32, 0.3);
          box-shadow: inset 0 1px 0 rgba(255, 215, 0, 0.1);
        }
      `}</style>
    </div>
  );
};

export default PlayersWidget;