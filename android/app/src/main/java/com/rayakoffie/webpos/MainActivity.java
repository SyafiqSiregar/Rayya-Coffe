package com.rayakoffie.webpos;

import android.os.Bundle;
import android.webkit.WebView;
import androidx.activity.OnBackPressedCallback;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(BluetoothPrinterPlugin.class);
        super.onCreate(savedInstanceState);

        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (getBridge() != null && getBridge().getWebView() != null) {
                    WebView webView = getBridge().getWebView();
                    String js = "(function() {" +
                        "var modals = document.querySelectorAll('.modal-overlay.show');" +
                        "if (modals.length > 0) {" +
                        "  modals[modals.length - 1].classList.remove('show');" +
                        "  return 'HANDLED';" +
                        "}" +
                        "var drawer = document.getElementById('drawer-menu');" +
                        "if (drawer && drawer.classList.contains('show')) {" +
                        "  drawer.classList.remove('show');" +
                        "  return 'HANDLED';" +
                        "}" +
                        "return 'PASS';" +
                        "})()";
                    webView.evaluateJavascript(js, value -> {
                        if (value == null || !value.contains("HANDLED")) {
                            moveTaskToBack(true);
                        }
                    });
                } else {
                    moveTaskToBack(true);
                }
            }
        });
    }
}
