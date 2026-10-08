// Batería de pruebas del motor v2
require('../web/game.js');
const I=globalThis.Imperia,T=I.T;
const assert=(c,m)=>{if(!c){console.log('  ✗ FALLO:',m);process.exitCode=1}else console.log('  ✓',m)};
function allAI(G){G.players[0].ai=true;G.ai[0]={tick:1,next:I.DIFF[G.cfg.diff].first,wave:I.DIFF[G.cfg.diff].wave,attacking:false}}
function run(G,sec,cb){const dt=1/30;let worst=0,sum=0,n=0;for(let i=0;i<sec*30;i++){const t0=performance.now();I.update(dt);const ms=performance.now()-t0;sum+=ms;n++;if(ms>worst)worst=ms;G.ev.length=0;if(cb)cb(i);if(G.over)break}return{avg:sum/n,worst}}
const summary=G=>G.players.map(p=>{const c={};for(const e of G.list)if(!e.dead&&e.owner===p.i)c[e.type]=(c[e.type]||0)+1;
 return `  ${p.name.padEnd(12)} eq${p.team} ${p.out?'ELIMINADO':'edad '+p.age} pop ${p.pop}/${p.cap} tech[${Object.keys(p.tech).join(',')}] ej:${['militia','spear','archer','scout','knight','ram','mangonel','monk'].map(t=>c[t]?t[0]+t[1]+c[t]:'').filter(Boolean).join(' ')} muertes ${p.stats.killed} conv ${p.stats.converted}`}).join('\n');

console.log('\n4) Murallas y puertas');
{const G=I.newGame({map:'arabia',size:'small',nAI:1,diff:'easy'},5);const p=G.players[0];p.res.wood=5000;p.res.stone=5000;p.age=1;
 const tc=G.list.find(e=>e.owner===0&&e.type==='tc');
 // anillo de empalizada alrededor del centro urbano, con una puerta
 const r=5,cx=tc.tx+1,cy=tc.ty+1,ring=[];for(let x=cx-r;x<=cx+r;x++){ring.push([x,cy-r],[x,cy+r])}for(let y=cy-r+1;y<cy+r;y++){ring.push([cx-r,y],[cx+r,y])}
 const gateT=[cx+r,cy];const tiles=ring.filter(([x,y])=>!(x===gateT[0]&&y===gateT[1]));
 // quitar recursos del anillo para la prueba
 for(const [x,y] of ring){const o=G.occ[I.idx(x,y)];if(o){const e=G.ents.get(o);if(e&&e.kind==='res'){e.dead=true;G.ents.delete(e.id);G.occ[I.idx(x,y)]=0;G.block[I.idx(x,y)]=0}}}
 G.list=G.list.filter(e=>!e.dead);G.exp.fill(1);
 const vs=G.list.filter(e=>e.owner===0&&e.type==='villager');
 const n=I.placeWall('palisade',tiles.filter(([x,y])=>I.canPlace('palisade',x,y,0)),vs.map(v=>v.id));
 I.placeBuilding('gate',gateT[0],gateT[1],vs.map(v=>v.id));
 for(const b of G.list)if(b.owner===0&&b.kind==='bld'&&b.bp<1){b.bp=1;b.hp=b.maxhp}
 assert(n>=tiles.length-4,'se colocan '+n+' tramos de empalizada');
 // un aldeano propio sale por la puerta; una unidad enemiga no puede entrar
 const v=vs[0];I.cmdRight([v.id],(cx+r+3)*T,(cy+.5)*T,null);run(G,20);
 assert(Math.hypot(v.x/T-(cx+r+3.5),v.y/T-(cy+.5))<2,'el aldeano propio cruza la puerta');
 const en=G.list.find(e=>e.owner===1&&e.type==='scout');en.x=(cx+r+3.5)*T;en.y=(cy+.5)*T;en.o={t:'move',x:(cx+.5)*T,y:(cy-2.5)*T};en.gk=null;
 G.ai[1].passive=true;console.log('col13',[3,4,5,6,7,8,9,10,11,12,13].map(y=>{const i=I.idx(13,y),e=G.ents.get(G.occ[i]);return y+':'+G.block[i]+(e?e.type[0]+e.owner:'-')+G.gate[i]}).join(' '));for(let k=0;k<3;k++){run(G,.5);console.log('   scout',(en.x/T).toFixed(1),(en.y/T).toFixed(1),JSON.stringify(en.o),'path',en.path.length,'ring',cx,cy,r,'dead',!!en.dead)}
 const inside=Math.abs(en.x/T-cx-.5)<r&&Math.abs(en.y/T-cy-.5)<r;assert(!inside,'el enemigo no atraviesa la muralla ni la puerta');}

