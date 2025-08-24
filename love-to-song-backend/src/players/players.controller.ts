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
  ParseIntPipe,
  BadRequestException
} from '@nestjs/common';
import { PlayersService, CreatePlayerDto, UpdatePlayerDto } from './players.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles, Role } from '../auth/roles.decorator';

@Controller('players')
export class PlayersController {
  constructor(private readonly playersService: PlayersService) {}

  // 獲取所有玩家 (所有用戶可查看)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.GUEST, Role.USER, Role.MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  @Get()
  async findAll() {
    return this.playersService.findAll();
  }

  // 搜索玩家 (所有用戶可查看)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.GUEST, Role.USER, Role.MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  @Get('search')
  async search(@Query('q') query: string) {
    if (!query || query.trim().length === 0) {
      throw new BadRequestException('Search query is required');
    }
    return this.playersService.search(query.trim());
  }

  // 獲取玩家統計 (管理員以上可查看)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  @Get('stats')
  async getStats() {
    return this.playersService.getStats();
  }

  // 根據 ID 獲取單個玩家 (所有用戶可查看)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.GUEST, Role.USER, Role.MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const player = await this.playersService.findOne(id);
    if (!player) {
      throw new BadRequestException('Player not found');
    }
    return player;
  }

  // 創建新玩家 (基層管理員以上可操作)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  @Post()
  async create(@Body() createPlayerDto: CreatePlayerDto) {
    // 檢查名稱是否已存在
    const existingPlayer = await this.playersService.findByName(createPlayerDto.name);
    if (existingPlayer) {
      throw new BadRequestException('Player name already exists');
    }
    
    return this.playersService.create(createPlayerDto);
  }

  // 更新玩家資訊
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePlayerDto: UpdatePlayerDto
  ) {
    try {
      return await this.playersService.update(id, updatePlayerDto);
    } catch (error) {
      throw new BadRequestException('Failed to update player');
    }
  }

  // 刪除玩家
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    try {
      return await this.playersService.remove(id);
    } catch (error) {
      throw new BadRequestException('Failed to delete player');
    }
  }

  // 獲取點歌統計 (暫時移除點歌次數更新功能)
  @Get(':id/requests')
  async getPlayerRequests(@Param('id', ParseIntPipe) id: number) {
    const player = await this.playersService.findOne(id);
    if (!player) {
      throw new BadRequestException('Player not found');
    }
    return (player as any).requests || [];
  }
}