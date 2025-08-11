import { Module, Global } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { PrismaService } from '../prisma/prisma.service';

@Global() // 讓 NotificationService 在整個應用中全域可用
@Module({
  providers: [NotificationService, PrismaService],
  controllers: [NotificationController],
  exports: [NotificationService], // 導出服務供其他模組使用
})
export class NotificationModule {}