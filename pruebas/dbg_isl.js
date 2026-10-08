const fs=require('fs'),vm=require('vm'),path=require('path');
const SRC=fs.readFileSync(path.join(__dirname,'../web/game.js'),'utf8');const ctx={Math,JSON,Date,Map,Set,Array,Object,Uint8Array,Int16Array,Int32Array,Float32Array,String,Number,Error,console};ctx.globalThis=ctx;vm.createContext(ctx);vm.runInContext(SRC,ctx);const I=ctx.Imperia,T=I.T;
const G=I.newGame({map:'islas',size:'medium',nAI:1,diff:'hard'},1234);G.players[0].ai=true;G.ai[0]={tick:1,next:380,wave:9,attacking:false};
const b=G.bases[0];let land=0,free=0,house=0,dock=0;
for(let y=0;y<I.MH;y++)for(let x=0;x<I.MW;x++){const i=I.idx(x,y);if(G.land[i]!==G.land[I.idx(b.x,b.y)])continue;land++;if(!G.block[i])free++;if(I.canPlace('house',x,y,0))house++;if(I.canPlace('dock',x,y,0))dock++}
console.log('isla tiles',land,'libres',free,'casa ok',house,'muelle ok',dock);
for(let i=0;i<30*240;i++){I.update(1/30);G.ev.length=0}
const p=G.players[0];console.log('t',G.t|0,'res',JSON.stringify(p.res),'pop',p.pop,p.cap,'age',p.age);
const c={};for(const e of G.list)if(!e.dead&&e.owner===0)c[e.type+(e.bp<1?'*':'')]=(c[e.type+(e.bp<1?'*':'')]||0)+1;console.log(JSON.stringify(c));
const vs=G.list.filter(e=>!e.dead&&e.owner===0&&e.type==='villager');const os={};for(const v of vs)os[v.o.t+(v.o.rt||'')]=(os[v.o.t+(v.o.rt||'')]||0)+1;console.log(JSON.stringify(os));
