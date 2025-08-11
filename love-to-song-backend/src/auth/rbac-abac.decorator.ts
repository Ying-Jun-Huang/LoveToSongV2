import { SetMetadata } from '@nestjs/common';
import { Permission } from './rbac-abac.system';

export const PERMISSION_KEY = 'permission';

// 權限裝飾器
export const RequirePermission = (entity: string, action: string) =>
  SetMetadata(PERMISSION_KEY, { entity, action });

// 多重權限裝飾器（滿足其中一個即可）
export const RequireAnyPermission = (...permissions: { entity: string; action: string }[]) =>
  SetMetadata(PERMISSION_KEY, { type: 'any', permissions });

// 多重權限裝飾器（必須全部滿足）
export const RequireAllPermissions = (...permissions: { entity: string; action: string }[]) =>
  SetMetadata(PERMISSION_KEY, { type: 'all', permissions });

// 資源擁有者檢查裝飾器
export const RequireOwnership = (entityField: string = 'userId') =>
  SetMetadata('ownership', { entityField });

// 活動範圍檢查裝飾器
export const RequireEventScope = (eventField: string = 'eventId') =>
  SetMetadata('eventScope', { eventField });