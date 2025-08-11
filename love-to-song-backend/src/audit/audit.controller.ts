import { 
  Controller, 
  Get, 
  Query, 
  UseGuards, 
  Request, 
  Param, 
  ParseIntPipe,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Header
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuditService, AuditLogFilters } from './audit.service';
import { RBACGuard } from '../auth/rbac-abac.guard';
import { RequirePermission } from '../auth/rbac-abac.decorator';
import { ENTITIES, ACTIONS } from '../auth/rbac-abac.system';
import { Audit, AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from './audit.decorator';

export interface CleanupLogsDto {
  retentionDays: number;
}

export interface ExportLogsDto {
  filters?: AuditLogFilters;
  format?: 'JSON' | 'CSV';
}

@Controller('audit')
@UseGuards(AuthGuard('jwt-v2'), RBACGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  // 獲取稽核日誌列表
  @Get('logs')
  @RequirePermission(ENTITIES.AUDIT_LOG, ACTIONS.VIEW)
  @Audit({
    action: AUDIT_ACTIONS.AUDIT_LOG_EXPORT,
    entityType: AUDIT_ENTITY_TYPES.AUDIT_LOG,
    getDetails: (args) => ({ filters: args[1] })
  })
  async getAuditLogs(
    @Request() req,
    @Query() filters: AuditLogFilters
  ) {
    // 轉換查詢參數類型
    if (filters.userId) filters.userId = parseInt(filters.userId.toString());
    if (filters.entityId) filters.entityId = parseInt(filters.entityId.toString());
    if (filters.limit) filters.limit = parseInt(filters.limit.toString());
    if (filters.offset) filters.offset = parseInt(filters.offset.toString());
    if (filters.startDate) filters.startDate = new Date(filters.startDate);
    if (filters.endDate) filters.endDate = new Date(filters.endDate);

    return await this.auditService.getAuditLogs(req.user.authContext, filters);
  }

  // 獲取特定實體的稽核歷史
  @Get('entity/:entityType/:entityId')
  @RequirePermission(ENTITIES.AUDIT_LOG, ACTIONS.VIEW)
  @Audit({
    action: AUDIT_ACTIONS.AUDIT_LOG_EXPORT,
    entityType: AUDIT_ENTITY_TYPES.AUDIT_LOG,
    getEntityId: (args) => parseInt(args[2]),
    getDetails: (args) => ({ entityType: args[1], entityId: args[2] })
  })
  async getEntityAuditHistory(
    @Request() req,
    @Param('entityType') entityType: string,
    @Param('entityId', ParseIntPipe) entityId: number,
    @Query('limit') limit?: number
  ) {
    return await this.auditService.getEntityAuditHistory(
      req.user.authContext,
      entityType,
      entityId,
      limit
    );
  }

  // 獲取用戶活動統計
  @Get('stats/user/:userId?')
  @RequirePermission(ENTITIES.ANALYTICS, ACTIONS.VIEW)
  @Audit({
    action: AUDIT_ACTIONS.AUDIT_LOG_EXPORT,
    entityType: AUDIT_ENTITY_TYPES.USER,
    getEntityId: (args) => args[1] ? parseInt(args[1]) : undefined,
    getDetails: (args) => ({ 
      targetUserId: args[1],
      days: args[2]
    })
  })
  async getUserActivityStats(
    @Request() req,
    @Param('userId') userId?: string,
    @Query('days') days?: number
  ) {
    const targetUserId = userId ? parseInt(userId) : undefined;
    const statsDays = days ? parseInt(days.toString()) : 30;
    
    return await this.auditService.getUserActivityStats(
      req.user.authContext,
      targetUserId,
      statsDays
    );
  }

  // 獲取系統稽核統計
  @Get('stats/system')
  @RequirePermission(ENTITIES.ANALYTICS, ACTIONS.VIEW)
  @Audit({
    action: AUDIT_ACTIONS.AUDIT_LOG_EXPORT,
    entityType: AUDIT_ENTITY_TYPES.SYSTEM,
    getDetails: (args) => ({ days: args[1] })
  })
  async getSystemAuditStats(
    @Request() req,
    @Query('days') days?: number
  ) {
    const statsDays = days ? parseInt(days.toString()) : 30;
    return await this.auditService.getSystemAuditStats(
      req.user.authContext,
      statsDays
    );
  }

  // 清理舊的稽核日誌
  @Post('cleanup')
  @RequirePermission(ENTITIES.AUDIT_LOG, ACTIONS.DELETE)
  @HttpCode(HttpStatus.OK)
  @Audit({
    action: AUDIT_ACTIONS.AUDIT_LOG_CLEANUP,
    entityType: AUDIT_ENTITY_TYPES.AUDIT_LOG,
    getDetails: (args) => ({ retentionDays: args[1].retentionDays }),
    sensitive: true
  })
  async cleanupOldLogs(
    @Request() req,
    @Body() cleanupDto: CleanupLogsDto
  ) {
    return await this.auditService.cleanupOldLogs(
      req.user.authContext,
      cleanupDto.retentionDays
    );
  }

  // 導出稽核日誌
  @Post('export')
  @RequirePermission(ENTITIES.AUDIT_LOG, ACTIONS.EXPORT)
  @HttpCode(HttpStatus.OK)
  @Audit({
    action: AUDIT_ACTIONS.DATA_EXPORT,
    entityType: AUDIT_ENTITY_TYPES.AUDIT_LOG,
    getDetails: (args) => ({ 
      filters: args[1].filters,
      format: args[1].format
    }),
    sensitive: true
  })
  async exportAuditLogs(
    @Request() req,
    @Body() exportDto: ExportLogsDto
  ) {
    const result = await this.auditService.exportAuditLogs(
      req.user.authContext,
      exportDto.filters || {},
      exportDto.format || 'JSON'
    );

    return result;
  }

  // 導出 CSV 格式的稽核日誌（直接下載）
  @Post('export/csv')
  @RequirePermission(ENTITIES.AUDIT_LOG, ACTIONS.EXPORT)
  @HttpCode(HttpStatus.OK)
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="audit_logs.csv"')
  @Audit({
    action: AUDIT_ACTIONS.DATA_EXPORT,
    entityType: AUDIT_ENTITY_TYPES.AUDIT_LOG,
    getDetails: (args) => ({ 
      filters: args[1].filters,
      format: 'CSV'
    }),
    sensitive: true
  })
  async exportAuditLogsCSV(
    @Request() req,
    @Body() exportDto: { filters?: AuditLogFilters }
  ) {
    const result = await this.auditService.exportAuditLogs(
      req.user.authContext,
      exportDto.filters || {},
      'CSV'
    );

    return result;
  }

  // 獲取我的操作歷史
  @Get('my-activity')
  async getMyActivity(
    @Request() req,
    @Query() filters: AuditLogFilters
  ) {
    // 限制只能查看自己的活動
    const myFilters = {
      ...filters,
      userId: req.user.authContext.userId
    };

    // 轉換查詢參數類型
    if (myFilters.entityId) myFilters.entityId = parseInt(myFilters.entityId.toString());
    if (myFilters.limit) myFilters.limit = parseInt(myFilters.limit.toString());
    if (myFilters.offset) myFilters.offset = parseInt(myFilters.offset.toString());
    if (myFilters.startDate) myFilters.startDate = new Date(myFilters.startDate);
    if (myFilters.endDate) myFilters.endDate = new Date(myFilters.endDate);

    return await this.auditService.getAuditLogs(req.user.authContext, myFilters);
  }

  // 獲取我的活動統計
  @Get('my-stats')
  async getMyActivityStats(
    @Request() req,
    @Query('days') days?: number
  ) {
    const statsDays = days ? parseInt(days.toString()) : 30;
    return await this.auditService.getUserActivityStats(
      req.user.authContext,
      req.user.authContext.userId,
      statsDays
    );
  }
}