import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { authService } from '../services/authService';

const StatsWidget = (props) => {
  const [stats, setStats] = useState({
    totalSongs: 0,
    mySongs: 0,
    recentActivity: []
  });
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchStats();
    setUser(authService.getCurrentUser());
  }, []);

  const fetchStats = async () => {
    try {
      const [allSongs, mySongs] = await Promise.all([
        api.get('/songs'),
        api.get('/songs/my')
      ]);
      
      setStats({
        totalSongs: allSongs.data.length,
        mySongs: mySongs.data.length,
        recentActivity: mySongs.data.slice(0, 3) // Show recent 3 songs
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  return (
    <div style={{ 
      padding: '15px', 
      border: 'none', 
      borderRadius: '0', 
      height: '100%',
      backgroundColor: 'transparent',
      color: '#ffffff'
    }}>
      <h3 style={{ margin: '0 0 15px 0', color: '#ffd700', fontWeight: '600' }}>Dashboard Stats</h3>
      
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
            <strong style={{ color: '#ffd700' }}>Welcome, {user.username}!</strong>
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
