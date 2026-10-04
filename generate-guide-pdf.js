import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const ASSETS_DIR = path.resolve('docs/guide-assets');
const LOGO_PATH = path.resolve('raya-coffe-logo.png');

function getBase64Image(filePath) {
  if (fs.existsSync(filePath)) {
    const ext = path.extname(filePath).slice(1);
    const data = fs.readFileSync(filePath).toString('base64');
    return `data:image/${ext === 'png' ? 'png' : 'jpeg'};base64,${data}`;
  }
  return '';
}

const logoBase64 = getBase64Image(LOGO_PATH);
const imgLogin = getBase64Image(path.join(ASSETS_DIR, '01_login.png'));
const imgDashboard = getBase64Image(path.join(ASSETS_DIR, '02_dashboard.png'));
const imgPosKafe = getBase64Image(path.join(ASSETS_DIR, '03_pos_kafe.png'));
const imgPosCarwash = getBase64Image(path.join(ASSETS_DIR, '04_pos_carwash.png'));
const imgModalBayar = getBase64Image(path.join(ASSETS_DIR, '05_modal_pembayaran.png'));
const imgStruk = getBase64Image(path.join(ASSETS_DIR, '06_struk_transaksi.png'));
const imgKelolaMenu = getBase64Image(path.join(ASSETS_DIR, '07_kelola_menu.png'));
const imgModalMenu = getBase64Image(path.join(ASSETS_DIR, '08_modal_tambah_menu.png'));
const imgRiwayat = getBase64Image(path.join(ASSETS_DIR, '09_riwayat_transaksi.png'));
const imgBiaya = getBase64Image(path.join(ASSETS_DIR, '10_biaya_operasional.png'));
const imgModalBiaya = getBase64Image(path.join(ASSETS_DIR, '11_modal_tambah_biaya.png'));
const imgManajemenUser = getBase64Image(path.join(ASSETS_DIR, '12_manajemen_anggota.png'));
const imgModalUser = getBase64Image(path.join(ASSETS_DIR, '13_modal_tambah_anggota.png'));
const imgLaporan = getBase64Image(path.join(ASSETS_DIR, '14_laporan_omset.png'));
const imgModalExport = getBase64Image(path.join(ASSETS_DIR, '15_modal_ekspor_laporan.png'));

// Android Permission & Setup Assets
const imgIzinInstall = getBase64Image(path.join(ASSETS_DIR, '16_instalasi_apk_sumber_tidak_dikenal.png'));
const imgIzinBluetooth = getBase64Image(path.join(ASSETS_DIR, '17_izin_bluetooth_perangkat_sekitar.png'));
const imgIzinStorage = getBase64Image(path.join(ASSETS_DIR, '18_izin_penyimpanan_dokumen.png'));
const imgPairingPrinter = getBase64Image(path.join(ASSETS_DIR, '19_pairing_printer_bluetooth.png'));

const htmlContent = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Buku Panduan Penggunaan POS Raya Koffie & Carwash</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');

    :root {
      --primary: #073C64;
      --primary-dark: #04253F;
      --primary-light: #EBF3FA;
      --accent: #D4AF37;
      --text-main: #1E293B;
      --text-muted: #64748B;
      --border-color: #E2E8F0;
      --bg-page: #FFFFFF;
      --bg-card: #F8FAFC;
      --success: #10B981;
      --warning: #F59E0B;
      --danger: #EF4444;
      --carwash: #0284C7;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      color: var(--text-main);
      background: #FFFFFF;
      line-height: 1.6;
      font-size: 13.5px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    @page {
      size: A4;
      margin: 18mm 16mm 18mm 16mm;
      @bottom-right {
        content: counter(page);
        font-size: 10px;
        color: #94A3B8;
        font-family: 'Plus Jakarta Sans', sans-serif;
      }
      @bottom-left {
        content: "Raya Koffie & Carwash • Panduan Operasional Sistem POS Tablet";
        font-size: 10px;
        color: #94A3B8;
        font-family: 'Plus Jakarta Sans', sans-serif;
      }
    }

    .page-break {
      page-break-after: always;
      break-after: page;
    }

    .avoid-break {
      page-break-inside: avoid;
      break-inside: avoid;
    }

    /* COVER STYLES */
    .cover-container {
      height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 20px 0;
      box-sizing: border-box;
      background: linear-gradient(135deg, #FFFFFF 0%, #F0F7FD 100%);
    }

    .cover-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid var(--primary-light);
      padding-bottom: 18px;
    }

    .cover-logo-box {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .cover-logo {
      height: 48px;
      object-fit: contain;
    }

    .cover-badge-doc {
      background: var(--primary);
      color: #FFFFFF;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.8px;
      text-transform: uppercase;
    }

    .cover-body {
      margin: auto 0;
      padding: 20px 0;
    }

    .cover-pill {
      display: inline-block;
      background: #E0F2FE;
      color: #0369A1;
      padding: 6px 14px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 700;
      margin-bottom: 14px;
      letter-spacing: 0.5px;
    }

    .cover-title {
      font-size: 32px;
      font-weight: 800;
      color: var(--primary-dark);
      line-height: 1.25;
      margin-bottom: 12px;
    }

    .cover-title span {
      color: var(--carwash);
    }

    .cover-subtitle {
      font-size: 14.5px;
      color: var(--text-muted);
      line-height: 1.6;
      max-width: 640px;
      margin-bottom: 24px;
    }

    .cover-mockup-frame {
      background: #FFFFFF;
      border-radius: 16px;
      padding: 12px;
      box-shadow: 0 16px 36px rgba(7, 60, 100, 0.12);
      border: 1px solid #CBD5E1;
      margin: 10px 0 20px;
    }

    .cover-mockup-img {
      width: 100%;
      border-radius: 10px;
      display: block;
    }

    .cover-footer {
      border-top: 2px solid var(--primary-light);
      padding-top: 18px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }

    .cover-meta h5 {
      font-size: 13px;
      font-weight: 700;
      color: var(--primary);
    }

    .cover-meta p {
      font-size: 12px;
      color: var(--text-muted);
    }

    /* GENERAL TYPOGRAPHY */
    h1.chapter-title {
      font-size: 22px;
      font-weight: 800;
      color: var(--primary-dark);
      border-bottom: 2px solid var(--primary);
      padding-bottom: 8px;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .chapter-badge {
      background: var(--primary);
      color: #FFFFFF;
      font-size: 12px;
      font-weight: 700;
      padding: 3px 10px;
      border-radius: 6px;
    }

    h2.section-title {
      font-size: 15.5px;
      font-weight: 700;
      color: var(--primary);
      margin: 16px 0 10px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    h3.sub-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-main);
      margin: 12px 0 6px;
    }

    p {
      margin-bottom: 10px;
      color: #334155;
      text-align: justify;
    }

    /* CALLOUT BOXES */
    .callout {
      border-radius: 10px;
      padding: 12px 16px;
      margin: 14px 0;
      font-size: 12.5px;
      border-left: 4px solid;
    }

    .callout-tip {
      background: #F0FDF4;
      border-color: var(--success);
      color: #166534;
    }

    .callout-info {
      background: #F0F9FF;
      border-color: #0284C7;
      color: #075985;
    }

    .callout-warning {
      background: #FFFBEB;
      border-color: var(--warning);
      color: #92400E;
    }

    .callout-alert {
      background: #FEF2F2;
      border-color: var(--danger);
      color: #991B1B;
    }

    .callout-title {
      font-weight: 700;
      margin-bottom: 4px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    /* TABLET MOCKUP CONTAINER */
    .tablet-device {
      background: #0F172A;
      border-radius: 14px;
      padding: 8px;
      box-shadow: 0 8px 22px rgba(0,0,0,0.12);
      margin: 14px 0 18px;
      position: relative;
    }

    .tablet-camera-notch {
      width: 6px;
      height: 6px;
      background: #334155;
      border-radius: 50%;
      margin: 0 auto 5px auto;
    }

    .tablet-screen {
      border-radius: 8px;
      overflow: hidden;
      background: #FFFFFF;
      border: 1px solid #1E293B;
    }

    .tablet-screen img {
      width: 100%;
      display: block;
    }

    .tablet-caption {
      text-align: center;
      font-size: 11px;
      font-weight: 600;
      color: var(--text-muted);
      margin-top: 6px;
      font-style: italic;
    }

    /* STEP BY STEP GRID */
    .step-list {
      list-style: none;
      margin: 12px 0;
      padding: 0;
    }

    .step-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 12px;
    }

    .step-num {
      background: var(--primary);
      color: #FFFFFF;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 700;
      flex-shrink: 0;
      margin-top: 2px;
    }

    .step-text {
      flex: 1;
    }

    .step-text strong {
      color: var(--primary-dark);
    }

    /* COMPARISON & FEATURE CARDS */
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
      margin: 14px 0;
    }

    .grid-3 {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 12px;
      margin: 14px 0;
    }

    .feature-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 10px;
      padding: 12px 14px;
    }

    .feature-card h4 {
      font-size: 13px;
      color: var(--primary);
      margin-bottom: 6px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .feature-card p {
      font-size: 12px;
      margin-bottom: 0;
      color: var(--text-muted);
    }

    /* TABLE DESIGN */
    .guide-table {
      width: 100%;
      border-collapse: collapse;
      margin: 14px 0;
      font-size: 12px;
    }

    .guide-table th, .guide-table td {
      padding: 9px 12px;
      border: 1px solid var(--border-color);
      text-align: left;
    }

    .guide-table th {
      background: var(--primary-light);
      color: var(--primary-dark);
      font-weight: 700;
    }

    .guide-table tr:nth-child(even) td {
      background: #F8FAFC;
    }

    .badge-role {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 700;
    }

    .badge-admin {
      background: #DBEAFE;
      color: #1E40AF;
    }

    .badge-kasir {
      background: #D1FAE5;
      color: #065F46;
    }

    .badge-reimb {
      background: #FEF3C7;
      color: #92400E;
    }

    .badge-settled {
      background: #DCFCE7;
      color: #15803D;
    }

    /* TOC */
    .toc-item {
      display: flex;
      justify-content: space-between;
      border-bottom: 1px dotted #CBD5E1;
      padding: 7px 0;
      font-size: 12.5px;
    }

    .toc-title {
      font-weight: 600;
      color: var(--primary-dark);
    }

    .toc-page {
      font-weight: 700;
      color: var(--text-muted);
    }
  </style>
</head>
<body>

  <!-- ==================== COVER PAGE ==================== -->
  <div class="cover-container page-break">
    <div class="cover-header">
      <div class="cover-logo-box">
        <img src="${logoBase64}" alt="Raya Koffie Logo" class="cover-logo">
      </div>
      <div class="cover-badge-doc">OFFICIAL USER MANUAL</div>
    </div>

    <div class="cover-body">
      <div class="cover-pill">📱 PANDUAN RESMI OPERASIONAL & PERIZINAN TABLET ANDROID</div>
      <h1 class="cover-title">Buku Panduan Penggunaan<br><span>Sistem POS & Operasional</span></h1>
      <p class="cover-subtitle">
        Pedoman instalasi APK, aktivasi izin Android, operasional kasir, manajemen antrean carwash, pencatatan biaya operasional, kontrol PIN kasir, dan ekspor laporan omset offline.
      </p>

      <div class="cover-mockup-frame">
        <img src="${imgDashboard}" alt="Dashboard Preview" class="cover-mockup-img">
      </div>
    </div>

    <div class="cover-footer">
      <div class="cover-meta">
        <h5>RAYA KOFFIE & CARWASH</h5>
        <p>Alamat: Daya Asri, TUBABA</p>
        <p>Instagram: @raya_koffie_tubaba</p>
      </div>
      <div class="cover-meta" style="text-align: right;">
        <h5>Edisi Tablet Android 2026 • v2.0</h5>
        <p>Panduan Lengkap Untuk Operator Kasir & Manajer</p>
      </div>
    </div>
  </div>

  <!-- ==================== DAFTAR ISI & PENDAHULUAN ==================== -->
  <div class="page-break">
    <h1 class="chapter-title"><span class="chapter-badge">TOC</span> Daftar Isi Panduan</h1>
    
    <div style="margin: 16px 0 24px;">
      <div class="toc-item">
        <span class="toc-title">1. Pendahuluan Sistem & Fitur Utama</span>
        <span class="toc-page">Halaman 2</span>
      </div>
      <div class="toc-item">
        <span class="toc-title">2. Instalasi APK & Panduan Menghidupkan Perizinan Android</span>
        <span class="toc-page">Halaman 3 - 4</span>
      </div>
      <div class="toc-item">
        <span class="toc-title">3. Akses & Login Sistem (Role Kasir vs Admin)</span>
        <span class="toc-page">Halaman 5</span>
      </div>
      <div class="toc-item">
        <span class="toc-title">4. Navigasi Antarmuka & Dashboard Utama</span>
        <span class="toc-page">Halaman 6</span>
      </div>
      <div class="toc-item">
        <span class="toc-title">5. Operasional Kasir POS (Pemesanan Kafe & Carwash)</span>
        <span class="toc-page">Halaman 7</span>
      </div>
      <div class="toc-item">
        <span class="toc-title">6. Alur Pembayaran, Numpad Tablet & Cetak Struk Thermal</span>
        <span class="toc-page">Halaman 8</span>
      </div>
      <div class="toc-item">
        <span class="toc-title">7. Riwayat Transaksi & Cetak Ulang Struk</span>
        <span class="toc-page">Halaman 9</span>
      </div>
      <div class="toc-item">
        <span class="toc-title">8. Manajemen Menu & Layanan (Admin Only)</span>
        <span class="toc-page">Halaman 10</span>
      </div>
      <div class="toc-item">
        <span class="toc-title">9. Biaya Operasional & Manajemen Talangan Karyawan</span>
        <span class="toc-page">Halaman 11</span>
      </div>
      <div class="toc-item">
        <span class="toc-title">10. Manajemen Anggota & Akun Kasir (Masking PIN & Status)</span>
        <span class="toc-page">Halaman 12</span>
      </div>
      <div class="toc-item">
        <span class="toc-title">11. Laporan Omset, Keuangan & Ekspor PDF / Excel Offline</span>
        <span class="toc-page">Halaman 13</span>
      </div>
      <div class="toc-item">
        <span class="toc-title">12. Lampiran, Troubleshooting Perizinan & FAQ</span>
        <span class="toc-page">Halaman 14</span>
      </div>
    </div>

    <h2 class="section-title">📌 Pendahuluan Sistem POS Tablet</h2>
    <p>
      Sistem Point of Sale (POS) Raya Koffie didesain khusus dengan pendekatan <strong>100% Offline-First</strong> untuk memberikan kenyamanan maksimal bagi kasir dan manajer dalam menjalankan operasional harian kafe dan layanan cuci kendaraan secara cepat, presisi, dan mandiri tanpa ketergantungan koneksi cloud.
    </p>

    <div class="grid-3">
      <div class="feature-card">
        <h4>⚡ Cepat & Responsif</h4>
        <p>Dukungan On-Screen Numpad, preset nominal bayar instan, dan antrean cepat tanpa lag.</p>
      </div>
      <div class="feature-card">
        <h4>📊 Finansial Akurat</h4>
        <p>Memisahkan pendapatan Kafe & Carwash serta mencatat biaya kasir vs talangan staf.</p>
      </div>
      <div class="feature-card">
        <h4>🔒 Hak Akses Aman</h4>
        <p>Hak akses berjenjang antara Kasir (transaksi) dan Admin (laporan, menu & staf).</p>
      </div>
    </div>

    <div class="callout callout-info avoid-break">
      <div class="callout-title">ℹ️ Rekomendasi Penggunaan Tablet</div>
      Gunakan tablet dengan resolusi layar minimal 10 inchi dalam orientasi <strong>Landscape</strong> untuk kenyamanan terbaik saat memasukkan pesanan dan memantau antrean.
    </div>
  </div>

  <!-- ==================== BAB 1: INSTALASI & PERIZINAN ANDROID (BAGIAN 1) ==================== -->
  <div class="page-break">
    <h1 class="chapter-title"><span class="chapter-badge">BAB 1</span> Instalasi APK & Perizinan Android (Bagian 1)</h1>
    <p>
      Karena aplikasi didistribusikan langsung dalam format paket APK mandiri (<em>sideloading</em>) untuk tablet kasir, sistem keamanan Android (terutama versi 11, 12, 13, dan 14) mewajibkan operator untuk mengaktifkan izin instalasi dan izin perangkat keras khusus agar fitur Bluetooth printer dan penyimpanan dokumen berjalan tanpa kendala.
    </p>

    <h2 class="section-title">📦 1. Mengizinkan Instalasi APK dari Sumber Tidak Dikenal</h2>
    <p>
      Saat pertama kali memasang file <code>Raya_Koffie_POS_v2.0.apk</code> melalui Pengelola File (File Manager) atau WhatsApp/Chrome, Android akan menampilkan peringatan keamanan standar.
    </p>

    <div class="tablet-device avoid-break">
      <div class="tablet-camera-notch"></div>
      <div class="tablet-screen">
        <img src="${imgIzinInstall}" alt="Izin Instalasi Sumber Tidak Dikenal">
      </div>
      <div class="tablet-caption">Gambar 1.1: Mengaktifkan Toggle "Izinkan dari sumber ini" di Pengaturan Tablet</div>
    </div>

    <ul class="step-list">
      <li class="step-item">
        <div class="step-num">1</div>
        <div class="step-text">
          Buka aplikasi <strong>Pengelola File (File Manager)</strong> atau folder <em>Download</em> pada tablet, lalu tap file <strong>Raya_Koffie_POS_v2.0.apk</strong>.
        </div>
      </li>
      <li class="step-item">
        <div class="step-num">2</div>
        <div class="step-text">
          Jika muncul jendela <em>"Demi keamanan, tablet Anda tidak diizinkan memasang aplikasi yang tidak dikenal dari sumber ini"</em>, tekan tombol <strong>Pengaturan (Settings)</strong>.
        </div>
      </li>
      <li class="step-item">
        <div class="step-num">3</div>
        <div class="step-text">
          Aktifkan tombol switch toggle <strong>"Izinkan dari sumber ini"</strong> (berubah menjadi warna biru/hijau menyala).
        </div>
      </li>
      <li class="step-item">
        <div class="step-num">4</div>
        <div class="step-text">
          Tekan tombol kembali (Back), lalu tekan <strong>"Instal"</strong> pada jendela konfirmasi. Tunggu hingga proses instalasi selesai 100%.
        </div>
      </li>
    </ul>

    <div class="callout callout-warning avoid-break">
      <div class="callout-title">⚠️ Peringatan Google Play Protect (Jika Muncul)</div>
      Jika muncul peringatan <em>"Diblokir oleh Play Protect"</em> karena aplikasi didistribusikan offline khusus kasir internal, tekan teks <strong>"Detail selengkapnya"</strong> lalu pilih <strong>"Tetap instal (tidak aman)"</strong>. Aplikasi ini 100% aman dan hanya berjalan di jaringan lokal tablet Anda.
    </div>
  </div>

  <!-- ==================== BAB 1: INSTALASI & PERIZINAN ANDROID (BAGIAN 2) ==================== -->
  <div class="page-break">
    <h1 class="chapter-title"><span class="chapter-badge">BAB 1</span> Instalasi APK & Perizinan Android (Bagian 2)</h1>
    <p>
      Setelah aplikasi terpasang di tablet, terdapat dua izin sistem krusial yang harus dipastikan aktif: <strong>Izin Perangkat Sekitar (Bluetooth)</strong> untuk mencetak struk thermal dan <strong>Izin File & Media</strong> untuk menyimpan berkas laporan omset ke memori tablet.
    </p>

    <div class="grid-2 avoid-break">
      <div>
        <h2 class="section-title">📡 2. Izin Perangkat di Sekitar & Lokasi</h2>
        <div class="tablet-device">
          <div class="tablet-camera-notch"></div>
          <div class="tablet-screen">
            <img src="${imgIzinBluetooth}" alt="Izin Perangkat di Sekitar">
          </div>
          <div class="tablet-caption">Gambar 1.2: Pengaturan Izin Bluetooth & Perangkat Sekitar</div>
        </div>
        <p style="font-size:12px;">
          <strong>Cara Mengaktifkan:</strong> Buka <em>Pengaturan Tablet > Aplikasi > Raya Koffie POS > Izin</em>. Pastikan <strong>Perangkat di sekitar (Nearby Devices)</strong> dan <strong>Lokasi</strong> berstatus <strong>"Diizinkan"</strong>.
        </p>
      </div>

      <div>
        <h2 class="section-title">📁 3. Izin Penyimpanan File & Dokumen</h2>
        <div class="tablet-device">
          <div class="tablet-camera-notch"></div>
          <div class="tablet-screen">
            <img src="${imgIzinStorage}" alt="Izin File dan Media">
          </div>
          <div class="tablet-caption">Gambar 1.3: Pengaturan Izin Akses Penyimpanan File</div>
        </div>
        <p style="font-size:12px;">
          <strong>Cara Mengaktifkan:</strong> Pada menu <em>Izin Aplikasi</em>, pilih <strong>File dan Media</strong>, lalu pilih <strong>"Izinkan pengelolaan semua file"</strong> agar berkas PDF dan Excel tersimpan otomatis ke folder <code>Documents/RayaKoffie</code>.
        </p>
      </div>
    </div>

    <h2 class="section-title">🖨️ 4. Pemasangan (Pairing) Printer Thermal Bluetooth</h2>
    <div class="tablet-device avoid-break">
      <div class="tablet-camera-notch"></div>
      <div class="tablet-screen">
        <img src="${imgPairingPrinter}" alt="Pairing Printer Bluetooth">
      </div>
      <div class="tablet-caption">Gambar 1.4: Pengaturan Bluetooth Tablet dan Pemasangan Printer Thermal 58mm/80mm</div>
    </div>

    <ul class="step-list">
      <li class="step-item">
        <div class="step-num">1</div>
        <div class="step-text">
          Nyalakan <strong>Printer Thermal Bluetooth</strong> (pastikan kertas struk 58mm/80mm telah terpasang dengan benar dan lampu indikator menyala).
        </div>
      </li>
      <li class="step-item">
        <div class="step-num">2</div>
        <div class="step-text">
          Buka <strong>Pengaturan Tablet > Bluetooth</strong>, aktifkan Bluetooth dan tekan <strong>Pindai / Cari Perangkat</strong>.
        </div>
      </li>
      <li class="step-item">
        <div class="step-num">3</div>
        <div class="step-text">
          Pilih nama printer yang muncul (contoh: <code>RPP02N</code>, <code>MPT-II</code>, <code>POS-58</code>, atau <code>Thermal Printer</code>).
        </div>
      </li>
      <li class="step-item">
        <div class="step-num">4</div>
        <div class="step-text">
          Masukkan <strong>PIN Pairing</strong> standar: ketik <strong>0000</strong> atau <strong>1234</strong>, lalu tekan <strong>Sandingkan (Pair)</strong> hingga status berubah menjadi <em>Tersambung</em>.
        </div>
      </li>
    </ul>

    <div class="callout callout-tip avoid-break">
      <div class="callout-title">💡 Siap Beroperasi</div>
      Setelah seluruh izin aktif dan printer berstatus <em>Tersambung</em>, aplikasi POS dapat dibuka dan siap digunakan melayani pelanggan tanpa kendala hardware.
    </div>
  </div>

  <!-- ==================== BAB 2: LOGIN & HAK AKSES ==================== -->
  <div class="page-break">
    <h1 class="chapter-title"><span class="chapter-badge">BAB 2</span> Akses & Login Sistem</h1>
    <p>
      Sebelum memulai operasional harian toko, setiap operator diwajibkan masuk menggunakan kredensial akun masing-masing untuk menjaga akuntabilitas shift transaksi kasir.
    </p>

    <div class="tablet-device avoid-break">
      <div class="tablet-camera-notch"></div>
      <div class="tablet-screen">
        <img src="${imgLogin}" alt="Tampilan Login POS">
      </div>
      <div class="tablet-caption">Gambar 2.1: Halaman Login Sistem POS Raya Koffie pada Device Tablet</div>
    </div>

    <h2 class="section-title">🔑 Langkah-Langkah Masuk ke Sistem</h2>
    <ul class="step-list">
      <li class="step-item">
        <div class="step-num">1</div>
        <div class="step-text">
          <strong>Buka Aplikasi POS</strong> pada tablet operasional kasir.
        </div>
      </li>
      <li class="step-item">
        <div class="step-num">2</div>
        <div class="step-text">
          Ketik <strong>Username</strong> dan <strong>Password</strong> yang telah didaftarkan oleh Administrator (misal: <code>admin</code> / <code>kasir</code>).
        </div>
      </li>
      <li class="step-item">
        <div class="step-num">3</div>
        <div class="step-text">
          Tekan tombol <strong>"Masuk ke Sistem"</strong>. Sistem akan mengarahkan Anda ke Dashboard sesuai dengan hak akses role Anda.
        </div>
      </li>
    </ul>

    <h2 class="section-title">👥 Perbedaan Hak Akses (Role)</h2>
    <table class="guide-table avoid-break">
      <thead>
        <tr>
          <th>Role Pengguna</th>
          <th>Fitur yang Dapat Diakses</th>
          <th>Batasan Akses</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><span class="badge-role badge-kasir">KASIR</span></td>
          <td>
            • Kasir POS (Pemesanan Kafe & Carwash)<br>
            • Cetak Struk Transaksi Thermal<br>
            • Riwayat Transaksi Harian<br>
            • Pencatatan Biaya Operasional Kasir
          </td>
          <td>
            Tidak dapat mengubah harga menu, tidak dapat melihat laba bersih toko, dan tidak dapat mengelola akun pengguna lain.
          </td>
        </tr>
        <tr>
          <td><span class="badge-role badge-admin">ADMINISTRATOR</span></td>
          <td>
            • Seluruh Fitur Kasir POS<br>
            • Dashboard Finansial Lengkap (Laba Bersih)<br>
            • Kelola Menu & Harga Produk<br>
            • Manajemen Pengguna (Lihat PIN & Status Kasir)<br>
            • Rekapitulasi Laporan Omset & Ekspor PDF / Excel
          </td>
          <td>
            Akses Penuh (Full Superuser Access).
          </td>
        </tr>
      </tbody>
    </table>

    <div class="callout callout-warning avoid-break">
      <div class="callout-title">⚠️ Tips Keamanan Operator</div>
      Selalu tekan tombol <strong>"Keluar"</strong> di sudut kiri bawah sidebar pada akhir shift agar data penjualan shift Anda tercatat dengan benar dan tidak disalahgunakan.
    </div>
  </div>

  <!-- ==================== BAB 3: DASHBOARD & NAVIGASI ==================== -->
  <div class="page-break">
    <h1 class="chapter-title"><span class="chapter-badge">BAB 3</span> Dashboard & Navigasi Antarmuka</h1>
    <p>
      Halaman Dashboard memberikan gambaran menyeluruh (helicopter view) mengenai arus pendapatan toko dan performa penjualan secara real-time.
    </p>

    <div class="tablet-device avoid-break">
      <div class="tablet-camera-notch"></div>
      <div class="tablet-screen">
        <img src="${imgDashboard}" alt="Tampilan Dashboard POS">
      </div>
      <div class="tablet-caption">Gambar 3.1: Tampilan Dashboard Utama dengan Metrik Real-time</div>
    </div>

    <h2 class="section-title">📊 Memahami Kartu Metrik Dashboard</h2>
    <div class="grid-2 avoid-break">
      <div class="feature-card">
        <h4>💰 Total Omset & Laba Bersih</h4>
        <p>Menampilkan kalkulasi otomatis total penjualan kotor dan estimasi laba bersih setelah dikurangi biaya operasional yang dikeluarkan dari kas toko.</p>
      </div>
      <div class="feature-card">
        <h4>☕ Split Omset Kafe vs 🚗 Carwash</h4>
        <p>Memisahkan pendapatan F&B Kafe dan pendapatan jasa cuci kendaraan sehingga manajer dapat menganalisis sektor usaha yang paling menguntungkan.</p>
      </div>
      <div class="feature-card">
        <h4>🏆 Produk Terlaris Hari Ini</h4>
        <p>Daftar 5 menu atau layanan teratas yang paling banyak dibeli pelanggan untuk memudahkan persiapan stok bahan baku.</p>
      </div>
      <div class="feature-card">
        <h4>🕒 Transaksi Terkini</h4>
        <p>Daftar aktivitas kasir terbaru secara kronologis lengkap dengan nomor transaksi dan total nilai belanja.</p>
      </div>
    </div>

    <div class="callout callout-tip avoid-break">
      <div class="callout-title">💡 Navigasi Sidebar Fleksibel</div>
      Pada tablet portrait, sidebar akan otomatis berubah menjadi <strong>Menu Drawer</strong> yang dapat dibuka dengan menekan ikon hamburger (☰) di sudut kanan atas.
    </div>
  </div>

  <!-- ==================== BAB 4: OPERASIONAL KASIR POS ==================== -->
  <div class="page-break">
    <h1 class="chapter-title"><span class="chapter-badge">BAB 4</span> Operasional Kasir POS (Pemesanan)</h1>
    <p>
      Layar Kasir POS dirancang dengan tata letak dua kolom yang ergonomis: Katalog Produk di sisi kiri dan Keranjang Pesanan Aktif di sisi kanan.
    </p>

    <div class="tablet-device avoid-break">
      <div class="tablet-camera-notch"></div>
      <div class="tablet-screen">
        <img src="${imgPosKafe}" alt="Tampilan Kasir POS">
      </div>
      <div class="tablet-caption">Gambar 4.1: Layar Kasir POS dengan Katalog Menu dan Keranjang Aktif</div>
    </div>

    <h2 class="section-title">🛒 Langkah Melakukan Pemesanan</h2>
    <ul class="step-list">
      <li class="step-item">
        <div class="step-num">1</div>
        <div class="step-text">
          <strong>Pilih Kategori Menu</strong> menggunakan filter: <em>Semua</em>, <em>Kafe</em>, atau <em>Carwash</em>, atau gunakan kotak pencarian untuk mencari nama menu dengan cepat.
        </div>
      </li>
      <li class="step-item">
        <div class="step-num">2</div>
        <div class="step-text">
          <strong>Sentuh Kartu Produk</strong> untuk menambahkannya ke keranjang. Sentuh berulang kali untuk menambah kuantitas, atau atur jumlah pada tombol <strong>+</strong> dan <strong>-</strong> di daftar item keranjang.
        </div>
      </li>
      <li class="step-item">
        <div class="step-num">3</div>
        <div class="step-text">
          <strong>Pesanan Layanan Carwash:</strong> Pada kategori Carwash, kasir dapat memasukkan nomor plat kendaraan pada kolom catatan pesanan agar antrean pencucian tercatat rapi.
        </div>
      </li>
      <li class="step-item">
        <div class="step-num">4</div>
        <div class="step-text">
          Periksa ringkasan Subtotal, Pajak, dan Diskon, lalu tekan tombol <strong>"Bayar Sekarang"</strong> untuk membuka dialog pembayaran.
        </div>
      </li>
    </ul>

    <div class="tablet-device avoid-break">
      <div class="tablet-camera-notch"></div>
      <div class="tablet-screen">
        <img src="${imgPosCarwash}" alt="Tampilan Kasir Layanan Carwash">
      </div>
      <div class="tablet-caption">Gambar 4.2: Tampilan Katalog Khusus Layanan Cuci Kendaraan 439 Carwash</div>
    </div>
  </div>

  <!-- ==================== BAB 5: PEMBAYARAN & CETAK STRUK ==================== -->
  <div class="page-break">
    <h1 class="chapter-title"><span class="chapter-badge">BAB 5</span> Pembayaran & Cetak Struk Thermal</h1>
    <p>
      Dialog pembayaran dilengkapi dengan On-Screen Numpad sentuh khusus tablet untuk mempercepat input uang tunai tanpa perlu membuka keyboard layar bawaan Android.
    </p>

    <div class="grid-2 avoid-break">
      <div class="tablet-device">
        <div class="tablet-camera-notch"></div>
        <div class="tablet-screen">
          <img src="${imgModalBayar}" alt="Modal Pembayaran Numpad">
        </div>
        <div class="tablet-caption">Gambar 5.1: Modal Pembayaran On-Screen Numpad</div>
      </div>
      <div class="tablet-device">
        <div class="tablet-camera-notch"></div>
        <div class="tablet-screen">
          <img src="${imgStruk}" alt="Preview Struk Pembayaran">
        </div>
        <div class="tablet-caption">Gambar 5.2: Tampilan Nota Struk Pembayaran</div>
      </div>
    </div>

    <h2 class="section-title">💳 Metode Pembayaran yang Didukung</h2>
    <div class="grid-3 avoid-break">
      <div class="feature-card">
        <h4>💵 Tunai (Cash)</h4>
        <p>Gunakan tombol nominal pas (Uang Pas) atau tombol pecahan cepat (50rb, 100rb) untuk menghitung kembalian secara instan.</p>
      </div>
      <div class="feature-card">
        <h4>📱 QRIS Dinamis / Statis</h4>
        <p>Tunjukkan QRIS kasir kepada pelanggan. Nominal pas sesuai tagihan tanpa perlu hitung kembalian.</p>
      </div>
      <div class="feature-card">
        <h4>🏦 Transfer Bank</h4>
        <p>Dapat dipilih saat pelanggan membayar via mobile banking ke rekening resmi kafe.</p>
      </div>
    </div>

    <h2 class="section-title">🖨️ Cetak Struk Thermal (ESC/POS)</h2>
    <p>
      Setelah tombol <strong>"Konfirmasi Pembayaran"</strong> ditekan, sistem otomatis menyimpan transaksi dan menampilkan dialog cetak struk:
    </p>
    <ul class="step-list">
      <li class="step-item">
        <div class="step-num">1</div>
        <div class="step-text">
          Tekan tombol <strong>"Cetak Struk"</strong>. Aplikasi langsung mengirimkan perintah cetak via Bluetooth ke printer thermal 58mm/80mm yang telah tersambung.
        </div>
      </li>
      <li class="step-item">
        <div class="step-num">2</div>
        <div class="step-text">
          Struk tercetak lengkap dengan logo Raya Koffie, nomor nota unik (contoh: <code>INV/20261003/001</code>), nama kasir, rincian pesanan, dan ucapan terima kasih.
        </div>
      </li>
    </ul>
  </div>

  <!-- ==================== BAB 6: RIWAYAT TRANSAKSI ==================== -->
  <div class="page-break">
    <h1 class="chapter-title"><span class="chapter-badge">BAB 6</span> Riwayat Transaksi & Cetak Ulang</h1>
    <p>
      Menu Riwayat Transaksi menyimpan seluruh transaksi penjualan yang telah sukses diproses kasir. Fitur ini memungkinkan pencarian nota lama dan cetak ulang struk apabila kertas printer habis atau pelanggan meminta struk kembali.
    </p>

    <div class="tablet-device avoid-break">
      <div class="tablet-camera-notch"></div>
      <div class="tablet-screen">
        <img src="${imgRiwayat}" alt="Riwayat Transaksi">
      </div>
      <div class="tablet-caption">Gambar 6.1: Daftar Riwayat Transaksi Kasir dengan Filter Tanggal & Pencarian</div>
    </div>

    <h2 class="section-title">🔍 Fitur Pencarian & Cetak Ulang Nota</h2>
    <ul class="step-list">
      <li class="step-item">
        <div class="step-num">1</div>
        <div class="step-text">
          Ketik <strong>Nomor Invoice</strong> atau <strong>Nama Pelanggan / Kasir</strong> pada kotak pencarian di bagian atas tabel.
        </div>
      </li>
      <li class="step-item">
        <div class="step-num">2</div>
        <div class="step-text">
          Gunakan filter rentang tanggal (Hari Ini, 7 Hari Terakhir, Bulan Ini, atau Kustom) untuk mempersempit daftar data.
        </div>
      </li>
      <li class="step-item">
        <div class="step-num">3</div>
        <div class="step-text">
          Tekan tombol <strong>"Struk"</strong> di baris transaksi bersangkutan untuk membuka kembali nota digital dan langsung mencetaknya ke printer Bluetooth.
        </div>
      </li>
    </ul>

    <div class="callout callout-info avoid-break">
      <div class="callout-title">ℹ️ Integritas Data Penjualan</div>
      Transaksi yang telah selesai tidak dapat dihapus secara sembarangan untuk menjamin pembukuan tetap transparan dan terhindar dari selisih kas kasir.
    </div>
  </div>

  <!-- ==================== BAB 7: KELOLA MENU & LAYANAN ==================== -->
  <div class="page-break">
    <h1 class="chapter-title"><span class="chapter-badge">BAB 7</span> Manajemen Menu & Layanan (Admin)</h1>
    <p>
      Menu Kelola Menu diperuntukkan khusus bagi akun <strong>Administrator</strong> untuk memperbarui daftar harga, menambah item baru, atau mengarsipkan menu yang sedang tidak tersedia.
    </p>

    <div class="grid-2 avoid-break">
      <div class="tablet-device">
        <div class="tablet-camera-notch"></div>
        <div class="tablet-screen">
          <img src="${imgKelolaMenu}" alt="Kelola Menu">
        </div>
        <div class="tablet-caption">Gambar 7.1: Daftar Katalog Menu & Layanan Aktif</div>
      </div>
      <div class="tablet-device">
        <div class="tablet-camera-notch"></div>
        <div class="tablet-screen">
          <img src="${imgModalMenu}" alt="Modal Tambah Menu">
        </div>
        <div class="tablet-caption">Gambar 7.2: Form Tambah Menu & Penentuan Kategori</div>
      </div>
    </div>

    <h2 class="section-title">➕ Prosedur Menambah Menu Baru</h2>
    <ul class="step-list">
      <li class="step-item">
        <div class="step-num">1</div>
        <div class="step-text">
          Buka menu <strong>Kelola Menu</strong> pada sidebar, lalu tekan tombol <strong>"Tambah Menu"</strong> di sudut kanan atas.
        </div>
      </li>
      <li class="step-item">
        <div class="step-num">2</div>
        <div class="step-text">
          Masukkan <strong>Nama Menu / Layanan</strong> (contoh: <em>Kopi Susu Gula Aren</em> atau <em>Cuci Mobil Hidrolik</em>).
        </div>
      </li>
      <li class="step-item">
        <div class="step-num">3</div>
        <div class="step-text">
          Ketik <strong>Harga Jual (Rp)</strong> tanpa tanda titik/koma.
        </div>
      </li>
      <li class="step-item">
        <div class="step-num">4</div>
        <div class="step-text">
          Pilih Kategori: <strong>Kafe (F&B)</strong> atau <strong>Carwash (Jasa Cuci)</strong> agar pencatatan omset terbagi secara tepat.
        </div>
      </li>
      <li class="step-item">
        <div class="step-num">5</div>
        <div class="step-text">
          Tekan tombol <strong>"Simpan Menu"</strong>. Item baru langsung muncul seketika di layar Kasir POS.
        </div>
      </li>
    </ul>
  </div>

  <!-- ==================== BAB 8: BIAYA OPERASIONAL & TALANGAN ==================== -->
  <div class="page-break">
    <h1 class="chapter-title"><span class="chapter-badge">BAB 8</span> Biaya Operasional & Talangan</h1>
    <p>
      Fitur Biaya Operasional membedakan secara tegas antara pengeluaran yang diambil langsung dari kas kasir toko dan pengeluaran yang menggunakan uang pribadi karyawan (talangan/reimbursement).
    </p>

    <div class="grid-2 avoid-break">
      <div class="tablet-device">
        <div class="tablet-camera-notch"></div>
        <div class="tablet-screen">
          <img src="${imgBiaya}" alt="Biaya Operasional">
        </div>
        <div class="tablet-caption">Gambar 8.1: Daftar Pencatatan Biaya Kasir & Talangan</div>
      </div>
      <div class="tablet-device">
        <div class="tablet-camera-notch"></div>
        <div class="tablet-screen">
          <img src="${imgModalBiaya}" alt="Modal Tambah Biaya">
        </div>
        <div class="tablet-caption">Gambar 8.2: Dialog Pencatatan Sumber Dana Pengeluaran</div>
      </div>
    </div>

    <h2 class="section-title">💸 Dua Opsi Sumber Dana Pengeluaran</h2>
    <div class="grid-2 avoid-break">
      <div class="feature-card" style="border-left: 4px solid var(--primary);">
        <h4>🏪 1. Uang Kasir / Toko</h4>
        <p>Uang diambil langsung dari laci kasir. <strong>Langsung memotong saldo kas harian</strong> dan tercatat sebagai beban operasional toko.</p>
      </div>
      <div class="feature-card" style="border-left: 4px solid var(--warning);">
        <h4>👤 2. Uang Karyawan (Talangan)</h4>
        <p>Karyawan membeli bahan/kebutuhan menggunakan uang pribadi. <strong>TIDAK memotong kas kasir saat diinput</strong>, berstatus <em>"Menunggu Reimburse"</em> sampai kasir/manajer mengganti uang tersebut.</p>
      </div>
    </div>

    <h2 class="section-title">🔄 Alur Pelunasan Reimburse</h2>
    <ul class="step-list">
      <li class="step-item">
        <div class="step-num">1</div>
        <div class="step-text">
          Kasir mencatat talangan karyawan dengan memilih sumber <strong>"Uang Karyawan"</strong> dan mengetik nama karyawan bersangkutan.
        </div>
      </li>
      <li class="step-item">
        <div class="step-num">2</div>
        <div class="step-text">
          Saat kasir mengganti uang tersebut dari kas laci toko, buka tab <strong>"Talangan (Belum Diganti)"</strong>.
        </div>
      </li>
      <li class="step-item">
        <div class="step-num">3</div>
        <div class="step-text">
          Tekan tombol <strong>"Lunasi Reimburse"</strong>. Sistem mengubah status menjadi <strong>"Lunas (Reimbursed)"</strong> dan mulai memotong kas laci pada tanggal pelunasan.
        </div>
      </li>
    </ul>
  </div>

  <!-- ==================== BAB 9: MANAJEMEN ANGGOTA ==================== -->
  <div class="page-break">
    <h1 class="chapter-title"><span class="chapter-badge">BAB 9</span> Manajemen Anggota & Akun Kasir</h1>
    <p>
      Administrator memiliki wewenang penuh untuk membuat akun kasir baru, memeriksa PIN kasir, dan menangguhkan akses operator yang sedang nonaktif.
    </p>

    <div class="grid-2 avoid-break">
      <div class="tablet-device">
        <div class="tablet-camera-notch"></div>
        <div class="tablet-screen">
          <img src="${imgManajemenUser}" alt="Manajemen Anggota">
        </div>
        <div class="tablet-caption">Gambar 9.1: Tabel Anggota dengan Fitur Tampil/Sembunyi PIN</div>
      </div>
      <div class="tablet-device">
        <div class="tablet-camera-notch"></div>
        <div class="tablet-screen">
          <img src="${imgModalUser}" alt="Modal Tambah Anggota">
        </div>
        <div class="tablet-caption">Gambar 9.2: Form Pendaftaran Anggota & Pengaturan Status</div>
      </div>
    </div>

    <h2 class="section-title">👁️ Fitur Baru: Tampil/Sembunyikan PIN Kasir</h2>
    <p>
      Untuk memudahkan supervisi tanpa harus mereset kata sandi operator, sistem kini menyediakan fitur intip PIN:
    </p>
    <div class="feature-card avoid-break" style="margin-bottom:12px; border-left: 4px solid var(--primary);">
      <h4>🔒 Pengamanan PIN & Tombol Mata (Eye Toggle)</h4>
      <p>
        Secara default, PIN operator disamarkan dengan tanda titik (••••••). Admin dapat menekan tombol ikon mata pada kolom tabel untuk melihat PIN asli kasir. Demikian pula saat membuka dialog Edit Anggota, Admin dapat melihat PIN berjalan kasir secara langsung.
      </p>
    </div>

    <h2 class="section-title">👤 Prosedur Menambah & Mengedit Kasir</h2>
    <ul class="step-list">
      <li class="step-item">
        <div class="step-num">1</div>
        <div class="step-text">
          Tekan tombol <strong>"Tambah Anggota"</strong> di menu Manajemen Anggota.
        </div>
      </li>
      <li class="step-item">
        <div class="step-num">2</div>
        <div class="step-text">
          Isi <strong>Nama Lengkap</strong>, <strong>Username unik</strong>, <strong>Password / PIN</strong>, serta tentukan <strong>Role (Kasir / Admin)</strong>.
        </div>
      </li>
      <li class="step-item">
        <div class="step-num">3</div>
        <div class="step-text">
          <strong>Status Akun:</strong> Atur status sebagai <em>Aktif</em> (dapat login) atau <em>Nonaktif</em> (akses ditangguhkan sementara tanpa menghapus riwayat transaksinya).
        </div>
      </li>
    </ul>
  </div>

  <!-- ==================== BAB 10: LAPORAN OMSET & EKSPOR ==================== -->
  <div class="page-break">
    <h1 class="chapter-title"><span class="chapter-badge">BAB 10</span> Laporan Omset & Ekspor Offline</h1>
    <p>
      Menu Laporan Omset menyajikan rekapitulasi keuangan menyeluruh dan dilengkapi fitur ekspor dokumen yang disimpan langsung ke penyimpanan lokal tablet.
    </p>

    <div class="grid-2 avoid-break">
      <div class="tablet-device">
        <div class="tablet-camera-notch"></div>
        <div class="tablet-screen">
          <img src="${imgLaporan}" alt="Laporan Omset">
        </div>
        <div class="tablet-caption">Gambar 10.1: Rekapitulasi Penjualan & Laba Bersih</div>
      </div>
      <div class="tablet-device">
        <div class="tablet-camera-notch"></div>
        <div class="tablet-screen">
          <img src="${imgModalExport}" alt="Modal Ekspor Laporan">
        </div>
        <div class="tablet-caption">Gambar 10.2: Dialog Cetak & Ekspor Rekap Dokumen</div>
      </div>
    </div>

    <h2 class="section-title">📑 Format Ekspor Dokumen Resmi</h2>
    <div class="grid-2 avoid-break">
      <div class="feature-card">
        <h4>📄 1. Ekspor PDF Laporan Resmi</h4>
        <p>Mencetak dokumen laporan eksekutif lengkap dengan kop logo resmi Raya Koffie, rincian per kategori, total pengeluaran, dan tanda tangan penanggung jawab.</p>
      </div>
      <div class="feature-card">
        <h4>📊 2. Ekspor Spreadsheet Excel (.xls / .csv)</h4>
        <p>Mengunduh file spreadsheet terstruktur untuk kebutuhan pembukuan akuntansi, laporan pajak, dan arsip digital manajemen.</p>
      </div>
    </div>

    <h2 class="section-title">💾 Penyimpanan Offline Lokal Tablet (@capacitor/filesystem)</h2>
    <div class="callout callout-tip avoid-break">
      <div class="callout-title">📂 Lokasi Penyimpanan File Laporan di Tablet</div>
      Saat tombol ekspor ditekan, file PDF atau Excel akan langsung disimpan ke memori internal tablet di:
      <br><strong>Memori Internal &gt; Documents &gt; RayaKoffie &gt; [Nama_File.pdf / .xls]</strong>
      <br>File dapat dipindahkan kapan saja menggunakan Flashdisk OTG atau kabel data ke laptop.
    </div>
  </div>

  <!-- ==================== BAB 11: TROUBLESHOOTING & FAQ ==================== -->
  <div class="page-break">
    <h1 class="chapter-title"><span class="chapter-badge">BAB 11</span> Troubleshooting Perizinan & FAQ</h1>
    
    <h2 class="section-title">❓ Pertanyaan & Pemecahan Masalah Perizinan Android</h2>
    
    <div class="feature-card" style="margin-bottom: 10px;">
      <h4>Q: Printer Bluetooth tidak terdeteksi saat tombol "Cetak Struk" ditekan?</h4>
      <p><strong>A:</strong> Buka <em>Pengaturan Tablet > Aplikasi > Raya Koffie POS > Izin</em>. Pastikan izin <strong>Perangkat di sekitar (Nearby Devices)</strong> dan <strong>Lokasi</strong> dalam status <strong>Diizinkan</strong>. Pastikan pula printer telah di-pairing melalui Bluetooth tablet dengan PIN <code>0000</code> atau <code>1234</code>.</p>
    </div>

    <div class="feature-card" style="margin-bottom: 10px;">
      <h4>Q: File PDF atau Excel laporan tidak muncul saat diekspor?</h4>
      <p><strong>A:</strong> Pastikan izin <strong>File dan Media</strong> telah diberikan opsi <em>"Izinkan pengelolaan semua file"</em>. Buka aplikasi <em>Pengelola File</em> bawaan tablet, lalu masuk ke folder <code>Documents > RayaKoffie</code>.</p>
    </div>

    <div class="feature-card" style="margin-bottom: 10px;">
      <h4>Q: Apakah aplikasi tetap berfungsi jika tablet tidak memiliki koneksi internet?</h4>
      <p><strong>A:</strong> Ya, 100% berfungsi normal. Seluruh data transaksi, menu, biaya, dan cetak struk berjalan secara lokal di tablet kasir tanpa memerlukan kuota internet.</p>
    </div>

    <h2 class="section-title" style="margin-top: 20px;">🏢 Kontak Dukungan & Informasi Toko</h2>
    <table class="guide-table avoid-break">
      <tbody>
        <tr>
          <td width="180"><strong>Nama Usaha</strong></td>
          <td>RAYA KOFFIE & CARWASH</td>
        </tr>
        <tr>
          <td><strong>Alamat Lokasi</strong></td>
          <td>Daya Asri, TUBABA (Tulang Bawang Barat)</td>
        </tr>
        <tr>
          <td><strong>Instagram Resmi</strong></td>
          <td>@raya_koffie_tubaba</td>
        </tr>
        <tr>
          <td><strong>Versi Sistem POS</strong></td>
          <td>v2.0.0 Capacitor Android Tablet Edition</td>
        </tr>
      </tbody>
    </table>

    <div style="text-align: center; margin-top: 30px; padding-top: 18px; border-top: 1px solid var(--border-color); color: var(--text-muted); font-size: 11px;">
      © 2026 Raya Koffie & Carwash. Hak Cipta Dilindungi Undang-Undang.<br>
      Dokumen ini disusun untuk keperluan operasional internal, panduan perizinan, dan pelatihan staf kasir Raya Koffie.
    </div>
  </div>

</body>
</html>`;

const HTML_PATH = path.resolve('docs/Buku_Panduan_Penggunaan_POS_Raya_Koffie.html');
const PDF_PATH = path.resolve('docs/Buku_Panduan_Penggunaan_POS_Raya_Koffie.pdf');

fs.writeFileSync(HTML_PATH, htmlContent, 'utf8');
console.log('HTML Guide written to:', HTML_PATH);

async function generatePDF() {
  console.log('Launching browser to compile updated PDF eBook...');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  const fileUrl = 'file:///' + HTML_PATH.replace(/\\/g, '/');
  await page.goto(fileUrl, { waitUntil: 'networkidle0' });

  console.log('Rendering high-quality A4 PDF with all illustrations...');
  await page.pdf({
    path: PDF_PATH,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '0mm',
      bottom: '0mm',
      left: '0mm',
      right: '0mm'
    }
  });

  await browser.close();
  console.log('SUCCESS! Updated PDF Tutorial Guide created at:', PDF_PATH);
}

generatePDF().catch(err => {
  console.error('Error generating PDF:', err);
  process.exit(1);
});
