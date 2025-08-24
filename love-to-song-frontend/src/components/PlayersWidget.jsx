import React, { useState, useEffect } from 'react';
import api from '../services/api';
import AdvancedSearchFilter from './AdvancedSearchFilter';
import { useAuth } from '../hooks/useAuthV2';

const PlayersWidget = () => {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  
  const [players, setPlayers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({ totalPlayers: 0, totalRequests: 0, activeToday: 0 });
  const [advancedFilters, setAdvancedFilters] = useState({});
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
  const [forceUpdate, setForceUpdate] = useState(0); // 強制重新渲染用
  const [dataLoaded, setDataLoaded] = useState(false); // 標記數據是否已加載

  useEffect(() => {
    // 等待認證加載完成
    if (authLoading) {
        return;
    }
    
    if (!user) {
      return;
    }
    
    // 只在首次加載時獲取數據，避免重複加載導致刪除操作被覆蓋
    if (!dataLoaded) {
      // 檢查用戶是否為真正的認證用戶（非訪客）
      if (user.roles && !user.roles.includes('GUEST')) {
        try {
          fetchPlayers();
          fetchStats();
          setDataLoaded(true);
        } catch (error) {
          console.error('Error in data fetch:', error);
        }
      } else {
        // 為訪客用戶或未認證用戶設置默認數據
        setPlayers([]);
        setStats({ totalPlayers: 0, totalRequests: 0, activeToday: 0 });
        setDataLoaded(true);
      }
    }
  }, [user, authLoading, dataLoaded]);

  useEffect(() => {
    if (Object.keys(advancedFilters).length === 0) {
      if (searchQuery.trim()) {
        handleSearch();
      } else {
        setSearchResults([]);
        setIsSearching(false);
      }
    }
  }, [searchQuery, advancedFilters]);

  // 調試用 - 監控 players 狀態變化
  useEffect(() => {
    console.log('Players state changed. Current count:', players.length);
    console.log('Current players:', players.map(p => ({ id: p.id, name: p.name })));
  }, [players]);

  const fetchPlayers = async () => {
    try {
      setLoading(true);
      
      // 暫時使用 mock 數據，直到後端服務穩定
      const baseMockPlayers = [
        {
          id: 1,
          playerId: 'P001',
          name: '王小明',
          nickname: '小明',
          gender: 'M',
          birthday: '1990-05-15',
          joinDate: '2024-01-15',
          songCount: 15,
          note: '愛好抒情歌曲',
          createdAt: new Date().toISOString()
        },
        {
          id: 2,
          playerId: 'P002',
          name: '李小華',
          nickname: '華華',
          gender: 'F',
          birthday: '1992-08-20',
          joinDate: '2024-02-01',
          songCount: 8,
          note: '喜歡流行音樂',
          createdAt: new Date().toISOString()
        },
        {
          id: 3,
          playerId: 'P003',
          name: '張大偉',
          nickname: '大偉',
          gender: 'M',
          birthday: '1988-12-10',
          joinDate: '2024-01-20',
          songCount: 22,
          note: '常點英文歌',
          createdAt: new Date().toISOString()
        },
        {
          id: 4,
          playerId: 'P004',
          name: '陳美麗',
          nickname: '美麗',
          gender: 'F',
          birthday: '1995-03-25',
          joinDate: '2024-03-01',
          songCount: 12,
          note: '喜歡日韓歌曲',
          createdAt: new Date().toISOString()
        }
      ];
      
      // 從 localStorage 獲取已保存的玩家數據（包含用戶的修改）
      const savedPlayers = localStorage.getItem('mockPlayers');
      const mockPlayers = savedPlayers ? JSON.parse(savedPlayers) : baseMockPlayers;
      
      // 如果沒有保存的數據，則保存基礎數據到 localStorage
      if (!savedPlayers) {
        localStorage.setItem('mockPlayers', JSON.stringify(baseMockPlayers));
      }
      
      // 模擬 API 延遲
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setPlayers(mockPlayers);
      
    } catch (error) {
      console.error('Error fetching players:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // 暫時使用 mock 數據，直到後端服務穩定
      const mockStats = {
        totalPlayers: 4,
        totalRequests: 57,
        activeToday: 2
      };
      
      // 模擬 API 延遲
      await new Promise(resolve => setTimeout(resolve, 200));
      
      setStats(mockStats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      setIsSearching(true);
      
      // 暫時使用 mock 數據進行搜尋，直到後端服務穩定
      const mockSearchResults = players.filter(player => 
        player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        player.nickname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        player.playerId.toLowerCase().includes(searchQuery.toLowerCase())
      );
      
      // 模擬 API 延遲
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setSearchResults(mockSearchResults);
    } catch (error) {
      console.error('Error searching players:', error);
    }
  };

  const addPlayer = async (e) => {
    e.preventDefault();
    if (!newPlayer.playerId || !newPlayer.name) return;

    setLoading(true);
    try {
      // 暫時使用 mock 新增玩家，直到後端服務穩定
      await new Promise(resolve => setTimeout(resolve, 400)); // 模擬 API 延遲
      
      // 創建新玩家對象
      const newPlayerData = {
        id: Date.now(), // 使用時間戳作為臨時ID
        playerId: newPlayer.playerId,
        name: newPlayer.name,
        nickname: newPlayer.nickname || '',
        gender: newPlayer.gender || '',
        birthday: newPlayer.birthday || '',
        joinDate: newPlayer.joinDate || new Date().toISOString().split('T')[0],
        songCount: 0, // 新玩家初始點歌次數為0
        note: newPlayer.note || '',
        createdAt: new Date().toISOString()
      };
      
      // 更新玩家列表
      const updatedPlayersWithNew = [...players, newPlayerData];
      setPlayers(updatedPlayersWithNew);
      
      // 保存到 localStorage 以便重新整理後保持狀態
      localStorage.setItem('mockPlayers', JSON.stringify(updatedPlayersWithNew));
      
      // 重置表單
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
      
      // 更新統計數據
      const newStats = {
        totalPlayers: players.length + 1,
        totalRequests: stats.totalRequests,
        activeToday: stats.activeToday
      };
      setStats(newStats);
      
      alert('玩家新增成功！');
    } catch (error) {
      console.error('Error adding player:', error);
      alert('新增玩家失敗');
    }
    setLoading(false);
  };

  const deletePlayer = async (id) => {
    if (!window.confirm('確定要刪除這位玩家嗎？')) return;

    console.log('Deleting player with ID:', id);
    console.log('Current players before delete:', players.length);
    console.log('Is searching:', isSearching, 'Search query:', searchQuery);
    console.log('Current search results:', searchResults.length);

    try {
      // 暫時使用 mock 刪除，直到後端服務穩定
      await new Promise(resolve => setTimeout(resolve, 300)); // 模擬 API 延遲
      
      // 使用函數式更新來確保獲取最新狀態
      setPlayers(prevPlayers => {
        console.log('Previous players count:', prevPlayers.length);
        const updatedPlayers = prevPlayers.filter(p => p.id !== id);
        console.log('Updated players count after filter:', updatedPlayers.length);
        
        // 保存到 localStorage 以便重新整理後保持狀態
        localStorage.setItem('mockPlayers', JSON.stringify(updatedPlayers));
        
        // 更新統計數據
        setStats(prevStats => ({
          totalPlayers: updatedPlayers.length,
          totalRequests: Math.max(0, prevStats.totalRequests - Math.floor(Math.random() * 10)), // 模擬數據減少
          activeToday: Math.max(0, prevStats.activeToday - (Math.random() > 0.5 ? 1 : 0))
        }));
        
        return updatedPlayers;
      });
      
      // 如果正在搜索，也需要更新搜索結果
      if (isSearching && searchQuery.trim()) {
        setSearchResults(prevSearchResults => {
          console.log('Previous search results count:', prevSearchResults.length);
          const updatedSearchResults = prevSearchResults.filter(p => p.id !== id);
          console.log('Updated search results count after filter:', updatedSearchResults.length);
          return updatedSearchResults;
        });
      }
      
      // 強制重新渲染
      setForceUpdate(prev => prev + 1);
      
      alert('玩家刪除成功');
    } catch (error) {
      console.error('Error deleting player:', error);
      alert('刪除失敗');
    }
  };

  const incrementSongCount = async (id) => {
    try {
      // 暫時使用 mock 增加點歌次數，直到後端服務穩定
      await new Promise(resolve => setTimeout(resolve, 200)); // 模擬 API 延遲
      
      // 使用函數式更新來確保獲取最新狀態
      setPlayers(prevPlayers => {
        const updatedPlayers = prevPlayers.map(player => {
          if (player.id === id) {
            return {
              ...player,
              songCount: player.songCount + 1
            };
          }
          return player;
        });
        
        // 保存到 localStorage 以便重新整理後保持狀態
        localStorage.setItem('mockPlayers', JSON.stringify(updatedPlayers));
        
        // 如果正在搜索，也需要更新搜索結果
        if (isSearching && searchQuery.trim()) {
          setSearchResults(prevSearchResults => 
            prevSearchResults.map(player => {
              if (player.id === id) {
                return {
                  ...player,
                  songCount: player.songCount + 1
                };
              }
              return player;
            })
          );
        }
        
        return updatedPlayers;
      });
      
      // 更新總點歌統計
      setStats(prevStats => ({
        ...prevStats,
        totalRequests: prevStats.totalRequests + 1
      }));
      
      alert('點歌次數已增加！');
    } catch (error) {
      console.error('Error incrementing song count:', error);
      alert('增加點歌次數失敗');
    }
  };

  // 處理進階搜尋
  const handleAdvancedSearch = (filters) => {
    setAdvancedFilters(filters);
    
    // 清除基本搜尋條件，避免衝突
    setSearchQuery('');
    setSearchResults([]);
    setIsSearching(false);
  };

  // 重置搜尋條件
  const handleResetSearch = () => {
    setAdvancedFilters({});
    setSearchQuery('');
    setSearchResults([]);
    setIsSearching(false);
  };

  // 應用進階篩選
  const applyAdvancedFilters = (playersList) => {
    let filtered = [...playersList];
    
    if (advancedFilters.keyword) {
      filtered = filtered.filter(player => 
        player.name.toLowerCase().includes(advancedFilters.keyword.toLowerCase()) ||
        (player.nickname && player.nickname.toLowerCase().includes(advancedFilters.keyword.toLowerCase())) ||
        player.playerId.toLowerCase().includes(advancedFilters.keyword.toLowerCase())
      );
    }
    
    if (advancedFilters.role) {
      // 這裡可以根據用戶角色進行篩選
      filtered = filtered.filter(player => player.role === advancedFilters.role);
    }
    
    if (advancedFilters.status) {
      // 根據用戶狀態篩選
      filtered = filtered.filter(player => player.status === advancedFilters.status);
    }
    
    // Date range filter
    if (advancedFilters.dateRange) {
      if (advancedFilters.dateRange.startDate) {
        const startDate = new Date(advancedFilters.dateRange.startDate);
        filtered = filtered.filter(player => new Date(player.joinDate || player.createdAt) >= startDate);
      }
      if (advancedFilters.dateRange.endDate) {
        const endDate = new Date(advancedFilters.dateRange.endDate);
        filtered = filtered.filter(player => new Date(player.joinDate || player.createdAt) <= endDate);
      }
    }
    
    // Advanced sorting
    if (advancedFilters.sortBy) {
      filtered.sort((a, b) => {
        const order = advancedFilters.sortOrder === 'asc' ? 1 : -1;
        
        if (advancedFilters.sortBy === 'displayName') {
          return a.name.localeCompare(b.name) * order;
        } else if (advancedFilters.sortBy === 'email') {
          return (a.email || '').localeCompare(b.email || '') * order;
        } else if (advancedFilters.sortBy === 'createdAt') {
          return (new Date(a.createdAt || a.joinDate) - new Date(b.createdAt || b.joinDate)) * order;
        } else if (advancedFilters.sortBy === 'updatedAt') {
          return (new Date(a.updatedAt) - new Date(b.updatedAt)) * order;
        }
        return 0;
      });
    }
    
    return filtered;
  };

  // 決定要顯示的玩家列表
  const getDisplayPlayers = () => {
    if (Object.keys(advancedFilters).length > 0) {
      return applyAdvancedFilters(players);
    } else if (isSearching && searchQuery.trim()) {
      return searchResults;
    } else {
      return players;
    }
  };

  const displayPlayers = getDisplayPlayers();

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
        {/* Advanced Search Filter */}
        <AdvancedSearchFilter
          entityType="users"
          onSearch={handleAdvancedSearch}
          onReset={handleResetSearch}
          initialFilters={{}}
          className="advanced-search-section"
        />
        
        {/* Basic Search Controls (show only when not using advanced search) */}
        {Object.keys(advancedFilters).length === 0 && (
          <div className="basic-search-controls">
            <div className="search-section">
              <input
                type="text"
                placeholder="搜尋玩家 (編號/姓名/暱稱)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>
          </div>
        )}
        
        <div className="header-actions">
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="add-button"
          >
            {showAddForm ? '取消' : '新增玩家'}
          </button>
        </div>
        
        {/* Active Filters Display */}
        {Object.keys(advancedFilters).length > 0 && (
          <div className="active-filters">
            <span className="filters-label">已啟用進階篩選:</span>
            {advancedFilters.keyword && (
              <span className="filter-chip">關鍵字: {advancedFilters.keyword}</span>
            )}
            {advancedFilters.role && (
              <span className="filter-chip">角色: {advancedFilters.role}</span>
            )}
            {advancedFilters.status && (
              <span className="filter-chip">狀態: {advancedFilters.status}</span>
            )}
            {advancedFilters.sortBy && (
              <span className="filter-chip">排序: {advancedFilters.sortBy}</span>
            )}
            <button onClick={handleResetSearch} className="clear-filters-btn">
              清除篩選
            </button>
          </div>
        )}
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
        {(isSearching && searchQuery.trim()) && (
          <div className="search-info">
            搜尋結果: "{searchQuery}" ({searchResults.length} 位玩家)
          </div>
        )}
        
        {Object.keys(advancedFilters).length > 0 && (
          <div className="search-info">
            進階篩選結果: ({displayPlayers.length} 位玩家)
          </div>
        )}
        
        {displayPlayers.length === 0 ? (
          <div className="empty-state">
            {Object.keys(advancedFilters).length > 0 ? '沒有符合篩選條件的玩家' : 
             isSearching && searchQuery.trim() ? '沒有找到符合的玩家' : '尚無玩家資料'}
          </div>
        ) : (
          <div className="players-grid">
            {displayPlayers.map(player => (
              <div key={`player-widget-${player.id}`} className="player-card">
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
          margin-bottom: 20px;
        }
        
        .advanced-search-section {
          margin-bottom: 16px;
        }
        
        .basic-search-controls {
          display: flex;
          gap: 10px;
          align-items: center;
          margin-bottom: 12px;
        }

        .search-section {
          flex: 1;
        }
        
        .header-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          margin-bottom: 12px;
        }
        
        .active-filters {
          padding: 12px;
          background: rgba(218, 165, 32, 0.1);
          border-radius: 8px;
          border: 1px solid rgba(218, 165, 32, 0.3);
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px;
        }
        
        .filters-label {
          color: #ffd700;
          font-weight: 600;
          font-size: 14px;
        }
        
        .filter-chip {
          background: linear-gradient(135deg, #daa520, #b8860b);
          color: white;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
        }
        
        .clear-filters-btn {
          background: rgba(220, 53, 69, 0.2);
          border: 1px solid #dc3545;
          color: #dc3545;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .clear-filters-btn:hover {
          background: #dc3545;
          color: white;
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