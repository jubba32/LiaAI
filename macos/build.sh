#!/bin/bash
# LiaAI macOS Build Script
# Erstellt eine native macOS App aus dem Swift-Quellcode.
#
# Voraussetzungen:
#   - Xcode 15+ oder Command Line Tools
#   - Swift 5.9+
#
# Ausgabe: LiaAI.app in ./build/

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR/LiaAI"

echo "==> Baue LiaAI für macOS..."
swift build -c release --arch arm64

BUILD_DIR=".build/arm64-apple-macosx/release"
APP_DIR="$SCRIPT_DIR/build/LiaAI.app"

echo "==> Erstelle App-Bundle..."
rm -rf "$APP_DIR"
mkdir -p "$APP_DIR/Contents/MacOS"
mkdir -p "$APP_DIR/Contents/Resources"

cp "$BUILD_DIR/LiaAI" "$APP_DIR/Contents/MacOS/LiaAI"
chmod +x "$APP_DIR/Contents/MacOS/LiaAI"

cat > "$APP_DIR/Contents/Info.plist" << 'PLISTEOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple/DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleName</key>
    <string>LiaAI</string>
    <key>CFBundleIdentifier</key>
    <string>ai.lia.app</string>
    <key>CFBundleVersion</key>
    <string>1</string>
    <key>CFBundleShortVersionString</key>
    <string>2.0</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>LSMinimumSystemVersion</key>
    <string>13.0</string>
    <key>LSUIElement</key>
    <true/>
    <key>NSHighResolutionCapable</key>
    <true/>
</dict>
</plist>
PLISTEOF

echo ""
echo "==> Fertig!"
echo "    App: $APP_DIR"
echo ""
echo "==> Starten:"
echo "    open '$APP_DIR'"
echo ""
echo "==> Optional: In /Applications kopieren:"
echo "    cp -r '$APP_DIR' /Applications/LiaAI.app"
