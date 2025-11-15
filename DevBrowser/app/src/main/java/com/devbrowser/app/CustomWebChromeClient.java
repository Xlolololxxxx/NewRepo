package com.devbrowser.app;

import android.webkit.ConsoleMessage;
import android.webkit.JsPromptResult;
import android.webkit.JsResult;
import android.webkit.WebChromeClient;
import android.webkit.WebView;

public class CustomWebChromeClient extends WebChromeClient {

    private MainActivity activity;

    public CustomWebChromeClient(MainActivity activity) {
        this.activity = activity;
    }

    @Override
    public void onProgressChanged(WebView view, int newProgress) {
        super.onProgressChanged(view, newProgress);
        activity.updateProgress(newProgress);
    }

    @Override
    public boolean onConsoleMessage(ConsoleMessage consoleMessage) {
        String level = consoleMessage.messageLevel().name();
        String message = consoleMessage.message();
        String source = consoleMessage.sourceId();
        int line = consoleMessage.lineNumber();

        String logMessage = String.format("[%s] %s (%s:%d)",
                level, message, source, line);

        activity.logToConsole(logMessage);

        return true;
    }

    @Override
    public boolean onJsAlert(WebView view, String url, String message, JsResult result) {
        activity.logToConsole("Alert: " + message);
        return super.onJsAlert(view, url, message, result);
    }

    @Override
    public boolean onJsConfirm(WebView view, String url, String message, JsResult result) {
        activity.logToConsole("Confirm: " + message);
        return super.onJsConfirm(view, url, message, result);
    }

    @Override
    public boolean onJsPrompt(WebView view, String url, String message,
                               String defaultValue, JsPromptResult result) {
        activity.logToConsole("Prompt: " + message);
        return super.onJsPrompt(view, url, message, defaultValue, result);
    }

    @Override
    public void onReceivedTitle(WebView view, String title) {
        super.onReceivedTitle(view, title);
        activity.logToConsole("Page title: " + title);
    }
}
