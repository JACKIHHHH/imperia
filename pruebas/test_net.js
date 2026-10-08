// Prueba del lockstep: anfitrión + cliente en contextos separados, red simulada con latencia variable
const fs=require('fs'),vm=require('vm'),path=require('path');
const GAME=fs.readFileSync(path.join(__dirname,'../web/game.js'),'utf8'),NET=fs.readFileSync(path.join(__dirname,'../web/net.js'),'utf8');
let now=0;const pending=[];let lat=()=>30+Math.random()*120;
function deliver(t,f){pending.push({t:now+t,f});pending.sort((a,b)=>a.t-b.t)}
function mk(name){const ctx={Math,JSON,Date,Map,Set,Array,Object,Uint8Array,Int16Array,Int32Array,Float32Array,String,Number,Error,console,performance:{now:()=>now}};ctx.window=ctx;ctx.globalThis=ctx;
 const peer={name,ctx,conns:{},nextId:1,log:[]};
 ctx.webkit={messageHandlers:{net:{postMessage:m=>hub(peer,m)}}};vm.createContext(ctx);vm.runInContext(GAME,ctx);vm.runInContext(NET,ctx);return peer}
let HOST=null;
function ord(c){const t=Math.max(now+lat(),c.last||0);c.last=t;return t-now}
function ev(p,o){deliver(1,()=>p.ctx.__net(JSON.parse(JSON.stringify(o))))}
function hub(p,m){switch(m.op){
 case'host':HOST=p;ev(p,{type:'hosted',port:47800,ips:['10.0.0.1']});break;
 case'join':{const h=HOST;const idc=p.nextId++,idh=h.nextId++;p.conns[idc]={to:h,rid:idh};h.conns[idh]={to:p,rid:idc};ev(h,{type:'open',id:idh,addr:'10.0.0.2'});ev(p,{type:'open',id:idc});break}
 case'send':{const c=p.conns[m.id];if(c)deliver(ord(c),()=>c.to.ctx.__net({type:'msg',id:c.rid,data:m.data}));break}
 case'broadcast':for(const id in p.conns){const c=p.conns[id];deliver(ord(c),()=>c.to.ctx.__net({type:'msg',id:c.rid,data:m.data}))}break;
 case'close':for(const id in p.conns){const c=p.conns[id];deliver(5,()=>c.to.ctx.__net({type:'close',id:c.rid}))}p.conns={};break;
 case'ips':case'browse':case'stopBrowse':break}}
const H=mk('host'),C=mk('client');let fails=0;const ok=(c,m)=>{if(!c){fails++;console.log('  ✗',m)}else console.log('  ✓',m)};
const starts={};for(const P of[H,C]){const N=P.ctx.ImperiaNet;N.on.start=(cfg,seed)=>{P.ctx.Imperia.newGame(cfg,seed);starts[P.name]=cfg.me};N.on.chat=(f,t)=>P.log.push(f+': '+t);N.on.desync=n=>P.desync=n;N.on.error=e=>P.log.push('ERR '+e)}
function tick(ms){const end=now+ms;while(true){const nx=pending[0];if(!nx||nx.t>end)break;pending.shift();now=nx.t;nx.f()}now=end}
H.ctx.ImperiaNet.host('Ana');tick(50);C.ctx.ImperiaNet.join('10.0.0.1','Luis');tick(500);
const L=H.ctx.ImperiaNet.L;ok(L.slots[1].k==='human'&&L.slots[1].name==='Luis','el cliente ocupa una ranura de la sala');
C.ctx.ImperiaNet.setSlot(1,{civ:'francos',team:1});H.ctx.ImperiaNet.setSlot(2,{k:'ai',civ:'teutones',team:1});H.ctx.ImperiaNet.setCfg({map:'arabia',size:'small'});tick(500);
ok(C.ctx.ImperiaNet.L.slots[1].civ==='francos'&&C.ctx.ImperiaNet.L.cfg.map==='arabia','los cambios de sala llegan a ambos');
C.ctx.ImperiaNet.chat('hola');tick(500);ok(H.log.some(l=>l.includes('Luis: hola'))&&C.log.some(l=>l.includes('Luis: hola')),'el chat se retransmite');
H.ctx.ImperiaNet.start();tick(800);ok(starts.host===0&&starts.client===1,'ambos empiezan la partida (jugadores '+starts.host+' y '+starts.client+')');
const IH=H.ctx.Imperia,IC=C.ctx.Imperia;ok(IH.hash()===IC.hash(),'mismo estado inicial');
const run=P=>(cmds,ticks)=>{for(const [pl,c] of cmds)P.ctx.Imperia.exec(pl,c);for(let k=0;k<ticks;k++){P.ctx.Imperia.update(1/30);P.ctx.Imperia.G.ev.length=0}};
let frames=0;const T=32;
for(let s=0;s<180;s++){for(let f=0;f<60;f++){tick(1000/60);H.ctx.ImperiaNet.pump(1/60,run(H));C.ctx.ImperiaNet.pump(1/60,run(C));frames++}
 if(s%5===0)for(const [P,pl] of[[H,0],[C,1]]){const G=P.ctx.Imperia.G;const vs=G.ul.filter(e=>!e.dead&&e.owner===pl&&e.type==='villager');const tc=G.bl.find(e=>!e.dead&&e.owner===pl&&e.type==='tc');
  const res=G.rl.filter(e=>!e.dead&&e.type==='tree');const t=res[(s*7+pl)%res.length];
  if(vs.length)P.ctx.ImperiaNet.cmd({c:'right',ids:vs.slice(0,2).map(v=>v.id),x:t.x,y:t.y,tgt:t.id,q:s%10===0});
  if(tc)P.ctx.ImperiaNet.cmd({c:'queue',id:tc.id,k:'villager',n:1});
  const b=G.bases[pl];P.ctx.ImperiaNet.cmd({c:'place',b:'house',tx:b.x+((s*3)%11)-5,ty:b.y+((s*5)%11)-5,ids:vs.slice(2,3).map(v=>v.id)})}}
tick(2000);for(let f=0;f<120;f++){H.ctx.ImperiaNet.pump(1/60,run(H));C.ctx.ImperiaNet.pump(1/60,run(C));tick(16)}
const th=IH.G.t,tc=IC.G.t;console.log('   tiempo de juego',th.toFixed(1),tc.toFixed(1),'turnos',H.ctx.ImperiaNet.execTurn,C.ctx.ImperiaNet.execTurn);
ok(th>150,'la partida avanza con latencia de 30–150 ms ('+th.toFixed(0)+' s en 180 s reales)');
// igualar turnos y comparar
while(H.ctx.ImperiaNet.execTurn!==C.ctx.ImperiaNet.execTurn){tick(50);C.ctx.ImperiaNet.pump(0,run(C));if(C.ctx.ImperiaNet.execTurn>H.ctx.ImperiaNet.execTurn)break}
ok(IH.hash()===IC.hash()&&!H.desync&&!C.desync,'estados idénticos en anfitrión y cliente (hash '+IH.hash()+')');
const p1=IH.G.players[1];ok(p1.stats.trained>0&&IC.G.players[1].stats.trained===p1.stats.trained,'las órdenes del cliente se ejecutan en ambos ('+p1.stats.trained+' unidades)');
// desconexión del cliente: la IA toma el control
C.ctx.ImperiaNet.leave();tick(200);for(let f=0;f<60;f++){tick(16);H.ctx.ImperiaNet.pump(1/60,run(H))}
ok(IH.G.players[1].ai===true,'al desconectarse el cliente, la IA toma su reino');
console.log(fails?'\nFALLOS: '+fails:'\nTODO CORRECTO');
