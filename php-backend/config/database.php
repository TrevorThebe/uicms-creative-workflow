<?php
/**
 * ============================================================================
 * Database Connection Configuration (PDO)
 * ============================================================================
 * Provides a secure, reusable PDO database connection instance.
 * Credentials are read from environment variables with safe default fallbacks.
 */

require_once __DIR__ . '/../helpers/env.php';

class Database
{
    private string $host;
    private string $dbName;
    private string $username;
    private string $password;
    private string $charset;
    private ?PDO $conn = null;

    public function __construct()
    {
        // Read from environment variables or use requested defaults
        $this->host = getenv('DB_HOST') ?: ($_ENV['DB_HOST'] ?? 'localhost');
        $this->dbName = getenv('DB_NAME') ?: ($_ENV['DB_NAME'] ?? 'my_database');
        $this->username = getenv('DB_USER') ?: ($_ENV['DB_USER'] ?? 'root');
        $this->password = getenv('DB_PASS') !== false ? getenv('DB_PASS') : ($_ENV['DB_PASS'] ?? 'my_password');
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

        $dsn = "mysql:host={$this->host};dbname={$this->dbName};charset={$this->charset}";

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
            // Log the exact error internally for sysadmins (never output to client in production)
            error_log('Database Connection Error: ' . $e->getMessage());

            // Throw exception to caller without exposing internal credentials
            throw new Exception('Database service unavailable. Please check your MySQL configuration.');
        }
    }
}
