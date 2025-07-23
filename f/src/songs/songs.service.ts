// file: love-to-song-backend/src/songs/songs.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Song, Request as SongRequest } from '@prisma/client';

@Injectable()
export class SongsService {
  constructor(private prisma: PrismaService) {}

  // Get all songs
  async getAllSongs(): Promise<Song[]> {
    return this.prisma.song.findMany();
  }

  // Add a new song (by a singer)
  async addSong(title: string, artist: string, addedById: number): Promise<Song> {
    return this.prisma.song.create({
      data: { title, artist, addedById }
    });
  }

  // Create a new song request
  async requestSong(songId: number, userId: number): Promise<SongRequest> {
    return this.prisma.request.create({
      data: { songId, requestedById: userId }
    });
  }

  // (Optional) List all requests (maybe for a singer to view)
  async getRequests(): Promise<SongRequest[]> {
    return this.prisma.request.findMany({ include: { song: true, requestedBy: true } });
  }
}
