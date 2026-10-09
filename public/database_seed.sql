-- ==============================================================================
-- UICMS WORKFLOW & REST API - FULL DATABASE SCHEMA & IDEMPOTENT SEED SCRIPT
-- Target Database: uicms_workflow
-- phpMyAdmin URL: http://localhost/phpmyadmin/index.php?route=/database/structure&db=uicms_workflow
-- Compatible with: MySQL 8.0+, MariaDB 10.4+, XAMPP, WAMP, Docker, AWS RDS
-- ==============================================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------------------------
-- 1. Database Creation
-- ------------------------------------------------------------------------------
CREATE DATABASE IF NOT EXISTS `uicms_workflow` 
  DEFAULT CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE `uicms_workflow`;

-- ------------------------------------------------------------------------------
-- 2. Table: departments
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `departments` (
  `id` VARCHAR(50) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT NULL,
  `icon` VARCHAR(50) NULL,
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 3. Table: users
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(50) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `personal_email` VARCHAR(150) NULL,
  `password` VARCHAR(255) NOT NULL,
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
  PRIMARY KEY (`id`),
  KEY `idx_user_dept` (`department_id`),
  KEY `idx_user_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 4. Table: clients
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `clients` (
  `id` VARCHAR(50) NOT NULL,
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
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 5. Table: projects
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `projects` (
  `id` VARCHAR(50) NOT NULL,
  `project_number` INT NULL,
  `title` VARCHAR(255) NOT NULL,
  `project_name` VARCHAR(255) NULL,
  `campaign_name` VARCHAR(255) NULL,
  `code` VARCHAR(50) NULL,
  `client_id` VARCHAR(50) NULL,
  `client_name` VARCHAR(150) NULL,
  `department_id` VARCHAR(50) NOT NULL,
  `request_type_id` VARCHAR(100) NULL,
  `description` LONGTEXT NULL,
  `objectives` LONGTEXT NULL,
  `deliverables` LONGTEXT NULL,
  `target_audience` TEXT NULL,
  `brand_guidelines` TEXT NULL,
  `budget` DECIMAL(12,2) NULL,
  `priority` VARCHAR(20) NOT NULL DEFAULT 'medium',
  `stage` VARCHAR(50) NOT NULL DEFAULT 'REQUESTED',
  `status` VARCHAR(50) NOT NULL DEFAULT 'on_track',
  `version` VARCHAR(20) NOT NULL DEFAULT 'V0.1',
  `assignee_id` VARCHAR(50) NULL,
  `accountable_user_id` VARCHAR(50) NULL,
  `project_owner_id` VARCHAR(50) NULL,
  `qa_owner_id` VARCHAR(50) NULL,
  `approver_id` VARCHAR(50) NULL,
  `contributor_ids` JSON NULL,
  `created_by` VARCHAR(50) NULL,
  `start_date` VARCHAR(50) NULL,
  `due_date` VARCHAR(50) NULL,
  `release_date` VARCHAR(50) NULL,
  `brief_locked` TINYINT(1) NOT NULL DEFAULT 0,
  `is_brief_locked` TINYINT(1) NOT NULL DEFAULT 0,
  `brief_locked_by` VARCHAR(50) NULL,
  `brief_locked_at` VARCHAR(50) NULL,
  `brief_data` JSON NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_proj_dept` (`department_id`),
  KEY `idx_proj_client` (`client_id`),
  KEY `idx_proj_stage` (`stage`),
  KEY `idx_proj_owner` (`project_owner_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 6. Table: tasks
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tasks` (
  `id` VARCHAR(50) NOT NULL,
  `project_id` VARCHAR(50) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `assigned_to` VARCHAR(50) NULL,
  `assigned_to_name` VARCHAR(100) NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'todo',
  `priority` VARCHAR(20) NOT NULL DEFAULT 'medium',
  `due_date` VARCHAR(50) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_task_proj` (`project_id`),
  KEY `idx_task_assignee` (`assigned_to`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 7. Table: project_files
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `project_files` (
  `id` VARCHAR(50) NOT NULL,
  `project_id` VARCHAR(50) NOT NULL,
  `filename` VARCHAR(255) NOT NULL,
  `size` VARCHAR(50) NULL,
  `type` VARCHAR(100) NULL,
  `category` VARCHAR(50) NOT NULL DEFAULT 'brief_assets',
  `version` VARCHAR(50) NOT NULL DEFAULT 'V1.0',
  `url` LONGTEXT NULL,
  `uploaded_by` VARCHAR(50) NULL,
  `uploaded_by_name` VARCHAR(100) NULL,
  `uploaded_at` VARCHAR(50) NULL,
  `description` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_file_proj` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 8. Table: deliverable_versions
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `deliverable_versions` (
  `id` VARCHAR(50) NOT NULL,
  `project_id` VARCHAR(50) NOT NULL,
  `version_number` VARCHAR(50) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `file_url` LONGTEXT NULL,
  `uploaded_by` VARCHAR(50) NULL,
  `uploaded_by_name` VARCHAR(100) NULL,
  `uploaded_at` VARCHAR(50) NULL,
  `change_notes` TEXT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'pending',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ver_proj` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 9. Table: qa_submissions
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `qa_submissions` (
  `id` VARCHAR(50) NOT NULL,
  `project_id` VARCHAR(50) NOT NULL,
  `version_id` VARCHAR(50) NULL,
  `submitted_by` VARCHAR(50) NULL,
  `submitted_by_name` VARCHAR(100) NULL,
  `submitted_at` VARCHAR(50) NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'pending',
  `qa_officer_id` VARCHAR(50) NULL,
  `qa_officer_name` VARCHAR(100) NULL,
  `reviewed_at` VARCHAR(50) NULL,
  `checklist_data` LONGTEXT NULL,
  `notes` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_qa_proj` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 10. Table: client_approvals
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `client_approvals` (
  `id` VARCHAR(50) NOT NULL,
  `project_id` VARCHAR(50) NOT NULL,
  `version_id` VARCHAR(50) NULL,
  `sent_by` VARCHAR(50) NULL,
  `sent_at` VARCHAR(50) NULL,
  `client_email` VARCHAR(150) NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'pending',
  `approval_token` VARCHAR(100) NULL,
  `feedback` LONGTEXT NULL,
  `decided_at` VARCHAR(50) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_appr_proj` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 11. Table: feedback_items
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `feedback_items` (
  `id` VARCHAR(50) NOT NULL,
  `project_id` VARCHAR(50) NOT NULL,
  `author_id` VARCHAR(50) NULL,
  `author_name` VARCHAR(100) NULL,
  `author_role` VARCHAR(50) NULL,
  `stage` VARCHAR(50) NULL,
  `content` LONGTEXT NOT NULL,
  `severity` VARCHAR(20) NOT NULL DEFAULT 'medium',
  `status` VARCHAR(50) NOT NULL DEFAULT 'open',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_fb_proj` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 12. Table: notifications
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` VARCHAR(50) NOT NULL,
  `user_id` VARCHAR(50) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `type` VARCHAR(50) NOT NULL DEFAULT 'info',
  `read_status` TINYINT(1) NOT NULL DEFAULT 0,
  `project_id` VARCHAR(50) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_notif_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 13. Table: chat_messages
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `chat_messages` (
  `id` VARCHAR(50) NOT NULL,
  `project_id` VARCHAR(50) NOT NULL,
  `sender_id` VARCHAR(50) NOT NULL,
  `sender_name` VARCHAR(100) NOT NULL,
  `sender_role` VARCHAR(50) NULL,
  `message` LONGTEXT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_chat_proj` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 14. Table: activity_logs
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `activity_logs` (
  `id` VARCHAR(50) NOT NULL,
  `user_id` VARCHAR(50) NULL,
  `user_name` VARCHAR(100) NULL,
  `action` VARCHAR(100) NOT NULL,
  `description` LONGTEXT NULL,
  `details` LONGTEXT NULL,
  `ip_address` VARCHAR(50) NULL,
  `project_id` VARCHAR(50) NULL,
  `timestamp` VARCHAR(50) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_act_user` (`user_id`),
  KEY `idx_act_proj` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 15. Table: admin_settings
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `admin_settings` (
  `id` VARCHAR(50) NOT NULL,
  `config_json` LONGTEXT NOT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 16. Table: products (REST API)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `products` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `price` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- 17. IDEMPOTENT SEED DATA (Inserts or updates initial essential records)
-- ==============================================================================

-- Seed Departments
INSERT INTO `departments` (`id`, `name`, `description`, `icon`, `active`) VALUES
('marketing', 'Marketing & Brand Strategy', 'Omnichannel marketing campaigns, brand identity, and creative advertising assets.', 'Megaphone', 1),
('incentive_travel', 'Incentive Travel & Events', 'Global luxury travel experiences, attendee registration, itineraries, and delegate kits.', 'Plane', 1),
('online_ram', 'Online Resource & Asset Management', 'Digital asset management, brand repository, web portals, and CI vector distribution.', 'Globe', 1),
('development', 'Full-Stack Software Engineering', 'Internal platforms, API gateways, database architecture, and portal workflows.', 'Code', 1)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `description` = VALUES(`description`);

-- Seed Users (Default password: password123 or hashed)
INSERT INTO `users` (`id`, `name`, `email`, `personal_email`, `password`, `role`, `role_title`, `department_id`, `avatar`, `active`, `is_suspended`, `must_change_password`) VALUES
('usr-super-admin', 'Alex Rivera', 'admin@uicms.internal', 'admin.alex@gmail.com', '$2y$10$TKh8H1.PfQx37YgCzwiKb.KjNyWgaHb9cbcoQgdIVFlYg7B77UdFm', 'super_admin', 'Chief Systems Administrator & Governance Lead', 'development', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', 1, 0, 0),
('usr-user-trevz', 'Trevz Administrator', 'trevztm@gmail.com', 'trevztm@gmail.com', '$2y$10$TKh8H1.PfQx37YgCzwiKb.KjNyWgaHb9cbcoQgdIVFlYg7B77UdFm', 'super_admin', 'Principal Technical Lead & Administrator', 'development', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', 1, 0, 0),
('usr-dept-manager', 'Sarah Jenkins', 's.jenkins@uicms.internal', 'sarah.jenkins@gmail.com', '$2y$10$TKh8H1.PfQx37YgCzwiKb.KjNyWgaHb9cbcoQgdIVFlYg7B77UdFm', 'department_manager', 'Creative & Production Department Head', 'marketing', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80', 1, 0, 0),
('usr-acct-manager', 'Marcus Vance', 'm.vance@uicms.internal', 'marcus.vance@gmail.com', '$2y$10$TKh8H1.PfQx37YgCzwiKb.KjNyWgaHb9cbcoQgdIVFlYg7B77UdFm', 'account_manager', 'Senior Account Director & Client Partner', 'incentive_travel', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', 1, 0, 0),
('usr-designer', 'Elena Rostova', 'e.rostova@uicms.internal', 'elena.rostova@gmail.com', '$2y$10$TKh8H1.PfQx37YgCzwiKb.KjNyWgaHb9cbcoQgdIVFlYg7B77UdFm', 'designer', 'Senior Visual & Motion Designer', 'marketing', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80', 1, 0, 0),
('usr-qa', 'David Chen', 'd.chen@uicms.internal', 'david.chen@gmail.com', '$2y$10$TKh8H1.PfQx37YgCzwiKb.KjNyWgaHb9cbcoQgdIVFlYg7B77UdFm', 'qa_user', 'Quality Assurance & CI Compliance Lead', 'online_ram', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80', 1, 0, 0),
('usr-client', 'Emma Watson', 'emma.watson@apex-global.com', 'emma.watson@gmail.com', '$2y$10$TKh8H1.PfQx37YgCzwiKb.KjNyWgaHb9cbcoQgdIVFlYg7B77UdFm', 'client', 'Executive Vice President of Brand Strategy', 'marketing', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80', 1, 0, 0)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `role` = VALUES(`role`), `role_title` = VALUES(`role_title`);

-- Seed Clients
INSERT INTO `clients` (`id`, `name`, `code`, `industry`, `logo_url`, `primary_contact_name`, `primary_contact_email`, `status`) VALUES
('client-apex', 'Apex Global Financial', 'APEX', 'Financial Services', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80', 'Emma Watson', 'emma.watson@apex-global.com', 'active'),
('client-lumina', 'Lumina Luxury Escapes', 'LUMINA', 'Hospitality & Luxury Travel', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=150&auto=format&fit=crop&q=80', 'Alexander Wright', 'alex.wright@luminaescapes.com', 'active'),
('client-nexus', 'Nexus Robotics Corp', 'NEXUS', 'Artificial Intelligence & Robotics', 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=150&auto=format&fit=crop&q=80', 'Dr. Aris Thorne', 'a.thorne@nexusrobotics.ai', 'active')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `code` = VALUES(`code`);

-- Seed Products
INSERT INTO `products` (`id`, `name`, `description`, `price`) VALUES
(1, 'Ultra-Wide 4K Studio Monitor 34"', 'Curved IPS display with HDR600, 99% DCI-P3 color gamut, and Thunderbolt 4 hub.', 899.99),
(2, 'Ergonomic Wireless Mechanical Keyboard', 'Low-profile mechanical switches, wireless multi-device pairing, and aluminum chassis.', 149.50),
(3, 'Precision Studio Mouse', 'Darkfield laser sensor with 8000 DPI, hyper-fast scroll wheel, and ergonomic thumb rest.', 99.00),
(4, 'Active Noise-Cancelling Studio Headphones', 'Custom 40mm beryllium drivers, spatial audio support, and 30-hour battery life.', 349.99)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `price` = VALUES(`price`);

SET FOREIGN_KEY_CHECKS = 1;
COMMIT;
