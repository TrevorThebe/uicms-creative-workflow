-- =============================================================================
-- UICMS Creative Workflow & Management System
-- Complete Database Schema & Demo Seed Data for MySQL / MariaDB (XAMPP / phpMyAdmin)
-- =============================================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Create and Select Database
CREATE DATABASE IF NOT EXISTS `uicms_workflow` 
  DEFAULT CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE `uicms_workflow`;

-- =============================================================================
-- Table Structures
-- =============================================================================

DROP TABLE IF EXISTS `activity_logs`;
DROP TABLE IF EXISTS `chat_messages`;
DROP TABLE IF EXISTS `notifications`;
DROP TABLE IF EXISTS `feedback_items`;
DROP TABLE IF EXISTS `client_approvals`;
DROP TABLE IF EXISTS `qa_submissions`;
DROP TABLE IF EXISTS `deliverable_versions`;
DROP TABLE IF EXISTS `tasks`;
DROP TABLE IF EXISTS `projects`;
DROP TABLE IF EXISTS `clients`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `departments`;
DROP TABLE IF EXISTS `admin_settings`;

-- -----------------------------------------------------------------------------
-- 1. DEPARTMENTS
-- -----------------------------------------------------------------------------
CREATE TABLE `departments` (
  `id` VARCHAR(50) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT NULL,
  `icon` VARCHAR(50) NULL,
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 2. USERS
-- -----------------------------------------------------------------------------
CREATE TABLE `users` (
  `id` VARCHAR(50) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `personal_email` VARCHAR(150) NULL,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('super_admin', 'department_manager', 'account_manager', 'designer', 'qa_user', 'client') NOT NULL,
  `role_title` VARCHAR(150) NOT NULL,
  `department_id` VARCHAR(50) NULL,
  `avatar` VARCHAR(500) NULL,
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  `is_suspended` TINYINT(1) NOT NULL DEFAULT 0,
  `suspension_reason` TEXT NULL,
  `is_temp_password` TINYINT(1) NOT NULL DEFAULT 0,
  `temp_password_expires_at` VARCHAR(50) NULL,
  `must_change_password` TINYINT(1) NOT NULL DEFAULT 0,
  `workload_count` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_department` (`department_id`),
  KEY `idx_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 3. CLIENTS
-- -----------------------------------------------------------------------------
CREATE TABLE `clients` (
  `id` VARCHAR(50) NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `code` VARCHAR(20) NOT NULL UNIQUE,
  `logo_url` VARCHAR(500) NULL,
  `brand_guidelines` TEXT NULL,
  `ci_document_url` VARCHAR(500) NULL,
  `primary_contact_name` VARCHAR(100) NULL,
  `primary_contact_email` VARCHAR(150) NULL,
  `primary_contact_phone` VARCHAR(50) NULL,
  `primary_contact_position` VARCHAR(100) NULL,
  `website` VARCHAR(255) NULL,
  `notes` TEXT NULL,
  `default_ci_colors` JSON NULL,
  `font_requirements` TEXT NULL,
  `active_projects_count` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 4. PROJECTS
-- -----------------------------------------------------------------------------
CREATE TABLE `projects` (
  `id` VARCHAR(50) NOT NULL,
  `project_number` INT NOT NULL UNIQUE,
  `client_id` VARCHAR(50) NOT NULL,
  `department_id` VARCHAR(50) NOT NULL,
  `request_type_id` VARCHAR(100) NOT NULL,
  `project_name` VARCHAR(255) NOT NULL,
  `campaign_name` VARCHAR(255) NULL,
  `description` TEXT NULL,
  `priority` ENUM('low', 'medium', 'high', 'urgent') NOT NULL DEFAULT 'medium',
  `stage` ENUM('REQUESTED', 'BRIEF_VALIDATION', 'BRIEF_LOCKED', 'PRODUCTION', 'INTERNAL_QA', 'CLIENT_REVIEW', 'REVISION', 'CLIENT_APPROVAL', 'FINAL_QA', 'FINAL_RELEASE', 'COMPLETED') NOT NULL DEFAULT 'REQUESTED',
  `status` ENUM('on_track', 'due_soon', 'overdue', 'blocked', 'completed') NOT NULL DEFAULT 'on_track',
  `version` VARCHAR(20) NOT NULL DEFAULT 'V0.1',
  `accountable_user_id` VARCHAR(50) NOT NULL,
  `project_owner_id` VARCHAR(50) NOT NULL,
  `qa_owner_id` VARCHAR(50) NOT NULL,
  `approver_id` VARCHAR(50) NOT NULL,
  `contributor_ids` JSON NULL,
  `created_at` VARCHAR(50) NOT NULL,
  `updated_at` VARCHAR(50) NOT NULL,
  `brief_due_date` VARCHAR(30) NULL,
  `brief_locked_at` VARCHAR(50) NULL,
  `brief_locked_by` VARCHAR(100) NULL,
  `production_due_date` VARCHAR(30) NULL,
  `internal_qa_due_date` VARCHAR(30) NULL,
  `client_review_due_date` VARCHAR(30) NULL,
  `client_approval_due_date` VARCHAR(30) NULL,
  `final_qa_due_date` VARCHAR(30) NULL,
  `release_date` VARCHAR(30) NULL,
  `dependencies` TEXT NULL,
  `risks` TEXT NULL,
  `blockers` TEXT NULL,
  `external_suppliers` VARCHAR(255) NULL,
  `next_action_task` VARCHAR(255) NULL,
  `next_action_owner` VARCHAR(100) NULL,
  `next_action_due` VARCHAR(30) NULL,
  `approval_status` ENUM('none', 'pending', 'approved', 'rejected', 'changes_requested') NOT NULL DEFAULT 'none',
  `is_brief_locked` TINYINT(1) NOT NULL DEFAULT 0,
  `is_version_locked` TINYINT(1) NOT NULL DEFAULT 0,
  `brief_data` JSON NULL,
  `brief_completeness` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_client` (`client_id`),
  KEY `idx_department` (`department_id`),
  KEY `idx_stage` (`stage`),
  KEY `idx_accountable` (`accountable_user_id`),
  KEY `idx_owner` (`project_owner_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 5. TASKS
-- -----------------------------------------------------------------------------
CREATE TABLE `tasks` (
  `id` VARCHAR(50) NOT NULL,
  `project_id` VARCHAR(50) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `assigned_to_user_id` VARCHAR(50) NOT NULL,
  `assigned_to_name` VARCHAR(100) NOT NULL,
  `role_required` VARCHAR(50) NOT NULL,
  `status` ENUM('todo', 'in_progress', 'review', 'completed', 'blocked') NOT NULL DEFAULT 'todo',
  `priority` ENUM('low', 'medium', 'high', 'urgent') NOT NULL DEFAULT 'medium',
  `due_date` VARCHAR(30) NOT NULL,
  `stage` VARCHAR(50) NOT NULL,
  `is_blocking` TINYINT(1) NOT NULL DEFAULT 0,
  `estimated_hours` DECIMAL(5,2) NULL DEFAULT 0.00,
  `actual_hours` DECIMAL(5,2) NULL DEFAULT 0.00,
  `checklist` JSON NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_project` (`project_id`),
  KEY `idx_assigned` (`assigned_to_user_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- App-managed project file metadata; file bytes remain at the referenced URL.
CREATE TABLE `project_files` (
  `id` VARCHAR(50) NOT NULL,
  `project_id` VARCHAR(50) NOT NULL,
  `filename` VARCHAR(255) NOT NULL,
  `size` VARCHAR(50) NOT NULL DEFAULT '',
  `type` VARCHAR(150) NOT NULL DEFAULT '',
  `version` VARCHAR(20) NOT NULL DEFAULT 'V0.1',
  `uploaded_by` VARCHAR(50) NOT NULL DEFAULT '',
  `uploaded_by_name` VARCHAR(100) NOT NULL DEFAULT '',
  `uploaded_at` VARCHAR(50) NOT NULL,
  `category` VARCHAR(50) NOT NULL DEFAULT 'proofs',
  `url` VARCHAR(1000) NOT NULL DEFAULT '',
  `description` TEXT NULL,
  `app_payload` LONGTEXT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_project` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 6. DELIVERABLE VERSIONS
-- -----------------------------------------------------------------------------
CREATE TABLE `deliverable_versions` (
  `id` VARCHAR(50) NOT NULL,
  `project_id` VARCHAR(50) NOT NULL,
  `version_number` VARCHAR(20) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `file_url` VARCHAR(500) NOT NULL,
  `preview_url` VARCHAR(500) NULL,
  `uploaded_by` VARCHAR(50) NOT NULL,
  `uploaded_by_name` VARCHAR(100) NOT NULL,
  `uploaded_at` VARCHAR(50) NOT NULL,
  `description` TEXT NULL,
  `status` ENUM('draft', 'internal_qa', 'client_review', 'approved', 'rejected', 'released') NOT NULL DEFAULT 'draft',
  `is_locked` TINYINT(1) NOT NULL DEFAULT 0,
  `qa_result` VARCHAR(50) NULL,
  `qa_notes` TEXT NULL,
  `changelog` TEXT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_project` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 7. QA SUBMISSIONS
-- -----------------------------------------------------------------------------
CREATE TABLE `qa_submissions` (
  `id` VARCHAR(50) NOT NULL,
  `project_id` VARCHAR(50) NOT NULL,
  `version_id` VARCHAR(50) NOT NULL,
  `result` ENUM('PASS', 'PASS_WITH_NOTES', 'FAIL') NOT NULL,
  `performed_by` VARCHAR(50) NOT NULL,
  `performed_by_name` VARCHAR(100) NOT NULL,
  `performed_at` VARCHAR(50) NOT NULL,
  `checklist` JSON NULL,
  `overall_notes` TEXT NULL,
  `passed_count` INT NULL DEFAULT 0,
  `failed_count` INT NULL DEFAULT 0,
  `na_count` INT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_project` (`project_id`),
  KEY `idx_version` (`version_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 8. CLIENT APPROVALS
-- -----------------------------------------------------------------------------
CREATE TABLE `client_approvals` (
  `id` VARCHAR(50) NOT NULL,
  `project_id` VARCHAR(50) NOT NULL,
  `version_id` VARCHAR(50) NOT NULL,
  `version_number` VARCHAR(20) NULL,
  `client_id` VARCHAR(50) NULL,
  `decision` ENUM('APPROVED', 'APPROVED_WITH_NOTES', 'NOT_APPROVED', 'REJECTED') NOT NULL,
  `client_name` VARCHAR(100) NOT NULL,
  `client_position` VARCHAR(100) NOT NULL,
  `confirmation_text` TEXT NULL,
  `comments` TEXT NULL,
  `changes_requested` JSON NULL,
  `approved_at` VARCHAR(50) NOT NULL,
  `signature_hash` VARCHAR(100) NULL,
  PRIMARY KEY (`id`),
  KEY `idx_project` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 9. FEEDBACK ITEMS
-- -----------------------------------------------------------------------------
CREATE TABLE `feedback_items` (
  `id` VARCHAR(50) NOT NULL,
  `project_id` VARCHAR(50) NOT NULL,
  `version` VARCHAR(20) NOT NULL,
  `submitted_by` VARCHAR(50) NOT NULL,
  `submitted_by_name` VARCHAR(100) NOT NULL,
  `submitted_at` VARCHAR(50) NOT NULL,
  `feedback_text` TEXT NOT NULL,
  `attachment_url` VARCHAR(500) NULL,
  `assigned_to` VARCHAR(50) NOT NULL,
  `assigned_to_name` VARCHAR(100) NOT NULL,
  `priority` ENUM('low', 'medium', 'high', 'urgent') NOT NULL DEFAULT 'medium',
  `status` ENUM('open', 'in_progress', 'resolved', 'rejected', 'closed') NOT NULL DEFAULT 'open',
  `type` ENUM('action_required', 'for_information') NOT NULL DEFAULT 'action_required',
  PRIMARY KEY (`id`),
  KEY `idx_project` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 10. NOTIFICATIONS
-- -----------------------------------------------------------------------------
CREATE TABLE `notifications` (
  `id` VARCHAR(50) NOT NULL,
  `user_id` VARCHAR(50) NOT NULL,
  `project_id` VARCHAR(50) NULL,
  `type` VARCHAR(50) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `is_read` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` VARCHAR(50) NOT NULL,
  `target_tab` VARCHAR(50) NULL,
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 11. CHAT MESSAGES
-- -----------------------------------------------------------------------------
CREATE TABLE `chat_messages` (
  `id` VARCHAR(50) NOT NULL,
  `project_id` VARCHAR(50) NOT NULL,
  `sender_id` VARCHAR(50) NOT NULL,
  `sender_name` VARCHAR(100) NOT NULL,
  `sender_avatar` VARCHAR(500) NULL,
  `message` TEXT NOT NULL,
  `created_at` VARCHAR(50) NOT NULL,
  `mentions` JSON NULL,
  `referenced_task_id` VARCHAR(50) NULL,
  `is_important` TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_project` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 12. ACTIVITY LOGS (AUDIT TRAIL)
-- -----------------------------------------------------------------------------
CREATE TABLE `activity_logs` (
  `id` VARCHAR(50) NOT NULL,
  `project_id` VARCHAR(50) NOT NULL,
  `user_id` VARCHAR(50) NOT NULL,
  `user_name` VARCHAR(100) NOT NULL,
  `action` VARCHAR(100) NOT NULL,
  `description` TEXT NOT NULL,
  `timestamp` VARCHAR(50) NOT NULL,
  `previous_stage` VARCHAR(50) NULL,
  `new_stage` VARCHAR(50) NULL,
  PRIMARY KEY (`id`),
  KEY `idx_project` (`project_id`),
  KEY `idx_timestamp` (`timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 13. ADMIN SETTINGS
-- -----------------------------------------------------------------------------
CREATE TABLE `admin_settings` (
  `setting_key` VARCHAR(50) NOT NULL,
  `setting_value` JSON NOT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =============================================================================
-- Department lookup rows required for initial workspace setup.
INSERT INTO `departments` (`id`, `name`, `description`, `icon`, `active`) VALUES
('marketing', 'Marketing & Creative Production', 'Brand campaigns, digital media, social content, and marketing collateral.', 'Palette', 1),
('incentive_travel', 'Incentive Travel & Events Logistics', 'Travel programs, event materials, and print collateral.', 'Plane', 1),
('online_ram', 'Online (RAM) & Rewards Engineering', 'Digital reward platforms, dealer programs, and online campaign assets.', 'Flame', 1),
('development', 'Technology & Systems Engineering', 'Web applications, API integrations, and workflow automation.', 'Code', 1);

-- Seed System Users (Default Password for initial setup is: Password123!)
INSERT INTO `users` (
  `id`, `name`, `email`, `personal_email`, `password`, 
  `role`, `role_title`, `department_id`, `avatar`, 
  `active`, `is_suspended`, `workload_count`
) VALUES 
('usr-admin-01', 'Alex Rivera', 'admin@uicms.local', 'alex.rivera@personal.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'super_admin', 'Executive Creative Director & Super Admin', 'marketing', '', 1, 0, 0),
('usr-mgr-01', 'Sarah Chen', 'sarah.chen@uicms.local', 'sarah.chen@personal.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'department_manager', 'Creative Operations Manager', 'marketing', '', 1, 0, 0),
('usr-des-01', 'Marcus Vance', 'marcus.vance@uicms.local', 'marcus.vance@personal.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'designer', 'Senior Visual Designer', 'marketing', '', 1, 0, 0)
ON DUPLICATE KEY UPDATE `password` = VALUES(`password`);
SET FOREIGN_KEY_CHECKS = 1;
COMMIT;
