import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  BadRequestException,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UploadService } from './upload.service';
import * as XLSX from 'xlsx';

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  // Excel 檔案上傳並匯入玩家資料
  @Post('players/excel')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/excel',
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
          callback(null, `players-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, callback) => {
        if (file.mimetype.match(/\/(xlsx|xls)$/)) {
          callback(null, true);
        } else {
          callback(new BadRequestException('Only Excel files are allowed!'), false);
        }
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
      },
    }),
  )
  async uploadPlayersExcel(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    try {
      const result = await this.uploadService.importPlayersFromExcel(file.path);
      return {
        message: 'Excel file processed successfully',
        imported: result.imported,
        errors: result.errors,
        total: result.total,
        filePath: file.path,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to process Excel file: ${error.message}`);
    }
  }

  // 玩家頭像上傳
  @Post('players/photo')
  @UseInterceptors(
    FileInterceptor('photo', {
      storage: diskStorage({
        destination: './uploads/photos',
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
          callback(null, `player-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, callback) => {
        if (file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
          callback(null, true);
        } else {
          callback(new BadRequestException('Only image files are allowed!'), false);
        }
      },
      limits: {
        fileSize: 2 * 1024 * 1024, // 2MB limit
      },
    }),
  )
  async uploadPlayerPhoto(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { playerId: string }
  ) {
    if (!file) {
      throw new BadRequestException('No photo uploaded');
    }

    if (!body.playerId) {
      throw new BadRequestException('Player ID is required');
    }

    try {
      const result = await this.uploadService.updatePlayerPhoto(
        parseInt(body.playerId),
        file.path
      );
      return {
        message: 'Photo uploaded successfully',
        photoPath: file.path,
        player: result,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to upload photo: ${error.message}`);
    }
  }

  // 匯出玩家資料為 Excel
  @Post('players/export')
  async exportPlayersToExcel() {
    try {
      const filePath = await this.uploadService.exportPlayersToExcel();
      return {
        message: 'Export completed successfully',
        filePath,
        downloadUrl: `/uploads/exports/${filePath.split('/').pop()}`,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to export data: ${error.message}`);
    }
  }
}