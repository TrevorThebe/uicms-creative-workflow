<?php
require_once __DIR__ . '/../config/database.php';
initApiHeaders();

$database = new Database();
$db = $database->getConnection();
$method = $_SERVER['REQUEST_METHOD'];

if (!in_array($method, ['GET', 'POST'], true)) {
    sendResponse(405, ['status' => 'error', 'message' => 'Method not allowed']);
}

$table = trim((string)($_GET['table'] ?? 'all'));
$tables = [
    'departments',
    'users',
    'clients',
    'projects',
    'tasks',
    'project_files',
    'deliverable_versions',
    'qa_submissions',
    'client_approvals',
    'feedback_items',
    'notifications',
    'chat_messages',
    'activity_logs',
    'admin_settings',
];

$collectionTables = [
    'users' => 'users',
    'clients' => 'clients',
    'projects' => 'projects',
    'tasks' => 'tasks',
    'files' => 'project_files',
    'versions' => 'deliverable_versions',
    'qa_submissions' => 'qa_submissions',
    'client_approvals' => 'client_approvals',
    'feedback_items' => 'feedback_items',
    'notifications' => 'notifications',
    'chat_messages' => 'chat_messages',
    'activity_logs' => 'activity_logs',
];

$ensureColumn = function (string $tableName, string $columnName, string $definition) use ($db): void {
    $stmt = $db->prepare(
        'SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table AND COLUMN_NAME = :column'
    );
    $stmt->execute([':table' => $tableName, ':column' => $columnName]);
    if ((int)$stmt->fetchColumn() === 0) {
        $db->exec("ALTER TABLE `{$tableName}` ADD COLUMN `{$columnName}` {$definition}");
    }
};

$db->exec("CREATE TABLE IF NOT EXISTS project_files (
    id VARCHAR(50) NOT NULL PRIMARY KEY,
    project_id VARCHAR(50) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    size VARCHAR(50) NOT NULL DEFAULT '',
    type VARCHAR(150) NOT NULL DEFAULT '',
    version VARCHAR(20) NOT NULL DEFAULT 'V0.1',
    uploaded_by VARCHAR(50) NOT NULL DEFAULT '',
    uploaded_by_name VARCHAR(100) NOT NULL DEFAULT '',
    uploaded_at VARCHAR(50) NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'proofs',
    url VARCHAR(1000) NOT NULL DEFAULT '',
    description TEXT NULL,
    app_payload LONGTEXT NULL,
    KEY idx_project (project_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

foreach ($tables as $tableName) {
    if ($tableName !== 'departments' && $tableName !== 'admin_settings') {
        $ensureColumn($tableName, 'app_payload', 'LONGTEXT NULL');
    }
}
$ensureColumn('users', 'personal_email', 'VARCHAR(150) NULL');
$ensureColumn('users', 'is_temp_password', 'TINYINT(1) NOT NULL DEFAULT 0');
$ensureColumn('users', 'temp_password_expires_at', 'VARCHAR(50) NULL');
$ensureColumn('users', 'must_change_password', 'TINYINT(1) NOT NULL DEFAULT 0');
$ensureColumn('chat_messages', 'recipient_id', 'VARCHAR(50) NULL');
$ensureColumn('chat_messages', 'channel_id', 'VARCHAR(50) NULL');
$ensureColumn('chat_messages', 'attachments', 'JSON NULL');
$ensureColumn('chat_messages', 'referenced_version', 'VARCHAR(50) NULL');
$ensureColumn('activity_logs', 'version_ref', 'VARCHAR(100) NULL');
$ensureColumn('activity_logs', 'metadata', 'JSON NULL');

$readValue = function (array $row, string $key, $fallback = null) {
    $aliases = [
        'title' => ['name'],
        'personal_email' => ['personalEmail'],
        'is_temp_password' => ['isTempPassword'],
        'temp_password_expires_at' => ['tempPasswordExpiresAt'],
        'must_change_password' => ['mustChangePassword'],
        'assigned_to_user_id' => ['ownerId'],
        'assigned_to_name' => ['assignedToName'],
        'department_id' => ['departmentId'],
        'role_title' => ['roleTitle'],
        'is_suspended' => ['isSuspended'],
        'suspension_reason' => ['suspendedReason'],
        'workload_count' => ['workloadCount'],
        'logo_url' => ['logoUrl'],
        'brand_guidelines' => ['brandGuidelines'],
        'ci_document_url' => ['ciDocumentUrl'],
        'primary_contact_name' => ['primaryContact.name'],
        'primary_contact_email' => ['primaryContact.email', 'primaryEmail'],
        'primary_contact_phone' => ['primaryContact.phone'],
        'primary_contact_position' => ['primaryContact.position'],
        'default_ci_colors' => ['defaultCiColors', 'brandColors'],
        'font_requirements' => ['fontRequirements', 'fontFamily'],
        'active_projects_count' => ['activeProjectsCount'],
        'project_number' => ['projectNumber'],
        'client_id' => ['clientId'],
        'request_type_id' => ['requestTypeId'],
        'project_name' => ['projectName'],
        'campaign_name' => ['campaignName'],
        'accountable_user_id' => ['accountableUserId'],
        'project_owner_id' => ['projectOwnerId'],
        'qa_owner_id' => ['qaOwnerId'],
        'approver_id' => ['approverId'],
        'contributor_ids' => ['contributorIds'],
        'created_at' => ['createdAt'],
        'updated_at' => ['updatedAt'],
        'brief_due_date' => ['briefDueDate'],
        'brief_locked_at' => ['briefLockedAt'],
        'brief_locked_by' => ['briefLockedBy'],
        'production_due_date' => ['productionDueDate'],
        'internal_qa_due_date' => ['internalQaDueDate'],
        'client_review_due_date' => ['clientReviewDueDate'],
        'client_approval_due_date' => ['clientApprovalDueDate'],
        'final_qa_due_date' => ['finalQaDueDate'],
        'release_date' => ['releaseDate'],
        'external_suppliers' => ['externalSuppliers'],
        'next_action_task' => ['nextAction.task'],
        'next_action_owner' => ['nextAction.ownerName'],
        'next_action_due' => ['nextAction.dueDate'],
        'approval_status' => ['approvalStatus'],
        'is_brief_locked' => ['isBriefLocked'],
        'is_version_locked' => ['isVersionLocked'],
        'brief_data' => ['briefData'],
        'brief_completeness' => ['briefCompleteness'],
        'project_id' => ['projectId'],
        'assigned_to' => ['assignedTo'],
        'start_date' => ['startDate'],
        'completed_at' => ['completedAt'],
        'comments_count' => ['commentsCount'],
        'version_number' => ['versionNumber'],
        'file_url' => ['fileUrl'],
        'preview_url' => ['previewUrl'],
        'uploaded_by' => ['uploadedBy'],
        'uploaded_by_name' => ['uploadedByName'],
        'uploaded_at' => ['uploadedAt'],
        'is_locked' => ['isLocked'],
        'qa_result' => ['qaResult'],
        'qa_notes' => ['qaNotes', 'notes'],
        'version_id' => ['versionId'],
        'version_number' => ['versionNumber'],
        'performed_by' => ['performedBy'],
        'performed_by_name' => ['performedByName'],
        'performed_at' => ['performedAt'],
        'overall_notes' => ['overallNotes'],
        'passed_count' => ['passedCount'],
        'failed_count' => ['failedCount'],
        'na_count' => ['naCount'],
        'client_name' => ['clientName'],
        'client_position' => ['clientPosition'],
        'confirmation_text' => ['confirmationText'],
        'changes_requested' => ['changesRequested'],
        'approved_at' => ['approvedAt'],
        'signature_hash' => ['signatureHash'],
        'submitted_by' => ['submittedBy'],
        'submitted_by_name' => ['submittedByName'],
        'submitted_at' => ['submittedAt'],
        'feedback_text' => ['feedbackText'],
        'attachment_url' => ['attachmentUrl'],
        'assigned_to_name' => ['assignedToName'],
        'user_id' => ['userId'],
        'is_read' => ['read'],
        'target_tab' => ['targetTab'],
        'sender_id' => ['senderId'],
        'sender_name' => ['senderName'],
        'sender_avatar' => ['senderAvatar'],
        'recipient_id' => ['recipientId'],
        'channel_id' => ['channelId'],
        'referenced_task_id' => ['referencedTaskId'],
        'referenced_version' => ['referencedVersion'],
        'is_important' => ['isImportant'],
        'user_name' => ['userName'],
        'version_ref' => ['versionRef'],
        'previous_stage' => ['previousStage'],
        'new_stage' => ['newStage'],
        'filename' => ['filename'],
        'uploaded_by' => ['uploadedBy'],
        'uploaded_by_name' => ['uploadedByName'],
        'uploaded_at' => ['uploadedAt'],
    ];

    foreach ($aliases[$key] ?? [] as $path) {
        $value = $row;
        foreach (explode('.', $path) as $part) {
            $value = is_array($value) ? ($value[$part] ?? null) : null;
        }
        if ($value !== null) return $value;
    }

    if (array_key_exists($key, $row)) return $row[$key];
    $camel = preg_replace_callback('/_([a-z])/', fn($matches) => strtoupper($matches[1]), $key);
    return $row[$camel] ?? $fallback;
};

$saveState = function (array $state, bool $onlyMissing = false) use ($db, $collectionTables, $readValue): int {
    $jsonColumns = [
        'default_ci_colors', 'contributor_ids', 'brief_data', 'checklist', 'changes_requested',
        'attachments', 'mentions', 'metadata',
    ];
    $savedRows = 0;

    foreach ($collectionTables as $collection => $tableName) {
        $rows = $state[$collection] ?? [];
        if (!is_array($rows)) continue;
        $columns = $db->query("SHOW COLUMNS FROM `{$tableName}`")->fetchAll(PDO::FETCH_COLUMN);
        $columns = array_flip($columns);

        foreach ($rows as $row) {
            if (!is_array($row)) continue;
            $id = $row['id'] ?? null;
            if (!$id) continue;

            if ($onlyMissing) {
                $check = $db->prepare("SELECT 1 FROM `{$tableName}` WHERE id = :id LIMIT 1");
                $check->execute([':id' => $id]);
                if ($check->fetchColumn()) continue;
                if ($collection === 'users' && !empty($row['email'])) {
                    $emailCheck = $db->prepare('SELECT 1 FROM users WHERE email = :email LIMIT 1');
                    $emailCheck->execute([':email' => $row['email']]);
                    if ($emailCheck->fetchColumn()) continue;
                }
            }

            $values = [];
            foreach (array_keys($columns) as $column) {
                if ($column === 'app_payload') continue;
                $value = $readValue($row, $column);
                if ($value !== null) $values[$column] = $value;
            }

            if ($collection === 'users') {
                if (!empty($values['password'])) {
                    $pass = (string)$values['password'];
                    if (!str_starts_with($pass, '$2y$') && !str_starts_with($pass, '$2a$') && !str_starts_with($pass, '$2b$') && !str_starts_with($pass, '$pbkdf2$')) {
                        $hashedPass = password_hash($pass, PASSWORD_BCRYPT);
                        $values['password'] = $hashedPass;
                        $row['password'] = $hashedPass;
                    }
                }
            }
            if ($collection === 'projects') {
                if (($values['stage'] ?? '') === 'RELEASE_PUBLISH') $values['stage'] = 'FINAL_RELEASE';
                if (($values['stage'] ?? '') === 'ARCHIVE') $values['stage'] = 'COMPLETED';
                if (in_array($values['status'] ?? '', ['waiting', 'revision_required'], true)) $values['status'] = 'blocked';
                if (($values['approval_status'] ?? '') === 'approved_with_notes') $values['approval_status'] = 'approved';
            }
            if ($collection === 'tasks') {
                $values['title'] = $values['title'] ?? ($row['name'] ?? 'Untitled Task');
                $values['assigned_to_user_id'] = $values['assigned_to_user_id'] ?? ($row['ownerId'] ?? '');
                $values['assigned_to_name'] = $values['assigned_to_name'] ?? ($row['assignedToName'] ?? '');
                $values['role_required'] = $values['role_required'] ?? ($row['roleRequired'] ?? 'designer');
                $values['status'] = match ($values['status'] ?? '') {
                    'not_started' => 'todo',
                    'complete' => 'completed',
                    'cancelled' => 'blocked',
                    default => $values['status'] ?? 'todo',
                };
                $values['due_date'] = $values['due_date'] ?? date('Y-m-d');
                $values['stage'] = $values['stage'] ?? ($row['stage'] ?? 'PRODUCTION');
            }
            if ($collection === 'versions' && isset($values['status'])) {
                $values['status'] = match ($values['status']) {
                    'in_qa' => 'internal_qa',
                    'revision_requested' => 'rejected',
                    'locked' => 'approved',
                    default => $values['status'],
                };
            }
            if ($collection === 'files') {
                $values['filename'] = $values['filename'] ?? 'Untitled file';
                $values['uploaded_at'] = $values['uploaded_at'] ?? date(DATE_ATOM);
                $values['url'] = $values['url'] ?? '';
            }
            if ($collection === 'chat_messages') {
                $values['project_id'] = $values['project_id'] ?? ($row['channelId'] ?? 'SYSTEM');
            }

            foreach ($jsonColumns as $column) {
                if (array_key_exists($column, $values) && (is_array($values[$column]) || is_object($values[$column]))) {
                    $values[$column] = json_encode($values[$column], JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
                }
            }
            $values['app_payload'] = json_encode($row, JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

            $columnNames = array_keys($values);
            $quotedColumns = array_map(fn($column) => "`{$column}`", $columnNames);
            $placeholders = array_map(fn($column) => ":{$column}", $columnNames);
            $updates = array_map(fn($column) => "`{$column}` = VALUES(`{$column}`)", array_filter($columnNames, fn($column) => $column !== 'id'));
            $sql = "INSERT INTO `{$tableName}` (" . implode(', ', $quotedColumns) . ') VALUES (' . implode(', ', $placeholders) . ')';
            if ($updates) $sql .= ' ON DUPLICATE KEY UPDATE ' . implode(', ', $updates);
            $stmt = $db->prepare($sql);
            foreach ($values as $column => $value) $stmt->bindValue(":{$column}", $value);
            $stmt->execute();
            $savedRows++;
        }

        if (!$onlyMissing && array_key_exists($collection, $state)) {
            $ids = array_values(array_unique(array_filter(array_map(
                fn($row) => is_array($row) ? ($row['id'] ?? null) : null,
                $rows
            ))));
            if ($ids) {
                $placeholders = [];
                $params = [];
                foreach ($ids as $index => $id) {
                    $placeholder = ":keep{$index}";
                    $placeholders[] = $placeholder;
                    $params[$placeholder] = $id;
                }
                $delete = $db->prepare("DELETE FROM `{$tableName}` WHERE id NOT IN (" . implode(', ', $placeholders) . ')');
                $delete->execute($params);
            } else {
                $db->exec("DELETE FROM `{$tableName}`");
            }
        }
    }

    $adminConfig = $state['admin_settings'] ?? $state['adminConfig'] ?? null;
    if (is_array($adminConfig)) {
        $stmt = $db->prepare(
            'INSERT INTO admin_settings (setting_key, setting_value) VALUES (:setting_key, :setting_value)
             ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)'
        );
        $stmt->execute([
            ':setting_key' => 'system_config',
            ':setting_value' => json_encode($adminConfig, JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE),
        ]);
        $savedRows++;
    }

    return $savedRows;
};

$migrateLegacySnapshot = function () use ($db, $saveState): void {
    $db->exec("CREATE TABLE IF NOT EXISTS app_migrations (
        migration_key VARCHAR(100) NOT NULL PRIMARY KEY,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    $migrationKey = 'legacy_app_state_to_relational_v1';
    $check = $db->prepare('SELECT 1 FROM app_migrations WHERE migration_key = :key');
    $check->execute([':key' => $migrationKey]);
    if ($check->fetchColumn()) return;

    $tableCheck = $db->prepare(
        'SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table'
    );
    $tableCheck->execute([':table' => 'app_state']);
    if ((int)$tableCheck->fetchColumn() > 0) {
        $legacy = $db->query("SELECT state_json FROM app_state WHERE state_key = 'workflow'")->fetchColumn();
        if ($legacy !== false) {
            $legacyState = json_decode($legacy, true, 512, JSON_THROW_ON_ERROR);
            $saveState($legacyState, true);
        }
    }

    $mark = $db->prepare('INSERT INTO app_migrations (migration_key) VALUES (:key)');
    $mark->execute([':key' => $migrationKey]);
};

try {
    $migrateLegacySnapshot();

    if ($method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true, 512, JSON_THROW_ON_ERROR);
        $state = $input['data'] ?? null;
        if (!is_array($state)) {
            sendResponse(400, ['status' => 'error', 'message' => 'A data object is required.']);
        }

        $db->beginTransaction();
        $savedRows = $saveState($state);
        $db->commit();
        sendResponse(200, [
            'status' => 'success',
            'message' => "Saved {$savedRows} records to the relational database tables.",
            'saved_records' => $savedRows,
            'updated_at' => date(DATE_ATOM),
        ]);
    }

    if ($table !== 'all' && !in_array($table, $tables, true)) {
        sendResponse(400, ['status' => 'error', 'message' => 'Unsupported table requested.']);
    }

    $result = [];
    $targets = $table === 'all' ? $tables : [$table];

    // Read caller identity headers for Row-Level Security (RLS) enforcement
    $requestUserRole = $_SERVER['HTTP_X_USER_ROLE'] ?? null;
    $requestUserId = $_SERVER['HTTP_X_USER_ID'] ?? null;
    $requestClientId = $_SERVER['HTTP_X_CLIENT_ID'] ?? null;
    $requestDeptId = $_SERVER['HTTP_X_DEPARTMENT_ID'] ?? null;

    foreach ($targets as $tableName) {
        $stmt = $db->query("SELECT * FROM `{$tableName}` ORDER BY 1");
        $rows = $stmt->fetchAll();

        if ($tableName === 'admin_settings') {
            $mapped = [];
            foreach ($rows as $row) {
                $mapped[$row['setting_key']] = json_decode($row['setting_value'] ?? '{}', true) ?: [];
            }
            $rows = $mapped;
        } elseif ($tableName !== 'departments') {
            foreach ($rows as &$row) {
                if (!empty($row['app_payload'])) {
                    $payload = json_decode($row['app_payload'], true);
                    if (is_array($payload)) $row = array_merge($row, $payload);
                }
            }
            unset($row);
        }

        foreach ($rows as &$row) {
            if (is_array($row)) {
                foreach ($row as $key => &$value) {
                    if (is_string($value) && in_array($key, ['contributor_ids', 'default_ci_colors', 'checklist', 'mentions', 'changes_requested', 'brief_data', 'attachments', 'metadata', 'setting_value'], true)) {
                        $decoded = json_decode($value, true);
                        if (json_last_error() === JSON_ERROR_NONE) $value = $decoded;
                    }
                }

                unset($value);
            }
        }

        unset($row);

        // Security & Row-Level Access Policy Enforcement (RLS)
        if ($tableName === 'users') {
            // NEVER leak raw passwords or password hashes across the wire
            foreach ($rows as &$uRow) {
                unset($uRow['password']);
                if ($requestUserRole === 'client') {
                    // Clients should not see internal personal recovery emails or credentials
                    unset($uRow['personal_email']);
                    unset($uRow['personalEmail']);
                    unset($uRow['is_temp_password']);
                    unset($uRow['isTempPassword']);
                    unset($uRow['temp_password_expires_at']);
                }
            }
            unset($uRow);
        }

        // Row-Level Security for Clients
        if ($requestUserRole === 'client' && !empty($requestClientId)) {
            if ($tableName === 'projects') {
                $rows = array_values(array_filter($rows, fn($r) => ($r['client_id'] ?? $r['clientId'] ?? '') === $requestClientId));
            } elseif ($tableName === 'client_approvals') {
                $rows = array_values(array_filter($rows, fn($r) => ($r['client_id'] ?? $r['clientId'] ?? '') === $requestClientId));
            } elseif ($tableName === 'tasks') {
                $rows = array_values(array_filter($rows, fn($r) => !empty($r['is_client_facing']) || !empty($r['isClientFacing'])));
            } elseif ($tableName === 'admin_settings') {
                $rows = [
                    'appName' => $rows['system_config']['appName'] ?? 'UICMS Creative Workflow',
                    'appSubtitle' => $rows['system_config']['appSubtitle'] ?? 'Brief. Create. Review. Approve. Deliver.',
                ];
            }
        }

        $result[match ($tableName) {
            'deliverable_versions' => 'versions',
            'project_files' => 'files',
            'client_approvals' => 'client_approvals',
            default => $tableName,
        }] = $rows;
    }

    if ($table === 'all') {
        $result['versions'] = $result['versions'] ?? [];
        $result['files'] = $result['files'] ?? [];
    }

    sendResponse(200, [
        'status' => 'success',
        'count' => count($result),
        'data' => $result,
    ]);
} catch (PDOException $e) {
    if ($db->inTransaction()) $db->rollBack();
    sendResponse(500, ['status' => 'error', 'message' => $e->getMessage()]);
} catch (Throwable $e) {
    if ($db->inTransaction()) $db->rollBack();
    sendResponse(500, ['status' => 'error', 'message' => $e->getMessage()]);
}
