<?php
header('Content-Type: text/event-stream');
header('Cache-Control: no-cache');
header('Connection: keep-alive');
header('Access-Control-Allow-Origin: *');

// For simplicity, we'll check the database every few seconds for the latest timestamp
// and send a message if it's updated.

require_once __DIR__ . '/../config/database.php';

$last_check = time();
$end_time = time() + 30; // 30 seconds

while (time() < $end_time) {
    // Check for updates
    try {
        $stmt = $db->query("SELECT MAX(updated_at) as last_update FROM projects"); 
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        $last_update = strtotime($row['last_update']);

        if ($last_update > $last_check) {
            $last_check = time();
            echo "data: " . json_encode(['type' => 'refresh']) . "\n\n";
            flush();
        }
    } catch (Exception $e) {
        error_log('SSE Error: ' . $e->getMessage());
    }

    sleep(5); // Check every 5 seconds
}
?>
