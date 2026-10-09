<?php
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../config/database.php';
initApiHeaders();

try {
    $database = new Database();
    $db = $database->getConnection();
} catch (Throwable $dbErr) {
    sendResponse(500, [
        'status' => 'error',
        'message' => 'Database connection failed: ' . $dbErr->getMessage(),
        'source' => 'mysql_error',
        'hint' => 'Ensure MySQL is running in XAMPP/WAMP.'
    ]);
}

$method = $_SERVER['REQUEST_METHOD'];

if (!in_array($method, ['GET', 'POST'], true)) {
    sendResponse(405, ['status' => 'error', 'message' => 'Method not allowed']);
}

$table = trim((string)($_GET['table'] ?? 'all'));
$tables = [
    'departments',
    'users',
    'clients',
    'projects',
    'tasks',
    'project_files',
    'deliverable_versions',
    'qa_submissions',
    'client_approvals',
    'feedback_items',
    'notifications',
    'chat_messages',
    'activity_logs',
    'admin_settings',
];

$collectionTables = [
    'users' => 'users',
    'clients' => 'clients',
    'projects' => 'projects',
    'tasks' => 'tasks',
    'files' => 'project_files',
    'versions' => 'deliverable_versions',
    'qa_submissions' => 'qa_submissions',
    'client_approvals' => 'client_approvals',
    'feedback_items' => 'feedback_items',
    'notifications' => 'notifications',
    'chat_messages' => 'chat_messages',
    'activity_logs' => 'activity_logs',
];

$ensureColumn = function (string $tableName, string $columnName, string $definition) use ($db): void {
    try {
        $tblCheck = $db->prepare('SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table');
        $tblCheck->execute([':table' => $tableName]);
        if ((int)$tblCheck->fetchColumn() === 0) return;

        $stmt = $db->prepare(
            'SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table AND COLUMN_NAME = :column'
        );
        $stmt->execute([':table' => $tableName, ':column' => $columnName]);
        if ((int)$stmt->fetchColumn() === 0) {
            $db->exec("ALTER TABLE `{$tableName}` ADD COLUMN `{$columnName}` {$definition}");
        }
    } catch (Throwable $e) {}
};

// Bootstrap core table schemas only if not yet present in MySQL/phpMyAdmin
$isSchemaReady = false;
try {
    $testTbl = $db->query("SELECT 1 FROM `projects` LIMIT 1");
    if ($testTbl !== false) {
        $isSchemaReady = true;
    }
} catch (Throwable) {
    $isSchemaReady = false;
}

if (!$isSchemaReady) {
    try {
        $db->exec("SET FOREIGN_KEY_CHECKS = 0;");

    $db->exec("CREATE TABLE IF NOT EXISTS `departments` (
        `id` VARCHAR(50) NOT NULL PRIMARY KEY,
        `name` VARCHAR(100) NOT NULL,
        `description` TEXT NULL,
        `icon` VARCHAR(50) NULL,
        `active` TINYINT(1) NOT NULL DEFAULT 1,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $db->exec("CREATE TABLE IF NOT EXISTS `users` (
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
        KEY `idx_dept` (`department_id`),
        KEY `idx_role` (`role`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $db->exec("CREATE TABLE IF NOT EXISTS `clients` (
        `id` VARCHAR(50) NOT NULL PRIMARY KEY,
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
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $db->exec("CREATE TABLE IF NOT EXISTS `projects` (
        `id` VARCHAR(50) NOT NULL PRIMARY KEY,
        `project_number` INT NOT NULL DEFAULT 0,
        `client_id` VARCHAR(50) NOT NULL,
        `department_id` VARCHAR(50) NOT NULL DEFAULT 'marketing',
        `request_type_id` VARCHAR(50) NOT NULL,
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
        `created_at` VARCHAR(50) NOT NULL,
        `updated_at` VARCHAR(50) NOT NULL,
        `brief_due_date` VARCHAR(50) NULL,
        `brief_locked_at` VARCHAR(50) NULL,
        `brief_locked_by` VARCHAR(50) NULL,
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
        KEY `idx_client` (`client_id`),
        KEY `idx_stage` (`stage`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $db->exec("CREATE TABLE IF NOT EXISTS `tasks` (
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
        `due_date` VARCHAR(50) NULL,
        `start_date` VARCHAR(50) NULL,
        `completed_at` VARCHAR(50) NULL,
        `stage` VARCHAR(50) NOT NULL DEFAULT 'PRODUCTION',
        `is_client_facing` TINYINT(1) NOT NULL DEFAULT 0,
        `comments_count` INT NOT NULL DEFAULT 0,
        KEY `idx_project` (`project_id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $db->exec("CREATE TABLE IF NOT EXISTS `project_files` (
        `id` VARCHAR(50) NOT NULL PRIMARY KEY,
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
        KEY `idx_project` (`project_id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $db->exec("CREATE TABLE IF NOT EXISTS `deliverable_versions` (
        `id` VARCHAR(50) NOT NULL PRIMARY KEY,
        `project_id` VARCHAR(50) NOT NULL,
        `version_number` VARCHAR(20) NOT NULL,
        `title` VARCHAR(255) NOT NULL,
        `file_url` VARCHAR(500) NOT NULL,
        `preview_url` VARCHAR(500) NULL,
        `uploaded_by` VARCHAR(50) NOT NULL,
        `uploaded_by_name` VARCHAR(100) NOT NULL,
        `uploaded_at` VARCHAR(50) NOT NULL,
        `description` TEXT NULL,
        `status` VARCHAR(50) NOT NULL DEFAULT 'draft',
        `is_locked` TINYINT(1) NOT NULL DEFAULT 0,
        `qa_result` VARCHAR(50) NULL,
        `qa_notes` TEXT NULL,
        `changelog` TEXT NULL,
        KEY `idx_project` (`project_id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $db->exec("CREATE TABLE IF NOT EXISTS `qa_submissions` (
        `id` VARCHAR(50) NOT NULL PRIMARY KEY,
        `project_id` VARCHAR(50) NOT NULL,
        `version_id` VARCHAR(50) NOT NULL,
        `result` VARCHAR(50) NOT NULL,
        `performed_by` VARCHAR(50) NOT NULL,
        `performed_by_name` VARCHAR(100) NOT NULL,
        `performed_at` VARCHAR(50) NOT NULL,
        `checklist` JSON NULL,
        `overall_notes` TEXT NULL,
        `passed_count` INT NULL DEFAULT 0,
        `failed_count` INT NULL DEFAULT 0,
        `na_count` INT NULL DEFAULT 0,
        KEY `idx_project` (`project_id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $db->exec("CREATE TABLE IF NOT EXISTS `client_approvals` (
        `id` VARCHAR(50) NOT NULL PRIMARY KEY,
        `project_id` VARCHAR(50) NOT NULL,
        `version_id` VARCHAR(50) NOT NULL,
        `version_number` VARCHAR(20) NOT NULL,
        `client_id` VARCHAR(50) NOT NULL,
        `client_name` VARCHAR(100) NOT NULL,
        `client_position` VARCHAR(100) NULL,
        `status` VARCHAR(50) NOT NULL,
        `confirmation_text` TEXT NULL,
        `changes_requested` JSON NULL,
        `approved_at` VARCHAR(50) NOT NULL,
        `signature_hash` VARCHAR(100) NULL,
        KEY `idx_project` (`project_id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $db->exec("CREATE TABLE IF NOT EXISTS `feedback_items` (
        `id` VARCHAR(50) NOT NULL PRIMARY KEY,
        `project_id` VARCHAR(50) NOT NULL,
        `version_id` VARCHAR(50) NOT NULL,
        `version_number` VARCHAR(20) NOT NULL,
        `submitted_by` VARCHAR(50) NOT NULL,
        `submitted_by_name` VARCHAR(100) NOT NULL,
        `submitted_at` VARCHAR(50) NOT NULL,
        `feedback_text` TEXT NOT NULL,
        `attachment_url` VARCHAR(500) NULL,
        `assigned_to` VARCHAR(50) NOT NULL,
        `assigned_to_name` VARCHAR(100) NOT NULL,
        `priority` VARCHAR(20) NOT NULL DEFAULT 'medium',
        `status` VARCHAR(50) NOT NULL DEFAULT 'open',
        `type` VARCHAR(50) NOT NULL DEFAULT 'action_required',
        KEY `idx_project` (`project_id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $db->exec("CREATE TABLE IF NOT EXISTS `notifications` (
        `id` VARCHAR(50) NOT NULL PRIMARY KEY,
        `user_id` VARCHAR(50) NOT NULL,
        `project_id` VARCHAR(50) NULL,
        `type` VARCHAR(50) NOT NULL,
        `title` VARCHAR(255) NOT NULL,
        `message` TEXT NOT NULL,
        `is_read` TINYINT(1) NOT NULL DEFAULT 0,
        `created_at` VARCHAR(50) NOT NULL,
        `target_tab` VARCHAR(50) NULL,
        KEY `idx_user` (`user_id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $db->exec("CREATE TABLE IF NOT EXISTS `chat_messages` (
        `id` VARCHAR(50) NOT NULL PRIMARY KEY,
        `project_id` VARCHAR(50) NULL,
        `sender_id` VARCHAR(50) NOT NULL,
        `sender_name` VARCHAR(100) NOT NULL,
        `sender_avatar` VARCHAR(500) NULL,
        `message` TEXT NOT NULL,
        `created_at` VARCHAR(50) NOT NULL,
        `mentions` JSON NULL,
        `referenced_task_id` VARCHAR(50) NULL,
        `is_important` TINYINT(1) NOT NULL DEFAULT 0,
        `recipient_id` VARCHAR(50) NULL,
        `channel_id` VARCHAR(50) NULL,
        `attachments` JSON NULL,
        `referenced_version` VARCHAR(50) NULL,
        KEY `idx_project` (`project_id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $db->exec("CREATE TABLE IF NOT EXISTS `activity_logs` (
        `id` VARCHAR(50) NOT NULL PRIMARY KEY,
        `project_id` VARCHAR(50) NULL,
        `user_id` VARCHAR(50) NULL,
        `user_name` VARCHAR(100) NULL,
        `action` VARCHAR(100) NOT NULL,
        `description` TEXT NULL,
        `timestamp` VARCHAR(50) NULL,
        `previous_stage` VARCHAR(50) NULL,
        `new_stage` VARCHAR(50) NULL,
        `version_ref` VARCHAR(100) NULL,
        `metadata` JSON NULL,
        `app_payload` LONGTEXT NULL,
        KEY `idx_project` (`project_id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $db->exec("CREATE TABLE IF NOT EXISTS `admin_settings` (
        `setting_key` VARCHAR(50) NOT NULL PRIMARY KEY,
        `setting_value` JSON NOT NULL,
        `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    // Populate departments if empty
    $deptCount = (int)$db->query("SELECT COUNT(*) FROM `departments`")->fetchColumn();
    if ($deptCount === 0) {
        $db->exec("INSERT INTO `departments` (`id`, `name`, `description`, `icon`, `active`) VALUES
        ('marketing', 'Marketing & Creative Production', 'Brand campaigns, digital media, social content, and marketing collateral.', 'Palette', 1),
        ('incentive_travel', 'Incentive Travel & Events Logistics', 'Travel programs, event materials, and print collateral.', 'Plane', 1),
        ('online_ram', 'Online (RAM) & Rewards Engineering', 'Digital reward platforms, dealer programs, and online campaign assets.', 'Flame', 1),
        ('development', 'Technology & Systems Engineering', 'Web applications, API integrations, and workflow automation.', 'Code', 1)");
    }

    // Auto-seed clients only once during initial setup using app_migrations
    $clientSeedCheck = $db->query("SELECT 1 FROM `app_migrations` WHERE migration_key = 'initial_clients_seeded'")->fetchColumn();
    if (!$clientSeedCheck) {
        $clientCount = (int)$db->query("SELECT COUNT(*) FROM `clients`")->fetchColumn();
        if ($clientCount === 0) {
            $db->exec("INSERT INTO `clients` (
                `id`, `name`, `code`, `logo_url`, `brand_guidelines`, `ci_document_url`,
                `primary_contact_name`, `primary_contact_email`, `primary_contact_phone`, `primary_contact_position`,
                `website`, `notes`, `default_ci_colors`, `font_requirements`, `active_projects_count`
            ) VALUES
            ('cl-discovery', 'Discovery Group (Vitality)', 'DISC', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80', 'Strict compliance with Discovery Blue (#004080) and Vitality Orange (#FF6600). Minimum 20mm clear space around the emblem.', 'https://files.uicms.com/ci/Discovery_Corporate_CI_2026.pdf', 'Bradley Cooper', 'bradley.cooper@discovery.co.za', '+27 (0)11 529 2888', 'VP Marketing & Brand Experience', 'https://www.discovery.co.za', 'Premium incentive tier. Requires executive proof sign-offs 7 days prior to release.', '[\"#004080\", \"#FF6600\", \"#F4F7FB\", \"#1E293B\"]', 'Discovery Sans Bold, Discovery Text Regular, Futura Heavy', 4),
            ('cl-nissan', 'Nissan South Africa', 'NISN', 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=200&auto=format&fit=crop&q=80', 'Nissan Crimson Red (#C3002F) & Sleek Silver (#8A8D8F). Ultra modern automotive styling.', 'https://files.uicms.com/ci/Nissan_Apex_BrandBook.pdf', 'Rene Van Der Merwe', 'rene.vdm@nissan.co.za', '+27 (0)12 529 6000', 'Head of Dealer Incentives', 'https://www.nissan.co.za', 'Monthly sales sprint campaigns and dealership rewards platform.', '[\"#C3002F\", \"#000000\", \"#8A8D8F\", \"#FFFFFF\"]', 'Nissan Brand Regular, Nissan Display Bold', 3),
            ('cl-standardbank', 'Standard Bank Wealth', 'SBWL', 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=200&auto=format&fit=crop&q=80', 'Standard Bank Cobalt Blue (#0033A0) & Light Blue (#0091FF). High-net-worth luxury elegance.', 'https://files.uicms.com/ci/SB_Wealth_Guidelines.pdf', 'Sipho Khumalo', 'sipho.khumalo@standardbank.co.za', '+27 (0)11 636 9111', 'Director of Private Client Incentives', 'https://wealth.standardbank.com', 'Incentive Travel Switzerland and Kyoto trips + high-value client vouchers.', '[\"#0033A0\", \"#0091FF\", \"#F0F4FF\", \"#0A192F\"]', 'Standard Bank Sans, Cormorant Garamond', 4),
            ('cl-bidvest', 'Bidvest Premier Global', 'BIDV', 'https://images.unsplash.com/photo-1614680376593-902f749f7ffc?w=200&auto=format&fit=crop&q=80', 'Bidvest Corporate Navy (#002B49) & Gold (#C5A059). Trust, integrity and global scale.', 'https://files.uicms.com/ci/Bidvest_Global_Brand.pdf', 'Helena Du Plessis', 'helena.dp@bidvest.co.za', '+27 (0)11 772 8700', 'Group Events Director', 'https://www.bidvest.co.za', 'Bidvest Vouchers, airport lounge vouchers, and international travel stationery.', '[\"#002B49\", \"#C5A059\", \"#E6EFF5\"]', 'Proxima Nova, Trajan Pro', 2),
            ('cl-woolworths', 'Woolworths Financial Services', 'WFS', 'https://images.unsplash.com/photo-1542744094-3a31f272c490?w=200&auto=format&fit=crop&q=80', 'Woolworths Classic Monochrome (#000000 / #FFFFFF) with Accent Green (#2D6A4F). Premium sustainable minimalism.', NULL, 'Anita Govender', 'anita.govender@wfs.co.za', '+27 (0)21 407 9111', 'Loyalty Portfolio Lead', 'https://www.woolworths.co.za', 'Sprint campaign banners and store catalogue logos.', '[\"#000000\", \"#2D6A4F\", \"#F8F9FA\"]', 'Futura, Gill Sans, Helvetica Neue', 2)");
        }
        $db->exec("INSERT INTO `app_migrations` (`migration_key`) VALUES ('initial_clients_seeded') ON DUPLICATE KEY UPDATE `migration_key` = `migration_key`");
    }

    $db->exec("SET FOREIGN_KEY_CHECKS = 1;");
} catch (Throwable $e) {}

foreach ($tables as $tableName) {
    if ($tableName !== 'departments' && $tableName !== 'admin_settings') {
        $ensureColumn($tableName, 'app_payload', 'LONGTEXT NULL');
    }
}
$ensureColumn('users', 'personal_email', 'VARCHAR(150) NULL');
$ensureColumn('users', 'is_temp_password', 'TINYINT(1) NOT NULL DEFAULT 0');
$ensureColumn('users', 'temp_password_expires_at', 'VARCHAR(50) NULL');
$ensureColumn('users', 'must_change_password', 'TINYINT(1) NOT NULL DEFAULT 0');

try {
    $db->exec("ALTER TABLE `users` ALTER COLUMN `password` SET DEFAULT ''");
} catch (Throwable $e) {
    try {
        $db->exec("ALTER TABLE `users` MODIFY COLUMN `password` VARCHAR(255) NOT NULL DEFAULT ''");
    } catch (Throwable $e2) {}
}

try {
    $db->exec("ALTER TABLE `chat_messages` MODIFY COLUMN `project_id` VARCHAR(50) NULL");
} catch (Throwable $e) {}

$ensureColumn('chat_messages', 'sender_avatar', 'VARCHAR(500) NULL');
$ensureColumn('chat_messages', 'text', 'LONGTEXT NULL');
$ensureColumn('chat_messages', 'mentions', 'JSON NULL');
$ensureColumn('chat_messages', 'referenced_task_id', 'VARCHAR(50) NULL');
$ensureColumn('chat_messages', 'is_important', 'TINYINT(1) NOT NULL DEFAULT 0');
$ensureColumn('chat_messages', 'recipient_id', 'VARCHAR(50) NULL');
$ensureColumn('chat_messages', 'channel_id', 'VARCHAR(50) NULL');
$ensureColumn('chat_messages', 'attachments', 'JSON NULL');
$ensureColumn('chat_messages', 'referenced_version', 'VARCHAR(50) NULL');
$ensureColumn('chat_messages', 'read_by', 'JSON NULL');
$ensureColumn('notifications', 'is_read', 'TINYINT(1) NOT NULL DEFAULT 0');
$ensureColumn('notifications', 'target_tab', 'VARCHAR(50) NULL');

$ensureColumn('admin_settings', 'setting_key', 'VARCHAR(100) NULL');
$ensureColumn('admin_settings', 'setting_value', 'LONGTEXT NULL');
$ensureColumn('activity_logs', 'version_ref', 'VARCHAR(100) NULL');
$ensureColumn('activity_logs', 'metadata', 'JSON NULL');
} // End of !$isSchemaReady DDL initialization

$readValue = function (array $row, string $key, $fallback = null) {
    $aliases = [
        'title' => ['name'],
        'personal_email' => ['personalEmail'],
        'is_temp_password' => ['isTempPassword'],
        'temp_password_expires_at' => ['tempPasswordExpiresAt'],
        'must_change_password' => ['mustChangePassword'],
        'assigned_to_user_id' => ['ownerId'],
        'assigned_to_name' => ['assignedToName'],
        'department_id' => ['departmentId'],
        'role_title' => ['roleTitle'],
        'is_suspended' => ['isSuspended'],
        'suspension_reason' => ['suspendedReason'],
        'workload_count' => ['workloadCount'],
        'logo_url' => ['logoUrl'],
        'brand_guidelines' => ['brandGuidelines'],
        'ci_document_url' => ['ciDocumentUrl'],
        'primary_contact_name' => ['primaryContact.name'],
        'primary_contact_email' => ['primaryContact.email', 'primaryEmail'],
        'primary_contact_phone' => ['primaryContact.phone'],
        'primary_contact_position' => ['primaryContact.position'],
        'default_ci_colors' => ['defaultCiColors', 'brandColors'],
        'font_requirements' => ['fontRequirements', 'fontFamily'],
        'active_projects_count' => ['activeProjectsCount'],
        'project_number' => ['projectNumber'],
        'client_id' => ['clientId'],
        'request_type_id' => ['requestTypeId'],
        'project_name' => ['projectName'],
        'campaign_name' => ['campaignName'],
        'accountable_user_id' => ['accountableUserId'],
        'project_owner_id' => ['projectOwnerId'],
        'qa_owner_id' => ['qaOwnerId'],
        'approver_id' => ['approverId'],
        'contributor_ids' => ['contributorIds'],
        'created_at' => ['createdAt'],
        'updated_at' => ['updatedAt'],
        'brief_due_date' => ['briefDueDate'],
        'brief_locked_at' => ['briefLockedAt'],
        'brief_locked_by' => ['briefLockedBy'],
        'production_due_date' => ['productionDueDate'],
        'internal_qa_due_date' => ['internalQaDueDate'],
        'client_review_due_date' => ['clientReviewDueDate'],
        'client_approval_due_date' => ['clientApprovalDueDate'],
        'final_qa_due_date' => ['finalQaDueDate'],
        'release_date' => ['releaseDate'],
        'external_suppliers' => ['externalSuppliers'],
        'next_action_task' => ['nextAction.task'],
        'next_action_owner' => ['nextAction.ownerName'],
        'next_action_due' => ['nextAction.dueDate'],
        'approval_status' => ['approvalStatus'],
        'is_brief_locked' => ['isBriefLocked'],
        'is_version_locked' => ['isVersionLocked'],
        'brief_data' => ['briefData'],
        'brief_completeness' => ['briefCompleteness'],
        'project_id' => ['projectId'],
        'assigned_to' => ['assignedTo'],
        'start_date' => ['startDate'],
        'completed_at' => ['completedAt'],
        'comments_count' => ['commentsCount'],
        'version_number' => ['versionNumber'],
        'file_url' => ['fileUrl'],
        'preview_url' => ['previewUrl'],
        'uploaded_by' => ['uploadedBy'],
        'uploaded_by_name' => ['uploadedByName'],
        'uploaded_at' => ['uploadedAt'],
        'is_locked' => ['isLocked'],
        'qa_result' => ['qaResult'],
        'qa_notes' => ['qaNotes', 'notes'],
        'version_id' => ['versionId'],
        'version_number' => ['versionNumber'],
        'performed_by' => ['performedBy'],
        'performed_by_name' => ['performedByName'],
        'performed_at' => ['performedAt'],
        'overall_notes' => ['overallNotes'],
        'passed_count' => ['passedCount'],
        'failed_count' => ['failedCount'],
        'na_count' => ['naCount'],
        'client_name' => ['clientName'],
        'client_position' => ['clientPosition'],
        'confirmation_text' => ['confirmationText'],
        'changes_requested' => ['changesRequested'],
        'approved_at' => ['approvedAt'],
        'signature_hash' => ['signatureHash'],
        'submitted_by' => ['submittedBy'],
        'submitted_by_name' => ['submittedByName'],
        'submitted_at' => ['submittedAt'],
        'feedback_text' => ['feedbackText'],
        'attachment_url' => ['attachmentUrl'],
        'assigned_to_name' => ['assignedToName'],
        'user_id' => ['userId'],
        'is_read' => ['read'],
        'target_tab' => ['targetTab'],
        'sender_id' => ['senderId'],
        'sender_name' => ['senderName'],
        'sender_avatar' => ['senderAvatar'],
        'recipient_id' => ['recipientId'],
        'channel_id' => ['channelId'],
        'referenced_task_id' => ['referencedTaskId'],
        'referenced_version' => ['referencedVersion'],
        'is_important' => ['isImportant'],
        'user_name' => ['userName'],
        'version_ref' => ['versionRef'],
        'previous_stage' => ['previousStage'],
        'new_stage' => ['newStage'],
        'filename' => ['filename'],
        'uploaded_by' => ['uploadedBy'],
        'uploaded_by_name' => ['uploadedByName'],
        'uploaded_at' => ['uploadedAt'],
    ];

    foreach ($aliases[$key] ?? [] as $path) {
        $value = $row;
        foreach (explode('.', $path) as $part) {
            $value = is_array($value) ? ($value[$part] ?? null) : null;
        }
        if ($value !== null) return $value;
    }

    if (array_key_exists($key, $row)) return $row[$key];
    $camel = preg_replace_callback('/_([a-z])/', fn($matches) => strtoupper($matches[1]), $key);
    return $row[$camel] ?? $fallback;
};

$saveState = function (array $state, bool $onlyMissing = false) use ($db, $collectionTables, $readValue): int {
    $jsonColumns = [
        'default_ci_colors', 'contributor_ids', 'brief_data', 'checklist', 'changes_requested',
        'attachments', 'mentions', 'metadata', 'read_by',
    ];
    $savedRows = 0;

    $db->exec("SET FOREIGN_KEY_CHECKS = 0;");
    foreach ($collectionTables as $collection => $tableName) {
        $rows = $state[$collection] ?? $state[match ($collection) {
            'qa_submissions' => 'qaSubmissions',
            'client_approvals' => 'approvals',
            'feedback_items' => 'feedbackItems',
            'chat_messages' => 'chatMessages',
            'activity_logs' => 'activityLogs',
            'project_files' => 'files',
            'deliverable_versions' => 'versions',
            default => $collection,
        }] ?? [];
        if (!is_array($rows)) continue;
        try {
            $columns = $db->query("SHOW COLUMNS FROM `{$tableName}`")->fetchAll(PDO::FETCH_COLUMN);
            $columns = array_flip($columns);
        } catch (Throwable $e) {
            continue;
        }

        foreach ($rows as $row) {
            if (!is_array($row)) continue;
            $id = $row['id'] ?? null;
            if (!$id) continue;

            if ($onlyMissing) {
                $check = $db->prepare("SELECT 1 FROM `{$tableName}` WHERE id = :id LIMIT 1");
                $check->execute([':id' => $id]);
                if ($check->fetchColumn()) continue;
                if ($collection === 'users' && !empty($row['email'])) {
                    $emailCheck = $db->prepare('SELECT 1 FROM users WHERE email = :email LIMIT 1');
                    $emailCheck->execute([':email' => $row['email']]);
                    if ($emailCheck->fetchColumn()) continue;
                }
            }

            $values = [];
            foreach (array_keys($columns) as $column) {
                if ($column === 'app_payload') continue;
                $value = $readValue($row, $column);
                if ($value !== null) $values[$column] = $value;
            }

            if ($collection === 'users') {
                if (empty($values['password'])) {
                    // Retain existing password for known user, or set default password for new user
                    try {
                        $existPassStmt = $db->prepare('SELECT `password` FROM `users` WHERE `id` = :id LIMIT 1');
                        $existPassStmt->execute([':id' => $id]);
                        $existingPass = $existPassStmt->fetchColumn();
                        if ($existingPass && is_string($existingPass) && strlen($existingPass) > 0) {
                            $values['password'] = $existingPass;
                        } else {
                            $values['password'] = password_hash('Password123!', PASSWORD_BCRYPT);
                        }
                    } catch (Throwable) {
                        $values['password'] = password_hash('Password123!', PASSWORD_BCRYPT);
                    }
                } else {
                    $pass = (string)$values['password'];
                    if (!str_starts_with($pass, '$2y$') && !str_starts_with($pass, '$2a$') && !str_starts_with($pass, '$2b$') && !str_starts_with($pass, '$pbkdf2$')) {
                        $hashedPass = password_hash($pass, PASSWORD_BCRYPT);
                        $values['password'] = $hashedPass;
                        $row['password'] = $hashedPass;
                    }
                }
            }
            if ($collection === 'projects') {
                if (($values['stage'] ?? '') === 'RELEASE_PUBLISH') $values['stage'] = 'FINAL_RELEASE';
                if (($values['stage'] ?? '') === 'ARCHIVE') $values['stage'] = 'COMPLETED';
                if (in_array($values['status'] ?? '', ['waiting', 'revision_required'], true)) $values['status'] = 'blocked';
                if (($values['approval_status'] ?? '') === 'approved_with_notes') $values['approval_status'] = 'approved';
            }
            if ($collection === 'tasks') {
                $values['title'] = $values['title'] ?? ($row['name'] ?? 'Untitled Task');
                $values['assigned_to_user_id'] = $values['assigned_to_user_id'] ?? ($row['ownerId'] ?? '');
                $values['assigned_to_name'] = $values['assigned_to_name'] ?? ($row['assignedToName'] ?? '');
                $values['role_required'] = $values['role_required'] ?? ($row['roleRequired'] ?? 'designer');
                $values['status'] = match ($values['status'] ?? '') {
                    'not_started' => 'todo',
                    'complete' => 'completed',
                    'cancelled' => 'blocked',
                    default => $values['status'] ?? 'todo',
                };
                $values['due_date'] = $values['due_date'] ?? date('Y-m-d');
                $values['stage'] = $values['stage'] ?? ($row['stage'] ?? 'PRODUCTION');
            }
            if ($collection === 'versions' && isset($values['status'])) {
                $values['status'] = match ($values['status']) {
                    'in_qa' => 'internal_qa',
                    'revision_requested' => 'rejected',
                    'locked' => 'approved',
                    default => $values['status'],
                };
            }
            if ($collection === 'files') {
                $values['filename'] = $values['filename'] ?? 'Untitled file';
                $values['uploaded_at'] = $values['uploaded_at'] ?? date(DATE_ATOM);
                $values['url'] = $values['url'] ?? '';
            }
            if ($collection === 'chat_messages') {
                $values['project_id'] = $values['project_id'] ?? ($row['projectId'] ?? null);
                $values['recipient_id'] = $values['recipient_id'] ?? ($row['recipientId'] ?? null);
                $values['channel_id'] = $values['channel_id'] ?? ($row['channelId'] ?? null);
                $values['referenced_task_id'] = $values['referenced_task_id'] ?? ($row['referencedTaskId'] ?? null);
                $values['referenced_version'] = $values['referenced_version'] ?? ($row['referencedVersion'] ?? null);
                $values['read_by'] = $values['read_by'] ?? ($row['readBy'] ?? null);
                $values['is_important'] = !empty($row['isImportant']) || !empty($row['is_important']) ? 1 : 0;
                $msg = $row['message'] ?? ($row['text'] ?? '');
                if (isset($columns['message'])) $values['message'] = $values['message'] ?? $msg;
                if (isset($columns['text'])) $values['text'] = $values['text'] ?? $msg;
                if (isset($columns['sender_avatar'])) $values['sender_avatar'] = $values['sender_avatar'] ?? ($row['senderAvatar'] ?? null);
            }
            if ($collection === 'notifications') {
                $values['user_id'] = $values['user_id'] ?? ($row['userId'] ?? '');
                $values['project_id'] = $values['project_id'] ?? ($row['projectId'] ?? null);
                $values['target_tab'] = $values['target_tab'] ?? ($row['targetTab'] ?? null);
                $isReadVal = !empty($row['is_read']) || !empty($row['read']) || !empty($row['read_status']) ? 1 : 0;
                $values['is_read'] = $isReadVal;
                if (isset($columns['read_status'])) $values['read_status'] = $isReadVal;
            }

            foreach ($jsonColumns as $column) {
                if (array_key_exists($column, $values)) {
                    if (is_array($values[$column]) || is_object($values[$column])) {
                        try {
                            $values[$column] = json_encode($values[$column], JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
                        } catch (Throwable) {
                            $values[$column] = '{}';
                        }
                    } elseif (is_string($values[$column])) {
                        $trimmed = trim($values[$column]);
                        if ($trimmed === '' || $trimmed === 'null') {
                            $values[$column] = null;
                        } else {
                            @json_decode($trimmed);
                            if (json_last_error() !== JSON_ERROR_NONE) {
                                $values[$column] = json_encode(['note' => $trimmed], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
                            }
                        }
                    }
                }
            }
            try {
                $values['app_payload'] = json_encode($row, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
            } catch (Throwable) {
                $values['app_payload'] = null;
            }

            $columnNames = array_keys($values);
            $quotedColumns = array_map(fn($column) => "`{$column}`", $columnNames);
            $placeholders = array_map(fn($column) => ":{$column}", $columnNames);
            $updates = array_map(fn($column) => "`{$column}` = VALUES(`{$column}`)", array_filter($columnNames, fn($column) => $column !== 'id'));
            $sql = "INSERT INTO `{$tableName}` (" . implode(', ', $quotedColumns) . ') VALUES (' . implode(', ', $placeholders) . ')';
            if ($updates) $sql .= ' ON DUPLICATE KEY UPDATE ' . implode(', ', $updates);
            $stmt = $db->prepare($sql);
            foreach ($values as $column => $value) {
                if (is_array($value) || is_object($value)) {
                    $value = json_encode($value, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
                }
                $stmt->bindValue(":{$column}", $value);
            }
            try {
                $stmt->execute();
                $savedRows++;
            } catch (Throwable $rowErr) {
                error_log("Row insert notice on {$tableName}: " . $rowErr->getMessage());
            }
        }

        // Only prune unlisted records when explicitly requested by an administrative full replacement
        if (!empty($state['__purge_unlisted__']) && $collection !== 'users' && array_key_exists($collection, $state) && count($rows) > 0) {
            $ids = array_values(array_unique(array_filter(array_map(
                fn($row) => is_array($row) ? ($row['id'] ?? null) : null,
                $rows
            ))));
            if ($ids) {
                $placeholders = [];
                $params = [];
                foreach ($ids as $index => $id) {
                    $placeholder = ":keep{$index}";
                    $placeholders[] = $placeholder;
                    $params[$placeholder] = $id;
                }
                $delete = $db->prepare("DELETE FROM `{$tableName}` WHERE id NOT IN (" . implode(', ', $placeholders) . ')');
                $delete->execute($params);
            }
        }
    }

    $adminConfig = $state['admin_settings'] ?? $state['adminConfig'] ?? null;
    if (is_array($adminConfig)) {
        try {
            $stmt = $db->prepare(
                'INSERT INTO admin_settings (setting_key, setting_value) VALUES (:setting_key, :setting_value)
                 ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)'
            );
            $adminJson = @json_encode($adminConfig, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
            if ($adminJson === false) $adminJson = '{}';
            $stmt->execute([
                ':setting_key' => 'system_config',
                ':setting_value' => $adminJson,
            ]);
            $savedRows++;
        } catch (Throwable $adminErr) {
            error_log("Failed to persist admin_settings: " . $adminErr->getMessage());
        }
    }

    $db->exec("SET FOREIGN_KEY_CHECKS = 1;");
    return $savedRows;
};

$migrateLegacySnapshot = function () use ($db, $saveState): void {
    $db->exec("CREATE TABLE IF NOT EXISTS app_migrations (
        migration_key VARCHAR(100) NOT NULL PRIMARY KEY,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    $migrationKey = 'legacy_app_state_to_relational_v1';
    $check = $db->prepare('SELECT 1 FROM app_migrations WHERE migration_key = :key');
    $check->execute([':key' => $migrationKey]);
    if ($check->fetchColumn()) return;

    $tableCheck = $db->prepare(
        'SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table'
    );
    $tableCheck->execute([':table' => 'app_state']);
    if ((int)$tableCheck->fetchColumn() > 0) {
        $legacy = $db->query("SELECT state_json FROM app_state WHERE state_key = 'workflow'")->fetchColumn();
        if ($legacy !== false && is_string($legacy) && strlen($legacy) > 2) {
            $legacyState = @json_decode($legacy, true);
            if ($legacyState && is_array($legacyState)) {
                try {
                    $saveState($legacyState, true);
                } catch (Throwable $e) {}
            }
        }
    }

    $mark = $db->prepare('INSERT INTO app_migrations (migration_key) VALUES (:key)');
    $mark->execute([':key' => $migrationKey]);
};

try {
    $migrateLegacySnapshot();

    // Ensure users table password column has a default value so MySQL strict mode never errors on inserts
    try {
        $db->exec("ALTER TABLE `users` MODIFY COLUMN `password` VARCHAR(255) NOT NULL DEFAULT ''");
    } catch (Throwable $alterErr) {}

    // Auto-seed MySQL database ONLY ONCE on very first system initialization
    // Never re-seed if the user has intentionally emptied or deleted records
    try {
        $seedMigrationDone = $db->query("SELECT 1 FROM `app_migrations` WHERE migration_key = 'initial_seed_applied'")->fetchColumn();
        $explicitSeedRequested = isset($_GET['action']) && $_GET['action'] === 'seed';
        if (!$seedMigrationDone || $explicitSeedRequested) {
            $jsonPath = __DIR__ . '/../data/uicms_workflow_db.json';
            if (file_exists($jsonPath)) {
                $rawSeed = @json_decode(file_get_contents($jsonPath), true);
                if ($rawSeed && is_array($rawSeed)) {
                    $saveState($rawSeed);
                }
            }
            $db->exec("INSERT INTO `app_migrations` (`migration_key`) VALUES ('initial_seed_applied') ON DUPLICATE KEY UPDATE `migration_key` = `migration_key`");
        }
    } catch (Throwable $e) {}

    if ($method === 'POST') {
        $rawInput = file_get_contents('php://input');
        if (substr($rawInput, 0, 3) === "\xEF\xBB\xBF") {
            $rawInput = substr($rawInput, 3);
        }
        $input = @json_decode($rawInput, true);
        if (!is_array($input)) {
            sendResponse(400, [
                'status' => 'error',
                'message' => 'Invalid or malformed JSON payload received: ' . json_last_error_msg(),
            ]);
        }
        $state = null;

        // Specialized backend atomic actions
        if (isset($input['action'])) {
            $action = (string)$input['action'];
            if ($action === 'delete' && !empty($input['table']) && !empty($input['id'])) {
                $rawTbl = (string)$input['table'];
                $delTable = match ($rawTbl) {
                    'chat_messages', 'chatMessages' => 'chat_messages',
                    'notifications' => 'notifications',
                    'feedback_items', 'feedbackItems' => 'feedback_items',
                    'activity_logs', 'activityLogs' => 'activity_logs',
                    'clients' => 'clients',
                    'tasks' => 'tasks',
                    'versions', 'deliverable_versions' => 'deliverable_versions',
                    default => $rawTbl,
                };
                if (in_array($delTable, $tables, true)) {
                    $delStmt = $db->prepare("DELETE FROM `{$delTable}` WHERE id = :id");
                    $delStmt->execute([':id' => $input['id']]);
                    sendResponse(200, ['status' => 'success', 'message' => "Record deleted from {$delTable}"]);
                }
            } elseif ($action === 'clear_read_notifications' && (!empty($input['userId']) || !empty($input['user_id']))) {
                $targetUid = $input['userId'] ?? $input['user_id'];
                $delStmt = $db->prepare("DELETE FROM `notifications` WHERE user_id = :uid AND (is_read = 1 OR `read` = 1)");
                $delStmt->execute([':uid' => $targetUid]);
                sendResponse(200, ['status' => 'success', 'message' => "Read notifications cleared for user"]);
            } elseif ($action === 'mark_all_read' && (!empty($input['userId']) || !empty($input['user_id']))) {
                $targetUid = $input['userId'] ?? $input['user_id'];
                $upStmt = $db->prepare("UPDATE `notifications` SET is_read = 1 WHERE user_id = :uid");
                $upStmt->execute([':uid' => $targetUid]);
                sendResponse(200, ['status' => 'success', 'message' => "All notifications marked as read for user"]);
            }
        }

        if (isset($input['table']) && isset($input['data'])) {
            $tableKey = (string)$input['table'];
            $mappedTable = match ($tableKey) {
                'versions', 'deliverable_versions' => 'deliverable_versions',
                'files', 'project_files' => 'project_files',
                'qa_submissions', 'qaSubmissions' => 'qa_submissions',
                'client_approvals', 'approvals' => 'client_approvals',
                'feedback_items', 'feedbackItems' => 'feedback_items',
                'chat_messages', 'chatMessages' => 'chat_messages',
                'notifications' => 'notifications',
                'activity_logs', 'activityLogs' => 'activity_logs',
                'clients' => 'clients',
                default => $tableKey,
            };
            $state = [$mappedTable => $input['data']];
            if ($mappedTable === 'activity_logs') {
                $state['activityLogs'] = $input['data'];
            }
            if ($mappedTable === 'chat_messages') {
                $state['chatMessages'] = $input['data'];
            }
        } elseif (isset($input['data']) && is_array($input['data'])) {
            $state = $input['data'];
        } else {
            $state = $input;
        }

        if (!is_array($state)) {
            sendResponse(400, ['status' => 'error', 'message' => 'A data object is required.']);
        }

        $db->beginTransaction();
        try {
            $savedRows = $saveState($state);
            if ($db->inTransaction()) {
                $db->commit();
            }
        } catch (Throwable $saveErr) {
            if ($db->inTransaction()) {
                $db->rollBack();
            }
            error_log("Failed to save state in data.php: " . $saveErr->getMessage());
            sendResponse(500, [
                'status' => 'error',
                'message' => 'Failed to save relational data: ' . $saveErr->getMessage(),
            ]);
        }

        sendResponse(200, [
            'status' => 'success',
            'message' => "Saved {$savedRows} records to the relational database tables.",
            'saved_records' => $savedRows,
            'updated_at' => date(DATE_ATOM),
        ]);
    }

    if ($table !== 'all' && !in_array($table, $tables, true)) {
        sendResponse(400, ['status' => 'error', 'message' => 'Unsupported table requested.']);
    }

    $result = [];
    $targets = $table === 'all' ? $tables : [$table];

    // Read caller identity headers for Row-Level Security (RLS) enforcement
    $requestUserRole = $_SERVER['HTTP_X_USER_ROLE'] ?? null;
    $requestUserId = $_SERVER['HTTP_X_USER_ID'] ?? null;
    $requestClientId = $_SERVER['HTTP_X_CLIENT_ID'] ?? null;
    $requestDeptId = $_SERVER['HTTP_X_DEPARTMENT_ID'] ?? null;

    foreach ($targets as $tableName) {
        $rows = [];
        try {
            $stmt = $db->query("SELECT * FROM `{$tableName}` ORDER BY 1");
            $rows = $stmt->fetchAll();
        } catch (Throwable $e) {
            $rows = [];
        }

        if ($tableName === 'admin_settings') {
            $mapped = [];
            foreach ($rows as $row) {
                $mapped[$row['setting_key']] = json_decode($row['setting_value'] ?? '{}', true) ?: [];
            }
            $rows = $mapped;
        } elseif ($tableName !== 'departments') {
            foreach ($rows as &$row) {
                if (!empty($row['app_payload'])) {
                    $payload = json_decode($row['app_payload'], true);
                    if (is_array($payload)) $row = array_merge($row, $payload);
                }
            }
            unset($row);
        }

        foreach ($rows as &$row) {
            if (is_array($row)) {
                foreach ($row as $key => &$value) {
                    if (is_string($value) && in_array($key, ['contributor_ids', 'default_ci_colors', 'checklist', 'mentions', 'changes_requested', 'brief_data', 'attachments', 'metadata', 'setting_value'], true)) {
                        $decoded = json_decode($value, true);
                        if (json_last_error() === JSON_ERROR_NONE) $value = $decoded;
                    }
                }

                unset($value);
            }
        }

        unset($row);

        // Security & Row-Level Access Policy Enforcement (RLS)
        if ($tableName === 'users') {
            // NEVER leak raw passwords or password hashes across the wire
            foreach ($rows as &$uRow) {
                unset($uRow['password']);
                if ($requestUserRole === 'client') {
                    // Clients should not see internal personal recovery emails or credentials
                    unset($uRow['personal_email']);
                    unset($uRow['personalEmail']);
                    unset($uRow['is_temp_password']);
                    unset($uRow['isTempPassword']);
                    unset($uRow['temp_password_expires_at']);
                }
            }
            unset($uRow);
        }

        // Row-Level Security for Clients
        if ($requestUserRole === 'client' && !empty($requestClientId)) {
            if ($tableName === 'projects') {
                $rows = array_values(array_filter($rows, fn($r) => ($r['client_id'] ?? $r['clientId'] ?? '') === $requestClientId));
            } elseif ($tableName === 'client_approvals') {
                $rows = array_values(array_filter($rows, fn($r) => ($r['client_id'] ?? $r['clientId'] ?? '') === $requestClientId));
            } elseif ($tableName === 'tasks') {
                $rows = array_values(array_filter($rows, fn($r) => !empty($r['is_client_facing']) || !empty($r['isClientFacing'])));
            } elseif ($tableName === 'admin_settings') {
                $rows = [
                    'appName' => $rows['system_config']['appName'] ?? 'UICMS Creative Workflow',
                    'appSubtitle' => $rows['system_config']['appSubtitle'] ?? 'Brief. Create. Review. Approve. Deliver.',
                ];
            }
        }


        $result[match ($tableName) {
            'deliverable_versions' => 'versions',
            'project_files' => 'files',
            'client_approvals' => 'client_approvals',
            default => $tableName,
        }] = $rows;
        if ($tableName === 'activity_logs') {
            $result['activityLogs'] = $rows;
        }
        if ($tableName === 'qa_submissions') {
            $result['qaSubmissions'] = $rows;
        }
        if ($tableName === 'chat_messages') {
            $result['chatMessages'] = $rows;
        }
    }

    if ($table === 'all') {
        $result['versions'] = $result['versions'] ?? [];
        $result['files'] = $result['files'] ?? [];
    }

    sendResponse(200, [
        'status' => 'success',
        'source' => 'mysql_live',
        'count' => count($result),
        'data' => $result,
    ]);
} catch (PDOException $e) {
    if ($db->inTransaction()) $db->rollBack();
    sendResponse(500, ['status' => 'error', 'message' => $e->getMessage()]);
} catch (Throwable $e) {
    if ($db->inTransaction()) $db->rollBack();
    sendResponse(500, ['status' => 'error', 'message' => $e->getMessage()]);
}
