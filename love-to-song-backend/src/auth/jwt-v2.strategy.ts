import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthV2Service } from './auth-v2.service';

@Injectable()
export class JwtV2Strategy extends PassportStrategy(Strategy, 'jwt-v2') {
  constructor(private authV2Service: AuthV2Service) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
    });
  }

  async validate(payload: any) {
    // 從 JWT payload 建立完整的用戶上下文
    const authContext = await this.authV2Service.buildAuthContextFromToken(payload);
    
    // 返回用戶資訊，這會被設置到 request.user
    return {
      id: payload.sub,
      email: payload.email,
      displayName: payload.displayName,
      roles: authContext.roles,
      singerId: authContext.singerId,
      playerId: authContext.playerId,
      eventIds: authContext.eventIds,
      authContext // 完整的認證上下文
    };
  }
}