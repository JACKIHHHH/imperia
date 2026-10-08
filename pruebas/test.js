// Prueba headless: simula partidas completas y comprueba que no hay excepciones ni bloqueos.
require('../web/game.js');
const I=globalThis.Imperia;
function run(diff,seed,playerActive,minutes){
 const G=I.newGame(diff,seed);let evs={};
 const dt=1/30;let t0=Date.now();let lastRes='';
 for(let step=0;step<minutes*60*30;step++){
  I.update(dt);
  for(const e of G.ev)evs[e.ev]=(evs[e.ev]||0)+1;G.ev.length=0;
  if(playerActive&&step%30===0){
   const mine=G.list.filter(e=>!e.dead&&e.owner===0);
   const vills=mine.filter(e=>e.type==='villager');
   const tc=mine.find(e=>e.type==='tc');
   if(tc&&tc.q.length<2&&vills.length<22)I.enqueue(tc,'villager');
   for(const v of vills)if(v.o.t==='idle'){
     const rts=['food','wood','wood','gold'];const rt=rts[v.id%4];
     let best=null,bd=1e9;for(const r of G.list){if(r.dead||r.kind!=='res'||I.RDEF[r.type].r!==rt)continue;const d=Math.hypot(r.x-v.x,r.y-v.y);if(d<bd){bd=d;best=r}}
     if(best)I.cmdRight([v.id],best.x,best.y,best);
   }
   const p=G.players[0];
   if(p.pop+2>=p.cap&&!mine.some(e=>e.type==='house'&&e.bp<1)&&vills.length){
     for(let k=0;k<40;k++){const tx=G.bases[0].x+Math.floor(Math.random()*14)-6,ty=G.bases[0].y+Math.floor(Math.random()*14)-6;
       if(I.canPlace('house',tx,ty,0)){I.placeBuilding('house',tx,ty,[vills[0].id]);break}}
   }
   if(!mine.some(e=>e.type==='barracks')&&vills.length>8&&p.res.wood>=150){
     for(let k=0;k<60;k++){const tx=G.bases[0].x+Math.floor(Math.random()*16)-7,ty=G.bases[0].y+Math.floor(Math.random()*16)-7;
       if(I.canPlace('barracks',tx,ty,0)){I.placeBuilding('barracks',tx,ty,[vills[1].id]);break}}
   }
   const bar=mine.find(e=>e.type==='barracks'&&e.bp>=1);if(bar&&bar.q.length<2)I.enqueue(bar,'militia');
  }
  if(G.over)break;
 }
 const P=G.players;
 const cnt=o=>{const r={};for(const e of G.list)if(!e.dead&&e.owner===o)r[e.type]=(r[e.type]||0)+1;return r};
 console.log(`[${diff} seed ${seed} activo=${playerActive}] t=${(G.t/60).toFixed(1)}min over=${G.over} winner=${G.winner} sim=${Date.now()-t0}ms`);
 for(const o of [0,1])console.log('  P'+o,'age',P[o].age,'res',JSON.stringify(Object.fromEntries(Object.entries(P[o].res).map(([k,v])=>[k,Math.round(v)]))),'pop',P[o].pop+'/'+P[o].cap,JSON.stringify(cnt(o)),'stats',JSON.stringify(P[o].stats));
 console.log('  eventos',JSON.stringify(evs));
}
run('normal',12345,false,25);
run('hard',777,true,25);
run('easy',42,true,15);
