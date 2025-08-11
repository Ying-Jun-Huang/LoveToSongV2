// 權限測試組件
import React from 'react';
import { useAuth } from '../hooks/useAuthV2';
import { PermissionGuard, RoleGuard } from '../components/PermissionGuard';

const PermissionTest = () => {
  const { user, permissions, getPrimaryRole, canViewWidget, logout } = useAuth();

  if (!user) {
    return (
      <div style={{ padding: '20px' }}>
        <h2>權限測試 - 請先登入</h2>
        <a href="/login">前往登入</a>
      </div>
    );
  }

  const userRole = getPrimaryRole();

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ marginBottom: '20px', padding: '15px', background: '#f0f8ff', borderRadius: '8px' }}>
        <h2>權限測試頁面</h2>
        <div><strong>用戶:</strong> {user.displayName} ({user.email})</div>
        <div><strong>角色:</strong> {userRole.displayName} (等級: {userRole.level})</div>
        <div><strong>權限:</strong> {permissions.join(', ')}</div>
        <button onClick={logout} style={{ marginTop: '10px', padding: '8px 16px' }}>登出</button>
      </div>

      <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: '1fr 1fr' }}>
        {/* 權限守衛測試 */}
        <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px' }}>
          <h3>權限守衛測試</h3>
          
          <div style={{ margin: '10px 0', padding: '10px', background: '#f9f9f9' }}>
            <h4>USER_MANAGEMENT 權限 (只有 SUPER_ADMIN, HOST_ADMIN)</h4>
            <PermissionGuard permissions={['USER_MANAGEMENT']}>
              <div style={{ color: 'green' }}>✅ 您有用戶管理權限</div>
            </PermissionGuard>
          </div>

          <div style={{ margin: '10px 0', padding: '10px', background: '#f9f9f9' }}>
            <h4>SONG_REQUEST 權限 (PLAYER 以上)</h4>
            <PermissionGuard permissions={['SONG_REQUEST']}>
              <div style={{ color: 'green' }}>✅ 您可以點歌</div>
            </PermissionGuard>
          </div>

          <div style={{ margin: '10px 0', padding: '10px', background: '#f9f9f9' }}>
            <h4>VIEW_SONGS 權限 (所有角色除了某些限制)</h4>
            <PermissionGuard permissions={['VIEW_SONGS']}>
              <div style={{ color: 'green' }}>✅ 您可以查看歌曲</div>
            </PermissionGuard>
          </div>

          <div style={{ margin: '10px 0', padding: '10px', background: '#f9f9f9' }}>
            <h4>AUDIT_LOGS 權限 (只有 SUPER_ADMIN)</h4>
            <PermissionGuard permissions={['AUDIT_LOGS']}>
              <div style={{ color: 'green' }}>✅ 您可以查看審計日誌</div>
            </PermissionGuard>
          </div>
        </div>

        {/* 角色守衛測試 */}
        <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px' }}>
          <h3>角色守衛測試</h3>
          
          <div style={{ margin: '10px 0', padding: '10px', background: '#f9f9f9' }}>
            <h4>只有 SUPER_ADMIN</h4>
            <RoleGuard allowedRoles={['SUPER_ADMIN']}>
              <div style={{ color: 'green' }}>✅ 您是高層管理員</div>
            </RoleGuard>
          </div>

          <div style={{ margin: '10px 0', padding: '10px', background: '#f9f9f9' }}>
            <h4>SUPER_ADMIN 或 HOST_ADMIN</h4>
            <RoleGuard allowedRoles={['SUPER_ADMIN', 'HOST_ADMIN']}>
              <div style={{ color: 'green' }}>✅ 您是管理員</div>
            </RoleGuard>
          </div>

          <div style={{ margin: '10px 0', padding: '10px', background: '#f9f9f9' }}>
            <h4>最低角色等級 3 (SINGER 以上)</h4>
            <RoleGuard minRole="SINGER">
              <div style={{ color: 'green' }}>✅ 您的角色等級足夠</div>
            </RoleGuard>
          </div>

          <div style={{ margin: '10px 0', padding: '10px', background: '#f9f9f9' }}>
            <h4>排除 GUEST 的所有角色</h4>
            <RoleGuard allowedRoles={['SUPER_ADMIN', 'HOST_ADMIN', 'SINGER', 'PLAYER']}>
              <div style={{ color: 'green' }}>✅ 您不是訪客</div>
            </RoleGuard>
          </div>
        </div>

        {/* Widget 可見性測試 */}
        <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px', gridColumn: '1 / -1' }}>
          <h3>Widget 可見性測試</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
            {[
              'homepage',
              'songRequests', 
              'songList',
              'singers',
              'players',
              'upload',
              'stats',
              'wishSongs',
              'events',
              'permissionManagement'
            ].map(widget => (
              <div 
                key={widget}
                style={{ 
                  padding: '10px', 
                  border: '1px solid #ccc', 
                  borderRadius: '4px',
                  background: canViewWidget(widget) ? '#e6ffe6' : '#ffe6e6'
                }}
              >
                <strong>{widget}</strong><br/>
                {canViewWidget(widget) ? '✅ 可見' : '❌ 隱藏'}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PermissionTest;