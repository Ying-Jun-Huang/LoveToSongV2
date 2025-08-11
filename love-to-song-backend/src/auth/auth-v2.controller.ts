import { Controller, Post, Body, UseGuards, Request, Get } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthV2Service } from './auth-v2.service';
import { RBACGuard } from './rbac-abac.guard';
import { RequirePermission } from './rbac-abac.decorator';
import { ENTITIES, ACTIONS } from './rbac-abac.system';
import { Audit, AUDIT_ACTIONS, AUDIT_ENTITY_TYPES, GetIpAddress, GetUserAgent } from '../audit/audit.decorator';

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  displayName: string;
  password: string;
  roleType?: string;
}

export interface UpdateRoleDto {
  targetUserId: number;
  roles: string[];
}

@Controller('auth/v2')
export class AuthV2Controller {
  constructor(private authV2Service: AuthV2Service) {}

  // 用戶登入
  @Post('login')
  @Audit({
    action: AUDIT_ACTIONS.USER_LOGIN,
    entityType: AUDIT_ENTITY_TYPES.USER,
    getDetails: (args) => ({ email: args[0].email }),
    skipOnError: false
  })
  async login(
    @Body() loginDto: LoginDto,
    @GetIpAddress() ipAddress?: string,
    @GetUserAgent() userAgent?: string
  ) {
    return await this.authV2Service.login(loginDto.email, loginDto.password);
  }

  // 用戶註冊
  @Post('register')
  @Audit({
    action: AUDIT_ACTIONS.USER_REGISTER,
    entityType: AUDIT_ENTITY_TYPES.USER,
    getDetails: (args) => ({ 
      email: args[0].email,
      displayName: args[0].displayName,
      roleType: args[0].roleType
    })
  })
  async register(@Body() registerDto: RegisterDto) {
    return await this.authV2Service.register(
      registerDto.email,
      registerDto.displayName,
      registerDto.password,
      registerDto.roleType
    );
  }

  // 獲取當前用戶資訊
  @UseGuards(AuthGuard('jwt-v2'))
  @Get('profile')
  async getProfile(@Request() req) {
    const userInfo = await this.authV2Service.getUserWithRoles(req.user.id);
    return {
      id: req.user.id,
      email: req.user.email,
      displayName: req.user.displayName,
      roles: userInfo.roles,
      permissions: userInfo.permissions,
      singerId: userInfo.singerId,
      playerId: userInfo.playerId,
      eventIds: userInfo.eventIds
    };
  }

  // 刷新 token
  @UseGuards(AuthGuard('jwt-v2'))
  @Post('refresh')
  async refreshToken(@Request() req) {
    return await this.authV2Service.refreshToken(req.user.id);
  }

  // 更新用戶角色（僅高層管理員）
  @UseGuards(AuthGuard('jwt-v2'), RBACGuard)
  @RequirePermission(ENTITIES.USER, ACTIONS.UPDATE)
  @Post('update-role')
  @Audit({
    action: AUDIT_ACTIONS.USER_UPDATE_ROLE,
    entityType: AUDIT_ENTITY_TYPES.USER,
    getEntityId: (args) => args[1].targetUserId,
    getDetails: (args) => ({
      targetUserId: args[1].targetUserId,
      newRoles: args[1].roles
    }),
    sensitive: true
  })
  async updateUserRole(@Request() req, @Body() updateRoleDto: UpdateRoleDto) {
    return await this.authV2Service.updateUserRole(
      req.user.id,
      updateRoleDto.targetUserId,
      updateRoleDto.roles
    );
  }

  // 代理登入（僅高層管理員，用於除錯）
  @UseGuards(AuthGuard('jwt-v2'), RBACGuard)
  @RequirePermission(ENTITIES.USER, ACTIONS.PROXY)
  @Post('proxy-login')
  @Audit({
    action: AUDIT_ACTIONS.USER_PROXY_LOGIN,
    entityType: AUDIT_ENTITY_TYPES.USER,
    getEntityId: (args) => args[1].targetUserId,
    getDetails: (args) => ({
      targetUserId: args[1].targetUserId
    }),
    sensitive: true
  })
  async proxyLogin(@Request() req, @Body() body: { targetUserId: number }) {
    const userWithRoles = await this.authV2Service.getUserWithRoles(body.targetUserId);
    
    return {
      message: '代理登入成功',
      proxyUser: {
        id: body.targetUserId,
        roles: userWithRoles.roles,
        permissions: userWithRoles.permissions
      },
      operator: {
        id: req.user.id,
        displayName: req.user.displayName
      }
    };
  }
}