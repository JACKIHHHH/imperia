#!/bin/zsh
# Estrés de personajes: crea y mata muchas unidades y comprueba que cada unidad visible tiene su instancia en la posición correcta
cd "$(dirname "$0")/.."
N="${1:-stress}"
SD="$HOME/Library/Application Support/Imperia"; rm -f "$SD/shot_$N.json"
pkill -f "build/Imperia.app/Contents/MacOS/Imperia"; sleep 1
JS="setTimeout(function(){try{__imperia.start({map:'continental',size:'small',nAI:1,diff:'easy',civ:'francos',reveal:'all'});var I=Imperia,G=__imperia.G,b=G.bases[0],R=__imperia.R,T=32;
 function spawn(n,t){for(var i=0;i<n;i++)I._dbg.mkUnit(t,0,(b.cx+3+(i%12)*.7)*T,(b.cy+3+Math.floor(i/12)*.7)*T)}
 function check(lbl){R.render(0.016,G);R.render(0.016,G);var CH=ImperiaChars,bad=0,tot=0,ex=[];var os=R._objs(),s0=null;os.forEach(function(o){if(!s0&&o.e.kind==='unit')s0=o});console.log('objs '+os.size+' ej '+(s0?JSON.stringify({ch:!!s0.ch,dy:s0.dying,v:s0.g.visible,ck:s0.ck}):'-'));R._objs().forEach(function(o){if(!o.ch||o.dying!==undefined||!o.g.visible)return;tot++;var h=o.ch;if(h.i<0||h.M.h[h.i]!==h){bad++;ex.push('handle '+o.e.type);return}var a=h.M.inst.mat.array,i=h.i*16;var dx=a[i+12]-o.g.position.x,dz=a[i+14]-o.g.position.z,sc=Math.hypot(a[i],a[i+1],a[i+2]);if(Math.abs(dx)>.05||Math.abs(dz)>.05||sc<.01){bad++;if(ex.length<5)ex.push(o.e.type+' d='+dx.toFixed(2)+','+dz.toFixed(2)+' s='+sc.toFixed(2)+' i='+h.i+' n='+h.M.n+' cap='+h.M.cap+' cnt='+h.M.meshes[h.M.lod].count+' inWorld='+!!h.M.meshes[h.M.lod].parent)}});console.log('CHECK '+lbl+' unidades '+tot+' malas '+bad+' '+ex.join(' | '))}
 spawn(90,'villager');spawn(50,'militia');
 setTimeout(function(){check('tras crear');var us=G.ul.filter(function(e){return e.owner===0&&!e.dead});for(var k=0;k<us.length;k+=2)I._dbg.kill(us[k],-1);
  setTimeout(function(){check('tras matar');spawn(70,'villager');
   setTimeout(function(){check('tras recrear');G.players[0].age=2;setTimeout(function(){check('tras edad');R.centerOn(b.cx+6,b.cy+6);R.view.tdist=24;
    setTimeout(function(){R.render(0.016,G);var url=document.querySelector('canvas').toDataURL('image/jpeg',.75);window.webkit.messageHandlers.store.postMessage({id:9,op:'write',key:'shot_$N',data:url})},800)},2500)},2500)},4000)},2500)}catch(e){console.log('FALLO '+e.stack)}},2500);"
(IMPERIA_WINDOWED=1 IMPERIA_EVAL="$JS" nohup build/Imperia.app/Contents/MacOS/Imperia > build/stress.txt 2>&1 &)
for i in $(seq 1 30); do sleep 1; [ -f "$SD/shot_$N.json" ] && break; done
sleep 1; pkill -f "build/Imperia.app/Contents/MacOS/Imperia"
grep -E "CHECK|FALLO|rror" build/stress.txt | cut -c1-600
python3 -c "
import base64;s=open('$SD/shot_$N.json').read();open('pruebas/shot_$N.jpg','wb').write(base64.b64decode(s.split(',',1)[1]));print('ok')"
