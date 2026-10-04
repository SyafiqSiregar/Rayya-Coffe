# UI/UX Guidelines
**Aplikasi POS Raya Koffie & 439 Carwash**

Dokumen ini menjadi acuan dalam pengembangan antarmuka (User Interface) aplikasi Android, mengadaptasi dari referensi desain Figma yang telah disepakati.

## 1. Referensi Utama
- **Figma**: [Dashboard Sistem Kasir POS Indonesia](https://www.figma.com/design/QGMsPSWFCLEXgKalYbnN60/Dashboard-Sistem-Kasir--POS--Indonesia--Community-?node-id=0-1&p=f&t=VTdTTCmnRqvGGEOL-0)

## 2. Daftar Halaman (Screen Map)

| No | Halaman | Akses | Deskripsi |
|----|---------|-------|-----------|
| 1 | Login | Semua | Halaman login dengan logo Raya Koffie |
| 2 | Dashboard | Admin | Ringkasan pendapatan, pengeluaran, laba bersih, produk terlaris |
| 3 | Transaksi Kasir | Admin, Kasir | Halaman utama kasir: pilih menu/layanan, keranjang, checkout |
| 4 | Keranjang / Checkout | Admin, Kasir | Detail pesanan, notes, diskon, pajak, pembayaran |
| 5 | Halaman Pembayaran | Admin, Kasir | Pilih metode bayar, input nominal cash, hitung kembalian |
| 6 | Kelola Menu | Admin | CRUD menu kafe dan layanan cuci (tambah/edit/hapus) |
| 7 | Riwayat Transaksi | Admin (edit), Kasir (lihat saja) | Daftar semua transaksi, filter tanggal, aksi edit/revisi |
| 8 | Pencatatan Pengeluaran | Admin, Kasir | Input pengeluaran dengan kategori, daftar pengeluaran |
| 9 | Laporan | Admin | Laporan pendapatan & pengeluaran (harian/mingguan/bulanan), terpisah Kafe vs Carwash |
| 10 | Pengaturan Pajak | Admin | Aktifkan/nonaktifkan pajak, atur nama & persentase |
| 11 | Backup & Restore | Admin | Export database, import database, hubungkan Google Drive |

## 3. Strategi Responsive Design (Multi-Device)
Desain UI harus **adjustable** di semua ukuran layar. Tablet adalah perangkat utama, namun aplikasi harus tetap nyaman digunakan di HP maupun Desktop (via emulator atau ChromeOS).

### Breakpoint Ukuran Layar
| Kategori | Lebar Layar | Contoh Device |
|----------|-------------|---------------|
| Compact (HP) | < 600dp | Smartphone biasa |
| Medium (Tablet Portrait) | 600dp - 839dp | Tablet posisi portrait |
| Expanded (Tablet Landscape / Desktop) | >= 840dp | Tablet landscape, Chromebook, Desktop |

### Penyesuaian Layout per Breakpoint

**Expanded (Tablet Landscape / Desktop) — Layout Utama**
- 3 panel: Sidebar Kiri + Konten Tengah + Panel Keranjang Kanan.
- Sidebar selalu terlihat (persistent).
- Grid produk: 3-4 kolom.

**Medium (Tablet Portrait)**
- 2 panel: Sidebar Kiri (lebih sempit) + Konten Tengah.
- Panel Keranjang muncul sebagai bottom sheet atau overlay saat tombol keranjang ditekan.
- Grid produk: 2-3 kolom.

**Compact (HP)**
- Sidebar disembunyikan, diganti dengan hamburger menu (navigation drawer).
- Tampilan 1 panel penuh (konten saja).
- Panel Keranjang menjadi halaman terpisah (navigasi ke halaman checkout).
- Grid produk: 2 kolom.

### Implementasi Teknis
- Menggunakan CSS Media Queries modern (`@media (max-width: 1024px)`, `@media (max-width: 768px)`) untuk adaptasi layout otomatis.
- Komponen UI dibuat modular dengan CSS Grid dan Flexbox untuk skalabilitas tampilan.
- Orientasi landscape dioptimalkan sebagai default untuk tablet Android kasir, dengan dukungan penuh untuk layar sentuh.

## 4. Struktur Layout Utama (Expanded / Tablet Landscape)
Aplikasi POS berjalan optimal dalam posisi **landscape**. Layout dibagi menjadi 3 bagian utama:

### A. Sidebar Kiri (Navigasi)
- Logo Raya Koffie di bagian atas.
- Nama user & badge role (Admin / Kasir).
- Menu navigasi:
  - Dashboard *(Admin only)*
  - Transaksi Kasir
  - Kelola Menu *(Admin only)*
  - Riwayat Transaksi
  - Pengeluaran *(Admin, Kasir)*
  - Laporan *(Admin only)*
  - Pengaturan Pajak *(Admin only)*
  - Backup & Restore *(Admin only)*
  - Logout
- Menu yang tidak sesuai role akan **disembunyikan** (bukan disabled).

### B. Area Konten Tengah (Main Content)
- **Pada halaman Transaksi Kasir:**
  - Tab/Filter untuk memisahkan **Menu Kafe** dan **Layanan Cuci Mobil/Motor**.
  - Kolom pencarian (Search bar) untuk mencari menu dengan cepat.
  - Daftar produk/layanan dalam bentuk *Card Grid* (Kotak-kotak).
- **Pada halaman Dashboard:**
  - Card ringkasan: Pendapatan Kafe, Pendapatan Carwash, Total Pengeluaran, Laba Bersih.
  - Section "Top 5 Produk Terlaris" dalam bentuk daftar bernomor.
- **Pada halaman Laporan:**
  - Filter periode (Harian/Mingguan/Bulanan) dan filter jenis (Kafe / Carwash / Semua).
  - Tabel data transaksi yang rapi.
  - Tombol `Export PDF` dan `Export Excel`.

### C. Panel Kanan (Keranjang / Checkout)
- Terlihat di halaman **Transaksi Kasir**.
- Menampilkan daftar pesanan saat ini.
- Setiap item memiliki tombol `+/-` untuk kuantitas dan ikon **catatan (notes)**.
- Kolom input **diskon** (nominal atau persentase).
- Baris **pajak** ditampilkan otomatis jika diaktifkan di pengaturan.
- Menampilkan **Subtotal**, **Diskon**, **Pajak**, dan **Grand Total**.
- Tombol "Bayar" menuju halaman pembayaran.

## 5. Komponen Spesifik

### Card Menu / Produk
- Gambar/Icon produk, Nama Produk, dan Harga.
- Badge kategori: warna **Oranye** untuk menu Kafe, warna **Biru** untuk layanan Cuci.
- Saat ditekan → item masuk ke panel keranjang.

### Dialog / Modal
- **Modal Catatan Pesanan**: Text field untuk memasukkan notes per item.
- **Modal Konfirmasi Hapus**: Saat Admin menghapus menu atau transaksi.
- **Modal Edit Transaksi**: Form edit jumlah/item pada riwayat transaksi (khusus Admin).
- **Modal Tambah/Edit Menu**: Form input nama, harga, kategori, dan upload gambar.

### Halaman Pembayaran
- Pilih metode: **Cash**, **QRIS**, **Transfer Bank**.
- Jika Cash:
  - Input nominal uang pelanggan.
  - Tampilkan **kembalian** secara otomatis (Uang Pelanggan − Grand Total).
  - Quick-amount buttons (Rp 50.000, Rp 100.000, Uang Pas).
- Jika QRIS/Transfer:
  - Tombol "Konfirmasi Pembayaran Diterima".
- Setelah konfirmasi → tampilkan dialog sukses + opsi "Cetak Struk".

### Halaman Backup & Restore
- Tombol "Export Backup" → simpan ke penyimpanan internal atau Google Drive.
- Tombol "Import Backup" → pilih file dari storage.
- Informasi backup terakhir (tanggal & ukuran file).
