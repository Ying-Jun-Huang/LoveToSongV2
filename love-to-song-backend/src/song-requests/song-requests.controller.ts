import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  BadRequestException,
  NotFoundException,
  ParseIntPipe,
} from '@nestjs/common';
import { SongRequestsService, CreateSongRequestDto, UpdateSongRequestDto } from './song-requests.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('song-requests')
@UseGuards(JwtAuthGuard)
export class SongRequestsController {
  constructor(private readonly songRequestsService: SongRequestsService) {}

  // 獲取所有點歌請求（分頁 + 篩選）
  @Get()
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('status') status?: string,
    @Query('playerId') playerId?: string,
    @Query('date') date?: string
  ) {
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
      throw new BadRequestException('Invalid pagination parameters');
    }

    return this.songRequestsService.findAll({
      page: pageNum,
      limit: limitNum,
      status,
      playerId: playerId ? parseInt(playerId, 10) : undefined,
      date,
    });
  }

  // 獲取當前排隊中的歌曲（即時排隊狀態）
  @Get('queue')
  async getQueue() {
    return this.songRequestsService.getQueue();
  }

  // 獲取點歌統計
  @Get('stats')
  async getStats(@Query('date') date?: string) {
    return this.songRequestsService.getStats(date);
  }

  // 獲取熱門歌曲
  @Get('popular')
  async getPopularSongs(
    @Query('limit') limit: string = '10',
    @Query('days') days: string = '30'
  ) {
    return this.songRequestsService.getPopularSongs(
      parseInt(limit, 10),
      parseInt(days, 10)
    );
  }

  // 根據 ID 獲取單個點歌請求
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const request = await this.songRequestsService.findOne(id);
    if (!request) {
      throw new NotFoundException('Song request not found');
    }
    return request;
  }

  // 創建新的點歌請求
  @Post()
  async create(@Body() createSongRequestDto: CreateSongRequestDto) {
    // 驗證必要欄位
    if (!createSongRequestDto.songId) {
      throw new BadRequestException('Song ID is required');
    }

    if (!createSongRequestDto.playerId && !createSongRequestDto.userId) {
      throw new BadRequestException('Either player ID or user ID is required');
    }

    try {
      return await this.songRequestsService.create(createSongRequestDto);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // 批量創建點歌請求（用於一次點多首歌）
  @Post('batch')
  async createBatch(@Body() body: { requests: CreateSongRequestDto[] }) {
    if (!body.requests || !Array.isArray(body.requests) || body.requests.length === 0) {
      throw new BadRequestException('Requests array is required');
    }

    if (body.requests.length > 10) {
      throw new BadRequestException('Cannot create more than 10 requests at once');
    }

    try {
      return await this.songRequestsService.createBatch(body.requests);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // 更新點歌請求狀態
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSongRequestDto: UpdateSongRequestDto
  ) {
    try {
      return await this.songRequestsService.update(id, updateSongRequestDto);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // 批量更新請求狀態（用於批量處理）
  @Patch('batch/status')
  async updateBatchStatus(@Body() body: { ids: number[]; status: string }) {
    if (!body.ids || !Array.isArray(body.ids) || body.ids.length === 0) {
      throw new BadRequestException('IDs array is required');
    }

    if (!['PENDING', 'COMPLETED', 'CANCELLED'].includes(body.status)) {
      throw new BadRequestException('Invalid status');
    }

    try {
      return await this.songRequestsService.updateBatchStatus(body.ids, body.status as any);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // 刪除點歌請求
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    try {
      return await this.songRequestsService.remove(id);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // 將請求標記為完成並移動到下一首
  @Post(':id/complete')
  async completeRequest(@Param('id', ParseIntPipe) id: number) {
    try {
      const result = await this.songRequestsService.completeRequest(id);
      return {
        message: 'Request completed successfully',
        completedRequest: result,
        nextRequest: await this.songRequestsService.getNextInQueue(),
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // 重新排序點歌請求（拖拽排序）
  @Post('reorder')
  async reorderRequests(@Body() body: { requestIds: number[] }) {
    if (!body.requestIds || !Array.isArray(body.requestIds)) {
      throw new BadRequestException('Request IDs array is required');
    }

    try {
      return await this.songRequestsService.reorderRequests(body.requestIds);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // 獲取玩家的點歌歷史
  @Get('player/:playerId/history')
  async getPlayerHistory(
    @Param('playerId', ParseIntPipe) playerId: number,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20'
  ) {
    return this.songRequestsService.getPlayerHistory(
      playerId,
      parseInt(page, 10),
      parseInt(limit, 10)
    );
  }

  // 清空已完成的請求（清理功能）
  @Delete('completed/clear')
  async clearCompleted(@Query('olderThan') olderThan?: string) {
    const date = olderThan ? new Date(olderThan) : undefined;
    try {
      return await this.songRequestsService.clearCompleted(date);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}