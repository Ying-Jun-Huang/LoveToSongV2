import React, { useState, useEffect } from 'react';
import api from '../services/api';

const SongListWidget = (props) => {
  const [songs, setSongs] = useState([]);
  const [filteredSongs, setFilteredSongs] = useState([]);
  const [newSong, setNewSong] = useState({ title: '', artist: '', category: '' });
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('title');
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
    
    // Apply search filter
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
    
    // Apply sorting
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
    
    setFilteredSongs(filtered);
  }, [songs, searchQuery, selectedCategory, sortBy]);

  const fetchSongs = async () => {
    try {
      setLoading(true);
      const response = await api.get('/songs');
      setSongs(response.data);
      
      // Extract unique categories and add some predefined ones
      const songCategories = [...new Set(
        response.data
          .map(song => song.category)
          .filter(cat => cat && cat.trim() !== '')
      )];
      
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
  
  const deleteSong = async (id) => {
    if (!window.confirm('確定要刪除這首歌嗎？')) return;
    
    try {
      await api.delete(`/songs/${id}`);
      setSongs(songs.filter(s => s.id !== id));
    } catch (error) {
      console.error('Failed to delete song:', error);
      alert('刪除失敗');
    }
  };

  return (
    <div className="song-list-widget">
      <div className="widget-header">
        <h3>歌曲庫 ({filteredSongs.length}/{songs.length})</h3>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="add-song-btn"
        >
          {showAddForm ? '取消' : '新增歌曲'}
        </button>
      </div>
      
      {/* Search and Filter Controls */}
      <div className="song-controls">
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
                {filteredSongs.map((song) => (
                  <div key={song.id} className="song-card">
                    <div className="song-info">
                      <div className="song-title">{song.title}</div>
                      {song.artist && <div className="song-artist">{song.artist}</div>}
                      {song.category && <div className="song-category">{song.category}</div>}
                      <div className="song-date">
                        {new Date(song.createdAt).toLocaleDateString('zh-TW')}
                      </div>
                    </div>
                    <div className="song-actions">
                      <button 
                        onClick={() => deleteSong(song.id)}
                        className="delete-btn"
                        title="刪除歌曲"
                      >
                        ×
                      </button>
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