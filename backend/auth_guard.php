<?php
// Pemeriksaan autentikasi dan timeout session untuk endpoint data SI-Kendaraan.
if (session_status() !== PHP_SESSION_ACTIVE) {
    session_set_cookie_params([
        "lifetime" => 0,
        "path" => "/",
        "secure" => false, // Ubah menjadi true saat aplikasi menggunakan HTTPS.
        "httponly" => true,
        "samesite" => "Lax"
    ]);
    session_start();
}

$sessionTimeout = 15 * 60;

if (
    !isset($_SESSION["user"]) ||
    !isset($_SESSION["last_activity"]) ||
    (time() - (int)$_SESSION["last_activity"]) >= $sessionTimeout
) {
    $_SESSION = [];
    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(session_name(), "", time() - 42000, $params["path"], "", $params["secure"], $params["httponly"]);
    }
    if (session_status() === PHP_SESSION_ACTIVE) {
        session_destroy();
    }
    http_response_code(401);
    header("Content-Type: application/json; charset=UTF-8");
    echo json_encode([
        "success" => false,
        "message" => "Sesi login telah berakhir. Silakan login kembali.",
        "data" => null
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// Perbarui waktu aktivitas untuk permintaan API yang terautentikasi.
$_SESSION["last_activity"] = time();

$currentUser = $_SESSION["user"];
$method = $_SERVER["REQUEST_METHOD"] ?? "GET";
$role = $currentUser["role"] ?? "";

$allowed = [
    "administrator" => ["GET", "POST", "PUT", "DELETE"],
    "inputer" => ["GET", "POST", "PUT"],
    "viewer" => ["GET"]
];

if (!isset($allowed[$role]) || !in_array($method, $allowed[$role], true)) {
    http_response_code(403);
    header("Content-Type: application/json; charset=UTF-8");
    echo json_encode([
        "success" => false,
        "message" => "Anda tidak memiliki hak akses untuk tindakan ini.",
        "data" => null
    ], JSON_UNESCAPED_UNICODE);
    exit;
}
