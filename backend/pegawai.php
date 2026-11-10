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
$data = json_decode(file_get_contents("php://input"), true);
if (!is_array($data)) {
    $data = [];
}

function responsePegawai($success, $message, $data = null, $code = 200) {
    http_response_code($code);
    echo json_encode([
        "success" => $success,
        "message" => $message,
        "data" => $data
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

function validatePegawaiFields($data) {
    $nama = trim((string)($data["nama"] ?? ""));
    $nip = trim((string)($data["nip"] ?? ""));
    $jabatan = trim((string)($data["jabatan"] ?? ""));
    $golongan = trim((string)($data["golongan"] ?? ""));
    $lokasi = trim((string)($data["lokasi_kerja"] ?? ""));
    $opdId = filter_var($data["opd_id"] ?? null, FILTER_VALIDATE_INT);

    if ($nama === "" || $nip === "" || $jabatan === "" || $golongan === "" || !$opdId || $opdId <= 0) {
        responsePegawai(false, "Nama, NIP, jabatan, golongan, dan OPD wajib diisi.", null, 422);
    }

    if (mb_strlen($nama) > 150 || mb_strlen($nip) > 50 || mb_strlen($jabatan) > 100 || mb_strlen($golongan) > 50 || mb_strlen($lokasi) > 150) {
        responsePegawai(false, "Ada data yang melebihi panjang karakter yang diizinkan.", null, 422);
    }

    return [$nama, $nip, $jabatan, $golongan, $lokasi, (int)$opdId];
}

function validateOpdExists($conn, $opdId) {
    $stmt = $conn->prepare("SELECT id FROM perangkat_daerah WHERE id = ?");
    $stmt->bind_param("i", $opdId);
    $stmt->execute();
    if ($stmt->get_result()->num_rows === 0) {
        responsePegawai(false, "Perangkat daerah yang dipilih tidak ditemukan.", null, 422);
    }
}

function validateNipUnique($conn, $nip, $excludeId = null) {
    if ($excludeId === null) {
        $stmt = $conn->prepare("SELECT id FROM pegawai WHERE nip = ? LIMIT 1");
        $stmt->bind_param("s", $nip);
    } else {
        $stmt = $conn->prepare("SELECT id FROM pegawai WHERE nip = ? AND id <> ? LIMIT 1");
        $stmt->bind_param("si", $nip, $excludeId);
    }

    $stmt->execute();
    if ($stmt->get_result()->num_rows > 0) {
        responsePegawai(false, "NIP sudah terdaftar.", null, 409);
    }
}

try {
    // READ: Menampilkan dan mencari data pegawai
    if ($method === "GET") {
        $search = trim($_GET["search"] ?? "");
        $keyword = "%" . $search . "%";

        $stmt = $conn->prepare(
            "SELECT
                p.*,
                d.nama_opd,
                d.kode_opd
             FROM pegawai p
             INNER JOIN perangkat_daerah d ON p.opd_id = d.id
             WHERE p.nama LIKE ?
                OR p.nip LIKE ?
                OR p.jabatan LIKE ?
                OR d.nama_opd LIKE ?
             ORDER BY p.id DESC"
        );

        $stmt->bind_param("ssss", $keyword, $keyword, $keyword, $keyword);
        $stmt->execute();
        $result = $stmt->get_result();
        $rows = [];

        while ($row = $result->fetch_assoc()) {
            $rows[] = $row;
        }

        responsePegawai(true, "Data pegawai berhasil ditampilkan.", $rows);
    }

    // CREATE
    if ($method === "POST") {
        [$nama, $nip, $jabatan, $golongan, $lokasi, $opdId] = validatePegawaiFields($data);

        validateNipUnique($conn, $nip);
        validateOpdExists($conn, $opdId);

        $stmt = $conn->prepare(
            "INSERT INTO pegawai
                (nama, nip, jabatan, golongan, lokasi_kerja, opd_id)
             VALUES (?, ?, ?, ?, ?, ?)"
        );
        $stmt->bind_param("sssssi", $nama, $nip, $jabatan, $golongan, $lokasi, $opdId);
        $stmt->execute();

        $newId = $conn->insert_id;
        $afterStmt = $conn->prepare("SELECT * FROM pegawai WHERE id = ?");
        $afterStmt->bind_param("i", $newId);
        $afterStmt->execute();
        $afterData = $afterStmt->get_result()->fetch_assoc();

        writeAuditLog($conn, "Tambah", "Pegawai", $newId, "Nama pegawai " . $nama, null, $afterData);
        responsePegawai(true, "Pegawai berhasil ditambahkan.", ["id" => $newId], 201);
    }

    // UPDATE
    if ($method === "PUT") {
        $id = filter_var($data["id"] ?? $_GET["id"] ?? null, FILTER_VALIDATE_INT);
        if (!$id || $id <= 0) {
            responsePegawai(false, "ID pegawai tidak valid.", null, 422);
        }

        [$nama, $nip, $jabatan, $golongan, $lokasi, $opdId] = validatePegawaiFields($data);

        $beforeStmt = $conn->prepare("SELECT * FROM pegawai WHERE id = ?");
        $beforeStmt->bind_param("i", $id);
        $beforeStmt->execute();
        $beforeData = $beforeStmt->get_result()->fetch_assoc();

        if (!$beforeData) {
            responsePegawai(false, "Data pegawai tidak ditemukan.", null, 404);
        }

        // Saat edit, NIP milik pegawai yang sedang diedit tidak dianggap duplikat.
        validateNipUnique($conn, $nip, (int)$id);
        validateOpdExists($conn, $opdId);

        $stmt = $conn->prepare(
            "UPDATE pegawai
             SET nama = ?, nip = ?, jabatan = ?, golongan = ?,
                 lokasi_kerja = ?, opd_id = ?
             WHERE id = ?"
        );
        $stmt->bind_param("sssssii", $nama, $nip, $jabatan, $golongan, $lokasi, $opdId, $id);
        $stmt->execute();

        $afterStmt = $conn->prepare("SELECT * FROM pegawai WHERE id = ?");
        $afterStmt->bind_param("i", $id);
        $afterStmt->execute();
        $afterData = $afterStmt->get_result()->fetch_assoc();

        writeAuditLog($conn, "Edit", "Pegawai", $id, "Nama pegawai " . $nama, $beforeData, $afterData);
        responsePegawai(true, "Data pegawai berhasil diperbarui.");
    }

    // DELETE
    if ($method === "DELETE") {
        $id = filter_var($_GET["id"] ?? null, FILTER_VALIDATE_INT);

        if (!$id || $id <= 0) {
            responsePegawai(false, "ID pegawai tidak valid.", null, 422);
        }

        $beforeStmt = $conn->prepare("SELECT * FROM pegawai WHERE id = ?");
        $beforeStmt->bind_param("i", $id);
        $beforeStmt->execute();
        $beforeData = $beforeStmt->get_result()->fetch_assoc();

        if (!$beforeData) {
            responsePegawai(false, "Data pegawai tidak ditemukan.", null, 404);
        }

        $stmt = $conn->prepare("DELETE FROM pegawai WHERE id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();

        if ($stmt->affected_rows > 0) {
            writeAuditLog($conn, "Hapus", "Pegawai", $id, "Menghapus data pegawai", $beforeData, null);
            responsePegawai(true, "Data pegawai berhasil dihapus.");
        }

        responsePegawai(false, "Data pegawai tidak ditemukan.", null, 404);
    }

    responsePegawai(false, "Metode tidak didukung.", null, 405);

} catch (mysqli_sql_exception $e) {
    if ((int)$e->getCode() === 1062) {
        responsePegawai(false, "NIP sudah terdaftar.", null, 409);
    }

    error_log("pegawai.php database error: " . $e->getMessage());
    responsePegawai(false, "Terjadi kesalahan database saat memproses data pegawai.", null, 500);

} catch (Throwable $e) {
    error_log("pegawai.php error: " . $e->getMessage());
    responsePegawai(false, "Terjadi kesalahan saat memproses data pegawai.", null, 500);
}
