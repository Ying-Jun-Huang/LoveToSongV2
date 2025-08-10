import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role, ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    
    if (!user) {
      return false;
    }

    // 權限層級定義 (數字越小權限越高)
    const roleHierarchy: Record<Role, number> = {
      [Role.SUPER_ADMIN]: 1,
      [Role.ADMIN]: 2,
      [Role.MANAGER]: 3,
      [Role.USER]: 4,
      [Role.GUEST]: 5,
    };

    const userRoleLevel = roleHierarchy[user.role as Role];
    
    // 檢查用戶是否有足夠的權限
    return requiredRoles.some(role => {
      const requiredLevel = roleHierarchy[role];
      return userRoleLevel <= requiredLevel;
    });
  }
}