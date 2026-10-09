<?php
/**
 * ============================================================================
 * Database Connection Configuration (PDO)
 * ============================================================================
 * Provides a secure, reusable PDO database connection instance.
 * Credentials are read from environment variables with safe default fallbacks.
 */

require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/env.php';

class Database
{
    private string $host;
    private int $port;
    private string $dbName;
    private string $username;
    private string $password;
    private string $charset;
    private ?PDO $conn = null;

    public function __construct()
    {
        // Read from environment variables or use requested defaults (uicms_workflow)
        $this->host = getenv('DB_HOST') ?: ($_ENV['DB_HOST'] ?? 'localhost');
        $this->port = (int)(getenv('DB_PORT') ?: ($_ENV['DB_PORT'] ?? 3306));
        $this->dbName = getenv('DB_NAME') ?: ($_ENV['DB_NAME'] ?? 'uicms_workflow');
        $this->username = getenv('DB_USER') ?: ($_ENV['DB_USER'] ?? 'root');
        $this->password = getenv('DB_PASS') !== false ? getenv('DB_PASS') : ($_ENV['DB_PASS'] ?? '');
        $this->charset = 'utf8mb4';
    }

    /**
     * Establishes and returns a PDO connection with prepared statement security.
     *
     * @return PDO
     * @throws PDOException
     */
    public function getConnection(): PDO
    {
        if ($this->conn !== null) {
            return $this->conn;
        }

        $dsn = "mysql:host={$this->host};port={$this->port};dbname={$this->dbName};charset={$this->charset}";

        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION, // Throw exceptions on errors
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,        // Return associative arrays
            PDO::ATTR_EMULATE_PREPARES   => false,                   // True prepared statements on MySQL server
            PDO::ATTR_PERSISTENT         => false,                   // Disable persistent connections
        ];

        try {
            $this->conn = new PDO($dsn, $this->username, $this->password, $options);
            return $this->conn;
        } catch (PDOException $e) {
            // Windows XAMPP IPv6 ::1 fallback: if localhost failed, retry 127.0.0.1
            if ($this->host === 'localhost') {
                try {
                    $ipv4Dsn = "mysql:host=127.0.0.1;port={$this->port};dbname={$this->dbName};charset={$this->charset}";
                    $this->conn = new PDO($ipv4Dsn, $this->username, $this->password, $options);
                    return $this->conn;
                } catch (Throwable $ipv4Err) {}
            }

            // Attempt to connect to MySQL server root and bootstrap the database if missing
            try {
                $rootDsn = "mysql:host={$this->host};port={$this->port};charset={$this->charset}";
                $rootConn = new PDO($rootDsn, $this->username, $this->password, $options);
                $rootConn->exec("CREATE DATABASE IF NOT EXISTS `{$this->dbName}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;");
                $this->conn = new PDO($dsn, $this->username, $this->password, $options);
                return $this->conn;
            } catch (Throwable $bootstrapErr) {
                // Also try bootstrap on 127.0.0.1
                try {
                    $rootDsn4 = "mysql:host=127.0.0.1;port={$this->port};charset={$this->charset}";
                    $rootConn4 = new PDO($rootDsn4, $this->username, $this->password, $options);
                    $rootConn4->exec("CREATE DATABASE IF NOT EXISTS `{$this->dbName}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;");
                    $this->conn = new PDO("mysql:host=127.0.0.1;port={$this->port};dbname={$this->dbName};charset={$this->charset}", $this->username, $this->password, $options);
                    return $this->conn;
                } catch (Throwable $t4) {}

                error_log('Database Connection Error: ' . $e->getMessage());
                throw new Exception('Database service unavailable. Please check your MySQL configuration: ' . $e->getMessage());
            }
        }
    }
}
