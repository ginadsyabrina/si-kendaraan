<?php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

$SESSION_TIMEOUT = 15 * 60; // 15 menit tidak aktif

session_set_cookie_params([
    "lifetime" => 0,
    "path" => "/",
    "secure" => false,
    "httponly" => true,
    "samesite" => "Lax"
]);
session_start();

// Periksa batas waktu tidak aktif pada setiap permintaan auth.php.
if (isset($_SESSION["last_activity"]) && (time() - (int)$_SESSION["last_activity"]) >= $SESSION_TIMEOUT) {
    $_SESSION = [];
    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(session_name(), "", time() - 42000, $params["path"], "", $params["secure"], $params["httponly"]);
    }
    session_destroy();
    session_start();
}
if (isset($_SESSION["user"])) {
    $_SESSION["last_activity"] = time();
}
require_once "koneksi.php";

function authResponse($success, $message, $data = null, $code = 200) {
    http_response_code($code);
    echo json_encode(["success" => $success, "message" => $message, "data" => $data], JSON_UNESCAPED_UNICODE);
    exit;
}
function currentUser() {
    return $_SESSION["user"] ?? null;
}
$method = $_SERVER["REQUEST_METHOD"];
$input = json_decode(file_get_contents("php://input"), true) ?? [];
$action = $_GET["action"] ?? "";

try {
    if ($method === "GET" && $action === "me") {
        $activeUser = currentUser();
        if (!$activeUser) authResponse(false, "Sesi login telah berakhir. Silakan login kembali.", null, 401);
        authResponse(true, "Status login.", $activeUser);
    }

    if ($method === "POST" && $action === "login") {
        $username = trim($input["username"] ?? "");
        $password = $input["password"] ?? "";
        if ($username === "" || $password === "") authResponse(false, "Username dan password wajib diisi.", null, 422);

        $stmt = $conn->prepare(
            "SELECT u.id, u.pegawai_id, u.username, u.password_hash, u.role, u.status,
                    p.nama, p.nip, p.jabatan, p.opd_id, o.nama_opd
             FROM users u
             INNER JOIN pegawai p ON p.id = u.pegawai_id
             LEFT JOIN perangkat_daerah o ON o.id = p.opd_id
             WHERE u.username = ? LIMIT 1"
        );
        $stmt->bind_param("s", $username);
        $stmt->execute();
        $user = $stmt->get_result()->fetch_assoc();

        if (!$user || $user["status"] !== "Aktif" || !password_verify($password, $user["password_hash"])) {
            authResponse(false, "Username atau password salah, atau akun tidak aktif.", null, 401);
        }
        session_regenerate_id(true);
        unset($user["password_hash"], $user["status"]);
        $_SESSION["user"] = $user;
        $_SESSION["last_activity"] = time();
        authResponse(true, "Login berhasil.", $user);
    }

    if ($method === "POST" && $action === "logout") {
        $_SESSION = [];
        if (ini_get("session.use_cookies")) {
            $params = session_get_cookie_params();
            setcookie(session_name(), "", time() - 42000, $params["path"], "", $params["secure"], $params["httponly"]);
        }
        session_destroy();
        authResponse(true, "Logout berhasil.");
    }

    $user = currentUser();
    if (!$user || $user["role"] !== "administrator") {
        authResponse(false, "Akses hanya untuk Administrator.", null, 403);
    }

    if ($method === "GET" && $action === "users") {
        $result = $conn->query(
            "SELECT p.id AS pegawai_id, p.nama, p.nip, p.jabatan, p.golongan, o.nama_opd,
                    u.id AS user_id, u.username, u.role, u.status
             FROM pegawai p
             LEFT JOIN perangkat_daerah o ON o.id = p.opd_id
             LEFT JOIN users u ON u.pegawai_id = p.id
             ORDER BY p.nama ASC"
        );
        authResponse(true, "Daftar pegawai dan akun berhasil diambil.", $result->fetch_all(MYSQLI_ASSOC));
    }

    if ($method === "POST" && $action === "users") {
        $pegawaiId = (int)($input["pegawai_id"] ?? 0);
        $username = trim($input["username"] ?? "");
        $password = $input["password"] ?? "";
        $role = $input["role"] ?? "";
        if ($pegawaiId <= 0 || $username === "" || strlen($password) < 8 ||
            !in_array($role, ["administrator", "inputer", "viewer"], true)) {
            authResponse(false, "Pegawai, username, password minimal 8 karakter, dan role yang valid wajib diisi.", null, 422);
        }
        $check = $conn->prepare("SELECT id FROM pegawai WHERE id=?");
        $check->bind_param("i", $pegawaiId);
        $check->execute();
        if ($check->get_result()->num_rows === 0) authResponse(false, "Pegawai tidak ditemukan.", null, 404);

        $hash = password_hash($password, PASSWORD_DEFAULT);
        $stmt = $conn->prepare("INSERT INTO users (pegawai_id, username, password_hash, role, status) VALUES (?, ?, ?, ?, 'Aktif')");
        $stmt->bind_param("isss", $pegawaiId, $username, $hash, $role);
        $stmt->execute();
        authResponse(true, "Akun pegawai berhasil dibuat.", ["user_id" => $conn->insert_id], 201);
    }

    if ($method === "PUT" && $action === "users") {
        $userId = (int)($input["user_id"] ?? 0);
        $role = $input["role"] ?? "";
        $status = $input["status"] ?? "";
        if ($userId <= 0 || !in_array($role, ["administrator", "inputer", "viewer"], true) ||
            !in_array($status, ["Aktif", "Tidak Aktif"], true)) {
            authResponse(false, "User ID, role, atau status tidak valid.", null, 422);
        }
        if ($userId === (int)$user["id"] && ($role !== "administrator" || $status !== "Aktif")) {
            authResponse(false, "Anda tidak dapat menurunkan role atau menonaktifkan akun sendiri.", null, 422);
        }
        $stmt = $conn->prepare("UPDATE users SET role=?, status=? WHERE id=?");
        $stmt->bind_param("ssi", $role, $status, $userId);
        $stmt->execute();
        authResponse(true, "Role/status akun berhasil diperbarui.");
    }

    authResponse(false, "Aksi tidak ditemukan.", null, 404);
} catch (mysqli_sql_exception $e) {
    if ($e->getCode() == 1062) authResponse(false, "Username sudah digunakan atau pegawai sudah memiliki akun.", null, 409);
    authResponse(false, "Terjadi kesalahan database.", null, 500);
}
