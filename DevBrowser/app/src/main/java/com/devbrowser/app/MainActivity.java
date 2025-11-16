package com.devbrowser.app;

import android.app.Activity;
import android.os.Bundle;
import android.widget.TextView;

public class MainActivity extends Activity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        TextView tv = new TextView(this);
        tv.setText("Hello from DevBrowser!\n\nIf you see this, the app works.");
        tv.setTextSize(20);
        tv.setPadding(50, 50, 50, 50);

        setContentView(tv);
    }
}
