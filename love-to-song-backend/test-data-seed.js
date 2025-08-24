const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seed() {
  try {
    console.log('Starting seed...');
    
    // Create roles first
    const adminRole = await prisma.role.upsert({
      where: { name: 'ADMIN' },
      update: {},
      create: {
        name: 'ADMIN',
        displayName: '管理員',
        description: 'System administrator',
        permissions: JSON.stringify(['USER_MANAGEMENT', 'SINGER_MANAGEMENT', 'EVENT_MANAGEMENT', 'SONG_MANAGEMENT', 'SYSTEM_SETTINGS', 'SONG_REQUEST'])
      }
    });

    const singerRole = await prisma.role.upsert({
      where: { name: 'SINGER' },
      update: {},
      create: {
        name: 'SINGER',
        displayName: '歌手',
        description: 'Singer/Performer',
        permissions: JSON.stringify(['SONG_MANAGEMENT', 'SONG_REQUEST', 'WISH_SONG_RESPONSE'])
      }
    });

    const playerRole = await prisma.role.upsert({
      where: { name: 'PLAYER' },
      update: {},
      create: {
        name: 'PLAYER',
        displayName: '玩家',
        description: 'Player/Audience member',
        permissions: JSON.stringify(['SONG_REQUEST', 'WISH_SONG_SUBMIT'])
      }
    });

    // Create test users
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@demo.com' },
      update: {},
      create: {
        email: 'admin@demo.com',
        password: hashedPassword,
        displayName: '系統管理員',
        status: 'ACTIVE',
      }
    });

    const singerUser1 = await prisma.user.upsert({
      where: { email: 'singer1@demo.com' },
      update: {},
      create: {
        email: 'singer1@demo.com',
        password: hashedPassword,
        displayName: '張小美',
        status: 'ACTIVE',
      }
    });

    const singerUser2 = await prisma.user.upsert({
      where: { email: 'singer2@demo.com' },
      update: {},
      create: {
        email: 'singer2@demo.com',
        password: hashedPassword,
        displayName: '李大明',
        status: 'ACTIVE',
      }
    });

    const playerUser = await prisma.user.upsert({
      where: { email: 'player@demo.com' },
      update: {},
      create: {
        email: 'player@demo.com',
        password: hashedPassword,
        displayName: '王小玩',
        status: 'ACTIVE',
      }
    });

    // Assign roles to users
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: adminUser.id, roleId: adminRole.id } },
      update: {},
      create: { userId: adminUser.id, roleId: adminRole.id }
    });

    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: singerUser1.id, roleId: singerRole.id } },
      update: {},
      create: { userId: singerUser1.id, roleId: singerRole.id }
    });

    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: singerUser2.id, roleId: singerRole.id } },
      update: {},
      create: { userId: singerUser2.id, roleId: singerRole.id }
    });

    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: playerUser.id, roleId: playerRole.id } },
      update: {},
      create: { userId: playerUser.id, roleId: playerRole.id }
    });

    // Create singers
    const singer1 = await prisma.singer.upsert({
      where: { userId: singerUser1.id },
      update: {},
      create: {
        userId: singerUser1.id,
        stageName: '小美',
        bio: '專長：流行歌曲、抒情歌',
        isActive: true,
      }
    });

    const singer2 = await prisma.singer.upsert({
      where: { userId: singerUser2.id },
      update: {},
      create: {
        userId: singerUser2.id,
        stageName: '大明',
        bio: '專長：搖滾、經典老歌',
        isActive: true,
      }
    });

    // Create player
    await prisma.player.upsert({
      where: { userId: playerUser.id },
      update: {},
      create: {
        userId: playerUser.id,
        name: '王小玩',
        level: '新手',
        isActive: true,
      }
    });

    // Create some songs
    const songs = [
      { title: '愛你', originalArtist: '王心凌', language: '中文' },
      { title: '小幸運', originalArtist: '田馥甄', language: '中文' },
      { title: '演員', originalArtist: '薛之謙', language: '中文' },
      { title: '告白氣球', originalArtist: '周杰倫', language: '中文' },
      { title: 'Someone Like You', originalArtist: 'Adele', language: '英文' },
      { title: 'Shape of You', originalArtist: 'Ed Sheeran', language: '英文' },
      { title: '千千萬萬', originalArtist: '黃品源', language: '中文' },
      { title: '月亮代表我的心', originalArtist: '鄧麗君', language: '中文' },
    ];

    const createdSongs = [];
    for (const songData of songs) {
      // Check if song exists first
      const existingSong = await prisma.song.findFirst({
        where: {
          title: songData.title,
          originalArtist: songData.originalArtist
        }
      });
      
      let song;
      if (existingSong) {
        song = existingSong;
      } else {
        song = await prisma.song.create({ data: songData });
      }
      createdSongs.push(song);
    }

    // Assign songs to singers
    // Singer 1 (小美) - 流行歌曲
    await prisma.singerSong.upsert({
      where: { singerId_songId: { singerId: singer1.id, songId: createdSongs[0].id } },
      update: {},
      create: { singerId: singer1.id, songId: createdSongs[0].id, learned: true, timesRequested: 5 }
    });

    await prisma.singerSong.upsert({
      where: { singerId_songId: { singerId: singer1.id, songId: createdSongs[1].id } },
      update: {},
      create: { singerId: singer1.id, songId: createdSongs[1].id, learned: true, timesRequested: 8 }
    });

    await prisma.singerSong.upsert({
      where: { singerId_songId: { singerId: singer1.id, songId: createdSongs[2].id } },
      update: {},
      create: { singerId: singer1.id, songId: createdSongs[2].id, learned: false, timesRequested: 2 }
    });

    await prisma.singerSong.upsert({
      where: { singerId_songId: { singerId: singer1.id, songId: createdSongs[4].id } },
      update: {},
      create: { singerId: singer1.id, songId: createdSongs[4].id, learned: true, timesRequested: 3 }
    });

    // Singer 2 (大明) - 搖滾經典
    await prisma.singerSong.upsert({
      where: { singerId_songId: { singerId: singer2.id, songId: createdSongs[3].id } },
      update: {},
      create: { singerId: singer2.id, songId: createdSongs[3].id, learned: true, timesRequested: 10 }
    });

    await prisma.singerSong.upsert({
      where: { singerId_songId: { singerId: singer2.id, songId: createdSongs[5].id } },
      update: {},
      create: { singerId: singer2.id, songId: createdSongs[5].id, learned: true, timesRequested: 6 }
    });

    await prisma.singerSong.upsert({
      where: { singerId_songId: { singerId: singer2.id, songId: createdSongs[6].id } },
      update: {},
      create: { singerId: singer2.id, songId: createdSongs[6].id, learned: true, timesRequested: 4 }
    });

    await prisma.singerSong.upsert({
      where: { singerId_songId: { singerId: singer2.id, songId: createdSongs[7].id } },
      update: {},
      create: { singerId: singer2.id, songId: createdSongs[7].id, learned: false, timesRequested: 1 }
    });

    // Create a test event
    const event = await prisma.event.upsert({
      where: { id: 1 },
      update: {},
      create: {
        title: '週末歌唱會',
        venue: 'KTV包廂',
        startsAt: new Date('2025-08-15T19:00:00Z'),
        endsAt: new Date('2025-08-15T23:00:00Z'),
        hostUserId: adminUser.id,
        status: 'ACTIVE',
        description: '測試活動 - 歌唱會'
      }
    });

    console.log('✅ Seed completed successfully!');
    console.log('📊 Created:');
    console.log(`   - 3 roles: ADMIN, SINGER, PLAYER`);
    console.log(`   - 4 users: admin@demo.com, singer1@demo.com, singer2@demo.com, player@demo.com`);
    console.log(`   - 2 singers: 小美, 大明`);  
    console.log(`   - 1 player: 王小玩`);
    console.log(`   - ${createdSongs.length} songs`);
    console.log(`   - 8 singer-song relationships`);
    console.log(`   - 1 event`);
    console.log('🔑 All users have password: password123');

  } catch (error) {
    console.error('❌ Seed failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function if this file is executed directly
if (require.main === module) {
  seed();
}

module.exports = seed;