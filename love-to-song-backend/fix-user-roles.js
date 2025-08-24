const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixUserRoles() {
  try {
    console.log('=== 修復用戶角色 ===');
    
    // 獲取所有角色的ID
    const roles = await prisma.role.findMany();
    const roleMap = {};
    roles.forEach(role => {
      roleMap[role.name] = role.id;
    });

    console.log('角色對應:', roleMap);

    // 需要修復的用戶角色映射
    const userRoleMappings = [
      { email: 'host@test.com', roleName: 'HOST_ADMIN' },
      { email: 'singer@test.com', roleName: 'SINGER' },
      { email: 'player@test.com', roleName: 'PLAYER' },
      { email: 'guest@test.com', roleName: 'GUEST' }
    ];

    for (const mapping of userRoleMappings) {
      const user = await prisma.user.findUnique({
        where: { email: mapping.email }
      });

      if (user) {
        // 檢查是否已經有角色
        const existingUserRole = await prisma.userRole.findFirst({
          where: { userId: user.id }
        });

        if (!existingUserRole) {
          // 創建用戶角色關聯
          await prisma.userRole.create({
            data: {
              userId: user.id,
              roleId: roleMap[mapping.roleName]
            }
          });
          
          console.log(`已為用戶 ${mapping.email} 分配角色 ${mapping.roleName}`);
        } else {
          console.log(`用戶 ${mapping.email} 已有角色，跳過`);
        }
      } else {
        console.log(`找不到用戶 ${mapping.email}`);
      }
    }

    // 驗證修復結果
    console.log('\n=== 驗證修復結果 ===');
    const users = await prisma.user.findMany({
      where: {
        email: {
          in: ['host@test.com', 'singer@test.com', 'player@test.com', 'guest@test.com']
        }
      },
      include: {
        userRoles: {
          include: {
            role: true
          }
        }
      }
    });

    users.forEach(user => {
      console.log(`${user.email}: ${user.userRoles.map(ur => ur.role.name).join(', ')}`);
    });

  } catch (error) {
    console.error('修復用戶角色時發生錯誤:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixUserRoles();