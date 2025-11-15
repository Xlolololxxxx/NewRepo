package com.devbrowser.app;

import android.annotation.SuppressLint;
import android.os.Bundle;
import android.view.KeyEvent;
import android.view.View;
import android.view.inputmethod.EditorInfo;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.widget.Button;
import android.widget.CheckBox;
import android.widget.EditText;
import android.widget.ImageButton;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.app.Activity;
import java.util.HashMap;
import java.util.Map;

public class MainActivity extends Activity {

    private WebView webView;
    private EditText urlInput;
    private EditText consoleInput;
    private TextView consoleOutput;
    private TextView headersList;
    private LinearLayout consolePanel;
    private LinearLayout headersPanel;
    private ProgressBar progressBar;
    private CheckBox corsCheckbox;
    private EditText headerNameInput;
    private EditText headerValueInput;

    private Map<String, String> customHeaders = new HashMap<>();
    private CustomWebViewClient webViewClient;
    private CustomWebChromeClient webChromeClient;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        try {
            setContentView(R.layout.activity_main);
            initializeViews();
            setupWebView();
            setupListeners();

            // Load default page
            loadUrl("https://www.google.com");
        } catch (Exception e) {
            e.printStackTrace();
            // If anything fails, at least show an error
            android.util.Log.e("DevBrowser", "Failed to initialize: " + e.getMessage(), e);
        }
    }

    private void initializeViews() {
        webView = (WebView) findViewById(R.id.webview);
        urlInput = (EditText) findViewById(R.id.url_input);
        consoleInput = (EditText) findViewById(R.id.console_input);
        consoleOutput = (TextView) findViewById(R.id.console_output);
        headersList = (TextView) findViewById(R.id.headers_list);
        consolePanel = (LinearLayout) findViewById(R.id.console_panel);
        headersPanel = (LinearLayout) findViewById(R.id.headers_panel);
        progressBar = (ProgressBar) findViewById(R.id.progress_bar);
        corsCheckbox = (CheckBox) findViewById(R.id.cors_bypass_checkbox);
        headerNameInput = (EditText) findViewById(R.id.header_name_input);
        headerValueInput = (EditText) findViewById(R.id.header_value_input);
    }

    @SuppressLint("SetJavaScriptEnabled")
    private void setupWebView() {
        WebSettings settings = webView.getSettings();

        // Enable JavaScript
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);

        // Enable mixed content
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);

        // Enable zoom
        settings.setSupportZoom(true);
        settings.setBuiltInZoomControls(true);
        settings.setDisplayZoomControls(false);

        // Enable caching
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setAppCacheEnabled(true);

        // User agent
        settings.setUserAgentString(settings.getUserAgentString() + " DevBrowser/1.0");

        // Allow file access
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);

        // Enable web storage
        settings.setJavaScriptCanOpenWindowsAutomatically(true);

        // Set clients
        webViewClient = new CustomWebViewClient(this, customHeaders);
        webChromeClient = new CustomWebChromeClient(this);

        webView.setWebViewClient(webViewClient);
        webView.setWebChromeClient(webChromeClient);

        // Inject fetch polyfill and CORS bypass
        injectCustomScripts();
    }

    private void setupListeners() {
        // Navigation buttons
        ImageButton btnBack = (ImageButton) findViewById(R.id.btn_back);
        ImageButton btnForward = (ImageButton) findViewById(R.id.btn_forward);
        ImageButton btnRefresh = (ImageButton) findViewById(R.id.btn_refresh);
        Button btnGo = (Button) findViewById(R.id.btn_go);
        ImageButton btnConsole = (ImageButton) findViewById(R.id.btn_console);
        ImageButton btnHeaders = (ImageButton) findViewById(R.id.btn_headers);

        btnBack.setOnClickListener(v -> {
            if (webView.canGoBack()) webView.goBack();
        });

        btnForward.setOnClickListener(v -> {
            if (webView.canGoForward()) webView.goForward();
        });

        btnRefresh.setOnClickListener(v -> webView.reload());

        btnGo.setOnClickListener(v -> loadUrlFromInput());

        urlInput.setOnEditorActionListener((v, actionId, event) -> {
            if (actionId == EditorInfo.IME_ACTION_GO ||
                (event != null && event.getKeyCode() == KeyEvent.KEYCODE_ENTER)) {
                loadUrlFromInput();
                return true;
            }
            return false;
        });

        // Console buttons
        btnConsole.setOnClickListener(v -> toggleConsole());

        Button btnClearConsole = (Button) findViewById(R.id.btn_clear_console);
        Button btnCloseConsole = (Button) findViewById(R.id.btn_close_console);
        Button btnExecute = (Button) findViewById(R.id.btn_execute);

        btnClearConsole.setOnClickListener(v -> {
            consoleOutput.setText("Console cleared.\n");
        });

        btnCloseConsole.setOnClickListener(v -> {
            consolePanel.setVisibility(View.GONE);
        });

        btnExecute.setOnClickListener(v -> executeConsoleCommand());

        consoleInput.setOnEditorActionListener((v, actionId, event) -> {
            if (actionId == EditorInfo.IME_ACTION_DONE ||
                (event != null && event.getKeyCode() == KeyEvent.KEYCODE_ENTER)) {
                executeConsoleCommand();
                return true;
            }
            return false;
        });

        // Headers buttons
        btnHeaders.setOnClickListener(v -> toggleHeaders());

        Button btnAddHeader = (Button) findViewById(R.id.btn_add_header);
        Button btnCloseHeaders = (Button) findViewById(R.id.btn_close_headers);

        btnAddHeader.setOnClickListener(v -> addCustomHeader());
        btnCloseHeaders.setOnClickListener(v -> {
            headersPanel.setVisibility(View.GONE);
        });

        // CORS checkbox
        corsCheckbox.setOnCheckedChangeListener((buttonView, isChecked) -> {
            webViewClient.setCorsEnabled(isChecked);
            logToConsole("CORS bypass " + (isChecked ? "enabled" : "disabled"));
        });
    }

    private void loadUrlFromInput() {
        String url = urlInput.getText().toString().trim();
        if (!url.isEmpty()) {
            loadUrl(url);
        }
    }

    private void loadUrl(String url) {
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
            url = "https://" + url;
        }
        urlInput.setText(url);

        if (!customHeaders.isEmpty()) {
            webView.loadUrl(url, customHeaders);
        } else {
            webView.loadUrl(url);
        }

        injectCustomScripts();
    }

    private void injectCustomScripts() {
        webView.post(() -> {
            String script = buildInjectionScript();
            webView.evaluateJavascript(script, null);
        });
    }

    private String buildInjectionScript() {
        boolean corsEnabled = corsCheckbox.isChecked();

        return "(function() {" +
                "  if (window.__devBrowserInjected) return;" +
                "  window.__devBrowserInjected = true;" +
                "" +
                "  // Console logging override" +
                "  const originalLog = console.log;" +
                "  const originalError = console.error;" +
                "  const originalWarn = console.warn;" +
                "  const originalInfo = console.info;" +
                "" +
                "  console.log = function(...args) {" +
                "    originalLog.apply(console, args);" +
                "    DevBrowser.log('LOG: ' + args.join(' '));" +
                "  };" +
                "" +
                "  console.error = function(...args) {" +
                "    originalError.apply(console, args);" +
                "    DevBrowser.log('ERROR: ' + args.join(' '));" +
                "  };" +
                "" +
                "  console.warn = function(...args) {" +
                "    originalWarn.apply(console, args);" +
                "    DevBrowser.log('WARN: ' + args.join(' '));" +
                "  };" +
                "" +
                "  console.info = function(...args) {" +
                "    originalInfo.apply(console, args);" +
                "    DevBrowser.log('INFO: ' + args.join(' '));" +
                "  };" +
                "" +
                (corsEnabled ?
                "  // CORS bypass fetch" +
                "  const originalFetch = window.fetch;" +
                "  window.fetch = function(url, options = {}) {" +
                "    options.mode = 'no-cors';" +
                "    options.credentials = options.credentials || 'omit';" +
                "    return originalFetch(url, options);" +
                "  };" +
                "" +
                "  // CORS bypass XMLHttpRequest" +
                "  const originalOpen = XMLHttpRequest.prototype.open;" +
                "  XMLHttpRequest.prototype.open = function(method, url, async, user, password) {" +
                "    this.__url = url;" +
                "    return originalOpen.apply(this, arguments);" +
                "  };" +
                "" : "") +
                "  console.log('DevBrowser scripts injected successfully');" +
                "})();";
    }

    private void executeConsoleCommand() {
        String command = consoleInput.getText().toString().trim();
        if (command.isEmpty()) return;

        logToConsole("> " + command);

        // Wrap in try-catch and return result
        String script = "(function() {" +
                "  try {" +
                "    const result = " + command + ";" +
                "    return JSON.stringify(result, null, 2);" +
                "  } catch(e) {" +
                "    return 'Error: ' + e.message;" +
                "  }" +
                "})();";

        webView.evaluateJavascript(script, value -> {
            if (value != null && !value.equals("null")) {
                logToConsole(value.replace("\\n", "\n").replace("\\\"", "\""));
            } else {
                logToConsole("undefined");
            }
        });

        consoleInput.setText("");
    }

    private void addCustomHeader() {
        String name = headerNameInput.getText().toString().trim();
        String value = headerValueInput.getText().toString().trim();

        if (name.isEmpty() || value.isEmpty()) {
            logToConsole("Header name and value cannot be empty");
            return;
        }

        customHeaders.put(name, value);
        webViewClient.setCustomHeaders(customHeaders);
        updateHeadersList();

        headerNameInput.setText("");
        headerValueInput.setText("");

        logToConsole("Added header: " + name + ": " + value);
    }

    private void updateHeadersList() {
        if (customHeaders.isEmpty()) {
            headersList.setText("No custom headers set.\n");
        } else {
            StringBuilder sb = new StringBuilder();
            for (Map.Entry<String, String> entry : customHeaders.entrySet()) {
                sb.append(entry.getKey()).append(": ").append(entry.getValue()).append("\n");
            }
            headersList.setText(sb.toString());
        }
    }

    private void toggleConsole() {
        if (consolePanel.getVisibility() == View.VISIBLE) {
            consolePanel.setVisibility(View.GONE);
        } else {
            consolePanel.setVisibility(View.VISIBLE);
            headersPanel.setVisibility(View.GONE);
        }
    }

    private void toggleHeaders() {
        if (headersPanel.getVisibility() == View.VISIBLE) {
            headersPanel.setVisibility(View.GONE);
        } else {
            headersPanel.setVisibility(View.VISIBLE);
            consolePanel.setVisibility(View.GONE);
        }
    }

    public void logToConsole(final String message) {
        runOnUiThread(() -> {
            consoleOutput.append(message + "\n");
            // Auto-scroll to bottom
            final int scrollAmount = consoleOutput.getLayout().getLineTop(consoleOutput.getLineCount())
                    - consoleOutput.getHeight();
            if (scrollAmount > 0) {
                consoleOutput.scrollTo(0, scrollAmount);
            }
        });
    }

    public void updateProgress(int progress) {
        runOnUiThread(() -> {
            if (progress < 100) {
                progressBar.setVisibility(View.VISIBLE);
                progressBar.setProgress(progress);
            } else {
                progressBar.setVisibility(View.GONE);
            }
        });
    }

    public void updateUrl(String url) {
        runOnUiThread(() -> urlInput.setText(url));
    }

    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
