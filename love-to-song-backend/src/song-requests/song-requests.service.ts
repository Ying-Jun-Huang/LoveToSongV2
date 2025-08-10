import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SongRequest, RequestStatus } from '@prisma/client';

export interface CreateSongRequestDto {
  songId: number;
  userId?: number;
  playerId?: number;
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
  constructor(private prisma: PrismaService) {}

  // 獲取所有點歌請求（帶分頁和篩選）
  async findAll(filters: FindAllFilters) {
    const { page, limit, status, playerId, date } = filters;
    const skip = (page - 1) * limit;

    // 建立篩選條件
    const where: any = {};
    
    if (status && ['PENDING', 'COMPLETED', 'CANCELLED'].includes(status)) {
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
      this.prisma.songRequest.findMany({
        where,
        include: {
          song: true,
          player: true,
          user: true,
        },
        orderBy: [
          { status: 'asc' }, // PENDING 優先
          { priority: 'desc' }, // 高優先級優先
          { requestedAt: 'asc' }, // 早請求優先
        ],
        skip,
        take: limit,
      }),
      this.prisma.songRequest.count({ where }),
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
    const pendingRequests = await this.prisma.songRequest.findMany({
      where: { status: 'PENDING' },
      include: {
        song: true,
        player: true,
        user: true,
      },
      orderBy: [
        { priority: 'desc' },
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
      this.prisma.songRequest.count({
        where: { ...dateFilter, status: 'PENDING' },
      }),
      this.prisma.songRequest.count({
        where: { ...dateFilter, status: 'COMPLETED' },
      }),
      this.prisma.songRequest.count({
        where: { ...dateFilter, status: 'CANCELLED' },
      }),
    ]);

    // 計算平均等待時間
    const completedRequests = await this.prisma.songRequest.findMany({
      where: {
        ...dateFilter,
        status: 'COMPLETED',
        completedAt: { not: null },
      },
      select: {
        requestedAt: true,
        completedAt: true,
      },
    });

    const averageWaitTime = completedRequests.length > 0
      ? completedRequests.reduce((sum, req) => {
          const waitTime = new Date(req.completedAt!).getTime() - new Date(req.requestedAt).getTime();
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

    const popularSongs = await this.prisma.songRequest.groupBy({
      by: ['songId'],
      where: {
        requestedAt: { gte: startDate },
        status: { in: ['COMPLETED', 'PENDING'] },
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
            user: {
              select: { username: true },
            },
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
  async findOne(id: number): Promise<SongRequest | null> {
    return this.prisma.songRequest.findUnique({
      where: { id },
      include: {
        song: true,
        player: true,
        user: true,
      },
    });
  }

  // 創建新的點歌請求
  async create(createSongRequestDto: CreateSongRequestDto): Promise<SongRequest> {
    const { songId, userId, playerId, priority = 0, note } = createSongRequestDto;

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

    // 創建點歌請求
    const request = await this.prisma.songRequest.create({
      data: {
        songId,
        userId,
        playerId,
        priority,
        note,
      },
      include: {
        song: true,
        player: true,
        user: true,
      },
    });

    // 更新玩家點歌次數
    if (playerId) {
      await this.prisma.player.update({
        where: { id: playerId },
        data: { songCount: { increment: 1 } },
      });
    }

    return request;
  }

  // 批量創建點歌請求
  async createBatch(requests: CreateSongRequestDto[]) {
    const createdRequests: SongRequest[] = [];
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
  async update(id: number, updateSongRequestDto: UpdateSongRequestDto): Promise<SongRequest> {
    const { status, priority, note } = updateSongRequestDto;

    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (note !== undefined) updateData.note = note;

    // 如果標記為完成，設置完成時間
    if (status === 'COMPLETED') {
      updateData.completedAt = new Date();
    }

    return this.prisma.songRequest.update({
      where: { id },
      data: updateData,
      include: {
        song: true,
        player: true,
        user: true,
      },
    });
  }

  // 批量更新狀態
  async updateBatchStatus(ids: number[], status: RequestStatus) {
    const updateData: any = { status };
    if (status === 'COMPLETED') {
      updateData.completedAt = new Date();
    }

    const result = await this.prisma.songRequest.updateMany({
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
  async remove(id: number): Promise<SongRequest> {
    return this.prisma.songRequest.delete({
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
    return this.prisma.songRequest.findFirst({
      where: { status: 'PENDING' },
      include: {
        song: true,
        player: true,
        user: true,
      },
      orderBy: [
        { priority: 'desc' },
        { requestedAt: 'asc' },
      ],
    });
  }

  // 重新排序請求
  async reorderRequests(requestIds: number[]) {
    // 這是一個簡化的實現，實際中可能需要更複雜的邏輯
    const updates = requestIds.map((id, index) => 
      this.prisma.songRequest.update({
        where: { id },
        data: { priority: requestIds.length - index }, // 反向設置優先級
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
      this.prisma.songRequest.findMany({
        where: { playerId },
        include: {
          song: true,
        },
        orderBy: { requestedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.songRequest.count({ where: { playerId } }),
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

  // 清空已完成的請求
  async clearCompleted(olderThan?: Date) {
    const where: any = { status: 'COMPLETED' };
    
    if (olderThan) {
      where.completedAt = { lt: olderThan };
    }

    const result = await this.prisma.songRequest.deleteMany({ where });

    return {
      message: 'Completed requests cleared successfully',
      deleted: result.count,
      olderThan: olderThan?.toISOString(),
    };
  }
}