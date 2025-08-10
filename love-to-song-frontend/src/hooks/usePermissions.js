import { useState, useEffect } from 'react';

// 權限級別定義 (數字越小權限越高)
export const ROLES = {
  SUPER_ADMIN: { level: 1, name: '高層管理員', color: '#e53e3e' },
  ADMIN: { level: 2, name: '中間管理員', color: '#d69e2e' },
  MANAGER: { level: 3, name: '基層管理員', color: '#38a169' },
  USER: { level: 4, name: '使用者', color: '#3182ce' },
  GUEST: { level: 5, name: '訪客', color: '#718096' },
};

export const usePermissions = () => {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState({});

  useEffect(() => {
    // 從 localStorage 獲取用戶資訊
    const token = localStorage.getItem('token');
    const userInfo = localStorage.getItem('userInfo');
    
    if (token && userInfo) {
      try {
        const parsedUser = JSON.parse(userInfo);
        setUser(parsedUser);
        calculatePermissions(parsedUser.role);
      } catch (error) {
        console.error('Failed to parse user info:', error);
      }
    }
  }, []);

  const calculatePermissions = (userRole) => {
    const userLevel = ROLES[userRole]?.level || 999;
    
    setPermissions({
      // 系統管理權限
      canManageUsers: userLevel <= ROLES.SUPER_ADMIN.level,
      canManageRoles: userLevel <= ROLES.SUPER_ADMIN.level,
      
      // 內容管理權限  
      canManageContent: userLevel <= ROLES.ADMIN.level,
      canViewStats: userLevel <= ROLES.ADMIN.level,
      
      // 操作管理權限
      canManagePlayers: userLevel <= ROLES.MANAGER.level,
      canManageSongs: userLevel <= ROLES.MANAGER.level,
      canManageRequests: userLevel <= ROLES.MANAGER.level,
      canUploadFiles: userLevel <= ROLES.MANAGER.level,
      
      // 基本權限
      canViewPlayers: userLevel <= ROLES.USER.level,
      canRequestSongs: userLevel <= ROLES.USER.level,
      canUpdateProfile: userLevel <= ROLES.USER.level,
      
      // 訪客權限
      canViewOnly: userLevel <= ROLES.GUEST.level,
    });
  };

  const hasPermission = (requiredRole) => {
    if (!user) return false;
    const userLevel = ROLES[user.role]?.level || 999;
    const requiredLevel = ROLES[requiredRole]?.level || 0;
    return userLevel <= requiredLevel;
  };

  const getRoleInfo = (role) => {
    return ROLES[role] || { level: 999, name: '未知', color: '#gray' };
  };

  return {
    user,
    permissions,
    hasPermission,
    getRoleInfo,
    isLoggedIn: !!user,
  };
};