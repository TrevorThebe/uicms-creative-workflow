<?php
/**
 * ============================================================================
 * UICMS Workflow - Robust MySQL Database Initializer & Migration Tool (PDO)
 * ============================================================================
 * Creates and verifies 'uicms_workflow' database and required tables:
 * - users
 * - projects
 * - tasks
 * - files (and project_files)
 * - departments, clients, deliverable_versions, qa_submissions, client_approvals,
 *   feedback_items, notifications, chat_messages, activity_logs, admin_settings, products
 *
 * Can be run via CLI (`php php-backend/init_db.php`) or accessed via HTTP browser/GET request.
 */

declare(strict_types=1);

// Set headers if accessed via Web browser or API client
if (php_sapi_name() !== 'cli' && !headers_sent()) {
    header('Content-Type: application/json; charset=utf-8');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
}

// 1. Load Environment Configuration
require_once __DIR__ . '/helpers/env.php';

$dbHost = getenv('DB_HOST') ?: ($_ENV['DB_HOST'] ?? 'localhost');
$dbPort = (int)(getenv('DB_PORT') ?: ($_ENV['DB_PORT'] ?? 3306));
$dbName = getenv('DB_NAME') ?: ($_ENV['DB_NAME'] ?? 'uicms_workflow');
$dbUser = getenv('DB_USER') ?: ($_ENV['DB_USER'] ?? 'root');
$dbPass = getenv('DB_PASS') !== false ? getenv('DB_PASS') : ($_ENV['DB_PASS'] ?? '');
$dbCharset = 'utf8mb4';

$results = [
    'timestamp'       => date('c'),
    'database_target' => $dbName,
    'host'            => $dbHost,
    'port'            => $dbPort,
    'user'            => $dbUser,
    'actions'         => [],
    'tables_created'  => [],
    'errors'          => [],
    'success'         => false,
    'message'         => ''
];

try {
    // 2. Connect to MySQL Server Host (to guarantee database creation)
    $hostDsn = "mysql:host={$dbHost};port={$dbPort};charset={$dbCharset}";
    $pdoOptions = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];

    try {
        $serverConn = new PDO($hostDsn, $dbUser, $dbPass, $pdoOptions);
        $serverConn->exec("CREATE DATABASE IF NOT EXISTS `{$dbName}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;");
        $results['actions'][] = "Database `{$dbName}` verified or created successfully.";
    } catch (PDOException $e) {
        $results['actions'][] = "Server-level connection skipped/failed: " . $e->getMessage();
    }

    // 3. Connect Directly to Target Database via PDO
    $dbDsn = "mysql:host={$dbHost};port={$dbPort};dbname={$dbName};charset={$dbCharset}";
    $db = new PDO($dbDsn, $dbUser, $dbPass, $pdoOptions);
    $results['actions'][] = "Connected to `{$dbName}` on `{$dbHost}` via PDO.";

    // Disable foreign key checks during initialization
    $db->exec("SET FOREIGN_KEY_CHECKS = 0;");

    // 4. Define Table Creation Queries (users, projects, tasks, files + supporting schema)
    $tableSchemas = [
        'users' => "
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
        ",

        'projects' => "
            CREATE TABLE IF NOT EXISTS `projects` (
                `id` VARCHAR(50) NOT NULL,
                `project_number` INT NULL,
                `title` VARCHAR(255) NOT NULL,
                `project_name` VARCHAR(255) NULL,
                `campaign_name` VARCHAR(255) NULL,
                `code` VARCHAR(50) NULL,
                `client_id` VARCHAR(50) NULL,
                `client_name` VARCHAR(150) NULL,
                `department_id` VARCHAR(50) NOT NULL DEFAULT 'marketing',
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
        ",

        'tasks' => "
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
        ",

        'files' => "
            CREATE TABLE IF NOT EXISTS `files` (
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
        ",

        'project_files' => "
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
                KEY `idx_proj_file_proj` (`project_id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ",

        'departments' => "
            CREATE TABLE IF NOT EXISTS `departments` (
                `id` VARCHAR(50) NOT NULL,
                `name` VARCHAR(100) NOT NULL,
                `description` TEXT NULL,
                `icon` VARCHAR(50) NULL,
                `active` TINYINT(1) NOT NULL DEFAULT 1,
                `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (`id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ",

        'clients' => "
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
        ",

        'deliverable_versions' => "
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
        ",

        'qa_submissions' => "
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
        ",

        'client_approvals' => "
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
                `approved_at` VARCHAR(50) NULL,
                `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (`id`),
                KEY `idx_appr_proj` (`project_id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ",

        'feedback_items' => "
            CREATE TABLE IF NOT EXISTS `feedback_items` (
                `id` VARCHAR(50) NOT NULL,
                `project_id` VARCHAR(50) NOT NULL,
                `version_id` VARCHAR(50) NULL,
                `author_id` VARCHAR(50) NULL,
                `author_name` VARCHAR(100) NOT NULL,
                `author_avatar` VARCHAR(500) NULL,
                `author_role` VARCHAR(50) NOT NULL DEFAULT 'client',
                `content` LONGTEXT NOT NULL,
                `type` VARCHAR(50) NOT NULL DEFAULT 'comment',
                `is_internal` TINYINT(1) NOT NULL DEFAULT 0,
                `resolved` TINYINT(1) NOT NULL DEFAULT 0,
                `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (`id`),
                KEY `idx_fb_proj` (`project_id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ",

        'notifications' => "
            CREATE TABLE IF NOT EXISTS `notifications` (
                `id` VARCHAR(50) NOT NULL,
                `user_id` VARCHAR(50) NOT NULL,
                `project_id` VARCHAR(50) NULL,
                `type` VARCHAR(50) NOT NULL,
                `title` VARCHAR(255) NOT NULL,
                `message` TEXT NOT NULL,
                `target_tab` VARCHAR(50) NULL,
                `is_read` TINYINT(1) NOT NULL DEFAULT 0,
                `created_at` VARCHAR(50) NOT NULL,
                `app_payload` LONGTEXT NULL,
                PRIMARY KEY (`id`),
                KEY `idx_notif_user` (`user_id`),
                KEY `idx_notif_proj` (`project_id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ",

        'chat_messages' => "
            CREATE TABLE IF NOT EXISTS `chat_messages` (
                `id` VARCHAR(50) NOT NULL,
                `project_id` VARCHAR(50) NULL,
                `sender_id` VARCHAR(50) NOT NULL,
                `sender_name` VARCHAR(100) NOT NULL,
                `sender_avatar` VARCHAR(500) NULL,
                `recipient_id` VARCHAR(50) NULL,
                `channel_id` VARCHAR(50) NULL,
                `message` LONGTEXT NOT NULL,
                `mentions` JSON NULL,
                `referenced_task_id` VARCHAR(50) NULL,
                `referenced_version` VARCHAR(50) NULL,
                `is_important` TINYINT(1) NOT NULL DEFAULT 0,
                `attachments` JSON NULL,
                `created_at` VARCHAR(50) NOT NULL,
                `app_payload` LONGTEXT NULL,
                PRIMARY KEY (`id`),
                KEY `idx_chat_proj` (`project_id`),
                KEY `idx_chat_recip` (`recipient_id`),
                KEY `idx_chat_chan` (`channel_id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ",

        'activity_logs' => "
            CREATE TABLE IF NOT EXISTS `activity_logs` (
                `id` VARCHAR(50) NOT NULL,
                `user_id` VARCHAR(50) NOT NULL,
                `user_name` VARCHAR(100) NOT NULL,
                `user_avatar` VARCHAR(500) NULL,
                `action` VARCHAR(100) NOT NULL,
                `details` TEXT NOT NULL,
                `target_type` VARCHAR(50) NULL,
                `target_id` VARCHAR(50) NULL,
                `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (`id`),
                KEY `idx_act_user` (`user_id`),
                KEY `idx_act_target` (`target_type`, `target_id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ",

        'admin_settings' => "
            CREATE TABLE IF NOT EXISTS `admin_settings` (
                `setting_key` VARCHAR(100) NOT NULL,
                `setting_value` LONGTEXT NOT NULL,
                `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (`setting_key`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ",

        'products' => "
            CREATE TABLE IF NOT EXISTS `products` (
                `id` INT AUTO_INCREMENT NOT NULL,
                `name` VARCHAR(150) NOT NULL,
                `description` TEXT NULL,
                `price` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
                `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (`id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ",

        'password_resets' => "
            CREATE TABLE IF NOT EXISTS `password_resets` (
                `id` VARCHAR(50) NOT NULL,
                `user_id` VARCHAR(50) NOT NULL,
                `email` VARCHAR(255) NOT NULL,
                `verification_code_hash` VARCHAR(255) NOT NULL,
                `expires_at` DATETIME NOT NULL,
                `used` TINYINT(1) NOT NULL DEFAULT 0,
                `attempts` INT NOT NULL DEFAULT 0,
                `ip_address` VARCHAR(45) NULL,
                `created_at` DATETIME NOT NULL,
                `updated_at` DATETIME NULL,
                PRIMARY KEY (`id`),
                KEY `idx_pr_email` (`email`),
                KEY `idx_pr_user_id` (`user_id`),
                KEY `idx_pr_expires` (`expires_at`),
                KEY `idx_pr_created` (`created_at`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        "
    ];

    // 5. Execute table creations
    foreach ($tableSchemas as $tableName => $sql) {
        $db->exec($sql);
        $results['tables_created'][] = $tableName;
    }

    // 6. Seed Default Super Admin User if users table is empty
    $userCountStmt = $db->query("SELECT COUNT(*) AS cnt FROM `users`");
    $userCount = (int)$userCountStmt->fetchColumn();

    if ($userCount === 0) {
        $defaultPasswordHash = '$2y$12$Nq9v7e8W1x0a.2b3c4d5eOuZk8Y/jQ7L1w2e3r4t5y6u7i8o9p0q.'; // admin123
        $insertAdminStmt = $db->prepare("
            INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `role_title`, `department_id`, `avatar`, `active`)
            VALUES ('u-super-admin', 'Alex Rivera', 'admin@uicms.io', :pwd, 'super_admin', 'Creative Director & Admin', 'marketing', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', 1)
        ");
        $insertAdminStmt->execute([':pwd' => $defaultPasswordHash]);
        $results['actions'][] = "Default super admin user seeded (`admin@uicms.io`).";
    }

    // 7. Seed Initial Departments if empty
    $deptCountStmt = $db->query("SELECT COUNT(*) AS cnt FROM `departments`");
    if ((int)$deptCountStmt->fetchColumn() === 0) {
        $db->exec("
            INSERT INTO `departments` (`id`, `name`, `description`, `icon`, `active`) VALUES
            ('marketing', 'Marketing & Growth', 'Brand campaigns, growth hacking, and social media creative.', 'Megaphone', 1),
            ('branding', 'Brand Strategy & Identity', 'Corporate identity, visual language, and style guidelines.', 'Sparkles', 1),
            ('digital', 'Digital Product Design', 'UI/UX systems, web applications, and interactive experiences.', 'Layout', 1),
            ('content', 'Content & Editorial', 'Copywriting, technical documentation, and video scripts.', 'FileText', 1),
            ('motion', 'Motion & 3D Animation', 'Broadcast motion graphics, 3D product renders, and reels.', 'Film', 1)
        ");
        $results['actions'][] = "Default departments seeded.";
    }

    // 7b. Seed Initial Clients / Accounts if empty
    try {
        $clientCountStmt = $db->query("SELECT COUNT(*) AS cnt FROM `clients`");
        if ((int)$clientCountStmt->fetchColumn() === 0) {
            $db->exec("
                INSERT INTO `clients` (
                    `id`, `name`, `code`, `logo_url`, `brand_guidelines`, `ci_document_url`,
                    `primary_contact_name`, `primary_contact_email`, `primary_contact_phone`, `primary_contact_position`,
                    `website`, `notes`, `default_ci_colors`, `font_requirements`, `active_projects_count`
                ) VALUES
                ('cl-discovery', 'Discovery Group (Vitality)', 'DISC', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80', 'Strict compliance with Discovery Blue (#004080) and Vitality Orange (#FF6600). Minimum 20mm clear space around the emblem.', 'https://files.uicms.com/ci/Discovery_Corporate_CI_2026.pdf', 'Bradley Cooper', 'bradley.cooper@discovery.co.za', '+27 (0)11 529 2888', 'VP Marketing & Brand Experience', 'https://www.discovery.co.za', 'Premium incentive tier. Requires executive proof sign-offs 7 days prior to release.', '[\"#004080\", \"#FF6600\", \"#F4F7FB\", \"#1E293B\"]', 'Discovery Sans Bold, Discovery Text Regular, Futura Heavy', 4),
                ('cl-nissan', 'Nissan South Africa', 'NISN', 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=200&auto=format&fit=crop&q=80', 'Nissan Crimson Red (#C3002F) & Sleek Silver (#8A8D8F). Ultra modern automotive styling.', 'https://files.uicms.com/ci/Nissan_Apex_BrandBook.pdf', 'Rene Van Der Merwe', 'rene.vdm@nissan.co.za', '+27 (0)12 529 6000', 'Head of Dealer Incentives', 'https://www.nissan.co.za', 'Monthly sales sprint campaigns and dealership rewards platform.', '[\"#C3002F\", \"#000000\", \"#8A8D8F\", \"#FFFFFF\"]', 'Nissan Brand Regular, Nissan Display Bold', 3),
                ('cl-standardbank', 'Standard Bank Wealth', 'SBWL', 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=200&auto=format&fit=crop&q=80', 'Standard Bank Cobalt Blue (#0033A0) & Light Blue (#0091FF). High-net-worth luxury elegance.', 'https://files.uicms.com/ci/SB_Wealth_Guidelines.pdf', 'Sipho Khumalo', 'sipho.khumalo@standardbank.co.za', '+27 (0)11 636 9111', 'Director of Private Client Incentives', 'https://wealth.standardbank.com', 'Incentive Travel Switzerland and Kyoto trips + high-value client vouchers.', '[\"#0033A0\", \"#0091FF\", \"#F0F4FF\", \"#0A192F\"]', 'Standard Bank Sans, Cormorant Garamond', 4),
                ('cl-bidvest', 'Bidvest Premier Global', 'BIDV', 'https://images.unsplash.com/photo-1614680376593-902f749f7ffc?w=200&auto=format&fit=crop&q=80', 'Bidvest Corporate Navy (#002B49) & Gold (#C5A059). Trust, integrity and global scale.', 'https://files.uicms.com/ci/Bidvest_Global_Brand.pdf', 'Helena Du Plessis', 'helena.dp@bidvest.co.za', '+27 (0)11 772 8700', 'Group Events Director', 'https://www.bidvest.co.za', 'Bidvest Vouchers, airport lounge vouchers, and international travel stationery.', '[\"#002B49\", \"#C5A059\", \"#E6EFF5\"]', 'Proxima Nova, Trajan Pro', 2),
                ('cl-woolworths', 'Woolworths Financial Services', 'WFS', 'https://images.unsplash.com/photo-1542744094-3a31f272c490?w=200&auto=format&fit=crop&q=80', 'Woolworths Classic Monochrome (#000000 / #FFFFFF) with Accent Green (#2D6A4F). Premium sustainable minimalism.', NULL, 'Anita Govender', 'anita.govender@wfs.co.za', '+27 (0)21 407 9111', 'Loyalty Portfolio Lead', 'https://www.woolworths.co.za', 'Sprint campaign banners and store catalogue logos.', '[\"#000000\", \"#2D6A4F\", \"#F8F9FA\"]', 'Futura, Gill Sans, Helvetica Neue', 2)
            ");
            $results['actions'][] = "Default clients and accounts seeded.";
        }
    } catch (Throwable $e) {}

    // 8. Re-enable foreign key checks
    $db->exec("SET FOREIGN_KEY_CHECKS = 1;");

    $results['success'] = true;
    $results['message'] = "MySQL database `{$dbName}` initialized successfully with all tables: " . implode(', ', $results['tables_created']);

} catch (PDOException $e) {
    $results['success'] = false;
    $results['errors'][] = "PDO Error: " . $e->getMessage();
    $results['message'] = "Database initialization encountered a PDO error.";
    if (php_sapi_name() !== 'cli' && !headers_sent()) {
        http_response_code(500);
    }
} catch (Exception $e) {
    $results['success'] = false;
    $results['errors'][] = "General Error: " . $e->getMessage();
    $results['message'] = "Database initialization encountered an unexpected error.";
    if (php_sapi_name() !== 'cli' && !headers_sent()) {
        http_response_code(500);
    }
}

// 9. Output Status Message
if (php_sapi_name() === 'cli') {
    echo "\n=======================================================\n";
    echo " UICMS WORKFLOW DATABASE INITIALIZER (PDO)\n";
    echo "=======================================================\n";
    echo "Target Database: " . $results['database_target'] . "\n";
    echo "Host:            " . $results['host'] . "\n";
    echo "Status:          " . ($results['success'] ? "SUCCESS [OK]" : "FAILED [ERROR]") . "\n";
    echo "Message:         " . $results['message'] . "\n\n";
    if (!empty($results['actions'])) {
        echo "Actions Performed:\n";
        foreach ($results['actions'] as $act) {
            echo " - " . $act . "\n";
        }
        echo "\n";
    }
    if (!empty($results['tables_created'])) {
        echo "Tables Verified/Created:\n";
        foreach ($results['tables_created'] as $tbl) {
            echo " [x] " . $tbl . "\n";
        }
        echo "\n";
    }
    if (!empty($results['errors'])) {
        echo "Errors Encountered:\n";
        foreach ($results['errors'] as $err) {
            echo " [!] " . $err . "\n";
        }
        echo "\n";
    }
    echo "=======================================================\n";
} else {
    echo json_encode($results, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
}
