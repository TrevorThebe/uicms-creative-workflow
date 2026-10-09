<?php
/**
 * ============================================================================
 * JSON Response Helper & CORS Configuration
 * ============================================================================
 * Standardizes API responses, disables HTTP caching, and supports flexible calls.
 */

declare(strict_types=1);

if (!function_exists('initApiHeaders')) {
    function initApiHeaders(): void
    {
        if (!headers_sent()) {
            $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
            if (empty($origin) && !empty($_SERVER['HTTP_REFERER'])) {
                $parts = parse_url($_SERVER['HTTP_REFERER']);
                if (!empty($parts['scheme']) && !empty($parts['host'])) {
                    $origin = $parts['scheme'] . '://' . $parts['host'] . (!empty($parts['port']) ? ':' . $parts['port'] : '');
                }
            }

            if (!empty($origin)) {
                header("Access-Control-Allow-Origin: {$origin}");
                header('Access-Control-Allow-Credentials: true');
            } else {
                header('Access-Control-Allow-Origin: *');
            }

            header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, HEAD');
            header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control, Pragma, X-User-Id, X-User-Role, X-Client-Id, X-Department-Id');
            header('Access-Control-Max-Age: 86400');
            header('Vary: Origin');
            header('Content-Type: application/json; charset=UTF-8');
            header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
            header('Pragma: no-cache');
            header('Expires: 0');
        }

        if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
            http_response_code(204);
            exit;
        }
    }
}

// Global Exception & Shutdown Handlers to ensure CORS headers are ALWAYS sent even on PHP crash
set_exception_handler(function(Throwable $e) {
    initApiHeaders();
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage(),
        'source' => 'php_exception',
        'file' => basename($e->getFile()),
        'line' => $e->getLine()
    ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
});

register_shutdown_function(function() {
    $error = error_get_last();
    if ($error !== null && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR], true)) {
        initApiHeaders();
        http_response_code(500);
        echo json_encode([
            'status' => 'error',
            'message' => 'PHP Fatal Error: ' . $error['message'],
            'source' => 'php_fatal',
            'file' => basename($error['file']),
            'line' => $error['line']
        ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    }
});

// Handle preflight CORS requests immediately
if (!function_exists('handleCors')) {
    function handleCors(): void
    {
        initApiHeaders();
    }
}

// Automatically init headers
initApiHeaders();

/**
 * Sends a structured JSON response and terminates script execution.
 * Supports both signatures:
 *   1) sendResponse(int $statusCode, array $payload)
 *   2) sendResponse(bool $success, string $message, mixed $data = null, int $statusCode = 200)
 */
if (!function_exists('sendResponse')) {
    function sendResponse(mixed $arg1, mixed $arg2 = '', mixed $data = null, int $statusCode = 200): void
    {
        initApiHeaders();

        if (is_int($arg1) && is_array($arg2)) {
            // Signature: sendResponse(int $statusCode, array $payload)
            http_response_code($arg1);
            echo json_encode($arg2, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            exit;
        }

        // Signature: sendResponse(bool $success, string $message, mixed $data, int $statusCode)
        $success = (bool)$arg1;
        $message = is_string($arg2) ? $arg2 : (is_array($arg2) ? json_encode($arg2) : (string)$arg2);
        http_response_code($statusCode);

        $response = [
            'status'  => $success ? 'success' : 'error',
            'success' => $success,
            'message' => $message,
        ];

        if ($data !== null) {
            $response['data'] = $data;
        }

        echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }
}
