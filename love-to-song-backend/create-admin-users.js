const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdminUsers() {
  try {
    const users = [
      {
        email: 'super@test.com',
        username: 'super',
        password: '123456',
        role: 'SUPER_ADMIN',
        description: '系統最高管理員',
        displayName: '高層管理員'
      },
      {
        email: 'host@test.com',
        username: 'host',
        password: '123456',
        role: 'HOST_ADMIN',
        description: '主持管理',
        displayName: '主持管理'
      },
      {
        email: 'singer@test.com',
        username: 'singer',
        password: '123456',
        role: 'SINGER',
        description: '歌手',
        displayName: '歌手'
      },
      {
        email: 'player@test.com',
        username: 'player',
        password: '123456',
        role: 'PLAYER',
        description: '玩家',
        displayName: '玩家'
      },
      {
        email: 'guest@test.com',
        username: 'guest',
        password: '123456',
        role: 'GUEST',
        description: '訪客用戶',
        displayName: '訪客'
      }
    ];

    for (const userData of users) {
      try {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        
        const user = await prisma.user.create({
          data: {
            email: userData.email,
            password: hashedPassword,
            displayName: userData.displayName,
          },
        });

        console.log(`✅ ${userData.role} 用戶創建成功！`);
        console.log(`📧 Email: ${user.email}`);
        console.log(`👤 用戶名: ${user.username}`);
        console.log(`🔑 密碼: ${userData.password}`);
        console.log(`🛡️ 角色: ${user.role}`);
        console.log(`🆔 用戶 ID: ${user.id}`);
        console.log('─'.repeat(50));

      } catch (error) {
        if (error.code === 'P2002') {
          console.log(`⚠️ ${userData.role} 用戶已存在:`);
          console.log(`📧 Email: ${userData.email}`);
          console.log(`🔑 密碼: ${userData.password}`);
          console.log('─'.repeat(50));
        } else {
          console.error(`❌ 創建 ${userData.role} 用戶失敗:`, error.message);
        }
      }
    }

    console.log('\n🎯 權限級別說明:');
    console.log('🔴 SUPER_ADMIN - 系統最高權限 (管理所有用戶角色)');
    console.log('🟠 ADMIN       - 中間管理員 (管理內容和用戶)');
    console.log('🟡 MANAGER     - 基層管理員 (日常操作管理)');
    console.log('🟢 USER        - 一般用戶 (基本功能)');
    console.log('🔵 GUEST       - 訪客 (僅瀏覽權限)');

  } catch (error) {
    console.error('❌ 創建管理員用戶失敗:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUsers();