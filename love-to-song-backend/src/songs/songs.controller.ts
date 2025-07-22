// file: love-to-song-backend/src/songs/songs.controller.ts
import { Controller, Get, Post, Body, Request, UseGuards, ForbiddenException } from '@nestjs/common';
import { SongsService } from './songs.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('songs')
@UseGuards(JwtAuthGuard)  // all routes here require a valid JWT
export class SongsController {
  constructor(private songsService: SongsService) {}

  // Get list of songs (for any authenticated user)
  @Get()
  async getSongs() {
    return this.songsService.getAllSongs();
  }

  // Add a new song (only singers should use this)
  @Post()
  async addSong(@Body() body: { title: string, artist: string }, @Request() req) {
    // Allow only users with role 'SINGER' to add songs
    if (req.user.role !== 'SINGER') {
      throw new ForbiddenException('Only singers can add songs.');
    }
    const { title, artist } = body;
    return this.songsService.addSong(title, artist, req.user.userId);
  }

  // Request a song (any authenticated user, likely a player)
  @Post('request')
  async requestSong(@Body() body: { songId: number }, @Request() req) {
    const { songId } = body;
    const request = await this.songsService.requestSong(songId, req.user.userId);
    return { success: true, requestId: request.id };
  }

  // (Optional) Get all requests (only singers might use this to see incoming requests)
  @Get('requests')
  async getSongRequests(@Request() req) {
    if (req.user.role !== 'SINGER') {
      throw new ForbiddenException('Only singers can view requests.');
    }
    return this.songsService.getRequests();
  }
}
