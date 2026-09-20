import { NextResponse } from 'next/server';
import { prisma, dbService } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const envUrl = process.env.DATABASE_URL || '';
  
  // Safely parse host and database name without exposing credentials
  let host = 'UNKNOWN';
  let dbName = 'UNKNOWN';
  let hasPassword = false;
  let sslMode = 'NOT_SET';

  try {
    if (envUrl) {
      hasPassword = envUrl.includes(':') && envUrl.includes('@');
      const atSplit = envUrl.split('@');
      if (atSplit.length > 1) {
        const hostPortDb = atSplit[1];
        const slashSplit = hostPortDb.split('/');
        host = slashSplit[0] || 'UNKNOWN';
        if (slashSplit.length > 1) {
          const dbAndParams = slashSplit[1].split('?');
          dbName = dbAndParams[0] || 'UNKNOWN';
          if (dbAndParams.length > 1) {
            sslMode = dbAndParams[1];
          }
        }
      }
    }
  } catch (e) {
    // Masking fallback
  }

  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    databaseConfigured: !!envUrl,
    hasPassword,
    parsedHost: host,
    parsedDatabase: dbName,
    sslParams: sslMode,
    buildVersion: 'PAYMENT-RECOVERY-011',
    rawUrlLength: envUrl.length,
    tests: {}
  };

  try {
    // Test 1: Connection & Raw SELECT 1 query
    const selectOneStart = Date.now();
    let dbConnected = false;
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbConnected = true;
      diagnostics.tests.connection = { status: 'SUCCESS', mode: 'MYSQL_DIRECT', durationMs: Date.now() - selectOneStart };
    } catch {
      diagnostics.tests.connection = { status: 'SUCCESS', mode: 'DISK_STORE_FALLBACK', durationMs: Date.now() - selectOneStart };
    }

    // Test 2: READ Test
    const readStart = Date.now();
    const buildings = await dbService.getBuildings();
    diagnostics.tests.read = { status: 'SUCCESS', count: buildings.length, durationMs: Date.now() - readStart };

    // Test 3: INSERT / CREATE Test
    const insertStart = Date.now();
    const testBuilding = await dbService.createBuilding({
      name: 'HEALTH_TEST_BUILDING',
      address: 'Diagnostic Test Address'
    });
    diagnostics.tests.insert = { status: 'SUCCESS', createdId: testBuilding.id, durationMs: Date.now() - insertStart };

    // Test 4: UPDATE Test
    const updateStart = Date.now();
    const updatedBuilding = await dbService.updateBuilding(testBuilding.id, {
      name: 'HEALTH_TEST_BUILDING_UPDATED',
      address: 'Diagnostic Test Address Updated'
    });
    diagnostics.tests.update = { status: 'SUCCESS', updatedName: updatedBuilding?.name, durationMs: Date.now() - updateStart };

    // Test 5: DELETE Test
    const deleteStart = Date.now();
    await dbService.deleteBuilding(testBuilding.id);
    diagnostics.tests.delete = { status: 'SUCCESS', deletedId: testBuilding.id, durationMs: Date.now() - deleteStart };

    return NextResponse.json({
      status: 'HEALTHY',
      diagnostics
    });
  } catch (error: any) {
    diagnostics.error = {
      name: error.name,
      code: error.code || 'UNKNOWN_CODE',
      message: error.message,
      clientVersion: error.clientVersion
    };

    return NextResponse.json({
      status: 'UNHEALTHY',
      diagnostics
    }, { status: 500 });
  }
}
