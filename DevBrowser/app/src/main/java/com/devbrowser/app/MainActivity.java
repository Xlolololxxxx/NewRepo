package com.devbrowser.app;

import android.app.Activity;
import android.os.Bundle;
import android.widget.TextView;
import android.graphics.Color;
import android.util.Log;

public class MainActivity extends Activity {

    private static final String TAG = "DevBrowser";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Log.i(TAG, "onCreate called");

        try {
            TextView tv = new TextView(this);
            tv.setText("DevBrowser - Basic Version\n\nIf you see this, the app launched successfully!\n\nBuilding full browser...");
            tv.setTextColor(Color.WHITE);
            tv.setBackgroundColor(Color.parseColor("#1E1E1E"));
            tv.setPadding(40, 40, 40, 40);
            tv.setTextSize(16);

            setContentView(tv);

            Log.i(TAG, "Successfully set content view");

        } catch (Exception e) {
            Log.e(TAG, "Error in onCreate", e);
            e.printStackTrace();
        }
    }

    @Override
    protected void onStart() {
        super.onStart();
        Log.i(TAG, "onStart called");
    }

    @Override
    protected void onResume() {
        super.onResume();
        Log.i(TAG, "onResume called");
    }
}
