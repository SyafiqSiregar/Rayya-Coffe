import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const OUTPUT_DIR = path.resolve('docs/guide-assets');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function run() {
  console.log('Launching Edge for Tablet Screenshots (1200x820 @ 2x)...');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    defaultViewport: {
      width: 1200,
      height: 820,
      deviceScaleFactor: 2
    },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.goto('http://localhost:3456/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));

  // 1. Login Screen
  console.log('1. Capturing: 01_login.png');
  await page.screenshot({ path: path.join(OUTPUT_DIR, '01_login.png') });

  // Do Login as admin
  await page.type('#login-user', 'admin');
  await page.type('#login-pass', 'admin');
  await page.click('#btn-login');
  await new Promise(r => setTimeout(r, 800));

  // 2. Dashboard
  console.log('2. Capturing: 02_dashboard.png');
  await page.screenshot({ path: path.join(OUTPUT_DIR, '02_dashboard.png') });

  // 3. POS Kafe & Carwash
  console.log('3. Capturing: 03_pos_kafe.png');
  await page.click('[data-target="pos"]');
  await new Promise(r => setTimeout(r, 600));
  
  // Click first 2 menu cards
  const menuCards = await page.$$('.menu-card');
  if (menuCards.length >= 2) {
    await menuCards[0].click();
    await new Promise(r => setTimeout(r, 200));
    await menuCards[1].click();
    await new Promise(r => setTimeout(r, 200));
    if (menuCards.length >= 3) await menuCards[2].click();
  }
  await page.type('#order-reference', 'Meja 05 - Syafiq');
  await page.screenshot({ path: path.join(OUTPUT_DIR, '03_pos_kafe.png') });

  // 4. POS Carwash Filter
  console.log('4. Capturing: 04_pos_carwash.png');
  const carwashFilter = await page.$('.filter-btn[data-filter="CUCI"]');
  if (carwashFilter) {
    await carwashFilter.click();
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '04_pos_carwash.png') });
    // Switch back to all
    const allFilter = await page.$('.filter-btn[data-filter="all"]');
    if (allFilter) await allFilter.click();
  }

  // 5. Payment Modal
  console.log('5. Capturing: 05_modal_pembayaran.png');
  await page.click('#btn-checkout');
  await new Promise(r => setTimeout(r, 600));
  // Click pas or quick cash
  const btnPas = await page.$('.btn-numpad.action:last-child') || await page.$('.quick-btn');
  if (btnPas) await btnPas.click();
  await new Promise(r => setTimeout(r, 300));
  await page.screenshot({ path: path.join(OUTPUT_DIR, '05_modal_pembayaran.png') });

  // Confirm Payment to show Receipt
  console.log('6. Capturing: 06_struk_transaksi.png');
  await page.click('#btn-confirm-payment');
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(OUTPUT_DIR, '06_struk_transaksi.png') });

  // Close receipt modal
  const closeReceipt = await page.$('#modal-receipt .btn-outline') || await page.$('#modal-receipt button');
  if (closeReceipt) await closeReceipt.click();
  await new Promise(r => setTimeout(r, 500));

  // 7. Kelola Menu
  console.log('7. Capturing: 07_kelola_menu.png');
  await page.click('[data-target="menu-manage"]');
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(OUTPUT_DIR, '07_kelola_menu.png') });

  // Modal Tambah Menu
  console.log('8. Capturing: 08_modal_tambah_menu.png');
  const btnAddMenu = await page.$('[data-target="menu-manage"]') && await page.$('#menu-manage button.btn-primary-sm');
  if (btnAddMenu) {
    await btnAddMenu.click();
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '08_modal_tambah_menu.png') });
    const closeMenuModal = await page.$('#modal-add-menu .btn-outline');
    if (closeMenuModal) await closeMenuModal.click();
    await new Promise(r => setTimeout(r, 400));
  }

  // 9. Riwayat Transaksi
  console.log('9. Capturing: 09_riwayat_transaksi.png');
  await page.click('[data-target="history"]');
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(OUTPUT_DIR, '09_riwayat_transaksi.png') });

  // 10. Biaya Operasional
  console.log('10. Capturing: 10_biaya_operasional.png');
  await page.click('[data-target="expense"]');
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(OUTPUT_DIR, '10_biaya_operasional.png') });

  // Modal Tambah Biaya Operasional
  console.log('11. Capturing: 11_modal_tambah_biaya.png');
  await page.click('#btn-open-add-expense');
  await new Promise(r => setTimeout(r, 600));
  // Switch to Karyawan source to show the reimbursement preview
  const employeeSourceBtn = await page.$('.source-opt[data-source="KARYAWAN"]');
  if (employeeSourceBtn) await employeeSourceBtn.click();
  await new Promise(r => setTimeout(r, 300));
  await page.screenshot({ path: path.join(OUTPUT_DIR, '11_modal_tambah_biaya.png') });
  const closeExpenseModal = await page.$('#modal-add-expense .btn-outline');
  if (closeExpenseModal) await closeExpenseModal.click();
  await new Promise(r => setTimeout(r, 400));

  // 12. Manajemen Anggota
  console.log('12. Capturing: 12_manajemen_anggota.png');
  await page.click('[data-target="users"]');
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(OUTPUT_DIR, '12_manajemen_anggota.png') });

  // Modal Tambah Anggota
  console.log('13. Capturing: 13_modal_tambah_anggota.png');
  const btnAddUser = await page.$('#users button.btn-primary-sm');
  if (btnAddUser) {
    await btnAddUser.click();
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '13_modal_tambah_anggota.png') });
    const closeUserModal = await page.$('#modal-add-user .btn-outline');
    if (closeUserModal) await closeUserModal.click();
    await new Promise(r => setTimeout(r, 400));
  }

  // 14. Laporan Omset
  console.log('14. Capturing: 14_laporan_omset.png');
  await page.click('[data-target="reports"]');
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(OUTPUT_DIR, '14_laporan_omset.png') });

  // Modal Ekspor Laporan
  console.log('15. Capturing: 15_modal_ekspor_laporan.png');
  await page.click('#btn-open-export-modal');
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(OUTPUT_DIR, '15_modal_ekspor_laporan.png') });
  const closeExportModal = await page.$('#modal-export-report .btn-outline') || await page.$('#modal-export-report .btn-secondary');
  if (closeExportModal) await closeExportModal.click();
  await new Promise(r => setTimeout(r, 400));

  await browser.close();
  console.log('All 15 screenshots captured with high precision!');
}

run().catch(err => {
  console.error('Error during capture:', err);
  process.exit(1);
});
