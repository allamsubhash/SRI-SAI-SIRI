import { dbService } from '../src/lib/db';

async function testPrismaRoom() {
  try {
    const buildings = await dbService.getBuildings();
    console.log('Buildings count:', buildings.length);
    if (buildings.length > 0 && buildings[0].floors?.length > 0) {
      const floorId = buildings[0].floors[0].id;
      console.log('Target Floor ID:', floorId);
      const res = await dbService.createRoom(floorId, 'R-101', 'AC Double', 8500, 2, 'AC,Wifi');
      console.log('Created room result:', JSON.stringify(res));
    }
  } catch (e: any) {
    console.error('Test script error:', e);
  }
}

testPrismaRoom();
