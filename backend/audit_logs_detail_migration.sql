-- Jalankan sekali melalui phpMyAdmin pada database db_kendaraan_dinas.
-- Jika kolom sudah ada, jangan jalankan ulang.
ALTER TABLE audit_logs
    ADD COLUMN data_sebelum LONGTEXT NULL AFTER ip_address,
    ADD COLUMN data_sesudah LONGTEXT NULL AFTER data_sebelum;
