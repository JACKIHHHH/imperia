#!/bin/zsh
# Búsqueda automática de partidas entre versiones: A crea la sala, B la busca por Bonjour y se une por nombre. Uso: APPA=… APPB=… bonjour_cross.sh
cd "$(dirname "$0")/.."
pkill -f "windows/macprueba"; pkill -f "/tmp/imp_dmg/Imperia.app"; sleep 1
HJS='setTimeout(function(){ImperiaNet.host("Ana")},300);setInterval(function(){console.log("BJ sala "+JSON.stringify(ImperiaNet.L&&ImperiaNet.L.slots.map(function(s){return s.k+":"+(s.name||"")})))},3000);'
CJS='setTimeout(function(){ImperiaNet.browse()},1500);setTimeout(function(){console.log("BJ encontradas "+JSON.stringify(ImperiaNet.found));var f=(ImperiaNet.found||[]).find(function(n){return /Ana/.test(n)});if(f){ImperiaNet.joinService(f,"Luis");console.log("BJ uniendo a "+f)}},9000);setTimeout(function(){console.log("BJ cliente rol="+ImperiaNet.role+" hueco="+ImperiaNet.you)},14000);'
(IMPERIA_WINDOWED=1 IMPERIA_EVAL="$HJS" nohup "$APPA" > build/bj_a.txt 2>&1 &)
sleep 2
(IMPERIA_WINDOWED=1 IMPERIA_EVAL="$CJS" nohup "$APPB" > build/bj_b.txt 2>&1 &)
sleep 22
pkill -f "windows/macprueba"; pkill -f "/tmp/imp_dmg/Imperia.app"
grep -h "BJ" build/bj_b.txt | cut -c1-200; grep -h "BJ sala" build/bj_a.txt | tail -1 | cut -c1-200
