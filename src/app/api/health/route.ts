import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

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
    rawUrlLength: envUrl.length,
    tests: {}
  };

  try {
    // Test 1: Raw SELECT 1 query
    const selectOneStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    diagnostics.tests.selectOne = { status: 'SUCCESS', durationMs: Date.now() - selectOneStart };

    // Test 2: User count query
    const userStart = Date.now();
    const userCount = await prisma.user.count();
    diagnostics.tests.userCount = { status: 'SUCCESS', count: userCount, durationMs: Date.now() - userStart };

    // Test 3: Building count query
    const buildingStart = Date.now();
    const buildingCount = await prisma.building.count();
    diagnostics.tests.buildingCount = { status: 'SUCCESS', count: buildingCount, durationMs: Date.now() - buildingStart };

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
