import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

export interface ImportResult {
  total: number;
  imported: number;
  errors: Array<{ row: number; error: string; data?: any }>;
}

@Injectable()
export class UploadService {
  constructor(private prisma: PrismaService) {}

  // 從 Excel 檔案匯入玩家資料
  async importPlayersFromExcel(filePath: string): Promise<ImportResult> {
    const result: ImportResult = {
      total: 0,
      imported: 0,
      errors: [],
    };

    try {
      // 讀取 Excel 檔案
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      // 將工作表轉換為 JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (jsonData.length < 2) {
        throw new Error('Excel file must contain at least a header row and one data row');
      }

      // 假設第一行是標題行
      const headers = jsonData[0] as string[];
      const dataRows = jsonData.slice(1);

      result.total = dataRows.length;

      // 處理每一行資料
      for (let i = 0; i < dataRows.length; i++) {
        const rowIndex = i + 2; // Excel 行號 (1-based + header)
        const row = dataRows[i] as any[];
        
        try {
          // 根據標題行對應資料
          const playerData = this.mapExcelRowToPlayer(headers, row);
          
          if (!playerData.playerId || !playerData.name) {
            result.errors.push({
              row: rowIndex,
              error: 'Player ID and Name are required',
              data: playerData,
            });
            continue;
          }

          // 檢查是否已存在相同的 playerId
          const existingPlayer = await this.prisma.player.findUnique({
            where: { playerId: playerData.playerId },
          });

          if (existingPlayer) {
            // 更新現有玩家
            await this.prisma.player.update({
              where: { playerId: playerData.playerId },
              data: playerData,
            });
          } else {
            // 創建新玩家
            await this.prisma.player.create({
              data: playerData,
            });
          }

          result.imported++;
        } catch (error) {
          result.errors.push({
            row: rowIndex,
            error: error.message,
            data: row,
          });
        }
      }

      // 清理臨時檔案
      fs.unlinkSync(filePath);

      return result;
    } catch (error) {
      // 清理臨時檔案
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      throw error;
    }
  }

  // 將 Excel 行資料對應到玩家物件
  private mapExcelRowToPlayer(headers: string[], row: any[]): any {
    const playerData: any = {};

    for (let i = 0; i < headers.length && i < row.length; i++) {
      const header = headers[i]?.toString().toLowerCase().trim();
      const value = row[i];

      if (!value && value !== 0) continue; // 跳過空值

      switch (header) {
        case 'playerid':
        case 'player_id':
        case '玩家編號':
        case '編號':
          playerData.playerId = value.toString();
          break;
        case 'playeridalt':
        case 'player_id_alt':
        case '備用編號':
          playerData.playerIdAlt = value.toString();
          break;
        case 'name':
        case '姓名':
        case '名稱':
          playerData.name = value.toString();
          break;
        case 'nickname':
        case '暱稱':
        case '綽號':
          playerData.nickname = value.toString();
          break;
        case 'gender':
        case '性別':
          const gender = value.toString().toLowerCase();
          if (gender === 'm' || gender === 'male' || gender === '男') {
            playerData.gender = 'M';
          } else if (gender === 'f' || gender === 'female' || gender === '女') {
            playerData.gender = 'F';
          }
          break;
        case 'birthday':
        case '生日':
        case '出生日期':
          playerData.birthday = this.parseDate(value);
          break;
        case 'joindate':
        case 'join_date':
        case '加入日期':
        case '註冊日期':
          playerData.joinDate = this.parseDate(value);
          break;
        case 'note':
        case '備註':
        case '說明':
          playerData.note = value.toString();
          break;
        case 'crowndate':
        case 'crown_date':
        case '冠軍日期':
          playerData.crownDate = this.parseDate(value);
          break;
      }
    }

    return playerData;
  }

  // 解析日期
  private parseDate(value: any): Date | null {
    if (!value) return null;

    try {
      // 如果是 Excel 日期數字
      if (typeof value === 'number') {
        const date = XLSX.SSF.parse_date_code(value);
        return new Date(date.y, date.m - 1, date.d);
      }

      // 如果是字串
      if (typeof value === 'string') {
        const parsed = new Date(value);
        return isNaN(parsed.getTime()) ? null : parsed;
      }

      return null;
    } catch {
      return null;
    }
  }

  // 更新玩家頭像
  async updatePlayerPhoto(playerId: number, photoPath: string) {
    return this.prisma.player.update({
      where: { id: playerId },
      data: { photoPath },
    });
  }

  // 匯出玩家資料為 Excel
  async exportPlayersToExcel(): Promise<string> {
    // 獲取所有玩家資料
    const players = await this.prisma.player.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        songRequests: {
          include: {
            song: true,
          },
        },
      },
    });

    // 準備匯出資料
    const exportData = players.map(player => ({
      '玩家編號': player.playerId,
      '備用編號': player.playerIdAlt || '',
      '姓名': player.name,
      '暱稱': player.nickname || '',
      '性別': player.gender === 'M' ? '男' : player.gender === 'F' ? '女' : '',
      '生日': player.birthday ? player.birthday.toISOString().split('T')[0] : '',
      '加入日期': player.joinDate ? player.joinDate.toISOString().split('T')[0] : '',
      '點歌次數': player.songCount,
      '儲存次數': player.storageCount,
      '備註': player.note || '',
      '冠軍日期': player.crownDate ? player.crownDate.toISOString().split('T')[0] : '',
      '建立時間': player.createdAt.toISOString(),
      '更新時間': player.updatedAt.toISOString(),
    }));

    // 建立工作簿
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // 設定欄位寬度
    const columnWidths = [
      { wch: 12 }, // 玩家編號
      { wch: 12 }, // 備用編號
      { wch: 15 }, // 姓名
      { wch: 15 }, // 暱稱
      { wch: 6 },  // 性別
      { wch: 12 }, // 生日
      { wch: 12 }, // 加入日期
      { wch: 10 }, // 點歌次數
      { wch: 10 }, // 儲存次數
      { wch: 20 }, // 備註
      { wch: 12 }, // 冠軍日期
      { wch: 20 }, // 建立時間
      { wch: 20 }, // 更新時間
    ];
    worksheet['!cols'] = columnWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, '玩家資料');

    // 確保匯出目錄存在
    const exportDir = './uploads/exports';
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    // 產生檔案名稱
    const timestamp = new Date().toISOString().replace(/[:]/g, '-').split('.')[0];
    const filename = `players-export-${timestamp}.xlsx`;
    const filePath = path.join(exportDir, filename);

    // 寫入檔案
    XLSX.writeFile(workbook, filePath);

    return filePath;
  }
}