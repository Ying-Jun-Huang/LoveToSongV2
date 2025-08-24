import { 
  Controller, 
  Get, 
  Post, 
  Put,
  Delete,
  Body, 
  Query,
  Param,
  ParseIntPipe,
  UseGuards, 
  Request 
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { 
  NotificationService, 
  NotificationFilters,
  BroadcastNotificationDto
} from './notification.service';
import { RBACGuard } from '../auth/rbac-abac.guard';
import { RequirePermission } from '../auth/rbac-abac.decorator';
import { ENTITIES, ACTIONS } from '../auth/rbac-abac.system';
import { Audit, AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from '../audit/audit.decorator';

@Controller('notifications')
@UseGuards(AuthGuard('jwt-v2'), RBACGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  // 獲取我的通知
  @Get('my')
  async getMyNotifications(
    @Request() req,
    @Query('type') type?: string,
    @Query('isRead') isRead?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number
  ) {
    const filters: NotificationFilters = {
      type,
      isRead: isRead ? isRead === 'true' : undefined,
      limit: limit ? parseInt(limit.toString()) : undefined,
      offset: offset ? parseInt(offset.toString()) : undefined
    };

    return await this.notificationService.getUserNotifications(req.user.authContext, filters);
  }

  // 獲取指定用戶的通知（管理員功能）
  @Get('user/:userId')
  @RequirePermission(ENTITIES.NOTIFICATION, ACTIONS.VIEW)
  async getUserNotifications(
    @Request() req,
    @Param('userId', ParseIntPipe) userId: number,
    @Query('type') type?: string,
    @Query('isRead') isRead?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number
  ) {
    const filters: NotificationFilters = {
      userId,
      type,
      isRead: isRead ? isRead === 'true' : undefined,
      limit: limit ? parseInt(limit.toString()) : undefined,
      offset: offset ? parseInt(offset.toString()) : undefined
    };

    return await this.notificationService.getUserNotifications(req.user.authContext, filters);
  }

  // 標記通知為已讀
  @Put('read')
  async markAsRead(
    @Request() req,
    @Body() body: { notificationIds: number[] }
  ) {
    return await this.notificationService.markAsRead(req.user.authContext, body.notificationIds);
  }

  // 標記所有通知為已讀
  @Put('read-all')
  async markAllAsRead(@Request() req) {
    return await this.notificationService.markAllAsRead(req.user.authContext);
  }

  // 刪除通知
  @Delete()
  async deleteNotifications(
    @Request() req,
    @Body() body: { notificationIds: number[] }
  ) {
    return await this.notificationService.deleteNotifications(req.user.authContext, body.notificationIds);
  }

  // 廣播通知（管理員功能）
  @Post('broadcast')
  @RequirePermission(ENTITIES.NOTIFICATION, ACTIONS.BROADCAST)
  @Audit({
    action: AUDIT_ACTIONS.SYSTEM_BACKUP, // 使用適當的動作
    entityType: AUDIT_ENTITY_TYPES.SYSTEM,
    getDetails: (args) => ({
      title: args[1].title,
      targetRoles: args[1].targetRoles,
      targetUserIds: args[1].targetUserIds,
      type: args[1].type
    }),
    sensitive: true
  })
  async broadcastNotification(
    @Request() req,
    @Body() broadcastDto: BroadcastNotificationDto
  ) {
    return await this.notificationService.broadcastNotification(req.user.authContext, broadcastDto);
  }

  // 清理過期通知（管理員功能）
  @Post('cleanup')
  @RequirePermission(ENTITIES.NOTIFICATION, ACTIONS.DELETE)
  @Audit({
    action: AUDIT_ACTIONS.AUDIT_LOG_CLEANUP,
    entityType: AUDIT_ENTITY_TYPES.SYSTEM
  })
  async cleanupExpiredNotifications(@Request() req) {
    return await this.notificationService.cleanupExpiredNotifications(req.user.authContext);
  }

  // 獲取我的通知統計
  @Get('my-stats')
  async getMyNotificationStats(@Request() req) {
    return await this.notificationService.getNotificationStats(req.user.authContext);
  }

  // 獲取指定用戶的通知統計（管理員功能）
  @Get('stats/:userId')
  @RequirePermission(ENTITIES.ANALYTICS, ACTIONS.VIEW)
  async getUserNotificationStats(
    @Request() req,
    @Param('userId', ParseIntPipe) userId: number
  ) {
    return await this.notificationService.getNotificationStats(req.user.authContext, userId);
  }

  // 獲取未讀通知數量
  @Get('unread-count')
  async getUnreadCount(@Request() req) {
    const result = await this.notificationService.getUserNotifications(req.user.authContext, {
      isRead: false,
      limit: 1
    });
    
    return {
      unreadCount: result.unreadCount
    };
  }

  // 獲取最新通知
  @Get('recent')
  async getRecentNotifications(
    @Request() req,
    @Query('limit') limit?: number
  ) {
    const filters: NotificationFilters = {
      limit: limit ? Math.min(parseInt(limit.toString()), 20) : 10,
      offset: 0
    };

    return await this.notificationService.getUserNotifications(req.user.authContext, filters);
  }

  // 測試通知（開發用）
  @Post('test')
  @RequirePermission(ENTITIES.NOTIFICATION, ACTIONS.CREATE)
  async sendTestNotification(@Request() req) {
    return await this.notificationService.createNotification({
      userId: req.user.authContext.userId,
      title: '測試通知',
      content: '這是一條測試通知，用於驗證通知系統是否正常工作。',
      type: 'SYSTEM'
    });
  }
}