import React from 'react';
import { useAuth } from '../hooks/useAuthV2';

const AuthDebugger = () => {
  const { user, isAuthenticated, loading, permissions, hasPermission } = useAuth();

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999,
      maxWidth: '300px'
    }}>
      <h4 style={{ margin: '0 0 10px 0', color: '#ffd700' }}>🔍 Auth Debug</h4>
      <div><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</div>
      <div><strong>Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}</div>
      <div><strong>User:</strong> {user ? user.displayName : 'None'}</div>
      <div><strong>Email:</strong> {user ? user.email : 'None'}</div>
      <div><strong>Roles:</strong> {user?.roles?.join(', ') || 'None'}</div>
      <div><strong>Permissions:</strong> {permissions.length}</div>
      <div style={{ fontSize: '10px', maxHeight: '100px', overflow: 'auto' }}>
        {permissions.join(', ')}
      </div>
      <div><strong>USER_MANAGEMENT:</strong> {hasPermission('USER_MANAGEMENT') ? 'Yes' : 'No'}</div>
      <div><strong>EVENT_STATS:</strong> {hasPermission('EVENT_STATS') ? 'Yes' : 'No'}</div>
      <div><strong>LocalStorage Token:</strong> {localStorage.getItem('token') ? 'Yes' : 'No'}</div>
      <div><strong>LocalStorage UserInfo:</strong> {localStorage.getItem('userInfo') ? 'Yes' : 'No'}</div>
    </div>
  );
};

export default AuthDebugger;