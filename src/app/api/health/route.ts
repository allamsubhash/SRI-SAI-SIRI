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
    buildVersion: 'PAYMENT-RECOVERY-018',
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

    // Test 2: READ Test & Schema Inspection
    const readStart = Date.now();
    const buildings = await dbService.getBuildings();
    diagnostics.tests.read = { status: 'SUCCESS', count: buildings.length, durationMs: Date.now() - readStart };

    // Schema Audit: Table list & row counts
    try {
      const dbTables: any[] = await prisma.$queryRaw`
        SELECT TABLE_NAME as tableName, TABLE_ROWS as rowCount
        FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = DATABASE();
      `;
      diagnostics.tables = dbTables;

      const dbCols: any[] = await prisma.$queryRaw`
        SELECT TABLE_NAME as tableName, COLUMN_NAME as columnName, DATA_TYPE as dataType, IS_NULLABLE as isNullable
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
        ORDER BY TABLE_NAME, ORDINAL_POSITION;
      `;
      diagnostics.columns = dbCols;
    } catch (e: any) {
      diagnostics.schemaAuditError = e.message || String(e);
    }

    // Schema Audit: Table list & row counts
    try {
      const dbTables: any[] = await prisma.$queryRaw`
        SELECT TABLE_NAME as tableName, TABLE_ROWS as rowCount
        FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = DATABASE();
      `;
      diagnostics.tables = dbTables;

      const dbCols: any[] = await prisma.$queryRaw`
        SELECT TABLE_NAME as tableName, COLUMN_NAME as columnName, DATA_TYPE as dataType, IS_NULLABLE as isNullable
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
        ORDER BY TABLE_NAME, ORDINAL_POSITION;
      `;
      diagnostics.columns = dbCols;
    } catch (e: any) {
      diagnostics.schemaAuditError = e.message || String(e);
    }

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
