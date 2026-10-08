#!/bin/zsh
# Imperia para Windows: empaqueta el mismo juego web con Electron (portable, Windows 10/11 x64). Se ejecuta en el Mac.
# Uso: windows/build_win.sh            → ~/Desktop/Imperia-<versión>-Windows.zip
#      windows/build_win.sh mac        → además prepara una copia de Electron para Mac (pruebas locales)
set -e
cd "$(dirname "$0")"
EV=44.7.0
VER=$(grep -o 'IMPERIA [0-9.]*' ../web/index.html | head -1 | cut -d' ' -f2)
mkdir -p cache
fetch(){ local f=cache/electron-v$EV-$1.zip; [ -s $f ] || { echo "› Descargando Electron $EV ($1)"; curl -L --fail --retry 3 -o $f.part https://github.com/electron/electron/releases/download/v$EV/electron-v$EV-$1.zip && mv $f.part $f; }; }
fetch win32-x64

echo "› Preparando la aplicación $VER"
rm -rf app && mkdir -p app/web/voces
sed "s/\"version\": \"[^\"]*\"/\"version\": \"$VER.0\"/" package.json > app/package.json
cp main.js preload.js app/
cp ../web/index.html ../web/three.min.js ../web/game.js ../web/art.js ../web/art_eras.js ../web/art_units.js ../web/chars_data.js ../web/chars.js ../web/maps_data.js ../web/nature_data.js ../web/nature.js ../web/terrain_data.js ../web/render3d.js ../web/audio.js ../web/net.js ../web/ui.js app/web/
cp -R ../web/voces/ app/web/voces/ 2>/dev/null || true
[ -f ../build/icon_1024.png ] || (cd .. && swift icon.swift build/icon_1024.png >/dev/null)
sips -z 512 512 ../build/icon_1024.png --out app/icon.png >/dev/null
(cd app && npm install --omit=dev --no-audit --no-fund --silent)

echo "› Icono .ico"
rm -rf ico && mkdir ico
for s in 16 24 32 48 64 128 256; do sips -z $s $s ../build/icon_1024.png --out ico/$s.png >/dev/null; done
python3 make_ico.py ico/imperia.ico ico/16.png ico/24.png ico/32.png ico/48.png ico/64.png ico/128.png ico/256.png

echo "› Montando Imperia para Windows"
D=dist/Imperia; rm -rf dist && mkdir -p $D
ditto -x -k cache/electron-v$EV-win32-x64.zip $D
mv $D/electron.exe $D/Imperia.exe
rm -f $D/resources/default_app.asar
mkdir -p $D/resources/app && cp -R app/ $D/resources/app/
# icono y datos del ejecutable (resedit: JavaScript puro, sin Wine)
npx --yes resedit-cli@3.1.1 --in $D/Imperia.exe --out $D/Imperia.exe --icon 1,ico/imperia.ico \
  --product-name Imperia --file-description "Imperia" --company-name "Jacobo Vale" --original-filename Imperia.exe --internal-name Imperia \
  --file-version $VER.0.0 --product-version $VER.0.0 --lang 1033 >/dev/null
cat > $D/LEEME.txt <<TXT
IMPERIA $VER para Windows 10/11 (64 bits)

1. Descomprime la carpeta entera (no la ejecutes desde dentro del .zip).
2. Abre Imperia.exe.
   Windows SmartScreen puede avisar porque el programa no está firmado:
   pulsa «Más información» → «Ejecutar de todas formas».
3. La primera vez que crees o te unas a una partida en red, permite el acceso
   en el Firewall de Windows (redes privadas).

Pantalla completa: F11 o Alt+Intro.
Partidas guardadas y opciones: %APPDATA%\Imperia
Red local: compatible con la versión de Mac (puerto TCP 47800).
TXT
echo "› Comprimiendo"
OUT=~/Desktop/Imperia-$VER-Windows.zip; rm -f $OUT
(cd dist && zip -qry -X $OUT Imperia)
ls -lh $OUT

if [ "$1" = "mac" ]; then
  fetch darwin-arm64
  rm -rf macprueba && mkdir macprueba && ditto -x -k cache/electron-v$EV-darwin-arm64.zip macprueba
  mkdir -p macprueba/Electron.app/Contents/Resources/app && cp -R app/ macprueba/Electron.app/Contents/Resources/app/
  rm -f macprueba/Electron.app/Contents/Resources/default_app.asar
  xattr -cr macprueba/Electron.app; echo "› Copia de prueba para Mac: windows/macprueba/Electron.app"
fi
