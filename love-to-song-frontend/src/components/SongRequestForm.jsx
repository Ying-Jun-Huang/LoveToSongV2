import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuthV2';
import websocketService from '../services/websocket-simple';

const SongRequestForm = ({ onRequestSuccess, onCancel }) => {
  const { user } = useAuth();
  const [singers, setSingers] = useState([]);
  const [selectedSinger, setSelectedSinger] = useState('');
  const [songs, setSongs] = useState([]);
  const [selectedSong, setSelectedSong] = useState('');
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingSongs, setLoadingSongs] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    console.log('🚀 SongRequestForm 組件載入，當前用戶:', user);
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedSinger) {
      fetchSingerSongs(selectedSinger);
    } else {
      setSongs([]);
      setSelectedSong('');
    }
  }, [selectedSinger]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      console.log('🔄 開始載入初始資料...');
      const [singersRes, eventsRes] = await Promise.all([
        api.get('/singers'),
        api.get('/events')
      ]);
      
      console.log('📊 載入的歌手資料:', singersRes.data);
      console.log('📊 載入的活動資料:', eventsRes.data);
      
      setSingers(singersRes.data || []);
      setEvents(eventsRes.data || []);
      
      // 自動選擇第一個活動（如果有的話）
      if (eventsRes.data && eventsRes.data.length > 0) {
        setSelectedEvent(eventsRes.data[0].id.toString());
        console.log('✅ 自動選擇活動:', eventsRes.data[0]);
      }
    } catch (err) {
      console.error('❌ 載入初始資料失敗:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchSingerSongs = async (singerId) => {
    try {
      setLoadingSongs(true);
      // 獲取這個歌手會唱的歌曲
      const response = await api.get(`/singers/${singerId}/songs`);
      setSongs(response.data || []);
      setSelectedSong('');
    } catch (err) {
      console.error('Error fetching singer songs:', err);
      // 如果沒有專用端點，嘗試從歌曲列表中篩選
      try {
        const allSongsRes = await api.get('/songs');
        const singerSongs = allSongsRes.data.filter(song => 
          song.singer && song.singer.id === parseInt(singerId)
        );
        setSongs(singerSongs || []);
      } catch (fallbackErr) {
        setError('Failed to load songs for this singer');
        setSongs([]);
      }
    } finally {
      setLoadingSongs(false);
    }
  };

  const canRequestSong = () => {
    console.log('🔍 檢查點歌權限:', { 
      user: user ? { id: user.id, roles: user.roles } : null, 
      selectedSinger,
      singers: singers.length 
    });
    
    if (!user) {
      console.log('❌ 用戶未登入');
      return false;
    }
    
    // 只有訪客不能點歌，其他所有用戶都可以點歌
    if (user.roles.includes('GUEST')) {
      console.log('❌ 訪客不能點歌');
      return false;
    }
    
    console.log('✅ 有權限點歌 (訪客以外都可以點歌)');
    return true;
  };

  const getRestrictedMessage = () => {
    if (!user) return '請先登入';
    if (user.roles.includes('GUEST')) return '訪客無法點歌';
    
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('🎤 點歌表單提交開始');
    
    if (!canRequestSong()) {
      const message = getRestrictedMessage();
      console.log('❌ 無權限點歌:', message);
      setError(message);
      return;
    }

    if (!selectedSinger || !selectedSong || !selectedEvent) {
      console.log('❌ 表單資料不完整:', { selectedSinger, selectedSong, selectedEvent });
      setError('請選擇歌手、歌曲和活動');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const requestData = {
        eventId: parseInt(selectedEvent),
        userId: user.id,
        singerId: parseInt(selectedSinger),
        songId: parseInt(selectedSong),
        notes: notes.trim() || undefined
      };

      console.log('📤 準備發送點歌請求:', requestData);
      const response = await api.post('/song-requests', requestData);
      console.log('✅ 點歌請求成功:', response.data);
      
      if (onRequestSuccess) {
        onRequestSuccess();
      }
      
      // 重置表單
      setSelectedSinger('');
      setSelectedSong('');
      setNotes('');
      
    } catch (err) {
      console.error('❌ 點歌請求失敗:', err);
      setError(err.response?.data?.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  const isUserSinger = (singer) => {
    return singer.userId === user?.id;
  };

  if (loading && singers.length === 0) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">點歌</h2>
      
      {/* 調試資訊 */}
      <div className="mb-4 p-2 bg-gray-100 text-xs rounded">
        <strong>調試資訊:</strong><br/>
        用戶: {user ? `${user.displayName} (${user.roles?.join(', ')})` : '未登入'}<br/>
        歌手數量: {singers.length}, 活動數量: {events.length}<br/>
        選擇的歌手: {selectedSinger}, 選擇的歌曲: {selectedSong}, 選擇的活動: {selectedEvent}<br/>
        有權限點歌: {canRequestSong() ? '是' : '否'}
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 活動選擇 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            選擇活動
          </label>
          <select
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">請選擇活動</option>
            {events.map(event => (
              <option key={event.id} value={event.id}>
                {event.title} - {event.venue}
              </option>
            ))}
          </select>
        </div>

        {/* 歌手選擇 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            選擇歌手
          </label>
          <select
            value={selectedSinger}
            onChange={(e) => setSelectedSinger(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">請選擇歌手</option>
            {singers.map(singer => (
              <option 
                key={singer.id} 
                value={singer.id}
              >
                {singer.stageName} ({singer.user?.displayName})
                {isUserSinger(singer) ? ' - 自己' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* 歌曲選擇 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            選擇歌曲
          </label>
          {loadingSongs ? (
            <div className="flex items-center justify-center py-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
              <span className="text-sm text-gray-500">載入歌曲中...</span>
            </div>
          ) : (
            <select
              value={selectedSong}
              onChange={(e) => setSelectedSong(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
              disabled={!selectedSinger}
            >
              <option value="">
                {selectedSinger ? '請選擇歌曲' : '請先選擇歌手'}
              </option>
              {songs.map(song => (
                <option key={song.id} value={song.id}>
                  {song.title} - {song.originalArtist}
                  {song.learned === false && ' (學習中)'}
                </option>
              ))}
            </select>
          )}
          {selectedSinger && songs.length === 0 && !loadingSongs && (
            <p className="text-sm text-gray-500 mt-1">
              這位歌手目前沒有歌曲可以點
            </p>
          )}
        </div>

        {/* 備註 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            備註 (可選)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows="2"
            placeholder="特殊要求或備註..."
          />
        </div>

        {/* 權限提示 */}
        {!canRequestSong() && (
          <div className="p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded text-sm">
            {getRestrictedMessage()}
          </div>
        )}

        {/* 按鈕 */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading || !canRequestSong()}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={(e) => {
              console.log('🖱️ 點歌按鈕被點擊');
              console.log('🔍 按鈕狀態:', {
                loading,
                canRequestSong: canRequestSong(),
                disabled: loading || !canRequestSong()
              });
              if (!canRequestSong()) {
                e.preventDefault();
                console.log('❌ 按鈕被禁用，阻止表單提交');
              }
            }}
          >
            {loading ? '提交中...' : '提交點歌'}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none"
            >
              取消
            </button>
          )}
        </div>
      </form>

      {/* 使用說明 */}
      <div className="mt-6 p-3 bg-blue-50 rounded-md">
        <h4 className="text-sm font-medium text-blue-900 mb-1">點歌規則：</h4>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>• 只有訪客無法點歌</li>
          <li>• 所有註冊用戶都可以點歌，包括歌手可以點自己的歌</li>
          <li>• 點歌後會進入排隊隊列</li>
        </ul>
      </div>
    </div>
  );
};

export default SongRequestForm;