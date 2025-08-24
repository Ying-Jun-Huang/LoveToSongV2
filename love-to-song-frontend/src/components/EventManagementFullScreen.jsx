import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuthV2';
import AdvancedSearchFilter from './AdvancedSearchFilter';

const EventManagementFullScreen = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [singers, setSingers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [advancedFilters, setAdvancedFilters] = useState({});

  // 表單狀態
  const [formData, setFormData] = useState({
    title: '',
    venue: '',
    startsAt: '',
    endsAt: '',
    description: '',
    singerIds: []
  });

  // 模擬數據
  const mockEvents = [
    {
      id: 1,
      title: '春季卡拉OK大賽',
      venue: '台北信義區KTV',
      startsAt: new Date('2024-03-15T19:00:00'),
      endsAt: new Date('2024-03-15T23:00:00'),
      status: 'PLANNED',
      description: '春季最盛大的卡拉OK比賽',
      host: { id: 1, displayName: '主持管理' },
      eventSingers: [
        { singer: { id: 1, stageName: 'Alice', bio: '流行歌手' } },
        { singer: { id: 2, stageName: 'Bob', bio: '搖滾歌手' } }
      ],
      _count: { requests: 15 }
    },
    {
      id: 2,
      title: '夏日音樂節',
      venue: '戶外音樂廣場',
      startsAt: new Date('2024-06-20T18:00:00'),
      endsAt: new Date('2024-06-20T22:00:00'),
      status: 'ACTIVE',
      description: '夏日戶外音樂表演',
      host: { id: 1, displayName: '主持管理' },
      eventSingers: [
        { singer: { id: 3, stageName: 'Charlie', bio: '民謠歌手' } }
      ],
      _count: { requests: 28 }
    },
    {
      id: 3,
      title: '秋季懷舊金曲夜',
      venue: '經典音樂廳',
      startsAt: new Date('2024-09-10T19:30:00'),
      endsAt: new Date('2024-09-10T22:30:00'),
      status: 'COMPLETED',
      description: '重溫經典老歌的美好時光',
      host: { id: 2, displayName: 'Host Admin' },
      eventSingers: [
        { singer: { id: 1, stageName: 'Alice', bio: '流行歌手' } },
        { singer: { id: 4, stageName: 'Diana', bio: '爵士歌手' } }
      ],
      _count: { requests: 42 }
    }
  ];

  const mockSingers = [
    { id: 1, stageName: 'Alice', bio: '流行歌手', isActive: true },
    { id: 2, stageName: 'Bob', bio: '搖滾歌手', isActive: true },
    { id: 3, stageName: 'Charlie', bio: '民謠歌手', isActive: true },
    { id: 4, stageName: 'Diana', bio: '爵士歌手', isActive: true }
  ];

  useEffect(() => {
    // 模擬載入數據
    setTimeout(() => {
      setEvents(mockEvents);
      setSingers(mockSingers);
      setLoading(false);
    }, 1000);
  }, []);

  // 處理進階搜尋
  const handleAdvancedSearch = (filters) => {
    setAdvancedFilters(filters);
    setFilter('ALL'); // 重置基本篩選避免衝突
  };

  // 重置搜尋條件
  const handleResetSearch = () => {
    setAdvancedFilters({});
    setFilter('ALL');
  };

  // 應用進階篩選
  const applyAdvancedFilters = (eventsList) => {
    let filtered = [...eventsList];
    
    if (advancedFilters.keyword) {
      filtered = filtered.filter(event => 
        event.title.toLowerCase().includes(advancedFilters.keyword.toLowerCase()) ||
        (event.venue && event.venue.toLowerCase().includes(advancedFilters.keyword.toLowerCase())) ||
        (event.description && event.description.toLowerCase().includes(advancedFilters.keyword.toLowerCase()))
      );
    }
    
    if (advancedFilters.venue) {
      filtered = filtered.filter(event => event.venue && event.venue.toLowerCase().includes(advancedFilters.venue.toLowerCase()));
    }
    
    if (advancedFilters.status) {
      filtered = filtered.filter(event => event.status === advancedFilters.status);
    }
    
    if (advancedFilters.hostUserId) {
      filtered = filtered.filter(event => event.host && event.host.id.toString() === advancedFilters.hostUserId);
    }
    
    // Date range filter
    if (advancedFilters.dateRange) {
      if (advancedFilters.dateRange.startDate) {
        const startDate = new Date(advancedFilters.dateRange.startDate);
        filtered = filtered.filter(event => new Date(event.startsAt) >= startDate);
      }
      if (advancedFilters.dateRange.endDate) {
        const endDate = new Date(advancedFilters.dateRange.endDate);
        filtered = filtered.filter(event => new Date(event.startsAt) <= endDate);
      }
    }
    
    // Advanced sorting
    if (advancedFilters.sortBy) {
      filtered.sort((a, b) => {
        const order = advancedFilters.sortOrder === 'asc' ? 1 : -1;
        
        if (advancedFilters.sortBy === 'title') {
          return a.title.localeCompare(b.title) * order;
        } else if (advancedFilters.sortBy === 'startsAt') {
          return (new Date(a.startsAt) - new Date(b.startsAt)) * order;
        } else if (advancedFilters.sortBy === 'createdAt') {
          return (new Date(a.createdAt || a.startsAt) - new Date(b.createdAt || b.startsAt)) * order;
        } else if (advancedFilters.sortBy === 'requestCount') {
          return ((a._count?.requests || 0) - (b._count?.requests || 0)) * order;
        }
        return 0;
      });
    }
    
    return filtered;
  };

  // 過濾活動
  const getFilteredEvents = () => {
    if (Object.keys(advancedFilters).length > 0) {
      return applyAdvancedFilters(events);
    } else {
      return events.filter(event => {
        if (filter === 'ALL') return true;
        return event.status === filter;
      });
    }
  };
  
  const filteredEvents = getFilteredEvents();

  // 狀態顏色映射
  const getStatusColor = (status) => {
    const colors = {
      'PLANNED': '#3b82f6',
      'ACTIVE': '#10b981',
      'COMPLETED': '#6b7280',
      'CANCELLED': '#ef4444'
    };
    return colors[status] || '#6b7280';
  };

  // 狀態文字映射
  const getStatusText = (status) => {
    const texts = {
      'PLANNED': '計劃中',
      'ACTIVE': '進行中',
      'COMPLETED': '已完成',
      'CANCELLED': '已取消'
    };
    return texts[status] || status;
  };

  // 處理表單變更
  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 處理歌手選擇
  const handleSingerSelect = (singerId) => {
    setFormData(prev => ({
      ...prev,
      singerIds: prev.singerIds.includes(singerId)
        ? prev.singerIds.filter(id => id !== singerId)
        : [...prev.singerIds, singerId]
    }));
  };

  // 創建活動
  const handleCreateEvent = () => {
    // 這裡應該調用API
    // Creating event
    setShowCreateForm(false);
    resetForm();
  };

  // 編輯活動
  const handleEditEvent = () => {
    // 這裡應該調用API
    // Updating event
    setShowEditForm(false);
    resetForm();
  };

  // 開始活動
  const handleStartEvent = (eventId) => {
    // 這裡應該調用API
    // Starting event
  };

  // 結束活動
  const handleEndEvent = (eventId) => {
    // 這裡應該調用API
    // Ending event
  };

  // 重置表單
  const resetForm = () => {
    setFormData({
      title: '',
      venue: '',
      startsAt: '',
      endsAt: '',
      description: '',
      singerIds: []
    });
  };

  // 打開編輯表單
  const openEditForm = (event) => {
    setSelectedEvent(event);
    setFormData({
      title: event.title,
      venue: event.venue || '',
      startsAt: event.startsAt.toISOString().slice(0, 16),
      endsAt: event.endsAt.toISOString().slice(0, 16),
      description: event.description || '',
      singerIds: event.eventSingers.map(es => es.singer.id)
    });
    setShowEditForm(true);
  };

  if (loading) {
    return (
      <div className="event-management-loading">
        <div className="loading-spinner">⏳</div>
        <p>載入活動資料中...</p>
        
        <style jsx="true">{`
          .event-management-loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            color: #ffffff;
          }
          
          .loading-spinner {
            font-size: 48px;
            margin-bottom: 16px;
            animation: spin 2s linear infinite;
          }
          
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="event-management-fullscreen">
      <div className="management-header">
        <div className="header-info">
          <h2>🎪 活動管理中心</h2>
          <p>創建、管理和監控所有活動</p>
        </div>
        
        <div className="header-controls">
          <button
            className="create-btn"
            onClick={() => setShowCreateForm(true)}
          >
            ➕ 創建活動
          </button>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="search-controls">
        {/* Advanced Search Filter */}
        <AdvancedSearchFilter
          entityType="events"
          onSearch={handleAdvancedSearch}
          onReset={handleResetSearch}
          initialFilters={{}}
          className="advanced-search-section"
        />
        
        {/* Basic Filter Controls (show only when not using advanced search) */}
        {Object.keys(advancedFilters).length === 0 && (
          <div className="basic-filter-controls">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="status-filter"
            >
              <option value="ALL">所有狀態</option>
              <option value="PLANNED">計劃中</option>
              <option value="ACTIVE">進行中</option>
              <option value="COMPLETED">已完成</option>
              <option value="CANCELLED">已取消</option>
            </select>
          </div>
        )}
        
        {/* Active Filters Display */}
        {Object.keys(advancedFilters).length > 0 && (
          <div className="active-filters">
            <span className="filters-label">已啟用進階篩選:</span>
            {advancedFilters.keyword && (
              <span className="filter-chip">關鍵字: {advancedFilters.keyword}</span>
            )}
            {advancedFilters.venue && (
              <span className="filter-chip">地點: {advancedFilters.venue}</span>
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

      <div className="management-content">
        {/* Results Count */}
        <div className="results-info">
          顯示 {filteredEvents.length} / {events.length} 個活動
          {Object.keys(advancedFilters).length > 0 && ' (進階篩選)'}
        </div>
        <div className="events-grid">
          {filteredEvents.map(event => (
            <div key={event.id} className="event-card">
              <div className="event-card-header">
                <div className="event-title">{event.title}</div>
                <div 
                  className="event-status"
                  style={{ backgroundColor: getStatusColor(event.status) }}
                >
                  {getStatusText(event.status)}
                </div>
              </div>
              
              <div className="event-details">
                <div className="event-venue">📍 {event.venue}</div>
                <div className="event-time">
                  ⏰ {event.startsAt.toLocaleString('zh-TW', {
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  })} - {event.endsAt.toLocaleString('zh-TW', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
                <div className="event-host">👤 {event.host.displayName}</div>
                <div className="event-stats">
                  🎵 {event._count.requests} 個點歌請求
                </div>
              </div>
              
              <div className="event-singers">
                <div className="singers-label">參與歌手:</div>
                <div className="singers-list">
                  {event.eventSingers.map(es => (
                    <span key={es.singer.id} className="singer-tag">
                      {es.singer.stageName}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="event-actions">
                <button
                  className="action-btn view"
                  onClick={() => setSelectedEvent(event)}
                >
                  查看詳情
                </button>
                <button
                  className="action-btn edit"
                  onClick={() => openEditForm(event)}
                  disabled={event.status === 'COMPLETED'}
                >
                  編輯
                </button>
                {event.status === 'PLANNED' && (
                  <button
                    className="action-btn start"
                    onClick={() => handleStartEvent(event.id)}
                  >
                    開始活動
                  </button>
                )}
                {event.status === 'ACTIVE' && (
                  <button
                    className="action-btn end"
                    onClick={() => handleEndEvent(event.id)}
                  >
                    結束活動
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 創建活動表單 */}
      {showCreateForm && (
        <div className="modal-overlay" onClick={() => setShowCreateForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>創建新活動</h3>
              <button className="close-btn" onClick={() => setShowCreateForm(false)}>
                ✕
              </button>
            </div>
            
            <div className="form-content">
              <div className="form-group">
                <label>活動名稱 *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleFormChange('title', e.target.value)}
                  placeholder="輸入活動名稱"
                />
              </div>
              
              <div className="form-group">
                <label>活動地點</label>
                <input
                  type="text"
                  value={formData.venue}
                  onChange={(e) => handleFormChange('venue', e.target.value)}
                  placeholder="輸入活動地點"
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>開始時間 *</label>
                  <input
                    type="datetime-local"
                    value={formData.startsAt}
                    onChange={(e) => handleFormChange('startsAt', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>結束時間 *</label>
                  <input
                    type="datetime-local"
                    value={formData.endsAt}
                    onChange={(e) => handleFormChange('endsAt', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label>活動描述</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                  placeholder="輸入活動描述"
                  rows={3}
                />
              </div>
              
              <div className="form-group">
                <label>指派歌手</label>
                <div className="singers-selection">
                  {singers.map(singer => (
                    <label key={singer.id} className="singer-checkbox">
                      <input
                        type="checkbox"
                        checked={formData.singerIds.includes(singer.id)}
                        onChange={() => handleSingerSelect(singer.id)}
                      />
                      <span>{singer.stageName}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="modal-actions">
              <button
                className="btn secondary"
                onClick={() => setShowCreateForm(false)}
              >
                取消
              </button>
              <button
                className="btn primary"
                onClick={handleCreateEvent}
                disabled={!formData.title || !formData.startsAt || !formData.endsAt}
              >
                創建活動
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 編輯活動表單 */}
      {showEditForm && (
        <div className="modal-overlay" onClick={() => setShowEditForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>編輯活動</h3>
              <button className="close-btn" onClick={() => setShowEditForm(false)}>
                ✕
              </button>
            </div>
            
            <div className="form-content">
              <div className="form-group">
                <label>活動名稱 *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleFormChange('title', e.target.value)}
                  placeholder="輸入活動名稱"
                />
              </div>
              
              <div className="form-group">
                <label>活動地點</label>
                <input
                  type="text"
                  value={formData.venue}
                  onChange={(e) => handleFormChange('venue', e.target.value)}
                  placeholder="輸入活動地點"
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>開始時間 *</label>
                  <input
                    type="datetime-local"
                    value={formData.startsAt}
                    onChange={(e) => handleFormChange('startsAt', e.target.value)}
                    disabled={selectedEvent?.status === 'ACTIVE'}
                  />
                </div>
                <div className="form-group">
                  <label>結束時間 *</label>
                  <input
                    type="datetime-local"
                    value={formData.endsAt}
                    onChange={(e) => handleFormChange('endsAt', e.target.value)}
                    disabled={selectedEvent?.status === 'ACTIVE'}
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label>活動描述</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                  placeholder="輸入活動描述"
                  rows={3}
                />
              </div>
              
              <div className="form-group">
                <label>指派歌手</label>
                <div className="singers-selection">
                  {singers.map(singer => (
                    <label key={singer.id} className="singer-checkbox">
                      <input
                        type="checkbox"
                        checked={formData.singerIds.includes(singer.id)}
                        onChange={() => handleSingerSelect(singer.id)}
                      />
                      <span>{singer.stageName}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="modal-actions">
              <button
                className="btn secondary"
                onClick={() => setShowEditForm(false)}
              >
                取消
              </button>
              <button
                className="btn primary"
                onClick={handleEditEvent}
                disabled={!formData.title || !formData.startsAt || !formData.endsAt}
              >
                更新活動
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 活動詳情 */}
      {selectedEvent && !showEditForm && (
        <div className="modal-overlay" onClick={() => setSelectedEvent(null)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedEvent.title}</h3>
              <button className="close-btn" onClick={() => setSelectedEvent(null)}>
                ✕
              </button>
            </div>
            
            <div className="event-detail-content">
              <div className="detail-section">
                <h4>基本資訊</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="label">狀態:</span>
                    <span 
                      className="value status"
                      style={{ color: getStatusColor(selectedEvent.status) }}
                    >
                      {getStatusText(selectedEvent.status)}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="label">地點:</span>
                    <span className="value">{selectedEvent.venue || '未指定'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">開始時間:</span>
                    <span className="value">
                      {selectedEvent.startsAt.toLocaleString('zh-TW')}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="label">結束時間:</span>
                    <span className="value">
                      {selectedEvent.endsAt.toLocaleString('zh-TW')}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="label">主持人:</span>
                    <span className="value">{selectedEvent.host.displayName}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">點歌請求:</span>
                    <span className="value">{selectedEvent._count.requests} 個</span>
                  </div>
                </div>
              </div>
              
              {selectedEvent.description && (
                <div className="detail-section">
                  <h4>活動描述</h4>
                  <p className="description">{selectedEvent.description}</p>
                </div>
              )}
              
              <div className="detail-section">
                <h4>參與歌手 ({selectedEvent.eventSingers.length})</h4>
                <div className="singers-grid">
                  {selectedEvent.eventSingers.map(es => (
                    <div key={es.singer.id} className="singer-card">
                      <div className="singer-name">{es.singer.stageName}</div>
                      <div className="singer-bio">{es.singer.bio}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx="true">{`
        .event-management-fullscreen {
          height: 100%;
          display: flex;
          flex-direction: column;
          background: transparent;
          color: #ffffff;
        }

        .management-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px 32px;
          background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
          border-bottom: 2px solid #ffd700;
          box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
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

        .header-controls {
          display: flex;
          gap: 16px;
          align-items: center;
        }

        .status-filter, .create-btn {
          padding: 10px 16px;
          border: 2px solid #daa520;
          border-radius: 8px;
          font-size: 14px;
          background: linear-gradient(135deg, #333333, #404040);
          color: #ffffff;
          transition: all 0.2s ease;
        }

        .status-filter:focus, .create-btn:hover {
          outline: none;
          border-color: #ffd700;
          box-shadow: 0 0 0 3px rgba(255, 215, 0, 0.2);
          background: linear-gradient(135deg, #404040, #4a4a4a);
        }

        .create-btn {
          background: linear-gradient(135deg, #daa520 0%, #b8860b 100%);
          cursor: pointer;
          font-weight: 600;
        }

        .create-btn:hover {
          background: linear-gradient(135deg, #b8860b 0%, #9a7209 100%);
          transform: translateY(-1px);
        }

        .search-controls {
          padding: 0 32px 20px;
        }
        
        .advanced-search-section {
          margin-bottom: 16px;
        }
        
        .basic-filter-controls {
          display: flex;
          justify-content: flex-start;
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
          margin-bottom: 16px;
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

        .management-content {
          flex: 1;
          padding: 0 32px 32px;
          overflow-y: auto;
        }
        
        .results-info {
          color: #cccccc;
          font-size: 14px;
          margin-bottom: 16px;
          padding: 8px 12px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 6px;
          border: 1px solid rgba(218, 165, 32, 0.2);
        }

        .events-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
          gap: 24px;
        }

        .event-card {
          background: linear-gradient(135deg, #2a2a2a 0%, #3d3d3d 100%);
          border: 2px solid rgba(218, 165, 32, 0.3);
          border-radius: 16px;
          padding: 24px;
          transition: all 0.3s ease;
        }

        .event-card:hover {
          border-color: #daa520;
          box-shadow: 0 8px 24px rgba(255, 215, 0, 0.2);
          transform: translateY(-2px);
        }

        .event-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }

        .event-title {
          font-size: 20px;
          font-weight: 700;
          color: #ffd700;
          flex: 1;
          margin-right: 16px;
        }

        .event-status {
          padding: 4px 12px;
          border-radius: 20px;
          color: white;
          font-size: 12px;
          font-weight: 600;
          white-space: nowrap;
        }

        .event-details {
          margin-bottom: 16px;
          line-height: 1.6;
        }

        .event-details > div {
          margin-bottom: 8px;
          color: #cccccc;
        }

        .event-venue, .event-time, .event-host, .event-stats {
          font-size: 14px;
        }

        .event-singers {
          margin-bottom: 20px;
        }

        .singers-label {
          font-size: 14px;
          color: #ffd700;
          margin-bottom: 8px;
          font-weight: 600;
        }

        .singers-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .singer-tag {
          background: rgba(255, 215, 0, 0.2);
          color: #ffd700;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          border: 1px solid rgba(218, 165, 32, 0.5);
        }

        .event-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .action-btn {
          padding: 8px 16px;
          border: none;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .action-btn.view {
          background: rgba(59, 130, 246, 0.2);
          color: #60a5fa;
          border: 1px solid rgba(59, 130, 246, 0.5);
        }

        .action-btn.edit {
          background: rgba(255, 215, 0, 0.2);
          color: #ffd700;
          border: 1px solid rgba(218, 165, 32, 0.5);
        }

        .action-btn.start {
          background: rgba(16, 185, 129, 0.2);
          color: #34d399;
          border: 1px solid rgba(16, 185, 129, 0.5);
        }

        .action-btn.end {
          background: rgba(239, 68, 68, 0.2);
          color: #f87171;
          border: 1px solid rgba(239, 68, 68, 0.5);
        }

        .action-btn:not(:disabled):hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        /* 模態框樣式 */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal-content {
          background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
          border: 2px solid #daa520;
          border-radius: 16px;
          max-width: 600px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 60px rgba(255, 215, 0, 0.3);
        }

        .modal-content.large {
          max-width: 800px;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px 32px;
          border-bottom: 2px solid rgba(218, 165, 32, 0.3);
          background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
        }

        .modal-header h3 {
          margin: 0;
          color: #ffd700;
          font-size: 20px;
          font-weight: 700;
        }

        .close-btn {
          background: none;
          border: none;
          color: #cccccc;
          font-size: 24px;
          cursor: pointer;
          padding: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: all 0.2s ease;
        }

        .close-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #ffffff;
        }

        .form-content {
          padding: 32px;
        }

        .form-group {
          margin-bottom: 24px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          color: #ffd700;
          font-weight: 600;
          font-size: 14px;
        }

        .form-group input, .form-group textarea {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid rgba(218, 165, 32, 0.3);
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.05);
          color: #ffffff;
          font-size: 14px;
          transition: all 0.2s ease;
        }

        .form-group input:focus, .form-group textarea:focus {
          outline: none;
          border-color: #daa520;
          box-shadow: 0 0 0 3px rgba(218, 165, 32, 0.2);
          background: rgba(255, 255, 255, 0.08);
        }

        .form-group input::placeholder, .form-group textarea::placeholder {
          color: #aaaaaa;
        }

        .singers-selection {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 12px;
        }

        .singer-checkbox {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px;
          background: rgba(255, 255, 255, 0.05);
          border: 2px solid rgba(218, 165, 32, 0.3);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .singer-checkbox:hover {
          border-color: #daa520;
          background: rgba(255, 255, 255, 0.08);
        }

        .singer-checkbox input[type="checkbox"] {
          width: auto;
          margin: 0;
          accent-color: #daa520;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 24px 32px;
          border-top: 2px solid rgba(218, 165, 32, 0.3);
          background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
        }

        .btn {
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn.primary {
          background: linear-gradient(135deg, #daa520 0%, #b8860b 100%);
          color: white;
          border: 1px solid #daa520;
        }

        .btn.secondary {
          background: rgba(255, 255, 255, 0.1);
          color: #cccccc;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn:not(:disabled):hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        /* 活動詳情樣式 */
        .event-detail-content {
          padding: 32px;
        }

        .detail-section {
          margin-bottom: 32px;
        }

        .detail-section h4 {
          margin: 0 0 16px 0;
          color: #ffd700;
          font-size: 18px;
          font-weight: 600;
          border-bottom: 1px solid rgba(218, 165, 32, 0.3);
          padding-bottom: 8px;
        }

        .detail-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 16px;
        }

        .detail-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .detail-item .label {
          color: #cccccc;
          font-weight: 500;
          min-width: 80px;
        }

        .detail-item .value {
          color: #ffffff;
          font-weight: 600;
        }

        .detail-item .value.status {
          font-weight: 700;
        }

        .description {
          color: #cccccc;
          line-height: 1.6;
          margin: 0;
        }

        .singers-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 16px;
        }

        .singer-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(218, 165, 32, 0.3);
          border-radius: 12px;
          padding: 16px;
          text-align: center;
        }

        .singer-name {
          font-weight: 600;
          color: #ffd700;
          margin-bottom: 4px;
        }

        .singer-bio {
          font-size: 13px;
          color: #cccccc;
        }

        @media (max-width: 768px) {
          .management-header {
            flex-direction: column;
            gap: 16px;
            padding: 16px;
          }

          .header-controls {
            width: 100%;
            justify-content: stretch;
          }

          .events-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }

          .management-content {
            padding: 16px;
          }

          .modal-content {
            margin: 10px;
            max-width: none;
          }

          .form-row {
            grid-template-columns: 1fr;
          }

          .singers-selection {
            grid-template-columns: 1fr;
          }

          .detail-grid {
            grid-template-columns: 1fr;
          }

          .singers-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default EventManagementFullScreen;