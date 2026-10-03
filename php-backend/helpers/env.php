<?php
/**
 * ============================================================================
 * Environment Variable Loader (Vanilla PHP 8+)
 * ============================================================================
 * Parses .env files into putenv(), $_ENV, and $_SERVER without external dependencies.
 */

if (!function_exists('loadEnv')) {
    function loadEnv(string $filePath): void
    {
        if (!file_exists($filePath) || !is_readable($filePath)) {
            return;
        }

        $lines = file($filePath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        if ($lines === false) {
            return;
        }

        foreach ($lines as $line) {
            $line = trim($line);

            // Skip comments and empty lines
            if (empty($line) || str_starts_with($line, '#')) {
                continue;
            }

            // Parse KEY=VALUE
            if (str_contains($line, '=')) {
                [$key, $value] = explode('=', $line, 2);
                $key = trim($key);
                $value = trim($value);

                // Strip outer quotes if present
                if (
                    (str_starts_with($value, '"') && str_ends_with($value, '"')) ||
                    (str_starts_with($value, "'") && str_ends_with($value, "'"))
                ) {
                    $value = substr($value, 1, -1);
                }

                // Set in environment if not already defined
                if (!array_key_exists($key, $_SERVER) && !array_key_exists($key, $_ENV)) {
                    putenv(sprintf('%s=%s', $key, $value));
                    $_ENV[$key] = $value;
                    $_SERVER[$key] = $value;
                }
            }
        }
    }
}

// Auto-load .env from root or config directory
$possibleEnvPaths = [
    __DIR__ . '/../.env',
    __DIR__ . '/../../.env',
    dirname(__DIR__, 2) . '/.env'
];

foreach ($possibleEnvPaths as $path) {
    if (file_exists($path)) {
        loadEnv($path);
        break;
    }
}
