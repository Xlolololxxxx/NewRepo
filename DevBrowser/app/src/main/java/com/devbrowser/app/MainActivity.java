package com.devbrowser.app;

import android.app.Activity;
import android.os.Bundle;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebSettings;
import android.webkit.WebChromeClient;
import android.webkit.ConsoleMessage;
import android.widget.LinearLayout;
import android.widget.EditText;
import android.widget.Button;
import android.view.ViewGroup;
import android.graphics.Color;
import android.util.Log;
import android.view.KeyEvent;
import android.view.inputmethod.EditorInfo;

public class MainActivity extends Activity {

    private static final String TAG = "DevBrowser";
    private WebView webView;
    private EditText urlInput;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Log.i(TAG, "onCreate started");

        try {
            // Create main layout
            LinearLayout mainLayout = new LinearLayout(this);
            mainLayout.setOrientation(LinearLayout.VERTICAL);
            mainLayout.setLayoutParams(new ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT));
            mainLayout.setBackgroundColor(Color.parseColor("#1E1E1E"));
            mainLayout.setPadding(8, 8, 8, 8);

            // Create URL bar layout
            LinearLayout urlBar = new LinearLayout(this);
            urlBar.setOrientation(LinearLayout.HORIZONTAL);
            LinearLayout.LayoutParams urlBarParams = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT);
            urlBar.setLayoutParams(urlBarParams);

            // URL input
            urlInput = new EditText(this);
            urlInput.setHint("Enter URL");
            urlInput.setTextColor(Color.WHITE);
            urlInput.setHintTextColor(Color.GRAY);
            urlInput.setBackgroundColor(Color.parseColor("#252526"));
            urlInput.setPadding(12, 12, 12, 12);
            urlInput.setSingleLine(true);
            urlInput.setImeOptions(EditorInfo.IME_ACTION_GO);
            LinearLayout.LayoutParams inputParams = new LinearLayout.LayoutParams(
                0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f);
            inputParams.setMargins(0, 0, 8, 0);
            urlInput.setLayoutParams(inputParams);

            // Go button
            final Button goButton = new Button(this);
            goButton.setText("GO");
            goButton.setTextColor(Color.WHITE);
            goButton.setBackgroundColor(Color.parseColor("#007ACC"));
            goButton.setPadding(20, 12, 20, 12);

            urlBar.addView(urlInput);
            urlBar.addView(goButton);

            // WebView
            webView = new WebView(this);
            LinearLayout.LayoutParams webViewParams = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, 0, 1.0f);
            webViewParams.setMargins(0, 8, 0, 0);
            webView.setLayoutParams(webViewParams);

            // Configure WebView
            WebSettings settings = webView.getSettings();
            settings.setJavaScriptEnabled(true);
            settings.setDomStorageEnabled(true);
            settings.setLoadWithOverviewMode(true);
            settings.setUseWideViewPort(true);
            settings.setBuiltInZoomControls(true);
            settings.setDisplayZoomControls(false);
            settings.setSupportZoom(true);
            settings.setAllowFileAccess(false);
            settings.setAllowContentAccess(false);
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);

            // Set WebView clients
            webView.setWebViewClient(new WebViewClient() {
                @Override
                public boolean shouldOverrideUrlLoading(WebView view, String url) {
                    view.loadUrl(url);
                    return true;
                }

                @Override
                public void onPageFinished(WebView view, String url) {
                    super.onPageFinished(view, url);
                    urlInput.setText(url);
                    Log.i(TAG, "Page loaded: " + url);
                }
            });

            webView.setWebChromeClient(new WebChromeClient() {
                @Override
                public boolean onConsoleMessage(ConsoleMessage cm) {
                    Log.d(TAG, String.format("[JS Console] %s:%d - %s",
                        cm.sourceId(), cm.lineNumber(), cm.message()));
                    return true;
                }

                @Override
                public void onProgressChanged(WebView view, int newProgress) {
                    Log.d(TAG, "Loading progress: " + newProgress + "%");
                }
            });

            // Button click listener
            goButton.setOnClickListener(v -> loadUrlFromInput());

            // Enter key listener
            urlInput.setOnEditorActionListener((v, actionId, event) -> {
                if (actionId == EditorInfo.IME_ACTION_GO ||
                    (event != null && event.getKeyCode() == KeyEvent.KEYCODE_ENTER &&
                     event.getAction() == KeyEvent.ACTION_DOWN)) {
                    loadUrlFromInput();
                    return true;
                }
                return false;
            });

            // Add views to layout
            mainLayout.addView(urlBar);
            mainLayout.addView(webView);

            setContentView(mainLayout);

            // Load default page
            webView.loadUrl("https://www.google.com");
            urlInput.setText("https://www.google.com");

            Log.i(TAG, "onCreate completed successfully");

        } catch (Exception e) {
            Log.e(TAG, "Error in onCreate", e);
            e.printStackTrace();
            showError(e.getMessage());
        }
    }

    private void loadUrlFromInput() {
        String url = urlInput.getText().toString().trim();
        if (url.isEmpty()) {
            return;
        }

        if (!url.startsWith("http://") && !url.startsWith("https://")) {
            url = "https://" + url;
        }

        Log.i(TAG, "Loading URL: " + url);
        webView.loadUrl(url);
    }

    private void showError(String message) {
        android.widget.TextView errorView = new android.widget.TextView(this);
        errorView.setText("Error: " + message);
        errorView.setTextColor(Color.RED);
        errorView.setPadding(40, 40, 40, 40);
        setContentView(errorView);
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.destroy();
        }
        super.onDestroy();
    }
}
