#!/bin/zsh
# Prueba de humo de la app real (WebKit): partida de 1 jugador guiada por script; busca errores de JavaScript en el registro
setopt null_glob
cd "$(dirname "$0")/.."
pkill -f "build/Imperia.app/Contents/MacOS/Imperia"; sleep 1
SD="$HOME/Library/Application Support/Imperia"; BK=$(mktemp -d); cp "$SD"/slot3*.json "$BK"/ 2>/dev/null  # la prueba usa la ranura 3: se guarda y se restaura
JS='setTimeout(function(){try{__imperia.start({map:"islas",size:"small",nAI:1,diff:"normal",civ:"bizantinos"});var G=__imperia.G,I=Imperia;G.players[0].ai=true;G.ai[0]={tick:1,next:300,wave:7,attacking:false};
for(var i=0;i<30*600;i++){I.update(1/30);G.ev.length=0}G.players[0].ai=false;var ids=G.ul.filter(function(e){return e.owner===0}).map(function(e){return e.id});__imperia.setSel(ids);
var tc=G.bl.find(function(e){return e.owner===0&&e.type==="tc"});setTimeout(function(){__imperia.setSel([tc.id]);__imperia.save(3).then(function(){__imperia.load(3).then(function(){console.log("CARGA hash="+Imperia.hash()+" t="+__imperia.G.t.toFixed(1))})})},3000);
setTimeout(function(){var G2=__imperia.G;G2.over=false;Imperia.exec(0,{c:"resign"});console.log("RENDICION")},9000);
setTimeout(function(){console.log("FIN pantalla="+!document.getElementById("end").hidden+" loops="+window.__loopN)},14000);console.log("PARTIDA t="+G.t.toFixed(0)+" unidades="+G.ul.length)}catch(e){console.log("FALLO "+e.stack)}},1500);'
(IMPERIA_WINDOWED=1 IMPERIA_EVAL="$JS" nohup build/Imperia.app/Contents/MacOS/Imperia > build/sp_test.txt 2>&1 &)
sleep ${1:-25}
grep -v deprecated build/sp_test.txt
pkill -f "build/Imperia.app/Contents/MacOS/Imperia"
rm -f "$SD"/slot3*.json; cp "$BK"/slot3*.json "$SD"/ 2>/dev/null; rm -rf "$BK"; echo "ranura 3 restaurada"
