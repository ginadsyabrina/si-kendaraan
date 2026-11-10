CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    username VARCHAR(60) NOT NULL,
    nama_pengguna VARCHAR(150) NULL,
    role VARCHAR(30) NOT NULL,
    aktivitas VARCHAR(80) NOT NULL,
    modul VARCHAR(50) NOT NULL,
    record_id BIGINT NULL,
    keterangan TEXT NULL,
    ip_address VARCHAR(45) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_audit_created_at (created_at),
    INDEX idx_audit_user_id (user_id),
    INDEX idx_audit_modul (modul),
    CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(id)
      ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
