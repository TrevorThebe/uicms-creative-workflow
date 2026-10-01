-- =============================================================================
-- MySQL Script: Clean / Truncate All Data While Keeping All Tables Intact
-- Target Database: uicms_workflow (or current database)
-- =============================================================================

USE `uicms_workflow`;

-- Temporarily disable foreign key constraints to allow truncating tables
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Truncate Child / Log / Activity Tables
TRUNCATE TABLE `activity_logs`;
TRUNCATE TABLE `chat_messages`;
TRUNCATE TABLE `notifications`;
TRUNCATE TABLE `feedback_items`;
TRUNCATE TABLE `client_approvals`;
TRUNCATE TABLE `qa_submissions`;

-- 2. Truncate Files & Deliverables Tables
TRUNCATE TABLE `deliverable_versions`;
TRUNCATE TABLE `project_files`;

-- 3. Truncate Tasks & Projects Tables
TRUNCATE TABLE `tasks`;
TRUNCATE TABLE `projects`;

-- 4. Truncate Core Entity Tables
TRUNCATE TABLE `clients`;
TRUNCATE TABLE `users`;
TRUNCATE TABLE `departments`;
TRUNCATE TABLE `admin_settings`;

-- Re-enable foreign key constraints
SET FOREIGN_KEY_CHECKS = 1;

-- Confirmation
SELECT 'All tables have been cleaned successfully. Table schemas and indexes preserved.' AS `Status`;
