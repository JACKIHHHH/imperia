// Estrés de movimiento: grupos apiñados enviados a un mismo recurso/punto; nadie debe quedarse atascado.
require('../web/game.js');
const I=globalThis.Imperia,T=I.T;
let bad=0,tot=0;
for(let seed=1;seed<=40;seed++){
 const G=I.newGame({diff:'normal'},seed);
 const tc=G.list.find(e=>e.owner===0&&e.type==='tc');
 const vs=G.list.filter(e=>e.owner===0&&e.type==='villager');
 for(let k=0;k<5;k++){const u=I.newGame?null:null}
 // añade 6 aldeanos más apiñados junto a los existentes
 const G2=I.G;const extra=[];
 for(let k=0;k<6;k++){I.enqueue(tc,'villager')}
 G.players[0].res.food=2000;
 for(let i=0;i<30*70;i++)I.update(1/30);
 const all=G.list.filter(e=>!e.dead&&e.owner===0&&e.type==='villager');
 // todos a un único árbol / arbusto y luego todos a un punto
 const rt=seed%2?'tree':'berry';let r=null,bd=1e9;for(const e of G.list)if(!e.dead&&e.type===rt){const d=Math.hypot(e.x-tc.x,e.y-tc.y);if(d<bd){bd=d;r=e}}
 I.cmdRight(all.map(v=>v.id),r.x,r.y,r);
 const p0=all.map(v=>[v.x,v.y]);
 const got=new Map();for(let i=0;i<30*30;i++){I.update(1/30);for(const v of all)if(v.carry.a>0||v.work)got.set(v.id,1)}
 for(const [i,v] of all.entries()){tot++;const ok=v.carry.a>0||v.o.s==='ret'||v.work||G.players[0].stats.gathered>0&&Math.hypot(v.x-p0[i][0],v.y-p0[i][1])>40;
  if(!got.get(v.id)){bad++;console.log('seed',seed,'SIN RECOLECTAR',v.o.t,v.o.s,'path',v.path.length,v.pi,'stall',(v.stall||0).toFixed(2),'pos',(v.x/T).toFixed(2),(v.y/T).toFixed(2))}}
 // movimiento en grupo al mismo punto
 const tx=tc.x+T*6,ty=tc.y+T*6;I.cmdRight(all.map(v=>v.id),tx,ty,null);
 for(let i=0;i<30*25;i++)I.update(1/30);
 const stuck=all.filter(v=>v.o.t!=='idle');if(stuck.length){bad+=stuck.length;console.log('seed',seed,'MOVIMIENTO sin terminar',stuck.length)}
}
console.log('aldeanos probados',tot,'fallos',bad);
