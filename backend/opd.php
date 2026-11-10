<?php

header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

require_once "koneksi.php";

$method = $_SERVER["REQUEST_METHOD"];
$data = json_decode(file_get_contents("php://input"), true);

function response($success, $message, $data = null) {
    echo json_encode([
        "success" => $success,
        "message" => $message,
        "data" => $data
    ]);
    exit;
}

// READ: Menampilkan data OPD
if ($method === "GET") {

    $search = $_GET["search"] ?? "";

    $stmt = $conn->prepare(
        "SELECT * FROM perangkat_daerah
         WHERE kode_opd LIKE CONCAT('%', ?, '%')
         OR nama_opd LIKE CONCAT('%', ?, '%')
         ORDER BY id ASC"
    );

    $stmt->bind_param("ss", $search, $search);
    $stmt->execute();

    $result = $stmt->get_result();
    $rows = [];

    while ($row = $result->fetch_assoc()) {
        $rows[] = $row;
    }

    response(true, "Data OPD berhasil diambil", $rows);
}

// CREATE: Menambahkan OPD
if ($method === "POST") {

    $kode = trim($data["kode_opd"] ?? "");
    $nama = trim($data["nama_opd"] ?? "");
    $alamat = trim($data["alamat"] ?? "");
    $keterangan = trim($data["keterangan"] ?? "");

    if ($kode === "" || $nama === "") {
        http_response_code(422);
        response(false, "Kode dan nama OPD wajib diisi");
    }

    $stmt = $conn->prepare(
        "INSERT INTO perangkat_daerah
        (kode_opd, nama_opd, alamat, keterangan)
        VALUES (?, ?, ?, ?)"
    );

    $stmt->bind_param("ssss", $kode, $nama, $alamat, $keterangan);

    if ($stmt->execute()) {
        response(true, "Data OPD berhasil ditambahkan");
    }

    http_response_code(400);
    response(false, "Gagal menambahkan data. Kode atau nama mungkin sudah digunakan.");
}

// UPDATE: Mengubah OPD
if ($method === "PUT") {

    $id = (int)($data["id"] ?? 0);
    $kode = trim($data["kode_opd"] ?? "");
    $nama = trim($data["nama_opd"] ?? "");
    $alamat = trim($data["alamat"] ?? "");
    $keterangan = trim($data["keterangan"] ?? "");
    $status = $data["status"] ?? "Aktif";

    if ($id <= 0 || $kode === "" || $nama === "") {
        http_response_code(422);
        response(false, "Data OPD belum lengkap");
    }

    if (!in_array($status, ["Aktif", "Tidak Aktif"], true)) {
        http_response_code(422);
        response(false, "Status tidak valid");
    }

    $stmt = $conn->prepare(
        "UPDATE perangkat_daerah
         SET kode_opd=?, nama_opd=?, alamat=?,
             keterangan=?, status=?
         WHERE id=?"
    );

    $stmt->bind_param(
        "sssssi",
        $kode, $nama, $alamat, $keterangan, $status, $id
    );

    if ($stmt->execute()) {
        response(true, "Data OPD berhasil diperbarui");
    }

    http_response_code(400);
    response(false, "Gagal memperbarui data OPD");
}

// DELETE: Menghapus OPD
if ($method === "DELETE") {

    $id = (int)($_GET["id"] ?? 0);

    if ($id <= 0) {
        http_response_code(422);
        response(false, "ID OPD tidak valid");
    }

    $stmt = $conn->prepare(
        "DELETE FROM perangkat_daerah WHERE id=?"
    );

    $stmt->bind_param("i", $id);

    if ($stmt->execute() && $stmt->affected_rows > 0) {
        response(true, "Data OPD berhasil dihapus");
    }

    http_response_code(404);
    response(false, "Data OPD tidak ditemukan");
}

http_response_code(405);
response(false, "Metode tidak didukung");

?>
