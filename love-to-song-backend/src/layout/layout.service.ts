// file: love-to-song-backend/src/layout/layout.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LayoutService {
  constructor(private prisma: PrismaService) {}

  // Get layout JSON for a user, or null if not exists
  async getLayoutByUser(userId: number) {
    // TODO: Add Layout model to Prisma schema
    return null;
  }

  // Save or update layout JSON for a user
  async saveLayout(userId: number, layoutJson: string) {
    // TODO: Add Layout model to Prisma schema
    return { success: true };
  }
}
