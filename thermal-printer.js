// =======================================================
// Raya Koffie - Offline Bluetooth ESC/POS Thermal Printer Driver
// Supports: Native Android Bluetooth (Capacitor), Direct Web Bluetooth, Android POS Intent (RawBT), & System Print
// =======================================================

import { registerPlugin, Capacitor } from '@capacitor/core';

const BluetoothPrinter = registerPlugin('BluetoothPrinter');

let connectedBluetoothDevice = null;
let bluetoothCharacteristic = null;

// Standard ESC/POS Constants
const ESC = '\x1b';
const GS = '\x1d';
const CMD = {
  INIT: ESC + '@',
  ALIGN_LEFT: ESC + 'a\x00',
  ALIGN_CENTER: ESC + 'a\x01',
  ALIGN_RIGHT: ESC + 'a\x02',
  BOLD_ON: ESC + 'E\x01',
  BOLD_OFF: ESC + 'E\x00',
  DOUBLE_ON: ESC + '!\x30',
  DOUBLE_OFF: ESC + '!\x00',
  FEED_3: ESC + 'd\x03',
  CUT: GS + 'V\x41\x00'
};

/**
 * Format string into a fixed width 2-column receipt row
 * @param {string} leftText 
 * @param {string} rightText 
 * @param {number} width (32 for 58mm, 48 for 80mm)
 */
function formatTwoColumns(leftText, rightText, width = 32) {
  const maxLeft = width - rightText.length - 1;
  let truncatedLeft = leftText;
  if (truncatedLeft.length > maxLeft) {
    truncatedLeft = truncatedLeft.substring(0, maxLeft);
  }
  const spaceCount = Math.max(1, width - truncatedLeft.length - rightText.length);
  return truncatedLeft + ' '.repeat(spaceCount) + rightText + '\n';
}

function formatDivider(char = '-', width = 32) {
  return char.repeat(width) + '\n';
}

/**
 * Generate ESC/POS Byte Buffer from Transaction Data
 */
export function generateEscPosBytes(trx, paperWidth = 32) {
  let esc = '';
  
  // 1. Initialize & Center Header
  esc += CMD.INIT;
  esc += CMD.ALIGN_CENTER;
  esc += CMD.BOLD_ON + CMD.DOUBLE_ON;
  esc += 'RAYA KOFFIE\n';
  esc += '& CARWASH\n';
  esc += CMD.DOUBLE_OFF + CMD.BOLD_OFF;
  esc += 'Daya Asri, TUBABA\n';
  esc += 'IG: @raya_koffie_tubaba\n';
  esc += formatDivider('=', paperWidth);

  if (trx && trx.isCashbookReceipt) {
    esc += CMD.ALIGN_CENTER + CMD.BOLD_ON;
    esc += 'BUKU KAS & TUTUP LACI\n';
    esc += CMD.BOLD_OFF + CMD.ALIGN_LEFT;
    esc += `Tgl  : ${trx.friendlyDate || trx.date}\n`;
    esc += `Kasir: ${trx.cashierName || 'Kasir Raya'}\n`;
    esc += formatDivider('-', paperWidth);

    esc += CMD.BOLD_ON;
    esc += formatTwoColumns('Modal Awal', 'Rp ' + (trx.modalAwal || 0).toLocaleString('id-ID'), paperWidth);
    esc += CMD.BOLD_OFF;

    esc += 'Belanja Harian:\n';
    if (trx.shoppingItems && trx.shoppingItems.length > 0) {
      trx.shoppingItems.forEach(item => {
        esc += formatTwoColumns(`* ${item.desc}`, (item.amount || 0).toLocaleString('id-ID'), paperWidth);
      });
    } else {
      esc += '  (Tidak ada belanja kas)\n';
    }
    esc += formatTwoColumns('Total Belanja', '-' + (trx.belanjaHarian || 0).toLocaleString('id-ID'), paperWidth);
    esc += formatDivider('-', paperWidth);

    const sisaSign = (trx.sisaModal || 0) < 0 ? '-' : '';
    const sisaStr = `${sisaSign}Rp ${Math.abs(trx.sisaModal || 0).toLocaleString('id-ID')}`;
    esc += CMD.BOLD_ON;
    esc += formatTwoColumns('Sisa Modal', sisaStr, paperWidth);
    esc += CMD.BOLD_OFF;
    esc += formatDivider('-', paperWidth);

    esc += formatTwoColumns('Pendapatan', (trx.pendapatan || 0).toLocaleString('id-ID'), paperWidth);
    esc += formatTwoColumns('Online', '-' + (trx.online || 0).toLocaleString('id-ID'), paperWidth);
    esc += formatDivider('=', paperWidth);

    esc += CMD.BOLD_ON;
    esc += formatTwoColumns('TOTAL TUNAI', 'Rp ' + (trx.totalTunai || 0).toLocaleString('id-ID'), paperWidth);
    esc += CMD.BOLD_OFF;
    esc += formatDivider('-', paperWidth);

    esc += formatTwoColumns('Save (Setor)', 'Rp ' + (trx.saveAmount || 0).toLocaleString('id-ID'), paperWidth);
    esc += CMD.BOLD_ON;
    esc += formatTwoColumns('Modal Esok', 'Rp ' + (trx.modalEsok || 0).toLocaleString('id-ID'), paperWidth);
    esc += CMD.BOLD_OFF;
    esc += formatDivider('=', paperWidth);
    esc += CMD.ALIGN_CENTER;
    esc += 'Rumus: Pendapatan (+-) Sisa\n';
    esc += 'Modal - Online = Tunai\n\n';
    esc += CMD.FEED_3;
    esc += CMD.CUT;

    const uint8Cb = new Uint8Array(esc.length);
    for (let i = 0; i < esc.length; i++) {
      uint8Cb[i] = esc.charCodeAt(i) & 0xff;
    }
    return uint8Cb;
  }

  // 2. Transaction Metadata (Left-aligned)
  esc += CMD.ALIGN_LEFT;
  esc += `No   : ${trx.id}\n`;
  esc += `Waktu: ${trx.date} ${trx.time}\n`;
  esc += `Kasir: ${trx.cashierName || 'Kasir Raya'}\n`;
  esc += `Tipe : ${trx.type} (${trx.ref || '-'})\n`;
  esc += formatDivider('-', paperWidth);

  // 3. Items List
  if (trx.items && trx.items.length > 0) {
    trx.items.forEach(item => {
      const itemTitle = `${item.name}${item.notes ? ' (' + item.notes + ')' : ''}`;
      const itemPriceStr = (item.price * item.qty).toLocaleString('id-ID');
      esc += `${itemTitle}\n`;
      esc += formatTwoColumns(`  ${item.qty} x ${item.price.toLocaleString('id-ID')}`, itemPriceStr, paperWidth);
    });
  }
  esc += formatDivider('-', paperWidth);

  // 4. Totals & Payment Summary
  esc += formatTwoColumns('Subtotal', (trx.subtotal || 0).toLocaleString('id-ID'), paperWidth);
  if (trx.discount && trx.discount > 0) {
    esc += formatTwoColumns('Diskon', '-' + trx.discount.toLocaleString('id-ID'), paperWidth);
  }
  if (trx.tax && trx.tax > 0) {
    esc += formatTwoColumns('Pajak PB1 (11%)', trx.tax.toLocaleString('id-ID'), paperWidth);
  }
  esc += formatDivider('-', paperWidth);

  esc += CMD.BOLD_ON;
  esc += formatTwoColumns('TOTAL', 'Rp ' + (trx.total || 0).toLocaleString('id-ID'), paperWidth);
  esc += CMD.BOLD_OFF;

  esc += formatTwoColumns(trx.method || 'TUNAI', (trx.paid || trx.total || 0).toLocaleString('id-ID'), paperWidth);
  if (trx.method === 'TUNAI' && trx.change !== undefined) {
    esc += formatTwoColumns('Kembalian', (trx.change || 0).toLocaleString('id-ID'), paperWidth);
  }

  // 5. Footer & Paper Feed
  esc += CMD.ALIGN_CENTER;
  esc += formatDivider('=', paperWidth);
  esc += 'Terima Kasih Atas Kunjungan Anda\n';
  esc += 'Kritik & Saran: 0812-3456-7890\n\n';
  esc += CMD.FEED_3;
  esc += CMD.CUT;

  // Convert string to Uint8Array (CP437 / ISO-8859-1 compatible)
  const uint8 = new Uint8Array(esc.length);
  for (let i = 0; i < esc.length; i++) {
    uint8[i] = esc.charCodeAt(i) & 0xff;
  }
  return uint8;
}

/**
 * Convert Uint8Array to Base64 String
 */
export function uint8ArrayToBase64(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Connect/Select Bluetooth Thermal Printer
 * Supports Native Android Bluetooth (Capacitor) & Web Bluetooth fallback
 */
export async function connectBluetoothPrinter() {
  if (Capacitor.isNativePlatform()) {
    const res = await BluetoothPrinter.listPairedDevices();
    const list = res.devices || [];
    if (list.length === 0) {
      throw new Error('Tidak ada printer Bluetooth yang tersambung (paired). Buka Pengaturan Bluetooth tablet dan pasangkan printer thermal Anda terlebih dahulu.');
    }

    // Prioritize device with printer keyword
    let target = list.find(d => {
      const n = (d.name || '').toLowerCase();
      return n.includes('print') || n.includes('pos') || n.includes('rpp') || 
             n.includes('mtp') || n.includes('58') || n.includes('80') || 
             n.includes('xp') || n.includes('vsc') || n.includes('panda') || 
             n.includes('eppos') || n.includes('thermal') || n.includes('bt');
    }) || list[0];

    localStorage.setItem('raya_thermal_printer_mac', target.address);
    localStorage.setItem('raya_thermal_printer_name', target.name || 'Printer Thermal');
    return target.name || target.address;
  }

  // Web Bluetooth (Desktop Chrome fallback)
  if (!navigator.bluetooth) {
    throw new Error('Web Bluetooth tidak didukung di perangkat ini. Gunakan opsi Cetak RawBT atau Cetak Sistem.');
  }

  try {
    const device = await navigator.bluetooth.requestDevice({
      filters: [
        { services: ['000018f0-0000-1000-8000-00805f9b34fb'] }, // Standard Printer Service
        { services: ['e7810a71-73ae-499d-8c15-faa9aef0c3f2'] },
        { services: ['49535343-fe7d-4ae5-8fa9-9fafd205e455'] }
      ],
      optionalServices: [
        '000018f0-0000-1000-8000-00805f9b34fb',
        'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
        '49535343-fe7d-4ae5-8fa9-9fafd205e455',
        '0000ffe0-0000-1000-8000-00805f9b34fb',
        '0000ff00-0000-1000-8000-00805f9b34fb'
      ],
      acceptAllDevices: true
    });

    const server = await device.gatt.connect();
    connectedBluetoothDevice = device;

    // Find printable characteristic
    const services = await server.getPrimaryServices();
    for (const service of services) {
      const characteristics = await service.getCharacteristics();
      for (const char of characteristics) {
        if (char.properties.write || char.properties.writeWithoutResponse) {
          bluetoothCharacteristic = char;
          break;
        }
      }
      if (bluetoothCharacteristic) break;
    }

    if (!bluetoothCharacteristic) {
      throw new Error('Tidak dapat menemukan jalur tulis (write characteristic) pada printer ini.');
    }

    return device.name || 'Printer Bluetooth';
  } catch (err) {
    if (err.name === 'NotFoundError') {
      throw new Error('Pencarian printer dibatalkan.');
    }
    throw err;
  }
}

/**
 * Print Directly to Connected Bluetooth Device
 * Supports Native Android SPP Socket (Capacitor) & Web Bluetooth GATT fallback
 */
export async function printDirectBluetooth(trx, paperWidth = 32) {
  const bytes = generateEscPosBytes(trx, paperWidth);

  // 1. Native Android Bluetooth Print (Capacitor on Tablet)
  if (Capacitor.isNativePlatform()) {
    const base64Data = uint8ArrayToBase64(bytes);
    const savedMac = localStorage.getItem('raya_thermal_printer_mac') || null;

    const res = await BluetoothPrinter.printRaw({
      data: base64Data,
      address: savedMac
    });

    if (res && res.deviceName) {
      localStorage.setItem('raya_thermal_printer_name', res.deviceName);
    }
    return res.deviceName || 'Printer Thermal';
  }

  // 2. Web Bluetooth fallback (Desktop Chrome)
  if (!bluetoothCharacteristic) {
    await connectBluetoothPrinter();
  }

  if (!bluetoothCharacteristic) {
    throw new Error('Printer Bluetooth belum terhubung.');
  }

  const CHUNK_SIZE = 512;
  for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
    const chunk = bytes.slice(i, i + CHUNK_SIZE);
    if (bluetoothCharacteristic.writeValueWithoutResponse) {
      await bluetoothCharacteristic.writeValueWithoutResponse(chunk);
    } else {
      await bluetoothCharacteristic.writeValue(chunk);
    }
    await new Promise(r => setTimeout(r, 40));
  }
}

/**
 * Print via Universal Android POS Intent (RawBT Protocol)
 * Works 100% offline with any paired Bluetooth/USB printer on Android
 */
export function printViaRawBtIntent(trx, paperWidth = 32) {
  const bytes = generateEscPosBytes(trx, paperWidth);
  const base64Data = uint8ArrayToBase64(bytes);
  const rawBtUrl = `rawbt:data:base64,${base64Data}`;
  window.location.href = rawBtUrl;
}

/**
 * Trigger Android Native PrintManager on Tablet or window.print() on Browser
 */
export async function printViaSystemWebView(jobName = 'Raya_Koffie_Struk') {
  if (Capacitor.isNativePlatform()) {
    await BluetoothPrinter.printSystemWebView({ jobName });
    return;
  }
  window.print();
}
