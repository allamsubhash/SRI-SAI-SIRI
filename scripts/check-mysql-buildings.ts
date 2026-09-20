import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Querying MySQL database via Prisma Client...');
  const buildings = await prisma.building.findMany({
    include: {
      floors: {
        include: {
          rooms: {
            include: {
              beds: true
            }
          }
        }
      }
    }
  });

  console.log(`Found ${buildings.length} buildings in MySQL:`);
  buildings.forEach(b => {
    console.log(` - ID: ${b.id}, Name: ${b.name}, Address: ${b.address}, Floors count: ${b.floors.length}`);
  });
  await prisma.$disconnect();
}

main().catch(err => {
  console.error('Error querying MySQL:', err);
  process.exit(1);
});
