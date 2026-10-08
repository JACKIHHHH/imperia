// Pruebas de las 9 edades: generaciones de unidades, edificios, IA que avanza y determinismo
const fs=require('fs'),vm=require('vm'),path=require('path');
const SRC=fs.readFileSync(path.join(__dirname,'../web/game.js'),'utf8');
function fresh(){const ctx={Math,JSON,Date,Map,Set,Array,Object,Uint8Array,Int16Array,Int32Array,Float32Array,String,Number,Error,console};ctx.globalThis=ctx;vm.createContext(ctx);vm.runInContext(SRC,ctx);return ctx.Imperia}
let fails=0;const ok=(c,m)=>{if(!c){fails++;console.log('  ✗ FALLO:',m)}else console.log('  ✓',m)};
const I=fresh(),T=I.T;
const sel=(G,f)=>G.list.filter(e=>!e.dead&&f(e));

console.log('\n1) Tablas');
ok(I.AGES.length===9&&I.AGECOST.length===8&&I.AGETIME.length===8,'9 edades con 8 avances');
let bad=[];for(const t in I.GEN)for(let a=0;a<9;a++){const d=I.gdAt(t,a);for(const k of['hp','atk','range','rof','speed'])if(!(typeof d[k]==='number'&&isFinite(d[k])))bad.push(t+a+k);if(!d.name)bad.push(t+a+'name')}
ok(!bad.length,'todas las generaciones tienen estadísticas válidas '+bad.slice(0,5).join(','));
let mono=[];for(const t in I.GEN)for(let a=3;a<9;a++)if(I.gdAt(t,a).hp<I.gdAt(t,a-1).hp)mono.push(t+a);
ok(!mono.length,'la vida nunca baja al avanzar '+mono.join(','));

console.log('\n2) Avance manual por las 9 edades');
{const G=I.newGame({map:'arabia',size:'small',nAI:1,diff:'easy'},3);G.ai[1].passive=true;const p=G.players[0];
 const tc=sel(G,e=>e.owner===0&&e.type==='tc')[0];const v=sel(G,e=>e.owner===0&&e.type==='villager')[0];
 const tw=I._dbg.mkBld('tower',0,G.bases[0].x+6,G.bases[0].y,true);
 const names=[],hp=[];let prevMax=v.maxhp;
 for(let a=0;a<8;a++){p.res={food:1e5,wood:1e5,gold:1e5,stone:1e5};I.exec(0,{c:'queue',id:tc.id,k:'age'});for(let i=0;i<30*95&&p.age===a;i++){I.update(1/30);G.ev.length=0}
  names.push(I.uName('knight',0));hp.push(v.maxhp)}
 ok(p.age===8,'el jugador llega a la Edad del Futuro (edad '+p.age+')');
 ok(names[4]==='Tanque'&&names[7]==='Mech de asalto','el caballero evoluciona: '+names.join(' → '));
 ok(v.maxhp>prevMax&&v.hp<=v.maxhp,'los aldeanos existentes se reequipan (vida máx '+prevMax+' → '+v.maxhp+')');
 ok(tw.maxhp>900&&I.bName('tower',0)==='Torre láser','la torre escala y se llama '+I.bName('tower',0)+' ('+Math.round(tw.maxhp)+' pv)');
 I.exec(0,{c:'queue',id:tc.id,k:'age'});ok(p.age===8&&!tc.q.some(q=>q.k==='age'),'no se puede pasar de la última edad');
 // tanque contra caballero medieval de otro jugador
 const tk=I._dbg.mkUnit('knight',0,(G.bases[0].cx+3)*T,(G.bases[0].cy+3)*T);ok(I.gd('knight',0).ranged&&tk.maxhp===540,'un mech nuevo tiene 540 pv y dispara');
 const e1=I._dbg.mkUnit('knight',1,(G.bases[0].cx+7)*T,(G.bases[0].cy+3)*T);I.exec(0,{c:'right',ids:[tk.id],x:e1.x,y:e1.y,id:e1.id});
 const kinds=new Set();for(let i=0;i<30*20&&!e1.dead;i++){I.update(1/30);for(const q of G.proj)kinds.add(q.kind);G.ev.length=0}
 ok(e1.dead,'el mech destruye a un caballero de la Edad Oscura');ok(kinds.has('plasma'),'dispara plasma ('+[...kinds].join(',')+')');
 // artillería de la era moderna contra edificio
 const art=I._dbg.mkUnit('ram',0,(G.bases[0].cx+2)*T,(G.bases[0].cy-2)*T);const eb=I._dbg.mkBld('house',1,G.bases[0].cx+9,G.bases[0].cy-3,true);console.log('   casa',!!eb,eb&&eb.hp);
 I.exec(0,{c:'right',ids:[art.id],x:eb.x,y:eb.y,id:eb.id});for(let i=0;i<30*60&&!eb.dead;i++){I.update(1/30);G.ev.length=0}
 ok(eb.dead,'el cañón de riel derriba una casa enemiga');
}

console.log('\n3) La IA avanza de edad (Difícil, 4 IA, 40 min)');
{const Ia=fresh(),Ib=fresh();const cfg={map:'continental',size:'medium',nAI:3,diff:'hard'};
 const Ga=Ia.newGame(cfg,77),Gb=Ib.newGame(cfg,77);
 for(const [Ix,G] of [[Ia,Ga],[Ib,Gb]]){G.players[0].ai=true;G.ai[0]={tick:1,next:Ix.DIFF.hard.first,wave:Ix.DIFF.hard.wave,attacking:false}}
 let err=null,div=-1;const t0=Date.now();
 try{for(let i=0;i<30*60*40;i++){Ia.update(1/30);Ib.update(1/30);Ga.ev.length=0;Gb.ev.length=0;if(i%900===0&&Ia.hash()!==Ib.hash()){div=i;break}if(Ga.over)break}}catch(e){err=e}
 ok(!err,'sin excepciones '+(err?err.stack:''));ok(div<0,'las dos simulaciones siguen idénticas');
 const ages=Ga.players.map(p=>p.age);console.log('   edades tras '+Math.round(Ga.t/60)+' min:',ages.join(','),'·',Math.round((Date.now()-t0)/1000)+' s');
 ok(Math.max(...ages)>=4,'al menos una IA llega a la Edad Industrial');
}
console.log(fails?'\nHAY '+fails+' FALLOS':'\nTODO CORRECTO');
