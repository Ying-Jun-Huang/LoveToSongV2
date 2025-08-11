import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthContext, PermissionService, ENTITIES, ACTIONS } from '../auth/rbac-abac.system';

export interface CreateNotificationDto {
  userId: number;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'EVENT' | 'REQUEST' | 'WISH_SONG';
  entityType?: string;
  entityId?: number;
  actionUrl?: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  scheduledAt?: Date;
  expiresAt?: Date;
}

export interface NotificationFilters {
  userId?: number;
  type?: string;
  isRead?: boolean;
  priority?: string;
  entityType?: string;
  entityId?: number;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface BroadcastNotificationDto {
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'EVENT' | 'REQUEST' | 'WISH_SONG';
  targetRoles?: string[];
  targetUserIds?: number[];
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  actionUrl?: string;
  expiresAt?: Date;
}

@Injectable()
export class NotificationService {
  constructor(private prisma: PrismaService) {}

  // 創建單個通知
  async createNotification(notificationData: CreateNotificationDto) {
    try {
      const notification = await this.prisma.notification.create({
        data: {
          userId: notificationData.userId,
          title: notificationData.title,
          message: notificationData.message,
          type: notificationData.type,
          entityType: notificationData.entityType,
          entityId: notificationData.entityId,
          actionUrl: notificationData.actionUrl,
          priority: notificationData.priority,
          scheduledAt: notificationData.scheduledAt || new Date(),
          expiresAt: notificationData.expiresAt,
          isRead: false,
          isDelivered: false
        },
        include: {
          user: {
            select: { id: true, displayName: true, email: true }
          }
        }
      });

      return notification;
    } catch (error) {
      console.error('Failed to create notification:', error);
      return null;
    }
  }

  // 批量創建通知
  async createBatchNotifications(notifications: CreateNotificationDto[]) {
    try {
      const createdNotifications = await this.prisma.notification.createMany({
        data: notifications.map(n => ({
          userId: n.userId,
          title: n.title,
          message: n.message,
          type: n.type,
          entityType: n.entityType,
          entityId: n.entityId,
          actionUrl: n.actionUrl,
          priority: n.priority,
          scheduledAt: n.scheduledAt || new Date(),
          expiresAt: n.expiresAt,
          isRead: false,
          isDelivered: false
        }))
      });

      return createdNotifications;
    } catch (error) {
      console.error('Failed to create batch notifications:', error);
      return null;
    }
  }

  // 廣播通知
  async broadcastNotification(authContext: AuthContext, broadcastData: BroadcastNotificationDto) {
    // 檢查權限
    if (!PermissionService.hasPermission(authContext, ENTITIES.NOTIFICATION, ACTIONS.BROADCAST)) {
      throw new Error('無權限發送廣播通知');
    }

    let targetUserIds: number[] = [];

    if (broadcastData.targetUserIds && broadcastData.targetUserIds.length > 0) {
      targetUserIds = broadcastData.targetUserIds;
    } else if (broadcastData.targetRoles && broadcastData.targetRoles.length > 0) {
      // 根據角色查找用戶
      const users = await this.prisma.userRole.findMany({
        where: {
          role: { in: broadcastData.targetRoles }
        },
        select: { userId: true }
      });
      targetUserIds = users.map(ur => ur.userId);
    } else {
      // 如果沒有指定目標，發送給所有活躍用戶
      const users = await this.prisma.user.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true }
      });
      targetUserIds = users.map(u => u.id);
    }

    // 創建通知數據
    const notifications: CreateNotificationDto[] = targetUserIds.map(userId => ({
      userId,
      title: broadcastData.title,
      message: broadcastData.message,
      type: broadcastData.type,
      priority: broadcastData.priority,
      actionUrl: broadcastData.actionUrl,
      expiresAt: broadcastData.expiresAt
    }));

    const result = await this.createBatchNotifications(notifications);

    return {
      message: '廣播通知發送完成',
      targetCount: targetUserIds.length,
      createdCount: result?.count || 0
    };
  }

  // 獲取用戶通知
  async getUserNotifications(authContext: AuthContext, filters: NotificationFilters = {}) {
    const userId = filters.userId || authContext.userId;

    // 檢查權限（只能查看自己的通知，除非是管理員）
    if (userId !== authContext.userId) {
      if (!PermissionService.hasPermission(authContext, ENTITIES.NOTIFICATION, ACTIONS.VIEW)) {
        throw new Error('無權限查看他人的通知');
      }
    }

    let whereClause: any = {
      userId,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } }
      ]
    };

    // 應用篩選條件
    if (filters.type) {
      whereClause.type = filters.type;
    }

    if (filters.isRead !== undefined) {
      whereClause.isRead = filters.isRead;
    }

    if (filters.priority) {
      whereClause.priority = filters.priority;
    }

    if (filters.entityType) {
      whereClause.entityType = filters.entityType;
    }

    if (filters.entityId) {
      whereClause.entityId = filters.entityId;
    }

    if (filters.startDate || filters.endDate) {
      whereClause.createdAt = {};
      if (filters.startDate) {
        whereClause.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        whereClause.createdAt.lte = filters.endDate;
      }
    }

    const limit = Math.min(filters.limit || 50, 200);
    const offset = filters.offset || 0;

    const [notifications, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: whereClause,
        orderBy: [
          { priority: 'desc' },
          { scheduledAt: 'desc' }
        ],
        take: limit,
        skip: offset
      }),
      this.prisma.notification.count({ where: whereClause }),
      this.prisma.notification.count({ 
        where: { 
          ...whereClause, 
          isRead: false 
        } 
      })
    ]);

    return {
      notifications,
      pagination: {
        total,
        limit,
        offset,
        hasNext: offset + limit < total
      },
      unreadCount
    };
  }

  // 標記通知為已讀
  async markAsRead(authContext: AuthContext, notificationIds: number[]) {
    // 驗證這些通知是否屬於當前用戶
    const notifications = await this.prisma.notification.findMany({
      where: {
        id: { in: notificationIds },
        userId: authContext.userId
      }
    });

    if (notifications.length !== notificationIds.length) {
      throw new Error('部分通知不存在或不屬於當前用戶');
    }

    const result = await this.prisma.notification.updateMany({
      where: {
        id: { in: notificationIds },
        userId: authContext.userId
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

    return {
      message: '通知已標記為已讀',
      updatedCount: result.count
    };
  }

  // 標記所有通知為已讀
  async markAllAsRead(authContext: AuthContext) {
    const result = await this.prisma.notification.updateMany({
      where: {
        userId: authContext.userId,
        isRead: false
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

    return {
      message: '所有通知已標記為已讀',
      updatedCount: result.count
    };
  }

  // 刪除通知
  async deleteNotifications(authContext: AuthContext, notificationIds: number[]) {
    // 驗證這些通知是否屬於當前用戶
    const notifications = await this.prisma.notification.findMany({
      where: {
        id: { in: notificationIds },
        userId: authContext.userId
      }
    });

    if (notifications.length !== notificationIds.length) {
      throw new Error('部分通知不存在或不屬於當前用戶');
    }

    const result = await this.prisma.notification.deleteMany({
      where: {
        id: { in: notificationIds },
        userId: authContext.userId
      }
    });

    return {
      message: '通知已刪除',
      deletedCount: result.count
    };
  }

  // 清理過期通知
  async cleanupExpiredNotifications(authContext: AuthContext) {
    // 檢查權限
    if (!PermissionService.hasPermission(authContext, ENTITIES.NOTIFICATION, ACTIONS.DELETE)) {
      throw new Error('無權限清理過期通知');
    }

    const result = await this.prisma.notification.deleteMany({
      where: {
        expiresAt: { lt: new Date() }
      }
    });

    return {
      message: '過期通知清理完成',
      deletedCount: result.count
    };
  }

  // 獲取通知統計
  async getNotificationStats(authContext: AuthContext, targetUserId?: number) {
    const userId = targetUserId || authContext.userId;

    // 檢查權限
    if (userId !== authContext.userId) {
      if (!PermissionService.hasPermission(authContext, ENTITIES.ANALYTICS, ACTIONS.VIEW)) {
        throw new Error('無權限查看他人的通知統計');
      }
    }

    const [
      total,
      unread,
      byType,
      byPriority,
      recent
    ] = await Promise.all([
      // 總通知數
      this.prisma.notification.count({
        where: { userId }
      }),

      // 未讀通知數
      this.prisma.notification.count({
        where: { userId, isRead: false }
      }),

      // 按類型統計
      this.prisma.notification.groupBy({
        by: ['type'],
        where: { userId },
        _count: { id: true }
      }),

      // 按優先級統計
      this.prisma.notification.groupBy({
        by: ['priority'],
        where: { userId },
        _count: { id: true }
      }),

      // 最近7天的通知數
      this.prisma.notification.count({
        where: {
          userId,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      })
    ]);

    return {
      total,
      unread,
      readRate: total > 0 ? (((total - unread) / total) * 100).toFixed(2) + '%' : '0%',
      recent,
      byType: byType.reduce((acc, stat) => {
        acc[stat.type] = stat._count.id;
        return acc;
      }, {} as Record<string, number>),
      byPriority: byPriority.reduce((acc, stat) => {
        acc[stat.priority] = stat._count.id;
        return acc;
      }, {} as Record<string, number>)
    };
  }

  // 通知模板方法

  // 點歌請求相關通知
  async notifyRequestCreated(requestId: number, eventTitle: string, songTitle: string, requesterName: string) {
    // 通知活動主持人
    const event = await this.prisma.event.findUnique({
      where: { id: (await this.prisma.request.findUnique({ where: { id: requestId } }))?.eventId },
      select: { hostUserId: true }
    });

    if (event?.hostUserId) {
      await this.createNotification({
        userId: event.hostUserId,
        title: '新的點歌請求',
        message: `${requesterName} 在活動「${eventTitle}」中點了「${songTitle}」`,
        type: 'REQUEST',
        entityType: 'REQUEST',
        entityId: requestId,
        priority: 'NORMAL',
        actionUrl: `/queue/event/${event}#request-${requestId}`
      });
    }
  }

  async notifyRequestAssigned(requestId: number, songTitle: string, singerName: string, singerId: number) {
    // 通知被指派的歌手
    const singer = await this.prisma.singer.findUnique({
      where: { id: singerId },
      include: { user: true }
    });

    if (singer?.user) {
      await this.createNotification({
        userId: singer.user.id,
        title: '新的點歌指派',
        message: `您被指派演唱「${songTitle}」`,
        type: 'REQUEST',
        entityType: 'REQUEST',
        entityId: requestId,
        priority: 'HIGH',
        actionUrl: `/queue#request-${requestId}`
      });
    }
  }

  // 願望歌相關通知
  async notifyWishSongCreated(wishSongId: number, title: string, submitterName: string, singerId?: number) {
    // 如果指派給特定歌手
    if (singerId) {
      const singer = await this.prisma.singer.findUnique({
        where: { id: singerId },
        include: { user: true }
      });

      if (singer?.user) {
        await this.createNotification({
          userId: singer.user.id,
          title: '新的願望歌',
          message: `${submitterName} 希望您演唱「${title}」`,
          type: 'WISH_SONG',
          entityType: 'WISH_SONG',
          entityId: wishSongId,
          priority: 'NORMAL',
          actionUrl: `/wishsongs/assigned-to-me#${wishSongId}`
        });
      }
    }

    // 通知管理員
    const admins = await this.prisma.userRole.findMany({
      where: { role: 'SUPER_ADMIN' },
      include: { user: true }
    });

    const adminNotifications: CreateNotificationDto[] = admins.map(admin => ({
      userId: admin.user.id,
      title: '新的願望歌待審核',
      message: `${submitterName} 提交了願望歌「${title}」`,
      type: 'WISH_SONG',
      entityType: 'WISH_SONG',
      entityId: wishSongId,
      priority: 'LOW',
      actionUrl: `/wishsongs#${wishSongId}`
    }));

    await this.createBatchNotifications(adminNotifications);
  }

  async notifyWishSongApproved(wishSongId: number, title: string, submitterId: number, approved: boolean) {
    const status = approved ? '通過' : '拒絕';
    const type = approved ? 'SUCCESS' : 'WARNING';

    await this.createNotification({
      userId: submitterId,
      title: `願望歌審核${status}`,
      message: `您的願望歌「${title}」已被${status}`,
      type,
      entityType: 'WISH_SONG',
      entityId: wishSongId,
      priority: 'NORMAL',
      actionUrl: `/wishsongs/my-wishsongs#${wishSongId}`
    });
  }

  // 活動相關通知
  async notifyEventStarted(eventId: number, eventTitle: string) {
    // 通知所有參與的歌手
    const eventSingers = await this.prisma.eventSinger.findMany({
      where: { eventId },
      include: {
        singer: {
          include: { user: true }
        }
      }
    });

    const notifications: CreateNotificationDto[] = eventSingers.map(es => ({
      userId: es.singer.user.id,
      title: '活動已開始',
      message: `活動「${eventTitle}」現在開始了！`,
      type: 'EVENT',
      entityType: 'EVENT',
      entityId: eventId,
      priority: 'HIGH',
      actionUrl: `/events/${eventId}`
    }));

    await this.createBatchNotifications(notifications);
  }

  async notifyEventEnded(eventId: number, eventTitle: string, completedSongs: number) {
    // 通知所有參與的歌手
    const eventSingers = await this.prisma.eventSinger.findMany({
      where: { eventId },
      include: {
        singer: {
          include: { user: true }
        }
      }
    });

    const notifications: CreateNotificationDto[] = eventSingers.map(es => ({
      userId: es.singer.user.id,
      title: '活動已結束',
      message: `活動「${eventTitle}」已結束，共完成 ${completedSongs} 首歌曲`,
      type: 'EVENT',
      entityType: 'EVENT',
      entityId: eventId,
      priority: 'NORMAL',
      actionUrl: `/events/${eventId}/summary`
    }));

    await this.createBatchNotifications(notifications);
  }

  // 系統通知
  async notifySystemMaintenance(title: string, message: string, scheduledAt: Date) {
    // 通知所有活躍用戶
    const activeUsers = await this.prisma.user.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true }
    });

    const notifications: CreateNotificationDto[] = activeUsers.map(user => ({
      userId: user.id,
      title,
      message,
      type: 'WARNING',
      priority: 'HIGH',
      scheduledAt,
      expiresAt: new Date(scheduledAt.getTime() + 24 * 60 * 60 * 1000) // 24小時後過期
    }));

    await this.createBatchNotifications(notifications);
  }
}