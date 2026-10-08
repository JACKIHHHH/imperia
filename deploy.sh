#!/bin/zsh
cd "$(dirname "$0")"
cp web/index.html web/game.js web/art.js web/art_eras.js web/art_units.js web/chars_data.js web/chars.js web/maps_data.js web/nature_data.js web/nature.js web/terrain_data.js web/render3d.js web/audio.js web/net.js web/ui.js build/Imperia.app/Contents/Resources/web/
codesign --force --deep --sign - build/Imperia.app 2>/dev/null
pkill -f build/Imperia.app/Contents/MacOS/Imperia; sleep 1
(nohup build/Imperia.app/Contents/MacOS/Imperia > build/log.txt 2>&1 &)
