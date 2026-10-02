<?php
// =============================================================================
// UICMS Creative Workflow & Management System
// Database Configuration (PDO MySQL / MariaDB / AWS RDS)
// =============================================================================

class Database {
    private string $host;
    private string $db_name;
    private string $username;
    private string $password;
    private int $port;
    private ?PDO $conn = null;

    public function __construct() {
        // Automatically check and load .env file if available
        $envPaths = [
            __DIR__ . '/../../.env',
            __DIR__ . '/../.env',
            __DIR__ . '/.env'
        ];
        foreach ($envPaths as $envFile) {
            if (file_exists($envFile) && is_readable($envFile)) {
                $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
                foreach ($lines as $line) {
                    $line = trim($line);
                    if ($line === '' || str_starts_with($line, '#')) continue;
                    if (str_contains($line, '=')) {
                        [$k, $v] = explode('=', $line, 2);
                        $k = trim($k);
                        $v = trim(trim($v), '"\'');
                        if (!getenv($k)) {
                            putenv("{$k}={$v}");
                            $_ENV[$k] = $v;
                        }
                    }
                }
                break;
            }
        }

        // Load from environment variables (AWS ECS / Elastic Beanstalk / Docker / XAMPP / .env)
        $this->host = getenv('DB_HOST') ?: '127.0.0.1';
        $this->db_name = getenv('DB_NAME') ?: 'uicms_workflow';
        $this->username = getenv('DB_USER') ?: 'root';
        $this->password = getenv('DB_PASS') !== false ? getenv('DB_PASS') : '';
        $this->port = (int)(getenv('DB_PORT') ?: 3306);
    }

    public function getConnection(): ?PDO {
        $this->conn = null;
        try {
            $dsn = "mysql:host={$this->host};port={$this->port};dbname={$this->db_name};charset=utf8mb4";
            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
            ];
            $this->conn = new PDO($dsn, $this->username, $this->password, $options);
        } catch (PDOException $e) {
            http_response_code(500);
            $msg = "Database connection error to '{$this->db_name}' on {$this->host}:{$this->port} (user: {$this->username}): " . $e->getMessage();
            echo json_encode([
                "status" => "error",
                "message" => $msg,
                "database_name" => $this->db_name,
                "host" => $this->host,
                "port" => $this->port,
                "user" => $this->username
            ], JSON_UNESCAPED_SLASHES);
            exit;
        }

        return $this->conn;
    }
}

// Global Security & CORS Headers
function initApiHeaders(): void {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
    header("Access-Control-Allow-Origin: $origin");
    header("Access-Control-Allow-Credentials: true");
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-User-Role, X-User-Id");
    header("Content-Type: application/json; charset=UTF-8");

    // Enterprise Security Headers
    header("X-Content-Type-Options: nosniff");
    header("X-Frame-Options: SAMEORIGIN");
    header("X-XSS-Protection: 1; mode=block");
    header("Referrer-Policy: strict-origin-when-cross-origin");
    header("Permissions-Policy: geolocation=(), microphone=(), camera=()");

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit();
    }
}

function sendResponse(int $statusCode, array $payload): void {
    http_response_code($statusCode);
    echo json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit();
}
