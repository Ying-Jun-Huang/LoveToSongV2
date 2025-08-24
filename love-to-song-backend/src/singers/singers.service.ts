import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SingersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.singer.findMany({
      where: { isActive: true },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            email: true
          }
        },
        singerSongs: {
          include: {
            song: true
          }
        },
        _count: {
          select: {
            requests: true,
            singerSongs: true
          }
        }
      },
      orderBy: {
        stageName: 'asc'
      }
    });
  }

  async findOne(id: number) {
    return this.prisma.singer.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            email: true
          }
        },
        singerSongs: {
          include: {
            song: true
          }
        },
        _count: {
          select: {
            requests: true,
            singerSongs: true
          }
        }
      }
    });
  }

  async findSingerSongs(singerId: number) {
    const singer = await this.prisma.singer.findUnique({
      where: { id: singerId },
      include: {
        singerSongs: {
          include: {
            song: true
          },
          where: {
            song: {
              isActive: true
            }
          },
          orderBy: [
            { learned: 'desc' },
            { song: { title: 'asc' } }
          ]
        }
      }
    });

    if (!singer) {
      throw new Error('Singer not found');
    }

    // 將 singerSongs 轉換為 songs 格式，並包含學習狀態
    return singer.singerSongs.map(singerSong => ({
      ...singerSong.song,
      learned: singerSong.learned,
      timesRequested: singerSong.timesRequested,
      notes: singerSong.notes
    }));
  }
}