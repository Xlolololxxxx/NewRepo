package com.devbrowser.app;

import android.app.Activity;
import android.os.Bundle;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebSettings;
import android.webkit.WebChromeClient;
import android.widget.LinearLayout;
import android.widget.EditText;
import android.widget.Button;
import android.view.ViewGroup.LayoutParams;
import android.graphics.Color;

public class MainActivity extends Activity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        try {
            // Create layout programmatically to avoid XML issues
            LinearLayout layout = new LinearLayout(this);
            layout.setOrientation(LinearLayout.VERTICAL);
            layout.setLayoutParams(new LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT));
            layout.setBackgroundColor(Color.parseColor("#1E1E1E"));
            layout.setPadding(8, 8, 8, 8);

            // URL bar
            LinearLayout urlBar = new LinearLayout(this);
            urlBar.setOrientation(LinearLayout.HORIZONTAL);
            LinearLayout.LayoutParams urlBarParams = new LinearLayout.LayoutParams(
                LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT);
            urlBar.setLayoutParams(urlBarParams);
            urlBar.setPadding(0, 0, 0, 8);

            final EditText urlInput = new EditText(this);
            urlInput.setHint("Enter URL");
            urlInput.setTextColor(Color.WHITE);
            urlInput.setHintTextColor(Color.GRAY);
            LinearLayout.LayoutParams inputParams = new LinearLayout.LayoutParams(
                0, LayoutParams.WRAP_CONTENT, 1.0f);
            urlInput.setLayoutParams(inputParams);

            Button goButton = new Button(this);
            goButton.setText("Go");
            goButton.setBackgroundColor(Color.parseColor("#007ACC"));
            goButton.setTextColor(Color.WHITE);

            urlBar.addView(urlInput);
            urlBar.addView(goButton);

            // WebView
            final WebView webView = new WebView(this);
            LinearLayout.LayoutParams webViewParams = new LinearLayout.LayoutParams(
                LayoutParams.MATCH_PARENT, 0, 1.0f);
            webView.setLayoutParams(webViewParams);

            WebSettings settings = webView.getSettings();
            settings.setJavaScriptEnabled(true);
            settings.setDomStorageEnabled(true);
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
            settings.setUserAgentString(settings.getUserAgentString() + " DevBrowser/2.0");

            webView.setWebViewClient(new WebViewClient() {
                @Override
                public boolean shouldOverrideUrlLoading(WebView view, String url) {
                    return false;
                }

                @Override
                public void onPageFinished(WebView view, String url) {
                    super.onPageFinished(view, url);
                    urlInput.setText(url);
                }
            });

            webView.setWebChromeClient(new WebChromeClient());

            goButton.setOnClickListener(v -> {
                String url = urlInput.getText().toString().trim();
                if (!url.isEmpty()) {
                    if (!url.startsWith("http")) {
                        url = "https://" + url;
                    }
                    webView.loadUrl(url);
                }
            });

            layout.addView(urlBar);
            layout.addView(webView);

            setContentView(layout);

            // Load default page
            webView.loadUrl("https://www.google.com");

            android.util.Log.i("DevBrowser", "Successfully initialized!");

        } catch (Exception e) {
            e.printStackTrace();
            android.util.Log.e("DevBrowser", "ERROR: " + e.getMessage(), e);

            // Show error as simple text
            android.widget.TextView errorText = new android.widget.TextView(this);
            errorText.setText("Error: " + e.getMessage());
            errorText.setTextColor(Color.RED);
            setContentView(errorText);
        }
    }

    @Override
    public void onBackPressed() {
        android.view.View view = findViewById(android.R.id.content);
        if (view instanceof LinearLayout) {
            LinearLayout layout = (LinearLayout) view;
            if (layout.getChildCount() > 1) {
                android.view.View child = layout.getChildAt(1);
                if (child instanceof WebView) {
                    WebView webView = (WebView) child;
                    if (webView.canGoBack()) {
                        webView.goBack();
                        return;
                    }
                }
            }
        }
        super.onBackPressed();
    }
}
