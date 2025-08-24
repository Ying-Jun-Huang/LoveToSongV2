import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuthV2';

const PermissionManagementFullScreen = () => {
  const { user, getPrimaryRole, ROLES_V2 } = useAuth();
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');

  // 模擬用戶數據
  const mockUsers = [
    { id: 1, email: 'super@test.com', displayName: '高層管理員', roles: ['SUPER_ADMIN'], status: 'ACTIVE', lastLogin: '2024-01-15' },
    { id: 2, email: 'host@test.com', displayName: '主持管理', roles: ['HOST_ADMIN'], status: 'ACTIVE', lastLogin: '2024-01-14' },
    { id: 3, email: 'singer@test.com', displayName: '歌手', roles: ['SINGER'], status: 'ACTIVE', lastLogin: '2024-01-13' },
    { id: 4, email: 'player@test.com', displayName: '玩家', roles: ['PLAYER'], status: 'ACTIVE', lastLogin: '2024-01-12' },
    { id: 5, email: 'guest@test.com', displayName: '訪客', roles: ['GUEST'], status: 'ACTIVE', lastLogin: '2024-01-11' },
    { id: 6, email: 'alice@test.com', displayName: 'Alice 歌手', roles: ['SINGER'], status: 'ACTIVE', lastLogin: '2024-01-10' },
    { id: 7, email: 'bob@test.com', displayName: 'Bob 玩家', roles: ['PLAYER'], status: 'ACTIVE', lastLogin: '2024-01-09' },
    { id: 8, email: 'charlie@test.com', displayName: 'Charlie 主持', roles: ['HOST_ADMIN'], status: 'INACTIVE', lastLogin: '2024-01-08' }
  ];

  // 過濾用戶
  const filteredUsers = mockUsers.filter(user => {
    const matchesSearch = user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'ALL' || user.roles.includes(filterRole);
    return matchesSearch && matchesRole;
  });

  // 獲取用戶角色信息
  const getUserRole = (userRoles) => {
    if (!userRoles || userRoles.length === 0) return ROLES_V2.GUEST;
    const userLevel = Math.min(...userRoles.map(role => ROLES_V2[role]?.level || 999));
    const primaryRole = userRoles.find(role => ROLES_V2[role]?.level === userLevel);
    return ROLES_V2[primaryRole] || ROLES_V2.GUEST;
  };

  // 獲取用戶權限
  const getUserPermissions = (userRoles) => {
    const allPermissions = new Set();
    userRoles.forEach(role => {
      const roleConfig = ROLES_V2[role];
      if (roleConfig && roleConfig.permissions) {
        roleConfig.permissions.forEach(perm => allPermissions.add(perm));
      }
    });
    return Array.from(allPermissions);
  };

  return (
    <div className="permission-management-fullscreen">
      <div className="management-header">
        <div className="header-info">
          <h2>🎛️ 權限管理中心</h2>
          <p>管理用戶角色和權限設置</p>
        </div>
        
        <div className="header-controls">
          <div className="search-box">
            <input
              type="text"
              placeholder="搜尋用戶..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="role-filter"
          >
            <option value="ALL">所有角色</option>
            <option value="SUPER_ADMIN">高層管理員</option>
            <option value="HOST_ADMIN">主持管理</option>
            <option value="SINGER">歌手</option>
            <option value="PLAYER">玩家</option>
            <option value="GUEST">訪客</option>
          </select>
        </div>
      </div>

      <div className="management-content">
        <div className="users-panel">
          <div className="panel-header">
            <h3>用戶列表 ({filteredUsers.length})</h3>
          </div>
          
          <div className="users-list">
            {filteredUsers.map(userData => {
              const userRole = getUserRole(userData.roles);
              const isSelected = selectedUser?.id === userData.id;
              
              return (
                <div
                  key={userData.id}
                  className={`user-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedUser(userData)}
                >
                  <div className="user-avatar" style={{ backgroundColor: userRole.color }}>
                    {userData.displayName.charAt(0).toUpperCase()}
                  </div>
                  
                  <div className="user-info">
                    <div className="user-name">{userData.displayName}</div>
                    <div className="user-email">{userData.email}</div>
                    <div className="user-role" style={{ color: userRole.color }}>
                      {userRole.displayName}
                    </div>
                  </div>
                  
                  <div className="user-status">
                    <div className={`status-indicator ${userData.status.toLowerCase()}`}>
                      {userData.status === 'ACTIVE' ? '🟢' : '🔴'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="details-panel">
          {selectedUser ? (
            <div className="user-details">
              <div className="details-header">
                <div className="user-summary">
                  <div className="user-avatar-large" style={{ backgroundColor: getUserRole(selectedUser.roles).color }}>
                    {selectedUser.displayName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3>{selectedUser.displayName}</h3>
                    <p>{selectedUser.email}</p>
                    <div className="role-badge" style={{ backgroundColor: getUserRole(selectedUser.roles).color }}>
                      {getUserRole(selectedUser.roles).displayName}
                    </div>
                  </div>
                </div>
              </div>

              <div className="permissions-matrix">
                <h4>權限清單</h4>
                <div className="permissions-grid">
                  {getUserPermissions(selectedUser.roles).map(permission => (
                    <div key={permission} className="permission-item granted">
                      <span className="permission-icon">✅</span>
                      <span className="permission-name">{permission}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="user-actions">
                <button className="action-btn primary">編輯角色</button>
                <button className="action-btn secondary">重置密碼</button>
                <button className="action-btn danger">停用用戶</button>
              </div>
            </div>
          ) : (
            <div className="no-selection">
              <div className="no-selection-content">
                <div className="no-selection-icon">👥</div>
                <h3>請選擇用戶</h3>
                <p>從左側列表中選擇一個用戶來查看詳細信息和管理權限</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx="true">{`
        /* 強制重置 dashboard-header 的樣式，防止被權限管理頁面影響 */
        :global(.dashboard-layout-container .dashboard-header .user-info) {
          gap: 12px !important;
          justify-content: flex-start !important;
          align-items: center !important;
          display: flex !important;
          flex-direction: row !important;
        }
        
        .permission-management-fullscreen {
          height: 100%;
          display: flex;
          flex-direction: column;
          background: transparent;
          color: #ffffff;
        }

        .management-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px 32px;
          background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
          border-bottom: 2px solid #ffd700;
          box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
        }

        .header-info h2 {
          margin: 0 0 4px 0;
          color: #ffd700;
          font-size: 24px;
          font-weight: 700;
        }

        .header-info p {
          margin: 0;
          color: #d4af37;
          font-size: 14px;
        }

        .header-controls {
          display: flex;
          gap: 16px;
          align-items: center;
        }

        .search-input, .role-filter {
          padding: 10px 16px;
          border: 2px solid #daa520;
          border-radius: 8px;
          font-size: 14px;
          background: linear-gradient(135deg, #333333, #404040);
          color: #ffffff;
          transition: all 0.2s ease;
        }

        .search-input:focus, .role-filter:focus {
          outline: none;
          border-color: #ffd700;
          box-shadow: 0 0 0 3px rgba(255, 215, 0, 0.2);
          background: linear-gradient(135deg, #404040, #4a4a4a);
        }
        
        .search-input::placeholder {
          color: #aaaaaa;
        }

        .search-input {
          width: 250px;
        }

        .management-content {
          flex: 1;
          display: flex;
          overflow: hidden;
        }

        .users-panel {
          width: 400px;
          background: linear-gradient(135deg, #2a2a2a 0%, #3d3d3d 100%);
          border-right: 2px solid #daa520;
          display: flex;
          flex-direction: column;
        }

        .panel-header {
          padding: 20px 24px;
          border-bottom: 2px solid rgba(218, 165, 32, 0.3);
          background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
        }

        .panel-header h3 {
          margin: 0;
          color: #ffd700;
          font-size: 16px;
          font-weight: 600;
        }

        .users-list {
          flex: 1;
          overflow-y: auto;
          padding: 8px;
        }

        .user-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          margin-bottom: 8px;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 2px solid transparent;
        }

        .user-card:hover {
          background: rgba(255, 215, 0, 0.1);
          border-color: rgba(218, 165, 32, 0.3);
        }

        .user-card.selected {
          background: linear-gradient(135deg, rgba(218, 165, 32, 0.15), rgba(255, 215, 0, 0.15));
          border-color: #daa520;
          box-shadow: 0 4px 12px rgba(218, 165, 32, 0.3);
        }

        .user-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 18px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        }

        .user-card .user-info {
          flex: 1;
        }

        .user-name {
          font-weight: 600;
          color: #ffd700;
          margin-bottom: 2px;
        }

        .user-email {
          font-size: 13px;
          color: #cccccc;
          margin-bottom: 4px;
        }

        .user-role {
          font-size: 12px;
          font-weight: 500;
        }

        .status-indicator {
          font-size: 12px;
        }

        .details-panel {
          flex: 1;
          background: linear-gradient(135deg, #2a2a2a 0%, #3d3d3d 100%);
          overflow-y: auto;
        }

        .user-details {
          padding: 32px;
        }

        .details-header {
          margin-bottom: 32px;
        }

        .user-summary {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .user-avatar-large {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 32px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
        }

        .user-summary h3 {
          margin: 0 0 4px 0;
          color: #ffd700;
          font-size: 24px;
          font-weight: 700;
        }

        .user-summary p {
          margin: 0 0 12px 0;
          color: #cccccc;
          font-size: 16px;
        }

        .role-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          color: white;
          font-size: 12px;
          font-weight: 600;
        }

        .permissions-matrix {
          margin-bottom: 32px;
        }

        .permissions-matrix h4 {
          margin: 0 0 16px 0;
          color: #ffd700;
          font-size: 18px;
          font-weight: 600;
        }

        .permissions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 8px;
        }

        .permission-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px;
          border-radius: 8px;
          font-size: 14px;
        }

        .permission-item.granted {
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(21, 128, 61, 0.2));
          color: #4ade80;
          border: 1px solid rgba(34, 197, 94, 0.5);
        }

        .user-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .action-btn {
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .action-btn.primary {
          background: linear-gradient(135deg, #daa520 0%, #b8860b 100%);
          color: white;
          border: 1px solid #daa520;
        }

        .action-btn.secondary {
          background: rgba(255, 215, 0, 0.1);
          color: #cccccc;
          border: 1px solid rgba(218, 165, 32, 0.3);
        }

        .action-btn.danger {
          background: rgba(220, 38, 38, 0.1);
          color: #ef4444;
          border: 1px solid rgba(220, 38, 38, 0.3);
        }

        .action-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .no-selection {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
        }

        .no-selection-content {
          text-align: center;
          color: #cccccc;
        }

        .no-selection-icon {
          font-size: 64px;
          margin-bottom: 16px;
        }

        .no-selection-content h3 {
          margin: 0 0 8px 0;
          color: #ffd700;
          font-size: 20px;
          font-weight: 600;
        }

        .no-selection-content p {
          margin: 0;
          font-size: 16px;
          max-width: 300px;
        }

        @media (max-width: 768px) {
          .management-header {
            flex-direction: column;
            gap: 16px;
            padding: 16px;
          }

          .header-controls {
            width: 100%;
            justify-content: stretch;
          }

          .search-input {
            flex: 1;
            width: auto;
          }

          .management-content {
            flex-direction: column;
          }

          .users-panel {
            width: 100%;
            height: 300px;
          }

          .user-details {
            padding: 20px;
          }

          .user-summary {
            flex-direction: column;
            text-align: center;
          }

          .permissions-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default PermissionManagementFullScreen;