// Imperia — interfaz, controles y bucle principal (v3)
(function(){
'use strict';
const I=window.Imperia,R=window.ImperiaR,AU=window.ImperiaAudio,Net=window.ImperiaNet;
const AGEDESC=['Desbloquea arqueros, caballería, mercado, herrería, torres, murallas y galeras.','Desbloquea castillos, unidades únicas, maravilla, asedio, monjes y las mejoras de unidades.',
 'Pólvora: tercios, arcabuceros, coraceros, bombardas y galeones. Baluartes con cañones. Los centros urbanos empiezan a recaudar impuestos en oro.',
 'Revolución industrial: granaderos, fusileros, tiradores, dragones y fragatas acorazadas. +8 % de recolección.',
 'Guerra mundial: tanques, bazucas, ametralladores, obuses y destructores. Nidos de ametralladoras.',
 'Era atómica: carros de combate, lanzacohetes múltiples, cruceros lanzamisiles y torres de misiles.',
 'Era de la información: drones de ataque, misiles guiados, tanques de batalla y torretas automáticas.',
 'Año 2100: exosoldados, mechs de asalto, cañones de riel y de plasma, aerodeslizadores y torres láser.'];
const SHOTS={bullet:'gun',ball:'cannon',shell:'cannon',rocket:'rocket',laser:'laser',plasma:'plasma',grenade:'gun'};
const ROMAN=['I','II','III','IV','V','VI','VII','VIII','IX'];
const {T,U,B,RDEF,AGES,AGECOST,AGETIME,RN,BPAGES,TECH,RES,CIVS,MAPS,SIZES,DIFF,PCOLORS,GAR,WONDER_T,RELIC_T}=I;
const $=id=>document.getElementById(id);
const cv=$('c3d'),ov=$('ov'),oc=ov.getContext('2d'),mini=$('mini'),mc=mini.getContext('2d');
let G=null,MW=88,MH=88,mode='menu',sel=[],bm=null,amode=false,page=0,speed=1,paused=false,groups={},last=0,dpr=1;
let uiT=0,miniT=0,terT=0,ambT=0,pings=[],curCmds=[],cmdSig=null,tipCmd=null,delArm=0,lastGK={k:null,t:0},idleIx=0,menuA=0,lastToast='',wallDrag=null,fpsN=0,fpsT=0,rebinding=null,graphK='score',sayT=0;
const cfg={civ:'iberos',map:'continental',size:'medium',nAI:1,teams:'ffa',diff:'normal',win:'standard',reveal:'normal'};
const DEFKEYS={grid:'QWERTASDFGZXCVB'.split(''),idle:'.',tc:'H',army:'M',pause:'P',chat:'Enter',save:'F5'};
const opts={quality:'high',music:55,sfx:80,cam:100,edge:true,day:false,fpsCap:60,fps:false,voices:true,name:'Jugador',keys:JSON.parse(JSON.stringify(DEFKEYS))};
const tut={on:false,i:0,done:false};
const keys={},mouse={x:0,y:0,down:false,sx:0,sy:0,drag:false,inside:false};
const RICON={
 food:'<svg viewBox="0 0 16 16"><path fill="var(--food)" d="M8 1.5c1.9 2 1.9 4.4 0 6.3-1.9-1.9-1.9-4.3 0-6.3Zm-4.9 3c2.6.2 4.2 2 4.4 4.7-2.7-.2-4.2-1.9-4.4-4.7Zm9.8 0c-.2 2.8-1.7 4.5-4.4 4.7.2-2.7 1.8-4.5 4.4-4.7ZM7.4 9.4h1.2V15H7.4z"/></svg>',
 wood:'<svg viewBox="0 0 16 16"><rect x="1.5" y="5" width="13" height="6.5" rx="3.2" fill="var(--wood)"/><circle cx="4.7" cy="8.25" r="2.3" fill="#e7cfa6"/></svg>',
 gold:'<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="6.3" fill="var(--gold)"/><circle cx="8" cy="8" r="4.1" fill="none" stroke="#a8811f" stroke-width="1.1"/></svg>',
 stone:'<svg viewBox="0 0 16 16"><path fill="var(--stone)" d="M3 12.8 1.6 8.4 5 3.6l5.3-.9 4 4.1-.7 5.4-4.6 1.6Z"/></svg>'};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

// ---------- almacenamiento (app nativa o navegador)
const Store={cb:{},n:0,get native(){return!!(window.webkit&&window.webkit.messageHandlers&&window.webkit.messageHandlers.store)},
 req(m){return new Promise(res=>{if(!this.native){try{if(m.op==='write'){localStorage.setItem('imperia_'+m.key,m.data);res(true)}else res(localStorage.getItem('imperia_'+m.key))}catch(e){res(null)}return}
  const id=++this.n;this.cb[id]=res;try{window.webkit.messageHandlers.store.postMessage(Object.assign({id},m))}catch(e){delete this.cb[id];res(null)}})},
 write(key,data){return this.req({op:'write',key,data})},read(key){return this.req({op:'read',key})}};
window.__storeReply=(id,data)=>{const f=Store.cb[id];delete Store.cb[id];if(f)f(data)};

// ---------- audio y voces
function sfx(k,v){AU.sfx(k,v)}
function sfxAt(k,x,y,base){if(!G)return;const d=Math.hypot(x/T-R.view.tx,y/T-R.view.tz),lim=R.view.dist*.9;if(d>lim)return;sfx(k,(base||1)*(1-d/lim*.75))}
let vozA=null;
function say(text,urgent,o){if(!opts.voices||!text)return;const now=performance.now();if(!urgent&&now-sayT<1800)return;sayT=now;o=o||{};
 // voces grabadas (ElevenLabs, web/voces) si existen; si no, voz del sistema
 const VV=window.IMPERIA_VOCES,vf=VV&&(VV[text+'|'+(o.voz||'narrador')]||VV[text]);
 if(vf){try{if(vozA&&!vozA.ended){if(!urgent)return;vozA.pause()}vozA=new Audio('voces/'+vf);vozA.volume=Math.min(1,opts.sfx/100*1.1);vozA.play().catch(()=>{})}catch(e){}return}
 const vb=window.webkit&&window.webkit.messageHandlers&&window.webkit.messageHandlers.voice;
 if(vb){try{vb.postMessage({text,urgent:!!urgent,stop:!!urgent,rate:o.rate||.52,pitch:o.pitch||1,vol:opts.sfx/100})}catch(e){}return}
 if(window.speechSynthesis){try{if(urgent)speechSynthesis.cancel();else if(speechSynthesis.speaking)return;const u=new SpeechSynthesisUtterance(text);u.lang='es-ES';u.rate=1.05;u.pitch=o.pitch||1;u.volume=opts.sfx/100;speechSynthesis.speak(u)}catch(e){}}}
const pick=a=>a[Math.floor(Math.random()*a.length)];
const ACK={obr:['Ahora mismo','Manos a la obra','Recibido, jefe'],mod:['¡Recibido!','Afirmativo','En movimiento'],fut:['Confirmado','Orden procesada'],atkMod:['¡Fuego a discreción!','¡Enemigo a la vista!','Objetivo fijado'],vil:['Voy','Enseguida','Sí, señor','A trabajar'],mil:['¡A la orden!','¡Entendido!','¡En marcha!','Sí, mi señor'],atk:['¡Al ataque!','¡Por el reino!','¡A ellos!'],monk:['Que así sea','Voy, hermano'],ship:['¡Leven anclas!','Rumbo fijado','¡Avante!']};
function ackFor(r){const o=own().filter(e=>e.kind==='unit');if(!o.length)return;const t=o[0].type,c=U[t].cls;
 const ag=(G&&G.players[ME()]&&G.players[ME()].age)||0;
 if(r==='atk')return ag>=5?say(pick(ACK.atkMod),false,{pitch:.9,voz:ag>=8?'futuro':'moderno'}):say(pick(ACK.atk),false,{pitch:.9,voz:'soldado'});
 if(c==='vil')return say(pick(ag>=4?ACK.obr:ACK.vil),false,{pitch:1.1,voz:ag>=4?'obrero':'aldeano'});
 if(c==='monk')return say(pick(ACK.monk),false,{pitch:1,voz:'monje'});if(c==='ship')return say(pick(ACK.ship),false,{pitch:.9,voz:'marinero'});
 say(pick(ag>=8?ACK.fut:ag>=5?ACK.mod:ACK.mil),false,{pitch:.85,voz:ag>=8?'futuro':ag>=5?'moderno':'soldado'})}
function applyOpts(){opts.day=false;AU.setVolumes(opts.music/100,opts.sfx/100);R.setQuality(opts.quality);R.setDayNight(false);if(R.setFpsCap)R.setFpsCap(+opts.fpsCap||0);$('fps').hidden=!opts.fps}
function saveOpts(){Store.write('options',JSON.stringify(opts))}

// ---------- utilidades
const ME=()=>G?G.me||0:0,PME=()=>G.players[ME()];
const mp=()=>Net&&Net.inGame;
function cmd(c){if(mp()){Net.cmd(c);return true}return I.exec(ME(),c)}
function own(){return sel.map(id=>G.ents.get(id)).filter(e=>e&&!e.dead&&e.owner===ME()&&!(e.kind==='unit'&&e.gar))}
function setSel(ids){sel=ids;R.setSelection(ids);bm=null;amode=false;wallDrag=null;R.setGhost(null);if(!own().some(e=>e.type==='villager'))page=0;cmdSig=null;refreshUI()}
function toast(t,warn,cls){if(t===lastToast&&$('msgs').lastChild)return;lastToast=t;const m=document.createElement('div');m.className='msg'+(warn?' warn':'')+(cls?' '+cls:'');m.textContent=t;const box=$('msgs');box.appendChild(m);while(box.children.length>5)box.firstChild.remove();
 setTimeout(()=>{m.style.opacity=0;m.style.transform='translateY(-6px)'},cls?7000:3800);setTimeout(()=>{m.remove();if(lastToast===t)lastToast=''},cls?7600:4400)}
function centerSel(ids){const es=ids.map(i=>G.ents.get(i)).filter(Boolean);if(!es.length)return;let x=0,z=0;for(const e of es){x+=e.x;z+=e.y}R.centerOn(x/es.length/T,z/es.length/T)}
function entAtScreen(sx,sy){const e=R.pickEntity(sx,sy);if(e)return e;const w=R.screenToWorld(sx,sy);return w?I.pickAt(w.x*T,w.z*T,10):null}
function visUnit(e){return !e.gar&&(I.isAlly(e.owner,ME())||G.vis[I.idx(Math.min(MW-1,Math.max(0,e.x/T|0)),Math.min(MH-1,Math.max(0,e.y/T|0)))]===1)}
function costHTML(c,p){return'<div class="cost">'+Object.keys(c).map(k=>`<span class="${p&&p.res[k]<c[k]?'no':''}">${RICON[k]}${c[k]}</span>`).join('')+'</div>'}
function pName(o){return o===ME()?'Tú':G.players[o].name}
function ownerLabel(o){if(o==null)return'<div class="owner" style="color:var(--mut)">Recurso natural</div>';const p=G.players[o],c=PCOLORS[o];
 const t=o===ME()?'Tu reino':(I.isAlly(ME(),o)?'Aliado · ':'Enemigo · ')+esc(p.name);return`<div class="owner" style="color:${c}"><i style="background:${c}"></i>${t}</div>`}
const fmtT=s=>{s=Math.max(0,Math.floor(s));return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')};
const keyName=k=>({' ':'Espacio','Enter':'Intro','.':'.',',':',','ArrowUp':'↑','ArrowDown':'↓','ArrowLeft':'←','ArrowRight':'→'}[k]||k);
const gridKey=i=>opts.keys.grid[i]||'';

// ---------- órdenes (el panel es una rejilla de 5×3; cada casilla tiene su tecla)
function isMil(e){return e.kind==='unit'&&U[e.type].atk>0&&e.type!=='villager'}
function commands(){const o=own();if(!o.length)return[];const p=PME(),L=[],me=ME();
 const del={id:'del',slot:14,icon:'x:del',name:'Eliminar',desc:'Elimina la selección. Pulsa Supr dos veces para confirmar.',act:()=>delSel()};
 const vills=o.filter(e=>e.type==='villager'),units=o.filter(e=>e.kind==='unit');
 if(vills.length){BPAGES[page].forEach((t,i)=>L.push({id:'b:'+t,slot:i,icon:'b:'+t,name:I.bName(t,me),desc:B[t].desc,cost:B[t].cost,time:B[t].time,off:!I.bldAvail(p,t),req:B[t].age?'Requiere la '+AGES[B[t].age]:'',act:()=>{bm=t;amode=false;wallDrag=null;cmdSig=null}}));
  L.push({id:'page',slot:10,icon:'x:page'+(page?0:1),name:page?'Edificios económicos':'Edificios militares',desc:page?'Casas, granjas, almacén, mercado, muelle, torres y murallas.':'Cuartel, galería, establo, herrería, asedio, monasterio, castillo y maravilla.',act:()=>{page=1-page;bm=null;cmdSig=null}});
  L.push({id:'stop',slot:11,icon:'x:stop',name:'Detener',desc:'Cancela la orden actual y las encadenadas.',act:()=>cmd({c:'stop',ids:sel})});L.push(del);return L}
 if(units.length){const mil=units.filter(isMil);
  if(mil.length)L.push({id:'amove',slot:5,icon:'x:amove',name:'Atacar y avanzar',desc:'Haz clic en el mapa: tus tropas avanzan en formación y atacan a todo enemigo que encuentren. Con Mayús encadenas puntos.',act:()=>{amode=true;bm=null;cmdSig=null}});
  L.push({id:'stop',slot:6,icon:'x:stop',name:'Detener',desc:'Cancela la orden actual y las encadenadas.',act:()=>cmd({c:'stop',ids:sel})});
  const tr=units.filter(u=>u.type==='transport'&&u.cargo&&u.cargo.length);
  if(tr.length)L.push({id:'unload',slot:7,icon:'x:unload',name:'Desembarcar',desc:'Haz clic derecho en la costa con el transporte seleccionado para desembarcar allí. Este botón desembarca en la orilla más cercana.',act:()=>{for(const s of tr)cmd({c:'right',ids:[s.id],x:s.x,y:s.y+T})}});
  if(mil.length){const st=mil[0].st||0,mk=(s,name,desc,slot)=>L.push({id:'st'+s,slot,icon:'x:st'+s,name,desc,on:mil.every(u=>(u.st||0)===s),act:()=>cmd({c:'stance',ids:sel,s})});
   mk(0,'Actitud agresiva','Persiguen a cualquier enemigo que vean.',10);mk(1,'Actitud defensiva','Combaten pero vuelven a su posición si se alejan demasiado.',11);mk(2,'Mantener posición','No se mueven: solo atacan lo que tengan a su alcance.',12)}
  L.push(del);return L}
 const b=o[0];
 if(o.length===1&&b.kind==='bld'){
  if(b.bp>=1){const d=B[b.type];let ki=0;
   I.trainsOf(b).forEach(t=>L.push({id:'u:'+t,slot:ki++,icon:'u:'+t,name:I.uName(t,me),desc:U[t].desc+' Mayús + clic entrena cinco.',cost:I.unitCost(me,t),time:Math.round(I.trainTime(me,b,t)),off:!I.unitAvail(p,t),req:U[t].age?'Requiere la '+AGES[U[t].age]:'',act:ev=>cmd({c:'queue',id:b.id,k:t,n:ev&&ev.shiftKey?5:1})}));
   if(b.type==='tc'&&p.age<I.MAXAGE)L.push({id:'age',slot:ki++,icon:'x:age'+(p.age+1),name:'Avanzar a la '+AGES[p.age+1]+' ('+I.AGEYEAR[p.age+1]+')',desc:AGEDESC[p.age],cost:AGECOST[p.age],time:AGETIME[p.age],off:p.aging,req:p.aging?'Ya estás avanzando de edad':'',act:()=>cmd({c:'queue',id:b.id,k:'age'})});
   for(const id of d.techs||[]){const st=I.techState(p,id);if(st==='done')continue;const t=TECH[id];
    L.push({id:'t:'+id,slot:ki++,icon:'t:'+id,name:t.name,desc:t.desc,cost:t.cost,time:t.time,off:st!=='ok',req:st==='age'?'Requiere la '+AGES[t.age]:st==='queued'?'Investigación en curso':'',act:()=>cmd({c:'queue',id:b.id,k:'t:'+id})})}
   if(d.market){const pr=G.price;RES.filter(r=>r!=='gold').forEach((r,i)=>{L.push({id:'buy:'+r,slot:5+i,icon:'x:buy_'+r,name:'Comprar 100 de '+RN[r].toLowerCase(),desc:'Precio actual: '+Math.round(pr[r])+' de oro. Cada compra encarece el recurso.',cost:{gold:Math.round(pr[r])},act:()=>cmd({c:'market',op:'buy',r})});
    L.push({id:'sell:'+r,slot:10+i,icon:'x:sell_'+r,name:'Vender 100 de '+RN[r].toLowerCase(),desc:'Recibes '+Math.round(pr[r]*.7)+' de oro. Cada venta abarata el recurso.',cost:{[r]:100},act:()=>cmd({c:'market',op:'sell',r})})})}
   if(GAR[b.type]&&b.gar.length)L.push({id:'ungar',slot:12,icon:'x:ungar',name:'Sacar la guarnición',desc:'Todas las unidades salen del edificio ('+b.gar.length+').',act:()=>cmd({c:'ungar',id:b.id})});
   if(b.type==='tc')L.push({id:'bell',slot:13,icon:'x:bell',name:p.bell?'Todos a trabajar':'Campana del pueblo',desc:p.bell?'Los aldeanos refugiados vuelven a sus tareas.':'Los aldeanos cercanos se refugian en centros urbanos, torres y castillos, que disparan más flechas.',on:p.bell,act:()=>cmd({c:'bell'})})}
  L.push(del)}
 return L}
function cmdForKey(k){const i=opts.keys.grid.indexOf(k);return i<0?null:curCmds.find(c=>c.slot===i)}
function runCmd(c,ev){if(c.off){toast(c.req||'No disponible',true);sfx('err');return}c.act(ev);cmdSig=null;refreshUI()}
function delSel(){const o=own();if(!o.length)return;const now=performance.now();if(now-delArm<1600){cmd({c:'del',ids:sel});setSel([]);delArm=0}else{delArm=now;toast('Pulsa Supr otra vez para eliminar la selección',true)}}
function nextIdle(){const idle=G.ul.filter(e=>!e.dead&&!e.gar&&e.owner===ME()&&e.type==='villager'&&e.o.t==='idle');if(!idle.length){toast('No hay aldeanos inactivos');return}const v=idle[idleIx++%idle.length];setSel([v.id]);R.centerOn(v.x/T,v.y/T)}
function selectArmy(center){const ids=G.ul.filter(e=>!e.dead&&!e.gar&&e.owner===ME()&&isMil(e)).map(e=>e.id);if(!ids.length){toast('No tienes ejército');return}setSel(ids);if(center)centerSel(ids);sfx('click')}

// ---------- paneles
function refreshTop(){const p=PME();for(const r of RES)$('r-'+r).textContent=Math.floor(p.res[r]);
 const pe=$('r-pop');pe.textContent=p.pop+'/'+p.cap;pe.style.color=p.pop>=p.cap?'var(--bad)':'';
 let idle=0,army=0;for(const e of G.ul){if(e.dead||e.owner!==ME()||e.gar)continue;if(e.type==='villager'&&e.o.t==='idle')idle++;else if(isMil(e))army++}
 $('idlec').textContent=idle;$('idle').classList.toggle('zero',!idle);$('idleBigc').textContent=idle;$('idleBig').classList.toggle('zero',!idle);$('idleBig').classList.toggle('hot',idle>0);{const af=!!(G.players[ME()]&&G.players[ME()].autoFarm);$('autoFarm').classList.toggle('on',af);$('autoFarmSt').textContent=af?'Sí':'No'}$('armyc').textContent=army;$('armyBtn').classList.toggle('zero',!army);
 $('age').textContent=AGES[p.age];$('age').title=I.AGEYEAR[p.age];document.body.dataset.age=p.age;const tc=G.bl.find(e=>!e.dead&&e.owner===ME()&&e.q.length&&e.q[0].k==='age');$('aging').hidden=!tc;if(tc)$('aging').textContent='Avanzando de edad · '+Math.floor(tc.q[0].t/tc.q[0].tot*100)+'%';
 $('clock').textContent=fmtT(G.t);
 const pl=$('plist'),sig=G.players.map(q=>(q.out?1:0)+(q.ai?'a':'h')).join('');if(pl.dataset.s!==sig){pl.dataset.s=sig;pl.innerHTML=G.players.map(q=>`<span class="pl${q.out?' out':''}${q.i!==ME()&&I.isAlly(ME(),q.i)?' ally':''}" style="background:${PCOLORS[q.i]}" title="${esc(pName(q.i))} · ${CIVS[q.civ].name} · equipo ${q.team+1}${q.i!==ME()&&I.isAlly(ME(),q.i)?' · aliado':''}${q.out?' · derrotado':''}${mp()&&q.ai&&!q.out?' · IA':''}"></span>`).join('')}
 // cuentas atrás de victoria
 const vt=$('vict');let h='';if(G.cfg.win!=='conquest'){
  if(G.wonder){const w=G.ents.get(G.wonder.id);if(w&&!w.dead){const mine=I.isAlly(w.owner,ME());h+=`<div class="vc ${mine?'good':'bad'}"><span>Maravilla · ${esc(pName(w.owner))}</span><b>${fmtT(WONDER_T-(G.t-G.wonder.t0))}</b></div>`}}
  if(G.relicHold){const mine=G.relicHold.team===PME().team;h+=`<div class="vc ${mine?'good':'bad'}"><span>Reliquias · ${mine?'tu bando':'rival'}</span><b>${fmtT(RELIC_T-(G.t-G.relicHold.t0))}</b></div>`}}
 if(mp()){const s=Net.stats();if(s.wait>1)h+=`<div class="vc bad"><span>Esperando a otros jugadores…</span><b>${Math.floor(s.wait)} s</b></div>`;if(Net.paused)h+='<div class="vc"><span>Partida en pausa</span><b>‖</b></div>'}
 if(vt.dataset.h!==h){vt.dataset.h=h;vt.innerHTML=h;vt.hidden=!h}}
function refreshGroups(){const el=$('groups');const html=Object.keys(groups).sort().map(k=>{const ids=groups[k].filter(id=>{const e=G.ents.get(id);return e&&!e.dead&&e.owner===ME()});groups[k]=ids;if(!ids.length)return'';
  const by={};for(const id of ids){const t=G.ents.get(id).type;by[t]=(by[t]||0)+1}const top=Object.entries(by).sort((a,b)=>b[1]-a[1])[0][0],e0=G.ents.get(ids[0]);
  return`<button class="grp${ids.every(id=>sel.includes(id))&&sel.length===ids.length?' on':''}" data-g="${k}" title="Grupo ${k} · doble pulsación para centrar la cámara"><b>${k}</b><img src="${R.icon((e0.kind==='bld'?'b:':'u:')+top)}" alt=""><span>${ids.length}</span></button>`}).join('');
 if(el.dataset.h!==html){el.dataset.h=html;el.innerHTML=html}el.hidden=!html}
function hpBar(e){const f=Math.max(0,e.hp/e.maxhp);return`<div class="hp ${f<.25?'low':f<.5?'mid':''}"><i style="width:${f*100}%"></i></div><div class="hpt">${Math.ceil(Math.max(0,e.hp))} / ${e.maxhp}</div>`}
function queueHTML(b){const p=PME(),d=B[b.type],done=(d.techs||[]).filter(t=>p.tech[t]);
 const doneH=done.length?`<div class="qlab" style="margin-top:4px">Investigado</div><div class="done">${done.map(t=>`<img src="${R.icon('t:'+t)}" title="${TECH[t].name}" alt="">`).join('')}</div>`:'';
 const garH=GAR[b.type]?`<div class="qnote">Guarnición ${b.gar.length}/${I.garCap(b)}${b.relics&&b.relics.length?' · reliquias '+b.relics.length:''}</div>`:(b.relics&&b.relics.length?`<div class="qnote">Reliquias guardadas: ${b.relics.length} (+${(b.relics.length*.5).toFixed(1)} de oro/s)</div>`:'');
 if(!b.q.length)return`<div class="queue"><div class="qlab">Producción</div><div class="qnote">Sin órdenes.${(d.trains||[]).length?(b.rally?' Punto de reunión fijado.':' Clic derecho en el mapa para fijar un punto de reunión.'):''}</div>${garH}${doneH}</div>`;
 const q0=b.q[0],ic=q=>q.k==='age'?'x:age'+(p.age+1):q.k.startsWith('t:')?q.k:'u:'+q.k,nm=q=>q.k==='age'?'Avanzando a la '+AGES[p.age+1]:q.k.startsWith('t:')?'Investigando '+TECH[q.k.slice(2)].name:I.uName(q.k,ME());
 return`<div class="queue"><div class="qlab">Producción${q0.blocked?' · <span style="color:var(--bad)">sin población</span>':''}</div><div class="qrow">${b.q.map((q,i)=>`<div class="qi${i===0&&q.blocked?' blk':''}" data-q="${i}" title="Cancelar"><img src="${R.icon(ic(q))}" alt="">${i===0?`<div class="pb" style="width:${q.t/q.tot*100}%"></div>`:''}</div>`).join('')}</div><div class="qnote">${nm(q0)}${q0.blocked?'':' · '+Math.ceil(q0.tot-q0.t)+' s'}</div>${garH}${doneH}</div>`}
function single(e){let icon,name,body='',right='';const mine=e.owner===ME();
 if(e.kind==='relic'){icon='r:relic';name='Reliquia';body=`<div class="state">${e.holder?'Custodiada':'Sin dueño'}. Un monje puede recogerla y guardarla en un monasterio: produce oro y, si tu bando reúne todas, gana en ${Math.round(RELIC_T/60)} minutos.</div>`}
 else if(e.kind==='res'){icon='r:'+e.type;name=RDEF[e.type].name;body=`<div class="hp prog"><i style="width:${e.amt/e.max*100}%"></i></div><div class="hpt">${RN[RDEF[e.type].r]} · ${Math.ceil(e.amt)} / ${e.max}</div>${e.type==='fish'?'<div class="state">Se pesca con barcos pesqueros desde el muelle.</div>':''}`}
 else if(e.kind==='unit'){const d=U[e.type];icon='u:'+e.type;name=I.uName(e.type,e.owner);
  const st=[];if(d.atk)st.push(`Ataque <b>${I.uAtk(e)}</b>`);st.push(`Armadura <b>${I.uArmor(e,false)}</b>`);if(d.parmor)st.push(`Contra flechas <b>${I.uArmor(e,true)}</b>`);if(d.ranged||e.type==='monk')st.push(`Alcance <b>${I.uRange(e)}</b>`);st.push(`Visión <b>${d.sight}</b>`);
  body=hpBar(e)+`<div class="stats">${st.map(s=>`<span>${s}</span>`).join('')}</div>`;
  if(e.type==='monk')body+=`<div class="hp faith" style="margin-top:7px"><i style="width:${e.faith*100}%"></i></div><div class="hpt">Fe ${Math.floor(e.faith*100)} %${e.chan?' · convirtiendo '+Math.floor(e.chan*100)+' %':''}</div>`;
  if(e.cargo)body+=`<div class="state">Carga: ${e.cargo.length}/${I.garCap(e)} unidades</div>`;
  if(e.type==='trade'&&e.o.t==='trade'){const a=G.ents.get(e.o.a),b2=G.ents.get(e.o.b);if(a&&b2)body+=`<div class="state">Ruta comercial: ${I.tradeGold(a,b2)} de oro por viaje</div>`}
  if(mine){const stn=['agresiva','defensiva','mantener posición'][e.st||0];body+=`<div class="state">${I.stateText(e)}${e.carry&&e.carry.a>0?` · lleva ${e.carry.a} de ${RN[e.carry.t].toLowerCase()}`:''}${isMil(e)?' · actitud '+stn:''}${e.oq&&e.oq.length?' · '+e.oq.length+' órdenes en cola':''}</div>`}}
 else{const d=B[e.type];icon='b:'+e.type;name=I.bName(e.type,e.owner);
  if(!I.isVisible(e)&&!mine&&!I.isAlly(e.owner,ME()))body='<div class="state" style="color:var(--mut)">Visto por última vez hace un rato. Puede haber cambiado.</div>';
  else if(e.bp<1)body=`<div class="hp prog"><i style="width:${e.bp*100}%"></i></div><div class="hpt">En construcción · ${Math.floor(e.bp*100)}%</div>${mine?'<div class="state">Selecciona aldeanos y haz clic derecho sobre el edificio para ayudar.</div>':''}`;
  else{body=hpBar(e);const st=[];if(d.pop)st.push(`Población <b>+${d.pop}</b>`);if(d.atk)st.push(`Ataque <b>${I.bAtk(e)}</b>`);if(d.farm)st.push(`Comida <b>${Math.ceil(e.amt)}</b>`);if(d.drop)st.push(d.drop==='fish'?'Recibe pescado':'Punto de entrega');st.push(`Armadura <b>${I.bArmor(e.type,e.owner)}</b>`);if(d.gate)st.push('Paso para tu bando');body+=`<div class="stats">${st.map(s=>`<span>${s}</span>`).join('')}</div>`;
   if(d.market)body+=`<div class="stats">${['food','wood','stone'].map(r=>`<span>${RICON[r]} <b>${Math.round(G.price[r])}</b></span>`).join('')}<span style="color:var(--dim)">oro por 100</span></div>`;
   if(d.wonder&&G.wonder&&G.wonder.id===e.id)body+=`<div class="state">Victoria en ${fmtT(WONDER_T-(G.t-G.wonder.t0))}</div>`}
  if(mine&&e.bp>=1&&(d.trains||d.techs||GAR[e.type]||(e.relics&&e.relics.length)))right=queueHTML(e)}
 return`<div class="ent"><div class="portrait"><img src="${R.icon(icon)}" alt=""></div><div class="edet"><div class="ename">${esc(name)}</div>${ownerLabel(e.kind==='relic'?null:e.owner)}${body}</div>${right}</div>`}
function refreshInfo(){const el=$('info');const ents=sel.map(id=>G.ents.get(id)).filter(e=>e&&!e.dead&&!(e.kind==='unit'&&e.gar&&e.owner!==ME()));
 if(ents.length!==sel.length||ents.some(e=>e.kind==='unit'&&sel.length>1&&e.owner!==ME())){sel=ents.filter(e=>sel.length===1||e.owner===ME()).map(e=>e.id);R.setSelection(sel);cmdSig=null}
 if(!ents.length){const p=PME(),k='e'+p.age+p.civ;if(el.dataset.s!==k){el.dataset.s=k;el.innerHTML=`<div class="empty"><b>${AGES[p.age]} · ${CIVS[p.civ].name}</b><span>${CIVS[p.civ].desc}</span><span>Selecciona aldeanos para construir o un edificio para entrenar unidades e investigar. ${keyName(opts.keys.army)}: todo el ejército.</span></div>`}return}
 el.dataset.s='';
 if(ents.length===1){el.innerHTML=single(ents[0]);return}
 const by={};for(const e of ents){(by[e.type]||(by[e.type]={t:e.type,k:e.kind,n:0,hp:0,max:0})).n++;by[e.type].hp+=Math.max(0,e.hp);by[e.type].max+=e.maxhp}
 el.innerHTML=`<div class="ent"><div class="edet" style="flex:0 0 150px"><div class="ename">${ents.length} unidades</div><div class="owner" style="color:${PCOLORS[ME()]}"><i style="background:${PCOLORS[ME()]}"></i>Selección</div><div class="state" style="color:var(--mut)">Clic en un tipo para aislarlo. Mayús + clic lo quita.</div></div><div class="grid">${Object.values(by).map(g=>`<div class="gi" data-t="${g.t}" title="${esc(g.k==='unit'?I.uName(g.t,ME()):I.bName(g.t,ME()))}"><img src="${R.icon((g.k==='unit'?'u:':'b:')+g.t)}" alt=""><span class="n">${g.n}</span><div class="hb"><i style="width:${g.hp/g.max*100}%"></i></div></div>`).join('')}</div></div>`}
function refreshCmds(){curCmds=commands();const p=PME(),el=$('cmds');
 const sig=curCmds.map(c=>c.id+(c.off?0:1)+c.slot).join('|')+opts.keys.grid.join('');
 if(sig!==cmdSig){cmdSig=sig;el.innerHTML='';for(const c of curCmds){const b=document.createElement('button');b.className='cb'+(c.off?' off':'');b.style.gridColumn=c.slot%5+1;b.style.gridRow=Math.floor(c.slot/5)+1;
   b.innerHTML=`<img src="${R.icon(c.icon)}" alt=""><span class="k">${c.id==='del'?'Supr':esc(keyName(gridKey(c.slot)))}</span>`;b.dataset.id=c.id;b.setAttribute('aria-label',c.name);
   b.addEventListener('click',ev=>{AU.init();const cc=curCmds.find(x=>x.id===c.id);if(cc)runCmd(cc,ev)});
   b.addEventListener('mouseenter',()=>{tipCmd=c.id;showTip()});b.addEventListener('mouseleave',()=>{tipCmd=null;$('tip').hidden=true});el.appendChild(b)}
  if(tipCmd&&!curCmds.some(c=>c.id===tipCmd)){tipCmd=null;$('tip').hidden=true}}
 const hint=tut.on&&curHint();
 for(const b of el.children){const c=curCmds.find(x=>x.id===b.dataset.id);if(!c)continue;b.classList.toggle('poor',!!c.cost&&!I.canAfford(p,c.cost));b.classList.toggle('on',!!c.on||c.id==='b:'+bm||(c.id==='amove'&&amode));b.classList.toggle('hint',!!hint&&c.id===hint)}
 if(tipCmd&&!paused)showTip()}
function showTip(){const c=curCmds.find(x=>x.id===tipCmd),t=$('tip');if(!c){t.hidden=true;return}const p=PME();
 t.innerHTML=`<div class="tn">${esc(c.name)}<span class="tk">${c.id==='del'?'Supr':esc(keyName(gridKey(c.slot)))}</span></div>${c.cost?costHTML(c.cost,p):''}<div class="td">${c.desc||''}${c.time?` <span style="color:var(--dim)">· ${c.time} s</span>`:''}</div>${c.off&&c.req?`<div class="tr">${c.req}</div>`:''}`;
 t.hidden=false;const b=[...$('cmds').children].find(x=>x.dataset.id===tipCmd);if(!b)return;const r=b.getBoundingClientRect();t.style.left=Math.max(8,Math.min(innerWidth-268,r.left+r.width/2-130))+'px';t.style.top=(r.top-t.offsetHeight-10)+'px'}
function refreshUI(){if(!G||mode!=='play')return;refreshTop();refreshInfo();refreshCmds();refreshGroups();
 const o=own();R.setRally(o.length===1&&o[0].kind==='bld'&&o[0].rally?o[0].rally:null);
 let cur='default';if(bm||amode)cur='crosshair';else if(!mouse.down&&o.some(e=>e.kind==='unit')){const h=entAtScreen(mouse.x,mouse.y);if(h&&h.owner!=null&&I.isEnemy(ME(),h.owner))cur='crosshair';else if(h&&(h.kind==='res'||h.kind==='relic'||(h.kind==='bld'&&h.owner===ME())))cur='pointer'}cv.style.cursor=cur}

// ---------- minimapa (rombo alineado con la cámara)
let mTer=null,fogC=null,fogX=null,fogImg=null;
const miniRC={g:null,c:null};
function miniTerrain(){const c=document.createElement('canvas');c.width=MW;c.height=MH;const x=c.getContext('2d'),d=x.createImageData(MW,MH);
 const RC={tree:[34,62,33],gold:[228,192,84],stone:[168,170,166],berry:[176,62,74],fish:[120,170,196]};
 if(miniRC.g!==G){miniRC.g=G;miniRC.c=I.realCells?I.realCells():null}const SAT=miniRC.c&&miniRC.c.col;
 // mapas reales: color del satélite; montañas en gris roca
 for(let i=0;i<MW*MH;i++){const t=G.ter[i],h=G.hgt?Math.min(40,G.hgt[i]*14):0;let col=t===1?[44,90,118]:t===2?[92,130,140]:t===3?[150+h*.8,146+h*.8,138+h*.8]:SAT?[SAT[i*3]*.75+30+h*.4,SAT[i*3+1]*.75+34+h*.4,SAT[i*3+2]*.7+20+h*.3]:[72+h,100+h,50+h*.5];const o=G.occ[i];if(o){const e=G.ents.get(o);if(e&&e.kind==='res')col=RC[e.type]}d.data[i*4]=col[0];d.data[i*4+1]=col[1];d.data[i*4+2]=col[2];d.data[i*4+3]=255}
 x.putImageData(d,0,0);mTer=c;fogC=document.createElement('canvas');fogC.width=MW;fogC.height=MH;fogX=fogC.getContext('2d');fogImg=fogX.createImageData(MW,MH)}
function miniXf(){const k=mini.width/(MW*Math.SQRT2)*.97,y=R.view.yaw,fx=-Math.sin(y),fz=-Math.cos(y),rx=Math.cos(y),rz=-Math.sin(y);
 const a=k*rx,c=k*rz,b=-k*fx,d=-k*fz,cx=mini.width/2,cy=mini.height/2;return{a,b,c,d,e:cx-a*MW/2-c*MH/2,f:cy-b*MW/2-d*MH/2}}
function drawMini(){const m=miniXf();mc.setTransform(1,0,0,1,0,0);mc.clearRect(0,0,mini.width,mini.height);
 mc.setTransform(m.a,m.b,m.c,m.d,m.e,m.f);mc.imageSmoothingEnabled=false;mc.drawImage(mTer,0,0);
 const ss=new Set(sel);
 for(const [id,e] of G.mem){const l=G.ents.get(id);if(l&&I.isVisible(l))continue;mc.fillStyle=PCOLORS[e.owner];mc.globalAlpha=.55;mc.fillRect(e.tx,e.ty,e.size,e.size);mc.globalAlpha=1}
 for(const e of G.bl){if(e.dead||!I.isVisible(e))continue;mc.fillStyle=ss.has(e.id)?'#ffffff':PCOLORS[e.owner];mc.fillRect(e.tx,e.ty,e.size,e.size)}
 for(const e of G.ul){if(e.dead||!visUnit(e))continue;mc.fillStyle=ss.has(e.id)?'#ffffff':PCOLORS[e.owner];const s=U[e.type].naval?2.2:1.6;mc.fillRect(e.x/T-s/2,e.y/T-s/2,s,s)}
 for(const e of G.rel){if(e.dead||!I.isVisible(e))continue;mc.fillStyle='#fff3b0';mc.beginPath();mc.arc(e.x/T,e.y/T,1.2,0,7);mc.fill()}
 const fd=fogImg.data;for(let i=0;i<MW*MH;i++){fd[i*4+3]=G.vis[i]?0:(G.exp[i]?120:255);fd[i*4]=6;fd[i*4+1]=7;fd[i*4+2]=9}fogX.putImageData(fogImg,0,0);mc.imageSmoothingEnabled=true;mc.drawImage(fogC,0,0);
 mc.save();mc.beginPath();mc.rect(0,0,MW,MH);mc.clip();const fr=R.frustum();mc.strokeStyle='rgba(255,255,255,.9)';mc.lineWidth=.45*MW/88;mc.beginPath();fr.forEach(([x,z],i)=>i?mc.lineTo(x,z):mc.moveTo(x,z));mc.closePath();mc.stroke();mc.restore();
 for(const p of pings){p.t+=.2;mc.strokeStyle=`rgba(${p.c||'255,96,72'},${Math.max(0,1-p.t/3)})`;mc.lineWidth=.7*MW/88;mc.beginPath();mc.arc(p.x,p.z,1.5+(p.t%1)*5,0,7);mc.stroke()}pings=pings.filter(p=>p.t<3);
 mc.setTransform(m.a,m.b,m.c,m.d,m.e,m.f);mc.strokeStyle='rgba(255,255,255,.18)';mc.lineWidth=.4;mc.strokeRect(0,0,MW,MH)}
function miniToWorld(ev){const r=mini.getBoundingClientRect(),sx=(ev.clientX-r.left)*mini.width/r.width,sy=(ev.clientY-r.top)*mini.height/r.height,m=miniXf();
 const x=sx-m.e,y=sy-m.f,det=m.a*m.d-m.b*m.c;return{x:(m.d*x-m.c*y)/det,z:(-m.b*x+m.a*y)/det}}
let miniDrag=false;
mini.addEventListener('mousedown',ev=>{AU.init();if(mode!=='play'||(paused&&!mp()))return;const w=miniToWorld(ev);
 if(ev.button===2||ev.ctrlKey){if(!own().length)return;cmd({c:'right',ids:sel,x:Math.max(0,Math.min(MW-.5,w.x))*T,y:Math.max(0,Math.min(MH-.5,w.z))*T,q:ev.shiftKey});R.marker(w.x,w.z,0x9be07e);sfx('cmd');return}
 miniDrag=true;R.centerOn(w.x,w.z)});
window.addEventListener('mousemove',ev=>{if(miniDrag){const w=miniToWorld(ev);R.centerOn(w.x,w.z)}});
window.addEventListener('mouseup',()=>{miniDrag=false});

// ---------- superposición 2D (barras de vida, conversión, grupos y selección por caja)
const HB={knight:1.3,scout:1.25,cataphract:1.3,trade:1.1,ram:1,mangonel:1.2,fishship:1.1,galley:1.5,transport:1.4,tknight:1.1};
const HBB={tc:3.6,tower:4,house:1.7,farm:.6,monastery:3.4,smith:2.3,palisade:1.3,wall:1.4,gate:1.7,castle:4.3,wonder:5.6,market:1.8,dock:2.2};
function drawOverlay(){oc.setTransform(dpr,0,0,dpr,0,0);oc.clearRect(0,0,innerWidth,innerHeight);if(mode!=='play'||!G)return;
 const ss=new Set(sel),gof={};for(const k in groups)for(const id of groups[k])gof[id]=k;
 oc.font='600 10px -apple-system,Helvetica,sans-serif';oc.textAlign='center';
 const one=e=>{if(e.dead)return;const s=ss.has(e.id),cons=e.kind==='bld'&&e.bp<1,wall=e.kind==='bld'&&B[e.type].wall,g=gof[e.id];
  if(!s&&e.hp>=e.maxhp&&!cons&&!e.chan&&!g)return;if(wall&&!s&&!cons&&e.hp>=e.maxhp*.999)return;if(e.kind==='unit'?!visUnit(e):!I.isVisible(e))return;
  const h=(e.kind==='unit'?(HB[e.type]||.95):(HBB[e.type]||2))+(U[e.type]&&U[e.type].naval?-.2:R.hAt(e.x/T,e.y/T));
  const p=R.project(e.x/T,h,e.y/T);if(p.z>1||p.x<-60||p.y<-60||p.x>innerWidth+60||p.y>innerHeight+60)return;
  const w=e.kind==='unit'?26:Math.min(90,(wall?18:30)+e.size*12),x=Math.round(p.x-w/2),y=Math.round(p.y);
  const f=cons?e.bp:Math.max(0,e.hp/e.maxhp);
  if(s||e.hp<e.maxhp||cons){oc.fillStyle='rgba(8,9,11,.7)';oc.fillRect(x-1,y-1,w+2,5);
   oc.fillStyle=cons?'#d8b46a':(e.owner===ME()?(f>.5?'#8fca7b':f>.25?'#e5c15a':'#ea7a63'):I.isAlly(ME(),e.owner)?'#8fd0ff':'#e2553f');oc.fillRect(x,y,Math.max(1,w*f),3)}
  if(e.chan){oc.fillStyle='rgba(8,9,11,.7)';oc.fillRect(x-1,y+5,w+2,4);oc.fillStyle='#f0d493';oc.fillRect(x,y+6,w*Math.min(1,e.chan),2)}
  if(g&&e.owner===ME()&&(s||R.view.dist<30)){oc.fillStyle='rgba(8,9,11,.65)';oc.fillRect(p.x-6,y-15,12,12);oc.fillStyle='#f0d493';oc.fillText(g,p.x,y-5.5)}};
 for(const e of G.bl)one(e);for(const e of G.ul)one(e);
 if(mouse.down&&mouse.drag){const x0=Math.min(mouse.sx,mouse.x),y0=Math.min(mouse.sy,mouse.y),w=Math.abs(mouse.x-mouse.sx),h=Math.abs(mouse.y-mouse.sy);
  oc.fillStyle='rgba(216,180,106,.07)';oc.fillRect(x0,y0,w,h);oc.strokeStyle='rgba(240,212,147,.85)';oc.lineWidth=1;oc.strokeRect(x0+.5,y0+.5,w,h)}}

// ---------- entrada
function tileAtMouse(){const w=R.screenToWorld(mouse.x,mouse.y);return w?[Math.floor(w.x),Math.floor(w.z)]:null}
function ghostTiles(){const p0=PME(),s=B[bm].size,c=B[bm].cost;
 if(wallDrag){const e=tileAtMouse();if(!e)return[];const res=Object.assign({},p0.res);
  return I.wallLine(wallDrag[0],wallDrag[1],e[0],e[1]).map(([x,y])=>{let ok=I.canPlace(bm,x,y,ME());if(ok){for(const k in c)if(res[k]<c[k])ok=false;if(ok)for(const k in c)res[k]-=c[k]}return[x,y,ok]})}
 const w=R.screenToWorld(mouse.x,mouse.y);if(!w)return[];const tx=Math.round(w.x-s/2),ty=Math.round(w.z-s/2);return[[tx,ty,I.canPlace(bm,tx,ty,ME())&&I.canAfford(p0,c)]]}
function place(shift){const t=ghostTiles()[0];if(!t)return;cmd({c:'place',b:bm,tx:t[0],ty:t[1],ids:sel,q:shift});if(!t[2])return;
 const s2=B[bm].size/2;R.puff(t[0]+s2,.1+R.hAt(t[0]+s2,t[1]+s2),t[1]+s2,0xb8a07a,5);if(mp())sfx('place');ackFor('build');if(!shift){bm=null;R.setGhost(null);cmdSig=null}}
function rightClick(ev){if(bm){bm=null;wallDrag=null;R.setGhost(null);cmdSig=null;return}if(amode){amode=false;cmdSig=null;return}
 if(!own().length)return;const w=R.screenToWorld(ev.clientX,ev.clientY);if(!w)return;const tgt=entAtScreen(ev.clientX,ev.clientY);
 let r;if(mp()){Net.cmd({c:'right',ids:sel,x:w.x*T,y:w.z*T,tgt:tgt?tgt.id:null,q:ev.shiftKey});r=tgt&&tgt.owner!=null&&I.isEnemy(ME(),tgt.owner)?'atk':tgt&&(tgt.kind==='res'||tgt.kind==='relic')?'gather':'move'}
 else{r=I.exec(ME(),{c:'right',ids:sel,x:w.x*T,y:w.z*T,tgt:tgt?tgt.id:null,q:ev.shiftKey});if(!r)return}
 const col={atk:0xff6a55,conv:0xf0d493,heal:0x7dff9a,gather:0xf0cf7a,build:0xf0cf7a,rally:0x9fd4ff,gar:0x9fd4ff,unload:0x9fd4ff}[r]||0x9be07e;
 if(tgt&&r!=='move'&&r!=='rally'&&r!=='unload')R.marker(tgt.x/T,tgt.y/T,col);else R.marker(w.x,w.z,col);sfx('cmd');if(r!=='rally')ackFor(r);refreshUI()}
function clickSelect(shift,dbl){const e=entAtScreen(mouse.sx,mouse.sy);
 if(!e){if(!shift)setSel([]);return}
 if(dbl&&e.owner===ME()&&e.kind==='unit'){const ids=[];for(const u of G.ul){if(u.dead||u.gar||u.owner!==ME()||u.type!==e.type)continue;const p=R.project(u.x/T,.3,u.y/T);if(p.x>=0&&p.y>=0&&p.x<=innerWidth&&p.y<=innerHeight)ids.push(u.id)}setSel(ids);return}
 if(shift&&e.owner===ME()&&e.kind==='unit'&&own().every(x=>x.kind==='unit')){const s=sel.slice(),i=s.indexOf(e.id);if(i>=0)s.splice(i,1);else s.push(e.id);setSel(s);return}
 setSel([e.id]);sfx('click')}
function boxSelect(shift){const x0=Math.min(mouse.sx,mouse.x),x1=Math.max(mouse.sx,mouse.x),y0=Math.min(mouse.sy,mouse.y),y1=Math.max(mouse.sy,mouse.y),ids=[];
 for(const e of G.ul){if(e.dead||e.gar||e.owner!==ME())continue;const p=R.project(e.x/T,.3+(U[e.type].naval?-.2:R.hAt(e.x/T,e.y/T)),e.y/T);if(p.x>=x0&&p.x<=x1&&p.y>=y0&&p.y<=y1)ids.push(e.id)}
 if(shift)setSel([...new Set(own().filter(e=>e.kind==='unit').map(e=>e.id).concat(ids))]);else setSel(ids);if(ids.length)sfx('click')}
const inputBlocked=()=>mode!=='play'||(paused&&!mp())||G.over||!$('pause').hidden;
cv.addEventListener('mousedown',ev=>{AU.init();if(inputBlocked())return;mouse.x=ev.clientX;mouse.y=ev.clientY;
 if(ev.button===2||(ev.button===0&&ev.ctrlKey)){rightClick(ev);return}
 if(ev.button!==0)return;
 if(bm){if(B[bm].wall&&!B[bm].gate){wallDrag=tileAtMouse();return}place(ev.shiftKey);return}
 if(amode){const w=R.screenToWorld(ev.clientX,ev.clientY);if(w){cmd({c:'amove',ids:sel,x:w.x*T,y:w.z*T,q:ev.shiftKey});R.marker(w.x,w.z,0xff6a55);sfx('cmd');ackFor('atk')}if(!ev.shiftKey){amode=false;cmdSig=null}return}
 mouse.down=true;mouse.sx=ev.clientX;mouse.sy=ev.clientY;mouse.drag=false});
window.addEventListener('mousemove',ev=>{mouse.x=ev.clientX;mouse.y=ev.clientY;mouse.inside=true;if(mouse.down&&Math.hypot(mouse.x-mouse.sx,mouse.y-mouse.sy)>6)mouse.drag=true});
document.addEventListener('mouseleave',()=>{mouse.inside=false});
window.addEventListener('mouseup',ev=>{if(mode!=='play')return;
 if(wallDrag&&ev.button===0){const e=tileAtMouse()||wallDrag;cmd({c:'wall',b:bm,tiles:I.wallLine(wallDrag[0],wallDrag[1],e[0],e[1]),ids:sel,q:ev.shiftKey});wallDrag=null;if(!ev.shiftKey){bm=null;R.setGhost(null);cmdSig=null}return}
 if(!mouse.down||ev.button!==0)return;mouse.down=false;if(mouse.drag)boxSelect(ev.shiftKey);else clickSelect(ev.shiftKey,ev.detail>=2)});
document.addEventListener('contextmenu',ev=>ev.preventDefault());
cv.addEventListener('wheel',ev=>{ev.preventDefault();if(mode!=='play')return;
 if(ev.ctrlKey||ev.metaKey||ev.altKey)R.zoom(Math.exp(ev.deltaY*.012));
 else if(ev.deltaMode===1||(ev.deltaX===0&&Math.abs(ev.deltaY)>=60&&Number.isInteger(ev.deltaY)))R.zoom(ev.deltaY>0?1.12:1/1.12);
 else R.pan(-ev.deltaX*opts.cam/100,-ev.deltaY*opts.cam/100)},{passive:false});
$('info').addEventListener('mousedown',ev=>{if(mode!=='play')return;const q=ev.target.closest('[data-q]');
 if(q){const b=own()[0];if(b&&b.kind==='bld'){cmd({c:'cancel',id:b.id,i:+q.dataset.q});sfx('click');cmdSig=null;refreshUI()}return}
 const g=ev.target.closest('[data-t]');if(g){const ids=own().filter(e=>e.type===g.dataset.t).map(e=>e.id);setSel(ev.shiftKey?sel.filter(id=>!ids.includes(id)):ids)}});
$('groups').addEventListener('mousedown',ev=>{const b=ev.target.closest('[data-g]');if(b)selectGroup(b.dataset.g)});
function selectGroup(k){const g=(groups[k]||[]).filter(id=>G.ents.has(id)&&G.ents.get(id).owner===ME());if(!g.length)return;const now=performance.now();if(lastGK.k===k&&now-lastGK.t<420)centerSel(g);lastGK={k,t:now};setSel(g)}
function keyOf(ev){return ev.key.length===1?ev.key.toUpperCase():ev.key}
window.addEventListener('keydown',ev=>{AU.init();
 if(rebinding){ev.preventDefault();finishRebind(ev);return}
 if(document.activeElement&&/INPUT|TEXTAREA/.test(document.activeElement.tagName)){if(ev.key==='Escape')document.activeElement.blur();return}
 keys[ev.key]=true;const k=keyOf(ev),K=opts.keys;
 if(ev.key==='Escape'){ev.preventDefault();if(!$('opts').hidden){closeOpts();return}if(!$('slots').hidden){$('slots').hidden=true;return}
  if(mode!=='play'||G.over)return;if(bm){bm=null;wallDrag=null;R.setGhost(null);cmdSig=null}else if(amode){amode=false;cmdSig=null}else if(!$('pause').hidden)resume();else if(sel.length)setSel([]);else pause();return}
 if(mode!=='play'||G.over||!$('pause').hidden)return;
 if(k===K.chat&&mp()){ev.preventDefault();openChat();return}
 if(paused&&!mp())return;
 if((ev.metaKey||ev.ctrlKey)&&/^[1-9]$/.test(ev.key)){groups[ev.key]=own().map(e=>e.id);if(groups[ev.key].length)toast('Grupo '+ev.key+' asignado');else delete groups[ev.key];ev.preventDefault();refreshGroups();return}
 if(ev.metaKey||ev.ctrlKey)return;
 if(/^[1-9]$/.test(ev.key)){if(ev.shiftKey&&groups[ev.key]){setSel([...new Set(sel.concat(groups[ev.key]))]);return}selectGroup(ev.key);return}
 if(k===K.idle||(K.idle==='.'&&k===',')){nextIdle();return}
 if(ev.key===' '){centerSel(sel);ev.preventDefault();return}
 if(ev.key==='+'||ev.key==='='){R.zoom(1/1.15);return}if(ev.key==='-'){R.zoom(1.15);return}
 if(k===K.save){if(!mp())saveSlot(1);ev.preventDefault();return}
 if(ev.key==='Delete'||ev.key==='Backspace'){delSel();ev.preventDefault();return}
 const c=cmdForKey(k);if(c){runCmd(c,ev);ev.preventDefault();return}
 if(k===K.army){selectArmy(ev.shiftKey);return}
 if(k===K.tc){const tc=G.bl.find(x=>!x.dead&&x.owner===ME()&&x.type==='tc');if(tc){setSel([tc.id]);R.centerOn(tc.x/T,tc.y/T)}return}
 if(k===K.pause){pause();return}});
window.addEventListener('keyup',ev=>{keys[ev.key]=false});
window.addEventListener('blur',()=>{for(const k in keys)keys[k]=false;mouse.down=false;mouse.inside=false});
function camKeys(dt){let ax=0,ay=0;if(keys.ArrowLeft)ax-=1;if(keys.ArrowRight)ax+=1;if(keys.ArrowUp)ay+=1;if(keys.ArrowDown)ay-=1;
 if(opts.edge&&mouse.inside&&document.hasFocus()&&!mouse.down&&!miniDrag&&!wallDrag){const m=4;if(mouse.x<=m)ax-=1;if(mouse.x>=innerWidth-m)ax+=1;if(mouse.y<=m)ay+=1;if(mouse.y>=innerHeight-m)ay-=1}
 if(ax||ay)R.move(ax,ay,dt*1.4*opts.cam/100)}

// ---------- chat (multijugador)
function openChat(){const c=$('chat');c.hidden=false;const i=$('chatIn');i.value='';i.focus()}
$('chatIn').addEventListener('keydown',ev=>{if(ev.key==='Enter'){ev.preventDefault();const t=ev.target.value;ev.target.value='';$('chat').hidden=true;ev.target.blur();if(t.trim())Net.chat(t)}else if(ev.key==='Escape'){$('chat').hidden=true;ev.target.blur()}ev.stopPropagation()});
function chatLine(from,text,pl){const col=pl>=0&&G&&G.players[pl]?PCOLORS[pl]:'var(--acc)';
 if(mode==='play')toast(from+': '+text,false,'chatmsg');
 const box=$('lobChat');if(box){const d=document.createElement('div');d.innerHTML=`<b style="color:${col}">${esc(from)}</b> ${esc(text)}`;box.appendChild(d);box.scrollTop=box.scrollHeight;while(box.children.length>60)box.firstChild.remove()}
 sfx('click')}

// ---------- tutorial
const cnt=t=>G.list.filter(e=>!e.dead&&e.owner===ME()&&e.type===t).length,built=t=>G.bl.some(e=>!e.dead&&e.owner===ME()&&e.type===t&&e.bp>=1),placed=t=>cnt(t)>0;
const gath=rt=>G.ul.some(e=>!e.dead&&e.owner===ME()&&e.type==='villager'&&e.o.t==='gather'&&e.o.rt===rt);
const TUT=[
 {t:()=>`Haz clic sobre tu centro urbano y pulsa ${gridKey(0)} para entrenar un aldeano. Cada aldeano cuesta 50 de comida.`,ok:()=>PME().stats.trained>=1||G.bl.some(e=>e.owner===ME()&&e.type==='tc'&&e.q.length),hint:'u:villager'},
 {t:()=>'Arrastra un rectángulo sobre dos aldeanos para seleccionarlos y haz clic derecho sobre los arbustos de bayas rojas.',ok:()=>gath('food')},
 {t:()=>'Selecciona otro aldeano y haz clic derecho sobre un árbol para talar madera.',ok:()=>gath('wood')},
 {t:()=>`Con un aldeano seleccionado, pulsa ${gridKey(0)} (Casa) y haz clic en el suelo. Cada casa da 5 de población.`,ok:()=>placed('house'),hint:'b:house'},
 {t:()=>`Construye un almacén (${gridKey(2)}) junto al bosque: los aldeanos entregarán la madera antes.`,ok:()=>placed('store'),hint:'b:store'},
 {t:()=>`Pulsa ${gridKey(10)} para ver los edificios militares y construye un cuartel (${gridKey(0)}).`,ok:()=>built('barracks'),hint:()=>page?'b:barracks':'page'},
 {t:()=>'Selecciona el cuartel y entrena tres hombres de armas.',ok:()=>cnt('militia')>=3,hint:'u:militia'},
 {t:()=>`Asígnales un grupo: selecciónalos y pulsa ⌘ 1. Luego pulsa 1 para recuperarlos, o ${keyName(opts.keys.army)} para todo el ejército.`,ok:()=>!!(groups[1]&&groups[1].length)},
 {t:()=>'Reúne 500 de comida y avanza a la Edad Feudal desde el centro urbano.',ok:()=>PME().age>=1||PME().aging,hint:'age'},
 {t:()=>'Construye una herrería (página militar) e investiga Forja para mejorar el ataque.',ok:()=>!!(PME().tech.forge||PME().tq.forge),hint:()=>built('smith')?'t:forge':page?'b:smith':'page'},
 {t:()=>`Protege la aldea: con aldeanos seleccionados pulsa ${gridKey(7)} (Empalizada) y arrastra sobre el suelo para trazar un muro.`,ok:()=>cnt('palisade')>=5,hint:()=>page?'page':'b:palisade'},
 {t:()=>`¡Listo! El rival ya no esperará. Selecciona tu ejército, pulsa ${gridKey(5)} y haz clic en su territorio. Mayús + clic derecho encadena órdenes.`,ok:()=>false,final:true}
];
function curHint(){const s=TUT[tut.i];if(!s||!s.hint)return null;return typeof s.hint==='function'?s.hint():s.hint}
function showTut(){$('tut').hidden=!tut.on;if(!tut.on)return;const s=TUT[tut.i];$('tutStep').textContent=s.final?'Tutorial completado':'Tutorial · paso '+(tut.i+1)+' de '+(TUT.length-1);$('tutTxt').textContent=s.t();
 $('tutBar').style.width=(tut.i/(TUT.length-1)*100)+'%';$('tutSkip').textContent=s.final?'Cerrar':'Saltar tutorial';cmdSig=null}
function tutCheck(){if(!tut.on)return;const s=TUT[tut.i];if(s&&s.ok()){tut.i++;sfx('tech');if(TUT[tut.i].final){for(const k in G.ai)G.ai[k].passive=false;const A=G.ai[1];if(A)A.next=G.t+180}showTut()}}
$('tutSkip').onclick=()=>{tut.on=false;for(const k in G.ai)G.ai[k].passive=false;$('tut').hidden=true;cmdSig=null};

// ---------- flujo de partida
function hideScreens(){for(const id of['menu','end','pause','slots','mp','lobby','opts'])$(id).hidden=true}
function setupHUD(){MW=I.MW;MH=I.MH;hideScreens();$('hud').hidden=false;$('msgs').innerHTML='';$('info').dataset.s='';$('plist').dataset.s='';$('vict').dataset.h='';$('groups').dataset.h='';$('chat').hidden=true;
 mode='play';paused=false;sel=[];groups={};bm=null;amode=false;wallDrag=null;page=0;speed=1;$('spd').textContent='1×';$('spd').disabled=mp()&&Net.role!=='host';cmdSig=null;miniTerrain();AU.startMusic();
 $('saveBtn').hidden=mp();$('restart').hidden=mp();$('mpPause').hidden=!mp();$('resign').hidden=!mp()}
function startGame(extra){AU.init();const c=Object.assign({},cfg,extra||{});G=I.newGame(c);R.build(G);setupHUD();
 tut.on=!!c.tutorial;tut.i=0;showTut();
 const tc=G.bl.find(e=>e.owner===ME()&&e.type==='tc');setSel(tc?[tc.id]:[]);
 if(!tut.on){toast('Entrena aldeanos, recolecta recursos y construye casas.');setTimeout(()=>{if(mode==='play'&&G)toast(G.players.length>2?'Hay '+(G.players.length-1)+' reinos más en el mapa.':'El reino rival ya está preparando su ejército.')},4200)}}
function startMP(c,seed){AU.init();G=I.newGame(c,seed);R.build(G);setupHUD();tut.on=false;showTut();
 const tc=G.bl.find(e=>e.owner===ME()&&e.type==='tc');setSel(tc?[tc.id]:[]);toast('Partida en red · '+G.players.length+' jugadores. Intro para chatear.');say('Que comience la batalla',true)}
function pause(){if(mode!=='play'||G.over)return;if(!mp())paused=true;tipCmd=null;$('pause').hidden=false;$('tip').hidden=true;$('pauseEye').textContent=mp()?'Menú · la partida sigue en marcha':'Partida en pausa';$('mpPause').textContent=Net.paused?'Reanudar para todos':'Pausar para todos'}
function resume(){paused=false;$('pause').hidden=true}
function menuStage(st){$('mTitle').hidden=st!=='title';$('mSetup').hidden=st!=='setup';$('menu').classList.remove('fade')}
function quitApp(){try{window.webkit.messageHandlers.nativeApp.postMessage({cmd:'quit'})}catch(e){window.close()}}
function showMenu(){menuStage('title');if(Net&&Net.role)Net.leave();mode='menu';paused=false;tut.on=false;$('tut').hidden=true;$('hud').hidden=true;hideScreens();$('menu').hidden=false;$('tip').hidden=true;
 G=I.newGame({map:cfg.map,size:'small',nAI:1,diff:'normal',civ:cfg.civ},Math.floor(Math.random()*1e9));MW=I.MW;MH=I.MH;G.vis.fill(1);G.exp.fill(1);R.build(G);R.view.tdist=R.view.dist=21;sel=[];R.setSelection([]);R.setGhost(null)}
function showEnd(win,how){paused=true;sfx(win?'win':'lose');say(win?'¡Victoria!':'Hemos sido derrotados',true);
 $('endEye').textContent='Fin de la partida · '+DIFF[G.cfg.diff].name+' · '+MAPS[G.cfg.map].name+(mp()?' · en red':'');
 const t=$('endTitle');t.textContent=win?'Victoria':'Derrota';t.className=win?'win':'lose';
 const hw={wonder:'por la maravilla',relics:'por las reliquias',conquest:'por conquista'}[how]||'';
 $('endText').textContent=(win?'Tu bando se ha impuesto '+hw+' tras ':'Tu reino ha caído tras ')+fmtT(G.t).replace(':',' min ')+' s.';
 const rows=[['Civilización',p=>CIVS[p.civ].name],['Equipo',p=>p.team+1],['Edad alcanzada',p=>ROMAN[p.age]],['Puntuación',p=>{const h=G.hist[G.hist.length-1];return h?h.s[p.i].score:0}],['Unidades entrenadas',p=>p.stats.trained],['Enemigos abatidos',p=>p.stats.killed],['Conversiones',p=>p.stats.converted||0],['Unidades perdidas',p=>p.stats.lost],['Edificios construidos',p=>p.stats.built],['Edificios destruidos',p=>p.stats.razed],['Recursos recolectados',p=>p.stats.gathered],['Investigaciones',p=>Object.keys(p.tech).length]];
 $('endStats').innerHTML='<tr><th></th>'+G.players.map(p=>`<th style="color:${PCOLORS[p.i]}">${esc(pName(p.i))}</th>`).join('')+'</tr>'+rows.map(([n,f])=>`<tr><td>${n}</td>${G.players.map(p=>`<td>${f(p)}</td>`).join('')}</tr>`).join('');
 $('end').hidden=false;$('pause').hidden=true;drawGraph()}
// gráficas del final de partida
const GK={score:['Puntuación','score'],army:['Ejército','army'],pop:['Población','pop'],res:['Recursos','res']};
function drawGraph(){const c=$('endGraph'),x=c.getContext('2d'),W=c.width=c.clientWidth*dpr,H=c.height=c.clientHeight*dpr;x.clearRect(0,0,W,H);
 for(const b of $('graphTabs').children)b.classList.toggle('on',b.dataset.k===graphK);
 const h=G.hist.slice();const last={t:Math.round(G.t),s:G.players.map((p,i)=>{const pr=h[h.length-1];return pr?Object.assign({},pr.s[i],{pop:p.pop,res:p.stats.gathered}):{pop:p.pop,army:0,res:p.stats.gathered,score:0}})};h.push(last);
 if(h.length<2){x.fillStyle='#98928a';x.font=`${12*dpr}px sans-serif`;x.fillText('Partida demasiado corta para mostrar la evolución',12*dpr,24*dpr);return}
 const key=GK[graphK][1],pad=34*dpr,tmax=h[h.length-1].t||1;let vmax=1;for(const r of h)for(const s of r.s)vmax=Math.max(vmax,s[key]||0);
 x.strokeStyle='rgba(255,255,255,.08)';x.lineWidth=1;x.fillStyle='#6c675f';x.font=`${10*dpr}px -apple-system,sans-serif`;
 for(let i=0;i<=4;i++){const y=H-pad+(pad*.6-(H-pad))*i/4;x.beginPath();x.moveTo(pad,y);x.lineTo(W-8*dpr,y);x.stroke();x.fillText(String(Math.round(vmax*i/4)),4*dpr,y+3*dpr)}
 for(let m=0;m<=tmax;m+=Math.max(60,Math.ceil(tmax/6/60)*60)){const px=pad+(W-pad-8*dpr)*m/tmax;x.fillText(Math.round(m/60)+'′',px-4*dpr,H-10*dpr)}
 G.players.forEach((p,i)=>{x.strokeStyle=PCOLORS[i];x.lineWidth=(i===ME()?2.6:1.8)*dpr;x.beginPath();h.forEach((r,k)=>{const px=pad+(W-pad-8*dpr)*r.t/tmax,py=H-pad-(H-pad-pad*.6)*(r.s[i][key]||0)/vmax;k?x.lineTo(px,py):x.moveTo(px,py)});x.stroke()})}
$('graphTabs').onclick=ev=>{const b=ev.target.closest('[data-k]');if(!b)return;graphK=b.dataset.k;drawGraph();sfx('click')};
function handleEvents(){for(const e of G.ev){switch(e.ev){
 case'msg':toast(e.text,e.warn);break;
 case'sfx':sfx(e.k);if(e.k==='alert'){AU.setTension(30);const nw=performance.now();if(nw-(window.__alertSay||-1e9)>20000){window.__alertSay=nw;say(pick(['¡Nos atacan!','¡Alerta, enemigos!','¡A las armas!']),true,{pitch:.9})}}else if(e.k==='age'){const pa=G&&G.players[ME()];say(pa?'Bienvenidos a la '+I.AGES[pa.age]:'Nueva era',true)}else if(e.k==='tech'&&Math.random()<.3)say('Investigación completada');break;
 case'die':R.onEvent(e,G);if(e.kind==='unit')sfxAt('die',e.x,e.y,.7);else if(e.kind==='bld'&&!B[e.type].wall&&I.isVisible({kind:'bld',tx:(e.x/T|0),ty:(e.y/T|0),size:1}))sfxAt('collapse',e.x,e.y);break;
 case'depleted':case'built':case'convert':R.onEvent(e,G);if(e.ev==='convert'&&e.from===ME())say('¡Nos han convertido una unidad!',true);break;
 case'impact':R.onEvent(e,G);sfxAt('impact',e.x,e.y);break;
 case'ping':pings.push({x:e.x/T,z:e.y/T,t:0});break;
 case'hit':sfxAt(e.k==='ram'?'ram':'hit',e.x,e.y,.8);break;
 case'shoot':case'lob':R.onEvent(e,G);sfxAt(SHOTS[e.k]||e.ev,e.x,e.y,.8);break;
 case'boom':R.onEvent(e,G);sfxAt('boom',e.x,e.y,.8);break;
 case'elim':pings.push({x:MW/2,z:MH/2,t:0,c:'240,212,147'});break;
 case'over':setTimeout(()=>showEnd(e.win,e.how),1400);break}}G.ev.length=0}
function ambient(){const vw=[];for(const u of G.ul){if(u.dead||!u.work||!u.task||u.gar)continue;if(Math.abs(u.x/T-R.view.tx)>R.view.dist*.5||Math.abs(u.y/T-R.view.tz)>R.view.dist*.45)continue;if(!visUnit(u))continue;vw.push(u)}
 if(!vw.length)return;const u=vw[Math.floor(Math.random()*vw.length)],k={chop:'chop',mine:'mine',farm:'farm',forage:'forage',build:'build'}[u.task];if(k)sfxAt(k,u.x,u.y,.55)}

// ---------- guardar, cargar y opciones
async function saveSlot(n){if(!G||mode!=='play'||G.over||mp())return;try{const data=I.serialize();const p=PME();
 const meta={date:new Date().toISOString(),t:G.t,civ:p.civ,map:G.cfg.map,size:G.cfg.size,diff:G.cfg.diff,n:G.players.length,teams:G.cfg.teams,age:p.age};
 const ok=await Store.write('slot'+n,data);await Store.write('slot'+n+'meta',JSON.stringify(meta));
 toast(ok?'Partida guardada en la ranura '+n:'No se pudo guardar la partida',!ok);if(ok)sfx('built')}catch(err){toast('No se pudo guardar: '+err.message,true)}}
async function loadSlot(n){const data=await Store.read('slot'+n);if(!data){toast('Esa ranura está vacía',true);return}
 try{AU.init();G=I.deserialize(data);R.build(G);setupHUD();tut.on=false;showTut();const tc=G.bl.find(e=>e.owner===ME()&&e.type==='tc')||G.list.find(e=>e.owner===ME());if(tc)R.centerOn(tc.x/T,tc.y/T);setSel([]);toast('Partida cargada')}
 catch(err){toast('No se pudo cargar: '+err.message,true);showMenu()}}
async function showSlots(saving){$('slotsEye').textContent=saving?'Guardar partida':'Cargar partida';$('slotsTitle').textContent=saving?'Elige una ranura':'Partidas guardadas';
 const list=$('slotList');list.innerHTML='<div class="qnote">Leyendo…</div>';$('slots').hidden=false;const rows=[];
 for(let n=1;n<=3;n++){let m=null;try{m=JSON.parse(await Store.read('slot'+n+'meta')||'null')}catch(e){}
  const d=m?new Date(m.date):null;
  rows.push(`<div class="slot"><div class="sn">${n}</div><div class="sd">${m?`<b>${CIVS[m.civ].name} · ${MAPS[m.map]?MAPS[m.map].name:m.map} · ${m.n} jugadores</b><span>${AGES[m.age]} · ${fmtT(m.t)} de partida · ${DIFF[m.diff].name} · ${d.toLocaleDateString('es-ES')} ${d.toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'})}</span>`:'<b style="color:var(--mut)">Vacía</b>'}</div>
   <button class="btn sm${saving?'':' pri'}" data-slot="${n}" ${!saving&&!m?'disabled style="opacity:.35"':''}>${saving?(m?'Sobrescribir':'Guardar aquí'):'Cargar'}</button></div>`)}
 list.innerHTML=rows.join('');list.onclick=async ev=>{const b=ev.target.closest('[data-slot]');if(!b||b.disabled)return;const n=+b.dataset.slot;$('slots').hidden=true;if(saving){await saveSlot(n)}else{await loadSlot(n)}}}
const KEYROWS=[['idle','Aldeano inactivo'],['army','Todo el ejército'],['tc','Centro urbano'],['pause','Pausa'],['chat','Chat (en red)'],['save','Guardado rápido']];
function renderKeys(){const K=opts.keys;
 $('keyGrid').innerHTML=K.grid.map((k,i)=>`<button class="kb${rebinding&&rebinding.i===i?' on':''}" data-i="${i}" title="Casilla ${i+1} del panel de órdenes">${esc(keyName(k))}</button>`).join('');
 $('keyList').innerHTML=KEYROWS.map(([id,n])=>`<span>${n}</span><button class="kb${rebinding&&rebinding.id===id?' on':''}" data-id="${id}">${esc(keyName(K[id]))}</button>`).join('')}
function startRebind(o){rebinding=o;renderKeys()}
function finishRebind(ev){const k=keyOf(ev);if(ev.key==='Escape'){rebinding=null;renderKeys();return}
 if(/^[0-9]$/.test(k)||['Delete','Backspace',' ','Meta','Shift','Control','Alt'].includes(ev.key)){toast('Esa tecla está reservada',true);return}
 const K=opts.keys,r=rebinding;const cur=r.i!=null?K.grid[r.i]:K[r.id];
 const gi=K.grid.indexOf(k);if(gi>=0&&gi!==r.i)K.grid[gi]=cur;for(const [id] of KEYROWS)if(K[id]===k&&id!==r.id)K[id]=cur;
 if(r.i!=null)K.grid[r.i]=k;else K[r.id]=k;rebinding=null;renderKeys();cmdSig=null;saveOpts();sfx('click')}
$('keyGrid').onclick=ev=>{const b=ev.target.closest('[data-i]');if(b)startRebind({i:+b.dataset.i})};
$('keyList').onclick=ev=>{const b=ev.target.closest('[data-id]');if(b)startRebind({id:b.dataset.id})};
$('keyReset').onclick=()=>{opts.keys=JSON.parse(JSON.stringify(DEFKEYS));rebinding=null;renderKeys();cmdSig=null;saveOpts();sfx('click')};
function syncOpts(){for(const b of $('o-quality').children)b.classList.toggle('on',b.dataset.v===opts.quality);$('o-music').value=opts.music;$('o-sfx').value=opts.sfx;$('o-cam').value=opts.cam;
 for(const b of $('o-cap').children)b.classList.toggle('on',String(b.dataset.v)===String(opts.fpsCap||0));for(const [id,k] of[['o-edge','edge'],['o-fps','fps'],['o-voices','voices']]){$(id).classList.toggle('on',!!opts[k]);$(id).setAttribute('aria-pressed',!!opts[k])}renderKeys()}
function openOpts(){syncOpts();$('opts').hidden=false}
function closeOpts(){rebinding=null;$('opts').hidden=true;saveOpts()}
$('o-quality').onclick=ev=>{const b=ev.target.closest('button');if(!b)return;opts.quality=b.dataset.v;applyOpts();syncOpts();sfx('click')};
$('o-music').oninput=ev=>{opts.music=+ev.target.value;applyOpts()};$('o-sfx').oninput=ev=>{opts.sfx=+ev.target.value;applyOpts()};$('o-sfx').onchange=()=>sfx('train');$('o-cam').oninput=ev=>{opts.cam=+ev.target.value};
$('o-cap').onclick=ev=>{const b=ev.target.closest('button');if(!b)return;opts.fpsCap=+b.dataset.v;applyOpts();syncOpts();saveOpts();sfx('click')};
for(const [id,k] of[['o-edge','edge'],['o-fps','fps'],['o-voices','voices']])$(id).onclick=()=>{opts[k]=!opts[k];applyOpts();syncOpts();sfx('click');if(k==='voices'&&opts.voices)say('Voces activadas',true)};
$('optsBack').onclick=closeOpts;$('optBtn').onclick=()=>{AU.init();openOpts()};$('optBtn2').onclick=openOpts;
$('saveBtn').onclick=()=>showSlots(true);$('loadBtn').onclick=()=>{AU.init();showSlots(false)};$('slotsBack').onclick=()=>{$('slots').hidden=true};

// ---------- multijugador: búsqueda y sala
function mpStatus(t,bad){const e=$('mpStatus');e.textContent=t||'';e.style.color=bad?'var(--bad)':''}
function showMP(){AU.init();hideScreens();$('menu').hidden=true;$('mp').hidden=false;$('mpName').value=opts.name;mpStatus(Net.native?'Buscando partidas en tu red local…':'El multijugador necesita la app de Imperia para Mac.',!Net.native);
 renderFound([]);if(Net.native)Net.browse()}
function renderFound(list){$('mpFound').innerHTML=list.length?list.map(n=>`<div class="slot"><div class="sd"><b>${esc(n.replace(/ · Imperia$/,''))}</b><span>Partida en tu red local</span></div><button class="btn sm pri" data-svc="${esc(n)}">Unirse</button></div>`).join(''):'<div class="qnote">No se ha encontrado ninguna partida todavía. También puedes escribir la dirección IP del anfitrión.</div>'}
function myName(){const n=($('mpName').value||'').trim().slice(0,18)||'Jugador';opts.name=n;saveOpts();return n}
$('mpFound').onclick=ev=>{const b=ev.target.closest('[data-svc]');if(!b)return;Net.stopBrowse();Net.joinService(b.dataset.svc,myName());mpStatus('Conectando…')};
$('mpHost').onclick=()=>{if(!Net.native)return;Net.stopBrowse();Net.host(myName());showLobby()};
$('mpJoin').onclick=()=>{if(!Net.native)return;const a=$('mpAddr').value.trim();if(!a){mpStatus('Escribe la IP del anfitrión',true);return}Net.stopBrowse();Net.join(a,myName());mpStatus('Conectando con '+a+'…')};
$('mpBack').onclick=()=>{Net.stopBrowse();Net.leave();showMenu()};
function showLobby(){hideScreens();$('lobby').hidden=false;$('lobChat').innerHTML='';renderLobby()}
function renderLobby(){const L=Net.L;if(!L)return;const host=Net.role==='host',you=Net.you;
 $('lobEye').textContent=host?'Eres el anfitrión'+(Net.ips.length?' · IP '+Net.ips.join(', ')+' · puerto '+Net.port:''):'Sala de '+esc((L.slots[0]&&L.slots[0].name)||'');
 const civOpts=sel=>Object.entries(CIVS).map(([k,v])=>`<option value="${k}"${k===sel?' selected':''}>${v.name}</option>`).join('');
 const teamOpts=t=>[0,1,2,3].map(i=>`<option value="${i}"${i===t?' selected':''}>Equipo ${i+1}</option>`).join('');
 $('lobSlots').innerHTML=L.slots.map((s,i)=>{const mine=i===you,canEdit=mine||(host&&s.k==='ai'),col=PCOLORS[i];
  let who;if(s.k==='host'||s.k==='human')who=`<b>${esc(s.name||'Jugador')}</b>${s.k==='host'?' <span class="tag">anfitrión</span>':''}${mine?' <span class="tag you">tú</span>':''}`;
  else if(host)who=`<select data-k="${i}"><option value="open"${s.k==='open'?' selected':''}>Abierto</option><option value="ai"${s.k==='ai'?' selected':''}>IA</option><option value="closed"${s.k==='closed'?' selected':''}>Cerrado</option></select>`;
  else who=`<span style="color:var(--mut)">${{open:'Abierto',ai:'IA',closed:'Cerrado'}[s.k]}</span>`;
  const act=s.k!=='open'&&s.k!=='closed';
  return`<div class="lrow"><i style="background:${col}"></i><div class="lwho">${who}</div>${act?`<select data-civ="${i}" ${canEdit?'':'disabled'}>${civOpts(s.civ)}</select><select data-team="${i}" ${canEdit?'':'disabled'}>${teamOpts(s.team)}</select>`:'<span></span><span></span>'}${host&&s.k==='human'?`<button class="btn sm" data-kick="${i}">Expulsar</button>`:'<span></span>'}</div>`}).join('');
 const segH=(id,items,key)=>`<div class="lab">${id}</div><div class="seg lcfg" data-key="${key}">${items.map(([v,n])=>`<button data-v="${v}" class="${String(L.cfg[key])===v?'on':''}" ${host?'':'disabled'}>${n}</button>`).join('')}</div>`;
 $('lobCfg').innerHTML=segH('Mapa',Object.entries(MAPS).map(([k,v])=>[k,v.name]),'map')+segH('Tamaño',Object.entries(SIZES).map(([k,v])=>[k,v.name]),'size')+segH('IA',Object.entries(DIFF).map(([k,v])=>[k,v.name]),'diff')+segH('Victoria',[['standard','Estándar'],['conquest','Conquista']],'win')+segH('Visibilidad',[['normal','Normal'],['explored','Explorado'],['all','Todo visible']],'reveal');
 $('lobStart').hidden=!host}
$('lobSlots').onchange=ev=>{const t=ev.target;if(t.dataset.k!=null)Net.setSlot(+t.dataset.k,{k:t.value});else if(t.dataset.civ!=null)Net.setSlot(+t.dataset.civ,{civ:t.value});else if(t.dataset.team!=null)Net.setSlot(+t.dataset.team,{team:+t.value})};
$('lobSlots').onclick=ev=>{const b=ev.target.closest('[data-kick]');if(b)Net.kick(+b.dataset.kick)};
$('lobCfg').onclick=ev=>{const b=ev.target.closest('button');if(!b||b.disabled)return;const k=b.parentElement.dataset.key;Net.setCfg({[k]:b.dataset.v});sfx('click')};
$('lobStart').onclick=()=>{if(Net.start())sfx('built')};
$('lobLeave').onclick=()=>{Net.leave();showMP()};
$('lobChatIn').addEventListener('keydown',ev=>{if(ev.key==='Enter'){const t=ev.target.value;ev.target.value='';Net.chat(t)}ev.stopPropagation()});
if(Net){Object.assign(Net.on,{
 lobby:()=>{if(mode==='play')return;if($('lobby').hidden&&Net.L)showLobby();else renderLobby()},
 peers:list=>{if(!$('mp').hidden)renderFound(list)},
 status:t=>{if(!$('mp').hidden)mpStatus(t);if(!$('lobby').hidden)$('lobEye').textContent=t},
 error:m=>{if(mode==='play')toast(m,true);else if(!$('lobby').hidden){toast(m,true);chatLine('Sistema',m,-1)}else{if($('mp').hidden)showMP();mpStatus(m,true)}sfx('err')},
 chat:(from,text,pl)=>chatLine(from,text,pl),
 start:(c,seed)=>startMP(c,seed),
 pause:v=>{toast(v?'Partida en pausa':'Partida reanudada');$('mpPause').textContent=v?'Reanudar para todos':'Pausar para todos'},
 desync:n=>toast('Aviso: las simulaciones se han desincronizado (turno '+n+'). La partida puede comportarse de forma distinta en cada equipo.',true,'chatmsg'),
 lost:(was)=>{if(was&&mode==='play'&&!G.over){toast('Se ha perdido la conexión con el anfitrión',true,'chatmsg');G.over=true;setTimeout(()=>showEnd(false,'lost'),800)}else{showMP();mpStatus('Se ha perdido la conexión con el anfitrión',true)}}})}

// ---------- menú principal
function seg(id,items,key,after){const el=$(id);if(items)el.innerHTML=items.map(([v,n])=>`<button data-v="${v}">${n}</button>`).join('');
 const mark=()=>{for(const b of el.children)b.classList.toggle('on',String(cfg[key])===b.dataset.v)};mark();
 el.onclick=ev=>{const b=ev.target.closest('button');if(!b||b.disabled)return;AU.init();cfg[key]=key==='nAI'?+b.dataset.v:b.dataset.v;mark();sfx('click');if(after)after();Store.write('setup',JSON.stringify(cfg))};return mark}
const marks={};
function setupMenu(){
 marks.civ=seg('s-civ',Object.entries(CIVS).map(([k,v])=>[k,v.name]),'civ',descs);
 marks.map=seg('s-map',Object.entries(MAPS).map(([k,v])=>[k,v.name]),'map',()=>{descs();if(mode==='menu')showMenu()});
 marks.size=seg('s-size',Object.entries(SIZES).map(([k,v])=>[k,v.name]),'size');
 marks.nAI=seg('s-nai',null,'nAI',descs);marks.teams=seg('s-teams',null,'teams',descs);
 marks.diff=seg('s-diff',Object.entries(DIFF).map(([k,v])=>[k,v.name]),'diff');marks.win=seg('s-win',null,'win',descs);marks.reveal=seg('s-reveal',null,'reveal',descs);descs()}
function descs(){$('civDesc').textContent=CIVS[cfg.civ].desc;$('mapDesc').textContent=MAPS[cfg.map].desc;
 const tb=$('s-teams').children[1];tb.disabled=cfg.nAI<2;if(cfg.nAI<2&&cfg.teams==='teams'){cfg.teams='ffa';marks.teams&&marks.teams()}
 $('teamDesc').textContent=cfg.nAI===1?'Duelo uno contra uno.':cfg.teams==='ffa'?'Cada reino lucha por su cuenta.':cfg.nAI===2?'Tú y un aliado contra un rival.':'Tú y un aliado contra dos rivales.';
$('revealDesc').textContent={normal:'Niebla de guerra: solo ves lo que exploran tus unidades.',explored:'El terreno se ve desde el principio; las unidades enemigas, solo con visión.',all:'Todo el mapa y todas las unidades visibles en todo momento.'}[cfg.reveal];
 $('winDesc').textContent=cfg.win==='conquest'?'Solo se gana destruyendo a todos los rivales.':'Conquista, maravilla en pie 5 minutos o todas las reliquias durante 5 minutos.'}
$('start').onclick=()=>{AU.init();sfx('click');$('menu').classList.add('fade');setTimeout(()=>startGame(),380)};/* reveal viaja en cfg */
{const nav=document.querySelector('#menu .mnav');const hasNative=!!(window.webkit&&window.webkit.messageHandlers&&window.webkit.messageHandlers.nativeApp);if(!hasNative)$('mQuit').hidden=true;
 nav.onclick=e=>{const b=e.target.closest('.mb');if(!b)return;AU.init();sfx('click');const g=b.dataset.go;
  if(g==='play')menuStage('setup');else if(g==='mp')$('mpBtn').click();else if(g==='tut'){$('menu').classList.add('fade');setTimeout(()=>$('tutBtn').click(),380)}
  else if(g==='load')$('loadBtn').click();else if(g==='opt')$('optBtn').click();else if(g==='how'){menuStage('setup');$('how').hidden=false}else if(g==='quit')quitApp()};
 nav.addEventListener('mouseover',e=>{const b=e.target.closest('.mb');if(b&&b!==nav._h){nav._h=b;sfx('hover')}});nav.addEventListener('mouseleave',()=>{nav._h=null});
 $('mBack').onclick=()=>{sfx('click');menuStage('title')}}$('tutBtn').onclick=()=>startGame({tutorial:true,map:'continental',size:'small',nAI:1,teams:'ffa',diff:'easy',win:'conquest'});
$('mpBtn').onclick=showMP;
$('howBtn').onclick=()=>{$('how').hidden=!$('how').hidden;AU.init();sfx('click')};
$('resume').onclick=resume;$('restart').onclick=()=>startGame(G.cfg.tutorial?{tutorial:true,map:'continental',size:'small',nAI:1,teams:'ffa',diff:'easy',win:'conquest'}:G.cfg);$('toMenu').onclick=showMenu;
$('mpPause').onclick=()=>{Net.setPause(!Net.paused);resume()};
$('resign').onclick=()=>{cmd({c:'resign'});resume();toast('Te has rendido',true)};
$('again').onclick=()=>{if(mp()||G.cfg.mp){showMP();return}startGame(G.cfg)};$('endMenu').onclick=showMenu;
$('menuBtn').onclick=pause;$('idle').onclick=nextIdle;$('idleBig').onclick=()=>{sfx('click');nextIdle()};$('autoFarm').onclick=()=>{const p=G&&G.players[ME()];if(!p)return;sfx('click');cmd({c:'autofarm',on:!p.autoFarm})};$('armyBtn').onclick=ev=>selectArmy(ev.shiftKey);
$('spd').onclick=()=>{speed=speed===1?1.5:speed===1.5?2:1;$('spd').textContent=speed+'×';if(mp())Net.setSpeed(speed)};

// ---------- bucle
function resize(){dpr=Math.min(2,window.devicePixelRatio||1);ov.width=innerWidth*dpr;ov.height=innerHeight*dpr;R.resize()}
function runTurn(cmds,ticks){for(const [pl,c] of cmds){try{I.exec(pl,c)}catch(e){console.error('orden',e)}}for(let k=0;k<ticks;k++)I.update(1/30)}
let chain=0,lastLoopT=0,rafOK=true;
let lastDraw=0;
function loop(now,id){if(id!=null&&id!==chain)return;
 // tope de fotogramas (menos calor y batería): en el menú siempre 30; en partida según opciones (60 por defecto)
 {const cap=mode==='menu'?30:(+opts.fpsCap||0);if(cap&&id!=null&&rafOK&&!document.hidden&&now-lastDraw<1000/cap-3){requestAnimationFrame(t=>loop(t,id));return}lastDraw=now}lastLoopT=performance.now();window.__loopN=(window.__loopN||0)+1;const dt=Math.min(document.hidden||!rafOK?.15:.05,Math.max(0,(now-last)/1000));last=now;
 try{
  if(G){
   if(mode==='menu'){I.update(dt);G.vis.fill(1);G.exp.fill(1);G.ev.length=0;menuA+=dt*.02;R.centerOn(MW/2+Math.cos(menuA)*MW*.1,MH/2+Math.sin(menuA)*MH*.1);R.view.yaw=Math.PI/4+menuA*.6}
   else if(mp()){if(!G.over)Net.pump(dt,runTurn)}
   else if(!paused&&!G.over){let s=dt*speed;while(s>1e-4){const h=Math.min(s,1/30);I.update(h);s-=h}}
   if(mode==='play'){handleEvents();if(!paused||mp())camKeys(dt);
    if(bm&&$('pause').hidden)R.setGhost(bm,ghostTiles());else R.setGhost(null)}
  }
  if(!document.hidden){R.render(dt,G);drawOverlay()}
  if(mode==='play'){uiT-=dt;if(uiT<=0){uiT=.12;refreshUI();tutCheck()}miniT-=dt;if(miniT<=0){miniT=.2;drawMini()}terT-=dt;if(terT<=0){terT=3;miniTerrain()}
   ambT-=dt;if(ambT<=0&&(!paused||mp())){ambT=.3+Math.random()*.25;ambient()}}
  fpsN++;fpsT+=dt;if(fpsT>=.5){if(opts.fps)$('fps').textContent=Math.round(fpsN/fpsT)+' fps';fpsN=0;fpsT=0}
 }catch(err){console.error(err&&err.stack||err);if(!window.__imperr){window.__imperr=1;toast('Error: '+err.message,true)}}
 const c=chain;if(document.hidden||!rafOK){if(!nativeT||performance.now()-nativeT>500)setTimeout(()=>loop(performance.now(),c),15)}else requestAnimationFrame(t=>loop(t,c))}
let nativeT=0;window.__nativeTick=()=>{nativeT=performance.now();if(document.hidden||!rafOK){if(performance.now()-lastLoopT>20)loop(performance.now())}};
// si la ventana queda tapada, WebKit deja de dar fotogramas: la simulación sigue con temporizadores
setInterval(()=>{if(performance.now()-lastLoopT>300){rafOK=false;chain++;loop(performance.now(),chain)}if(!rafOK)requestAnimationFrame(()=>{if(!rafOK){rafOK=true;chain++;requestAnimationFrame(t=>loop(t,chain))}})},400);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)last=performance.now()});
async function boot(){R.init(cv);resize();window.addEventListener('resize',resize);
 try{const o=JSON.parse(await Store.read('options')||'null');if(o){const k=Object.assign(JSON.parse(JSON.stringify(DEFKEYS)),o.keys||{});Object.assign(opts,o);opts.keys=k;if(!Array.isArray(k.grid)||k.grid.length!==15)k.grid=DEFKEYS.grid.slice()}}catch(e){}
 try{const s=JSON.parse(await Store.read('setup')||'null');if(s)for(const k in cfg)if(s[k]!=null&&(k!=='map'||MAPS[s[k]]))cfg[k]=s[k]}catch(e){}
 applyOpts();setupMenu();
 for(const t in U)R.icon('u:'+t);for(const t in B)R.icon('b:'+t);for(const t in RDEF)R.icon('r:'+t);R.icon('r:relic');for(const t in TECH)R.icon('t:'+t);
 ['stop','amove','age1','age2','age3','age4','age5','age6','age7','age8','del','page0','page1','st0','st1','st2','ungar','bell','unload','buy_food','buy_wood','buy_stone','sell_food','sell_wood','sell_stone'].forEach(t=>R.icon('x:'+t));
 showMenu();last=performance.now();requestAnimationFrame(t=>loop(t,chain));
 setTimeout(()=>{const l=$('loading');l.style.opacity=0;setTimeout(()=>l.remove(),700)},350)}
window.__imperia={get G(){return G},start:startGame,R,setSel:ids=>setSel(ids),get mode(){return mode},save:saveSlot,load:loadSlot,cmd,Net,opts};
boot();
})();
