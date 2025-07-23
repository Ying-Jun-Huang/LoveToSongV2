// file: love-to-song-backend/src/layout/layout.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LayoutService {
  constructor(private prisma: PrismaService) {}

  // Get layout JSON for a user, or null if not exists
  async getLayoutByUser(userId: number) {
    const layoutRecord = await this.prisma.layout.findUnique({
      where: { userId }
    });
    return layoutRecord ? layoutRecord.layoutJson : null;
  }

  // Save or update layout JSON for a user
  async saveLayout(userId: number, layoutJson: string) {
    // Upsert (create if not exists, otherwise update)
    return this.prisma.layout.upsert({
      where: { userId },
      update: { layoutJson },
      create: { userId, layoutJson }
    });
  }
}
