const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.table.deleteMany();

  const tables = [
    { number: 1, capacity: 2, posX: 15, posY: 20, shape: 'circle' },
    { number: 2, capacity: 4, posX: 40, posY: 20, shape: 'rectangle' },
    { number: 3, capacity: 2, posX: 70, posY: 20, shape: 'circle' },
    { number: 4, capacity: 6, posX: 15, posY: 60, shape: 'rectangle' },
    { number: 5, capacity: 4, posX: 45, posY: 60, shape: 'rectangle' },
    { number: 6, capacity: 2, posX: 75, posY: 60, shape: 'circle' },
  ];

  for (const t of tables) {
    await prisma.table.create({ data: t });
  }

  console.log('База наполнена столами!');
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());