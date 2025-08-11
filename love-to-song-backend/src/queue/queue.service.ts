import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PermissionService, AuthContext, ENTITIES, ACTIONS } from '../auth/rbac-abac.system';

export interface CreateRequestDto {
  eventId: number;
  songId: number;
  songVersionId?: number;
  playerId?: number;
  desiredTime?: string;
  notes?: string;
}

export interface AssignRequestDto {
  requestId: number;
  singerId: number;
  reason?: string;
}

export interface ReorderRequestDto {
  requestId: number;
  newPosition: number;
  reason: string;
}

export interface UpdateRequestStatusDto {
  requestId: number;
  status: string;
  reason?: string;
}

@Injectable()
export class QueueService {
  constructor(private prisma: PrismaService) {}

  // 創建點歌請求
  async createRequest(authContext: AuthContext, createRequestDto: CreateRequestDto) {
    // 檢查權限
    if (!PermissionService.hasPermission(authContext, ENTITIES.REQUEST, ACTIONS.CREATE)) {
      throw new ForbiddenException('無權限創建點歌請求');
    }

    // 驗證活動是否存在且進行中
    const event = await this.prisma.event.findUnique({
      where: { id: createRequestDto.eventId }
    });

    if (!event || event.status !== 'ACTIVE') {
      throw new BadRequestException('活動不存在或未進行中');
    }

    // 驗證歌曲是否存在
    const song = await this.prisma.song.findUnique({
      where: { id: createRequestDto.songId }
    });

    if (!song || !song.isActive) {
      throw new BadRequestException('歌曲不存在或已停用');
    }

    // 如果指定了歌曲版本，驗證版本是否存在
    if (createRequestDto.songVersionId) {
      const version = await this.prisma.songVersion.findUnique({
        where: { id: createRequestDto.songVersionId }
      });

      if (!version || version.songId !== createRequestDto.songId) {
        throw new BadRequestException('歌曲版本不存在或不匹配');
      }
    }

    // 檢查點歌限制
    await this.checkRequestLimits(authContext, createRequestDto);

    // 獲取當前隊列的最大優先級
    const lastRequest = await this.prisma.request.findFirst({
      where: {
        eventId: createRequestDto.eventId,
        status: { in: ['QUEUED', 'ASSIGNED', 'ACCEPTED'] }
      },
      orderBy: { priorityIndex: 'desc' }
    });

    const nextPriorityIndex = (lastRequest?.priorityIndex || 0) + 1;

    // 創建點歌請求
    const request = await this.prisma.request.create({
      data: {
        eventId: createRequestDto.eventId,
        songId: createRequestDto.songId,
        songVersionId: createRequestDto.songVersionId,
        playerId: createRequestDto.playerId,
        userId: authContext.userId,
        desiredTime: createRequestDto.desiredTime,
        notes: createRequestDto.notes,
        status: 'QUEUED',
        priorityIndex: nextPriorityIndex
      },
      include: {
        song: true,
        songVersion: true,
        player: true,
        user: true,
        event: true
      }
    });

    // 記錄請求事件
    await this.logRequestEvent(request.id, 'created', authContext.userId, '用戶創建點歌請求');

    return request;
  }

  // 檢查點歌限制
  private async checkRequestLimits(authContext: AuthContext, createRequestDto: CreateRequestDto) {
    // 檢查同一場次的點歌數量限制（例如：每人最多3首）
    const existingRequests = await this.prisma.request.count({
      where: {
        eventId: createRequestDto.eventId,
        OR: [
          { userId: authContext.userId },
          { playerId: createRequestDto.playerId }
        ],
        status: { in: ['QUEUED', 'ASSIGNED', 'ACCEPTED'] }
      }
    });

    const maxRequestsPerEvent = 3; // 可配置
    if (existingRequests >= maxRequestsPerEvent) {
      throw new BadRequestException(`每場活動最多只能點 ${maxRequestsPerEvent} 首歌`);
    }

    // 檢查相同歌曲的間隔限制（防止洗歌）
    const recentSameSong = await this.prisma.request.findFirst({
      where: {
        eventId: createRequestDto.eventId,
        songId: createRequestDto.songId,
        status: { in: ['QUEUED', 'ASSIGNED', 'ACCEPTED', 'PERFORMING'] },
        createdAt: {
          gte: new Date(Date.now() - 30 * 60 * 1000) // 30分鐘內
        }
      }
    });

    if (recentSameSong) {
      throw new BadRequestException('相同歌曲需間隔30分鐘才能再次點歌');
    }
  }

  // 獲取活動的點歌隊列
  async getEventQueue(authContext: AuthContext, eventId: number) {
    // 檢查權限
    const resource = { eventId };
    if (!PermissionService.hasPermission(authContext, ENTITIES.REQUEST, ACTIONS.VIEW, resource)) {
      throw new ForbiddenException('無權限查看該活動的點歌隊列');
    }

    const requests = await this.prisma.request.findMany({
      where: {
        eventId,
        status: { in: ['QUEUED', 'ASSIGNED', 'ACCEPTED', 'PERFORMING'] }
      },
      include: {
        song: true,
        songVersion: true,
        player: true,
        user: {
          select: { id: true, displayName: true } // 只返回基本資訊
        },
        singer: {
          select: { id: true, stageName: true }
        }
      },
      orderBy: { priorityIndex: 'asc' }
    });

    // 根據用戶權限過濾敏感資訊
    return requests.map(request => {
      const masked = PermissionService.maskSensitiveFields(request, authContext, ENTITIES.REQUEST);
      return masked;
    });
  }

  // 指派歌手
  async assignSinger(authContext: AuthContext, assignRequestDto: AssignRequestDto) {
    // 檢查權限
    if (!PermissionService.hasPermission(authContext, ENTITIES.REQUEST, ACTIONS.ASSIGN)) {
      throw new ForbiddenException('無權限指派歌手');
    }

    const request = await this.prisma.request.findUnique({
      where: { id: assignRequestDto.requestId },
      include: { event: true }
    });

    if (!request) {
      throw new BadRequestException('點歌請求不存在');
    }

    // 檢查活動範圍權限
    const resource = { eventId: request.eventId };
    if (!PermissionService.hasPermission(authContext, ENTITIES.REQUEST, ACTIONS.ASSIGN, resource)) {
      throw new ForbiddenException('無權限管理該活動的點歌請求');
    }

    // 驗證歌手是否存在且參與該活動
    const eventSinger = await this.prisma.eventSinger.findUnique({
      where: {
        eventId_singerId: {
          eventId: request.eventId,
          singerId: assignRequestDto.singerId
        }
      },
      include: { singer: true }
    });

    if (!eventSinger) {
      throw new BadRequestException('歌手不存在或未參與該活動');
    }

    // 更新請求狀態
    const updatedRequest = await this.prisma.request.update({
      where: { id: assignRequestDto.requestId },
      data: {
        singerId: assignRequestDto.singerId,
        status: 'ASSIGNED'
      },
      include: {
        song: true,
        singer: true,
        player: true,
        user: true
      }
    });

    // 記錄請求事件
    await this.logRequestEvent(
      assignRequestDto.requestId,
      'assigned',
      authContext.userId,
      assignRequestDto.reason || '主持人指派歌手',
      { singerId: assignRequestDto.singerId, singerName: eventSinger.singer.stageName }
    );

    return updatedRequest;
  }

  // 重新排序（插隊）
  async reorderQueue(authContext: AuthContext, reorderRequestDto: ReorderRequestDto) {
    // 檢查權限
    if (!PermissionService.hasPermission(authContext, ENTITIES.REQUEST, ACTIONS.REORDER)) {
      throw new ForbiddenException('無權限調整隊列順序');
    }

    const request = await this.prisma.request.findUnique({
      where: { id: reorderRequestDto.requestId },
      include: { event: true }
    });

    if (!request) {
      throw new BadRequestException('點歌請求不存在');
    }

    // 檢查活動範圍權限
    const resource = { eventId: request.eventId };
    if (!PermissionService.hasPermission(authContext, ENTITIES.REQUEST, ACTIONS.REORDER, resource)) {
      throw new ForbiddenException('無權限管理該活動的點歌隊列');
    }

    // 獲取隊列中的所有請求
    const queueRequests = await this.prisma.request.findMany({
      where: {
        eventId: request.eventId,
        status: { in: ['QUEUED', 'ASSIGNED', 'ACCEPTED'] }
      },
      orderBy: { priorityIndex: 'asc' }
    });

    const newPosition = Math.max(1, Math.min(reorderRequestDto.newPosition, queueRequests.length));
    const currentIndex = queueRequests.findIndex(r => r.id === reorderRequestDto.requestId);
    
    if (currentIndex === -1) {
      throw new BadRequestException('請求不在當前隊列中');
    }

    // 重新計算優先級
    const reorderedRequests = [...queueRequests];
    const [movedRequest] = reorderedRequests.splice(currentIndex, 1);
    reorderedRequests.splice(newPosition - 1, 0, movedRequest);

    // 批量更新優先級
    const updates = reorderedRequests.map((req, index) => 
      this.prisma.request.update({
        where: { id: req.id },
        data: { priorityIndex: index + 1 }
      })
    );

    await this.prisma.$transaction(updates);

    // 記錄請求事件
    await this.logRequestEvent(
      reorderRequestDto.requestId,
      'reordered',
      authContext.userId,
      reorderRequestDto.reason,
      { 
        oldPosition: currentIndex + 1, 
        newPosition: newPosition 
      }
    );

    return { message: '隊列順序調整成功', newPosition };
  }

  // 更新請求狀態
  async updateRequestStatus(authContext: AuthContext, updateStatusDto: UpdateRequestStatusDto) {
    const request = await this.prisma.request.findUnique({
      where: { id: updateStatusDto.requestId },
      include: { event: true, singer: true }
    });

    if (!request) {
      throw new BadRequestException('點歌請求不存在');
    }

    // 檢查權限（歌手可以更新分配給自己的請求）
    const isAssignedSinger = request.singerId === authContext.singerId;
    const hasUpdatePermission = PermissionService.hasPermission(
      authContext, 
      ENTITIES.REQUEST, 
      ACTIONS.UPDATE,
      { eventId: request.eventId }
    );

    if (!isAssignedSinger && !hasUpdatePermission) {
      throw new ForbiddenException('無權限更新該請求狀態');
    }

    // 驗證狀態轉換的合法性
    this.validateStatusTransition(request.status, updateStatusDto.status);

    // 更新請求狀態
    const updatedRequest = await this.prisma.request.update({
      where: { id: updateStatusDto.requestId },
      data: { 
        status: updateStatusDto.status as any,
        ...(updateStatusDto.status === 'COMPLETED' ? { completedAt: new Date() } : {})
      },
      include: {
        song: true,
        singer: true,
        player: true,
        user: true
      }
    });

    // 如果是完成狀態，增加歌曲請求次數
    if (updateStatusDto.status === 'COMPLETED' && request.singerId) {
      await this.incrementSongRequestCount(request.singerId, request.songId);
    }

    // 記錄請求事件
    await this.logRequestEvent(
      updateStatusDto.requestId,
      'status_changed',
      authContext.userId,
      updateStatusDto.reason || '狀態變更',
      { 
        oldStatus: request.status, 
        newStatus: updateStatusDto.status 
      }
    );

    return updatedRequest;
  }

  // 驗證狀態轉換
  private validateStatusTransition(currentStatus: string, newStatus: string) {
    const validTransitions = {
      'QUEUED': ['ASSIGNED', 'CANCELLED'],
      'ASSIGNED': ['ACCEPTED', 'DECLINED', 'CANCELLED'],
      'ACCEPTED': ['PERFORMING', 'CANCELLED'],
      'DECLINED': ['ASSIGNED'], // 可以重新指派
      'PERFORMING': ['COMPLETED', 'CANCELLED'],
      'COMPLETED': [], // 完成後不能再改
      'CANCELLED': [] // 取消後不能再改
    };

    const allowedStatuses = validTransitions[currentStatus] || [];
    if (!allowedStatuses.includes(newStatus)) {
      throw new BadRequestException(`無法從 ${currentStatus} 轉換到 ${newStatus}`);
    }
  }

  // 增加歌曲請求次數
  private async incrementSongRequestCount(singerId: number, songId: number) {
    await this.prisma.singerSong.upsert({
      where: {
        singerId_songId: { singerId, songId }
      },
      update: {
        timesRequested: { increment: 1 }
      },
      create: {
        singerId,
        songId,
        learned: false,
        timesRequested: 1
      }
    });
  }

  // 記錄請求事件
  private async logRequestEvent(
    requestId: number,
    type: string,
    operatorUserId: number,
    reason?: string,
    payload?: any
  ) {
    await this.prisma.requestEvent.create({
      data: {
        requestId,
        type,
        operatorUserId,
        reason,
        payload: payload ? JSON.stringify(payload) : null
      }
    });
  }

  // 取消點歌請求
  async cancelRequest(authContext: AuthContext, requestId: number, reason?: string) {
    const request = await this.prisma.request.findUnique({
      where: { id: requestId },
      include: { event: true }
    });

    if (!request) {
      throw new BadRequestException('點歌請求不存在');
    }

    // 檢查權限（只能取消自己的請求，或者是主持人/管理員）
    const isOwnRequest = request.userId === authContext.userId;
    const hasDeletePermission = PermissionService.hasPermission(
      authContext,
      ENTITIES.REQUEST,
      ACTIONS.DELETE,
      { eventId: request.eventId }
    );

    if (!isOwnRequest && !hasDeletePermission) {
      throw new ForbiddenException('無權限取消該點歌請求');
    }

    // 檢查是否可以取消（已在演唱中的不能取消）
    if (request.status === 'PERFORMING') {
      throw new BadRequestException('演唱中的請求無法取消');
    }

    // 更新狀態為取消
    const cancelledRequest = await this.prisma.request.update({
      where: { id: requestId },
      data: { status: 'CANCELLED' },
      include: {
        song: true,
        player: true,
        user: true
      }
    });

    // 記錄請求事件
    await this.logRequestEvent(
      requestId,
      'cancelled',
      authContext.userId,
      reason || '用戶取消點歌請求'
    );

    return cancelledRequest;
  }

  // 獲取用戶的點歌歷史
  async getUserRequestHistory(authContext: AuthContext, userId?: number) {
    const targetUserId = userId || authContext.userId;

    // 檢查權限（只能查看自己的，或者是管理員查看他人的）
    if (targetUserId !== authContext.userId) {
      if (!PermissionService.hasPermission(authContext, ENTITIES.REQUEST, ACTIONS.VIEW)) {
        throw new ForbiddenException('無權限查看他人的點歌歷史');
      }
    }

    const requests = await this.prisma.request.findMany({
      where: { userId: targetUserId },
      include: {
        song: true,
        songVersion: true,
        singer: {
          select: { id: true, stageName: true }
        },
        event: {
          select: { id: true, title: true, startsAt: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return requests;
  }
}