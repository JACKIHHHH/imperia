#!/bin/zsh
# Dos partidas seguidas en la misma sesión (menú → partida → otra partida): las unidades de la segunda deben verse
cd "$(dirname "$0")/.."
N="${1:-tg}"; SD="$HOME/Library/Application Support/Imperia"; rm -f "$SD/shot_$N.json"
pkill -f "build/Imperia.app/Contents/MacOS/Imperia"; sleep 1
JS="setTimeout(function(){try{var R=__imperia.R,I=Imperia;__imperia.start({map:'arabia',size:'small',nAI:1,diff:'easy',civ:'francos',reveal:'all'});var G1=__imperia.G,b1=G1.bases[0];
 for(var z=0;z<70;z++)I._dbg.mkUnit('militia',0,(b1.cx+2+z%10)*32,(b1.cy+3+(z/10|0))*32);for(var f=0;f<10;f++)R.render(0.016,G1);
 __imperia.start({map:'continental',size:'small',nAI:1,diff:'easy',civ:'francos',reveal:'all'});var G=__imperia.G,b=G.bases[0];
 for(var z=0;z<24;z++)I._dbg.mkUnit('villager',0,(b.cx-4+z%6)*32,(b.cy-5+(z/6|0))*32);R.centerOn(b.cx-1,b.cy-3);R.view.tdist=R.view.dist=20;
 setTimeout(function(){for(var f=0;f<5;f++)R.render(0.016,G);var url=document.querySelector('canvas').toDataURL('image/jpeg',.75);window.webkit.messageHandlers.store.postMessage({id:9,op:'write',key:'shot_$N',data:url})},1500)}catch(e){console.log('FALLO '+e.stack)}},2500);"
(IMPERIA_WINDOWED=1 IMPERIA_EVAL="$JS" nohup build/Imperia.app/Contents/MacOS/Imperia > build/tg.txt 2>&1 &)
for i in $(seq 1 25); do sleep 1; [ -f "$SD/shot_$N.json" ] && break; done
sleep 1; pkill -f "build/Imperia.app/Contents/MacOS/Imperia"; grep -E "FALLO|rror" build/tg.txt | head -3
python3 -c "
import base64;s=open('$SD/shot_$N.json').read();open('pruebas/shot_$N.jpg','wb').write(base64.b64decode(s.split(',',1)[1]));print('ok')"
