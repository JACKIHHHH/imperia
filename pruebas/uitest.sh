#!/bin/zsh
# Prueba de la interfaz nueva en la app real: botón de aldeanos ociosos, resembrado automático y opciones (sin noche, límite de FPS)
cd "$(dirname "$0")/.."
pkill -f "build/Imperia.app/Contents/MacOS/Imperia"; sleep 1
JS="setTimeout(function(){try{__imperia.start({map:'iberia',size:'small',nAI:1,diff:'easy',civ:'francos'});var G=__imperia.G,I=Imperia,\$=function(i){return document.getElementById(i)};
 setTimeout(function(){var r=\$('idleBig').getBoundingClientRect(),r2=\$('mini').getBoundingClientRect();console.log('UI idleBig '+Math.round(r.left)+','+Math.round(r.top)+' '+Math.round(r.width)+'x'+Math.round(r.height)+' mini top '+Math.round(r2.top)+' texto='+\$('idleBigc').textContent+' clases='+\$('idleBig').className);
  var v=G.ul.filter(function(e){return e.owner===0&&e.type==='villager'});v.forEach(function(u){I._dbg.order(u,{t:'idle'})});
  setTimeout(function(){console.log('UI ociosos='+\$('idleBigc').textContent+' clases='+\$('idleBig').className);\$('idleBig').click();console.log('UI tras clic seleccion='+JSON.stringify(__imperia.G&&window.__imperia&&document.querySelectorAll('#info *').length));
   console.log('UI resembrar antes='+G.players[0].autoFarm+' etiqueta='+\$('autoFarmSt').textContent);\$('autoFarm').click();
   setTimeout(function(){console.log('UI resembrar despues='+G.players[0].autoFarm+' etiqueta='+\$('autoFarmSt').textContent);
    console.log('UI opciones: dia='+__imperia.opts.day+' cap='+__imperia.opts.fpsCap+' toggleNoche='+!!\$('o-day')+' botonesCap='+\$('o-cap').children.length+' R.dayK='+__imperia.R.dayK());
    window.webkit.messageHandlers.store.postMessage({id:9,op:'write',key:'ui_done',data:'1'})},600)},600)},1500)}catch(e){console.log('FALLO '+e.stack)}},2500);"
SD="$HOME/Library/Application Support/Imperia"; rm -f "$SD/ui_done.json"
(IMPERIA_WINDOWED=1 IMPERIA_EVAL="$JS" nohup build/Imperia.app/Contents/MacOS/Imperia > build/uitest.txt 2>&1 &)
for i in $(seq 1 20); do sleep 1; [ -f "$SD/ui_done.json" ] && break; done
pkill -f "build/Imperia.app/Contents/MacOS/Imperia"; grep -E "UI |FALLO|rror" build/uitest.txt | grep -v deprecated
