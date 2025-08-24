import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuthV2';

const MyRequestDashboard = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('status'); // 'status', 'history', 'analytics'
  const [filters, setFilters] = useState({
    status: 'ALL',
    page: 1,
    limit: 10
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab, filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // 暫時使用模擬數據以避免 API 錯誤
      const mockStatus = {
        summary: {
          totalRequests: 3,
          currentQueue: 1,
          statusBreakdown: {
            QUEUED: 1,
            COMPLETED: 2,
            CANCELLED: 0
          }
        },
        currentRequests: [
          {
            id: 1,
            song: { title: '愛你', originalArtist: '王心凌' },
            status: 'QUEUED',
            requestedAt: new Date().toISOString(),
            queuePosition: 1
          }
        ]
      };
      
      const mockAnalytics = {
        totalRequests: 3,
        completedRequests: 2,
        successRate: 66.7,
        averageWaitTime: 300000, // 5 minutes
        mostRequestedSongs: [
          { title: '愛你', artist: '王心凌', count: 2 }
        ],
        favoriteGenres: [
          { genre: '流行', count: 3 }
        ],
        preferredSingers: [
          { name: '小美', count: 2 }
        ]
      };
      
      setStatus(mockStatus);
      setAnalytics(mockAnalytics);
      
      // 嘗試獲取真實數據，但不會因失敗而中斷
      try {
        const [statusRes, analyticsRes] = await Promise.all([
          api.get('/song-requests/my-status').catch(() => null),
          api.get('/song-requests/my-analytics?days=30').catch(() => null)
        ]);
        
        if (statusRes?.data) setStatus(statusRes.data);
        if (analyticsRes?.data) setAnalytics(analyticsRes.data);
      } catch (apiErr) {
        console.warn('API calls failed, using mock data:', apiErr);
      }
    } catch (err) {
      setError('Failed to fetch data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await api.get(`/song-requests/my-history?page=${filters.page}&limit=${filters.limit}&status=${filters.status}`);
      setHistory(response.data);
    } catch (err) {
      console.error('Error fetching history:', err);
    }
  };

  const formatDuration = (ms) => {
    const minutes = Math.floor(ms / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('zh-TW');
  };

  const getStatusColor = (status) => {
    const colors = {
      QUEUED: 'bg-yellow-100 text-yellow-800',
      ASSIGNED: 'bg-blue-100 text-blue-800',
      ACCEPTED: 'bg-green-100 text-green-800',
      PERFORMING: 'bg-purple-100 text-purple-800',
      COMPLETED: 'bg-gray-100 text-gray-800',
      CANCELLED: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status) => {
    const texts = {
      QUEUED: '排隊中',
      ASSIGNED: '已指派',
      ACCEPTED: '已接受',
      PERFORMING: '演唱中',
      COMPLETED: '已完成',
      CANCELLED: '已取消'
    };
    return texts[status] || status;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-4">
        <p>{error}</p>
        <button 
          onClick={fetchData}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          重新載入
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('status')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'status'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              目前狀態
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'history'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              點歌歷史
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'analytics'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              統計分析
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'status' && (
            <div className="space-y-6">
              {/* 統計摘要 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-800">總計點歌</h3>
                  <p className="text-2xl font-bold text-blue-600">{status?.summary?.totalRequests || 0}</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-yellow-800">排隊中</h3>
                  <p className="text-2xl font-bold text-yellow-600">{status?.summary?.currentQueue || 0}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800">已完成</h3>
                  <p className="text-2xl font-bold text-green-600">{status?.summary?.statusBreakdown?.COMPLETED || 0}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-purple-800">最近完成</h3>
                  <p className="text-2xl font-bold text-purple-600">{status?.summary?.recentlyCompleted || 0}</p>
                </div>
              </div>

              {/* 目前排隊的歌曲 */}
              {status?.currentRequests?.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">目前排隊的歌曲</h3>
                  <div className="space-y-3">
                    {status.currentRequests.map((request) => (
                      <div key={request.id} className="bg-gray-50 p-4 rounded-lg flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{request.song.title}</h4>
                          <p className="text-sm text-gray-600">
                            {request.song.originalArtist} • 演唱者: {request.singer?.user?.displayName || request.singer?.stageName || '待指派'}
                          </p>
                          <p className="text-xs text-gray-500">
                            點歌時間: {formatDateTime(request.requestedAt)}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                            {getStatusText(request.status)}
                          </span>
                          {request.queuePosition > 0 && (
                            <p className="text-sm text-gray-600 mt-1">
                              第 {request.queuePosition} 位
                            </p>
                          )}
                          {request.estimatedWaitTime > 0 && (
                            <p className="text-xs text-gray-500">
                              預計等待: {formatDuration(request.estimatedWaitTime)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 最近完成的歌曲 */}
              {status?.recentCompleted?.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">最近完成的歌曲</h3>
                  <div className="space-y-3">
                    {status.recentCompleted.map((request) => (
                      <div key={request.id} className="bg-green-50 p-4 rounded-lg flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{request.song.title}</h4>
                          <p className="text-sm text-gray-600">
                            {request.song.originalArtist} • 演唱者: {request.singer?.user?.displayName || request.singer?.stageName}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                            {getStatusText(request.status)}
                          </span>
                          <p className="text-xs text-gray-500 mt-1">
                            完成時間: {formatDateTime(request.updatedAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              {/* 篩選器 */}
              <div className="flex gap-4">
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({...filters, status: e.target.value, page: 1})}
                  className="border rounded px-3 py-2"
                >
                  <option value="ALL">全部狀態</option>
                  <option value="QUEUED">排隊中</option>
                  <option value="ASSIGNED">已指派</option>
                  <option value="ACCEPTED">已接受</option>
                  <option value="PERFORMING">演唱中</option>
                  <option value="COMPLETED">已完成</option>
                  <option value="CANCELLED">已取消</option>
                </select>
              </div>

              {/* 歷史列表 */}
              <div className="space-y-3">
                {history.data?.map((request) => (
                  <div key={request.id} className="bg-white border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{request.song.title}</h4>
                        <p className="text-sm text-gray-600">
                          {request.song.originalArtist} • 演唱者: {request.singer?.user?.displayName || request.singer?.stageName || '待指派'}
                        </p>
                        <p className="text-xs text-gray-500">
                          點歌時間: {formatDateTime(request.requestedAt)}
                          {request.waitingTime > 0 && ` • 等待時間: ${formatDuration(request.waitingTime)}`}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.currentStatus)}`}>
                          {getStatusText(request.currentStatus)}
                        </span>
                        {request.event && (
                          <p className="text-xs text-gray-500 mt-1">
                            活動: {request.event.title}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* 狀態歷史 */}
                    {request.statusHistory?.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <h5 className="text-xs font-medium text-gray-700 mb-2">狀態變更歷史:</h5>
                        <div className="space-y-1">
                          {request.statusHistory.slice(0, 3).map((event, idx) => (
                            <p key={idx} className="text-xs text-gray-500">
                              {formatDateTime(event.occurredAt)}: {event.type}
                              {event.operator && ` (${event.operator.displayName})`}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* 分頁 */}
              {history.pagination && (
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-600">
                    共 {history.pagination.total} 筆記錄
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setFilters({...filters, page: filters.page - 1})}
                      disabled={filters.page <= 1}
                      className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                    >
                      上一頁
                    </button>
                    <span className="px-3 py-1 text-sm">第 {filters.page} 頁</span>
                    <button
                      onClick={() => setFilters({...filters, page: filters.page + 1})}
                      disabled={!history.pagination.hasMore}
                      className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                    >
                      下一頁
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'analytics' && analytics && (
            <div className="space-y-6">
              {/* 統計概覽 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-800">成功率</h3>
                  <p className="text-2xl font-bold text-blue-600">{analytics.successRate.toFixed(1)}%</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800">平均等待</h3>
                  <p className="text-2xl font-bold text-green-600">{formatDuration(analytics.averageWaitTime)}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-purple-800">30天點歌</h3>
                  <p className="text-2xl font-bold text-purple-600">{analytics.totalRequests}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 最常點的歌曲 */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">最常點的歌曲</h3>
                  <div className="space-y-2">
                    {analytics.mostRequestedSongs.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm">{item.song}</span>
                        <span className="text-sm font-medium text-blue-600">{item.count}次</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 偏好歌手 */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">偏好歌手</h3>
                  <div className="space-y-2">
                    {analytics.preferredSingers.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm">{item.singer}</span>
                        <span className="text-sm font-medium text-green-600">{item.count}次</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 喜愛類型 */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">喜愛語言</h3>
                  <div className="space-y-2">
                    {analytics.favoriteGenres.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm">{item.genre}</span>
                        <span className="text-sm font-medium text-purple-600">{item.count}次</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 活動趨勢 */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">最近活動</h3>
                  <div className="space-y-2">
                    {analytics.activityByDay.slice(-7).map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm">{new Date(item.date).toLocaleDateString('zh-TW')}</span>
                        <span className="text-sm font-medium text-orange-600">{item.count}次</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyRequestDashboard;