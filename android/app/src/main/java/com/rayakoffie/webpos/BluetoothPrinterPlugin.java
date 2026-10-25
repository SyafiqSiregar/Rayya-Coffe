package com.rayakoffie.webpos;

import android.Manifest;
import android.annotation.SuppressLint;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothSocket;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Context;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import android.provider.MediaStore;
import android.util.Base64;
import android.webkit.WebView;
import androidx.core.app.ActivityCompat;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.lang.reflect.Method;
import java.nio.charset.StandardCharsets;
import java.util.Set;
import java.util.UUID;

@CapacitorPlugin(
    name = "BluetoothPrinter",
    permissions = {
        @Permission(
            alias = "bluetooth",
            strings = {
                Manifest.permission.BLUETOOTH_CONNECT,
                Manifest.permission.BLUETOOTH_SCAN
            }
        )
    }
)
public class BluetoothPrinterPlugin extends Plugin {

    private static final UUID SPP_UUID = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB");

    private boolean checkBluetoothPermissions() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            return ActivityCompat.checkSelfPermission(getContext(), Manifest.permission.BLUETOOTH_CONNECT) == PackageManager.PERMISSION_GRANTED;
        }
        return true;
    }

    @PluginMethod
    public void listPairedDevices(PluginCall call) {
        if (!checkBluetoothPermissions()) {
            requestPermissionForAlias("bluetooth", call, "listDevicesPermissionCallback");
            return;
        }
        fetchPairedDevices(call);
    }

    @PermissionCallback
    private void listDevicesPermissionCallback(PluginCall call) {
        if (checkBluetoothPermissions()) {
            fetchPairedDevices(call);
        } else {
            call.reject("Izin akses Bluetooth ditolak oleh pengguna");
        }
    }

    @SuppressLint("MissingPermission")
    private void fetchPairedDevices(PluginCall call) {
        try {
            BluetoothAdapter adapter = BluetoothAdapter.getDefaultAdapter();
            if (adapter == null) {
                call.reject("Perangkat tidak memiliki Bluetooth hardware.");
                return;
            }
            if (!adapter.isEnabled()) {
                call.reject("Bluetooth di tablet belum aktif. Silakan nyalakan Bluetooth terlebih dahulu.");
                return;
            }

            Set<BluetoothDevice> pairedDevices = adapter.getBondedDevices();
            JSArray devList = new JSArray();
            if (pairedDevices != null) {
                for (BluetoothDevice device : pairedDevices) {
                    JSObject item = new JSObject();
                    item.put("name", device.getName() != null ? device.getName() : "Unknown");
                    item.put("address", device.getAddress());
                    devList.put(item);
                }
            }

            JSObject result = new JSObject();
            result.put("devices", devList);
            call.resolve(result);
        } catch (Exception e) {
            call.reject("Gagal memuat perangkat Bluetooth: " + e.getMessage());
        }
    }

    @PluginMethod
    public void printRaw(PluginCall call) {
        if (!checkBluetoothPermissions()) {
            requestPermissionForAlias("bluetooth", call, "printPermissionCallback");
            return;
        }
        executePrint(call);
    }

    @PermissionCallback
    private void printPermissionCallback(PluginCall call) {
        if (checkBluetoothPermissions()) {
            executePrint(call);
        } else {
            call.reject("Izin akses Bluetooth ditolak oleh pengguna.");
        }
    }

    @SuppressLint("MissingPermission")
    private void executePrint(PluginCall call) {
        final String base64Data = call.getString("data");
        final String targetAddress = call.getString("address");

        if (base64Data == null || base64Data.isEmpty()) {
            call.reject("Data cetak kosong.");
            return;
        }

        // Run socket connection on worker thread to avoid blocking UI
        new Thread(() -> {
            BluetoothSocket socket = null;
            try {
                BluetoothAdapter adapter = BluetoothAdapter.getDefaultAdapter();
                if (adapter == null) {
                    call.reject("Perangkat tidak mendukung Bluetooth.");
                    return;
                }
                if (!adapter.isEnabled()) {
                    call.reject("Bluetooth tablet belum aktif. Silakan nyalakan Bluetooth di tablet.");
                    return;
                }

                Set<BluetoothDevice> bonded = adapter.getBondedDevices();
                if (bonded == null || bonded.isEmpty()) {
                    call.reject("Tidak ada printer Bluetooth yang tersambung (paired). Silakan pasangkan printer thermal di menu Pengaturan Bluetooth tablet terlebih dahulu.");
                    return;
                }

                BluetoothDevice selectedDevice = null;
                if (targetAddress != null && !targetAddress.isEmpty()) {
                    for (BluetoothDevice d : bonded) {
                        if (targetAddress.equalsIgnoreCase(d.getAddress())) {
                            selectedDevice = d;
                            break;
                        }
                    }
                }

                // If not found or not specified, prioritize devices with printer keywords
                if (selectedDevice == null) {
                    for (BluetoothDevice d : bonded) {
                        String name = d.getName() != null ? d.getName().toLowerCase() : "";
                        if (name.contains("print") || name.contains("pos") || name.contains("rpp") ||
                            name.contains("mtp") || name.contains("58") || name.contains("80") ||
                            name.contains("xp") || name.contains("vsc") || name.contains("panda") ||
                            name.contains("eppos") || name.contains("thermal") || name.contains("bt")) {
                            selectedDevice = d;
                            break;
                        }
                    }
                }

                if (selectedDevice == null) {
                    selectedDevice = bonded.iterator().next();
                }

                adapter.cancelDiscovery();

                byte[] printBytes = Base64.decode(base64Data, Base64.DEFAULT);

                // Connect via SPP RFCOMM
                try {
                    socket = selectedDevice.createRfcommSocketToServiceRecord(SPP_UUID);
                    socket.connect();
                } catch (Exception connectEx) {
                    // Fallback using reflection for older ESC/POS printers
                    if (socket != null) {
                        try { socket.close(); } catch (Exception ignored) {}
                    }
                    Method m = selectedDevice.getClass().getMethod("createRfcommSocket", int.class);
                    socket = (BluetoothSocket) m.invoke(selectedDevice, 1);
                    socket.connect();
                }

                OutputStream os = socket.getOutputStream();
                os.write(printBytes);
                os.flush();

                // Small delay to ensure RFCOMM buffer transmission before closing socket
                try {
                    Thread.sleep(300);
                } catch (InterruptedException ignored) {}

                JSObject res = new JSObject();
                res.put("success", true);
                res.put("deviceName", selectedDevice.getName());
                call.resolve(res);

            } catch (Exception e) {
                call.reject("Gagal mencetak ke printer: " + e.getMessage());
            } finally {
                if (socket != null) {
                    try {
                        socket.close();
                    } catch (Exception ignored) {}
                }
            }
        }).start();
    }

    @PluginMethod
    public void saveFileToDownloads(PluginCall call) {
        final String fileName = call.getString("fileName");
        final String content = call.getString("content");
        final String mimeType = call.getString("mimeType", "application/octet-stream");
        final boolean isBase64 = Boolean.TRUE.equals(call.getBoolean("isBase64", false));

        if (fileName == null || fileName.isEmpty() || content == null) {
            call.reject("Nama file atau isi dokumen kosong.");
            return;
        }

        new Thread(() -> {
            try {
                byte[] fileBytes;
                if (isBase64) {
                    fileBytes = Base64.decode(content, Base64.DEFAULT);
                } else {
                    fileBytes = content.getBytes(StandardCharsets.UTF_8);
                }

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    ContentResolver resolver = getContext().getContentResolver();
                    ContentValues values = new ContentValues();
                    values.put(MediaStore.MediaColumns.DISPLAY_NAME, fileName);
                    values.put(MediaStore.MediaColumns.MIME_TYPE, mimeType);
                    values.put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/RayaKoffie");

                    Uri uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
                    if (uri == null) {
                        throw new Exception("Gagal membuat entri file di MediaStore Downloads.");
                    }
                    try (OutputStream os = resolver.openOutputStream(uri)) {
                        if (os == null) {
                            throw new Exception("Gagal membuka OutputStream untuk file.");
                        }
                        os.write(fileBytes);
                        os.flush();
                    }
                } else {
                    File downloadDir = new File(
                        Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS),
                        "RayaKoffie"
                    );
                    if (!downloadDir.exists() && !downloadDir.mkdirs()) {
                        downloadDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
                    }
                    File outFile = new File(downloadDir, fileName);
                    try (FileOutputStream fos = new FileOutputStream(outFile)) {
                        fos.write(fileBytes);
                        fos.flush();
                    }
                }

                JSObject res = new JSObject();
                res.put("success", true);
                res.put("path", "Download/RayaKoffie/" + fileName);
                res.put("message", "File berhasil disimpan ke tablet: Download/RayaKoffie/" + fileName);
                call.resolve(res);
            } catch (Exception e) {
                call.reject("Gagal menyimpan file ke Download: " + e.getMessage());
            }
        }).start();
    }

    @PluginMethod
    public void printSystemWebView(PluginCall call) {
        final String jobName = call.getString("jobName", "Raya_Koffie_POS_Print");
        if (getActivity() == null || getBridge() == null || getBridge().getWebView() == null) {
            call.reject("WebView belum siap untuk mencetak.");
            return;
        }
        getActivity().runOnUiThread(() -> {
            try {
                WebView webView = getBridge().getWebView();
                PrintManager printManager = (PrintManager) getContext().getSystemService(Context.PRINT_SERVICE);
                if (printManager == null) {
                    call.reject("Layanan cetak sistem Android tidak tersedia di perangkat ini.");
                    return;
                }
                PrintDocumentAdapter adapter = webView.createPrintDocumentAdapter(jobName);
                printManager.print(jobName, adapter, new PrintAttributes.Builder().build());
                JSObject res = new JSObject();
                res.put("success", true);
                call.resolve(res);
            } catch (Exception e) {
                call.reject("Gagal membuka dialog cetak sistem: " + e.getMessage());
            }
        });
    }
}
