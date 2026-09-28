<?php
// =============================================================================
// UICMS Workflow - Client Approvals & Digital Signatures (PHP / MySQL)
// =============================================================================

require_once __DIR__ . '/../config/database.php';
initApiHeaders();

$database = new Database();
$db = $database->getConnection();
$method = $_SERVER['REQUEST_METHOD'];

// 1. GET: Fetch approvals for project
if ($method === 'GET') {
    $projectId = $_GET['project_id'] ?? null;
    try {
        if ($projectId) {
            $stmt = $db->prepare("SELECT * FROM client_approvals WHERE project_id = :project_id ORDER BY approved_at DESC");
            $stmt->execute([':project_id' => $projectId]);
        } else {
            $stmt = $db->query("SELECT * FROM client_approvals ORDER BY approved_at DESC LIMIT 100");
        }
        $approvals = $stmt->fetchAll();

        foreach ($approvals as &$appr) {
            $appr['changes_requested'] = json_decode($appr['changes_requested'] ?? '[]', true);
        }

        sendResponse(200, ["status" => "success", "data" => $approvals]);
    } catch (PDOException $e) {
        sendResponse(500, ["status" => "error", "message" => $e->getMessage()]);
    }
}

// 2. POST: Submit Client Approval / Rejection Decision with SHA256 Signature Hash
if ($method === 'POST') {
    $input = json_decode(file_get_contents("php://input"), true);
    if (!$input || empty($input['project_id']) || empty($input['decision']) || empty($input['client_name'])) {
        sendResponse(400, ["status" => "error", "message" => "Missing required approval fields"]);
    }

    try {
        $id = $input['id'] ?? 'appr-' . uniqid();
        $projectId = $input['project_id'];
        $versionId = $input['version_id'] ?? 'ver-1';
        $versionNum = $input['version_number'] ?? 'V1.0';
        $decision = $input['decision']; // APPROVED, APPROVED_WITH_NOTES, CHANGES_REQUESTED, REJECTED
        $clientName = $input['client_name'];
        $clientPos = $input['client_position'] ?? 'Client Representative';
        $comments = $input['comments'] ?? '';
        $changes = json_encode($input['changes_requested'] ?? []);
        $approvedAt = date('c');

        // Cryptographic proof signature hash
        $signatureHash = hash('sha256', $projectId . '|' . $versionNum . '|' . $decision . '|' . $clientName . '|' . $approvedAt);

        $db->beginTransaction();

        $stmt = $db->prepare("INSERT INTO client_approvals (
            id, project_id, version_id, version_number, client_id, decision, client_name, client_position,
            confirmation_text, comments, changes_requested, approved_at, signature_hash
        ) VALUES (
            :id, :project_id, :version_id, :version_number, :client_id, :decision, :client_name, :client_position,
            :confirmation_text, :comments, :changes_requested, :approved_at, :signature_hash
        )");

        $stmt->execute([
            ':id'                => $id,
            ':project_id'        => $projectId,
            ':version_id'        => $versionId,
            ':version_number'    => $versionNum,
            ':client_id'         => $input['client_id'] ?? null,
            ':decision'          => $decision,
            ':client_name'       => $clientName,
            ':client_position'   => $clientPos,
            ':confirmation_text' => $input['confirmation_text'] ?? "Formal digital approval submitted by $clientName",
            ':comments'          => $comments,
            ':changes_requested' => $changes,
            ':approved_at'       => $approvedAt,
            ':signature_hash'    => $signatureHash
        ]);

        // Advance project workflow stage according to decision
        $newStage = ($decision === 'APPROVED' || $decision === 'APPROVED_WITH_NOTES') ? 'FINAL_QA' : 'REVISION';
        $approvalStatus = ($decision === 'APPROVED' || $decision === 'APPROVED_WITH_NOTES') ? 'approved' : 'changes_requested';

        $stmtProj = $db->prepare("UPDATE projects SET stage = :stage, approval_status = :status, updated_at = :updated WHERE id = :id");
        $stmtProj->execute([
            ':stage'   => $newStage,
            ':status'  => $approvalStatus,
            ':updated' => $approvedAt,
            ':id'      => $projectId
        ]);

        // Insert immutable audit log
        $stmtLog = $db->prepare("INSERT INTO activity_logs (id, project_id, user_id, user_name, action, description, timestamp, new_stage) VALUES (:id, :project_id, :user_id, :user_name, :action, :desc, :ts, :stage)");
        $stmtLog->execute([
            ':id'         => 'log-' . uniqid(),
            ':project_id' => $projectId,
            ':user_id'    => $input['user_id'] ?? 'client-portal',
            ':user_name'  => $clientName,
            ':action'     => 'CLIENT_SIGN_OFF',
            ':desc'       => "Client submitted decision: $decision for $versionNum. Signature hash: $signatureHash",
            ':ts'         => $approvedAt,
            ':stage'      => $newStage
        ]);

        $db->commit();

        sendResponse(201, [
            "status" => "success",
            "message" => "Approval recorded and workflow advanced to $newStage",
            "approval_id" => $id,
            "signature_hash" => $signatureHash,
            "new_stage" => $newStage
        ]);
    } catch (PDOException $e) {
        $db->rollBack();
        sendResponse(500, ["status" => "error", "message" => $e->getMessage()]);
    }
}
