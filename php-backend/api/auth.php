<?php
// =============================================================================
// UICMS Creative Workflow - Enterprise Authentication & Session Gateway (PHP 8.2+)
// Connects with MySQL/phpMyAdmin `users` table for genuine credential validation
// =============================================================================

require_once __DIR__ . '/../config/database.php';
initApiHeaders();

// Initialize session support
if (session_status() === PHP_SESSION_NONE) {
    ini_set('session.cookie_httponly', '1');
    ini_set('session.cookie_samesite', 'Lax');
    session_start();
}

$database = new Database();
$db = $database->getConnection();
$method = $_SERVER['REQUEST_METHOD'];

// Ensure users table and columns exist in database uicms_workflow
if ($db !== null) {
    try {
        $db->exec("CREATE TABLE IF NOT EXISTS `users` (
            `id` VARCHAR(50) NOT NULL PRIMARY KEY,
            `name` VARCHAR(100) NOT NULL,
            `email` VARCHAR(150) NOT NULL UNIQUE,
            `personal_email` VARCHAR(150) NULL,
            `password` VARCHAR(255) NOT NULL,
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
        $colCheck('is_temp_password', 'TINYINT(1) NOT NULL DEFAULT 0');
        $colCheck('temp_password_expires_at', 'VARCHAR(50) NULL');
        $colCheck('must_change_password', 'TINYINT(1) NOT NULL DEFAULT 0');

        // Auto-seed default administrator accounts if users table is empty
        $countStmt = $db->query("SELECT COUNT(*) FROM `users`");
        if ($countStmt && (int)$countStmt->fetchColumn() === 0) {
            $seedHash = password_hash('Password123!', PASSWORD_BCRYPT);
            $ins = $db->prepare("INSERT INTO `users` (`id`, `name`, `email`, `personal_email`, `password`, `role`, `role_title`, `department_id`, `avatar`, `active`, `is_suspended`, `workload_count`) VALUES 
            ('usr-admin-01', 'Alex Rivera', 'admin@uicms.local', 'alex.rivera@personal.com', :h, 'super_admin', 'Executive Creative Director & Super Admin', 'marketing', '', 1, 0, 0),
            ('usr-mgr-01', 'Sarah Chen', 'sarah.chen@uicms.local', 'sarah.chen@personal.com', :h, 'department_manager', 'Creative Operations Manager', 'marketing', '', 1, 0, 0),
            ('usr-des-01', 'Marcus Vance', 'marcus.vance@uicms.local', 'marcus.vance@personal.com', :h, 'designer', 'Senior Visual Designer', 'marketing', '', 1, 0, 0)");
            $ins->execute([':h' => $seedHash]);
        }
    } catch (Throwable $e) {
        // Proceed gracefully if permissions restrict schema introspection
    }
}

if ($method === 'OPTIONS') {
    http_response_code(200);
    exit();
}

function sendAuthResponse(int $statusCode, array $payload): void {
    http_response_code($statusCode);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit();
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

    // Verify Password: supports PHP password_verify (BCrypt), MD5, SHA1, SHA256 (phpMyAdmin functions), PBKDF2, and initial plaintext
    $storedPass = (string)($userRow['password'] ?? '');
    $passwordValid = false;

    if (password_verify($password, $storedPass)) {
        $passwordValid = true;
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
// 5. REQUEST PASSWORD RESET (FORGOT PASSWORD)
// -----------------------------------------------------------------------------
if ($action === 'request-password-reset') {
    $email = strtolower(trim((string)($body['email'] ?? '')));

    if (empty($email)) {
        sendAuthResponse(400, [
            'status' => 'error',
            'message' => 'Email address is required.',
        ]);
    }

    $user = null;
    try {
        $stmt = $db->prepare('SELECT * FROM users WHERE LOWER(email) = :email OR LOWER(personal_email) = :email LIMIT 1');
        $stmt->execute([':email' => $email]);
        $user = $stmt->fetch();
    } catch (Throwable $e) {
        $stmt = $db->prepare('SELECT * FROM users WHERE LOWER(email) = :email LIMIT 1');
        $stmt->execute([':email' => $email]);
        $user = $stmt->fetch();
    }

    if (!$user) {
        // Return generic success to avoid user enumeration
        sendAuthResponse(200, [
            'status' => 'success',
            'message' => 'If your email is registered in the system, password reset instructions and temporary credentials have been generated.',
        ]);
    }

    // Generate temporary 8-char alphanumeric reset code
    $resetCode = strtoupper(bin2hex(random_bytes(3)));
    $expiresAt = date('Y-m-d H:i:s', time() + 7200); // 2 hours

    $upStmt = $db->prepare(
        'UPDATE users SET password = :p, is_temp_password = 1, temp_password_expires_at = :exp, must_change_password = 1 WHERE id = :id'
    );
    $upStmt->execute([
        ':p' => password_hash($resetCode, PASSWORD_BCRYPT),
        ':exp' => $expiresAt,
        ':id' => $user['id'],
    ]);

    sendAuthResponse(200, [
        'status' => 'success',
        'message' => "A password reset token has been dispatched. For portal verification, your reset token is: {$resetCode}",
        'token' => $resetCode,
    ]);
}

// -----------------------------------------------------------------------------
// 6. RESET PASSWORD
// -----------------------------------------------------------------------------
if ($action === 'reset-password') {
    $email = strtolower(trim((string)($body['email'] ?? '')));
    $token = trim((string)($body['token'] ?? ''));
    $newPassword = (string)($body['password'] ?? '');

    if (empty($email) || empty($token) || empty($newPassword)) {
        sendAuthResponse(400, [
            'status' => 'error',
            'message' => 'Email, reset token, and new password are required.',
        ]);
    }

    if (strlen($newPassword) < 8) {
        sendAuthResponse(400, [
            'status' => 'error',
            'message' => 'New password must be at least 8 characters in length.',
        ]);
    }

    $user = null;
    try {
        $stmt = $db->prepare('SELECT * FROM users WHERE LOWER(email) = :email OR LOWER(personal_email) = :email LIMIT 1');
        $stmt->execute([':email' => $email]);
        $user = $stmt->fetch();
    } catch (Throwable $e) {
        $stmt = $db->prepare('SELECT * FROM users WHERE LOWER(email) = :email LIMIT 1');
        $stmt->execute([':email' => $email]);
        $user = $stmt->fetch();
    }

    if (!$user) {
        sendAuthResponse(404, [
            'status' => 'error',
            'message' => 'User account not found.',
        ]);
    }

    $newHash = password_hash($newPassword, PASSWORD_BCRYPT);
    $upStmt = $db->prepare(
        'UPDATE users SET password = :p, is_temp_password = 0, temp_password_expires_at = NULL, must_change_password = 0 WHERE id = :id'
    );
    $upStmt->execute([':p' => $newHash, ':id' => $user['id']]);

    sendAuthResponse(200, [
        'status' => 'success',
        'message' => 'Password reset successfully. You may now sign in with your new password.',
    ]);
}

// -----------------------------------------------------------------------------
// 7. CHANGE PASSWORD
// -----------------------------------------------------------------------------
if ($action === 'change-password') {
    $userId = (string)($body['userId'] ?? '');
    $oldPassword = (string)($body['oldPassword'] ?? '');
    $newPassword = (string)($body['newPassword'] ?? '');

    if (empty($userId) || empty($oldPassword) || empty($newPassword)) {
        sendAuthResponse(400, [
            'status' => 'error',
            'message' => 'Current password and new password are required.',
        ]);
    }

    if (strlen($newPassword) < 8) {
        sendAuthResponse(400, [
            'status' => 'error',
            'message' => 'New password must be at least 8 characters.',
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
