#!/bin/zsh
# Consumo de CPU de la app (y de los procesos de WebKit) con distintos límites de FPS. Uso: heat.sh <cap> [segundos]
cd "$(dirname "$0")/.."
CAP="${1:-60}"; S="${2:-15}"
pkill -f "build/Imperia.app/Contents/MacOS/Imperia"; sleep 1
JS="setTimeout(function(){__imperia.start({map:'europa',size:'large',nAI:3,diff:'hard',civ:'francos',reveal:'all'});__imperia.opts.fpsCap=$CAP;__imperia.R.setFpsCap($CAP);var acc={u:0,r:0};var U0=Imperia.update;Imperia.update=function(d){var t=performance.now();U0(d);acc.u+=performance.now()-t};var R0=__imperia.R.render;__imperia.R.render=function(a,b){var t=performance.now();R0(a,b);acc.r+=performance.now()-t};var n0=window.__loopN||0,t0=performance.now();setInterval(function(){var n=window.__loopN||0,t=performance.now();console.log('SIM '+(acc.u/5).toFixed(0)+'ms/s RENDER '+(acc.r/5).toFixed(0)+'ms/s');acc.u=acc.r=0;console.log('FPS '+((n-n0)/(t-t0)*1000).toFixed(1)+' oculto='+document.hidden);n0=n;t0=t},5000)},2500);"
(IMPERIA_WINDOWED=1 IMPERIA_EVAL="$JS" nohup build/Imperia.app/Contents/MacOS/Imperia > build/heat.txt 2>&1 &)
sleep 8
for i in 1 2 3; do sleep $((S/3)); ps -A -o %cpu=,comm= | grep -E "Imperia|WebKit.WebContent|WebKit.GPU" | awk '{s+=$1} END {printf "CPU total %.0f%%\n", s}'; done
grep FPS build/heat.txt | tail -2
pkill -f "build/Imperia.app/Contents/MacOS/Imperia"
