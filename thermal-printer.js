// =======================================================
// Raya Koffie - Offline Bluetooth ESC/POS Thermal Printer Driver
// Supports: Direct Web Bluetooth, Android POS Intent (RawBT), & System Print
// =======================================================

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
 * Connect to Nearby Bluetooth Thermal Printer via Web Bluetooth
 */
export async function connectBluetoothPrinter() {
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
 */
export async function printDirectBluetooth(trx, paperWidth = 32) {
  if (!bluetoothCharacteristic) {
    // Attempt connection
    await connectBluetoothPrinter();
  }

  if (!bluetoothCharacteristic) {
    throw new Error('Printer Bluetooth belum terhubung.');
  }

  const bytes = generateEscPosBytes(trx, paperWidth);
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
  
  // Convert bytes to Base64
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64Data = btoa(binary);

  // RawBT Intent URL format
  const rawBtUrl = `rawbt:data:base64,${base64Data}`;
  window.location.href = rawBtUrl;
}
