import React, { useState, useEffect } from 'react';
import api from '../services/api';

const SongRequestWidget = () => {
  const [queue, setQueue] = useState([]);
  const [stats, setStats] = useState({ totalPending: 0, totalCompleted: 0, averageWaitTime: 0 });
  const [popularSongs, setPopularSongs] = useState([]);
  const [players, setPlayers] = useState([]);
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('queue'); // 'queue', 'request', 'popular', 'history'
  const [showRequestForm, setShowRequestForm] = useState(false);
  
  // 點歌表單狀態
  const [requestForm, setRequestForm] = useState({
    playerId: '',
    songId: '',
    note: '',
    priority: 0,
  });

  // 篩選和分頁狀態
  const [filters, setFilters] = useState({
    status: '',
    playerId: '',
    date: '',
  });

  useEffect(() => {
    fetchInitialData();
    const interval = setInterval(fetchQueue, 5000); // 每5秒更新一次隊列
    return () => clearInterval(interval);
  }, []);

  const fetchInitialData = async () => {
    try {
      await Promise.all([
        fetchQueue(),
        fetchStats(),
        fetchPopularSongs(),
        fetchPlayers(),
        fetchSongs(),
      ]);
    } catch (error) {
      console.error('Failed to fetch initial data:', error);
    }
  };

  const fetchQueue = async () => {
    try {
      const response = await api.get('/song-requests/queue');
      setQueue(response.data.queue || []);
    } catch (error) {
      console.error('Failed to fetch queue:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/song-requests/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchPopularSongs = async () => {
    try {
      const response = await api.get('/song-requests/popular?limit=10');
      setPopularSongs(response.data);
    } catch (error) {
      console.error('Failed to fetch popular songs:', error);
    }
  };

  const fetchPlayers = async () => {
    try {
      const response = await api.get('/players');
      setPlayers(response.data);
    } catch (error) {
      console.error('Failed to fetch players:', error);
    }
  };

  const fetchSongs = async () => {
    try {
      const response = await api.get('/songs');
      setSongs(response.data);
    } catch (error) {
      console.error('Failed to fetch songs:', error);
    }
  };

  const createSongRequest = async (e) => {
    e.preventDefault();
    if (!requestForm.playerId || !requestForm.songId) {
      alert('請選擇玩家和歌曲');
      return;
    }

    setLoading(true);
    try {
      await api.post('/song-requests', {
        playerId: parseInt(requestForm.playerId),
        songId: parseInt(requestForm.songId),
        note: requestForm.note,
        priority: requestForm.priority,
      });

      setRequestForm({ playerId: '', songId: '', note: '', priority: 0 });
      setShowRequestForm(false);
      fetchQueue();
      fetchStats();
      alert('點歌成功！');
    } catch (error) {
      console.error('Failed to create song request:', error);
      alert(error.response?.data?.message || '點歌失敗');
    }
    setLoading(false);
  };

  const completeRequest = async (id) => {
    try {
      await api.post(`/song-requests/${id}/complete`);
      fetchQueue();
      fetchStats();
    } catch (error) {
      console.error('Failed to complete request:', error);
      alert('完成操作失敗');
    }
  };

  const cancelRequest = async (id) => {
    if (!window.confirm('確定要取消這個點歌請求嗎？')) return;

    try {
      await api.patch(`/song-requests/${id}`, { status: 'CANCELLED' });
      fetchQueue();
      fetchStats();
    } catch (error) {
      console.error('Failed to cancel request:', error);
      alert('取消操作失敗');
    }
  };

  const clearCompleted = async () => {
    if (!window.confirm('確定要清除所有已完成的請求嗎？')) return;

    try {
      await api.delete('/song-requests/completed/clear');
      fetchStats();
      alert('清除成功');
    } catch (error) {
      console.error('Failed to clear completed requests:', error);
      alert('清除失敗');
    }
  };

  const renderQueue = () => (
    <div className="queue-section">
      <div className="queue-header">
        <h4>當前播放隊列 ({queue.length} 首歌)</h4>
        <div className="queue-actions">
          <button onClick={clearCompleted} className="clear-btn">
            清除已完成
          </button>
        </div>
      </div>
      
      {queue.length === 0 ? (
        <div className="empty-queue">隊列為空，快來點歌吧！</div>
      ) : (
        <div className="queue-list">
          {queue.map((request, index) => (
            <div key={request.id} className="queue-item">
              <div className="queue-position">{index + 1}</div>
              <div className="request-info">
                <div className="song-title">{request.song.title}</div>
                <div className="song-artist">{request.song.artist}</div>
                <div className="requester">
                  點歌人: {request.player?.name || request.user?.username}
                </div>
                {request.note && (
                  <div className="request-note">備註: {request.note}</div>
                )}
                <div className="request-time">
                  {new Date(request.requestedAt).toLocaleString('zh-TW')}
                </div>
              </div>
              <div className="queue-actions">
                <div className="wait-time">
                  等待: ~{request.estimatedWaitTime} 分
                </div>
                <button
                  onClick={() => completeRequest(request.id)}
                  className="complete-btn"
                  disabled={index !== 0} // 只能完成第一首歌
                >
                  {index === 0 ? '完成' : '等待'}
                </button>
                <button
                  onClick={() => cancelRequest(request.id)}
                  className="cancel-btn"
                >
                  取消
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderRequestForm = () => (
    <div className="request-form">
      <h4>新增點歌請求</h4>
      <form onSubmit={createSongRequest}>
        <div className="form-row">
          <label>選擇玩家:</label>
          <select
            value={requestForm.playerId}
            onChange={(e) => setRequestForm({ ...requestForm, playerId: e.target.value })}
            required
          >
            <option value="">請選擇玩家</option>
            {players.map(player => (
              <option key={player.id} value={player.id}>
                {player.playerId} - {player.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-row">
          <label>選擇歌曲:</label>
          <select
            value={requestForm.songId}
            onChange={(e) => setRequestForm({ ...requestForm, songId: e.target.value })}
            required
          >
            <option value="">請選擇歌曲</option>
            {songs.map(song => (
              <option key={song.id} value={song.id}>
                {song.title} - {song.artist}
              </option>
            ))}
          </select>
        </div>

        <div className="form-row">
          <label>優先級 (0-10):</label>
          <input
            type="number"
            min="0"
            max="10"
            value={requestForm.priority}
            onChange={(e) => setRequestForm({ ...requestForm, priority: parseInt(e.target.value) })}
          />
        </div>

        <div className="form-row">
          <label>備註:</label>
          <textarea
            value={requestForm.note}
            onChange={(e) => setRequestForm({ ...requestForm, note: e.target.value })}
            rows="3"
            placeholder="可選的備註資訊..."
          />
        </div>

        <div className="form-actions">
          <button type="submit" disabled={loading}>
            {loading ? '提交中...' : '提交點歌'}
          </button>
          <button
            type="button"
            onClick={() => setShowRequestForm(false)}
            className="cancel-btn"
          >
            取消
          </button>
        </div>
      </form>
    </div>
  );

  const renderPopularSongs = () => (
    <div className="popular-songs">
      <h4>熱門歌曲 (近30天)</h4>
      {popularSongs.length === 0 ? (
        <div className="empty-state">暂無熱門歌曲數據</div>
      ) : (
        <div className="popular-list">
          {popularSongs.map((item, index) => (
            <div key={item.song.id} className="popular-item">
              <div className="rank">#{index + 1}</div>
              <div className="song-info">
                <div className="song-title">{item.song.title}</div>
                <div className="song-artist">{item.song.artist}</div>
              </div>
              <div className="request-count">
                {item.requestCount} 次點播
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderStats = () => (
    <div className="stats-section">
      <div className="stat-card">
        <div className="stat-number">{stats.totalPending}</div>
        <div className="stat-label">等待中</div>
      </div>
      <div className="stat-card">
        <div className="stat-number">{stats.totalCompleted}</div>
        <div className="stat-label">已完成</div>
      </div>
      <div className="stat-card">
        <div className="stat-number">{stats.averageWaitTime}</div>
        <div className="stat-label">平均等待(分)</div>
      </div>
    </div>
  );

  return (
    <div className="song-request-widget">
      <div className="widget-header">
        <h3>點歌系統</h3>
        <button
          onClick={() => setShowRequestForm(!showRequestForm)}
          className="request-btn"
        >
          {showRequestForm ? '取消' : '我要點歌'}
        </button>
      </div>

      {renderStats()}

      {showRequestForm && renderRequestForm()}

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'queue' ? 'active' : ''}`}
          onClick={() => setActiveTab('queue')}
        >
          播放隊列
        </button>
        <button
          className={`tab ${activeTab === 'popular' ? 'active' : ''}`}
          onClick={() => setActiveTab('popular')}
        >
          熱門歌曲
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'queue' && renderQueue()}
        {activeTab === 'popular' && renderPopularSongs()}
      </div>

      <style jsx="true">{`
        .song-request-widget {
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

        .request-btn {
          padding: 8px 16px;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        .request-btn:hover {
          background: #0056b3;
        }

        .stats-section {
          display: flex;
          gap: 15px;
          margin-bottom: 20px;
        }

        .stat-card {
          flex: 1;
          background: #f8f9fa;
          padding: 15px;
          border-radius: 6px;
          text-align: center;
        }

        .stat-number {
          font-size: 24px;
          font-weight: bold;
          color: #007bff;
          margin-bottom: 5px;
        }

        .stat-label {
          font-size: 12px;
          color: #666;
        }

        .request-form {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
          border: 1px solid #e9ecef;
        }

        .request-form h4 {
          margin: 0 0 15px 0;
          color: #333;
        }

        .form-row {
          margin-bottom: 15px;
        }

        .form-row label {
          display: block;
          margin-bottom: 5px;
          font-weight: bold;
          color: #333;
        }

        .form-row select,
        .form-row input,
        .form-row textarea {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }

        .form-actions {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
        }

        .form-actions button {
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }

        .form-actions button[type="submit"] {
          background: #28a745;
          color: white;
        }

        .form-actions .cancel-btn {
          background: #6c757d;
          color: white;
        }

        .tabs {
          display: flex;
          border-bottom: 1px solid #ddd;
          margin-bottom: 15px;
        }

        .tab {
          padding: 10px 20px;
          background: none;
          border: none;
          cursor: pointer;
          border-bottom: 3px solid transparent;
          color: #666;
        }

        .tab.active {
          color: #007bff;
          border-bottom-color: #007bff;
        }

        .tab-content {
          flex: 1;
          overflow: auto;
        }

        .queue-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }

        .queue-header h4 {
          margin: 0;
          color: #333;
        }

        .clear-btn {
          padding: 6px 12px;
          background: #dc3545;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        }

        .empty-queue,
        .empty-state {
          text-align: center;
          color: #666;
          padding: 40px 0;
          font-style: italic;
        }

        .queue-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .queue-item {
          display: flex;
          align-items: flex-start;
          background: #f8f9fa;
          border: 1px solid #e9ecef;
          border-radius: 6px;
          padding: 15px;
          transition: box-shadow 0.2s;
        }

        .queue-item:hover {
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .queue-position {
          background: #007bff;
          color: white;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          margin-right: 15px;
        }

        .request-info {
          flex: 1;
        }

        .song-title {
          font-weight: bold;
          color: #333;
          margin-bottom: 3px;
        }

        .song-artist {
          color: #666;
          font-size: 14px;
          margin-bottom: 5px;
        }

        .requester {
          font-size: 13px;
          color: #007bff;
          margin-bottom: 3px;
        }

        .request-note {
          font-size: 13px;
          color: #666;
          font-style: italic;
          margin-bottom: 3px;
        }

        .request-time {
          font-size: 12px;
          color: #999;
        }

        .queue-actions {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 5px;
        }

        .wait-time {
          font-size: 12px;
          color: #666;
          background: #e9ecef;
          padding: 2px 8px;
          border-radius: 12px;
        }

        .complete-btn,
        .cancel-btn {
          padding: 4px 12px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        }

        .complete-btn {
          background: #28a745;
          color: white;
        }

        .complete-btn:disabled {
          background: #6c757d;
          cursor: not-allowed;
        }

        .cancel-btn {
          background: #dc3545;
          color: white;
        }

        .popular-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .popular-item {
          display: flex;
          align-items: center;
          padding: 12px;
          background: #f8f9fa;
          border-radius: 6px;
          border: 1px solid #e9ecef;
        }

        .rank {
          background: #ffc107;
          color: #333;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          margin-right: 15px;
        }

        .request-count {
          margin-left: auto;
          background: #e3f2fd;
          color: #1976d2;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: bold;
        }
      `}</style>
    </div>
  );
};

export default SongRequestWidget;