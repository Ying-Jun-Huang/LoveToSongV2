// file: love-to-song-backend/src/auth/auth.controller.ts
import { Controller, Post, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './local-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // Login endpoint - uses LocalAuthGuard to validate user first
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req) {
    // If we're here, user is validated and attached to req.user
    return this.authService.login(req.user);
  }
}
