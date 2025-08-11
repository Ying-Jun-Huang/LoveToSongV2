const { PrismaClient } = require('@prisma/client');

async function checkUsers() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 檢查資料庫中的用戶...');
    
    const users = await prisma.user.findMany({
      include: {
        userRoles: {
          include: {
            role: true
          }
        }
      }
    });
    
    if (users.length === 0) {
      console.log('❌ 資料庫中沒有用戶資料！');
      console.log('請執行: npx tsx src/database/seed.ts');
    } else {
      console.log(`✅ 找到 ${users.length} 個用戶:`);
      users.forEach(user => {
        const roles = user.userRoles.map(ur => ur.role.name).join(', ');
        console.log(`  📧 ${user.email} (${user.displayName}) - 角色: ${roles}`);
      });
      
      // 測試密碼驗證
      const bcrypt = require('bcryptjs');
      const testUser = users[0];
      const isValid = await bcrypt.compare('123456', testUser.password);
      console.log(`\n🔐 密碼 '123456' 對 ${testUser.email} 驗證結果: ${isValid ? '✅ 正確' : '❌ 錯誤'}`);
    }
    
  } catch (error) {
    console.error('❌ 檢查用戶時發生錯誤:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();