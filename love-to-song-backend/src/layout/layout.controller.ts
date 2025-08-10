// file: love-to-song-backend/src/layout/layout.controller.ts
import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { LayoutService } from './layout.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('layout')
@UseGuards(JwtAuthGuard)  // must be logged in
export class LayoutController {
  constructor(private layoutService: LayoutService) {}

  // Get the current user's layout
  @Get()
  async getMyLayout(@Request() req) {
    const userId = req.user.userId;
    const layoutJson = await this.layoutService.getLayoutByUser(userId);
    if (!layoutJson) {
      return { layout: [], components: [] };  // if no layout saved yet
    }
    // Parse the JSON string to return as object
    return JSON.parse(layoutJson);
  }

  // Save/update the current user's layout
  @Post()
  async saveMyLayout(@Request() req, @Body() body: any) {
    const userId = req.user.userId;
    // Body is expected to contain { layout: [...], components: [...] }
    const layoutData = {
      layout: body.layout || [],
      components: body.components || []
    };
    // Convert to string for storage
    const layoutJson = JSON.stringify(layoutData);
    await this.layoutService.saveLayout(userId, layoutJson);
    return { success: true };
  }
}
