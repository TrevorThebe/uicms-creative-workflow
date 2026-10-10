<?php
// =============================================================================
// UICMS Creative Workflow - Enterprise Authentication & Session Gateway (PHP 8.2+)
// Connects with MySQL/phpMyAdmin `users` table for genuine credential validation
// =============================================================================

require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/ses.php';
initApiHeaders();

// Initialize session support
if (session_status() === PHP_SESSION_NONE) {
    ini_set('session.cookie_httponly', '1');
    ini_set('session.cookie_samesite', 'Lax');
    session_start();
}

$db = null;
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

// Ensure users table and columns exist in database uicms_workflow
if ($db !== null) {
    try {
        $db->exec("CREATE TABLE IF NOT EXISTS `users` (
            `id` VARCHAR(50) NOT NULL PRIMARY KEY,
            `name` VARCHAR(100) NOT NULL,
            `email` VARCHAR(150) NOT NULL UNIQUE,
            `personal_email` VARCHAR(150) NULL,
            `password` VARCHAR(255) NOT NULL DEFAULT '',
            `role` VARCHAR(50) NOT NULL DEFAULT 'designer',
            `role_title` VARCHAR(150) NOT NULL DEFAULT 'Team Member',
            `department_id` VARCHAR(50) NULL DEFAULT 'marketing',
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

        // Ensure missing columns on existing tables
        $colCheck = function(string $col, string $def) use ($db) {
            try {
                $stmt = $db->prepare("SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = :col");
                $stmt->execute([':col' => $col]);
                if ((int)$stmt->fetchColumn() === 0) {
                    $db->exec("ALTER TABLE `users` ADD COLUMN `{$col}` {$def}");
                }
            } catch (Throwable $e) {}
        };
        $colCheck('personal_email', 'VARCHAR(150) NULL');
        $colCheck('role_title', "VARCHAR(150) NOT NULL DEFAULT 'Team Member'");
        $colCheck('department_id', "VARCHAR(50) NULL DEFAULT 'marketing'");
        $colCheck('avatar', "VARCHAR(500) NULL");
        $colCheck('active', "TINYINT(1) NOT NULL DEFAULT 1");
        $colCheck('is_suspended', "TINYINT(1) NOT NULL DEFAULT 0");
        $colCheck('suspension_reason', "TEXT NULL");
        $colCheck('workload_count', "INT NOT NULL DEFAULT 0");
        $colCheck('is_temp_password', 'TINYINT(1) NOT NULL DEFAULT 0');
        $colCheck('temp_password_expires_at', 'VARCHAR(50) NULL');
        $colCheck('must_change_password', 'TINYINT(1) NOT NULL DEFAULT 0');

        try {
            $db->exec("ALTER TABLE `users` ALTER COLUMN `password` SET DEFAULT ''");
        } catch (Throwable $e) {
            try {
                $db->exec("ALTER TABLE `users` MODIFY COLUMN `password` VARCHAR(255) NOT NULL DEFAULT ''");
            } catch (Throwable $e2) {}
        }

        // Ensure password_resets table exists for Amazon SES recovery
        try {
            $db->exec("CREATE TABLE IF NOT EXISTS `password_resets` (
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
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
        } catch (Throwable $e) {}

        // Ensure ip_address column on activity_logs
        try {
            $stmt = $db->prepare("SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'activity_logs' AND COLUMN_NAME = 'ip_address'");
            $stmt->execute();
            if ((int)$stmt->fetchColumn() === 0) {
                $db->exec("ALTER TABLE `activity_logs` ADD COLUMN `ip_address` VARCHAR(45) NULL");
            }
        } catch (Throwable $e) {}

        // Auto-seed default administrator accounts if users table is empty
        $countStmt = $db->query("SELECT COUNT(*) FROM `users`");
        if ($countStmt && (int)$countStmt->fetchColumn() === 0) {
            $seedHash = password_hash('Password123!', PASSWORD_BCRYPT);
            $ins = $db->prepare("INSERT INTO `users` (`id`, `name`, `email`, `personal_email`, `password`, `role`, `role_title`, `department_id`, `avatar`, `active`, `is_suspended`, `workload_count`) VALUES 
            ('usr-admin-01', 'Alex Rivera', 'admin@uicms.local', 'alex.rivera@personal.com', :h, 'super_admin', 'Executive Creative Director & Super Admin', 'marketing', '', 1, 0, 0),
            ('usr-trevztm', 'Trev', 'trevztm@gmail.com', 'trevztm@gmail.com', :h, 'super_admin', 'System Super Administrator', 'marketing', '', 1, 0, 0),
            ('usr-admin', 'Eleanor Vance', 'eleanor.vance@uicms.com', 'eleanor.vance@gmail.com', :h, 'super_admin', 'Chief Operations & Systems Administrator', 'marketing', '', 1, 0, 0),
            ('usr-mgr-01', 'Sarah Chen', 'sarah.chen@uicms.local', 'sarah.chen@personal.com', :h, 'department_manager', 'Creative Operations Manager', 'marketing', '', 1, 0, 0),
            ('usr-des-01', 'Marcus Vance', 'marcus.vance@uicms.local', 'marcus.vance@personal.com', :h, 'designer', 'Senior Visual Designer', 'marketing', '', 1, 0, 0)");
            $ins->execute([':h' => $seedHash]);
        }
    } catch (Throwable $e) {
        // Proceed gracefully if permissions restrict schema introspection
    }
}

if ($method === 'OPTIONS') {
    initApiHeaders();
    http_response_code(204);
    exit();
}

function sendAuthResponse(int $statusCode, array $payload): void {
    initApiHeaders();
    http_response_code($statusCode);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit();
}

function getClientIp(): string {
    $keys = ['HTTP_CF_CONNECTING_IP', 'HTTP_X_FORWARDED_FOR', 'HTTP_X_REAL_IP', 'REMOTE_ADDR'];
    foreach ($keys as $k) {
        if (!empty($_SERVER[$k])) {
            $ipList = explode(',', (string)$_SERVER[$k]);
            $ip = trim($ipList[0]);
            if (filter_var($ip, FILTER_VALIDATE_IP)) {
                return $ip;
            }
        }
    }
    return '127.0.0.1';
}

function logAuthActivity(?PDO $db, string $userId, string $action, string $description, string $email, string $ip): void {
    if (!$db) return;
    try {
        $meta = json_encode([
            'email' => $email,
            'ip_address' => $ip,
            'timestamp' => date('c'),
            'service' => 'AWS_PASSWORD_RESET_SES',
        ], JSON_UNESCAPED_SLASHES);

        $stmt = $db->prepare('INSERT INTO activity_logs (id, project_id, user_id, user_name, action, description, timestamp, ip_address, metadata) VALUES (:id, :proj, :uid, :uname, :action, :desc, :ts, :ip, :meta)');
        $stmt->execute([
            ':id' => 'act-' . bin2hex(random_bytes(6)),
            ':proj' => 'SYSTEM',
            ':uid' => $userId ?: 'UNKNOWN',
            ':uname' => $email,
            ':action' => $action,
            ':desc' => $description,
            ':ts' => date('c'),
            ':ip' => $ip,
            ':meta' => $meta,
        ]);
    } catch (Throwable $e) {
        try {
            $meta = json_encode([
                'email' => $email,
                'ip_address' => $ip,
                'timestamp' => date('c'),
                'service' => 'AWS_PASSWORD_RESET_SES',
            ], JSON_UNESCAPED_SLASHES);

            $stmt = $db->prepare('INSERT INTO activity_logs (id, project_id, user_id, user_name, action, description, timestamp, metadata) VALUES (:id, :proj, :uid, :uname, :action, :desc, :ts, :meta)');
            $stmt->execute([
                ':id' => 'act-' . bin2hex(random_bytes(6)),
                ':proj' => 'SYSTEM',
                ':uid' => $userId ?: 'UNKNOWN',
                ':uname' => $email,
                ':action' => $action,
                ':desc' => $description,
                ':ts' => date('c'),
                ':meta' => $meta,
            ]);
        } catch (Throwable $e2) {}
    }
}

$rawInput = file_get_contents('php://input');
$body = json_decode($rawInput, true) ?: [];
$action = trim((string)($_GET['action'] ?? $body['action'] ?? ''));

// Helper to format user row for API output (never exposing password)
function sanitizeUserRow(array $row): array {
    unset($row['password']);
    return [
        'id' => (string)($row['id'] ?? ''),
        'name' => (string)($row['name'] ?? ''),
        'email' => (string)($row['email'] ?? ''),
        'personalEmail' => !empty($row['personal_email']) ? (string)$row['personal_email'] : null,
        'role' => (string)($row['role'] ?? 'designer'),
        'roleTitle' => (string)($row['role_title'] ?? $row['role'] ?? 'Team Member'),
        'departmentId' => (string)($row['department_id'] ?? 'marketing'),
        'avatar' => (string)($row['avatar'] ?? ''),
        'active' => (bool)($row['active'] ?? true),
        'isSuspended' => (bool)($row['is_suspended'] ?? false),
        'suspensionReason' => !empty($row['suspension_reason']) ? (string)$row['suspension_reason'] : null,
        'workloadCount' => (int)($row['workload_count'] ?? 0),
        'isTempPassword' => (bool)($row['is_temp_password'] ?? false),
        'tempPasswordExpiresAt' => !empty($row['temp_password_expires_at']) ? (string)$row['temp_password_expires_at'] : null,
        'mustChangePassword' => (bool)($row['must_change_password'] ?? false),
    ];
}

// -----------------------------------------------------------------------------
// 1. SESSION CHECK
// -----------------------------------------------------------------------------
if ($action === 'session') {
    if (!empty($_SESSION['uicms_auth_user'])) {
        sendAuthResponse(200, [
            'status' => 'success',
            'user' => $_SESSION['uicms_auth_user'],
        ]);
    }

    sendAuthResponse(401, [
        'status' => 'unauthenticated',
        'message' => 'No active user session.',
    ]);
}

// -----------------------------------------------------------------------------
// 2. LOGOUT
// -----------------------------------------------------------------------------
if ($action === 'logout') {
    unset($_SESSION['uicms_auth_user']);
    session_destroy();
    sendAuthResponse(200, [
        'status' => 'success',
        'message' => 'Signed out successfully.',
    ]);
}

// -----------------------------------------------------------------------------
// 3. LOGIN
// -----------------------------------------------------------------------------
if ($action === 'login') {
    $email = strtolower(trim((string)($body['email'] ?? '')));
    $password = (string)($body['password'] ?? '');

    if (empty($email) || empty($password)) {
        sendAuthResponse(400, [
            'status' => 'error',
            'message' => 'Email and password are required.',
        ]);
    }

    // Query user by work email or personal recovery email
    $userRow = null;
    try {
        $stmt = $db->prepare('SELECT * FROM users WHERE LOWER(email) = :email OR LOWER(personal_email) = :email LIMIT 1');
        $stmt->execute([':email' => $email]);
        $userRow = $stmt->fetch();
    } catch (Throwable $e) {
        $stmt = $db->prepare('SELECT * FROM users WHERE LOWER(email) = :email LIMIT 1');
        $stmt->execute([':email' => $email]);
        $userRow = $stmt->fetch();
    }

    if (!$userRow) {
        sendAuthResponse(401, [
            'status' => 'error',
            'message' => 'Invalid email address or password.',
        ]);
    }

    // Check account status
    if (!empty($userRow['is_suspended'])) {
        $reason = !empty($userRow['suspension_reason']) ? $userRow['suspension_reason'] : 'Please contact the system administrator.';
        sendAuthResponse(403, [
            'status' => 'error',
            'message' => "This account is currently suspended. {$reason}",
        ]);
    }

    if (isset($userRow['active']) && empty($userRow['active'])) {
        sendAuthResponse(403, [
            'status' => 'error',
            'message' => 'This account has been deactivated. Please contact your manager.',
        ]);
    }

    // Check temporary password expiration
    if (!empty($userRow['is_temp_password']) && !empty($userRow['temp_password_expires_at'])) {
        if (strtotime($userRow['temp_password_expires_at']) < time()) {
            sendAuthResponse(401, [
                'status' => 'error',
                'message' => 'Temporary password has expired. Please request a new password reset.',
            ]);
        }
    }

    // Verify Password: supports PHP password_verify (BCrypt), MD5, SHA1, SHA256 (phpMyAdmin functions), PBKDF2, initial plaintext, and default seed passwords
    $storedPass = (string)($userRow['password'] ?? '');
    $passwordValid = false;

    if (password_verify($password, $storedPass)) {
        $passwordValid = true;
    } elseif ($storedPass === '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' && ($password === 'Password123!' || $password === 'password')) {
        // Default seed password match -> auto-upgrade to current bcrypt hash
        $passwordValid = true;
        try {
            $upgradedHash = password_hash($password, PASSWORD_BCRYPT);
            $upStmt = $db->prepare('UPDATE users SET password = :p WHERE id = :id');
            $upStmt->execute([':p' => $upgradedHash, ':id' => $userRow['id']]);
        } catch (Throwable $e) {}
    } elseif ($storedPass === $password) {
        // Plaintext match -> auto-upgrade to BCrypt in database
        $passwordValid = true;
        try {
            $upgradedHash = password_hash($password, PASSWORD_BCRYPT);
            $upStmt = $db->prepare('UPDATE users SET password = :p WHERE id = :id');
            $upStmt->execute([':p' => $upgradedHash, ':id' => $userRow['id']]);
        } catch (Throwable $e) {}
    } elseif (strcasecmp($storedPass, md5($password)) === 0) {
        // phpMyAdmin MD5 function match -> auto-upgrade to BCrypt
        $passwordValid = true;
        try {
            $upgradedHash = password_hash($password, PASSWORD_BCRYPT);
            $upStmt = $db->prepare('UPDATE users SET password = :p WHERE id = :id');
            $upStmt->execute([':p' => $upgradedHash, ':id' => $userRow['id']]);
        } catch (Throwable $e) {}
    } elseif (strcasecmp($storedPass, sha1($password)) === 0) {
        // phpMyAdmin SHA1 match -> auto-upgrade to BCrypt
        $passwordValid = true;
        try {
            $upgradedHash = password_hash($password, PASSWORD_BCRYPT);
            $upStmt = $db->prepare('UPDATE users SET password = :p WHERE id = :id');
            $upStmt->execute([':p' => $upgradedHash, ':id' => $userRow['id']]);
        } catch (Throwable $e) {}
    } elseif (strcasecmp($storedPass, hash('sha256', $password)) === 0) {
        // phpMyAdmin SHA256 match -> auto-upgrade to BCrypt
        $passwordValid = true;
        try {
            $upgradedHash = password_hash($password, PASSWORD_BCRYPT);
            $upStmt = $db->prepare('UPDATE users SET password = :p WHERE id = :id');
            $upStmt->execute([':p' => $upgradedHash, ':id' => $userRow['id']]);
        } catch (Throwable $e) {}
    } elseif (str_starts_with($storedPass, '$pbkdf2$sha256$')) {
        // PBKDF2 client hash comparison
        $salt = 'uicms_workflow_secure_salt_v2_2026';
        $h1 = 5381;
        $s1 = $password . $salt;
        for ($i = 0; $i < strlen($s1); $i++) {
            $h1 = (($h1 * 33) ^ ord($s1[$i])) & 0xFFFFFFFF;
        }
        $hex1 = str_pad(dechex(abs($h1)), 8, '0', STR_PAD_LEFT);
        $h2 = 0;
        for ($i = 0; $i < strlen($s1); $i++) {
            $h2 = (($h2 << 5) - $h2 + ord($s1[$i])) & 0xFFFFFFFF;
        }
        $hex2 = str_pad(dechex(abs($h2)), 8, '0', STR_PAD_LEFT);
        $computed = '$pbkdf2$sha256$' . $hex1 . $hex2 . $hex1 . $hex2;
        if (hash_equals($storedPass, $computed)) {
            $passwordValid = true;
        }
    }

    if (!$passwordValid) {
        sendAuthResponse(401, [
            'status' => 'error',
            'message' => 'Invalid email address or password.',
        ]);
    }

    // Build sanitized user object
    $sanitized = sanitizeUserRow($userRow);
    $_SESSION['uicms_auth_user'] = $sanitized;

    // Log login activity to database activity_logs
    try {
        $logStmt = $db->prepare('INSERT INTO activity_logs (id, project_id, user_id, action, details, timestamp) VALUES (:id, :proj, :uid, :action, :details, :ts)');
        $logStmt->execute([
            ':id' => 'log-' . bin2hex(random_bytes(6)),
            ':proj' => 'SYSTEM',
            ':uid' => $userRow['id'],
            ':action' => 'USER_LOGIN',
            ':details' => "User {$userRow['name']} signed into portal.",
            ':ts' => date('c'),
        ]);
    } catch (Throwable $e) {}

    sendAuthResponse(200, [
        'status' => 'success',
        'message' => 'Authentication successful.',
        'user' => $sanitized,
    ]);
}

// -----------------------------------------------------------------------------
// 4. REGISTER
// -----------------------------------------------------------------------------
if ($action === 'register') {
    $name = trim((string)($body['name'] ?? ''));
    $email = strtolower(trim((string)($body['email'] ?? '')));
    $password = (string)($body['password'] ?? '');
    $role = (string)($body['role'] ?? 'designer');
    $roleTitle = trim((string)($body['roleTitle'] ?? 'Creative Specialist'));
    $departmentId = (string)($body['departmentId'] ?? 'marketing');
    $avatar = (string)($body['avatar'] ?? '');

    if (empty($name) || empty($email) || empty($password)) {
        sendAuthResponse(400, [
            'status' => 'error',
            'message' => 'Name, email, and password are required for registration.',
        ]);
    }

    if (strlen($password) < 8) {
        sendAuthResponse(400, [
            'status' => 'error',
            'message' => 'Password must be at least 8 characters in length.',
        ]);
    }

    // Check duplicate email
    $checkStmt = $db->prepare('SELECT COUNT(*) FROM users WHERE LOWER(email) = :email');
    $checkStmt->execute([':email' => $email]);
    if ((int)$checkStmt->fetchColumn() > 0) {
        sendAuthResponse(409, [
            'status' => 'error',
            'message' => 'An account with this email address already exists.',
        ]);
    }

    $userId = 'usr-' . bin2hex(random_bytes(4));
    $hashedPassword = password_hash($password, PASSWORD_BCRYPT);

    $insStmt = $db->prepare(
        'INSERT INTO users (id, name, email, password, role, role_title, department_id, avatar, active, is_suspended, workload_count) ' .
        'VALUES (:id, :name, :email, :password, :role, :role_title, :dept, :avatar, 1, 0, 0)'
    );
    try {
        $insStmt->execute([
            ':id' => $userId,
            ':name' => $name,
            ':email' => $email,
            ':password' => $hashedPassword,
            ':role' => $role,
            ':role_title' => $roleTitle,
            ':dept' => $departmentId,
            ':avatar' => $avatar,
        ]);
    } catch (Throwable $insErr) {
        sendAuthResponse(500, [
            'status' => 'error',
            'message' => 'Failed to create user account: ' . $insErr->getMessage(),
        ]);
    }

    $newUserRow = [
        'id' => $userId,
        'name' => $name,
        'email' => $email,
        'role' => $role,
        'role_title' => $roleTitle,
        'department_id' => $departmentId,
        'avatar' => $avatar,
        'active' => 1,
        'is_suspended' => 0,
        'workload_count' => 0,
    ];

    $sanitized = sanitizeUserRow($newUserRow);
    $_SESSION['uicms_auth_user'] = $sanitized;

    sendAuthResponse(201, [
        'status' => 'success',
        'message' => 'Account created successfully.',
        'user' => $sanitized,
    ]);
}

// -----------------------------------------------------------------------------
// 4b. ADMIN CREATE USER (Without disrupting current administrator session)
// -----------------------------------------------------------------------------
if ($action === 'create-user' || $action === 'add-user') {
    $name = trim((string)($body['name'] ?? ''));
    $email = strtolower(trim((string)($body['email'] ?? '')));
    $personalEmail = trim((string)($body['personalEmail'] ?? $body['personal_email'] ?? ''));
    $password = (string)($body['password'] ?? 'Password123!');
    $role = (string)($body['role'] ?? 'designer');
    $roleTitle = trim((string)($body['roleTitle'] ?? $body['role_title'] ?? 'Team Member'));
    $departmentId = (string)($body['departmentId'] ?? $body['department_id'] ?? 'marketing');
    $avatar = (string)($body['avatar'] ?? '');

    if (empty($name) || empty($email)) {
        sendAuthResponse(400, [
            'status' => 'error',
            'message' => 'Full name and email are required to create a user.',
        ]);
    }

    // Check duplicate email
    $checkStmt = $db->prepare('SELECT COUNT(*) FROM users WHERE LOWER(email) = :email');
    $checkStmt->execute([':email' => $email]);
    if ((int)$checkStmt->fetchColumn() > 0) {
        sendAuthResponse(409, [
            'status' => 'error',
            'message' => 'An account with this email address already exists in the database.',
        ]);
    }

    $userId = 'usr-' . bin2hex(random_bytes(4));
    $hashedPassword = password_hash($password, PASSWORD_BCRYPT);

    $insStmt = $db->prepare(
        'INSERT INTO users (id, name, email, personal_email, password, role, role_title, department_id, avatar, active, is_suspended, workload_count) ' .
        'VALUES (:id, :name, :email, :personal_email, :password, :role, :role_title, :dept, :avatar, 1, 0, 0)'
    );
    $insStmt->execute([
        ':id' => $userId,
        ':name' => $name,
        ':email' => $email,
        ':personal_email' => !empty($personalEmail) ? $personalEmail : null,
        ':password' => $hashedPassword,
        ':role' => $role,
        ':role_title' => $roleTitle,
        ':dept' => $departmentId,
        ':avatar' => $avatar,
    ]);

    $newUserRow = [
        'id' => $userId,
        'name' => $name,
        'email' => $email,
        'personal_email' => !empty($personalEmail) ? $personalEmail : null,
        'role' => $role,
        'role_title' => $roleTitle,
        'department_id' => $departmentId,
        'avatar' => $avatar,
        'active' => 1,
        'is_suspended' => 0,
        'workload_count' => 0,
    ];

    $sanitized = sanitizeUserRow($newUserRow);

    sendAuthResponse(201, [
        'status' => 'success',
        'message' => 'User created and saved to database successfully.',
        'user' => $sanitized,
    ]);
}

// -----------------------------------------------------------------------------
// 4.1. DELETE USER
// -----------------------------------------------------------------------------
if ($action === 'delete-user' || $action === 'remove-user') {
    $userId = (string)($body['userId'] ?? $body['id'] ?? '');

    if (empty($userId)) {
        sendAuthResponse(400, [
            'status' => 'error',
            'message' => 'User ID is required to delete a user.',
        ]);
    }

    try {
        $delStmt = $db->prepare('DELETE FROM users WHERE id = :id');
        $delStmt->execute([':id' => $userId]);

        sendAuthResponse(200, [
            'status' => 'success',
            'message' => 'User deleted successfully from MySQL database.',
            'userId' => $userId,
        ]);
    } catch (PDOException $e) {
        sendAuthResponse(500, [
            'status' => 'error',
            'message' => 'Failed to delete user: ' . $e->getMessage(),
        ]);
    }
}

// -----------------------------------------------------------------------------
// 4.1b. UPDATE / EDIT USER
// -----------------------------------------------------------------------------
if ($action === 'update-user' || $action === 'edit-user') {
    $userId = (string)($body['userId'] ?? $body['id'] ?? '');

    if (empty($userId)) {
        sendAuthResponse(400, [
            'status' => 'error',
            'message' => 'User ID is required to update user details.',
        ]);
    }

    try {
        $checkStmt = $db->prepare('SELECT * FROM users WHERE id = :id');
        $checkStmt->execute([':id' => $userId]);
        $existing = $checkStmt->fetch();

        if (!$existing) {
            sendAuthResponse(404, [
                'status' => 'error',
                'message' => 'User account not found.',
            ]);
        }

        $fields = [];
        $params = [':id' => $userId];

        if (isset($body['name'])) {
            $fields[] = 'name = :name';
            $params[':name'] = trim((string)$body['name']);
        }
        if (isset($body['email'])) {
            $newEmail = strtolower(trim((string)$body['email']));
            $emailCheck = $db->prepare('SELECT 1 FROM users WHERE email = :email AND id != :id');
            $emailCheck->execute([':email' => $newEmail, ':id' => $userId]);
            if ($emailCheck->fetchColumn()) {
                sendAuthResponse(409, [
                    'status' => 'error',
                    'message' => 'An account with this email address already exists.',
                ]);
            }
            $fields[] = 'email = :email';
            $params[':email'] = $newEmail;
        }
        if (isset($body['personalEmail']) || isset($body['personal_email'])) {
            $fields[] = 'personal_email = :personal_email';
            $params[':personal_email'] = trim((string)($body['personalEmail'] ?? $body['personal_email']));
        }
        if (isset($body['role'])) {
            $fields[] = 'role = :role';
            $params[':role'] = trim((string)$body['role']);
        }
        if (isset($body['roleTitle']) || isset($body['role_title'])) {
            $fields[] = 'role_title = :role_title';
            $params[':role_title'] = trim((string)($body['roleTitle'] ?? $body['role_title']));
        }
        if (isset($body['departmentId']) || isset($body['department_id'])) {
            $fields[] = 'department_id = :department_id';
            $params[':department_id'] = trim((string)($body['departmentId'] ?? $body['department_id']));
        }
        if (isset($body['avatar'])) {
            $fields[] = 'avatar = :avatar';
            $params[':avatar'] = (string)$body['avatar'];
        }
        if (isset($body['active'])) {
            $fields[] = 'active = :active';
            $params[':active'] = !empty($body['active']) ? 1 : 0;
        }
        if (!empty($body['password'])) {
            $rawPass = (string)$body['password'];
            $fields[] = 'password = :password';
            $params[':password'] = password_hash($rawPass, PASSWORD_BCRYPT);
        }

        if (!empty($fields)) {
            $sql = 'UPDATE users SET ' . implode(', ', $fields) . ', updated_at = CURRENT_TIMESTAMP WHERE id = :id';
            $updateStmt = $db->prepare($sql);
            $updateStmt->execute($params);
        }

        $refreshed = $db->prepare('SELECT * FROM users WHERE id = :id');
        $refreshed->execute([':id' => $userId]);
        $userRow = $refreshed->fetch();
        if ($userRow) unset($userRow['password']);

        sendAuthResponse(200, [
            'status' => 'success',
            'message' => 'User profile updated successfully.',
            'user' => $userRow,
        ]);
    } catch (PDOException $e) {
        sendAuthResponse(500, [
            'status' => 'error',
            'message' => 'Database error updating user: ' . $e->getMessage(),
        ]);
    }
}

// -----------------------------------------------------------------------------
// 4.2. SUSPEND / UNSUSPEND USER
// -----------------------------------------------------------------------------
if ($action === 'suspend-user' || $action === 'suspend_user') {
    $userId = (string)($body['userId'] ?? $body['id'] ?? $body['user_id'] ?? $_GET['userId'] ?? $_GET['id'] ?? '');

    $isSuspended = 0;
    if (isset($body['isSuspended'])) {
        $isSuspended = ($body['isSuspended'] === true || $body['isSuspended'] === 1 || $body['isSuspended'] === '1' || $body['isSuspended'] === 'true') ? 1 : 0;
    } elseif (isset($body['is_suspended'])) {
        $isSuspended = ($body['is_suspended'] === true || $body['is_suspended'] === 1 || $body['is_suspended'] === '1' || $body['is_suspended'] === 'true') ? 1 : 0;
    } elseif (isset($_GET['isSuspended'])) {
        $isSuspended = ($_GET['isSuspended'] === '1' || $_GET['isSuspended'] === 'true') ? 1 : 0;
    }

    $reason = (string)($body['reason'] ?? $body['suspensionReason'] ?? $body['suspension_reason'] ?? '');
    $active = $isSuspended ? 0 : 1;

    if (empty($userId)) {
        error_log("Suspend user failed: User ID is empty.");
        sendAuthResponse(400, [
            'status' => 'error',
            'message' => 'User ID is required.',
        ]);
    }

    if ($db === null) {
        error_log("Suspend user failed: Database connection unavailable.");
        sendAuthResponse(500, [
            'status' => 'error',
            'message' => 'Database connection unavailable.',
        ]);
    }

    try {
        error_log("Attempting to suspend user ID: " . $userId);
        // Ensure required columns exist in users table
        try {
            $stmtCol = $db->query("SHOW COLUMNS FROM `users` LIKE 'is_suspended'");
            if (!$stmtCol || $stmtCol->rowCount() === 0) {
                $db->exec("ALTER TABLE `users` ADD COLUMN `is_suspended` TINYINT(1) NOT NULL DEFAULT 0");
            }
        } catch (Throwable) {}
        try {
            $stmtCol = $db->query("SHOW COLUMNS FROM `users` LIKE 'suspension_reason'");
            if (!$stmtCol || $stmtCol->rowCount() === 0) {
                $db->exec("ALTER TABLE `users` ADD COLUMN `suspension_reason` TEXT NULL");
            }
        } catch (Throwable) {}
        try {
            $stmtCol = $db->query("SHOW COLUMNS FROM `users` LIKE 'active'");
            if (!$stmtCol || $stmtCol->rowCount() === 0) {
                $db->exec("ALTER TABLE `users` ADD COLUMN `active` TINYINT(1) NOT NULL DEFAULT 1");
            }
        } catch (Throwable) {}

        // Locate user by ID or Email
        $findStmt = $db->prepare('SELECT id, name, email, app_payload FROM `users` WHERE id = :id OR LOWER(email) = LOWER(:id_email) LIMIT 1');
        $findStmt->execute([':id' => $userId, ':id_email' => $userId]);
        $targetUser = $findStmt->fetch(PDO::FETCH_ASSOC);

        if (!$targetUser) {
            sendAuthResponse(404, [
                'status' => 'error',
                'message' => 'User not found in database.',
            ]);
        }

        $realUserId = $targetUser['id'];

        // Update app_payload
        $payload = json_decode($targetUser['app_payload'] ?? '{}', true) ?: [];
        $payload['is_suspended'] = (bool)$isSuspended;
        $payload['active'] = (bool)$active;
        $payload['suspension_reason'] = $reason;
        $newPayload = json_encode($payload);

        // Execute update on users table (updating is_suspended, active, suspension_reason, app_payload)
        $stmt = $db->prepare('UPDATE `users` SET is_suspended = :sus, active = :active, suspension_reason = :reason, app_payload = :payload, updated_at = NOW() WHERE id = :id');
        $stmt->execute([
            ':sus' => $isSuspended,
            ':active' => $active,
            ':reason' => $reason,
            ':payload' => $newPayload,
            ':id' => $realUserId,
        ]);

        // Audit log in activity_logs
        $actAction = $isSuspended ? 'USER_SUSPENDED' : 'USER_REACTIVATED';
        $actDesc = $isSuspended
            ? "User account for {$targetUser['name']} ({$targetUser['email']}) was SUSPENDED. Reason: " . ($reason ?: 'Administrative suspension')
            : "User account for {$targetUser['name']} ({$targetUser['email']}) was REACTIVATED.";
        logAuthActivity($db, $realUserId, $actAction, $actDesc, $targetUser['email'], getClientIp());

        sendAuthResponse(200, [
            'status' => 'success',
            'message' => $isSuspended ? 'User suspended successfully.' : 'User unsuspended successfully.',
            'user' => [
                'id' => $realUserId,
                'isSuspended' => (bool)$isSuspended,
                'active' => (bool)$active,
                'suspensionReason' => $reason,
            ],
        ]);
    } catch (PDOException $e) {
        sendAuthResponse(500, [
            'status' => 'error',
            'message' => 'Database error: ' . $e->getMessage(),
        ]);
    }
}

// -----------------------------------------------------------------------------
// 5. REQUEST PASSWORD RESET (AMAZON SES)
// -----------------------------------------------------------------------------
if ($action === 'request-password-reset') {
    $email = strtolower(trim((string)($body['email'] ?? '')));
    $ip = getClientIp();

    if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        sendAuthResponse(400, [
            'status' => 'error',
            'message' => 'A valid email address is required.',
        ]);
    }

    // Rate Limiting: Maximum 5 reset requests per hour per email or IP address
    if ($db !== null) {
        try {
            $rateStmt = $db->prepare('SELECT COUNT(*) FROM password_resets WHERE (LOWER(email) = :email OR ip_address = :ip) AND created_at >= (NOW() - INTERVAL 1 HOUR)');
            $rateStmt->execute([':email' => $email, ':ip' => $ip]);
            $recentCount = (int)$rateStmt->fetchColumn();
            if ($recentCount >= 5) {
                logAuthActivity($db, 'ANONYMOUS', 'PASSWORD_RESET_FAILED', "Rate limit exceeded (5 requests/hr) for {$email}", $email, $ip);
                sendAuthResponse(429, [
                    'status' => 'error',
                    'message' => 'Too many password reset requests. Maximum 5 requests allowed per hour. Please wait before trying again.',
                ]);
            }
        } catch (Throwable $e) {}
    }

    // Look up user
    $user = null;
    if ($db !== null) {
        try {
            $stmt = $db->prepare('SELECT id, name, email, personal_email, active, is_suspended FROM users WHERE LOWER(email) = :email OR LOWER(personal_email) = :email LIMIT 1');
            $stmt->execute([':email' => $email]);
            $user = $stmt->fetch();
        } catch (Throwable $e) {}
    }

    // Never expose whether an email exists: return generic success
    if (!$user) {
        logAuthActivity($db, 'UNKNOWN', 'PASSWORD_RESET_FAILED', "Password reset requested for non-existent email: {$email}", $email, $ip);
        sendAuthResponse(200, [
            'status' => 'success',
            'message' => 'If the account exists, instructions have been sent.',
        ]);
    }

    if (!empty($user['is_suspended'])) {
        logAuthActivity($db, $user['id'], 'PASSWORD_RESET_FAILED', "Password reset requested for suspended user: {$email}", $email, $ip);
        sendAuthResponse(200, [
            'status' => 'success',
            'message' => 'If the account exists, instructions have been sent.',
        ]);
    }

    // Generate random 6-digit numeric verification code
    $rawCode = str_pad((string)random_int(100000, 999999), 6, '0', STR_PAD_LEFT);
    $codeHash = password_hash($rawCode, PASSWORD_BCRYPT);
    $resetId = 'pr-' . bin2hex(random_bytes(8));
    $expiresAt = date('Y-m-d H:i:s', time() + 900); // 15 minutes

    // Store in password_resets table
    if ($db !== null) {
        try {
            // Invalidate any existing unused reset tokens for this email
            $invStmt = $db->prepare('UPDATE password_resets SET used = 1, updated_at = NOW() WHERE LOWER(email) = :email AND used = 0');
            $invStmt->execute([':email' => strtolower($user['email'])]);

            $insStmt = $db->prepare('INSERT INTO password_resets (id, user_id, email, verification_code_hash, expires_at, used, attempts, ip_address, created_at) VALUES (:id, :uid, :email, :hash, :exp, 0, 0, :ip, NOW())');
            $insStmt->execute([
                ':id' => $resetId,
                ':uid' => $user['id'],
                ':email' => strtolower($user['email']),
                ':hash' => $codeHash,
                ':exp' => $expiresAt,
                ':ip' => $ip,
            ]);
        } catch (Throwable $dbErr) {
            error_log('Database error saving password reset token: ' . $dbErr->getMessage());
        }
    }

    // Send email via Amazon SES (af-south-1)
    $targetEmail = !empty($user['email']) ? $user['email'] : $email;
    $sesResult = AwsSesMailer::sendPasswordResetCode($targetEmail, $rawCode);

    if (!$sesResult['success']) {
        error_log("Amazon SES dispatch warning for {$targetEmail}: " . ($sesResult['error'] ?? 'Unknown SES error'));
    }

    // Log Activity: PASSWORD_RESET_REQUESTED
    logAuthActivity($db, $user['id'], 'PASSWORD_RESET_REQUESTED', "Password reset code dispatched via Amazon SES for {$targetEmail}", $targetEmail, $ip);

    sendAuthResponse(200, [
        'status' => 'success',
        'message' => 'If the account exists, instructions have been sent.',
        'expiresInMinutes' => 15,
    ]);
}

// -----------------------------------------------------------------------------
// 5.1. VERIFY RESET CODE
// -----------------------------------------------------------------------------
if ($action === 'verify-reset-code') {
    $email = strtolower(trim((string)($body['email'] ?? '')));
    $code = trim((string)($body['code'] ?? ''));
    $ip = getClientIp();

    if (empty($email) || empty($code)) {
        sendAuthResponse(400, [
            'status' => 'error',
            'message' => 'Email address and 6-digit verification code are required.',
        ]);
    }

    if (!preg_match('/^\d{6}$/', $code)) {
        sendAuthResponse(400, [
            'status' => 'error',
            'message' => 'Verification code must be exactly 6 digits.',
        ]);
    }

    if ($db === null) {
        sendAuthResponse(500, [
            'status' => 'error',
            'message' => 'Database connection unavailable.',
        ]);
    }

    // Fetch most recent active reset record for this email
    $record = null;
    try {
        $stmt = $db->prepare('SELECT * FROM password_resets WHERE LOWER(email) = :email AND used = 0 ORDER BY created_at DESC LIMIT 1');
        $stmt->execute([':email' => $email]);
        $record = $stmt->fetch();
    } catch (Throwable $e) {}

    if (!$record) {
        logAuthActivity($db, 'UNKNOWN', 'PASSWORD_RESET_FAILED', "Verification failed: No active code for {$email}", $email, $ip);
        sendAuthResponse(400, [
            'status' => 'error',
            'message' => 'No active verification code found for this email. Please request a new code.',
        ]);
    }

    // Check expiration (15 minutes)
    if (strtotime($record['expires_at']) < time()) {
        try {
            $up = $db->prepare('UPDATE password_resets SET used = 1, updated_at = NOW() WHERE id = :id');
            $up->execute([':id' => $record['id']]);
        } catch (Throwable $e) {}

        logAuthActivity($db, $record['user_id'], 'PASSWORD_RESET_FAILED', "Verification code expired for {$email}", $email, $ip);
        sendAuthResponse(400, [
            'status' => 'error',
            'message' => 'Verification code has expired. Please request a new code.',
        ]);
    }

    // Check maximum attempts (Maximum 5 code attempts)
    if ((int)$record['attempts'] >= 5) {
        try {
            $up = $db->prepare('UPDATE password_resets SET used = 1, updated_at = NOW() WHERE id = :id');
            $up->execute([':id' => $record['id']]);
        } catch (Throwable $e) {}

        logAuthActivity($db, $record['user_id'], 'PASSWORD_RESET_FAILED', "Max code verification attempts (5) reached for {$email}", $email, $ip);
        sendAuthResponse(429, [
            'status' => 'error',
            'message' => 'Too many invalid attempts (5). This verification code is no longer valid. Please request a new code.',
        ]);
    }

    // Increment attempts count
    try {
        $inc = $db->prepare('UPDATE password_resets SET attempts = attempts + 1, updated_at = NOW() WHERE id = :id');
        $inc->execute([':id' => $record['id']]);
    } catch (Throwable $e) {}

    // Verify bcrypt hash
    if (!password_verify($code, $record['verification_code_hash'])) {
        $remaining = 4 - (int)$record['attempts'];
        $remainingMsg = $remaining > 0 ? " ({$remaining} attempts remaining)" : '';
        logAuthActivity($db, $record['user_id'], 'PASSWORD_RESET_FAILED', "Invalid code entered for {$email}{$remainingMsg}", $email, $ip);
        sendAuthResponse(400, [
            'status' => 'error',
            'message' => "Invalid verification code. Please check your email and try again{$remainingMsg}.",
        ]);
    }

    // Valid code!
    logAuthActivity($db, $record['user_id'], 'PASSWORD_RESET_VERIFIED', "Verification code successfully validated for {$email}", $email, $ip);

    sendAuthResponse(200, [
        'status' => 'success',
        'message' => 'Verification successful.',
    ]);
}

// -----------------------------------------------------------------------------
// 6. RESET PASSWORD
// -----------------------------------------------------------------------------
if ($action === 'reset-password') {
    $email = strtolower(trim((string)($body['email'] ?? '')));
    $code = trim((string)($body['code'] ?? $body['token'] ?? ''));
    $password = (string)($body['password'] ?? '');
    $ip = getClientIp();

    if (empty($email) || empty($code) || empty($password)) {
        sendAuthResponse(400, [
            'status' => 'error',
            'message' => 'Email address, verification code, and new password are required.',
        ]);
    }

    // Security validation: Password complexity
    // Must contain 8+ characters, uppercase, lowercase, number, special character
    $errors = [];
    if (strlen($password) < 8) {
        $errors[] = 'Password must be at least 8 characters in length.';
    }
    if (!preg_match('/[A-Z]/', $password)) {
        $errors[] = 'Password must contain at least one uppercase letter (A-Z).';
    }
    if (!preg_match('/[a-z]/', $password)) {
        $errors[] = 'Password must contain at least one lowercase letter (a-z).';
    }
    if (!preg_match('/[0-9]/', $password)) {
        $errors[] = 'Password must contain at least one numeric digit (0-9).';
    }
    if (!preg_match('/[^A-Za-z0-9]/', $password)) {
        $errors[] = 'Password must contain at least one special character (!@#$%^&* etc.).';
    }

    if (!empty($errors)) {
        sendAuthResponse(400, [
            'status' => 'error',
            'message' => implode(' ', $errors),
        ]);
    }

    if ($db === null) {
        sendAuthResponse(500, [
            'status' => 'error',
            'message' => 'Database connection unavailable.',
        ]);
    }

    // Look up active reset record
    $record = null;
    try {
        $stmt = $db->prepare('SELECT * FROM password_resets WHERE LOWER(email) = :email AND used = 0 ORDER BY created_at DESC LIMIT 1');
        $stmt->execute([':email' => $email]);
        $record = $stmt->fetch();
    } catch (Throwable $e) {}

    if (!$record) {
        logAuthActivity($db, 'UNKNOWN', 'PASSWORD_RESET_FAILED', "Reset failed: No active reset request for {$email}", $email, $ip);
        sendAuthResponse(400, [
            'status' => 'error',
            'message' => 'No active password reset request found or the verification code has expired.',
        ]);
    }

    // Check expiration (15 minutes)
    if (strtotime($record['expires_at']) < time()) {
        try {
            $up = $db->prepare('UPDATE password_resets SET used = 1, updated_at = NOW() WHERE id = :id');
            $up->execute([':id' => $record['id']]);
        } catch (Throwable $e) {}

        logAuthActivity($db, $record['user_id'], 'PASSWORD_RESET_FAILED', "Reset failed: Code expired for {$email}", $email, $ip);
        sendAuthResponse(400, [
            'status' => 'error',
            'message' => 'Verification code has expired. Please request a new reset code.',
        ]);
    }

    // Check attempts limit
    if ((int)$record['attempts'] >= 5) {
        try {
            $up = $db->prepare('UPDATE password_resets SET used = 1, updated_at = NOW() WHERE id = :id');
            $up->execute([':id' => $record['id']]);
        } catch (Throwable $e) {}

        logAuthActivity($db, $record['user_id'], 'PASSWORD_RESET_FAILED', "Reset failed: Max attempts exceeded for {$email}", $email, $ip);
        sendAuthResponse(429, [
            'status' => 'error',
            'message' => 'Too many invalid attempts. Please request a new verification code.',
        ]);
    }

    // Verify code
    if (!password_verify($code, $record['verification_code_hash'])) {
        try {
            $inc = $db->prepare('UPDATE password_resets SET attempts = attempts + 1, updated_at = NOW() WHERE id = :id');
            $inc->execute([':id' => $record['id']]);
        } catch (Throwable $e) {}

        logAuthActivity($db, $record['user_id'], 'PASSWORD_RESET_FAILED', "Reset failed: Invalid code for {$email}", $email, $ip);
        sendAuthResponse(400, [
            'status' => 'error',
            'message' => 'Invalid verification code. Please verify the 6-digit code sent to your email.',
        ]);
    }

    // Update user password with secure BCrypt hash
    $newHash = password_hash($password, PASSWORD_BCRYPT);
    try {
        $upStmt = $db->prepare('UPDATE users SET password = :p, is_temp_password = 0, temp_password_expires_at = NULL, must_change_password = 0, updated_at = NOW() WHERE id = :id');
        $upStmt->execute([':p' => $newHash, ':id' => $record['user_id']]);

        // Consume this verification code (One-time use only)
        $useStmt = $db->prepare('UPDATE password_resets SET used = 1, updated_at = NOW() WHERE id = :id');
        $useStmt->execute([':id' => $record['id']]);

        // Invalidate any other active codes for this email
        $invStmt = $db->prepare('UPDATE password_resets SET used = 1, updated_at = NOW() WHERE LOWER(email) = :email AND used = 0');
        $invStmt->execute([':email' => $email]);
    } catch (PDOException $dbErr) {
        sendAuthResponse(500, [
            'status' => 'error',
            'message' => 'Database error while updating password: ' . $dbErr->getMessage(),
        ]);
    }

    // Log Activity: PASSWORD_RESET_COMPLETED
    logAuthActivity($db, $record['user_id'], 'PASSWORD_RESET_COMPLETED', "Password successfully reset for {$email}", $email, $ip);

    sendAuthResponse(200, [
        'status' => 'success',
        'message' => 'Password successfully changed.',
    ]);
}

// -----------------------------------------------------------------------------
// 7. CHANGE PASSWORD
// -----------------------------------------------------------------------------
if ($action === 'change-password' || $action === 'update-password') {
    $userId = (string)($body['userId'] ?? '');
    $oldPassword = (string)($body['oldPassword'] ?? '');
    $newPassword = (string)($body['newPassword'] ?? '');

    if (empty($userId) || empty($oldPassword) || empty($newPassword)) {
        sendAuthResponse(400, [
            'status' => 'error',
            'message' => 'Current password and new password are required.',
        ]);
    }

    if (strlen($newPassword) < 6) {
        sendAuthResponse(400, [
            'status' => 'error',
            'message' => 'New password must be at least 6 characters.',
        ]);
    }

    $stmt = $db->prepare('SELECT * FROM users WHERE id = :id LIMIT 1');
    $stmt->execute([':id' => $userId]);
    $user = $stmt->fetch();

    if (!$user) {
        sendAuthResponse(404, [
            'status' => 'error',
            'message' => 'User account not found.',
        ]);
    }

    if (!password_verify($oldPassword, $user['password']) && $user['password'] !== $oldPassword) {
        sendAuthResponse(401, [
            'status' => 'error',
            'message' => 'Current password entered is incorrect.',
        ]);
    }

    $newHash = password_hash($newPassword, PASSWORD_BCRYPT);
    $upStmt = $db->prepare(
        'UPDATE users SET password = :p, is_temp_password = 0, temp_password_expires_at = NULL, must_change_password = 0 WHERE id = :id'
    );
    $upStmt->execute([':p' => $newHash, ':id' => $userId]);

    sendAuthResponse(200, [
        'status' => 'success',
        'message' => 'Password updated successfully.',
    ]);
}

// Unknown action
sendAuthResponse(400, [
    'status' => 'error',
    'message' => "Unrecognized action '{$action}'.",
]);
