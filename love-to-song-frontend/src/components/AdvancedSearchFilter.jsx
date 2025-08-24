import React, { useState, useEffect } from 'react';

const AdvancedSearchFilter = ({ 
  entityType, 
  onSearch, 
  onReset,
  initialFilters = {},
  className = '' 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState({
    // 通用篩選
    keyword: '',
    dateRange: {
      startDate: '',
      endDate: ''
    },
    status: '',
    sortBy: '',
    sortOrder: 'desc',
    // 實體特定篩選
    ...initialFilters
  });

  // 根據實體類型定義篩選選項
  const getFilterConfig = () => {
    switch (entityType) {
      case 'songs':
        return {
          title: '歌曲搜尋',
          fields: [
            { id: 'keyword', type: 'text', label: '歌曲名稱/歌手', placeholder: '輸入歌曲名稱或歌手' },
            { id: 'language', type: 'select', label: '語言', options: [
              { value: '', label: '全部語言' },
              { value: '中文', label: '中文' },
              { value: '英文', label: '英文' },
              { value: '日文', label: '日文' },
              { value: '韓文', label: '韓文' }
            ]},
            { id: 'genre', type: 'select', label: '曲風', options: [
              { value: '', label: '全部曲風' },
              { value: '流行', label: '流行' },
              { value: '搖滾', label: '搖滾' },
              { value: '爵士', label: '爵士' },
              { value: '古典', label: '古典' },
              { value: '民謠', label: '民謠' }
            ]},
            { id: 'era', type: 'select', label: '年代', options: [
              { value: '', label: '全部年代' },
              { value: '2020s', label: '2020年代' },
              { value: '2010s', label: '2010年代' },
              { value: '2000s', label: '2000年代' },
              { value: '90s', label: '90年代' },
              { value: '80s', label: '80年代' }
            ]},
            { id: 'isActive', type: 'select', label: '狀態', options: [
              { value: '', label: '全部狀態' },
              { value: 'true', label: '啟用' },
              { value: 'false', label: '停用' }
            ]}
          ],
          sortOptions: [
            { value: 'title', label: '歌曲名稱' },
            { value: 'createdAt', label: '建立時間' },
            { value: 'updatedAt', label: '更新時間' },
            { value: 'requestCount', label: '點歌次數' }
          ]
        };

      case 'users':
        return {
          title: '用戶搜尋',
          fields: [
            { id: 'keyword', type: 'text', label: '用戶名稱/Email', placeholder: '輸入用戶名稱或Email' },
            { id: 'role', type: 'select', label: '角色', options: [
              { value: '', label: '全部角色' },
              { value: 'SUPER_ADMIN', label: '高層管理員' },
              { value: 'HOST_ADMIN', label: '主持管理' },
              { value: 'SINGER', label: '歌手' },
              { value: 'PLAYER', label: '玩家' },
              { value: 'GUEST', label: '訪客' }
            ]},
            { id: 'status', type: 'select', label: '狀態', options: [
              { value: '', label: '全部狀態' },
              { value: 'ACTIVE', label: '啟用' },
              { value: 'DISABLED', label: '停用' },
              { value: 'SUSPENDED', label: '暫停' }
            ]}
          ],
          sortOptions: [
            { value: 'displayName', label: '顯示名稱' },
            { value: 'email', label: 'Email' },
            { value: 'createdAt', label: '註冊時間' },
            { value: 'updatedAt', label: '最後更新' }
          ]
        };

      case 'events':
        return {
          title: '活動搜尋',
          fields: [
            { id: 'keyword', type: 'text', label: '活動名稱', placeholder: '輸入活動名稱' },
            { id: 'venue', type: 'text', label: '活動地點', placeholder: '輸入活動地點' },
            { id: 'status', type: 'select', label: '狀態', options: [
              { value: '', label: '全部狀態' },
              { value: 'PLANNED', label: '計劃中' },
              { value: 'ACTIVE', label: '進行中' },
              { value: 'COMPLETED', label: '已完成' },
              { value: 'CANCELLED', label: '已取消' }
            ]},
            { id: 'hostUserId', type: 'text', label: '主持人ID', placeholder: '輸入主持人ID' }
          ],
          sortOptions: [
            { value: 'title', label: '活動名稱' },
            { value: 'startsAt', label: '開始時間' },
            { value: 'createdAt', label: '建立時間' },
            { value: 'requestCount', label: '點歌數量' }
          ]
        };

      case 'requests':
        return {
          title: '點歌請求搜尋',
          fields: [
            { id: 'keyword', type: 'text', label: '歌曲/用戶名', placeholder: '輸入歌曲名稱或用戶名' },
            { id: 'status', type: 'select', label: '狀態', options: [
              { value: '', label: '全部狀態' },
              { value: 'QUEUED', label: '排隊中' },
              { value: 'ASSIGNED', label: '已指派' },
              { value: 'ACCEPTED', label: '已接受' },
              { value: 'DECLINED', label: '已拒絕' },
              { value: 'PERFORMING', label: '演唱中' },
              { value: 'COMPLETED', label: '已完成' },
              { value: 'CANCELLED', label: '已取消' }
            ]},
            { id: 'eventId', type: 'text', label: '活動ID', placeholder: '輸入活動ID' },
            { id: 'singerId', type: 'text', label: '歌手ID', placeholder: '輸入歌手ID' },
            { id: 'playerId', type: 'text', label: '玩家ID', placeholder: '輸入玩家ID' }
          ],
          sortOptions: [
            { value: 'requestedAt', label: '點歌時間' },
            { value: 'updatedAt', label: '更新時間' },
            { value: 'priorityIndex', label: '優先級' },
            { value: 'status', label: '狀態' }
          ]
        };

      case 'singers':
        return {
          title: '歌手搜尋',
          fields: [
            { id: 'keyword', type: 'text', label: '歌手名稱', placeholder: '輸入歌手名稱' },
            { id: 'isActive', type: 'select', label: '狀態', options: [
              { value: '', label: '全部狀態' },
              { value: 'true', label: '啟用' },
              { value: 'false', label: '停用' }
            ]},
            { id: 'hasEvents', type: 'select', label: '參與活動', options: [
              { value: '', label: '全部' },
              { value: 'true', label: '有參與活動' },
              { value: 'false', label: '未參與活動' }
            ]}
          ],
          sortOptions: [
            { value: 'stageName', label: '藝名' },
            { value: 'createdAt', label: '加入時間' },
            { value: 'requestCount', label: '接受點歌數' },
            { value: 'rating', label: '評分' }
          ]
        };

      default:
        return {
          title: '搜尋',
          fields: [
            { id: 'keyword', type: 'text', label: '關鍵字', placeholder: '輸入搜尋關鍵字' }
          ],
          sortOptions: [
            { value: 'createdAt', label: '建立時間' },
            { value: 'updatedAt', label: '更新時間' }
          ]
        };
    }
  };

  const config = getFilterConfig();

  // 更新篩選值
  const updateFilter = (key, value) => {
    const newFilters = { ...filters };
    
    if (key.includes('.')) {
      // 處理嵌套屬性 (如 dateRange.startDate)
      const keys = key.split('.');
      let obj = newFilters;
      for (let i = 0; i < keys.length - 1; i++) {
        obj = obj[keys[i]];
      }
      obj[keys[keys.length - 1]] = value;
    } else {
      newFilters[key] = value;
    }
    
    setFilters(newFilters);
  };

  // 執行搜尋
  const handleSearch = () => {
    // 清理空值
    const cleanFilters = {};
    Object.keys(filters).forEach(key => {
      const value = filters[key];
      if (key === 'dateRange') {
        if (value.startDate || value.endDate) {
          cleanFilters[key] = value;
        }
      } else if (value !== '' && value !== null && value !== undefined) {
        cleanFilters[key] = value;
      }
    });

    onSearch(cleanFilters);
    setIsOpen(false);
  };

  // 重置篩選
  const handleReset = () => {
    const resetFilters = {
      keyword: '',
      dateRange: { startDate: '', endDate: '' },
      status: '',
      sortBy: '',
      sortOrder: 'desc',
      ...Object.keys(initialFilters).reduce((acc, key) => {
        acc[key] = '';
        return acc;
      }, {})
    };
    
    setFilters(resetFilters);
    onReset?.();
  };

  // 獲取已應用的篩選數量
  const getActiveFilterCount = () => {
    let count = 0;
    Object.keys(filters).forEach(key => {
      const value = filters[key];
      if (key === 'dateRange') {
        if (value.startDate || value.endDate) count++;
      } else if (value && value !== '' && key !== 'sortBy' && key !== 'sortOrder') {
        count++;
      }
    });
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  return (
    <div className={`advanced-search-filter ${className}`}>
      <button 
        className={`filter-toggle-btn ${isOpen ? 'active' : ''} ${activeFilterCount > 0 ? 'has-filters' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        🔍 {config.title}
        {activeFilterCount > 0 && (
          <span className="filter-count">{activeFilterCount}</span>
        )}
        <span className={`filter-arrow ${isOpen ? 'open' : ''}`}>▼</span>
      </button>

      {isOpen && (
        <div className="filter-panel">
          <div className="filter-header">
            <h4>{config.title}</h4>
            <button className="close-btn" onClick={() => setIsOpen(false)}>
              ✕
            </button>
          </div>

          <div className="filter-content">
            <div className="filter-grid">
              {config.fields.map(field => (
                <div key={field.id} className="filter-field">
                  <label>{field.label}</label>
                  
                  {field.type === 'text' && (
                    <input
                      type="text"
                      value={filters[field.id] || ''}
                      onChange={(e) => updateFilter(field.id, e.target.value)}
                      placeholder={field.placeholder}
                      className="filter-input"
                    />
                  )}

                  {field.type === 'select' && (
                    <select
                      value={filters[field.id] || ''}
                      onChange={(e) => updateFilter(field.id, e.target.value)}
                      className="filter-select"
                    >
                      {field.options.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  )}

                  {field.type === 'date' && (
                    <input
                      type="date"
                      value={filters[field.id] || ''}
                      onChange={(e) => updateFilter(field.id, e.target.value)}
                      className="filter-input"
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="date-range-section">
              <h5>日期範圍</h5>
              <div className="date-range-inputs">
                <div className="filter-field">
                  <label>開始日期</label>
                  <input
                    type="date"
                    value={filters.dateRange.startDate}
                    onChange={(e) => updateFilter('dateRange.startDate', e.target.value)}
                    className="filter-input"
                  />
                </div>
                <div className="filter-field">
                  <label>結束日期</label>
                  <input
                    type="date"
                    value={filters.dateRange.endDate}
                    onChange={(e) => updateFilter('dateRange.endDate', e.target.value)}
                    className="filter-input"
                  />
                </div>
              </div>
            </div>

            <div className="sort-section">
              <h5>排序</h5>
              <div className="sort-controls">
                <div className="filter-field">
                  <label>排序欄位</label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => updateFilter('sortBy', e.target.value)}
                    className="filter-select"
                  >
                    <option value="">預設排序</option>
                    {config.sortOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="filter-field">
                  <label>排序方式</label>
                  <select
                    value={filters.sortOrder}
                    onChange={(e) => updateFilter('sortOrder', e.target.value)}
                    className="filter-select"
                  >
                    <option value="desc">降序</option>
                    <option value="asc">升序</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="filter-actions">
            <button className="reset-btn" onClick={handleReset}>
              🔄 重置
            </button>
            <button className="search-btn" onClick={handleSearch}>
              🔍 搜尋
            </button>
          </div>
        </div>
      )}

      <style jsx="true">{`
        .advanced-search-filter {
          position: relative;
          display: inline-block;
        }

        .filter-toggle-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: linear-gradient(135deg, rgba(218, 165, 32, 0.1), rgba(255, 215, 0, 0.05));
          border: 2px solid rgba(218, 165, 32, 0.3);
          border-radius: 8px;
          color: #ffd700;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.2s ease;
          position: relative;
        }

        .filter-toggle-btn:hover {
          background: linear-gradient(135deg, rgba(218, 165, 32, 0.2), rgba(255, 215, 0, 0.1));
          border-color: rgba(218, 165, 32, 0.5);
        }

        .filter-toggle-btn.active {
          background: linear-gradient(135deg, rgba(218, 165, 32, 0.25), rgba(255, 215, 0, 0.15));
          border-color: #daa520;
        }

        .filter-toggle-btn.has-filters {
          border-color: #ffd700;
          box-shadow: 0 0 0 2px rgba(255, 215, 0, 0.2);
        }

        .filter-count {
          background: #ef4444;
          color: white;
          border-radius: 10px;
          padding: 2px 6px;
          font-size: 11px;
          font-weight: bold;
          min-width: 16px;
          text-align: center;
        }

        .filter-arrow {
          font-size: 12px;
          transition: transform 0.2s ease;
        }

        .filter-arrow.open {
          transform: rotate(180deg);
        }

        .filter-panel {
          position: absolute;
          top: 100%;
          left: 0;
          margin-top: 8px;
          min-width: 400px;
          max-width: 600px;
          background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
          border: 2px solid #daa520;
          border-radius: 12px;
          z-index: 1000;
          box-shadow: 0 20px 60px rgba(255, 215, 0, 0.3);
          color: #ffffff;
        }

        .filter-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
          border-bottom: 2px solid rgba(218, 165, 32, 0.3);
          border-radius: 10px 10px 0 0;
        }

        .filter-header h4 {
          margin: 0;
          color: #ffd700;
          font-size: 16px;
          font-weight: 600;
        }

        .close-btn {
          background: none;
          border: none;
          color: #cccccc;
          cursor: pointer;
          font-size: 18px;
          padding: 4px;
          border-radius: 4px;
          transition: all 0.2s ease;
        }

        .close-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #ffffff;
        }

        .filter-content {
          padding: 20px;
        }

        .filter-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .filter-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .filter-field label {
          color: #ffd700;
          font-size: 13px;
          font-weight: 600;
        }

        .filter-input,
        .filter-select {
          padding: 8px 12px;
          border: 2px solid rgba(218, 165, 32, 0.3);
          border-radius: 6px;
          background: rgba(255, 255, 255, 0.05);
          color: #ffffff;
          font-size: 13px;
          transition: all 0.2s ease;
        }

        .filter-input:focus,
        .filter-select:focus {
          outline: none;
          border-color: #daa520;
          box-shadow: 0 0 0 2px rgba(218, 165, 32, 0.2);
        }

        .filter-input::placeholder {
          color: #999999;
        }

        .date-range-section,
        .sort-section {
          margin-bottom: 24px;
          padding-top: 16px;
          border-top: 1px solid rgba(218, 165, 32, 0.2);
        }

        .date-range-section h5,
        .sort-section h5 {
          margin: 0 0 12px 0;
          color: #ffd700;
          font-size: 14px;
          font-weight: 600;
        }

        .date-range-inputs,
        .sort-controls {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .filter-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 16px 20px;
          background: rgba(0, 0, 0, 0.3);
          border-top: 1px solid rgba(218, 165, 32, 0.2);
          border-radius: 0 0 10px 10px;
        }

        .reset-btn,
        .search-btn {
          padding: 10px 20px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .reset-btn {
          background: rgba(255, 255, 255, 0.1);
          color: #cccccc;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .reset-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          border-color: #ffd700;
        }

        .search-btn {
          background: linear-gradient(135deg, #daa520 0%, #b8860b 100%);
          color: white;
          border: 1px solid #daa520;
        }

        .search-btn:hover {
          background: linear-gradient(135deg, #b8860b 0%, #9a7209 100%);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(218, 165, 32, 0.3);
        }

        @media (max-width: 768px) {
          .filter-panel {
            position: fixed;
            top: 50px;
            left: 10px;
            right: 10px;
            min-width: auto;
            max-width: none;
          }

          .filter-grid {
            grid-template-columns: 1fr;
          }

          .date-range-inputs,
          .sort-controls {
            grid-template-columns: 1fr;
          }

          .filter-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default AdvancedSearchFilter;