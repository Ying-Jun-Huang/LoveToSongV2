const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('檢查並創建測試數據...');
  
  // 檢查是否有 Player 數據
  const playerCount = await prisma.player.count();
  console.log('現有玩家數量:', playerCount);
  
  if (playerCount === 0) {
    console.log('創建測試玩家數據...');
    
    // 創建一些測試玩家
    const players = await prisma.player.createMany({
      data: [
        {
          name: '王小明',
          nickname: '小明',
          level: '新手',
          birthday: new Date('1990-05-15'),
          notes: '愛好抒情歌曲'
        },
        {
          name: '李小華',
          nickname: '華華',
          level: '中級',
          birthday: new Date('1992-08-20'),
          notes: '喜歡流行音樂'
        },
        {
          name: '張大偉',
          nickname: '大偉',
          level: '高手',
          birthday: new Date('1988-12-10'),
          notes: '常點英文歌'
        },
        {
          name: '陳美麗',
          nickname: '美麗',
          level: '新手',
          birthday: new Date('1995-03-25'),
          notes: '喜歡日韓歌曲'
        }
      ]
    });
    
    console.log('創建了', players.count, '個測試玩家');
  }
  
  // 顯示所有玩家
  const allPlayers = await prisma.player.findMany();
  console.log('所有玩家:');
  allPlayers.forEach(player => {
    console.log(`- ${player.name} (${player.nickname}) - ${player.level} - ${player.notes}`);
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });