const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    // 創建測試用戶
    const hashedPassword = await bcrypt.hash('123456', 10);
    
    const user = await prisma.user.create({
      data: {
        email: 'demo@demo.com',
        username: 'demo',
        password: hashedPassword,
        description: '演示帳號',
      },
    });

    console.log('✅ 測試用戶創建成功！');
    console.log('📧 Email:', user.email);
    console.log('👤 用戶名:', user.username);
    console.log('🔑 密碼: 123456');
    console.log('🆔 用戶 ID:', user.id);

  } catch (error) {
    if (error.code === 'P2002') {
      console.log('⚠️  用戶已存在，使用現有帳號:');
      console.log('📧 Email: demo@demo.com');
      console.log('🔑 密碼: 123456');
    } else {
      console.error('❌ 創建用戶失敗:', error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();