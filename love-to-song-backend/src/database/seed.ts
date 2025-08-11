// 資料庫初始化種子數據
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { ROLES, ROLE_PERMISSIONS } from '../auth/rbac-abac.system';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 開始初始化資料庫...');

  // 1. 創建基本角色
  await createRoles();
  
  // 2. 創建管理員用戶
  await createAdminUsers();
  
  // 3. 創建基本標籤
  await createBasicTags();
  
  // 4. 創建測試活動
  await createTestEvent();

  console.log('✅ 資料庫初始化完成！');
}

async function createRoles() {
  console.log('📋 創建基本角色...');
  
  const roles = [
    {
      name: ROLES.SUPER_ADMIN,
      displayName: '高層管理員',
      description: '系統最高權限，可管理所有功能',
      permissions: JSON.stringify(ROLE_PERMISSIONS[ROLES.SUPER_ADMIN])
    },
    {
      name: ROLES.HOST_ADMIN,
      displayName: '主持管理',
      description: '活動主持管理，可管理活動和點歌流程',
      permissions: JSON.stringify(ROLE_PERMISSIONS[ROLES.HOST_ADMIN])
    },
    {
      name: ROLES.SINGER,
      displayName: '歌手',
      description: '歌手角色，可管理自己的歌單和接受點歌',
      permissions: JSON.stringify(ROLE_PERMISSIONS[ROLES.SINGER])
    },
    {
      name: ROLES.PLAYER,
      displayName: '玩家',
      description: '一般用戶，可點歌和提交願望歌',
      permissions: JSON.stringify(ROLE_PERMISSIONS[ROLES.PLAYER])
    },
    {
      name: ROLES.GUEST,
      displayName: '訪客',
      description: '訪客用戶，僅可瀏覽公開資訊',
      permissions: JSON.stringify(ROLE_PERMISSIONS[ROLES.GUEST])
    }
  ];

  for (const roleData of roles) {
    await prisma.role.upsert({
      where: { name: roleData.name },
      update: roleData,
      create: roleData,
    });
    console.log(`  ✓ 創建角色: ${roleData.displayName}`);
  }
}

async function createAdminUsers() {
  console.log('👤 創建管理員用戶...');
  
  const users = [
    {
      email: 'superadmin@demo.com',
      displayName: '系統管理員',
      password: '123456',
      role: ROLES.SUPER_ADMIN
    },
    {
      email: 'host@demo.com', 
      displayName: '主持人',
      password: '123456',
      role: ROLES.HOST_ADMIN
    },
    {
      email: 'singer@demo.com',
      displayName: '歌手演示',
      password: '123456',
      role: ROLES.SINGER
    },
    {
      email: 'player@demo.com',
      displayName: '玩家演示', 
      password: '123456',
      role: ROLES.PLAYER
    },
    {
      email: 'guest@demo.com',
      displayName: '訪客演示',
      password: '123456',
      role: ROLES.GUEST
    }
  ];

  for (const userData of users) {
    try {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      // 創建用戶
      const user = await prisma.user.upsert({
        where: { email: userData.email },
        update: {
          displayName: userData.displayName,
          password: hashedPassword,
          status: 'ACTIVE'
        },
        create: {
          email: userData.email,
          displayName: userData.displayName,
          password: hashedPassword,
          status: 'ACTIVE'
        }
      });

      // 獲取角色
      const role = await prisma.role.findUnique({
        where: { name: userData.role }
      });

      if (role) {
        // 分配角色
        await prisma.userRole.upsert({
          where: { 
            userId_roleId: {
              userId: user.id,
              roleId: role.id
            }
          },
          update: {},
          create: {
            userId: user.id,
            roleId: role.id
          }
        });

        // 如果是歌手，創建 Singer 記錄
        if (userData.role === ROLES.SINGER) {
          await prisma.singer.upsert({
            where: { userId: user.id },
            update: {
              stageName: userData.displayName,
              bio: '演示歌手，專業演唱各類歌曲',
              isActive: true
            },
            create: {
              userId: user.id,
              stageName: userData.displayName,
              bio: '演示歌手，專業演唱各類歌曲',
              isActive: true
            }
          });
        }

        console.log(`  ✓ 創建用戶: ${userData.displayName} (${userData.email})`);
      }

    } catch (error) {
      if (error.code === 'P2002') {
        console.log(`  ⚠️ 用戶已存在: ${userData.email}`);
      } else {
        console.error(`  ❌ 創建用戶失敗: ${userData.email}`, error.message);
      }
    }
  }
}

async function createBasicTags() {
  console.log('🏷️ 創建基本標籤...');
  
  const tags = [
    // 曲風標籤
    { name: '流行', type: 'GENRE' as const, description: '流行音樂' },
    { name: '搖滾', type: 'GENRE' as const, description: '搖滾音樂' },
    { name: '民謠', type: 'GENRE' as const, description: '民謠音樂' },
    { name: 'R&B', type: 'GENRE' as const, description: 'R&B 音樂' },
    { name: '爵士', type: 'GENRE' as const, description: '爵士音樂' },
    
    // 語言標籤
    { name: '國語', type: 'LANGUAGE' as const, description: '國語歌曲' },
    { name: '台語', type: 'LANGUAGE' as const, description: '台語歌曲' },
    { name: '粵語', type: 'LANGUAGE' as const, description: '粵語歌曲' },
    { name: '英語', type: 'LANGUAGE' as const, description: '英語歌曲' },
    { name: '日語', type: 'LANGUAGE' as const, description: '日語歌曲' },
    
    // 年代標籤
    { name: '60年代', type: 'ERA' as const, description: '1960年代歌曲' },
    { name: '70年代', type: 'ERA' as const, description: '1970年代歌曲' },
    { name: '80年代', type: 'ERA' as const, description: '1980年代歌曲' },
    { name: '90年代', type: 'ERA' as const, description: '1990年代歌曲' },
    { name: '2000年代', type: 'ERA' as const, description: '2000年代歌曲' },
    { name: '2010年代', type: 'ERA' as const, description: '2010年代歌曲' },
    { name: '2020年代', type: 'ERA' as const, description: '2020年代歌曲' },
  ];

  for (const tagData of tags) {
    await prisma.tag.upsert({
      where: { name: tagData.name },
      update: tagData,
      create: tagData,
    });
  }
  
  console.log(`  ✓ 創建了 ${tags.length} 個標籤`);
}

async function createTestEvent() {
  console.log('🎪 創建測試活動...');
  
  // 找到主持人用戶
  const hostUser = await prisma.user.findFirst({
    where: {
      userRoles: {
        some: {
          role: {
            name: ROLES.HOST_ADMIN
          }
        }
      }
    }
  });

  if (hostUser) {
    const event = await prisma.event.upsert({
      where: { id: 1 },
      update: {
        title: '演示 KTV 場次',
        venue: '演示 KTV 包廂 A',
        startsAt: new Date(),
        endsAt: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4小時後
        hostUserId: hostUser.id,
        status: 'ACTIVE',
        description: '這是一個演示活動，用於測試點歌系統的各種功能'
      },
      create: {
        title: '演示 KTV 場次',
        venue: '演示 KTV 包廂 A',
        startsAt: new Date(),
        endsAt: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4小時後
        hostUserId: hostUser.id,
        status: 'ACTIVE',
        description: '這是一個演示活動，用於測試點歌系統的各種功能'
      }
    });

    // 將歌手加入活動
    const singer = await prisma.singer.findFirst();
    if (singer) {
      await prisma.eventSinger.upsert({
        where: {
          eventId_singerId: {
            eventId: event.id,
            singerId: singer.id
          }
        },
        update: {},
        create: {
          eventId: event.id,
          singerId: singer.id
        }
      });
    }

    console.log(`  ✓ 創建測試活動: ${event.title}`);
  }
}

main()
  .catch((e) => {
    console.error('❌ 初始化失敗:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });