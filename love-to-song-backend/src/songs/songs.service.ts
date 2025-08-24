// file: love-to-song-backend/src/songs/songs.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Song } from '@prisma/client';

@Injectable()
export class SongsService {
  constructor(private prisma: PrismaService) {}

  // Get all songs with singer information (songs that singers can sing)
  async getAllSongs() {
    const singerSongs = await this.prisma.singerSong.findMany({
      include: {
        song: true,
        singer: {
          include: {
            user: true
          }
        }
      }
    });
    
    // Transform to include singer information with the songs
    return singerSongs.map(ss => ({
      id: ss.song.id,
      title: ss.song.title,
      originalArtist: ss.song.originalArtist,
      language: ss.song.language,
      era: ss.song.era,
      learned: ss.learned,
      timesRequested: ss.timesRequested,
      notes: ss.notes,
      singer: {
        id: ss.singer.id,
        stageName: ss.singer.stageName,
        displayName: ss.singer.user?.displayName
      },
      createdAt: ss.song.createdAt,
      updatedAt: ss.song.updatedAt
    }));
  }

  // Add a new song (Note: userId is not stored in Song model as per schema)
  async addSong(title: string, originalArtist: string): Promise<Song> {
    return this.prisma.song.create({
      data: { title, originalArtist }
    });
  }

  // Note: Song model doesn't have userId field, so this method needs to be implemented differently
  // Perhaps through requests or singerSongs relationship
  async getSongsByUser(userId: number): Promise<Song[]> {
    // Return songs that this user has requested
    const requests = await this.prisma.request.findMany({
      where: { userId },
      include: { song: true },
      distinct: ['songId']
    });
    
    return requests.map(req => req.song);
  }

  // Remove a singer's ability to sing a song (just remove the SingerSong relationship)
  async removeSingerSong(songId: number, singerId: number) {
    // Only remove the specific singer-song relationship
    const deletedSingerSong = await this.prisma.singerSong.deleteMany({
      where: { 
        songId: songId,
        singerId: singerId 
      }
    });
    
    return { 
      message: `Removed singer ${singerId} from song ${songId}`,
      deletedCount: deletedSingerSong.count 
    };
  }

  // Delete entire song (admin only - affects all singers)
  async deleteSong(songId: number): Promise<Song> {
    // Note: When deleting a song, we should also clean up related records
    // First delete related records to avoid foreign key constraints
    await this.prisma.request.deleteMany({
      where: { songId }
    });
    
    await this.prisma.singerSong.deleteMany({
      where: { songId }
    });
    
    await this.prisma.songVersion.deleteMany({
      where: { songId }
    });
    
    // Then delete the song itself
    return this.prisma.song.delete({
      where: { id: songId }
    });
  }
}
