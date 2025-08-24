import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PermissionService, AuthContext, ENTITIES, ACTIONS } from '../auth/rbac-abac.system';

export interface CreateWishSongDto {
  title: string;
  originalArtist?: string;
  singerId?: number; // 指給特定歌手，可選
  playerId?: number;
  notes?: string;
}

export interface ApproveWishSongDto {
  wishSongId: number;
  action: 'approve' | 'reject' | 'add_to_songbook';
  reason?: string;
  songData?: {
    language?: string;
    genreTagId?: number;
    era?: string;
  };
}

export interface BatchApproveDto {
  wishSongIds: number[];
  action: 'approve' | 'reject';
  reason?: string;
}

@Injectable()
export class WishSongService {
  constructor(private prisma: PrismaService) {}

  // 創建願望歌
  async createWishSong(authContext: AuthContext, createWishSongDto: CreateWishSongDto) {
    // 檢查權限
    if (!PermissionService.hasPermission(authContext, ENTITIES.WISH_SONG, ACTIONS.CREATE)) {
      throw new ForbiddenException('無權限提交願望歌');
    }

    // 驗證歌手是否存在（如果指定了歌手）
    if (createWishSongDto.singerId) {
      const singer = await this.prisma.singer.findUnique({
        where: { id: createWishSongDto.singerId }
      });

      if (!singer || !singer.isActive) {
        throw new BadRequestException('指定的歌手不存在或已停用');
      }
    }

    // 檢查是否已經有相同的願望歌（防止重複提交）
    const existingWishSong = await this.prisma.wishSong.findFirst({
      where: {
        title: createWishSongDto.title,
        originalArtist: createWishSongDto.originalArtist,
        status: { in: ['PENDING', 'APPROVED'] },
        OR: [
          { userId: authContext.userId },
          { playerId: createWishSongDto.playerId }
        ]
      }
    });

    if (existingWishSong) {
      throw new BadRequestException('您已經提交過相同的願望歌，請等待審核');
    }

    // 檢查提交限制（例如：每天最多提交5首）
    await this.checkSubmissionLimits(authContext, createWishSongDto.playerId);

    // 創建願望歌
    const wishSong = await this.prisma.wishSong.create({
      data: {
        title: createWishSongDto.title,
        originalArtist: createWishSongDto.originalArtist,
        singerId: createWishSongDto.singerId,
        userId: authContext.userId,
        playerId: createWishSongDto.playerId,
        notes: createWishSongDto.notes,
        status: 'PENDING'
      },
      include: {
        user: {
          select: { id: true, displayName: true }
        },
        player: {
          select: { id: true, name: true, nickname: true }
        },
        singer: {
          select: { id: true, stageName: true }
        }
      }
    });

    // TODO: 發送通知給相關人員（歌手、主持人、管理員）

    return wishSong;
  }

  // 檢查提交限制
  private async checkSubmissionLimits(authContext: AuthContext, playerId?: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaySubmissions = await this.prisma.wishSong.count({
      where: {
        OR: [
          { userId: authContext.userId },
          { playerId: playerId }
        ],
        createdAt: {
          gte: today
        }
      }
    });

    const maxDailySubmissions = 5; // 可配置
    if (todaySubmissions >= maxDailySubmissions) {
      throw new BadRequestException(`每天最多只能提交 ${maxDailySubmissions} 首願望歌`);
    }
  }

  // 獲取願望歌列表
  async getWishSongs(authContext: AuthContext, filters?: {
    status?: string;
    singerId?: number;
    userId?: number;
    playerId?: number;
  }) {
    // 檢查權限
    let whereClause: any = {};

    // 根據用戶角色決定可見範圍
    const canViewAll = PermissionService.hasPermission(authContext, ENTITIES.WISH_SONG, ACTIONS.VIEW);
    
    if (!canViewAll) {
      // 只能看到自己相關的願望歌
      whereClause.OR = [
        { userId: authContext.userId },
        { playerId: authContext.playerId },
        { singerId: authContext.singerId }
      ];
    }

    // 應用篩選條件
    if (filters?.status) {
      whereClause.status = filters.status;
    }

    if (filters?.singerId) {
      whereClause.singerId = filters.singerId;
    }

    if (filters?.userId && canViewAll) {
      whereClause.userId = filters.userId;
    }

    if (filters?.playerId && canViewAll) {
      whereClause.playerId = filters.playerId;
    }

    const wishSongs = await this.prisma.wishSong.findMany({
      where: whereClause,
      include: {
        user: {
          select: { id: true, displayName: true }
        },
        player: {
          select: { id: true, name: true, nickname: true }
        },
        singer: {
          select: { id: true, stageName: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // 根據權限過濾敏感資訊
    return wishSongs.map(wishSong => 
      PermissionService.maskSensitiveFields(wishSong, authContext, ENTITIES.WISH_SONG)
    );
  }

  // 審核願望歌
  async approveWishSong(authContext: AuthContext, approveDto: ApproveWishSongDto) {
    // 檢查權限
    if (!PermissionService.hasPermission(authContext, ENTITIES.WISH_SONG, ACTIONS.APPROVE)) {
      throw new ForbiddenException('無權限審核願望歌');
    }

    const wishSong = await this.prisma.wishSong.findUnique({
      where: { id: approveDto.wishSongId },
      include: {
        user: true,
        player: true,
        singer: true
      }
    });

    if (!wishSong) {
      throw new BadRequestException('願望歌不存在');
    }

    if (wishSong.status !== 'PENDING') {
      throw new BadRequestException('該願望歌已經被審核過');
    }

    let updatedWishSong;
    let createdSong = null;

    switch (approveDto.action) {
      case 'approve':
        updatedWishSong = await this.prisma.wishSong.update({
          where: { id: approveDto.wishSongId },
          data: { status: 'APPROVED' },
          include: {
            user: true,
            player: true,
            singer: true
          }
        });
        break;

      case 'reject':
        updatedWishSong = await this.prisma.wishSong.update({
          where: { id: approveDto.wishSongId },
          data: { status: 'REJECTED' },
          include: {
            user: true,
            player: true,
            singer: true
          }
        });
        break;

      case 'add_to_songbook':
        // 將願望歌加入歌庫
        // createdSong = await this.addWishSongToSongbook(wishSong, approveDto.songData);
        
        updatedWishSong = await this.prisma.wishSong.update({
          where: { id: approveDto.wishSongId },
          data: { status: 'ADDED' },
          include: {
            user: true,
            player: true,
            singer: true
          }
        });
        break;

      default:
        throw new BadRequestException('無效的審核操作');
    }

    // TODO: 發送通知給提交者

    return {
      wishSong: updatedWishSong,
      createdSong,
      message: `願望歌已${this.getActionDisplayName(approveDto.action)}`
    };
  }

  // 將願望歌加入歌庫
  private async addWishSongToSongbook(wishSong: any, songData?: any) {
    // 檢查歌庫中是否已存在相同歌曲
    const existingSong = await this.prisma.song.findFirst({
      where: {
        title: wishSong.title,
        originalArtist: wishSong.originalArtist
      }
    });

    if (existingSong) {
      // 如果歌曲已存在，可以選擇加入到指定歌手的歌單
      if (wishSong.singerId) {
        await this.prisma.singerSong.upsert({
          where: {
            singerId_songId: {
              singerId: wishSong.singerId,
              songId: existingSong.id
            }
          },
          update: {},
          create: {
            singerId: wishSong.singerId,
            songId: existingSong.id,
            learned: false,
            timesRequested: 0
          }
        });
      }
      return existingSong;
    }

    // 創建新歌曲
    const newSong = await this.prisma.song.create({
      data: {
        title: wishSong.title,
        originalArtist: wishSong.originalArtist,
        language: songData?.language || '國語',
        genreTagId: songData?.genreTagId,
        era: songData?.era || '2020年代',
        isActive: true
      }
    });

    // 如果指定了歌手，將歌曲加入歌手歌單
    if (wishSong.singerId) {
      await this.prisma.singerSong.create({
        data: {
          singerId: wishSong.singerId,
          songId: newSong.id,
          learned: false,
          timesRequested: 0
        }
      });
    }

    return newSong;
  }

  // 批量審核願望歌
  async batchApprove(authContext: AuthContext, batchDto: BatchApproveDto) {
    // 檢查權限
    if (!PermissionService.hasPermission(authContext, ENTITIES.WISH_SONG, ACTIONS.APPROVE)) {
      throw new ForbiddenException('無權限批量審核願望歌');
    }

    const wishSongs = await this.prisma.wishSong.findMany({
      where: {
        id: { in: batchDto.wishSongIds },
        status: 'PENDING'
      }
    });

    if (wishSongs.length === 0) {
      throw new BadRequestException('沒有可審核的願望歌');
    }

    const newStatus = batchDto.action === 'approve' ? 'APPROVED' : 'REJECTED';

    const updatedWishSongs = await this.prisma.wishSong.updateMany({
      where: {
        id: { in: wishSongs.map(ws => ws.id) }
      },
      data: { status: newStatus }
    });

    // TODO: 批量發送通知

    return {
      updated: updatedWishSongs.count,
      action: batchDto.action,
      message: `批量${this.getActionDisplayName(batchDto.action)}了 ${updatedWishSongs.count} 首願望歌`
    };
  }

  // 歌手標記願望歌狀態
  async singerMarkWishSong(authContext: AuthContext, wishSongId: number, action: 'accepted' | 'rejected' | 'added') {
    const wishSong = await this.prisma.wishSong.findUnique({
      where: { id: wishSongId }
    });

    if (!wishSong) {
      throw new BadRequestException('願望歌不存在');
    }

    // 檢查是否是指派給自己的願望歌
    if (wishSong.singerId !== authContext.singerId) {
      throw new ForbiddenException('只能處理指派給自己的願望歌');
    }

    let newStatus: string;
    let message: string;

    switch (action) {
      case 'accepted':
        newStatus = 'APPROVED';
        message = '歌手已接受該願望歌';
        
        // 如果歌曲已存在於歌庫，自動加入歌手歌單
        const existingSong = await this.prisma.song.findFirst({
          where: {
            title: wishSong.title,
            originalArtist: wishSong.originalArtist
          }
        });

        if (existingSong) {
          await this.prisma.singerSong.upsert({
            where: {
              singerId_songId: {
                singerId: authContext.singerId,
                songId: existingSong.id
              }
            },
            update: {},
            create: {
              singerId: authContext.singerId,
              songId: existingSong.id,
              learned: false,
              timesRequested: 0
            }
          });
          newStatus = 'ADDED';
          message = '歌手已接受並加入歌單';
        }
        break;

      case 'rejected':
        newStatus = 'REJECTED';
        message = '歌手已拒絕該願望歌';
        break;

      case 'added':
        // 歌手直接將願望歌加入自己的歌單（如果有權限創建歌曲）
        const createdSong = await this.addWishSongToSongbook(wishSong);
        newStatus = 'ADDED';
        message = '歌手已將願望歌加入歌單';
        break;

      default:
        throw new BadRequestException('無效的操作');
    }

    const updatedWishSong = await this.prisma.wishSong.update({
      where: { id: wishSongId },
      data: { status: newStatus as any },
      include: {
        user: true,
        player: true,
        singer: true
      }
    });

    // TODO: 發送通知給提交者

    return {
      wishSong: updatedWishSong,
      message
    };
  }

  // 刪除願望歌
  async deleteWishSong(authContext: AuthContext, wishSongId: number) {
    const wishSong = await this.prisma.wishSong.findUnique({
      where: { id: wishSongId }
    });

    if (!wishSong) {
      throw new BadRequestException('願望歌不存在');
    }

    // 檢查權限（只能刪除自己提交的，或者是管理員）
    const isOwnWishSong = wishSong.userId === authContext.userId;
    const hasDeletePermission = PermissionService.hasPermission(authContext, ENTITIES.WISH_SONG, ACTIONS.DELETE);

    if (!isOwnWishSong && !hasDeletePermission) {
      throw new ForbiddenException('無權限刪除該願望歌');
    }

    // 已經被審核通過或加入歌庫的不能刪除
    if (wishSong.status === 'ADDED') {
      throw new BadRequestException('已加入歌庫的願望歌無法刪除');
    }

    await this.prisma.wishSong.delete({
      where: { id: wishSongId }
    });

    return { message: '願望歌已刪除' };
  }

  // 獲取願望歌統計
  async getWishSongStats(authContext: AuthContext, singerId?: number) {
    // 檢查權限
    const canViewStats = PermissionService.hasPermission(authContext, ENTITIES.ANALYTICS, ACTIONS.VIEW);
    
    if (!canViewStats && singerId !== authContext.singerId) {
      throw new ForbiddenException('無權限查看統計資訊');
    }

    let whereClause: any = {};
    
    if (singerId) {
      whereClause.singerId = singerId;
    } else if (!canViewStats) {
      // 如果沒有查看全域統計的權限，只能看自己相關的
      whereClause.OR = [
        { userId: authContext.userId },
        { singerId: authContext.singerId }
      ];
    }

    const stats = await this.prisma.wishSong.groupBy({
      by: ['status'],
      where: whereClause,
      _count: {
        id: true
      }
    });

    const totalStats = await this.prisma.wishSong.count({
      where: whereClause
    });

    const recentStats = await this.prisma.wishSong.count({
      where: {
        ...whereClause,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 過去7天
        }
      }
    });

    return {
      total: totalStats,
      recent: recentStats,
      byStatus: stats.reduce((acc, stat) => {
        acc[stat.status] = stat._count.id;
        return acc;
      }, {} as Record<string, number>),
      conversionRate: totalStats > 0 ? 
        ((stats.find(s => s.status === 'ADDED')?._count.id || 0) / totalStats * 100).toFixed(2) + '%' : 
        '0%'
    };
  }

  private getActionDisplayName(action: string): string {
    switch (action) {
      case 'approve': return '通過';
      case 'reject': return '拒絕';
      case 'add_to_songbook': return '加入歌庫';
      default: return '處理';
    }
  }
}