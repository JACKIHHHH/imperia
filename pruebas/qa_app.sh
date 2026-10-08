#!/bin/zsh
# QA en la app real: menú con los 13 mapas, partida en mapa real, minimapa, guardar y cargar (ranura 9), calidad baja
cd "$(dirname "$0")/.."
APP="${APP:-build/Imperia.app/Contents/MacOS/Imperia}"
SD="$HOME/Library/Application Support/Imperia"; rm -f "$SD/qa_done.json" "$SD/shot_qamini.json" "$SD/shot_qaload.json"
pkill -f "build/Imperia.app/Contents/MacOS/Imperia"; pkill -f "/tmp/imp_dmg/Imperia.app"; pkill -f "windows/macprueba"; sleep 1
JS="setTimeout(function(){try{var \$=function(i){return document.getElementById(i)},W=function(k,d){window.webkit.messageHandlers.store.postMessage({id:9,op:'write',key:k,data:d})};
 var bs=[].map.call(\$('s-map').children,function(b){return b.textContent});console.log('QA mapas en el menú '+bs.length+': '+bs.join(', '));
 console.log('QA version '+document.querySelector('.ver').textContent);
 __imperia.start({map:'iberia',size:'medium',nAI:1,diff:'easy',civ:'francos'});var G=__imperia.G,R=__imperia.R;
 setTimeout(function(){R.render(0.016,G);W('shot_qamini',\$('mini').toDataURL('image/png'));
  var t0=G.t;__imperia.save(9).then(function(){console.log('QA guardado ranura 9 t='+t0.toFixed(1));G.t+=1000;
   __imperia.load(9).then(function(){var G2=__imperia.G;console.log('QA cargado t='+G2.t.toFixed(1)+' real='+G2.real+' entidades '+G2.list.length);
    var own=G2.ul.filter(function(e){return e.owner===0&&!e.dead}).map(function(e){return e.type});var n=0,bad=0;R.render(0.016,G2);R._objs().forEach(function(o){if(o.e.kind==='unit'&&o.e.owner===0){n++;var h=o.ch;if(o.ck&&(!h||h.i<0||!h.M.meshes[h.M.lod].visible||h.M.meshes[h.M.lod].count<=h.i))bad++}});console.log('QA tras cargar unidades propias '+own.join(',')+' objetos '+n+' sin cuerpo '+bad);__imperia.opts.quality='low';R.setQuality('low');for(var f=0;f<5;f++)R.render(0.016,G2);var url=document.querySelector('canvas').toDataURL('image/jpeg',.7);W('shot_qaload',url);
    setTimeout(function(){W('qa_done','1')},500)})})},2500)}catch(e){console.log('FALLO '+e.stack)}},3000);"
(IMPERIA_WINDOWED=1 IMPERIA_EVAL="$JS" nohup "$APP" > build/qa.txt 2>&1 &)
for i in $(seq 1 30); do sleep 1; [ -f "$SD/qa_done.json" ] && break; done
pkill -f "build/Imperia.app/Contents/MacOS/Imperia"; pkill -f "/tmp/imp_dmg/Imperia.app"; pkill -f "windows/macprueba"
grep -E "QA |FALLO|rror" build/qa.txt | grep -v deprecated | cut -c1-400
python3 -c "
import base64
for k,ext in [('qamini','png'),('qaload','jpg')]:
  s=open('$SD/shot_'+k+'.json').read();open('pruebas/shot_'+k+'.'+ext,'wb').write(base64.b64decode(s.split(',',1)[1]));print('ok',k)"
