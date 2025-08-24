import { useState, useEffect, createContext, useContext } from 'react';
import websocketService from '../services/websocket-simple';

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
      'DATA_EXPORT',
      'SONG_MANAGEMENT',
      'VIEW_SINGERS',
      'SONG_REQUEST'
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
      'MY_PROFILE',
      'EVENT_STATS',  // 允許歌手查看統計資訊
      'SINGER_MANAGEMENT'  // 允許歌手管理其他歌手
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
      'VIEW_SINGERS',
      'EVENT_STATS'  // 允許玩家查看統計資訊
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
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!initialized) {
      initializeAuth();
    }
    
    // 當窗口重新獲得焦點時，檢查認證狀態是否仍然有效
    const handleFocus = () => {
      const token = localStorage.getItem('token');
      const userInfo = localStorage.getItem('userInfo');
      
      if (token && userInfo && !user) {
        // Check auth state on window focus
        // 只有當前沒有用戶但 localStorage 有數據時才重新初始化
        initializeAuth();
      }
    };
    
    // 監聽 localStorage 變化，同步多個標籤頁的認證狀態
    const handleStorageChange = (e) => {
      if (e.key === 'token' || e.key === 'userInfo') {
        // Sync auth state across tabs
        initializeAuth();
      }
    };
    
    window.addEventListener('focus', handleFocus);
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('storage', handleStorageChange);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 只在組件加載時執行一次

  const initializeAuth = async () => {
    // Initialize authentication
    try {
      const token = localStorage.getItem('token');
      const userInfo = localStorage.getItem('userInfo');
      
      // 檢查是否為舊的 mock token，如果是就清除
      if (token && token.startsWith('mock_jwt_token_')) {
        console.log('[AUTH] Removing old mock token');
        localStorage.removeItem('token');
        localStorage.removeItem('userInfo');
      } else if (token && userInfo) {
        try {
          const parsedUser = JSON.parse(userInfo);
          // Restore user from localStorage
          
          // 驗證用戶數據的完整性
          if (parsedUser.id && parsedUser.displayName && parsedUser.roles) {
            setUser(parsedUser);
            calculatePermissions(parsedUser.roles || []);
            
            // 嘗試建立 WebSocket 連接
            if (token && !parsedUser.roles.includes('GUEST')) {
              websocketService.connect(token).then(() => {
                console.log('[Auth] WebSocket 重新連接成功');
              }).catch(wsError => {
                console.warn('[Auth] WebSocket 重新連接失敗:', wsError);
              });
            }
            
            // User session restored successfully
            return; // 成功復原後直接返回，不執行下面的訪客模式設置
          } else {
            console.warn('[AUTH] Invalid user data structure, clearing data');
            localStorage.removeItem('token');
            localStorage.removeItem('userInfo');
          }
        } catch (parseError) {
          console.error('[AUTH] Failed to parse userInfo:', parseError);
          localStorage.removeItem('userInfo');
          if (token) localStorage.removeItem('token');
        }
      }
      
      // 只有在沒有有效認證資訊時才設置為訪客模式
      // No valid auth info found, setting guest mode
      const guestUser = {
        id: 0,
        email: 'guest@system.local',
        displayName: '訪客用戶',
        roles: ['GUEST'],
        status: 'ACTIVE'
      };
      // Setting guest user
      setUser(guestUser);
      calculatePermissions(['GUEST']);
      
    } catch (error) {
      console.error('[AUTH] Failed to initialize auth:', error);
      // 出錯時也設置為訪客模式
      const guestUser = {
        id: 0,
        email: 'guest@system.local',
        displayName: '訪客用戶',
        roles: ['GUEST'],
        status: 'ACTIVE'
      };
      // Error occurred, setting guest user
      setUser(guestUser);
      calculatePermissions(['GUEST']);
    } finally {
      setLoading(false);
      setInitialized(true);
      // Authentication initialization completed
    }
  };

  const calculatePermissions = (userRoles) => {
    // Calculate permissions for user roles
    const allPermissions = new Set();
    
    userRoles.forEach(role => {
      const roleConfig = ROLES_V2[role];
      if (roleConfig && roleConfig.permissions) {
        // Add permissions for role
        roleConfig.permissions.forEach(perm => allPermissions.add(perm));
      }
    });

    const finalPermissions = Array.from(allPermissions);
    // Set final calculated permissions
    setPermissions(finalPermissions);
  };

  const login = async (email, password) => {
    try {
      // 嘗試使用真實後端 API 登入
      const response = await fetch('http://localhost:3001/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          return { success: false, error: '帳號或密碼錯誤' };
        }
        // 後端不可用，返回錯誤
        console.log('[AUTH] Backend unavailable');
        return { success: false, error: '服務器不可用，請稍後再試' };
      }

      const data = await response.json();
      
      // 從後端回應中獲取角色資訊，並將其映射到前端角色系統
      const backendRole = data.user.role || 'GUEST';
      
      // 後端到前端角色映射
      const roleMapping = {
        'SUPER_ADMIN': ['SUPER_ADMIN'],
        'ADMIN': ['SUPER_ADMIN'], // ADMIN 映射到 SUPER_ADMIN
        'MANAGER': ['HOST_ADMIN'], // MANAGER 映射到 HOST_ADMIN
        'USER': ['PLAYER'], // USER 映射到 PLAYER
        'GUEST': ['GUEST']
      };

      // 構建用戶數據
      const userDataWithRoles = {
        id: data.user.id,
        email: data.user.email,
        displayName: data.user.displayName || '用戶',
        roles: roleMapping[backendRole] || ['GUEST'],
        status: 'ACTIVE',
        loginTime: new Date().toISOString(),
      };

      // 儲存認證資訊
      try {
        localStorage.setItem('token', data.token);
        localStorage.setItem('userInfo', JSON.stringify(userDataWithRoles));
      } catch (storageError) {
        console.error('[AUTH] Failed to save to localStorage:', storageError);
        return { success: false, error: '無法儲存登入資訊' };
      }

      setUser(userDataWithRoles);
      calculatePermissions(userDataWithRoles.roles || []);

      // 建立 WebSocket 連接
      try {
        await websocketService.connect(data.token);
        console.log('[Auth] WebSocket 連接成功');
      } catch (wsError) {
        console.warn('[Auth] WebSocket 連接失敗:', wsError);
      }

      return { success: true, user: userDataWithRoles };
    } catch (error) {
      console.error('[AUTH] Backend connection failed:', error);
      // 網絡錯誤，返回錯誤
      return { success: false, error: '網絡連接失敗，請檢查網絡狀況後重試' };
    }
  };


  const logout = () => {
    // User manually logging out
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('userInfo');
      // Cleared localStorage
    } catch (error) {
      console.error('[AUTH] Error clearing localStorage:', error);
    }
    
    // 斷開 WebSocket 連接
    try {
      websocketService.disconnect();
      console.log('[Auth] WebSocket 已斷開');
    } catch (wsError) {
      console.warn('[Auth] WebSocket 斷開失敗:', wsError);
    }
    
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
    // Logout completed, set to guest mode
  };
  
  // 添加一個手動刷新認證的功能
  const refreshAuth = () => {
    // Manually refreshing authentication
    initializeAuth();
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
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }
    
    const hasAccess = hasAnyPermission(requiredPermissions);
    return hasAccess;
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
    refreshAuth, // 新增的手動刷新功能
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