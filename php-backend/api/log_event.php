<?php
require_once __DIR__ . '/../helpers/Logger.php';

header('Content-Type: application/json');

$input = json_decode(file_get_contents('php://input'), true);

if ($input) {
    Logger::log($input['level'] ?? 'info', $input['message'] ?? 'No message', $input['context'] ?? []);
    echo json_encode(['status' => 'success']);
} else {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Invalid input']);
}
