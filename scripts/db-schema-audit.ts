import { prisma } from '../src/lib/db';

async function runSchemaAudit() {
  console.log('=== STARTING PRODUCTION DATABASE AUDIT ===\n');

  try {
    // 1. Get all tables in current database
    const tables: any[] = await prisma.$queryRaw`
      SELECT TABLE_NAME, TABLE_ROWS 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE();
    `;

    console.log('--- TABLES IN DATABASE ---');
    console.table(tables);

    // 2. Get columns for all tables
    const columns: any[] = await prisma.$queryRaw`
      SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_KEY, COLUMN_DEFAULT
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE()
      ORDER BY TABLE_NAME, ORDINAL_POSITION;
    `;

    console.log('\n--- DETAILED COLUMN METADATA ---');
    const grouped: Record<string, any[]> = {};
    for (const c of columns) {
      if (!grouped[c.TABLE_NAME]) grouped[c.TABLE_NAME] = [];
      grouped[c.TABLE_NAME].push({
        column: c.COLUMN_NAME,
        type: c.DATA_TYPE,
        nullable: c.IS_NULLABLE,
        key: c.COLUMN_KEY,
        default: c.COLUMN_DEFAULT
      });
    }

    for (const [table, cols] of Object.entries(grouped)) {
      console.log(`\nTable: ${table} (${cols.length} columns)`);
      console.table(cols);
    }

  } catch (e: any) {
    console.error('Audit query error:', e.message || e);
  }
}

runSchemaAudit();
