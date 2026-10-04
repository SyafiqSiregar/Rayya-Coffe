import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

/**
 * Save text/HTML/Base64 content directly to the Android Tablet's Local Storage (Documents / Download)
 * 100% Offline, no external APIs required.
 * 
 * @param {string} fileName - e.g. "Rekap_RayaKoffie_kafe_2026-10-03.pdf" or ".xls"
 * @param {string} fileContent - Plain text or Base64 string
 * @param {string} mimeType - e.g. "application/pdf" or "application/vnd.ms-excel"
 * @param {boolean} isBase64 - true if saving binary (like PDF base64)
 * @returns {Promise<{success: boolean, path: string, message: string}>}
 */
export async function saveFileToLocalDevice(fileName, fileContent, mimeType = 'application/vnd.ms-excel', isBase64 = false) {
  try {
    // 1. Try Native Capacitor Filesystem (Offline Local Device Storage)
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
    console.warn('Capacitor Filesystem not active or failed, using browser fallback download:', nativeErr);
    
    // 2. Browser Local Download Fallback
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

