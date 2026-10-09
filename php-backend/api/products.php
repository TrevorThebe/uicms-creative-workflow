<?php
/**
 * ============================================================================
 * Products REST API Endpoint (PHP 8+ / PDO)
 * ============================================================================
 * Supported Methods:
 * - GET    /api/products.php         Fetch all products
 * - GET    /api/products.php?id={id} Fetch single product by ID
 * - POST   /api/products.php         Create new product
 * - PUT    /api/products.php?id={id} Update product by ID
 * - DELETE /api/products.php?id={id} Delete product by ID
 */

declare(strict_types=1);

require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../config/database.php';

// Initialize Database Connection
try {
    $database = new Database();
    $db = $database->getConnection();
} catch (Exception $e) {
    sendResponse(false, $e->getMessage(), null, 500);
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

// Route by HTTP Method
switch ($method) {
    case 'GET':
        handleGet($db);
        break;

    case 'POST':
        handlePost($db);
        break;

    case 'PUT':
        handlePut($db);
        break;

    case 'DELETE':
        handleDelete($db);
        break;

    default:
        sendResponse(false, "Method {$method} not allowed", null, 405);
        break;
}

/**
 * Handles GET requests: Fetch all products or a single product by ID.
 */
function handleGet(PDO $db): void
{
    $id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);

    // Case 1: Fetch single product
    if ($id !== null && $id !== false) {
        try {
            $stmt = $db->prepare('SELECT id, name, description, price, created_at FROM products WHERE id = :id LIMIT 1');
            $stmt->bindValue(':id', $id, PDO::PARAM_INT);
            $stmt->execute();

            $product = $stmt->fetch();

            if (!$product) {
                sendResponse(false, 'Product not found', null, 404);
            }

            // Cast numeric fields properly
            $product['id'] = (int) $product['id'];
            $product['price'] = (float) $product['price'];

            sendResponse(true, 'Product retrieved successfully', $product, 200);
        } catch (PDOException $e) {
            error_log('Database Error (GET Single Product): ' . $e->getMessage());
            sendResponse(false, 'Failed to retrieve product', null, 500);
        }
    }

    // Case 2: Fetch all products
    try {
        $stmt = $db->prepare('SELECT id, name, description, price, created_at FROM products ORDER BY id DESC');
        $stmt->execute();

        $products = $stmt->fetchAll();

        // Format data types for JSON
        $formatted = array_map(function ($p) {
            return [
                'id'          => (int) $p['id'],
                'name'        => (string) $p['name'],
                'description' => $p['description'] !== null ? (string) $p['description'] : null,
                'price'       => (float) $p['price'],
                'created_at'  => (string) $p['created_at'],
            ];
        }, $products);

        sendResponse(true, 'Products retrieved successfully', [
            'count'    => count($formatted),
            'products' => $formatted,
        ], 200);
    } catch (PDOException $e) {
        error_log('Database Error (GET All Products): ' . $e->getMessage());
        sendResponse(false, 'Failed to retrieve products', null, 500);
    }
}

/**
 * Handles POST requests: Create a new product.
 */
function handlePost(PDO $db): void
{
    $input = getJsonInput();

    // 1. Validate required fields
    $name = isset($input['name']) ? trim((string) $input['name']) : '';
    $description = isset($input['description']) ? trim((string) $input['description']) : null;
    $priceRaw = $input['price'] ?? null;

    if (empty($name)) {
        sendResponse(false, 'Field "name" is required and cannot be empty', null, 400);
    }

    if ($priceRaw === null || !is_numeric($priceRaw) || (float) $priceRaw < 0) {
        sendResponse(false, 'Field "price" must be a valid non-negative numeric value', null, 400);
    }

    // 2. Sanitize inputs
    $name = htmlspecialchars(strip_tags($name), ENT_QUOTES, 'UTF-8');
    if ($description !== null) {
        $description = htmlspecialchars(strip_tags($description), ENT_QUOTES, 'UTF-8');
    }
    $price = round((float) $priceRaw, 2);

    // 3. Insert into database using prepared statements
    try {
        $stmt = $db->prepare('
            INSERT INTO products (name, description, price)
            VALUES (:name, :description, :price)
        ');

        $stmt->bindValue(':name', $name, PDO::PARAM_STR);
        $stmt->bindValue(':description', $description, $description !== null ? PDO::PARAM_STR : PDO::PARAM_NULL);
        $stmt->bindValue(':price', $price, PDO::PARAM_STR);
        $stmt->execute();

        $newId = (int) $db->lastInsertId();

        // Retrieve created product
        $fetchStmt = $db->prepare('SELECT id, name, description, price, created_at FROM products WHERE id = :id');
        $fetchStmt->bindValue(':id', $newId, PDO::PARAM_INT);
        $fetchStmt->execute();
        $createdProduct = $fetchStmt->fetch();

        $createdProduct['id'] = (int) $createdProduct['id'];
        $createdProduct['price'] = (float) $createdProduct['price'];

        sendResponse(true, 'Product created successfully', $createdProduct, 201);
    } catch (PDOException $e) {
        error_log('Database Error (POST Product): ' . $e->getMessage());
        sendResponse(false, 'Failed to create product', null, 500);
    }
}

/**
 * Handles PUT requests: Update an existing product.
 */
function handlePut(PDO $db): void
{
    $id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);
    if (!$id) {
        sendResponse(false, 'Valid integer "id" parameter is required in query string (e.g. ?id=1)', null, 400);
    }

    $input = getJsonInput();

    // Check if product exists first
    try {
        $checkStmt = $db->prepare('SELECT id, name, description, price FROM products WHERE id = :id');
        $checkStmt->bindValue(':id', $id, PDO::PARAM_INT);
        $checkStmt->execute();
        $existing = $checkStmt->fetch();

        if (!$existing) {
            sendResponse(false, 'Product not found', null, 404);
        }

        // Determine updated values (support partial or full update)
        $name = array_key_exists('name', $input) ? trim((string) $input['name']) : $existing['name'];
        $description = array_key_exists('description', $input) ? trim((string) $input['description']) : $existing['description'];
        $priceRaw = array_key_exists('price', $input) ? $input['price'] : $existing['price'];

        if (empty($name)) {
            sendResponse(false, 'Product name cannot be empty', null, 400);
        }

        if (!is_numeric($priceRaw) || (float) $priceRaw < 0) {
            sendResponse(false, 'Price must be a valid non-negative number', null, 400);
        }

        // Sanitize
        $name = htmlspecialchars(strip_tags($name), ENT_QUOTES, 'UTF-8');
        if ($description !== null) {
            $description = htmlspecialchars(strip_tags($description), ENT_QUOTES, 'UTF-8');
        }
        $price = round((float) $priceRaw, 2);

        $updateStmt = $db->prepare('
            UPDATE products
            SET name = :name, description = :description, price = :price
            WHERE id = :id
        ');

        $updateStmt->bindValue(':name', $name, PDO::PARAM_STR);
        $updateStmt->bindValue(':description', $description, $description !== null ? PDO::PARAM_STR : PDO::PARAM_NULL);
        $updateStmt->bindValue(':price', $price, PDO::PARAM_STR);
        $updateStmt->bindValue(':id', $id, PDO::PARAM_INT);
        $updateStmt->execute();

        // Fetch updated record
        $fetchStmt = $db->prepare('SELECT id, name, description, price, created_at FROM products WHERE id = :id');
        $fetchStmt->bindValue(':id', $id, PDO::PARAM_INT);
        $fetchStmt->execute();
        $updatedProduct = $fetchStmt->fetch();

        $updatedProduct['id'] = (int) $updatedProduct['id'];
        $updatedProduct['price'] = (float) $updatedProduct['price'];

        sendResponse(true, 'Product updated successfully', $updatedProduct, 200);
    } catch (PDOException $e) {
        error_log('Database Error (PUT Product): ' . $e->getMessage());
        sendResponse(false, 'Failed to update product', null, 500);
    }
}

/**
 * Handles DELETE requests: Delete a product by ID.
 */
function handleDelete(PDO $db): void
{
    $id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);
    if (!$id) {
        sendResponse(false, 'Valid integer "id" parameter is required in query string (e.g. ?id=1)', null, 400);
    }

    try {
        // Check if exists
        $checkStmt = $db->prepare('SELECT id, name FROM products WHERE id = :id');
        $checkStmt->bindValue(':id', $id, PDO::PARAM_INT);
        $checkStmt->execute();
        $existing = $checkStmt->fetch();

        if (!$existing) {
            sendResponse(false, 'Product not found', null, 404);
        }

        $deleteStmt = $db->prepare('DELETE FROM products WHERE id = :id');
        $deleteStmt->bindValue(':id', $id, PDO::PARAM_INT);
        $deleteStmt->execute();

        sendResponse(true, "Product (ID: {$id}) deleted successfully", [
            'deleted_id'   => (int) $id,
            'deleted_name' => $existing['name'],
        ], 200);
    } catch (PDOException $e) {
        error_log('Database Error (DELETE Product): ' . $e->getMessage());
        sendResponse(false, 'Failed to delete product', null, 500);
    }
}

/**
 * Helper to parse raw JSON request body safely.
 */
function getJsonInput(): array
{
    $raw = file_get_contents('php://input');
    if (empty($raw)) {
        return [];
    }

    $data = json_decode($raw, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        sendResponse(false, 'Malformed JSON payload: ' . json_last_error_msg(), null, 400);
    }

    return is_array($data) ? $data : [];
}
