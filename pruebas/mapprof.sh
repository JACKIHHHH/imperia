#!/bin/zsh
# Perfil de coste de dibujo por capas en la app real. Uso: mapprof.sh <mapa> [distancia] [tamaño]
cd "$(dirname "$0")/.."
M="${1:-europa}"; D="${2:-34}"; S="${3:-large}"
pkill -f "build/Imperia.app/Contents/MacOS/Imperia"; sleep 1
JS="setTimeout(function(){try{__imperia.start({map:'$M',size:'$S',nAI:1,diff:'easy',civ:'francos',reveal:'all'});var G=__imperia.G,b=G.bases[0],R=__imperia.R;R.centerOn(b.cx,b.cy);R.view.tdist=$D;R.view.dist=$D;
 var gl=document.querySelector('canvas').getContext('webgl2');var px=new Uint8Array(4);
 function T(lbl){for(var q=0;q<5;q++)R.render(0.016,G);gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,px);var t=performance.now();for(var q=0;q<15;q++){R.render(0.016,G);gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,px)}var ms=(performance.now()-t)/15;var inf=R._renderer().info.render;console.log('PERF '+lbl+' '+ms.toFixed(1)+' ms  tris '+inf.triangles+' calls '+inf.calls)}
 var W=R._world();R._renderer().info.autoReset=true;
 setTimeout(function(){T('todo');var ch=W.children.slice();
  var kinds={};ch.forEach(function(o,i){var k=o.type+(o.isInstancedMesh?'#'+(o.geometry.index?o.geometry.index.count/3:0):'');});
  var res=ch.filter(function(o){return o.type==='Group'&&o.children.some(function(c){return c.isInstancedMesh})});
  res.forEach(function(g){g.visible=false});T('sin recursos/árboles');res.forEach(function(g){g.visible=true});
  var inst=ch.filter(function(o){return o.isInstancedMesh});inst.forEach(function(o){o.visible=false});T('sin decorado');inst.forEach(function(o){o.visible=true});
  var sun=null;R._renderer().shadowMap.enabled=false;T('sin sombras');R._renderer().shadowMap.enabled=true;
  window.webkit.messageHandlers.store.postMessage({id:9,op:'write',key:'prof_done',data:'1'})},2000)}catch(e){console.log('FALLO '+e.stack)}},2500);"
SD="$HOME/Library/Application Support/Imperia"; rm -f "$SD/prof_done.json"
(IMPERIA_WINDOWED=1 IMPERIA_EVAL="$JS" nohup build/Imperia.app/Contents/MacOS/Imperia > build/prof.txt 2>&1 &)
for i in $(seq 1 40); do sleep 1; [ -f "$SD/prof_done.json" ] && break; done
pkill -f "build/Imperia.app/Contents/MacOS/Imperia"; grep -E "PERF|FALLO" build/prof.txt
