require('../web/game.js');
const I=globalThis.Imperia,T=I.T;
const seed=+process.argv[2]||18;
const G=I.newGame({diff:'normal'},seed);
const tc=G.list.find(e=>e.owner===0&&e.type==='tc');
for(let k=0;k<6;k++)I.enqueue(tc,'villager');G.players[0].res.food=2000;
for(let i=0;i<30*70;i++)I.update(1/30);
const all=G.list.filter(e=>!e.dead&&e.owner===0&&e.type==='villager');
const rt=seed%2?'tree':'berry';let r=null,bd=1e9;for(const e of G.list)if(!e.dead&&e.type===rt){const d=Math.hypot(e.x-tc.x,e.y-tc.y);if(d<bd){bd=d;r=e}}
I.cmdRight(all.map(v=>v.id),r.x,r.y,r);for(let i=0;i<30*30;i++)I.update(1/30);
const tx=tc.x+T*6,ty=tc.y+T*6;I.cmdRight(all.map(v=>v.id),tx,ty,null);
for(let i=0;i<30*25;i++)I.update(1/30);
for(const v of all.filter(v=>v.o.t!=='idle')){const o=v.o;const ti=I.idx(o.x/T|0,o.y/T|0);
 console.log('pos',(v.x/T).toFixed(2),(v.y/T).toFixed(2),'dest',(o.x/T).toFixed(2),(o.y/T).toFixed(2),'o',o.t,'gs',o.gs,'path',v.path.length,v.pi,'gk',v.gk,'fx',v.fx,'stall',(v.stall||0).toFixed(2),'destBlocked',G.block[ti],'carry',v.carry.a,'walk',v.walk)}
