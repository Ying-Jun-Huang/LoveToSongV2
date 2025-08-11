import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthContext, PermissionService, ENTITIES, ACTIONS } from '../auth/rbac-abac.system';

export interface ReportFilters {
  startDate?: Date;
  endDate?: Date;
  eventId?: number;
  singerId?: number;
  userId?: number;
}

export interface EventSummaryReport {
  event: {
    id: number;
    title: string;
    startsAt: Date;
    endsAt: Date;
    venue?: string;
    host: { id: number; displayName: string };
  };
  stats: {
    totalRequests: number;
    completedRequests: number;
    cancelledRequests: number;
    participatingSingers: number;
    uniqueRequesters: number;
    averageWaitTime: number;
  };
  topSongs: Array<{
    songTitle: string;
    originalArtist: string;
    requestCount: number;
  }>;
  singerPerformance: Array<{
    singerName: string;
    completedSongs: number;
    totalAssigned: number;
    completionRate: number;
  }>;
}

export interface SingerPerformanceReport {
  singer: {
    id: number;
    stageName: string;
    bio?: string;
  };
  stats: {
    totalEvents: number;
    totalAssigned: number;
    totalCompleted: number;
    completionRate: number;
    averageRating: number;
    popularSongs: Array<{
      songTitle: string;
      requestCount: number;
    }>;
  };
  recentActivity: Array<{
    eventTitle: string;
    date: Date;
    completedSongs: number;
  }>;
}

export interface SystemOverviewReport {
  summary: {
    totalUsers: number;
    activeSingers: number;
    totalEvents: number;
    totalRequests: number;
    totalWishSongs: number;
    activeEvents: number;
  };
  trends: {
    dailyRequests: Record<string, number>;
    topSongs: Array<{
      title: string;
      requestCount: number;
    }>;
    topSingers: Array<{
      name: string;
      completedSongs: number;
    }>;
  };
  userActivity: {
    newUsersThisMonth: number;
    activeUsersThisWeek: number;
    topRequesters: Array<{
      name: string;
      requestCount: number;
    }>;
  };
}

@Injectable()
export class ReportService {
  constructor(private prisma: PrismaService) {}

  // 生成活動摘要報表
  async generateEventSummaryReport(
    authContext: AuthContext,
    eventId: number
  ): Promise<EventSummaryReport> {
    // 檢查權限
    const resource = { eventId };
    if (!PermissionService.hasPermission(authContext, ENTITIES.ANALYTICS, ACTIONS.VIEW, resource)) {
      throw new ForbiddenException('無權限查看該活動的報表');
    }

    // 獲取活動基本資訊
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        host: {
          select: { id: true, displayName: true }
        }
      }
    });

    if (!event) {
      throw new Error('活動不存在');
    }

    // 獲取統計數據
    const [
      totalRequests,
      completedRequests,
      cancelledRequests,
      participatingSingers,
      requests
    ] = await Promise.all([
      // 總點歌數
      this.prisma.request.count({
        where: { eventId }
      }),

      // 完成的點歌數
      this.prisma.request.count({
        where: { eventId, status: 'COMPLETED' }
      }),

      // 取消的點歌數
      this.prisma.request.count({
        where: { eventId, status: 'CANCELLED' }
      }),

      // 參與的歌手數
      this.prisma.eventSinger.count({
        where: { eventId }
      }),

      // 所有點歌請求
      this.prisma.request.findMany({
        where: { eventId },
        include: {
          song: true,
          user: true,
          singer: true
        }
      })
    ]);

    // 計算獨特點歌人數
    const uniqueRequesters = new Set(requests.map(r => r.userId)).size;

    // 計算平均等待時間
    const completedRequestsData = requests.filter(r => r.status === 'COMPLETED' && r.completedAt);
    const totalWaitTime = completedRequestsData.reduce((sum, r) => {
      const waitTime = r.completedAt!.getTime() - r.createdAt.getTime();
      return sum + waitTime;
    }, 0);
    const averageWaitTime = completedRequestsData.length > 0 
      ? Math.round(totalWaitTime / completedRequestsData.length / 1000 / 60) // 轉換為分鐘
      : 0;

    // 熱門歌曲
    const songCounts = requests.reduce((acc, r) => {
      const key = `${r.song.title}|${r.song.originalArtist}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topSongs = Object.entries(songCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([songInfo, count]) => {
        const [title, artist] = songInfo.split('|');
        return {
          songTitle: title,
          originalArtist: artist,
          requestCount: count
        };
      });

    // 歌手表現
    const singerStats = requests.reduce((acc, r) => {
      if (r.singer) {
        const singerId = r.singer.id;
        if (!acc[singerId]) {
          acc[singerId] = {
            name: r.singer.stageName,
            assigned: 0,
            completed: 0
          };
        }
        acc[singerId].assigned++;
        if (r.status === 'COMPLETED') {
          acc[singerId].completed++;
        }
      }
      return acc;
    }, {} as Record<number, { name: string; assigned: number; completed: number }>);

    const singerPerformance = Object.values(singerStats).map(stat => ({
      singerName: stat.name,
      completedSongs: stat.completed,
      totalAssigned: stat.assigned,
      completionRate: stat.assigned > 0 ? Math.round((stat.completed / stat.assigned) * 100) : 0
    }));

    return {
      event: {
        id: event.id,
        title: event.title,
        startsAt: event.startsAt,
        endsAt: event.endsAt,
        venue: event.venue,
        host: event.host
      },
      stats: {
        totalRequests,
        completedRequests,
        cancelledRequests,
        participatingSingers,
        uniqueRequesters,
        averageWaitTime
      },
      topSongs,
      singerPerformance
    };
  }

  // 生成歌手表現報表
  async generateSingerPerformanceReport(
    authContext: AuthContext,
    singerId: number,
    filters: ReportFilters = {}
  ): Promise<SingerPerformanceReport> {
    // 檢查權限
    const resource = { singerId };
    if (!PermissionService.hasPermission(authContext, ENTITIES.ANALYTICS, ACTIONS.VIEW, resource)) {
      throw new ForbiddenException('無權限查看該歌手的報表');
    }

    // 獲取歌手基本資訊
    const singer = await this.prisma.singer.findUnique({
      where: { id: singerId }
    });

    if (!singer) {
      throw new Error('歌手不存在');
    }

    let whereClause: any = { singerId };

    // 應用時間篩選
    if (filters.startDate || filters.endDate) {
      whereClause.createdAt = {};
      if (filters.startDate) {
        whereClause.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        whereClause.createdAt.lte = filters.endDate;
      }
    }

    // 獲取統計數據
    const [
      totalEvents,
      totalAssigned,
      totalCompleted,
      requests,
      recentEvents
    ] = await Promise.all([
      // 參與的活動數
      this.prisma.eventSinger.count({
        where: { singerId }
      }),

      // 總指派數
      this.prisma.request.count({
        where: whereClause
      }),

      // 總完成數
      this.prisma.request.count({
        where: { ...whereClause, status: 'COMPLETED' }
      }),

      // 所有相關請求
      this.prisma.request.findMany({
        where: whereClause,
        include: {
          song: true,
          event: true
        }
      }),

      // 最近的活動
      this.prisma.eventSinger.findMany({
        where: { singerId },
        include: {
          event: {
            select: { id: true, title: true, startsAt: true }
          }
        },
        orderBy: {
          event: { startsAt: 'desc' }
        },
        take: 5
      })
    ]);

    // 計算完成率
    const completionRate = totalAssigned > 0 ? Math.round((totalCompleted / totalAssigned) * 100) : 0;

    // 熱門歌曲
    const songCounts = requests.reduce((acc, r) => {
      const title = r.song.title;
      acc[title] = (acc[title] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const popularSongs = Object.entries(songCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([title, count]) => ({
        songTitle: title,
        requestCount: count
      }));

    // 最近活動表現
    const recentActivity = await Promise.all(
      recentEvents.map(async (es) => {
        const completedInEvent = await this.prisma.request.count({
          where: {
            eventId: es.event.id,
            singerId,
            status: 'COMPLETED'
          }
        });

        return {
          eventTitle: es.event.title,
          date: es.event.startsAt,
          completedSongs: completedInEvent
        };
      })
    );

    return {
      singer: {
        id: singer.id,
        stageName: singer.stageName,
        bio: singer.bio
      },
      stats: {
        totalEvents,
        totalAssigned,
        totalCompleted,
        completionRate,
        averageRating: 0, // TODO: 實作評分系統後更新
        popularSongs
      },
      recentActivity
    };
  }

  // 生成系統概覽報表
  async generateSystemOverviewReport(
    authContext: AuthContext,
    filters: ReportFilters = {}
  ): Promise<SystemOverviewReport> {
    // 檢查權限
    if (!PermissionService.hasPermission(authContext, ENTITIES.ANALYTICS, ACTIONS.VIEW)) {
      throw new ForbiddenException('無權限查看系統報表');
    }

    const endDate = filters.endDate || new Date();
    const startDate = filters.startDate || new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000); // 預設30天

    // 獲取摘要統計
    const [
      totalUsers,
      activeSingers,
      totalEvents,
      totalRequests,
      totalWishSongs,
      activeEvents
    ] = await Promise.all([
      this.prisma.user.count({ where: { status: 'ACTIVE' } }),
      this.prisma.singer.count({ where: { isActive: true } }),
      this.prisma.event.count(),
      this.prisma.request.count(),
      this.prisma.wishSong.count(),
      this.prisma.event.count({ where: { status: 'ACTIVE' } })
    ]);

    // 每日點歌趨勢
    const dailyRequests = await this.prisma.request.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      _count: { id: true }
    });

    const dailyRequestsMap = dailyRequests.reduce((acc, item) => {
      const date = item.createdAt.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + item._count.id;
      return acc;
    }, {} as Record<string, number>);

    // 熱門歌曲
    const topSongsData = await this.prisma.request.groupBy({
      by: ['songId'],
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10
    });

    const songIds = topSongsData.map(item => item.songId);
    const songs = await this.prisma.song.findMany({
      where: { id: { in: songIds } }
    });

    const topSongs = topSongsData.map(item => {
      const song = songs.find(s => s.id === item.songId);
      return {
        title: song?.title || 'Unknown',
        requestCount: item._count.id
      };
    });

    // 熱門歌手
    const topSingersData = await this.prisma.request.groupBy({
      by: ['singerId'],
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10
    });

    const singerIds = topSingersData.map(item => item.singerId).filter(Boolean) as number[];
    const singers = await this.prisma.singer.findMany({
      where: { id: { in: singerIds } }
    });

    const topSingers = topSingersData
      .filter(item => item.singerId)
      .map(item => {
        const singer = singers.find(s => s.id === item.singerId);
        return {
          name: singer?.stageName || 'Unknown',
          completedSongs: item._count.id
        };
      });

    // 用戶活動統計
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const thisWeek = new Date();
    thisWeek.setDate(thisWeek.getDate() - 7);

    const [newUsersThisMonth, activeUsersThisWeek, topRequestersData] = await Promise.all([
      this.prisma.user.count({
        where: {
          createdAt: { gte: thisMonth }
        }
      }),
      
      this.prisma.user.count({
        where: {
          lastLoginAt: { gte: thisWeek }
        }
      }),
      
      this.prisma.request.groupBy({
        by: ['userId'],
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10
      })
    ]);

    const requesterIds = topRequestersData.map(item => item.userId);
    const requesters = await this.prisma.user.findMany({
      where: { id: { in: requesterIds } },
      select: { id: true, displayName: true }
    });

    const topRequesters = topRequestersData.map(item => {
      const user = requesters.find(u => u.id === item.userId);
      return {
        name: user?.displayName || 'Unknown',
        requestCount: item._count.id
      };
    });

    return {
      summary: {
        totalUsers,
        activeSingers,
        totalEvents,
        totalRequests,
        totalWishSongs,
        activeEvents
      },
      trends: {
        dailyRequests: dailyRequestsMap,
        topSongs,
        topSingers
      },
      userActivity: {
        newUsersThisMonth,
        activeUsersThisWeek,
        topRequesters
      }
    };
  }

  // 生成數據導出報表
  async exportData(
    authContext: AuthContext,
    entityType: 'events' | 'requests' | 'wishsongs' | 'users' | 'singers',
    filters: ReportFilters = {},
    format: 'JSON' | 'CSV' = 'JSON'
  ) {
    // 檢查權限
    if (!PermissionService.hasPermission(authContext, ENTITIES.ANALYTICS, ACTIONS.EXPORT)) {
      throw new ForbiddenException('無權限導出數據');
    }

    let data: any[] = [];
    let whereClause: any = {};

    // 應用時間篩選
    if (filters.startDate || filters.endDate) {
      whereClause.createdAt = {};
      if (filters.startDate) {
        whereClause.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        whereClause.createdAt.lte = filters.endDate;
      }
    }

    switch (entityType) {
      case 'events':
        data = await this.prisma.event.findMany({
          where: whereClause,
          include: {
            host: { select: { displayName: true } },
            _count: {
              select: { requests: true, eventSingers: true }
            }
          }
        });
        break;

      case 'requests':
        data = await this.prisma.request.findMany({
          where: whereClause,
          include: {
            song: { select: { title: true, originalArtist: true } },
            singer: { select: { stageName: true } },
            user: { select: { displayName: true } },
            event: { select: { title: true } }
          }
        });
        break;

      case 'wishsongs':
        data = await this.prisma.wishSong.findMany({
          where: whereClause,
          include: {
            user: { select: { displayName: true } },
            singer: { select: { stageName: true } }
          }
        });
        break;

      case 'users':
        data = await this.prisma.user.findMany({
          where: whereClause,
          select: {
            id: true,
            email: true,
            displayName: true,
            status: true,
            createdAt: true,
            lastLoginAt: true,
            roles: { select: { role: true } }
          }
        });
        break;

      case 'singers':
        data = await this.prisma.singer.findMany({
          where: whereClause,
          include: {
            user: { select: { displayName: true } },
            _count: {
              select: { 
                singerSongs: true,
                requests: true,
                eventSingers: true
              }
            }
          }
        });
        break;

      default:
        throw new Error('不支援的數據類型');
    }

    if (format === 'CSV') {
      return this.convertToCSV(data, entityType);
    }

    return {
      entityType,
      totalRecords: data.length,
      filters,
      exportedAt: new Date(),
      data
    };
  }

  // 轉換為 CSV 格式
  private convertToCSV(data: any[], entityType: string): string {
    if (data.length === 0) {
      return `No ${entityType} data found`;
    }

    const headers = this.getCSVHeaders(entityType);
    const csvRows = [headers.join(',')];

    data.forEach(item => {
      const row = this.formatCSVRow(item, entityType);
      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
  }

  private getCSVHeaders(entityType: string): string[] {
    switch (entityType) {
      case 'events':
        return ['ID', 'Title', 'Host', 'Venue', 'Starts At', 'Ends At', 'Status', 'Total Requests', 'Total Singers'];
      case 'requests':
        return ['ID', 'Song Title', 'Artist', 'Singer', 'Requester', 'Event', 'Status', 'Created At', 'Completed At'];
      case 'wishsongs':
        return ['ID', 'Title', 'Original Artist', 'Submitter', 'Singer', 'Status', 'Created At'];
      case 'users':
        return ['ID', 'Email', 'Display Name', 'Status', 'Roles', 'Created At', 'Last Login'];
      case 'singers':
        return ['ID', 'Stage Name', 'User', 'Bio', 'Is Active', 'Total Songs', 'Total Requests', 'Total Events'];
      default:
        return ['Data'];
    }
  }

  private formatCSVRow(item: any, entityType: string): string[] {
    const escapeField = (field: any) => {
      const str = String(field || '').replace(/"/g, '""');
      return `"${str}"`;
    };

    switch (entityType) {
      case 'events':
        return [
          item.id,
          item.title,
          item.host?.displayName || '',
          item.venue || '',
          item.startsAt?.toISOString() || '',
          item.endsAt?.toISOString() || '',
          item.status,
          item._count?.requests || 0,
          item._count?.eventSingers || 0
        ].map(escapeField);

      case 'requests':
        return [
          item.id,
          item.song?.title || '',
          item.song?.originalArtist || '',
          item.singer?.stageName || '',
          item.user?.displayName || '',
          item.event?.title || '',
          item.status,
          item.createdAt?.toISOString() || '',
          item.completedAt?.toISOString() || ''
        ].map(escapeField);

      case 'wishsongs':
        return [
          item.id,
          item.title,
          item.originalArtist || '',
          item.user?.displayName || '',
          item.singer?.stageName || '',
          item.status,
          item.createdAt?.toISOString() || ''
        ].map(escapeField);

      case 'users':
        return [
          item.id,
          item.email,
          item.displayName,
          item.status,
          item.roles?.map((r: any) => r.role).join(';') || '',
          item.createdAt?.toISOString() || '',
          item.lastLoginAt?.toISOString() || ''
        ].map(escapeField);

      case 'singers':
        return [
          item.id,
          item.stageName,
          item.user?.displayName || '',
          item.bio || '',
          item.isActive,
          item._count?.singerSongs || 0,
          item._count?.requests || 0,
          item._count?.eventSingers || 0
        ].map(escapeField);

      default:
        return [JSON.stringify(item)].map(escapeField);
    }
  }
}