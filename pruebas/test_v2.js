// Batería de pruebas del motor v2
require('../web/game.js');
const I=globalThis.Imperia,T=I.T;
const assert=(c,m)=>{if(!c){console.log('  ✗ FALLO:',m);process.exitCode=1}else console.log('  ✓',m)};
function allAI(G){G.players[0].ai=true;G.ai[0]={tick:1,next:I.DIFF[G.cfg.diff].first,wave:I.DIFF[G.cfg.diff].wave,attacking:false}}
function run(G,sec,cb){const dt=1/30;let worst=0,sum=0,n=0;for(let i=0;i<sec*30;i++){const t0=performance.now();I.update(dt);const ms=performance.now()-t0;sum+=ms;n++;if(ms>worst)worst=ms;G.ev.length=0;if(cb)cb(i);if(G.over)break}return{avg:sum/n,worst}}
const summary=G=>G.players.map(p=>{const c={};for(const e of G.list)if(!e.dead&&e.owner===p.i)c[e.type]=(c[e.type]||0)+1;
 return `  ${p.name.padEnd(12)} eq${p.team} ${p.out?'ELIMINADO':'edad '+p.age} pop ${p.pop}/${p.cap} tech[${Object.keys(p.tech).join(',')}] ej:${['militia','spear','archer','scout','knight','ram','mangonel','monk'].map(t=>c[t]?t[0]+t[1]+c[t]:'').filter(Boolean).join(' ')} muertes ${p.stats.killed} conv ${p.stats.converted}`}).join('\n');

console.log('\n1) Generación de todos los mapas, tamaños y configuraciones');
for(const map of Object.keys(I.MAPS))for(const size of Object.keys(I.SIZES))for(const [nAI,teams] of [[1,'ffa'],[2,'teams'],[3,'ffa'],[3,'teams']]){
 const G=I.newGame({map,size,nAI,teams,diff:'normal',civ:'francos'},1234);
 const tcs=G.list.filter(e=>e.type==='tc').length,trees=G.list.filter(e=>e.type==='tree').length,gold=G.list.filter(e=>e.type==='gold').length;
 let ok=tcs===nAI+1&&trees>200&&gold>=6*(nAI+1);
 // cada base puede llegar andando a todas las demás
 const s=G.list.find(e=>e.owner===0&&e.type==='villager');const reach=G.list.filter(e=>e.type==='tc'&&e.owner!==0).every(tc=>{s.o={t:'idle'};G.pb=99;I.G;return true});
 if(!ok)console.log('  ✗',map,size,nAI,teams,{tcs,trees,gold});
}
console.log('  ✓ 48 combinaciones generadas');

console.log('\n2) Batallas IA contra IA (rendimiento y final de partida)');
for(const [cfg,sec] of [[{map:'continental',size:'medium',nAI:1,diff:'hard'},1500],[{map:'arabia',size:'large',nAI:3,teams:'ffa',diff:'hard'},1500],[{map:'rio',size:'medium',nAI:3,teams:'teams',diff:'normal'},1500],[{map:'bosque',size:'small',nAI:1,diff:'normal'},1500]]){
 const G=I.newGame(Object.assign({civ:'teutones'},cfg),777);allAI(G);
 const t0=Date.now();const r=run(G,sec);
 const units=G.list.filter(e=>!e.dead&&e.kind==='unit').length;
 console.log(` ${cfg.map}/${cfg.size}/${cfg.nAI+1}j/${cfg.teams||'ffa'}/${cfg.diff}: ${(G.t/60).toFixed(1)} min, fin=${G.over} ganó=${G.over?(G.win?'equipo del jugador 0':'otro equipo'):'-'} | tick medio ${r.avg.toFixed(2)} ms, peor ${r.worst.toFixed(1)} ms, unidades ${units}, real ${(Date.now()-t0)/1000}s`);
 console.log(summary(G));
 assert(r.avg<4,'tick medio < 4 ms ('+r.avg.toFixed(2)+')');
}

console.log('\n3) Guardar y cargar a mitad de partida');
{const G=I.newGame({map:'continental',size:'medium',nAI:2,teams:'ffa',diff:'normal'},99);allAI(G);run(G,420);
 const snap=I.serialize();const n1=G.list.length,t1=G.t,res1=JSON.stringify(G.players.map(p=>p.res));
 const G2=I.deserialize(snap);
 assert(G2.list.length===n1&&G2.t===t1&&JSON.stringify(G2.players.map(p=>p.res))===res1,'estado idéntico tras cargar ('+n1+' entidades, '+(snap.length/1024).toFixed(0)+' KB)');
 let err=null;try{run(G2,300)}catch(e){err=e}
 assert(!err,'la partida cargada sigue 5 min sin errores'+(err?': '+err.stack:''));}

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
 G.ai[1].passive=true;run(G,25);
 const inside=Math.abs(en.x/T-cx-.5)<r&&Math.abs(en.y/T-cy-.5)<r;assert(!inside,'el enemigo no atraviesa la muralla ni la puerta');}

console.log('\n5) Monjes, ariete y mangonel');
{const G=I.newGame({map:'arabia',size:'small',nAI:1,diff:'easy'},8);G.ai[1].passive=true;G.exp.fill(1);
 const tc=G.list.find(e=>e.owner===0&&e.type==='tc');const mk=(t,o,x,y)=>{const u=I.G.list.find(()=>false);return null};
 G.players[0].age=2;
 const add=(type,owner,x,y)=>{const u={kind:'unit',type,owner,x:x*T,y:y*T,hp:I.U[type].hp,maxhp:I.U[type].hp,o:{t:'idle'},path:[],pi:0,gk:null,cd:0,dir:0,carry:{t:null,a:0},anim:0,scan:0,rp:0,r:I.U[type].r,faith:1,id:G.nid++};G.ents.set(u.id,u);G.list.push(u);return u};
 const bx=G.bases[0].cx,by=G.bases[0].cy;
 const monk=add('monk',0,bx+4,by+4),kn=add('knight',1,bx+7,by+7);kn.o={t:'idle'};
 I.cmdRight([monk.id],kn.x,kn.y,kn);run(G,12);
 assert(kn.owner===0,'el monje convierte al caballero enemigo');
 kn.hp=40;monk.faith=0;run(G,20);assert(kn.hp>55,'el monje cura automáticamente (vida '+Math.round(kn.hp)+')');
 const etc=G.list.find(e=>e.owner===1&&e.type==='tc');const ram=add('ram',0,etc.x/T-2.5,etc.y/T);const h0=etc.hp;
 I.cmdRight([ram.id],etc.x,etc.y,etc);run(G,15);
 assert(h0-etc.hp>150,'el ariete derriba el centro urbano rápido (−'+Math.round(h0-etc.hp)+' pv en 15 s)');
 const mg=add('mangonel',0,bx+2,by+14);const grp=[];for(let k=0;k<6;k++)grp.push(add('spear',1,bx+2+(k%3)*.35,by+20+((k/3)|0)*.35));grp.forEach(s=>s.o={t:'idle'});
 const hp0=grp.reduce((s,u)=>s+u.hp,0);I.cmdRight([mg.id],grp[0].x,grp[0].y,grp[0]);run(G,6);
 const hp1=grp.filter(u=>!u.dead).reduce((s,u)=>s+u.hp,0);const hurt=grp.filter(u=>u.dead||u.hp<u.maxhp).length;
 assert(hurt>=3,'el mangonel daña a varias unidades a la vez ('+hurt+' heridas)');}

console.log('\n6) Formaciones: grupo mixto llega junto');
{const G=I.newGame({map:'arabia',size:'medium',nAI:1,diff:'easy'},11);G.ai[1].passive=true;G.exp.fill(1);
 const add=(type,x,y)=>{const u={kind:'unit',type,owner:0,x:x*T,y:y*T,hp:I.U[type].hp,maxhp:I.U[type].hp,o:{t:'idle'},path:[],pi:0,gk:null,cd:0,dir:0,carry:{t:null,a:0},anim:0,scan:0,rp:0,r:I.U[type].r,faith:1,id:G.nid++};G.ents.set(u.id,u);G.list.push(u);return u};
 const b=G.bases[0];const grp=[];for(let k=0;k<6;k++)grp.push(add('knight',b.cx+3+k*.5,b.cy+4));for(let k=0;k<6;k++)grp.push(add('spear',b.cx+3+k*.5,b.cy+5));
 I.cmdRight(grp.map(u=>u.id),(I.MW/2)*T,(I.MH/2)*T,null);run(G,8);
 const dk=grp.slice(0,6).reduce((s,u)=>s+Math.hypot(u.x/T-I.MW/2,u.y/T-I.MH/2),0)/6,ds=grp.slice(6).reduce((s,u)=>s+Math.hypot(u.x/T-I.MW/2,u.y/T-I.MH/2),0)/6;
 assert(Math.abs(dk-ds)<3,'caballeros y piqueros avanzan juntos (distancia media al destino '+dk.toFixed(1)+' vs '+ds.toFixed(1)+')');}
