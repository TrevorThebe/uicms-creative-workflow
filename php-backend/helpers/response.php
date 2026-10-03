<?php
/**
 * ============================================================================
 * JSON Response Helper & CORS Configuration
 * ============================================================================
 * Standardizes API responses and enforces strict JSON content type & CORS headers.
 */

// Handle preflight CORS requests immediately
function handleCors(): void
{
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept');
    header('Access-Control-Max-Age: 86400'); // Cache preflight for 24 hours

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}

// Call CORS headers setup on include
handleCors();

/**
 * Sends a structured JSON response and terminates script execution.
 *
 * @param bool $success Operation status
 * @param string $message Human-readable status message
 * @param mixed $data Payload to return (optional)
 * @param int $statusCode HTTP response status code (default: 200)
 */
function sendResponse(bool $success, string $message, mixed $data = null, int $statusCode = 200): void
{
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=UTF-8');

    $response = [
        'success' => $success,
        'message' => $message,
    ];

    if ($data !== null) {
        $response['data'] = $data;
    }

    echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}
