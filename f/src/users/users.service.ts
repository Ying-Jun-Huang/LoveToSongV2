// file: love-to-song-backend/src/users/users.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, UserRole } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // Find a user by username (for login)
  async findByUsername(username: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { username },
    });
  }

  // Create a new user (registration)
  async createUser(username: string, passwordHash: string, role: UserRole): Promise<User> {
    return this.prisma.user.create({
      data: { username, password: passwordHash, role }
    });
  }

  // Other utility methods, e.g., findById, etc., could be added as needed.
}
