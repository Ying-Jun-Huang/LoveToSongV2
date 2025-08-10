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

  // Add a new song
  @Post()
  async addSong(@Body() body: { title: string, artist: string }, @Request() req) {
    const { title, artist } = body;
    return this.songsService.addSong(title, artist, req.user.sub);
  }

  // Get user's songs
  @Get('my')
  async getMySongs(@Request() req) {
    return this.songsService.getSongsByUser(req.user.sub);
  }
}
