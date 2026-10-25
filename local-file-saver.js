import { registerPlugin, Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

const BluetoothPrinter = registerPlugin('BluetoothPrinter');

/**
 * Save text/HTML/Base64 content directly to the Android Tablet's Local Storage (Download/RayaKoffie or Documents/RayaKoffie)
 * 100% Offline, no external APIs required.
 * 
 * @param {string} fileName - e.g. "Rekap_RayaKoffie_kafe_2026-10-03.pdf" or ".xls"
 * @param {string} fileContent - Plain text or Base64 string
 * @param {string} mimeType - e.g. "application/pdf" or "application/vnd.ms-excel"
 * @param {boolean} isBase64 - true if saving binary (like PDF base64)
 * @returns {Promise<{success: boolean, path: string, message: string}>}
 */
export async function saveFileToLocalDevice(fileName, fileContent, mimeType = 'application/vnd.ms-excel', isBase64 = false) {
  // 1. Primary on Android Tablet: Native MediaStore Downloads (Zero Scoped Storage issues on Android 10-16+)
  if (Capacitor.isNativePlatform()) {
    try {
      const nativeRes = await BluetoothPrinter.saveFileToDownloads({
        fileName,
        content: fileContent,
        mimeType,
        isBase64: Boolean(isBase64)
      });
      if (nativeRes && nativeRes.success) {
        return {
          success: true,
          path: nativeRes.path || `Download/RayaKoffie/${fileName}`,
          message: nativeRes.message || `File berhasil disimpan: Download/RayaKoffie/${fileName}`
        };
      }
    } catch (mediaStoreErr) {
      console.warn('MediaStore saveFileToDownloads fallback to Capacitor Filesystem:', mediaStoreErr);
    }
  }

  try {
    // 2. Fallback Native Capacitor Filesystem (Offline Local Device Storage)
    const writeOptions = {
      path: `RayaKoffie/${fileName}`,
      data: fileContent,
      directory: Directory.Documents,
      recursive: true
    };

    if (!isBase64) {
      writeOptions.encoding = Encoding.UTF8;
    }

    const result = await Filesystem.writeFile(writeOptions);

    console.log('File successfully saved locally via Capacitor Filesystem:', result.uri);
    return {
      success: true,
      path: result.uri || `Documents/RayaKoffie/${fileName}`,
      message: `File berhasil disimpan ke memori internal: Documents/RayaKoffie/${fileName}`
    };
  } catch (nativeErr) {
    console.warn('Capacitor Filesystem Documents failed, trying External/Browser fallback:', nativeErr);

    if (Capacitor.isNativePlatform()) {
      try {
        const extWriteOptions = {
          path: `RayaKoffie/${fileName}`,
          data: fileContent,
          directory: Directory.External,
          recursive: true
        };
        if (!isBase64) {
          extWriteOptions.encoding = Encoding.UTF8;
        }
        const extRes = await Filesystem.writeFile(extWriteOptions);
        return {
          success: true,
          path: extRes.uri || `Android/data/com.rayakoffie.webpos/files/RayaKoffie/${fileName}`,
          message: `File berhasil disimpan di memori aplikasi: RayaKoffie/${fileName}`
        };
      } catch (extErr) {
        console.warn('Capacitor External directory also failed:', extErr);
      }
    }
    
    // 3. Browser Local Download Fallback
    try {
      let blob;
      if (isBase64) {
        // Convert Base64 to binary Uint8Array blob
        const byteCharacters = atob(fileContent);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        blob = new Blob([byteArray], { type: mimeType });
      } else {
        blob = new Blob([fileContent], { type: `${mimeType};charset=utf-8` });
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 2000);

      return {
        success: true,
        path: `Downloads/${fileName}`,
        message: `File ${fileName} berhasil diunduh ke folder Download!`
      };
    } catch (browserErr) {
      console.error('All download methods failed:', browserErr);
      throw new Error(`Gagal menyimpan file: ${browserErr.message}`);
    }
  }
}

