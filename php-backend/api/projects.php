<?php
// =============================================================================
// UICMS Workflow - Projects REST API (PHP / MySQL)
// Supports GET (list/filter), POST (create request), PUT (update stage/brief)
// =============================================================================

require_once __DIR__ . '/../config/database.php';
initApiHeaders();

$database = new Database();
$db = $database->getConnection();
$method = $_SERVER['REQUEST_METHOD'];

// 1. GET: List all projects or get by ID
if ($method === 'GET') {
    $projectId = $_GET['id'] ?? null;
    $dept = $_GET['department_id'] ?? null;
    $stage = $_GET['stage'] ?? null;

    try {
        if ($projectId) {
            $stmt = $db->prepare("SELECT * FROM projects WHERE id = :id LIMIT 1");
            $stmt->execute([':id' => $projectId]);
            $project = $stmt->fetch();

            if (!$project) {
                sendResponse(404, ["status" => "error", "message" => "Project not found"]);
            }

            // Decode JSON columns
            $project['contributor_ids'] = json_decode($project['contributor_ids'] ?? '[]', true);
            $project['brief_data'] = json_decode($project['brief_data'] ?? '{}', true);

            sendResponse(200, ["status" => "success", "data" => $project]);
        }

        $query = "SELECT * FROM projects WHERE 1=1";
        $params = [];

        if ($dept && $dept !== 'all') {
            $query .= " AND department_id = :dept";
            $params[':dept'] = $dept;
        }

        if ($stage) {
            $query .= " AND stage = :stage";
            $params[':stage'] = $stage;
        }

        $query .= " ORDER BY project_number DESC";
        $stmt = $db->prepare($query);
        $stmt->execute($params);
        $projects = $stmt->fetchAll();

        foreach ($projects as &$p) {
            $p['contributor_ids'] = json_decode($p['contributor_ids'] ?? '[]', true);
            $p['brief_data'] = json_decode($p['brief_data'] ?? '{}', true);
        }

        sendResponse(200, [
            "status" => "success",
            "count" => count($projects),
            "data" => $projects
        ]);
    } catch (PDOException $e) {
        sendResponse(500, ["status" => "error", "message" => $e->getMessage()]);
    }
}

// 2. POST: Create New Project Request
if ($method === 'POST') {
    $input = json_decode(file_get_contents("php://input"), true);
    if (!$input || empty($input['project_name']) || empty($input['client_id']) || empty($input['department_id'])) {
        sendResponse(400, ["status" => "error", "message" => "Missing required fields (project_name, client_id, department_id)"]);
    }

    try {
        // Generate next project number
        $stmtNum = $db->query("SELECT MAX(project_number) as max_num FROM projects");
        $rowNum = $stmtNum->fetch();
        $nextNum = ($rowNum['max_num'] ? (int)$rowNum['max_num'] + 1 : 101);

        $id = $input['id'] ?? 'PRJ-' . strtoupper(substr($input['department_id'], 0, 3)) . '-' . date('Y') . '-' . sprintf('%03d', $nextNum);

        $insertSql = "INSERT INTO projects (
            id, project_number, client_id, department_id, request_type_id, project_name, campaign_name,
            description, priority, stage, status, version, accountable_user_id, project_owner_id,
            qa_owner_id, approver_id, contributor_ids, created_at, updated_at, brief_due_date,
            release_date, brief_data, brief_completeness
        ) VALUES (
            :id, :project_number, :client_id, :department_id, :request_type_id, :project_name, :campaign_name,
            :description, :priority, :stage, :status, :version, :accountable_user_id, :project_owner_id,
            :qa_owner_id, :approver_id, :contributor_ids, :created_at, :updated_at, :brief_due_date,
            :release_date, :brief_data, :brief_completeness
        )";

        $stmt = $db->prepare($insertSql);
        $stmt->execute([
            ':id'                  => $id,
            ':project_number'      => $nextNum,
            ':client_id'           => $input['client_id'],
            ':department_id'       => $input['department_id'],
            ':request_type_id'     => $input['request_type_id'] ?? 'general',
            ':project_name'        => $input['project_name'],
            ':campaign_name'       => $input['campaign_name'] ?? '',
            ':description'         => $input['description'] ?? '',
            ':priority'            => $input['priority'] ?? 'medium',
            ':stage'               => 'REQUESTED',
            ':status'              => 'on_track',
            ':version'             => 'V0.1',
            ':accountable_user_id' => $input['accountable_user_id'] ?? 'usr-am-1',
            ':project_owner_id'    => $input['project_owner_id'] ?? 'usr-des-1',
            ':qa_owner_id'         => $input['qa_owner_id'] ?? 'usr-qa-1',
            ':approver_id'         => $input['approver_id'] ?? 'usr-client-1',
            ':contributor_ids'     => json_encode($input['contributor_ids'] ?? []),
            ':created_at'          => date('c'),
            ':updated_at'          => date('c'),
            ':brief_due_date'      => $input['brief_due_date'] ?? date('Y-m-d', strtotime('+3 days')),
            ':release_date'        => $input['release_date'] ?? date('Y-m-d', strtotime('+14 days')),
            ':brief_data'          => json_encode($input['brief_data'] ?? []),
            ':brief_completeness'  => (int)($input['brief_completeness'] ?? 0)
        ]);

        sendResponse(201, [
            "status" => "success",
            "message" => "Project request successfully created",
            "id" => $id,
            "project_number" => $nextNum
        ]);
    } catch (PDOException $e) {
        sendResponse(500, ["status" => "error", "message" => $e->getMessage()]);
    }
}

// 3. PUT: Update Project Stage, Lock Brief, or Edit
if ($method === 'PUT') {
    $input = json_decode(file_get_contents("php://input"), true);
    if (!$input || empty($input['id'])) {
        sendResponse(400, ["status" => "error", "message" => "Missing required project ID"]);
    }

    try {
        $fields = [];
        $params = [':id' => $input['id']];

        $allowedFields = [
            'stage', 'status', 'version', 'priority', 'brief_completeness',
            'is_brief_locked', 'is_version_locked', 'approval_status',
            'next_action_task', 'next_action_owner', 'next_action_due',
            'brief_locked_at', 'brief_locked_by'
        ];

        foreach ($allowedFields as $field) {
            if (isset($input[$field])) {
                $fields[] = "$field = :$field";
                $params[":$field"] = $input[$field];
            }
        }

        if (isset($input['brief_data'])) {
            $fields[] = "brief_data = :brief_data";
            $params[':brief_data'] = json_encode($input['brief_data']);
        }

        $fields[] = "updated_at = :updated_at";
        $params[':updated_at'] = date('c');

        $query = "UPDATE projects SET " . implode(', ', $fields) . " WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->execute($params);

        sendResponse(200, [
            "status" => "success",
            "message" => "Project updated successfully"
        ]);
    } catch (PDOException $e) {
        sendResponse(500, ["status" => "error", "message" => $e->getMessage()]);
    }
}
