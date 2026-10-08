#!/bin/zsh
# Captura de una partida real en la app: edad, unidades de muestra en movimiento y en combate. Uso: gameshot.sh <edad> <nombre> [distancia]
cd "$(dirname "$0")/.."
AGE="${1:-0}"; N="${2:-game}"; D="${3:-13}"
SD="$HOME/Library/Application Support/Imperia"; rm -f "$SD/shot_$N.json"
pkill -f "build/Imperia.app/Contents/MacOS/Imperia"; sleep 1
JS="setTimeout(function(){try{__imperia.start({map:'arabia',size:'small',nAI:1,diff:'easy',civ:'francos',reveal:'all'});var I=Imperia,G=__imperia.G,b=G.bases[0];
G.players[0].age=$AGE;G.players[1].age=$AGE;var x0=b.cx+4,y0=b.cy+3;var T=['villager','militia','spear','archer','scout','knight','monk','ram','mangonel','trade'];
T.forEach(function(t,i){for(var k=0;k<2;k++){var u=I._dbg.mkUnit(t,k,(x0+i*.9)*32,(y0+k*2.2)*32);if(t!=='villager'&&t!=='monk'&&t!=='trade'&&k===0){}}});
setTimeout(function(){var us=G.list.filter(function(e){return e.kind==='unit'});us.slice(-20).forEach(function(u,i){if(i%3===0)I._dbg.order(u,{t:'move',x:u.x+64,y:u.y+20})});
 __imperia.R.centerOn(x0+4,y0+1.2);__imperia.R.view.tdist=$D;
 setTimeout(function(){var R=__imperia.R;R.render(0.016,G);var cv=document.querySelector('canvas');var url=cv.toDataURL('image/jpeg',.9);
  window.webkit.messageHandlers.store.postMessage({id:9,op:'write',key:'shot_$N',data:url});console.log('CAPTURA ok chars='+(window.ImperiaChars&&ImperiaChars.count))},3500)},1500)}catch(e){console.log('FALLO '+e.stack)}},2500);"
(IMPERIA_WINDOWED=1 IMPERIA_EVAL="$JS" nohup build/Imperia.app/Contents/MacOS/Imperia > build/gameshot.txt 2>&1 &)
for i in $(seq 1 25); do sleep 1; [ -f "$SD/shot_$N.json" ] && break; done
sleep 1; pkill -f "build/Imperia.app/Contents/MacOS/Imperia"
grep -v deprecated build/gameshot.txt | tail -4
python3 -c "
import base64;s=open('$SD/shot_$N.json').read();open('pruebas/shot_$N.jpg','wb').write(base64.b64decode(s.split(',',1)[1]));print('ok pruebas/shot_$N.jpg')"
