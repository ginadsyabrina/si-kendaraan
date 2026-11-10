<?php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

require_once "koneksi.php";
require_once "auth_guard.php";
require_once "audit_helper.php";

$method = $_SERVER["REQUEST_METHOD"];
$data = json_decode(file_get_contents("php://input"), true) ?? [];

function response($success, $message, $data = null, $code = 200) {
    http_response_code($code);
    echo json_encode([
        "success" => $success,
        "message" => $message,
        "data" => $data
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Periksa apakah kode atau nama OPD sudah digunakan.
 * Saat edit, kecualikan record yang sedang diedit.
 */
function opdAlreadyExists($conn, $kode, $nama, $excludeId = 0) {
    $stmt = $conn->prepare("
        SELECT id
        FROM perangkat_daerah
        WHERE (LOWER(TRIM(kode_opd)) = LOWER(TRIM(?))
            OR LOWER(TRIM(nama_opd)) = LOWER(TRIM(?)))
          AND id <> ?
        LIMIT 1
    ");
    $stmt->bind_param("ssi", $kode, $nama, $excludeId);
    $stmt->execute();
    return $stmt->get_result()->num_rows > 0;
}

try {
    // READ: Menampilkan dan mencari data OPD
    if ($method === "GET") {
        $search = trim($_GET["search"] ?? "");

        $stmt = $conn->prepare("
            SELECT *
            FROM perangkat_daerah
            WHERE kode_opd LIKE CONCAT('%', ?, '%')
               OR nama_opd LIKE CONCAT('%', ?, '%')
            ORDER BY id ASC
        ");
        $stmt->bind_param("ss", $search, $search);
        $stmt->execute();

        response(true, "Data OPD berhasil diambil", $stmt->get_result()->fetch_all(MYSQLI_ASSOC));
    }

    // CREATE: Menambahkan OPD
    if ($method === "POST") {
        $kode = strtoupper(trim((string)($data["kode_opd"] ?? "")));
        $nama = trim((string)($data["nama_opd"] ?? ""));
        $alamat = trim((string)($data["alamat"] ?? ""));
        $keterangan = trim((string)($data["keterangan"] ?? ""));

        if ($kode === "" || $nama === "") {
            response(false, "Kode dan nama OPD wajib diisi.", null, 422);
        }

        if (mb_strlen($kode) > 50 || mb_strlen($nama) > 150) {
            response(false, "Kode OPD maksimal 50 karakter dan nama OPD maksimal 150 karakter.", null, 422);
        }

        if (opdAlreadyExists($conn, $kode, $nama)) {
            response(false, "Kode atau nama OPD sudah terdaftar.", null, 409);
        }

        $stmt = $conn->prepare("
            INSERT INTO perangkat_daerah
                (kode_opd, nama_opd, alamat, keterangan)
            VALUES (?, ?, ?, ?)
        ");
        $stmt->bind_param("ssss", $kode, $nama, $alamat, $keterangan);
        $stmt->execute();

        $newId = $conn->insert_id;
        $afterStmt = $conn->prepare("SELECT * FROM perangkat_daerah WHERE id = ?");
        $afterStmt->bind_param("i", $newId);
        $afterStmt->execute();
        $afterData = $afterStmt->get_result()->fetch_assoc();

        writeAuditLog(
            $conn,
            "Tambah",
            "OPD",
            $newId,
            "OPD " . $nama . " (" . $kode . ")",
            null,
            $afterData
        );

        response(true, "Data OPD berhasil ditambahkan.", ["id" => $newId], 201);
    }

    // UPDATE: Mengubah OPD
    if ($method === "PUT") {
        // Mendukung ID dari JSON maupun parameter URL.
        $id = filter_var($data["id"] ?? $_GET["id"] ?? null, FILTER_VALIDATE_INT);
        $kode = strtoupper(trim((string)($data["kode_opd"] ?? "")));
        $nama = trim((string)($data["nama_opd"] ?? ""));
        $alamat = trim((string)($data["alamat"] ?? ""));
        $keterangan = trim((string)($data["keterangan"] ?? ""));
        $status = $data["status"] ?? "Aktif";

        if (!$id || $id <= 0 || $kode === "" || $nama === "") {
            response(false, "ID, kode, dan nama OPD wajib diisi dengan benar.", null, 422);
        }

        if (mb_strlen($kode) > 50 || mb_strlen($nama) > 150) {
            response(false, "Kode OPD maksimal 50 karakter dan nama OPD maksimal 150 karakter.", null, 422);
        }

        if (!in_array($status, ["Aktif", "Tidak Aktif"], true)) {
            response(false, "Status OPD tidak valid.", null, 422);
        }

        $beforeStmt = $conn->prepare("SELECT * FROM perangkat_daerah WHERE id = ?");
        $beforeStmt->bind_param("i", $id);
        $beforeStmt->execute();
        $beforeData = $beforeStmt->get_result()->fetch_assoc();

        if (!$beforeData) {
            response(false, "Data OPD tidak ditemukan.", null, 404);
        }

        // Memastikan kode/nama tidak dipakai OPD lain, tetapi nilai milik sendiri boleh tetap.
        if (opdAlreadyExists($conn, $kode, $nama, $id)) {
            response(false, "Kode atau nama OPD sudah digunakan oleh OPD lain.", null, 409);
        }

        $stmt = $conn->prepare("
            UPDATE perangkat_daerah
            SET kode_opd = ?, nama_opd = ?, alamat = ?,
                keterangan = ?, status = ?
            WHERE id = ?
        ");
        $stmt->bind_param("sssssi", $kode, $nama, $alamat, $keterangan, $status, $id);
        $stmt->execute();

        $afterStmt = $conn->prepare("SELECT * FROM perangkat_daerah WHERE id = ?");
        $afterStmt->bind_param("i", $id);
        $afterStmt->execute();
        $afterData = $afterStmt->get_result()->fetch_assoc();

        writeAuditLog(
            $conn,
            "Edit",
            "OPD",
            $id,
            "OPD " . $nama . " (" . $kode . ")",
            $beforeData,
            $afterData
        );

        response(true, "Data OPD berhasil diperbarui.");
    }

    // DELETE: Menghapus OPD
    if ($method === "DELETE") {
        $id = filter_var($_GET["id"] ?? null, FILTER_VALIDATE_INT);

        if (!$id || $id <= 0) {
            response(false, "ID OPD tidak valid.", null, 422);
        }

        $beforeStmt = $conn->prepare("SELECT * FROM perangkat_daerah WHERE id = ?");
        $beforeStmt->bind_param("i", $id);
        $beforeStmt->execute();
        $beforeData = $beforeStmt->get_result()->fetch_assoc();

        if (!$beforeData) {
            response(false, "Data OPD tidak ditemukan.", null, 404);
        }

        $stmt = $conn->prepare("DELETE FROM perangkat_daerah WHERE id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();

        if ($stmt->affected_rows > 0) {
            writeAuditLog($conn, "Hapus", "OPD", $id, "Menghapus data OPD", $beforeData, null);
            response(true, "Data OPD berhasil dihapus.");
        }

        response(false, "Data OPD tidak berhasil dihapus.", null, 404);
    }

    response(false, "Metode tidak didukung.", null, 405);

} catch (mysqli_sql_exception $e) {
    if ((int)$e->getCode() === 1062) {
        response(false, "Kode atau nama OPD sudah terdaftar.", null, 409);
    }

    error_log("OPD API error: " . $e->getMessage());
    response(false, "Terjadi kesalahan database saat memproses data OPD.", null, 500);
} catch (Throwable $e) {
    error_log("OPD API error: " . $e->getMessage());
    response(false, "Terjadi kesalahan pada server.", null, 500);
}
?>
