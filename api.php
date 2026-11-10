<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
require __DIR__ . '/config.php';
$method = $_SERVER['REQUEST_METHOD'];
$resource = $_GET['resource'] ?? '';
$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
$input = json_decode(file_get_contents('php://input'), true) ?? [];

function respond($data, $code=200) { http_response_code($code); echo json_encode($data, JSON_UNESCAPED_UNICODE); exit; }
function requiredFields($data, $fields) {
  foreach ($fields as $field) if (!isset($data[$field]) || trim((string)$data[$field]) === '') respond(['message' => "Field $field wajib diisi."], 422);
}

try {
  if ($resource === 'perangkat-daerah') {
    if ($method === 'GET') {
      respond($pdo->query('SELECT * FROM perangkat_daerah ORDER BY nama_opd')->fetchAll());
    }
    if ($method === 'POST' || $method === 'PUT') {
      requiredFields($input, ['kode_opd','nama_opd','status']);
      if ($method === 'POST') {
        $stmt=$pdo->prepare('INSERT INTO perangkat_daerah (kode_opd,nama_opd,alamat,keterangan,status) VALUES (?,?,?,?,?)');
        $stmt->execute([$input['kode_opd'],$input['nama_opd'],$input['alamat'] ?? null,$input['keterangan'] ?? null,$input['status']]);
        respond(['message'=>'Perangkat daerah berhasil ditambahkan.','id'=>$pdo->lastInsertId()],201);
      }
      if (!$id) respond(['message'=>'ID perangkat daerah tidak valid.'],400);
      $stmt=$pdo->prepare('UPDATE perangkat_daerah SET kode_opd=?,nama_opd=?,alamat=?,keterangan=?,status=? WHERE id=?');
      $stmt->execute([$input['kode_opd'],$input['nama_opd'],$input['alamat'] ?? null,$input['keterangan'] ?? null,$input['status'],$id]);
      respond(['message'=>'Data perangkat daerah berhasil diperbarui.']);
    }
    if ($method === 'DELETE') {
      if (!$id) respond(['message'=>'ID perangkat daerah tidak valid.'],400);
      $stmt=$pdo->prepare('DELETE FROM perangkat_daerah WHERE id=?'); $stmt->execute([$id]);
      respond(['message'=>'Perangkat daerah berhasil dihapus. Pegawai terkait tidak dihapus.']);
    }
  }

  if ($resource === 'pegawai') {
    if ($method === 'GET') {
      $stmt = $pdo->query('SELECT p.*, o.nama_opd, o.kode_opd FROM pegawai p LEFT JOIN perangkat_daerah o ON o.id=p.opd_id ORDER BY p.nama'); respond($stmt->fetchAll());
    }
    if ($method === 'POST' || $method === 'PUT') {
      requiredFields($input, ['nama','nip','jabatan','golongan','lokasi_kerja']);
      $opdId = !empty($input['opd_id']) ? (int)$input['opd_id'] : null;
      if ($method === 'POST') {
        $stmt = $pdo->prepare('INSERT INTO pegawai (nama,nip,jabatan,golongan,lokasi_kerja,opd_id) VALUES (?,?,?,?,?,?)');
        $stmt->execute([$input['nama'],$input['nip'],$input['jabatan'],$input['golongan'],$input['lokasi_kerja'],$opdId]);
        respond(['message'=>'Pegawai berhasil ditambahkan.','id'=>$pdo->lastInsertId()], 201);
      }
      if (!$id) respond(['message'=>'ID pegawai tidak valid.'],400);
      $stmt = $pdo->prepare('UPDATE pegawai SET nama=?, nip=?, jabatan=?, golongan=?, lokasi_kerja=?, opd_id=? WHERE id=?');
      $stmt->execute([$input['nama'],$input['nip'],$input['jabatan'],$input['golongan'],$input['lokasi_kerja'],$opdId,$id]);
      respond(['message'=>'Data pegawai berhasil diperbarui.']);
    }
    if ($method === 'DELETE') {
      if (!$id) respond(['message'=>'ID pegawai tidak valid.'],400);
      $stmt=$pdo->prepare('DELETE FROM pegawai WHERE id=?'); $stmt->execute([$id]); respond(['message'=>'Pegawai berhasil dihapus.']);
    }
  }

  if ($resource === 'kendaraan') {
    if ($method === 'GET') {
      $sql = 'SELECT k.*, p.nama AS nama_pegawai, p.nip, o.nama_opd FROM kendaraan k LEFT JOIN pegawai p ON p.id=k.pegawai_id LEFT JOIN perangkat_daerah o ON o.id=p.opd_id ORDER BY k.id DESC';
      respond($pdo->query($sql)->fetchAll());
    }
    if ($method === 'POST' || $method === 'PUT') {
      requiredFields($input, ['nomor_polisi','merek','tipe_model','tahun_produksi','warna','kondisi','status']);
      $pegawaiId = !empty($input['pegawai_id']) ? (int)$input['pegawai_id'] : null;
      if ($method === 'POST') {
        $stmt=$pdo->prepare('INSERT INTO kendaraan (nomor_polisi,merek,tipe_model,tahun_produksi,warna,kondisi,status,pegawai_id) VALUES (?,?,?,?,?,?,?,?)');
        $stmt->execute([$input['nomor_polisi'],$input['merek'],$input['tipe_model'],$input['tahun_produksi'],$input['warna'],$input['kondisi'],$input['status'],$pegawaiId]);
        respond(['message'=>'Kendaraan berhasil ditambahkan.','id'=>$pdo->lastInsertId()],201);
      }
      if (!$id) respond(['message'=>'ID kendaraan tidak valid.'],400);
      $stmt=$pdo->prepare('UPDATE kendaraan SET nomor_polisi=?, merek=?, tipe_model=?, tahun_produksi=?, warna=?, kondisi=?, status=?, pegawai_id=? WHERE id=?');
      $stmt->execute([$input['nomor_polisi'],$input['merek'],$input['tipe_model'],$input['tahun_produksi'],$input['warna'],$input['kondisi'],$input['status'],$pegawaiId,$id]);
      respond(['message'=>'Data kendaraan berhasil diperbarui.']);
    }
    if ($method === 'DELETE') {
      if (!$id) respond(['message'=>'ID kendaraan tidak valid.'],400);
      $stmt=$pdo->prepare('DELETE FROM kendaraan WHERE id=?'); $stmt->execute([$id]); respond(['message'=>'Kendaraan berhasil dihapus.']);
    }
  }
  respond(['message'=>'Endpoint tidak ditemukan.'],404);
} catch (PDOException $e) {
  $message = $e->getCode() === '23000' ? 'Data duplikat atau masih memiliki relasi yang tidak valid.' : 'Terjadi kesalahan pada database.';
  respond(['message'=>$message],400);
}
