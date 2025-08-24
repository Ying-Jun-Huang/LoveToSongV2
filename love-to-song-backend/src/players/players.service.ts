import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Player } from '@prisma/client';

export interface CreatePlayerDto {
  userId?: number;
  name: string;
  nickname?: string;
  level?: string;
  birthday?: string;
  notes?: string;
  photoKey?: string;
}

export interface UpdatePlayerDto {
  name?: string;
  nickname?: string;
  level?: string;
  birthday?: string;
  notes?: string;
  photoKey?: string;
  isActive?: boolean;
}

@Injectable()
export class PlayersService {
  constructor(private prisma: PrismaService) {}

  // 獲取所有玩家
  async findAll(): Promise<Player[]> {
    return this.prisma.player.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: true,
        requests: {
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
        user: true,
        requests: {
          include: {
            song: true
          },
          orderBy: { requestedAt: 'desc' }
        }
      }
    });
  }

  // 根據名字搜尋玩家
  async findByName(name: string): Promise<Player | null> {
    return this.prisma.player.findFirst({
      where: { name }
    });
  }

  // 創建新玩家
  async create(createPlayerDto: CreatePlayerDto): Promise<Player> {
    const { birthday, ...otherData } = createPlayerDto;
    
    return this.prisma.player.create({
      data: {
        ...otherData,
        birthday: birthday ? new Date(birthday) : null,
      }
    });
  }

  // 更新玩家資訊
  async update(id: number, updatePlayerDto: UpdatePlayerDto): Promise<Player> {
    const { birthday, ...otherData } = updatePlayerDto;

    return this.prisma.player.update({
      where: { id },
      data: {
        ...otherData,
        birthday: birthday ? new Date(birthday) : undefined,
      }
    });
  }

  // 刪除玩家
  async remove(id: number): Promise<Player> {
    return this.prisma.player.delete({
      where: { id }
    });
  }

  // 搜索玩家
  async search(query: string): Promise<Player[]> {
    return this.prisma.player.findMany({
      where: {
        OR: [
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
    const totalRequests = await this.prisma.request.count();
    const activeToday = await this.prisma.request.count({
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