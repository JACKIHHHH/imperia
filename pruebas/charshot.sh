#!/bin/zsh
# Captura de la página de prueba de personajes dentro de la app real (WebKit). Uso: charshot.sh 'f=militia&clip=idle' nombre [espera]
cd "$(dirname "$0")/.."
Q="$1"; N="${2:-chars}"; WAIT="${3:-14}"
R=build/Imperia.app/Contents/Resources/web
cp web/chartest.html web/chars.js web/chars_data.js "$R/"
SD="$HOME/Library/Application Support/Imperia"; rm -f "$SD/shot_$N.json"
pkill -f "build/Imperia.app/Contents/MacOS/Imperia"; sleep 1
JS="if(!location.href.includes('chartest'))location.href='chartest.html?name=$N&$Q'"
(IMPERIA_WINDOWED=1 IMPERIA_EVAL="$JS" nohup build/Imperia.app/Contents/MacOS/Imperia > build/charshot.txt 2>&1 &)
for i in $(seq 1 $WAIT); do sleep 1; [ -f "$SD/shot_$N.json" ] && break; done
pkill -f "build/Imperia.app/Contents/MacOS/Imperia"
grep -iE "error|fallo|warn" build/charshot.txt | grep -v deprecated | head -5
python3 -c "
import base64,sys;s=open('$SD/shot_$N.json').read();open('pruebas/shot_$N.png','wb').write(base64.b64decode(s.split(',',1)[1]));print('ok pruebas/shot_$N.png')"
