import React, { useState, useEffect } from 'react';
import api from '../services/api';
import AdvancedSearchFilter from './AdvancedSearchFilter';
import BatchOperations from './BatchOperations';

const SongListWidget = (props) => {
  const [songs, setSongs] = useState([]);
  const [filteredSongs, setFilteredSongs] = useState([]);
  const [newSong, setNewSong] = useState({ title: '', artist: '', category: '' });
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('title');
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({});
  const [selectedSongs, setSelectedSongs] = useState([]);
  const [showBatchOperations, setShowBatchOperations] = useState(false);
  const [categories, setCategories] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [categoryMode, setCategoryMode] = useState('existing'); // 'existing' or 'new'
  const [customCategory, setCustomCategory] = useState('');

  // Fetch songs on component mount
  useEffect(() => {
    fetchSongs();
  }, []);

  // Filter and sort songs when search/filter criteria change
  useEffect(() => {
    let filtered = [...songs];
    
    // Apply advanced filters if available
    if (Object.keys(advancedFilters).length > 0) {
      // Advanced search filters
      if (advancedFilters.keyword) {
        filtered = filtered.filter(song => 
          song.title.toLowerCase().includes(advancedFilters.keyword.toLowerCase()) ||
          (song.artist && song.artist.toLowerCase().includes(advancedFilters.keyword.toLowerCase()))
        );
      }
      
      if (advancedFilters.language) {
        filtered = filtered.filter(song => song.language === advancedFilters.language);
      }
      
      if (advancedFilters.genre) {
        filtered = filtered.filter(song => song.genre === advancedFilters.genre);
      }
      
      if (advancedFilters.era) {
        filtered = filtered.filter(song => song.era === advancedFilters.era);
      }
      
      if (advancedFilters.isActive !== undefined && advancedFilters.isActive !== '') {
        const isActive = advancedFilters.isActive === 'true';
        filtered = filtered.filter(song => song.isActive === isActive);
      }
      
      // Date range filter
      if (advancedFilters.dateRange) {
        if (advancedFilters.dateRange.startDate) {
          const startDate = new Date(advancedFilters.dateRange.startDate);
          filtered = filtered.filter(song => new Date(song.createdAt) >= startDate);
        }
        if (advancedFilters.dateRange.endDate) {
          const endDate = new Date(advancedFilters.dateRange.endDate);
          filtered = filtered.filter(song => new Date(song.createdAt) <= endDate);
        }
      }
      
      // Advanced sorting
      if (advancedFilters.sortBy) {
        filtered.sort((a, b) => {
          const order = advancedFilters.sortOrder === 'asc' ? 1 : -1;
          
          if (advancedFilters.sortBy === 'title') {
            return a.title.localeCompare(b.title) * order;
          } else if (advancedFilters.sortBy === 'createdAt') {
            return (new Date(a.createdAt) - new Date(b.createdAt)) * order;
          } else if (advancedFilters.sortBy === 'updatedAt') {
            return (new Date(a.updatedAt) - new Date(b.updatedAt)) * order;
          } else if (advancedFilters.sortBy === 'requestCount') {
            return ((a.requestCount || 0) - (b.requestCount || 0)) * order;
          }
          return 0;
        });
      }
    } else {
      // Apply basic search filter
      if (searchQuery.trim()) {
        filtered = filtered.filter(song => 
          song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (song.artist && song.artist.toLowerCase().includes(searchQuery.toLowerCase()))
        );
      }
      
      // Apply category filter
      if (selectedCategory) {
        filtered = filtered.filter(song => song.category === selectedCategory);
      }
      
      // Apply basic sorting
      filtered.sort((a, b) => {
        if (sortBy === 'title') {
          return a.title.localeCompare(b.title);
        } else if (sortBy === 'artist') {
          return (a.artist || '').localeCompare(b.artist || '');
        } else if (sortBy === 'date') {
          return new Date(b.createdAt) - new Date(a.createdAt);
        }
        return 0;
      });
    }
    
    setFilteredSongs(filtered);
  }, [songs, searchQuery, selectedCategory, sortBy, advancedFilters]);

  const fetchSongs = async () => {
    try {
      setLoading(true);
      let songCategories = [];
      
      // 檢查是否有認證令牌
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('[SONGS] No auth token, using mock data');
        // 使用 mock 數據
        const mockSongs = [
          {
            id: 1,
            uniqueId: '1-singer1',
            title: '今天你要嫁給我',
            artist: '陶喆/蔡依林',
            singer: '歌神張學友',
            singerId: 1,
            category: '國語',
            difficulty: '已學會',
            learned: true,
            timesRequested: 5,
            createdAt: new Date().toISOString()
          },
          {
            id: 2,
            uniqueId: '2-singer2',
            title: '月亮代表我的心',
            artist: '鄧麗君',
            singer: '鄧麗君',
            singerId: 2,
            category: '經典',
            difficulty: '已學會',
            learned: true,
            timesRequested: 12,
            createdAt: new Date().toISOString()
          },
          {
            id: 3,
            uniqueId: '3-singer3',
            title: '海闊天空',
            artist: 'Beyond',
            singer: 'Beyond主唱',
            singerId: 3,
            category: '搖滾',
            difficulty: '學習中',
            learned: false,
            timesRequested: 3,
            createdAt: new Date().toISOString()
          }
        ];
        setSongs(mockSongs);
        
        songCategories = [...new Set(
          mockSongs
            .map(song => song.category)
            .filter(cat => cat && cat.trim() !== '')
        )];
      } else {
        try {
          // 從後端獲取歌手會唱的歌曲
          const response = await api.get('/songs');
          const songsData = response.data || [];
          
          // 轉換資料格式以符合前端需求
          const transformedSongs = songsData.map((song, index) => ({
            id: song.id,
            uniqueId: `${song.id}-${song.singer?.id || index}`, // 歌曲ID + 歌手ID的組合
            title: song.title,
            artist: song.originalArtist,
            singer: song.singer?.stageName || song.singer?.displayName || '未知歌手',
            singerId: song.singer?.id,
            category: song.language || '未分類',
            difficulty: song.learned ? '已學會' : '學習中',
            learned: song.learned,
            timesRequested: song.timesRequested || 0,
            notes: song.notes,
            createdAt: song.createdAt
          }));
          
          setSongs(transformedSongs);
          
          // Extract unique categories from actual data
          songCategories = [...new Set(
            transformedSongs
              .map(song => song.category)
              .filter(cat => cat && cat.trim() !== '')
          )];
        } catch (apiError) {
          console.error('[SONGS] API error, falling back to mock data:', apiError);
          // API失敗時使用mock數據
          const mockSongs = [
            {
              id: 1,
              uniqueId: '1-fallback',
              title: '今天你要嫁給我',
              artist: '陶喆/蔡依林',
              singer: '歌神張學友',
              singerId: 1,
              category: '國語',
              difficulty: '已學會',
              learned: true,
              timesRequested: 5,
              createdAt: new Date().toISOString()
            }
          ];
          setSongs(mockSongs);
          
          songCategories = ['國語'];
        }
      }
      
      // 預設分類
      const predefinedCategories = ['流行', '抒情', '搖滾', '民謠', '爵士', '藍調', '鄉村', '古典', 'R&B', '電子', '雷鬼', '金屬'];
      
      // 合併並排序分類
      const allCategories = [...new Set([...predefinedCategories, ...songCategories])].sort();
      setCategories(allCategories);
      
    } catch (error) {
      console.error('Failed to fetch songs:', error);
    } finally {
      setLoading(false);
    }
  };

  const addSong = async (e) => {
    e.preventDefault();
    if (!newSong.title.trim()) return;

    try {
      // 決定要使用的分類
      const finalCategory = categoryMode === 'new' ? customCategory.trim() : newSong.category;
      
      const songData = {
        title: newSong.title,
        artist: newSong.artist,
        category: finalCategory
      };

      const response = await api.post('/songs', songData);
      setSongs([...songs, response.data]);
      
      // 重置表單
      setNewSong({ title: '', artist: '', category: '' });
      setCustomCategory('');
      setCategoryMode('existing');
      setShowAddForm(false);
      
      // Update categories if new category was added
      if (finalCategory && !categories.includes(finalCategory)) {
        const updatedCategories = [...categories, finalCategory].sort();
        setCategories(updatedCategories);
      }
    } catch (error) {
      console.error('Failed to add song:', error);
      alert('Failed to add song');
    }
  };
  
  const deleteSong = async (song) => {
    if (!window.confirm(`確定要刪除 ${song.singer} 會唱的「${song.title}」嗎？`)) return;
    
    try {
      // Use the new API to remove singer's ability to sing this song
      if (song.singerId) {
        await api.delete(`/songs/${song.id}/singer/${song.singerId}`);
        // Remove from frontend list using uniqueId
        setSongs(songs.filter(s => s.uniqueId !== song.uniqueId));
      } else {
        // Fallback to old API for mock data
        await api.delete(`/songs/${song.id}`);
        setSongs(songs.filter(s => s.uniqueId !== song.uniqueId));
      }
    } catch (error) {
      console.error('Failed to delete song:', error);
      alert('刪除歌曲失敗，請稍後再試');
    }
  };

  // 處理進階搜尋
  const handleAdvancedSearch = (filters) => {
    setAdvancedFilters(filters);
    setShowAdvancedSearch(false);
    
    // 清除基本搜尋條件，避免衝突
    setSearchQuery('');
    setSelectedCategory('');
    setSortBy('title');
  };

  // 重置搜尋條件
  const handleResetSearch = () => {
    setAdvancedFilters({});
    setSearchQuery('');
    setSelectedCategory('');
    setSortBy('title');
  };

  // 處理歌曲選擇
  const handleSongSelect = (songId, isSelected) => {
    if (isSelected) {
      setSelectedSongs(prev => [...prev, songId]);
    } else {
      setSelectedSongs(prev => prev.filter(id => id !== songId));
    }
  };

  // 全選歌曲
  const handleSelectAllSongs = () => {
    const allSongIds = filteredSongs.map(song => song.id);
    setSelectedSongs(allSongIds);
  };

  // 清除選擇
  const handleSelectNoneSongs = () => {
    setSelectedSongs([]);
  };

  // 處理批量操作
  const handleBatchAction = async ({ actionId, items }) => {
    setLoading(true);
    try {
      switch (actionId) {
        case 'delete':
          for (const songId of items) {
            await api.delete(`/songs/${songId}`);
          }
          setSongs(prevSongs => prevSongs.filter(song => !items.includes(song.id)));
          alert(`成功刪除 ${items.length} 首歌曲`);
          break;
          
        case 'export':
          const songsToExport = songs.filter(song => items.includes(song.id));
          const csvContent = convertToCSV(songsToExport);
          downloadCSV(csvContent, 'songs_export.csv');
          alert(`成功導出 ${items.length} 首歌曲`);
          break;
          
        case 'activate':
          for (const songId of items) {
            await api.patch(`/songs/${songId}`, { isActive: true });
          }
          setSongs(prevSongs => prevSongs.map(song => 
            items.includes(song.id) ? { ...song, isActive: true } : song
          ));
          alert(`成功啟用 ${items.length} 首歌曲`);
          break;
          
        case 'deactivate':
          for (const songId of items) {
            await api.patch(`/songs/${songId}`, { isActive: false });
          }
          setSongs(prevSongs => prevSongs.map(song => 
            items.includes(song.id) ? { ...song, isActive: false } : song
          ));
          alert(`成功停用 ${items.length} 首歌曲`);
          break;
          
        default:
          // 未知的批量操作
      }
      
      setSelectedSongs([]);
    } catch (error) {
      console.error('批量操作失敗:', error);
      alert('批量操作失敗，請稍後重試');
    } finally {
      setLoading(false);
    }
  };

  // 轉換為CSV格式
  const convertToCSV = (data) => {
    const headers = ['標題', '歌手', '分類', '建立時間'];
    const csvRows = [headers.join(',')];
    
    data.forEach(song => {
      const row = [
        `"${song.title}"`,
        `"${song.artist || ''}"`,
        `"${song.category || ''}"`,
        `"${new Date(song.createdAt).toLocaleDateString('zh-TW')}"`
      ];
      csvRows.push(row.join(','));
    });
    
    return csvRows.join('\n');
  };

  // 下載CSV文件
  const downloadCSV = (csvContent, filename) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 批量操作可用功能
  const batchActions = ['delete', 'export', 'activate', 'deactivate'];

  return (
    <div className="song-list-widget">
      <div className="widget-header">
        <h3>歌曲庫 ({filteredSongs.length}/{songs.length})</h3>
        <div className="header-actions">
          <button 
            onClick={() => setShowBatchOperations(!showBatchOperations)}
            className={`batch-toggle-btn ${showBatchOperations ? 'active' : ''}`}
          >
            {showBatchOperations ? '🔒 退出批量模式' : '☑️ 批量操作'}
          </button>
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="add-song-btn"
          >
            {showAddForm ? '取消' : '新增歌曲'}
          </button>
        </div>
      </div>
      
      {/* Search and Filter Controls */}
      <div className="song-controls">
        {/* Advanced Search Filter */}
        <AdvancedSearchFilter
          entityType="songs"
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
                placeholder="搜尋歌曲標題或歌手..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>
            
            <div className="filter-section">
              <select 
                value={selectedCategory} 
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="category-filter"
              >
                <option value="">所有分類</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="sort-select"
              >
                <option value="title">按標題排序</option>
                <option value="artist">按歌手排序</option>
                <option value="date">按日期排序</option>
              </select>
            </div>
          </div>
        )}
        
        {/* Active Filters Display */}
        {Object.keys(advancedFilters).length > 0 && (
          <div className="active-filters">
            <span className="filters-label">已啟用進階篩選:</span>
            {advancedFilters.keyword && (
              <span className="filter-chip">關鍵字: {advancedFilters.keyword}</span>
            )}
            {advancedFilters.language && (
              <span className="filter-chip">語言: {advancedFilters.language}</span>
            )}
            {advancedFilters.genre && (
              <span className="filter-chip">曲風: {advancedFilters.genre}</span>
            )}
            {advancedFilters.era && (
              <span className="filter-chip">年代: {advancedFilters.era}</span>
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

      {/* Batch Operations */}
      {showBatchOperations && (
        <BatchOperations
          entityType="songs"
          selectedItems={selectedSongs}
          onBatchAction={handleBatchAction}
          onSelectAll={handleSelectAllSongs}
          onSelectNone={handleSelectNoneSongs}
          availableActions={batchActions}
          loading={loading}
          className="songs-batch-operations"
        />
      )}

      {/* Add new song form */}
      {showAddForm && (
        <form onSubmit={addSong} className="add-song-form">
          <div className="form-row">
            <input
              type="text"
              placeholder="歌曲標題 *"
              value={newSong.title}
              onChange={(e) => setNewSong({ ...newSong, title: e.target.value })}
              required
            />
            <input
              type="text"
              placeholder="歌手"
              value={newSong.artist}
              onChange={(e) => setNewSong({ ...newSong, artist: e.target.value })}
            />
          </div>
          <div className="form-row">
            <div className="category-section">
              <div className="category-mode-selector">
                <label className="radio-option">
                  <input
                    type="radio"
                    value="existing"
                    checked={categoryMode === 'existing'}
                    onChange={(e) => setCategoryMode(e.target.value)}
                  />
                  選擇現有分類
                </label>
                <label className="radio-option">
                  <input
                    type="radio"
                    value="new"
                    checked={categoryMode === 'new'}
                    onChange={(e) => setCategoryMode(e.target.value)}
                  />
                  創建新分類
                </label>
              </div>
              
              {categoryMode === 'existing' ? (
                <select
                  value={newSong.category}
                  onChange={(e) => setNewSong({ ...newSong, category: e.target.value })}
                  className="category-select"
                >
                  <option value="">請選擇分類</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  placeholder="輸入新分類名稱"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="category-input"
                />
              )}
            </div>
          </div>
          <div className="form-actions">
            <button type="submit">新增歌曲</button>
          </div>
        </form>
      )}

      {/* Songs list */}
      <div className="songs-list">
        {loading ? (
          <div className="loading">載入中...</div>
        ) : (
          <>
            {songs.length === 0 ? (
              <div className="empty-state">尚無歌曲資料，請新增第一首歌曲！</div>
            ) : filteredSongs.length === 0 ? (
              <div className="empty-state">沒有符合條件的歌曲</div>
            ) : (
              <div className="songs-grid">
                {filteredSongs.map((song, index) => (
                  <div key={`song-list-${song.id}-${index}`} className={`song-card ${showBatchOperations ? 'batch-mode' : ''}`}>
                    {showBatchOperations && (
                      <div className="song-checkbox">
                        <input
                          type="checkbox"
                          checked={selectedSongs.includes(song.uniqueId || song.id)}
                          onChange={(e) => handleSongSelect(song.uniqueId || song.id, e.target.checked)}
                          className="batch-checkbox"
                        />
                      </div>
                    )}
                    <div className="song-info">
                      <div className="song-title">{song.title}</div>
                      {song.artist && <div className="song-artist">{song.artist}</div>}
                      {song.category && <div className="song-category">{song.category}</div>}
                      <div className="song-date">
                        {new Date(song.createdAt).toLocaleDateString('zh-TW')}
                      </div>
                      {song.isActive !== undefined && (
                        <div className={`song-status ${song.isActive ? 'active' : 'inactive'}`}>
                          {song.isActive ? '啟用' : '停用'}
                        </div>
                      )}
                    </div>
                    <div className="song-actions">
                      {!showBatchOperations && (
                        <button 
                          onClick={() => deleteSong(song)}
                          className="delete-btn"
                          title="刪除歌曲"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
      
      <style jsx="true">{`
        .song-list-widget {
          background: transparent;
          border-radius: 0;
          padding: 20px;
          box-shadow: none;
          border: none;
          height: 100%;
          display: flex;
          flex-direction: column;
          overflow: hidden;
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
        
        .header-actions {
          display: flex;
          gap: 12px;
          align-items: center;
        }
        
        .batch-toggle-btn {
          padding: 8px 16px;
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          color: white;
          border: 1px solid #4f46e5;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-weight: 600;
        }
        
        .batch-toggle-btn:hover {
          background: linear-gradient(135deg, #4f46e5, #4338ca);
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(99, 102, 241, 0.3);
        }
        
        .batch-toggle-btn.active {
          background: linear-gradient(135deg, #ef4444, #dc2626);
          border-color: #dc2626;
        }
        
        .batch-toggle-btn.active:hover {
          background: linear-gradient(135deg, #dc2626, #b91c1c);
          box-shadow: 0 4px 8px rgba(239, 68, 68, 0.3);
        }
        
        .widget-header h3 {
          margin: 0;
          color: #ffd700;
          font-weight: 600;
        }
        
        .add-song-btn {
          padding: 8px 16px;
          background: linear-gradient(135deg, #daa520, #b8860b);
          color: white;
          border: 1px solid #daa520;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .add-song-btn:hover {
          background: linear-gradient(135deg, #b8860b, #9a7209);
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(218, 165, 32, 0.3);
        }
        
        .song-controls {
          margin-bottom: 20px;
        }
        
        .advanced-search-section {
          margin-bottom: 16px;
        }
        
        .basic-search-controls {
          margin-top: 12px;
        }
        
        .active-filters {
          margin-top: 12px;
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
        
        .search-section {
          margin-bottom: 10px;
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
        
        .filter-section {
          display: flex;
          gap: 10px;
        }
        
        .category-filter, .sort-select {
          padding: 6px 10px;
          border: 1px solid #daa520;
          border-radius: 4px;
          background: linear-gradient(135deg, #333333, #404040);
          color: #ffffff;
          font-size: 14px;
          flex: 1;
          transition: all 0.2s ease;
        }
        
        .category-filter:focus, .sort-select:focus {
          outline: none;
          border-color: #ffd700;
          box-shadow: 0 0 0 3px rgba(255, 215, 0, 0.2);
          background: linear-gradient(135deg, #404040, #4a4a4a);
        }
        
        .add-song-form {
          background: linear-gradient(135deg, #2a2a2a 0%, #3d3d3d 100%);
          padding: 15px;
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
        
        .form-row input {
          flex: 1;
          padding: 8px 12px;
          border: 1px solid #daa520;
          border-radius: 4px;
          font-size: 14px;
          background: linear-gradient(135deg, #333333, #404040);
          color: #ffffff;
          transition: all 0.2s ease;
        }
        
        .form-row input:focus {
          outline: none;
          border-color: #ffd700;
          box-shadow: 0 0 0 3px rgba(255, 215, 0, 0.2);
          background: linear-gradient(135deg, #404040, #4a4a4a);
        }
        
        .form-row input::placeholder {
          color: #aaaaaa;
        }
        
        .form-actions {
          display: flex;
          justify-content: flex-end;
        }
        
        .form-actions button {
          padding: 8px 16px;
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
        
        .category-section {
          width: 100%;
        }
        
        .category-mode-selector {
          display: flex;
          gap: 20px;
          margin-bottom: 10px;
          padding: 8px;
          background: linear-gradient(135deg, #404040, #4a4a4a);
          border: 1px solid #daa520;
          border-radius: 4px;
          box-shadow: inset 0 1px 0 rgba(255, 215, 0, 0.1);
        }
        
        .radio-option {
          display: flex;
          align-items: center;
          gap: 5px;
          cursor: pointer;
          font-size: 14px;
          color: #ffffff;
          font-weight: 500;
        }
        
        .radio-option input[type="radio"] {
          margin: 0;
        }
        
        .category-select, .category-input {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #daa520;
          border-radius: 4px;
          font-size: 14px;
          background: linear-gradient(135deg, #333333, #404040);
          color: #ffffff;
          transition: all 0.2s ease;
        }
        
        .category-select:focus, .category-input:focus {
          outline: none;
          border-color: #ffd700;
          box-shadow: 0 0 0 2px rgba(255, 215, 0, 0.25);
          background: linear-gradient(135deg, #404040, #4a4a4a);
        }
        
        .category-input::placeholder {
          color: #aaaaaa;
        }
        
        .songs-list {
          flex: 1;
          overflow: auto;
        }
        
        .loading, .empty-state {
          text-align: center;
          color: #cccccc;
          padding: 40px 0;
          font-style: italic;
        }
        
        .songs-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 15px;
        }
        
        .song-card {
          border: 1px solid #daa520;
          border-radius: 8px;
          padding: 15px;
          background: linear-gradient(135deg, #2a2a2a 0%, #3d3d3d 100%);
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 215, 0, 0.1);
          position: relative;
          overflow: hidden;
        }
        
        .song-card.batch-mode {
          padding-left: 45px;
        }
        
        .song-checkbox {
          position: absolute;
          left: 15px;
          top: 50%;
          transform: translateY(-50%);
        }
        
        .batch-checkbox {
          width: 16px;
          height: 16px;
          cursor: pointer;
        }
        
        .song-status {
          padding: 2px 6px;
          border-radius: 10px;
          font-size: 11px;
          font-weight: 600;
          margin-top: 4px;
          display: inline-block;
        }
        
        .song-status.active {
          background: #10b981;
          color: white;
        }
        
        .song-status.inactive {
          background: #6b7280;
          color: white;
        }
        
        .song-card:hover {
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4), 0 0 25px rgba(218, 165, 32, 0.2);
          border-color: #ffd700;
          transform: translateY(-2px);
        }
        
        .song-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, #daa520, transparent);
          opacity: 0.5;
        }
        
        .song-info {
          flex: 1;
        }
        
        .song-title {
          font-weight: bold;
          margin-bottom: 5px;
          color: #ffd700;
          font-size: 16px;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
        }
        
        .song-artist {
          color: #cccccc;
          font-size: 14px;
          margin-bottom: 8px;
        }
        
        .song-category {
          background: linear-gradient(135deg, #daa520, #b8860b);
          color: #ffffff;
          padding: 3px 8px;
          border-radius: 12px;
          font-size: 12px;
          display: inline-block;
          margin-bottom: 8px;
          font-weight: 500;
          box-shadow: 0 2px 4px rgba(218, 165, 32, 0.3);
        }
        
        .song-date {
          font-size: 12px;
          color: #aaaaaa;
        }
        
        .song-actions {
          margin-left: 10px;
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
      `}</style>
    </div>
  );
};

export default SongListWidget;