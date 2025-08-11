import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PermissionService, AuthContext, ENTITIES, ACTIONS } from '../auth/rbac-abac.system';

export interface CreateEventDto {
  title: string;
  venue?: string;
  startsAt: Date;
  endsAt: Date;
  description?: string;
  singerIds?: number[];
}

export interface UpdateEventDto {
  title?: string;
  venue?: string;
  startsAt?: Date;
  endsAt?: Date;
  status?: 'PLANNED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  description?: string;
}

export interface AssignSingersDto {
  eventId: number;
  singerIds: number[];
}

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  // 創建活動
  async createEvent(authContext: AuthContext, createEventDto: CreateEventDto) {
    // 檢查權限
    if (!PermissionService.hasPermission(authContext, ENTITIES.EVENT, ACTIONS.CREATE)) {
      throw new ForbiddenException('無權限創建活動');
    }

    // 驗證時間邏輯
    if (createEventDto.startsAt >= createEventDto.endsAt) {
      throw new BadRequestException('活動開始時間必須早於結束時間');
    }

    // 檢查時間衝突（同一主持人不能有重疊的活動）
    const conflictingEvent = await this.prisma.event.findFirst({
      where: {
        hostUserId: authContext.userId,
        status: { in: ['PLANNED', 'ACTIVE'] },
        OR: [
          {
            AND: [
              { startsAt: { lte: createEventDto.startsAt } },
              { endsAt: { gt: createEventDto.startsAt } }
            ]
          },
          {
            AND: [
              { startsAt: { lt: createEventDto.endsAt } },
              { endsAt: { gte: createEventDto.endsAt } }
            ]
          },
          {
            AND: [
              { startsAt: { gte: createEventDto.startsAt } },
              { endsAt: { lte: createEventDto.endsAt } }
            ]
          }
        ]
      }
    });

    if (conflictingEvent) {
      throw new BadRequestException('該時間段已有其他活動安排');
    }

    // 創建活動
    const event = await this.prisma.event.create({
      data: {
        title: createEventDto.title,
        venue: createEventDto.venue,
        startsAt: createEventDto.startsAt,
        endsAt: createEventDto.endsAt,
        description: createEventDto.description,
        hostUserId: authContext.userId,
        status: 'PLANNED'
      },
      include: {
        host: {
          select: { id: true, displayName: true }
        }
      }
    });

    // 如果指定了歌手，分配歌手到活動
    if (createEventDto.singerIds && createEventDto.singerIds.length > 0) {
      await this.assignSingersToEvent(event.id, createEventDto.singerIds);
    }

    return event;
  }

  // 獲取活動列表
  async getEvents(authContext: AuthContext, filters?: {
    status?: string;
    hostUserId?: number;
    singerId?: number;
    startDate?: Date;
    endDate?: Date;
  }) {
    let whereClause: any = {};

    // 根據權限決定可見範圍
    const canViewAll = PermissionService.hasPermission(authContext, ENTITIES.EVENT, ACTIONS.VIEW);
    
    if (!canViewAll) {
      // 只能看到自己主持的活動或參與的活動
      whereClause.OR = [
        { hostUserId: authContext.userId },
        { eventSingers: { some: { singerId: authContext.singerId } } }
      ];
    }

    // 應用篩選條件
    if (filters?.status) {
      whereClause.status = filters.status;
    }

    if (filters?.hostUserId && canViewAll) {
      whereClause.hostUserId = filters.hostUserId;
    }

    if (filters?.singerId) {
      whereClause.eventSingers = {
        some: { singerId: filters.singerId }
      };
    }

    if (filters?.startDate || filters?.endDate) {
      whereClause.startsAt = {};
      if (filters.startDate) {
        whereClause.startsAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        whereClause.startsAt.lte = filters.endDate;
      }
    }

    const events = await this.prisma.event.findMany({
      where: whereClause,
      include: {
        host: {
          select: { id: true, displayName: true }
        },
        eventSingers: {
          include: {
            singer: {
              select: { id: true, stageName: true, bio: true }
            }
          }
        },
        _count: {
          select: {
            requests: true
          }
        }
      },
      orderBy: { startsAt: 'desc' }
    });

    // 根據權限過濾敏感資訊
    return events.map(event => 
      PermissionService.maskSensitiveFields(event, authContext, ENTITIES.EVENT)
    );
  }

  // 獲取單個活動詳情
  async getEvent(authContext: AuthContext, eventId: number) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        host: {
          select: { id: true, displayName: true, avatarUrl: true }
        },
        eventSingers: {
          include: {
            singer: {
              select: { 
                id: true, 
                stageName: true, 
                bio: true,
                user: {
                  select: { avatarUrl: true }
                }
              }
            }
          }
        },
        requests: {
          where: {
            status: { in: ['QUEUED', 'ASSIGNED', 'ACCEPTED', 'PERFORMING'] }
          },
          include: {
            song: true,
            singer: {
              select: { id: true, stageName: true }
            },
            player: {
              select: { id: true, name: true }
            },
            user: {
              select: { id: true, displayName: true }
            }
          },
          orderBy: { priorityIndex: 'asc' }
        }
      }
    });

    if (!event) {
      throw new BadRequestException('活動不存在');
    }

    // 檢查查看權限
    const resource = { eventId: event.id };
    if (!PermissionService.hasPermission(authContext, ENTITIES.EVENT, ACTIONS.VIEW, resource)) {
      // 檢查是否是公開資訊查看
      const canViewPublic = PermissionService.hasPermission(authContext, ENTITIES.EVENT, ACTIONS.VIEW);
      if (!canViewPublic) {
        throw new ForbiddenException('無權限查看該活動');
      }
    }

    return PermissionService.maskSensitiveFields(event, authContext, ENTITIES.EVENT);
  }

  // 更新活動
  async updateEvent(authContext: AuthContext, eventId: number, updateEventDto: UpdateEventDto) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      throw new BadRequestException('活動不存在');
    }

    // 檢查權限（只能更新自己主持的活動，或者是管理員）
    const resource = { eventId };
    const isOwnEvent = event.hostUserId === authContext.userId;
    const hasUpdatePermission = PermissionService.hasPermission(authContext, ENTITIES.EVENT, ACTIONS.UPDATE, resource);

    if (!isOwnEvent && !hasUpdatePermission) {
      throw new ForbiddenException('無權限更新該活動');
    }

    // 驗證時間邏輯
    if (updateEventDto.startsAt && updateEventDto.endsAt) {
      if (updateEventDto.startsAt >= updateEventDto.endsAt) {
        throw new BadRequestException('活動開始時間必須早於結束時間');
      }
    }

    // 檢查狀態轉換邏輯
    if (updateEventDto.status) {
      this.validateStatusTransition(event.status, updateEventDto.status);
    }

    // 如果活動已開始，不能修改某些欄位
    if (event.status === 'ACTIVE') {
      if (updateEventDto.startsAt || updateEventDto.endsAt) {
        throw new BadRequestException('進行中的活動無法修改時間');
      }
    }

    const updatedEvent = await this.prisma.event.update({
      where: { id: eventId },
      data: updateEventDto,
      include: {
        host: {
          select: { id: true, displayName: true }
        },
        eventSingers: {
          include: {
            singer: {
              select: { id: true, stageName: true }
            }
          }
        }
      }
    });

    return updatedEvent;
  }

  // 驗證狀態轉換
  private validateStatusTransition(currentStatus: string, newStatus: string) {
    const validTransitions = {
      'PLANNED': ['ACTIVE', 'CANCELLED'],
      'ACTIVE': ['COMPLETED', 'CANCELLED'],
      'COMPLETED': [], // 完成後不能再改
      'CANCELLED': ['PLANNED'] // 取消後可以重新計劃
    };

    const allowedStatuses = validTransitions[currentStatus] || [];
    if (!allowedStatuses.includes(newStatus)) {
      throw new BadRequestException(`無法從 ${currentStatus} 轉換到 ${newStatus}`);
    }
  }

  // 分配歌手到活動
  async assignSingersToEvent(eventId: number, singerIds: number[]) {
    // 驗證所有歌手是否存在
    const singers = await this.prisma.singer.findMany({
      where: {
        id: { in: singerIds },
        isActive: true
      }
    });

    if (singers.length !== singerIds.length) {
      throw new BadRequestException('部分歌手不存在或已停用');
    }

    // 刪除現有分配
    await this.prisma.eventSinger.deleteMany({
      where: { eventId }
    });

    // 創建新的分配
    const eventSingers = singerIds.map(singerId => ({
      eventId,
      singerId
    }));

    await this.prisma.eventSinger.createMany({
      data: eventSingers
    });

    return { message: '歌手分配成功', assignedCount: singerIds.length };
  }

  // 管理活動歌手
  async manageEventSingers(authContext: AuthContext, assignSingersDto: AssignSingersDto) {
    const event = await this.prisma.event.findUnique({
      where: { id: assignSingersDto.eventId }
    });

    if (!event) {
      throw new BadRequestException('活動不存在');
    }

    // 檢查權限
    const resource = { eventId: assignSingersDto.eventId };
    const isOwnEvent = event.hostUserId === authContext.userId;
    const hasAssignPermission = PermissionService.hasPermission(authContext, ENTITIES.EVENT, ACTIONS.ASSIGN, resource);

    if (!isOwnEvent && !hasAssignPermission) {
      throw new ForbiddenException('無權限管理該活動的歌手');
    }

    return await this.assignSingersToEvent(assignSingersDto.eventId, assignSingersDto.singerIds);
  }

  // 刪除活動
  async deleteEvent(authContext: AuthContext, eventId: number) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        requests: true
      }
    });

    if (!event) {
      throw new BadRequestException('活動不存在');
    }

    // 檢查權限
    const resource = { eventId };
    const isOwnEvent = event.hostUserId === authContext.userId;
    const hasDeletePermission = PermissionService.hasPermission(authContext, ENTITIES.EVENT, ACTIONS.DELETE, resource);

    if (!isOwnEvent && !hasDeletePermission) {
      throw new ForbiddenException('無權限刪除該活動');
    }

    // 不能刪除已開始或有點歌記錄的活動
    if (event.status === 'ACTIVE') {
      throw new BadRequestException('進行中的活動無法刪除');
    }

    if (event.requests.length > 0) {
      throw new BadRequestException('有點歌記錄的活動無法刪除');
    }

    await this.prisma.event.delete({
      where: { id: eventId }
    });

    return { message: '活動已刪除' };
  }

  // 開始活動
  async startEvent(authContext: AuthContext, eventId: number) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      throw new BadRequestException('活動不存在');
    }

    // 檢查權限（只有主持人可以開始活動）
    if (event.hostUserId !== authContext.userId) {
      throw new ForbiddenException('只有主持人可以開始活動');
    }

    if (event.status !== 'PLANNED') {
      throw new BadRequestException('只有計劃中的活動可以開始');
    }

    const updatedEvent = await this.prisma.event.update({
      where: { id: eventId },
      data: { 
        status: 'ACTIVE',
        startsAt: new Date() // 更新實際開始時間
      },
      include: {
        eventSingers: {
          include: {
            singer: {
              select: { id: true, stageName: true }
            }
          }
        }
      }
    });

    // TODO: 發送通知給相關人員

    return updatedEvent;
  }

  // 結束活動
  async endEvent(authContext: AuthContext, eventId: number) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      throw new BadRequestException('活動不存在');
    }

    // 檢查權限
    if (event.hostUserId !== authContext.userId) {
      throw new ForbiddenException('只有主持人可以結束活動');
    }

    if (event.status !== 'ACTIVE') {
      throw new BadRequestException('只有進行中的活動可以結束');
    }

    // 將所有未完成的點歌請求設為取消
    await this.prisma.request.updateMany({
      where: {
        eventId,
        status: { in: ['QUEUED', 'ASSIGNED', 'ACCEPTED'] }
      },
      data: { status: 'CANCELLED' }
    });

    const updatedEvent = await this.prisma.event.update({
      where: { id: eventId },
      data: { 
        status: 'COMPLETED',
        endsAt: new Date() // 更新實際結束時間
      },
      include: {
        _count: {
          select: {
            requests: {
              where: { status: 'COMPLETED' }
            }
          }
        }
      }
    });

    // TODO: 生成活動報表
    // TODO: 發送通知給相關人員

    return updatedEvent;
  }

  // 獲取活動統計
  async getEventStats(authContext: AuthContext, eventId?: number) {
    let whereClause: any = {};

    if (eventId) {
      // 檢查單個活動權限
      const resource = { eventId };
      if (!PermissionService.hasPermission(authContext, ENTITIES.ANALYTICS, ACTIONS.VIEW, resource)) {
        throw new ForbiddenException('無權限查看該活動統計');
      }
      whereClause.id = eventId;
    } else {
      // 檢查全域統計權限
      const canViewAll = PermissionService.hasPermission(authContext, ENTITIES.ANALYTICS, ACTIONS.VIEW);
      if (!canViewAll) {
        // 只能看自己相關的活動統計
        whereClause.OR = [
          { hostUserId: authContext.userId },
          { eventSingers: { some: { singerId: authContext.singerId } } }
        ];
      }
    }

    const events = await this.prisma.event.findMany({
      where: whereClause,
      include: {
        _count: {
          select: {
            requests: true,
            eventSingers: true
          }
        }
      }
    });

    const totalEvents = events.length;
    const activeEvents = events.filter(e => e.status === 'ACTIVE').length;
    const completedEvents = events.filter(e => e.status === 'COMPLETED').length;
    const totalRequests = events.reduce((sum, e) => sum + e._count.requests, 0);

    return {
      totalEvents,
      activeEvents,
      completedEvents,
      totalRequests,
      averageRequestsPerEvent: totalEvents > 0 ? (totalRequests / totalEvents).toFixed(2) : 0,
      events: eventId ? events[0] : undefined
    };
  }

  // 複製活動
  async duplicateEvent(authContext: AuthContext, eventId: number, newStartsAt: Date, newEndsAt: Date) {
    const originalEvent = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        eventSingers: true
      }
    });

    if (!originalEvent) {
      throw new BadRequestException('原活動不存在');
    }

    // 檢查權限
    const resource = { eventId };
    if (!PermissionService.hasPermission(authContext, ENTITIES.EVENT, ACTIONS.VIEW, resource)) {
      throw new ForbiddenException('無權限複製該活動');
    }

    if (!PermissionService.hasPermission(authContext, ENTITIES.EVENT, ACTIONS.CREATE)) {
      throw new ForbiddenException('無權限創建活動');
    }

    // 創建新活動
    const newEvent = await this.prisma.event.create({
      data: {
        title: `${originalEvent.title} (複製)`,
        venue: originalEvent.venue,
        startsAt: newStartsAt,
        endsAt: newEndsAt,
        description: originalEvent.description,
        hostUserId: authContext.userId,
        status: 'PLANNED'
      }
    });

    // 複製歌手分配
    if (originalEvent.eventSingers.length > 0) {
      const eventSingers = originalEvent.eventSingers.map(es => ({
        eventId: newEvent.id,
        singerId: es.singerId
      }));

      await this.prisma.eventSinger.createMany({
        data: eventSingers
      });
    }

    return newEvent;
  }
}