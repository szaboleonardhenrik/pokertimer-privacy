<?php
declare(strict_types=1);

// Egyszerű JSON backend a legénybúcsú oldalhoz.
// GET  api.php?action=get        -> visszaadja a közös állapotot
// POST api.php?action=save       -> elmenti az új állapotot (body: {"state": {...}})

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');

$DATA_FILE = __DIR__ . '/data.json';

function respond($data, int $status = 200): void {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function read_data(string $file): array {
    if (!file_exists($file)) return ['state' => null, 'version' => 0, 'savedAt' => 0];
    $content = @file_get_contents($file);
    if ($content === false || $content === '') return ['state' => null, 'version' => 0, 'savedAt' => 0];
    $data = json_decode($content, true);
    if (!is_array($data)) return ['state' => null, 'version' => 0, 'savedAt' => 0];
    return $data;
}

function write_data_atomic(string $file, array $data): bool {
    $encoded = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    if ($encoded === false) return false;

    $dir = dirname($file);
    $tmp = tempnam($dir, '.state_tmp_');
    if ($tmp === false) return false;

    if (file_put_contents($tmp, $encoded, LOCK_EX) === false) {
        @unlink($tmp);
        return false;
    }
    // atomic replace
    if (!@rename($tmp, $file)) {
        @unlink($tmp);
        return false;
    }
    @chmod($file, 0644);
    return true;
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$action = $_GET['action'] ?? '';

if ($method === 'GET' && $action === 'get') {
    respond(read_data($DATA_FILE));
}

if ($method === 'POST' && $action === 'save') {
    $raw = file_get_contents('php://input');
    if (!$raw) respond(['error' => 'empty body'], 400);

    $body = json_decode($raw, true);
    if (!is_array($body) || !array_key_exists('state', $body)) {
        respond(['error' => 'invalid body, expected {"state": {...}}'], 400);
    }

    // Size guard (500 KB bőven elég egy legénybúcsúnak)
    if (strlen($raw) > 512 * 1024) {
        respond(['error' => 'payload too large'], 413);
    }

    $current = read_data($DATA_FILE);
    $newData = [
        'state'   => $body['state'],
        'version' => (int)($current['version'] ?? 0) + 1,
        'savedAt' => time(),
    ];

    if (!write_data_atomic($DATA_FILE, $newData)) {
        respond(['error' => 'write failed — check folder permissions'], 500);
    }

    respond($newData);
}

respond(['error' => 'unknown action', 'hint' => 'use ?action=get or ?action=save'], 400);
