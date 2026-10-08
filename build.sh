#!/bin/zsh
# Compila Imperia.app (universal) y genera Imperia.dmg
set -e
cd "$(dirname "$0")"
APP=build/Imperia.app
rm -rf build
mkdir -p "$APP/Contents/MacOS" "$APP/Contents/Resources/web" build/AppIcon.iconset

echo "› Compilando binario"
FW=(-framework Cocoa -framework WebKit -framework Network -framework AVFoundation)
swiftc -O -swift-version 5 -target arm64-apple-macos13 main.swift -o build/imperia-arm64 $FW 2>&1 | grep -v "warning:" || true
swiftc -O -swift-version 5 -target x86_64-apple-macos13 main.swift -o build/imperia-x86 $FW 2>&1 | grep -v "warning:" || true
lipo -create build/imperia-arm64 build/imperia-x86 -output "$APP/Contents/MacOS/Imperia"

echo "› Copiando juego"
mkdir -p "$APP/Contents/Resources/web/voces"; cp -R web/voces/ "$APP/Contents/Resources/web/voces/" 2>/dev/null
cp web/index.html web/three.min.js web/game.js web/art.js web/art_eras.js web/art_units.js web/chars_data.js web/chars.js web/maps_data.js web/nature_data.js web/nature.js web/terrain_data.js web/render3d.js web/audio.js web/net.js web/ui.js "$APP/Contents/Resources/web/"

echo "› Icono"
swift icon.swift build/icon_1024.png >/dev/null
for s in 16 32 128 256 512; do
  sips -z $s $s build/icon_1024.png --out build/AppIcon.iconset/icon_${s}x${s}.png >/dev/null
  d=$((s*2)); sips -z $d $d build/icon_1024.png --out build/AppIcon.iconset/icon_${s}x${s}@2x.png >/dev/null
done
iconutil -c icns build/AppIcon.iconset -o "$APP/Contents/Resources/AppIcon.icns"

cat > "$APP/Contents/Info.plist" <<'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
 <key>CFBundleName</key><string>Imperia</string>
 <key>CFBundleDisplayName</key><string>Imperia</string>
 <key>CFBundleExecutable</key><string>Imperia</string>
 <key>CFBundleIdentifier</key><string>es.jack.imperia</string>
 <key>CFBundleIconFile</key><string>AppIcon</string>
 <key>CFBundlePackageType</key><string>APPL</string>
 <key>CFBundleShortVersionString</key><string>6.2</string>
 <key>CFBundleVersion</key><string>6</string>
 <key>CFBundleDevelopmentRegion</key><string>es</string>
 <key>LSMinimumSystemVersion</key><string>13.0</string>
 <key>LSApplicationCategoryType</key><string>public.app-category.strategy-games</string>
 <key>NSHighResolutionCapable</key><true/>
 <key>NSLocalNetworkUsageDescription</key><string>Imperia usa la red local para las partidas multijugador en LAN.</string>
 <key>NSBonjourServices</key><array><string>_imperia._tcp</string></array>
 <key>NSHumanReadableCopyright</key><string>Imperia · estrategia en tiempo real</string>
</dict></plist>
PLIST

echo "› Firmando (ad-hoc)"
codesign --force --deep --sign - "$APP"

echo "› Creando DMG"
mkdir -p build/dmg
cp -R "$APP" build/dmg/
ln -s /Applications build/dmg/Aplicaciones
hdiutil create -volname "Imperia" -srcfolder build/dmg -ov -format UDZO build/Imperia.dmg >/dev/null
rm -rf build/dmg build/imperia-* build/AppIcon.iconset
ls -lh build/Imperia.dmg
lipo -archs "$APP/Contents/MacOS/Imperia"
