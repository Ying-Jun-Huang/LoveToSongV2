// file: love-to-song-backend/src/users/users.controller.ts
import { Controller, Post, Body, UseGuards, Request, Get, Patch } from '@nestjs/common';
import { UsersService } from './users.service';
import * as bcrypt from 'bcryptjs';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles, Role } from '../auth/roles.decorator';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  // Example: Registration endpoint (open to anyone)
  @Post('register')
  async register(@Body() body: { email: string, username: string, password: string }) {
    const { email, username, password } = body;
    const hash = await bcrypt.hash(password, 10);
    const user = await this.usersService.createUser(email, username, hash);
    // Do not return password hash
    return { id: user.id, username: user.username, email: user.email };
  }

  // Get all users (僅管理員以上可查看)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  @Get()
  async getAllUsers() {
    return await this.usersService.getAllUsers();
  }

  // Example: Get my profile (所有登錄用戶)
  @UseGuards(JwtAuthGuard)
  @Roles(Role.USER, Role.MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  @Get('me')
  getProfile(@Request() req) {
    // req.user is set by JwtAuthGuard after token verification
    return req.user; 
  }

  // Update user profile (僅可更新自己的資料)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.USER, Role.MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  @Patch('me')
  async updateProfile(@Request() req, @Body() body: { username?: string, description?: string, avatar?: string }) {
    const userId = req.user.id;
    const updatedUser = await this.usersService.updateUser(userId, body);
    // Do not return password hash
    const { password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  // Update user role (僅超級管理員)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @Patch(':id/role')
  async updateUserRole(@Request() req, @Body() body: { role: Role }) {
    const { id } = req.params;
    const updatedUser = await this.usersService.updateUserRole(parseInt(id), body.role);
    const { password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }
}
