import React, { useState, useEffect } from 'react';
import websocketService from '../services/websocket-simple';
import { sessionManager } from '../services/sessionManager';
import { performanceMonitor } from '../services/performanceMonitor-simple';
import { securityManager } from '../services/securityManager';

const SystemDashboard = ({ isVisible = false, onClose }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardData, setDashboardData] = useState({
    session: null,
    performance: null,
    security: null,
    websocket: null
  });
  const [refreshInterval, setRefreshInterval] = useState(null);

  useEffect(() => {
    if (isVisible) {
      updateDashboardData();
      const interval = setInterval(updateDashboardData, 5000);
      setRefreshInterval(interval);
    } else {
      if (refreshInterval) {
        clearInterval(refreshInterval);
        setRefreshInterval(null);
      }
    }

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [isVisible]);

  const updateDashboardData = () => {
    const session = sessionManager.getSessionStats();
    const performance = performanceMonitor.getRealTimeMetrics();
    const security = securityManager.getSecurityStats();
    const websocket = websocketService.getConnectionStatus();

    setDashboardData({
      session,
      performance,
      security,
      websocket
    });
  };

  const formatDuration = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getRiskColor = (level) => {
    const colors = {
      low: '#4caf50',
      medium: '#ff9800', 
      high: '#ff5722',
      critical: '#f44336'
    };
    return colors[level] || '#9e9e9e';
  };

  const getPerformanceColor = (score) => {
    if (score >= 90) return '#4caf50';
    if (score >= 70) return '#8bc34a';
    if (score >= 50) return '#ff9800';
    return '#f44336';
  };

  if (!isVisible) return null;

  return (
    <div className="system-dashboard-overlay">
      <div className="system-dashboard">
        <div className="dashboard-header">
          <h2>系統監控儀表板</h2>
          <button onClick={onClose} className="close-button">×</button>
        </div>

        <div className="dashboard-tabs">
          <button 
            className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            總覽
          </button>
          <button 
            className={`tab ${activeTab === 'performance' ? 'active' : ''}`}
            onClick={() => setActiveTab('performance')}
          >
            性能
          </button>
          <button 
            className={`tab ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            安全
          </button>
          <button 
            className={`tab ${activeTab === 'session' ? 'active' : ''}`}
            onClick={() => setActiveTab('session')}
          >
            會話
          </button>
        </div>

        <div className="dashboard-content">
          {activeTab === 'overview' && (
            <div className="overview-grid">
              <div className="overview-card">
                <h3>WebSocket 連接</h3>
                <div className="status-indicator">
                  <span className={`status-dot ${dashboardData.websocket?.isConnected ? 'connected' : 'disconnected'}`}></span>
                  <span>{dashboardData.websocket?.isConnected ? '已連接' : '未連接'}</span>
                </div>
                {dashboardData.websocket?.fallbackMode && (
                  <div className="warning">⚠️ 降級模式</div>
                )}
                {dashboardData.websocket?.offlineQueueSize > 0 && (
                  <div className="info">📤 待發送: {dashboardData.websocket.offlineQueueSize}</div>
                )}
              </div>

              <div className="overview-card">
                <h3>性能評分</h3>
                <div className="score-display">
                  <span 
                    className="score-number"
                    style={{ color: getPerformanceColor(dashboardData.performance?.summary?.overallScore || 0) }}
                  >
                    {dashboardData.performance?.summary?.overallScore || 'N/A'}
                  </span>
                  <span className="score-unit">/100</span>
                </div>
                {dashboardData.performance?.memoryUsage && (
                  <div className="memory-info">
                    記憶體: {dashboardData.performance.memoryUsage.used}MB / {dashboardData.performance.memoryUsage.limit}MB
                  </div>
                )}
              </div>

              <div className="overview-card">
                <h3>安全狀態</h3>
                <div className="risk-display">
                  <span 
                    className="risk-level"
                    style={{ color: getRiskColor(dashboardData.security?.riskLevel || 'low') }}
                  >
                    {dashboardData.security?.riskLevel?.toUpperCase() || 'UNKNOWN'}
                  </span>
                </div>
                <div className="security-events">
                  最近事件: {dashboardData.security?.recentEvents || 0}
                </div>
              </div>

              <div className="overview-card">
                <h3>會話信息</h3>
                {dashboardData.session ? (
                  <>
                    <div className="session-duration">
                      持續時間: {formatDuration(dashboardData.session.duration)}
                    </div>
                    <div className="session-platform">
                      平台: {dashboardData.session.platform}
                    </div>
                    <div className="device-info">
                      設備: {dashboardData.session.deviceId.slice(-8)}
                    </div>
                  </>
                ) : (
                  <div className="no-session">無活動會話</div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'performance' && (
            <div className="performance-details">
              {dashboardData.performance?.summary && (
                <div className="performance-categories">
                  {Object.entries(dashboardData.performance.summary.categories || {}).map(([category, data]) => (
                    <div key={category} className="category-card">
                      <h4>{category === 'pageLoad' ? '頁面加載' : category === 'websocket' ? 'WebSocket' : category === 'render' ? '渲染' : category}</h4>
                      <div className="category-score" style={{ color: getPerformanceColor(data.score) }}>
                        {data.score}/100
                      </div>
                      <div className="category-status">{data.status === 'good' ? '良好' : data.status === 'needs-improvement' ? '需要改進' : '較差'}</div>
                      {data.avgTime && (
                        <div className="category-time">平均: {data.avgTime}ms</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {dashboardData.performance?.memoryUsage && (
                <div className="memory-details">
                  <h4>記憶體使用</h4>
                  <div className="memory-bar">
                    <div 
                      className="memory-fill"
                      style={{ 
                        width: `${dashboardData.performance.memoryUsage.usage}%`,
                        backgroundColor: dashboardData.performance.memoryUsage.usage > 80 ? '#f44336' : '#4caf50'
                      }}
                    ></div>
                  </div>
                  <div className="memory-text">
                    {dashboardData.performance.memoryUsage.used}MB / {dashboardData.performance.memoryUsage.limit}MB 
                    ({dashboardData.performance.memoryUsage.usage}%)
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'security' && (
            <div className="security-details">
              {dashboardData.security && (
                <>
                  <div className="security-overview">
                    <div className="risk-card">
                      <h4>風險評估</h4>
                      <div className="risk-score" style={{ color: getRiskColor(dashboardData.security.riskLevel) }}>
                        {dashboardData.security.riskScore}/100
                      </div>
                      <div className="risk-label">{dashboardData.security.riskLevel?.toUpperCase()}</div>
                    </div>
                  </div>

                  <div className="security-events">
                    <h4>安全事件統計</h4>
                    {Object.entries(dashboardData.security.eventsByType || {}).map(([type, count]) => (
                      <div key={type} className="event-row">
                        <span className="event-type">{type}</span>
                        <span className="event-count">{count}</span>
                      </div>
                    ))}
                  </div>

                  <div className="rate-limit-status">
                    <h4>請求限流狀態</h4>
                    {Object.entries(dashboardData.security.rateLimitStatus || {}).map(([action, status]) => (
                      <div key={action} className="limit-row">
                        <span className="action-name">{action}</span>
                        <div className="utilization-bar">
                          <div 
                            className="utilization-fill"
                            style={{ 
                              width: `${status.utilization}%`,
                              backgroundColor: status.utilization > 80 ? '#f44336' : '#4caf50'
                            }}
                          ></div>
                        </div>
                        <span className="utilization-text">{status.utilization}%</span>
                      </div>
                    ))}
                  </div>

                  {dashboardData.security.recommendations?.length > 0 && (
                    <div className="security-recommendations">
                      <h4>安全建議</h4>
                      {dashboardData.security.recommendations.map((rec, index) => (
                        <div key={index} className="recommendation">{rec}</div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === 'session' && (
            <div className="session-details">
              {dashboardData.session ? (
                <>
                  <div className="session-info-grid">
                    <div className="session-card">
                      <h4>會話詳情</h4>
                      <div className="info-row">
                        <span>會話ID:</span>
                        <span>{dashboardData.session.sessionId?.slice(-12) || 'N/A'}</span>
                      </div>
                      <div className="info-row">
                        <span>設備ID:</span>
                        <span>{dashboardData.session.deviceId?.slice(-8) || 'N/A'}</span>
                      </div>
                      <div className="info-row">
                        <span>平台:</span>
                        <span>{dashboardData.session.platform}</span>
                      </div>
                      <div className="info-row">
                        <span>狀態:</span>
                        <span className={dashboardData.session.isActive ? 'active' : 'inactive'}>
                          {dashboardData.session.isActive ? '活躍' : '非活躍'}
                        </span>
                      </div>
                    </div>

                    <div className="session-card">
                      <h4>時間統計</h4>
                      <div className="info-row">
                        <span>開始時間:</span>
                        <span>{new Date(dashboardData.session.startTime).toLocaleTimeString()}</span>
                      </div>
                      <div className="info-row">
                        <span>持續時間:</span>
                        <span>{formatDuration(dashboardData.session.duration)}</span>
                      </div>
                      <div className="info-row">
                        <span>最後活動:</span>
                        <span>{new Date(dashboardData.session.lastActivity).toLocaleTimeString()}</span>
                      </div>
                      <div className="info-row">
                        <span>非活躍時間:</span>
                        <span>{formatDuration(dashboardData.session.inactiveTime)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="session-features">
                    <h4>功能設置</h4>
                    <div className="feature-row">
                      <span>跨設備同步:</span>
                      <span className={dashboardData.session.crossDeviceSync ? 'enabled' : 'disabled'}>
                        {dashboardData.session.crossDeviceSync ? '啟用' : '禁用'}
                      </span>
                    </div>
                    <div className="feature-row">
                      <span>連接狀態:</span>
                      <span className={dashboardData.session.connectionStatus?.isConnected ? 'connected' : 'disconnected'}>
                        {dashboardData.session.connectionStatus?.isConnected ? '已連接' : '未連接'}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="no-session-info">
                  <p>無可用的會話信息</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="dashboard-footer">
          <button onClick={updateDashboardData} className="refresh-button">
            🔄 刷新數據
          </button>
          <span className="last-update">
            最後更新: {new Date().toLocaleTimeString()}
          </span>
        </div>
      </div>

      <style jsx="true">{`
        .system-dashboard-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }

        .system-dashboard {
          background: #1e1e1e;
          border-radius: 12px;
          width: 90vw;
          max-width: 1200px;
          height: 80vh;
          max-height: 800px;
          display: flex;
          flex-direction: column;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #333;
        }

        .dashboard-header h2 {
          color: #ffffff;
          margin: 0;
          font-size: 20px;
        }

        .close-button {
          background: none;
          border: none;
          color: #ffffff;
          font-size: 24px;
          cursor: pointer;
          padding: 5px;
          border-radius: 50%;
          transition: background 0.3s;
        }

        .close-button:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .dashboard-tabs {
          display: flex;
          border-bottom: 1px solid #333;
        }

        .tab {
          background: none;
          border: none;
          color: #cccccc;
          padding: 15px 25px;
          cursor: pointer;
          transition: all 0.3s;
          border-bottom: 2px solid transparent;
        }

        .tab:hover {
          background: rgba(255, 255, 255, 0.05);
          color: #ffffff;
        }

        .tab.active {
          color: #4caf50;
          border-bottom-color: #4caf50;
          background: rgba(76, 175, 80, 0.1);
        }

        .dashboard-content {
          flex: 1;
          padding: 20px;
          overflow-y: auto;
        }

        .overview-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
          margin-bottom: 20px;
        }

        .overview-card {
          background: #2a2a2a;
          border-radius: 8px;
          padding: 20px;
          border: 1px solid #333;
        }

        .overview-card h3 {
          color: #ffffff;
          margin: 0 0 15px 0;
          font-size: 16px;
        }

        .status-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 10px;
        }

        .status-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }

        .status-dot.connected {
          background: #4caf50;
          box-shadow: 0 0 8px rgba(76, 175, 80, 0.5);
        }

        .status-dot.disconnected {
          background: #f44336;
        }

        .score-display {
          display: flex;
          align-items: baseline;
          gap: 5px;
        }

        .score-number {
          font-size: 32px;
          font-weight: bold;
        }

        .score-unit {
          color: #cccccc;
          font-size: 16px;
        }

        .warning {
          color: #ff9800;
          font-size: 14px;
          margin: 5px 0;
        }

        .info {
          color: #2196f3;
          font-size: 14px;
          margin: 5px 0;
        }

        .performance-categories {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          margin-bottom: 20px;
        }

        .category-card {
          background: #2a2a2a;
          border-radius: 8px;
          padding: 15px;
          border: 1px solid #333;
        }

        .category-card h4 {
          color: #ffffff;
          margin: 0 0 10px 0;
          font-size: 14px;
        }

        .category-score {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 5px;
        }

        .category-status {
          color: #cccccc;
          font-size: 12px;
          margin-bottom: 5px;
        }

        .category-time {
          color: #888;
          font-size: 11px;
        }

        .memory-details {
          background: #2a2a2a;
          border-radius: 8px;
          padding: 20px;
          border: 1px solid #333;
        }

        .memory-details h4 {
          color: #ffffff;
          margin: 0 0 15px 0;
        }

        .memory-bar {
          width: 100%;
          height: 8px;
          background: #333;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 10px;
        }

        .memory-fill {
          height: 100%;
          transition: width 0.3s ease;
        }

        .memory-text {
          color: #cccccc;
          font-size: 14px;
        }

        .security-overview {
          margin-bottom: 20px;
        }

        .risk-card {
          background: #2a2a2a;
          border-radius: 8px;
          padding: 20px;
          border: 1px solid #333;
          text-align: center;
        }

        .risk-card h4 {
          color: #ffffff;
          margin: 0 0 15px 0;
        }

        .risk-score {
          font-size: 36px;
          font-weight: bold;
          margin-bottom: 5px;
        }

        .risk-label {
          font-size: 14px;
          font-weight: bold;
        }

        .security-events, .rate-limit-status, .security-recommendations {
          background: #2a2a2a;
          border-radius: 8px;
          padding: 20px;
          border: 1px solid #333;
          margin-bottom: 20px;
        }

        .security-events h4, .rate-limit-status h4, .security-recommendations h4 {
          color: #ffffff;
          margin: 0 0 15px 0;
        }

        .event-row, .limit-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid #333;
        }

        .event-row:last-child, .limit-row:last-child {
          border-bottom: none;
        }

        .event-type, .action-name {
          color: #cccccc;
          font-size: 14px;
        }

        .event-count {
          color: #ffffff;
          font-weight: bold;
        }

        .utilization-bar {
          width: 100px;
          height: 6px;
          background: #333;
          border-radius: 3px;
          overflow: hidden;
          margin: 0 10px;
        }

        .utilization-fill {
          height: 100%;
          transition: width 0.3s ease;
        }

        .utilization-text {
          color: #ffffff;
          font-size: 12px;
          min-width: 35px;
          text-align: right;
        }

        .recommendation {
          color: #ffeb3b;
          font-size: 14px;
          padding: 5px 0;
          border-left: 3px solid #ff9800;
          padding-left: 10px;
          margin-bottom: 8px;
        }

        .session-info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
          margin-bottom: 20px;
        }

        .session-card {
          background: #2a2a2a;
          border-radius: 8px;
          padding: 20px;
          border: 1px solid #333;
        }

        .session-card h4 {
          color: #ffffff;
          margin: 0 0 15px 0;
        }

        .info-row, .feature-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #333;
        }

        .info-row:last-child, .feature-row:last-child {
          border-bottom: none;
        }

        .info-row span:first-child, .feature-row span:first-child {
          color: #cccccc;
        }

        .info-row span:last-child, .feature-row span:last-child {
          color: #ffffff;
          font-weight: 500;
        }

        .active {
          color: #4caf50 !important;
        }

        .inactive {
          color: #f44336 !important;
        }

        .enabled {
          color: #4caf50 !important;
        }

        .disabled {
          color: #f44336 !important;
        }

        .connected {
          color: #4caf50 !important;
        }

        .disconnected {
          color: #f44336 !important;
        }

        .session-features {
          background: #2a2a2a;
          border-radius: 8px;
          padding: 20px;
          border: 1px solid #333;
        }

        .session-features h4 {
          color: #ffffff;
          margin: 0 0 15px 0;
        }

        .no-session-info {
          text-align: center;
          color: #888;
          padding: 40px;
        }

        .dashboard-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px 20px;
          border-top: 1px solid #333;
          background: #2a2a2a;
        }

        .refresh-button {
          background: #4caf50;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          transition: background 0.3s;
        }

        .refresh-button:hover {
          background: #45a049;
        }

        .last-update {
          color: #888;
          font-size: 12px;
        }

        /* 響應式設計 */
        @media (max-width: 768px) {
          .system-dashboard {
            width: 95vw;
            height: 90vh;
          }

          .overview-grid {
            grid-template-columns: 1fr;
          }

          .performance-categories {
            grid-template-columns: 1fr;
          }

          .session-info-grid {
            grid-template-columns: 1fr;
          }

          .dashboard-header {
            padding: 15px;
          }

          .dashboard-content {
            padding: 15px;
          }
        }
      `}</style>
    </div>
  );
};

export default SystemDashboard;