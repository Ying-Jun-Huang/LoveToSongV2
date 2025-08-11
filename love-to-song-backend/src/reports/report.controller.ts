import { 
  Controller, 
  Get, 
  Query,
  Param,
  ParseIntPipe,
  UseGuards, 
  Request,
  Post,
  Body,
  Header,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ReportService, ReportFilters } from './report.service';
import { RBACGuard } from '../auth/rbac-abac.guard';
import { RequirePermission } from '../auth/rbac-abac.decorator';
import { ENTITIES, ACTIONS } from '../auth/rbac-abac.system';
import { Audit, AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from '../audit/audit.decorator';

@Controller('reports')
@UseGuards(AuthGuard('jwt-v2'), RBACGuard)
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  // 活動摘要報表
  @Get('event/:eventId/summary')
  @RequirePermission(ENTITIES.ANALYTICS, ACTIONS.VIEW)
  @Audit({
    action: AUDIT_ACTIONS.DATA_EXPORT,
    entityType: AUDIT_ENTITY_TYPES.EVENT,
    getEntityId: (args) => parseInt(args[1]),
    getDetails: (args) => ({ reportType: 'event_summary' })
  })
  async getEventSummaryReport(
    @Request() req,
    @Param('eventId', ParseIntPipe) eventId: number
  ) {
    return await this.reportService.generateEventSummaryReport(req.user.authContext, eventId);
  }

  // 歌手表現報表
  @Get('singer/:singerId/performance')
  @RequirePermission(ENTITIES.ANALYTICS, ACTIONS.VIEW)
  @Audit({
    action: AUDIT_ACTIONS.DATA_EXPORT,
    entityType: AUDIT_ENTITY_TYPES.SINGER,
    getEntityId: (args) => parseInt(args[1]),
    getDetails: (args) => ({ reportType: 'singer_performance' })
  })
  async getSingerPerformanceReport(
    @Request() req,
    @Param('singerId', ParseIntPipe) singerId: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    const filters: ReportFilters = {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined
    };

    return await this.reportService.generateSingerPerformanceReport(
      req.user.authContext,
      singerId,
      filters
    );
  }

  // 系統概覽報表
  @Get('system/overview')
  @RequirePermission(ENTITIES.ANALYTICS, ACTIONS.VIEW)
  @Audit({
    action: AUDIT_ACTIONS.DATA_EXPORT,
    entityType: AUDIT_ENTITY_TYPES.SYSTEM,
    getDetails: (args) => ({ reportType: 'system_overview' })
  })
  async getSystemOverviewReport(
    @Request() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    const filters: ReportFilters = {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined
    };

    return await this.reportService.generateSystemOverviewReport(req.user.authContext, filters);
  }

  // 數據導出
  @Post('export')
  @RequirePermission(ENTITIES.ANALYTICS, ACTIONS.EXPORT)
  @HttpCode(HttpStatus.OK)
  @Audit({
    action: AUDIT_ACTIONS.DATA_EXPORT,
    entityType: AUDIT_ENTITY_TYPES.SYSTEM,
    getDetails: (args) => ({
      entityType: args[1].entityType,
      format: args[1].format,
      filters: args[1].filters
    }),
    sensitive: true
  })
  async exportData(
    @Request() req,
    @Body() exportDto: {
      entityType: 'events' | 'requests' | 'wishsongs' | 'users' | 'singers';
      format?: 'JSON' | 'CSV';
      filters?: ReportFilters;
    }
  ) {
    const filters: ReportFilters = {
      ...exportDto.filters,
      startDate: exportDto.filters?.startDate ? new Date(exportDto.filters.startDate) : undefined,
      endDate: exportDto.filters?.endDate ? new Date(exportDto.filters.endDate) : undefined
    };

    return await this.reportService.exportData(
      req.user.authContext,
      exportDto.entityType,
      filters,
      exportDto.format || 'JSON'
    );
  }

  // CSV 格式導出（直接下載）
  @Post('export/csv')
  @RequirePermission(ENTITIES.ANALYTICS, ACTIONS.EXPORT)
  @HttpCode(HttpStatus.OK)
  @Header('Content-Type', 'text/csv')
  @Audit({
    action: AUDIT_ACTIONS.DATA_EXPORT,
    entityType: AUDIT_ENTITY_TYPES.SYSTEM,
    getDetails: (args) => ({
      entityType: args[1].entityType,
      format: 'CSV',
      filters: args[1].filters
    }),
    sensitive: true
  })
  async exportDataCSV(
    @Request() req,
    @Body() exportDto: {
      entityType: 'events' | 'requests' | 'wishsongs' | 'users' | 'singers';
      filters?: ReportFilters;
    }
  ) {
    const filters: ReportFilters = {
      ...exportDto.filters,
      startDate: exportDto.filters?.startDate ? new Date(exportDto.filters.startDate) : undefined,
      endDate: exportDto.filters?.endDate ? new Date(exportDto.filters.endDate) : undefined
    };

    const filename = `${exportDto.entityType}_export_${new Date().toISOString().split('T')[0]}.csv`;
    
    // 設置檔案下載 header
    req.res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    return await this.reportService.exportData(
      req.user.authContext,
      exportDto.entityType,
      filters,
      'CSV'
    );
  }

  // 我的統計（任何用戶都可以查看自己的統計）
  @Get('my-stats')
  async getMyStats(@Request() req) {
    const userId = req.user.authContext.userId;
    const singerId = req.user.authContext.singerId;

    const stats: any = {
      userId,
      requests: {
        total: 0,
        completed: 0,
        pending: 0
      }
    };

    // 獲取我的點歌統計
    const [totalRequests, completedRequests, pendingRequests] = await Promise.all([
      req.user.prisma?.request.count({ where: { userId } }) || 0,
      req.user.prisma?.request.count({ where: { userId, status: 'COMPLETED' } }) || 0,
      req.user.prisma?.request.count({ where: { userId, status: { in: ['QUEUED', 'ASSIGNED', 'ACCEPTED'] } } }) || 0
    ]);

    stats.requests = {
      total: totalRequests,
      completed: completedRequests,
      pending: pendingRequests
    };

    // 如果是歌手，獲取歌手統計
    if (singerId) {
      stats.singer = {
        singerId,
        assigned: 0,
        completed: 0
      };

      try {
        const [assignedCount, completedCount] = await Promise.all([
          req.user.prisma?.request.count({ where: { singerId } }) || 0,
          req.user.prisma?.request.count({ where: { singerId, status: 'COMPLETED' } }) || 0
        ]);

        stats.singer.assigned = assignedCount;
        stats.singer.completed = completedCount;
        stats.singer.completionRate = assignedCount > 0 ? Math.round((completedCount / assignedCount) * 100) : 0;
      } catch (error) {
        // 忽略錯誤，繼續返回其他統計
      }
    }

    return stats;
  }

  // 快速統計（儀表板用）
  @Get('dashboard')
  @RequirePermission(ENTITIES.ANALYTICS, ACTIONS.VIEW)
  async getDashboardStats(@Request() req) {
    // 根據用戶角色返回不同的統計數據
    const roles = req.user.authContext.roles;
    
    const stats: any = {
      summary: {},
      recent: {}
    };

    // 基礎統計（所有有權限的用戶都可以看到）
    try {
      const [activeEvents, totalRequests, pendingWishSongs] = await Promise.all([
        req.user.prisma?.event.count({ where: { status: 'ACTIVE' } }) || 0,
        req.user.prisma?.request.count({ where: { status: { in: ['QUEUED', 'ASSIGNED', 'ACCEPTED'] } } }) || 0,
        req.user.prisma?.wishSong.count({ where: { status: 'PENDING' } }) || 0
      ]);

      stats.summary = {
        activeEvents,
        totalRequests,
        pendingWishSongs
      };

      // 管理員可以看到更多統計
      if (roles.includes('SUPER_ADMIN') || roles.includes('HOST_ADMIN')) {
        const [totalUsers, activeSingers] = await Promise.all([
          req.user.prisma?.user.count({ where: { status: 'ACTIVE' } }) || 0,
          req.user.prisma?.singer.count({ where: { isActive: true } }) || 0
        ]);

        stats.summary.totalUsers = totalUsers;
        stats.summary.activeSingers = activeSingers;
      }
    } catch (error) {
      // 返回空統計而不是錯誤
      stats.summary = {
        activeEvents: 0,
        totalRequests: 0,
        pendingWishSongs: 0
      };
    }

    return stats;
  }
}