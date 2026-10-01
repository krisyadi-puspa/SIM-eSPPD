# PANDUAN INSTALASI SIM-SPPD v1.0

## A. Backend Google Apps Script
1. Buat project baru di Google Apps Script.
2. Buat/paste `Kode.gs`.
3. Pastikan `appsscript.json` menggunakan manifest yang disertakan.
4. Jalankan `setupAppEnvironment()` **sekali saja** dan berikan izin Sheets/Drive.
5. Baca Execution Log. Catat URL Spreadsheet dan folder Drive.
6. Deploy > New deployment > Web app:
   - Execute as: Me
   - Who has access: Anyone
7. Salin URL deployment yang berakhir `/exec`.
8. Uji di browser: `URL_EXEC?action=health`.

## B. Frontend
1. Ekstrak ZIP frontend.
2. Buka `js/config.js`.
3. Isi `GAS_URL` dengan URL `/exec`.
4. Buka `index.html` untuk memeriksa struktur, lalu deploy ke GitHub Pages.

## C. Login awal
Email: `admin@puspahiang.desa.id`
Password: `User1234`

Gunakan `resetAdminPassword('password-baru-yang-kuat')` dari editor GAS untuk mengganti password awal.

## D. GitHub Pages — aturan folder
Folder hasil ekstraksi ZIP frontend **itulah folder yang di-git init**.
Sebelum `git init`, jalankan `dir` (Windows) atau `ls -la` dan pastikan terlihat:
- `index.html`
- `css/`
- `js/`

Jangan push `Kode.gs` atau `appsscript.json` ke repository frontend publik.

## E. Status v1.0
Sudah aktif:
- setup environment + 14 sheet database
- session login + RBAC 5 role
- REST API doGet/doPost JSON
- Dashboard role-aware
- Pengajuan: draft, submit, list, detail, verifikasi
- SPA navigation, local draft, local search/filter, CacheService, batch writes, LockService, audit log

Route Surat Tugas, SPPD, Laporan, Biaya, Arsip sudah disiapkan sebagai placeholder untuk iterasi berikutnya.
