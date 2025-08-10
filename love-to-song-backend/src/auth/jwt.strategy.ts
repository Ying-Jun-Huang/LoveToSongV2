// file: love-to-song-backend/src/auth/jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: 'JWT_SECRET_KEY',  // should match the secret in JwtModule
    });
  }

  async validate(payload: any) {
    // For simplicity, the payload is returned as-is (Nest attaches it to req.user)
    // We could optionally re-fetch user from DB if needed.
    return { userId: payload.sub, username: payload.username, role: payload.role };
  }
}
