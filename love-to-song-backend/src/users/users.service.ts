// file: love-to-song-backend/src/users/users.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // Find a user by email (for login)
  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  // Find a user by username
  async findByUsername(username: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { username },
    });
  }

  // Create a new user (registration)
  async createUser(email: string, username: string, passwordHash: string): Promise<User> {
    return this.prisma.user.create({
      data: { email, username, password: passwordHash }
    });
  }

  // Find user by ID
  async findById(id: number): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  // Get all users (for admin management)
  async getAllUsers(): Promise<User[]> {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        description: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  // Update user profile
  async updateUser(id: number, data: { username?: string, description?: string, avatar?: string }): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: data,
    });
  }

  // Update user role (admin only)
  async updateUserRole(id: number, role: string): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: { role },
    });
  }
}
