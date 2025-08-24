const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('=== 檢查用戶數據 ===');
    
    const users = await prisma.user.findMany({
      include: {
        userRoles: {
          include: {
            role: true
          }
        }
      }
    });

    console.log('找到', users.length, '個用戶:');
    
    users.forEach(user => {
      console.log('\n用戶 ID:', user.id);
      console.log('Email:', user.email);
      console.log('Display Name:', user.displayName);
      console.log('密碼哈希:', user.password ? '已設定' : '未設定');
      console.log('角色:');
      if (user.userRoles && user.userRoles.length > 0) {
        user.userRoles.forEach(userRole => {
          console.log('  -', userRole.role.name);
        });
      } else {
        console.log('  - 無角色');
      }
    });

    console.log('\n=== 檢查角色數據 ===');
    const roles = await prisma.role.findMany();
    console.log('找到', roles.length, '個角色:');
    roles.forEach(role => {
      console.log('  -', role.name + ':', role.description);
    });

  } catch (error) {
    console.error('檢查用戶時發生錯誤:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();