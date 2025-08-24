import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuthV2';
import AdvancedSearchFilter from './AdvancedSearchFilter';

const ReportSystemFullScreen = () => {
  const { user, canViewWidget } = useAuth();
  const [selectedReportType, setSelectedReportType] = useState('overview');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [filters, setFilters] = useState({
    eventId: '',
    singerId: '',
    userId: ''
  });
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [advancedFilters, setAdvancedFilters] = useState({});

  // 報表類型配置
  const reportTypes = [
    {
      id: 'overview',
      name: '系統概覽',
      description: '整體系統使用情況和統計數據',
      icon: '📊',
      permissions: ['SYSTEM_STATS']
    },
    {
      id: 'events',
      name: '活動報表',
      description: '活動統計和表現分析',
      icon: '🎪',
      permissions: ['EVENT_STATS']
    },
    {
      id: 'singers',
      name: '歌手表現',
      description: '歌手活動統計和評估',
      icon: '🎤',
      permissions: ['SINGER_MANAGEMENT']
    },
    {
      id: 'requests',
      name: '點歌統計',
      description: '點歌請求趨勢和熱門歌曲',
      icon: '🎵',
      permissions: ['SONG_REQUEST']
    },
    {
      id: 'users',
      name: '用戶分析',
      description: '用戶活躍度和使用模式',
      icon: '👥',
      permissions: ['USER_MANAGEMENT']
    },
    {
      id: 'export',
      name: '數據導出',
      description: '導出各類數據為CSV或JSON格式',
      icon: '📤',
      permissions: ['DATA_EXPORT']
    }
  ];

  // 模擬報表數據
  const mockReportData = {
    overview: {
      title: '系統概覽報表',
      period: '2024-01-01 至 2024-01-15',
      summary: {
        totalEvents: 12,
        activeEvents: 3,
        completedEvents: 8,
        totalRequests: 156,
        completedRequests: 128,
        totalSingers: 8,
        activeSingers: 6,
        totalUsers: 45,
        activeUsers: 32
      },
      charts: {
        dailyRequests: [
          { date: '01-10', requests: 12, completed: 10 },
          { date: '01-11', requests: 18, completed: 15 },
          { date: '01-12', requests: 22, completed: 19 },
          { date: '01-13', requests: 15, completed: 14 },
          { date: '01-14', requests: 25, completed: 22 },
          { date: '01-15', requests: 20, completed: 18 }
        ],
        topSongs: [
          { title: '告白氣球', artist: '周杰倫', requests: 15 },
          { title: '稻香', artist: '周杰倫', requests: 12 },
          { title: '夜曲', artist: '周杰倫', requests: 10 },
          { title: '晴天', artist: '周杰倫', requests: 9 },
          { title: '彩虹', artist: '周杰倫', requests: 8 }
        ]
      }
    },
    events: {
      title: '活動統計報表',
      events: [
        {
          id: 1,
          title: '春季卡拉OK大賽',
          date: '2024-01-15',
          status: '已完成',
          participants: 28,
          requests: 45,
          duration: '4小時',
          satisfaction: 4.8
        },
        {
          id: 2,
          title: '夏日音樂節',
          date: '2024-01-10',
          status: '已完成',
          participants: 32,
          requests: 52,
          duration: '5小時',
          satisfaction: 4.6
        }
      ]
    },
    singers: {
      title: '歌手表現分析',
      singers: [
        {
          id: 1,
          name: 'Alice',
          totalAssigned: 25,
          completed: 23,
          completionRate: 92,
          avgRating: 4.7,
          totalHours: 12.5
        },
        {
          id: 2,
          name: 'Bob',
          totalAssigned: 20,
          completed: 18,
          completionRate: 90,
          avgRating: 4.5,
          totalHours: 9.2
        }
      ]
    }
  };

  // 載入報表數據
  const loadReportData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 這裡應該根據選擇的報表類型調用對應的API
      // const response = await fetch(`/api/reports/${selectedReportType}`);
      // const data = await response.json();
      
      // 使用模擬數據
      setTimeout(() => {
        const data = mockReportData[selectedReportType];
        if (data) {
          setReportData(data);
        } else {
          setReportData(null);
          setError(`暫無 ${selectedReportType} 報表數據`);
        }
        setLoading(false);
      }, 1000);
    } catch (err) {
      setError('載入報表數據失敗');
      setReportData(null);
      setLoading(false);
    }
  };

  // 當報表類型改變時重新載入數據
  useEffect(() => {
    loadReportData();
  }, [selectedReportType]);

  // 導出數據
  const handleExport = async (format = 'CSV') => {
    try {
      setLoading(true);
      
      // 這裡應該調用導出API
      // const response = await fetch('/api/reports/export', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     entityType: selectedReportType,
      //     format,
      //     filters: { ...filters, ...dateRange }
      //   })
      // });
      
      // 模擬導出成功
      setTimeout(() => {
        alert(`${format} 格式的報表已開始下載`);
        setLoading(false);
      }, 1000);
    } catch (err) {
      setError('導出失敗');
      setLoading(false);
    }
  };

  // 渲染系統概覽報表
  const renderOverviewReport = () => {
    if (!reportData || !reportData.summary) {
      return (
        <div className="report-content">
          <div className="empty-state">
            <p>暫無統計數據</p>
          </div>
        </div>
      );
    }

    return (
      <div className="report-content">
        <div className="report-summary">
          <div className="summary-grid">
            <div className="summary-card">
              <div className="summary-icon">🎪</div>
              <div className="summary-info">
                <div className="summary-value">{reportData.summary.totalEvents || 0}</div>
                <div className="summary-label">總活動數</div>
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-icon">🎵</div>
              <div className="summary-info">
                <div className="summary-value">{reportData.summary.totalRequests || 0}</div>
                <div className="summary-label">總點歌數</div>
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-icon">🎤</div>
              <div className="summary-info">
                <div className="summary-value">{reportData.summary.totalSingers || 0}</div>
                <div className="summary-label">歌手數量</div>
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-icon">👥</div>
              <div className="summary-info">
                <div className="summary-value">{reportData.summary.totalUsers || 0}</div>
                <div className="summary-label">用戶數量</div>
              </div>
            </div>
          </div>
        </div>

        {reportData.charts && (
          <div className="charts-section">
            <div className="chart-container">
              <h4>每日點歌趨勢</h4>
              <div className="chart-placeholder">
                <div className="chart-bars">
                  {reportData.charts.dailyRequests && Array.isArray(reportData.charts.dailyRequests) ? 
                    reportData.charts.dailyRequests.map((day, index) => (
                      <div key={index} className="chart-bar-group">
                        <div 
                          className="chart-bar requests"
                          style={{ height: `${day.requests * 3}px` }}
                          title={`${day.date}: ${day.requests} 首點歌`}
                        />
                        <div 
                          className="chart-bar completed"
                          style={{ height: `${day.completed * 3}px` }}
                          title={`${day.date}: ${day.completed} 首完成`}
                        />
                        <div className="chart-label">{day.date}</div>
                      </div>
                    )) : (
                      <div className="no-data">暫無趨勢數據</div>
                    )
                  }
                </div>
              </div>
            </div>

            <div className="chart-container">
              <h4>熱門歌曲排行</h4>
              <div className="top-songs-list">
                {reportData.charts.topSongs && Array.isArray(reportData.charts.topSongs) ? 
                  reportData.charts.topSongs.map((song, index) => (
                    <div key={index} className="song-item">
                      <div className="song-rank">#{index + 1}</div>
                      <div className="song-info">
                        <div className="song-title">{song.title}</div>
                        <div className="song-artist">{song.artist}</div>
                      </div>
                      <div className="song-count">{song.requests} 次</div>
                    </div>
                  )) : (
                    <div className="no-data">暫無歌曲排行數據</div>
                  )
                }
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // 渲染活動報表
  const renderEventsReport = () => {
    if (!reportData || !reportData.events || !Array.isArray(reportData.events)) {
      return (
        <div className="report-content">
          <div className="empty-state">
            <p>暫無活動數據</p>
          </div>
        </div>
      );
    }

    return (
      <div className="report-content">
        <div className="events-table">
          <table>
            <thead>
              <tr>
                <th>活動名稱</th>
                <th>日期</th>
                <th>狀態</th>
                <th>參與人數</th>
                <th>點歌數量</th>
                <th>持續時間</th>
                <th>滿意度</th>
              </tr>
            </thead>
            <tbody>
              {reportData.events.map(event => (
                <tr key={event.id}>
                  <td>{event.title}</td>
                  <td>{event.date}</td>
                  <td>
                    <span className={`status ${event.status === '已完成' ? 'completed' : 'active'}`}>
                      {event.status}
                    </span>
                  </td>
                  <td>{event.participants}</td>
                  <td>{event.requests}</td>
                  <td>{event.duration}</td>
                  <td>
                    <div className="rating">
                      {'⭐'.repeat(Math.floor(event.satisfaction))} {event.satisfaction}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // 渲染歌手表現報表
  const renderSingersReport = () => {
    if (!reportData || !reportData.singers || !Array.isArray(reportData.singers)) {
      return (
        <div className="report-content">
          <div className="empty-state">
            <p>暫無歌手數據</p>
          </div>
        </div>
      );
    }

    return (
      <div className="report-content">
        <div className="singers-grid">
          {reportData.singers.map(singer => (
            <div key={singer.id} className="singer-card">
              <div className="singer-header">
                <h4>{singer.name}</h4>
                <div className="singer-rating">
                  {'⭐'.repeat(Math.floor(singer.avgRating))} {singer.avgRating}
                </div>
              </div>
              
              <div className="singer-stats">
                <div className="stat-item">
                  <span className="stat-label">指派數量:</span>
                  <span className="stat-value">{singer.totalAssigned}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">完成數量:</span>
                  <span className="stat-value">{singer.completed}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">完成率:</span>
                  <span className="stat-value">{singer.completionRate}%</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">總時數:</span>
                  <span className="stat-value">{singer.totalHours}小時</span>
                </div>
              </div>

              <div className="completion-bar">
                <div 
                  className="completion-fill"
                  style={{ width: `${singer.completionRate}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 渲染報表內容
  const renderReportContent = () => {
    if (loading) {
      return (
        <div className="loading-state">
          <div className="loading-spinner">⏳</div>
          <p>載入報表數據中...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h4>載入失敗</h4>
          <p>{error}</p>
          <button className="retry-btn" onClick={loadReportData}>
            重試
          </button>
        </div>
      );
    }

    switch (selectedReportType) {
      case 'overview':
        return renderOverviewReport();
      case 'events':
        return renderEventsReport();
      case 'singers':
        return renderSingersReport();
      case 'export':
        return (
          <div className="export-section">
            <h4>數據導出</h4>
            <p>選擇要導出的數據類型和格式</p>
            <div className="export-options">
              <button onClick={() => handleExport('CSV')} className="export-btn">
                📊 導出為 CSV
              </button>
              <button onClick={() => handleExport('JSON')} className="export-btn">
                📄 導出為 JSON
              </button>
            </div>
          </div>
        );
      default:
        return (
          <div className="empty-state">
            <p>選擇一個報表類型來查看數據</p>
          </div>
        );
    }
  };

  // 處理進階搜尋
  const handleAdvancedSearch = (filters) => {
    setAdvancedFilters(filters);
    
    // 根據篩選條件載入相關數據
    if (filters.entityType) {
      setSelectedReportType(filters.entityType);
    }
    
    loadReportData();
  };

  // 重置搜尋條件
  const handleResetSearch = () => {
    setAdvancedFilters({});
    loadReportData();
  };

  return (
    <div className="report-system-fullscreen">
      <div className="report-sidebar">
        <div className="sidebar-header">
          <h3>📊 報表中心</h3>
          <p>數據分析與統計</p>
        </div>

        <div className="report-types">
          {reportTypes.map(reportType => {
            const hasPermission = reportType.permissions.some(permission => 
              canViewWidget(permission)
            );

            if (!hasPermission) return null;

            return (
              <button
                key={reportType.id}
                className={`report-type-btn ${selectedReportType === reportType.id ? 'active' : ''}`}
                onClick={() => setSelectedReportType(reportType.id)}
              >
                <div className="report-icon">{reportType.icon}</div>
                <div className="report-info">
                  <div className="report-name">{reportType.name}</div>
                  <div className="report-desc">{reportType.description}</div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="filters-section">
          <h4>進階搜尋</h4>
          
          <AdvancedSearchFilter
            entityType={selectedReportType}
            onSearch={handleAdvancedSearch}
            onReset={handleResetSearch}
            initialFilters={advancedFilters}
            className="sidebar-advanced-search"
          />
          
          {Object.keys(advancedFilters).length === 0 && (
            <div className="basic-filters">
              <div className="filter-group">
                <label>開始日期</label>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                  className="filter-input"
                />
              </div>
              
              <div className="filter-group">
                <label>結束日期</label>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                  className="filter-input"
                />
              </div>

              <button className="apply-filters-btn" onClick={loadReportData}>
                應用篩選
              </button>
            </div>
          )}
          
          {/* Active Filters Display */}
          {Object.keys(advancedFilters).length > 0 && (
            <div className="active-filters-sidebar">
              <div className="filters-label">啟用的篩選:</div>
              {advancedFilters.keyword && (
                <div className="filter-chip">關鍵字: {advancedFilters.keyword}</div>
              )}
              {advancedFilters.dateRange && (
                <div className="filter-chip">
                  日期範圍: {advancedFilters.dateRange.startDate || '開始'} - {advancedFilters.dateRange.endDate || '結束'}
                </div>
              )}
              {advancedFilters.sortBy && (
                <div className="filter-chip">排序: {advancedFilters.sortBy}</div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="report-main">
        <div className="report-header">
          <div className="report-title">
            <h2>
              {reportTypes.find(t => t.id === selectedReportType)?.name || '報表'}
            </h2>
            <p>
              {reportTypes.find(t => t.id === selectedReportType)?.description}
            </p>
          </div>
          
          <div className="report-actions">
            <button 
              className="refresh-btn"
              onClick={loadReportData}
              disabled={loading}
            >
              🔄 刷新
            </button>
            <button 
              className="export-btn"
              onClick={() => handleExport('CSV')}
              disabled={loading}
            >
              📤 導出
            </button>
          </div>
        </div>

        <div className="report-body">
          {renderReportContent()}
        </div>
      </div>

      <style jsx="true">{`
        .report-system-fullscreen {
          height: 100%;
          display: flex;
          background: transparent;
          color: #ffffff;
        }

        .report-sidebar {
          width: 320px;
          background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
          border-right: 2px solid #daa520;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
        }

        .sidebar-header {
          padding: 24px;
          background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
          border-bottom: 2px solid rgba(218, 165, 32, 0.3);
        }

        .sidebar-header h3 {
          margin: 0 0 4px 0;
          color: #ffd700;
          font-size: 18px;
          font-weight: 700;
        }

        .sidebar-header p {
          margin: 0;
          color: #d4af37;
          font-size: 14px;
        }

        .report-types {
          padding: 16px;
          flex: 1;
        }

        .report-type-btn {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          margin-bottom: 8px;
          background: rgba(255, 255, 255, 0.05);
          border: 2px solid transparent;
          border-radius: 12px;
          color: #cccccc;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
        }

        .report-type-btn:hover {
          background: rgba(255, 215, 0, 0.1);
          border-color: rgba(218, 165, 32, 0.3);
        }

        .report-type-btn.active {
          background: linear-gradient(135deg, rgba(218, 165, 32, 0.15), rgba(255, 215, 0, 0.15));
          border-color: #daa520;
          color: #ffd700;
        }

        .report-icon {
          font-size: 24px;
          flex-shrink: 0;
        }

        .report-info {
          flex: 1;
        }

        .report-name {
          font-weight: 600;
          margin-bottom: 4px;
        }

        .report-desc {
          font-size: 12px;
          opacity: 0.8;
          line-height: 1.3;
        }

        .filters-section {
          padding: 16px;
          border-top: 1px solid rgba(218, 165, 32, 0.2);
        }

        .filters-section h4 {
          margin: 0 0 16px 0;
          color: #ffd700;
          font-size: 14px;
          font-weight: 600;
        }
        
        .sidebar-advanced-search {
          margin-bottom: 16px;
        }
        
        .basic-filters {
          margin-top: 12px;
        }
        
        .active-filters-sidebar {
          margin-top: 16px;
          padding: 12px;
          background: rgba(218, 165, 32, 0.1);
          border-radius: 8px;
          border: 1px solid rgba(218, 165, 32, 0.3);
        }
        
        .active-filters-sidebar .filters-label {
          color: #ffd700;
          font-weight: 600;
          font-size: 13px;
          margin-bottom: 8px;
          display: block;
        }
        
        .active-filters-sidebar .filter-chip {
          background: linear-gradient(135deg, #daa520, #b8860b);
          color: white;
          padding: 3px 8px;
          border-radius: 10px;
          font-size: 11px;
          font-weight: 500;
          margin: 2px 0;
          display: block;
        }

        .filter-group {
          margin-bottom: 16px;
        }

        .filter-group label {
          display: block;
          margin-bottom: 6px;
          color: #cccccc;
          font-size: 13px;
        }

        .filter-input {
          width: 100%;
          padding: 8px 12px;
          border: 2px solid rgba(218, 165, 32, 0.3);
          border-radius: 6px;
          background: rgba(255, 255, 255, 0.05);
          color: #ffffff;
          font-size: 13px;
        }

        .filter-input:focus {
          outline: none;
          border-color: #daa520;
        }

        .apply-filters-btn {
          width: 100%;
          padding: 10px;
          background: linear-gradient(135deg, #daa520 0%, #b8860b 100%);
          border: none;
          border-radius: 6px;
          color: white;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .apply-filters-btn:hover {
          background: linear-gradient(135deg, #b8860b 0%, #9a7209 100%);
        }

        .report-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .report-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px 32px;
          background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
          border-bottom: 2px solid rgba(218, 165, 32, 0.3);
        }

        .report-title h2 {
          margin: 0 0 4px 0;
          color: #ffd700;
          font-size: 24px;
          font-weight: 700;
        }

        .report-title p {
          margin: 0;
          color: #d4af37;
          font-size: 14px;
        }

        .report-actions {
          display: flex;
          gap: 12px;
        }

        .refresh-btn, .export-btn {
          padding: 10px 16px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 6px;
          color: #cccccc;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s ease;
        }

        .refresh-btn:hover, .export-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          border-color: #ffd700;
        }

        .refresh-btn:disabled, .export-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .report-body {
          flex: 1;
          overflow-y: auto;
          padding: 32px;
        }

        .loading-state, .error-state, .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 400px;
          text-align: center;
        }

        .loading-spinner, .error-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .loading-spinner {
          animation: spin 2s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .retry-btn {
          margin-top: 16px;
          padding: 8px 16px;
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        /* 報表內容樣式 */
        .report-content {
          color: #ffffff;
        }

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 32px;
        }

        .summary-card {
          background: linear-gradient(135deg, rgba(218, 165, 32, 0.1), rgba(255, 215, 0, 0.05));
          border: 1px solid rgba(218, 165, 32, 0.3);
          border-radius: 12px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .summary-icon {
          font-size: 32px;
        }

        .summary-value {
          font-size: 28px;
          font-weight: 700;
          color: #ffd700;
          margin-bottom: 4px;
        }

        .summary-label {
          font-size: 14px;
          color: #cccccc;
        }

        .charts-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 32px;
        }

        .chart-container {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(218, 165, 32, 0.2);
          border-radius: 12px;
          padding: 24px;
        }

        .chart-container h4 {
          margin: 0 0 20px 0;
          color: #ffd700;
          font-size: 16px;
        }

        .chart-bars {
          display: flex;
          align-items: flex-end;
          justify-content: space-around;
          height: 200px;
          gap: 8px;
        }

        .chart-bar-group {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }

        .chart-bar {
          width: 16px;
          border-radius: 2px;
          min-height: 10px;
        }

        .chart-bar.requests {
          background: #3b82f6;
        }

        .chart-bar.completed {
          background: #10b981;
        }

        .chart-label {
          font-size: 12px;
          color: #cccccc;
          margin-top: 8px;
        }

        .top-songs-list {
          space-y: 12px;
        }

        .song-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 12px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          margin-bottom: 8px;
        }

        .song-rank {
          font-size: 18px;
          font-weight: 700;
          color: #ffd700;
          min-width: 30px;
        }

        .song-info {
          flex: 1;
        }

        .song-title {
          font-weight: 600;
          margin-bottom: 2px;
        }

        .song-artist {
          font-size: 12px;
          color: #cccccc;
        }

        .song-count {
          font-weight: 600;
          color: #10b981;
        }

        /* 表格樣式 */
        .events-table {
          overflow-x: auto;
        }

        .events-table table {
          width: 100%;
          border-collapse: collapse;
        }

        .events-table th,
        .events-table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid rgba(218, 165, 32, 0.2);
        }

        .events-table th {
          background: rgba(218, 165, 32, 0.1);
          color: #ffd700;
          font-weight: 600;
        }

        .status.completed {
          color: #10b981;
        }

        .status.active {
          color: #f59e0b;
        }

        .rating {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        /* 歌手卡片樣式 */
        .singers-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 24px;
        }

        .singer-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(218, 165, 32, 0.2);
          border-radius: 12px;
          padding: 24px;
        }

        .singer-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .singer-header h4 {
          margin: 0;
          color: #ffd700;
        }

        .singer-stats {
          margin-bottom: 16px;
        }

        .stat-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .stat-label {
          color: #cccccc;
        }

        .stat-value {
          color: #ffffff;
          font-weight: 600;
        }

        .completion-bar {
          height: 8px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          overflow: hidden;
        }

        .completion-fill {
          height: 100%;
          background: linear-gradient(90deg, #10b981 0%, #34d399 100%);
          transition: width 0.3s ease;
        }

        /* 導出區域 */
        .export-section {
          text-align: center;
          padding: 60px;
        }
        
        /* 無數據狀態 */
        .no-data {
          text-align: center;
          color: #999999;
          font-style: italic;
          padding: 20px;
        }

        .export-section h4 {
          color: #ffd700;
          margin-bottom: 16px;
        }

        .export-options {
          display: flex;
          justify-content: center;
          gap: 16px;
          margin-top: 24px;
        }

        .export-section .export-btn {
          padding: 12px 24px;
          background: linear-gradient(135deg, #daa520 0%, #b8860b 100%);
          border: none;
          border-radius: 8px;
          color: white;
          font-weight: 600;
          cursor: pointer;
        }

        @media (max-width: 768px) {
          .report-system-fullscreen {
            flex-direction: column;
          }

          .report-sidebar {
            width: 100%;
            height: auto;
            max-height: 200px;
          }

          .charts-section {
            grid-template-columns: 1fr;
          }

          .summary-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .singers-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default ReportSystemFullScreen;