import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { AuthContext, ROLES } from './rbac-abac.system';

@Injectable()
export class AuthV2Service {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  // 用戶登入
  async login(email: string, password: string) {
    // 1. 驗證用戶
    const user = await this.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('帳號或密碼錯誤');
    }

    // 2. 獲取用戶完整資訊
    const userWithRoles = await this.getUserWithRoles(user.id);
    
    // 3. 構建 JWT payload
    const payload = {
      sub: user.id,
      email: user.email,
      displayName: user.displayName,
      roles: userWithRoles.roles,
      singerId: userWithRoles.singerId,
      playerId: userWithRoles.playerId,
      eventIds: userWithRoles.eventIds
    };

    // 4. 生成 token
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        status: user.status,
        roles: userWithRoles.roles,
        permissions: userWithRoles.permissions
      }
    };
  }

  // 驗證用戶帳密
  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        userRoles: {
          include: {
            role: true
          }
        }
      }
    });

    if (!user || user.status !== 'ACTIVE') {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  // 獲取用戶完整角色和權限資訊
  async getUserWithRoles(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: true
          }
        },
        singer: true,
        player: true,
        events: true // 用戶主持的活動
      }
    });

    if (!user) {
      throw new UnauthorizedException('用戶不存在');
    }

    // 提取角色名稱
    const roles = user.userRoles.map(ur => ur.role.name);

    // 合併所有角色的權限
    const allPermissions: any[] = [];
    for (const userRole of user.userRoles) {
      if (userRole.role.permissions) {
        try {
          const rolePermissions = JSON.parse(userRole.role.permissions);
          allPermissions.push(...rolePermissions);
        } catch (error) {
          console.error('解析角色權限失敗:', error);
        }
      }
    }

    // 獲取用戶參與的活動ID（主持的活動 + 歌手參與的活動）
    const eventIds: number[] = [];
    
    // 主持的活動
    eventIds.push(...user.events.map(e => e.id));
    
    // 如果是歌手，獲取參與的活動
    if (user.singer) {
      const eventSingers = await this.prisma.eventSinger.findMany({
        where: { singerId: user.singer.id },
        select: { eventId: true }
      });
      eventIds.push(...eventSingers.map(es => es.eventId));
    }

    return {
      roles,
      permissions: allPermissions,
      singerId: user.singer?.id,
      playerId: user.player?.id,
      eventIds: [...new Set(eventIds)] // 去重
    };
  }

  // 從 JWT token 建立認證上下文
  async buildAuthContextFromToken(tokenPayload: any): Promise<AuthContext> {
    // 如果 token 中沒有最新的角色資訊，從資料庫重新獲取
    let roles = tokenPayload.roles || [];
    let eventIds = tokenPayload.eventIds || [];
    let singerId = tokenPayload.singerId;
    let playerId = tokenPayload.playerId;

    // 如果 token 較舊，重新獲取最新資訊
    if (!roles.length) {
      const userInfo = await this.getUserWithRoles(tokenPayload.sub);
      roles = userInfo.roles;
      eventIds = userInfo.eventIds;
      singerId = userInfo.singerId;
      playerId = userInfo.playerId;
    }

    return {
      userId: tokenPayload.sub,
      roles,
      eventIds,
      singerId,
      playerId
    };
  }

  // 用戶註冊
  async register(email: string, displayName: string, password: string, roleType: string = ROLES.PLAYER) {
    // 檢查用戶是否已存在
    const existingUser = await this.prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      throw new UnauthorizedException('用戶已存在');
    }

    // 加密密碼
    const hashedPassword = await bcrypt.hash(password, 10);

    // 獲取角色
    const role = await this.prisma.role.findUnique({
      where: { name: roleType }
    });

    if (!role) {
      throw new UnauthorizedException('角色不存在');
    }

    // 創建用戶
    const user = await this.prisma.user.create({
      data: {
        email,
        displayName,
        password: hashedPassword,
        status: 'ACTIVE'
      }
    });

    // 分配角色
    await this.prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: role.id
      }
    });

    // 如果是玩家角色，創建 Player 記錄
    if (roleType === ROLES.PLAYER) {
      await this.prisma.player.create({
        data: {
          userId: user.id,
          name: displayName,
          nickname: displayName,
          level: '新手',
          isActive: true
        }
      });
    }

    return { message: '註冊成功', userId: user.id };
  }

  // 更新用戶角色（僅高層管理員可用）
  async updateUserRole(adminUserId: number, targetUserId: number, newRoles: string[]) {
    // 檢查管理員權限
    const adminContext = await this.buildAuthContextFromUserId(adminUserId);
    if (!adminContext.roles.includes(ROLES.SUPER_ADMIN)) {
      throw new UnauthorizedException('權限不足');
    }

    // 刪除用戶現有角色
    await this.prisma.userRole.deleteMany({
      where: { userId: targetUserId }
    });

    // 分配新角色
    for (const roleName of newRoles) {
      const role = await this.prisma.role.findUnique({
        where: { name: roleName }
      });

      if (role) {
        await this.prisma.userRole.create({
          data: {
            userId: targetUserId,
            roleId: role.id
          }
        });
      }
    }

    return { message: '角色更新成功' };
  }

  // 從用戶ID建立認證上下文
  async buildAuthContextFromUserId(userId: number): Promise<AuthContext> {
    const userInfo = await this.getUserWithRoles(userId);
    return {
      userId,
      roles: userInfo.roles,
      eventIds: userInfo.eventIds,
      singerId: userInfo.singerId,
      playerId: userInfo.playerId
    };
  }

  // 刷新 token
  async refreshToken(userId: number) {
    const userWithRoles = await this.getUserWithRoles(userId);
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('用戶狀態異常');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      displayName: user.displayName,
      roles: userWithRoles.roles,
      singerId: userWithRoles.singerId,
      playerId: userWithRoles.playerId,
      eventIds: userWithRoles.eventIds
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        status: user.status,
        roles: userWithRoles.roles,
        permissions: userWithRoles.permissions
      }
    };
  }
}