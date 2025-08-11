import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, tap, catchError, of } from 'rxjs';
import { AuditService } from './audit.service';
import { AUDIT_METADATA_KEY, AuditConfig } from './audit.decorator';
import { AuthContext } from '../auth/rbac-abac.system';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly auditService: AuditService,
    private readonly reflector: Reflector
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const auditConfig = this.reflector.get<AuditConfig>(
      AUDIT_METADATA_KEY,
      context.getHandler()
    );

    if (!auditConfig) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const authContext: AuthContext = request.user?.authContext;

    if (!authContext) {
      // 沒有認證上下文時，可能是公開端點，跳過稽核
      return next.handle();
    }

    const startTime = Date.now();
    const methodArgs = context.getArgs();
    const ipAddress = this.getIpAddress(request);
    const userAgent = request.headers['user-agent'];

    return next.handle().pipe(
      tap(result => {
        // 成功執行時記錄稽核日誌
        this.logAuditSuccess(
          auditConfig,
          authContext,
          methodArgs,
          result,
          startTime,
          ipAddress,
          userAgent
        );
      }),
      catchError(error => {
        // 執行失敗時記錄稽核日誌（如果配置允許）
        if (!auditConfig.skipOnError) {
          this.logAuditError(
            auditConfig,
            authContext,
            methodArgs,
            error,
            startTime,
            ipAddress,
            userAgent
          );
        }
        throw error;
      })
    );
  }

  private async logAuditSuccess(
    config: AuditConfig,
    authContext: AuthContext,
    methodArgs: any[],
    result: any,
    startTime: number,
    ipAddress?: string,
    userAgent?: string
  ) {
    try {
      const entityId = config.getEntityId ? config.getEntityId(methodArgs, result) : undefined;
      const details = config.getDetails ? config.getDetails(methodArgs, result) : {};
      const executionTime = Date.now() - startTime;

      await this.auditService.logAction({
        action: config.action,
        entityType: config.entityType,
        entityId,
        userId: authContext.userId,
        ipAddress,
        userAgent,
        details: {
          ...details,
          executionTime: `${executionTime}ms`,
          timestamp: new Date().toISOString(),
          sensitive: config.sensitive || false
        },
        result: 'SUCCESS'
      });
    } catch (error) {
      // 稽核日誌記錄失敗不應影響主要業務流程
      console.error('Failed to log successful audit:', error);
    }
  }

  private async logAuditError(
    config: AuditConfig,
    authContext: AuthContext,
    methodArgs: any[],
    error: any,
    startTime: number,
    ipAddress?: string,
    userAgent?: string
  ) {
    try {
      const entityId = config.getEntityId ? config.getEntityId(methodArgs) : undefined;
      const details = config.getDetails ? config.getDetails(methodArgs) : {};
      const executionTime = Date.now() - startTime;

      await this.auditService.logAction({
        action: config.action,
        entityType: config.entityType,
        entityId,
        userId: authContext.userId,
        ipAddress,
        userAgent,
        details: {
          ...details,
          executionTime: `${executionTime}ms`,
          timestamp: new Date().toISOString(),
          sensitive: config.sensitive || false
        },
        result: 'FAILURE',
        errorMessage: error.message || 'Unknown error'
      });
    } catch (auditError) {
      // 稽核日誌記錄失敗不應影響主要業務流程
      console.error('Failed to log error audit:', auditError);
    }
  }

  private getIpAddress(request: any): string | undefined {
    return request.ip || 
           request.headers['x-forwarded-for']?.split(',')[0] || 
           request.headers['x-real-ip'] || 
           request.connection?.remoteAddress;
  }
}