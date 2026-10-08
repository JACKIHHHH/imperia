require('../web/game.js');
const I=globalThis.Imperia,T=I.T;
for(const seed of [1,2,3,4,5,6]){
const G=I.newGame('normal',seed);
const vs=G.list.filter(e=>e.owner===0&&e.type==='villager');const tc=G.list.find(e=>e.owner===0&&e.type==='tc');
// casa junto a los aldeanos
let placed=false;for(let r=1;r<5&&!placed;r++)for(let dy=-r;dy<=r&&!placed;dy++)for(let dx=-r;dx<=r&&!placed;dx++){const tx=(vs[0].x/T|0)+dx,ty=(vs[0].y/T|0)+dy;if(I.canPlace('house',tx,ty,0)){placed=I.placeBuilding('house',tx,ty,vs.map(v=>v.id))}}
for(let i=0;i<30*20;i++)I.update(1/30);
let b=null,bd=1e9;for(const e of G.list)if(e.type==='berry'){const d=Math.hypot(e.x-vs[0].x,e.y-vs[0].y);if(d<bd){bd=d;b=e}}
I.cmdRight(vs.map(v=>v.id),b.x,b.y,b);
const p0=vs.map(v=>[v.x,v.y]);
for(let i=0;i<30*25;i++)I.update(1/30);
console.log('seed',seed,'food',Math.round(G.players[0].res.food),vs.map((v,i)=>`${v.o.t}/${v.o.s}/${v.o.id===b.id?'same':'other'} mv=${Math.round(Math.hypot(v.x-p0[i][0],v.y-p0[i][1]))} path=${v.path.length} pi=${v.pi} fail=${(v.o.fail||0).toFixed(1)} carry=${v.carry.a}`).join(' | '));
}
