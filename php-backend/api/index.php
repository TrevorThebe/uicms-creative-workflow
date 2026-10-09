<?php
// =============================================================================
// UICMS Workflow API Gateway & Health Check (PHP 8.2+)
// =============================================================================

require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../config/database.php';
initApiHeaders();

$db = null;
try {
    $database = new Database();
    $db = $database->getConnection();
} catch (Throwable $e) {}

$routes = [
    "GET /api/data.php"     => "Synchronize and query system state collections",
    "POST /api/data.php"    => "Persist system records and transactions"
];

sendResponse(200, [
    "status" => "online",
    "service" => "UICMS Creative Workflow REST API",
    "version" => "2.0.0",
    "php_version" => PHP_VERSION,
    "environment" => getenv('APP_ENV') ?: 'production',
    "timestamp" => date('c'),
    "database_connected" => ($db !== null),
    "database_name" => "uicms_workflow",
    "database_management_url" => "http://localhost/phpmyadmin/index.php?route=/database/structure&db=uicms_workflow",
    "mode" => "MySQL Live Database",
    "endpoints" => $routes
]);
