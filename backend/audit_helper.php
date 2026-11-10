<?php
// Pencatatan audit non-blocking. Snapshot disimpan sebagai JSON agar struktur tiap modul fleksibel.
function writeAuditLog($conn, $aktivitas, $modul, $recordId = null, $keterangan = null, $dataSebelum = null, $dataSesudah = null) {
    try {
        $user = $_SESSION["user"] ?? [];
        $userId = isset($user["id"]) ? (int)$user["id"] : null;
        $username = (string)($user["username"] ?? "guest");
        $nama = $user["nama"] ?? null;
        $role = (string)($user["role"] ?? "guest");
        $ip = $_SERVER["REMOTE_ADDR"] ?? null;
        $beforeJson = $dataSebelum === null ? null : json_encode($dataSebelum, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        $afterJson = $dataSesudah === null ? null : json_encode($dataSesudah, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

        $stmt = $conn->prepare(
            "INSERT INTO audit_logs
             (user_id, username, nama_pengguna, role, aktivitas, modul, record_id, keterangan, ip_address, data_sebelum, data_sesudah)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        );
        $stmt->bind_param("isssssissss", $userId, $username, $nama, $role, $aktivitas, $modul, $recordId, $keterangan, $ip, $beforeJson, $afterJson);
        $stmt->execute();
        $stmt->close();
    } catch (Throwable $e) {
        error_log("Audit log gagal: " . $e->getMessage());
    }
}
