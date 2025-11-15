#!/bin/bash
set -e

# Set up paths
SDK_ROOT="/usr/lib/android-sdk"
BUILD_TOOLS="$SDK_ROOT/build-tools/debian"
PLATFORM="$SDK_ROOT/platforms/android-23"
APP_DIR="app"
BUILD_DIR="build"
SRC_DIR="$APP_DIR/src/main"

# Clean
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR/gen" "$BUILD_DIR/obj" "$BUILD_DIR/apk"

echo "==> Generating R.java..."
aapt package -f -m \
    -J "$BUILD_DIR/gen" \
    -M "$SRC_DIR/AndroidManifest.xml" \
    -S "$SRC_DIR/res" \
    -I "$PLATFORM/android.jar"

echo "==> Compiling Java sources..."
find "$SRC_DIR/java" "$BUILD_DIR/gen" -name "*.java" > "$BUILD_DIR/sources.txt"
javac -source 1.8 -target 1.8 -Xlint:-options -d "$BUILD_DIR/obj" \
    -classpath "$PLATFORM/android.jar" \
    -sourcepath "$SRC_DIR/java:$BUILD_DIR/gen" \
    @"$BUILD_DIR/sources.txt"

echo "==> Converting to DEX..."
if [ -f "/usr/bin/d8" ]; then
    d8 --lib "$PLATFORM/android.jar" \
        --output "$BUILD_DIR/apk" \
        $BUILD_DIR/obj/com/devbrowser/app/*.class
else
    "$BUILD_TOOLS/dx" --dex --min-sdk-version=26 --output="$BUILD_DIR/apk/classes.dex" "$BUILD_DIR/obj"
fi

echo "==> Packaging resources..."
aapt package -f \
    -M "$SRC_DIR/AndroidManifest.xml" \
    -S "$SRC_DIR/res" \
    -I "$PLATFORM/android.jar" \
    -F "$BUILD_DIR/DevBrowser-unaligned.apk" \
    "$BUILD_DIR/apk"

echo "==> Aligning APK..."
zipalign -f -p 4 \
    "$BUILD_DIR/DevBrowser-unaligned.apk" \
    "$BUILD_DIR/DevBrowser-aligned.apk"

echo "==> Signing APK..."
apksigner sign --ks-pass pass:android \
    --key-pass pass:android \
    --ks ~/.android/debug.keystore \
    --out "$BUILD_DIR/DevBrowser.apk" \
    "$BUILD_DIR/DevBrowser-aligned.apk"

echo "==> Build complete!"
echo "APK: $BUILD_DIR/DevBrowser.apk"
ls -lh "$BUILD_DIR/DevBrowser.apk"
