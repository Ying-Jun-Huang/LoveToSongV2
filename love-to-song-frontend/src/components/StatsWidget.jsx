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
      backgroundColor: 'transparent'
    }}>
      <h3 style={{ margin: '0 0 15px 0' }}>Dashboard Stats</h3>
      
      {/* User info */}
      {user && (
        <div style={{ 
          marginBottom: '20px', 
          padding: '10px', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '6px' 
        }}>
          <div style={{ fontSize: '14px', marginBottom: '5px' }}>
            <strong>Welcome, {user.username}!</strong>
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
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
            backgroundColor: '#e3f2fd', 
            borderRadius: '6px', 
            flex: 1, 
            marginRight: '5px' 
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1976d2' }}>
              {stats.totalSongs}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>Total Songs</div>
          </div>
          <div style={{ 
            textAlign: 'center', 
            padding: '10px', 
            backgroundColor: '#e8f5e8', 
            borderRadius: '6px', 
            flex: 1, 
            marginLeft: '5px' 
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#388e3c' }}>
              {stats.mySongs}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>My Songs</div>
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div>
        <h4 style={{ fontSize: '16px', margin: '0 0 10px 0' }}>Recent Activity</h4>
        {stats.recentActivity.length === 0 ? (
          <p style={{ fontSize: '14px', color: '#666', fontStyle: 'italic' }}>
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
                  borderBottom: '1px solid #eee'
                }}
              >
                <div style={{ fontWeight: '500' }}>{song.title}</div>
                {song.artist && (
                  <div style={{ fontSize: '12px', color: '#666' }}>by {song.artist}</div>
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
