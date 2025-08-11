import { SetMetadata, createParamDecorator, ExecutionContext } from '@nestjs/common';

// 稽核裝飾器元數據鍵
export const AUDIT_METADATA_KEY = 'audit';

// 稽核配置接口
export interface AuditConfig {
  action: string;
  entityType: string;
  getEntityId?: (args: any[], result?: any) => number | undefined;
  getDetails?: (args: any[], result?: any) => Record<string, any> | undefined;
  skipOnError?: boolean;
  sensitive?: boolean; // 是否包含敏感資料
}

// 稽核裝飾器
export const Audit = (config: AuditConfig) => SetMetadata(AUDIT_METADATA_KEY, config);

// 取得 IP 地址的裝飾器
export const GetIpAddress = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return request.ip || 
         request.headers['x-forwarded-for']?.split(',')[0] || 
         request.headers['x-real-ip'] || 
         request.connection?.remoteAddress;
});

// 取得 User Agent 的裝飾器
export const GetUserAgent = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return request.headers['user-agent'];
});

// 常用稽核動作
export const AUDIT_ACTIONS = {
  // 用戶相關
  USER_LOGIN: 'USER_LOGIN',
  USER_LOGOUT: 'USER_LOGOUT',
  USER_REGISTER: 'USER_REGISTER',
  USER_UPDATE_PROFILE: 'USER_UPDATE_PROFILE',
  USER_UPDATE_ROLE: 'USER_UPDATE_ROLE',
  USER_PROXY_LOGIN: 'USER_PROXY_LOGIN',

  // 活動相關
  EVENT_CREATE: 'EVENT_CREATE',
  EVENT_UPDATE: 'EVENT_UPDATE',
  EVENT_DELETE: 'EVENT_DELETE',
  EVENT_START: 'EVENT_START',
  EVENT_END: 'EVENT_END',
  EVENT_ASSIGN_SINGER: 'EVENT_ASSIGN_SINGER',

  // 點歌相關
  REQUEST_CREATE: 'REQUEST_CREATE',
  REQUEST_ASSIGN: 'REQUEST_ASSIGN',
  REQUEST_UPDATE_STATUS: 'REQUEST_UPDATE_STATUS',
  REQUEST_REORDER: 'REQUEST_REORDER',
  REQUEST_CANCEL: 'REQUEST_CANCEL',

  // 願望歌相關
  WISH_SONG_CREATE: 'WISH_SONG_CREATE',
  WISH_SONG_APPROVE: 'WISH_SONG_APPROVE',
  WISH_SONG_BATCH_APPROVE: 'WISH_SONG_BATCH_APPROVE',
  WISH_SONG_DELETE: 'WISH_SONG_DELETE',
  WISH_SONG_ADD_TO_SONGBOOK: 'WISH_SONG_ADD_TO_SONGBOOK',

  // 歌曲相關
  SONG_CREATE: 'SONG_CREATE',
  SONG_UPDATE: 'SONG_UPDATE',
  SONG_DELETE: 'SONG_DELETE',

  // 歌手相關
  SINGER_CREATE: 'SINGER_CREATE',
  SINGER_UPDATE: 'SINGER_UPDATE',
  SINGER_ACTIVATE: 'SINGER_ACTIVATE',
  SINGER_DEACTIVATE: 'SINGER_DEACTIVATE',

  // 系統相關
  SYSTEM_BACKUP: 'SYSTEM_BACKUP',
  SYSTEM_RESTORE: 'SYSTEM_RESTORE',
  AUDIT_LOG_EXPORT: 'AUDIT_LOG_EXPORT',
  AUDIT_LOG_CLEANUP: 'AUDIT_LOG_CLEANUP',

  // 數據相關
  DATA_EXPORT: 'DATA_EXPORT',
  DATA_IMPORT: 'DATA_IMPORT',
  BULK_UPDATE: 'BULK_UPDATE',
  BULK_DELETE: 'BULK_DELETE',

  // 權限相關
  PERMISSION_CHECK: 'PERMISSION_CHECK',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  ROLE_ASSIGNMENT: 'ROLE_ASSIGNMENT',

  // 安全相關
  SECURITY_LOGIN_FAILED: 'SECURITY_LOGIN_FAILED',
  SECURITY_SUSPICIOUS_ACTIVITY: 'SECURITY_SUSPICIOUS_ACTIVITY',
  SECURITY_PASSWORD_RESET: 'SECURITY_PASSWORD_RESET'
} as const;

// 常用實體類型
export const AUDIT_ENTITY_TYPES = {
  USER: 'USER',
  EVENT: 'EVENT',
  REQUEST: 'REQUEST',
  WISH_SONG: 'WISH_SONG',
  SONG: 'SONG',
  SINGER: 'SINGER',
  PLAYER: 'PLAYER',
  AUDIT_LOG: 'AUDIT_LOG',
  SYSTEM: 'SYSTEM'
} as const;