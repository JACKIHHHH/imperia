#!/bin/zsh
# Partida larga IA contra IA en la app real: cada pocos minutos de juego se dibuja y se comprueba que toda unidad visible tiene cuerpo
cd "$(dirname "$0")/.."
MIN="${1:-24}"; MAP="${2:-continental}"
SD="$HOME/Library/Application Support/Imperia"; rm -f "$SD/gs_done.json"
pkill -f "build/Imperia.app/Contents/MacOS/Imperia"; sleep 1
JS="setTimeout(function(){try{__imperia.start({map:'$MAP',size:'medium',nAI:3,diff:'hard',civ:'francos',reveal:'all'});var I=Imperia,G=__imperia.G,R=__imperia.R,T=32;G.players[0].ai=true;G.ai[0]={tick:1,next:300,wave:7,attacking:false};
 var n=0,worst=0;
 function check(){var bad=0,tot=0,ex=[];R._objs().forEach(function(o){if(o.e.kind!=='unit'||o.dying!==undefined||!o.g.visible)return;tot++;var P2=o.g.userData.parts||{};
   if(!o.ch){if(P2.body&&!P2.body.visible){bad++;ex.push('sin cuerpo '+o.e.type)}return}
   var h=o.ch;if(h.i<0||h.M.h[h.i]!==h){bad++;ex.push('handle '+o.e.type);return}var me=h.M.meshes[h.M.lod];var a=h.M.inst.mat.array,i=h.i*16;var sc=Math.hypot(a[i],a[i+1],a[i+2]);
   if(!me.parent||!me.visible||me.count<=h.i||sc<.01||Math.abs(a[i+12]-o.g.position.x)>.05||Math.abs(a[i+14]-o.g.position.z)>.05){bad++;if(ex.length<4)ex.push(o.e.type+' ck='+o.ck+' i='+h.i+' cnt='+me.count+' par='+!!me.parent+' vis='+me.visible+' s='+sc.toFixed(2))}});
  worst=Math.max(worst,bad);console.log('CHECK t='+(G.t/60).toFixed(1)+'min unidades '+tot+' malas '+bad+' edades '+G.players.map(function(p){return p.age}).join(',')+' '+ex.join(' | '))}
 function step(){for(var k=0;k<30*60;k++)I.update(1/30);R.render(0.016,G);R.render(0.016,G);check();n++;if(n<$MIN&&!G.over)setTimeout(step,10);else{console.log('FIN peor '+worst+' over='+G.over);window.webkit.messageHandlers.store.postMessage({id:9,op:'write',key:'gs_done',data:'1'})}}
 setTimeout(step,500)}catch(e){console.log('FALLO '+e.stack)}},2500);"
(IMPERIA_WINDOWED=1 IMPERIA_EVAL="$JS" nohup build/Imperia.app/Contents/MacOS/Imperia > build/gstress.txt 2>&1 &)
