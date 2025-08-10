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
      
      // Extract unique categories
      const uniqueCategories = [...new Set(
        response.data
          .map(song => song.category)
          .filter(cat => cat && cat.trim() !== '')
      )];
      setCategories(uniqueCategories);
      
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
      const response = await api.post('/songs', newSong);
      setSongs([...songs, response.data]);
      setNewSong({ title: '', artist: '', category: '' });
      setShowAddForm(false);
      
      // Update categories if new category was added
      if (newSong.category && !categories.includes(newSong.category)) {
        setCategories([...categories, newSong.category]);
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
            <input
              type="text"
              placeholder="分類"
              value={newSong.category}
              onChange={(e) => setNewSong({ ...newSong, category: e.target.value })}
              list="categories"
            />
            <datalist id="categories">
              {categories.map(cat => (
                <option key={cat} value={cat} />
              ))}
            </datalist>
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
        }
        
        .widget-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          border-bottom: 2px solid #f0f0f0;
          padding-bottom: 10px;
        }
        
        .widget-header h3 {
          margin: 0;
          color: #333;
        }
        
        .add-song-btn {
          padding: 8px 16px;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .add-song-btn:hover {
          background: #0056b3;
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
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }
        
        .filter-section {
          display: flex;
          gap: 10px;
        }
        
        .category-filter, .sort-select {
          padding: 6px 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          background: white;
          font-size: 14px;
          flex: 1;
        }
        
        .add-song-form {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
          border: 1px solid #e9ecef;
        }
        
        .form-row {
          display: flex;
          gap: 10px;
          margin-bottom: 10px;
        }
        
        .form-row input {
          flex: 1;
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }
        
        .form-actions {
          display: flex;
          justify-content: flex-end;
        }
        
        .form-actions button {
          padding: 8px 16px;
          background: #28a745;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .form-actions button:hover {
          background: #218838;
        }
        
        .songs-list {
          flex: 1;
          overflow: auto;
        }
        
        .loading, .empty-state {
          text-align: center;
          color: #666;
          padding: 40px 0;
          font-style: italic;
        }
        
        .songs-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 15px;
        }
        
        .song-card {
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 15px;
          background: white;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          transition: box-shadow 0.2s ease;
        }
        
        .song-card:hover {
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }
        
        .song-info {
          flex: 1;
        }
        
        .song-title {
          font-weight: bold;
          margin-bottom: 5px;
          color: #333;
          font-size: 16px;
        }
        
        .song-artist {
          color: #666;
          font-size: 14px;
          margin-bottom: 8px;
        }
        
        .song-category {
          background: #e3f2fd;
          color: #1976d2;
          padding: 3px 8px;
          border-radius: 12px;
          font-size: 12px;
          display: inline-block;
          margin-bottom: 8px;
        }
        
        .song-date {
          font-size: 12px;
          color: #999;
        }
        
        .song-actions {
          margin-left: 10px;
        }
        
        .delete-btn {
          padding: 4px 8px;
          background: #dc3545;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          font-weight: bold;
        }
        
        .delete-btn:hover {
          background: #c82333;
        }
      `}</style>
    </div>
  );
};

export default SongListWidget;