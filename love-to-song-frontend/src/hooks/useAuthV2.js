import { useState, useEffect, createContext, useContext } from 'react';

// V2 角色定義 - 對應後端 RBAC 系統
export const ROLES_V2 = {
  SUPER_ADMIN: {
    name: 'SUPER_ADMIN',
    displayName: '高層管理員',
    level: 1,
    color: '#e53e3e',
    permissions: [
      'USER_MANAGEMENT',
      'ROLE_MANAGEMENT', 
      'EVENT_MANAGEMENT',
      'SINGER_MANAGEMENT',
      'QUEUE_MANAGEMENT',
      'WISH_SONG_MANAGEMENT',
      'AUDIT_LOGS',
      'SYSTEM_STATS',
      'DATA_EXPORT'
    ]
  },
  HOST_ADMIN: {
    name: 'HOST_ADMIN', 
    displayName: '主持管理',
    level: 2,
    color: '#d69e2e',
    permissions: [
      'EVENT_MANAGEMENT',
      'QUEUE_MANAGEMENT',
      'SINGER_ASSIGNMENT',
      'REQUEST_CONTROL',
      'EVENT_STATS'
    ]
  },
  SINGER: {
    name: 'SINGER',
    displayName: '歌手',
    level: 3, 
    color: '#38a169',
    permissions: [
      'WISH_SONG_RESPONSE',
      'SONG_MANAGEMENT',
      'MY_REQUESTS',
      'MY_PROFILE'
    ]
  },
  PLAYER: {
    name: 'PLAYER',
    displayName: '玩家',
    level: 4,
    color: '#3182ce', 
    permissions: [
      'SONG_REQUEST',
      'WISH_SONG_SUBMIT',
      'MY_PROFILE',
      'VIEW_SINGERS'
    ]
  },
  GUEST: {
    name: 'GUEST',
    displayName: '訪客', 
    level: 5,
    color: '#718096',
    permissions: [
      'VIEW_SINGERS',
      'VIEW_SONGS',
      'VIEW_HOMEPAGE'
    ]
  }
};

// 權限到功能組件的對應關係
export const WIDGET_PERMISSIONS = {
  'homepage': ['VIEW_HOMEPAGE'], // 所有用戶都可看到首頁
  'songRequests': ['SONG_REQUEST', 'QUEUE_MANAGEMENT', 'REQUEST_CONTROL'], 
  'songList': ['SONG_MANAGEMENT', 'VIEW_SONGS'],
  'singers': ['VIEW_SINGERS'], // 所有用戶都可看到歌手資訊
  'players': ['USER_MANAGEMENT', 'SINGER_MANAGEMENT'],
  'upload': ['USER_MANAGEMENT', 'EVENT_MANAGEMENT'], 
  'stats': ['SYSTEM_STATS', 'EVENT_STATS'],
  'wishSongs': ['WISH_SONG_SUBMIT', 'WISH_SONG_MANAGEMENT', 'WISH_SONG_RESPONSE'],
  'events': ['EVENT_MANAGEMENT'],
  'permissionManagement': ['USER_MANAGEMENT'], // 權限管理功能
  'audit': ['AUDIT_LOGS'],
  'notifications': ['VIEW_NOTIFICATIONS']
};

const AuthContext = createContext(null);

export const useAuthV2 = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState([]);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      const userInfo = localStorage.getItem('userInfo');

      if (token && userInfo) {
        const parsedUser = JSON.parse(userInfo);
        setUser(parsedUser);
        calculatePermissions(parsedUser.roles || []);
      } else {
        // 沒有登入資訊時，設置為訪客模式
        const guestUser = {
          id: 0,
          email: 'guest@system.local',
          displayName: '訪客用戶',
          roles: ['GUEST'],
          status: 'ACTIVE'
        };
        setUser(guestUser);
        calculatePermissions(['GUEST']);
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      // 出錯時也設置為訪客模式
      const guestUser = {
        id: 0,
        email: 'guest@system.local',
        displayName: '訪客用戶',
        roles: ['GUEST'],
        status: 'ACTIVE'
      };
      setUser(guestUser);
      calculatePermissions(['GUEST']);
    } finally {
      setLoading(false);
    }
  };

  const calculatePermissions = (userRoles) => {
    const allPermissions = new Set();
    
    userRoles.forEach(role => {
      const roleConfig = ROLES_V2[role];
      if (roleConfig && roleConfig.permissions) {
        roleConfig.permissions.forEach(perm => allPermissions.add(perm));
      }
    });

    setPermissions(Array.from(allPermissions));
  };

  const login = async (email, password) => {
    try {
      // 模擬登入數據 - 用於測試權限系統
      const mockUsers = {
        'super@test.com': {
          id: 1,
          email: 'super@test.com',
          displayName: '高層管理員',
          roles: ['SUPER_ADMIN'],
          status: 'ACTIVE'
        },
        'host@test.com': {
          id: 2,
          email: 'host@test.com',
          displayName: '主持管理',
          roles: ['HOST_ADMIN'],
          status: 'ACTIVE'
        },
        'singer@test.com': {
          id: 3,
          email: 'singer@test.com',
          displayName: '歌手',
          roles: ['SINGER'],
          status: 'ACTIVE'
        },
        'player@test.com': {
          id: 4,
          email: 'player@test.com',
          displayName: '玩家',
          roles: ['PLAYER'],
          status: 'ACTIVE'
        },
        'guest@test.com': {
          id: 5,
          email: 'guest@test.com',
          displayName: '訪客',
          roles: ['GUEST'],
          status: 'ACTIVE'
        }
      };

      // 驗證密碼（模擬）
      if (password !== '123456') {
        return { success: false, error: '密碼錯誤' };
      }

      const userData = mockUsers[email];
      if (!userData) {
        return { success: false, error: '找不到該用戶' };
      }

      // 模擬 JWT token
      const accessToken = 'mock_jwt_token_' + Date.now();

      // 儲存認證資訊
      localStorage.setItem('token', accessToken);
      localStorage.setItem('userInfo', JSON.stringify(userData));

      setUser(userData);
      calculatePermissions(userData.roles || []);

      return { success: true, user: userData };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
    
    // 設置為訪客用戶而不是 null
    const guestUser = {
      id: 0,
      email: 'guest@system.local',
      displayName: '訪客用戶',
      roles: ['GUEST'],
      status: 'ACTIVE'
    };
    
    setUser(guestUser);
    calculatePermissions(['GUEST']);
  };

  // 檢查是否有特定權限
  const hasPermission = (permission) => {
    return permissions.includes(permission);
  };

  // 檢查是否有任一權限（OR 邏輯）
  const hasAnyPermission = (permissionsList) => {
    return permissionsList.some(perm => permissions.includes(perm));
  };

  // 檢查是否有所有權限（AND 邏輯）
  const hasAllPermissions = (permissionsList) => {
    return permissionsList.every(perm => permissions.includes(perm));
  };

  // 檢查角色等級
  const hasRoleLevel = (requiredLevel) => {
    if (!user || !user.roles) return false;
    
    const userLevel = Math.min(...user.roles.map(role => ROLES_V2[role]?.level || 999));
    return userLevel <= requiredLevel;
  };

  // 檢查是否可以看到特定 widget
  const canViewWidget = (widgetKey) => {
    const requiredPermissions = WIDGET_PERMISSIONS[widgetKey];
    if (!requiredPermissions || requiredPermissions.length === 0) return true;
    
    return hasAnyPermission(requiredPermissions);
  };

  // 獲取用戶最高角色資訊
  const getPrimaryRole = () => {
    if (!user || !user.roles) return ROLES_V2.GUEST;
    
    const userLevel = Math.min(...user.roles.map(role => ROLES_V2[role]?.level || 999));
    const primaryRole = user.roles.find(role => ROLES_V2[role]?.level === userLevel);
    
    return ROLES_V2[primaryRole] || ROLES_V2.GUEST;
  };

  return {
    user,
    loading,
    permissions,
    isAuthenticated: !!user && !user.roles.includes('GUEST'),
    login,
    logout,
    hasPermission,
    hasAnyPermission, 
    hasAllPermissions,
    hasRoleLevel,
    canViewWidget,
    getPrimaryRole,
    refreshAuth: initializeAuth,
    ROLES_V2
  };
};

// Context Provider 組件
export const AuthProvider = ({ children }) => {
  const auth = useAuthV2();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook 來使用 Auth Context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};