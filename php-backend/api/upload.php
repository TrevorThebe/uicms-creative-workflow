<?php
// =============================================================================
// UICMS Creative Workflow - Secure File Upload REST API
// Saves uploaded pictures & files to real server folders (uploads/avatars, uploads/files)
// =============================================================================

require_once __DIR__ . '/../config/database.php';
initApiHeaders();

// Determine folder mappings
$uploadBase = __DIR__ . '/../uploads';
$dirs = [
    'avatar' => $uploadBase . '/avatars',
    'file'   => $uploadBase . '/files',
];

// Ensure directories exist
foreach ($dirs as $dir) {
    if (!file_exists($dir)) {
        mkdir($dir, 0755, true);
    }
}

$method = $_SERVER['REQUEST_METHOD'];
if ($method === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($method !== 'POST') {
    sendResponse(405, ['status' => 'error', 'message' => 'Method not allowed']);
}

// 1. Support Base64 encoded payload (e.g., canvas compressed avatar upload)
$input = json_decode(file_get_contents('php://input'), true);
if (is_array($input) && !empty($input['base64']) && !empty($input['filename'])) {
    $type = trim($input['type'] ?? 'avatar');
    $targetDir = $dirs[$type] ?? $dirs['avatar'];
    
    $base64Data = $input['base64'];
    $filename = preg_replace('/[^a-zA-Z0-9_.-]/', '_', $input['filename']);
    
    // Split mime type and base64 payload
    if (preg_match('/^data:image\/(\w+);base64,/', $base64Data, $typeMatch)) {
        $ext = strtolower($typeMatch[1]);
        $base64Data = substr($base64Data, strpos($base64Data, ',') + 1);
    } else {
        $ext = pathinfo($filename, PATHINFO_EXTENSION) ?: 'jpg';
    }
    
    $decoded = base64_decode($base64Data);
    if ($decoded === false) {
        sendResponse(400, ['status' => 'error', 'message' => 'Invalid base64 payload']);
    }
    
    // Enforce filename uniqueness
    $uniqueName = uniqid() . '_' . pathinfo($filename, PATHINFO_FILENAME) . '.' . $ext;
    $targetPath = $targetDir . '/' . $uniqueName;
    
    if (file_put_contents($targetPath, $decoded) !== false) {
        $relativeUrl = '/php-backend/uploads/' . ($type === 'avatar' ? 'avatars' : 'files') . '/' . $uniqueName;
        sendResponse(200, [
            'status' => 'success',
            'message' => 'Base64 asset uploaded successfully',
            'url' => $relativeUrl,
            'filename' => $uniqueName
        ]);
    } else {
        sendResponse(500, ['status' => 'error', 'message' => 'Failed to save base64 asset']);
    }
}

// 2. Support Multipart Form File Upload
if (!isset($_FILES['file'])) {
    sendResponse(400, ['status' => 'error', 'message' => 'No file payload found in request']);
}

$file = $_FILES['file'];
$type = trim($_POST['type'] ?? 'file');
$targetDir = $dirs[$type] ?? $dirs['file'];

if ($file['error'] !== UPLOAD_ERR_OK) {
    sendResponse(400, ['status' => 'error', 'message' => 'PHP file upload error code: ' . $file['error']]);
}

// Validate file size (15MB maximum)
if ($file['size'] > 15 * 1024 * 1024) {
    sendResponse(400, ['status' => 'error', 'message' => 'File size exceeds maximum 15MB limit']);
}

$rawFilename = basename($file['name']);
$ext = strtolower(pathinfo($rawFilename, PATHINFO_EXTENSION));
$allowedExts = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'pdf', 'docx', 'xlsx', 'txt', 'zip', 'mp4'];

if (!in_array($ext, $allowedExts, true)) {
    sendResponse(400, ['status' => 'error', 'message' => 'Forbidden file extension type']);
}

// Sanitize filename to prevent directory traversal
$safeName = preg_replace('/[^a-zA-Z0-9_.-]/', '_', pathinfo($rawFilename, PATHINFO_FILENAME));
$uniqueName = uniqid() . '_' . $safeName . '.' . $ext;
$targetPath = $targetDir . '/' . $uniqueName;

if (move_uploaded_file($file['tmp_name'], $targetPath)) {
    $relativeUrl = '/php-backend/uploads/' . ($type === 'avatar' ? 'avatars' : 'files') . '/' . $uniqueName;
    sendResponse(200, [
        'status' => 'success',
        'message' => 'File uploaded successfully',
        'url' => $relativeUrl,
        'filename' => $uniqueName
    ]);
} else {
    sendResponse(500, ['status' => 'error', 'message' => 'Failed to persist uploaded file']);
}
