-- =============================================================================
-- UICMS Workflow - AWS Password Reset Migration
-- Target Database: uicms_workflow
-- Compatible with MySQL 8.0, 8.4+, MariaDB 10.5+
-- =============================================================================

USE `uicms_workflow`;

-- 1. Create password_resets table
CREATE TABLE IF NOT EXISTS `password_resets` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `user_id` VARCHAR(50) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `verification_code_hash` VARCHAR(255) NOT NULL,
  `expires_at` DATETIME NOT NULL,
  `used` TINYINT(1) NOT NULL DEFAULT 0,
  `attempts` INT NOT NULL DEFAULT 0,
  `ip_address` VARCHAR(45) NULL,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NULL,
  KEY `idx_pr_email` (`email`),
  KEY `idx_pr_user_id` (`user_id`),
  KEY `idx_pr_expires` (`expires_at`),
  KEY `idx_pr_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Add ip_address column to activity_logs if not already present
SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'activity_logs' 
    AND COLUMN_NAME = 'ip_address'
);

SET @stmt = IF(@col_exists = 0, 'ALTER TABLE `activity_logs` ADD COLUMN `ip_address` VARCHAR(45) NULL AFTER `metadata`', 'SELECT 1');
PREPARE add_ip_col FROM @stmt;
EXECUTE add_ip_col;
DEALLOCATE PREPARE add_ip_col;
