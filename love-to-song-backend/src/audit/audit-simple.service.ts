import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthContext } from '../auth/rbac-abac.system';

export interface SimpleAuditLogData {
  action: string;
  entityType: string;
  entityId?: number;
  userId: number;
  details?: Record<string, any>;
  reason?: string;
}

@Injectable()
export class SimpleAuditService {
  constructor(private prisma: PrismaService) {}

  // 簡化版記錄稽核日誌
  async logAction(logData: SimpleAuditLogData) {
    try {
      const auditLog = await this.prisma.auditLog.create({
        data: {
          action: logData.action,
          entity: logData.entityType,
          entityId: logData.entityId,
          actorUserId: logData.userId,
          before: logData.details ? JSON.stringify(logData.details) : null,
          reason: logData.reason || 'System action'
        }
      });

      return auditLog;
    } catch (error) {
      console.error('Failed to create audit log:', error);
      return null;
    }
  }

  // 獲取稽核日誌
  async getAuditLogs(authContext: AuthContext, limit: number = 50) {
    try {
      const auditLogs = await this.prisma.auditLog.findMany({
        include: {
          actor: {
            select: { id: true, displayName: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: Math.min(limit, 100)
      });

      return auditLogs;
    } catch (error) {
      console.error('Failed to get audit logs:', error);
      return [];
    }
  }

  // 靜態方法用於簡化稽核記錄
  static createLogData(
    action: string,
    entityType: string,
    userId: number,
    entityId?: number,
    details?: Record<string, any>,
    reason?: string
  ): SimpleAuditLogData {
    return {
      action,
      entityType,
      entityId,
      userId,
      details,
      reason
    };
  }
}