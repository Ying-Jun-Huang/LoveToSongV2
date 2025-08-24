import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Request, RequestStatus } from '@prisma/client';
import { WebSocketService } from '../websocket/websocket.service';

export interface CreateSongRequestDto {
  songId: number;
  userId?: number;
  playerId?: number;
  singerId?: number;
  eventId?: number;
  priority?: number;
  note?: string;
}

export interface UpdateSongRequestDto {
  status?: RequestStatus;
  priority?: number;
  note?: string;
}

export interface FindAllFilters {
  page: number;
  limit: number;
  status?: string;
  playerId?: number;
  date?: string;
}

export interface QueueStats {
  totalPending: number;
  totalCompleted: number;
  totalCancelled: number;
  averageWaitTime: number;
  currentPosition: number;
}

@Injectable()
export class SongRequestsService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => WebSocketService))
    private wsService: WebSocketService
  ) {}

  // 獲取所有點歌請求（帶分頁和篩選）
  async findAll(filters: FindAllFilters) {
    const { page, limit, status, playerId, date } = filters;
    const skip = (page - 1) * limit;

    // 建立篩選條件
    const where: any = {};
    
    if (status && ['QUEUED', 'ASSIGNED', 'ACCEPTED', 'DECLINED', 'PERFORMING', 'COMPLETED', 'CANCELLED'].includes(status)) {
      where.status = status;
    }
    
    if (playerId) {
      where.playerId = playerId;
    }
    
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      
      where.requestedAt = {
        gte: startDate,
        lt: endDate,
      };
    }

    // 查詢數據和總數
    const [requests, total] = await Promise.all([
      this.prisma.request.findMany({
        where,
        include: {
          song: true,
          player: true,
          user: true,
        },
        orderBy: [
          { status: 'asc' }, // PENDING 優先
          { priorityIndex: 'desc' }, // 高優先級優先
          { requestedAt: 'asc' }, // 早請求優先
        ],
        skip,
        take: limit,
      }),
      this.prisma.request.count({ where }),
    ]);

    return {
      requests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: skip + limit < total,
        hasPrev: page > 1,
      },
    };
  }

  // 獲取當前排隊狀態
  async getQueue() {
    const pendingRequests = await this.prisma.request.findMany({
      where: { status: 'QUEUED' },
      include: {
        song: true,
        player: true,
        user: true,
        singer: {
          include: {
            user: true
          }
        },
      },
      orderBy: [
        { priorityIndex: 'desc' },
        { requestedAt: 'asc' },
      ],
    });

    // 計算每個請求的預估等待時間
    const requestsWithPosition = pendingRequests.map((request, index) => ({
      ...request,
      queuePosition: index + 1,
      estimatedWaitTime: index * 4, // 假設每首歌平均 4 分鐘
    }));

    return {
      queue: requestsWithPosition,
      totalInQueue: pendingRequests.length,
      currentlyPlaying: await this.getCurrentlyPlaying(),
    };
  }

  // 獲取當前正在播放的歌曲（如果有的話）
  private async getCurrentlyPlaying() {
    // 這裡可以擴展為更複雜的邏輯，比如有一個 "PLAYING" 狀態
    return null;
  }

  // 獲取點歌統計
  async getStats(date?: string): Promise<QueueStats> {
    let dateFilter = {};
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      
      dateFilter = {
        requestedAt: {
          gte: startDate,
          lt: endDate,
        },
      };
    }

    const [totalPending, totalCompleted, totalCancelled] = await Promise.all([
      this.prisma.request.count({
        where: { ...dateFilter, status: 'QUEUED' },
      }),
      this.prisma.request.count({
        where: { ...dateFilter, status: 'COMPLETED' },
      }),
      this.prisma.request.count({
        where: { ...dateFilter, status: 'CANCELLED' },
      }),
    ]);

    // 計算平均等待時間
    const completedRequests = await this.prisma.request.findMany({
      where: {
        ...dateFilter,
        status: 'COMPLETED',
      },
      select: {
        requestedAt: true,
        updatedAt: true,
      },
    });

    const averageWaitTime = completedRequests.length > 0
      ? completedRequests.reduce((sum, req) => {
          const waitTime = new Date(req.updatedAt).getTime() - new Date(req.requestedAt).getTime();
          return sum + (waitTime / 1000 / 60); // 轉換為分鐘
        }, 0) / completedRequests.length
      : 0;

    return {
      totalPending,
      totalCompleted,
      totalCancelled,
      averageWaitTime: Math.round(averageWaitTime),
      currentPosition: totalPending,
    };
  }

  // 獲取熱門歌曲
  async getPopularSongs(limit: number = 10, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const popularSongs = await this.prisma.request.groupBy({
      by: ['songId'],
      where: {
        requestedAt: { gte: startDate },
        status: { in: ['COMPLETED', 'QUEUED'] },
      },
      _count: {
        songId: true,
      },
      orderBy: {
        _count: {
          songId: 'desc',
        },
      },
      take: limit,
    });

    // 獲取歌曲詳細資訊
    const songsWithDetails = await Promise.all(
      popularSongs.map(async (item) => {
        const song = await this.prisma.song.findUnique({
          where: { id: item.songId },
          include: {
            // Note: Song model doesn't have user relation, removing this include
          },
        });

        return {
          song,
          requestCount: item._count.songId,
        };
      })
    );

    return songsWithDetails.filter(item => item.song !== null);
  }

  // 根據 ID 獲取單個點歌請求
  async findOne(id: number): Promise<Request | null> {
    return this.prisma.request.findUnique({
      where: { id },
      include: {
        song: true,
        player: true,
        user: true,
      },
    });
  }

  // 創建新的點歌請求
  async create(createSongRequestDto: CreateSongRequestDto): Promise<Request> {
    const { songId, userId, playerId, singerId, eventId = 1, priority = 0, note } = createSongRequestDto;

    // 驗證歌曲存在
    const song = await this.prisma.song.findUnique({ where: { id: songId } });
    if (!song) {
      throw new Error('Song not found');
    }

    // 驗證玩家或用戶存在
    if (playerId) {
      const player = await this.prisma.player.findUnique({ where: { id: playerId } });
      if (!player) {
        throw new Error('Player not found');
      }
    }

    if (userId) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new Error('User not found');
      }
    }

    // 驗證歌手存在
    if (singerId) {
      const singer = await this.prisma.singer.findUnique({ where: { id: singerId } });
      if (!singer) {
        throw new Error('Singer not found');
      }
    }

    // 創建點歌請求
    const request = await this.prisma.request.create({
      data: {
        eventId,
        songId,
        userId,
        playerId,
        singerId,
        priorityIndex: priority,
        notes: note,
      },
      include: {
        song: true,
        player: true,
        user: true,
        singer: {
          include: {
            user: true
          }
        },
      },
    });

    // Note: Player model doesn't have songCount field, so not updating player statistics

    // 發送WebSocket通知
    if (this.wsService) {
      this.wsService.notifyRequestCreated(1, request); // 使用默認eventId=1，實際應根據request.eventId
    }

    return request;
  }

  // 批量創建點歌請求
  async createBatch(requests: CreateSongRequestDto[]) {
    const createdRequests: Request[] = [];
    const errors: Array<{ index: number; error: string; data: CreateSongRequestDto }> = [];

    for (let i = 0; i < requests.length; i++) {
      try {
        const request = await this.create(requests[i]);
        createdRequests.push(request);
      } catch (error) {
        errors.push({
          index: i,
          error: error.message,
          data: requests[i],
        });
      }
    }

    return {
      created: createdRequests,
      errors,
      total: requests.length,
      successful: createdRequests.length,
    };
  }

  // 更新點歌請求
  async update(id: number, updateSongRequestDto: UpdateSongRequestDto): Promise<Request> {
    const { status, priority, note } = updateSongRequestDto;

    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priorityIndex = priority;
    if (note !== undefined) updateData.notes = note;

    // Status update logic handled automatically by updatedAt

    const updatedRequest = await this.prisma.request.update({
      where: { id },
      data: updateData,
      include: {
        song: true,
        player: true,
        user: true,
      },
    });

    // 發送WebSocket通知
    if (this.wsService && status !== undefined) {
      this.wsService.notifyRequestUpdated(updatedRequest.eventId, updatedRequest, status);
    }

    return updatedRequest;
  }

  // 批量更新狀態
  async updateBatchStatus(ids: number[], status: RequestStatus) {
    const updateData: any = { status };
    // Status update logic handled automatically by updatedAt

    const result = await this.prisma.request.updateMany({
      where: { id: { in: ids } },
      data: updateData,
    });

    return {
      updated: result.count,
      status,
      ids,
    };
  }

  // 刪除點歌請求
  async remove(id: number): Promise<Request> {
    return this.prisma.request.delete({
      where: { id },
      include: {
        song: true,
        player: true,
        user: true,
      },
    });
  }

  // 完成當前請求並獲取下一首
  async completeRequest(id: number) {
    const request = await this.update(id, { status: 'COMPLETED' });
    return request;
  }

  // 獲取下一首待播放的歌
  async getNextInQueue() {
    return this.prisma.request.findFirst({
      where: { status: 'QUEUED' },
      include: {
        song: true,
        player: true,
        user: true,
      },
      orderBy: [
        { priorityIndex: 'desc' },
        { requestedAt: 'asc' },
      ],
    });
  }

  // 重新排序請求
  async reorderRequests(requestIds: number[]) {
    // 這是一個簡化的實現，實際中可能需要更複雜的邏輯
    const updates = requestIds.map((id, index) => 
      this.prisma.request.update({
        where: { id },
        data: { priorityIndex: requestIds.length - index }, // 反向設置優先級
      })
    );

    await Promise.all(updates);

    return {
      message: 'Requests reordered successfully',
      order: requestIds,
    };
  }

  // 獲取玩家點歌歷史
  async getPlayerHistory(playerId: number, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [requests, total] = await Promise.all([
      this.prisma.request.findMany({
        where: { playerId },
        include: {
          song: true,
        },
        orderBy: { requestedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.request.count({ where: { playerId } }),
    ]);

    return {
      requests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: skip + limit < total,
        hasPrev: page > 1,
      },
    };
  }

  // 獲取個人點歌歷史（增強版）
  async getMyHistory(userId: number, page: number = 1, limit: number = 20, status?: string) {
    const skip = (page - 1) * limit;
    const where: any = { userId };

    if (status && status !== 'ALL') {
      where.status = status;
    }

    // 獲取請求數據，包含完整的關聯資訊和狀態變更歷史
    const requests = await this.prisma.request.findMany({
      where,
      include: {
        song: true,
        songVersion: true,
        singer: {
          include: {
            user: true
          }
        },
        player: true,
        event: {
          select: {
            id: true,
            title: true,
            venue: true,
            startsAt: true
          }
        },
        requestEvents: {
          include: {
            operator: {
              select: {
                id: true,
                displayName: true
              }
            }
          },
          orderBy: {
            occurredAt: 'desc'
          }
        }
      },
      orderBy: {
        requestedAt: 'desc'
      },
      skip,
      take: limit,
    });

    const total = await this.prisma.request.count({ where });

    return {
      data: requests.map(req => ({
        ...req,
        statusHistory: req.requestEvents,
        currentStatus: req.status,
        waitingTime: this.calculateWaitingTime(req),
        estimatedStart: this.estimateStartTime(req)
      })),
      pagination: {
        page,
        limit,
        total,
        hasMore: skip + requests.length < total,
      },
    };
  }

  // 獲取當前用戶的點歌狀態摘要
  async getMyRequestStatus(userId: number) {
    const statusCounts = await this.prisma.request.groupBy({
      by: ['status'],
      where: { userId },
      _count: true,
    });

    const currentRequests = await this.prisma.request.findMany({
      where: {
        userId,
        status: {
          in: ['QUEUED', 'ASSIGNED', 'ACCEPTED', 'PERFORMING']
        }
      },
      include: {
        song: true,
        singer: {
          include: {
            user: {
              select: {
                displayName: true
              }
            }
          }
        },
        event: {
          select: {
            id: true,
            title: true,
            venue: true
          }
        }
      },
      orderBy: {
        priorityIndex: 'asc'
      }
    });

    const recentCompleted = await this.prisma.request.findMany({
      where: {
        userId,
        status: 'COMPLETED'
      },
      include: {
        song: true,
        singer: {
          include: {
            user: {
              select: {
                displayName: true
              }
            }
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 5
    });

    // 計算統計資料
    const stats = {
      totalRequests: statusCounts.reduce((sum, item) => sum + item._count, 0),
      statusBreakdown: statusCounts.reduce((acc, item) => {
        acc[item.status] = item._count;
        return acc;
      }, {} as Record<string, number>),
      currentQueue: currentRequests.length,
      recentlyCompleted: recentCompleted.length
    };

    return {
      summary: stats,
      currentRequests: currentRequests.map(req => ({
        ...req,
        queuePosition: this.calculateQueuePosition(req),
        estimatedWaitTime: this.estimateWaitTime(req)
      })),
      recentCompleted
    };
  }

  // 獲取用戶的點歌統計分析
  async getMyAnalytics(userId: number, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const requests = await this.prisma.request.findMany({
      where: {
        userId,
        requestedAt: {
          gte: startDate
        }
      },
      include: {
        song: true,
        singer: {
          include: {
            user: {
              select: {
                displayName: true
              }
            }
          }
        }
      }
    });

    // 分析數據
    const analytics = {
      totalRequests: requests.length,
      completedRequests: requests.filter(r => r.status === 'COMPLETED').length,
      cancelledRequests: requests.filter(r => r.status === 'CANCELLED').length,
      averageWaitTime: this.calculateAverageWaitTime(requests),
      mostRequestedSongs: this.getMostRequestedSongs(requests),
      favoriteGenres: this.getFavoriteGenres(requests),
      preferredSingers: this.getPreferredSingers(requests),
      activityByDay: this.getActivityByDay(requests),
      successRate: requests.length > 0 ? 
        (requests.filter(r => r.status === 'COMPLETED').length / requests.length) * 100 : 0
    };

    return analytics;
  }

  // 輔助方法：計算等待時間
  private calculateWaitingTime(request: any): number {
    if (request.status === 'COMPLETED' || request.status === 'CANCELLED') {
      return new Date(request.updatedAt).getTime() - new Date(request.requestedAt).getTime();
    }
    return new Date().getTime() - new Date(request.requestedAt).getTime();
  }

  // 輔助方法：估算開始時間
  private estimateStartTime(request: any): Date | null {
    if (request.status === 'PERFORMING') return new Date();
    if (request.status === 'COMPLETED' || request.status === 'CANCELLED') return null;
    
    // 簡單估算：假設每首歌4分鐘，根據隊列位置估算
    const queuePosition = this.calculateQueuePosition(request);
    const estimatedMinutes = queuePosition * 4;
    const estimatedStart = new Date();
    estimatedStart.setMinutes(estimatedStart.getMinutes() + estimatedMinutes);
    
    return estimatedStart;
  }

  // 輔助方法：計算隊列位置
  private calculateQueuePosition(request: any): number {
    // 這裡需要實際的隊列邏輯，簡化版本
    return request.priorityIndex || 0;
  }

  // 輔助方法：估算等待時間
  private estimateWaitTime(request: any): number {
    const position = this.calculateQueuePosition(request);
    return position * 4 * 60 * 1000; // 4分鐘 * 位置，以毫秒返回
  }

  // 輔助方法：計算平均等待時間
  private calculateAverageWaitTime(requests: any[]): number {
    const completedRequests = requests.filter(r => r.status === 'COMPLETED');
    if (completedRequests.length === 0) return 0;
    
    const totalWaitTime = completedRequests.reduce((sum, req) => {
      return sum + (new Date(req.updatedAt).getTime() - new Date(req.requestedAt).getTime());
    }, 0);
    
    return totalWaitTime / completedRequests.length;
  }

  // 輔助方法：獲取最常點的歌曲
  private getMostRequestedSongs(requests: any[]): any[] {
    const songCounts = requests.reduce((acc, req) => {
      const songKey = `${req.song.title}-${req.song.originalArtist}`;
      acc[songKey] = (acc[songKey] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(songCounts)
      .map(([song, count]) => ({ song, count }))
      .sort((a, b) => (b.count as number) - (a.count as number))
      .slice(0, 5);
  }

  // 輔助方法：獲取喜愛的類型
  private getFavoriteGenres(requests: any[]): any[] {
    const genres = requests.map(r => r.song.language || 'Unknown');
    const genreCounts = genres.reduce((acc, genre) => {
      acc[genre] = (acc[genre] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(genreCounts)
      .map(([genre, count]) => ({ genre, count }))
      .sort((a, b) => (b.count as number) - (a.count as number));
  }

  // 輔助方法：獲取偏好的歌手
  private getPreferredSingers(requests: any[]): any[] {
    const singers = requests.filter(r => r.singer).map(r => ({
      name: r.singer.user?.displayName || r.singer.stageName,
      id: r.singer.id
    }));
    
    const singerCounts = singers.reduce((acc, singer) => {
      acc[singer.name] = (acc[singer.name] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(singerCounts)
      .map(([singer, count]) => ({ singer, count }))
      .sort((a, b) => (b.count as number) - (a.count as number))
      .slice(0, 3);
  }

  // 輔助方法：獲取每日活動
  private getActivityByDay(requests: any[]): any[] {
    const dayActivity = requests.reduce((acc, req) => {
      const day = new Date(req.requestedAt).toDateString();
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(dayActivity)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  // 清空已完成的請求
  async clearCompleted(olderThan?: Date) {
    const where: any = { status: 'COMPLETED' };
    
    if (olderThan) {
      where.completedAt = { lt: olderThan };
    }

    const result = await this.prisma.request.deleteMany({ where });

    return {
      message: 'Completed requests cleared successfully',
      deleted: result.count,
      olderThan: olderThan?.toISOString(),
    };
  }
}