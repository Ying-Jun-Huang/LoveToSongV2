import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UploadService {
  constructor(private prisma: PrismaService) {}

  // 簡化的導出功能
  async exportPlayersToExcel() {
    const players = await this.prisma.player.findMany();
    
    // 準備匯出資料
    const exportData = players.map(player => ({
      '姓名': player.name,
      '暱稱': player.nickname || '',
      '等級': player.level || '',
      '生日': player.birthday ? player.birthday.toISOString().split('T')[0] : '',
      '加入日期': player.joinedAt ? player.joinedAt.toISOString().split('T')[0] : '',
      '備註': player.notes || '',
      '建立時間': player.createdAt.toISOString(),
      '更新時間': player.updatedAt.toISOString(),
    }));

    return exportData;
  }
}