import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const ASSETS_DIR = path.resolve('docs/guide-assets');

if (!fs.existsSync(ASSETS_DIR)) {
  fs.mkdirSync(ASSETS_DIR, { recursive: true });
}

const logoBase64 = fs.existsSync('raya-coffe-logo.png')
  ? `data:image/png;base64,${fs.readFileSync('raya-coffe-logo.png').toString('base64')}`
  : '';

const screens = [
  {
    filename: '16_instalasi_apk_sumber_tidak_dikenal.png',
    title: '1. Mengizinkan Instalasi APK dari Sumber Tidak Dikenal',
    badge: 'LANGKAH 1: INSTALASI APK',
    html: `
      <div class="android-tablet">
        <div class="status-bar">
          <span>09:41</span>
          <span style="display:flex; gap:8px;"><span>📶 Wi-Fi</span><span>🔋 98%</span></span>
        </div>
        <div class="nav-bar">
          <div class="back-btn">‹</div>
          <div class="nav-title">Pasang aplikasi yang tidak dikenal</div>
          <div class="search-btn">🔍</div>
        </div>
        <div class="content-body">
          <div class="app-info-row">
            <div class="app-icon" style="background:#1E293B;">📁</div>
            <div>
              <div style="font-weight:700; font-size:16px;">Pengelola File / File Manager</div>
              <div style="font-size:13px; color:#64748B;">com.android.documentsui</div>
            </div>
          </div>
          
          <div class="setting-card">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <div>
                <div style="font-weight:700; font-size:15px; color:#0F172A;">Izinkan dari sumber ini</div>
                <div style="font-size:12.5px; color:#64748B; max-width:650px; margin-top:4px;">
                  Memberikan izin kepada File Manager untuk memasang paket aplikasi (APK) Raya Koffie POS yang diunduh ke tablet.
                </div>
              </div>
              <div class="toggle-switch on">
                <div class="toggle-circle"></div>
              </div>
            </div>
          </div>

          <div class="dialog-mockup">
            <div class="dialog-header">
              <img src="${logoBase64}" style="height:36px; object-fit:contain;" />
              <div>
                <div style="font-weight:800; font-size:16px; color:#073C64;">Raya Koffie POS</div>
                <div style="font-size:12px; color:#64748B;">Versi 2.0.0 (Capacitor Android)</div>
              </div>
            </div>
            <div style="font-size:14px; color:#334155; margin:16px 0;">
              Apakah Anda ingin menginstal aplikasi ini? Aplikasi tidak memerlukan akses internet khusus untuk operasional.
            </div>
            <div class="dialog-actions">
              <button class="btn-cancel">Batal</button>
              <button class="btn-confirm">Instal</button>
            </div>
          </div>
        </div>
      </div>
    `
  },
  {
    filename: '17_izin_bluetooth_perangkat_sekitar.png',
    title: '2. Mengaktifkan Izin Perangkat di Sekitar & Lokasi',
    badge: 'LANGKAH 2: IZIN BLUETOOTH & PRINTER',
    html: `
      <div class="android-tablet">
        <div class="status-bar">
          <span>09:42</span>
          <span style="display:flex; gap:8px;"><span>📶 Wi-Fi</span><span>🔋 98%</span></span>
        </div>
        <div class="nav-bar">
          <div class="back-btn">‹</div>
          <div class="nav-title">Izin aplikasi • Raya Koffie POS</div>
        </div>
        <div class="content-body">
          <div class="app-hero">
            <img src="${logoBase64}" style="height:48px; object-fit:contain;" />
            <div>
              <div style="font-weight:800; font-size:18px; color:#073C64;">Raya Koffie POS</div>
              <div style="font-size:13px; color:#10B981; font-weight:600;">✓ Aplikasi Terinstal & Siap Dioperasikan</div>
            </div>
          </div>

          <div class="section-label">DIIZINKAN (ALLOWED)</div>
          
          <div class="permission-item">
            <div class="perm-icon" style="background:#E0F2FE; color:#0284C7;">📡</div>
            <div style="flex:1;">
              <div class="perm-name">Perangkat di sekitar (Nearby Devices / Bluetooth)</div>
              <div class="perm-sub">Wajib aktif agar tablet dapat mendeteksi dan mengirim data cetak ke Printer Thermal 58mm/80mm</div>
            </div>
            <span class="status-pill allowed">Diizinkan</span>
          </div>

          <div class="permission-item">
            <div class="perm-icon" style="background:#FEF3C7; color:#D97706;">📍</div>
            <div style="flex:1;">
              <div class="perm-name">Lokasi (Location)</div>
              <div class="perm-sub">Diperlukan oleh sistem Android untuk pemindaian sinyal Bluetooth Printer</div>
            </div>
            <span class="status-pill allowed">Saat aplikasi digunakan</span>
          </div>

          <div class="section-label" style="margin-top:20px;">TIPS PENTING</div>
          <div class="tip-box">
            💡 <strong>Untuk Android 12, 13, dan 14:</strong> Masuk ke <em>Pengaturan Tablet > Aplikasi > Raya Koffie POS > Izin > Perangkat di sekitar > Pilih "Izinkan"</em>.
          </div>
        </div>
      </div>
    `
  },
  {
    filename: '18_izin_penyimpanan_dokumen.png',
    title: '3. Mengaktifkan Izin File & Media (Penyimpanan Dokumen)',
    badge: 'LANGKAH 3: IZIN PENYIMPANAN PDF & EXCEL',
    html: `
      <div class="android-tablet">
        <div class="status-bar">
          <span>09:43</span>
          <span style="display:flex; gap:8px;"><span>📶 Wi-Fi</span><span>🔋 97%</span></span>
        </div>
        <div class="nav-bar">
          <div class="back-btn">‹</div>
          <div class="nav-title">Izin File dan Media • Raya Koffie POS</div>
        </div>
        <div class="content-body">
          <div class="app-hero">
            <div class="perm-icon" style="background:#EFF6FF; color:#2563EB; width:44px; height:44px; font-size:22px;">📁</div>
            <div>
              <div style="font-weight:800; font-size:17px; color:#0F172A;">Akses Penyimpanan Tablet</div>
              <div style="font-size:13px; color:#64748B;">Pengaturan penyimpanan berkas laporan rekapitulasi offline</div>
            </div>
          </div>

          <div class="radio-card selected">
            <div class="radio-circle checked"></div>
            <div>
              <div style="font-weight:700; font-size:15px; color:#0F172A;">Izinkan pengelolaan semua file / Izinkan akses media</div>
              <div style="font-size:12.5px; color:#64748B; margin-top:4px;">
                Mengizinkan aplikasi menyimpan berkas PDF Laporan dan Excel Spreadsheet langsung ke folder <strong>Documents/RayaKoffie/</strong> pada tablet tanpa koneksi internet.
              </div>
            </div>
          </div>

          <div class="radio-card">
            <div class="radio-circle"></div>
            <div>
              <div style="font-weight:700; font-size:15px; color:#64748B;">Jangan izinkan (Tolak)</div>
              <div style="font-size:12.5px; color:#94A3B8; margin-top:2px;">
                Jika ditolak, fitur ekspor berkas lokal tidak dapat menulis dokumen ke memori internal tablet.
              </div>
            </div>
          </div>

          <div class="tip-box" style="margin-top:24px;">
            📄 <strong>Lokasi File Laporan:</strong> Semua ekspor otomatis tersimpan aman di <code>Memori Internal > Documents > RayaKoffie</code> dan dapat dibuka langsung kapan saja tanpa sinyal.
          </div>
        </div>
      </div>
    `
  },
  {
    filename: '19_pairing_printer_bluetooth.png',
    title: '4. Pengaturan Bluetooth & Pemasangan Printer Thermal',
    badge: 'LANGKAH 4: PAIRING PRINTER THERMAL',
    html: `
      <div class="android-tablet">
        <div class="status-bar">
          <span>09:45</span>
          <span style="display:flex; gap:8px;"><span>📶 Wi-Fi</span><span>🔋 96%</span></span>
        </div>
        <div class="nav-bar">
          <div class="back-btn">‹</div>
          <div class="nav-title">Pengaturan Bluetooth Tablet</div>
          <div class="search-btn">🔄 Pindai</div>
        </div>
        <div class="content-body">
          <div class="setting-card" style="margin-bottom:16px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <div>
                <div style="font-weight:700; font-size:15px; color:#0F172A;">Bluetooth</div>
                <div style="font-size:12.5px; color:#10B981; font-weight:600;">Sedang aktif dan dapat dilihat oleh perangkat sekitar</div>
              </div>
              <div class="toggle-switch on">
                <div class="toggle-circle"></div>
              </div>
            </div>
          </div>

          <div class="section-label">PERANGKAT YANG TERHUBUNG (PAIRED DEVICES)</div>
          
          <div class="permission-item" style="border-left: 4px solid #10B981;">
            <div class="perm-icon" style="background:#ECFDF5; color:#059669;">🖨️</div>
            <div style="flex:1;">
              <div class="perm-name" style="color:#065F46;">RPP02N / Thermal Printer 58mm</div>
              <div class="perm-sub">Tersambung untuk audio dan pencetakan data struk kasir</div>
            </div>
            <span class="status-pill" style="background:#D1FAE5; color:#065F46;">Tersambung ✓</span>
          </div>

          <div class="section-label" style="margin-top:20px;">KODE PIN PAIRING STANDAR</div>
          <div class="grid-pair">
            <div class="pin-card">
              <div class="pin-val">0000</div>
              <div class="pin-desc">PIN Default Printer Umum</div>
            </div>
            <div class="pin-card">
              <div class="pin-val">1234</div>
              <div class="pin-desc">PIN Alternatif Printer Portable</div>
            </div>
          </div>

          <div class="tip-box" style="margin-top:20px;">
            🖨️ <strong>Pengujian Struk:</strong> Setelah printer berstatus <em>Tersambung</em>, buka menu <strong>POS Kasir</strong> di aplikasi dan lakukan transaksi perdana untuk mencetak nota kasir secara instan.
          </div>
        </div>
      </div>
    `
  }
];

const cssStyles = `
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
  body { background: #0B132B; padding: 30px; display: flex; justify-content: center; align-items: center; }
  
  .canvas {
    width: 1100px;
    background: #0F172A;
    border-radius: 24px;
    padding: 24px;
    box-shadow: 0 25px 60px rgba(0,0,0,0.5);
    border: 2px solid #334155;
  }

  .canvas-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 14px;
    border-bottom: 1px solid #1E293B;
  }

  .canvas-badge {
    background: #0284C7;
    color: #FFFFFF;
    font-size: 11px;
    font-weight: 800;
    padding: 4px 12px;
    border-radius: 20px;
    letter-spacing: 0.8px;
  }

  .canvas-title {
    color: #F8FAFC;
    font-size: 18px;
    font-weight: 800;
  }

  .android-tablet {
    background: #F1F5F9;
    border-radius: 18px;
    overflow: hidden;
    border: 1px solid #CBD5E1;
    box-shadow: 0 12px 30px rgba(0,0,0,0.25);
  }

  .status-bar {
    background: #E2E8F0;
    padding: 6px 20px;
    display: flex;
    justify-content: space-between;
    font-size: 11.5px;
    font-weight: 700;
    color: #475569;
  }

  .nav-bar {
    background: #FFFFFF;
    padding: 12px 20px;
    display: flex;
    align-items: center;
    gap: 14px;
    border-bottom: 1px solid #E2E8F0;
  }

  .back-btn {
    font-size: 24px;
    font-weight: 700;
    color: #1E293B;
    cursor: pointer;
  }

  .nav-title {
    font-size: 16px;
    font-weight: 700;
    color: #0F172A;
    flex: 1;
  }

  .search-btn {
    font-size: 13px;
    color: #0284C7;
    font-weight: 700;
  }

  .content-body {
    padding: 24px;
  }

  .app-info-row, .app-hero {
    display: flex;
    align-items: center;
    gap: 14px;
    background: #FFFFFF;
    padding: 16px 20px;
    border-radius: 12px;
    border: 1px solid #E2E8F0;
    margin-bottom: 16px;
  }

  .app-icon {
    width: 44px;
    height: 44px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #FFFFFF;
    font-size: 20px;
  }

  .setting-card {
    background: #FFFFFF;
    padding: 18px 20px;
    border-radius: 12px;
    border: 1px solid #E2E8F0;
  }

  .toggle-switch {
    width: 48px;
    height: 26px;
    background: #CBD5E1;
    border-radius: 14px;
    position: relative;
    padding: 2px;
  }

  .toggle-switch.on {
    background: #0284C7;
  }

  .toggle-circle {
    width: 22px;
    height: 22px;
    background: #FFFFFF;
    border-radius: 50%;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    position: absolute;
    left: 2px;
    transition: 0.2s;
  }

  .toggle-switch.on .toggle-circle {
    left: 24px;
  }

  .dialog-mockup {
    background: #FFFFFF;
    border: 2px solid #0284C7;
    border-radius: 14px;
    padding: 20px;
    margin-top: 20px;
    box-shadow: 0 10px 25px rgba(2, 132, 199, 0.15);
  }

  .dialog-header {
    display: flex;
    align-items: center;
    gap: 12px;
    border-bottom: 1px solid #E2E8F0;
    padding-bottom: 12px;
  }

  .dialog-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 14px;
  }

  .btn-cancel {
    padding: 8px 18px;
    border: 1px solid #CBD5E1;
    background: #F8FAFC;
    border-radius: 8px;
    font-weight: 600;
    color: #475569;
    font-size: 13px;
  }

  .btn-confirm {
    padding: 8px 22px;
    border: none;
    background: #073C64;
    color: #FFFFFF;
    border-radius: 8px;
    font-weight: 700;
    font-size: 13px;
  }

  .section-label {
    font-size: 11.5px;
    font-weight: 800;
    color: #64748B;
    letter-spacing: 0.8px;
    margin-bottom: 8px;
  }

  .permission-item {
    background: #FFFFFF;
    padding: 14px 18px;
    border-radius: 10px;
    border: 1px solid #E2E8F0;
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 10px;
  }

  .perm-icon {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
  }

  .perm-name {
    font-weight: 700;
    font-size: 14.5px;
    color: #0F172A;
  }

  .perm-sub {
    font-size: 12px;
    color: #64748B;
    margin-top: 2px;
  }

  .status-pill {
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 11.5px;
    font-weight: 700;
  }

  .status-pill.allowed {
    background: #DCFCE7;
    color: #15803D;
  }

  .radio-card {
    background: #FFFFFF;
    border: 1px solid #CBD5E1;
    border-radius: 12px;
    padding: 16px 18px;
    display: flex;
    align-items: flex-start;
    gap: 14px;
    margin-bottom: 12px;
  }

  .radio-card.selected {
    border: 2px solid #0284C7;
    background: #F0F9FF;
  }

  .radio-circle {
    width: 20px;
    height: 20px;
    border: 2px solid #94A3B8;
    border-radius: 50%;
    margin-top: 2px;
    flex-shrink: 0;
  }

  .radio-circle.checked {
    border-color: #0284C7;
    background: radial-gradient(circle, #0284C7 45%, #FFFFFF 46%);
  }

  .tip-box {
    background: #EFF6FF;
    border-left: 4px solid #0284C7;
    padding: 12px 16px;
    border-radius: 8px;
    font-size: 13px;
    color: #075985;
    line-height: 1.5;
  }

  .grid-pair {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }

  .pin-card {
    background: #FFFFFF;
    border: 1px solid #E2E8F0;
    border-radius: 10px;
    padding: 14px;
    text-align: center;
  }

  .pin-val {
    font-size: 24px;
    font-weight: 800;
    color: #073C64;
    letter-spacing: 4px;
  }

  .pin-desc {
    font-size: 11.5px;
    color: #64748B;
    margin-top: 4px;
  }
`;

async function run() {
  console.log('Launching browser to capture Android Permission Screens...');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    defaultViewport: { width: 1180, height: 780, deviceScaleFactor: 2 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  for (const s of screens) {
    console.log(`Generating: ${s.filename} (${s.title})...`);
    const fullHtml = `<!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>${cssStyles}</style>
    </head>
    <body>
      <div class="canvas">
        <div class="canvas-header">
          <div class="canvas-title">${s.title}</div>
          <div class="canvas-badge">${s.badge}</div>
        </div>
        ${s.html}
      </div>
    </body>
    </html>`;

    await page.setContent(fullHtml, { waitUntil: 'load' });
    await new Promise(r => setTimeout(r, 200));

    const outPath = path.join(ASSETS_DIR, s.filename);
    await page.screenshot({ path: outPath, fullPage: true });
    console.log(`✓ Saved: ${outPath}`);
  }

  await browser.close();
  console.log('ALL ANDROID PERMISSION SCREENS GENERATED SUCCESSFULLY!');
}

run().catch(err => {
  console.error('Error generating permission screens:', err);
  process.exit(1);
});
