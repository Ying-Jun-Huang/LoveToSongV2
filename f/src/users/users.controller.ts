// file: love-to-song-backend/src/users/users.controller.ts
import { Controller, Post, Body, UseGuards, Request, Get } from '@nestjs/common';
import { UsersService } from './users.service';
import * as bcrypt from 'bcrypt';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  // Example: Registration endpoint (open to anyone)
  @Post('register')
  async register(@Body() body: { username: string, password: string, role: string }) {
    const { username, password, role } = body;
    const hash = await bcrypt.hash(password, 10);
    const user = await this.usersService.createUser(username, hash, role);
    // Do not return password hash
    return { id: user.id, username: user.username, role: user.role };
  }

  // Example: Get my profile (protected)
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@Request() req) {
    // req.user is set by JwtAuthGuard after token verification
    return req.user; 
  }
}
