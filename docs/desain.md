# Design System & Assets
**Aplikasi POS Raya Koffie & 439 Carwash**

Dokumen ini mendefinisikan standar visual yang akan digunakan di seluruh halaman aplikasi, mengambil inspirasi utama dari logo **Raya Koffie**.

## 1. Skema Warna (Color Palette)
Warna aplikasi disesuaikan dengan identitas brand, bukan warna bawaan Figma.

### Warna Utama (Primary)
| Token | Hex | Penggunaan |
|-------|-----|------------|
| `primary` | `#D95A2B` | Tombol utama (Bayar, Simpan, Checkout), state aktif navigasi, header |
| `primary_dark` | `#B54520` | Tombol saat ditekan (pressed state), status bar |
| `primary_light` | `#F4A47A` | Highlight ringan, badge, selected card |

### Warna Latar (Background)
| Token | Hex | Penggunaan |
|-------|-----|------------|
| `background` | `#FDF9F1` | Latar belakang utama (warm cream) |
| `surface` | `#FFFFFF` | Card, panel, dialog |
| `sidebar_bg` | `#2D2D2D` | Sidebar navigasi (gelap agar kontras) |

### Warna Teks
| Token | Hex | Penggunaan |
|-------|-----|------------|
| `text_primary` | `#1A1A1A` | Judul, nama produk, label utama |
| `text_secondary` | `#757575` | Subtitle, deskripsi, keterangan |
| `text_on_primary` | `#FFFFFF` | Teks di atas tombol oranye |
| `text_on_sidebar` | `#E0E0E0` | Teks menu di sidebar gelap |

### Warna Aksen & Status
| Token | Hex | Penggunaan |
|-------|-----|------------|
| `accent_carwash` | `#1976D2` | Badge, tab, dan elemen terkait 439 Carwash (Biru) |
| `success` | `#4CAF50` | Status transaksi berhasil, laba positif |
| `error` | `#E53935` | Validasi error, tombol hapus, laba negatif |
| `warning` | `#FFC107` | Status revised, peringatan |

## 2. Tipografi (Typography)
| Level | Font | Weight | Size | Penggunaan |
|-------|------|--------|------|------------|
| H1 | Poppins | Bold (700) | 24sp | Judul halaman |
| H2 | Poppins | SemiBold (600) | 20sp | Subjudul, nama section |
| H3 | Poppins | SemiBold (600) | 16sp | Label card, nama produk |
| Body | Poppins | Regular (400) | 14sp | Teks biasa, deskripsi |
| Caption | Poppins | Regular (400) | 12sp | Keterangan kecil, timestamp |
| Button | Poppins | Medium (500) | 14sp | Label tombol |
| Price | Poppins | Bold (700) | 16sp | Harga produk, total |

## 3. Komponen UI (Component Tokens)

### Tombol (Buttons)
- **Primary Button**: Background `primary`, teks `text_on_primary`, corner radius `12dp`.
- **Secondary/Outline Button**: Border `primary`, teks `primary`, background transparan.
- **Danger Button**: Background `error`, teks putih. Digunakan untuk aksi hapus.

### Card Produk
- Background `surface`, corner radius `12dp`, shadow elevation `2dp`.
- Badge kategori di pojok atas:
  - ☕ Kafe → warna `primary` (Oranye)
  - 🚗 Carwash → warna `accent_carwash` (Biru)
- Ukuran gambar: `120x120dp` (square, rounded corners).

### Sidebar Navigasi
- Lebar: `240dp`.
- Background: `sidebar_bg`.
- Item aktif: background strip `primary`, teks `text_on_primary`.
- Item non-aktif: teks `text_on_sidebar`.

### Input Field / Text Field
- Border `#E0E0E0`, corner radius `8dp`.
- Fokus: border berubah menjadi `primary`.

## 4. Aset Visual
- **Logo Raya Koffie**: Digunakan di halaman Login (tengah), Sidebar (atas), dan Header Struk Cetak.
- **Iconography**: Material Design Icons (rounded style). Contoh:
  - `Icons.Rounded.Coffee` → Menu kafe
  - `Icons.Rounded.DirectionsCar` → Layanan cuci mobil
  - `Icons.Rounded.TwoWheeler` → Layanan cuci motor
  - `Icons.Rounded.ShoppingCart` → Keranjang
  - `Icons.Rounded.Receipt` → Riwayat transaksi
  - `Icons.Rounded.BarChart` → Laporan
  - `Icons.Rounded.Settings` → Pengaturan pajak
  - `Icons.Rounded.CloudUpload` → Backup

## 5. Spacing & Layout Grid
- **Base spacing unit**: `8dp`
- **Padding card**: `16dp`
- **Gap antar card**: `12dp`
- **Grid kolom produk**: 3-4 kolom pada tablet landscape, 2 kolom pada HP portrait.
