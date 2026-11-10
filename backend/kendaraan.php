
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

function responseKendaraan($success, $message, $data = null, $code = 200) {
    http_response_code($code);
    echo json_encode([
        "success" => $success,
        "message" => $message,
        "data" => $data
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$kondisiValid = ["Baik", "Rusak Ringan", "Rusak Berat"];
$statusValid = ["Aktif", "Tidak Aktif", "Dalam Perbaikan"];

try {
    if ($method === "GET") {
        $search = trim($_GET["search"] ?? "");
        $keyword = "%" . $search . "%";

        $stmt = $conn->prepare("
            SELECT
                k.*,
                p.nama AS nama_pegawai,
                p.nip,
                o.nama_opd
            FROM kendaraan k
            LEFT JOIN pegawai p ON p.id = k.pegawai_id
            LEFT JOIN perangkat_daerah o ON o.id = p.opd_id
            WHERE
                k.nomor_polisi LIKE ?
                OR k.merek LIKE ?
                OR k.tipe_model LIKE ?
                OR p.nama LIKE ?
                OR p.nip LIKE ?
            ORDER BY k.id DESC
        ");

        $stmt->bind_param(
            "sssss",
            $keyword,
            $keyword,
            $keyword,
            $keyword,
            $keyword
        );

        $stmt->execute();
        $result = $stmt->get_result();

        responseKendaraan(
            true,
            "Data kendaraan berhasil diambil.",
            $result->fetch_all(MYSQLI_ASSOC)
        );
    }

    if ($method === "POST" || $method === "PUT") {
        $required = [
            "nomor_polisi",
            "merek",
            "tipe_model",
            "tahun_produksi",
            "warna",
            "kondisi",
            "status"
        ];

        foreach ($required as $field) {
            if (!isset($data[$field]) || trim((string)$data[$field]) === "") {
                responseKendaraan(false, "Field $field wajib diisi.", null, 422);
            }
        }

        // Normalisasi input sebelum validasi dan penyimpanan.
        $nomor = strtoupper(trim((string)$data["nomor_polisi"]));
        $nomor = preg_replace('/\s+/', ' ', $nomor);
        $merek = trim((string)$data["merek"]);
        $tipe = trim((string)$data["tipe_model"]);
        $warna = trim((string)$data["warna"]);
        $kondisi = trim((string)$data["kondisi"]);
        $status = trim((string)$data["status"]);

        // Nomor polisi menerima huruf, angka, dan spasi; panjang 3-15 karakter.
        if (!preg_match('/^[A-Z0-9 ]{3,15}$/', $nomor)) {
            responseKendaraan(false, "Format nomor polisi tidak valid. Gunakan huruf, angka, dan spasi saja.", null, 422);
        }

        // Pastikan tahun benar-benar bilangan bulat dan sesuai tipe YEAR MySQL.
        $tahunInput = filter_var($data["tahun_produksi"], FILTER_VALIDATE_INT);
        if ($tahunInput === false || $tahunInput < 1901 || $tahunInput > 2155) {
            responseKendaraan(false, "Tahun produksi harus berupa angka antara 1901 dan 2155.", null, 422);
        }
        $tahun = (int)$tahunInput;

        if (!in_array($kondisi, $kondisiValid, true)) {
            responseKendaraan(false, "Kondisi kendaraan tidak valid.", null, 422);
        }

        if (!in_array($status, $statusValid, true)) {
            responseKendaraan(false, "Status kendaraan tidak valid.", null, 422);
        }

        $pegawaiId = null;
        if (isset($data["pegawai_id"]) && $data["pegawai_id"] !== "" && $data["pegawai_id"] !== null) {
            $pegawaiInput = filter_var($data["pegawai_id"], FILTER_VALIDATE_INT);
            if ($pegawaiInput === false || $pegawaiInput <= 0) {
                responseKendaraan(false, "ID pegawai penanggung jawab tidak valid.", null, 422);
            }
            $pegawaiId = (int)$pegawaiInput;
        }

        if ($pegawaiId !== null) {
            $check = $conn->prepare("SELECT id FROM pegawai WHERE id = ?");
            $check->bind_param("i", $pegawaiId);
            $check->execute();

            if ($check->get_result()->num_rows === 0) {
                responseKendaraan(false, "Pegawai penanggung jawab tidak ditemukan.", null, 422);
            }
        }

        // Untuk edit, pastikan ID kendaraan valid sebelum memeriksa duplikasi.
        $id = null;
        if ($method === "PUT") {
            $idInput = filter_var($_GET["id"] ?? null, FILTER_VALIDATE_INT);
            if ($idInput === false || $idInput === null || $idInput <= 0) {
                responseKendaraan(false, "ID kendaraan tidak valid.", null, 400);
            }
            $id = (int)$idInput;
        }

        // Cek nomor polisi yang sama, dengan mengecualikan record yang sedang diedit.
        if ($method === "POST") {
            $duplicateStmt = $conn->prepare("SELECT id FROM kendaraan WHERE UPPER(TRIM(nomor_polisi)) = ? LIMIT 1");
            $duplicateStmt->bind_param("s", $nomor);
        } else {
            $duplicateStmt = $conn->prepare("SELECT id FROM kendaraan WHERE UPPER(TRIM(nomor_polisi)) = ? AND id <> ? LIMIT 1");
            $duplicateStmt->bind_param("si", $nomor, $id);
        }
        $duplicateStmt->execute();
        if ($duplicateStmt->get_result()->num_rows > 0) {
            responseKendaraan(false, "Nomor polisi sudah terdaftar.", null, 409);
        }

        if ($method === "POST") {
            $stmt = $conn->prepare("
                INSERT INTO kendaraan
                (nomor_polisi, merek, tipe_model, tahun_produksi,
                 warna, kondisi, status, pegawai_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ");

            $stmt->bind_param(
                "sssisssi",
                $nomor, $merek, $tipe, $tahun,
                $warna, $kondisi, $status, $pegawaiId
            );

            $stmt->execute();
            $newId = $conn->insert_id;
            $afterStmt = $conn->prepare("SELECT * FROM kendaraan WHERE id = ?");
            $afterStmt->bind_param("i", $newId);
            $afterStmt->execute();
            $afterData = $afterStmt->get_result()->fetch_assoc();
            writeAuditLog($conn, "Tambah", "Kendaraan", $newId, "Nomor polisi " . $nomor, null, $afterData);

            responseKendaraan(
                true,
                "Kendaraan berhasil ditambahkan.",
                ["id" => $newId],
                201
            );
        }

        $beforeStmt = $conn->prepare("SELECT * FROM kendaraan WHERE id = ?");
        $beforeStmt->bind_param("i", $id);
        $beforeStmt->execute();
        $beforeData = $beforeStmt->get_result()->fetch_assoc();
        if (!$beforeData) {
            responseKendaraan(false, "Data kendaraan tidak ditemukan.", null, 404);
        }

        $stmt = $conn->prepare("
            UPDATE kendaraan SET
                nomor_polisi = ?,
                merek = ?,
                tipe_model = ?,
                tahun_produksi = ?,
                warna = ?,
                kondisi = ?,
                status = ?,
                pegawai_id = ?
            WHERE id = ?
        ");

        $stmt->bind_param(
            "sssisssii",
            $nomor, $merek, $tipe, $tahun,
            $warna, $kondisi, $status, $pegawaiId, $id
        );

        $stmt->execute();
        $afterStmt = $conn->prepare("SELECT * FROM kendaraan WHERE id = ?");
        $afterStmt->bind_param("i", $id);
        $afterStmt->execute();
        $afterData = $afterStmt->get_result()->fetch_assoc();
        writeAuditLog($conn, "Edit", "Kendaraan", $id, "Nomor polisi " . $nomor, $beforeData, $afterData);

        responseKendaraan(true, "Data kendaraan berhasil diperbarui.");
    }

    if ($method === "DELETE") {
        $id = (int)($_GET["id"] ?? 0);

        if ($id <= 0) {
            responseKendaraan(false, "ID kendaraan tidak valid.", null, 400);
        }

        $beforeStmt = $conn->prepare("SELECT * FROM kendaraan WHERE id = ?");
        $beforeStmt->bind_param("i", $id);
        $beforeStmt->execute();
        $beforeData = $beforeStmt->get_result()->fetch_assoc();
        if (!$beforeData) {
            responseKendaraan(false, "Data kendaraan tidak ditemukan.", null, 404);
        }

        $stmt = $conn->prepare("DELETE FROM kendaraan WHERE id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();

        if ($stmt->affected_rows === 0) {
            responseKendaraan(false, "Data kendaraan tidak ditemukan.", null, 404);
        }
        writeAuditLog($conn, "Hapus", "Kendaraan", $id, "Menghapus data kendaraan", $beforeData, null);

        responseKendaraan(true, "Data kendaraan berhasil dihapus.");
    }

    responseKendaraan(false, "Metode request tidak didukung.", null, 405);

} catch (mysqli_sql_exception $e) {
    if ($e->getCode() == 1062) {
        responseKendaraan(false, "Nomor polisi sudah terdaftar.", null, 409);
    }

    responseKendaraan(false, "Terjadi kesalahan database.", null, 500);
}
