import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const jsonPath = path.resolve(__dirname, '../php-backend/data/uicms_workflow_db.json');
const db = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

function escapeSql(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return val;
  if (typeof val === 'boolean') return val ? 1 : 0;
  if (typeof val === 'object') {
    const jsonStr = JSON.stringify(val);
    return "'" + jsonStr.replace(/\\/g, '\\\\').replace(/\x00/g, '\\0').replace(/\'/g, "''").replace(/\n/g, '\\n').replace(/\r/g, '\\r') + "'";
  }
  const str = String(val);
  return "'" + str.replace(/\\/g, '\\\\').replace(/\x00/g, '\\0').replace(/\'/g, "''").replace(/\n/g, '\\n').replace(/\r/g, '\\r') + "'";
}

let sql = `-- ==============================================================================
-- UICMS WORKFLOW & REST API - COMPLETE DATABASE SCHEMA & DEMO DATA SEED SCRIPT
-- Target Database: uicms_workflow
-- phpMyAdmin URL: http://localhost/phpmyadmin/index.php?route=/database/structure&db=uicms_workflow
-- Compatible with: MySQL 8.0+, MariaDB 10.4+, XAMPP, WAMP, Docker, AWS RDS
-- Generated At: ${new Date().toISOString()}
-- ==============================================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------------------------
-- Database Creation
-- ------------------------------------------------------------------------------
CREATE DATABASE IF NOT EXISTS \`uicms_workflow\` 
  DEFAULT CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE \`uicms_workflow\`;

-- ------------------------------------------------------------------------------
-- 1. Table: departments
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`departments\` (
  \`id\` VARCHAR(50) NOT NULL PRIMARY KEY,
  \`name\` VARCHAR(100) NOT NULL,
  \`description\` TEXT NULL,
  \`icon\` VARCHAR(50) NULL,
  \`active\` TINYINT(1) NOT NULL DEFAULT 1,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 2. Table: users
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`users\` (
  \`id\` VARCHAR(50) NOT NULL PRIMARY KEY,
  \`name\` VARCHAR(100) NOT NULL,
  \`email\` VARCHAR(150) NOT NULL UNIQUE,
  \`personal_email\` VARCHAR(150) NULL,
  \`password\` VARCHAR(255) NOT NULL,
  \`role\` VARCHAR(50) NOT NULL DEFAULT 'designer',
  \`role_title\` VARCHAR(150) NOT NULL DEFAULT 'Team Member',
  \`department_id\` VARCHAR(50) NULL,
  \`avatar\` VARCHAR(500) NULL,
  \`active\` TINYINT(1) NOT NULL DEFAULT 1,
  \`is_suspended\` TINYINT(1) NOT NULL DEFAULT 0,
  \`suspension_reason\` TEXT NULL,
  \`is_temp_password\` TINYINT(1) NOT NULL DEFAULT 0,
  \`temp_password_expires_at\` VARCHAR(50) NULL,
  \`must_change_password\` TINYINT(1) NOT NULL DEFAULT 0,
  \`workload_count\` INT NOT NULL DEFAULT 0,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY \`idx_user_dept\` (\`department_id\`),
  KEY \`idx_user_role\` (\`role\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 3. Table: clients
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`clients\` (
  \`id\` VARCHAR(50) NOT NULL PRIMARY KEY,
  \`name\` VARCHAR(150) NOT NULL,
  \`code\` VARCHAR(50) NOT NULL UNIQUE,
  \`industry\` VARCHAR(100) NULL,
  \`logo_url\` VARCHAR(500) NULL,
  \`brand_guidelines\` TEXT NULL,
  \`ci_document_url\` VARCHAR(500) NULL,
  \`primary_contact_name\` VARCHAR(100) NULL,
  \`primary_contact_email\` VARCHAR(150) NULL,
  \`primary_contact_phone\` VARCHAR(50) NULL,
  \`primary_contact_position\` VARCHAR(100) NULL,
  \`website\` VARCHAR(255) NULL,
  \`notes\` TEXT NULL,
  \`default_ci_colors\` JSON NULL,
  \`font_requirements\` TEXT NULL,
  \`active_projects_count\` INT NOT NULL DEFAULT 0,
  \`status\` VARCHAR(50) NOT NULL DEFAULT 'active',
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 4. Table: projects
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`projects\` (
  \`id\` VARCHAR(50) NOT NULL PRIMARY KEY,
  \`project_number\` INT NULL,
  \`client_id\` VARCHAR(50) NOT NULL,
  \`department_id\` VARCHAR(50) NOT NULL DEFAULT 'marketing',
  \`request_type_id\` VARCHAR(50) NULL,
  \`project_name\` VARCHAR(255) NOT NULL,
  \`campaign_name\` VARCHAR(255) NULL,
  \`description\` TEXT NULL,
  \`priority\` VARCHAR(20) NOT NULL DEFAULT 'medium',
  \`stage\` VARCHAR(50) NOT NULL DEFAULT 'REQUESTED',
  \`status\` VARCHAR(50) NOT NULL DEFAULT 'on_track',
  \`version\` VARCHAR(20) NOT NULL DEFAULT 'V0.1',
  \`accountable_user_id\` VARCHAR(50) NULL,
  \`project_owner_id\` VARCHAR(50) NULL,
  \`qa_owner_id\` VARCHAR(50) NULL,
  \`approver_id\` VARCHAR(50) NULL,
  \`contributor_ids\` JSON NULL,
  \`created_at\` VARCHAR(50) NULL,
  \`updated_at\` VARCHAR(50) NULL,
  \`brief_due_date\` VARCHAR(50) NULL,
  \`production_due_date\` VARCHAR(50) NULL,
  \`internal_qa_due_date\` VARCHAR(50) NULL,
  \`client_review_due_date\` VARCHAR(50) NULL,
  \`client_approval_due_date\` VARCHAR(50) NULL,
  \`final_qa_due_date\` VARCHAR(50) NULL,
  \`release_date\` VARCHAR(50) NULL,
  \`external_suppliers\` TEXT NULL,
  \`next_action_task\` VARCHAR(255) NULL,
  \`next_action_owner\` VARCHAR(100) NULL,
  \`next_action_due\` VARCHAR(50) NULL,
  \`approval_status\` VARCHAR(50) NOT NULL DEFAULT 'not_requested',
  \`is_brief_locked\` TINYINT(1) NOT NULL DEFAULT 0,
  \`is_version_locked\` TINYINT(1) NOT NULL DEFAULT 0,
  \`brief_data\` JSON NULL,
  \`brief_completeness\` INT NOT NULL DEFAULT 0,
  KEY \`idx_proj_client\` (\`client_id\`),
  KEY \`idx_proj_dept\` (\`department_id\`),
  KEY \`idx_proj_stage\` (\`stage\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 5. Table: tasks
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`tasks\` (
  \`id\` VARCHAR(50) NOT NULL PRIMARY KEY,
  \`project_id\` VARCHAR(50) NOT NULL,
  \`title\` VARCHAR(255) NOT NULL,
  \`description\` TEXT NULL,
  \`assigned_to\` VARCHAR(50) NULL,
  \`assigned_to_name\` VARCHAR(100) NULL,
  \`assigned_to_user_id\` VARCHAR(50) NULL,
  \`role_required\` VARCHAR(50) NULL,
  \`status\` VARCHAR(50) NOT NULL DEFAULT 'todo',
  \`priority\` VARCHAR(20) NOT NULL DEFAULT 'medium',
  \`start_date\` VARCHAR(50) NULL,
  \`due_date\` VARCHAR(50) NULL,
  \`completed_at\` VARCHAR(50) NULL,
  \`stage\` VARCHAR(50) NOT NULL DEFAULT 'PRODUCTION',
  \`checklist\` JSON NULL,
  \`comments_count\` INT NOT NULL DEFAULT 0,
  KEY \`idx_task_proj\` (\`project_id\`),
  KEY \`idx_task_assign\` (\`assigned_to_user_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 6. Table: project_files
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`project_files\` (
  \`id\` VARCHAR(50) NOT NULL PRIMARY KEY,
  \`project_id\` VARCHAR(50) NOT NULL,
  \`filename\` VARCHAR(255) NOT NULL,
  \`size\` INT NOT NULL DEFAULT 0,
  \`type\` VARCHAR(100) NULL,
  \`version\` VARCHAR(20) NULL DEFAULT 'V1.0',
  \`uploaded_by\` VARCHAR(50) NULL,
  \`uploaded_by_name\` VARCHAR(100) NULL,
  \`uploaded_at\` VARCHAR(50) NULL,
  \`category\` VARCHAR(50) NULL,
  \`url\` VARCHAR(500) NOT NULL,
  \`description\` TEXT NULL,
  KEY \`idx_file_proj\` (\`project_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 7. Table: deliverable_versions
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`deliverable_versions\` (
  \`id\` VARCHAR(50) NOT NULL PRIMARY KEY,
  \`project_id\` VARCHAR(50) NOT NULL,
  \`version_number\` VARCHAR(20) NOT NULL DEFAULT 'V1.0',
  \`title\` VARCHAR(255) NOT NULL,
  \`file_url\` VARCHAR(500) NOT NULL,
  \`preview_url\` VARCHAR(500) NULL,
  \`uploaded_by\` VARCHAR(50) NULL,
  \`uploaded_by_name\` VARCHAR(100) NULL,
  \`uploaded_at\` VARCHAR(50) NULL,
  \`description\` TEXT NULL,
  \`status\` VARCHAR(50) NOT NULL DEFAULT 'draft',
  \`is_locked\` TINYINT(1) NOT NULL DEFAULT 0,
  \`qa_result\` VARCHAR(50) NULL,
  \`qa_notes\` TEXT NULL,
  \`changelog\` TEXT NULL,
  KEY \`idx_ver_proj\` (\`project_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 8. Table: qa_submissions
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`qa_submissions\` (
  \`id\` VARCHAR(50) NOT NULL PRIMARY KEY,
  \`project_id\` VARCHAR(50) NOT NULL,
  \`version_id\` VARCHAR(50) NOT NULL,
  \`qa_owner_id\` VARCHAR(50) NOT NULL,
  \`qa_owner_name\` VARCHAR(100) NULL,
  \`status\` VARCHAR(50) NOT NULL DEFAULT 'pending',
  \`submitted_at\` VARCHAR(50) NULL,
  \`reviewed_at\` VARCHAR(50) NULL,
  \`notes\` TEXT NULL,
  \`changes_requested\` JSON NULL,
  KEY \`idx_qa_proj\` (\`project_id\`),
  KEY \`idx_qa_ver\` (\`version_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 9. Table: client_approvals
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`client_approvals\` (
  \`id\` VARCHAR(50) NOT NULL PRIMARY KEY,
  \`project_id\` VARCHAR(50) NOT NULL,
  \`version_id\` VARCHAR(50) NOT NULL,
  \`client_id\` VARCHAR(50) NOT NULL,
  \`approver_id\` VARCHAR(50) NULL,
  \`approver_name\` VARCHAR(100) NULL,
  \`status\` VARCHAR(50) NOT NULL DEFAULT 'pending',
  \`requested_at\` VARCHAR(50) NULL,
  \`decided_at\` VARCHAR(50) NULL,
  \`feedback\` TEXT NULL,
  \`signature_hash\` VARCHAR(255) NULL,
  KEY \`idx_appr_proj\` (\`project_id\`),
  KEY \`idx_appr_client\` (\`client_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 10. Table: feedback_items
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`feedback_items\` (
  \`id\` VARCHAR(50) NOT NULL PRIMARY KEY,
  \`project_id\` VARCHAR(50) NOT NULL,
  \`version_id\` VARCHAR(50) NULL,
  \`author_id\` VARCHAR(50) NOT NULL,
  \`author_name\` VARCHAR(100) NULL,
  \`author_role\` VARCHAR(50) NULL,
  \`comment\` TEXT NOT NULL,
  \`created_at\` VARCHAR(50) NULL,
  \`assigned_to\` VARCHAR(50) NULL,
  \`assigned_to_name\` VARCHAR(100) NULL,
  \`priority\` VARCHAR(20) NOT NULL DEFAULT 'medium',
  \`status\` VARCHAR(50) NOT NULL DEFAULT 'open',
  \`type\` VARCHAR(50) NOT NULL DEFAULT 'action_required',
  KEY \`idx_fb_proj\` (\`project_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 11. Table: notifications
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`notifications\` (
  \`id\` VARCHAR(50) NOT NULL PRIMARY KEY,
  \`user_id\` VARCHAR(50) NOT NULL,
  \`project_id\` VARCHAR(50) NULL,
  \`type\` VARCHAR(50) NOT NULL,
  \`title\` VARCHAR(255) NOT NULL,
  \`message\` TEXT NOT NULL,
  \`is_read\` TINYINT(1) NOT NULL DEFAULT 0,
  \`created_at\` VARCHAR(50) NULL,
  \`target_tab\` VARCHAR(50) NULL,
  KEY \`idx_notif_user\` (\`user_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 12. Table: chat_messages
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`chat_messages\` (
  \`id\` VARCHAR(50) NOT NULL PRIMARY KEY,
  \`project_id\` VARCHAR(50) NOT NULL,
  \`sender_id\` VARCHAR(50) NOT NULL,
  \`sender_name\` VARCHAR(100) NULL,
  \`sender_avatar\` VARCHAR(500) NULL,
  \`sender_role\` VARCHAR(50) NULL,
  \`text\` TEXT NOT NULL,
  \`timestamp\` VARCHAR(50) NULL,
  \`mentions\` JSON NULL,
  \`referenced_task_id\` VARCHAR(50) NULL,
  \`is_important\` TINYINT(1) NOT NULL DEFAULT 0,
  \`recipient_id\` VARCHAR(50) NULL,
  \`channel_id\` VARCHAR(50) NULL,
  \`attachments\` JSON NULL,
  \`referenced_version\` VARCHAR(50) NULL,
  KEY \`idx_chat_proj\` (\`project_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 13. Table: activity_logs
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`activity_logs\` (
  \`id\` VARCHAR(50) NOT NULL PRIMARY KEY,
  \`project_id\` VARCHAR(50) NULL,
  \`user_id\` VARCHAR(50) NULL,
  \`user_name\` VARCHAR(100) NULL,
  \`action\` VARCHAR(100) NOT NULL,
  \`description\` TEXT NULL,
  \`timestamp\` VARCHAR(50) NULL,
  \`previous_stage\` VARCHAR(50) NULL,
  \`new_stage\` VARCHAR(50) NULL,
  \`version_ref\` VARCHAR(50) NULL,
  \`metadata\` JSON NULL,
  KEY \`idx_act_proj\` (\`project_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 14. Table: admin_settings
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`admin_settings\` (
  \`setting_key\` VARCHAR(100) NOT NULL PRIMARY KEY,
  \`setting_value\` LONGTEXT NOT NULL,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 15. Table: products (REST API)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`products\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`name\` VARCHAR(255) NOT NULL,
  \`description\` TEXT DEFAULT NULL,
  \`price\` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- DEMO DATA SEED STATEMENTS (IDEMPOTENT)
-- ==============================================================================

`;

// 1. Departments
if (Array.isArray(db.departments) && db.departments.length > 0) {
  sql += `-- Seed Departments\nINSERT INTO \`departments\` (\`id\`, \`name\`, \`description\`, \`icon\`, \`active\`) VALUES\n`;
  sql += db.departments.map(d => `(${escapeSql(d.id)}, ${escapeSql(d.name)}, ${escapeSql(d.description)}, ${escapeSql(d.icon)}, ${d.active ? 1 : 0})`).join(',\n');
  sql += `\nON DUPLICATE KEY UPDATE \`name\` = VALUES(\`name\`), \`description\` = VALUES(\`description\`);\n\n`;
}

// 2. Users
if (Array.isArray(db.users) && db.users.length > 0) {
  sql += `-- Seed Users\nINSERT INTO \`users\` (\`id\`, \`name\`, \`email\`, \`personal_email\`, \`password\`, \`role\`, \`role_title\`, \`department_id\`, \`avatar\`, \`active\`, \`is_suspended\`, \`must_change_password\`) VALUES\n`;
  sql += db.users.map(u => `(${escapeSql(u.id)}, ${escapeSql(u.name)}, ${escapeSql(u.email)}, ${escapeSql(u.personalEmail || u.personal_email || u.email)}, ${escapeSql(u.password || '$2y$10$TKh8H1.PfQx37YgCzwiKb.KjNyWgaHb9cbcoQgdIVFlYg7B77UdFm')}, ${escapeSql(u.role)}, ${escapeSql(u.roleTitle || u.role_title || 'Team Member')}, ${escapeSql(u.departmentId || u.department_id || 'marketing')}, ${escapeSql(u.avatar)}, ${u.active !== false ? 1 : 0}, ${u.isSuspended ? 1 : 0}, ${u.mustChangePassword ? 1 : 0})`).join(',\n');
  sql += `\nON DUPLICATE KEY UPDATE \`name\` = VALUES(\`name\`), \`role\` = VALUES(\`role\`), \`role_title\` = VALUES(\`role_title\`);\n\n`;
}

// 3. Clients
if (Array.isArray(db.clients) && db.clients.length > 0) {
  sql += `-- Seed Clients\nINSERT INTO \`clients\` (\`id\`, \`name\`, \`code\`, \`industry\`, \`logo_url\`, \`primary_contact_name\`, \`primary_contact_email\`, \`status\`, \`default_ci_colors\`) VALUES\n`;
  sql += db.clients.map(c => `(${escapeSql(c.id)}, ${escapeSql(c.name)}, ${escapeSql(c.code)}, ${escapeSql(c.industry || 'General')}, ${escapeSql(c.logoUrl || c.logo_url)}, ${escapeSql(c.primaryContactName || c.primary_contact_name)}, ${escapeSql(c.primaryContactEmail || c.primary_contact_email)}, ${escapeSql(c.status || 'active')}, ${escapeSql(c.defaultCiColors || c.default_ci_colors || [])})`).join(',\n');
  sql += `\nON DUPLICATE KEY UPDATE \`name\` = VALUES(\`name\`), \`code\` = VALUES(\`code\`);\n\n`;
}

// 4. Projects
if (Array.isArray(db.projects) && db.projects.length > 0) {
  sql += `-- Seed Projects\nINSERT INTO \`projects\` (\`id\`, \`project_number\`, \`client_id\`, \`department_id\`, \`request_type_id\`, \`project_name\`, \`campaign_name\`, \`description\`, \`priority\`, \`stage\`, \`status\`, \`version\`, \`accountable_user_id\`, \`project_owner_id\`, \`qa_owner_id\`, \`approver_id\`, \`contributor_ids\`, \`created_at\`, \`updated_at\`, \`brief_due_date\`, \`production_due_date\`, \`internal_qa_due_date\`, \`client_review_due_date\`, \`client_approval_due_date\`, \`final_qa_due_date\`, \`release_date\`, \`external_suppliers\`, \`next_action_task\`, \`next_action_owner\`, \`next_action_due\`, \`approval_status\`, \`is_brief_locked\`, \`is_version_locked\`, \`brief_data\`, \`brief_completeness\`) VALUES\n`;
  sql += db.projects.map(p => `(${escapeSql(p.id)}, ${p.projectNumber || p.project_number || 0}, ${escapeSql(p.clientId || p.client_id || '')}, ${escapeSql(p.departmentId || p.department_id || 'marketing')}, ${escapeSql(p.requestTypeId || p.request_type_id || '')}, ${escapeSql(p.projectName || p.project_name || p.title || 'Project')}, ${escapeSql(p.campaignName || p.campaign_name || '')}, ${escapeSql(p.description || '')}, ${escapeSql(p.priority || 'medium')}, ${escapeSql(p.stage || 'REQUESTED')}, ${escapeSql(p.status || 'on_track')}, ${escapeSql(p.version || 'V0.1')}, ${escapeSql(p.accountableUserId || p.accountable_user_id || null)}, ${escapeSql(p.projectOwnerId || p.project_owner_id || null)}, ${escapeSql(p.qaOwnerId || p.qa_owner_id || null)}, ${escapeSql(p.approverId || p.approver_id || null)}, ${escapeSql(p.contributorIds || p.contributor_ids || [])}, ${escapeSql(p.createdAt || p.created_at || new Date().toISOString())}, ${escapeSql(p.updatedAt || p.updated_at || new Date().toISOString())}, ${escapeSql(p.briefDueDate || p.brief_due_date || null)}, ${escapeSql(p.productionDueDate || p.production_due_date || null)}, ${escapeSql(p.internalQaDueDate || p.internal_qa_due_date || null)}, ${escapeSql(p.clientReviewDueDate || p.client_review_due_date || null)}, ${escapeSql(p.clientApprovalDueDate || p.client_approval_due_date || null)}, ${escapeSql(p.finalQaDueDate || p.final_qa_due_date || null)}, ${escapeSql(p.releaseDate || p.release_date || null)}, ${escapeSql(p.externalSuppliers || p.external_suppliers || '')}, ${escapeSql(p.nextAction?.task || p.next_action_task || null)}, ${escapeSql(p.nextAction?.ownerName || p.next_action_owner || null)}, ${escapeSql(p.nextAction?.dueDate || p.next_action_due || null)}, ${escapeSql(p.approvalStatus || p.approval_status || 'not_requested')}, ${p.isBriefLocked || p.is_brief_locked ? 1 : 0}, ${p.isVersionLocked || p.is_version_locked ? 1 : 0}, ${escapeSql(p.briefData || p.brief_data || {})}, ${p.briefCompleteness || p.brief_completeness || 0})`).join(',\n');
  sql += `\nON DUPLICATE KEY UPDATE \`project_name\` = VALUES(\`project_name\`), \`stage\` = VALUES(\`stage\`), \`status\` = VALUES(\`status\`);\n\n`;
}

// 5. Tasks
if (Array.isArray(db.tasks) && db.tasks.length > 0) {
  sql += `-- Seed Tasks\nINSERT INTO \`tasks\` (\`id\`, \`project_id\`, \`title\`, \`description\`, \`assigned_to\`, \`assigned_to_name\`, \`assigned_to_user_id\`, \`role_required\`, \`status\`, \`priority\`, \`start_date\`, \`due_date\`, \`completed_at\`, \`stage\`, \`checklist\`, \`comments_count\`) VALUES\n`;
  sql += db.tasks.map(t => `(${escapeSql(t.id)}, ${escapeSql(t.projectId || t.project_id)}, ${escapeSql(t.title || t.name || 'Task')}, ${escapeSql(t.description || '')}, ${escapeSql(t.assignedTo || t.assigned_to || t.ownerId || '')}, ${escapeSql(t.assignedToName || t.assigned_to_name || '')}, ${escapeSql(t.ownerId || t.assigned_to_user_id || '')}, ${escapeSql(t.roleRequired || t.role_required || 'designer')}, ${escapeSql(t.status || 'todo')}, ${escapeSql(t.priority || 'medium')}, ${escapeSql(t.startDate || t.start_date || null)}, ${escapeSql(t.dueDate || t.due_date || null)}, ${escapeSql(t.completedAt || t.completed_at || null)}, ${escapeSql(t.stage || 'PRODUCTION')}, ${escapeSql(t.checklist || [])}, ${t.commentsCount || t.comments_count || 0})`).join(',\n');
  sql += `\nON DUPLICATE KEY UPDATE \`title\` = VALUES(\`title\`), \`status\` = VALUES(\`status\`);\n\n`;
}

// 6. Files
if (Array.isArray(db.files) && db.files.length > 0) {
  sql += `-- Seed Project Files\nINSERT INTO \`project_files\` (\`id\`, \`project_id\`, \`filename\`, \`size\`, \`type\`, \`version\`, \`uploaded_by\`, \`uploaded_by_name\`, \`uploaded_at\`, \`category\`, \`url\`, \`description\`) VALUES\n`;
  sql += db.files.map(f => `(${escapeSql(f.id)}, ${escapeSql(f.projectId || f.project_id)}, ${escapeSql(f.filename)}, ${f.size || 0}, ${escapeSql(f.type)}, ${escapeSql(f.version || 'V1.0')}, ${escapeSql(f.uploadedBy || f.uploaded_by)}, ${escapeSql(f.uploadedByName || f.uploaded_by_name)}, ${escapeSql(f.uploadedAt || f.uploaded_at || new Date().toISOString())}, ${escapeSql(f.category || 'general')}, ${escapeSql(f.url || f.fileUrl)}, ${escapeSql(f.description || '')})`).join(',\n');
  sql += `\nON DUPLICATE KEY UPDATE \`filename\` = VALUES(\`filename\`), \`url\` = VALUES(\`url\`);\n\n`;
}

// 7. Versions
if (Array.isArray(db.versions) && db.versions.length > 0) {
  sql += `-- Seed Deliverable Versions\nINSERT INTO \`deliverable_versions\` (\`id\`, \`project_id\`, \`version_number\`, \`title\`, \`file_url\`, \`preview_url\`, \`uploaded_by\`, \`uploaded_by_name\`, \`uploaded_at\`, \`description\`, \`status\`, \`is_locked\`, \`qa_result\`, \`qa_notes\`, \`changelog\`) VALUES\n`;
  sql += db.versions.map(v => `(${escapeSql(v.id)}, ${escapeSql(v.projectId || v.project_id)}, ${escapeSql(v.versionNumber || v.version_number || 'V1.0')}, ${escapeSql(v.title || 'Version')}, ${escapeSql(v.fileUrl || v.file_url || '')}, ${escapeSql(v.previewUrl || v.preview_url || null)}, ${escapeSql(v.uploadedBy || v.uploaded_by || '')}, ${escapeSql(v.uploadedByName || v.uploaded_by_name || '')}, ${escapeSql(v.uploadedAt || v.uploaded_at || new Date().toISOString())}, ${escapeSql(v.description || '')}, ${escapeSql(v.status || 'draft')}, ${v.isLocked || v.is_locked ? 1 : 0}, ${escapeSql(v.qaResult || v.qa_result || null)}, ${escapeSql(v.qaNotes || v.qa_notes || null)}, ${escapeSql(v.changelog || '')})`).join(',\n');
  sql += `\nON DUPLICATE KEY UPDATE \`title\` = VALUES(\`title\`), \`status\` = VALUES(\`status\`);\n\n`;
}

// 8. QA Submissions
if (Array.isArray(db.qa_submissions) && db.qa_submissions.length > 0) {
  sql += `-- Seed QA Submissions\nINSERT INTO \`qa_submissions\` (\`id\`, \`project_id\`, \`version_id\`, \`qa_owner_id\`, \`qa_owner_name\`, \`status\`, \`submitted_at\`, \`reviewed_at\`, \`notes\`, \`changes_requested\`) VALUES\n`;
  sql += db.qa_submissions.map(q => `(${escapeSql(q.id)}, ${escapeSql(q.projectId || q.project_id)}, ${escapeSql(q.versionId || q.version_id)}, ${escapeSql(q.qaOwnerId || q.qa_owner_id)}, ${escapeSql(q.qaOwnerName || q.qa_owner_name)}, ${escapeSql(q.status || 'pending')}, ${escapeSql(q.submittedAt || q.submitted_at)}, ${escapeSql(q.reviewedAt || q.reviewed_at)}, ${escapeSql(q.notes || '')}, ${escapeSql(q.changesRequested || q.changes_requested || [])})`).join(',\n');
  sql += `\nON DUPLICATE KEY UPDATE \`status\` = VALUES(\`status\`), \`notes\` = VALUES(\`notes\`);\n\n`;
}

// 9. Client Approvals
if (Array.isArray(db.client_approvals) && db.client_approvals.length > 0) {
  sql += `-- Seed Client Approvals\nINSERT INTO \`client_approvals\` (\`id\`, \`project_id\`, \`version_id\`, \`client_id\`, \`approver_id\`, \`approver_name\`, \`status\`, \`requested_at\`, \`decided_at\`, \`feedback\`, \`signature_hash\`) VALUES\n`;
  sql += db.client_approvals.map(a => `(${escapeSql(a.id)}, ${escapeSql(a.projectId || a.project_id)}, ${escapeSql(a.versionId || a.version_id)}, ${escapeSql(a.clientId || a.client_id)}, ${escapeSql(a.approverId || a.approver_id)}, ${escapeSql(a.approverName || a.approver_name)}, ${escapeSql(a.status || 'pending')}, ${escapeSql(a.requestedAt || a.requested_at)}, ${escapeSql(a.decidedAt || a.decided_at)}, ${escapeSql(a.feedback || '')}, ${escapeSql(a.signatureHash || a.signature_hash)})`).join(',\n');
  sql += `\nON DUPLICATE KEY UPDATE \`status\` = VALUES(\`status\`), \`feedback\` = VALUES(\`feedback\`);\n\n`;
}

// 10. Feedback Items
if (Array.isArray(db.feedback_items) && db.feedback_items.length > 0) {
  sql += `-- Seed Feedback Items\nINSERT INTO \`feedback_items\` (\`id\`, \`project_id\`, \`version_id\`, \`author_id\`, \`author_name\`, \`author_role\`, \`comment\`, \`created_at\`, \`assigned_to\`, \`assigned_to_name\`, \`priority\`, \`status\`, \`type\`) VALUES\n`;
  sql += db.feedback_items.map(f => `(${escapeSql(f.id)}, ${escapeSql(f.projectId || f.project_id)}, ${escapeSql(f.versionId || f.version_id)}, ${escapeSql(f.authorId || f.author_id)}, ${escapeSql(f.authorName || f.author_name)}, ${escapeSql(f.authorRole || f.author_role)}, ${escapeSql(f.comment || '')}, ${escapeSql(f.createdAt || f.created_at || new Date().toISOString())}, ${escapeSql(f.assignedTo || f.assigned_to)}, ${escapeSql(f.assignedToName || f.assigned_to_name)}, ${escapeSql(f.priority || 'medium')}, ${escapeSql(f.status || 'open')}, ${escapeSql(f.type || 'action_required')})`).join(',\n');
  sql += `\nON DUPLICATE KEY UPDATE \`comment\` = VALUES(\`comment\`), \`status\` = VALUES(\`status\`);\n\n`;
}

// 11. Notifications
if (Array.isArray(db.notifications) && db.notifications.length > 0) {
  sql += `-- Seed Notifications\nINSERT INTO \`notifications\` (\`id\`, \`user_id\`, \`project_id\`, \`type\`, \`title\`, \`message\`, \`is_read\`, \`created_at\`, \`target_tab\`) VALUES\n`;
  sql += db.notifications.map(n => `(${escapeSql(n.id)}, ${escapeSql(n.userId || n.user_id)}, ${escapeSql(n.projectId || n.project_id)}, ${escapeSql(n.type)}, ${escapeSql(n.title)}, ${escapeSql(n.message)}, ${n.isRead || n.is_read ? 1 : 0}, ${escapeSql(n.createdAt || n.created_at || new Date().toISOString())}, ${escapeSql(n.targetTab || n.target_tab)})`).join(',\n');
  sql += `\nON DUPLICATE KEY UPDATE \`title\` = VALUES(\`title\`), \`message\` = VALUES(\`message\`);\n\n`;
}

// 12. Chat Messages
if (Array.isArray(db.chat_messages) && db.chat_messages.length > 0) {
  sql += `-- Seed Chat Messages\nINSERT INTO \`chat_messages\` (\`id\`, \`project_id\`, \`sender_id\`, \`sender_name\`, \`sender_avatar\`, \`sender_role\`, \`text\`, \`timestamp\`, \`mentions\`, \`referenced_task_id\`, \`is_important\`, \`recipient_id\`, \`channel_id\`, \`attachments\`, \`referenced_version\`) VALUES\n`;
  sql += db.chat_messages.map(m => `(${escapeSql(m.id)}, ${escapeSql(m.projectId || m.project_id || 'SYSTEM')}, ${escapeSql(m.senderId || m.sender_id)}, ${escapeSql(m.senderName || m.sender_name)}, ${escapeSql(m.senderAvatar || m.sender_avatar)}, ${escapeSql(m.senderRole || m.sender_role)}, ${escapeSql(m.text || '')}, ${escapeSql(m.timestamp || new Date().toISOString())}, ${escapeSql(m.mentions || [])}, ${escapeSql(m.referencedTaskId || m.referenced_task_id)}, ${m.isImportant || m.is_important ? 1 : 0}, ${escapeSql(m.recipientId || m.recipient_id)}, ${escapeSql(m.channelId || m.channel_id)}, ${escapeSql(m.attachments || [])}, ${escapeSql(m.referencedVersion || m.referenced_version)})`).join(',\n');
  sql += `\nON DUPLICATE KEY UPDATE \`text\` = VALUES(\`text\`);\n\n`;
}

// 13. Activity Logs
if (Array.isArray(db.activity_logs) && db.activity_logs.length > 0) {
  sql += `-- Seed Activity Logs\nINSERT INTO \`activity_logs\` (\`id\`, \`project_id\`, \`user_id\`, \`user_name\`, \`action\`, \`description\`, \`timestamp\`, \`previous_stage\`, \`new_stage\`, \`version_ref\`, \`metadata\`) VALUES\n`;
  sql += db.activity_logs.map(l => `(${escapeSql(l.id)}, ${escapeSql(l.projectId || l.project_id)}, ${escapeSql(l.userId || l.user_id)}, ${escapeSql(l.userName || l.user_name)}, ${escapeSql(l.action)}, ${escapeSql(l.description)}, ${escapeSql(l.timestamp || new Date().toISOString())}, ${escapeSql(l.previousStage || l.previous_stage)}, ${escapeSql(l.newStage || l.new_stage)}, ${escapeSql(l.versionRef || l.version_ref)}, ${escapeSql(l.metadata || {})})`).join(',\n');
  sql += `\nON DUPLICATE KEY UPDATE \`description\` = VALUES(\`description\`);\n\n`;
}

// 14. Admin Settings
if (db.admin_settings) {
  sql += `-- Seed Admin Settings\nINSERT INTO \`admin_settings\` (\`setting_key\`, \`setting_value\`) VALUES\n`;
  sql += `('system_config', ${escapeSql(db.admin_settings)})\n`;
  sql += `ON DUPLICATE KEY UPDATE \`setting_value\` = VALUES(\`setting_value\`);\n\n`;
}

// 15. Products
if (Array.isArray(db.products) && db.products.length > 0) {
  sql += `-- Seed Products\nINSERT INTO \`products\` (\`id\`, \`name\`, \`description\`, \`price\`) VALUES\n`;
  sql += db.products.map(p => `(${p.id}, ${escapeSql(p.name)}, ${escapeSql(p.description)}, ${p.price || 0})`).join(',\n');
  sql += `\nON DUPLICATE KEY UPDATE \`name\` = VALUES(\`name\`), \`price\` = VALUES(\`price\`);\n\n`;
}

sql += `SET FOREIGN_KEY_CHECKS = 1;\nCOMMIT;\n`;

fs.writeFileSync(path.resolve(__dirname, '../php-backend/database.sql'), sql, 'utf8');
fs.writeFileSync(path.resolve(__dirname, '../php-backend/seed.sql'), sql, 'utf8');
console.log('Successfully generated database.sql & seed.sql (' + sql.length + ' bytes)');
