// file: love-to-song-backend/src/songs/songs.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Song } from '@prisma/client';

@Injectable()
export class SongsService {
  constructor(private prisma: PrismaService) {}

  // Get all songs
  async getAllSongs(): Promise<Song[]> {
    return this.prisma.song.findMany();
  }

  // Add a new song (by a user)
  async addSong(title: string, artist: string, userId: number): Promise<Song> {
    return this.prisma.song.create({
      data: { title, artist, userId }
    });
  }

  // Get songs by user
  async getSongsByUser(userId: number): Promise<Song[]> {
    return this.prisma.song.findMany({
      where: { userId }
    });
  }
}
