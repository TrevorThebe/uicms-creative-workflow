<?php
class Logger {
    private static $logFile = __DIR__ . '/../data/system.log';

    public static function log($type, $message, $context = []) {
        $timestamp = date('Y-m-d H:i:s');
        $logEntry = sprintf("[%s] [%s] %s %s\n", $timestamp, strtoupper($type), $message, json_encode($context));
        file_put_contents(self::$logFile, $logEntry, FILE_APPEND);
    }
}
