import { PrismaClient } from '@prisma/client';

const prodUrl = process.env.DATABASE_URL;

if (!prodUrl) {
  console.error("DATABASE_URL environment variable is required.");
  process.exit(1);
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: prodUrl
    }
  }
});

async function fixAivenSchema() {
  console.log('Connecting to Aiven MySQL to apply schema DDL fixes...');
  
  // List of raw DDL statements to ensure all columns exist and text fields are TEXT
  const ddlStatements = [
    // 1. Fix Invoice itemsJson to TEXT
    `ALTER TABLE \`Invoice\` MODIFY COLUMN \`itemsJson\` TEXT NULL`,
    
    // 2. Add missing columns to Tenant table if not present
    `ALTER TABLE \`Tenant\` ADD COLUMN \`roomId\` VARCHAR(191) NULL`,
    `ALTER TABLE \`Tenant\` ADD COLUMN \`floorId\` VARCHAR(191) NULL`,
    `ALTER TABLE \`Tenant\` ADD COLUMN \`buildingId\` VARCHAR(191) NULL`,
    `ALTER TABLE \`Tenant\` ADD COLUMN \`roomNumber\` VARCHAR(191) NULL`,
    `ALTER TABLE \`Tenant\` ADD COLUMN \`bedNumber\` VARCHAR(191) NULL`,
    `ALTER TABLE \`Tenant\` ADD COLUMN \`agreementUrl\` TEXT NULL`,
    `ALTER TABLE \`Tenant\` ADD COLUMN \`medicalNotes\` TEXT NULL`,
    
    // 3. Fix Profile text columns
    `ALTER TABLE \`Profile\` MODIFY COLUMN \`photoUrl\` TEXT NULL`,
    `ALTER TABLE \`Profile\` MODIFY COLUMN \`address\` TEXT NULL`,
    
    // 4. Fix Building text columns
    `ALTER TABLE \`Building\` MODIFY COLUMN \`address\` TEXT NULL`,
    
    // 5. Fix Room text columns
    `ALTER TABLE \`Room\` MODIFY COLUMN \`amenities\` TEXT NULL`,
    `ALTER TABLE \`Room\` MODIFY COLUMN \`images\` TEXT NULL`,
    
    // 6. Fix Payment text columns
    `ALTER TABLE \`Payment\` ADD COLUMN \`notes\` TEXT NULL`,
    `ALTER TABLE \`Payment\` ADD COLUMN \`rejectionReason\` TEXT NULL`,
    `ALTER TABLE \`Payment\` ADD COLUMN \`referenceId\` VARCHAR(191) NULL`,
    
    // 7. Fix Setting value column to LONGTEXT for base64 images
    `ALTER TABLE \`Setting\` MODIFY COLUMN \`value\` LONGTEXT NULL`,

    // 8. Ensure Guideline and NotificationRead tables exist
    `CREATE TABLE IF NOT EXISTS \`Guideline\` (
      \`id\` VARCHAR(191) NOT NULL,
      \`title\` VARCHAR(191) NOT NULL,
      \`content\` TEXT NOT NULL,
      \`category\` VARCHAR(191) NULL,
      \`icon\` VARCHAR(191) NULL,
      \`order\` INT NOT NULL DEFAULT 0,
      \`isActive\` TINYINT(1) NOT NULL DEFAULT 1,
      \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
    `CREATE TABLE IF NOT EXISTS \`NotificationRead\` (
      \`id\` VARCHAR(191) NOT NULL,
      \`userId\` VARCHAR(191) NOT NULL,
      \`notificationId\` VARCHAR(191) NOT NULL,
      \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`NotificationRead_userId_notificationId_key\` (\`userId\`, \`notificationId\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
    `ALTER TABLE \`Guideline\` MODIFY COLUMN \`content\` TEXT NULL`
  ];

  for (const sql of ddlStatements) {
    try {
      await prisma.$executeRawUnsafe(sql);
      console.log(`✓ Executed DDL: ${sql}`);
    } catch (e: any) {
      console.log(`ℹ️ DDL skipped (already present or non-fatal): ${sql} -> ${e.message}`);
    }
  }

  console.log('\n--- VERIFYING USER SEARCH QUERY ON AIVEN MYSQL ---');
  const owner = await prisma.user.findFirst({
    where: { email: 'owner@srisaisiri.com' },
    include: {
      profile: {
        include: {
          tenant: true
        }
      }
    }
  });

  console.log('✓ Query user with profile & tenant succeeded on Aiven MySQL!');
  console.log('Owner Record:', owner ? { id: owner.id, email: owner.email, role: owner.role } : 'None');
}

fixAivenSchema().then(() => process.exit(0)).catch(e => { console.error('CRITICAL DDL ERROR:', e); process.exit(1); });
