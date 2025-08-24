import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuthV2';

const PermissionManagement = () => {
  const { user: currentUser, hasPermission } = useAuth();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userPermissions, setUserPermissions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [availablePermissions, setAvailablePermissions] = useState([]);

  // 檢查當前用戶是否有權限管理權限
  const canManagePermissions = hasPermission('USER_MANAGEMENT') || 
                               (currentUser?.roles || []).includes('SUPER_ADMIN');

  useEffect(() => {
    if (canManagePermissions) {
      loadUsers();
      loadAvailablePermissions();
    }
  }, [canManagePermissions]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      // 模擬 API 調用 - 實際環境中會調用後端 API
      const mockUsers = [
        { id: 1, displayName: '高層管理員', email: 'super@test.com', roles: ['SUPER_ADMIN'], overrideCount: 0 },
        { id: 2, displayName: '主持管理', email: 'host@test.com', roles: ['HOST_ADMIN'], overrideCount: 2 },
        { id: 3, displayName: '歌手', email: 'singer@test.com', roles: ['SINGER'], overrideCount: 1 },
        { id: 4, displayName: '玩家', email: 'player@test.com', roles: ['PLAYER'], overrideCount: 0 },
        { id: 5, displayName: '訪客', email: 'guest@test.com', roles: ['GUEST'], overrideCount: 3 }
      ];
      setUsers(mockUsers);
    } catch (error) {
      console.error('載入用戶列表失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailablePermissions = async () => {
    // 模擬可用權限列表
    setAvailablePermissions([
      { key: 'VIEW_HOMEPAGE', name: '首頁展示', category: 'basic' },
      { key: 'VIEW_SONGS', name: '會的歌', category: 'basic' },
      { key: 'VIEW_SINGERS', name: '歌手資訊', category: 'basic' },
      { key: 'SONG_REQUEST', name: '點歌系統', category: 'player' },
      { key: 'WISH_SONG_SUBMIT', name: '願望歌提交', category: 'player' },
      { key: 'WISH_SONG_RESPONSE', name: '願望歌回應', category: 'singer' },
      { key: 'SONG_MANAGEMENT', name: '歌曲管理', category: 'singer' },
      { key: 'USER_MANAGEMENT', name: '用戶管理', category: 'admin' },
      { key: 'EVENT_MANAGEMENT', name: '活動管理', category: 'admin' },
      { key: 'SYSTEM_STATS', name: '統計資訊', category: 'admin' },
      { key: 'QUEUE_PRIORITY', name: '優先排隊', category: 'special' },
      { key: 'VIP_ACCESS', name: 'VIP權限', category: 'special' }
    ]);
  };

  const loadUserPermissions = async (userId) => {
    try {
      setLoading(true);
      // 模擬獲取用戶詳細權限
      const mockPermissions = {
        userId,
        basePermissions: ['VIEW_HOMEPAGE', 'VIEW_SONGS', 'VIEW_SINGERS'],
        overridePermissions: [
          { permission: 'QUEUE_PRIORITY', granted: true, reason: 'VIP用戶特權' },
          { permission: 'EVENT_MANAGEMENT', granted: true, reason: '臨時活動管理權限' },
          { permission: 'SONG_REQUEST', granted: false, reason: '暫時停用點歌功能' }
        ],
        finalPermissions: ['VIEW_HOMEPAGE', 'VIEW_SONGS', 'VIEW_SINGERS', 'QUEUE_PRIORITY', 'EVENT_MANAGEMENT'],
        effectiveRole: 'GUEST'
      };
      setUserPermissions(mockPermissions);
    } catch (error) {
      console.error('載入用戶權限失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    loadUserPermissions(user.id);
  };

  const handlePermissionToggle = async (permission, granted, reason = '') => {
    try {
      // 模擬權限調整 API 調用
      // 權限調整
      
      // 重新載入用戶權限
      if (selectedUser) {
        await loadUserPermissions(selectedUser.id);
      }
    } catch (error) {
      console.error('權限調整失敗:', error);
    }
  };

  if (!canManagePermissions) {
    return (
      <div className="permission-denied">
        <div className="permission-denied-content">
          <div className="permission-denied-icon">🚫</div>
          <h3>權限不足</h3>
          <p>您沒有權限管理其他用戶的權限</p>
        </div>
      </div>
    );
  }

  return (
    <div className="permission-management">
      <div className="management-header">
        <h2>🎯 用戶權限管理</h2>
        <p>管理系統用戶的個人化權限設定</p>
      </div>

      <div className="management-content">
        {/* 用戶列表 */}
        <div className="users-panel">
          <h3>👥 用戶列表</h3>
          {loading && <div className="loading">載入中...</div>}
          <div className="users-list">
            {users.map(user => (
              <div 
                key={user.id}
                className={`user-card ${selectedUser?.id === user.id ? 'selected' : ''}`}
                onClick={() => handleUserSelect(user)}
              >
                <div className="user-avatar">
                  {user.displayName.charAt(0)}
                </div>
                <div className="user-info">
                  <div className="user-name">{user.displayName}</div>
                  <div className="user-email">{user.email}</div>
                  <div className="user-roles">
                    {user.roles.map(role => (
                      <span key={role} className="role-tag">{role}</span>
                    ))}
                  </div>
                  {user.overrideCount > 0 && (
                    <div className="override-indicator">
                      {user.overrideCount} 個自訂權限
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 權限詳情 */}
        {selectedUser && userPermissions && (
          <div className="permissions-panel">
            <div className="permissions-header">
              <h3>🔑 {selectedUser.displayName} 的權限設定</h3>
              <div className="user-role-info">
                基礎角色: {userPermissions.effectiveRole}
              </div>
            </div>

            <div className="permissions-content">
              {/* 權限統計 */}
              <div className="permission-stats">
                <div className="stat-card">
                  <div className="stat-number">{userPermissions.basePermissions.length}</div>
                  <div className="stat-label">基礎權限</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">{userPermissions.overridePermissions.length}</div>
                  <div className="stat-label">自訂權限</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">{userPermissions.finalPermissions.length}</div>
                  <div className="stat-label">最終權限</div>
                </div>
              </div>

              {/* 權限列表 */}
              <div className="permissions-grid">
                {availablePermissions.map(perm => {
                  const hasBase = userPermissions.basePermissions.includes(perm.key);
                  const override = userPermissions.overridePermissions.find(o => o.permission === perm.key);
                  const hasFinal = userPermissions.finalPermissions.includes(perm.key);
                  
                  return (
                    <div key={perm.key} className={`permission-item ${hasFinal ? 'granted' : 'denied'}`}>
                      <div className="permission-info">
                        <div className="permission-name">{perm.name}</div>
                        <div className="permission-key">{perm.key}</div>
                      </div>
                      
                      <div className="permission-status">
                        <div className="permission-source">
                          {hasBase && <span className="base-tag">基礎</span>}
                          {override && (
                            <span className={`override-tag ${override.granted ? 'granted' : 'revoked'}`}>
                              {override.granted ? '額外授予' : '已撤銷'}
                            </span>
                          )}
                        </div>
                        
                        <div className="permission-result">
                          {hasFinal ? (
                            <span className="result-granted">✅ 擁有</span>
                          ) : (
                            <span className="result-denied">❌ 無權限</span>
                          )}
                        </div>
                      </div>

                      {override && (
                        <div className="permission-reason">
                          原因: {override.reason}
                        </div>
                      )}

                      <div className="permission-actions">
                        {!hasBase && !hasFinal && (
                          <button 
                            className="grant-btn"
                            onClick={() => {
                              const reason = prompt('請輸入授予權限的原因:');
                              if (reason) handlePermissionToggle(perm.key, true, reason);
                            }}
                          >
                            授予
                          </button>
                        )}
                        {hasFinal && (hasBase || override?.granted) && (
                          <button 
                            className="revoke-btn"
                            onClick={() => {
                              const reason = prompt('請輸入撤銷權限的原因:');
                              if (reason) handlePermissionToggle(perm.key, false, reason);
                            }}
                          >
                            撤銷
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx="true">{`
        .permission-management {
          padding: 20px;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          min-height: 100vh;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .management-header {
          text-align: center;
          margin-bottom: 30px;
          background: white;
          padding: 30px;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }

        .management-header h2 {
          margin: 0 0 10px 0;
          color: #2d3748;
          font-size: 28px;
        }

        .management-content {
          display: grid;
          grid-template-columns: 350px 1fr;
          gap: 20px;
          align-items: start;
        }

        .users-panel, .permissions-panel {
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
          overflow: hidden;
        }

        .users-panel h3, .permissions-header h3 {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          margin: 0;
          padding: 20px;
          font-size: 18px;
        }

        .users-list {
          padding: 20px;
          max-height: 600px;
          overflow-y: auto;
        }

        .user-card {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 15px;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          margin-bottom: 10px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .user-card:hover {
          border-color: #667eea;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
        }

        .user-card.selected {
          border-color: #667eea;
          background: #f7fafc;
        }

        .user-avatar {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 18px;
        }

        .user-item .user-info {
          flex: 1;
        }

        .user-name {
          font-weight: 600;
          color: #2d3748;
          margin-bottom: 4px;
        }

        .user-email {
          font-size: 12px;
          color: #718096;
          margin-bottom: 8px;
        }

        .user-roles {
          display: flex;
          gap: 5px;
          flex-wrap: wrap;
          margin-bottom: 5px;
        }

        .role-tag {
          background: #e2e8f0;
          color: #4a5568;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 10px;
          font-weight: 500;
        }

        .override-indicator {
          font-size: 11px;
          color: #f56565;
          font-weight: 500;
        }

        .permissions-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 20px;
        }

        .user-role-info {
          font-size: 14px;
          opacity: 0.9;
          margin-top: 5px;
        }

        .permissions-content {
          padding: 20px;
        }

        .permission-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
          margin-bottom: 25px;
        }

        .stat-card {
          background: #f7fafc;
          padding: 20px;
          border-radius: 12px;
          text-align: center;
          border: 1px solid #e2e8f0;
        }

        .stat-number {
          font-size: 24px;
          font-weight: bold;
          color: #2d3748;
          margin-bottom: 5px;
        }

        .stat-label {
          font-size: 12px;
          color: #718096;
        }

        .permissions-grid {
          display: grid;
          gap: 15px;
        }

        .permission-item {
          border: 2px solid;
          border-radius: 12px;
          padding: 15px;
          transition: all 0.3s ease;
        }

        .permission-item.granted {
          border-color: #48bb78;
          background: linear-gradient(135deg, #f0fff4 0%, #c6f6d5 100%);
        }

        .permission-item.denied {
          border-color: #e53e3e;
          background: linear-gradient(135deg, #fff5f5 0%, #fed7d7 100%);
          opacity: 0.7;
        }

        .permission-info {
          margin-bottom: 10px;
        }

        .permission-name {
          font-weight: 600;
          color: #2d3748;
          margin-bottom: 4px;
        }

        .permission-key {
          font-size: 11px;
          color: #718096;
          font-family: monospace;
        }

        .permission-status {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .permission-source {
          display: flex;
          gap: 5px;
        }

        .base-tag, .override-tag {
          padding: 2px 8px;
          border-radius: 10px;
          font-size: 10px;
          font-weight: 600;
        }

        .base-tag {
          background: #bee3f8;
          color: #2b6cb0;
        }

        .override-tag.granted {
          background: #c6f6d5;
          color: #276749;
        }

        .override-tag.revoked {
          background: #fed7d7;
          color: #c53030;
        }

        .result-granted {
          color: #276749;
          font-weight: 600;
        }

        .result-denied {
          color: #c53030;
          font-weight: 600;
        }

        .permission-reason {
          font-size: 12px;
          color: #718096;
          margin-bottom: 10px;
          font-style: italic;
        }

        .permission-actions {
          display: flex;
          gap: 10px;
        }

        .grant-btn, .revoke-btn {
          padding: 8px 16px;
          border: none;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .grant-btn {
          background: #48bb78;
          color: white;
        }

        .grant-btn:hover {
          background: #38a169;
          transform: translateY(-1px);
        }

        .revoke-btn {
          background: #e53e3e;
          color: white;
        }

        .revoke-btn:hover {
          background: #c53030;
          transform: translateY(-1px);
        }

        .permission-denied {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }

        .permission-denied-content {
          text-align: center;
          color: #718096;
        }

        .permission-denied-icon {
          font-size: 64px;
          margin-bottom: 20px;
        }

        .loading {
          text-align: center;
          color: #718096;
          padding: 20px;
        }

        @media (max-width: 1024px) {
          .management-content {
            grid-template-columns: 1fr;
          }
          
          .users-panel {
            order: 2;
          }
          
          .permissions-panel {
            order: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default PermissionManagement;