
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

function responsePegawai($success, $message, $data = null) {
    echo json_encode([
        "success" => $success,
        "message" => $message,
        "data" => $data
    ]);
    exit;
}


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
         INNER JOIN perangkat_daerah d
            ON p.opd_id = d.id
         WHERE
            p.nama LIKE ?
            OR p.nip LIKE ?
            OR p.jabatan LIKE ?
            OR d.nama_opd LIKE ?
         ORDER BY p.id DESC"
    );

    $stmt->bind_param(
        "ssss",
        $keyword,
        $keyword,
        $keyword,
        $keyword
    );

    $stmt->execute();

    $result = $stmt->get_result();
    $rows = [];

    while ($row = $result->fetch_assoc()) {
        $rows[] = $row;
    }

    responsePegawai(
        true,
        "Data pegawai berhasil ditampilkan",
        $rows
    );
}



// CREATE
if ($method === "POST") {

    $nama = trim($data["nama"] ?? "");
    $nip = trim($data["nip"] ?? "");
    $jabatan = trim($data["jabatan"] ?? "");
    $golongan = trim($data["golongan"] ?? "");
    $lokasi = trim($data["lokasi_kerja"] ?? "");
    $opd_id = (int)($data["opd_id"] ?? 0);

    if (
        $nama === "" || $nip === "" ||
        $jabatan === "" || $golongan === "" ||
        $opd_id <= 0
    ) {
        http_response_code(422);
        responsePegawai(false, "Semua field wajib diisi kecuali lokasi kerja");
    }

    $stmt = $conn->prepare(
        "INSERT INTO pegawai
        (nama, nip, jabatan, golongan, lokasi_kerja, opd_id)
        VALUES (?, ?, ?, ?, ?, ?)"
    );

    $stmt->bind_param(
        "sssssi",
        $nama, $nip, $jabatan, $golongan, $lokasi, $opd_id
    );

    if ($stmt->execute()) {
        responsePegawai(true, "Pegawai berhasil ditambahkan");
    }

    http_response_code(400);
    responsePegawai(false, "Gagal menambahkan pegawai. NIP mungkin sudah terdaftar.");
}

// UPDATE
if ($method === "PUT") {

    $id = (int)($data["id"] ?? 0);
    $nama = trim($data["nama"] ?? "");
    $nip = trim($data["nip"] ?? "");
    $jabatan = trim($data["jabatan"] ?? "");
    $golongan = trim($data["golongan"] ?? "");
    $lokasi = trim($data["lokasi_kerja"] ?? "");
    $opd_id = (int)($data["opd_id"] ?? 0);

    if (
        $id <= 0 || $nama === "" || $nip === "" ||
        $jabatan === "" || $golongan === "" || $opd_id <= 0
    ) {
        http_response_code(422);
        responsePegawai(false, "Data pegawai belum lengkap");
    }

    $stmt = $conn->prepare(
        "UPDATE pegawai
         SET nama=?, nip=?, jabatan=?, golongan=?,
             lokasi_kerja=?, opd_id=?
         WHERE id=?"
    );

    $stmt->bind_param(
        "sssssii",
        $nama, $nip, $jabatan, $golongan,
        $lokasi, $opd_id, $id
    );

    if ($stmt->execute()) {
        responsePegawai(true, "Data pegawai berhasil diperbarui");
    }

    http_response_code(400);
    responsePegawai(false, "Gagal memperbarui data pegawai");
}

// DELETE
if ($method === "DELETE") {

    $id = (int)($_GET["id"] ?? 0);

    if ($id <= 0) {
        http_response_code(422);
        responsePegawai(false, "ID pegawai tidak valid");
    }

    $stmt = $conn->prepare(
        "DELETE FROM pegawai WHERE id=?"
    );

    $stmt->bind_param("i", $id);

    if ($stmt->execute() && $stmt->affected_rows > 0) {
        responsePegawai(true, "Data pegawai berhasil dihapus");
    }

    http_response_code(404);
    responsePegawai(false, "Data pegawai tidak ditemukan");
}

http_response_code(405);
responsePegawai(false, "Metode tidak didukung");

?>

