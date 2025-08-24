import { 
  Controller, 
  Get, 
  Post, 
  Put,
  Delete,
  Body, 
  Param, 
  Query,
  ParseIntPipe,
  UseGuards, 
  Request 
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { 
  QueueService, 
  CreateRequestDto, 
  AssignRequestDto, 
  ReorderRequestDto,
  UpdateRequestStatusDto
} from './queue.service';
import { RBACGuard } from '../auth/rbac-abac.guard';
import { RequirePermission } from '../auth/rbac-abac.decorator';
import { ENTITIES, ACTIONS } from '../auth/rbac-abac.system';
import { Audit, AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from '../audit/audit.decorator';

@Controller('queue')
@UseGuards(AuthGuard('jwt-v2'), RBACGuard)
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  // 創建點歌請求
  @Post('request')
  @RequirePermission(ENTITIES.REQUEST, ACTIONS.CREATE)
  @Audit({
    action: AUDIT_ACTIONS.REQUEST_CREATE,
    entityType: AUDIT_ENTITY_TYPES.REQUEST,
    getEntityId: (args, result) => result?.id,
    getDetails: (args) => ({
      eventId: args[1].eventId,
      songId: args[1].songId,
      playerId: args[1].playerId,
      desiredTime: args[1].desiredTime
    })
  })
  async createRequest(@Request() req, @Body() createRequestDto: CreateRequestDto) {
    return await this.queueService.createRequest(req.user.authContext, createRequestDto);
  }

  // 獲取活動的點歌隊列
  @Get('event/:eventId')
  async getEventQueue(
    @Request() req,
    @Param('eventId', ParseIntPipe) eventId: number
  ) {
    return await this.queueService.getEventQueue(req.user.authContext, eventId);
  }

  // 指派歌手
  @Post('assign')
  @RequirePermission(ENTITIES.REQUEST, ACTIONS.ASSIGN)
  @Audit({
    action: AUDIT_ACTIONS.REQUEST_ASSIGN,
    entityType: AUDIT_ENTITY_TYPES.REQUEST,
    getEntityId: (args) => args[1].requestId,
    getDetails: (args) => ({
      requestId: args[1].requestId,
      singerId: args[1].singerId,
      reason: args[1].reason
    })
  })
  async assignSinger(@Request() req, @Body() assignRequestDto: AssignRequestDto) {
    return await this.queueService.assignSinger(req.user.authContext, assignRequestDto);
  }

  // 重新排序隊列
  @Post('reorder')
  @RequirePermission(ENTITIES.REQUEST, ACTIONS.REORDER)
  @Audit({
    action: AUDIT_ACTIONS.REQUEST_REORDER,
    entityType: AUDIT_ENTITY_TYPES.REQUEST,
    getEntityId: (args) => args[1].requestId,
    getDetails: (args) => ({
      requestId: args[1].requestId,
      newPosition: args[1].newPosition,
      reason: args[1].reason
    })
  })
  async reorderQueue(@Request() req, @Body() reorderRequestDto: ReorderRequestDto) {
    return await this.queueService.reorderQueue(req.user.authContext, reorderRequestDto);
  }

  // 更新請求狀態
  @Put('request/:id/status')
  @Audit({
    action: AUDIT_ACTIONS.REQUEST_UPDATE_STATUS,
    entityType: AUDIT_ENTITY_TYPES.REQUEST,
    getEntityId: (args) => parseInt(args[1]),
    getDetails: (args) => ({
      requestId: parseInt(args[1]),
      status: args[2].status,
      reason: args[2].reason
    })
  })
  async updateRequestStatus(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStatusDto: Omit<UpdateRequestStatusDto, 'requestId'>
  ) {
    const fullDto: UpdateRequestStatusDto = {
      requestId: id,
      ...updateStatusDto
    };
    return await this.queueService.updateRequestStatus(req.user.authContext, fullDto);
  }

  // 取消點歌請求
  @Delete('request/:id')
  @Audit({
    action: AUDIT_ACTIONS.REQUEST_CANCEL,
    entityType: AUDIT_ENTITY_TYPES.REQUEST,
    getEntityId: (args) => parseInt(args[1]),
    getDetails: (args) => ({
      requestId: parseInt(args[1]),
      reason: args[2]?.reason
    })
  })
  async cancelRequest(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() body?: { reason?: string }
  ) {
    return await this.queueService.cancelRequest(req.user.authContext, id, body?.reason);
  }

  // 獲取當前用戶的點歌歷史
  @Get('history')
  async getCurrentUserRequestHistory(@Request() req) {
    return await this.queueService.getUserRequestHistory(req.user.authContext);
  }

  // 獲取指定用戶的點歌歷史
  @Get('history/:userId')
  async getUserRequestHistory(
    @Request() req,
    @Param('userId') userId: string
  ) {
    const targetUserId = parseInt(userId);
    return await this.queueService.getUserRequestHistory(req.user.authContext, targetUserId);
  }

  // 我的點歌歷史
  @Get('my-history')
  async getMyRequestHistory(@Request() req) {
    return await this.queueService.getUserRequestHistory(req.user.authContext);
  }
}