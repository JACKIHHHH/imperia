// Imperia — multijugador en red local (lockstep determinista con anfitrión que retransmite los turnos)
(function(root){
'use strict';
const TURN=1/10,TICKS=3,WINDOW=12,HASH_EVERY=10,MAXP=4;
const bridge=()=>root.webkit&&root.webkit.messageHandlers&&root.webkit.messageHandlers.net;
const N={
 get native(){return !!bridge()},
 role:null,        // 'host' | 'client' | null
 inGame:false,paused:false,speed:1,
 L:null,           // estado de la sala {slots,cfg}
 you:-1,           // índice de ranura (sala) o de jugador (partida)
 peers:{},         // anfitrión: id de conexión -> {slot,name,ack}
 hostId:0,         // cliente: id de la conexión con el anfitrión
 found:[],ips:[],port:47800,
 q:[],nextTurn:0,execTurn:0,pending:[],acc:0,hashes:{},desync:false,
 on:{}             // callbacks: lobby, start, chat, status, peers, error, pause, desync
};
function post(m){const b=bridge();if(b)try{b.postMessage(m)}catch(e){}}
function emit(k,...a){const f=N.on[k];if(f)try{f(...a)}catch(e){console.error(e)}}
function sendTo(id,o){post({op:'send',id,data:JSON.stringify(o)})}
function bcast(o){post({op:'broadcast',data:JSON.stringify(o)})}
const civs=()=>Object.keys(root.Imperia.CIVS);

// ---------- sala
function newLobby(name){return{slots:[{k:'host',name,civ:civs()[0],team:0},{k:'open',team:1},{k:'ai',name:null,civ:civs()[1],team:1},{k:'closed',team:1}],
 cfg:{map:'continental',size:'medium',diff:'normal',win:'standard',reveal:'normal'}}}
function lobbyOut(){for(const id in N.peers)sendTo(+id,{t:'lobby',L:N.L,you:N.peers[id].slot});emit('lobby',N.L,N.you)}
N.host=function(name){N.leave();N.role='host';N.you=0;N.peers={};N.L=newLobby(name||'Anfitrión');post({op:'host',name:(name||'Imperia')+' · Imperia',port:N.port});emit('lobby',N.L,N.you)};
N.browse=function(){post({op:'browse'})};
N.stopBrowse=function(){post({op:'stopBrowse'})};
N.join=function(addr,name){N.leave();N.role='client';N.myName=name||'Jugador';N.hostId=0;
 const m=/^\s*([^:\s]+)(?::(\d+))?\s*$/.exec(addr||'');if(!m){emit('error','Dirección no válida');N.role=null;return}
 post({op:'join',host:m[1],port:+(m[2]||N.port)});emit('status','Conectando con '+m[1]+'…')};
N.joinService=function(svc,name){N.leave();N.role='client';N.myName=name||'Jugador';N.hostId=0;post({op:'joinService',name:svc});emit('status','Conectando con '+svc+'…')};
N.leave=function(){if(N.role)post({op:'close'});N.role=null;N.inGame=false;N.L=null;N.you=-1;N.peers={};N.q=[];N.pending=[];N.paused=false;N.desync=false};
N.ipsReq=function(){post({op:'ips'})};
// cambios de sala: el anfitrión los aplica, el cliente los pide
N.setSlot=function(i,patch){if(N.role==='host'){applySlot(i,patch,true);lobbyOut()}else if(N.role==='client')sendTo(N.hostId,{t:'slot',i,p:patch})};
N.setCfg=function(p){if(N.role!=='host')return;Object.assign(N.L.cfg,p);lobbyOut()};
function applySlot(i,p,isHost){const s=N.L.slots[i];if(!s)return;
 if(p.civ&&civs().includes(p.civ))s.civ=p.civ;if(p.team!=null&&p.team>=0&&p.team<4)s.team=p.team|0;if(p.name&&(s.k==='host'||s.k==='human'))s.name=String(p.name).slice(0,18);
 if(isHost&&p.k&&s.k!=='host'&&s.k!=='human'&&['open','ai','closed'].includes(p.k)){s.k=p.k;if(p.k==='ai'){s.civ=s.civ||civs()[i%civs().length];s.name=null}}}
N.kick=function(i){if(N.role!=='host')return;for(const id in N.peers)if(N.peers[id].slot===i){sendTo(+id,{t:'kicked'});post({op:'kick',id:+id})}};

// ---------- partida
N.start=function(){if(N.role!=='host')return false;const S=N.L.slots,players=[],map={};
 S.forEach((s,i)=>{if(s.k==='host'||s.k==='human'||s.k==='ai'){map[i]=players.length;players.push({civ:s.civ,team:s.team,ai:s.k==='ai',name:s.k==='ai'?null:s.name})}});
 if(players.length<2){emit('error','Hacen falta al menos dos jugadores');return false}
 if(new Set(players.map(p=>p.team)).size<2){emit('error','Todos los jugadores están en el mismo equipo');return false}
 const seed=(Date.now()%2147483647)|0||7,cfg=Object.assign({},N.L.cfg,{players,mp:true,teams:'custom'});
 for(const id in N.peers){const pi=map[N.peers[id].slot];N.peers[id].pl=pi;N.peers[id].ack=-1;sendTo(+id,{t:'start',cfg:Object.assign({},cfg,{me:pi}),seed})}
 begin(Object.assign({},cfg,{me:map[0]}),seed);return true};
function begin(cfg,seed){N.inGame=true;N.q=[];N.pending=[];N.nextTurn=0;N.execTurn=0;N.acc=0;N.hashes={};N.paused=false;N.desync=false;N.you=cfg.me;emit('start',cfg,seed)}
N.cmd=function(c){if(!N.inGame)return;if(N.role==='host')N.pending.push([N.you,c]);else sendTo(N.hostId,{t:'cmd',c})};
N.chat=function(text){text=String(text||'').trim().slice(0,160);if(!text)return;if(N.role==='host')chatOut(N.L.slots[0].name,text,N.you);else sendTo(N.hostId,{t:'chat',text})};
function chatOut(from,text,pl){const m={t:'chat',from,text,pl};bcast(m);emit('chat',from,text,pl)}
N.setPause=function(v){if(N.role==='host'){N.paused=!!v;bcast({t:'pause',v:N.paused});emit('pause',N.paused)}else sendTo(N.hostId,{t:'pause',v:!!v})};
N.setSpeed=function(s){if(N.role==='host'){N.speed=s;bcast({t:'speed',s})}};
// bucle: el anfitrión genera turnos; todos ejecutan los turnos recibidos en orden
N.pump=function(dt,run){if(!N.inGame)return;
 if(N.role==='host'&&!N.paused){N.acc+=dt*N.speed;let guard=0;
  while(N.acc>=TURN&&guard++<4){let slow=false;for(const id in N.peers){const p=N.peers[id];if(p.pl!=null&&!p.gone&&p.ack<N.nextTurn-WINDOW)slow=true}
   if(slow){N.acc=Math.min(N.acc,TURN);if(!N.waitT)N.waitT=performance.now();break}N.waitT=0;
   N.acc-=TURN;const b={t:'turn',n:N.nextTurn++,c:N.pending};N.pending=[];bcast(b);N.q.push(b)}}
 let steps=0;if(N.q.length>1)N.q.sort((a,b)=>a.n-b.n);while(N.q.length&&N.q[0].n<N.execTurn)N.q.shift();
 const ready=()=>N.q.length&&N.q[0].n===N.execTurn;let avail=0;for(let i=0;i<N.q.length&&N.q[i].n===N.execTurn+i;i++)avail++;
 const lim=avail>4?avail:(N.role==='host'?4:2);
 while(ready()&&steps<lim){const b=N.q.shift();
  run(b.c,TICKS);N.execTurn++;steps++;
  if(b.n%HASH_EVERY===0){const h=root.Imperia.hash();if(N.role==='host')N.hashes[b.n]=h;else sendTo(N.hostId,{t:'hash',n:b.n,h})}
  if(N.role==='client'&&b.n%2===0)sendTo(N.hostId,{t:'ack',n:b.n})}
 if(N.role==='host')N.hostWait=N.waitT?(performance.now()-N.waitT)/1000:0};
N.stats=()=>({turn:N.execTurn,queued:N.q.length,wait:N.hostWait||0});

// ---------- mensajes nativos
root.__net=function(ev){try{switch(ev.type){
 case'hosted':N.ips=ev.ips||[];emit('status','Partida creada · puerto '+ev.port+(N.ips.length?' · '+N.ips.join(', '):''));emit('lobby',N.L,N.you);break;
 case'ips':N.ips=ev.ips||[];emit('lobby',N.L,N.you);break;
 case'peers':N.found=ev.list||[];emit('peers',N.found);break;
 case'error':emit('error',ev.msg);break;
 case'open':if(N.role==='client'){N.hostId=ev.id;sendTo(ev.id,{t:'hello',name:N.myName,v:3})}else if(N.role==='host')N.peers[ev.id]={slot:-1,name:'?',ack:-1,addr:ev.addr};break;
 case'close':if(N.role==='host'){const p=N.peers[ev.id];if(!p)break;delete N.peers[ev.id];
   if(N.inGame){if(p.pl!=null){N.pending.push([-1,{c:'drop',pl:p.pl}]);chatOut('Sistema',p.name+' se ha desconectado',-1)}}
   else if(p.slot>=0&&N.L.slots[p.slot].k==='human'){N.L.slots[p.slot]={k:'open',team:N.L.slots[p.slot].team};lobbyOut()}}
  else if(N.role==='client'&&ev.id===N.hostId){const was=N.inGame;N.role=null;N.inGame=false;emit('lost',was,ev.why)}break;
 case'msg':{let m;try{m=JSON.parse(ev.data)}catch(e){break}if(N.role==='host')fromClient(ev.id,m);else if(N.role==='client')fromHost(m);break}
 }}catch(e){console.error(e)}};
function fromClient(id,m){const p=N.peers[id];if(!p)return;
 switch(m.t){
 case'hello':{if(N.inGame){sendTo(id,{t:'refused',why:'La partida ya ha empezado'});return}
  const i=N.L.slots.findIndex(s=>s.k==='open');if(i<0){sendTo(id,{t:'refused',why:'La sala está llena'});return}
  p.slot=i;p.name=String(m.name||'Jugador').slice(0,18);N.L.slots[i]={k:'human',name:p.name,civ:civs()[i%civs().length],team:N.L.slots[i].team,peer:id};
  chatOut('Sistema',p.name+' se ha unido',-1);lobbyOut();break}
 case'slot':if(p.slot>=0&&m.i===p.slot&&!N.inGame){const q=Object.assign({},m.p);delete q.k;applySlot(m.i,q,false);if(q.name)p.name=N.L.slots[m.i].name;lobbyOut()}break;
 case'cmd':if(N.inGame&&p.pl!=null&&m.c&&typeof m.c==='object'&&m.c.c!=='drop')N.pending.push([p.pl,m.c]);break;
 case'ack':p.ack=Math.max(p.ack,m.n|0);break;
 case'hash':{const h=N.hashes[m.n];if(h!=null&&h!==m.h&&!N.desync){N.desync=true;bcast({t:'desync',n:m.n});emit('desync',m.n)}break}
 case'chat':chatOut(p.name,String(m.text||'').slice(0,160),p.pl!=null?p.pl:-1);break;
 case'pause':N.setPause(!!m.v);break}}
function fromHost(m){switch(m.t){
 case'lobby':N.L=m.L;N.you=m.you;emit('lobby',N.L,N.you);break;
 case'refused':emit('error',m.why);N.leave();break;
 case'kicked':emit('error','El anfitrión te ha expulsado de la sala');N.leave();break;
 case'start':begin(m.cfg,m.seed);break;
 case'turn':N.q.push(m);break;
 case'chat':emit('chat',m.from,m.text,m.pl);break;
 case'pause':N.paused=!!m.v;emit('pause',N.paused);break;
 case'speed':N.speed=m.s;break;
 case'desync':if(!N.desync){N.desync=true;emit('desync',m.n)}break}}
root.ImperiaNet=N;
})(window);
