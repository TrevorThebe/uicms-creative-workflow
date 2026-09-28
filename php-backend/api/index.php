<?php
// =============================================================================
// UICMS Workflow API Gateway & Health Check (PHP 8.2+)
// =============================================================================

require_once __DIR__ . '/../config/database.php';
initApiHeaders();

$database = new Database();
$db = $database->getConnection();

$routes = [
    "GET /api/projects.php"     => "List or search workflow projects",
    "POST /api/projects.php"    => "Create new creative request",
    "PUT /api/projects.php"     => "Update project stage / lock brief",
    "GET /api/tasks.php"        => "Fetch tasks for projects or users",
    "POST /api/tasks.php"       => "Create / update task checklist",
    "GET /api/deliverables.php" => "Retrieve deliverable versions & QA reports",
    "POST /api/deliverables.php"=> "Upload new version and submit QA audit",
    "POST /api/approvals.php"   => "Client digital sign-off and approval hashes",
    "POST /api/auth.php"        => "Authenticate user and get session payload",
    "POST /api/files.php"       => "Upload attachments / generate S3 URLs"
];

sendResponse(200, [
    "status" => "online",
    "service" => "UICMS Creative Workflow REST API",
    "version" => "2.0.0",
    "php_version" => PHP_VERSION,
    "environment" => getenv('APP_ENV') ?: 'production',
    "timestamp" => date('c'),
    "database_connected" => ($db !== null),
    "endpoints" => $routes
]);
