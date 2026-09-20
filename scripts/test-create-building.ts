import { dbService, prisma } from '../src/lib/db';

async function testBuildingCreation() {
  console.log('🧪 TESTING dbService.createBuilding DIRECTLY AGAINST DATABASE...');
  try {
    const testName = `DB_DIRECT_TEST_${Date.now()}`;
    console.log(`Attempting to create building '${testName}'...`);
    
    // Call prisma directly first
    try {
      const direct = await prisma.building.create({
        data: {
          id: `bld-test-${Date.now()}`,
          name: testName,
          address: 'Direct DB Test Address',
          floors: {
            create: [
              { number: 1 },
              { number: 2 }
            ]
          }
        },
        include: { floors: true }
      });
      console.log('✅ Direct Prisma building creation SUCCESS:', direct);
    } catch (directErr: any) {
      console.error('❌ Direct Prisma building creation FAILED:', directErr);
    }

    // Call dbService.createBuilding
    const bld = await dbService.createBuilding(testName, '123 Test Street', 3);
    console.log('Result from dbService.createBuilding:', bld);

    // Verify DB list
    const all = await dbService.getBuildings();
    console.log(`Total buildings in getBuildings(): ${all.length}`);
    console.log('Building names:', all.map(b => b.name));

  } catch (err: any) {
    console.error('Fatal test error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

testBuildingCreation();
