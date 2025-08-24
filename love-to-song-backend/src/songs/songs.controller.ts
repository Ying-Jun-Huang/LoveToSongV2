// file: love-to-song-backend/src/songs/songs.controller.ts
import { Controller, Get, Post, Body, Delete, Param, Request, UseGuards, ForbiddenException } from '@nestjs/common';
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
  async addSong(@Body() body: { title: string, originalArtist: string }, @Request() req) {
    const { title, originalArtist } = body;
    return this.songsService.addSong(title, originalArtist);
  }

  // Get user's songs
  @Get('my')
  async getMySongs(@Request() req) {
    return this.songsService.getSongsByUser(req.user.sub);
  }

  // Remove a singer's ability to sing a song (delete SingerSong relationship)
  @Delete(':songId/singer/:singerId')
  async removeSingerSong(@Param('songId') songId: string, @Param('singerId') singerId: string, @Request() req) {
    const songIdNum = parseInt(songId);
    const singerIdNum = parseInt(singerId);
    return this.songsService.removeSingerSong(songIdNum, singerIdNum);
  }

  // Delete entire song (admin only - affects all singers)
  @Delete(':id')
  async deleteSong(@Param('id') id: string, @Request() req) {
    const songId = parseInt(id);
    return this.songsService.deleteSong(songId);
  }
}
