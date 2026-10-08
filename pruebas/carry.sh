#!/bin/zsh
# Aldeanos cargando recursos: ninguno debe quedar sin cuerpo (antes de 6.2 desaparecían dejando solo el círculo)
cd "$(dirname "$0")/.."
SD="$HOME/Library/Application Support/Imperia"; rm -f "$SD/carry_done.json"
pkill -f "build/Imperia.app/Contents/MacOS/Imperia"; sleep 1
JS="setTimeout(function(){try{__imperia.start({map:'continental',size:'small',nAI:1,diff:'easy',civ:'francos',reveal:'all'});var I=Imperia,G=__imperia.G,R=__imperia.R;
 var vs=G.ul.filter(function(e){return e.owner===0&&e.type==='villager'});for(var z=0;z<12;z++)I._dbg.mkUnit('villager',0,vs[0].x+(z%4)*20,vs[0].y+40+(z>>2)*20);vs=G.ul.filter(function(e){return e.owner===0&&e.type==='villager'});
 var res=function(t){return G.list.filter(function(e){return e.type===t&&!e.dead}).sort(function(a,b){return Math.hypot(a.x-vs[0].x,a.y-vs[0].y)-Math.hypot(b.x-vs[0].x,b.y-vs[0].y)})[0]};
 var tgs=[res('tree'),res('berry'),res('gold'),res('stone')];vs.forEach(function(v,i){var t=tgs[i%4];I.exec(0,{c:'right',ids:[v.id],x:t.x,y:t.y,tgt:t.id})});
 var worst=0;for(var s=0;s<8;s++){for(var k=0;k<30*10;k++)I.update(1/30);R.render(0.033,G);R.render(0.033,G);var bad=0,carry=0,tot=0;R._objs().forEach(function(o){if(!o.ch||o.e.type!=='villager'||o.dying!==undefined)return;tot++;var t=o.ch.M.inst.misc.array[o.ch.i*4];if(o.e.carry.a>0)carry++;if(!isFinite(t))bad++});worst=Math.max(worst,bad);console.log('CARRY t='+(G.t|0)+'s aldeanos='+tot+' cargando='+carry+' sin_cuerpo='+bad)}
 console.log('CARRY FIN peor='+worst);window.webkit.messageHandlers.store.postMessage({id:9,op:'write',key:'carry_done',data:'1'})}catch(e){console.log('FALLO '+e.stack)}},2500);"
(IMPERIA_WINDOWED=1 IMPERIA_EVAL="$JS" nohup build/Imperia.app/Contents/MacOS/Imperia > build/carry.txt 2>&1 &)
for i in $(seq 1 40); do sleep 1; [ -f "$SD/carry_done.json" ] && break; done
pkill -f "build/Imperia.app/Contents/MacOS/Imperia"; rm -f "$SD/carry_done.json"; grep -E "CARRY|FALLO" build/carry.txt
