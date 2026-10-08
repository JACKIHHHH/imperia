#!/bin/zsh
# Prueba real de red: dos instancias de la app (anfitrión y cliente) por TCP en 127.0.0.1
cd "$(dirname "$0")/.."
pkill -f "build/Imperia.app/Contents/MacOS/Imperia"; pkill -f "windows/macprueba"; sleep 1
APPH="${APPH:-build/Imperia.app/Contents/MacOS/Imperia}"; APPC="${APPC:-build/Imperia.app/Contents/MacOS/Imperia}"
LOGJS='setInterval(function(){var G=window.__imperia&&__imperia.G,N=ImperiaNet;console.log("ESTADO rol="+N.role+" enJuego="+N.inGame+" turno="+N.execTurn+" t="+(G?G.t.toFixed(1):0)+" hash="+(G&&N.inGame?Imperia.hash():0)+" loops="+window.__loopN+" modo="+__imperia.mode+" oculto="+document.hidden+" q="+N.q.length+" acc="+(N.acc||0).toFixed(2)+" jugadores="+(G?G.players.map(function(p){return p.name+(p.ai?"(IA)":"")}).join("/"):""))},2000);ImperiaNet.on.error=function(e){console.log("ERRORRED "+e)};var U0=Imperia.update;Imperia.update=function(d){U0(d);var G=__imperia.G;if(G&&ImperiaNet.inGame){var k=Math.round(G.t*30);if(k%75===0)console.log("HT "+k+" "+Imperia.hash())}};'
HJS=$LOGJS'setTimeout(function(){ImperiaNet.host("Ana")},500);setTimeout(function(){ImperiaNet.setSlot(2,{k:"ai",civ:"teutones",team:1});ImperiaNet.setCfg({map:"iberia",size:"small"});console.log("SALA "+JSON.stringify(ImperiaNet.L.slots.map(function(s){return s.k+":"+(s.name||"")})))},9000);setTimeout(function(){console.log("START "+ImperiaNet.start())},11000);'
CLI=$LOGJS'setTimeout(function(){ImperiaNet.join("127.0.0.1","Luis")},4000);setTimeout(function(){ImperiaNet.chat("hola desde el cliente")},8000);setTimeout(function(){var G=__imperia.G,v=G.ul.filter(function(e){return e.owner===G.me&&e.type==="villager"});var t=G.rl.find(function(e){return e.type==="tree"&&!e.dead});ImperiaNet.cmd({c:"right",ids:v.map(function(e){return e.id}),x:t.x,y:t.y,tgt:t.id});console.log("ORDEN enviada")},20000);'
(IMPERIA_WINDOWED=1 IMPERIA_EVAL="$HJS" nohup "$APPH" > build/mp_host.txt 2>&1 &)
sleep 1
(IMPERIA_WINDOWED=1 IMPERIA_EVAL="$CLI" nohup "$APPC" > build/mp_cli.txt 2>&1 &)
sleep ${1:-40}
echo "--- ANFITRIÓN"; grep -E "ESTADO|SALA|START|ERROR|error|uncaught|chat" build/mp_host.txt | tail -6
echo "--- CLIENTE"; grep -E "ESTADO|ORDEN|ERROR|error|uncaught" build/mp_cli.txt | tail -6
