#!/bin/zsh
# Captura un mapa en la app real. Uso: mapshot.sh <mapa> <nombre> [distancia] [dx] [dy] [tamaño] [yaw]
cd "$(dirname "$0")/.."
M="${1:-iberia}"; N="${2:-map}"; D="${3:-30}"; DX="${4:-0}"; DY="${5:-0}"; S="${6:-small}"; YW="${7:-}"
SD="$HOME/Library/Application Support/Imperia"; rm -f "$SD/shot_$N.json"
pkill -f "build/Imperia.app/Contents/MacOS/Imperia"; sleep 1
JS="setTimeout(function(){try{var t0=performance.now();__imperia.start({map:'$M',size:'$S',nAI:1,diff:'easy',civ:'francos',reveal:'all'});var G=__imperia.G,b=G.bases[0];console.log('build ms '+Math.round(performance.now()-t0)+' MW '+Imperia.MW+' arboles '+G.list.filter(function(e){return e.type==='tree'}).length);
 var R=__imperia.R;var cx=b.cx,cz=b.cy,MW=Imperia.MW,MH=Imperia.MH;if('$DX'==='mt'){var bs=-1;for(var y=3;y<MH-3;y++)for(var x=3;x<MW-3;x++){if(G.ter[y*MW+x]!==3)continue;var c=0;for(var dy=-3;dy<=3;dy++)for(var dx=-3;dx<=3;dx++)if(G.ter[(y+dy)*MW+x+dx]===3)c++;if(c>bs){bs=c;cx=x;cz=y}}}
 else if('$DX'==='fall'){var f=R.falls();console.log('cascadas '+f.length);if(f.length){var k=Math.floor(f.length/2);cx=f[k][0];cz=f[k][2]}}else{cx+=+'$DX';cz+=+'$DY'}R.centerOn(cx,cz);R.view.tdist=$D;R.view.dist=$D;if('$YW')R.view.yaw=+'$YW';
 var n=0,t1=0;function tick(){var tf=performance.now();R.render(0.016,G);if(n<3)console.log('frame '+n+' '+Math.round(performance.now()-tf)+' ms');n++;if(n===30)t1=performance.now();if(n<90){requestAnimationFrame(tick);return}
  var ra=((performance.now()-t1)/60).toFixed(1);var cv0=document.querySelector('canvas'),gl=cv0.getContext('webgl2');gl.finish();var t2=performance.now();for(var q=0;q<20;q++){R.render(0.016,G);gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array(4))}console.log('ms/frame rAF '+ra+' gpu '+((performance.now()-t2)/20).toFixed(1)+' px '+cv0.width+'x'+cv0.height);var cv=document.querySelector('canvas');var url=cv.toDataURL('image/jpeg',.72);
  window.webkit.messageHandlers.store.postMessage({id:9,op:'write',key:'shot_$N',data:url})}
 setTimeout(tick,1500)}catch(e){console.log('FALLO '+e.stack)}},2500);"
(IMPERIA_WINDOWED=1 IMPERIA_EVAL="$JS" nohup build/Imperia.app/Contents/MacOS/Imperia > build/mapshot.txt 2>&1 &)
for i in $(seq 1 45); do sleep 1; [ -f "$SD/shot_$N.json" ] && break; done
sleep 1; pkill -f "build/Imperia.app/Contents/MacOS/Imperia"
grep -v deprecated build/mapshot.txt | grep -v "^$" | tail -6 | cut -c1-400
python3 -c "
import base64;s=open('$SD/shot_$N.json').read();open('pruebas/shot_$N.jpg','wb').write(base64.b64decode(s.split(',',1)[1]));print('ok pruebas/shot_$N.jpg')"
