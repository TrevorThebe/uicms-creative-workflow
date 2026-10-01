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
  `is_temp_password` TINYINT(1) NOT NULL DEFAULT 0,
  `temp_password_expires_at` VARCHAR(50) NULL,
  `must_change_password` TINYINT(1) NOT NULL DEFAULT 0,
  `role` ENUM('super_admin', 'department_manager', 'account_manager', 'designer', 'qa_user', 'client') NOT NULL,
  `role_title` VARCHAR(150) NOT NULL,
  `department_id` VARCHAR(50) NULL,
  `avatar` VARCHAR(500) NULL,
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  `is_suspended` TINYINT(1) NOT NULL DEFAULT 0,
  `suspension_reason` TEXT NULL,
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
-- DEMO DATA SEEDING
-- =============================================================================

-- 1. Departments
INSERT INTO `departments` (`id`, `name`, `description`, `icon`, `active`) VALUES
('marketing', 'Marketing & Creative Production', 'Brand campaigns, digital media, social carousels, animations and marketing collateral.', 'Palette', 1),
('incentive_travel', 'Incentive Travel & Events Logistics', 'Luxury itineraries, travel document suites, print collateral, luggage tags and vouchers.', 'Plane', 1),
('online_ram', 'Online (RAM) & Rewards Engineering', 'Dealer sprint contests, cash vouchers, loyalty banners and digital reward platforms.', 'Flame', 1),
('development', 'Technology & Systems Engineering', 'Custom web portals, API integrations, and workflow automation tooling.', 'Code', 1);

-- 2. Users
INSERT INTO `users` (`id`, `name`, `email`, `personal_email`, `password`, `role`, `role_title`, `department_id`, `avatar`, `active`, `is_suspended`, `suspension_reason`, `workload_count`) VALUES
('usr-admin', 'Eleanor Vance', 'eleanor.vance@uicms.com', 'eleanor.vance@gmail.com', 'Password123!', 'super_admin', 'Chief Operations & Systems Administrator', 'marketing', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80', 1, 0, NULL, 4),
('usr-mkt-mgr', 'Marcus Sterling', 'marcus.sterling@uicms.com', 'marcus.sterling.home@gmail.com', 'Password123!', 'department_manager', 'Head of Marketing & Creative Production', 'marketing', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', 1, 0, NULL, 6),
('usr-trv-mgr', 'Sophia Chen', 'sophia.chen@uicms.com', 'sophia.chen.personal@gmail.com', 'Password123!', 'department_manager', 'Head of Incentive Travel Logistics & Collateral', 'incentive_travel', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80', 1, 0, NULL, 8),
('usr-ram-mgr', 'David Ndlovu', 'david.ndlovu@uicms.com', 'david.ndlovu.personal@gmail.com', 'Password123!', 'department_manager', 'Head of Online (RAM) & Rewards Engineering', 'online_ram', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', 1, 0, NULL, 7),
('usr-am-1', 'Chloe Bennett', 'chloe.bennett@uicms.com', 'chloe.bennett.personal@gmail.com', 'Password123!', 'account_manager', 'Senior Account Director (Enterprise Brands)', 'marketing', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80', 1, 0, NULL, 9),
('usr-am-2', 'Julian Rossi', 'julian.rossi@uicms.com', 'julian.rossi.personal@gmail.com', 'Password123!', 'account_manager', 'Account Manager (Travel & RAM Programmes)', 'incentive_travel', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', 1, 0, NULL, 6),
('usr-des-1', 'Liam Gallagher', 'liam.gallagher@uicms.com', 'liam.gallagher.creative@gmail.com', 'Password123!', 'designer', 'Senior Art Director & Print Specialist', 'incentive_travel', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80', 1, 0, NULL, 5),
('usr-des-2', 'Amara Okafor', 'amara.okafor@uicms.com', 'amara.okafor.motion@gmail.com', 'Password123!', 'designer', 'Motion Graphics & Video Producer', 'marketing', 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150&auto=format&fit=crop&q=80', 1, 0, NULL, 4),
('usr-des-3', 'Lucas Thorne', 'lucas.thorne@uicms.com', 'lucas.thorne.design@gmail.com', 'Password123!', 'designer', 'Digital Product & UI Designer', 'online_ram', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80', 1, 0, NULL, 5),
('usr-qa-1', 'Hannah Wright', 'hannah.wright@uicms.com', 'hannah.wright.qa@gmail.com', 'Password123!', 'qa_user', 'Quality Assurance & CI Compliance Lead', 'marketing', 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150&auto=format&fit=crop&q=80', 1, 0, NULL, 7),
('usr-qa-2', 'Tariq Mansour', 'tariq.mansour@uicms.com', 'tariq.mansour.qa@gmail.com', 'Password123!', 'qa_user', 'Senior QA Inspector & Print Pre-flight Auditor', 'incentive_travel', 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80', 1, 0, NULL, 6),
('usr-client-1', 'Bradley Cooper', 'bradley.cooper@discovery.co.za', 'bradley.cooper.private@gmail.com', 'Password123!', 'client', 'VP Marketing & Brand Experience (Discovery Group)', 'marketing', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80', 1, 0, NULL, 2);

-- 3. Clients
INSERT INTO `clients` (`id`, `name`, `code`, `logo_url`, `brand_guidelines`, `ci_document_url`, `primary_contact_name`, `primary_contact_email`, `primary_contact_phone`, `primary_contact_position`, `website`, `notes`, `default_ci_colors`, `font_requirements`, `active_projects_count`) VALUES
('cl-discovery', 'Discovery Group (Vitality)', 'DISC', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80', 'Strict compliance with Discovery Blue (#004080) and Vitality Orange (#FF6600). Minimum 20mm clear space around the emblem.', 'https://files.uicms.com/ci/Discovery_Corporate_CI_2026.pdf', 'Bradley Cooper', 'bradley.cooper@discovery.co.za', '+27 (0)11 529 2888', 'VP Marketing & Brand Experience', 'https://www.discovery.co.za', 'Premium incentive tier. Requires executive proof sign-offs 7 days prior to release.', '["#004080", "#FF6600", "#F4F7FB", "#1E293B"]', 'Discovery Sans Bold, Discovery Text Regular, Futura Heavy', 4),
('cl-nissan', 'Nissan South Africa', 'NISN', 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=200&auto=format&fit=crop&q=80', 'Nissan Crimson Red (#C3002F) & Sleek Silver (#8A8D8F). Ultra modern automotive styling.', 'https://files.uicms.com/ci/Nissan_Apex_BrandBook.pdf', 'Rene Van Der Merwe', 'rene.vdm@nissan.co.za', '+27 (0)12 529 6000', 'Head of Dealer Incentives', 'https://www.nissan.co.za', 'Monthly sales sprint campaigns and dealership rewards platform.', '["#C3002F", "#000000", "#8A8D8F", "#FFFFFF"]', 'Nissan Brand Regular, Nissan Display Bold', 3),
('cl-standardbank', 'Standard Bank Wealth', 'SBWL', 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=200&auto=format&fit=crop&q=80', 'Standard Bank Cobalt Blue (#0033A0) & Light Blue (#0091FF). High-net-worth luxury elegance.', 'https://files.uicms.com/ci/SB_Wealth_Guidelines.pdf', 'Sipho Khumalo', 'sipho.khumalo@standardbank.co.za', '+27 (0)11 636 9111', 'Director of Private Client Incentives', 'https://wealth.standardbank.com', 'Incentive Travel Switzerland and Kyoto trips + high-value client vouchers.', '["#0033A0", "#0091FF", "#F0F4FF", "#0A192F"]', 'Standard Bank Sans, Cormorant Garamond', 4),
('cl-bidvest', 'Bidvest Premier Global', 'BIDV', 'https://images.unsplash.com/photo-1614680376593-902f749f7ffc?w=200&auto=format&fit=crop&q=80', 'Bidvest Corporate Navy (#002B49) & Gold (#C5A059). Trust, integrity and global scale.', 'https://files.uicms.com/ci/Bidvest_Global_Brand.pdf', 'Helena Du Plessis', 'helena.dp@bidvest.co.za', '+27 (0)11 772 8700', 'Group Events Director', 'https://www.bidvest.co.za', 'Bidvest Vouchers, airport lounge vouchers, and international travel stationery.', '["#002B49", "#C5A059", "#E6EFF5"]', 'Proxima Nova, Trajan Pro', 2),
('cl-woolworths', 'Woolworths Financial Services', 'WFS', 'https://images.unsplash.com/photo-1542744094-3a31f272c490?w=200&auto=format&fit=crop&q=80', 'Woolworths Classic Monochrome (#000000 / #FFFFFF) with Accent Green (#2D6A4F). Premium sustainable minimalism.', NULL, 'Anita Govender', 'anita.govender@wfs.co.za', '+27 (0)21 407 9111', 'Loyalty Portfolio Lead', 'https://www.woolworths.co.za', 'Sprint campaign banners and store catalogue logos.', '["#000000", "#2D6A4F", "#F8F9FA"]', 'Futura, Gill Sans, Helvetica Neue', 2);

-- 4. Projects
INSERT INTO `projects` (`id`, `project_number`, `client_id`, `department_id`, `request_type_id`, `project_name`, `campaign_name`, `description`, `priority`, `stage`, `status`, `version`, `accountable_user_id`, `project_owner_id`, `qa_owner_id`, `approver_id`, `contributor_ids`, `created_at`, `updated_at`, `brief_due_date`, `brief_locked_at`, `brief_locked_by`, `production_due_date`, `internal_qa_due_date`, `client_review_due_date`, `client_approval_due_date`, `final_qa_due_date`, `release_date`, `dependencies`, `risks`, `blockers`, `external_suppliers`, `next_action_task`, `next_action_owner`, `next_action_due`, `approval_status`, `is_brief_locked`, `is_version_locked`, `brief_data`, `brief_completeness`) VALUES
('PRJ-MKT-2026-001', 101, 'cl-discovery', 'marketing', 'mkt-social-linkedin', 'Q4 Executive Leadership Series — LinkedIn', 'Thought Leadership 2026', 'B2B executive thought leadership carousel banners spotlighting Discovery Vitality wellness innovation.', 'high', 'REQUESTED', 'on_track', 'V0.1', 'usr-am-1', 'usr-des-1', 'usr-qa-1', 'usr-client-1', '["usr-des-1", "usr-mkt-mgr"]', '2026-09-18T09:15:00Z', '2026-09-18T09:15:00Z', '2026-09-20', NULL, NULL, '2026-09-24', '2026-09-26', '2026-09-28', '2026-09-30', '2026-10-02', '2026-10-04', 'Requires approved transcript from Chief Medical Officer interview.', 'Pending high-res portrait photography from Johannesburg photoshoot.', '', 'Portrait Studio: ProPix Africa', 'Complete mandatory brief fields and lock brief', 'Chloe Bennett', '2026-09-20', 'none', 0, 0, '{"page_name": "Discovery Health Official LinkedIn", "post_type": "Document / PDF Carousel (1080x1080 Multi-page)", "headline": "The Next Decade of Preventative Healthcare Technology", "caption_copy": "How AI and wearable telemetry are transforming preventive care. Explore key findings from our 2026 Vitality Global Study.", "cta": "Download the Full 2026 Whitepaper", "destination_url": "https://discovery.co.za/vitality/whitepaper-2026", "publish_date": "2026-10-04"}', 90),

('PRJ-RAM-2026-002', 102, 'cl-nissan', 'online_ram', 'ram-sprint-banners', 'Spring Dealership Sprint Banners', 'Nissan Apex Q3 Sprint', 'Flash sales contest banners for national dealer principal portal hero slider and mobile view.', 'urgent', 'BRIEF_VALIDATION', 'due_soon', 'V0.2', 'usr-am-2', 'usr-des-3', 'usr-qa-1', 'usr-ram-mgr', '["usr-des-3", "usr-ram-mgr"]', '2026-09-17T11:00:00Z', '2026-09-18T14:20:00Z', '2026-09-19', NULL, NULL, '2026-09-22', '2026-09-23', '2026-09-24', '2026-09-25', '2026-09-26', '2026-09-28', 'Target sales matrix approved by Nissan National Sales Director.', 'Tight weekend turnaround before sprint launch.', '', '', 'Validate brief completeness and verify Nissan Red CI values', 'David Ndlovu', '2026-09-19', 'none', 0, 0, '{"client_name": "Nissan South Africa", "sprint_name": "Spring Apex Double Points Sprint (19-21 Sept)", "title_subtitle": "Sell 3 Units -> Win R5,000 Instant Cash Voucher", "cta_destination": "View Sprint Rules | /sprint-challenge", "dimensions": "Hero: 1920x550px, Mobile: 800x400px", "existing_banner": "New Banner Concept", "deadline": "2026-09-28"}', 100),

('PRJ-TRV-2026-003', 103, 'cl-standardbank', 'incentive_travel', 'trv-banners', 'Swiss Alps Luxury Summit Location Banners', 'Pinnacle Club St. Moritz 2026', 'Digital teaser banners and registration portal headers showcasing St. Moritz winter wonderland.', 'medium', 'BRIEF_LOCKED', 'on_track', 'V1.0', 'usr-am-1', 'usr-des-1', 'usr-qa-2', 'usr-trv-mgr', '["usr-des-1", "usr-des-2"]', '2026-09-15T08:30:00Z', '2026-09-18T10:00:00Z', '2026-09-17', '2026-09-18T09:45:00Z', 'Sophia Chen', '2026-09-22', '2026-09-24', '2026-09-26', '2026-09-28', '2026-09-30', '2026-10-02', 'Licensing secured for Engadin Alpine Resort photography.', 'None.', '', 'Shutterstock Enterprise & Switzerland Tourism DMC', 'Commence V1 digital banner design mockups in Figma/Photoshop', 'Liam Gallagher', '2026-09-22', 'none', 1, 0, '{"destination": "St. Moritz & Zurich, Switzerland", "trip_programme": "Standard Bank Pinnacle Club 2026", "banner_purpose": "Registration Portal Header (1920x600)", "title": "Ascend to Greatness — St. Moritz 2026", "subtitle": "Qualifying Window: 1 March - 30 November 2026", "destination_imagery": "Snow-capped peaks, Badrutt Palace hotel exterior, Glacier Express train.", "client_branding": "Standard Bank Cobalt Blue crest on top-left, gold trim accents.", "sizes": "1920x600px, 1200x628px, 1080x1080px", "cta_url": "https://wealth.standardbank.com/pinnacle-2026", "deadline": "2026-10-02"}', 100),

('PRJ-TRV-2026-004', 104, 'cl-discovery', 'incentive_travel', 'trv-printed-docs', 'Dubai Incentive Trip — Printed Travel Documents Suite', 'Dubai Horizon VIP Quest 2026', 'Comprehensive 21-piece travel document suite including luxury wallet inserts, luggage tags, meal cards, emergency PVC care cards and tickets covers.', 'urgent', 'PRODUCTION', 'on_track', 'V1.0', 'usr-am-1', 'usr-des-1', 'usr-qa-2', 'usr-client-1', '["usr-des-1", "usr-am-1", "usr-trv-mgr"]', '2026-09-12T09:00:00Z', '2026-09-18T16:00:00Z', '2026-09-14', '2026-09-14T15:00:00Z', 'Sophia Chen', '2026-09-21', '2026-09-23', '2026-09-25', '2026-09-27', '2026-09-29', '2026-10-01', 'Final passport manifest confirmed by Emirates Airlines group booking desk.', 'Strict customs print lead times in Dubai.', '', 'Litho Print Express & PVC Card Masters', 'Finalize InDesign layout for 120 luggage tags and emergency cards', 'Liam Gallagher', '2026-09-21', 'none', 1, 0, '{"trip_destination": "Dubai & Abu Dhabi, UAE (Atlantis The Royal)", "selected_catalog_items": ["Wallet inserts", "Meal Cards", "Emergency Care Cards", "Bidvest Vouchers", "Luggage/Gift Tags", "Welcome Notes", "Tickets Covers", "Itinerary Brochures"], "document_specifications": "Luggage tags: 120 units (Duplex board + gold foil), Emergency PVC Cards: 60 units with magnetic strip, Itinerary Brochures: Square 210mm Wire-O (16-page).", "content_details": "Atlantis The Royal Dubai, Tour Director Dave Coetzee (+27 82 491 0000), Local DMC Gulf Ventures.", "finish_diecut": "Matte soft-touch lamination, metallic copper foil accents on crest.", "approval_deadline": "2026-09-27"}', 100),

('PRJ-RAM-2026-006', 106, 'cl-nissan', 'online_ram', 'ram-sprint-banners', 'Nissan Apex Challenge Rewards Portal CMS', 'Apex Spring Challenge 2026', 'Dealer principal rewards portal homepage layout, countdown ticker, and sprint leaderboard components.', 'high', 'INTERNAL_QA', 'due_soon', 'V1.0', 'usr-am-2', 'usr-des-3', 'usr-qa-1', 'usr-ram-mgr', '["usr-des-3", "usr-qa-1"]', '2026-09-10T08:00:00Z', '2026-09-18T15:30:00Z', '2026-09-12', '2026-09-12T14:00:00Z', 'David Ndlovu', '2026-09-16', '2026-09-19', '2026-09-21', '2026-09-23', '2026-09-25', '2026-09-27', 'Nissan API token for live dealership point sync.', 'Mobile viewport responsiveness on older Android dealership tablets.', '', '', 'Perform comprehensive QA checklist on sprint leaderboard responsiveness', 'Hannah Wright', '2026-09-19', 'none', 1, 0, '{"client_name": "Nissan South Africa", "sprint_name": "Apex Spring Challenge", "title_subtitle": "Leaderboard & Points Portal CMS", "cta_destination": "Track My Points | /portal/apex-2026", "dimensions": "Desktop 1920x1080, Tablet 1024x768, Mobile 375x812", "deadline": "2026-09-27"}', 100),

('PRJ-MKT-2026-008', 108, 'cl-discovery', 'marketing', 'mkt-social-instagram', 'Vitality Spring Vitalize 2026 — Instagram Carousel', 'Spring Vitalize 2026', '10-slide high-energy Instagram educational carousel explaining gym workout point multipliers and healthy food rewards.', 'high', 'CLIENT_REVIEW', 'on_track', 'V1.0', 'usr-am-1', 'usr-des-1', 'usr-qa-1', 'usr-client-1', '["usr-des-1", "usr-am-1"]', '2026-09-08T10:00:00Z', '2026-09-18T16:00:00Z', '2026-09-10', '2026-09-10T12:00:00Z', 'Marcus Sterling', '2026-09-14', '2026-09-16', '2026-09-20', '2026-09-22', '2026-09-24', '2026-09-26', 'Approval from Discovery Head of Legal on point redemption disclaimers.', 'Brand colour accuracy on OLED mobile screens.', '', '', 'Client review of carousel slide 4 & 7 copy and sign-off', 'Bradley Cooper', '2026-09-20', 'pending', 1, 0, '{"handle": "@DiscoveryVitality_SA", "campaign_theme": "Spring Vitalize 2026 Multipliers", "format": "1080x1350 Portrait Carousel (10 Slides)", "hook_slide": "How to 3X Your Vitality Gym Points This Spring", "caption": "Swipe through for the ultimate Spring workout cheat sheet! #LiveLifeWithVitality", "stickers_music": "Audio: Upbeat House Beat (Licensed)", "deadline": "2026-09-26"}', 100),

('PRJ-RAM-2026-009', 109, 'cl-standardbank', 'online_ram', 'ram-vouchers', 'Standard Bank Wealth Mastercard Client Vouchers', 'Wealth Privileges 2026', 'Ultra-premium textured card gift vouchers with NFC chips for high-net-worth wealth accounts.', 'urgent', 'REVISION', 'on_track', 'V1.1', 'usr-am-1', 'usr-des-3', 'usr-qa-1', 'usr-client-1', '["usr-des-3", "usr-am-1"]', '2026-09-06T09:00:00Z', '2026-09-18T15:20:00Z', '2026-09-08', '2026-09-08T11:00:00Z', 'David Ndlovu', '2026-09-12', '2026-09-14', '2026-09-16', '2026-09-19', '2026-09-21', '2026-09-24', 'Card printing partner confirmation on NFC antenna placement.', 'Standard Bank Legal clause regarding 36-month expiry.', '', 'Mastercard Secure Print Facility', 'Implement client feedback on clause 4 (36-month validity) and export V1.1 proof', 'Lucas Thorne', '2026-09-19', 'changes_requested', 1, 0, '{"client": "Standard Bank Wealth", "voucher_type": "Luxury Physical Gift Card with NFC (R10,000 - R50,000)", "target_audience": "Private Wealth & Signature Banking Clients", "specs": "85.60 x 53.98 mm (Credit Card Size), Matte Black 800gsm Silk Core, Gold Edge Gilding.", "barcode_qr": "Dynamic QR Code + Barcode 128", "terms_clause": "Valid for 36 months from issue date across luxury partner hotel network.", "deadline": "2026-09-24"}', 100),

('PRJ-TRV-2026-010', 110, 'cl-bidvest', 'incentive_travel', 'trv-printed-docs', 'Mauritius Executive Leaders Summit Collateral', 'Mauritius Leaders Retreat 2026', 'Complete travel pack: 16-page landscape wire-bound itinerary guide, personalised baggage straps, and yacht day pass cards.', 'high', 'CLIENT_APPROVAL', 'due_soon', 'V2.0', 'usr-am-2', 'usr-des-1', 'usr-qa-2', 'usr-client-1', '["usr-des-1", "usr-am-2"]', '2026-09-04T08:30:00Z', '2026-09-18T11:30:00Z', '2026-09-06', '2026-09-06T15:00:00Z', 'Sophia Chen', '2026-09-10', '2026-09-13', '2026-09-15', '2026-09-19', '2026-09-21', '2026-09-23', 'Final resort dinner seating charts from Constance Prince Maurice.', 'Delivery to airport departure lounge 48h prior to flight.', '', 'Bidvest Litho & Packaging', 'Provide formal client sign-off on V2.0 final artwork proof', 'Helena Du Plessis', '2026-09-19', 'pending', 1, 1, '{"trip_destination": "Mauritius (Constance Prince Maurice)", "selected_catalog_items": ["Itinerary Brochures", "Luggage/Gift Tags", "Meal Cards", "Welcome Notes", "Bidvest Vouchers"], "document_specifications": "16-page Wire-O brochure, 150 luggage tags, 300 custom meal cards.", "content_details": "Private Catamaran Charter Day 3, Gala Dinner Day 4.", "approval_deadline": "2026-09-19"}', 100),

('PRJ-MKT-2026-011', 111, 'cl-bidvest', 'marketing', 'mkt-brand-guidelines', 'Bidvest Global 2026 Corporate Identity Book & Asset Library', 'Corporate Identity 2026', 'Comprehensive 64-page global brand guideline publication detailing logo clear space, tone of voice, typography and video bumpers.', 'medium', 'FINAL_QA', 'on_track', 'V2.0', 'usr-am-2', 'usr-des-1', 'usr-qa-1', 'usr-mkt-mgr', '["usr-des-1", "usr-qa-1", "usr-mkt-mgr"]', '2026-09-01T09:00:00Z', '2026-09-18T10:15:00Z', '2026-09-03', '2026-09-03T16:00:00Z', 'Marcus Sterling', '2026-09-08', '2026-09-11', '2026-09-14', '2026-09-16', '2026-09-19', '2026-09-21', 'Final high-res asset exports in EPS, SVG, and Adobe Swatch Exchange (ASE).', 'Colour calibration profiles for global regional subsidiaries.', '', '', 'Run final pre-flight check on all 64 pages and packaging ZIP archive', 'Hannah Wright', '2026-09-19', 'approved', 1, 1, '{"brand": "Bidvest Premier Global", "deliverable": "64-page Interactive Brand Guidelines PDF + Vector Asset Kit", "scope": "Logo clear zones, primary/secondary palettes, typography scales, photo art direction, co-branding.", "deadline": "2026-09-21"}', 100),

('PRJ-RAM-2026-012', 112, 'cl-woolworths', 'online_ram', 'ram-sprint-banners', 'Woolies WFS Spring Cashback Double-Up Sprint', 'WFS Double Rewards 2026', 'Store portal hero sliders, digital till screen graphics, and mobile app push message preview assets.', 'medium', 'FINAL_RELEASE', 'on_track', 'V1.0', 'usr-am-1', 'usr-des-3', 'usr-qa-1', 'usr-ram-mgr', '["usr-des-3", "usr-am-1"]', '2026-08-28T09:00:00Z', '2026-09-17T16:00:00Z', '2026-08-30', '2026-08-30T14:00:00Z', 'David Ndlovu', '2026-09-05', '2026-09-08', '2026-09-11', '2026-09-14', '2026-09-16', '2026-09-18', 'Woolworths IT sign-off on till screen aspect ratios.', 'None.', '', '', 'Transmit final high-res package and FTP upload to Woolworths CMS server', 'David Ndlovu', '2026-09-18', 'approved', 1, 1, '{"client_name": "Woolworths Financial Services", "sprint_name": "Spring Cashback Double-Up", "title_subtitle": "Earn 2X WFS Cashback on All Fashion & Food This Weekend", "cta_destination": "Swipe Card at Till | /rewards-double", "dimensions": "Hero: 1920x550, Till screen: 1024x768, App banner: 800x400", "deadline": "2026-09-18"}', 100),

('PRJ-TRV-2026-013', 113, 'cl-standardbank', 'incentive_travel', 'trv-printed-docs', 'Kyoto & Tokyo VIP Travel Experience Master Suite', 'Pinnacle Japan 2026', 'Full luxury Japanese washi paper printed itinerary box, bilingual taxi cards, bullet train seat reservations booklet, and gold-embossed baggage tags.', 'high', 'COMPLETED', 'completed', 'V2.0', 'usr-am-1', 'usr-des-1', 'usr-qa-2', 'usr-client-1', '["usr-des-1", "usr-am-1", "usr-trv-mgr"]', '2026-08-20T08:00:00Z', '2026-09-15T12:00:00Z', '2026-08-22', '2026-08-22T11:00:00Z', 'Sophia Chen', '2026-08-28', '2026-08-31', '2026-09-03', '2026-09-07', '2026-09-10', '2026-09-12', 'Bilingual translation certification by Tokyo Japanese Bureau.', 'Customs clearance for handmade Washi gift boxes.', '', 'Kyoto Paper Artisans & Local Tokyo DMC', 'Project completed and delivered to Standard Bank VIP Private Banking', 'Chloe Bennett', '2026-09-12', 'approved', 1, 1, '{"trip_destination": "Kyoto, Tokyo & Hakone, Japan", "selected_catalog_items": ["Itinerary Brochures", "Wallet inserts", "Luggage/Gift Tags", "Welcome Notes", "Emergency Care Cards", "Meal Cards", "Tickets Covers"], "document_specifications": "Custom silk-screened wooden gift boxes containing 24-page Japanese-bound itinerary booklets with gold foil crest.", "approval_deadline": "2026-09-07"}', 100);

-- 5. Tasks
INSERT INTO `tasks` (`id`, `project_id`, `title`, `description`, `assigned_to_user_id`, `assigned_to_name`, `role_required`, `status`, `priority`, `due_date`, `stage`, `is_blocking`, `estimated_hours`, `actual_hours`, `checklist`) VALUES
('tsk-001', 'PRJ-MKT-2026-001', 'Complete Mandatory Brief Fields', 'Fill in LinkedIn target personas, carousel slide outlines, and CTA links.', 'usr-am-1', 'Chloe Bennett', 'account_manager', 'in_progress', 'high', '2026-09-20', 'REQUESTED', 1, 2.50, 1.50, '[{"id": "chk-1", "text": "Confirm carousel page count (5-7 pages)", "completed": true}, {"id": "chk-2", "text": "Input headline copy approved by client", "completed": true}, {"id": "chk-3", "text": "Provide high-res Discovery Vitality vector logo", "completed": false}]'),

('tsk-002', 'PRJ-RAM-2026-002', 'Verify Nissan Red Hex & Font Licenses', 'Check Nissan Brand Guidelines and validate #C3002F crimson value.', 'usr-ram-mgr', 'David Ndlovu', 'department_manager', 'todo', 'urgent', '2026-09-19', 'BRIEF_VALIDATION', 1, 1.00, 0.00, '[{"id": "chk-4", "text": "Verify sprint dates (19-21 Sept)", "completed": true}, {"id": "chk-5", "text": "Check double points prize pool value", "completed": false}]'),

('tsk-003', 'PRJ-TRV-2026-003', 'Design V1 Digital Portal Headers', 'Create 1920x600 header and mobile teaser banners in Photoshop.', 'usr-des-1', 'Liam Gallagher', 'designer', 'in_progress', 'medium', '2026-09-22', 'BRIEF_LOCKED', 1, 6.00, 2.00, '[{"id": "chk-6", "text": "Retouch high-altitude alpine resort imagery", "completed": true}, {"id": "chk-7", "text": "Position Standard Bank gold crest emblem", "completed": false}]'),

('tsk-004', 'PRJ-TRV-2026-004', 'InDesign Layout: 120 Luggage Tags & PVC Cards', 'Set up multi-page InDesign document with 3mm bleed and copper foil die-lines.', 'usr-des-1', 'Liam Gallagher', 'designer', 'in_progress', 'urgent', '2026-09-21', 'PRODUCTION', 1, 12.00, 8.50, '[{"id": "chk-8", "text": "Verify emergency phone numbers with Emirates desk", "completed": true}, {"id": "chk-9", "text": "Set copper foil separation layer", "completed": true}, {"id": "chk-10", "text": "Generate high-res PDF/X-1a pre-flight proof", "completed": false}]'),

('tsk-005', 'PRJ-RAM-2026-006', 'Perform Responsive QA Inspection', 'Inspect leaderboard responsiveness across desktop, tablet, and mobile.', 'usr-qa-1', 'Hannah Wright', 'qa_user', 'todo', 'high', '2026-09-19', 'INTERNAL_QA', 1, 3.00, 0.50, '[{"id": "chk-11", "text": "Test leaderboard pagination", "completed": true}, {"id": "chk-12", "text": "Check brand logo clear spacing", "completed": false}]'),

('tsk-006', 'PRJ-MKT-2026-008', 'Client Review & Sign-Off Confirmation', 'Bradley Cooper to review 10-slide Instagram carousel and provide formal sign-off.', 'usr-client-1', 'Bradley Cooper', 'client', 'todo', 'high', '2026-09-20', 'CLIENT_REVIEW', 1, 2.00, 1.00, '[{"id": "chk-13", "text": "Review slide 4 copy", "completed": true}, {"id": "chk-14", "text": "Submit approval record", "completed": false}]'),

('tsk-007', 'PRJ-RAM-2026-009', 'Update Voucher Validity Clause to 36 Months', 'Amend clause 4 on card back from 12 to 36 months and regenerate V1.1 proof.', 'usr-des-3', 'Lucas Thorne', 'designer', 'in_progress', 'urgent', '2026-09-19', 'REVISION', 1, 2.00, 1.50, '[{"id": "chk-15", "text": "Update reverse text in Illustrator", "completed": true}, {"id": "chk-16", "text": "Re-verify Barcode 128 readability", "completed": false}]'),

('tsk-008', 'PRJ-TRV-2026-010', 'Final Executive Approval Sign-off', 'Helena Du Plessis to submit formal digital approval for Mauritius brochures.', 'usr-client-1', 'Bradley Cooper', 'client', 'todo', 'high', '2026-09-19', 'CLIENT_APPROVAL', 1, 1.50, 0.50, '[{"id": "chk-17", "text": "Confirm 1,200 print run quantity", "completed": true}, {"id": "chk-18", "text": "Sign digital approval declaration", "completed": false}]'),

('tsk-009', 'PRJ-MKT-2026-011', 'Final Pre-flight QA & Print Package Archive', 'Inspect 64-page CI book PDF against pre-flight ISO standards.', 'usr-qa-1', 'Hannah Wright', 'qa_user', 'in_progress', 'medium', '2026-09-19', 'FINAL_QA', 1, 4.00, 3.00, '[{"id": "chk-19", "text": "Check CMYK 300DPI embedded images", "completed": true}, {"id": "chk-20", "text": "Validate font embedding and vector outlines", "completed": true}]'),

('tsk-010', 'PRJ-RAM-2026-012', 'FTP Upload to Woolworths CMS Production Server', 'Package and upload final production banners to Woolworths CDN.', 'usr-ram-mgr', 'David Ndlovu', 'department_manager', 'todo', 'medium', '2026-09-18', 'FINAL_RELEASE', 1, 1.50, 0.50, '[{"id": "chk-21", "text": "Upload 1920x550 hero banners", "completed": false}, {"id": "chk-22", "text": "Confirm CDN cache purge", "completed": false}]');

-- 6. Deliverable Versions
INSERT INTO `deliverable_versions` (`id`, `project_id`, `version_number`, `title`, `file_url`, `preview_url`, `uploaded_by`, `uploaded_by_name`, `uploaded_at`, `description`, `status`, `is_locked`, `qa_result`, `qa_notes`, `changelog`) VALUES
('ver-001', 'PRJ-MKT-2026-008', 'V1.0', 'Vitality Spring Vitalize 2026 — 10-Slide Instagram Carousel Master', 'https://files.uicms.com/deliverables/Vitality_Spring_V1.0.pdf', 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=1200&auto=format&fit=crop&q=80', 'usr-des-1', 'Liam Gallagher', '2026-09-16T14:30:00Z', 'Initial complete artwork for 10-slide Instagram carousel series.', 'client_review', 0, 'PASS_WITH_NOTES', 'Artwork meets brand guidelines. High quality visuals.', 'Initial V1.0 release.'),

('ver-002', 'PRJ-RAM-2026-006', 'V1.0', 'Nissan Apex Challenge Rewards Leaderboard UI Components', 'https://files.uicms.com/deliverables/Nissan_Apex_Leaderboard_V1.0.zip', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&auto=format&fit=crop&q=80', 'usr-des-3', 'Lucas Thorne', '2026-09-17T09:00:00Z', 'Full Figma UI export including desktop, tablet, and mobile responsiveness.', 'internal_qa', 0, NULL, NULL, 'Initial responsive bundle.'),

('ver-003', 'PRJ-RAM-2026-009', 'V1.1', 'Standard Bank Wealth Mastercard Physical Voucher Artwork', 'https://files.uicms.com/deliverables/SB_Wealth_Voucher_V1.1.pdf', 'https://images.unsplash.com/photo-1556742049-0a67e557b683?w=1200&auto=format&fit=crop&q=80', 'usr-des-3', 'Lucas Thorne', '2026-09-18T14:00:00Z', 'Updated clause 4 validity duration to 36 months per client request.', 'draft', 0, NULL, NULL, 'Amended validity clause per client feedback.'),

('ver-004', 'PRJ-TRV-2026-010', 'V2.0', 'Mauritius Itinerary Brochure & Welcome Suite Master', 'https://files.uicms.com/deliverables/Mauritius_Suite_V2.0.pdf', 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&auto=format&fit=crop&q=80', 'usr-des-1', 'Liam Gallagher', '2026-09-17T11:00:00Z', 'Revised day 3 catamaran departure time (14:30) and updated flight baggage rules.', 'client_review', 0, 'PASS', '100% compliance across all 14 QA criteria. High quality.', 'Adjusted catamaran timing from 15:00 to 14:30 per DMC confirmation.');

-- 7. QA Submissions
INSERT INTO `qa_submissions` (`id`, `project_id`, `version_id`, `result`, `performed_by`, `performed_by_name`, `performed_at`, `checklist`, `overall_notes`, `passed_count`, `failed_count`, `na_count`) VALUES
('qa-sub-001', 'PRJ-MKT-2026-008', 'ver-001', 'PASS_WITH_NOTES', 'usr-qa-1', 'Hannah Wright', '2026-09-17T09:30:00Z', '[{"id": "qa-1", "category": "Brand & Typography", "title": "Logo clear zone compliant", "checked": true}, {"id": "qa-2", "category": "Brand & Typography", "title": "Discovery Blue (#004080) verified", "checked": true}, {"id": "qa-3", "category": "Resolution & Pre-flight", "title": "Minimum 300 DPI on all assets", "checked": true}]', 'Artwork meets all brand compliance rules. Hex codes and typography verified. Approved for client review.', 14, 0, 0),

('qa-sub-002', 'PRJ-TRV-2026-010', 'ver-004', 'PASS', 'usr-qa-2', 'Tariq Mansour', '2026-09-17T14:15:00Z', '[{"id": "qa-1", "category": "Print Specifications", "title": "Die-lines and 3mm bleed verified", "checked": true}, {"id": "qa-2", "category": "Logistics & Accuracy", "title": "Emergency telephone numbers verified", "checked": true}]', 'Flawless pre-flight inspection. Die-lines, bleed, emergency contacts, and gold foil plates 100% correct.', 16, 0, 0);

-- 8. Client Approvals
INSERT INTO `client_approvals` (`id`, `project_id`, `version_id`, `version_number`, `client_id`, `decision`, `client_name`, `client_position`, `confirmation_text`, `comments`, `changes_requested`, `approved_at`, `signature_hash`) VALUES
('appr-001', 'PRJ-MKT-2026-011', 'ver-prev-11', 'V2.0', 'cl-bidvest', 'APPROVED', 'Helena Du Plessis', 'Executive Director: Strategy & Global Travel', 'I confirm that the Bidvest Global Leaders 2026 brochures and stage fabric backdrops are approved for final print run.', 'Superb work by the team. Please proceed with printing 1,200 copies immediately.', '[]', '2026-09-16T10:15:00Z', 'sig_b89f2a99c0d12e88a1b');

-- 9. Feedback Items
INSERT INTO `feedback_items` (`id`, `project_id`, `version`, `submitted_by`, `submitted_by_name`, `submitted_at`, `feedback_text`, `attachment_url`, `assigned_to`, `assigned_to_name`, `priority`, `status`, `type`) VALUES
('fb-001', 'PRJ-RAM-2026-009', 'V1.0', 'usr-client-1', 'Bradley Cooper', '2026-09-17T15:20:00Z', 'Clause 4 on the voucher reverse currently states "Valid for 12 months". Wealth executive policy dictates high-value vouchers must remain valid for 36 months. Please adjust and regenerate V2 proof.', NULL, 'usr-des-3', 'Lucas Thorne', 'high', 'in_progress', 'action_required'),

('fb-002', 'PRJ-MKT-2026-008', 'V1.0', 'usr-am-1', 'Chloe Bennett', '2026-09-17T11:00:00Z', 'Client loves the aesthetic! They requested we make sure the Vitality hashtag #LiveLifeWithVitality is capitalized exactly as shown.', NULL, 'usr-des-1', 'Liam Gallagher', 'medium', 'resolved', 'for_information');

-- 10. Notifications
INSERT INTO `notifications` (`id`, `user_id`, `project_id`, `type`, `title`, `message`, `is_read`, `created_at`, `target_tab`) VALUES
('notif-001', 'usr-admin', 'PRJ-MKT-2026-001', 'new_request', 'New Marketing Request Submitted', 'Chloe Bennett submitted "Q4 Executive Leadership Series — LinkedIn" for Discovery Group.', 0, '2026-09-18T09:15:00Z', 'brief'),
('notif-002', 'usr-client-1', 'PRJ-MKT-2026-008', 'approval_required', 'Approval Required: Instagram Carousel V1.0', 'Vitality Spring Vitalize 2026 is ready for client review and sign-off.', 0, '2026-09-18T12:00:00Z', 'approval'),
('notif-003', 'usr-des-3', 'PRJ-RAM-2026-009', 'client_feedback', 'Client Revision Requested: Standard Bank Vouchers', 'Bradley Cooper requested an update to validity clause (36 months).', 1, '2026-09-17T15:20:00Z', 'feedback'),
('notif-004', 'usr-qa-1', 'PRJ-RAM-2026-006', 'qa_required', 'QA Inspection Required', 'Nissan Apex Challenge Rewards Portal CMS V1.0 is waiting for your QA inspection.', 0, '2026-09-18T15:45:00Z', 'qa');

-- 11. Chat Messages
INSERT INTO `chat_messages` (`id`, `project_id`, `sender_id`, `sender_name`, `sender_avatar`, `message`, `created_at`, `mentions`, `referenced_task_id`, `is_important`) VALUES
('msg-001', 'PRJ-TRV-2026-004', 'usr-am-1', 'Chloe Bennett', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80', '@Liam Gallagher I have uploaded the final flight manifests and hotel rooming lists. The emergency numbers are also verified with Emirates.', '2026-09-18T10:15:00Z', '["usr-des-1"]', NULL, 1),
('msg-002', 'PRJ-TRV-2026-004', 'usr-des-1', 'Liam Gallagher', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80', 'Received! Setting up the luggage tag die-line with copper foil separation right now. Will have V1.0 ready for internal QA by tomorrow morning.', '2026-09-18T10:20:00Z', NULL, 'tsk-004', 0),
('msg-003', 'PRJ-MKT-2026-008', 'usr-client-1', 'Bradley Cooper', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80', 'The visual balance on slide 4 is fantastic. Checking with our compliance lead this afternoon and will provide final sign-off.', '2026-09-18T13:40:00Z', NULL, NULL, 0);

-- 12. Activity Logs (Audit Trail)
INSERT INTO `activity_logs` (`id`, `project_id`, `user_id`, `user_name`, `action`, `description`, `timestamp`, `previous_stage`, `new_stage`) VALUES
('act-001', 'PRJ-MKT-2026-001', 'usr-am-1', 'Chloe Bennett', 'REQUEST_CREATED', 'Submitted new request "Q4 Executive Leadership Series — LinkedIn" for Discovery Group.', '2026-09-18T09:15:00Z', NULL, 'REQUESTED'),
('act-002', 'PRJ-TRV-2026-003', 'usr-trv-mgr', 'Sophia Chen', 'BRIEF_LOCKED', 'Validated 100% brief completeness and locked brief. Production initiated.', '2026-09-18T09:45:00Z', 'BRIEF_VALIDATION', 'BRIEF_LOCKED'),
('act-003', 'PRJ-MKT-2026-008', 'usr-qa-1', 'Hannah Wright', 'QA_PASSED', 'Completed QA Checklist for V1.0 (Result: PASS WITH NOTES). Project routed to Client Review.', '2026-09-17T09:30:00Z', 'INTERNAL_QA', 'CLIENT_REVIEW'),
('act-004', 'PRJ-RAM-2026-009', 'usr-client-1', 'Bradley Cooper', 'FEEDBACK_SUBMITTED', 'Client submitted revision feedback on voucher validity clause. Project moved to Revision.', '2026-09-17T15:20:00Z', 'CLIENT_REVIEW', 'REVISION'),
('act-005', 'PRJ-MKT-2026-011', 'usr-am-2', 'Julian Rossi', 'CLIENT_APPROVED', 'Client Helena Du Plessis approved V2.0 with documented confirmation. Locked approved version.', '2026-09-16T10:15:00Z', 'CLIENT_APPROVAL', 'FINAL_QA');

-- 13. System Settings
INSERT INTO `admin_settings` (`setting_key`, `setting_value`) VALUES
('system_config', '{"appName": "UICMS Creative Workflow", "appSubtitle": "Brief. Create. Review. Approve. Deliver.", "emailNotifications": {"newRequests": true, "assignment": true, "taskDue": true, "taskOverdue": true, "feedback": true, "approval": true, "qa": true, "completion": true}, "escalationRules": {"notify3DaysBefore": true, "notify1DayBefore": true, "notifyDueToday": true, "notifyOverdue": true, "escalate2DaysOverdue": true}, "activeDepartments": {"marketing": true, "incentive_travel": true, "online_ram": true, "development": false}, "workflowRules": {"enforceBriefLockForProduction": true, "enforceQABeforeClientReview": true, "enforceApprovalBeforeRelease": true, "allowManagerOverride": true}}');

-- =============================================================================
-- 14. ROW-LEVEL SECURITY (RLS) & MULTI-TENANT ISOLATION VIEWS
-- Enforces row-level access control based on user identity, role, and department.
-- =============================================================================

-- View 1: Sanitized Users (Never exposes password hashes or raw credentials)
CREATE OR REPLACE VIEW `vw_safe_users` AS
SELECT 
  `id`, `name`, `email`, `personal_email`, `role`, `role_title`, 
  `department_id`, `avatar`, `active`, `is_suspended`, 
  `suspension_reason`, `workload_count`, `created_at`, `updated_at`
FROM `users`;

-- View 2: Row-Level Security for Projects
CREATE OR REPLACE VIEW `vw_rls_projects` AS
SELECT p.*
FROM `projects` p
WHERE 
  COALESCE(@uicms_current_role, 'super_admin') = 'super_admin'
  OR (COALESCE(@uicms_current_role, '') = 'department_manager' AND p.department_id = COALESCE(@uicms_current_dept, p.department_id))
  OR (COALESCE(@uicms_current_role, '') = 'client' AND p.client_id = COALESCE(@uicms_current_client_id, ''))
  OR (
    COALESCE(@uicms_current_role, '') IN ('designer', 'qa_user', 'account_manager')
    AND (
      p.accountable_user_id = COALESCE(@uicms_current_user_id, '')
      OR p.project_owner_id = COALESCE(@uicms_current_user_id, '')
      OR p.qa_owner_id = COALESCE(@uicms_current_user_id, '')
      OR p.approver_id = COALESCE(@uicms_current_user_id, '')
      OR JSON_CONTAINS(p.contributor_ids, JSON_QUOTE(COALESCE(@uicms_current_user_id, '')))
    )
  );

-- View 3: Row-Level Security for Tasks
CREATE OR REPLACE VIEW `vw_rls_tasks` AS
SELECT t.*
FROM `tasks` t
JOIN `projects` p ON t.project_id = p.id
WHERE 
  COALESCE(@uicms_current_role, 'super_admin') = 'super_admin'
  OR (COALESCE(@uicms_current_role, '') = 'client' AND p.client_id = COALESCE(@uicms_current_client_id, '') AND t.is_client_facing = 1)
  OR (COALESCE(@uicms_current_role, '') != 'client' AND (t.assigned_to_user_id = COALESCE(@uicms_current_user_id, '') OR p.department_id = COALESCE(@uicms_current_dept, p.department_id)));

-- View 4: Row-Level Security for Client Approvals
CREATE OR REPLACE VIEW `vw_rls_client_approvals` AS
SELECT ca.*
FROM `client_approvals` ca
JOIN `projects` p ON ca.project_id = p.id
WHERE 
  COALESCE(@uicms_current_role, 'super_admin') = 'super_admin'
  OR (COALESCE(@uicms_current_role, '') = 'client' AND (ca.client_id = COALESCE(@uicms_current_client_id, '') OR p.client_id = COALESCE(@uicms_current_client_id, '')))
  OR (COALESCE(@uicms_current_role, '') != 'client');

-- View 5: Row-Level Security for Feedback Items
CREATE OR REPLACE VIEW `vw_rls_feedback_items` AS
SELECT f.*
FROM `feedback_items` f
JOIN `projects` p ON f.project_id = p.id
WHERE 
  COALESCE(@uicms_current_role, 'super_admin') = 'super_admin'
  OR (COALESCE(@uicms_current_role, '') = 'client' AND p.client_id = COALESCE(@uicms_current_client_id, ''))
  OR (COALESCE(@uicms_current_role, '') != 'client');

SET FOREIGN_KEY_CHECKS = 1;
COMMIT;
