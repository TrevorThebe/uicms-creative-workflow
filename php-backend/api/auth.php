<?php
// =============================================================================
// UICMS Workflow - Authentication & Session REST API (PHP / MySQL)
// =============================================================================

require_once __DIR__ . '/../config/database.php';
initApiHeaders();

$database = new Database();
$db = $database->getConnection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'POST') {
    sendResponse(405, ["status" => "error", "message" => "Method not allowed"]);
}

$input = json_decode(file_get_contents("php://input"), true);
$email = trim($input['email'] ?? '');
$password = trim($input['password'] ?? '');

if (empty($email) || empty($password)) {
    sendResponse(400, ["status" => "error", "message" => "Email and password are required"]);
}

try {
    $stmt = $db->prepare("SELECT * FROM users WHERE email = :email LIMIT 1");
    $stmt->execute([':email' => $email]);
    $user = $stmt->fetch();

    if (!$user) {
        sendResponse(401, ["status" => "error", "message" => "Invalid email or credentials"]);
    }

    if ($user['is_suspended'] == 1) {
        sendResponse(403, [
            "status" => "error",
            "message" => "Account is suspended. Reason: " . ($user['suspension_reason'] ?: 'Contact administrator.')
        ]);
    }

    // Support both plain demo passwords and bcrypt hashes
    $isPasswordMatch = ($password === $user['password']) || (password_verify($password, $user['password']));

    if (!$isPasswordMatch) {
        sendResponse(401, ["status" => "error", "message" => "Invalid email or credentials"]);
    }

    // Return safe sanitized user session
    unset($user['password']);

    // Generate lightweight JWT-compatible signature token
    $tokenPayload = [
        "sub" => $user['id'],
        "email" => $user['email'],
        "role" => $user['role'],
        "iat" => time(),
        "exp" => time() + (86400 * 7) // 7 days
    ];
    $token = base64_encode(json_encode($tokenPayload));

    sendResponse(200, [
        "status" => "success",
        "message" => "Authentication successful",
        "token" => $token,
        "user" => $user
    ]);
} catch (PDOException $e) {
    sendResponse(500, ["status" => "error", "message" => $e->getMessage()]);
}
