# Detail Bisnis Logic & Fitur
**Aplikasi POS Raya Koffie & 439 Carwash**

Dokumen ini menjelaskan secara detail bagaimana logika dari setiap fitur utama akan bekerja di dalam aplikasi.

---

## 1. Logic Dashboard Pendapatan

### Pendapatan Harian
- Query tabel `transactions` → filter `timestamp` = hari ini, `status` IN (`SUCCESS`, `REVISED`).
- Hasilnya ditampilkan sebagai "Total Pendapatan Hari Ini".

### Breakdown Kafe vs Carwash
- JOIN `transaction_details` ↔ `products`.
- Jika `products.category` = `"CAFE"` → masuk ringkasan **"Pendapatan Raya Koffie"**.
- Jika `products.category` = `"CARWASH"` → masuk ringkasan **"Pendapatan 439 Carwash"**.

### Total Pengeluaran Harian
- Query tabel `expenses` → filter `date` = hari ini.
- Semua amount dijumlahkan.

### Laba Bersih Harian
```
Laba Bersih = Total Pendapatan Hari Ini − Total Pengeluaran Hari Ini
```
- Ditampilkan dengan warna **hijau** jika positif, **merah** jika negatif.

### Top 5 Produk Terlaris
- Query `transaction_details` → GROUP BY `product_id`, SUM `quantity`, ORDER BY jumlah DESC, LIMIT 5.
- Ditampilkan di dashboard sebagai daftar bernomor (Ranking).

---

## 2. Logic Perhitungan Checkout (Keranjang)

### Subtotal
```
Subtotal = Σ (harga_item × kuantitas) untuk semua item di keranjang
```

### Diskon
Admin/Kasir bisa memilih jenis diskon:
- **Persentase**: `Diskon = Subtotal × (persen / 100)`
- **Nominal tetap**: `Diskon = nilai_nominal`

### Pajak
- Ambil data dari tabel `tax_settings` yang `is_active = true`.
- Bisa ada lebih dari satu pajak aktif (misal PB1 + Service Charge).
```
Total Pajak = (Subtotal − Diskon) × (Σ tax_percentage / 100)
```

### Grand Total
```
Grand Total = Subtotal − Diskon + Total Pajak
```

---

## 3. Logic Pembayaran & Kembalian

### Metode Cash
1. Kasir input **nominal uang pelanggan** (`cash_received`).
2. Sistem validasi: `cash_received` harus ≥ `grand_total`.
3. Hitung kembalian:
```
Kembalian = cash_received − grand_total
```
4. Ditampilkan di layar sebelum konfirmasi.
5. Tersedia **quick-amount buttons**: Rp 10.000, Rp 20.000, Rp 50.000, Rp 100.000, dan "Uang Pas".

### Metode QRIS / Transfer
1. Kasir memilih QRIS atau Transfer.
2. Tidak perlu input nominal (karena pasti exact amount).
3. Kasir menekan tombol "Konfirmasi Pembayaran Diterima" setelah memverifikasi secara manual.

### Setelah Pembayaran Berhasil
- Data disimpan ke tabel `transactions` dan `transaction_details`.
- Muncul dialog sukses dengan pilihan: **"Cetak Struk"** atau **"Selesai"**.

---

## 4. Logic Pembatasan Akses (Role-Based Access Control)

Setelah login berhasil, role disimpan ke `SharedPreferences` / `DataStore`.

### Kasir
| Fitur | Akses |
|-------|-------|
| Transaksi Kasir | ✅ Penuh |
| Cetak Struk | ✅ Penuh |
| Riwayat Transaksi | ✅ Lihat saja (tanpa Edit/Hapus) |
| Dashboard | ❌ |
| Kelola Menu | ❌ |
| Pengeluaran | ✅ Input pengeluaran |
| Laporan | ❌ |
| Pengaturan Pajak | ❌ |
| Backup & Restore | ❌ |

### Admin
| Fitur | Akses |
|-------|-------|
| Semua fitur Kasir | ✅ Penuh |
| Dashboard | ✅ Penuh |
| Kelola Menu (CRUD) | ✅ Penuh |
| Edit/Revisi Riwayat Transaksi | ✅ Penuh (status → REVISED) |
| Input Pengeluaran | ✅ Penuh |
| Laporan & Export | ✅ Penuh |
| Pengaturan Pajak | ✅ Penuh |
| Backup & Restore | ✅ Penuh |

---

## 5. Logic Kelola Menu (CRUD Produk)

### Tambah Menu
- Admin mengisi: Nama, Harga, Kategori (Kafe/Carwash), dan Gambar (opsional).
- Validasi: Nama tidak boleh kosong, Harga harus > 0.
- Data disimpan ke tabel `products` dengan `is_active = true`.

### Edit Menu
- Admin bisa mengubah nama, harga, atau gambar.
- Harga baru **tidak** mengubah transaksi lama (karena `transaction_details` menyimpan `subtotal` sendiri).

### Hapus Menu (Soft Delete)
- Menu tidak benar-benar dihapus dari database.
- Field `is_active` diubah menjadi `false`.
- Menu tidak lagi muncul di halaman transaksi kasir, tapi data riwayat transaksi yang mengandung menu tersebut tetap utuh.

---

## 6. Fitur Cetak Struk Bluetooth (ESC/POS)

### Format Struk
```
================================
        RAYA KOFFIE
       & 439 CARWASH
    Jl. [Alamat Kedai]
    Telp. [No. Telepon]
================================
Kasir : [Nama User]
Waktu : [DD/MM/YYYY HH:mm]
No.   : [ID Transaksi]
--------------------------------
Item               Qty    Harga
--------------------------------
Americano            2   30.000
  > Gula setengah
Cuci Mobil           1   50.000
--------------------------------
Subtotal:              110.000
Diskon (10%):          -11.000
PB1 (10%):               9.900
================================
GRAND TOTAL:           108.900
Bayar (Cash):          150.000
Kembalian:              41.100
================================
  Terima kasih telah berkunjung!
        @rayakoffie
================================
```

### Alur Teknis
1. Scan & pair perangkat Bluetooth printer.
2. Koneksi via `BluetoothSocket`.
3. Kirim byte array format ESC/POS (bold, align center, cut paper).
4. Handle error: printer tidak ditemukan / kertas habis → tampilkan notifikasi.

---

## 7. Logic Export Laporan (PDF & Excel)

### Data yang Di-export
| Kolom | Sumber |
|-------|--------|
| No | Auto-increment baris |
| Tanggal | `transactions.timestamp` |
| ID Transaksi | `transactions.id` |
| Jenis | Kafe / Carwash (dari `products.category`) |
| Item | Daftar produk dari `transaction_details` |
| Total | `transactions.grand_total` |
| Kasir | `users.username` |
| Metode Bayar | `transactions.payment_method` |

### Filter Laporan
- **Periode**: Harian (pilih tanggal), Mingguan (pilih minggu), Bulanan (pilih bulan/tahun).
- **Jenis Usaha**: Raya Koffie saja, 439 Carwash saja, atau Gabungan.

### Export Excel (`.xlsx`)
- Menggunakan library **Apache POI**.
- Membuat header baris pertama (bold), lalu menulis data per baris.
- Sheet terpisah: "Pendapatan" dan "Pengeluaran".

### Export PDF
- Menggunakan **iTextPDF**.
- Layout: Header logo + nama toko, tabel data, footer ringkasan total.
- File disimpan ke folder Downloads dan bisa langsung di-share via WhatsApp/Email.

### Export Pengeluaran
- Format sama (PDF & Excel), tapi sumber data dari tabel `expenses`.
- Kolom: No, Tanggal, Kategori, Keterangan, Nominal.

---

## 8. Logic Kustomisasi Pajak

### Cara Kerja
- Admin masuk ke halaman **Pengaturan Pajak**.
- Admin bisa:
  - **Menambah** pajak baru (misal: nama = "Service Charge", persentase = 5%).
  - **Mengedit** nama atau persentase pajak yang sudah ada.
  - **Mengaktifkan/Menonaktifkan** pajak (toggle switch).
  - **Menghapus** pajak yang tidak dibutuhkan lagi.
- Pajak yang `is_active = true` akan otomatis dihitung di semua transaksi.
- Jika semua pajak dinonaktifkan → transaksi berjalan tanpa pajak sama sekali.

---

## 9. Logic Backup & Restore

### Backup (Export)
1. Menutup koneksi database sementara.
2. Menyalin file database Room (`.db`) dari internal storage.
3. Membungkusnya menjadi file `.zip` dengan metadata (tanggal backup, versi aplikasi).
4. Menyimpan ke folder Downloads atau upload ke **Google Drive** (via Google Drive API).

### Restore (Import)
1. Admin memilih file backup (`.zip`) dari storage / Google Drive.
2. Sistem memvalidasi integritas file.
3. Menampilkan **dialog peringatan**: "Data saat ini akan ditimpa. Lanjutkan?"
4. Jika dikonfirmasi → replace file `.db` → restart aplikasi.

### Catatan Keamanan
- Backup menyimpan **seluruh data** (users, produk, transaksi, pengeluaran, pengaturan pajak).
- Disarankan melakukan backup rutin (minimal seminggu sekali).
- Informasi "Backup terakhir: [tanggal]" ditampilkan di halaman Backup.
