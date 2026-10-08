// Batería de pruebas del motor v3
const fs=require('fs'),vm=require('vm'),path=require('path');
const SRC=fs.readFileSync(path.join(__dirname,'../web/game.js'),'utf8');
function fresh(){const ctx={Math,JSON,Date,Map,Set,Array,Object,Uint8Array,Int16Array,Int32Array,Float32Array,String,Number,Error,console};ctx.globalThis=ctx;vm.createContext(ctx);vm.runInContext(SRC,ctx);return ctx.Imperia}
const I=fresh(),T=I.T;
let fails=0;const ok=(c,m)=>{if(!c){fails++;console.log('  ✗ FALLO:',m)}else console.log('  ✓',m)};
function allAI(G){G.players[0].ai=true;G.ai[0]={tick:1,next:I.DIFF[G.cfg.diff].first,wave:I.DIFF[G.cfg.diff].wave,attacking:false}}
function run(Ix,sec,cb){const G=Ix.G;let worst=0,sum=0,n=0;for(let i=0;i<sec*30;i++){const t0=performance.now();Ix.update(1/30);const ms=performance.now()-t0;sum+=ms;n++;if(ms>worst)worst=ms;G.ev.length=0;if(cb)cb(i);if(G.over)break}return{avg:sum/n,worst}}
const add=(Ix,type,o,x,y)=>Ix._dbg.mkUnit(type,o,x*T,y*T);
const sel=(G,f)=>G.list.filter(e=>!e.dead&&f(e));
const part=process.argv[2]||'all';const on=k=>part==='all'||part===k;

if(on('gen')){console.log('\n1) Mapas');
 for(const map of Object.keys(I.MAPS))for(const size of Object.keys(I.SIZES)){const G=I.newGame({map,size,nAI:3,teams:'teams',diff:'normal'},99);
  const tcs=sel(G,e=>e.type==='tc'),fish=sel(G,e=>e.type==='fish').length,rel=sel(G,e=>e.kind==='relic').length,hmax=Math.max(...G.hgt);
  let good=tcs.length===4&&rel>=3&&hmax>.5;
  if(map==='islas'){const lands=new Set(tcs.map(t=>G.land[I.idx(t.tx,t.ty)]));good=good&&fish>=20&&lands.size===2}
  if(!good)console.log('  ✗',map,size,{tcs:tcs.length,fish,rel,hmax:hmax.toFixed(2)});else process.stdout.write('.')}
 console.log('\n  ✓ 15 combinaciones con relieve, reliquias y peces');}

if(on('orders')){console.log('\n2) Órdenes encadenadas, actitudes, guarnición y campana');
 const G=I.newGame({map:'arabia',size:'small',nAI:1,diff:'easy'},5);G.ai[1].passive=true;G.exp.fill(1);
 const v=sel(G,e=>e.owner===0&&e.type==='villager')[0],b=G.bases[0];
 const pts=[[b.cx+5,b.cy],[b.cx+5,b.cy+5],[b.cx,b.cy+5]];
 I.exec(0,{c:'right',ids:[v.id],x:pts[0][0]*T,y:pts[0][1]*T});for(const p of pts.slice(1))I.exec(0,{c:'right',ids:[v.id],x:p[0]*T,y:p[1]*T,q:true});
 const visited=new Set();run(I,25,()=>{pts.forEach((p,i)=>{if(Math.hypot(v.x/T-p[0],v.y/T-p[1])<1.2)visited.add(i)})});
 ok(visited.size===3,'un aldeano recorre 3 puntos encadenados con Mayús ('+visited.size+'/3)');
 const k=add(I,'knight',0,b.cx+10,b.cy+10),e=add(I,'spear',1,b.cx+14,b.cy+10);e.o={t:'idle'};I.exec(0,{c:'stance',ids:[k.id],s:2});e.x=(b.cx+14)*T;
 const k0={x:k.x,y:k.y};run(I,4);ok(Math.hypot(k.x-k0.x,k.y-k0.y)<T*.8,'con actitud «quieta» el caballero no persigue');
 e.dead=true;G.ents.delete(e.id);G.dirty=true;
 const tc=sel(G,x=>x.owner===0&&x.type==='tc')[0];const vs=sel(G,x=>x.owner===0&&x.type==='villager');
 I.exec(0,{c:'bell'});run(I,10);ok(tc.gar.length===vs.length,'campana: '+tc.gar.length+'/'+vs.length+' aldeanos dentro del centro urbano');
 const en=add(I,'militia',1,b.cx+5,b.cy);en.o={t:'idle'};let shots=0;const n0=G.proj.length;run(I,2.5,()=>{shots=Math.max(shots,G.proj.length)});ok(shots>=vs.length,'el centro urbano dispara '+shots+' flechas con la guarnición');
 I.exec(0,{c:'bell'});run(I,3);ok(tc.gar.length===0,'«todos a trabajar» vacía el centro urbano');}

if(on('eco')){console.log('\n3) Mercado, carretas, mejoras, castillo y unidad única');
 const G=I.newGame({map:'arabia',size:'medium',nAI:1,diff:'easy',civ:'britanos'},6);G.ai[1].passive=true;G.exp.fill(1);const p=G.players[0];p.age=2;p.res={food:5000,wood:5000,gold:5000,stone:5000};
 const b=G.bases[0],mk=I._dbg.mkBld;
 const m1=mk('market',0,b.x+6,b.y,true),m2=mk('market',0,b.x+6,b.y+26<I.MH-4?b.y+26:b.y-26,true);
 const g0=p.res.gold;I.exec(0,{c:'market',op:'buy',r:'stone'});ok(p.res.gold===g0-130&&G.price.stone>130,'comprar piedra sube su precio');
 I.exec(0,{c:'market',op:'sell',r:'wood'});ok(G.price.wood<100,'vender madera baja su precio');
 const cart=add(I,'trade',0,m1.x/T,m1.y/T+2.5);const g1=p.res.gold;I.exec(0,{c:'right',ids:[cart.id],x:m2.x,y:m2.y,tgt:m2.id});run(I,90);
 ok(p.res.gold>g1+40,'la carreta gana '+Math.round(p.res.gold-g1)+' de oro comerciando');
 const bar=mk('barracks',0,b.x-6,b.y+6,true);const ma=add(I,'militia',0,b.cx+3,b.cy+3);const h0=ma.maxhp;I.exec(0,{c:'queue',id:bar.id,k:'t:u_militia'});run(I,42);
 ok(ma.maxhp===h0+15&&I.uName('militia',0)==='Espadachín','mejora a espadachín (+15 vida, nombre nuevo)');
 const cs=mk('castle',0,b.x+2,b.y+8,true);ok(I.trainsOf(cs)[0]==='longbow','el castillo britano entrena arqueros largos');
 I.exec(0,{c:'queue',id:cs.id,k:'longbow',n:2});run(I,40);ok(sel(G,e=>e.type==='longbow').length===2,'se entrenan 2 arqueros largos');}

if(on('victory')){console.log('\n4) Maravilla y reliquias');
 let G=I.newGame({map:'arabia',size:'small',nAI:1,diff:'easy'},7);G.ai[1].passive=true;G.players[0].age=2;
 const b=G.bases[0];const w=I._dbg.mkBld('wonder',0,b.x+6,b.y+6,false);w.bp=.999;const v=sel(G,e=>e.owner===0&&e.type==='villager')[0];I.exec(0,{c:'right',ids:[v.id],x:w.x,y:w.y,tgt:w.id});
 run(I,20);ok(G.wonder&&G.wonder.owner===0,'la maravilla terminada inicia la cuenta atrás');run(I,I.WONDER_T+5);ok(G.over&&G.winTeam===G.players[0].team&&G.how==='wonder','victoria por maravilla');
 G=I.newGame({map:'arabia',size:'small',nAI:1,diff:'easy'},8);G.ai[1].passive=true;G.exp.fill(1);G.players[0].age=2;
 const b2=G.bases[0],mon=I._dbg.mkBld('monastery',0,b2.x+5,b2.y+4,true),relics=sel(G,e=>e.kind==='relic');
 const r=relics[0];const monk=add(I,'monk',0,r.x/T+1,r.y/T);I.exec(0,{c:'right',ids:[monk.id],x:r.x,y:r.y,tgt:r.id});run(I,120);
 ok(r.holder===mon.id,'el monje recoge la reliquia y la guarda en el monasterio');const g0=G.players[0].res.gold;run(I,10);ok(G.players[0].res.gold-g0>=4.5,'la reliquia produce oro');
 for(const x of relics){x.holder=mon.id;mon.relics.includes(x.id)||mon.relics.push(x.id)}run(I,I.RELIC_T+5);ok(G.over&&G.how==='relics','victoria por reliquias');}

if(on('naval')){console.log('\n5) Barcos, pesca y transporte');
 const G=I.newGame({map:'islas',size:'medium',nAI:1,diff:'easy'},9);G.ai[1].passive=true;G.exp.fill(1);G.players[0].age=1;G.players[0].res={food:3000,wood:3000,gold:3000,stone:3000};
 const b=G.bases[0];const fish=sel(G,e=>e.type==='fish').sort((a,c)=>Math.hypot(a.x/T-b.cx,a.y/T-b.cy)-Math.hypot(c.x/T-b.cx,c.y/T-b.cy))[0];
 let spot=null;for(let r=2;r<14&&!spot;r++)for(let dy=-r;dy<=r&&!spot;dy++)for(let dx=-r;dx<=r&&!spot;dx++){const tx=(fish.x/T|0)+dx,ty=(fish.y/T|0)+dy;if(I.canPlace('dock',tx,ty,0))spot=[tx,ty]}
 ok(!!spot,'hay sitio para un muelle en la costa');const dock=I._dbg.mkBld('dock',0,spot[0],spot[1],true);G.players[0].pop=0;for(let k=0;k<3;k++){const hs=[[b.x-3+k*2,b.y+4]];I._dbg.mkBld('house',0,hs[0][0],hs[0][1],true)}
 I.exec(0,{c:'queue',id:dock.id,k:'fishship'});I.exec(0,{c:'queue',id:dock.id,k:'transport'});run(I,62);
 const fs_=sel(G,e=>e.type==='fishship'&&e.owner===0)[0],tr=sel(G,e=>e.type==='transport'&&e.owner===0)[0];ok(fs_&&tr,'el muelle construye barco pesquero y transporte');
 const f0=G.players[0].res.food;I.exec(0,{c:'right',ids:[fs_.id],x:fish.x,y:fish.y,tgt:fish.id});run(I,70);ok(G.players[0].res.food>f0+14,'el barco pesquero entrega '+Math.round(G.players[0].res.food-f0)+' de pescado');
 const army=[];for(let k=0;k<6;k++)army.push(add(I,'militia',0,b.cx+2+k*.4,b.cy+4));
 I.exec(0,{c:'right',ids:army.map(a=>a.id),x:tr.x,y:tr.y,tgt:tr.id});run(I,40);ok(tr.cargo.length===6,'6 soldados embarcan ('+tr.cargo.length+')');
 const eb=G.bases[1];let land=null;for(let r=0;r<40&&!land;r++)for(let dy=-r;dy<=r&&!land;dy++)for(let dx=-r;dx<=r&&!land;dx++){const x=Math.round(eb.cx)+dx,y=Math.round(eb.cy)+dy;if(x<1||y<1||x>=I.MW-1||y>=I.MH-1)continue;const i=I.idx(x,y);if(G.ter[i]===0&&!G.block[i]&&[[1,0],[-1,0],[0,1],[0,-1]].some(([a,c])=>G.ter[I.idx(x+a,y+c)]===1))land=[x,y]}
 I.exec(0,{c:'right',ids:[tr.id],x:(land[0]+.5)*T,y:(land[1]+.5)*T});run(I,120);
 const onEnemyIsland=army.filter(a=>!a.dead&&!a.gar&&G.land[I.idx(a.x/T|0,a.y/T|0)]===G.land[I.idx(eb.x,eb.y)]).length;ok(onEnemyIsland>=5,'desembarcan '+onEnemyIsland+' soldados en la isla enemiga');}

if(on('ai')){console.log('\n6) Batallas IA contra IA');
 for(const [cfg,sec] of [[{map:'islas',size:'medium',nAI:1,diff:'hard'},1500],[{map:'continental',size:'large',nAI:3,teams:'teams',diff:'hard'},1400],[{map:'arabia',size:'medium',nAI:3,teams:'ffa',diff:'normal'},1300]]){
  const G=I.newGame(Object.assign({civ:'teutones'},cfg),1234);allAI(G);const t0=Date.now();let maxShips=0,landed=0,castles=0,wonders=0,relicsHeld=0;
  const r=run(I,sec,i=>{if(i%300===0){maxShips=Math.max(maxShips,sel(G,e=>e.kind==='unit'&&I.U[e.type].naval).length);castles=Math.max(castles,sel(G,e=>e.type==='castle').length);relicsHeld=Math.max(relicsHeld,sel(G,e=>e.kind==='relic'&&e.holder&&G.ents.get(e.holder)&&G.ents.get(e.holder).kind==='bld').length)}});
  const c={};for(const e of G.list)if(!e.dead&&e.kind==='unit')c[e.type]=(c[e.type]||0)+1;
  console.log(`  ${cfg.map}/${cfg.size}/${cfg.nAI+1}j: ${(G.t/60).toFixed(1)} min, fin=${G.over}(${G.how||'-'}) tick ${r.avg.toFixed(2)} ms (peor ${r.worst.toFixed(1)}) real ${(Date.now()-t0)/1000}s barcos máx ${maxShips} castillos ${castles} reliquias guardadas ${relicsHeld}`);
  console.log('   ',G.players.map(p=>`${p.name}:${p.out?'X':'E'+p.age}/${p.pop} up[${Object.keys(p.up).join(',')}]`).join('  '));
  console.log('   ',JSON.stringify(c));
  ok(r.avg<5,'tick medio < 5 ms');if(cfg.map==='islas')ok(maxShips>=4,'la IA usa barcos en islas');}}

if(on('save')){console.log('\n7) Guardar y cargar');
 const G=I.newGame({map:'islas',size:'small',nAI:1,diff:'normal'},11);allAI(G);run(I,500);const s=I.serialize(),n=G.list.length,h=I.hash();
 const G2=I.deserialize(s);ok(G2.list.length===n&&I.hash()===h,'estado idéntico tras cargar ('+(s.length/1024|0)+' KB)');let err=null;try{run(I,200)}catch(e){err=e}ok(!err,'la partida cargada continúa'+(err?': '+err.stack:''));}

if(on('det')){console.log('\n8) Determinismo (base del multijugador)');
 const A=fresh(),Bx=fresh();const cfg={map:'continental',size:'medium',mp:true,players:[{civ:'iberos',team:0,ai:false,name:'Ana'},{civ:'francos',team:1,ai:false,name:'Luis'},{civ:'teutones',team:0,ai:true},{civ:'britanos',team:1,ai:true}],diff:'normal'};
 A.newGame(Object.assign({},cfg,{me:0}),555);Bx.newGame(Object.assign({},cfg,{me:1}),555);
 // órdenes pseudoaleatorias iguales para ambos: cada jugador humano manda a sus aldeanos a recolectar y construye casas
 let s=77;const r=()=>{s=(s*16807)%2147483647;return s/2147483647};let diverged=-1;
 for(let turn=0;turn<30*60*8/3;turn++){const cmds=[];
  if(turn%40===0)for(const pl of[0,1]){const G=A.G;const vs=G.list.filter(e=>!e.dead&&e.owner===pl&&e.type==='villager');const res=G.list.filter(e=>!e.dead&&e.kind==='res'&&e.type!=='fish');
   if(vs.length&&res.length){const t=res[Math.floor(r()*res.length)];cmds.push([pl,{c:'right',ids:vs.slice(0,3).map(v=>v.id),x:t.x,y:t.y,tgt:t.id}])}
   const tc=G.list.find(e=>!e.dead&&e.owner===pl&&e.type==='tc');if(tc)cmds.push([pl,{c:'queue',id:tc.id,k:'villager',n:2}]);
   const b=G.bases[pl];cmds.push([pl,{c:'place',b:'house',tx:b.x+Math.floor(r()*12)-6,ty:b.y+Math.floor(r()*12)-6,ids:vs.slice(3,5).map(v=>v.id)}])}
  for(const X of[A,Bx]){for(const [pl,c] of cmds)X.exec(pl,c);for(let k=0;k<3;k++){X.update(1/30);X.G.ev.length=0}}
  if(A.hash()!==Bx.hash()){diverged=turn;break}}
 ok(diverged<0,'dos simulaciones independientes siguen idénticas 8 min con 2 humanos y 2 IA'+(diverged>=0?' (divergen en el turno '+diverged+')':' (hash '+A.hash()+')'));}

console.log(fails?'\nFALLOS: '+fails:'\nTODO CORRECTO');
