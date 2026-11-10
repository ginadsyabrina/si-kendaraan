
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

        $nomor = strtoupper(trim($data["nomor_polisi"]));
        $merek = trim($data["merek"]);
        $tipe = trim($data["tipe_model"]);
        $tahun = (int)$data["tahun_produksi"];
        $warna = trim($data["warna"]);
        $kondisi = $data["kondisi"];
        $status = $data["status"];

        if ($tahun < 1901 || $tahun > 2155) {
            responseKendaraan(false, "Tahun produksi tidak valid.", null, 422);
        }

        if (!in_array($kondisi, $kondisiValid, true)) {
            responseKendaraan(false, "Kondisi kendaraan tidak valid.", null, 422);
        }

        if (!in_array($status, $statusValid, true)) {
            responseKendaraan(false, "Status kendaraan tidak valid.", null, 422);
        }

        $pegawaiId = !empty($data["pegawai_id"])
            ? (int)$data["pegawai_id"]
            : null;

        if ($pegawaiId !== null) {
            $check = $conn->prepare("SELECT id FROM pegawai WHERE id = ?");
            $check->bind_param("i", $pegawaiId);
            $check->execute();

            if ($check->get_result()->num_rows === 0) {
                responseKendaraan(false, "Pegawai penanggung jawab tidak ditemukan.", null, 422);
            }
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

            responseKendaraan(
                true,
                "Kendaraan berhasil ditambahkan.",
                ["id" => $conn->insert_id],
                201
            );
        }

        $id = (int)($_GET["id"] ?? 0);

        if ($id <= 0) {
            responseKendaraan(false, "ID kendaraan tidak valid.", null, 400);
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

        responseKendaraan(true, "Data kendaraan berhasil diperbarui.");
    }

    if ($method === "DELETE") {
        $id = (int)($_GET["id"] ?? 0);

        if ($id <= 0) {
            responseKendaraan(false, "ID kendaraan tidak valid.", null, 400);
        }

        $stmt = $conn->prepare("DELETE FROM kendaraan WHERE id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();

        if ($stmt->affected_rows === 0) {
            responseKendaraan(false, "Data kendaraan tidak ditemukan.", null, 404);
        }

        responseKendaraan(true, "Data kendaraan berhasil dihapus.");
    }

    responseKendaraan(false, "Metode request tidak didukung.", null, 405);

} catch (mysqli_sql_exception $e) {
    if ($e->getCode() == 1062) {
        responseKendaraan(false, "Nomor polisi sudah terdaftar.", null, 409);
    }

    responseKendaraan(false, "Terjadi kesalahan database.", null, 500);
}
