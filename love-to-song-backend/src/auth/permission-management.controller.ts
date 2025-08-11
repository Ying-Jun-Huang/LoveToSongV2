import { 
  Controller, 
  Get, 
  Post, 
  Delete, 
  Param, 
  Body, 
  Query,
  UseGuards,
  ParseIntPipe,
  HttpException,
  HttpStatus
} from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';
import { GetUser } from './get-user.decorator';
import { EnhancedPermissionService } from './enhanced-permission.service';

export class PermissionOverrideDto {
  permission: string;
  granted: boolean;
  reason?: string;
  expiresAt?: string; // ISO date string
}

export class BulkPermissionDto {
  userIds: number[];
  permissions: PermissionOverrideDto[];
  reason?: string;
}

@Controller('api/permissions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PermissionManagementController {
  constructor(
    private enhancedPermissionService: EnhancedPermissionService
  ) {}

  /**
   * 獲取所有用戶權限摘要（管理界面主頁）
   */
  @Get('users/summary')
  @Roles('SUPER_ADMIN')
  async getUsersPermissionSummary(
    @Query('limit') limit?: string,
    @Query('search') search?: string
  ) {
    const limitNum = limit ? parseInt(limit) : 100;
    return this.enhancedPermissionService.getUsersPermissionSummary(limitNum);
  }

  /**
   * 獲取特定用戶的詳細權限資訊
   */
  @Get('users/:userId')
  @Roles('SUPER_ADMIN')
  async getUserPermissions(
    @Param('userId', ParseIntPipe) userId: number
  ) {
    try {
      const permissions = await this.enhancedPermissionService.calculateUserPermissions(userId);
      const history = await this.enhancedPermissionService.getPermissionHistory(userId, 20);
      
      return {
        ...permissions,
        history
      };
    } catch (error) {
      throw new HttpException(
        `無法獲取用戶權限: ${error.message}`,
        HttpStatus.NOT_FOUND
      );
    }
  }

  /**
   * 授予用戶特定權限
   */
  @Post('users/:userId/grant')
  @Roles('SUPER_ADMIN')
  async grantPermission(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: PermissionOverrideDto,
    @GetUser('id') operatorId: number
  ) {
    try {
      const expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : undefined;
      
      await this.enhancedPermissionService.grantPermission(
        userId,
        dto.permission,
        operatorId,
        dto.reason,
        expiresAt
      );

      return {
        success: true,
        message: `成功授予權限 ${dto.permission}`,
        userId,
        permission: dto.permission
      };
    } catch (error) {
      throw new HttpException(
        `授予權限失敗: ${error.message}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  /**
   * 撤銷用戶特定權限
   */
  @Post('users/:userId/revoke')
  @Roles('SUPER_ADMIN')
  async revokePermission(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: { permission: string; reason?: string },
    @GetUser('id') operatorId: number
  ) {
    try {
      await this.enhancedPermissionService.revokePermission(
        userId,
        dto.permission,
        operatorId,
        dto.reason
      );

      return {
        success: true,
        message: `成功撤銷權限 ${dto.permission}`,
        userId,
        permission: dto.permission
      };
    } catch (error) {
      throw new HttpException(
        `撤銷權限失敗: ${error.message}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  /**
   * 批量權限調整
   */
  @Post('users/bulk-update')
  @Roles('SUPER_ADMIN')
  async bulkUpdatePermissions(
    @Body() dto: BulkPermissionDto,
    @GetUser('id') operatorId: number
  ) {
    try {
      const results = [];
      
      for (const userId of dto.userIds) {
        for (const perm of dto.permissions) {
          if (perm.granted) {
            const expiresAt = perm.expiresAt ? new Date(perm.expiresAt) : undefined;
            await this.enhancedPermissionService.grantPermission(
              userId,
              perm.permission,
              operatorId,
              perm.reason || dto.reason,
              expiresAt
            );
          } else {
            await this.enhancedPermissionService.revokePermission(
              userId,
              perm.permission,
              operatorId,
              perm.reason || dto.reason
            );
          }
          
          results.push({
            userId,
            permission: perm.permission,
            action: perm.granted ? 'GRANT' : 'REVOKE',
            success: true
          });
        }
      }

      return {
        success: true,
        message: `批量更新 ${results.length} 個權限設定`,
        results
      };
    } catch (error) {
      throw new HttpException(
        `批量更新失敗: ${error.message}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  /**
   * 重置用戶權限到角色預設
   */
  @Post('users/:userId/reset')
  @Roles('SUPER_ADMIN')
  async resetUserPermissions(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: { reason?: string },
    @GetUser('id') operatorId: number
  ) {
    try {
      await this.enhancedPermissionService.resetUserPermissions(
        userId,
        operatorId,
        dto.reason
      );

      return {
        success: true,
        message: '用戶權限已重置到角色預設',
        userId
      };
    } catch (error) {
      throw new HttpException(
        `重置權限失敗: ${error.message}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  /**
   * 獲取用戶權限變更歷史
   */
  @Get('users/:userId/history')
  @Roles('SUPER_ADMIN')
  async getPermissionHistory(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('limit') limit?: string
  ) {
    const limitNum = limit ? parseInt(limit) : 50;
    return this.enhancedPermissionService.getPermissionHistory(userId, limitNum);
  }

  /**
   * 清理過期權限
   */
  @Post('cleanup/expired')
  @Roles('SUPER_ADMIN')
  async cleanupExpiredPermissions() {
    const cleanedCount = await this.enhancedPermissionService.cleanupExpiredPermissions();
    
    return {
      success: true,
      message: `清理了 ${cleanedCount} 個過期權限`,
      cleanedCount
    };
  }

  /**
   * 檢查用戶權限（供其他服務調用）
   */
  @Get('users/:userId/check/:permission')
  @Roles('SUPER_ADMIN', 'HOST_ADMIN')
  async checkUserPermission(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('permission') permission: string
  ) {
    const hasPermission = await this.enhancedPermissionService.hasPermission(userId, permission);
    
    return {
      userId,
      permission,
      hasPermission
    };
  }

  /**
   * 獲取所有可用權限列表
   */
  @Get('available')
  @Roles('SUPER_ADMIN')
  getAvailablePermissions() {
    return {
      permissions: [
        // 基本功能權限
        'VIEW_HOMEPAGE',
        'VIEW_SONGS',
        'VIEW_SINGERS',
        'SONG_REQUEST',
        'WISH_SONG_SUBMIT',
        'WISH_SONG_RESPONSE',
        'SONG_MANAGEMENT',
        'MY_PROFILE',
        'MY_REQUESTS',
        
        // 管理權限
        'USER_MANAGEMENT',
        'SINGER_MANAGEMENT',
        'ROLE_MANAGEMENT',
        'EVENT_MANAGEMENT',
        'QUEUE_MANAGEMENT',
        'WISH_SONG_MANAGEMENT',
        
        // 高級權限
        'SYSTEM_STATS',
        'EVENT_STATS',
        'AUDIT_LOGS',
        'DATA_EXPORT',
        'REQUEST_CONTROL',
        'SINGER_ASSIGNMENT',
        
        // 特殊權限
        'QUEUE_PRIORITY',
        'UNLIMITED_REQUESTS',
        'VIP_ACCESS'
      ],
      categories: {
        'basic': ['VIEW_HOMEPAGE', 'VIEW_SONGS', 'VIEW_SINGERS'],
        'player': ['SONG_REQUEST', 'WISH_SONG_SUBMIT', 'MY_PROFILE'],
        'singer': ['WISH_SONG_RESPONSE', 'SONG_MANAGEMENT', 'MY_REQUESTS'],
        'admin': ['USER_MANAGEMENT', 'EVENT_MANAGEMENT', 'SYSTEM_STATS'],
        'special': ['QUEUE_PRIORITY', 'VIP_ACCESS', 'UNLIMITED_REQUESTS']
      }
    };
  }
}