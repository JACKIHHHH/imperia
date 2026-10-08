// Imperia — núcleo de simulación v3 (sin DOM, determinista). Coordenadas lógicas en px: 1 casilla = T px.
(function(root){
'use strict';
const T=32,POPMAX=150,CAP=10,MAXN=120*120;
let MW=88,MH=88,NN=MW*MH;
const RES=['food','wood','gold','stone'];
const RN={food:'Comida',wood:'Madera',gold:'Oro',stone:'Piedra'};
const AGES=['Edad Oscura','Edad Feudal','Edad de los Castillos','Edad Imperial','Edad Industrial','Edad Mundial','Edad Atómica','Edad de la Información','Edad del Futuro'];
const AGEYEAR=['s. V','s. XI','s. XIII','s. XVI','s. XIX','1914','1950','2000','2100'];
const MAXAGE=AGES.length-1;
const AGECOST=[{food:500},{food:800,gold:200},{food:1000,gold:800},{food:1200,gold:900,wood:300},{food:1400,gold:1100,stone:300},{food:1600,gold:1300,stone:400},{food:1800,gold:1500,stone:500},{food:2000,gold:1800,stone:600}];
const AGETIME=[35,50,60,65,70,75,80,85];
const GR={food:.85,farm:.7,wood:.62,gold:.52,stone:.5,fish:.72};
const PCOLORS=['#4a86e8','#e0553f','#e2b534','#9a6ae0'];
const WONDER_T=300,RELIC_T=300;

const CIVS={
 iberos:{name:'Íberos',uu:'almogavar',desc:'Los aldeanos construyen un 30 % más rápido. Los piqueros cuestan un 25 % menos. Unidad única: almogávar.'},
 francos:{name:'Francos',uu:'axeman',desc:'Caballería con +20 % de vida. Las granjas rinden un 25 % más. Unidad única: lanzador de hachas.'},
 britanos:{name:'Britanos',uu:'longbow',desc:'Arqueros con +1 de alcance. La galería de tiro entrena un 25 % más rápido. Unidad única: arquero largo.'},
 teutones:{name:'Teutones',uu:'tknight',desc:'Infantería con +1 de armadura. Torres, castillos y centros urbanos con +2 de ataque. Unidad única: caballero teutónico.'},
 bizantinos:{name:'Bizantinos',uu:'cataphract',desc:'Edificios con +20 % de vida. Los monjes curan el doble de rápido. Unidad única: catafracto.'}
};
const MAPS={
 continental:{name:'Continental',desc:'Lagos con peces, bosques repartidos y recursos equilibrados.'},
 arabia:{name:'Arabia',desc:'Terreno abierto con colinas y pocos árboles: favorece los ataques tempranos.'},
 bosque:{name:'Bosque negro',desc:'Bosque cerrado con pocos pasos: ideal para amurallarse.'},
 rio:{name:'Río',desc:'Un río divide el mapa en dos; solo se cruza por los vados.'},
 islas:{name:'Islas',desc:'Cada bando en su isla: domina el mar y desembarca con transportes.'}
};
// Mapas con relieve, ríos y costas reales (tools/build_maps.mjs → maps_data.js)
const REAL_DESC={iberia:'Relieve real: Pirineos, Sistema Central y Sierra Nevada; ríos Ebro, Duero, Tajo, Guadiana y Guadalquivir.',
 europa:'Alpes, Pirineos y Cárpatos; Rin, Danubio y Elba; islas Británicas y el Mediterráneo.',mediterraneo:'Italia, Grecia y los Balcanes frente al norte de África: guerra naval y desembarcos.',
 africa:'Sáhara, selva del Congo, el Nilo y el valle del Rift. Desiertos enormes: la madera escasea al norte.',asia:'Himalaya y meseta tibetana, ríos Yangtsé y Mekong, Japón y Corea.',
 namerica:'Montañas Rocosas y Apalaches, Grandes Lagos y el Misisipi; llanuras enormes en el centro.',samerica:'Los Andes y la cuenca del Amazonas: selva cerrada y cordillera infranqueable.',oceania:'Australia árida con la Gran Cordillera Divisoria, Tasmania y Nueva Zelanda.'};
if(root.IMPERIA_MAPS)for(const k in root.IMPERIA_MAPS)MAPS[k]={name:root.IMPERIA_MAPS[k].name,desc:REAL_DESC[k]||'Mapa con relieve real.',real:true};
const SIZES={small:{name:'Pequeño',n:72},medium:{name:'Mediano',n:96},large:{name:'Grande',n:120}};

const U={
 villager:{name:'Aldeano',cls:'vil',hp:25,atk:3,armor:0,range:.3,rof:1.5,speed:54,cost:{food:50},time:10,sight:5,r:6,desc:'Recolecta recursos y levanta edificios. Clic derecho sobre árboles, minas, arbustos o granjas.'},
 militia:{name:'Hombre de armas',cls:'inf',hp:55,atk:7,armor:1,range:.3,rof:1.4,speed:56,cost:{food:60,gold:20},time:13,sight:5,r:7,bonus:{bld:5,arc:2},desc:'Infantería robusta. Eficaz contra edificios y arqueros.'},
 spear:{name:'Piquero',cls:'inf',hp:45,atk:4,armor:0,range:.55,rof:1.5,speed:58,cost:{food:35,wood:25},time:11,sight:5,r:7,bonus:{cav:14},desc:'Económico. Gran daño contra caballería.'},
 archer:{name:'Arquero',cls:'arc',hp:30,atk:5,armor:0,range:5.5,rof:1.8,speed:54,cost:{wood:25,gold:45},time:15,sight:7,r:6,ranged:true,age:1,bonus:{inf:2},desc:'Ataca a distancia. Eficaz contra infantería.'},
 scout:{name:'Explorador',cls:'cav',hp:45,atk:3,armor:0,range:.35,rof:2,speed:108,cost:{food:80},time:15,sight:9,r:9,bonus:{monk:8},desc:'Caballería ligera muy rápida. Ideal para explorar y hostigar aldeanos.'},
 knight:{name:'Caballero',cls:'cav',hp:120,atk:10,armor:2,range:.35,rof:1.8,speed:92,cost:{food:60,gold:75},time:20,sight:6,r:10,age:1,bonus:{arc:6},desc:'Caballería pesada y rápida. Arrasa a los arqueros.'},
 ram:{name:'Ariete',cls:'siege',hp:180,atk:2,armor:0,parmor:6,range:.35,rof:2.5,speed:34,cost:{wood:160,gold:75},time:30,sight:3,r:11,age:2,bonus:{bld:40},bldOnly:true,desc:'Blindado contra flechas. Solo ataca edificios, pero los derriba en segundos.'},
 mangonel:{name:'Mangonel',cls:'siege',hp:60,atk:10,armor:0,parmor:4,range:7,minr:2.2,rof:5,speed:40,cost:{wood:160,gold:135},time:35,sight:8,r:10,age:2,ranged:true,splash:.95,bonus:{bld:12,ship:6},desc:'Lanza piedras que dañan a todas las unidades enemigas de la zona.'},
 monk:{name:'Monje',cls:'monk',hp:40,atk:0,armor:0,range:5,rof:1,speed:44,cost:{gold:100},time:25,sight:9,r:6,age:2,desc:'Cura, convierte enemigos y recoge reliquias. Clic derecho sobre un enemigo para convertirlo o sobre una reliquia para cogerla.'},
 trade:{name:'Carreta comercial',cls:'trade',hp:70,atk:0,armor:0,range:.3,rof:1,speed:70,cost:{wood:100,gold:50},time:25,sight:5,r:9,age:1,desc:'Clic derecho sobre otro mercado tuyo o aliado: comercia entre ambos y gana oro según la distancia.'},
 fishship:{name:'Barco pesquero',cls:'ship',naval:true,hp:60,atk:0,armor:0,range:.4,rof:1,speed:58,cost:{wood:75},time:25,sight:5,r:10,desc:'Pesca en bancos de peces y entrega la captura en el muelle.'},
 galley:{name:'Galera',cls:'ship',naval:true,hp:120,atk:6,armor:0,parmor:6,range:6,rof:2.5,speed:70,cost:{wood:90,gold:30},time:30,sight:7,r:12,age:1,ranged:true,bonus:{ship:3,bld:3},desc:'Barco de guerra que dispara flechas a barcos, unidades y edificios de la costa.'},
 transport:{name:'Barco de transporte',cls:'ship',naval:true,hp:100,atk:0,armor:0,parmor:8,range:.4,rof:1,speed:76,cost:{wood:125},time:30,sight:5,r:13,age:1,desc:'Lleva hasta 10 unidades. Clic derecho en la costa para desembarcarlas.'},
 almogavar:{name:'Almogávar',cls:'inf',hp:60,atk:7,armor:0,range:3.5,rof:1.6,speed:66,cost:{food:55,gold:40},time:14,sight:6,r:7,age:2,ranged:true,unique:true,bonus:{cav:4},desc:'Unidad única íbera: infantería rápida que lanza jabalinas.'},
 axeman:{name:'Lanzador de hachas',cls:'inf',hp:60,atk:8,armor:0,range:3,rof:2,speed:58,cost:{food:55,gold:25},time:14,sight:6,r:7,age:2,ranged:true,unique:true,bonus:{inf:2},desc:'Unidad única franca: infantería que lanza hachas a corta distancia.'},
 longbow:{name:'Arquero largo',cls:'arc',hp:35,atk:6,armor:0,range:8,rof:2,speed:52,cost:{wood:35,gold:40},time:16,sight:9,r:6,age:2,ranged:true,unique:true,bonus:{inf:2},desc:'Unidad única britana: el mayor alcance del juego.'},
 tknight:{name:'Caballero teutónico',cls:'inf',hp:100,atk:12,armor:5,range:.35,rof:2,speed:42,cost:{food:85,gold:40},time:18,sight:5,r:8,age:2,unique:true,bonus:{bld:6},desc:'Unidad única teutona: infantería lenta y casi indestructible.'},
 cataphract:{name:'Catafracto',cls:'cav',hp:110,atk:9,armor:2,parmor:1,range:.35,rof:1.7,speed:86,cost:{food:70,gold:75},time:20,sight:6,r:10,age:2,unique:true,bonus:{inf:9},desc:'Unidad única bizantina: caballería que arrasa a la infantería.'}
};
const B={
 tc:{name:'Centro urbano',size:3,hp:1500,armor:2,cost:{wood:275,stone:100},time:60,sight:8,pop:5,drop:true,trains:['villager'],techs:['wheel','plow'],atk:5,range:6,rof:2,arrows:1,gar:15,age:1,desc:'Entrena aldeanos, recibe recursos y permite avanzar de edad. Dispara flechas; más si hay aldeanos dentro.'},
 house:{name:'Casa',size:2,hp:350,cost:{wood:30},time:12,sight:3,pop:5,desc:'Aumenta la población máxima en 5.'},
 farm:{name:'Granja',size:2,hp:100,cost:{wood:60},time:10,sight:2,farm:true,food:400,desc:'Fuente de comida estable: 400 por granja. Un aldeano por granja.'},
 store:{name:'Almacén',size:2,hp:600,cost:{wood:100},time:18,sight:4,drop:true,techs:['axe','pick'],desc:'Punto de entrega de recursos e investigaciones de recolección. Constrúyelo junto a bosques y minas.'},
 market:{name:'Mercado',size:3,hp:2100,cost:{wood:175},time:40,sight:5,trains:['trade'],market:true,age:1,desc:'Compra y vende recursos a cambio de oro y entrena carretas comerciales.'},
 dock:{name:'Muelle',size:3,hp:1800,cost:{wood:150},time:35,sight:6,trains:['fishship','galley','transport'],techs:['gillnets','u_galley'],drop:'fish',coast:true,desc:'Se construye en la costa. Recibe el pescado y construye barcos.'},
 barracks:{name:'Cuartel',size:3,hp:1000,cost:{wood:150},time:30,sight:5,trains:['militia','spear'],techs:['u_militia','u_spear'],desc:'Entrena hombres de armas y piqueros.'},
 range:{name:'Galería de tiro',size:3,hp:1000,cost:{wood:150},time:30,sight:5,trains:['archer'],techs:['u_archer'],age:1,desc:'Entrena arqueros.'},
 stable:{name:'Establo',size:3,hp:1000,cost:{wood:150},time:30,sight:5,trains:['scout','knight'],techs:['u_scout','u_knight'],age:1,desc:'Entrena exploradores y caballeros.'},
 smith:{name:'Herrería',size:3,hp:1100,cost:{wood:150},time:35,sight:4,techs:['forge','fletch','mail','masonry','barding'],age:1,desc:'Investiga mejoras de ataque y armadura para tu ejército y tus edificios.'},
 tower:{name:'Torre de vigilancia',size:2,hp:900,armor:1,cost:{wood:50,stone:125},time:35,sight:9,atk:7,range:7,rof:1.6,arrows:1,gar:5,age:1,desc:'Defensa: dispara flechas a los enemigos cercanos; más si hay unidades dentro.'},
 siege:{name:'Taller de asedio',size:3,hp:1000,cost:{wood:200},time:40,sight:4,trains:['ram','mangonel'],age:2,desc:'Construye arietes y mangoneles.'},
 monastery:{name:'Monasterio',size:3,hp:1100,cost:{wood:175},time:40,sight:5,trains:['monk'],techs:['fervor'],age:2,desc:'Forma monjes. Cada reliquia guardada aquí produce oro.'},
 castle:{name:'Castillo',size:4,hp:4800,armor:6,cost:{stone:650},time:150,sight:11,atk:11,range:8,rof:2,arrows:4,gar:20,pop:20,trains:['unique'],age:2,desc:'Fortaleza que dispara flechas, acoge 20 unidades y entrena la unidad única de tu civilización.'},
 wonder:{name:'Maravilla',size:5,hp:4800,armor:8,cost:{wood:1000,gold:1000,stone:1000},time:240,sight:6,wonder:true,age:2,desc:'Si resiste en pie cinco minutos tras terminarla, tu bando gana la partida.'},
 palisade:{name:'Empalizada',size:1,hp:250,cost:{wood:3},time:4,sight:1,wall:true,desc:'Muro de madera barato. Arrastra para trazar una línea; 3 de madera por tramo.'},
 wall:{name:'Muralla de piedra',size:1,hp:1400,armor:4,cost:{stone:5},time:7,sight:2,wall:true,age:1,desc:'Muro de piedra muy resistente. Arrastra para trazar una línea; 5 de piedra por tramo.'},
 gate:{name:'Puerta',size:1,hp:1100,armor:3,cost:{stone:25},time:15,sight:2,wall:true,gate:true,age:1,desc:'Deja pasar a tus unidades y a las de tus aliados; bloquea al enemigo.'}
};
const BPAGES=[['house','farm','store','tc','market','dock','tower','palisade','wall','gate'],['barracks','range','stable','smith','siege','monastery','castle','wonder']];
const GAR={tc:{n:15,cls:['vil','inf','arc','monk']},tower:{n:5,cls:['vil','inf','arc','monk']},castle:{n:20,cls:['vil','inf','arc','monk','cav']},transport:{n:10,cls:['vil','inf','arc','monk','cav','siege','trade']}};
const TECH={
 wheel:{name:'Carretilla',at:'tc',cost:{food:175,wood:50},time:30,age:1,desc:'Aldeanos un 10 % más rápidos; cargan 5 recursos más.'},
 plow:{name:'Arado',at:'tc',cost:{food:125,wood:75},time:25,age:1,desc:'Las granjas producen un 20 % más rápido y tienen 100 de comida más.'},
 axe:{name:'Hacha doble',at:'store',cost:{food:100,wood:50},time:20,age:1,desc:'Los aldeanos talan un 20 % más rápido.'},
 pick:{name:'Minería',at:'store',cost:{food:100,wood:75},time:25,age:1,desc:'Los aldeanos extraen oro y piedra un 20 % más rápido.'},
 gillnets:{name:'Redes de pesca',at:'dock',cost:{food:150,wood:100},time:25,age:1,desc:'Los barcos pesqueros pescan un 25 % más rápido.'},
 forge:{name:'Forja',at:'smith',cost:{food:150},time:30,age:1,desc:'+1 de ataque para infantería y caballería.'},
 fletch:{name:'Emplumado',at:'smith',cost:{food:100,wood:50},time:30,age:1,desc:'+1 de ataque y +1 de alcance para arqueros, galeras, torres, castillos y centros urbanos.'},
 mail:{name:'Cota de malla',at:'smith',cost:{food:100,gold:50},time:35,age:1,desc:'+1 de armadura para infantería y caballería.'},
 masonry:{name:'Mampostería',at:'smith',cost:{wood:175,stone:100},time:40,age:2,desc:'+15 % de vida y +1 de armadura para todos tus edificios.'},
 barding:{name:'Bardas',at:'smith',cost:{food:150,gold:100},time:40,age:2,desc:'+2 de armadura para la caballería.'},
 fervor:{name:'Fervor',at:'monastery',cost:{gold:140},time:40,age:2,desc:'Monjes un 15 % más rápidos; convierten y curan antes.'},
 u_militia:{name:'Espadachín',at:'barracks',up:'militia',cost:{food:200,gold:65},time:40,age:2,desc:'Mejora a todos tus hombres de armas a espadachines: +15 de vida y +2 de ataque.'},
 u_spear:{name:'Piquero veterano',at:'barracks',up:'spear',cost:{food:215,gold:90},time:40,age:2,desc:'+10 de vida, +1 de ataque y +6 de bonificación contra caballería.'},
 u_archer:{name:'Ballestero',at:'range',up:'archer',cost:{food:125,gold:75},time:35,age:2,desc:'Mejora a tus arqueros a ballesteros: +5 de vida, +1 de ataque y +1 de alcance.'},
 u_scout:{name:'Caballería ligera',at:'stable',up:'scout',cost:{food:150,gold:50},time:35,age:2,desc:'Mejora a tus exploradores: +15 de vida, +2 de ataque y +1 de armadura.'},
 u_knight:{name:'Caballero pesado',at:'stable',up:'knight',cost:{food:300,gold:300},time:50,age:2,desc:'Mejora a tus caballeros: +25 de vida y +2 de ataque.'},
 u_galley:{name:'Galera de guerra',at:'dock',up:'galley',cost:{food:230,gold:100},time:40,age:2,desc:'Mejora tus galeras: +40 de vida, +2 de ataque y +1 de alcance.'}
};
const UPG={militia:{hp:15,atk:2,name:'Espadachín'},spear:{hp:10,atk:1,bcav:6,name:'Piquero veterano'},archer:{hp:5,atk:1,range:1,name:'Ballestero'},scout:{hp:15,atk:2,armor:1,name:'Caballería ligera'},knight:{hp:25,atk:2,name:'Caballero pesado'},galley:{hp:40,atk:2,range:1,name:'Galera de guerra'}};
const RDEF={tree:{r:'wood',amt:100,name:'Árbol'},gold:{r:'gold',amt:750,name:'Mina de oro'},stone:{r:'stone',amt:350,name:'Cantera de piedra'},berry:{r:'food',amt:125,name:'Arbusto de bayas'},fish:{r:'food',amt:225,name:'Banco de peces'}};
// La dificultad cambia cómo juega la IA, no le da recursos extra.
const ALLT=Object.keys(TECH);
const DIFF={
 easy:{name:'Fácil',tick:2,vil:20,bar:12,ageV:18,first:720,interval:300,wave:4,towers:0,techs:['wheel','forge','axe','gillnets'],counter:false,maxAge:3,siege:false,raid:false,monks:0,fish:2,galleys:2,castle:false,market:false,wonder:false,relics:false,bell:false},
 normal:{name:'Normal',tick:1,vil:28,bar:10,ageV:20,first:480,interval:220,wave:7,towers:1,techs:['wheel','plow','axe','pick','gillnets','forge','fletch','mail','masonry','u_militia','u_archer','u_galley'],counter:true,maxAge:6,siege:true,raid:false,monks:1,fish:4,galleys:5,castle:true,market:true,wonder:false,relics:true,bell:true},
 hard:{name:'Difícil',tick:.6,vil:34,bar:8,ageV:22,first:380,interval:170,wave:9,towers:2,techs:ALLT,counter:true,maxAge:8,siege:true,raid:true,monks:3,fish:6,galleys:8,castle:true,market:true,wonder:true,relics:true,bell:true}
};
const CONVT=4.5;

let G=null,seed=1;
function rnd(){seed=(seed+0x6D2B79F5)|0;let t=Math.imul(seed^(seed>>>15),1|seed);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296}
const ri=(a,b)=>a+Math.floor(rnd()*(b-a+1));
const idx=(x,y)=>y*MW+x;
const inb=(x,y)=>x>=0&&y>=0&&x<MW&&y<MH;
const free=(x,y)=>inb(x,y)&&!G.block[y*MW+x];
const navOK=(x,y)=>inb(x,y)&&G.ter[y*MW+x]===1;
const P=o=>G.players[o];
function isAlly(a,b){return a!=null&&b!=null&&(a===b||G.players[a].team===G.players[b].team)}
function isEnemy(a,b){return a!=null&&b!=null&&a!==b&&G.players[a].team!==G.players[b].team}
function passable(i,o){if(!G.block[i])return true;const g=G.gate[i];return g>0&&o!=null&&o>=0&&isAlly(g-1,o)}
const freeO=(x,y,o)=>inb(x,y)&&passable(y*MW+x,o);
const freeAtPx=(x,y,o,nav)=>x>=0&&y>=0&&(nav?navOK((x/T)|0,(y/T)|0):freeO((x/T)|0,(y/T)|0,o));
const clampT=(v,m)=>Math.max(0,Math.min(m-1,v|0));
const tidx=e=>idx(clampT(e.x/T,MW),clampT(e.y/T,MH));
const visOf=o=>G.visT[P(o).team],expOf=o=>G.expT[P(o).team];
const ME=()=>G.me||0;
const inGar=e=>e.kind==='unit'&&!!e.gar;
const act=e=>!e.dead&&!inGar(e);

function ev(type,d){G.ev.push(Object.assign({},d||{},{ev:type}))}
function msg(text,warn){ev('msg',{text,warn:!!warn})}
function msgT(key,text,warn){if((G.msgT[key]||-99)>G.t-7)return;G.msgT[key]=G.t;msg(text,warn)}
function sfx(k){ev('sfx',{k})}

// ---------- relieve
function hAtT(x,y){if(!G.hgt)return 0;const fx=Math.max(0,Math.min(MW-1.001,x-.5)),fy=Math.max(0,Math.min(MH-1.001,y-.5)),x0=fx|0,y0=fy|0,tx=fx-x0,ty=fy-y0,x1=Math.min(MW-1,x0+1),y1=Math.min(MH-1,y0+1);
 const h=G.hgt;return(h[y0*MW+x0]*(1-tx)+h[y0*MW+x1]*tx)*(1-ty)+(h[y1*MW+x0]*(1-tx)+h[y1*MW+x1]*tx)*ty}
const hAt=(px,py)=>hAtT(px/T,py/T);
function elevK(a,t){const d=hAt(a.x,a.y)-hAt(t.x,t.y);return d>.35?1.25:d<-.35?.8:1}

// ---------- estadísticas (tecnologías, mejoras y civilizaciones)
const civ=o=>P(o).civ,tech=(o,t)=>!!P(o).tech[t],up=(o,t)=>!!(P(o).up&&P(o).up[t]);
// ---------- generaciones: cada línea de unidades evoluciona al avanzar de edad (valores absolutos desde esa edad)
const GEN={
 villager:{4:{name:'Obrero',hp:35,atk:4},6:{name:'Técnico',hp:40},8:{name:'Colono',hp:50,atk:5}},
 militia:{3:{name:'Tercio',hp:85,atk:11,armor:2},4:{name:'Granadero',hp:95,atk:12,ranged:true,range:3.5,rof:2.4,proj:'grenade',fullBld:true,bonus:{bld:12,arc:3}},
  5:{name:'Infantería de asalto',hp:110,atk:9,armor:3,range:4.5,rof:1.1,proj:'bullet',bonus:{bld:6,arc:4},cost:{food:70,gold:40}},6:{name:'Comando',hp:130,atk:11,armor:4,range:5,rof:1},
  7:{name:'Operador táctico',hp:150,atk:13,armor:5,range:5.5,rof:.9},8:{name:'Exosoldado',hp:190,atk:16,armor:7,range:6,proj:'laser'}},
 spear:{3:{name:'Pica',hp:70,atk:6,armor:1,bonus:{cav:24}},4:{name:'Fusilero',hp:75,atk:8,ranged:true,range:5,rof:2,proj:'bullet',bonus:{cav:14},cost:{food:45,wood:20,gold:15}},
  5:{name:'Bazuca',hp:80,atk:10,range:5.5,rof:3,proj:'rocket',fullBld:true,bonus:{cav:40,bld:8}},6:{name:'Equipo antitanque',hp:95,atk:12,range:6,bonus:{cav:50,bld:10}},
  7:{name:'Misil guiado',hp:110,atk:14,range:6.5,bonus:{cav:60,bld:12}},8:{name:'Cañón de pulsos',hp:130,atk:17,armor:3,range:7,proj:'plasma',bonus:{cav:75,bld:14}}},
 archer:{3:{name:'Arcabucero',hp:45,atk:10,range:6,rof:2.4,proj:'bullet',bonus:{inf:4},cost:{wood:30,gold:50}},4:{name:'Tirador',hp:50,atk:12,range:7,rof:2.2,bonus:{inf:5}},
  5:{name:'Ametrallador',hp:60,atk:5,range:6.5,rof:.45,bonus:{inf:4},cost:{food:40,gold:60}},6:{name:'Ametrallador pesado',hp:70,atk:6,armor:1,range:7,rof:.4},
  7:{name:'Tirador de precisión',hp:75,atk:22,range:9.5,rof:2.2,bonus:{inf:10}},8:{name:'Tirador láser',hp:90,atk:14,armor:2,range:8.5,rof:1,proj:'laser',bonus:{inf:8}}},
 scout:{3:{name:'Húsar',hp:85,atk:7,armor:1,speed:115},4:{name:'Cazador a caballo',hp:95,atk:8,ranged:true,range:3.5,rof:1.8,proj:'bullet'},
  5:{name:'Motocicleta armada',hp:100,atk:7,range:4,rof:.9,speed:130,cost:{food:90,gold:30}},6:{name:'Vehículo de reconocimiento',hp:140,atk:9,armor:3,range:4.5,rof:.8,speed:125},
  7:{name:'Dron de ataque',hp:150,atk:10,armor:2,range:5,speed:140,fly:true},8:{name:'Aerodeslizador',hp:180,atk:12,armor:4,speed:150,proj:'laser'}},
 knight:{3:{name:'Coracero',hp:155,atk:13,armor:3},4:{name:'Dragón',hp:170,atk:15},
  5:{name:'Tanque',hp:320,atk:24,armor:6,parmor:4,ranged:true,range:5.5,rof:3.5,speed:62,proj:'shell',fullBld:true,bonus:{arc:8,inf:6,bld:10},cost:{food:120,gold:180},time:28},
  6:{name:'Carro de combate',hp:380,atk:28,armor:7,speed:70,range:6},7:{name:'Tanque de batalla',hp:450,atk:32,armor:8,speed:78,range:6.5,cost:{food:140,gold:220}},
  8:{name:'Mech de asalto',hp:540,atk:36,armor:9,speed:74,proj:'plasma'}},
 ram:{3:{name:'Bombarda',hp:190,atk:30,ranged:true,range:6,minr:1.5,rof:5,speed:36,proj:'ball',fullBld:true,bonus:{bld:30},cost:{wood:180,gold:100}},
  4:{name:'Cañón de sitio',hp:210,atk:36,range:7,rof:4.5},5:{name:'Obús',hp:230,atk:44,range:8.5,proj:'shell',cost:{wood:150,gold:180},time:35},
  6:{name:'Artillería autopropulsada',hp:300,atk:50,armor:3,range:9,speed:50},7:{name:'Lanzacohetes de precisión',hp:320,atk:58,range:10,proj:'rocket'},8:{name:'Cañón de riel',hp:380,atk:70,range:11,proj:'laser'}},
 mangonel:{3:{name:'Culebrina',hp:80,atk:13,range:7.5,rof:4.5,proj:'ball'},4:{name:'Cañón de campaña',hp:95,atk:16,range:8,rof:4.2},
  5:{name:'Mortero',hp:105,atk:20,range:9,rof:4,proj:'shell',cost:{wood:120,gold:200}},6:{name:'Lanzacohetes múltiple',hp:150,atk:24,armor:2,range:9.5,speed:48,proj:'rocket'},
  7:{name:'Artillería inteligente',hp:170,atk:28,range:10},8:{name:'Cañón de plasma',hp:200,atk:33,range:10.5,proj:'plasma'}},
 monk:{3:{name:'Misionero',hp:50},4:{name:'Capellán',hp:55},5:{name:'Médico de campaña',hp:65,speed:50},7:{name:'Agente de influencia',hp:75,range:6},8:{name:'Diplomático IA',hp:90,range:7}},
 trade:{3:{name:'Carreta de mercader'},4:{name:'Diligencia',speed:80},5:{name:'Camión de mercancías',hp:100,speed:95},7:{name:'Camión autónomo',speed:105},8:{name:'Dron de carga',speed:120,fly:true}},
 fishship:{4:{name:'Pesquero de vapor',hp:80,speed:70},5:{name:'Arrastrero',hp:100},7:{name:'Arrastrero automatizado',speed:80}},
 galley:{3:{name:'Galeón',hp:170,atk:10,range:7,proj:'ball',fullBld:true},4:{name:'Fragata acorazada',hp:240,atk:13,armor:2,range:7.5},
  5:{name:'Destructor',hp:300,atk:15,range:8,speed:85,proj:'shell',cost:{wood:120,gold:80}},6:{name:'Crucero lanzamisiles',hp:360,atk:18,range:9,proj:'rocket'},
  7:{name:'Fragata furtiva',hp:400,atk:21,range:9.5},8:{name:'Hidroala de plasma',hp:460,atk:25,range:10,proj:'plasma'}},
 transport:{3:{name:'Carraca',hp:130},4:{name:'Vapor de transporte',hp:160,speed:84},5:{name:'Lancha de desembarco',hp:200,speed:92},7:{name:'Aerodeslizador anfibio',hp:240,speed:105}}
};
// nombres de edificios que cambian con la edad
const BGEN={
 tower:{3:'Baluarte',4:'Torre artillada',5:'Nido de ametralladoras',6:'Torre de misiles',7:'Torreta automática',8:'Torre láser'},
 castle:{3:'Fortaleza abaluartada',4:'Fuerte',5:'Búnker de mando',6:'Complejo fortificado',7:'Centro de mando',8:'Ciudadela de energía'},
 wall:{3:'Muralla abaluartada',4:'Muro de ladrillo',5:'Muro de hormigón',7:'Muro inteligente',8:'Barrera de energía'},
 palisade:{5:'Alambrada'},gate:{5:'Puesto de control',8:'Compuerta de energía'},
 stable:{5:'Fábrica de vehículos'},siege:{4:'Fundición de artillería',6:'Fábrica de artillería'},monastery:{5:'Hospital de campaña',7:'Centro de influencia'},
 smith:{4:'Fábrica de armamento',7:'Laboratorio de armamento'},dock:{5:'Puerto'},market:{4:'Lonja',7:'Bolsa de valores'},range:{5:'Campo de tiro'},barracks:{5:'Cuartel militar'},
 store:{4:'Almacén industrial',7:'Centro logístico'},house:{4:'Vivienda',6:'Bloque de viviendas',8:'Hábitat'},farm:{4:'Granja mecanizada',7:'Granja hidropónica'}
};
const BPROJ=['arrow','arrow','arrow','ball','ball','bullet','rocket','laser','laser'];
const PK={arrow:[400,1],javelin:[400,1],axe:[400,1],bullet:[1600,0],laser:[3200,0],plasma:[1100,0],rocket:[700,.35],grenade:[300,1.6],ball:[520,.7],shell:[420,1.4],stone:[260,1]};
const EXPL={rocket:1,shell:1,grenade:1,ball:1,plasma:1};
const gdC={};
function ageOf(o){return o!=null&&G&&G.players[o]?G.players[o].age:0}
function gdAt(t,a){if(a<3&&!(a>=0&&GEN[t]&&GEN[t][a]))return U[t];const k=t+'|'+a;let d=gdC[k];if(d)return d;d=Object.assign({},U[t]);const g=GEN[t];
 if(g)for(let i=0;i<=a;i++)if(g[i])Object.assign(d,g[i]);
 if(U[t].unique&&a>2){const m=1+.15*(a-2);d.hp=Math.round(d.hp*m);d.atk=Math.round(d.atk*m);d.name=U[t].name+' de élite'}
 return gdC[k]=d}
const gd=(t,o)=>gdAt(t,ageOf(o));
const genUp=(o,t)=>ageOf(o)<3&&up(o,t);
function bName(t,o){const g=BGEN[t],a=ageOf(o);let n=B[t].name;if(g)for(let i=0;i<=a;i++)if(g[i])n=g[i];return n}
const bAgeK=o=>1+.15*Math.max(0,ageOf(o)-2);

function uName(type,o){const d=gd(type,o);if(d!==U[type])return d.name;return o!=null&&up(o,type)&&UPG[type]?UPG[type].name:U[type].name}
function uMaxHp(type,o){const d=gd(type,o);const h=d.hp+(genUp(o,type)?UPG[type].hp:0);return Math.round(h*((d.cls==='cav'&&civ(o)==='francos')?1.2:1))}
function uAtk(u,o){const t=u.type||u;o=o??u.owner;const d=gd(t,o);let a=d.atk+(genUp(o,t)?UPG[t].atk:0);if((d.cls==='inf'||d.cls==='cav')&&tech(o,'forge'))a+=1;if((d.cls==='arc'||t==='galley')&&tech(o,'fletch'))a+=1;return a}
function uArmor(u,ranged){const o=u.owner,d=gd(u.type,o);let a=d.armor+(genUp(o,u.type)&&UPG[u.type].armor||0);if(d.cls==='inf'||d.cls==='cav'){if(tech(o,'mail'))a+=1}
 if(d.cls==='cav'&&tech(o,'barding'))a+=2;if(d.cls==='inf'&&civ(o)==='teutones')a+=1;if(ranged&&d.parmor)a+=d.parmor;return a}
function uRange(u,o){const t=u.type||u;o=o??u.owner;const d=gd(t,o);let r=d.range+(genUp(o,t)&&UPG[t].range||0);if(d.cls==='arc'||t==='galley'){if(tech(o,'fletch'))r+=1;if(civ(o)==='britanos'&&d.cls==='arc')r+=1}return r}
function uBonus(t,o,cls){const b=gd(t,o).bonus;let v=b&&b[cls]||0;if(t==='spear'&&cls==='cav'&&genUp(o,t))v+=UPG.spear.bcav;return v}
function uSpeed(u){const d=gd(u.type,u.owner);let s=d.speed;if(u.type==='villager'&&tech(u.owner,'wheel'))s*=1.1;if(u.type==='monk'&&tech(u.owner,'fervor'))s*=1.15;const g=u.o&&u.o.gs;return g?Math.min(s,g):s}
function carryCap(o,type){return type==='fishship'?15:CAP+(tech(o,'wheel')?5:0)}
function gatherRate(o,rt,farm,fish){const p=P(o);let r=fish?GR.fish:farm?GR.farm:GR[rt];
 if(fish){if(tech(o,'gillnets'))r*=1.25}
 else if(farm){if(tech(o,'plow'))r*=1.2;if(p.civ==='francos')r*=1.25}
 else if(rt==='wood'&&tech(o,'axe'))r*=1.2;else if((rt==='gold'||rt==='stone')&&tech(o,'pick'))r*=1.2;return r*(p.mult||1)*(1+.08*Math.max(0,p.age-2))}
function bMaxHp(type,o){return Math.round(B[type].hp*bAgeK(o)*(civ(o)==='bizantinos'?1.2:1)*(tech(o,'masonry')?1.15:1))}
function bArmor(type,o){return(B[type].armor||0)+(tech(o,'masonry')?1:0)+Math.max(0,(ageOf(o)-2)>>1)}
function bAtk(b){return Math.round(B[b.type].atk*(1+.22*Math.max(0,ageOf(b.owner)-2)))+(civ(b.owner)==='teutones'?2:0)+(tech(b.owner,'fletch')?1:0)}
function bRange(b){return B[b.type].range+Math.min(3,Math.max(0,ageOf(b.owner)-2)*.5)+(tech(b.owner,'fletch')?1:0)}
function unitCost(o,k){const c=gd(k,o).cost;if(k==='spear'&&civ(o)==='iberos'){const r={};for(const x in c)r[x]=Math.round(c[x]*.75);return r}return c}
function trainTime(o,b,k){return gd(k,o).time*(b.type==='range'&&civ(o)==='britanos'?.75:1)}
function buildRate(o){return civ(o)==='iberos'?1.3:1}
function convTime(o){return CONVT*(tech(o,'fervor')?.8:1)}
function healRate(o){return(civ(o)==='bizantinos'?3:1.5)*(tech(o,'fervor')?1.25:1)}
const trainsOf=(b)=>{const t=B[b.type].trains||[];return t[0]==='unique'?[CIVS[civ(b.owner)].uu]:t};

// ---------- entidades
function addEnt(e){e.id=G.nid++;G.ents.set(e.id,e);G.list.push(e);idxAdd(e);return e}
function idxAdd(e){if(e.kind==='unit')G.ul.push(e);else if(e.kind==='bld'){G.bl.push(e);G.bv++}else if(e.kind==='res'){G.rl.push(e);G.rv++}else if(e.kind==='relic')G.rel.push(e)}
function reindex(){G.ul=[];G.bl=[];G.rl=[];G.rel=[];G.bv=(G.bv||0)+1;G.rv=(G.rv||0)+1;G.ug=null;for(const e of G.list)if(!e.dead)idxAdd(e)}
// ---------- rejilla espacial (celdas de GC casillas); orden de inserción determinista
const GC=8;let GW=11;
function gridBuild(arr,skip){const g=new Array(GW*GW);for(let i=0;i<g.length;i++)g[i]=[];for(const e of arr){if(e.dead||(skip&&skip(e)))continue;g[gcell(e.y)*GW+gcell(e.x)].push(e)}return g}
const gcell=v=>Math.max(0,Math.min(GW-1,(v/(T*GC))|0));
function ugrid(){if(!G.ug)G.ug=gridBuild(G.ul,e=>e.gar);return G.ug}
function bgrid(){if(G.bgv!==G.bv){G.bg=gridBuild(G.bl);G.bgv=G.bv}return G.bg}
function rgrid(){if(G.rgv!==G.rv){G.rg=gridBuild(G.rl);G.rgv=G.rv}return G.rg}
function gridEach(g,x,y,r,f){const x0=gcell(x-r),x1=gcell(x+r),y0=gcell(y-r),y1=gcell(y+r);
 for(let cy=y0;cy<=y1;cy++)for(let cx=x0;cx<=x1;cx++){const c=g[cy*GW+cx];for(let k=0;k<c.length;k++)f(c[k])}}
function ringSearch(g,x,y,maxD,f){const cx=gcell(x),cy=gcell(y),CP=T*GC,R=Math.ceil(maxD/CP)+1;let best=null,bd=maxD;
 for(let r=0;r<=R;r++){if(best&&bd<=(r-1)*CP)break;
  for(let yy=cy-r;yy<=cy+r;yy++){if(yy<0||yy>=GW)continue;const edge=yy===cy-r||yy===cy+r;
   for(let xx=cx-r;xx<=cx+r;xx+=(edge?1:2*r||1)){if(xx<0||xx>=GW)continue;const c=g[yy*GW+xx];
    for(let k=0;k<c.length;k++){const d=f(c[k]);if(d>=0&&d<bd){bd=d;best=c[k]}}}}}
 return best}
function setOcc(e,on){const s=e.size||1;const d=e.kind==='bld'?B[e.type]:null;const farm=d&&d.farm;
 for(let y=e.ty;y<e.ty+s;y++)for(let x=e.tx;x<e.tx+s;x++){if(!inb(x,y))continue;const i=idx(x,y);G.occ[i]=on?e.id:0;G.block[i]=(G.ter[i]===1||(on&&!farm))?1:0;G.gate[i]=on&&d&&d.gate?e.owner+1:0}}
function mkRes(type,tx,ty){const d=RDEF[type];const e=addEnt({kind:'res',type,tx,ty,size:1,amt:d.amt,max:d.amt,v:rnd(),x:(tx+.5)*T,y:(ty+.5)*T});setOcc(e,true);return e}
function mkBld(type,owner,tx,ty,built){const d=B[type],mh=bMaxHp(type,owner),food=d.farm?d.food+(tech(owner,'plow')?100:0):0;
 const e=addEnt({kind:'bld',type,owner,tx,ty,size:d.size,hp:built?mh:Math.max(1,mh*.05),maxhp:mh,bp:built?1:0,q:[],rally:null,cd:0,x:(tx+d.size/2)*T,y:(ty+d.size/2)*T,amt:food,max:food,wk:0,gar:[],relics:[]});setOcc(e,true);return e}
function mkUnit(type,owner,x,y){const d=U[type],mh=uMaxHp(type,owner);return addEnt({kind:'unit',type,owner,x,y,hp:mh,maxhp:mh,o:{t:'idle'},oq:[],path:[],pi:0,gk:null,fx:null,fy:null,cd:0,dir:rnd()*6.283,carry:{t:null,a:0},anim:rnd()*10,scan:rnd()*.4,rp:0,walk:false,work:false,atkAnim:0,r:d.r,faith:1,st:0,gar:0,relic:0,cargo:d.naval&&type==='transport'?[]:null})}
function mkRelic(x,y){return addEnt({kind:'relic',type:'relic',x,y,holder:0,owner:null})}
function remove(e){if(e.dead)return;e.dead=true;G.ents.delete(e.id);if(e.kind==='bld'||e.kind==='res')setOcc(e,false);if(e.kind==='bld')G.bv++;G.dirty=true}
const rectOf=e=>[e.tx,e.ty,e.tx+e.size-1,e.ty+e.size-1];
function entDist(a,e){if(e.kind!=='bld'&&e.kind!=='res')return Math.hypot(e.x-a.x,e.y-a.y);const x0=e.tx*T,y0=e.ty*T,x1=x0+e.size*T,y1=y0+e.size*T;const dx=Math.max(x0-a.x,0,a.x-x1),dy=Math.max(y0-a.y,0,a.y-y1);return Math.hypot(dx,dy)}
function canAfford(p,c){for(const k in c)if(p.res[k]<c[k])return false;return true}
function pay(p,c){for(const k in c)p.res[k]-=c[k]}
function refund(p,c){for(const k in c)p.res[k]+=c[k]}
const unitAvail=(p,t)=>(U[t].age||0)<=p.age;
const bldAvail=(p,t)=>(B[t].age||0)<=p.age;
function techState(p,t){if(p.tech[t])return'done';if(p.tq[t])return'queued';if(TECH[t].age>p.age)return'age';return'ok'}

// ---------- mapa
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function genBases(n,teams,m){const C={TL:[m,m],TR:[MW-m-3,m],BR:[MW-m-3,MH-m-3],BL:[m,MH-m-3]};let order;
 const tset=[...new Set(teams)];
 if(n===2){order=rnd()<.5?['TL','BR']:['TR','BL'];if(rnd()<.5)order.reverse()}
 else if(tset.length<n){const sides=rnd()<.5?[['TL','BL'],['TR','BR']]:[['TR','BR'],['TL','BL']];order=new Array(n);const byTeam={};
  teams.forEach((t,i)=>(byTeam[t]||(byTeam[t]=[])).push(i));
  Object.values(byTeam).sort((a,b)=>b.length-a.length).forEach((mem,si)=>{const s=shuffle(sides[si%2].slice());mem.forEach((pi,k)=>order[pi]=s[k%2])})}
 else order=shuffle(['TL','TR','BR','BL']).slice(0,n);
 return order.map(k=>{const [x,y]=C[k];return{x,y,cx:x+1.5,cy:y+1.5,corner:k}})}
function genMap(type,n,teams){
 if(root.IMPERIA_MAPS&&root.IMPERIA_MAPS[type])return genReal(type,n,teams);
 G.ter=new Uint8Array(NN);G.occ=new Int32Array(NN);G.block=new Uint8Array(NN);G.gate=new Uint8Array(NN);
 const isl=type==='islas';G.bases=genBases(n,teams,isl?Math.round(MW*.15):7);const K=NN/7744;
 const far=(x,y,d)=>G.bases.every(b=>Math.hypot(x+.5-b.cx,y+.5-b.cy)>d);
 if(type==='continental'){let tries=0,lakes=0;const nl=Math.round(ri(3,5)*K);while(lakes<nl&&tries++<400){const x=ri(10,MW-11),y=ri(10,MH-11);if(!far(x,y,21))continue;lake(x,y,ri(3,6));lakes++}}
 if(type==='rio')river();
 if(isl)islands(teams,K);
 for(let i=0;i<NN;i++)G.block[i]=G.ter[i]===1?1:0;
 const open=type==='bosque'?new Uint8Array(NN):null;
 if(open)carveForest(open);
 const clampC=v=>Math.max(3,Math.min(MW-4,v)),sc=type==='bosque'||isl?.8:1;
 for(const b of G.bases){const a=Math.atan2(MH/2-b.cy,MW/2-b.cx);const at=(da,d)=>[clampC(b.cx+Math.cos(a+da)*d*sc),clampC(b.cy+Math.sin(a+da)*d*sc)];
  cluster('berry',...at(1.35,6),6);cluster('gold',...at(-1.35,7.5),6);cluster('stone',...at(.7,9.5),5);cluster('gold',...at(-.45,14),5);
  if(type!=='bosque'){forest(...at(2.3,10.5),type==='arabia'?30:60,far,6);forest(...at(-2.3,10.5),type==='arabia'?20:45,far,6);if(type!=='arabia'&&!isl)forest(...at(.2,17),40,far,9)}}
 const extra=(t,cnt,d,lo,hi)=>{for(let k=0;k<Math.round(cnt*K);k++)for(let tr=0;tr<80;tr++){const x=ri(6,MW-7),y=ri(6,MH-7);if(far(x,y,d)&&G.ter[idx(x,y)]===0&&(!open||open[idx(x,y)])){cluster(t,x,y,ri(lo,hi));break}}};
 extra('gold',3,17,4,6);extra('stone',3,17,4,5);extra('berry',isl?1:3,15,4,6);
 if(type==='bosque'){for(let y=0;y<MH;y++)for(let x=0;x<MW;x++){const i=idx(x,y);if(!open[i]&&free(x,y)&&G.ter[i]===0&&rnd()<.93)mkRes('tree',x,y)}}
 else{const nf={continental:17,arabia:6,rio:12,islas:10}[type],sz=type==='arabia'?[12,30]:[25,70],sct={continental:90,arabia:170,rio:90,islas:70}[type];
  for(let k=0;k<Math.round(nf*K);k++)for(let t=0;t<60;t++){const x=ri(3,MW-4),y=ri(3,MH-4);if(far(x,y,13)&&G.ter[idx(x,y)]===0){forest(x,y,ri(sz[0],sz[1]),far,12);break}}
  for(let k=0;k<Math.round(sct*K);k++){const x=ri(1,MW-2),y=ri(1,MH-2);if(free(x,y)&&G.ter[idx(x,y)]===0&&far(x,y,7))mkRes('tree',x,y)}}
 if(!isl)for(let x=0;x<MW;x++)for(let y=0;y<MH;y++){if((x<1||y<1||x>MW-2||y>MH-2)&&free(x,y)&&G.ter[idx(x,y)]===0&&rnd()<.75)mkRes('tree',x,y)}
 for(const e of G.list.slice())if(e.kind==='res'&&!far(e.tx,e.ty,4.3))remove(e);
 G.list=G.list.filter(e=>!e.dead);
 for(const b of G.bases)for(let y=b.y-1;y<=b.y+3;y++)for(let x=b.x-1;x<=b.x+3;x++){const i=idx(x,y);G.ter[i]=0;G.block[i]=G.occ[i]?1:0}
 fish(type,K);labelLand();genHeights(K,type);relics(type);
}
// ---------- mapas reales: remuestreo determinista (solo aritmética entera y sumas) de los datos de relieve
function dec64(b,T){let u;if(typeof atob==='function'){const s=atob(b);u=new Uint8Array(s.length);for(let i=0;i<s.length;i++)u[i]=s.charCodeAt(i)}else u=new Uint8Array(Buffer.from(b,'base64'));return new T(u.buffer)}
function realData(type){const D=root.IMPERIA_MAPS[type];if(D._c)return D._c;return D._c={S:D.n,E:dec64(D.elev,Int16Array),W:dec64(D.water,Uint8Array),R:dec64(D.riv,Uint8Array),C:dec64(D.col,Uint8Array)}}
// datos por casilla del mapa de juego: elevación (m), agua, río, color (también los usa el renderizador)
function realCells(type,mw,mh){const {S,E,W,R,C}=realData(type);const n=mw*mh,el=new Float32Array(n),wa=new Uint8Array(n),rv=new Uint8Array(n),col=new Uint8Array(n*3);
 for(let y=0;y<mh;y++){const sy0=Math.floor(y*S/mh),sy1=Math.max(sy0+1,Math.floor((y+1)*S/mh));for(let x=0;x<mw;x++){const sx0=Math.floor(x*S/mw),sx1=Math.max(sx0+1,Math.floor((x+1)*S/mw));
  let e=0,w=0,r=0,cr=0,cg=0,cb=0,c=0;for(let sy=sy0;sy<sy1;sy++)for(let sx=sx0;sx<sx1;sx++){const k=sy*S+sx;e+=E[k];w+=W[k];if(R[k]>r)r=R[k];cr+=C[k*3];cg+=C[k*3+1];cb+=C[k*3+2];c++}
  const i=y*mw+x;el[i]=e/c;wa[i]=w*2>c?1:0;rv[i]=wa[i]?0:r;col[i*3]=cr/c;col[i*3+1]=cg/c;col[i*3+2]=cb/c}}
 return{el,wa,rv,col}}
function genReal(type,n,teams){
 G.ter=new Uint8Array(NN);G.occ=new Int32Array(NN);G.block=new Uint8Array(NN);G.gate=new Uint8Array(NN);const K=NN/7744;
 const {el,wa,rv,col}=realCells(type,MW,MH);
 // bordes del mapa: mar si el dato es agua; montañas = cumbres que sobresalen de su entorno (las mesetas altas son transitables)
 const loc=new Float32Array(NN);const RR=2;for(let y=0;y<MH;y++)for(let x=0;x<MW;x++){let s=0,c=0;for(let dy=-RR;dy<=RR;dy++)for(let dx=-RR;dx<=RR;dx++){const xx=x+dx,yy=y+dy;if(!inb(xx,yy))continue;s+=wa[idx(xx,yy)]?0:el[idx(xx,yy)];c++}loc[idx(x,y)]=s/c}
 const mScale=Math.max(1,160/MW);
 for(let i=0;i<NN;i++){if(wa[i]){G.ter[i]=1;continue}if(rv[i]>=6)G.ter[i]=1;else if(rv[i]>0)G.ter[i]=2;
  else if(el[i]>1100&&el[i]-loc[i]>260*mScale)G.ter[i]=3}
 // bases: en la mayor masa de tierra, en terreno llano y lejos unas de otras
 const comp=new Int32Array(NN).fill(-1),sizes=[];for(let s=0;s<NN;s++){if(comp[s]>=0||G.ter[s]===1||G.ter[s]===3)continue;const id=sizes.length;let cnt=0;const q=[s];comp[s]=id;
  for(let h=0;h<q.length;h++){const i=q[h],x=i%MW,y=(i/MW)|0;cnt++;for(const [dx,dy] of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(!inb(nx,ny))continue;const j=ny*MW+nx;if(comp[j]<0&&G.ter[j]!==1&&G.ter[j]!==3){comp[j]=id;q.push(j)}}}sizes.push(cnt)}
 let main=0;for(let k=1;k<sizes.length;k++)if(sizes[k]>sizes[main])main=k;
 const cand=[];for(let y=6;y<MH-9;y++)for(let x=6;x<MW-9;x++){const i=idx(x,y);if(comp[i]!==main)continue;let ok=true;
  for(let dy=-1;dy<=4&&ok;dy++)for(let dx=-1;dx<=4;dx++){const j=idx(x+dx,y+dy);if(G.ter[j]!==0||Math.abs(el[j]-el[i])>600*mScale){ok=false;break}}
  if(ok)for(let dy=-3;dy<=6&&ok;dy++)for(let dx=-3;dx<=6;dx++){const xx=x+dx,yy=y+dy;if(!inb(xx,yy)||wa[idx(xx,yy)]){ok=false;break}}if(ok)cand.push(i)}
 if(cand.length<n)return genMapFallback(n,teams);
 const pickSet=()=>{const bs=[cand[Math.floor(rnd()*cand.length)]];while(bs.length<n){let best=-1,bd=-1;for(const c of cand){let d=1e9;const cx=c%MW,cy=(c/MW)|0;for(const b of bs){const dd=(cx-b%MW)**2+(cy-((b/MW)|0))**2;if(dd<d)d=dd}d+=rnd()*30;if(d>bd){bd=d;best=c}}bs.push(best)}
  let m=1e9;for(let a2=0;a2<bs.length;a2++)for(let b2=a2+1;b2<bs.length;b2++)m=Math.min(m,(bs[a2]%MW-bs[b2]%MW)**2+(((bs[a2]/MW)|0)-((bs[b2]/MW)|0))**2);return[m,bs]};
 let bases=null,bm=-1;for(let tr=0;tr<8;tr++){const [m,bs]=pickSet();if(m>bm){bm=m;bases=bs}}
 G.bases=bases.map(i=>{const x=i%MW,y=(i/MW)|0;return{x,y,cx:x+1.5,cy:y+1.5,corner:'R'}});
 // equipos: los aliados, en las bases más cercanas entre sí
 if(new Set(teams).size<n){const order=[0];const left=G.bases.slice(1);const out=[G.bases[0]];while(left.length){const last=out[out.length-1];let bi=0,bd=1e9;left.forEach((b,k)=>{const d=Math.hypot(b.cx-last.cx,b.cy-last.cy);if(d<bd){bd=d;bi=k}});out.push(left.splice(bi,1)[0])}
  const idxT=[...teams.keys()].sort((a,b)=>teams[a]-teams[b]||a-b);const nb=new Array(n);idxT.forEach((pi,k)=>nb[pi]=out[k]);G.bases=nb}
 // vados: une todas las bases cruzando ríos por el camino más corto
 const far=(x,y,d)=>G.bases.every(b=>Math.hypot(x+.5-b.cx,y+.5-b.cy)>d);
 for(let b=1;b<G.bases.length;b++){const s0=idx(G.bases[0].x,G.bases[0].y),t=idx(G.bases[b].x,G.bases[b].y);const dist=new Int32Array(NN).fill(1e9),prev=new Int32Array(NN).fill(-1);dist[s0]=0;
  const buckets=[[s0]];for(let dval=0;dval<buckets.length;dval++){const bk=buckets[dval];if(!bk)continue;for(let h=0;h<bk.length;h++){const i=bk[h];if(dist[i]!==dval)continue;if(i===t){dval=buckets.length;break}const x=i%MW,y=(i/MW)|0;
   for(const [dx,dy] of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(!inb(nx,ny))continue;const j=ny*MW+nx;const tr=G.ter[j];if(tr===3)continue;const sea=wa[j];if(sea)continue;const c=tr===1?25:1;const nd=dval+c;if(nd<dist[j]){dist[j]=nd;prev[j]=i;(buckets[nd]||(buckets[nd]=[])).push(j)}}}}
  for(let i=t;i>=0&&i!==s0;i=prev[i])if(G.ter[i]===1&&!wa[i])G.ter[i]=2}
 for(let i=0;i<NN;i++)G.block[i]=G.ter[i]===1||G.ter[i]===3?1:0;
 // recursos según el bioma (color del satélite): bosque oscuro, pradera, desierto, nieve
 const lum=i=>col[i*3]*.3+col[i*3+1]*.59+col[i*3+2]*.11;
 const forestP=i=>{const r=col[i*3],g=col[i*3+1],b=col[i*3+2],l=lum(i);if(G.ter[i]!==0)return 0;if(l>150)return .004;const green=g-Math.max(r,b);if(green>6&&l<70)return .5;if(green>2&&l<95)return .22;if(r>g&&l>110)return .01;return .07};
 for(const b of G.bases){const a=rnd()*6.283;const at=(da,d)=>[Math.max(3,Math.min(MW-4,b.cx+Math.cos(a+da)*d)),Math.max(3,Math.min(MH-4,b.cy+Math.sin(a+da)*d))];
  cluster('berry',...at(1.35,6),6);cluster('gold',...at(-1.35,7.5),6);cluster('stone',...at(.7,9.5),5);cluster('gold',...at(-.45,14),5);forest(...at(2.3,10),50,far,6);forest(...at(-2.3,11),35,far,6)}
 for(let y=1;y<MH-1;y++)for(let x=1;x<MW-1;x++){const i=idx(x,y);const p=forestP(i);if(p>0&&free(x,y)&&far(x,y,7)&&rnd()<p)mkRes('tree',x,y)}
 // oro y piedra en las faldas de las montañas y colinas; bayas en praderas
 const hills=[];for(let i=0;i<NN;i++){if(G.ter[i]!==0)continue;const x=i%MW,y=(i/MW)|0;let m=0;for(const [dx,dy] of[[1,0],[-1,0],[0,1],[0,-1],[2,0],[-2,0],[0,2],[0,-2]]){const xx=x+dx,yy=y+dy;if(inb(xx,yy)&&G.ter[idx(xx,yy)]===3)m++}if(m||el[i]-loc[i]>120*mScale)hills.push(i)}
 shuffle(hills);let gp=0,sp=0;const want=Math.round(5*K);for(const i of hills){const x=i%MW,y=(i/MW)|0;if(!far(x,y,15))continue;if(gp<want){cluster('gold',x,y,ri(4,6));gp++}else if(sp<want){cluster('stone',x,y,ri(4,5));sp++}else break}
 const extra=(t,cnt,d,lo,hi)=>{for(let k=0;k<Math.round(cnt*K);k++)for(let tr=0;tr<80;tr++){const x=ri(6,MW-7),y=ri(6,MH-7);if(far(x,y,d)&&G.ter[idx(x,y)]===0){cluster(t,x,y,ri(lo,hi));break}}};
 extra('gold',Math.max(0,3-gp/2),17,4,6);extra('stone',Math.max(0,3-sp/2),17,4,5);extra('berry',3,15,4,6);
 for(const e of G.list.slice())if(e.kind==='res'&&!far(e.tx,e.ty,4.3))remove(e);G.list=G.list.filter(e=>!e.dead);
 for(const b of G.bases)for(let y=b.y-1;y<=b.y+3;y++)for(let x=b.x-1;x<=b.x+3;x++){const i=idx(x,y);G.ter[i]=0;G.block[i]=G.occ[i]?1:0}
 fish('continental',K*1.6);labelLand();
 // alturas visuales a partir de la elevación real (raíz para comprimir las cordilleras); ríos en el fondo de su valle
 const H=new Float32Array(NN);for(let i=0;i<NN;i++){const e=Math.max(0,el[i]);H[i]=G.ter[i]===1&&wa[i]?0:Math.sqrt(e/1000)*1.55+(G.ter[i]===3?.9:0)}
 for(let i=0;i<NN;i++){if(G.ter[i]===0||G.ter[i]===3)continue;if(wa[i]){H[i]=0;continue}const x=i%MW,y=(i/MW)|0;let m=H[i];for(const [dx,dy] of[[1,0],[-1,0],[0,1],[0,-1]]){const xx=x+dx,yy=y+dy;if(inb(xx,yy)&&G.ter[idx(xx,yy)]===0)m=Math.min(m,H[idx(xx,yy)])}H[i]=Math.max(0,m-.12)}
 // lagos interiores: superficie a la altura de su orilla más baja (no al nivel del mar)
 {const wc=new Int32Array(NN).fill(-1);for(let s0=0;s0<NN;s0++){if(!wa[s0]||wc[s0]>=0)continue;const q=[s0];wc[s0]=s0;let edge=false,shore=1e9;
  for(let h=0;h<q.length;h++){const i=q[h],x=i%MW,y=(i/MW)|0;if(x===0||y===0||x===MW-1||y===MH-1)edge=true;for(const [dx,dy] of[[1,0],[-1,0],[0,1],[0,-1]]){const xx=x+dx,yy=y+dy;if(!inb(xx,yy))continue;const j=idx(xx,yy);if(wa[j]){if(wc[j]<0){wc[j]=s0;q.push(j)}}else if(G.ter[j]!==3)shore=Math.min(shore,H[j])}}
  if(!edge&&q.length<NN*.04&&shore<1e9&&shore>.2)for(const i of q)H[i]=Math.max(0,shore-.1)}}
 for(const b of G.bases){const hb=H[idx(b.x+1,b.y+1)];for(let y=b.y-5;y<=b.y+8;y++)for(let x=b.x-5;x<=b.x+8;x++){if(!inb(x,y))continue;const i=idx(x,y);if(G.ter[i]!==0)continue;const d=Math.max(Math.abs(x-b.x-1),Math.abs(y-b.y-1));const k=Math.max(0,Math.min(1,(d-4)/3));H[i]=hb+(H[i]-hb)*k}}
 G.hgt=H;G.real=type;relics('continental')}
function genMapFallback(n,teams){G.list=[];G.ents&&G.ents.clear&&G.ents.clear();return genMap('continental',n,teams)}
function lake(cx,cy,r){const ph=rnd()*6;for(let y=cy-r-2;y<=cy+r+2;y++)for(let x=cx-r-2;x<=cx+r+2;x++){if(!inb(x,y)||x<2||y<2||x>MW-3||y>MH-3)continue;const a=Math.atan2(y-cy,x-cx);const rr=r*(1+.22*Math.sin(a*3+ph)+.12*Math.sin(a*5+ph*2));if(Math.hypot(x-cx,(y-cy)*1.1)<rr)G.ter[idx(x,y)]=1}}
function river(){const ph=rnd()*6;
 for(let y=0;y<MH;y++){const cx=MW/2+Math.sin(y*.07+ph)*3+Math.sin(y*.17+ph*2)*1.4,w=2.3+Math.sin(y*.11+ph)*.6;for(let x=Math.floor(cx-w-1);x<=cx+w+1;x++)if(inb(x,y)&&Math.abs(x+.5-cx)<w)G.ter[idx(x,y)]=1}
 for(const f of[.18,.5,.82]){const fy=Math.round(MH*f+ri(-3,3));for(let y=fy-1;y<=fy+1;y++)for(let x=0;x<MW;x++)if(inb(x,y)&&G.ter[idx(x,y)]===1)G.ter[idx(x,y)]=2}}
function islands(teams,K){G.ter.fill(1);const R=MW*.19,blob=(cx,cy,r)=>{const ph=rnd()*6;for(let y=Math.floor(cy-r*1.5);y<=cy+r*1.5;y++)for(let x=Math.floor(cx-r*1.5);x<=cx+r*1.5;x++){if(!inb(x,y)||x<2||y<2||x>MW-3||y>MH-3)continue;const a=Math.atan2(y-cy,x-cx),rr=r*(1+.16*Math.sin(a*3+ph)+.1*Math.sin(a*7+ph*1.7));if(Math.hypot(x+.5-cx,y+.5-cy)<rr)G.ter[idx(x,y)]=0}};
 const byTeam={};G.bases.forEach((b,i)=>(byTeam[teams[i]]||(byTeam[teams[i]]=[])).push(b));
 for(const bs of Object.values(byTeam)){for(const b of bs)blob(b.cx,b.cy,R);if(bs.length===2){const [a,b]=bs;for(let k=1;k<6;k++)blob(a.cx+(b.cx-a.cx)*k/6,a.cy+(b.cy-a.cy)*k/6,R*.8)}}
 const far=(x,y,d)=>G.bases.every(b=>Math.hypot(x-b.cx,y-b.cy)>d);
 for(let k=0,tr=0;k<Math.round(3*K)&&tr<300;tr++){const x=ri(10,MW-11),y=ri(10,MH-11);if(!far(x,y,R+12))continue;blob(x,y,ri(4,6));k++}}
function carveForest(open){const circ=(cx,cy,r)=>{for(let y=Math.floor(cy-r);y<=cy+r;y++)for(let x=Math.floor(cx-r);x<=cx+r;x++)if(inb(x,y)&&Math.hypot(x+.5-cx,y+.5-cy)<r)open[idx(x,y)]=1};
 const line=(ax,ay,bx,by,w)=>{const d=Math.hypot(bx-ax,by-ay),n=Math.ceil(d),ph=rnd()*6;for(let i=0;i<=n;i++){const k=i/n,nx=-(by-ay)/d,ny=(bx-ax)/d,off=Math.sin(k*Math.PI*2+ph)*3*Math.sin(k*Math.PI);circ(ax+(bx-ax)*k+nx*off,ay+(by-ay)*k+ny*off,w)}};
 for(const b of G.bases){circ(b.cx,b.cy,11);line(b.cx,b.cy,MW/2,MH/2,1.6)}
 circ(MW/2,MH/2,7);const bs=G.bases.slice().sort((a,b)=>Math.atan2(a.cy-MH/2,a.cx-MW/2)-Math.atan2(b.cy-MH/2,b.cx-MW/2));
 for(let i=0;i<bs.length;i++){const a=bs[i],b=bs[(i+1)%bs.length];if(bs.length>2||i===0)line(a.cx,a.cy,b.cx,b.cy,1.4)}
 for(let k=0;k<Math.round(6*NN/7744);k++)circ(ri(10,MW-10),ri(10,MH-10),ri(3,5))}
function cluster(type,cx,cy,n){cx=Math.round(cx);cy=Math.round(cy);if(!inb(cx,cy))return;const q=[[cx,cy]],seen=new Set([idx(cx,cy)]);let placed=0,g=0;
 while(q.length&&placed<n&&g++<400){const [x,y]=q.shift();if(free(x,y)&&G.ter[idx(x,y)]===0){mkRes(type,x,y);placed++}
  for(const [dx,dy] of [[1,0],[0,1],[-1,0],[0,-1]]){const nx=x+dx,ny=y+dy;if(!inb(nx,ny))continue;const k=idx(nx,ny);if(seen.has(k))continue;seen.add(k);q.push([nx,ny])}}}
function forest(cx,cy,n,far,clear){const rad=Math.sqrt(n)/1.5;let placed=0,tries=0;
 while(placed<n&&tries++<n*8){const a=rnd()*6.283,r=Math.sqrt(rnd())*rad;const x=Math.round(cx+Math.cos(a)*r*1.25),y=Math.round(cy+Math.sin(a)*r);
  if(!inb(x,y)||!free(x,y)||G.ter[idx(x,y)]!==0||!far(x,y,clear))continue;mkRes('tree',x,y);placed++}}
function coastDist(){const d=new Int16Array(NN).fill(99),q=[];for(let i=0;i<NN;i++)if(G.ter[i]!==1){d[i]=0;q.push(i)}
 for(let h=0;h<q.length;h++){const i=q[h],x=i%MW,y=(i/MW)|0;for(const [dx,dy] of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(!inb(nx,ny))continue;const j=ny*MW+nx;if(d[j]>d[i]+1){d[j]=d[i]+1;q.push(j)}}}return d}
function fish(type,K){const cd=coastDist(),cand=[];for(let i=0;i<NN;i++)if(G.ter[i]===1&&cd[i]>=2&&cd[i]<=3&&!G.occ[i])cand.push(i);if(!cand.length)return;
 const want=type==='islas'?Math.round(40*K):type==='continental'?Math.round(14*K):type==='rio'?Math.round(10*K):0;shuffle(cand);const placed=[];
 const put=i=>{const x=i%MW,y=(i/MW)|0;if(placed.some(j=>Math.abs(j%MW-x)+Math.abs(((j/MW)|0)-y)<3))return false;mkRes('fish',x,y);placed.push(i);return true};
 if(type==='islas')for(const b of G.bases){let n=0;const near=cand.filter(i=>Math.hypot(i%MW-b.cx,((i/MW)|0)-b.cy)<MW*.3).sort((a,c)=>Math.hypot(a%MW-b.cx,((a/MW)|0)-b.cy)-Math.hypot(c%MW-b.cx,((c/MW)|0)-b.cy));for(const i of near){if(n>=6)break;if(put(i))n++}}
 for(const i of cand){if(placed.length>=want)break;put(i)}}
function labelLand(){G.land=new Int16Array(NN).fill(-1);G.sea=new Int16Array(NN).fill(-1);let nl=0,ns=0;
 for(let s=0;s<NN;s++){const water=G.ter[s]===1,arr=water?G.sea:G.land;if(arr[s]>=0)continue;const id=water?ns++:nl++;arr[s]=id;const q=[s];
  for(let h=0;h<q.length;h++){const i=q[h],x=i%MW,y=(i/MW)|0;for(const [dx,dy] of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(!inb(nx,ny))continue;const j=ny*MW+nx;if(arr[j]>=0||(G.ter[j]===1)!==water)continue;arr[j]=id;q.push(j)}}}}
function genHeights(K,type){const H=new Float32Array(NN);const n=Math.round((type==='arabia'?ri(10,14):ri(6,10))*K);
 for(let k=0;k<n;k++){const cx=ri(4,MW-5),cy=ri(4,MH-5),r=ri(5,11),a=.7+rnd()*(type==='arabia'?1.9:1.4);
  for(let y=Math.max(0,cy-r*2);y<Math.min(MH,cy+r*2);y++)for(let x=Math.max(0,cx-r*2);x<Math.min(MW,cx+r*2);x++){const d2=(x-cx)**2+(y-cy)**2;H[y*MW+x]+=a*Math.exp(-d2/(r*r))}}
 const cd=coastDist(),land=new Int16Array(NN).fill(99),q=[];for(let i=0;i<NN;i++)if(G.ter[i]!==0){land[i]=0;q.push(i)}
 for(let h=0;h<q.length;h++){const i=q[h],x=i%MW,y=(i/MW)|0;for(const [dx,dy] of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(!inb(nx,ny))continue;const j=ny*MW+nx;if(land[j]>land[i]+1){land[j]=land[i]+1;q.push(j)}}}
 for(let i=0;i<NN;i++){if(G.ter[i]!==0){H[i]=0;continue}const x=i%MW,y=(i/MW)|0;let f=Math.min(1,land[i]/4);
  for(const b of G.bases){const d=Math.hypot(x+.5-b.cx,y+.5-b.cy);f*=Math.max(0,Math.min(1,(d-7)/5))}H[i]*=f}
 G.hgt=H}
function relics(type){const n=MW<80?3:MW<110?5:7;G.relicN=0;let tries=0;const pts=[];
 while(pts.length<n&&tries++<3000){const x=ri(4,MW-5),y=ri(4,MH-5);if(!free(x,y)||G.ter[idx(x,y)]!==0)continue;if(!G.bases.every(b=>Math.hypot(x-b.cx,y-b.cy)>15))continue;if(pts.some(([a,c])=>Math.hypot(a-x,c-y)<10))continue;pts.push([x,y])}
 for(const [x,y] of pts)mkRelic((x+.5)*T,(y+.5)*T);G.relicN=pts.length}

// ---------- A* (tierra con puertas por bando, o agua para barcos)
const gA=new Float32Array(MAXN),fromA=new Int32Array(MAXN),stA=new Int32Array(MAXN),clA=new Int32Array(MAXN);let stId=0;
const hI=new Int32Array(MAXN*8),hF=new Float32Array(MAXN*8);let hN=0,lastN=0;
function hpush(i,f){let k=hN++;while(k>0){const p=(k-1)>>1;if(hF[p]<=f)break;hI[k]=hI[p];hF[k]=hF[p];k=p}hI[k]=i;hF[k]=f}
function hpop(){const top=hI[0];hN--;const li=hI[hN],lf=hF[hN];let k=0;while(true){let c=2*k+1;if(c>=hN)break;if(c+1<hN&&hF[c+1]<hF[c])c++;if(hF[c]>=lf)break;hI[k]=hI[c];hF[k]=hF[c];k=c}hI[k]=li;hF[k]=lf;return top}
const DIRS=[[1,0,1],[-1,0,1],[0,1,1],[0,-1,1],[1,1,1.4142],[1,-1,1.4142],[-1,1,1.4142],[-1,-1,1.4142]];
function astar(sx,sy,test,hx,hy,maxN,o,nav){
 stId++;hN=0;const s=idx(sx,sy);gA[s]=0;stA[s]=stId;fromA[s]=-1;
 const ok=nav?navOK:(x,y)=>freeO(x,y,o);
 const H=(x,y)=>{const dx=Math.abs(x-hx),dy=Math.abs(y-hy);return Math.max(dx,dy)+.4142*Math.min(dx,dy)};
 hpush(s,H(sx,sy));let best=s,bestH=1e9,n=0;
 while(hN>0&&n<maxN){const c=hpop();if(clA[c]===stId)continue;clA[c]=stId;n++;
  const cx=c%MW,cy=(c/MW)|0;if(test(cx,cy)){best=c;bestH=-1;break}
  const hh=H(cx,cy);if(hh<bestH){bestH=hh;best=c}
  for(const [dx,dy,w] of DIRS){const nx=cx+dx,ny=cy+dy;if(!ok(nx,ny))continue;if(dx&&dy&&(!ok(cx+dx,cy)||!ok(cx,cy+dy)))continue;
   const ni=ny*MW+nx;if(clA[ni]===stId)continue;const ng=gA[c]+w;if(stA[ni]!==stId||ng<gA[ni]){stA[ni]=stId;gA[ni]=ng;fromA[ni]=c;if(hN<hI.length)hpush(ni,ng+H(nx,ny)*1.05)}}}
 lastN=n;const out=[];let c=best;while(c!==-1&&c!==s){out.push(c);c=fromA[c]}return out.reverse();
}
function pathTo(u,tx,ty,rect,inside){if(G.pb<=0||G.nb<1500)return false;G.pb--;
 tx=clampT(tx,MW);ty=clampT(ty,MH);const sx=clampT(u.x/T,MW),sy=clampT(u.y/T,MH),o=u.owner,nav=!!U[u.type].naval;
 let test,hx=tx,hy=ty;
 if(rect){const [x0,y0,x1,y1]=rect;hx=(x0+x1)/2;hy=(y0+y1)/2;
  test=inside?(x,y)=>x>=x0&&x<=x1&&y>=y0&&y<=y1:(x,y)=>x>=x0-1&&x<=x1+1&&y>=y0-1&&y<=y1+1}
 else if(nav?navOK(tx,ty):freeO(tx,ty,o))test=(x,y)=>x===tx&&y===ty;
 else{const f=nearFree(tx,ty,o,nav);if(f){tx=f[0];ty=f[1];hx=tx;hy=ty;test=(x,y)=>x===tx&&y===ty}else test=(x,y)=>Math.abs(x-tx)<=1&&Math.abs(y-ty)<=1}
 let maxN=Math.min(12000,G.nb);const lab=nav?G.sea:G.land;
 if(lab){const src=lab[idx(sx,sy)];if(src>=0){let reach=false;const [x0,y0,x1,y1]=rect||[tx,ty,tx,ty];
  for(let y=y0-1;y<=y1+1&&!reach;y++)for(let x=x0-1;x<=x1+1;x++)if(inb(x,y)&&lab[idx(x,y)]===src){reach=true;break}
  if(!reach)maxN=Math.min(maxN,500)}}
 u.path=astar(sx,sy,test,hx,hy,maxN,o,nav);G.nb-=lastN;u.pi=0;return true}
function stallCheck(u,ox,oy,dt){const mv=Math.hypot(u.x-(u.lx??ox),u.y-(u.ly??oy));u.lx=u.x;u.ly=u.y;
 if(mv<uSpeed(u)*dt*.35)u.stall=(u.stall||0)+dt;else u.stall=Math.max(0,(u.stall||0)-dt*2);
 if(u.stall>1.2&&u.pi<u.path.length){u.pi++;u.stall=.3}}
function step(u,dt){let sp=uSpeed(u)*dt;u.walk=true;const ox=u.x,oy=u.y,nav=!!U[u.type].naval;
 while(sp>0&&u.pi<u.path.length){const i=u.path[u.pi];if(nav?G.ter[i]!==1:!passable(i,u.owner)){u.gk=null;u.path=[];u.pi=0;return}
  const wx=(i%MW)*T+T/2,wy=((i/MW)|0)*T+T/2,dx=wx-u.x,dy=wy-u.y,d=Math.hypot(dx,dy),last=u.pi===u.path.length-1;
  if(d<=sp){u.x=wx;u.y=wy;sp-=d;u.pi++}
  else if(d<(last?T*.28:T*.42)&&(u.stall||0)>.25){u.pi++}
  else{u.x+=dx/d*sp;u.y+=dy/d*sp;u.dir=Math.atan2(dy,dx);sp=0}}
 stallCheck(u,ox,oy,dt)}
function travel(u,dt,key,tx,ty,rect,inside,fx,fy){
 if(u.gk!==key){if(!pathTo(u,tx,ty,rect,inside))return false;u.gk=key;u.fx=fx;u.fy=fy}
 if(u.pi<u.path.length){step(u,dt);return false}
 if(u.fx!=null){const dx=u.fx-u.x,dy=u.fy-u.y,d=Math.hypot(dx,dy);if(d>1.5&&!(d<T*.35&&(u.stall||0)>.5)&&(u.stall||0)<1.6){stallCheck(u,u.x,u.y,dt);const s=Math.min(d,uSpeed(u)*dt),nx=u.x+dx/d*s,ny=u.y+dy/d*s;if(!freeAtPx(nx,ny,u.owner,U[u.type].naval)){u.fx=null;return true}u.x=nx;u.y=ny;u.dir=Math.atan2(dy,dx);u.walk=true;return false}}
 return true;
}
function order(u,o){u.o=o;u.gk=null;u.path=[];u.pi=0}
function issue(u,o,q){if(q&&(u.o.t!=='idle'||u.oq.length)){u.oq.push(o);if(u.oq.length>12)u.oq.shift()}else{u.oq=[];order(u,o)}}
function approach(u,dt,e,want){const x0=e.tx*T,y0=e.ty*T,x1=x0+e.size*T,y1=y0+e.size*T;const qx=Math.max(x0,Math.min(x1,u.x)),qy=Math.max(y0,Math.min(y1,u.y));
 const dx=qx-u.x,dy=qy-u.y,d=Math.hypot(dx,dy);if(d<=want)return true;const s=Math.min(d-want+.5,uSpeed(u)*dt),nx=u.x+dx/d*s,ny=u.y+dy/d*s;
 if(!freeAtPx(nx,ny,u.owner,U[u.type].naval)&&!(e.kind==='bld'&&B[e.type].farm))return false;u.x=nx;u.y=ny;u.dir=Math.atan2(dy,dx);u.walk=true;return true}
function nearFree(tx,ty,o,nav){for(let r=1;r<8;r++)for(let y=ty-r;y<=ty+r;y++)for(let x=tx-r;x<=tx+r;x++){if(Math.max(Math.abs(x-tx),Math.abs(y-ty))!==r)continue;if(nav?navOK(x,y):freeO(x,y,o))return[x,y]}return null}
function freeTileNear(b,gx,gy,nav){let best=null,bd=1e9;const ok=nav?navOK:free;
 for(let r=1;r<=7&&!best;r++){for(let y=b.ty-r;y<b.ty+b.size+r;y++)for(let x=b.tx-r;x<b.tx+b.size+r;x++){
  if(x>b.tx-r&&x<b.tx+b.size+r-1&&y>b.ty-r&&y<b.ty+b.size+r-1)continue;if(!ok(x,y))continue;
  const d=Math.hypot(x+.5-gx,y+.5-gy)+rnd()*.3;if(d<bd){bd=d;best=[x,y]}}}return best}
function landNear(px,py,gx,gy){const tx=clampT(px/T,MW),ty=clampT(py/T,MH);let best=null,bd=1e9;
 for(let r=1;r<=3;r++)for(let y=ty-r;y<=ty+r;y++)for(let x=tx-r;x<=tx+r;x++){if(!free(x,y))continue;const d=Math.hypot(x+.5-gx,y+.5-gy)+r*2;if(d<bd){bd=d;best=[x,y]}}return best}

// ---------- búsquedas
function workerOn(r){const w=G.ents.get(r.wk);return w&&!w.dead&&w.o.t==='gather'&&w.o.id===r.id}
function findRes(rt,x,y,maxD,owner,farms,ex,fish){const hum=!P(owner).ai,exp=hum?expOf(owner):null;fish=!!fish;
 const lab=fish?G.sea:G.land,src=lab?lab[idx(clampT(x/T,MW),clampT(y/T,MH))]:-1;
 let best=ringSearch(rgrid(),x,y,maxD,e=>{if(e.dead||e.amt<=0||e.id===ex||fish!==(e.type==='fish')||RDEF[e.type].r!==rt)return -1;const i=idx(e.tx,e.ty);if(exp&&!exp[i])return -1;if(src>=0&&lab[i]!==src)return -1;return Math.hypot(e.x-x,e.y-y)});
 if(farms&&rt==='food'){let bd=best?Math.hypot(best.x-x,best.y-y):maxD;for(const e of G.bl){if(e.dead||e.owner!==owner||!B[e.type].farm||e.bp<1||e.id===ex)continue;if(e.wk&&workerOn(e))continue;const d=Math.hypot(e.x-x,e.y-y);if(d<bd){bd=d;best=e}}}
 return best}
function nearestDrop(owner,a,fish){let best=null,bd=1e9;for(const e of G.bl){if(e.dead||e.kind!=='bld'||e.owner!==owner||e.bp<1)continue;const dr=B[e.type].drop;if(!dr||(fish?dr!=='fish':dr!==true))continue;const d=entDist(a,e);if(d<bd){bd=d;best=e}}return best}
function canHit(s,e){if(e.kind!=='unit')return true;const sn=s.kind==='unit'?!!U[s.type].naval:false,tn=!!U[e.type].naval;if(s.kind!=='unit')return true;const rg=gd(s.type,s.owner).ranged;if(tn&&!sn&&!rg)return false;if(sn&&!rg)return false;return true}
function nearestEnemy(s,range,mode){let bu=null,bd=range,bb=null,bbd=range;const hum=!P(s.owner).ai,vis=hum?visOf(s.owner):null;
 if(mode!=='bld')gridEach(ugrid(),s.x,s.y,range+T,e=>{if(e.dead||e.gar||!isEnemy(s.owner,e.owner))return;const d=Math.hypot(e.x-s.x,e.y-s.y);if(d<bd){if(vis&&!vis[tidx(e)])return;if(!canHit(s,e))return;bd=d;bu=e}});
 if(mode!=='units'&&!bu)gridEach(bgrid(),s.x,s.y,range+3*T,e=>{if(e.dead||!isEnemy(s.owner,e.owner))return;const d=entDist(s,e)+(B[e.type].wall?3*T:0);if(d<bbd){bbd=d;bb=e}});
 return bu||bb}

// ---------- combate
function unitDmg(u,t){const d=gd(u.type,u.owner);let a=uAtk(u);
 if(d.bonus||u.type==='spear'){if(t.kind==='unit')a+=uBonus(u.type,u.owner,U[t.type].cls);if(t.kind==='bld')a+=uBonus(u.type,u.owner,'bld')}
 const arm=t.kind==='unit'?uArmor(t,!!d.ranged):bArmor(t.type,t.owner);
 let dmg=Math.max(1,a-arm);if(t.kind==='bld'){if(d.ranged&&!d.fullBld&&u.type!=='mangonel'&&u.type!=='galley')dmg=Math.max(1,dmg*.3);if(u.type==='villager')dmg=1.5}return dmg*elevK(u,t)}
function visFor0(x,y){return G.vis[idx(clampT(x/T,MW),clampT(y/T,MH))]===1}
function shoot(s,t,dmg){const h0=s.kind==='bld'?(s.type==='tower'?2.4:s.type==='castle'?2.2:1.7):.45;const d=Math.hypot(t.x-s.x,t.y-s.y),kind=u2k(s),pk=PK[kind]||PK.arrow;
 G.proj.push({k:0,kind,x:s.x,y:s.y,h:h0,sx:s.x,sy:s.y,h0,tid:t.id,tx:t.x,ty:t.y,dmg,owner:s.owner,src:s.id,dur:Math.max(pk[0]>1000?.08:.22,d/pk[0]),arc:(.2+d/T*.07)*pk[1],vx:0,vy:0,vh:0});
 if(isAlly(s.owner,ME())||visFor0(s.x,s.y))ev('shoot',{x:s.x,y:s.y,k:kind})}
const u2k=s=>s.kind==='unit'?(gd(s.type,s.owner).proj||(s.type==='almogavar'?'javelin':s.type==='axeman'?'axe':'arrow')):BPROJ[ageOf(s.owner)]||'arrow';
function lob(u,t){const d=Math.hypot(t.x-u.x,t.y-u.y),kind=gd(u.type,u.owner).proj||'stone',sp=kind==='rocket'?1.8:kind==='stone'?1:1.3;
 G.proj.push({k:0,kind,x:u.x,y:u.y,h:.7,sx:u.x,sy:u.y,h0:.7,tid:0,tx:t.x,ty:t.y,owner:u.owner,src:u.id,splash:U.mangonel.splash*T*(kind==='stone'?1:1.15),dur:Math.max(.5,d/(260*sp)),arc:(.8+d/T*.18)/sp,vx:0,vy:0,vh:0});
 if(isAlly(u.owner,ME())||visFor0(u.x,u.y))ev('lob',{x:u.x,y:u.y,k:kind})}
function splash(p){const src={type:'mangonel',owner:p.owner,kind:'unit',id:p.src,x:p.tx,y:p.ty,dead:true},hit=[];
 const f=e=>{if(e.dead||inGar(e)||!isEnemy(p.owner,e.owner))return;const d=e.kind==='unit'?Math.hypot(e.x-p.tx,e.y-p.ty):entDist({x:p.tx,y:p.ty},e);if(d<=p.splash)hit.push([e,d])};
 gridEach(ugrid(),p.tx,p.ty,p.splash+T,f);gridEach(bgrid(),p.tx,p.ty,p.splash+3*T,f);
 for(const [e,d] of hit)damage(e,unitDmg(src,e)*(1-.45*d/p.splash),src)
 ev('impact',{x:p.tx,y:p.ty,k:p.kind})}
function updProj(dt){for(const p of G.proj){const t=p.tid?G.ents.get(p.tid):null;if(t&&!t.dead&&!inGar(t)){p.tx=t.x;p.ty=t.y}
 p.k+=dt/p.dur;const k=Math.min(1,p.k);const nx=p.sx+(p.tx-p.sx)*k,ny=p.sy+(p.ty-p.sy)*k,nh=p.h0*(1-k)+(p.splash?.1:.35)*k+Math.sin(k*Math.PI)*p.arc;
 p.vx=nx-p.x;p.vy=ny-p.y;p.vh=nh-p.h;p.x=nx;p.y=ny;p.h=nh;
 if(p.k>=1){p.done=true;if(!p.splash&&EXPL[p.kind]&&(isAlly(p.owner,ME())||visFor0(p.tx,p.ty)))ev('boom',{x:p.tx,y:p.ty,k:p.kind});if(p.splash)splash(p);else if(t&&!t.dead&&!inGar(t))damage(t,p.dmg,G.ents.get(p.src)||{owner:p.owner,id:p.src,kind:'x',dead:true})}}
 G.proj=G.proj.filter(p=>!p.done)}
// un solo aviso por combate: mientras sigan los golpes no se repite; vuelve a avisar tras 15 s de calma
function underAttack(t){if(G.alertT>0){G.alertT=Math.max(G.alertT,15);return}G.alertT=25;msg(t.kind==='bld'?'¡Están atacando tus edificios!':'¡Te están atacando!',true);sfx('alert');ev('ping',{x:t.x,y:t.y})}
function reachOf(u,t){const d=gd(u.type,u.owner);return d.ranged?uRange(u)*T:(d.range*T+u.r+(t.kind==='unit'?t.r:4))}
function damage(t,dmg,src){if(t.dead)return;t.hp-=dmg;t.hitT=.18;
 if(isEnemy(src.owner,t.owner)){if(t.owner===ME())underAttack(t);const A=G.ai[t.owner];if(A)A.hit={x:t.x,y:t.y,t:G.t,bld:t.kind==='bld'}}
 if(t.kind==='unit'&&src.kind==='unit'&&!src.dead&&!src.gar&&U[t.type].atk>0&&t.type!=='villager'&&!U[t.type].bldOnly&&t.o.t==='idle'&&canHit(t,src)){
  if(t.st===2){if(Math.hypot(src.x-t.x,src.y-t.y)<=reachOf(t,src))order(t,{t:'atk',id:src.id,auto:true,hold:true})}
  else order(t,{t:'atk',id:src.id,auto:true,then:{t:'move',x:t.x,y:t.y},leash:t.st===1?{x:t.x,y:t.y}:null})}
 if(t.hp<=0)kill(t,src.owner)}
function dropRelic(r,x,y){r.holder=0;r.x=x;r.y=y}
function kill(e,by,silent){if(e.dead)return;const wall=e.kind==='bld'&&B[e.type].wall;
 if(e.kind==='unit'){P(e.owner).stats.lost++;if(by!=null&&by>=0&&isEnemy(by,e.owner))P(by).stats.killed++;
  if(e.relic){const r=G.ents.get(e.relic);if(r)dropRelic(r,e.x,e.y);e.relic=0}
  if(e.cargo&&e.cargo.length){for(const id of e.cargo){const c=G.ents.get(id);if(c&&!c.dead){c.gar=0;kill(c,by,true)}}e.cargo=[]}
  if(e.gar){const c=G.ents.get(e.gar);if(c){const l=contents(c);const i=l.indexOf(e.id);if(i>=0)l.splice(i,1)}}}
 else if(e.kind==='bld'){
  if(!silent){if(by!=null&&by>=0&&isEnemy(by,e.owner))P(by).stats.razed++;if(!wall){if(e.owner===ME())msg('Has perdido: '+B[e.type].name,true);else if(by===ME())msg('Has destruido: '+B[e.type].name)}}
  if(e.gar&&e.gar.length)ungarrison(e,e.x,e.y+T*3);
  for(const q of e.q){const p=P(e.owner);if(q.k==='age')p.aging=false;if(q.k.startsWith('t:'))delete p.tq[q.k.slice(2)]}
  for(const rid of e.relics||[]){const r=G.ents.get(rid);if(r)dropRelic(r,e.x+(rnd()-.5)*T*2,e.y+T*(e.size/2+.6))}e.relics=[];
  if(G.wonder&&G.wonder.id===e.id){G.wonder=null;msg('La maravilla ha sido destruida',true)}}
 ev('die',{id:e.id,kind:e.kind,type:e.type,owner:e.owner,x:e.x,y:e.y});remove(e)}
function convert(t,no){const old=t.owner;P(old).stats.lost++;P(no).stats.converted=(P(no).stats.converted||0)+1;
 t.owner=no;order(t,{t:'idle'});t.oq=[];t.carry={t:null,a:0};ev('convert',{id:t.id,from:old,to:no,x:t.x,y:t.y});
 if(t.cargo&&t.cargo.length)for(const id of t.cargo){const c=G.ents.get(id);if(c)c.owner=no}
 if(old===ME())msg('¡Un monje enemigo ha convertido a una de tus unidades!',true);else if(no===ME())msg('Has convertido una unidad enemiga');
 if(isAlly(old,ME())||isAlly(no,ME())||visFor0(t.x,t.y))sfx('convert')}

// ---------- guarnición
const contents=c=>c.kind==='unit'?(c.cargo||(c.cargo=[])):(c.gar||(c.gar=[]));
function garCap(c){const g=GAR[c.type];return g?g.n:0}
function canEnter(u,c){const g=GAR[c.type];if(!g||c.dead||c.owner!==u.owner||c===u)return false;if(c.kind==='bld'&&c.bp<1)return false;if(!g.cls.includes(U[u.type].cls)||U[u.type].naval)return false;return contents(c).length<g.n}
function enter(u,c){contents(c).push(u.id);u.gar=c.id;u.o={t:'idle'};u.oq=[];u.path=[];u.gk=null;u.x=c.x;u.y=c.y;u.walk=false;u.work=false;if(u.owner===ME())ev('gar',{id:u.id})}
function ungarrison(c,gx,gy,only){const l=contents(c),keep=[];
 for(const id of l){const u=G.ents.get(id);if(!u||u.dead)continue;if(only&&!only(u)){keep.push(id);continue}
  let t=c.kind==='unit'?landNear(c.x,c.y,gx,gy):freeTileNear(c,gx/T,gy/T);
  if(!t){keep.push(id);continue}u.gar=0;u.x=(t[0]+.5)*T+(rnd()-.5)*8;u.y=(t[1]+.5)*T+(rnd()-.5)*8;
  if(u.bell&&u.prev){order(u,u.prev)}u.bell=false;u.prev=null}
 if(c.kind==='unit')c.cargo=keep;else c.gar=keep;return l.length-keep.length}
function ringBell(pl){const p=P(pl);const conts=G.bl.filter(e=>!e.dead&&e.owner===pl&&e.kind==='bld'&&e.bp>=1&&GAR[e.type]);
 if(!p.bell){if(!conts.length)return;const room=new Map(conts.map(c=>[c.id,garCap(c)-c.gar.length]));
  for(const u of G.ul){if(!act(u)||u.owner!==pl||u.type!=='villager')continue;let best=null,bd=26*T;for(const c of conts){if(room.get(c.id)<=0)continue;const d=entDist(u,c);if(d<bd){bd=d;best=c}}
   if(!best)continue;room.set(best.id,room.get(best.id)-1);u.prev=u.o.t==='gather'||u.o.t==='build'?u.o:null;u.bell=true;u.oq=[];order(u,{t:'gar',id:best.id})}
  p.bell=true;if(pl===ME()){msg('¡Campana! Los aldeanos se refugian');sfx('alert')}}
 else{for(const c of conts)ungarrison(c,c.x,c.y+T*3,u=>u.bell);for(const u of G.ul)if(act(u)&&u.owner===pl&&u.bell){u.bell=false;if(u.o.t==='gar')order(u,u.prev||{t:'idle'});u.prev=null}
  p.bell=false;if(pl===ME()){msg('Todos a trabajar');sfx('click')}}}

// ---------- unidades
function deposit(u,p){if(u.carry.a>0&&u.carry.t){p.res[u.carry.t]+=u.carry.a;p.stats.gathered+=u.carry.a}u.carry.a=0;u.carry.t=null}
function adjSame(u,rt){let r=null;gridEach(rgrid(),u.x,u.y,T*1.6,e=>{if(r||e.dead||e.type==='fish'||RDEF[e.type].r!==rt||e.amt<=0)return;if(Math.abs(e.x-u.x)>T*1.6||Math.abs(e.y-u.y)>T*1.6)return;if(entDist(u,e)<=T*.8)r=e});return r}
function doGather(u,dt,o){
 const p=P(u.owner),fishing=u.type==='fishship';
 if(o.s==='ret'){
  let dp=o.dp&&G.ents.get(o.dp);if(!dp||dp.dead||dp.owner!==u.owner){dp=nearestDrop(u.owner,u,fishing);o.dp=dp?dp.id:0}
  if(!dp){if(u.owner===ME())msgT('drop',fishing?'Necesitas un muelle para entregar el pescado':'Necesitas un almacén o un centro urbano para entregar recursos',true);order(u,{t:'idle'});return}
  if(entDist(u,dp)<=T*(fishing?1.2:.85)){deposit(u,p);o.s='go';o.fail=0;o.dp=0;u.gk=null;return}
  if(travel(u,dt,'d'+dp.id,dp.tx,dp.ty,rectOf(dp),false)){if(entDist(u,dp)<T*1.6&&approach(u,dt,dp,T*(fishing?1.1:.8)))return;o.fail=(o.fail||0)+.8;u.gk=null;if(o.fail>6)order(u,{t:'idle'})}
  return}
 let r=G.ents.get(o.id);
 const isF=r&&r.kind==='bld';
 const bad=!r||r.dead||r.amt<=0||(isF&&(r.bp<1||r.owner!==u.owner||(r.wk&&r.wk!==u.id&&workerOn(r))));
 if(bad||(o.fail||0)>2.5){
  if((o.fail||0)>2.5){o.rf=(o.rf||0)+1;if(o.rf>3){u.stuckT=G.t;order(u,{t:'idle'});return}}
  const nr=findRes(o.rt,u.x,u.y,(fishing?16:12)*T,u.owner,!fishing&&o.rt==='food',(o.fail||0)>2.5?o.id:0,fishing);o.fail=0;
  if(!nr){if(u.carry.a>0){o.s='ret';return}order(u,{t:'idle'});return}
  o.id=nr.id;u.gk=null;r=nr}
 if(u.carry.a>0&&u.carry.t!==o.rt){o.s='ret';return}
 const farm=r.kind==='bld';
 const near=farm?(u.x>r.tx*T+2&&u.x<(r.tx+r.size)*T-2&&u.y>r.ty*T+2&&u.y<(r.ty+r.size)*T-2):entDist(u,r)<=T*(fishing?.95:.8);
 if(near){
  u.path=[];u.pi=0;u.gk=null;u.work=true;u.task=farm?'farm':fishing?'fish':(r.type==='tree'?'chop':r.type==='berry'?'forage':'mine');if(!farm)u.dir=Math.atan2(r.y-u.y,r.x-u.x);else r.wk=u.id;
  o.rf=0;o.acc=(o.acc||0)+gatherRate(u.owner,o.rt,farm,fishing)*dt;const cap=carryCap(u.owner,u.type);
  while(o.acc>=1){o.acc-=1;if(r.amt<=0)break;r.amt--;r.chg=true;u.carry.t=o.rt;u.carry.a++;
   if(r.amt<=0){if(farm){const fo=r.owner,ftx=r.tx,fty=r.ty;kill(r,-1,true);if(reseedFarm(fo,ftx,fty,u))return;if(fo===ME())msg('Una granja se ha agotado')}else{ev('depleted',{id:r.id,type:r.type,x:r.x,y:r.y});remove(r)}}
   if(u.carry.a>=cap){o.s='ret';break}}
  return}
 let arrived;
 if(farm){const cx=(r.tx+r.size/2)*T,cy=(r.ty+r.size/2)*T;arrived=travel(u,dt,'f'+r.id,r.tx,r.ty,rectOf(r),true,cx+(rnd()-.5)*24,cy+(rnd()-.5)*24)}
 else arrived=travel(u,dt,'g'+r.id,r.tx,r.ty,rectOf(r),false);
 if(arrived){if(!farm){if(entDist(u,r)<T*1.3&&approach(u,dt,r,T*.7))return;if(!fishing){const a=adjSame(u,o.rt);if(a){o.id=a.id;return}}}o.fail=(o.fail||0)+.9;u.gk=null}
}
// resembrado automático: la granja agotada se vuelve a plantar en el mismo sitio (si hay madera) y el mismo granjero la levanta
function reseedFarm(pl,tx,ty,u){const p=P(pl);if(!p||!p.autoFarm)return null;const c=B.farm.cost;
 if(!canAfford(p,c)){if(pl===ME()&&G.t-(p.rsMsg||-99)>20){p.rsMsg=G.t;msg('Sin madera para resembrar la granja',true)}return null}
 if(!canPlace('farm',tx,ty,pl))return null;pay(p,c);const b=mkBld('farm',pl,tx,ty,false);order(u,{t:'build',id:b.id});if(pl===ME())msg('Granja resembrada');return b}
function doBuild(u,dt,o){
 const b=G.ents.get(o.id);
 if(!b||b.dead||b.owner!==u.owner||(b.bp>=1&&b.hp>=b.maxhp)){
  if(u.oq.length){order(u,{t:'idle'});return}
  if(b&&!b.dead&&b.owner===u.owner){
   if(B[b.type].farm&&(!b.wk||!workerOn(b))){order(u,{t:'gather',id:b.id,rt:'food',s:'go'});return}
   if(b.type==='store'){for(const rt of['wood','gold','stone']){const r=findRes(rt,b.x,b.y,6*T,u.owner,false);if(r){order(u,{t:'gather',id:r.id,rt,s:'go'});return}}}
  }
  let nb=null,nd=10*T;for(const e of G.bl){if(!e.dead&&e.owner===u.owner&&e.bp<1){const d=Math.hypot(e.x-u.x,e.y-u.y);if(d<nd){nd=d;nb=e}}}
  if(nb){order(u,{t:'build',id:nb.id});return}
  order(u,{t:'idle'});return}
 if(entDist(u,b)<=T*.85){u.path=[];u.pi=0;u.gk=null;u.work=true;u.task='build';u.dir=Math.atan2(b.y-u.y,b.x-u.x);
  const bt=B[b.type].time/buildRate(u.owner);
  if(b.bp<1){b.bp=Math.min(1,b.bp+dt/bt);b.hp=Math.min(b.maxhp,b.hp+b.maxhp*.95*dt/bt);if(b.bp>=1)onBuilt(b)}
  else b.hp=Math.min(b.maxhp,b.hp+b.maxhp*.5*dt/bt);
  return}
 if(travel(u,dt,'b'+b.id,b.tx,b.ty,rectOf(b),false)){if(entDist(u,b)<T*1.3&&approach(u,dt,b,T*.75))return;o.fail=(o.fail||0)+.6;u.gk=null;if(o.fail>4)order(u,{t:'idle'})}
}
function onBuilt(b){b.bp=1;P(b.owner).stats.built++;ev('built',{id:b.id});
 if(b.owner===ME()&&!B[b.type].wall){msg('Construcción terminada: '+B[b.type].name);sfx('built')}
 if(B[b.type].wonder&&!G.wonder){G.wonder={id:b.id,owner:b.owner,t0:G.t};if(G.cfg.win!=='conquest')msg((b.owner===ME()?'Tu maravilla':'La maravilla de '+P(b.owner).name)+' está terminada: '+Math.round(WONDER_T/60)+' minutos para la victoria',!isAlly(b.owner,ME()));sfx('age')}
 if(!B[b.type].farm)for(const u of G.ul){if(!act(u)||U[u.type].naval)continue;const tx=clampT(u.x/T,MW),ty=clampT(u.y/T,MH);
  if(tx>=b.tx&&tx<b.tx+b.size&&ty>=b.ty&&ty<b.ty+b.size){if(B[b.type].gate&&isAlly(u.owner,b.owner))continue;const f=freeTileNear(b,tx+.5,ty+.5);if(f){u.x=(f[0]+.5)*T;u.y=(f[1]+.5)*T;u.gk=null}}}}
function chase(u,dt,t,o){const pre='a'+t.id+':',tx=clampT(t.x/T,MW),ty=clampT(t.y/T,MH),key=pre+tx+','+ty,nav=!!U[u.type].naval;
 if(!u.gk||!u.gk.startsWith(pre)||(u.gk!==key&&u.rp<=0)){if(pathTo(u,tx,ty,null,false)){u.gk=key;u.rp=.5;u.fx=null}}
 if(u.pi<u.path.length)step(u,dt);
 else{const dx=t.x-u.x,dy=t.y-u.y,dd=Math.hypot(dx,dy)||1,s=uSpeed(u)*dt,nx=u.x+dx/dd*s,ny=u.y+dy/dd*s;
  if(freeAtPx(nx,ny,u.owner,nav)){u.x=nx;u.y=ny;u.walk=true;u.dir=Math.atan2(dy,dx)}else{u.gk=null;o.fail=(o.fail||0)+dt;if(o.fail>3)return false}}
 return true}
function doAttack(u,dt,o){
 const t=G.ents.get(o.id);
 if(!t||t.dead||inGar(t)||!isEnemy(u.owner,t.owner)||!canHit(u,t)){order(u,o.then||{t:'idle'});return}
 const d=gd(u.type,u.owner);
 if(d.bldOnly&&t.kind==='unit'){order(u,o.then||{t:'idle'});return}
 const reach=reachOf(u,t);
 const dist=entDist(u,t);
 if(o.leash&&Math.hypot(u.x-o.leash.x,u.y-o.leash.y)>5*T&&dist>reach){order(u,{t:'move',x:o.leash.x,y:o.leash.y});return}
 if(d.minr&&dist<d.minr*T){if(o.auto){order(u,o.then||{t:'idle'});return}
  const k=uSpeed(u)*dt/(dist||1),ax=u.x-(t.x-u.x)*k,ay=u.y-(t.y-u.y)*k;if(freeAtPx(ax,ay,u.owner)){u.x=ax;u.y=ay;u.walk=true}else order(u,o.then||{t:'idle'});return}
 if(dist<=reach){u.path=[];u.pi=0;u.gk=null;u.dir=Math.atan2(t.y-u.y,t.x-u.x);
  if(u.cd<=0){u.cd=d.rof;u.atkAnim=.32;
   if(u.type==='mangonel')lob(u,t);else if(d.ranged)shoot(u,t,unitDmg(u,t));
   else{damage(t,unitDmg(u,t),u);if(isAlly(u.owner,ME())||visFor0(u.x,u.y))ev('hit',{x:t.x,y:t.y,k:u.type==='ram'?'ram':'melee'})}}
  return}
 if(o.hold){order(u,{t:'idle'});return}
 if(o.auto&&Math.hypot(t.x-u.x,t.y-u.y)>(d.sight+5)*T){order(u,o.then||{t:'idle'});return}
 if(!P(u.owner).ai&&t.kind==='unit'&&!visOf(u.owner)[tidx(t)]&&o.auto){order(u,o.then||{t:'idle'});return}
 u.rp-=dt;
 if(t.kind==='unit'){if(!chase(u,dt,t,o))order(u,o.then||{t:'idle'})}
 else if(travel(u,dt,'a'+t.id,t.tx,t.ty,rectOf(t),false)){if(!d.ranged&&entDist(u,t)<T*1.4&&approach(u,dt,t,reach-2))return;o.fail=(o.fail||0)+dt+.3;u.gk=null;if(o.fail>3)order(u,o.then||{t:'idle'})}
}
function doMonk(u,dt,o){const t=G.ents.get(o.id),conv=o.t==='conv';
 if(!t||t.dead||t.gar||t.kind!=='unit'||(conv?(!isEnemy(u.owner,t.owner)||u.relic):(!isAlly(u.owner,t.owner)||t.hp>=t.maxhp))){order(u,{t:'idle'});return}
 const dist=Math.hypot(t.x-u.x,t.y-u.y),rg=(conv?U.monk.range:3.5)*T;
 if(dist<=rg){u.path=[];u.pi=0;u.gk=null;u.dir=Math.atan2(t.y-u.y,t.x-u.x);
  if(conv){if(u.faith<1){o.ch=0;u.chan=0;return}u.work=true;u.task='conv';o.ch=(o.ch||0)+dt;u.chan=o.ch/convTime(u.owner);
   if(o.ch>=convTime(u.owner)){u.faith=0;u.chan=0;convert(t,u.owner);order(u,{t:'idle'})}}
  else{u.work=true;u.task='heal';t.hp=Math.min(t.maxhp,t.hp+healRate(u.owner)*dt)}
  return}
 if(o.ch)o.ch=Math.max(0,o.ch-dt*.5);u.chan=o.ch?o.ch/convTime(u.owner):0;u.rp-=dt;if(!chase(u,dt,t,o))order(u,{t:'idle'})}
function doGar(u,dt,o){const c=G.ents.get(o.id);
 if(c&&c.type==='monastery'&&u.relic&&c.owner===u.owner&&!c.dead&&c.bp>=1){
  if(entDist(u,c)<=T*.9){const r=G.ents.get(u.relic);if(r){r.holder=c.id;c.relics.push(r.id);r.x=c.x;r.y=c.y}u.relic=0;order(u,{t:'idle'});if(u.owner===ME()){msg('Reliquia guardada en el monasterio');sfx('tech')}return}
  if(travel(u,dt,'g'+c.id,c.tx,c.ty,rectOf(c),false)){if(entDist(u,c)<T*1.3&&approach(u,dt,c,T*.85))return;o.fail=(o.fail||0)+.6;u.gk=null;if(o.fail>4)order(u,{t:'idle'})}return}
 if(!c||!canEnter(u,c)){if(u.bell&&u.prev){order(u,u.prev);u.bell=false;u.prev=null}else order(u,{t:'idle'});return}
 if(c.kind==='unit'){if(Math.hypot(c.x-u.x,c.y-u.y)<=T*1.4){enter(u,c);return}
  const tx=clampT(c.x/T,MW),ty=clampT(c.y/T,MH),key='gt'+c.id+':'+tx+','+ty;
  if(u.gk!==key){if(pathTo(u,tx,ty,null,false))u.gk=key}
  if(u.pi<u.path.length)step(u,dt);else{const dx=c.x-u.x,dy=c.y-u.y,dd=Math.hypot(dx,dy)||1,s=uSpeed(u)*dt,nx=u.x+dx/dd*s,ny=u.y+dy/dd*s;if(freeAtPx(nx,ny,u.owner)){u.x=nx;u.y=ny;u.walk=true}else{o.fail=(o.fail||0)+dt;if(o.fail>8)order(u,{t:'idle'})}}
  return}
 if(entDist(u,c)<=T*.9){enter(u,c);return}
 if(travel(u,dt,'g'+c.id,c.tx,c.ty,rectOf(c),false)){if(entDist(u,c)<T*1.3&&approach(u,dt,c,T*.85))return;o.fail=(o.fail||0)+.6;u.gk=null;if(o.fail>4)order(u,{t:'idle'})}}
function doRelic(u,dt,o){const r=G.ents.get(o.id);if(!r||r.holder||u.relic||u.type!=='monk'){order(u,{t:'idle'});return}
 if(Math.hypot(r.x-u.x,r.y-u.y)<=T*.8){r.holder=u.id;u.relic=r.id;if(u.owner===ME()){msg('Reliquia recogida: llévala a un monasterio');sfx('tech')}
  const m=nearestOwn(u,'monastery');order(u,m?{t:'gar',id:m.id}:{t:'idle'});return}
 if(travel(u,dt,'r'+r.id,r.x/T,r.y/T,null,false,r.x,r.y)){o.fail=(o.fail||0)+.5;u.gk=null;if(o.fail>4)order(u,{t:'idle'})}}
function nearestOwn(u,type){let best=null,bd=1e9;for(const e of (U[type]?G.ul:G.bl)){if(e.dead||e.owner!==u.owner||e.type!==type||(e.kind==='bld'&&e.bp<1))continue;const d=entDist(u,e);if(d<bd){bd=d;best=e}}return best}
function tradeGold(a,b){const d=Math.hypot(a.x-b.x,a.y-b.y)/T;return Math.round(.46*d*(d/MW+.3))}
function doTrade(u,dt,o){const a=G.ents.get(o.a),b=G.ents.get(o.b);if(!a||a.dead||!b||b.dead||!isAlly(u.owner,b.owner)){order(u,{t:'idle'});return}
 const tg=o.leg?b:a;if(entDist(u,tg)<=T*.9){const g=Math.round(tradeGold(a,b)*(a.owner!==b.owner?1.2:1));P(u.owner).res.gold+=g;P(u.owner).stats.gathered+=g;o.leg=1-o.leg;u.gk=null;o.fail=0;return}
 if(travel(u,dt,'t'+tg.id,tg.tx,tg.ty,rectOf(tg),false)){if(entDist(u,tg)<T*1.3&&approach(u,dt,tg,T*.85))return;o.fail=(o.fail||0)+.6;u.gk=null;if(o.fail>5)order(u,{t:'idle'})}}
function doUnload(u,dt,o){if(travel(u,dt,'u'+o.x+','+o.y,o.x/T,o.y/T,null,false)){const n=ungarrison(u,o.x,o.y);if(!n&&u.cargo.length){o.fail=(o.fail||0)+1;if(o.fail<4){u.gk=null;return}}order(u,{t:'idle'})}}
function idle(u,dt){u.scan-=dt;if(u.scan>0)return;u.scan=.4;
 const d=U[u.type],ai=P(u.owner).ai,nav=!!d.naval;
 const tx=clampT(u.x/T,MW),ty=clampT(u.y/T,MH);
 if(nav?G.ter[idx(tx,ty)]!==1:!passable(idx(tx,ty),u.owner)){const f=nearFree(tx,ty,u.owner,nav);if(f)order(u,{t:'move',x:(f[0]+.5)*T,y:(f[1]+.5)*T});return}
 if(u.type==='villager'||u.type==='trade'||u.type==='fishship'||u.type==='transport')return;
 if(u.type==='monk'){let best=null,bd=d.sight*T;
  for(const e of G.ul){if(!act(e)||e===u||!isAlly(u.owner,e.owner)||e.hp>=e.maxhp||U[e.type].naval)continue;const dd=Math.hypot(e.x-u.x,e.y-u.y);if(dd<bd){bd=dd;best=e}}
  if(best){order(u,{t:'heal',id:best.id,auto:true});return}
  if(ai&&u.relic){const m=nearestOwn(u,'monastery');if(m)order(u,{t:'gar',id:m.id});return}
  if(ai&&u.faith>=1){let tg=null,td=d.sight*T;for(const e of G.ul){if(!act(e)||!isEnemy(u.owner,e.owner)||U[e.type].naval)continue;const dd=Math.hypot(e.x-u.x,e.y-u.y)-(e.type==='knight'||e.type==='mangonel'?3*T:0);if(dd<td){td=dd;tg=e}}if(tg){order(u,{t:'conv',id:tg.id,auto:true});return}}
  if(ai&&DIFF[G.cfg.diff].relics&&nearestOwn(u,'monastery')){let r=null,rd=1e9;for(const e of G.rel){if(e.dead||e.holder)continue;if(G.land&&G.land[tidx(e)]!==G.land[tidx(u)])continue;const dd=Math.hypot(e.x-u.x,e.y-u.y);if(dd<rd){rd=dd;r=e}}if(r)order(u,{t:'relic',id:r.id})}
  return}
 const range=u.st===2?reachOf(u,{kind:'unit',r:8}):d.sight*T;
 const e=nearestEnemy(u,range,d.bldOnly?'bld':null);
 if(e){if(u.type==='mangonel'&&e.kind==='unit'&&Math.hypot(e.x-u.x,e.y-u.y)<d.minr*T)return;
  order(u,{t:'atk',id:e.id,auto:true,hold:u.st===2,leash:u.st===1?{x:u.x,y:u.y}:null,then:u.st===2?null:{t:'move',x:u.x,y:u.y}})}}
function updUnit(u,dt){
 u.cd=Math.max(0,u.cd-dt);u.atkAnim=Math.max(0,u.atkAnim-dt);if(u.hitT)u.hitT=Math.max(0,u.hitT-dt);u.walk=false;u.work=false;u.anim+=dt;
 if(u.type==='monk'&&u.faith<1)u.faith=Math.min(1,u.faith+dt/20);
 if(u.o.t==='idle'&&u.oq.length)order(u,u.oq.shift());
 const o=u.o;
 switch(o.t){
  case'idle':idle(u,dt);break;
  case'move':if(travel(u,dt,'m'+o.x+','+o.y,o.x/T,o.y/T,null,false,freeAtPx(o.x,o.y,u.owner,U[u.type].naval)?o.x:null,o.y))order(u,o.then||{t:'idle'});break;
  case'amove':{if(U[u.type].atk>0){u.scan-=dt;if(u.scan<=0){u.scan=.3;const d=gd(u.type,u.owner);const e=nearestEnemy(u,d.sight*T,d.bldOnly?'bld':null);if(e&&!(u.type==='mangonel'&&e.kind==='unit'&&Math.hypot(e.x-u.x,e.y-u.y)<d.minr*T)){order(u,{t:'atk',id:e.id,auto:true,then:o});break}}}
   if(travel(u,dt,'m'+o.x+','+o.y,o.x/T,o.y/T,null,false,freeAtPx(o.x,o.y,u.owner,U[u.type].naval)?o.x:null,o.y))order(u,{t:'idle'});break}
  case'gather':doGather(u,dt,o);break;
  case'build':doBuild(u,dt,o);break;
  case'atk':doAttack(u,dt,o);break;
  case'heal':case'conv':doMonk(u,dt,o);break;
  case'gar':doGar(u,dt,o);break;
  case'relic':doRelic(u,dt,o);break;
  case'trade':doTrade(u,dt,o);break;
  case'unload':doUnload(u,dt,o);break;
  case'dep':{const b=G.ents.get(o.id);if(!b||b.dead){order(u,{t:'idle'});break}
   if(entDist(u,b)<=T*.85){deposit(u,P(u.owner));order(u,o.back||{t:'idle'});break}
   if(travel(u,dt,'d'+b.id,b.tx,b.ty,rectOf(b),false)){o.fail=(o.fail||0)+.6;u.gk=null;if(o.fail>4)order(u,{t:'idle'})}break}
 }
 if(u.cargo)for(const id of u.cargo){const c=G.ents.get(id);if(c){c.x=u.x;c.y=u.y}}
}
function separate(){const us=[];for(const e of G.ul)if(!e.dead&&!e.gar)us.push(e);
 us.sort((a,b)=>a.x-b.x);const n=us.length;
 for(let i=0;i<n;i++){const a=us[i],an=!!U[a.type].naval;for(let j=i+1;j<n;j++){const b=us[j];const dx=b.x-a.x;if(dx>28)break;const dy=b.y-a.y;if(dy>28||dy<-28)continue;
  if(an!==!!U[b.type].naval)continue;
  const mind=(a.r+b.r)*.78,d2=dx*dx+dy*dy;if(d2>=mind*mind)continue;const d=Math.sqrt(d2)||.01,ov=(mind-d)*.5;
  const nx=d>.02?dx/d:rnd()-.5,ny=d>.02?dy/d:rnd()-.5;
  const wa=a.work?.15:(a.walk?.35:1),wb=b.work?.15:(b.walk?.35:1);
  const ax=a.x-nx*ov*wa,ay=a.y-ny*ov*wa,bx=b.x+nx*ov*wb,by=b.y+ny*ov*wb;
  if(freeAtPx(ax,ay,a.owner,an)){a.x=ax;a.y=ay}if(freeAtPx(bx,by,b.owner,an)){b.x=bx;b.y=by}}}}

// ---------- edificios, producción, investigación y mercado
function enqueue(b,k,n){const p=P(b.owner),me=b.owner===ME(),err=t=>{if(me){msg(t,true);sfx('err')}return false};
 if(!b||b.bp<1||b.dead)return false;n=n||1;let ok=false;
 for(let i=0;i<n;i++){
  if(b.q.length>=5)return ok||err('La cola está llena');
  if(k==='age'){if(b.type!=='tc'||p.aging||p.age>=MAXAGE)return ok;const c=AGECOST[p.age];if(!canAfford(p,c))return ok||err('Recursos insuficientes');
   pay(p,c);p.aging=true;b.q.push({k:'age',t:0,tot:AGETIME[p.age],cost:c});if(me)sfx('click');return true}
  if(k.startsWith('t:')){const id=k.slice(2),t=TECH[id];if(!t||t.at!==b.type)return ok;const st=techState(p,id);if(st!=='ok')return st==='age'?err('Requiere la '+AGES[t.age]):ok;
   if(!canAfford(p,t.cost))return ok||err('Recursos insuficientes');pay(p,t.cost);p.tq[id]=1;b.q.push({k,t:0,tot:t.time,cost:t.cost});if(me)sfx('click');return true}
  if(!trainsOf(b).includes(k)||!unitAvail(p,k))return ok;
  const c=unitCost(b.owner,k);if(!canAfford(p,c))return ok||err('Recursos insuficientes');
  pay(p,c);b.q.push({k,t:0,tot:trainTime(b.owner,b,k),cost:c});if(me)sfx('click');ok=true}
 return ok}
function cancelQ(b,i){const q=b.q[i];if(!q)return;const p=P(b.owner);refund(p,q.cost);if(q.k==='age')p.aging=false;if(q.k.startsWith('t:'))delete p.tq[q.k.slice(2)];b.q.splice(i,1)}
function applyTech(o,id){const p=P(o),t=TECH[id];p.tech[id]=1;delete p.tq[id];
 if(t.up){(p.up||(p.up={}))[t.up]=1;const dh=UPG[t.up].hp;for(const e of G.ul)if(!e.dead&&e.owner===o&&e.type===t.up){e.maxhp=uMaxHp(e.type,o);e.hp=Math.min(e.maxhp,e.hp+dh)}}
 if(id==='masonry')for(const e of G.list){if(e.dead||e.kind!=='bld'||e.owner!==o)continue;const nm=bMaxHp(e.type,o);e.hp*=nm/e.maxhp;e.maxhp=nm}
 if(id==='plow')for(const e of G.list){if(!e.dead&&e.kind==='bld'&&e.owner===o&&B[e.type].farm){e.amt+=100;e.max+=100;e.chg=true}}
 if(o===ME()){msg('Investigación completada: '+t.name);sfx('tech')}}
function spawnFrom(b,k){const p=P(b.owner),nav=!!U[k].naval;let gx=MW/2,gy=MH/2;if(b.rally){gx=b.rally.x/T;gy=b.rally.y/T}
 const t=freeTileNear(b,gx,gy,nav)||(nav?null:[b.tx,b.ty+b.size]);if(!t)return null;const u=mkUnit(k,b.owner,(t[0]+.5)*T,(t[1]+.5)*T);p.pop++;p.stats.trained++;
 if(b.owner===ME())sfx('train');
 if(b.rally){const re=b.rally.id&&G.ents.get(b.rally.id);
  if(re&&!re.dead&&k==='villager'&&(re.kind==='res'&&re.type!=='fish'||(re.kind==='bld'&&B[re.type].farm)))order(u,{t:'gather',id:re.id,rt:re.kind==='res'?RDEF[re.type].r:'food',s:'go'});
  else if(re&&!re.dead&&k==='fishship'&&re.type==='fish')order(u,{t:'gather',id:re.id,rt:'food',s:'go'});
  else order(u,{t:'move',x:b.rally.x,y:b.rally.y})}
 return u}
function updBld(b,dt){if(b.hitT)b.hitT=Math.max(0,b.hitT-dt);if(b.bp<1)return;const p=P(b.owner),d=B[b.type];
 if(b.q.length){const q=b.q[0],unit=q.k!=='age'&&!q.k.startsWith('t:');
  if(unit&&p.pop>=p.cap){q.blocked=true;if(b.owner===ME())msgT('pop',p.cap>=POPMAX?'Población máxima alcanzada':'Población al límite: construye casas',true)}
  else{q.blocked=false;q.t+=dt;if(q.t>=q.tot){
   if(q.k==='age'){b.q.shift();ageUp(b.owner);p.aging=false;if(b.owner===ME()){msg('Has avanzado a la '+AGES[p.age]);sfx('age')}else if(isEnemy(ME(),b.owner))msg(p.name+' ha avanzado a la '+AGES[p.age],true)}
   else if(!unit){b.q.shift();applyTech(b.owner,q.k.slice(2))}
   else if(spawnFrom(b,q.k))b.q.shift();else q.t=q.tot}}}
 if(b.gar.length)for(const id of b.gar){const u=G.ents.get(id);if(u&&u.hp<u.maxhp)u.hp=Math.min(u.maxhp,u.hp+dt)}
 if(b.relics.length){p.res.gold+=b.relics.length*.5*dt}
 if(b.type==='tc'&&p.age>=3)p.res.gold+=.3*(p.age-2)*dt;
 if(d.atk){b.cd-=dt;if(b.cd<=0){const t=nearestEnemy(b,(bRange(b)+b.size/2)*T,'units');
  if(t){const n=Math.min(12,(d.arrows||1)+b.gar.length);for(let i=0;i<n;i++)shoot(b,t,Math.max(1,bAtk(b)-uArmor(t,true))*elevK(b,t));b.cd=d.rof*(p.age>=5?.6:1)}else b.cd=.3}}}
// al avanzar de edad, las unidades y edificios existentes se reequipan: su vida escala en proporción
function ageUp(o){const p=P(o);p.age++;
 for(const e of G.list){if(e.dead||e.owner!==o)continue;
  if(e.kind==='unit'){const m=uMaxHp(e.type,o);if(m!==e.maxhp){e.hp=Math.max(1,e.hp*m/e.maxhp);e.maxhp=m}}
  else if(e.kind==='bld'){const m=bMaxHp(e.type,o);if(m!==e.maxhp){e.hp=Math.max(1,e.hp*m/e.maxhp);e.maxhp=m;e.chg=true}}}}
function hasMarket(pl){return G.bl.some(e=>!e.dead&&e.owner===pl&&e.type==='market'&&e.bp>=1)}
function marketTrade(pl,op,r){const p=P(pl),me=pl===ME();if(!hasMarket(pl)||!G.price[r])return false;const pr=G.price[r];
 if(op==='buy'){const c=Math.round(pr);if(p.res.gold<c){if(me){msg('No tienes oro suficiente',true);sfx('err')}return false}p.res.gold-=c;p.res[r]+=100;G.price[r]=Math.min(999,pr+6)}
 else{if(p.res[r]<100){if(me){msg('Necesitas 100 de '+RN[r].toLowerCase(),true);sfx('err')}return false}p.res[r]-=100;p.res.gold+=Math.round(pr*.7);G.price[r]=Math.max(20,pr-6)}
 if(me)sfx('click');return true}

// ---------- movimiento en formación
const RANK={inf:0,cav:0,vil:1,arc:1,monk:2,siege:2,trade:2,ship:1};
function formMove(us,wx,wy,am,q){const n=us.length;if(!n)return;
 let cx=0,cy=0;for(const u of us){cx+=u.x;cy+=u.y}cx/=n;cy/=n;
 let fx=wx-cx,fy=wy-cy;const fl=Math.hypot(fx,fy)||1;fx/=fl;fy/=fl;const px=-fy,py=fx;
 const cols=Math.max(1,Math.ceil(Math.sqrt(n*1.8))),sp=T*(us.some(u=>U[u.type].naval)?1.1:.74);
 const gs=n>1?Math.min(...us.map(u=>uSpeed({type:u.type,owner:u.owner,o:{}}))):0;
 const sorted=us.slice().sort((a,b)=>(RANK[U[a.type].cls]-RANK[U[b.type].cls])||(((a.x-cx)*px+(a.y-cy)*py)-((b.x-cx)*px+(b.y-cy)*py)));
 const rows=Math.ceil(n/cols);
 sorted.forEach((u,i)=>{const r=(i/cols)|0,inRow=r<rows-1?cols:n-cols*(rows-1),c=i%cols;
  const lat=(c-(inRow-1)/2)*sp,back=r*sp;let x=wx+px*lat-fx*back,y=wy+py*lat-fy*back;if(!freeAtPx(x,y,u.owner,U[u.type].naval)){x=wx;y=wy}
  const mil=U[u.type].atk>0&&u.type!=='villager';
  issue(u,am&&mil?{t:'amove',x,y,gs:gs&&n>1?gs:0}:{t:'move',x,y,gs:gs&&n>1?gs:0},q)})}

// ---------- IA
function aiUpdate(dt){for(const p of G.players){if(!p.ai||p.out)continue;const A=G.ai[p.i];A.tick-=dt;if(A.tick>0)continue;A.tick=DIFF[G.cfg.diff].tick;aiThink(p,A)}}
function enemyComp(me){const c={inf:0,arc:0,cav:0,siege:0,monk:0,vil:0,ship:0,trade:0,towers:0,walls:0,n:0};
 for(const e of G.ul){if(e.dead||!isEnemy(me,e.owner))continue;c[U[e.type].cls]++;if(e.type!=='villager')c.n++}
 for(const e of G.bl){if(e.dead||!isEnemy(me,e.owner))continue;if(e.type==='tower'||e.type==='castle')c.towers++;if(B[e.type].wall)c.walls++}return c}
function coastOK(tx,ty,s){let w=0;for(let y=ty-1;y<=ty+s;y++)for(let x=tx-1;x<=tx+s;x++){if(x>=tx&&x<tx+s&&y>=ty&&y<ty+s)continue;if(inb(x,y)&&G.ter[idx(x,y)]===1)w++}return w>=3}
function sameLand(a,b){return !G.land||G.land[tidx(a)]===G.land[tidx(b)]}
function coastTarget(from,tg){// casilla de agua junto a la costa enemiga más cercana al objetivo
 const sea=G.sea[tidx(from)];if(sea<0)return null;let best=null,bd=1e9;const lt=G.land[tidx(tg)];
 for(let y=1;y<MH-1;y++)for(let x=1;x<MW-1;x++){const i=idx(x,y);if(G.ter[i]!==1||G.sea[i]!==sea)continue;let adj=null;
  for(const [dx,dy] of[[1,0],[-1,0],[0,1],[0,-1]]){const j=idx(x+dx,y+dy);if(G.ter[j]!==1&&G.land[j]===lt&&!G.block[j]){adj=[x+dx,y+dy];break}}
  if(!adj)continue;const d=Math.hypot(x*T-tg.x,y*T-tg.y);if(d<bd){bd=d;best={wx:(x+.5)*T,wy:(y+.5)*T,lx:(adj[0]+.5)*T,ly:(adj[1]+.5)*T}}}
 return best}
function aiThink(p,A){
 const me=p.i,D=DIFF[G.cfg.diff];
 const blds=G.bl.filter(e=>!e.dead&&e.owner===me),units=G.ul.filter(e=>!e.dead&&e.owner===me);
 const free_=units.filter(u=>!u.gar);
 const vills=free_.filter(u=>u.type==='villager'),army=free_.filter(u=>U[u.type].atk>0&&u.type!=='villager'&&!U[u.type].naval),monks=free_.filter(u=>u.type==='monk');
 const ships=free_.filter(u=>U[u.type].naval),fishers=ships.filter(u=>u.type==='fishship'),galleys=ships.filter(u=>u.type==='galley'),transports=ships.filter(u=>u.type==='transport');
 const tc=blds.find(b=>b.type==='tc'&&b.bp>=1);
 const anchor=tc||blds.find(b=>!B[b.type].wall)||units[0];if(!anchor)return;
 const home={x:anchor.x,y:anchor.y};
 const has=t=>blds.filter(b=>b.type===t),building=t=>has(t).some(b=>b.bp<1);
 for(const b of blds)if(b.bp<1&&!vills.some(v=>v.o.t==='build'&&v.o.id===b.id)){const v=pickBuilder(vills,b);if(v)order(v,{t:'build',id:b.id})}
 let mix=[{food:.5,wood:.42,gold:.06,stone:.02},{food:.45,wood:.33,gold:.17,stone:.05},{food:.42,wood:.3,gold:.21,stone:.07}][Math.min(2,p.age)];if(p.age>2)mix={food:.4,wood:.2,gold:.3,stone:.1};
 const isl=G.cfg.map==='islas';
 if(isl&&p.age>0){const m2=Object.assign({},mix);m2.wood+=.1;m2.food-=.1;mix=m2}
 let saving=false;
 if(tc){const qV=tc.q.filter(q=>q.k==='villager').length,aging=tc.q.some(q=>q.k==='age');
  if(p.age<D.maxAge&&!p.aging&&vills.length>=D.ageV+Math.min(p.age,2)*7+Math.max(0,p.age-2)*2){saving=true;if(canAfford(p,AGECOST[p.age])&&tc.q.length===0)enqueue(tc,'age')}
  if(!aging&&vills.length+qV<D.vil+Math.min(p.age,2)*3+Math.max(0,p.age-2)*4&&tc.q.length<2&&canAfford(p,U.villager.cost)&&!(saving&&p.res.food<AGECOST[p.age].food+50))enqueue(tc,'villager')}
 else if(p.age>=1&&vills.length>=4&&!building('tc'))aiBuild(p,'tc',home,2,9,vills);
 const qTot=blds.reduce((s,b)=>s+b.q.filter(q=>q.k!=='age'&&!q.k.startsWith('t:')).length,0);
 if(p.cap<POPMAX&&p.pop+qTot+(p.pop>40?8:3)>=p.cap&&has('house').filter(b=>b.bp<1).length<(p.pop>40?2:1))aiBuild(p,'house',home,3,10,vills);
 // prioridades con reserva de madera: almacén junto al bosque y primer cuartel
 let holdW=0;
 if(!building('store'))for(const rt of['wood','gold']){const r=findRes(rt,home.x,home.y,45*T,me,false);if(!r)continue;const dp=nearestDrop(me,r);if(dp&&entDist(r,dp)<5*T)continue;
  if(rt==='wood'&&!canAfford(p,B.store.cost))holdW=100;else aiBuild(p,'store',r,1,4,vills);break}
 if(vills.length>=D.bar&&has('barracks').length<(p.age>=1?2:1)&&!building('barracks')){if(!has('barracks').length&&!canAfford(p,B.barracks.cost))holdW=Math.max(holdW,150);else aiBuild(p,'barracks',home,5,12,vills)}
 const woodOK=c=>!holdW||p.res.wood-holdW>=(c.wood||0);
 // muelle y pesca
 const fishNear=findRes('food',home.x,home.y,26*T,me,false,0,true);
 if(fishNear&&vills.length>=(isl?6:12)&&!has('dock').length&&!building('dock')){if(!A.dockSpot)A.dockSpot=findSpot('dock',(fishNear.x/T)|0,(fishNear.y/T)|0,2,10,me)||'none';if(A.dockSpot!=='none')aiBuildAt(p,'dock',A.dockSpot,vills)}
 const dock=has('dock').find(b=>b.bp>=1);
 if(dock){const wantF=Math.round(D.fish*(isl?1.5:1));if(fishers.length<wantF&&dock.q.length<2&&canAfford(p,U.fishship.cost)&&woodOK(U.fishship.cost))enqueue(dock,'fishship');
  for(const f of fishers)if(f.o.t==='idle'){const r=findRes('food',f.x,f.y,30*T,me,false,0,true);if(r)order(f,{t:'gather',id:r.id,rt:'food',s:'go'})}
  if(p.age>=1&&(isl||galleys.length<2)&&galleys.length<(isl?D.galleys:2)&&dock.q.length<2&&canAfford(p,U.galley.cost)&&woodOK(U.galley.cost)&&!saving)enqueue(dock,'galley')}
 if(p.age>=1){
  if(!has('range').length){if(!building('range'))aiBuild(p,'range',home,5,13,vills)}
  else if(!has('smith').length&&D.techs.length>4){if(!building('smith'))aiBuild(p,'smith',home,5,13,vills)}
  else if(!has('stable').length){if(!building('stable')&&vills.length>=16)aiBuild(p,'stable',home,5,13,vills)}
  else if(D.market&&!has('market').length){if(!building('market'))aiBuild(p,'market',home,6,14,vills)}
  else if(p.age>=2&&D.siege&&!has('siege').length){if(!building('siege'))aiBuild(p,'siege',home,5,13,vills)}
  else if(p.age>=2&&D.monks&&!has('monastery').length){if(!building('monastery'))aiBuild(p,'monastery',home,5,13,vills)}
  else if(p.age>=2&&D.castle&&!has('castle').length&&p.res.stone>=650){if(!building('castle')){const en=enemyBase(me,home);const at=en?{x:home.x+(en.x-home.x)*.15,y:home.y+(en.y-home.y)*.15}:home;aiBuild(p,'castle',at,4,12,vills)}}
  else if(has('tower').length<D.towers&&!building('tower')){const en=enemyBase(me,home);if(en){const tx=home.x+(en.x-home.x)*.12,ty=home.y+(en.y-home.y)*.12;aiBuild(p,'tower',{x:tx,y:ty},3,8,vills)}}
  else if(p.age>=2&&D.wonder&&!has('wonder').length&&!G.wonder&&army.length>=18&&p.res.wood>=1100&&p.res.gold>=1100&&p.res.stone>=1100)aiBuild(p,'wonder',home,5,14,vills);
 }
 if(!findRes('food',home.x,home.y,13*T,me,false)){const farms=has('farm').length,fb=has('farm').filter(b=>b.bp<1).length;if(farms<Math.ceil(vills.length*.5)&&fb<2&&(farms<4||woodOK(B.farm.cost)))aiBuild(p,'farm',home,3,10,vills)}
 // mercado: vende excedentes cuando falta oro
 if(hasMarket(me)){if(p.res.gold<150){for(const r of['stone','wood','food'])if(p.res[r]>(p.res.gold<60?400:900)){marketTrade(me,'sell',r);break}}
  else for(const r of['food','wood'])if(p.res[r]<60&&p.res.gold>=G.price[r]+60){marketTrade(me,'buy',r);break}}
 // investigaciones
 let reserve=null;
 if(saving){const ac=AGECOST[p.age];reserve={};for(const k in ac)reserve[k]=Math.round(ac[k]*.85);if(saving)for(const k in ac){mix=Object.assign({},mix);mix[k]=(mix[k]||0)+.06}}
 if(!saving||p.age>=D.maxAge)for(const id of D.techs){if(techState(p,id)!=='ok')continue;const t=TECH[id];const at=has(t.at).find(b=>b.bp>=1&&b.q.length<=(t.at==='tc'?1:0));
  if(!at)continue;if(canAfford(p,t.cost))enqueue(at,'t:'+id);else if(army.length>=Math.min(6,D.wave)&&!reserve)reserve=t.cost;break}
 const afford=c=>{for(const k in c)if(p.res[k]-((reserve&&reserve[k])||0)-(k==='wood'?holdW:0)<c[k])return false;return true};
 // producción militar
 const ec=enemyComp(me),cnt=t=>units.filter(u=>u.type===t).length;
 const rich=!saving||p.res.food>AGECOST[Math.min(1,p.age)].food+200;
 const invading=isl&&A.attacking;
 const capArmy=p.age===0&&!(A.hit&&G.t-A.hit.t<30)?(D.raid?5:3):1e9;
 for(const b of blds){const d=B[b.type];if(army.length>=capArmy)break;if(b.type==='tc'||b.type==='dock'||b.type==='market'||!d.trains||b.bp<1||b.q.length>=2)continue;
  const opts=trainsOf(b).filter(t=>unitAvail(p,t)&&afford(unitCost(me,t))&&(rich||!unitCost(me,t).food));if(!opts.length)continue;
  let best=null,bw=-1;for(const t of opts){let w=1+rnd()*.6;
   if(D.counter){if(t==='spear')w+=ec.cav*1.4;if(t==='militia')w+=ec.arc*.8+ec.siege*1.2;if(t==='archer')w+=ec.inf*1.2+.5;if(t==='knight')w+=ec.arc*1.4+ec.siege*1.5+.8;
    if(t==='scout')w=D.raid&&cnt('scout')<3?1.5:.3;if(t==='ram')w=cnt('ram')<3?1+ec.towers+ec.walls*.1:0;if(t==='mangonel')w=cnt('mangonel')<2&&ec.n>12?2:0;if(t==='monk')w=cnt('monk')<D.monks?3:0;
    if(U[t].unique)w=3+ec.n*.05}
   else if(t==='ram'||t==='mangonel'||t==='monk'||t==='scout')w=t==='scout'?.4:0;
   if(w>bw){bw=w;best=t}}
  if(best&&bw>0)enqueue(b,best)}
 // reparto de aldeanos
 const vc={food:0,wood:0,gold:0,stone:0};for(const v of vills)if(v.o.t==='gather')vc[v.o.rt]++;
 const want=rt=>Math.max(350,saving?(AGECOST[p.age][rt]||0)+150:0),need=rt=>mix[rt]*vills.length-vc[rt]-Math.max(0,p.res[rt]-want(rt))/120;
 for(const v of vills.filter(v=>v.o.t==='idle'&&!v.bell&&!(v.stuckT&&G.t-v.stuckT<20))){let best=null,bs=-1e9;for(const rt of RES){const s=need(rt);if(s>bs&&findRes(rt,home.x,home.y,48*T,me,rt==='food')){bs=s;best=rt}}
  if(!best)continue;const r=findRes(best,home.x,home.y,48*T,me,best==='food');if(r){order(v,{t:'gather',id:r.id,rt:best,s:'go'});vc[best]++}}
 A.rb=(A.rb||0)+1;
 if(A.rb>=8){A.rb=0;let over=null,ov=1e9,lack=null,lv=-1e9;
  for(const rt of RES){const s=need(rt);if(vc[rt]>1&&s<ov){ov=s;over=rt}if(s>lv){lv=s;lack=rt}}
  if(over&&lack&&over!==lack&&lv-ov>2.5){let moved=0;
   for(const v of vills){if(moved>=2)break;if(v.o.t!=='gather'||v.o.rt!==over)continue;const r=findRes(lack,home.x,home.y,48*T,me,lack==='food');if(!r)break;order(v,{t:'gather',id:r.id,rt:lack,s:'go'});moved++}}
  if(lack==='food'&&!findRes('food',home.x,home.y,48*T,me,true)&&!building('farm'))aiBuild(p,'farm',home,3,10,vills)}
 // defensa y campana
 const intr=[];for(const e of G.ul)if(act(e)&&isEnemy(me,e.owner)&&!U[e.type].naval&&Math.hypot(e.x-home.x,e.y-home.y)<16*T)intr.push(e);
 const recent=A.hit&&G.t-A.hit.t<15;
 if(D.bell){if(intr.length>=3&&army.length<intr.length&&!p.bell&&G.t-(A.bellT||-99)>30){ringBell(me);A.bellT=G.t}
  else if(p.bell&&!intr.length&&G.t-(A.bellT||0)>15){ringBell(me);A.bellT=G.t}}
 if(intr.length||(recent&&A.hit.bld&&D!==DIFF.easy)){const tgts=intr.length?intr:null;
  for(const a of army.concat(monks)){if(a.o.t==='atk'||a.o.t==='conv'||a.o.t==='gar')continue;
   if(tgts){let n=null,nd=1e9;for(const e of tgts){if(U[a.type].bldOnly)break;const dd=Math.hypot(e.x-a.x,e.y-a.y);if(dd<nd){nd=dd;n=e}}if(n&&nd<30*T)order(a,a.type==='monk'?{t:'conv',id:n.id}:{t:'atk',id:n.id})}
   else order(a,{t:'amove',x:A.hit.x,y:A.hit.y})}
  return}
 if(A.passive)return;
 if(A.inv){aiInvasion(p,A,army,transports,dock,galleys);return}
 const idleArmy=army.filter(a=>a.o.t==='idle'||(a.o.t==='move'&&!A.attacking));
 const late=G.t>2100;if((G.t>A.next&&army.length>=(late?Math.min(A.wave,10):A.wave))||army.length>=A.wave+12||(late&&G.t>A.next&&p.pop>=p.cap-5)){const tg=playerTarget(home,me);
  if(tg){if(!sameLand(anchor,tg)){const there=army.filter(a=>(a.o.t==='idle'||a.o.t==='move')&&sameLand(a,tg));if(there.length)formMove(there,tg.x,tg.y,true);
    if(dock&&p.age>=1){const needT=Math.min(4,Math.ceil(army.length/10));if(transports.length<needT){if(dock.q.filter(q=>q.k==='transport').length+transports.length<needT&&canAfford(p,U.transport.cost))enqueue(dock,'transport')}
     else A.inv={st:'load',t0:G.t,tg:{x:tg.x,y:tg.y}}}}
   else{formMove(army.concat(monks),tg.x,tg.y,true);A.next=G.t+D.interval;A.wave=Math.min(26,A.wave+2);A.attacking=true;
    if(tg.owner===ME()&&isEnemy(ME(),me)){msg('¡Un ejército de '+p.name+' avanza hacia tu aldea!',true);sfx('alert')}}
   if(galleys.length>=2){const ct=coastTarget(galleys[0],tg);if(ct)formMove(galleys,ct.wx,ct.wy,true)}}}
 else if(A.attacking){const far=army.filter(a=>a.o.t==='idle'&&Math.hypot(a.x-home.x,a.y-home.y)>20*T);
  if(far.length){const tg=playerTarget({x:far[0].x,y:far[0].y},me);if(tg&&sameLand(far[0],tg))formMove(far,tg.x,tg.y,true)}}
 if(D.raid&&G.t>260&&G.t>(A.raidT||0)){const cav=idleArmy.filter(a=>U[a.type].cls==='cav');
  if(cav.length>=2){let tv=null,td=1e9;for(const e of G.ul){if(!act(e)||e.type!=='villager'||!isEnemy(me,e.owner)||!sameLand(cav[0],e))continue;const d=Math.hypot(e.x-home.x,e.y-home.y);if(d<td){td=d;tv=e}}
   if(tv){formMove(cav,tv.x,tv.y,true);A.raidT=G.t+150}}}
}
function aiInvasion(p,A,army,transports,dock,galleys){const I=A.inv,D=DIFF[G.cfg.diff];const homeL=G.land[tidx(G.bl.find(b=>!b.dead&&b.owner===p.i&&b.type==='tc')||dock)];army=army.filter(a=>a.gar||G.land[tidx(a)]===homeL);
 if(!transports.length||!dock||G.t-I.t0>150){A.inv=null;A.next=G.t+60;return}
 if(I.st==='load'){if(!I.wait){I.wait=shoreWait(dock,homeL);if(!I.wait){A.inv=null;return}for(const s of transports)order(s,{t:'move',x:(I.wait[0]+.5)*T,y:(I.wait[1]+.5)*T})}
  let k=0;for(const a of army){if(a.gar||a.o.t==='gar')continue;const s=transports[Math.floor(k/10)%transports.length];k++;if(canEnter(a,s))order(a,{t:'gar',id:s.id})}
  const loaded=transports.reduce((n,s)=>n+s.cargo.length,0);
  if(loaded>=Math.min(army.length+loaded,transports.length*10)||G.t-I.t0>60){const ct=coastTarget(transports[0],I.tg);if(!ct){A.inv=null;return}
   for(const s of transports)if(s.cargo.length)order(s,{t:'unload',x:ct.lx,y:ct.ly});for(const a of army)if(!a.gar&&a.o.t==='gar')order(a,{t:'idle'});
   if(galleys.length)formMove(galleys,ct.wx,ct.wy,true);I.st='sail';I.ct=ct}}
 else if(I.st==='sail'){const landed=army.filter(a=>!a.gar&&G.land[tidx(a)]===G.land[idx(clampT(I.tg.x/T,MW),clampT(I.tg.y/T,MH))]);
  if(transports.every(s=>!s.cargo.length||s.o.t==='idle')){if(landed.length){const tg=playerTarget({x:I.ct.lx,y:I.ct.ly},p.i)||I.tg;formMove(landed,tg.x,tg.y,true)}
   for(const s of transports){if(s.cargo.length)ungarrison(s,I.ct.lx,I.ct.ly);order(s,{t:'move',x:dock.x,y:dock.y+T*2})}
   A.inv=null;A.attacking=true;A.next=G.t+D.interval;A.wave=Math.min(26,A.wave+2)}}}
// casilla de agua pegada a tierra transitable de nuestra isla, cerca del muelle: ahí esperan los transportes para embarcar
function shoreWait(dock,landId){let best=null,bd=1e9;const cx=dock.x/T,cy=dock.y/T;
 for(let y=Math.max(1,(cy|0)-10);y<Math.min(MH-1,(cy|0)+10);y++)for(let x=Math.max(1,(cx|0)-10);x<Math.min(MW-1,(cx|0)+10);x++){const i=idx(x,y);if(G.ter[i]!==1)continue;
  let ok=false;for(const [dx,dy] of[[1,0],[-1,0],[0,1],[0,-1]]){const j=idx(x+dx,y+dy);if(G.ter[j]!==1&&!G.block[j]&&G.land[j]===landId){ok=true;break}}if(!ok)continue;
  const d=Math.hypot(x+.5-cx,y+.5-cy);if(d<bd){bd=d;best=[x,y]}}return best}
function enemyBase(me,from){let best=null,bd=1e9;for(const e of G.bl){if(e.dead||e.type!=='tc'||!isEnemy(me,e.owner))continue;const d=Math.hypot(e.x-from.x,e.y-from.y);if(d<bd){bd=d;best=e}}return best}
function playerTarget(from,me){if(G.wonder){const w=G.ents.get(G.wonder.id);if(w&&!w.dead&&isEnemy(me,w.owner))return w}
 let best=null,bd=1e9;for(const e of G.bl){if(e.dead||!isEnemy(me,e.owner)||B[e.type].wall)continue;const d=Math.hypot(e.x-from.x,e.y-from.y)*(B[e.type].farm?1.5:1);if(d<bd){bd=d;best=e}}
 if(!best)for(const e of G.ul){if(!act(e)||!isEnemy(me,e.owner))continue;const d=Math.hypot(e.x-from.x,e.y-from.y);if(d<bd){bd=d;best=e}}return best}
function pickBuilder(vills,b){let best=null,bd=1e9;for(const v of vills){if(v.o.t==='build'||v.bell)continue;const pen=v.o.t==='idle'?0:(v.o.t==='gather'&&(v.o.rt==='wood'||v.o.rt==='food')?6*T:12*T);const d=Math.hypot(v.x-b.x,v.y-b.y)+pen;if(d<bd){bd=d;best=v}}return best}
function aiBuild(p,type,near,rmin,rmax,vills){if(!canAfford(p,B[type].cost)||!bldAvail(p,type))return;
 const A=G.ai[p.i],key=type+':'+((near.x/T/4)|0)+','+((near.y/T/4)|0);if(A){A.ns=A.ns||{};if(A.ns[key]>G.t)return}
 const s=findSpot(type,(near.x/T)|0,(near.y/T)|0,rmin,rmax,p.i)||findSpot(type,(near.x/T)|0,(near.y/T)|0,rmax+1,rmax+(type==='store'?3:9),p.i);if(!s){if(A)A.ns[key]=G.t+12;return}aiBuildAt(p,type,s,vills)}
function aiBuildAt(p,type,s,vills){if(!canAfford(p,B[type].cost)||!bldAvail(p,type)||!canPlace(type,s[0],s[1],p.i))return;pay(p,B[type].cost);const b=mkBld(type,p.i,s[0],s[1],false);const v=pickBuilder(vills,b);if(v)order(v,{t:'build',id:b.id})}
function findSpot(type,cx,cy,rmin,rmax,o){const s=B[type].size;
 for(let r=rmin;r<=rmax;r++){const c=[];for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){if(Math.max(Math.abs(dx),Math.abs(dy))!==r)continue;const tx=cx+dx-(s>>1),ty=cy+dy-(s>>1);if(spotOK(type,tx,ty,o))c.push([tx,ty])}
  if(c.length)return c[Math.floor(rnd()*c.length)]}return null}
function spotOK(type,tx,ty,o){const s=B[type].size;if(!canPlace(type,tx,ty,o))return false;
 for(let y=ty-1;y<=ty+s;y++)for(let x=tx-1;x<=tx+s;x++){if(!inb(x,y))return false;const oc=G.occ[idx(x,y)];if(oc){const e=G.ents.get(oc);if(e&&e.kind==='bld')return false;if(e&&type!=='store'&&type!=='dock'&&e.kind==='res'&&e.type!=='fish')return false}}return true}

// ---------- visión por equipo (determinista) y memoria de la niebla (solo del jugador local)
function calcFog(){if(G.cfg.reveal==='all'){for(const t of G.humanTeams){G.visT[t].fill(1);G.expT[t].fill(1)}G.fogV++;return}
 for(const t of G.humanTeams)G.visT[t].fill(0);
 for(const L of[G.ul,G.bl])for(const e of L){if(e.dead||inGar(e))continue;const tm=P(e.owner).team,vis=G.visT[tm];if(!vis||!G.humanTeams.includes(tm))continue;const exp=G.expT[tm];
  const s=e.kind==='unit'?U[e.type].sight+(hAt(e.x,e.y)>1?1:0):(e.bp>=1?B[e.type].sight:2)+e.size/2;
  const cx=e.x/T,cy=e.y/T,x0=Math.max(0,Math.floor(cx-s)),x1=Math.min(MW-1,Math.ceil(cx+s)),y0=Math.max(0,Math.floor(cy-s)),y1=Math.min(MH-1,Math.ceil(cy+s)),s2=s*s;
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const dx=x+.5-cx,dy=y+.5-cy;if(dx*dx+dy*dy<=s2){const i=y*MW+x;vis[i]=1;exp[i]=1}}}
 G.fogV++;updMemory()}
function anyVis(e){const s=e.size||1;for(let y=e.ty;y<e.ty+s;y++)for(let x=e.tx;x<e.tx+s;x++)if(G.vis[idx(x,y)])return true;return false}
function updMemory(){if(!G.vis)return;const me=ME();
 for(const e of G.bl){if(e.dead||isAlly(e.owner,me))continue;if(anyVis(e))G.mem.set(e.id,{id:e.id,type:e.type,owner:e.owner,tx:e.tx,ty:e.ty,size:e.size,hp:e.hp,maxhp:e.maxhp,bp:e.bp,x:e.x,y:e.y})}
 for(const [id,m] of G.mem){const e=G.ents.get(id);if((!e||e.dead)&&anyVis(m))G.mem.delete(id)}}
function isVisible(e){if(e.kind==='unit')return !e.gar&&(isAlly(e.owner,ME())||G.vis[tidx(e)]===1);if(e.kind==='relic')return G.exp[tidx(e)]===1&&!e.holder;if(e.kind==='res')return G.exp[idx(e.tx,e.ty)]===1;return isAlly(e.owner,ME())||anyVis(e)}
function canPlace(type,tx,ty,owner){const s=B[type].size;let hmin=99,hmax=-99;
 for(let y=ty;y<ty+s;y++)for(let x=tx;x<tx+s;x++){if(!inb(x,y))return false;const i=idx(x,y);if(G.ter[i]!==0||G.occ[i])return false;if(!P(owner).ai&&!expOf(owner)[i])return false;const h=G.hgt?G.hgt[i]:0;if(h<hmin)hmin=h;if(h>hmax)hmax=h}
 if(hmax-hmin>.6&&!B[type].wall)return false;
 if(B[type].coast&&!coastOK(tx,ty,s))return false;return true}

// ---------- victoria
function eliminate(p){p.out=true;for(const e of G.list.slice())if(!e.dead&&e.owner===p.i)kill(e,-1,true);
 ev('elim',{p:p.i});if(p.i!==ME()){msg(p.name+(isEnemy(ME(),p.i)?' ha sido derrotado':' (tu aliado) ha caído'),!isEnemy(ME(),p.i));sfx(isEnemy(ME(),p.i)?'built':'alert')}}
function finish(team,how){if(G.over)return;G.over=true;G.winTeam=team;G.how=how;ev('over',{team,how,win:team!=null&&team===P(ME()).team})}
function checkEnd(){
 for(const p of G.players){if(p.out)continue;const alive=G.bl.some(e=>!e.dead&&e.owner===p.i&&!B[e.type].wall)||G.ul.some(e=>!e.dead&&e.owner===p.i&&e.type==='villager');if(!alive)eliminate(p)}
 const teams=new Set(G.players.filter(p=>!p.out).map(p=>p.team));
 if(G.cfg.win!=='conquest'){
  if(G.wonder){const w=G.ents.get(G.wonder.id);if(!w||w.dead)G.wonder=null;else if(G.t-G.wonder.t0>=WONDER_T)return finish(P(w.owner).team,'wonder')}
  if(G.relicN>0){let team=null,all=true;for(const e of G.rel){if(e.dead)continue;const h=e.holder&&G.ents.get(e.holder);if(!h||h.kind!=='bld'){all=false;break}const tm=P(h.owner).team;if(team==null)team=tm;else if(team!==tm){all=false;break}}
   if(all&&team!=null){if(!G.relicHold||G.relicHold.team!==team){G.relicHold={team,t0:G.t};msg(team===P(ME()).team?'Tu bando tiene todas las reliquias: '+Math.round(RELIC_T/60)+' minutos para la victoria':'Un bando rival tiene todas las reliquias',team!==P(ME()).team)}
    else if(G.t-G.relicHold.t0>=RELIC_T)return finish(team,'relics')}else G.relicHold=null}}
 if(!G.mp&&P(ME()).out)return finish([...teams][0]??null,'conquest');
 if(teams.size<=1)finish([...teams][0]??null,'conquest')}

// ---------- ciclo
function update(dt){if(!G||G.over)return;G.t+=dt;G.pb=40;G.nb=14000;G.ug=null;
 for(const p of G.players){p.pop=0;p.cap=0}
 for(const e of G.ul)if(!e.dead)P(e.owner).pop++;
 for(const e of G.bl)if(!e.dead&&e.bp>=1&&B[e.type].pop)P(e.owner).cap+=B[e.type].pop;
 for(const p of G.players)p.cap=Math.min(POPMAX,p.cap);
 const nu=G.ul.length;for(let i=0;i<nu;i++){const e=G.ul[i];if(!e.dead&&!e.gar)updUnit(e,dt)}
 const nb=G.bl.length;for(let i=0;i<nb;i++){const e=G.bl[i];if(!e.dead)updBld(e,dt)}
 for(const e of G.rel)if(e.holder){const h=G.ents.get(e.holder);if(!h||h.dead)e.holder=0;else if(h.kind==='unit'){e.x=h.x;e.y=h.y}}
 separate();updProj(dt);aiUpdate(dt);
 G.fogT-=dt;if(G.fogT<=0){G.fogT=.2;calcFog()}
 G.endT-=dt;if(G.endT<=0){G.endT=1;checkEnd();for(const r in G.price)G.price[r]+=(({food:100,wood:100,stone:130})[r]-G.price[r])*.004}
 G.histT-=dt;if(G.histT<=0){G.histT=30;G.hist.push({t:Math.round(G.t),s:G.players.map(p=>{let army=0;for(const e of G.ul)if(!e.dead&&e.owner===p.i&&e.type!=='villager'&&U[e.type].atk>0)army++;return{pop:p.pop,army,res:p.stats.gathered,score:score(p)}})})}
 G.alertT-=dt;
 if(G.dirty){const al=e=>!e.dead;G.list=G.list.filter(al);G.ul=G.ul.filter(al);G.bl=G.bl.filter(al);G.rl=G.rl.filter(al);G.rel=G.rel.filter(al);G.dirty=false}}
function score(p){return Math.round(p.stats.gathered*.1+p.stats.killed*6+p.stats.razed*25+Object.keys(p.tech).length*40+p.age*250+(p.stats.converted||0)*10)}
function teamsFor(n,mode){if(mode!=='teams'||n<3)return Array.from({length:n},(_,i)=>i);return n===3?[0,0,1]:[0,0,1,1]}
function newGame(cfg,s){cfg=Object.assign({diff:'normal',map:'continental',size:'medium',civ:'iberos',nAI:1,teams:'ffa',tutorial:false,win:'standard',reveal:'normal',me:0,mp:false},cfg||{});
 seed=(s||Date.now())%2147483647|0;if(!seed)seed=7;
 MW=MH=SIZES[cfg.size].n;NN=MW*MH;GW=Math.ceil(MW/GC);const D=DIFF[cfg.diff];
 let spec=cfg.players;if(!spec){const n=1+Math.max(1,Math.min(3,cfg.nAI)),teams=teamsFor(n,cfg.teams);const pool=shuffle(Object.keys(CIVS).filter(c=>c!==cfg.civ));
  spec=Array.from({length:n},(_,i)=>({civ:i===0?cfg.civ:pool[(i-1)%pool.length],team:teams[i],ai:i>0,name:i===0?'Tú':null}))}
 G={t:0,ents:new Map(),list:[],nid:1,proj:[],ev:[],cfg,over:false,win:null,dirty:false,fogT:0,endT:3,histT:1,alertT:0,msgT:{},fogV:0,pb:60,nb:30000,players:[],ai:{},visT:{},expT:{},me:cfg.me,mp:!!cfg.mp,
  price:{food:100,wood:100,stone:130},mem:new Map(),hist:[],wonder:null,relicHold:null,ul:[],bl:[],rl:[],rel:[],bv:0,rv:0};
 const used={};
 spec.forEach((sp,i)=>{const c=sp.civ;used[c]=(used[c]||0)+1;
  G.players.push({i,name:sp.name||(CIVS[c].name+(used[c]>1?' II':'')),ai:!!sp.ai,team:sp.team,civ:c,mult:1,res:{food:200,wood:200,gold:100,stone:200},age:0,aging:false,pop:0,cap:0,tech:{},tq:{},up:{},bell:false,out:false,autoFarm:true,
   stats:{trained:0,killed:0,lost:0,razed:0,built:0,gathered:0,converted:0}});
  if(sp.ai)G.ai[i]={tick:2+i*.37,next:D.first+rnd()*60,wave:D.wave,attacking:false,passive:!!cfg.tutorial}});
 initFogArrays();
 genMap(cfg.map,G.players.length,G.players.map(p=>p.team));
 G.bases.forEach((b,i)=>{const tc=mkBld('tc',i,b.x,b.y,true);for(let k=0;k<3;k++){const t=freeTileNear(tc,MW/2,MH/2)||[b.x,b.y+3];mkUnit('villager',i,(t[0]+.25+k*.25)*T,(t[1]+.3+(k%2)*.4)*T)}
  const t=freeTileNear(tc,MW/2,MH/2);if(t)mkUnit('scout',i,(t[0]+.5)*T,(t[1]+.5)*T)});
 G.list=G.list.filter(e=>!e.dead);reindex();calcFog();return G}
function initFogArrays(){G.humanTeams=[...new Set(G.players.filter(p=>!p.ai||p.i===G.me).map(p=>p.team))];
 for(const p of G.players){if(!G.visT[p.team]){G.visT[p.team]=new Uint8Array(NN);if(!G.expT[p.team]){G.expT[p.team]=new Uint8Array(NN);if(G.cfg.reveal==='explored'||G.cfg.reveal==='all')G.expT[p.team].fill(1)}}}
 G.vis=G.visT[G.players[G.me].team];G.exp=G.expT[G.players[G.me].team];if(!G.humanTeams.includes(G.players[G.me].team))G.humanTeams.push(G.players[G.me].team)}
function setMe(i){G.me=i;initFogArrays();calcFog()}

// ---------- guardar y cargar
const enc=a=>{let s='';for(let i=0;i<a.length;i+=4096)s+=String.fromCharCode.apply(null,Array.from(a.subarray(i,i+4096),v=>48+v));return s};
const dec=s=>{const a=new Uint8Array(s.length);for(let i=0;i<s.length;i++)a[i]=s.charCodeAt(i)-48;return a};
function serialize(){const ents=[];for(const e of G.list){if(e.dead)continue;const o=Object.assign({},e);delete o.path;delete o.gk;delete o.lx;delete o.ly;delete o.stall;ents.push(o)}
 const exps={};for(const t in G.expT)exps[t]=enc(G.expT[t]);
 return JSON.stringify({v:3,MW,MH,seed,cfg:G.cfg,t:G.t,nid:G.nid,players:G.players,ai:G.ai,bases:G.bases,ter:enc(G.ter),exps,hgt:Array.from(G.hgt,h=>Math.round(h*100)),ents,
  price:G.price,wonder:G.wonder,relicHold:G.relicHold,relicN:G.relicN,hist:G.hist,mem:[...G.mem.values()],real:G.real||null})}
function deserialize(str){const d=JSON.parse(str);if(d.v!==3)throw new Error('Formato de partida no compatible con esta versión');
 MW=d.MW;MH=d.MH;NN=MW*MH;GW=Math.ceil(MW/GC);seed=d.seed;
 G={t:d.t,ents:new Map(),list:[],nid:d.nid,proj:[],ev:[],cfg:d.cfg,over:false,win:null,dirty:false,fogT:0,endT:1,histT:30,alertT:0,msgT:{},fogV:0,pb:60,nb:30000,players:d.players,ai:d.ai,bases:d.bases,
  visT:{},expT:{},me:0,mp:false,ter:dec(d.ter),occ:new Int32Array(NN),block:new Uint8Array(NN),gate:new Uint8Array(NN),hgt:Float32Array.from(d.hgt,h=>h/100),
  price:d.price,wonder:d.wonder,relicHold:d.relicHold,relicN:d.relicN,hist:d.hist||[],mem:new Map((d.mem||[]).map(m=>[m.id,m])),real:d.real&&root.IMPERIA_MAPS&&root.IMPERIA_MAPS[d.real]?d.real:undefined};
 for(const t in d.exps)G.expT[t]=dec(d.exps[t]);
 for(let i=0;i<NN;i++)G.block[i]=G.ter[i]===1||G.ter[i]===3?1:0;
 for(const e of d.ents){if(e.kind==='unit'){e.path=[];e.pi=0;e.gk=null}G.ents.set(e.id,e);G.list.push(e);if(e.kind==='bld'||e.kind==='res')setOcc(e,true)}
 labelLand();reindex();initFogArrays();calcFog();return G}

// ---------- órdenes de los jugadores (todas pasan por exec para el multijugador)
function selOwn(pl,ids){return (ids||[]).map(i=>G.ents.get(i)).filter(e=>e&&!e.dead&&e.owner===pl&&!inGar(e))}
function cmdRight(pl,ids,wx,wy,tgt,q){const own=selOwn(pl,ids);if(!own.length)return null;
 const units=own.filter(e=>e.kind==='unit');
 if(!units.length){let ok=false;for(const b of own)if(b.kind==='bld'&&b.bp>=1&&B[b.type].trains){b.rally={x:wx,y:wy,id:tgt&&(tgt.kind==='res'||(tgt.kind==='bld'&&tgt.owner===pl&&B[tgt.type].farm))?tgt.id:0};ok=true}return ok?'rally':null}
 const tx=clampT(wx/T,MW),ty=clampT(wy/T,MH),landClick=G.ter[idx(tx,ty)]!==1;
 const ships=units.filter(u=>U[u.type].naval),land=units.filter(u=>!U[u.type].naval);
 const res=[],shipMove=[];
 for(const s of ships){if(tgt&&tgt.owner!=null&&isEnemy(pl,tgt.owner)&&U[s.type].atk>0){issue(s,{t:'atk',id:tgt.id},q);res.push('atk');continue}
  if(s.type==='fishship'&&tgt&&tgt.type==='fish'){issue(s,{t:'gather',id:tgt.id,rt:'food',s:'go'},q);res.push('gather');continue}
  if(s.type==='fishship'&&tgt&&tgt.type==='dock'&&tgt.owner===pl){issue(s,{t:'dep',id:tgt.id},q);res.push('move');continue}
  if(s.type==='transport'&&landClick&&s.cargo.length){issue(s,{t:'unload',x:wx,y:wy},q);res.push('unload');continue}
  shipMove.push(s)}
 if(shipMove.length)formMove(shipMove,wx,wy,false,q);
 if(!land.length)return res[0]||'move';
 const monks=land.filter(u=>u.type==='monk'),rest=land.filter(u=>u.type!=='monk');
 if(tgt&&tgt.owner!=null&&isEnemy(pl,tgt.owner)){const mv=[];
  for(const u of rest){if((U[u.type].bldOnly&&tgt.kind==='unit')||U[u.type].atk<=0||!canHit(u,tgt))mv.push(u);else issue(u,{t:'atk',id:tgt.id},q)}
  for(const m of monks){if(tgt.kind==='unit'&&!U[tgt.type].naval&&!m.relic)issue(m,{t:'conv',id:tgt.id},q);else mv.push(m)}
  formMove(mv,wx,wy,false,q);return monks.length&&!rest.length&&tgt.kind==='unit'?'conv':'atk'}
 if(tgt&&tgt.kind==='relic'&&!tgt.holder&&monks.length){const m=monks.find(m=>!m.relic);if(m)issue(m,{t:'relic',id:tgt.id},q);formMove(land.filter(u=>u!==m),wx,wy,false,q);return'gather'}
 if(tgt&&tgt.kind==='unit'&&isAlly(pl,tgt.owner)&&tgt.hp<tgt.maxhp&&monks.length&&!U[tgt.type].naval){for(const m of monks)issue(m,{t:'heal',id:tgt.id},q);formMove(rest,wx,wy,false,q);return'heal'}
 if(tgt&&tgt.owner===pl&&tgt.type==='transport'){const out=[];for(const u of land){if(canEnter(u,tgt))issue(u,{t:'gar',id:tgt.id},q);else out.push(u)}formMove(out,wx,wy,false,q);return'gar'}
 const vills=rest.filter(u=>u.type==='villager'),carts=rest.filter(u=>u.type==='trade'),mil=rest.filter(u=>u.type!=='villager'&&u.type!=='trade');
 if(tgt&&tgt.type==='market'&&isAlly(pl,tgt.owner)&&tgt.bp>=1&&carts.length){let n=0;for(const c of carts){const home=nearestOwn(c,'market');if(home&&home.id!==tgt.id){issue(c,{t:'trade',a:home.id,b:tgt.id,leg:1},q);n++}}if(n&&!vills.length&&!mil.length&&!monks.length)return'gather'}
 if(tgt&&tgt.kind==='res'&&tgt.type!=='fish'&&vills.length){const rt=RDEF[tgt.type].r;for(const v of vills)issue(v,{t:'gather',id:tgt.id,rt,s:'go'},q);formMove(mil.concat(monks),wx,wy,false,q);return'gather'}
 if(tgt&&tgt.kind==='bld'&&tgt.owner===pl){
  if(tgt.type==='monastery'&&monks.some(m=>m.relic)){for(const m of monks)if(m.relic)issue(m,{t:'gar',id:tgt.id},q);return'gar'}
  if(vills.length&&(tgt.bp<1||tgt.hp<tgt.maxhp)){for(const v of vills)issue(v,{t:'build',id:tgt.id},q);formMove(mil.concat(monks),wx,wy,false,q);return'build'}
  if(vills.length&&B[tgt.type].farm){for(const v of vills)issue(v,{t:'gather',id:tgt.id,rt:'food',s:'go'},q);formMove(mil.concat(monks),wx,wy,false,q);return'gather'}
  const carriers=vills.filter(v=>v.carry.a>0);
  if(B[tgt.type].drop===true&&carriers.length){for(const v of carriers)issue(v,{t:'dep',id:tgt.id},q);formMove(rest.filter(u=>!carriers.includes(u)&&u.type!=='trade').concat(monks),wx,wy,false,q);return'move'}
  if(GAR[tgt.type]&&tgt.bp>=1){const out=[];for(const u of land){if(u.type==='trade')continue;if(canEnter(u,tgt))issue(u,{t:'gar',id:tgt.id},q);else out.push(u)}formMove(out,wx,wy,false,q);return'gar'}
 }
 formMove(land.filter(u=>!(u.type==='trade'&&tgt&&tgt.type==='market')),wx,wy,false,q);return'move'}
function cmdAmove(pl,ids,wx,wy,q){const us=selOwn(pl,ids).filter(e=>e.kind==='unit');formMove(us,wx,wy,true,q);return us.length>0}
function cmdStop(pl,ids){for(const u of selOwn(pl,ids))if(u.kind==='unit'){u.oq=[];order(u,{t:'idle'})}}
function cmdDelete(pl,ids){for(const e of selOwn(pl,ids))kill(e,-1,true)}
function setStance(pl,ids,s){for(const u of selOwn(pl,ids))if(u.kind==='unit'&&U[u.type].atk>0&&u.type!=='villager'){u.st=s;if(u.o.t==='atk'&&u.o.auto)order(u,{t:'idle'})}}
function placeBuilding(pl,type,tx,ty,ids,q){const p=P(pl),me=pl===ME();
 if(!bldAvail(p,type)){if(me){msg('Requiere la '+AGES[B[type].age],true);sfx('err')}return false}
 if(type==='wonder'&&G.list.some(e=>!e.dead&&e.type==='wonder'&&e.owner===pl)){if(me){msg('Solo puedes tener una maravilla',true);sfx('err')}return false}
 if(!canPlace(type,tx,ty,pl)){if(me){msg(B[type].coast?'El muelle debe tocar el agua':'No se puede construir ahí',true);sfx('err')}return false}
 if(!canAfford(p,B[type].cost)){if(me){msg('Recursos insuficientes',true);sfx('err')}return false}
 pay(p,B[type].cost);const b=mkBld(type,pl,tx,ty,false);
 for(const v of selOwn(pl,ids))if(v.type==='villager')issue(v,{t:'build',id:b.id},q);if(me)sfx('place');return true}
function wallLine(x0,y0,x1,y1){const out=[[x0,y0]],dx=Math.abs(x1-x0),dy=Math.abs(y1-y0),sx=x0<x1?1:-1,sy=y0<y1?1:-1;let x=x0,y=y0,ix=0,iy=0;
 for(let i=0;i<dx+dy&&i<240;i++){if((.5+ix)/dx<(.5+iy)/dy){x+=sx;ix++}else{y+=sy;iy++}out.push([x,y])}return out}
function placeWall(pl,type,tiles,ids,q){const p=P(pl),c=B[type].cost,me=pl===ME();
 if(!bldAvail(p,type)){if(me){msg('Requiere la '+AGES[B[type].age],true);sfx('err')}return 0}
 let first=null,n=0,poor=false;
 for(const [x,y] of tiles||[]){if(!canPlace(type,x,y,pl))continue;if(!canAfford(p,c)){poor=true;break}pay(p,c);const b=mkBld(type,pl,x,y,false);if(!first)first=b;n++}
 if(poor&&me)msg('Recursos insuficientes para completar la muralla',true);
 if(first){for(const v of selOwn(pl,ids))if(v.type==='villager')issue(v,{t:'build',id:first.id},q);if(me)sfx('place')}else if(!poor&&me){msg('No se puede construir ahí',true);sfx('err')}
 return n}
// validación: las órdenes pueden venir de la red; cualquier orden mal formada se descarta sin tocar el estado
const fin=v=>typeof v==='number'&&isFinite(v),int=v=>Number.isInteger(v);
function validCmd(pl,c){if(!c||typeof c!=='object'||typeof c.c!=='string'||!int(pl)||!G.players[pl]&&c.c!=='drop')return false;
 if(c.ids!=null&&(!Array.isArray(c.ids)||c.ids.length>250||!c.ids.every(int)))return false;
 if(c.id!=null&&!int(c.id))return false;
 switch(c.c){case'right':case'amove':return fin(c.x)&&fin(c.y)&&Array.isArray(c.ids)&&(c.tgt==null||int(c.tgt));
  case'stop':case'del':return Array.isArray(c.ids);
  case'stance':return Array.isArray(c.ids)&&[0,1,2].includes(c.s);
  case'place':return typeof c.b==='string'&&Object.prototype.hasOwnProperty.call(B,c.b)&&int(c.tx)&&int(c.ty);
  case'wall':return typeof c.b==='string'&&Object.prototype.hasOwnProperty.call(B,c.b)&&B[c.b].wall&&Array.isArray(c.tiles)&&c.tiles.length<=250&&c.tiles.every(t=>Array.isArray(t)&&int(t[0])&&int(t[1]));
  case'queue':return int(c.id)&&typeof c.k==='string'&&(c.n==null||(int(c.n)&&c.n>0&&c.n<=10))&&(c.k==='age'||(c.k.startsWith('t:')?Object.prototype.hasOwnProperty.call(TECH,c.k.slice(2)):Object.prototype.hasOwnProperty.call(U,c.k)));
  case'cancel':return int(c.id)&&int(c.i);
  case'ungar':return int(c.id);
  case'bell':case'resign':return true;
  case'autofarm':return typeof c.on==='boolean';
  case'market':return(c.op==='buy'||c.op==='sell')&&['food','wood','stone'].includes(c.r);
  case'drop':return int(c.pl)&&!!G.players[c.pl];
  default:return false}}
function exec(pl,c){if(!validCmd(pl,c))return false;const e=c.id!=null?G.ents.get(c.id):null;switch(c.c){
 case'right':return cmdRight(pl,c.ids,c.x,c.y,c.tgt?G.ents.get(c.tgt)||null:null,!!c.q);
 case'amove':return cmdAmove(pl,c.ids,c.x,c.y,!!c.q);
 case'stop':return cmdStop(pl,c.ids);
 case'del':return cmdDelete(pl,c.ids);
 case'stance':return setStance(pl,c.ids,c.s);
 case'place':return placeBuilding(pl,c.b,c.tx,c.ty,c.ids,!!c.q);
 case'wall':return placeWall(pl,c.b,c.tiles,c.ids,!!c.q);
 case'queue':return e&&e.owner===pl&&e.kind==='bld'?enqueue(e,c.k,c.n):false;
 case'cancel':if(e&&e.owner===pl)cancelQ(e,c.i);return;
 case'ungar':if(e&&e.owner===pl)ungarrison(e,e.x,e.y+T*(e.size||1));return;
 case'bell':return ringBell(pl);
 case'autofarm':{const p=P(pl);if(p){p.autoFarm=c.on;if(pl===ME())msg(c.on?'Resembrado automático de granjas: activado':'Resembrado automático de granjas: desactivado')}return true}
 case'market':return marketTrade(pl,c.op,c.r);
 case'drop':{const p=P(c.pl);if(p&&!p.out&&!p.ai){p.ai=true;G.ai[c.pl]={tick:1,next:G.t+300,wave:DIFF[G.cfg.diff].wave,attacking:false};msg(p.name+' se ha desconectado; la IA toma el control',true)}return}
 case'resign':{const p=P(pl);if(p&&!p.out)eliminate(p);return}
}}
function hash(){let h=Math.round(G.t*30);for(const e of G.list){if(e.dead)continue;h=(h*31+Math.round((e.x||0)*4)+Math.round((e.y||0)*4)*7+Math.round((e.hp||0)*8)+(e.amt|0))|0}
 for(const p of G.players)for(const r of RES)h=(h*31+Math.round(p.res[r]*10))|0;return h}
function pickAt(wx,wy,rad){let best=null,bd=1e9;rad=rad||12;
 for(const e of G.list){if(e.dead||e.gar||e.kind!=='unit')continue;if(!isAlly(e.owner,ME())&&!G.vis[tidx(e)])continue;const d=Math.hypot(e.x-wx,e.y-wy);if(d<rad+e.r&&d<bd){bd=d;best=e}}
 if(best)return best;for(const e of G.list){if(e.kind==='relic'&&!e.holder&&Math.hypot(e.x-wx,e.y-wy)<14&&G.exp[tidx(e)])return e}
 const tx=(wx/T)|0,ty=(wy/T)|0;if(!inb(tx,ty))return null;const o=G.occ[idx(tx,ty)];
 if(o){const e=G.ents.get(o);if(e&&(e.kind==='res'?G.exp[idx(tx,ty)]:isVisible(e)))return e}return null}
function stateText(u){if(u.gar){const c=G.ents.get(u.gar);return'Dentro de '+(c?(c.kind==='bld'?B[c.type].name:U[c.type].name).toLowerCase():'')}const o=u.o;switch(o.t){
 case'gather':return o.s==='ret'?'Llevando '+RN[u.carry.t||o.rt].toLowerCase():(u.work?(u.type==='fishship'?'Pescando':'Recolectando '+RN[o.rt].toLowerCase()):'Yendo a por '+RN[o.rt].toLowerCase());
 case'build':return'Construyendo';case'atk':return'Combatiendo';case'move':case'amove':return'En marcha';case'dep':return'Entregando recursos';
 case'heal':return'Curando';case'conv':return u.faith<1?'Recuperando fe para convertir':'Convirtiendo';case'gar':return u.relic?'Llevando la reliquia al monasterio':'Buscando refugio';
 case'relic':return'Yendo a por la reliquia';case'trade':return'Comerciando';case'unload':return'Navegando para desembarcar';default:return u.relic?'Lleva una reliquia':'Inactivo'}}

root.Imperia={T,get MW(){return MW},get MH(){return MH},get NN(){return NN},POPMAX,CAP,RES,RN,AGES,AGEYEAR,MAXAGE,AGECOST,AGETIME,GEN,BGEN,gd,gdAt,bName,U,B,BPAGES,TECH,UPG,GAR,RDEF,DIFF,CIVS,MAPS,SIZES,PCOLORS,WONDER_T,RELIC_T,
 newGame,update,get G(){return G},exec,hash,setMe,canAfford,unitAvail,bldAvail,techState,canPlace,wallLine,pickAt,isVisible,stateText,entDist,idx:(x,y)=>y*MW+x,hAt,hAtT,realCells:()=>G&&G.real&&root.IMPERIA_MAPS&&root.IMPERIA_MAPS[G.real]?realCells(G.real,MW,MH):null,
 isAlly,isEnemy,uAtk,uArmor,uRange,uSpeed,uMaxHp,uName,bArmor,bAtk,bRange,unitCost,trainTime,carryCap,convTime,trainsOf,tradeGold,garCap,contents,canEnter,
 serialize,deserialize,formMove,_dbg:{mkUnit,mkBld,applyTech,order,enter,kill}};
})(typeof window!=='undefined'?window:globalThis);
