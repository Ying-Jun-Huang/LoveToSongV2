import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
// V1 Auth
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { LocalStrategy } from './local.strategy';
import { JwtStrategy } from './jwt.strategy';
// V2 Auth
import { AuthV2Service } from './auth-v2.service';
import { AuthV2Controller } from './auth-v2.controller';
import { JwtV2Strategy } from './jwt-v2.strategy';
import { RBACGuard } from './rbac-abac.guard';
import { UsersModule } from '../users/users.module';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [
    UsersModule, 
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  providers: [
    // V1 providers
    AuthService, 
    LocalStrategy, 
    JwtStrategy,
    // V2 providers
    AuthV2Service,
    JwtV2Strategy,
    RBACGuard,
    PrismaService
  ],
  controllers: [AuthController, AuthV2Controller],
  exports: [AuthV2Service, JwtV2Strategy, RBACGuard],
})
export class AuthModule {}
