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
import { EventsService, CreateEventDto, UpdateEventDto, AssignSingersDto } from './events.service';
import { RBACGuard } from '../auth/rbac-abac.guard';
import { RequirePermission } from '../auth/rbac-abac.decorator';
import { ENTITIES, ACTIONS } from '../auth/rbac-abac.system';
import { Audit, AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from '../audit/audit.decorator';

@Controller('events')
@UseGuards(AuthGuard('jwt-v2'), RBACGuard)
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  // 創建活動
  @Post()
  @RequirePermission(ENTITIES.EVENT, ACTIONS.CREATE)
  @Audit({
    action: AUDIT_ACTIONS.EVENT_CREATE,
    entityType: AUDIT_ENTITY_TYPES.EVENT,
    getEntityId: (args, result) => result?.id,
    getDetails: (args) => ({
      title: args[1].title,
      venue: args[1].venue,
      startsAt: args[1].startsAt,
      endsAt: args[1].endsAt
    })
  })
  async createEvent(@Request() req, @Body() createEventDto: CreateEventDto) {
    return await this.eventsService.createEvent(req.user.authContext, createEventDto);
  }

  // 獲取活動列表
  @Get()
  async getEvents(
    @Request() req,
    @Query('status') status?: string,
    @Query('hostUserId') hostUserId?: number,
    @Query('singerId') singerId?: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    const filters = {
      status,
      hostUserId: hostUserId ? parseInt(hostUserId.toString()) : undefined,
      singerId: singerId ? parseInt(singerId.toString()) : undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined
    };

    return await this.eventsService.getEvents(req.user.authContext, filters);
  }

  // 獲取單個活動詳情
  @Get(':id')
  async getEvent(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return await this.eventsService.getEvent(req.user.authContext, id);
  }

  // 更新活動
  @Put(':id')
  @RequirePermission(ENTITIES.EVENT, ACTIONS.UPDATE)
  @Audit({
    action: AUDIT_ACTIONS.EVENT_UPDATE,
    entityType: AUDIT_ENTITY_TYPES.EVENT,
    getEntityId: (args) => parseInt(args[1]),
    getDetails: (args) => args[2]
  })
  async updateEvent(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEventDto: UpdateEventDto
  ) {
    return await this.eventsService.updateEvent(req.user.authContext, id, updateEventDto);
  }

  // 刪除活動
  @Delete(':id')
  @RequirePermission(ENTITIES.EVENT, ACTIONS.DELETE)
  @Audit({
    action: AUDIT_ACTIONS.EVENT_DELETE,
    entityType: AUDIT_ENTITY_TYPES.EVENT,
    getEntityId: (args) => parseInt(args[1])
  })
  async deleteEvent(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return await this.eventsService.deleteEvent(req.user.authContext, id);
  }

  // 開始活動
  @Post(':id/start')
  @Audit({
    action: AUDIT_ACTIONS.EVENT_START,
    entityType: AUDIT_ENTITY_TYPES.EVENT,
    getEntityId: (args) => parseInt(args[1])
  })
  async startEvent(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return await this.eventsService.startEvent(req.user.authContext, id);
  }

  // 結束活動
  @Post(':id/end')
  @Audit({
    action: AUDIT_ACTIONS.EVENT_END,
    entityType: AUDIT_ENTITY_TYPES.EVENT,
    getEntityId: (args) => parseInt(args[1])
  })
  async endEvent(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return await this.eventsService.endEvent(req.user.authContext, id);
  }

  // 管理活動歌手
  @Post('assign-singers')
  @RequirePermission(ENTITIES.EVENT, ACTIONS.ASSIGN)
  @Audit({
    action: AUDIT_ACTIONS.EVENT_ASSIGN_SINGER,
    entityType: AUDIT_ENTITY_TYPES.EVENT,
    getEntityId: (args) => args[1].eventId,
    getDetails: (args) => ({
      eventId: args[1].eventId,
      singerIds: args[1].singerIds
    })
  })
  async assignSingers(@Request() req, @Body() assignSingersDto: AssignSingersDto) {
    return await this.eventsService.manageEventSingers(req.user.authContext, assignSingersDto);
  }

  // 獲取活動統計
  @Get('stats/:id?')
  @RequirePermission(ENTITIES.ANALYTICS, ACTIONS.VIEW)
  async getEventStats(
    @Request() req,
    @Param('id') id?: string
  ) {
    const eventId = id ? parseInt(id) : undefined;
    return await this.eventsService.getEventStats(req.user.authContext, eventId);
  }

  // 複製活動
  @Post(':id/duplicate')
  @RequirePermission(ENTITIES.EVENT, ACTIONS.CREATE)
  @Audit({
    action: AUDIT_ACTIONS.EVENT_CREATE,
    entityType: AUDIT_ENTITY_TYPES.EVENT,
    getEntityId: (args, result) => result?.id,
    getDetails: (args) => ({
      originalEventId: parseInt(args[1]),
      newStartsAt: args[2].newStartsAt,
      newEndsAt: args[2].newEndsAt
    })
  })
  async duplicateEvent(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { newStartsAt: Date; newEndsAt: Date }
  ) {
    return await this.eventsService.duplicateEvent(
      req.user.authContext,
      id,
      new Date(body.newStartsAt),
      new Date(body.newEndsAt)
    );
  }
}