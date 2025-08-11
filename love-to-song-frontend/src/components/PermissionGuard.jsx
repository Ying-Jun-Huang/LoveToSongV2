import React from 'react';
import { useAuth } from '../hooks/useAuthV2';

/**
 * 權限守衛組件 - 根據權限決定是否渲染子組件
 */
export const PermissionGuard = ({ 
  permissions = [], 
  roles = [],
  requireAll = false, 
  fallback = null,
  showFallback = true,
  children 
}) => {
  const { hasAnyPermission, hasAllPermissions, hasRoleLevel, user, getPrimaryRole, ROLES_V2 } = useAuth();

  // 檢查權限
  const hasPermission = () => {
    // 如果沒有指定權限要求，則允許所有已登入用戶
    if (permissions.length === 0 && roles.length === 0) {
      return !!user;
    }

    // 檢查角色等級
    if (roles.length > 0) {
      const roleConfig = getPrimaryRole();
      const hasRequiredRole = roles.some(role => {
        return roleConfig.level <= (typeof role === 'string' ? 
          (ROLES_V2[role]?.level || 999) : role);
      });
      
      if (!hasRequiredRole) return false;
    }

    // 檢查具體權限
    if (permissions.length > 0) {
      return requireAll ? 
        hasAllPermissions(permissions) : 
        hasAnyPermission(permissions);
    }

    return true;
  };

  if (!hasPermission()) {
    if (!showFallback) return null;
    
    return fallback || (
      <div className="permission-denied">
        <div className="permission-denied-content">
          <div className="permission-denied-icon">🚫</div>
          <h3>權限不足</h3>
          <p>您沒有權限查看此內容</p>
          <small>如需協助請聯繫管理員</small>
        </div>
        
        <style jsx="true">{`
          .permission-denied {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 200px;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            border-radius: 8px;
            margin: 10px;
          }
          
          .permission-denied-content {
            text-align: center;
            color: #6b7280;
          }
          
          .permission-denied-icon {
            font-size: 48px;
            margin-bottom: 16px;
            opacity: 0.7;
          }
          
          .permission-denied-content h3 {
            margin: 0 0 8px 0;
            color: #374151;
            font-size: 18px;
            font-weight: 600;
          }
          
          .permission-denied-content p {
            margin: 0 0 4px 0;
            color: #6b7280;
            font-size: 14px;
          }
          
          .permission-denied-content small {
            color: #9ca3af;
            font-size: 12px;
          }
        `}</style>
      </div>
    );
  }

  return <>{children}</>;
};

/**
 * 角色守衛組件 - 只檢查角色等級
 */
export const RoleGuard = ({ 
  minRole, 
  allowedRoles = [],
  fallback = null, 
  children 
}) => {
  const { user, getPrimaryRole, ROLES_V2 } = useAuth();
  
  if (!user) {
    return fallback || <div>請先登入</div>;
  }

  const userRole = getPrimaryRole();
  
  // 檢查允許的角色列表
  if (allowedRoles.length > 0) {
    const isAllowed = allowedRoles.includes(userRole.name);
    if (!isAllowed) {
      return fallback || <div>角色權限不足</div>;
    }
  }
  
  // 檢查最小角色等級
  if (minRole) {
    const minRoleLevel = typeof minRole === 'string' ? 
      (ROLES_V2[minRole]?.level || 999) : minRole;
    
    if (userRole.level > minRoleLevel) {
      return fallback || <div>權限等級不足</div>;
    }
  }

  return <>{children}</>;
};

/**
 * 登入守衛組件 - 檢查是否已登入
 */
export const AuthGuard = ({ fallback = null, children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="loading-spinner">⏳</div>
        <p>載入中...</p>
        
        <style jsx="true">{`
          .auth-loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 200px;
            color: #6b7280;
          }
          
          .loading-spinner {
            font-size: 32px;
            margin-bottom: 16px;
            animation: spin 2s linear infinite;
          }
          
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!isAuthenticated) {
    return fallback || (
      <div className="auth-required">
        <div className="auth-required-content">
          <div className="auth-required-icon">🔐</div>
          <h3>需要登入</h3>
          <p>請先登入以查看此內容</p>
          <button 
            onClick={() => window.location.href = '/login'}
            className="login-btn"
          >
            前往登入
          </button>
        </div>
        
        <style jsx="true">{`
          .auth-required {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 300px;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            border-radius: 8px;
            margin: 10px;
          }
          
          .auth-required-content {
            text-align: center;
            color: #6b7280;
          }
          
          .auth-required-icon {
            font-size: 48px;
            margin-bottom: 16px;
            opacity: 0.7;
          }
          
          .auth-required-content h3 {
            margin: 0 0 8px 0;
            color: #374151;
            font-size: 18px;
            font-weight: 600;
          }
          
          .auth-required-content p {
            margin: 0 0 20px 0;
            color: #6b7280;
            font-size: 14px;
          }
          
          .login-btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 10px 24px;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
          }
          
          .login-btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
          }
        `}</style>
      </div>
    );
  }

  return <>{children}</>;
};

export default PermissionGuard;