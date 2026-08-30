-- ============================================================================
-- SRI SAI SIRI BOYS HOSTEL ERP - PRODUCTION MYSQL DATABASE SCHEMA
-- Compatible with MySQL 5.7+ / 8.0+ & MySQL Workbench
-- ============================================================================

CREATE DATABASE IF NOT EXISTS `defaultdb` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `defaultdb`;

SET FOREIGN_KEY_CHECKS = 0;

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS `User` (
  `id` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `role` VARCHAR(50) NOT NULL DEFAULT 'TENANT',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `User_email_key` (`email`),
  INDEX `idx_user_email` (`email`),
  INDEX `idx_user_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. PROFILES TABLE
CREATE TABLE IF NOT EXISTS `Profile` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `firstName` VARCHAR(191) NOT NULL,
  `lastName` VARCHAR(191) NOT NULL,
  `phone` VARCHAR(50) NOT NULL,
  `photoUrl` VARCHAR(500) NULL,
  `gender` VARCHAR(20) NULL,
  `address` TEXT NULL,
  `aadhaar` VARCHAR(50) NULL,
  `emergencyContactName` VARCHAR(191) NULL,
  `emergencyContactPhone` VARCHAR(50) NULL,
  `guardianName` VARCHAR(191) NULL,
  `guardianPhone` VARCHAR(50) NULL,
  `occupation` VARCHAR(191) NULL,
  `moveInDate` DATETIME(3) NULL,
  `moveOutDate` DATETIME(3) NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `Profile_userId_key` (`userId`),
  CONSTRAINT `fk_profile_user` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. BUILDINGS TABLE
CREATE TABLE IF NOT EXISTS `Building` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `address` VARCHAR(500) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. FLOORS TABLE
CREATE TABLE IF NOT EXISTS `Floor` (
  `id` VARCHAR(191) NOT NULL,
  `number` INT NOT NULL,
  `buildingId` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `idx_floor_building` (`buildingId`),
  CONSTRAINT `fk_floor_building` FOREIGN KEY (`buildingId`) REFERENCES `Building` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. ROOMS TABLE
CREATE TABLE IF NOT EXISTS `Room` (
  `id` VARCHAR(191) NOT NULL,
  `number` VARCHAR(50) NOT NULL,
  `type` VARCHAR(100) NOT NULL,
  `rent` DOUBLE NOT NULL DEFAULT 8500.0,
  `status` VARCHAR(50) NOT NULL DEFAULT 'AVAILABLE',
  `capacity` INT NOT NULL DEFAULT 2,
  `amenities` TEXT NOT NULL,
  `images` TEXT NULL,
  `floorId` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `idx_room_floor` (`floorId`),
  INDEX `idx_room_status` (`status`),
  CONSTRAINT `fk_room_floor` FOREIGN KEY (`floorId`) REFERENCES `Floor` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. TENANTS TABLE
CREATE TABLE IF NOT EXISTS `Tenant` (
  `id` VARCHAR(191) NOT NULL,
  `profileId` VARCHAR(191) NOT NULL,
  `roomNumber` VARCHAR(50) NULL,
  `bedNumber` VARCHAR(50) NULL,
  `rentAmount` DOUBLE NOT NULL DEFAULT 8500.0,
  `agreementUrl` VARCHAR(500) NULL,
  `medicalNotes` TEXT NULL,
  `moveInDate` DATETIME(3) NULL,
  `moveOutDate` DATETIME(3) NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `Tenant_profileId_key` (`profileId`),
  INDEX `idx_tenant_status` (`status`),
  CONSTRAINT `fk_tenant_profile` FOREIGN KEY (`profileId`) REFERENCES `Profile` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. BEDS TABLE
CREATE TABLE IF NOT EXISTS `Bed` (
  `id` VARCHAR(191) NOT NULL,
  `number` VARCHAR(50) NOT NULL,
  `roomId` VARCHAR(191) NOT NULL,
  `tenantId` VARCHAR(191) NULL,
  `isAvailable` TINYINT(1) NOT NULL DEFAULT 1,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `idx_bed_room` (`roomId`),
  INDEX `idx_bed_tenant` (`tenantId`),
  CONSTRAINT `fk_bed_room` FOREIGN KEY (`roomId`) REFERENCES `Room` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_bed_tenant` FOREIGN KEY (`tenantId`) REFERENCES `Tenant` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. INVOICES TABLE
CREATE TABLE IF NOT EXISTS `Invoice` (
  `id` VARCHAR(191) NOT NULL,
  `number` VARCHAR(100) NOT NULL,
  `tenantId` VARCHAR(191) NOT NULL,
  `amount` DOUBLE NOT NULL,
  `paidAmount` DOUBLE NOT NULL DEFAULT 0.0,
  `dueDate` DATETIME(3) NOT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  `itemsJson` TEXT NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `Invoice_number_key` (`number`),
  INDEX `idx_invoice_tenant` (`tenantId`),
  CONSTRAINT `fk_invoice_tenant` FOREIGN KEY (`tenantId`) REFERENCES `Tenant` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS `Payment` (
  `id` VARCHAR(191) NOT NULL,
  `tenantId` VARCHAR(191) NOT NULL,
  `invoiceId` VARCHAR(191) NULL,
  `amount` DOUBLE NOT NULL,
  `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `type` VARCHAR(50) NOT NULL DEFAULT 'RENT',
  `paymentMethod` VARCHAR(50) NOT NULL DEFAULT 'CASH',
  `status` VARCHAR(50) NOT NULL DEFAULT 'PAID',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `idx_payment_tenant` (`tenantId`),
  INDEX `idx_payment_invoice` (`invoiceId`),
  CONSTRAINT `fk_payment_tenant` FOREIGN KEY (`tenantId`) REFERENCES `Tenant` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_payment_invoice` FOREIGN KEY (`invoiceId`) REFERENCES `Invoice` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. EMPLOYEES TABLE
CREATE TABLE IF NOT EXISTS `Employee` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `phone` VARCHAR(50) NOT NULL,
  `address` TEXT NOT NULL,
  `role` VARCHAR(100) NOT NULL,
  `salary` DOUBLE NOT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
  `bankDetails` TEXT NULL,
  `emergencyContact` VARCHAR(100) NULL,
  `photoUrl` VARCHAR(500) NULL,
  `joiningDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. COMPLAINTS TABLE
CREATE TABLE IF NOT EXISTS `Complaint` (
  `id` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `description` TEXT NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  `tenantId` VARCHAR(191) NOT NULL,
  `assignedEmployeeId` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `idx_complaint_tenant` (`tenantId`),
  INDEX `idx_complaint_employee` (`assignedEmployeeId`),
  CONSTRAINT `fk_complaint_tenant` FOREIGN KEY (`tenantId`) REFERENCES `Tenant` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_complaint_employee` FOREIGN KEY (`assignedEmployeeId`) REFERENCES `Employee` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. EXPENSES TABLE
CREATE TABLE IF NOT EXISTS `Expense` (
  `id` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `amount` DOUBLE NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `date` DATETIME(3) NOT NULL,
  `notes` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. INVENTORY TABLE
CREATE TABLE IF NOT EXISTS `Inventory` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `quantity` INT NOT NULL DEFAULT 1,
  `condition` VARCHAR(100) NOT NULL DEFAULT 'GOOD',
  `purchaseDate` DATETIME(3) NOT NULL,
  `cost` DOUBLE NOT NULL,
  `warrantyYears` INT NOT NULL DEFAULT 0,
  `vendor` VARCHAR(191) NULL,
  `replacementDate` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. NOTICES TABLE
CREATE TABLE IF NOT EXISTS `Notice` (
  `id` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `content` TEXT NOT NULL,
  `target` VARCHAR(50) NOT NULL DEFAULT 'EVERYONE',
  `isEmergency` TINYINT(1) NOT NULL DEFAULT 0,
  `scheduleDate` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. LEAVE REQUESTS TABLE
CREATE TABLE IF NOT EXISTS `LeaveRequest` (
  `id` VARCHAR(191) NOT NULL,
  `tenantId` VARCHAR(191) NOT NULL,
  `startDate` DATETIME(3) NOT NULL,
  `endDate` DATETIME(3) NOT NULL,
  `reason` TEXT NOT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `idx_leave_tenant` (`tenantId`),
  CONSTRAINT `fk_leave_tenant` FOREIGN KEY (`tenantId`) REFERENCES `Tenant` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. VISITORS TABLE
CREATE TABLE IF NOT EXISTS `Visitor` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `phone` VARCHAR(50) NOT NULL,
  `personVisiting` VARCHAR(191) NOT NULL,
  `checkIn` DATETIME(3) NOT NULL,
  `checkOut` DATETIME(3) NULL,
  `approvalStatus` VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  `tenantId` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `idx_visitor_tenant` (`tenantId`),
  CONSTRAINT `fk_visitor_tenant` FOREIGN KEY (`tenantId`) REFERENCES `Tenant` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- DEFAULT OWNER SEED DATA (Safe insert: will not overwrite existing users)
-- Password Hash below is bcrypt for 'password123'
-- ============================================================================
INSERT IGNORE INTO `User` (`id`, `email`, `password`, `role`, `createdAt`, `updatedAt`)
VALUES ('u-owner-001', 'owner@srisaisiri.com', '$2a$10$3zR14Q8tVvGq.3wKjJ3eDeZc2UuW5R4lQpUaO.u5Xl.u5Xl.u5Xl.', 'OWNER', NOW(), NOW());

INSERT IGNORE INTO `Profile` (`id`, `userId`, `firstName`, `lastName`, `phone`, `status`, `createdAt`, `updatedAt`)
VALUES ('p-owner-001', 'u-owner-001', 'Alok', 'Sharma', '+91 98765 43210', 'ACTIVE', NOW(), NOW());
