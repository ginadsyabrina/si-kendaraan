<?php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") { http_response_code(200); exit; }
session_set_cookie_params(["lifetime"=>0,"path"=>"/","secure"=>false,"httponly"=>true,"samesite"=>"Lax"]);
session_start();
require_once "koneksi.php";
$user = $_SESSION["user"] ?? null;
if (!$user || ($user["role"] ?? "") !== "administrator") {
    http_response_code(403);
    echo json_encode(["success"=>false,"message"=>"Akses hanya untuk Administrator.","data"=>null]);
    exit;
}
if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    http_response_code(405);
    echo json_encode(["success"=>false,"message"=>"Metode tidak didukung.","data"=>null]);
    exit;
}
$limit = max(1, min(500, (int)($_GET["limit"] ?? 200)));
$search = trim($_GET["search"] ?? "");
$keyword = "%" . $search . "%";
$stmt = $conn->prepare(
    "SELECT id, user_id, username, nama_pengguna, role, aktivitas, modul,
            record_id, keterangan, ip_address, created_at,
            data_sebelum, data_sesudah
     FROM audit_logs
     WHERE username LIKE ? OR nama_pengguna LIKE ? OR aktivitas LIKE ?
        OR modul LIKE ? OR keterangan LIKE ?
     ORDER BY id DESC LIMIT ?"
);
$stmt->bind_param("sssssi", $keyword, $keyword, $keyword, $keyword, $keyword, $limit);
$stmt->execute();
$rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
echo json_encode(["success"=>true,"message"=>"Riwayat aktivitas berhasil diambil.","data"=>$rows], JSON_UNESCAPED_UNICODE);
