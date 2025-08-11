import { Module, Global } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';
import { AuditInterceptor } from './audit.interceptor';
import { PrismaService } from '../prisma/prisma.service';

@Global() // 讓 AuditService 在整個應用中全域可用
@Module({
  providers: [
    AuditService,
    PrismaService,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
  controllers: [AuditController],
  exports: [AuditService], // 導出 AuditService 供其他模組使用
})
export class AuditModule {}