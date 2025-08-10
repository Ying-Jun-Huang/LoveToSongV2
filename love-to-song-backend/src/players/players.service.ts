import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Player } from '@prisma/client';

export interface CreatePlayerDto {
  playerId: string;
  playerIdAlt?: string;
  name: string;
  nickname?: string;
  gender?: string;
  birthday?: string;
  joinDate?: string;
  note?: string;
  crownDate?: string;
}

export interface UpdatePlayerDto {
  playerIdAlt?: string;
  name?: string;
  nickname?: string;
  gender?: string;
  birthday?: string;
  joinDate?: string;
  note?: string;
  crownDate?: string;
  photoPath?: string;
}

@Injectable()
export class PlayersService {
  constructor(private prisma: PrismaService) {}

  // 獲取所有玩家
  async findAll(): Promise<Player[]> {
    return this.prisma.player.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        songRequests: {
          include: {
            song: true
          }
        }
      }
    });
  }

  // 根據 ID 獲取單個玩家
  async findOne(id: number): Promise<Player | null> {
    return this.prisma.player.findUnique({
      where: { id },
      include: {
        songRequests: {
          include: {
            song: true
          },
          orderBy: { requestedAt: 'desc' }
        }
      }
    });
  }

  // 根據 playerId 獲取玩家
  async findByPlayerId(playerId: string): Promise<Player | null> {
    return this.prisma.player.findUnique({
      where: { playerId }
    });
  }

  // 創建新玩家
  async create(createPlayerDto: CreatePlayerDto): Promise<Player> {
    const { birthday, joinDate, crownDate, ...otherData } = createPlayerDto;
    
    return this.prisma.player.create({
      data: {
        ...otherData,
        birthday: birthday ? new Date(birthday) : null,
        joinDate: joinDate ? new Date(joinDate) : null,
        crownDate: crownDate ? new Date(crownDate) : null,
      }
    });
  }

  // 更新玩家資訊
  async update(id: number, updatePlayerDto: UpdatePlayerDto): Promise<Player> {
    const { birthday, joinDate, crownDate, ...otherData } = updatePlayerDto;

    return this.prisma.player.update({
      where: { id },
      data: {
        ...otherData,
        birthday: birthday ? new Date(birthday) : undefined,
        joinDate: joinDate ? new Date(joinDate) : undefined,
        crownDate: crownDate ? new Date(crownDate) : undefined,
      }
    });
  }

  // 刪除玩家
  async remove(id: number): Promise<Player> {
    return this.prisma.player.delete({
      where: { id }
    });
  }

  // 更新玩家點歌次數
  async updateSongCount(playerId: number, increment: number = 1): Promise<Player> {
    return this.prisma.player.update({
      where: { id: playerId },
      data: {
        songCount: {
          increment
        }
      }
    });
  }

  // 搜索玩家
  async search(query: string): Promise<Player[]> {
    return this.prisma.player.findMany({
      where: {
        OR: [
          { playerId: { contains: query } },
          { name: { contains: query } },
          { nickname: { contains: query } },
        ]
      },
      orderBy: { name: 'asc' }
    });
  }

  // 獲取玩家統計
  async getStats() {
    const totalPlayers = await this.prisma.player.count();
    const totalRequests = await this.prisma.songRequest.count();
    const activeToday = await this.prisma.songRequest.count({
      where: {
        requestedAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    });

    return {
      totalPlayers,
      totalRequests,
      activeToday
    };
  }
}