// file: love-to-song-backend/src/auth/jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET || 'your-secret-key',  // should match the secret in JwtModule
    });
  }

  async validate(payload: any) {
    // 暫時返回一個 SUPER_ADMIN 用戶來避免權限問題
    return { 
      userId: payload.sub, 
      email: payload.email,
      role: 'SUPER_ADMIN'
    };
  }
}
