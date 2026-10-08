// Imperia — vehículos y máquinas de las edades IV a IX: artillería, blindados, drones, camiones y barcos modernos.
// Amplía ImperiaArt con A.unitEra(tipo,jugador,edad): devuelve un modelo (mirando a +X) o null si esa edad usa el modelo clásico.
(function(root){
'use strict';
const A=root.ImperiaArt,TH=root.THREE;if(!A)return;
const {box,cyl,cylC,cone,sph,Kit,M,PC}=A._;
const DARK=0x24262a,GUN=0x3a3d42,OLIVE=0x7a8a50,OLIVE2=0x606c40,SAND=0xb8a47a,GREY=0x7c828a,LGREY=0xb4bac2,WHITE=0xe8ecef,TIRE=0x1c1c1e,WOOD=0x8a6443,BRASS=0xc8a040,CYAN=0x39f0ff;
const km=(mat)=>M[mat]||M.matte;
function mesh(build){const k=new Kit();build(k);const g=new TH.Group();const gs=k.geos();for(const m in gs){const me=new TH.Mesh(gs[m],km(m));me.castShadow=true;me.receiveShadow=true;g.add(me)}return g}
function pivot(x,y,z){const g=new TH.Group();g.position.set(x,y,z);return g}
const cache=new Map();
function cached(key,build){let g=cache.get(key);if(!g){g=mesh(build);cache.set(key,g)}return g.clone()}
// ---------- piezas
function tireK(k,r,w){k.add(new TH.CylinderGeometry(r,r,w,14).rotateX(Math.PI/2),'rubber',TIRE,0,0,0);k.add(new TH.CylinderGeometry(r*.55,r*.55,w+.01,10).rotateX(Math.PI/2),'metal',GREY,0,0,0)}
function spokedK(k,r,w,col){k.add(new TH.TorusGeometry(r,.02,5,16),'planks',col||WOOD,0,0,0);k.add(new TH.CylinderGeometry(.03,.03,w,8).rotateX(Math.PI/2),'metal',0x505358,0,0,0);for(let i=0;i<6;i++)k.add(box(.014,r*2,.014),'planks',col||WOOD,0,0,0,0,0,i*Math.PI/6)}
function wheels(parts,list,build,key){parts.wheels=parts.wheels||[];for(const [x,y,z] of list){const w=pivot(x,y,z);w.add(cached(key,build));parts.body.add(w);parts.wheels.push(w)}}
function trackK(k,L,h,w,z,col){k.add(box(L,h,w),'rubber',TIRE,0,h/2,z);for(let i=0;i<Math.round(L/.09);i++)k.add(box(.03,h+.012,w+.012),'metal',0x3a3a3a,-L/2+.045+i*.09,h/2,z);
 for(let i=0;i<4;i++)k.add(new TH.CylinderGeometry(h*.36,h*.36,w+.02,10).rotateX(Math.PI/2),'metal',col||GREY,-L/2+h*.5+i*(L-h)/3,h*.48,z)}
function barrelK(k,len,r,x,y,z,col,mat){k.add(new TH.CylinderGeometry(r,r*1.05,len,10).rotateZ(-Math.PI/2),mat||'metal',col||GUN,x+len/2,y,z)}
function carriageK(k,col){k.add(box(.62,.06,.08),'planks',col||WOOD,-.2,.2,.13,0,0,-.25);k.add(box(.62,.06,.08),'planks',col||WOOD,-.2,.2,-.13,0,0,-.25);k.add(box(.12,.1,.34),'planks',col||WOOD,.08,.3,0);k.add(box(.08,.05,.3),'planks',col||WOOD,-.46,.08,0)}
function flagK(k,pc,x,y,z,h){k.add(cyl(.008,.008,h||.35,4),'metal',LGREY,x,y,z);k.add(box(.005,.09,.13),'cloth',pc,x,y+(h||.35)-.06,z+.07)}
function lightsK(k,x,y,z,col){k.add(box(.02,.04,.05),'neon',col||0xfff2c8,x,y,z)}
// ---------- vehículos terrestres
function jeep(parts,pc,camo){parts.body.add(mesh(k=>{k.add(box(.72,.14,.42),camo?'camo':'steel',OLIVE,0,.2,0);k.add(box(.28,.1,.4),'steel',OLIVE,.24,.31,0);k.add(box(.04,.14,.36),'glass',0x9fc4d8,.08,.38,0,0,0,-.3);
 k.add(box(.3,.05,.44),'steel',OLIVE2,-.2,.3,0);k.add(cyl(.02,.02,.2,6),'metal',DARK,-.15,.4,0);k.add(box(.26,.03,.03),'metal',DARK,-.05,.5,0);k.add(box(.2,.06,.3),'cloth',pc,-.28,.32,0);flagK(k,pc,-.33,.3,-.18,.3)}));
 wheels(parts,[[.24,.12,.23],[.24,.12,-.23],[-.24,.12,.23],[-.24,.12,-.23]],k=>tireK(k,.11,.08),'jtire')}
function recon(parts,pc){parts.body.add(mesh(k=>{k.add(box(.95,.22,.48),'steel',OLIVE,0,.27,0);k.add(box(.2,.14,.44),'steel',OLIVE,.42,.24,0,0,0,.5);k.add(cyl(.14,.16,.12,10),'steel',OLIVE2,-.05,.44,0);
 barrelK(k,.36,.022,.02,.46,0);k.add(box(.6,.02,.5),'cloth',pc,-.1,.385,0);lightsK(k,.5,.3,.14);lightsK(k,.5,.3,-.14)}));
 wheels(parts,[[.3,.13,.27],[.3,.13,-.27],[0,.13,.27],[0,.13,-.27],[-.3,.13,.27],[-.3,.13,-.27]],k=>tireK(k,.12,.09),'rtire')}
function drone(parts,pc){parts.fly=true;parts.rotors=[];parts.body.add(mesh(k=>{k.add(sph(.14,12,8).scale(1.4,.5,1),'poly',WHITE,0,.02,0);k.add(box(.3,.03,.03),'poly',LGREY,.12,0,0);
 for(const [x,z] of[[.22,.22],[.22,-.22],[-.22,.22],[-.22,-.22]]){k.add(box(Math.hypot(x,z),.025,.03),'poly',LGREY,x/2,0,z/2,-Math.atan2(z,x));k.add(cyl(.05,.05,.04,10),'poly',DARK,x,.01,z)}
 k.add(sph(.05,8,6),'glass',0x223040,.18,-.05,0);k.add(box(.1,.02,.1),'cloth',pc,-.05,.08,0);barrelK(k,.22,.015,.05,-.08,0,DARK);lightsK(k,.24,0,.05,CYAN);lightsK(k,.24,0,-.05,CYAN)}));
 for(const [x,z] of[[.22,.22],[.22,-.22],[-.22,.22],[-.22,-.22]]){const r=pivot(x,.05,z);r.add(cached('rotor',k=>{k.add(box(.26,.006,.03),'poly',0x222222,0,0,0);k.add(box(.03,.006,.26),'poly',0x222222,0,0,0)}));parts.body.add(r);parts.rotors.push(r)}}
function hoverTank(parts,pc,big){parts.hover=true;const s=big?1.2:1;parts.body.add(mesh(k=>{k.add(box(1.0*s,.16,.62*s),'poly',WHITE,0,.28,0);k.add(box(.9*s,.08,.56*s),'panel',0x3a4048,0,.18,0);k.add(box(.3*s,.1,.5*s),'poly',WHITE,.45*s,.24,0,0,0,.4);
 k.add(box(.9*s,.03,.64*s),'neon',CYAN,0,.12,0);k.add(cyl(.18*s,.22*s,.14,8),'poly',LGREY,-.05,.43,0);barrelK(k,.5*s,.03,.05,.45,.06,0x2a3036);barrelK(k,.5*s,.03,.05,.45,-.06,0x2a3036);
 k.add(box(.5*s,.02,.4*s),'cloth',pc,-.1,.365,0);k.add(box(.04,.04,.2),'neon',CYAN,.1+.5*s,.45,0)}))}
function tank(parts,pc,tier){const L=tier>=7?1.3:tier>=6?1.25:1.1,W=tier>=6?.7:.64;const col=tier===5?OLIVE:tier===6?0x6e6a4a:0x585e52;
 parts.body.add(mesh(k=>{trackK(k,L,.2,.14,W/2-.07,0x444);trackK(k,L,.2,.14,-W/2+.07,0x444);
  k.add(box(L*.92,.16,W-.26),'steel',col,0,.26,0);k.add(box(L*.3,.12,W*.95),'steel',col,.3*L,.25,0,0,0,tier===5?.35:.6);k.add(box(L*.95,.04,W*.98),'steel',col,-.02,.35,0);
  if(tier>=7){for(let i=0;i<5;i++){k.add(box(.12,.1,.05),'steel',0x4a5040,-.4+i*.2,.28,W/2+.02);k.add(box(.12,.1,.05),'steel',0x4a5040,-.4+i*.2,.28,-W/2-.02)}}
  lightsK(k,L/2,.3,W*.35);lightsK(k,L/2,.3,-W*.35);k.add(box(.5,.02,.35),'cloth',pc,-.3,.375,0)}));
 const t=pivot(tier===5?.05:-.05,.37,0);parts.body.add(t);parts.turret=t;
 t.add(cached('turret'+tier,k=>{if(tier===5){k.add(cyl(.2,.24,.18,12),'steel',OLIVE,0,.09,0);k.add(cyl(.08,.08,.06,8),'steel',OLIVE2,-.05,.2,.08)}
  else{k.add(box(.52,.16,.48),'steel',col,0,.08,0);k.add(box(.2,.14,.44),'steel',col,.3,.07,0,0,0,.5);k.add(box(.2,.1,.3),'steel',col,-.3,.07,0);k.add(cyl(.05,.05,.08,8),'steel',0x3a3e36,-.05,.2,.12);k.add(cyl(.01,.01,.35,4),'metal',DARK,-.25,.3,-.15)}
  barrelK(k,tier===5?.55:.75,tier===5?.03:.035,tier===5?.15:.36,tier===5?.1:.08,0,tier===5?OLIVE2:0x3a3e36,'steel');if(tier>=6)k.add(cyl(.045,.045,.1,8).rotateZ(-Math.PI/2),'steel',0x3a3e36,.9,.08,0)}))}
function mechFallback(parts,pc){hoverTank(parts,pc,true)}
// ---------- artillería
function cannon(parts,pc,tier,type){const long=type==='mangonel';parts.body.add(mesh(k=>{
 if(tier<=4){carriageK(k,tier===4?0x5a4a3a:WOOD);barrelK(k,long?.72:.55,long?.04:.07,-.1,.34,0,tier===3?BRASS:0x3a3d42,'metal');k.add(cyl(long?.05:.085,long?.05:.085,.06,10).rotateZ(Math.PI/2),'metal',tier===3?BRASS:0x3a3d42,-.13,.34,0);
  if(type==='ram'&&tier===3){k.add(box(.12,.22,.3),'planks',WOOD,.08,.28,0)}for(let i=0;i<3;i++)k.add(sph(.035,6,4),'metal',0x222,-.4-i*.07,.05,.25);flagK(k,pc,-.45,.08,-.2,.4)}
 else if(tier===5){k.add(box(.1,.3,.5),'steel',OLIVE,.05,.35,0);carriageK(k,OLIVE2);barrelK(k,long?.3:.7,long?.07:.05,long?.05:-.05,long?.22:.38,0,OLIVE2,'steel');if(long){k.add(box(.3,.02,.3),'steel',OLIVE2,0,.02,0)}k.add(box(.26,.02,.2),'cloth',pc,-.35,.13,0)}
 }));if(tier<=5)wheels(parts,[[0,.16,.21],[0,.16,-.21]],k=>tier<=4?spokedK(k,.16,.05):tireK(k,.15,.07),tier<=4?'swheel':'atire')}
function spArt(parts,pc){parts.body.add(mesh(k=>{trackK(k,1.15,.2,.14,.27,0x444);trackK(k,1.15,.2,.14,-.27,0x444);k.add(box(1.05,.16,.4),'steel',0x6e6a4a,0,.26,0);
 k.add(box(.55,.3,.58),'steel',0x6e6a4a,-.2,.46,0);barrelK(k,.9,.035,.05,.52,0,0x3a3e36,'steel');k.add(box(.3,.02,.3),'cloth',pc,-.25,.615,0);lightsK(k,.55,.3,.18);lightsK(k,.55,.3,-.18)}))}
function truckBase(k,col,cabW){k.add(box(.3,.26,cabW||.46),'steel',col,.42,.3,0);k.add(box(.04,.12,.4),'glass',0x9fc4d8,.575,.36,0);k.add(box(1.05,.08,.46),'steel',DARK,-.05,.17,0);lightsK(k,.58,.22,.16);lightsK(k,.58,.22,-.16)}
function rocketTruck(parts,pc,tier){parts.body.add(mesh(k=>{truckBase(k,tier>=7?0x5a6050:OLIVE);const p=pivot(0,0,0);
 k.add(box(.58,.3,.44),'steel',tier>=7?0x4a5048:OLIVE2,-.2,.42,0,0,0,.35);for(let i=0;i<3;i++)for(let j=0;j<3;j++)k.add(cyl(.045,.045,.02,8).rotateZ(Math.PI/2+.35),'metal',DARK,.08,.36+i*.09+.05,-.13+j*.13);k.add(box(.3,.02,.3),'cloth',pc,-.35,.6,0)}));
 wheels(parts,[[.38,.12,.25],[.38,.12,-.25],[-.18,.12,.25],[-.18,.12,-.25],[-.42,.12,.25],[-.42,.12,-.25]],k=>tireK(k,.12,.09),'ttire')}
function smartArt(parts,pc){parts.body.add(mesh(k=>{trackK(k,1.0,.18,.13,.26,0x3a3a3a);trackK(k,1.0,.18,.13,-.26,0x3a3a3a);k.add(box(.95,.18,.4),'panel',0x5a6058,0,.26,0);
 k.add(box(.4,.24,.44),'panel',0x5a6058,-.1,.46,0);k.add(box(.12,.12,.12),'glass',0x223040,.12,.55,0);barrelK(k,.75,.04,.1,.46,0,0x2a3036,'steel');k.add(box(.04,.03,.4),'neon',CYAN,.1,.34,0);k.add(box(.3,.02,.3),'cloth',pc,-.2,.585,0)}))}
function railgun(parts,pc,plasma){parts.hover=true;parts.body.add(mesh(k=>{k.add(box(1.0,.14,.6),'poly',WHITE,0,.25,0);k.add(box(.95,.03,.62),'neon',CYAN,0,.15,0);
 if(plasma){k.add(cyl(.12,.16,.26,10),'poly',LGREY,-.1,.42,0);k.add(sph(.13,12,10),'neon',0xb06bff,.22,.52,0);barrelK(k,.35,.05,-.05,.52,0,0x2a3036)}
 else{for(const z of[.07,-.07])k.add(box(1.1,.05,.03),'panel',0x2a3036,.25,.45,z);k.add(box(1.0,.02,.03),'neon',CYAN,.28,.45,0);k.add(box(.4,.18,.3),'poly',LGREY,-.25,.4,0)}
 k.add(box(.3,.02,.3),'cloth',pc,-.3,.505,0)}))}
// ---------- comercio
function wagon(parts,pc,tier){parts.body.add(mesh(k=>{k.add(box(.7,.12,.4),'planks',WOOD,-.05,.26,0);if(tier===3){k.add(new TH.CylinderGeometry(.24,.24,.68,12,1,true,0,Math.PI).rotateZ(Math.PI/2).rotateX(Math.PI/2),'cloth',0xe8e0cc,-.05,.32,0);k.add(box(.7,.02,.06),'cloth',pc,-.05,.5,0)}
 else{k.add(box(.6,.3,.42),'planks',0x5a2a22,-.05,.46,0);k.add(box(.64,.03,.46),'planks',DARK,-.05,.62,0);k.add(box(.1,.12,.3),'cloth',pc,-.05,.46,.215);k.add(box(.3,.08,.3),'planks',0x7a5a3a,-.05,.68,0)}
 const H=(x,z)=>{k.add(sph(.08,8,6).scale(1.8,1,.8),'matte',0x6a4a30,x,.42,z);k.add(sph(.05,8,6).scale(1.2,1,.8),'matte',0x6a4a30,x+.14,.5,z);for(const dx of[-.06,.06])for(const dz of[-.03,.03])k.add(cyl(.018,.016,.3,5),'matte',0x5a3a26,x+dx,.2,z+dz)};H(.55,.1);H(.55,-.1);k.add(box(.5,.02,.02),'planks',WOOD,.3,.28,0)}));
 wheels(parts,[[.18,.16,.22],[.18,.16,-.22],[-.28,.16,.22],[-.28,.16,-.22]],k=>spokedK(k,.15,.04),'wwheel')}
function truck(parts,pc,tier){const auto=tier>=7;parts.body.add(mesh(k=>{truckBase(k,auto?WHITE:0x3a5a7a);if(auto){k.add(box(.05,.14,.42),'neon',CYAN,.58,.32,0)}
 k.add(box(.66,.34,.46),auto?'poly':'panel',auto?LGREY:0xc8c0b0,-.22,.4,0);k.add(box(.3,.2,.02),'cloth',pc,-.22,.42,.235);k.add(box(.3,.2,.02),'cloth',pc,-.22,.42,-.235)}));
 wheels(parts,[[.38,.12,.24],[.38,.12,-.24],[-.35,.12,.24],[-.35,.12,-.24]],k=>tireK(k,.12,.08),'ttire')}
function cargoDrone(parts,pc){drone(parts,pc);parts.body.add(mesh(k=>{k.add(box(.22,.16,.2),'panel',0xc8c0b0,0,-.14,0);k.add(box(.23,.05,.21),'cloth',pc,0,-.1,0)}))}
// ---------- barcos
function hullK(k,L,W,H,col,deck){const s=new TH.Shape();s.moveTo(-L/2,-W/2*.85);s.lineTo(L/2-W*.8,-W/2);s.quadraticCurveTo(L/2,-W*.2,L/2+W*.35,0);s.quadraticCurveTo(L/2,W*.2,L/2-W*.8,W/2);s.lineTo(-L/2,W/2*.85);s.closePath();
 const g=new TH.ExtrudeGeometry(s,{depth:H,bevelEnabled:false});g.rotateX(Math.PI/2);g.translate(0,H-.06,0);k.add(g,'steel',col,0,0,0);k.add(box(L*.9,.02,W*.82),'steel',deck||0x6a6e72,-.03,H-.05,0);k.add(box(L*.98,.03,W*.9),'steel',0x7a2a22,-.02,.02,0)}
function shipEra(parts,pc,type,tier){parts.ship=true;parts.legs=[];parts.body.add(mesh(k=>{
 if(type==='galley'){
  if(tier===3){hullK(k,1.9,.62,.34,0x7a5232,0x9a7a52);for(const x of[-.5,.05,.55])k.add(cyl(.025,.03,1.3,6),'timber',0xffffff,x,.3,0);for(const x of[-.5,.05,.55])for(const y of[.75,1.2])k.add(box(.04,.34,.6),'cloth',y>1?0xf2ead8:pc,x+.02,y,0);k.add(box(.4,.3,.6),'planks',0x6a4a2a,-.75,.42,0);for(let i=0;i<4;i++)for(const z of[.3,-.3])k.add(cyl(.03,.03,.1,6).rotateX(Math.PI/2),'metal',DARK,-.4+i*.3,.2,z)}
  else if(tier===4){hullK(k,2.0,.6,.3,0x2a2c30,0x6a5a48);k.add(cyl(.08,.1,.5,8),'metal',DARK,-.1,.5,0);k.add(box(.5,.18,.4),'steel',0x3a3e44,.25,.35,0);barrelK(k,.4,.04,.3,.42,0,DARK);for(const x of[-.6,.6])k.add(cyl(.02,.02,.9,5),'timber',0xffffff,x,.6,0);flagK(k,pc,-.85,.3,0,.4)}
  else if(tier===5){hullK(k,2.3,.5,.28,0x6e7680);k.add(box(.5,.24,.34),'steel',0x7e868e,-.1,.38,0);k.add(box(.2,.3,.16),'steel',0x7e868e,-.1,.6,0);k.add(cyl(.07,.08,.3,8),'steel',0x5e666e,-.45,.45,0);
   for(const x of[.55,-.75]){k.add(box(.2,.1,.18),'steel',0x7e868e,x,.33,0);barrelK(k,.3,.025,x+.08,.36,0,DARK)}flagK(k,pc,-1.05,.26,0,.35)}
  else if(tier===6){hullK(k,2.4,.52,.3,0x7a828a);k.add(box(.7,.3,.4),'steel',0x8a929a,-.15,.4,0);k.add(box(.25,.25,.3),'steel',0x8a929a,-.1,.66,0);k.add(cyl(.12,.12,.04,12),'metal',LGREY,-.1,.82,0);
   for(let i=0;i<4;i++)k.add(box(.06,.04,.06),'metal',DARK,.45+i*.1,.31,0);barrelK(k,.25,.03,.75,.36,0,DARK);k.add(box(.3,.02,.3),'cloth',pc,-.5,.305,0)}
  else if(tier===7){hullK(k,2.4,.54,.3,0x4a5058,0x3a3e44);k.add(box(1.0,.32,.44),'panel',0x4a5058,-.15,.42,0,0,0,0);k.add(box(.5,.24,.36),'panel',0x4a5058,-.1,.66,0);k.add(box(.3,.05,.3),'glass',0x223040,.05,.66,0);
   barrelK(k,.25,.03,.72,.36,0,DARK);k.add(box(.3,.02,.3),'cloth',pc,-.6,.305,0)}
  else{parts.hover=true;hullK(k,2.2,.55,.24,0xe8ecef,0xc8ccd0);k.add(box(1.8,.03,.58),'neon',CYAN,0,.05,0);k.add(box(.7,.26,.42),'poly',WHITE,-.2,.38,0);k.add(sph(.12,10,8),'neon',0xb06bff,.55,.4,0);
   for(const z of[.28,-.28])k.add(box(.5,.3,.03),'poly',LGREY,.2,-.05,z);k.add(box(.3,.02,.3),'cloth',pc,-.4,.515,0)}}
 else if(type==='transport'){
  if(tier===3){hullK(k,1.6,.7,.34,0x7a5232,0x9a7a52);k.add(cyl(.03,.035,1.2,6),'timber',0xffffff,0,.3,0);k.add(box(.04,.5,.62),'cloth',pc,.02,.9,0);k.add(box(.4,.34,.66),'planks',0x6a4a2a,-.55,.45,0)}
  else if(tier===4){hullK(k,1.8,.7,.3,0x2a2c30,0x6a5a48);k.add(box(.7,.22,.5),'planks',0x8a6a48,-.2,.4,0);k.add(cyl(.08,.1,.5,8),'metal',DARK,.1,.5,0);flagK(k,pc,-.8,.3,0,.4)}
  else if(tier===5||tier===6){hullK(k,1.8,.8,.28,0x6e7650);k.add(box(.14,.3,.8),'steel',0x5e6644,.9,.3,0);k.add(box(.3,.3,.3),'steel',0x5e6644,-.7,.45,0);k.add(box(.3,.02,.3),'cloth',pc,-.7,.605,0)}
  else{parts.hover=true;k.add(box(1.6,.2,.8),'poly',0x4a5058,0,.28,0);k.add(new TH.TorusGeometry(.42,.1,6,20).scale(2,1,1).rotateX(Math.PI/2),'rubber',TIRE,0,.14,0);for(const z of[.2,-.2])k.add(cyl(.14,.14,.12,12).rotateZ(Math.PI/2),'panel',0x3a3e44,-.75,.55,z);k.add(box(.4,.24,.5),'glass',0x223040,.45,.45,0);k.add(box(.3,.02,.3),'cloth',pc,-.2,.385,0)}}
 else{// pesquero
  hullK(k,1.3,.5,.26,tier>=7?0xd8dde2:0x3a4a5a,0x7a6a58);k.add(box(.34,.26,.34),'steel',tier>=7?WHITE:0xe8e0d0,-.25,.38,0);k.add(box(.3,.04,.36),'steel',DARK,-.25,.52,0);
  if(tier===4)k.add(cyl(.05,.06,.3,8),'metal',DARK,-.3,.65,0);k.add(cyl(.015,.015,.7,5),'metal',LGREY,.2,.5,0);k.add(cyl(.01,.01,.6,4),'metal',LGREY,.35,.45,0,0,0,-.8);k.add(box(.2,.02,.2),'cloth',pc,-.25,.545,0);if(tier>=7)k.add(box(.3,.03,.3),'solar',0x223040,.05,.3,0)}
 }));if(type==='fishship'){const n=new TH.Mesh(new TH.IcosahedronGeometry(.1,1),new TH.MeshStandardMaterial({color:0xcfc4a8,transparent:true,opacity:.7}));n.position.set(.5,.02,0);parts.body.add(n);parts.net=n}}

// qué edad concreta usa cada tipo (null = modelo clásico)
const STEPS={scout:[5,6,7,8],knight:[5,6,7,8],ram:[3,4,5,6,7,8],mangonel:[3,4,5,6,7,8],trade:[3,4,5,7,8],galley:[3,4,5,6,7,8],transport:[3,4,5,7],fishship:[4,5,7]};
A.unitEraTier=function(type,age){const s=STEPS[type];if(!s)return null;let t=null;for(const v of s)if(age>=v)t=v;return t};
A.unitEra=function(type,o,age){const tier=A.unitEraTier(type,age);if(tier==null)return null;const g=new TH.Group(),body=new TH.Group();g.add(body);const parts={body};const pc=PC[o%4];
 switch(type){
 case'scout':if(tier===5)jeep(parts,pc,false);else if(tier===6)recon(parts,pc);else if(tier===7)drone(parts,pc);else hoverTank(parts,pc,false);break;
 case'knight':if(tier===8)mechFallback(parts,pc);else tank(parts,pc,tier);break;
 case'ram':if(tier<=5)cannon(parts,pc,tier,'ram');else if(tier===6)spArt(parts,pc);else if(tier===7)rocketTruck(parts,pc,7);else railgun(parts,pc,false);break;
 case'mangonel':if(tier<=5)cannon(parts,pc,tier,'mangonel');else if(tier===6)rocketTruck(parts,pc,6);else if(tier===7)smartArt(parts,pc);else railgun(parts,pc,true);break;
 case'trade':if(tier<=4)wagon(parts,pc,tier);else if(tier<=7)truck(parts,pc,tier);else cargoDrone(parts,pc);break;
 default:shipEra(parts,pc,type,tier)}
 const ring=new TH.Mesh(new TH.RingGeometry(.3,.37,32).rotateX(-Math.PI/2),new TH.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.9,depthWrite:false}));ring.position.y=.03;ring.visible=false;ring.renderOrder=2;g.add(ring);parts.ring=ring;
 ring.scale.setScalar(type==='galley'||type==='transport'?2.3:type==='fishship'?1.6:1.6);
 g.userData.parts=parts;g.userData.era=tier;return g};
})(window);
