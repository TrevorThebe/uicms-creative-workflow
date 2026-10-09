-- ==============================================================================
-- UICMS WORKFLOW & REST API - COMPLETE DATABASE SCHEMA & DEMO DATA SEED SCRIPT
-- Target Database: uicms_workflow
-- phpMyAdmin URL: http://localhost/phpmyadmin/index.php?route=/database/structure&db=uicms_workflow
-- Compatible with: MySQL 8.0+, MariaDB 10.4+, XAMPP, WAMP, Docker, AWS RDS
-- Generated At: 2026-10-04T15:15:23.564Z
-- ==============================================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------------------------
-- Database Creation
-- ------------------------------------------------------------------------------
CREATE DATABASE IF NOT EXISTS `uicms_workflow` 
  DEFAULT CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE `uicms_workflow`;

-- ------------------------------------------------------------------------------
-- 1. Table: departments
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `departments` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT NULL,
  `icon` VARCHAR(50) NULL,
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 2. Table: users
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `personal_email` VARCHAR(150) NULL,
  `password` VARCHAR(255) NOT NULL DEFAULT '',
  `role` VARCHAR(50) NOT NULL DEFAULT 'designer',
  `role_title` VARCHAR(150) NOT NULL DEFAULT 'Team Member',
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
  KEY `idx_user_dept` (`department_id`),
  KEY `idx_user_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 3. Table: clients
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `clients` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `code` VARCHAR(50) NOT NULL UNIQUE,
  `industry` VARCHAR(100) NULL,
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
  `status` VARCHAR(50) NOT NULL DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 4. Table: projects
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `projects` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `project_number` INT NULL,
  `client_id` VARCHAR(50) NOT NULL,
  `department_id` VARCHAR(50) NOT NULL DEFAULT 'marketing',
  `request_type_id` VARCHAR(50) NULL,
  `project_name` VARCHAR(255) NOT NULL,
  `campaign_name` VARCHAR(255) NULL,
  `description` TEXT NULL,
  `priority` VARCHAR(20) NOT NULL DEFAULT 'medium',
  `stage` VARCHAR(50) NOT NULL DEFAULT 'REQUESTED',
  `status` VARCHAR(50) NOT NULL DEFAULT 'on_track',
  `version` VARCHAR(20) NOT NULL DEFAULT 'V0.1',
  `accountable_user_id` VARCHAR(50) NULL,
  `project_owner_id` VARCHAR(50) NULL,
  `qa_owner_id` VARCHAR(50) NULL,
  `approver_id` VARCHAR(50) NULL,
  `contributor_ids` JSON NULL,
  `created_at` VARCHAR(50) NULL,
  `updated_at` VARCHAR(50) NULL,
  `brief_due_date` VARCHAR(50) NULL,
  `production_due_date` VARCHAR(50) NULL,
  `internal_qa_due_date` VARCHAR(50) NULL,
  `client_review_due_date` VARCHAR(50) NULL,
  `client_approval_due_date` VARCHAR(50) NULL,
  `final_qa_due_date` VARCHAR(50) NULL,
  `release_date` VARCHAR(50) NULL,
  `external_suppliers` TEXT NULL,
  `next_action_task` VARCHAR(255) NULL,
  `next_action_owner` VARCHAR(100) NULL,
  `next_action_due` VARCHAR(50) NULL,
  `approval_status` VARCHAR(50) NOT NULL DEFAULT 'not_requested',
  `is_brief_locked` TINYINT(1) NOT NULL DEFAULT 0,
  `is_version_locked` TINYINT(1) NOT NULL DEFAULT 0,
  `brief_data` JSON NULL,
  `brief_completeness` INT NOT NULL DEFAULT 0,
  KEY `idx_proj_client` (`client_id`),
  KEY `idx_proj_dept` (`department_id`),
  KEY `idx_proj_stage` (`stage`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 5. Table: tasks
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tasks` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `project_id` VARCHAR(50) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `assigned_to` VARCHAR(50) NULL,
  `assigned_to_name` VARCHAR(100) NULL,
  `assigned_to_user_id` VARCHAR(50) NULL,
  `role_required` VARCHAR(50) NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'todo',
  `priority` VARCHAR(20) NOT NULL DEFAULT 'medium',
  `start_date` VARCHAR(50) NULL,
  `due_date` VARCHAR(50) NULL,
  `completed_at` VARCHAR(50) NULL,
  `stage` VARCHAR(50) NOT NULL DEFAULT 'PRODUCTION',
  `checklist` JSON NULL,
  `comments_count` INT NOT NULL DEFAULT 0,
  KEY `idx_task_proj` (`project_id`),
  KEY `idx_task_assign` (`assigned_to_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 6. Table: project_files
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `project_files` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `project_id` VARCHAR(50) NOT NULL,
  `filename` VARCHAR(255) NOT NULL,
  `size` INT NOT NULL DEFAULT 0,
  `type` VARCHAR(100) NULL,
  `version` VARCHAR(20) NULL DEFAULT 'V1.0',
  `uploaded_by` VARCHAR(50) NULL,
  `uploaded_by_name` VARCHAR(100) NULL,
  `uploaded_at` VARCHAR(50) NULL,
  `category` VARCHAR(50) NULL,
  `url` VARCHAR(500) NOT NULL,
  `description` TEXT NULL,
  KEY `idx_file_proj` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 7. Table: deliverable_versions
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `deliverable_versions` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `project_id` VARCHAR(50) NOT NULL,
  `version_number` VARCHAR(20) NOT NULL DEFAULT 'V1.0',
  `title` VARCHAR(255) NOT NULL,
  `file_url` VARCHAR(500) NOT NULL,
  `preview_url` VARCHAR(500) NULL,
  `uploaded_by` VARCHAR(50) NULL,
  `uploaded_by_name` VARCHAR(100) NULL,
  `uploaded_at` VARCHAR(50) NULL,
  `description` TEXT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'draft',
  `is_locked` TINYINT(1) NOT NULL DEFAULT 0,
  `qa_result` VARCHAR(50) NULL,
  `qa_notes` TEXT NULL,
  `changelog` TEXT NULL,
  KEY `idx_ver_proj` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 8. Table: qa_submissions
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `qa_submissions` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `project_id` VARCHAR(50) NOT NULL,
  `version_id` VARCHAR(50) NOT NULL,
  `qa_owner_id` VARCHAR(50) NOT NULL,
  `qa_owner_name` VARCHAR(100) NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'pending',
  `submitted_at` VARCHAR(50) NULL,
  `reviewed_at` VARCHAR(50) NULL,
  `notes` TEXT NULL,
  `changes_requested` JSON NULL,
  KEY `idx_qa_proj` (`project_id`),
  KEY `idx_qa_ver` (`version_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 9. Table: client_approvals
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `client_approvals` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `project_id` VARCHAR(50) NOT NULL,
  `version_id` VARCHAR(50) NOT NULL,
  `client_id` VARCHAR(50) NOT NULL,
  `approver_id` VARCHAR(50) NULL,
  `approver_name` VARCHAR(100) NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'pending',
  `requested_at` VARCHAR(50) NULL,
  `decided_at` VARCHAR(50) NULL,
  `feedback` TEXT NULL,
  `signature_hash` VARCHAR(255) NULL,
  KEY `idx_appr_proj` (`project_id`),
  KEY `idx_appr_client` (`client_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 10. Table: feedback_items
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `feedback_items` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `project_id` VARCHAR(50) NOT NULL,
  `version_id` VARCHAR(50) NULL,
  `author_id` VARCHAR(50) NOT NULL,
  `author_name` VARCHAR(100) NULL,
  `author_role` VARCHAR(50) NULL,
  `comment` TEXT NOT NULL,
  `created_at` VARCHAR(50) NULL,
  `assigned_to` VARCHAR(50) NULL,
  `assigned_to_name` VARCHAR(100) NULL,
  `priority` VARCHAR(20) NOT NULL DEFAULT 'medium',
  `status` VARCHAR(50) NOT NULL DEFAULT 'open',
  `type` VARCHAR(50) NOT NULL DEFAULT 'action_required',
  KEY `idx_fb_proj` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 11. Table: notifications
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `user_id` VARCHAR(50) NOT NULL,
  `project_id` VARCHAR(50) NULL,
  `type` VARCHAR(50) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `is_read` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` VARCHAR(50) NULL,
  `target_tab` VARCHAR(50) NULL,
  KEY `idx_notif_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 12. Table: chat_messages
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `chat_messages` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `project_id` VARCHAR(50) NULL,
  `sender_id` VARCHAR(50) NOT NULL,
  `sender_name` VARCHAR(100) NULL,
  `sender_avatar` VARCHAR(500) NULL,
  `sender_role` VARCHAR(50) NULL,
  `text` TEXT NOT NULL,
  `timestamp` VARCHAR(50) NULL,
  `mentions` JSON NULL,
  `referenced_task_id` VARCHAR(50) NULL,
  `is_important` TINYINT(1) NOT NULL DEFAULT 0,
  `recipient_id` VARCHAR(50) NULL,
  `channel_id` VARCHAR(50) NULL,
  `attachments` JSON NULL,
  `referenced_version` VARCHAR(50) NULL,
  KEY `idx_chat_proj` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 13. Table: activity_logs
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `activity_logs` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `project_id` VARCHAR(50) NULL,
  `user_id` VARCHAR(50) NULL,
  `user_name` VARCHAR(100) NULL,
  `action` VARCHAR(100) NOT NULL,
  `description` TEXT NULL,
  `timestamp` VARCHAR(50) NULL,
  `previous_stage` VARCHAR(50) NULL,
  `new_stage` VARCHAR(50) NULL,
  `version_ref` VARCHAR(50) NULL,
  `metadata` JSON NULL,
  KEY `idx_act_proj` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 14. Table: admin_settings
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `admin_settings` (
  `setting_key` VARCHAR(100) NOT NULL PRIMARY KEY,
  `setting_value` LONGTEXT NOT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 15. Table: products (REST API)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `products` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `price` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- DEMO DATA SEED STATEMENTS (IDEMPOTENT)
-- ==============================================================================

-- Seed Departments
INSERT INTO `departments` (`id`, `name`, `description`, `icon`, `active`) VALUES
('marketing', 'Marketing & Creative Production', 'Brand campaigns, digital media, social content, and marketing collateral.', 'Palette', 1),
('incentive_travel', 'Incentive Travel & Events Logistics', 'Travel programs, event materials, and print collateral.', 'Plane', 1),
('online_ram', 'Online (RAM) & Rewards Engineering', 'Digital reward platforms, dealer programs, and online campaign assets.', 'Flame', 1),
('development', 'Technology & Systems Engineering', 'Web applications, API integrations, and workflow automation.', 'Code', 1)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `description` = VALUES(`description`);

-- Seed Users
INSERT INTO `users` (`id`, `name`, `email`, `personal_email`, `password`, `role`, `role_title`, `department_id`, `avatar`, `active`, `is_suspended`, `must_change_password`) VALUES
('usr-super-admin', 'Alex Rivera', 'admin@uicms.internal', 'admin@uicms.internal', '$2y$10$TKh8H1.PfQx37YgCzwiKb.KjNyWgaHb9cbcoQgdIVFlYg7B77UdFm', 'super_admin', 'Chief Systems Administrator & Governance Lead', 'development', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', 1, 0, 0),
('usr-user-trevz', 'Trevz Administrator', 'trevztm@gmail.com', 'trevztm@gmail.com', '$2y$10$TKh8H1.PfQx37YgCzwiKb.KjNyWgaHb9cbcoQgdIVFlYg7B77UdFm', 'super_admin', 'Principal Technical Lead & Administrator', 'development', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', 1, 0, 0),
('usr-dept-manager', 'Sarah Jenkins', 's.jenkins@uicms.internal', 's.jenkins@uicms.internal', '$2y$10$TKh8H1.PfQx37YgCzwiKb.KjNyWgaHb9cbcoQgdIVFlYg7B77UdFm', 'department_manager', 'Creative & Production Department Head', 'marketing', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80', 1, 0, 0),
('usr-acct-manager', 'Marcus Vance', 'm.vance@uicms.internal', 'm.vance@uicms.internal', '$2y$10$TKh8H1.PfQx37YgCzwiKb.KjNyWgaHb9cbcoQgdIVFlYg7B77UdFm', 'account_manager', 'Senior Account Director & Client Partner', 'incentive_travel', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', 1, 0, 0),
('usr-designer', 'Elena Rostova', 'e.rostova@uicms.internal', 'e.rostova@uicms.internal', '$2y$10$TKh8H1.PfQx37YgCzwiKb.KjNyWgaHb9cbcoQgdIVFlYg7B77UdFm', 'designer', 'Senior Visual & Motion Designer', 'marketing', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80', 1, 0, 0),
('usr-des-3', 'Lucas Thorne', 'lucas.thorne@uicms.com', 'lucas.thorne@uicms.com', '$2y$10$TKh8H1.PfQx37YgCzwiKb.KjNyWgaHb9cbcoQgdIVFlYg7B77UdFm', 'designer', 'Digital Product & UI Designer', 'online_ram', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80', 1, 0, 0),
('usr-qa', 'David Chen', 'd.chen@uicms.internal', 'd.chen@uicms.internal', '$2y$10$TKh8H1.PfQx37YgCzwiKb.KjNyWgaHb9cbcoQgdIVFlYg7B77UdFm', 'qa_user', 'Quality Assurance & CI Compliance Lead', 'online_ram', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80', 1, 0, 0),
('usr-client', 'Emma Watson', 'emma.watson@apex-global.com', 'emma.watson@apex-global.com', '$2y$10$TKh8H1.PfQx37YgCzwiKb.KjNyWgaHb9cbcoQgdIVFlYg7B77UdFm', 'client', 'Executive Vice President of Brand Strategy', 'marketing', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80', 1, 0, 0)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `role` = VALUES(`role`), `role_title` = VALUES(`role_title`);

-- Seed Clients
INSERT INTO `clients` (`id`, `name`, `code`, `industry`, `logo_url`, `primary_contact_name`, `primary_contact_email`, `status`, `default_ci_colors`) VALUES
('cl-discovery', 'Discovery Group (Vitality)', 'DISC', 'General', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80', NULL, NULL, 'active', '["#004080","#FF6600","#F4F7FB","#1E293B"]'),
('cl-nissan', 'Nissan South Africa', 'NISN', 'General', 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=200&auto=format&fit=crop&q=80', NULL, NULL, 'active', '["#C3002F","#000000","#8A8D8F","#FFFFFF"]'),
('cl-standardbank', 'Standard Bank Wealth', 'SBWL', 'General', 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=200&auto=format&fit=crop&q=80', NULL, NULL, 'active', '["#0033A0","#0091FF","#F0F4FF","#0A192F"]'),
('cl-bidvest', 'Bidvest Premier Global', 'BIDV', 'General', 'https://images.unsplash.com/photo-1614680376593-902f749f7ffc?w=200&auto=format&fit=crop&q=80', NULL, NULL, 'active', '["#002B49","#C5A059","#E6EFF5"]'),
('cl-woolworths', 'Woolworths Financial Services', 'WFS', 'General', 'https://images.unsplash.com/photo-1542744094-3a31f272c490?w=200&auto=format&fit=crop&q=80', NULL, NULL, 'active', '["#000000","#2D6A4F","#F8F9FA"]')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `code` = VALUES(`code`);

-- Seed Projects
INSERT INTO `projects` (`id`, `project_number`, `client_id`, `department_id`, `request_type_id`, `project_name`, `campaign_name`, `description`, `priority`, `stage`, `status`, `version`, `accountable_user_id`, `project_owner_id`, `qa_owner_id`, `approver_id`, `contributor_ids`, `created_at`, `updated_at`, `brief_due_date`, `production_due_date`, `internal_qa_due_date`, `client_review_due_date`, `client_approval_due_date`, `final_qa_due_date`, `release_date`, `external_suppliers`, `next_action_task`, `next_action_owner`, `next_action_due`, `approval_status`, `is_brief_locked`, `is_version_locked`, `brief_data`, `brief_completeness`) VALUES
('PRJ-TEST-1791046575833', 0, 'cl-discovery', 'marketing', '', 'Untitled Project', '', 'Project created by automated database persistence test suite', 'high', 'REQUESTED', 'completed', 'V0.1', NULL, NULL, NULL, NULL, '[]', '2026-10-04T09:40:33.639Z', '2026-10-04T09:40:33.639Z', '2026-10-04', '2026-10-04', '2026-10-04', '2026-10-04', '2026-10-04', '2026-10-04', '2026-10-04', '', 'Review project progress', 'Project Owner', '2026-10-04', 'none', 0, 0, '{}', 0),
('PRJ-MKT-2026-001', 101, 'cl-discovery', 'marketing', 'mkt-social-linkedin', 'Q4 Executive Leadership Series — LinkedIn', 'Thought Leadership 2026', 'B2B executive thought leadership carousel banners spotlighting Discovery Vitality wellness innovation.', 'high', 'REQUESTED', 'on_track', 'V0.1', 'usr-am-1', 'usr-des-1', 'usr-qa-1', 'usr-client-1', '["usr-des-1","usr-mkt-mgr"]', '2026-09-18T09:15:00Z', '2026-09-18T09:15:00Z', '2026-09-20', '2026-09-24', '2026-09-26', '2026-09-28', '2026-09-30', '2026-10-02', '2026-10-04', 'Portrait Studio: ProPix Africa', 'Complete mandatory brief fields and lock brief', 'Chloe Bennett', '2026-09-20', 'none', 0, 0, '{"page_name":"Discovery Health Official LinkedIn","post_type":"Document / PDF Carousel (1080x1080 Multi-page)","headline":"The Next Decade of Preventative Healthcare Technology","caption_copy":"How AI and wearable telemetry are transforming preventive care. Explore key findings from our 2026 Vitality Global Study.","cta":"Download the Full 2026 Whitepaper","destination_url":"https://discovery.co.za/vitality/whitepaper-2026","publish_date":"2026-10-04"}', 90),
('PRJ-RAM-2026-002', 102, 'cl-nissan', 'online_ram', 'ram-sprint-banners', 'Spring Dealership Sprint Banners', 'Nissan Apex Q3 Sprint', 'Flash sales contest banners for national dealer principal portal hero slider and mobile view.', 'urgent', 'BRIEF_VALIDATION', 'due_soon', 'V0.2', 'usr-am-2', 'usr-des-3', 'usr-qa-1', 'usr-ram-mgr', '["usr-des-3","usr-ram-mgr"]', '2026-09-17T11:00:00Z', '2026-09-18T14:20:00Z', '2026-09-19', '2026-09-22', '2026-09-23', '2026-09-24', '2026-09-25', '2026-09-26', '2026-09-28', '', 'Validate brief completeness and verify Nissan Red CI values', 'David Ndlovu', '2026-09-19', 'none', 0, 0, '{"client_name":"Nissan South Africa","sprint_name":"Spring Apex Double Points Sprint (19-21 Sept)","title_subtitle":"Sell 3 Units -> Win R5,000 Instant Cash Voucher","cta_destination":"View Sprint Rules | /sprint-challenge","dimensions":"Hero: 1920x550px, Mobile: 800x400px","existing_banner":"New Banner Concept","deadline":"2026-09-28"}', 100),
('PRJ-TRV-2026-003', 103, 'cl-standardbank', 'incentive_travel', 'trv-banners', 'Swiss Alps Luxury Summit Location Banners', 'Pinnacle Club St. Moritz 2026', 'Digital teaser banners and registration portal headers showcasing St. Moritz winter wonderland.', 'medium', 'BRIEF_LOCKED', 'on_track', 'V1.0', 'usr-am-1', 'usr-des-1', 'usr-qa-2', 'usr-trv-mgr', '["usr-des-1","usr-des-2"]', '2026-09-15T08:30:00Z', '2026-09-18T10:00:00Z', '2026-09-17', '2026-09-22', '2026-09-24', '2026-09-26', '2026-09-28', '2026-09-30', '2026-10-02', 'Shutterstock Enterprise & Switzerland Tourism DMC', 'Commence V1 digital banner design mockups in Figma/Photoshop', 'Liam Gallagher', '2026-09-22', 'none', 1, 0, '{"destination":"St. Moritz & Zurich, Switzerland","trip_programme":"Standard Bank Pinnacle Club 2026","banner_purpose":"Registration Portal Header (1920x600)","title":"Ascend to Greatness — St. Moritz 2026","subtitle":"Qualifying Window: 1 March - 30 November 2026","destination_imagery":"Snow-capped peaks, Badrutt Palace hotel exterior, Glacier Express train.","client_branding":"Standard Bank Cobalt Blue crest on top-left, gold trim accents.","sizes":"1920x600px, 1200x628px, 1080x1080px","cta_url":"https://wealth.standardbank.com/pinnacle-2026","deadline":"2026-10-02"}', 100),
('PRJ-TRV-2026-004', 104, 'cl-discovery', 'incentive_travel', 'trv-printed-docs', 'Dubai Incentive Trip — Printed Travel Documents Suite', 'Dubai Horizon VIP Quest 2026', 'Comprehensive 21-piece travel document suite including luxury wallet inserts, luggage tags, meal cards, emergency PVC care cards and tickets covers.', 'urgent', 'PRODUCTION', 'on_track', 'V1.0', 'usr-am-1', 'usr-des-1', 'usr-qa-2', 'usr-client-1', '["usr-des-1","usr-am-1","usr-trv-mgr"]', '2026-09-12T09:00:00Z', '2026-09-18T16:00:00Z', '2026-09-14', '2026-09-21', '2026-09-23', '2026-09-25', '2026-09-27', '2026-09-29', '2026-10-01', 'Litho Print Express & PVC Card Masters', 'Finalize InDesign layout for 120 luggage tags and emergency cards', 'Liam Gallagher', '2026-09-21', 'none', 1, 0, '{"trip_destination":"Dubai & Abu Dhabi, UAE (Atlantis The Royal)","selected_catalog_items":["Wallet inserts","Meal Cards","Emergency Care Cards","Bidvest Vouchers","Luggage/Gift Tags","Welcome Notes","Tickets Covers","Itinerary Brochures"],"document_specifications":"Luggage tags: 120 units (Duplex board + gold foil), Emergency PVC Cards: 60 units with magnetic strip, Itinerary Brochures: Square 210mm Wire-O (16-page).","content_details":"Atlantis The Royal Dubai, Tour Director Dave Coetzee (+27 82 491 0000), Local DMC Gulf Ventures.","finish_diecut":"Matte soft-touch lamination, metallic copper foil accents on crest.","approval_deadline":"2026-09-27"}', 100),
('PRJ-MKT-2026-005', 105, 'cl-bidvest', 'marketing', 'mkt-business-cards', 'Bidvest Executive Business Cards & Stationery', 'Corporate Identity Refresh 2026', 'Executive embossed business cards for 15 C-suite directors with QR contact vCard encoding.', 'medium', 'PRODUCTION', 'due_soon', 'V1.0', 'usr-am-2', 'usr-des-3', 'usr-qa-1', 'usr-mkt-mgr', '["usr-des-3"]', '2026-09-14T10:00:00Z', '2026-09-18T11:30:00Z', '2026-09-16', '2026-09-20', '2026-09-22', '2026-09-24', '2026-09-26', '2026-09-28', '2026-09-30', 'MasterPrint Litho', 'Generate vector QR codes linking to vCard endpoints for all 15 names', 'Lucas Thorne', '2026-09-20', 'none', 1, 0, '{"full_name":"Helena Du Plessis, Group Executive Director","position":"Executive Director: Strategy & Global Travel","company_name":"Bidvest Premier Global Limited","telephone":"+27 (0)11 772 8700","email":"helena.dp@bidvest.co.za","website":"www.bidvest.co.za","physical_address":"Bidvest House, 18 Crescent Drive, Melrose Arch, JHB","size_quantity":"85x55mm, 500 units per director (15 directors)","print_specification":"400gsm Silk + Matt Lamination + Spot UV on Logo","approval_deadline":"2026-09-26"}', 100),
('PRJ-RAM-2026-006', 106, 'cl-nissan', 'online_ram', 'ram-incentive-websites', 'Nissan Apex Challenge Rewards Portal CMS', 'Nissan Apex Challenge 2026', 'Dynamic rewards portal with automated points tallying, dealership leaderboards, and voucher redemption shop.', 'urgent', 'INTERNAL_QA', 'on_track', 'V1.0', 'usr-am-2', 'usr-des-3', 'usr-qa-1', 'usr-ram-mgr', '["usr-des-3","usr-qa-1","usr-ram-mgr"]', '2026-09-08T08:00:00Z', '2026-09-18T15:45:00Z', '2026-09-10', '2026-09-17', '2026-09-19', '2026-09-22', '2026-09-25', '2026-09-27', '2026-09-29', 'Cloud Hosting Services', 'Complete internal QA checklist and verify security permissions', 'Hannah Wright', '2026-09-19', 'none', 1, 0, '{"client_name":"Nissan South Africa","campaign_name":"Nissan Apex Challenge 2026","website_purpose":"Complete Multi-tier Loyalty Portal","pages_nav":"Login, Dashboard Leaderboard, Points Wallet, Rewards Catalogue, Claims, Profile, FAQs","rewards_catalogue":"Takealot vouchers, Apple electronics, Safari weekend getaways.","forms_data_fields":"Dealer Code, VIN numbers, Target Units, Actual Sales.","launch_date":"2026-09-29","approver_name":"David Ndlovu & Rene Van Der Merwe"}', 100),
('PRJ-TRV-2026-007', 107, 'cl-standardbank', 'incentive_travel', 'trv-show-reels', 'Kyoto Autumn Immersion Travel Show Reel', 'Kyoto Autumn Immersion 2026', '4K cinematic 60-second reveal teaser showcasing traditional ryokans, private tea ceremonies, and bamboo groves.', 'high', 'INTERNAL_QA', 'on_track', 'V1.0', 'usr-am-1', 'usr-des-2', 'usr-qa-2', 'usr-trv-mgr', '["usr-des-2","usr-qa-2"]', '2026-09-09T10:00:00Z', '2026-09-18T14:00:00Z', '2026-09-11', '2026-09-17', '2026-09-19', '2026-09-22', '2026-09-24', '2026-09-26', '2026-09-28', 'AudioJungle Enterprise / Envato Elements', 'Conduct audio-visual QA checklist: check audio leveling and 4K color grading', 'Tariq Mansour', '2026-09-19', 'none', 1, 0, '{"destination":"Kyoto & Tokyo, Japan","objective":"Gala Dinner Big Reveal Teaser (60-90 sec)","duration":"60 seconds","sequence_story":"Arashiyama Bamboo Forest sunrise -> Traditional Kaiseki dinner -> Conrad Tokyo skyline -> Standard Bank crest reveal.","text_overlays":"\\"Where Tradition Meets Mastery\\", \\"Kyoto 2026\\", \\"Standard Bank Wealth Pinnacle Club\\"","audio_music":"Cinematic orchestral with traditional Shakuhachi flute and Koto","output_format":"4K UHD ProRes + MP4 H.264 (3840x2160)","deadline":"2026-09-28"}', 100),
('PRJ-MKT-2026-008', 108, 'cl-discovery', 'marketing', 'mkt-social-instagram', 'September Brand Awareness Instagram & LinkedIn Campaign', 'Vitality Spring Vitalize 2026', 'High-impact 6-slide Instagram carousel suite and matching story series promoting active outdoor habits.', 'urgent', 'CLIENT_REVIEW', 'due_soon', 'V1.0', 'usr-am-1', 'usr-des-1', 'usr-qa-1', 'usr-client-1', '["usr-des-1","usr-am-1","usr-qa-1"]', '2026-09-05T09:00:00Z', '2026-09-18T12:00:00Z', '2026-09-07', '2026-09-14', '2026-09-16', '2026-09-20', '2026-09-22', '2026-09-24', '2026-09-26', '', 'Client to review V1 deliverables and submit approval or revision feedback', 'Bradley Cooper', '2026-09-20', 'pending', 1, 0, '{"platform":"Instagram Carousel (Multi-slide 4:5)","account_handle":"@discovery_vitality","campaign_name":"Vitality Spring Vitalize 2026","headline":"Step Into Spring: 5 Science-Backed Steps to Boost Longevity","caption_copy":"Spring has arrived! Discover how 30 minutes of natural light and outdoor movement elevates cellular vitality and sleep quality.","cta":"Swipe through & save this post for your weekend routine","dimensions":"1080x1350px (4:5 Portrait Carousel) + 1080x1920 Stories","tags_handles":"#DiscoveryVitality #LiveLifeWithVitality #SpringWellness","publish_date":"2026-09-26"}', 100),
('PRJ-RAM-2026-009', 109, 'cl-standardbank', 'online_ram', 'ram-vouchers', 'Standard Bank Executive R5,000 Digital Vouchers', 'Private Wealth Elite Rewards', 'High-security digital PDF and print gift vouchers with QR redemption codes and custom embossed border.', 'high', 'REVISION', 'revision_required', 'V1.1', 'usr-am-1', 'usr-des-3', 'usr-qa-1', 'usr-ram-mgr', '["usr-des-3","usr-am-1"]', '2026-09-06T10:00:00Z', '2026-09-18T16:30:00Z', '2026-09-08', '2026-09-13', '2026-09-15', '2026-09-17', '2026-09-21', '2026-09-23', '2026-09-25', 'Voucher Express Security Print', 'Update terms & conditions clause 4 to 36 months validity and upload V2.0', 'Lucas Thorne', '2026-09-19', 'none', 1, 0, '{"client_name":"Standard Bank Wealth","voucher_type":"Digital e-Voucher (PDF / Email delivery)","title_value":"R5,000 Private Wealth Curated Reward","terms_conditions":"Valid for 36 months from issue date. Redeemable at luxury partner merchants.","unique_code_req":"16-Digit Alpha-numeric with QR Code and cryptographic checksum","dimensions":"Digital 1200x600px PNG + Print 210x99mm DL","approval_deadline":"2026-09-21"}', 100),
('PRJ-TRV-2026-010', 110, 'cl-discovery', 'incentive_travel', 'trv-printed-docs', 'Mauritius St. Regis Deluxe Itinerary Brochure & Welcome Notes', 'Discovery Horizon Mauritius 2026', '16-page square itinerary brochure, gold foil welcome letters, and catamaran excursion tickets.', 'urgent', 'CLIENT_APPROVAL', 'on_track', 'V2.0', 'usr-am-1', 'usr-des-1', 'usr-qa-2', 'usr-client-1', '["usr-des-1","usr-am-1","usr-qa-2"]', '2026-09-01T08:00:00Z', '2026-09-18T11:00:00Z', '2026-09-03', '2026-09-10', '2026-09-12', '2026-09-16', '2026-09-19', '2026-09-21', '2026-09-23', 'Premier Print Works', 'Bradley Cooper to provide final digital sign-off and approval timestamp', 'Bradley Cooper', '2026-09-19', 'pending', 1, 0, '{"trip_destination":"Le Morne Peninsula, Mauritius (JW Marriott St. Regis)","selected_catalog_items":["Welcome Notes","Itinerary Brochures","Menus","Activity Cards","Farewell Notes"],"document_specifications":"Itinerary Brochures: 80 units (210x210mm Wire-O), Welcome Notes: 80 units (A5 Heavy Felt + Gold Foil).","content_details":"Private catamaran sunset cruise, 7-course gala banquet at Manor House, Deep Sea Fishing.","finish_diecut":"Gold foil stamp on Discovery crest, soft-touch matte lamination.","approval_deadline":"2026-09-19"}', 100),
('PRJ-MKT-2026-011', 111, 'cl-bidvest', 'marketing', 'mkt-brochures', 'Global Leadership Conference Tri-fold Brochures & Backdrops', 'Bidvest Global Leaders 2026', 'A4 6-page roll fold conference programme and large-format stage fabric backdrops.', 'high', 'FINAL_QA', 'on_track', 'V2.0', 'usr-am-2', 'usr-des-1', 'usr-qa-1', 'usr-mkt-mgr', '["usr-des-1","usr-qa-1"]', '2026-08-28T09:00:00Z', '2026-09-18T09:30:00Z', '2026-08-30', '2026-09-08', '2026-09-10', '2026-09-14', '2026-09-16', '2026-09-19', '2026-09-21', 'Highveld Print & Display Fabric Works', 'Execute Final QA pre-flight audit and certify printer-ready package', 'Hannah Wright', '2026-09-19', 'approved', 1, 1, '{"doc_type":"A4 6-Page Tri-Fold Roll","title":"Bidvest Global Leadership Summit 2026 — Navigating The Future","quantity":"1,200 copies + 2x 6m x 3m Fabric Stage Backdrops","content_copy":"Day 1: Macroeconomics & Innovation, Day 2: Supply Chain Excellence, Keynote: Group Chief Executive.","contact_details":"Bidvest Events Operations, events@bidvest.co.za","finish_specs":"250gsm Cover with Velvet Soft-Touch, 150gsm Silk Inner","deadline":"2026-09-21"}', 100),
('PRJ-RAM-2026-012', 112, 'cl-woolworths', 'online_ram', 'ram-birthday-banners', 'Q3 Dealership Top Performer Birthday Banners', 'WFS Staff Recognition 2026', 'Dynamic portrait celebration banners for 24 financial services champions displayed on intranet and HQ LED boards.', 'low', 'RELEASE_PUBLISH', 'on_track', 'V2.0', 'usr-am-2', 'usr-des-3', 'usr-qa-1', 'usr-ram-mgr', '["usr-des-3"]', '2026-08-25T08:00:00Z', '2026-09-18T10:15:00Z', '2026-08-27', '2026-09-04', '2026-09-07', '2026-09-10', '2026-09-13', '2026-09-16', '2026-09-18', '', 'Deploy production assets to CMS media server and archive project', 'Julian Rossi', '2026-09-18', 'approved', 1, 1, '{"client_programme":"Woolworths Financial Services","participant_name":"Sipho Ndlovu, Naledi Dlamini & 22 others","birthday_date":"2026-09-18","message":"Happy Birthday to our exceptional financial consultants!","photo_quality":"High-res studio headshots with transparent cutouts","banner_size":"Intranet Hero 1200x500px & Digital TV Screen 1920x1080px","deadline":"2026-09-18"}', 100),
('PRJ-MKT-2026-013', 113, 'cl-discovery', 'marketing', 'mkt-booklets', 'Annual Sustainability & Wellness Report Booklets 2026', 'Discovery Sustainability 2026', '48-page perfect bound corporate report printed on 100% recycled FSC-certified stock and interactive accessible PDF.', 'medium', 'ARCHIVE', 'completed', 'V3.0', 'usr-am-1', 'usr-des-1', 'usr-qa-1', 'usr-client-1', '["usr-des-1","usr-qa-1"]', '2026-08-01T08:00:00Z', '2026-09-15T16:00:00Z', '2026-08-05', '2026-08-20', '2026-08-25', '2026-08-30', '2026-09-05', '2026-09-10', '2026-09-15', 'GreenEco Print SA', 'Project successfully released and archived in records', 'Chloe Bennett', '2026-09-15', 'approved', 1, 1, '{"booklet_title":"Discovery Group Sustainability & Impact Report 2026","page_count":"48+ Pages","binding_type":"Perfect Bound (Glued spine)","content_manuscript":"Complete audited ESG manuscript and carbon telemetry data.","deadline":"2026-09-15"}', 100),
('PRJ-TRV-2026-014', 114, 'cl-standardbank', 'incentive_travel', 'trv-printed-docs', 'Zanzibar VIP Catamaran Gala Menus & Care Cards', 'Standard Bank Spice Island 2026', 'Custom linen menus, luggage tags, and medical care cards for 90 attendees.', 'low', 'ARCHIVE', 'completed', 'V2.0', 'usr-am-2', 'usr-des-1', 'usr-qa-2', 'usr-trv-mgr', '["usr-des-1"]', '2026-07-15T09:00:00Z', '2026-08-30T17:00:00Z', '2026-07-18', '2026-08-05', '2026-08-10', '2026-08-15', '2026-08-20', '2026-08-25', '2026-08-30', 'Zanzibar Local Print & Logistics', 'Trip concluded and all master artwork archived in repository', 'Sophia Chen', '2026-08-30', 'approved', 1, 1, '{"trip_destination":"Zanzibar, Tanzania (Zuri Zanzibar Resort)","selected_catalog_items":["Menus","Emergency Care Cards","Luggage/Gift Tags","Farewell Notes"],"document_specifications":"Menus: 90 units (350gsm Linen), Emergency Care Cards: 90 PVC cards.","content_details":"Spice market tour, catamaran dhow cruise, Swahili gala feast.","finish_diecut":"Gold debossed crest, blue satin ribbon.","approval_deadline":"2026-08-20"}', 100)
ON DUPLICATE KEY UPDATE `project_name` = VALUES(`project_name`), `stage` = VALUES(`stage`), `status` = VALUES(`status`);

-- Seed Tasks
INSERT INTO `tasks` (`id`, `project_id`, `title`, `description`, `assigned_to`, `assigned_to_name`, `assigned_to_user_id`, `role_required`, `status`, `priority`, `start_date`, `due_date`, `completed_at`, `stage`, `checklist`, `comments_count`) VALUES
('tsk-001', 'PRJ-MKT-2026-001', 'Finalize copy hooks for slides 1-5', 'Review copy with CMO and align on preventative healthcare stats.', 'usr-am-1', '', 'usr-am-1', 'designer', 'in_progress', 'high', '2026-09-18', '2026-09-20', NULL, 'PRODUCTION', '[]', 2),
('tsk-002', 'PRJ-RAM-2026-002', 'Audit Nissan Crimson Red color separation', 'Verify #C3002F reproduces accurately across mobile screens.', 'usr-ram-mgr', '', 'usr-ram-mgr', 'designer', 'not_started', 'urgent', '2026-09-18', '2026-09-19', NULL, 'PRODUCTION', '[]', 0),
('tsk-003', 'PRJ-TRV-2026-003', 'Select high-res St. Moritz imagery', 'Curate 10 premium alpine winter landscape shots with DMC.', 'usr-des-1', '', 'usr-des-1', 'designer', 'in_progress', 'medium', '2026-09-18', '2026-09-21', NULL, 'PRODUCTION', '[]', 1),
('tsk-004', 'PRJ-TRV-2026-004', 'Setup InDesign master die-lines for Luggage Tags', 'Set 60x110mm die-line, reinforced eyelet margin, and 3mm bleed.', 'usr-des-1', '', 'usr-des-1', 'designer', 'in_progress', 'urgent', '2026-09-16', '2026-09-20', NULL, 'PRODUCTION', '[]', 4),
('tsk-005', 'PRJ-TRV-2026-004', 'Verify flight timings with Emirates desk', 'Cross-check EK762 & EK764 arrival times at DXB Terminal 3.', 'usr-am-1', '', 'usr-am-1', 'designer', 'in_progress', 'high', '2026-09-17', '2026-09-21', NULL, 'PRODUCTION', '[]', 1),
('tsk-006', 'PRJ-RAM-2026-006', 'Execute QA Security and Session Test', 'Verify role-based access control and voucher claims verification.', 'usr-qa-1', '', 'usr-qa-1', 'designer', 'in_progress', 'urgent', '2026-09-18', '2026-09-19', NULL, 'PRODUCTION', '[]', 3),
('tsk-007', 'PRJ-MKT-2026-008', 'Review Instagram Carousel with Client VP', 'Schedule quick walkthrough call with Bradley Cooper regarding caption CTA.', 'usr-am-1', '', 'usr-am-1', 'designer', 'in_progress', 'urgent', '2026-09-18', '2026-09-20', NULL, 'PRODUCTION', '[]', 2),
('tsk-008', 'PRJ-RAM-2026-009', 'Update voucher clause 4 to 36 months', 'Adjust legal disclaimer text in Illustrator and regenerate V2 PDF.', 'usr-des-3', '', 'usr-des-3', 'designer', 'in_progress', 'high', '2026-09-18', '2026-09-19', NULL, 'PRODUCTION', '[]', 1),
('tsk-009', 'PRJ-TRV-2026-010', 'Obtain written client sign-off on Mauritius proofs', 'Collect client signature and lock approved V2.0 for production.', 'usr-am-1', '', 'usr-am-1', 'designer', 'in_progress', 'urgent', '2026-09-18', '2026-09-19', NULL, 'PRODUCTION', '[]', 0),
('tsk-010', 'PRJ-MKT-2026-011', 'Pre-flight check for 6m stage backdrop', 'Ensure raster images are scaled at 150 DPI at 100% output scale.', 'usr-qa-1', '', 'usr-qa-1', 'designer', 'in_progress', 'high', '2026-09-18', '2026-09-19', NULL, 'PRODUCTION', '[]', 0)
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`), `status` = VALUES(`status`);

-- Seed Project Files
INSERT INTO `project_files` (`id`, `project_id`, `filename`, `size`, `type`, `version`, `uploaded_by`, `uploaded_by_name`, `uploaded_at`, `category`, `url`, `description`) VALUES
('fil-001', 'PRJ-TRV-2026-004', 'Dubai_Atlantis_Hotel_Factsheet.pdf', 4.8 MB, 'application/pdf', 'V1.0', 'usr-am-1', 'Chloe Bennett', '2026-09-14T10:30:00Z', 'brief', 'https://files.uicms.com/trv/Dubai_Factsheet.pdf', 'Official room allocation and venue dimensions.'),
('fil-002', 'PRJ-TRV-2026-004', 'Discovery_Corporate_Vector_Logo.svg', 340 KB, 'image/svg+xml', 'V1.0', 'usr-am-1', 'Chloe Bennett', '2026-09-14T10:35:00Z', 'ci_brand', 'https://files.uicms.com/ci/Discovery_Logo.svg', 'Master vector logo in CMYK and Pantone 293C.'),
('fil-003', 'PRJ-TRV-2026-004', 'Dubai_LuggageTags_DieLine_Proof_V1.0.pdf', 12.4 MB, 'application/pdf', 'V1.0', 'usr-des-1', 'Liam Gallagher', '2026-09-18T14:15:00Z', 'proofs', 'https://files.uicms.com/proofs/Dubai_Tags_V1.pdf', 'High-res printer proof with 3mm bleed and copper foil separation.'),
('fil-004', 'PRJ-MKT-2026-008', 'Vitality_Spring_Carousel_Artwork_V1.0.png', 8.2 MB, 'image/png', 'V1.0', 'usr-des-1', 'Liam Gallagher', '2026-09-16T16:00:00Z', 'proofs', 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=1000&auto=format&fit=crop&q=80', '6-Slide high contrast Instagram carousel ready for client sign-off.'),
('fil-005', 'PRJ-TRV-2026-010', 'Mauritius_ItineraryBrochure_V2.0_Approved.pdf', 28.5 MB, 'application/pdf', 'V2.0', 'usr-des-1', 'Liam Gallagher', '2026-09-17T11:00:00Z', 'approved_files', 'https://files.uicms.com/approved/Mauritius_Itinerary_V2.pdf', 'Locked deliverable version signed off by Bradley Cooper.')
ON DUPLICATE KEY UPDATE `filename` = VALUES(`filename`), `url` = VALUES(`url`);

-- Seed Deliverable Versions
INSERT INTO `deliverable_versions` (`id`, `project_id`, `version_number`, `title`, `file_url`, `preview_url`, `uploaded_by`, `uploaded_by_name`, `uploaded_at`, `description`, `status`, `is_locked`, `qa_result`, `qa_notes`, `changelog`) VALUES
('ver-001', 'PRJ-MKT-2026-008', 'V1.0', 'Initial Creative Carousel Proof (6 Slides)', 'https://files.uicms.com/deliverables/Vitality_Carousel_V1.0.zip', 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=1200&auto=format&fit=crop&q=80', 'usr-des-1', 'Liam Gallagher', '2026-09-16T16:00:00Z', 'Full carousel set in 4:5 portrait (1080x1350px) plus 9:16 story crops.', 'client_review', 0, 'PASS_WITH_NOTES', 'Approved for client presentation. Note: ensure slide 3 font contrast is checked on OLED phones.', 'Initial version generated from approved brief.'),
('ver-002', 'PRJ-RAM-2026-009', 'V1.0', 'Standard Bank R5k Voucher Initial Mockup', 'https://files.uicms.com/deliverables/SB_Voucher_V1.0.pdf', 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=1200&auto=format&fit=crop&q=80', 'usr-des-3', 'Lucas Thorne', '2026-09-14T11:30:00Z', 'Initial PDF voucher proof with 16-digit security code box.', 'revision_requested', 0, 'PASS', 'QA passed on graphics; client requested clause update.', 'Initial proof submitted for client review.'),
('ver-003', 'PRJ-RAM-2026-009', 'V1.1', 'Standard Bank R5k Voucher (Revised Terms Draft)', 'https://files.uicms.com/deliverables/SB_Voucher_V1.1.pdf', 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=1200&auto=format&fit=crop&q=80', 'usr-des-3', 'Lucas Thorne', '2026-09-18T16:00:00Z', 'Updated clause 4 with 36-month validity term.', 'draft', 0, NULL, NULL, 'Amended validity clause per client feedback.'),
('ver-004', 'PRJ-TRV-2026-010', 'V2.0', 'Mauritius Itinerary Brochure & Welcome Suite Master', 'https://files.uicms.com/deliverables/Mauritius_Suite_V2.0.pdf', 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&auto=format&fit=crop&q=80', 'usr-des-1', 'Liam Gallagher', '2026-09-17T11:00:00Z', 'Revised day 3 catamaran departure time (14:30) and updated flight baggage rules.', 'client_review', 0, 'PASS', '100% compliance across all 14 QA criteria. High quality.', 'Adjusted catamaran timing from 15:00 to 14:30 per DMC confirmation.')
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`), `status` = VALUES(`status`);

-- Seed QA Submissions
INSERT INTO `qa_submissions` (`id`, `project_id`, `version_id`, `qa_owner_id`, `qa_owner_name`, `status`, `submitted_at`, `reviewed_at`, `notes`, `changes_requested`) VALUES
('qa-sub-001', 'PRJ-MKT-2026-008', 'ver-001', NULL, NULL, 'pending', NULL, NULL, '', '[]'),
('qa-sub-002', 'PRJ-TRV-2026-010', 'ver-004', NULL, NULL, 'pending', NULL, NULL, '', '[]')
ON DUPLICATE KEY UPDATE `status` = VALUES(`status`), `notes` = VALUES(`notes`);

-- Seed Client Approvals
INSERT INTO `client_approvals` (`id`, `project_id`, `version_id`, `client_id`, `approver_id`, `approver_name`, `status`, `requested_at`, `decided_at`, `feedback`, `signature_hash`) VALUES
('appr-001', 'PRJ-MKT-2026-011', 'ver-prev-11', NULL, NULL, NULL, 'pending', NULL, NULL, '', 'sig_b89f2a99c0d12e88a1b')
ON DUPLICATE KEY UPDATE `status` = VALUES(`status`), `feedback` = VALUES(`feedback`);

-- Seed Feedback Items
INSERT INTO `feedback_items` (`id`, `project_id`, `version_id`, `author_id`, `author_name`, `author_role`, `comment`, `created_at`, `assigned_to`, `assigned_to_name`, `priority`, `status`, `type`) VALUES
('fb-001', 'PRJ-RAM-2026-009', NULL, NULL, NULL, NULL, '', '2026-10-04T15:15:23.569Z', 'usr-des-3', 'Lucas Thorne', 'high', 'in_progress', 'action_required'),
('fb-002', 'PRJ-MKT-2026-008', NULL, NULL, NULL, NULL, '', '2026-10-04T15:15:23.569Z', 'usr-des-1', 'Liam Gallagher', 'medium', 'resolved', 'for_information')
ON DUPLICATE KEY UPDATE `comment` = VALUES(`comment`), `status` = VALUES(`status`);

-- Seed Notifications
INSERT INTO `notifications` (`id`, `user_id`, `project_id`, `type`, `title`, `message`, `is_read`, `created_at`, `target_tab`) VALUES
('notif-001', 'usr-admin', 'PRJ-MKT-2026-001', 'new_request', 'New Marketing Request Submitted', 'Chloe Bennett submitted "Q4 Executive Leadership Series — LinkedIn" for Discovery Group.', 0, '2026-09-18T09:15:00Z', 'brief'),
('notif-002', 'usr-client-1', 'PRJ-MKT-2026-008', 'approval_required', 'Approval Required: Instagram Carousel V1.0', 'Vitality Spring Vitalize 2026 is ready for client review and sign-off.', 0, '2026-09-18T12:00:00Z', 'approval'),
('notif-003', 'usr-des-3', 'PRJ-RAM-2026-009', 'client_feedback', 'Client Revision Requested: Standard Bank Vouchers', 'Bradley Cooper requested an update to validity clause (36 months).', 0, '2026-09-17T15:20:00Z', 'feedback'),
('notif-004', 'usr-qa-1', 'PRJ-RAM-2026-006', 'qa_required', 'QA Inspection Required', 'Nissan Apex Challenge Rewards Portal CMS V1.0 is waiting for your QA inspection.', 0, '2026-09-18T15:45:00Z', 'qa'),
('notif-005', 'usr-des-1', 'PRJ-TRV-2026-004', 'task_assigned', 'New High Priority Task Assigned', 'You have been assigned: "InDesign Layout: 120 Luggage Tags & PVC Cards" due on 21 Sept 2026.', 0, '2026-09-18T08:30:00Z', 'tasks'),
('notif-006', 'usr-am-1', 'PRJ-TRV-2026-003', 'brief_locked', 'Brief Officially Locked & Validated', 'Sophia Chen locked the brief for "Swiss Alps Luxury Summit Location Banners". Production has commenced.', 0, '2026-09-18T09:45:00Z', 'overview'),
('notif-007', 'usr-admin', 'PRJ-MKT-2026-011', 'approval_received', 'Executive Client Approval Confirmed', 'Helena Du Plessis approved V2.0 of Bidvest Global CI Book. Final QA pre-flight is underway.', 0, '2026-09-16T10:15:00Z', 'approval'),
('notif-008', 'usr-des-1', 'PRJ-TRV-2026-004', 'internal_feedback', 'Mentioned in Dubai Project Chat', 'Chloe Bennett mentioned you: "@Liam Gallagher I have uploaded the final flight manifests..."', 0, '2026-09-18T10:15:00Z', 'chat')
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`), `message` = VALUES(`message`);

-- Seed Chat Messages
INSERT INTO `chat_messages` (`id`, `project_id`, `sender_id`, `sender_name`, `sender_avatar`, `sender_role`, `text`, `timestamp`, `mentions`, `referenced_task_id`, `is_important`, `recipient_id`, `channel_id`, `attachments`, `referenced_version`) VALUES
('msg-001', 'PRJ-TRV-2026-004', 'usr-am-1', 'Chloe Bennett', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80', NULL, '', '2026-10-04T15:15:23.570Z', '["usr-des-1"]', NULL, 1, NULL, NULL, '[]', NULL),
('msg-002', 'PRJ-TRV-2026-004', 'usr-des-1', 'Liam Gallagher', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80', NULL, '', '2026-10-04T15:15:23.570Z', '[]', 'tsk-004', 0, NULL, NULL, '[]', NULL),
('msg-003', 'PRJ-TRV-2026-004', 'usr-trv-mgr', 'Sophia Chen', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80', NULL, '', '2026-10-04T15:15:23.570Z', '[]', NULL, 0, NULL, NULL, '[]', NULL),
('msg-004', 'PRJ-MKT-2026-008', 'usr-client-1', 'Bradley Cooper', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80', NULL, '', '2026-10-04T15:15:23.570Z', '[]', NULL, 1, NULL, NULL, '[]', NULL),
('msg-005', 'PRJ-MKT-2026-008', 'usr-qa-1', 'Hannah Wright', 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150&auto=format&fit=crop&q=80', NULL, '', '2026-10-04T15:15:23.570Z', '[]', NULL, 0, NULL, NULL, '[]', NULL),
('msg-006', 'PRJ-RAM-2026-002', 'usr-ram-mgr', 'David Ndlovu', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', NULL, '', '2026-10-04T15:15:23.570Z', '["usr-des-3"]', NULL, 0, NULL, NULL, '[]', NULL),
('msg-007', 'PRJ-RAM-2026-002', 'usr-des-3', 'Lucas Thorne', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80', NULL, '', '2026-10-04T15:15:23.570Z', '[]', NULL, 0, NULL, NULL, '[]', NULL),
('msg-008', 'SYSTEM', 'usr-am-1', 'Chloe Bennett', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80', NULL, '', '2026-10-04T15:15:23.570Z', '[]', NULL, 0, 'usr-des-1', NULL, '[]', NULL),
('msg-009', 'SYSTEM', 'usr-des-1', 'Liam Gallagher', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80', NULL, '', '2026-10-04T15:15:23.570Z', '[]', NULL, 0, 'usr-am-1', NULL, '[]', NULL),
('msg-010', 'SYSTEM', 'usr-admin', 'Eleanor Vance', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80', NULL, '', '2026-10-04T15:15:23.570Z', '[]', NULL, 0, 'usr-mkt-mgr', NULL, '[]', NULL),
('msg-011', 'SYSTEM', 'usr-mkt-mgr', 'Marcus Sterling', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', NULL, '', '2026-10-04T15:15:23.570Z', '[]', NULL, 0, 'usr-admin', NULL, '[]', NULL),
('msg-012', 'SYSTEM', 'usr-mkt-mgr', 'Marcus Sterling', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', NULL, '', '2026-10-04T15:15:23.570Z', '[]', NULL, 1, NULL, 'dept-marketing', '[]', NULL),
('msg-013', 'SYSTEM', 'usr-trv-mgr', 'Sophia Chen', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80', NULL, '', '2026-10-04T15:15:23.570Z', '[]', NULL, 0, NULL, 'dept-incentive-travel', '[]', NULL),
('msg-014', 'SYSTEM', 'usr-admin', 'Eleanor Vance', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80', NULL, '', '2026-10-04T15:15:23.570Z', '[]', NULL, 1, NULL, 'general', '[]', NULL)
ON DUPLICATE KEY UPDATE `text` = VALUES(`text`);

-- Seed Activity Logs
INSERT INTO `activity_logs` (`id`, `project_id`, `user_id`, `user_name`, `action`, `description`, `timestamp`, `previous_stage`, `new_stage`, `version_ref`, `metadata`) VALUES
('diag-1791126470165-k1tom', 'DIAGNOSTIC-SUITE', 'admin-diag', 'Diagnostic Engine', 'DATABASE_DEBUG_TEST', 'Automated test verifying database write & read roundtrip at 17:07:50', '2026-10-04T15:07:50.165Z', NULL, NULL, NULL, '{"engine":"UICMS_JSON_DB_VALIDATOR","clientTime":"2026-10-04T15:07:50.165Z","validationKey":"VK-3BGJGVTP"}'),
('log-1791110738422', 'SYSTEM', 'usr-admin-01', 'Alex Rivera', 'USER_DELETED', 'User account Tariq Mansour (tariq.mansour@uicms.com) was permanently DELETED by Alex Rivera.', '2026-10-04T10:45:38.422Z', NULL, NULL, NULL, '{}'),
('log-1791107120292', 'SYSTEM', 'usr-admin-01', 'Alex Rivera', 'USER_ROLE_ALLOCATED', 'Role reallocated for trevor@uwiniwin.co.za (trevor@uwiniwin.co.za): designer ➔ super_admin by Alex Rivera.', '2026-10-04T09:45:20.292Z', NULL, NULL, NULL, '{}'),
('act-001', 'PRJ-MKT-2026-001', 'usr-am-1', 'Chloe Bennett', 'REQUEST_CREATED', 'Submitted new request "Q4 Executive Leadership Series — LinkedIn" for Discovery Group.', '2026-09-18T09:15:00Z', NULL, 'REQUESTED', NULL, '{}'),
('act-002', 'PRJ-TRV-2026-003', 'usr-trv-mgr', 'Sophia Chen', 'BRIEF_LOCKED', 'Validated 100% brief completeness and locked brief. Production initiated.', '2026-09-18T09:45:00Z', 'BRIEF_VALIDATION', 'BRIEF_LOCKED', NULL, '{}'),
('act-003', 'PRJ-MKT-2026-008', 'usr-qa-1', 'Hannah Wright', 'QA_PASSED', 'Completed QA Checklist for V1.0 (Result: PASS WITH NOTES). Project routed to Client Review.', '2026-09-17T09:30:00Z', 'INTERNAL_QA', 'CLIENT_REVIEW', NULL, '{}'),
('act-004', 'PRJ-RAM-2026-009', 'usr-client-1', 'Bradley Cooper', 'FEEDBACK_SUBMITTED', 'Client submitted revision feedback on voucher validity clause. Project moved to Revision.', '2026-09-17T15:20:00Z', 'CLIENT_REVIEW', 'REVISION', NULL, '{}'),
('act-005', 'PRJ-MKT-2026-011', 'usr-am-2', 'Julian Rossi', 'CLIENT_APPROVED', 'Client Helena Du Plessis approved V2.0 with documented confirmation. Locked approved version.', '2026-09-16T10:15:00Z', 'CLIENT_APPROVAL', 'FINAL_QA', NULL, '{}')
ON DUPLICATE KEY UPDATE `description` = VALUES(`description`);

-- Seed Admin Settings
INSERT INTO `admin_settings` (`setting_key`, `setting_value`) VALUES
('system_config', '{"appName":"UICMS Creative Workflow","appSubtitle":"Brief. Create. Review. Approve. Deliver.","emailNotifications":{"newRequests":true,"assignment":true,"taskDue":true,"taskOverdue":true,"feedback":true,"approval":true,"qa":true,"completion":true},"escalationRules":{"notify3DaysBefore":true,"notify1DayBefore":true,"notifyDueToday":true,"notifyOverdue":true,"escalate2DaysOverdue":true},"activeDepartments":{"marketing":true,"incentive_travel":true,"online_ram":true,"development":false},"workflowRules":{"enforceBriefLockForProduction":true,"enforceQABeforeClientReview":true,"enforceApprovalBeforeRelease":true,"allowManagerOverride":true,"logAllActions":true}}')
ON DUPLICATE KEY UPDATE `setting_value` = VALUES(`setting_value`);

-- Seed Products
INSERT INTO `products` (`id`, `name`, `description`, `price`) VALUES
(1, 'Ultra-Wide 4K Studio Monitor 34"', 'Curved IPS display with HDR600.', 899.99),
(2, 'Ergonomic Wireless Mechanical Keyboard', 'Low-profile switches.', 149.5),
(3, 'Precision Studio Mouse', 'Darkfield 8000 DPI sensor.', 99),
(4, 'Active Noise-Cancelling Headphones', '40mm beryllium drivers.', 349.99)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `price` = VALUES(`price`);

SET FOREIGN_KEY_CHECKS = 1;
COMMIT;
