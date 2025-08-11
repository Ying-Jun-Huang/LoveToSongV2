import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionService, AuthContext } from './rbac-abac.system';
import { PERMISSION_KEY } from './rbac-abac.decorator';

@Injectable()
export class RBACGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 獲取權限要求
    const permissionMeta = this.reflector.getAllAndOverride(PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!permissionMeta) {
      return true; // 沒有權限要求，允許訪問
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('用戶未認證');
    }

    // 構建認證上下文
    const authContext: AuthContext = await this.buildAuthContext(user, request);

    // 檢查權限
    const hasPermission = await this.checkPermission(permissionMeta, authContext, request);

    if (!hasPermission) {
      throw new ForbiddenException('權限不足');
    }

    return true;
  }

  private async buildAuthContext(user: any, request: any): Promise<AuthContext> {
    // 從資料庫獲取用戶的完整角色信息
    // TODO: 實現從資料庫查詢用戶角色、歌手ID、玩家ID、管理的活動等
    
    const context: AuthContext = {
      userId: user.id,
      roles: user.roles || ['GUEST'], // 暫時從 JWT 獲取，後續從資料庫查詢
      eventIds: user.eventIds || [], // 用戶管理或參與的活動ID
      singerId: user.singerId, // 如果是歌手
      playerId: user.playerId, // 如果是玩家
    };

    return context;
  }

  private async checkPermission(
    permissionMeta: any,
    authContext: AuthContext,
    request: any
  ): Promise<boolean> {
    // 單一權限檢查
    if (permissionMeta.entity && permissionMeta.action) {
      const resource = await this.getResource(request);
      return PermissionService.hasPermission(
        authContext,
        permissionMeta.entity,
        permissionMeta.action,
        resource
      );
    }

    // 多重權限檢查
    if (permissionMeta.type === 'any' && permissionMeta.permissions) {
      const resource = await this.getResource(request);
      return permissionMeta.permissions.some((perm: any) =>
        PermissionService.hasPermission(authContext, perm.entity, perm.action, resource)
      );
    }

    if (permissionMeta.type === 'all' && permissionMeta.permissions) {
      const resource = await this.getResource(request);
      return permissionMeta.permissions.every((perm: any) =>
        PermissionService.hasPermission(authContext, perm.entity, perm.action, resource)
      );
    }

    return false;
  }

  private async getResource(request: any): Promise<any> {
    // 從請求中提取資源信息
    const params = request.params;
    const body = request.body;
    const query = request.query;

    // 根據路由參數構建資源對象
    const resource: any = {};

    // 常見的資源識別符
    if (params.id) resource.id = parseInt(params.id);
    if (params.eventId) resource.eventId = parseInt(params.eventId);
    if (params.singerId) resource.singerId = parseInt(params.singerId);
    if (params.playerId) resource.playerId = parseInt(params.playerId);
    if (params.userId) resource.userId = parseInt(params.userId);

    // 從請求體中提取
    if (body.eventId) resource.eventId = body.eventId;
    if (body.singerId) resource.singerId = body.singerId;
    if (body.playerId) resource.playerId = body.playerId;
    if (body.userId) resource.userId = body.userId;

    // TODO: 如果需要，從資料庫查詢完整的資源信息
    // 例如：如果只有 ID，查詢完整的實體數據

    return resource;
  }
}

// ABAC 條件檢查守衛
@Injectable()
export class ABACGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return true; // 讓其他守衛處理認證
    }

    // 檢查擁有者權限
    const ownershipMeta = this.reflector.get('ownership', context.getHandler());
    if (ownershipMeta) {
      const resource = await this.getResource(request);
      const entityField = ownershipMeta.entityField;
      
      if (resource[entityField] !== user.id) {
        throw new ForbiddenException('只能操作自己的資源');
      }
    }

    // 檢查活動範圍權限
    const eventScopeMeta = this.reflector.get('eventScope', context.getHandler());
    if (eventScopeMeta) {
      const resource = await this.getResource(request);
      const eventField = eventScopeMeta.eventField;
      
      // TODO: 檢查用戶是否有權限訪問該活動
      const userEventIds = user.eventIds || [];
      
      if (!userEventIds.includes(resource[eventField])) {
        throw new ForbiddenException('無權限訪問該活動範圍的資源');
      }
    }

    return true;
  }

  private async getResource(request: any): Promise<any> {
    // 與 RBACGuard 中的實現相同
    const params = request.params;
    const body = request.body;
    
    const resource: any = {};
    
    if (params.id) resource.id = parseInt(params.id);
    if (params.eventId) resource.eventId = parseInt(params.eventId);
    if (params.singerId) resource.singerId = parseInt(params.singerId);
    if (params.playerId) resource.playerId = parseInt(params.playerId);
    if (params.userId) resource.userId = parseInt(params.userId);
    
    if (body.eventId) resource.eventId = body.eventId;
    if (body.singerId) resource.singerId = body.singerId;
    if (body.playerId) resource.playerId = body.playerId;
    if (body.userId) resource.userId = body.userId;
    
    return resource;
  }
}