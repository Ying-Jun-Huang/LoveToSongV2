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
  async register(@Body() body: { email: string, displayName: string, password: string }) {
    const { email, displayName, password } = body;
    
    // Check if user with email already exists
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new Error('Email already registered');
    }
    
    // Check if displayName already exists
    const existingDisplayName = await this.usersService.findByDisplayName(displayName);
    if (existingDisplayName) {
      throw new Error('Display name already taken');
    }
    
    try {
      const hash = await bcrypt.hash(password, 10);
      const user = await this.usersService.createUser(email, displayName, hash);
      // Do not return password hash
      return { id: user.id, displayName: user.displayName, email: user.email };
    } catch (error) {
      // Handle Prisma constraint errors
      if (error.code === 'P2002') {
        const field = error.meta?.target?.[0];
        throw new Error(`${field} already exists`);
      }
      throw error;
    }
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
  async updateProfile(@Request() req, @Body() body: { displayName?: string, avatarUrl?: string }) {
    const userId = req.user.id;
    const updatedUser = await this.usersService.updateUser(userId, body);
    // Do not return password hash
    const { password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  // Update user status (僅超級管理員)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @Patch(':id/status')
  async updateUserStatus(@Request() req, @Body() body: { status: string }) {
    const { id } = req.params;
    const updatedUser = await this.usersService.updateUserStatus(parseInt(id), body.status);
    const { password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }
}
