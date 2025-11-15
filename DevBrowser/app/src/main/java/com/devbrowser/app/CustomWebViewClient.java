package com.devbrowser.app;

import android.graphics.Bitmap;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import java.io.ByteArrayInputStream;
import java.util.HashMap;
import java.util.Map;

public class CustomWebViewClient extends WebViewClient {

    private MainActivity activity;
    private Map<String, String> customHeaders;
    private boolean corsEnabled = true;

    public CustomWebViewClient(MainActivity activity, Map<String, String> headers) {
        this.activity = activity;
        this.customHeaders = headers != null ? headers : new HashMap<>();
    }

    public void setCustomHeaders(Map<String, String> headers) {
        this.customHeaders = headers;
    }

    public void setCorsEnabled(boolean enabled) {
        this.corsEnabled = enabled;
    }

    @Override
    public void onPageStarted(WebView view, String url, Bitmap favicon) {
        super.onPageStarted(view, url, favicon);
        activity.updateProgress(0);
        activity.updateUrl(url);
        activity.logToConsole("Loading: " + url);
    }

    @Override
    public void onPageFinished(WebView view, String url) {
        super.onPageFinished(view, url);
        activity.updateProgress(100);
        activity.logToConsole("Loaded: " + url);

        // Inject JavaScript interface and custom scripts
        injectJavaScriptInterface(view);
    }

    private void injectJavaScriptInterface(WebView view) {
        view.addJavascriptInterface(new WebAppInterface(activity), "DevBrowser");
    }

    @Override
    public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
        if (corsEnabled) {
            // For CORS bypass, we intercept the request and modify response headers
            try {
                return bypassCors(request);
            } catch (Exception e) {
                activity.logToConsole("Error intercepting request: " + e.getMessage());
            }
        }

        return super.shouldInterceptRequest(view, request);
    }

    private WebResourceResponse bypassCors(WebResourceRequest request) {
        // This is a simple implementation - in production you'd want to actually
        // fetch the resource and add CORS headers
        // For now, we'll let the default handler work but with modified headers

        // Note: Full CORS bypass requires actually fetching resources and adding headers
        // This is a basic implementation that allows the requests to proceed
        return null; // Let default handling occur
    }

    @Override
    public boolean shouldOverrideUrlLoading(WebView view, String url) {
        // Load URLs with custom headers if set
        if (!customHeaders.isEmpty()) {
            view.loadUrl(url, customHeaders);
            return true;
        }

        return false;
    }

    // JavaScript Interface for console logging
    public static class WebAppInterface {
        MainActivity activity;

        WebAppInterface(MainActivity activity) {
            this.activity = activity;
        }

        @android.webkit.JavascriptInterface
        public void log(String message) {
            activity.logToConsole(message);
        }

        @android.webkit.JavascriptInterface
        public void error(String message) {
            activity.logToConsole("ERROR: " + message);
        }

        @android.webkit.JavascriptInterface
        public void warn(String message) {
            activity.logToConsole("WARN: " + message);
        }

        @android.webkit.JavascriptInterface
        public void info(String message) {
            activity.logToConsole("INFO: " + message);
        }
    }
}
