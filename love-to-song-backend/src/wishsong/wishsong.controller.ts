import { 
  Controller, 
  Get, 
  Post, 
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
  WishSongService, 
  CreateWishSongDto, 
  ApproveWishSongDto,
  BatchApproveDto
} from './wishsong.service';
import { RBACGuard } from '../auth/rbac-abac.guard';
import { RequirePermission } from '../auth/rbac-abac.decorator';
import { ENTITIES, ACTIONS } from '../auth/rbac-abac.system';
import { Audit, AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from '../audit/audit.decorator';

@Controller('wishsongs')
@UseGuards(AuthGuard('jwt-v2'), RBACGuard)
export class WishSongController {
  constructor(private readonly wishSongService: WishSongService) {}

  // 創建願望歌
  @Post()
  @RequirePermission(ENTITIES.WISH_SONG, ACTIONS.CREATE)
  @Audit({
    action: AUDIT_ACTIONS.WISH_SONG_CREATE,
    entityType: AUDIT_ENTITY_TYPES.WISH_SONG,
    getEntityId: (args, result) => result?.id,
    getDetails: (args) => ({
      title: args[1].title,
      originalArtist: args[1].originalArtist,
      singerId: args[1].singerId,
      playerId: args[1].playerId
    })
  })
  async createWishSong(@Request() req, @Body() createWishSongDto: CreateWishSongDto) {
    return await this.wishSongService.createWishSong(req.user.authContext, createWishSongDto);
  }

  // 獲取願望歌列表
  @Get()
  async getWishSongs(
    @Request() req,
    @Query('status') status?: string,
    @Query('singerId') singerId?: number,
    @Query('userId') userId?: number,
    @Query('playerId') playerId?: number
  ) {
    const filters = {
      status,
      singerId: singerId ? parseInt(singerId.toString()) : undefined,
      userId: userId ? parseInt(userId.toString()) : undefined,
      playerId: playerId ? parseInt(playerId.toString()) : undefined
    };

    return await this.wishSongService.getWishSongs(req.user.authContext, filters);
  }

  // 審核願望歌
  @Post(':id/approve')
  @RequirePermission(ENTITIES.WISH_SONG, ACTIONS.APPROVE)
  @Audit({
    action: AUDIT_ACTIONS.WISH_SONG_APPROVE,
    entityType: AUDIT_ENTITY_TYPES.WISH_SONG,
    getEntityId: (args) => parseInt(args[1]),
    getDetails: (args) => ({
      wishSongId: parseInt(args[1]),
      action: args[2].action,
      reason: args[2].reason
    })
  })
  async approveWishSong(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() approveDto: Omit<ApproveWishSongDto, 'wishSongId'>
  ) {
    const fullDto: ApproveWishSongDto = {
      wishSongId: id,
      ...approveDto
    };
    return await this.wishSongService.approveWishSong(req.user.authContext, fullDto);
  }

  // 批量審核願望歌
  @Post('batch-approve')
  @RequirePermission(ENTITIES.WISH_SONG, ACTIONS.APPROVE)
  @Audit({
    action: AUDIT_ACTIONS.WISH_SONG_BATCH_APPROVE,
    entityType: AUDIT_ENTITY_TYPES.WISH_SONG,
    getDetails: (args) => ({
      wishSongIds: args[1].wishSongIds,
      action: args[1].action,
      reason: args[1].reason
    })
  })
  async batchApprove(@Request() req, @Body() batchDto: BatchApproveDto) {
    return await this.wishSongService.batchApprove(req.user.authContext, batchDto);
  }

  // 歌手標記願望歌狀態
  @Post(':id/singer-action')
  @Audit({
    action: AUDIT_ACTIONS.WISH_SONG_APPROVE,
    entityType: AUDIT_ENTITY_TYPES.WISH_SONG,
    getEntityId: (args) => parseInt(args[1]),
    getDetails: (args) => ({
      wishSongId: parseInt(args[1]),
      singerAction: args[2].action
    })
  })
  async singerMarkWishSong(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { action: 'accepted' | 'rejected' | 'added' }
  ) {
    return await this.wishSongService.singerMarkWishSong(
      req.user.authContext,
      id,
      body.action
    );
  }

  // 刪除願望歌
  @Delete(':id')
  @Audit({
    action: AUDIT_ACTIONS.WISH_SONG_DELETE,
    entityType: AUDIT_ENTITY_TYPES.WISH_SONG,
    getEntityId: (args) => parseInt(args[1])
  })
  async deleteWishSong(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return await this.wishSongService.deleteWishSong(req.user.authContext, id);
  }

  // 獲取願望歌統計
  @Get('stats/:singerId?')
  @RequirePermission(ENTITIES.ANALYTICS, ACTIONS.VIEW)
  async getWishSongStats(
    @Request() req,
    @Param('singerId') singerId?: string
  ) {
    const targetSingerId = singerId ? parseInt(singerId) : undefined;
    return await this.wishSongService.getWishSongStats(req.user.authContext, targetSingerId);
  }

  // 我的願望歌
  @Get('my-wishsongs')
  async getMyWishSongs(@Request() req) {
    return await this.wishSongService.getWishSongs(req.user.authContext, {
      userId: req.user.authContext.userId
    });
  }

  // 指派給我的願望歌（歌手視角）
  @Get('assigned-to-me')
  async getAssignedWishSongs(@Request() req) {
    if (!req.user.authContext.singerId) {
      return { wishSongs: [], message: '您不是歌手，無法查看指派的願望歌' };
    }

    return await this.wishSongService.getWishSongs(req.user.authContext, {
      singerId: req.user.authContext.singerId,
      status: 'PENDING'
    });
  }
}