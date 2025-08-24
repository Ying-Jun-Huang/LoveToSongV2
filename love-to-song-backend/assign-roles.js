const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function assignRoles() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'super@test.com' }
    });
    
    if (!user) {
      console.log('User not found');
      return;
    }
    
    // 檢查是否已經有角色
    const existingRole = await prisma.userRole.findFirst({
      where: { userId: user.id }
    });
    
    if (existingRole) {
      console.log('User already has a role');
      return;
    }
    
    // 創建 UserRole 關聯
    await prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: 1  // SUPER_ADMIN role ID
      }
    });
    
    console.log('Assigned SUPER_ADMIN role to super@test.com');
    
    // 驗證
    const userWithRoles = await prisma.user.findUnique({
      where: { email: 'super@test.com' },
      include: {
        userRoles: {
          include: {
            role: true
          }
        }
      }
    });
    
    console.log('User with roles:', JSON.stringify(userWithRoles, null, 2));
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

assignRoles();