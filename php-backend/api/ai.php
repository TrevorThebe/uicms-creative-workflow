<?php
/**
 * ============================================================================
 * Gemini AI Product Summarizer Endpoint (PHP 8+)
 * ============================================================================
 * Method: POST /api/ai.php
 * 
 * Workflow:
 * 1. Queries products table in MySQL via PDO prepared statements.
 * 2. Formulates a structured analytics prompt with product metrics.
 * 3. Securely loads GEMINI_API_KEY from .env / environment variables.
 * 4. Calls Google Gemini API (gemini-2.5-flash) via cURL.
 * 5. Returns parsed AI summary in JSON.
 */

declare(strict_types=1);

require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/env.php';

// Only allow POST or GET (with POST preferred)
$method = $_SERVER['REQUEST_METHOD'] ?? 'POST';
if ($method !== 'POST' && $method !== 'GET') {
    sendResponse(false, 'Only POST and GET methods are supported for the AI endpoint', null, 405);
}

// 1. Initialize Database Connection
try {
    $database = new Database();
    $db = $database->getConnection();
} catch (Exception $e) {
    sendResponse(false, $e->getMessage(), null, 500);
}

// 2. Fetch Products from MySQL
try {
    $stmt = $db->prepare('SELECT id, name, description, price, created_at FROM products ORDER BY price DESC');
    $stmt->execute();
    $products = $stmt->fetchAll();

    if (empty($products)) {
        sendResponse(true, 'No products found in the database to summarize.', [
            'summary'       => 'There are currently 0 products in the database catalog.',
            'product_count' => 0,
        ], 200);
    }
} catch (PDOException $e) {
    error_log('Database Error (AI Summarizer): ' . $e->getMessage());
    sendResponse(false, 'Database query failed when reading products catalog', null, 500);
}

// 3. Calculate catalog statistics
$productCount = count($products);
$prices = array_column($products, 'price');
$totalCatalogValue = array_sum($prices);
$avgPrice = round($totalCatalogValue / $productCount, 2);
$maxPrice = max($prices);
$minPrice = min($prices);

// 4. Retrieve Gemini API Key Securely
$geminiApiKey = getenv('GEMINI_API_KEY') ?: ($_ENV['GEMINI_API_KEY'] ?? ($_SERVER['GEMINI_API_KEY'] ?? ''));

if (empty($geminiApiKey)) {
    // If no custom key set in .env, check if GEMINI_API_KEY is available in server environment
    $geminiApiKey = getenv('API_KEY') ?: '';
}

if (empty($geminiApiKey)) {
    // Return a structured fallback analysis if API key is not yet configured
    $fallbackSummary = sprintf(
        "There are %d products in the catalog. The average price is $%.2f. The most expensive item is priced at $%.2f, and the lowest priced item is $%.2f. (Note: Set GEMINI_API_KEY in your .env file for full generative AI insights).",
        $productCount,
        $avgPrice,
        $maxPrice,
        $minPrice
    );

    sendResponse(true, 'Products summary generated (Local Analytical Fallback)', [
        'summary'       => $fallbackSummary,
        'product_count' => $productCount,
        'statistics'    => [
            'total_value'   => $totalCatalogValue,
            'average_price' => $avgPrice,
            'max_price'     => $maxPrice,
            'min_price'     => $minPrice,
        ],
        'model'         => 'local-analyzer (Set GEMINI_API_KEY for gemini-2.5-flash)',
    ], 200);
}

// 5. Build Structured Prompt for Gemini
$productsListFormatted = [];
foreach ($products as $p) {
    $productsListFormatted[] = sprintf(
        "- ID #%d: %s | Price: $%.2f | Description: %s",
        $p['id'],
        $p['name'],
        (float) $p['price'],
        $p['description'] ?: 'No description'
    );
}

$promptText = "You are a senior business intelligence and inventory analyst. Analyze the following MySQL product catalog and provide a clear, concise 2-4 sentence executive summary. Highlight the total product count, most and least expensive items, price distribution/averages, and key product categories or trends.\n\n"
    . "Product Catalog Data (" . $productCount . " items):\n"
    . implode("\n", $productsListFormatted) . "\n\n"
    . "Please provide the summary in natural, professional language.";

// 6. Call Google Gemini API (gemini-2.5-flash) via cURL
$endpointUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' . urlencode($geminiApiKey);

$requestPayload = [
    'contents' => [
        [
            'parts' => [
                ['text' => $promptText],
            ],
        ],
    ],
    'generationConfig' => [
        'temperature'     => 0.2,
        'maxOutputTokens' => 800,
    ],
];

$ch = curl_init($endpointUrl);
curl_setopt_array($ch, [
    CURLOPT_POST           => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER     => [
        'Content-Type: application/json',
    ],
    CURLOPT_POSTFIELDS     => json_encode($requestPayload),
    CURLOPT_TIMEOUT        => 20,
    CURLOPT_SSL_VERIFYPEER => true,
]);

$rawResponse = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

if ($rawResponse === false || !empty($curlError)) {
    sendResponse(false, 'Failed to connect to Google Gemini API: ' . ($curlError ?: 'Unknown error'), null, 502);
}

$geminiResponse = json_decode($rawResponse, true);

if ($httpCode !== 200) {
    $errorMessage = $geminiResponse['error']['message'] ?? "Gemini API returned HTTP {$httpCode}";
    sendResponse(false, 'Gemini AI Error: ' . $errorMessage, null, 502);
}

// Extract generated text from candidates
$generatedText = $geminiResponse['candidates'][0]['content']['parts'][0]['text'] ?? null;

if (empty($generatedText)) {
    sendResponse(false, 'Gemini returned an empty response candidate.', null, 502);
}

// 7. Return Successful AI Summary JSON
sendResponse(true, 'Product catalog successfully summarized by Gemini AI', [
    'summary'       => trim($generatedText),
    'product_count' => $productCount,
    'statistics'    => [
        'total_value'   => $totalCatalogValue,
        'average_price' => $avgPrice,
        'max_price'     => $maxPrice,
        'min_price'     => $minPrice,
    ],
    'model'         => 'gemini-2.5-flash',
    'timestamp'     => date('c'),
], 200);
