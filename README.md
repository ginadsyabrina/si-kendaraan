# 🚘 SI-KENDARAAN

### Sistem Informasi Kendaraan Dinas Operasional

SI-Kendaraan adalah aplikasi berbasis web untuk mengelola data kendaraan
dinas operasional, pegawai penanggung jawab, dan Perangkat Daerah (OPD).
Aplikasi ini membantu pencatatan, pemantauan, pengelolaan administrasi,
serta penelusuran aktivitas perubahan data kendaraan.

**Repository:**
[ginadsyabrina/si-kendaraan](https://github.com/ginadsyabrina/si-kendaraan)

------------------------------------------------------------------------

## 📌 Fitur Aplikasi

### 1. Dashboard Statistik

-   Menampilkan total kendaraan dan jumlah pegawai.
-   Menampilkan ringkasan kondisi kendaraan: baik, rusak ringan, dan
    rusak berat.
-   Menampilkan ringkasan status kendaraan: aktif, tidak aktif, dan
    dalam perbaikan.
-   Menyediakan filter berdasarkan Perangkat Daerah (OPD).
-   Menampilkan grafik kondisi kendaraan, status kendaraan, jumlah
    kendaraan per OPD, dan jumlah pegawai per OPD.
-   Menampilkan daftar kendaraan terbaru.

### 2. Manajemen Data Kendaraan

-   Tambah, lihat, ubah, dan hapus data kendaraan sesuai hak akses.
-   Pencarian data kendaraan.
-   Validasi kolom wajib, tahun produksi, kondisi, dan status.
-   Validasi nomor polisi agar tidak kosong atau duplikat; format nomor
    polisi dinormalisasi sebelum pemeriksaan.
-   Menghubungkan kendaraan dengan pegawai penanggung jawab yang
    terdaftar.

### 3. Manajemen Data Pegawai

-   Tambah, lihat, ubah, dan hapus data pegawai sesuai hak akses.
-   Pencarian data pegawai.
-   Validasi kolom wajib, NIP duplikat, dan keterkaitan dengan OPD.
-   Menghubungkan pegawai dengan Perangkat Daerah.

### 4. Manajemen Perangkat Daerah (OPD)

-   Tambah, lihat, ubah, dan hapus data OPD sesuai hak akses.
-   Pencarian data OPD.
-   Validasi kode OPD dan nama OPD agar tidak duplikat.
-   Mengelola status aktif dan tidak aktif.

### 5. Autentikasi dan Manajemen Pengguna

-   Login dan logout menggunakan akun terdaftar.
-   Akun dibuat oleh Administrator melalui data pegawai yang sudah
    terdaftar; tidak tersedia pendaftaran mandiri.
-   Satu pegawai hanya dapat memiliki satu akun.
-   Pengaturan peran pengguna: `administrator`, `inputer`, dan `viewer`.
-   Administrator dapat mengelola akun, peran, dan status akun.
-   Password disimpan dalam bentuk hash menggunakan mekanisme password
    hashing PHP.
-   Sesi pengguna berakhir otomatis setelah 15 menit tidak aktif.

**Hak akses pengguna:**

  -----------------------------------------------------------------------
  Peran                               Hak akses
  ----------------------------------- -----------------------------------
  `administrator`                     Akses penuh, termasuk mengelola
                                      akun serta tambah, lihat, ubah, dan
                                      hapus data.

  `inputer`                           Melihat, menambah, dan mengubah
                                      data; tidak dapat menghapus data
                                      atau mengelola akun.

  `viewer`                            Hanya dapat melihat data.
  -----------------------------------------------------------------------

Hak akses diperiksa pada backend, bukan hanya dengan menyembunyikan menu
pada frontend.

### 6. Audit Log / Riwayat Aktivitas

-   Mencatat aktivitas login dan logout serta perubahan data.
-   Mencatat pengguna, peran, modul, jenis aktivitas, waktu, alamat IP,
    dan deskripsi.
-   Merekam snapshot data sebelum dan sesudah perubahan untuk aktivitas
    yang mendukungnya.
-   Menyediakan pencarian dan filter riwayat aktivitas.
-   Menyediakan filter rentang tanggal.
-   Mendukung ekspor riwayat aktivitas ke CSV yang dapat dibuka dengan
    aplikasi spreadsheet.
-   Halaman Audit Log hanya tersedia untuk Administrator.

### 7. Riwayat Perubahan Kendaraan

-   Menampilkan timeline aktivitas berdasarkan kendaraan yang dipilih.
-   Menampilkan aktivitas tambah, edit, dan hapus yang tercatat pada
    Audit Log.
-   Menampilkan pengguna, waktu aktivitas, dan detail perubahan.
-   Detail perubahan menampilkan perbandingan data sebelum dan sesudah
    perubahan jika tersedia.

**Catatan:** Riwayat yang ditampilkan bergantung pada catatan Audit Log
yang tersedia. Log lama sebelum pencatatan snapshot diterapkan mungkin
tidak memiliki detail sebelum/sesudah.

------------------------------------------------------------------------

## 🛠️ Teknologi yang Digunakan

  Teknologi         Kegunaan
  ----------------- ---------------------------------------------
  React.js          Pengembangan antarmuka frontend
  JavaScript        Logika aplikasi frontend
  Vite              Development server dan build frontend
  PHP               Backend dan API
  MySQL / MariaDB   Penyimpanan database
  XAMPP             Lingkungan pengembangan lokal
  CSS               Styling antarmuka
  Git & GitHub      Version control dan penyimpanan source code

------------------------------------------------------------------------

## 📂 Struktur Project

Struktur utama proyek saat ini:

``` text
si-kendaraan/
├── backend/
│   ├── koneksi.php
│   ├── kendaraan.php
│   ├── pegawai.php
│   ├── opd.php
│   ├── auth.php
│   ├── auth_guard.php
│   ├── audit_helper.php
│   ├── audit_logs.php
│   ├── database_users.sql
│   ├── audit_logs.sql
│   └── audit_logs_detail_migration.sql
├── src/
│   ├── components/
│   │   └── dashboard/
│   │       └── Dashboard.jsx
│   ├── App.jsx
│   ├── main.jsx
│   └── style.css
├── index.html
├── package.json
├── .gitignore
└── README.md
```

Struktur di atas menggambarkan file utama yang digunakan. File
konfigurasi atau komponen lain dapat ditambahkan seiring perkembangan
aplikasi.

------------------------------------------------------------------------

## ⚙️ Persyaratan Sistem

Pastikan perangkat telah memiliki:

-   Node.js dan npm.
-   PHP 8 atau versi yang kompatibel dengan kode backend.
-   MySQL atau MariaDB.
-   XAMPP atau lingkungan server PHP/MySQL yang setara.
-   Git.

------------------------------------------------------------------------

## 🚀 Instalasi dan Menjalankan Aplikasi

### 1. Clone Repository

``` bash
git clone https://github.com/ginadsyabrina/si-kendaraan.git
```

### 2. Masuk ke Folder Project

``` bash
cd si-kendaraan
```

### 3. Install Dependencies

``` bash
npm install
```

### 4. Siapkan Database

1.  Jalankan Apache dan MySQL melalui XAMPP.
2.  Buka phpMyAdmin melalui `http://localhost/phpmyadmin`.
3.  Buat database bernama:

``` text
db_kendaraan_dinas
```

4.  Siapkan tabel inti aplikasi (`kendaraan`, `pegawai`, dan
    `perangkat_daerah`) sesuai skema proyek.
5.  Import file skema/migrasi yang tersedia di folder `backend` sesuai
    kebutuhan dan urutan penerapannya:
    -   `database_users.sql` untuk struktur tabel akun pengguna.
    -   `audit_logs.sql` untuk struktur tabel Audit Log.
    -   `audit_logs_detail_migration.sql` untuk menambahkan dukungan
        snapshot sebelum/sesudah pada Audit Log.

> File SQL skema/migrasi ditujukan untuk menyiapkan struktur database.
> Backup database operasional yang berisi data pengguna atau data
> pribadi tidak boleh diunggah ke repository publik. Lakukan backup
> database secara terpisah dan simpan di lokasi yang aman.

### 5. Konfigurasi Koneksi PHP

Periksa `backend/koneksi.php` dan sesuaikan konfigurasi database lokal.
Contoh konfigurasi:

``` php
$host = "localhost";
$user = "root";
$password = "";
$database = "db_kendaraan_dinas";
```

Sesuaikan username dan password dengan konfigurasi MySQL/MariaDB pada
perangkat masing-masing. Jangan menyimpan kredensial produksi, password,
token, atau API key di repository publik.

### 6. Jalankan Backend

Pastikan Apache dan MySQL aktif di XAMPP. Dengan struktur folder proyek
di `htdocs`, endpoint backend dapat diakses melalui alamat lokal,
misalnya:

``` text
http://localhost/sikendaraan/backend/kendaraan.php
```

### 7. Jalankan Frontend React

Dari folder utama proyek, jalankan:

``` bash
npm run dev
```

Buka alamat yang ditampilkan Vite, biasanya:

``` text
http://localhost:5173
```

------------------------------------------------------------------------

## 🔌 Endpoint Backend

  -------------------------------------------------------------------------------------------
  Modul                               Endpoint
  ----------------------------------- -------------------------------------------------------
  Kendaraan                           `http://localhost/sikendaraan/backend/kendaraan.php`

  Pegawai                             `http://localhost/sikendaraan/backend/pegawai.php`

  Perangkat Daerah                    `http://localhost/sikendaraan/backend/opd.php`

  Autentikasi dan akun                `http://localhost/sikendaraan/backend/auth.php`

  Audit Log                           `http://localhost/sikendaraan/backend/audit_logs.php`
  -------------------------------------------------------------------------------------------

Endpoint tertentu memerlukan sesi login dan hak akses yang sesuai.

------------------------------------------------------------------------

## 🗄️ Struktur Database

Database `db_kendaraan_dinas` menggunakan tabel utama berikut:

  -----------------------------------------------------------------------
  Tabel                               Kegunaan
  ----------------------------------- -----------------------------------
  `kendaraan`                         Menyimpan informasi kendaraan dinas
                                      dan pegawai penanggung jawab.

  `pegawai`                           Menyimpan informasi pegawai dan
                                      relasinya dengan OPD.

  `perangkat_daerah`                  Menyimpan informasi organisasi
                                      perangkat daerah.

  `users`                             Menyimpan akun login, relasi
                                      pegawai, peran, dan status akun.

  `audit_logs`                        Menyimpan catatan aktivitas dan
                                      perubahan data.
  -----------------------------------------------------------------------

Relasi antartabel menggunakan foreign key untuk menghubungkan kendaraan
dengan pegawai dan pegawai dengan perangkat daerah. Tabel pengguna
menghubungkan akun dengan data pegawai.

------------------------------------------------------------------------

## 🔐 Keamanan dan Pengelolaan Data

-   Akses API dilindungi pemeriksaan sesi dan peran pengguna.
-   Sesi berakhir setelah 15 menit tidak aktif.
-   Password akun disimpan dalam bentuk hash, bukan teks biasa.
-   Validasi data dilakukan pada backend.
-   Jangan mengunggah file backup database operasional ke repository
    publik.
-   Jangan memasukkan password, hash password, NIP, token, atau data
    pribadi ke dalam dokumentasi publik.
-   Simpan backup aplikasi dan database di lokasi terpisah yang aman.
-   Setelah melakukan perubahan skema database, lakukan backup terlebih
    dahulu dan uji migrasi pada lingkungan pengembangan.

------------------------------------------------------------------------

## 🧪 Pemeriksaan Setelah Instalasi

Setelah aplikasi dijalankan, lakukan pemeriksaan berikut:

1.  Pastikan frontend dapat dibuka.
2.  Pastikan koneksi backend ke database berhasil.
3.  Uji login dan logout.
4.  Uji hak akses Administrator, Inputer, dan Viewer.
5.  Uji tambah, lihat, ubah, dan hapus data sesuai hak akses.
6.  Uji validasi nomor polisi, NIP, kode OPD, dan nama OPD duplikat.
7.  Uji pencarian dan filter dashboard.
8.  Uji pencatatan Audit Log dan detail perubahan.
9.  Uji ekspor Audit Log ke CSV.
10. Uji logout otomatis setelah 15 menit tidak aktif.

------------------------------------------------------------------------

## 🔄 Rencana Pengembangan Selanjutnya

Fitur berikut dapat menjadi prioritas pada pengembangan versi
berikutnya:

-   Modul pemeliharaan dan servis kendaraan.
-   Jadwal servis berkala dan pengingat perawatan.
-   Pencatatan biaya pemeliharaan kendaraan.
-   Upload foto kendaraan dan dokumen pendukung.
-   Laporan kendaraan dan ekspor ke Excel/PDF.
-   Pengembangan laporan dan analisis dashboard.

------------------------------------------------------------------------

## 🤖 Penggunaan Artificial Intelligence (AI)

AI digunakan sebagai alat bantu selama proses perencanaan, pembelajaran,
pengembangan, debugging, dan dokumentasi SI-Kendaraan.

### Model AI yang Digunakan

-   **Platform:** ChatGPT
-   **Model:** GPT-6
-   **Penyedia:** OpenAI
-   **Peran:** Asisten AI untuk membantu proses pengembangan aplikasi.

Keterangan model mengacu pada model ChatGPT yang digunakan saat
penyusunan dokumentasi ini. Model yang digunakan pada sesi pengembangan
lain dapat berbeda.

### Bentuk Pemanfaatan AI

1.  **Analisis kebutuhan:** membantu merumuskan kebutuhan modul, fitur,
    dan tahapan pekerjaan.
2.  **Pembelajaran teknologi:** membantu memahami React.js, JavaScript,
    PHP, MySQL, API, Git, dan GitHub.
3.  **Bantuan penulisan kode:** membantu menyusun dan memperbaiki
    komponen React, endpoint PHP, query SQL, validasi, dan penanganan
    respons API.
4.  **Debugging:** membantu menganalisis pesan error dari Terminal,
    browser, PHP, dan React serta menyusun langkah pemeriksaan.
5.  **Dokumentasi dan version control:** membantu menyusun README,
    dokumentasi fitur, dan panduan Git/GitHub.

### Verifikasi dan Tanggung Jawab Developer

Setiap saran atau kode yang dihasilkan AI harus ditinjau dan diuji
sebelum digunakan. Pengujian mencakup sintaks, koneksi database,
endpoint API, hak akses, validasi, serta proses CRUD. AI dapat
menghasilkan jawaban yang keliru atau tidak lengkap dan tidak
menggantikan pemahaman, pengujian, maupun tanggung jawab developer.

Dalam pengembangan SI-Kendaraan, ChatGPT digunakan sebagai alat bantu
pembelajaran, analisis, penyusunan kode, pemecahan masalah, dan
dokumentasi. Integrasi, pengujian, pemeliharaan, dan tanggung jawab atas
hasil akhir aplikasi tetap berada pada developer.

------------------------------------------------------------------------

## 👩‍💻 Developer

**Gina Devita Syabrina**

**Project:** SI-Kendaraan --- Sistem Informasi Kendaraan Dinas
Operasional\
**GitHub:** [ginadsyabrina](https://github.com/ginadsyabrina)\
**Repository:**
[si-kendaraan](https://github.com/ginadsyabrina/si-kendaraan)

------------------------------------------------------------------------

*Dikembangkan sebagai proyek pembelajaran dan simulasi pengembangan
aplikasi administrasi pengelolaan aset daerah.*
