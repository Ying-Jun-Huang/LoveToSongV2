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

  // Find a user by email with roles (for login with permissions)
  async findByEmailWithRoles(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        userRoles: {
          include: {
            role: true
          }
        }
      }
    });
  }

  // Find a user by display name (replacing username)
  async findByDisplayName(displayName: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: { displayName },
    });
  }

  // Create a new user (registration)
  async createUser(email: string, displayName: string, passwordHash: string): Promise<User> {
    return this.prisma.user.create({
      data: { email, displayName, password: passwordHash }
    });
  }

  // Find user by ID
  async findById(id: number): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  // Get all users (for admin management)
  async getAllUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  // Update user profile
  async updateUser(id: number, data: { displayName?: string, avatarUrl?: string }): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: data,
    });
  }

  // Update user status (admin only)
  async updateUserStatus(id: number, status: string): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: { status: status as any },
    });
  }
}
