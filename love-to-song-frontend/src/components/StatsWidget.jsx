import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuthV2';

const StatsWidget = (props) => {
  const [stats, setStats] = useState({
    totalSongs: 0,
    mySongs: 0,
    recentActivity: []
  });
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  

  useEffect(() => {
    // 等待認證加載完成
    if (authLoading) {
        return;
    }
    
    if (!user) {
      return;
    }
    
    // 檢查用戶是否為真正的認證用戶（非訪客）
    if (user.roles && !user.roles.includes('GUEST')) {
      try {
        fetchStats();
      } catch (error) {
        console.error('Error in fetchStats:', error);
      }
    } else {
      // 為訪客用戶或未認證用戶設置默認統計
      setStats({
        totalSongs: 0,
        mySongs: 0,
        recentActivity: []
      });
    }
  }, [user, authLoading]);

  const fetchStats = async () => {
    try {
      // 暫時使用 mock 數據，直到後端服務穩定
      const mockAllSongs = [
        { id: 1, title: '今天你要嫁給我', artist: '陶喆/蔡依林', category: '國語' },
        { id: 2, title: '告白氣球', artist: '周杰倫', category: '國語' },
        { id: 3, title: 'Shape of You', artist: 'Ed Sheeran', category: '英語' },
        { id: 4, title: '稻香', artist: '周杰倫', category: '國語' },
        { id: 5, title: '演員', artist: '薛之謙', category: '國語' }
      ];

      const mockMySongs = [
        { id: 1, title: '今天你要嫁給我', artist: '陶喆/蔡依林', category: '國語', createdAt: new Date().toISOString() },
        { id: 3, title: 'Shape of You', artist: 'Ed Sheeran', category: '英語', createdAt: new Date().toISOString() },
        { id: 5, title: '演員', artist: '薛之謙', category: '國語', createdAt: new Date().toISOString() }
      ];

      // 模擬 API 延遲
      await new Promise(resolve => setTimeout(resolve, 400));
      
      setStats({
        totalSongs: mockAllSongs.length,
        mySongs: mockMySongs.length,
        recentActivity: mockMySongs.slice(0, 3) // Show recent 3 songs
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      // 設置默認值，避免組件崩潰
      setStats({
        totalSongs: 0,
        mySongs: 0,
        recentActivity: []
      });
    }
  };

  // 如果用戶是訪客，顯示受限制的統計信息
  const isGuest = user?.roles?.includes('GUEST') || !user;

  return (
    <div style={{ 
      padding: '15px', 
      border: 'none', 
      borderRadius: '0', 
      height: '100%',
      backgroundColor: 'transparent',
      color: '#ffffff'
    }}>
      <h3 style={{ margin: '0 0 15px 0', color: '#ffd700', fontWeight: '600' }}>
        {isGuest ? '訪客統計' : '個人統計'}
      </h3>
      
      {/* User info */}
      {user && (
        <div style={{ 
          marginBottom: '20px', 
          padding: '10px', 
          background: 'linear-gradient(135deg, #2a2a2a 0%, #3d3d3d 100%)', 
          borderRadius: '6px',
          border: '1px solid #daa520',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 215, 0, 0.1)'
        }}>
          <div style={{ fontSize: '14px', marginBottom: '5px' }}>
            <strong style={{ color: '#ffd700' }}>Welcome, {user.displayName}!</strong>
          </div>
          <div style={{ fontSize: '12px', color: '#cccccc' }}>
            {user.email}
          </div>
        </div>
      )}

      {/* Statistics */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          marginBottom: '10px' 
        }}>
          <div style={{ 
            textAlign: 'center', 
            padding: '10px', 
            background: 'linear-gradient(135deg, #2a2a2a 0%, #3d3d3d 100%)', 
            borderRadius: '6px', 
            flex: 1, 
            marginRight: '5px',
            border: '1px solid #daa520',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 215, 0, 0.1)'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffd700', textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)' }}>
              {stats.totalSongs}
            </div>
            <div style={{ fontSize: '12px', color: '#cccccc' }}>Total Songs</div>
          </div>
          <div style={{ 
            textAlign: 'center', 
            padding: '10px', 
            background: 'linear-gradient(135deg, #2a2a2a 0%, #3d3d3d 100%)', 
            borderRadius: '6px', 
            flex: 1, 
            marginLeft: '5px',
            border: '1px solid #daa520',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 215, 0, 0.1)'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffd700', textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)' }}>
              {stats.mySongs}
            </div>
            <div style={{ fontSize: '12px', color: '#cccccc' }}>My Songs</div>
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div>
        <h4 style={{ fontSize: '16px', margin: '0 0 10px 0', color: '#ffd700', fontWeight: '600' }}>Recent Activity</h4>
        {stats.recentActivity.length === 0 ? (
          <p style={{ fontSize: '14px', color: '#cccccc', fontStyle: 'italic' }}>
            No recent activity
          </p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {stats.recentActivity.map((song) => (
              <li 
                key={song.id} 
                style={{ 
                  padding: '6px 0', 
                  fontSize: '14px',
                  borderBottom: '1px solid rgba(218, 165, 32, 0.3)'
                }}
              >
                <div style={{ fontWeight: '500', color: '#ffd700' }}>{song.title}</div>
                {song.artist && (
                  <div style={{ fontSize: '12px', color: '#cccccc' }}>by {song.artist}</div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default StatsWidget;
