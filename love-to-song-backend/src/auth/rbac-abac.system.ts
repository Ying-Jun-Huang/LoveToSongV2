// RBAC + ABAC 權限管理系統
export interface Permission {
  entity: string;
  action: string;
  conditions?: ABACCondition[];
}

export interface ABACCondition {
  type: 'own' | 'event_scope' | 'public_only' | 'masked' | 'role_level';
  value?: any;
}

export interface AuthContext {
  userId: number;
  roles: string[];
  eventIds?: number[];  // 用戶管理或參與的活動
  singerId?: number;    // 如果是歌手
  playerId?: number;    // 如果是玩家
}

// 五種角色定義
export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',     // 高層管理員
  HOST_ADMIN: 'HOST_ADMIN',       // 主持管理
  SINGER: 'SINGER',               // 歌手
  PLAYER: 'PLAYER',               // 玩家
  GUEST: 'GUEST'                  // 訪客
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

// 權限層級 (數字越小權限越高)
export const ROLE_HIERARCHY: Record<Role, number> = {
  [ROLES.SUPER_ADMIN]: 1,
  [ROLES.HOST_ADMIN]: 2,
  [ROLES.SINGER]: 3,
  [ROLES.PLAYER]: 4,
  [ROLES.GUEST]: 5
};

// 實體類型
export const ENTITIES = {
  USER: 'User',
  SINGER: 'Singer',
  SONG: 'Song',
  SONG_VERSION: 'SongVersion',
  PLAYER: 'Player',
  EVENT: 'Event',
  REQUEST: 'Request',
  WISH_SONG: 'WishSong',
  TAG: 'Tag',
  MEDIA: 'MediaAsset',
  NOTIFICATION: 'Notification',
  ANALYTICS: 'Analytics',
  AUDIT_LOG: 'AuditLog'
} as const;

// 操作類型
export const ACTIONS = {
  VIEW: 'view',
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  ASSIGN: 'assign',
  APPROVE: 'approve',
  REORDER: 'reorder',
  EXPORT: 'export',
  PROXY: 'proxy'
} as const;

// ABAC 條件類型
export const ABAC_CONDITIONS = {
  OWN: 'own',                    // 自己的資源
  EVENT_SCOPE: 'event_scope',    // 活動範圍內
  PUBLIC_ONLY: 'public_only',    // 僅公開欄位
  MASKED: 'masked'               // 脫敏顯示
} as const;

// 角色權限配置
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  // 1) 高層管理員 - 全域權限
  [ROLES.SUPER_ADMIN]: [
    // 用戶管理
    { entity: ENTITIES.USER, action: ACTIONS.VIEW },
    { entity: ENTITIES.USER, action: ACTIONS.UPDATE },
    { entity: ENTITIES.USER, action: ACTIONS.DELETE },
    { entity: ENTITIES.USER, action: ACTIONS.PROXY },
    
    // 歌手管理
    { entity: ENTITIES.SINGER, action: ACTIONS.VIEW },
    { entity: ENTITIES.SINGER, action: ACTIONS.CREATE },
    { entity: ENTITIES.SINGER, action: ACTIONS.UPDATE },
    { entity: ENTITIES.SINGER, action: ACTIONS.DELETE },
    { entity: ENTITIES.SINGER, action: ACTIONS.APPROVE },
    
    // 歌曲管理
    { entity: ENTITIES.SONG, action: ACTIONS.VIEW },
    { entity: ENTITIES.SONG, action: ACTIONS.CREATE },
    { entity: ENTITIES.SONG, action: ACTIONS.UPDATE },
    { entity: ENTITIES.SONG, action: ACTIONS.DELETE },
    { entity: ENTITIES.SONG, action: ACTIONS.APPROVE },
    
    // 玩家管理
    { entity: ENTITIES.PLAYER, action: ACTIONS.VIEW },
    { entity: ENTITIES.PLAYER, action: ACTIONS.UPDATE },
    { entity: ENTITIES.PLAYER, action: ACTIONS.DELETE },
    
    // 活動管理
    { entity: ENTITIES.EVENT, action: ACTIONS.VIEW },
    { entity: ENTITIES.EVENT, action: ACTIONS.CREATE },
    { entity: ENTITIES.EVENT, action: ACTIONS.UPDATE },
    { entity: ENTITIES.EVENT, action: ACTIONS.DELETE },
    { entity: ENTITIES.EVENT, action: ACTIONS.ASSIGN },
    
    // 點歌管理
    { entity: ENTITIES.REQUEST, action: ACTIONS.VIEW },
    { entity: ENTITIES.REQUEST, action: ACTIONS.ASSIGN },
    { entity: ENTITIES.REQUEST, action: ACTIONS.REORDER },
    { entity: ENTITIES.REQUEST, action: ACTIONS.UPDATE },
    { entity: ENTITIES.REQUEST, action: ACTIONS.DELETE },
    { entity: ENTITIES.REQUEST, action: ACTIONS.APPROVE },
    
    // 願望歌管理
    { entity: ENTITIES.WISH_SONG, action: ACTIONS.VIEW },
    { entity: ENTITIES.WISH_SONG, action: ACTIONS.UPDATE },
    { entity: ENTITIES.WISH_SONG, action: ACTIONS.DELETE },
    { entity: ENTITIES.WISH_SONG, action: ACTIONS.APPROVE },
    
    // 媒體管理
    { entity: ENTITIES.MEDIA, action: ACTIONS.VIEW },
    { entity: ENTITIES.MEDIA, action: ACTIONS.DELETE },
    
    // 通知管理
    { entity: ENTITIES.NOTIFICATION, action: ACTIONS.VIEW },
    { entity: ENTITIES.NOTIFICATION, action: ACTIONS.CREATE },
    
    // 報表和稽核
    { entity: ENTITIES.ANALYTICS, action: ACTIONS.VIEW },
    { entity: ENTITIES.ANALYTICS, action: ACTIONS.EXPORT },
    { entity: ENTITIES.AUDIT_LOG, action: ACTIONS.VIEW },
    { entity: ENTITIES.AUDIT_LOG, action: ACTIONS.EXPORT },
  ],

  // 2) 主持管理 - 活動範圍權限
  [ROLES.HOST_ADMIN]: [
    // 活動管理（自己管理的）
    { entity: ENTITIES.EVENT, action: ACTIONS.VIEW, conditions: [{ type: ABAC_CONDITIONS.OWN }] },
    { entity: ENTITIES.EVENT, action: ACTIONS.CREATE },
    { entity: ENTITIES.EVENT, action: ACTIONS.UPDATE, conditions: [{ type: ABAC_CONDITIONS.OWN }] },
    { entity: ENTITIES.EVENT, action: ACTIONS.DELETE, conditions: [{ type: ABAC_CONDITIONS.OWN }] },
    { entity: ENTITIES.EVENT, action: ACTIONS.ASSIGN, conditions: [{ type: ABAC_CONDITIONS.OWN }] },
    
    // 點歌管理（活動範圍內）
    { entity: ENTITIES.REQUEST, action: ACTIONS.VIEW, conditions: [{ type: ABAC_CONDITIONS.EVENT_SCOPE }] },
    { entity: ENTITIES.REQUEST, action: ACTIONS.ASSIGN, conditions: [{ type: ABAC_CONDITIONS.EVENT_SCOPE }] },
    { entity: ENTITIES.REQUEST, action: ACTIONS.REORDER, conditions: [{ type: ABAC_CONDITIONS.EVENT_SCOPE }] },
    { entity: ENTITIES.REQUEST, action: ACTIONS.UPDATE, conditions: [{ type: ABAC_CONDITIONS.EVENT_SCOPE }] },
    { entity: ENTITIES.REQUEST, action: ACTIONS.DELETE, conditions: [{ type: ABAC_CONDITIONS.EVENT_SCOPE }] },
    
    // 歌手資訊（公開）
    { entity: ENTITIES.SINGER, action: ACTIONS.VIEW, conditions: [{ type: ABAC_CONDITIONS.PUBLIC_ONLY }] },
    
    // 歌曲資訊（公開）
    { entity: ENTITIES.SONG, action: ACTIONS.VIEW },
    { entity: ENTITIES.SONG_VERSION, action: ACTIONS.VIEW },
    
    // 願望歌管理（活動範圍內）
    { entity: ENTITIES.WISH_SONG, action: ACTIONS.VIEW, conditions: [{ type: ABAC_CONDITIONS.EVENT_SCOPE }] },
    { entity: ENTITIES.WISH_SONG, action: ACTIONS.APPROVE, conditions: [{ type: ABAC_CONDITIONS.EVENT_SCOPE }] },
    
    // 玩家資訊（活動範圍內，脫敏）
    { entity: ENTITIES.PLAYER, action: ACTIONS.VIEW, conditions: [
      { type: ABAC_CONDITIONS.EVENT_SCOPE },
      { type: ABAC_CONDITIONS.MASKED }
    ]},
    
    // 媒體管理（活動內）
    { entity: ENTITIES.MEDIA, action: ACTIONS.VIEW, conditions: [{ type: ABAC_CONDITIONS.EVENT_SCOPE }] },
    { entity: ENTITIES.MEDIA, action: ACTIONS.CREATE, conditions: [{ type: ABAC_CONDITIONS.EVENT_SCOPE }] },
    { entity: ENTITIES.MEDIA, action: ACTIONS.DELETE, conditions: [{ type: ABAC_CONDITIONS.OWN }] },
    
    // 通知（活動範圍內）
    { entity: ENTITIES.NOTIFICATION, action: ACTIONS.CREATE, conditions: [{ type: ABAC_CONDITIONS.EVENT_SCOPE }] },
    
    // 報表（活動範圍內）
    { entity: ENTITIES.ANALYTICS, action: ACTIONS.VIEW, conditions: [{ type: ABAC_CONDITIONS.EVENT_SCOPE }] },
  ],

  // 3) 歌手 - 個人資源管理
  [ROLES.SINGER]: [
    // 自己的歌手資料
    { entity: ENTITIES.SINGER, action: ACTIONS.VIEW, conditions: [{ type: ABAC_CONDITIONS.OWN }] },
    { entity: ENTITIES.SINGER, action: ACTIONS.UPDATE, conditions: [{ type: ABAC_CONDITIONS.OWN }] },
    
    // 歌曲管理（全站查看，自己的歌單管理）
    { entity: ENTITIES.SONG, action: ACTIONS.VIEW },
    { entity: ENTITIES.SONG_VERSION, action: ACTIONS.VIEW },
    
    // 點歌處理（指派給自己的）
    { entity: ENTITIES.REQUEST, action: ACTIONS.VIEW, conditions: [{ type: ABAC_CONDITIONS.OWN }] },
    { entity: ENTITIES.REQUEST, action: ACTIONS.UPDATE, conditions: [{ type: ABAC_CONDITIONS.OWN }] },
    
    // 活動查看（自己參與的）
    { entity: ENTITIES.EVENT, action: ACTIONS.VIEW, conditions: [{ type: ABAC_CONDITIONS.EVENT_SCOPE }] },
    
    // 願望歌處理（指給自己的）
    { entity: ENTITIES.WISH_SONG, action: ACTIONS.VIEW, conditions: [{ type: ABAC_CONDITIONS.OWN }] },
    { entity: ENTITIES.WISH_SONG, action: ACTIONS.UPDATE, conditions: [{ type: ABAC_CONDITIONS.OWN }] },
    
    // 玩家資訊（演出互動，脫敏）
    { entity: ENTITIES.PLAYER, action: ACTIONS.VIEW, conditions: [
      { type: ABAC_CONDITIONS.EVENT_SCOPE },
      { type: ABAC_CONDITIONS.MASKED }
    ]},
    
    // 媒體管理（自己的）
    { entity: ENTITIES.MEDIA, action: ACTIONS.CREATE, conditions: [{ type: ABAC_CONDITIONS.OWN }] },
    { entity: ENTITIES.MEDIA, action: ACTIONS.DELETE, conditions: [{ type: ABAC_CONDITIONS.OWN }] },
    
    // 通知（追蹤者或互動玩家）
    { entity: ENTITIES.NOTIFICATION, action: ACTIONS.CREATE, conditions: [{ type: ABAC_CONDITIONS.EVENT_SCOPE }] },
    
    // 個人報表
    { entity: ENTITIES.ANALYTICS, action: ACTIONS.VIEW, conditions: [{ type: ABAC_CONDITIONS.OWN }] },
  ],

  // 4) 玩家 - 基本功能
  [ROLES.PLAYER]: [
    // 點歌功能
    { entity: ENTITIES.REQUEST, action: ACTIONS.CREATE },
    { entity: ENTITIES.REQUEST, action: ACTIONS.VIEW, conditions: [{ type: ABAC_CONDITIONS.OWN }] },
    { entity: ENTITIES.REQUEST, action: ACTIONS.UPDATE, conditions: [{ type: ABAC_CONDITIONS.OWN }] },
    
    // 願望歌功能
    { entity: ENTITIES.WISH_SONG, action: ACTIONS.CREATE },
    { entity: ENTITIES.WISH_SONG, action: ACTIONS.VIEW, conditions: [{ type: ABAC_CONDITIONS.OWN }] },
    
    // 個人資料管理
    { entity: ENTITIES.PLAYER, action: ACTIONS.VIEW, conditions: [{ type: ABAC_CONDITIONS.OWN }] },
    { entity: ENTITIES.PLAYER, action: ACTIONS.UPDATE, conditions: [{ type: ABAC_CONDITIONS.OWN }] },
    
    // 公開資訊查看
    { entity: ENTITIES.SINGER, action: ACTIONS.VIEW, conditions: [{ type: ABAC_CONDITIONS.PUBLIC_ONLY }] },
    { entity: ENTITIES.SONG, action: ACTIONS.VIEW, conditions: [{ type: ABAC_CONDITIONS.PUBLIC_ONLY }] },
    { entity: ENTITIES.EVENT, action: ACTIONS.VIEW, conditions: [{ type: ABAC_CONDITIONS.PUBLIC_ONLY }] },
    
    // 通知接收
    { entity: ENTITIES.NOTIFICATION, action: ACTIONS.VIEW, conditions: [{ type: ABAC_CONDITIONS.OWN }] },
  ],

  // 5) 訪客 - 僅瀏覽
  [ROLES.GUEST]: [
    // 公開資訊查看
    { entity: ENTITIES.SINGER, action: ACTIONS.VIEW, conditions: [{ type: ABAC_CONDITIONS.PUBLIC_ONLY }] },
    { entity: ENTITIES.SONG, action: ACTIONS.VIEW, conditions: [{ type: ABAC_CONDITIONS.PUBLIC_ONLY }] },
    { entity: ENTITIES.EVENT, action: ACTIONS.VIEW, conditions: [{ type: ABAC_CONDITIONS.PUBLIC_ONLY }] },
  ]
};

// 權限檢查函數
export class PermissionService {
  // 檢查用戶是否有權限執行特定操作
  static hasPermission(
    context: AuthContext,
    entity: string,
    action: string,
    resource?: any
  ): boolean {
    // 獲取用戶的所有權限
    const userPermissions = this.getUserPermissions(context);
    
    // 查找匹配的權限
    const matchingPermissions = userPermissions.filter(p => 
      p.entity === entity && p.action === action
    );
    
    if (matchingPermissions.length === 0) {
      return false;
    }
    
    // 檢查 ABAC 條件
    return matchingPermissions.some(permission => 
      this.checkABACConditions(permission.conditions || [], context, resource)
    );
  }
  
  // 獲取用戶的所有權限
  private static getUserPermissions(context: AuthContext): Permission[] {
    const allPermissions: Permission[] = [];
    
    // 根據角色層級獲取權限（高權限角色繼承低權限角色的權限）
    const userRoleLevel = Math.min(...context.roles.map(role => 
      ROLE_HIERARCHY[role as Role] || 999
    ));
    
    Object.entries(ROLE_HIERARCHY).forEach(([role, level]) => {
      if (level >= userRoleLevel) {
        const rolePermissions = ROLE_PERMISSIONS[role as Role] || [];
        allPermissions.push(...rolePermissions);
      }
    });
    
    return allPermissions;
  }
  
  // 檢查 ABAC 條件
  private static checkABACConditions(
    conditions: ABACCondition[],
    context: AuthContext,
    resource?: any
  ): boolean {
    if (conditions.length === 0) {
      return true;
    }
    
    return conditions.every(condition => {
      switch (condition.type) {
        case ABAC_CONDITIONS.OWN:
          return resource?.userId === context.userId ||
                 resource?.singerId === context.singerId ||
                 resource?.playerId === context.playerId;
                 
        case ABAC_CONDITIONS.EVENT_SCOPE:
          return !context.eventIds || 
                 context.eventIds.includes(resource?.eventId);
                 
        case ABAC_CONDITIONS.PUBLIC_ONLY:
          // 這個條件在查詢時處理，這裡總是返回 true
          return true;
          
        case ABAC_CONDITIONS.MASKED:
          // 這個條件在數據返回時處理，這裡總是返回 true
          return true;
          
        default:
          return false;
      }
    });
  }
  
  // 過濾敏感欄位（實現 MASKED 條件）
  static maskSensitiveFields(data: any, context: AuthContext, entityType: string): any {
    // 根據用戶角色和實體類型決定要遮罩哪些欄位
    const maskedFields = this.getMaskedFields(context, entityType);
    
    if (maskedFields.length === 0) {
      return data;
    }
    
    const masked = { ...data };
    maskedFields.forEach(field => {
      if (masked[field]) {
        masked[field] = this.maskField(masked[field], field);
      }
    });
    
    return masked;
  }
  
  private static getMaskedFields(context: AuthContext, entityType: string): string[] {
    const userRoleLevel = Math.min(...context.roles.map(role => 
      ROLE_HIERARCHY[role as Role] || 999
    ));
    
    // 根據角色層級和實體類型返回需要遮罩的欄位
    switch (entityType) {
      case ENTITIES.PLAYER:
        return userRoleLevel >= ROLE_HIERARCHY[ROLES.SINGER] 
          ? ['email', 'phone', 'birthday'] 
          : [];
      case ENTITIES.SINGER:
        return userRoleLevel >= ROLE_HIERARCHY[ROLES.HOST_ADMIN] 
          ? ['email', 'phone'] 
          : [];
      default:
        return [];
    }
  }
  
  private static maskField(value: any, fieldName: string): any {
    if (typeof value !== 'string') {
      return value;
    }
    
    switch (fieldName) {
      case 'email':
        return value.replace(/(.{2}).*(@.*)/, '$1***$2');
      case 'phone':
        return value.replace(/(\d{3}).*(\d{4})/, '$1****$2');
      case 'birthday':
        return value.substring(0, 7) + '-**';
      default:
        return '***';
    }
  }
}