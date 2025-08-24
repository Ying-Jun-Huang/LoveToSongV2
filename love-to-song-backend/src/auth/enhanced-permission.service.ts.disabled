import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ROLE_PERMISSIONS } from './rbac-abac.system';

export interface UserPermissionResult {
  userId: number;
  basePermissions: string[];
  overridePermissions: { permission: string; granted: boolean; reason?: string }[];
  finalPermissions: string[];
  effectiveRole: string;
}

@Injectable()
export class EnhancedPermissionService {
  constructor(private prisma: PrismaService) {}

  /**
   * 計算用戶的最終權限
   * @param userId 用戶ID
   * @returns 用戶的完整權限資訊
   */
  async calculateUserPermissions(userId: number): Promise<UserPermissionResult> {
    // 1. 獲取用戶基礎角色權限
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: { role: true }
        },
        permissionOverrides: {
          where: {
            OR: [
              { expiresAt: null },
              { expiresAt: { gte: new Date() } }
            ]
          }
        }
      }
    });

    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    // 2. 計算基礎權限（從角色獲得）
    const basePermissions = new Set<string>();
    let primaryRole = 'GUEST';
    
    for (const userRole of user.userRoles) {
      const roleName = userRole.role.name;
      const rolePermissions = ROLE_PERMISSIONS[roleName] || [];
      
      // 添加角色權限
      rolePermissions.forEach(perm => {
        basePermissions.add(`${perm.entity}_${perm.action}`);
      });
      
      // 確定主要角色（權限等級最高的）
      if (this.getRoleLevel(roleName) < this.getRoleLevel(primaryRole)) {
        primaryRole = roleName;
      }
    }

    // 3. 應用個人權限覆蓋
    const overridePermissions: { permission: string; granted: boolean; reason?: string }[] = [];
    const finalPermissions = new Set(basePermissions);

    for (const override of user.permissionOverrides) {
      overridePermissions.push({
        permission: override.permission,
        granted: override.granted,
        reason: override.reason || undefined
      });

      if (override.granted) {
        finalPermissions.add(override.permission);
      } else {
        finalPermissions.delete(override.permission);
      }
    }

    return {
      userId,
      basePermissions: Array.from(basePermissions),
      overridePermissions,
      finalPermissions: Array.from(finalPermissions),
      effectiveRole: primaryRole
    };
  }

  /**
   * 檢查用戶是否有特定權限
   */
  async hasPermission(userId: number, permission: string): Promise<boolean> {
    const userPermissions = await this.calculateUserPermissions(userId);
    return userPermissions.finalPermissions.includes(permission);
  }

  /**
   * 批量檢查用戶權限
   */
  async hasAnyPermission(userId: number, permissions: string[]): Promise<boolean> {
    const userPermissions = await this.calculateUserPermissions(userId);
    return permissions.some(perm => userPermissions.finalPermissions.includes(perm));
  }

  /**
   * 授予用戶特定權限
   */
  async grantPermission(
    userId: number, 
    permission: string, 
    grantedBy: number, 
    reason?: string,
    expiresAt?: Date
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // 更新或創建權限覆蓋
      await tx.userPermissionOverride.upsert({
        where: {
          userId_permission: { userId, permission }
        },
        update: {
          granted: true,
          grantedBy,
          reason,
          expiresAt,
          updatedAt: new Date()
        },
        create: {
          userId,
          permission,
          granted: true,
          grantedBy,
          reason,
          expiresAt
        }
      });

      // 記錄權限變更
      await tx.permissionChangeLog.create({
        data: {
          userId,
          permission,
          action: 'GRANT',
          operatorId: grantedBy,
          reason,
          expiresAt
        }
      });
    });
  }

  /**
   * 撤銷用戶特定權限
   */
  async revokePermission(
    userId: number, 
    permission: string, 
    revokedBy: number, 
    reason?: string
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // 更新或創建權限覆蓋（設為 false）
      await tx.userPermissionOverride.upsert({
        where: {
          userId_permission: { userId, permission }
        },
        update: {
          granted: false,
          grantedBy: revokedBy,
          reason,
          expiresAt: null,
          updatedAt: new Date()
        },
        create: {
          userId,
          permission,
          granted: false,
          grantedBy: revokedBy,
          reason
        }
      });

      // 記錄權限變更
      await tx.permissionChangeLog.create({
        data: {
          userId,
          permission,
          action: 'REVOKE',
          operatorId: revokedBy,
          reason
        }
      });
    });
  }

  /**
   * 重置用戶權限到基礎角色權限
   */
  async resetUserPermissions(userId: number, resetBy: number, reason?: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // 刪除所有權限覆蓋
      const deletedOverrides = await tx.userPermissionOverride.findMany({
        where: { userId }
      });

      await tx.userPermissionOverride.deleteMany({
        where: { userId }
      });

      // 記錄所有被重置的權限
      for (const override of deletedOverrides) {
        await tx.permissionChangeLog.create({
          data: {
            userId,
            permission: override.permission,
            action: 'RESET',
            operatorId: resetBy,
            reason: reason || '權限重置到角色預設'
          }
        });
      }
    });
  }

  /**
   * 獲取用戶權限變更歷史
   */
  async getPermissionHistory(userId: number, limit = 50): Promise<any[]> {
    return this.prisma.permissionChangeLog.findMany({
      where: { userId },
      include: {
        operator: {
          select: { id: true, displayName: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  }

  /**
   * 獲取所有用戶的權限摘要（管理界面用）
   */
  async getUsersPermissionSummary(limit = 100) {
    const users = await this.prisma.user.findMany({
      include: {
        userRoles: { include: { role: true } },
        permissionOverrides: {
          where: {
            OR: [
              { expiresAt: null },
              { expiresAt: { gte: new Date() } }
            ]
          }
        }
      },
      take: limit,
      orderBy: { createdAt: 'desc' }
    });

    return users.map(user => ({
      id: user.id,
      displayName: user.displayName,
      email: user.email,
      roles: user.userRoles.map(ur => ur.role.name),
      overrideCount: user.permissionOverrides.length,
      hasCustomPermissions: user.permissionOverrides.length > 0
    }));
  }

  /**
   * 清理過期權限
   */
  async cleanupExpiredPermissions(): Promise<number> {
    const result = await this.prisma.$transaction(async (tx) => {
      // 找到過期的權限
      const expiredOverrides = await tx.userPermissionOverride.findMany({
        where: {
          expiresAt: { lt: new Date() }
        }
      });

      if (expiredOverrides.length === 0) return 0;

      // 記錄過期
      for (const override of expiredOverrides) {
        await tx.permissionChangeLog.create({
          data: {
            userId: override.userId,
            permission: override.permission,
            action: 'EXPIRE',
            operatorId: override.grantedBy,
            reason: '權限已過期'
          }
        });
      }

      // 刪除過期權限
      const deleteResult = await tx.userPermissionOverride.deleteMany({
        where: {
          expiresAt: { lt: new Date() }
        }
      });

      return deleteResult.count;
    });

    return result;
  }

  private getRoleLevel(roleName: string): number {
    const roleLevels = {
      'SUPER_ADMIN': 1,
      'HOST_ADMIN': 2,
      'SINGER': 3,
      'PLAYER': 4,
      'GUEST': 5
    };
    return roleLevels[roleName] || 999;
  }
}