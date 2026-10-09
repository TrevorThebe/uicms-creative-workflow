<?php
/**
 * ============================================================================
 * UICMS Creative Workflow - Amazon SES Mailer (AWS SDK for PHP & SigV4 Gateway)
 * ============================================================================
 * Sends genuine transaction emails via Amazon Simple Email Service (SES).
 * Supports official Aws\Ses\SesClient and direct AWS Signature Version 4 HTTP API.
 * Default Region: af-south-1 (Cape Town)
 */

require_once __DIR__ . '/env.php';

// Auto-load Composer vendor directory if present
$autoloadPaths = [
    __DIR__ . '/../vendor/autoload.php',
    dirname(__DIR__, 2) . '/vendor/autoload.php',
    '/var/www/html/php-backend/vendor/autoload.php',
    '/var/www/html/vendor/autoload.php',
];
foreach ($autoloadPaths as $autoload) {
    if (file_exists($autoload) && is_readable($autoload)) {
        require_once $autoload;
        break;
    }
}

class AwsSesMailer
{
    /**
     * Resolves an environment variable from putenv, $_ENV, $_SERVER, or default
     */
    private static function getEnv(string $key, string $default = ''): string
    {
        $val = getenv($key);
        if ($val !== false && $val !== '') {
            return trim($val);
        }
        if (!empty($_ENV[$key])) {
            return trim((string)$_ENV[$key]);
        }
        if (!empty($_SERVER[$key])) {
            return trim((string)$_SERVER[$key]);
        }
        return $default;
    }

    /**
     * Sends password reset verification email via Amazon SES
     *
     * @param string $toEmail Recipient email address
     * @param string $verificationCode 6-digit numeric verification code
     * @return array [success => bool, messageId => string|null, error => string|null]
     */
    public static function sendPasswordResetCode(string $toEmail, string $verificationCode): array
    {
        $region = self::getEnv('AWS_REGION', 'af-south-1');
        $accessKey = self::getEnv('AWS_ACCESS_KEY_ID', '');
        $secretKey = self::getEnv('AWS_SECRET_ACCESS_KEY', '');
        $fromEmail = self::getEnv('SES_FROM_EMAIL', 'noreply@uwiniwin.co.za');
        $fromName = self::getEnv('SES_FROM_NAME', 'UICMS');

        $subject = 'UICMS Password Reset Code';

        $textBody = "Hello,\n\n"
            . "Your UICMS password reset verification code is:\n\n"
            . "{$verificationCode}\n\n"
            . "This code expires in 15 minutes.\n\n"
            . "If you did not request this reset, please ignore this email.\n\n"
            . "UICMS Security Team";

        $htmlBody = '<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f19; color: #f1f5f9; padding: 24px; margin: 0; }
  .card { max-width: 520px; margin: 0 auto; background-color: #111827; border: 1px solid #1f2937; border-radius: 16px; padding: 32px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }
  .brand { display: flex; align-items: center; gap: 8px; font-weight: 700; font-size: 18px; color: #6366f1; margin-bottom: 24px; letter-spacing: -0.025em; }
  .code-box { background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); border: 1px solid #4338ca; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
  .code { font-family: monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #ffffff; text-shadow: 0 2px 4px rgba(0,0,0,0.4); }
  .meta { color: #94a3b8; font-size: 13px; line-height: 1.6; }
  .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #1f2937; color: #64748b; font-size: 11px; }
</style>
</head>
<body>
  <div class="card">
    <div class="brand">UICMS Creative Operations</div>
    <p style="font-size: 16px; font-weight: 600; color: #f8fafc; margin-top: 0;">Password Reset Verification</p>
    <p class="meta">Hello,</p>
    <p class="meta">Your UICMS password reset verification code is:</p>
    <div class="code-box">
      <div class="code">' . htmlspecialchars($verificationCode, ENT_QUOTES, 'UTF-8') . '</div>
    </div>
    <p class="meta"><strong>This code expires in 15 minutes.</strong></p>
    <p class="meta">If you did not request this password reset, please ignore this email or notify your system administrator.</p>
    <div class="footer">
      UICMS Security Team &bull; Enterprise Creative Operations Gateway<br>
      Automated dispatch from Amazon SES (' . htmlspecialchars($region, ENT_QUOTES, 'UTF-8') . ')
    </div>
  </div>
</body>
</html>';

        // 1. If official AWS SDK for PHP is available
        if (class_exists('\\Aws\\Ses\\SesClient')) {
            try {
                $credentials = [];
                if (!empty($accessKey) && !empty($secretKey)) {
                    $credentials = [
                        'key'    => $accessKey,
                        'secret' => $secretKey,
                    ];
                }

                $sesConfig = [
                    'version' => 'latest',
                    'region'  => $region,
                ];
                if (!empty($credentials)) {
                    $sesConfig['credentials'] = $credentials;
                }

                $client = new \Aws\Ses\SesClient($sesConfig);

                $source = !empty($fromName) ? "{$fromName} <{$fromEmail}>" : $fromEmail;
                $result = $client->sendEmail([
                    'Destination' => [
                        'ToAddresses' => [$toEmail],
                    ],
                    'Source' => $source,
                    'Message' => [
                        'Subject' => [
                            'Data' => $subject,
                            'Charset' => 'UTF-8',
                        ],
                        'Body' => [
                            'Text' => [
                                'Data' => $textBody,
                                'Charset' => 'UTF-8',
                            ],
                            'Html' => [
                                'Data' => $htmlBody,
                                'Charset' => 'UTF-8',
                            ],
                        ],
                    ],
                ]);

                $messageId = $result->get('MessageId') ?? null;
                return [
                    'success' => true,
                    'messageId' => $messageId,
                    'provider' => 'aws_sdk',
                    'region' => $region,
                ];
            } catch (Throwable $sdkErr) {
                error_log('Amazon SES SDK Error: ' . $sdkErr->getMessage());
                // Fall through to try direct SigV4 if keys exist
            }
        }

        // 2. Direct AWS Signature Version 4 SES REST API
        if (!empty($accessKey) && !empty($secretKey)) {
            return self::sendViaSesSigV4(
                $region,
                $accessKey,
                $secretKey,
                $fromEmail,
                $fromName,
                $toEmail,
                $subject,
                $textBody,
                $htmlBody
            );
        }

        // If credentials are completely missing
        $err = 'AWS SES credentials missing. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in php-backend/.env.';
        error_log('AwsSesMailer: ' . $err);
        return [
            'success' => false,
            'error' => $err,
            'provider' => 'none',
        ];
    }

    /**
     * Direct Amazon SES API request with AWS Signature Version 4
     */
    private static function sendViaSesSigV4(
        string $region,
        string $accessKey,
        string $secretKey,
        string $fromEmail,
        string $fromName,
        string $toEmail,
        string $subject,
        string $textBody,
        string $htmlBody
    ): array {
        $host = "email.{$region}.amazonaws.com";
        $endpoint = "https://{$host}/";
        $service = 'ses';

        $source = !empty($fromName) ? "{$fromName} <{$fromEmail}>" : $fromEmail;

        $params = [
            'Action' => 'SendEmail',
            'Source' => $source,
            'Destination.ToAddresses.member.1' => $toEmail,
            'Message.Subject.Data' => $subject,
            'Message.Subject.Charset' => 'UTF-8',
            'Message.Body.Text.Data' => $textBody,
            'Message.Body.Text.Charset' => 'UTF-8',
            'Message.Body.Html.Data' => $htmlBody,
            'Message.Body.Html.Charset' => 'UTF-8',
        ];

        $payload = http_build_query($params, '', '&', PHP_QUERY_RFC3986);
        $payloadHash = hash('sha256', $payload);

        $amzDate = gmdate('Ymd\THis\Z');
        $dateStamp = gmdate('Ymd');

        $canonicalUri = '/';
        $canonicalQueryString = '';
        $canonicalHeaders = "content-type:application/x-www-form-urlencoded; charset=utf-8\n" .
                            "host:{$host}\n" .
                            "x-amz-date:{$amzDate}\n";
        $signedHeaders = 'content-type;host;x-amz-date';

        $canonicalRequest = "POST\n{$canonicalUri}\n{$canonicalQueryString}\n{$canonicalHeaders}\n{$signedHeaders}\n{$payloadHash}";

        $algorithm = 'AWS4-HMAC-SHA256';
        $credentialScope = "{$dateStamp}/{$region}/{$service}/aws4_request";
        $stringToSign = "{$algorithm}\n{$amzDate}\n{$credentialScope}\n" . hash('sha256', $canonicalRequest);

        // Derive signing key
        $kSecret = 'AWS4' . $secretKey;
        $kDate = hash_hmac('sha256', $dateStamp, $kSecret, true);
        $kRegion = hash_hmac('sha256', $region, $kDate, true);
        $kService = hash_hmac('sha256', $service, $kRegion, true);
        $kSigning = hash_hmac('sha256', 'aws4_request', $kService, true);

        $signature = hash_hmac('sha256', $stringToSign, $kSigning);

        $authorizationHeader = "{$algorithm} Credential={$accessKey}/{$credentialScope}, SignedHeaders={$signedHeaders}, Signature={$signature}";

        $headers = [
            'Content-Type: application/x-www-form-urlencoded; charset=utf-8',
            "Host: {$host}",
            "x-amz-date: {$amzDate}",
            "Authorization: {$authorizationHeader}",
        ];

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $endpoint);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);
        curl_setopt($ch, CURLOPT_TIMEOUT, 20);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);

        $response = curl_exec($ch);
        $httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlErr = curl_error($ch);
        curl_close($ch);

        if ($response === false) {
            error_log("Amazon SES cURL Error ({$region}): {$curlErr}");
            return [
                'success' => false,
                'error' => "Failed to connect to Amazon SES ({$region}): {$curlErr}",
                'provider' => 'sigv4',
            ];
        }

        if ($httpCode >= 200 && $httpCode < 300) {
            // Extract MessageId from XML
            $messageId = null;
            if (preg_match('/<MessageId>([^<]+)<\/MessageId>/', $response, $matches)) {
                $messageId = $matches[1];
            }
            return [
                'success' => true,
                'messageId' => $messageId,
                'provider' => 'sigv4',
                'region' => $region,
            ];
        }

        // Parse SES XML error
        $errorMessage = "Amazon SES HTTP {$httpCode}";
        if (preg_match('/<Message>([^<]+)<\/Message>/', $response, $matches)) {
            $errorMessage = $matches[1];
        }

        error_log("Amazon SES error ({$httpCode}): {$errorMessage}");
        return [
            'success' => false,
            'error' => $errorMessage,
            'httpCode' => $httpCode,
            'provider' => 'sigv4',
        ];
    }
}
