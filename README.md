# 🚘 SI-KENDARAAN

### Sistem Informasi Kendaraan Dinas Operasional

SI-Kendaraan adalah aplikasi berbasis web untuk mengelola data kendaraan
dinas operasional, pegawai penanggung jawab, dan Perangkat Daerah (OPD).
Aplikasi ini dikembangkan untuk membantu proses pencatatan, pemantauan,
dan pengelolaan administrasi kendaraan dinas secara lebih terstruktur.

------------------------------------------------------------------------

## 📌 Fitur Utama

### 1. Dashboard

-   Menampilkan total kendaraan.
-   Menampilkan jumlah kendaraan dengan kondisi baik.
-   Menampilkan kendaraan yang memerlukan perhatian.
-   Menampilkan jumlah pegawai terdaftar.
-   Menampilkan ringkasan kendaraan terbaru.

### 2. Manajemen Data Kendaraan

-   Menambahkan, melihat, mengubah, dan menghapus data kendaraan.
-   Pencarian berdasarkan nomor polisi, merek, tipe/model kendaraan, dan
    pegawai.
-   Filter berdasarkan kondisi kendaraan.
-   Mengelola status kendaraan.

### 3. Manajemen Data Pegawai

-   Menambahkan, melihat, mengubah, dan menghapus data pegawai.
-   Pencarian berdasarkan nama, NIP, jabatan, golongan, dan lokasi
    kerja.
-   Menghubungkan pegawai dengan Perangkat Daerah.

### 4. Manajemen Perangkat Daerah (OPD)

-   Menambahkan, melihat, mengubah, dan menghapus data OPD.
-   Pencarian berdasarkan kode OPD, nama perangkat daerah, dan alamat.
-   Mengelola status perangkat daerah.

------------------------------------------------------------------------

## 🛠️ Teknologi yang Digunakan

  Teknologi      Kegunaan
  -------------- ---------------------------------------------
  React.js       Pengembangan antarmuka frontend
  JavaScript     Logika aplikasi frontend
  Vite           Development server dan build frontend
  PHP            Backend dan REST-style API
  MySQL          Penyimpanan database
  XAMPP          Lingkungan pengembangan lokal
  CSS            Styling antarmuka
  Git & GitHub   Version control dan penyimpanan source code

------------------------------------------------------------------------

## 🤖 Penggunaan Artificial Intelligence (AI)

AI digunakan sebagai alat bantu selama proses perencanaan, pembelajaran,
pengembangan, debugging, dan dokumentasi SI-Kendaraan.

### Model AI yang Digunakan

-   **Platform:** ChatGPT
-   **Model:** **GPT-6**
-   **Penyedia:** OpenAI
-   **Peran:** Asisten AI untuk membantu proses pengembangan aplikasi.

Keterangan versi model ini mengacu pada model ChatGPT yang digunakan
saat penyusunan dokumentasi ini. Jika model yang digunakan pada sesi
pengembangan lain berbeda, versi tersebut perlu dicatat secara terpisah
agar dokumentasi tetap akurat.

### Bentuk Pemanfaatan AI

1.  **Analisis kebutuhan**
    -   Membantu merumuskan kebutuhan modul kendaraan, pegawai, dan OPD.
    -   Membantu menyusun daftar fitur seperti tambah, lihat, ubah,
        hapus, pencarian, dan filter.
    -   Membantu membagi pekerjaan menjadi tahapan yang lebih mudah
        dikerjakan.
2.  **Pembelajaran teknologi**
    -   Meminta penjelasan konsep React.js, JavaScript, PHP, MySQL, API,
        Git, dan GitHub.
    -   Memahami struktur folder serta alur komunikasi frontend,
        backend, dan database.
    -   Mendapatkan contoh penerapan konsep pemrograman.
3.  **Bantuan penulisan kode**
    -   Membantu menyusun dan memperbaiki contoh komponen React.
    -   Membantu memahami endpoint PHP untuk pengelolaan data.
    -   Membantu memahami query SQL dan relasi antartabel.
    -   Memberikan saran validasi input dan penanganan respons API.
4.  **Debugging dan pemecahan masalah**
    -   Membantu menganalisis pesan error dari Terminal, browser, PHP,
        dan React.
    -   Menjelaskan kemungkinan penyebab masalah.
    -   Memberikan langkah pemeriksaan dan perbaikan secara bertahap.
5.  **Dokumentasi dan version control**
    -   Membantu menyusun dokumentasi proyek dan README.
    -   Memberikan panduan penggunaan Git dan GitHub.
    -   Membantu menyiapkan deskripsi fitur dan rencana pengembangan.

### Contoh Pemanfaatan AI

Contoh instruksi yang dapat digunakan selama pengembangan: - "Jelaskan
cara kerja state dan komponen React pada halaman Data Kendaraan." -
"Bantu analisis error PHP pada endpoint kendaraan." - "Buat contoh API
PHP untuk pencarian data pegawai menggunakan MySQL." - "Jelaskan cara
menghubungkan React.js dengan API PHP." - "Bantu periksa alur tambah,
edit, dan hapus data tanpa menghilangkan fitur yang sudah berjalan." -
"Jelaskan langkah mengunggah project ke GitHub."

Contoh tersebut menggambarkan jenis bantuan yang dapat diberikan AI dan
bukan klaim bahwa seluruh instruksi tersebut telah digunakan.

### Verifikasi dan Tanggung Jawab Developer

Setiap saran atau kode yang dihasilkan AI harus ditinjau dan diuji
sebelum digunakan. Pemeriksaan meliputi: - Memastikan kode sesuai dengan
kebutuhan dan struktur proyek. - Memeriksa sintaks JavaScript dan PHP. -
Menguji endpoint API dan koneksi database. - Menguji proses tambah,
lihat, ubah, dan hapus data. - Memastikan pencarian dan filter
memberikan hasil yang sesuai. - Memastikan perubahan tidak menghilangkan
fitur yang sudah berfungsi. - Tidak memasukkan password, token, API key,
atau data pribadi ke dalam prompt AI. - Tidak mengunggah kredensial atau
data sensitif ke repository publik.

AI dapat menghasilkan jawaban yang keliru, tidak lengkap, atau tidak
sesuai dengan lingkungan proyek. AI tidak menggantikan pemahaman,
pengujian, maupun tanggung jawab developer.

### Pernyataan Penggunaan AI

Dalam pengembangan SI-Kendaraan, ChatGPT dengan model GPT-6 digunakan
sebagai alat bantu untuk pembelajaran, analisis, penyusunan kode,
pemecahan masalah, dan dokumentasi. Saran AI ditinjau dan diuji kembali
sebelum diterapkan. Integrasi, pengujian, pemeliharaan, dan tanggung
jawab atas hasil akhir aplikasi tetap berada pada developer.

------------------------------------------------------------------------

## 📂 Struktur Project

``` text
si-kendaraan/
│
├── backend/
│   ├── koneksi.php
│   ├── kendaraan.php
│   ├── pegawai.php
│   └── opd.php
│
├── src/
│   ├── pages/
│   │   └── Pegawai.jsx
│   ├── App.jsx
│   ├── main.jsx
│   └── style.css
│
├── index.html
├── package.json
├── .gitignore
└── README.md
```

*Struktur di atas merupakan gambaran struktur utama proyek. File lain
dapat ditambahkan sesuai perkembangan aplikasi.*

------------------------------------------------------------------------

## ⚙️ Persyaratan Sistem

Pastikan perangkat sudah memiliki: - Node.js dan npm. - PHP 8 atau versi
yang kompatibel. - MySQL. - XAMPP. - Git.

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

### 4. Konfigurasi Database

1.  Jalankan Apache dan MySQL melalui XAMPP.
2.  Buka phpMyAdmin di `http://localhost/phpmyadmin`.
3.  Buat database dengan nama:

``` text
db_kendaraan_dinas
```

4.  Import struktur database dan data awal yang telah disiapkan. File
    database tidak disertakan dalam repository apabila berisi data
    pribadi atau sensitif.

### 5. Konfigurasi Koneksi PHP

Periksa file `backend/koneksi.php` dan sesuaikan konfigurasi database
lokal:

``` php
$host = "localhost";
$user = "root";
$password = "";
$database = "db_kendaraan_dinas";
```

Sesuaikan username dan password dengan konfigurasi MySQL pada perangkat
masing-masing. Jangan menyimpan kredensial produksi di repository
publik.

### 6. Jalankan Aplikasi React

``` bash
npm run dev
```

Buka browser di:

``` text
http://localhost:5173
```

### 7. Akses Backend API

Endpoint API yang tersedia:

  Modul              Endpoint
  ------------------ ------------------------------------------------------
  Kendaraan          `http://localhost/sikendaraan/backend/kendaraan.php`
  Pegawai            `http://localhost/sikendaraan/backend/pegawai.php`
  Perangkat Daerah   `http://localhost/sikendaraan/backend/opd.php`

------------------------------------------------------------------------

## 🗄️ Database

Database menggunakan MySQL dengan tiga tabel utama:

1.  `kendaraan` -- menyimpan informasi kendaraan dinas.
2.  `pegawai` -- menyimpan informasi pegawai penanggung jawab.
3.  `perangkat_daerah` -- menyimpan informasi organisasi perangkat
    daerah.

Relasi antartabel menggunakan foreign key untuk menghubungkan kendaraan
dengan pegawai dan pegawai dengan perangkat daerah.

------------------------------------------------------------------------

## 🔄 Rencana Pengembangan Selanjutnya

-   Sistem autentikasi dan login pengguna.
-   Hak akses Administrator dan User.
-   Laporan data kendaraan.
-   Export data ke Excel dan PDF.
-   Riwayat pemeliharaan kendaraan.
-   Dashboard statistik yang lebih lengkap.

------------------------------------------------------------------------

## 👩‍💻 Developer

**Gina Devita Syabrina**

**Project:** SI-Kendaraan -- Sistem Informasi Kendaraan Dinas
Operasional\
**GitHub:** [ginadsyabrina](https://github.com/ginadsyabrina)\
**Repository:**
[si-kendaraan](https://github.com/ginadsyabrina/si-kendaraan)

------------------------------------------------------------------------

*Dikembangkan sebagai proyek pembelajaran dan simulasi pengembangan
aplikasi administrasi pengelolaan aset daerah.*
