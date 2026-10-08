// Genera tools/chars.json: qué cuerpo, equipación y armas lleva cada unidad en cada edad.
// Cuerpos: Quaternius "Ultimate Modular Men" (CC0, proporciones realistas, esqueleto común de 62 huesos).
import fs from 'fs';
const F=n=>'../assets_src/modularmen/'+n+'.gltf';
// un único juego de animaciones por esqueleto: así cada cuerpo comparte su textura de animación entre todas sus variantes
const CLIPS={idle:'Idle',idle_gun:'Idle_Gun',idle_sword:'Idle_Sword',walk:'Walk',run:'Run',
 attack:{name:'Sword_Slash',loop:false},shoot:{name:'Gun_Shoot',loop:false},punch:{name:'Punch_Right',loop:false},
 work:'Sword_Slash',gather:'Interact',cast:'Wave',hit:{name:'HitRecieve',loop:false},die:{name:'Death',loop:false}};
const W=n=>'../assets_src/modularwomen/'+n+'.gltf';
const BODY={
 farmer:{file:F('Farmer'),team:['LightBlue']},
 adv:{file:F('Adventurer'),team:['Green']},
 king:{file:F('King'),team:['Blue'],hideMats:['Gold']},
 worker:{file:F('Worker'),team:['Worker_Vest']},
 swat:{file:F('Swat'),team:['Swat_Black']},
 space:{file:F('Spacesuit'),team:['SciFi_Light_Accent']},
 suit:{file:F('Suit'),team:['Tie']},
 casual:{file:F('Casual_2'),team:[]},
 w_med:{file:W('Medieval'),team:['LightBrown']},
 w_adv:{file:W('Adventurer'),team:['Green']},
 w_casual:{file:W('Casual'),team:['Orange']},
 w_worker:{file:W('Worker'),team:['Worker_Vest']},
 w_soldier:{file:W('Soldier'),team:['Swat']},
 w_scifi:{file:W('SciFi'),team:['LightBlue']},
 w_suit:{file:W('Suit'),team:['White']},
};
const OLIVE={LightBrown:'#6b6a44',LightBlue:'#4c4f33',White:'#7a7552'};
const ADV_OLIVE={LightGreen:'#5f5d3c',Brown:'#4a4030',Brown2:'#3a3326',Green:'#6a6a44'};
const W_ADV_OLIVE={LightGreen:'#5f5d3c',Brown_02:'#4a4030',Brown2:'#3a3326'};
const COAT={LightBrown:'#e8e2d0',LightBlue:'#3a3a44',White:'#f0f0f0'};
const ROBE={LightBrown:'#5a3e28',LightBlue:'#4a3222',White:'#6a4a30',Red_Dark:'#4a3222'};
const MEDIC={LightBrown:'#e8e8e4',LightBlue:'#dcdcd8',White:'#f4f4f4',Red_Dark:'#c82828'};
const W_MEDIC={Grey:'#dcdcd8',White:'#f4f4f4',Orange:'#e8e8e4'};
const SWAT_OLIVE={Swat:'#56603c',Swat_Black:'#3a4228'},SWAT_WOOD={Swat:'#3e4a30',Swat_Black:'#2a3322'};
const W_SOLD_OLIVE={Swat:'#56603c',Black:'#2e3322',Grey:'#4a4f3a'};
const W_MED_PEASANT={Metal:'#6a5a44',Metal_Dark:'#4a3e30'};
// piezas: cabeza, torso, manos. Orientación: en T el brazo derecho apunta a -X; al colgar, +X del agarre queda arriba y +Z delante
const H=(kind,extra)=>Object.assign({kind,bone:'Head',at:[0,0,0],fit:.8},extra||{});
const T=(kind,extra)=>Object.assign({kind,bone:'Chest',at:[0,0,0],fit:1.5,fitSeg:'Head',fitAxis:'x'},extra||{});
const ROT={sword:[0,.75,0],greatsword:[0,.9,0],axe:[0,1.15,0],pick:[0,1.15,0],hoe:[0,1.25,0],hammer:[0,1.1,0],spear:[0,1.45,0],pike:[0,1.5,0],staff:[0,1.5,0],cross:[0,1.5,0],wrench:[0,1,0]};
const LROT={bow:[0,0,Math.PI/2]};
const SHIELD=(kind)=>({kind,bone:'LowerArm.L',at:[0,1,0],fit:1.9,rot:[0,0,Math.PI/2]});
const BACK=(kind,extra)=>Object.assign({kind,bone:'Chest',at:[0,.2,-1],fit:.55},extra||{});
const ARMBAND={kind:'armband',bone:'UpperArm.L',at:[0,0,0],fit:1.05};
const M=[];const GSCALE={musket:.85,rifle:.8,smg:.85,mg:.8,sniper:.8,bazooka:.65,atgm:.7,laser:.85,pulse:.75,spear:.8,pike:.85};const GUNS=new Set(['musket','rifle','smg','mg','sniper','bazooka','atgm','laser','pulse']);
const RH=(kind,extra)=>Object.assign({kind,bone:'Wrist.R',rot:ROT[kind],scale:GSCALE[kind]||1},extra||{});
const LH=(kind,extra)=>Object.assign({kind,bone:'Wrist.L',rot:LROT[kind]},extra||{});
function unit(key,body,props,o){const b=BODY[body];M.push(Object.assign({key,file:b.file,team:b.team,hideMats:b.hideMats,clips:CLIPS,fold:'(Index|Middle|Ring|Pinky|Thumb)',height:.78,props,gun:props.some(p=>GUNS.has(p.kind))},o||{}))}

// ---------- aldeano (herramientas intercambiables: 1 hacha, 2 pico, 3 azada, 4 martillo, 5 cesta, 15 carga). Sufijo f = variante femenina
const TOOLS=[RH('axe',{part:1}),RH('pick',{part:2}),RH('hoe',{part:3}),RH('hammer',{part:4}),LH('basket',{part:5}),{kind:'bundle',bone:'Chest',at:[0,-.7,1.1],fitSeg:'Head',scale:.8,part:15}];
unit('villager_0','farmer',[...TOOLS]);unit('villager_0f','w_med',[...TOOLS],{recolor:W_MED_PEASANT});
unit('villager_4','adv',[H('cap'),...TOOLS]);unit('villager_4f','w_casual',[...TOOLS]);
unit('villager_6','worker',[...TOOLS]);unit('villager_6f','w_worker',[...TOOLS]);
unit('villager_8','space',[...TOOLS]);unit('villager_8f','w_scifi',[...TOOLS]);
// ---------- línea de infantería
unit('militia_0','king',[H('helm_nasal'),T('tabard'),RH('sword'),SHIELD('shield_round')]);
unit('militia_1','king',[H('helm_kettle'),T('tabard'),RH('sword'),SHIELD('shield_kite')]);
unit('militia_2','king',[H('helm_great'),T('surcoat'),RH('greatsword')]);
unit('militia_3','adv',[H('helm_morion'),T('cuirass'),RH('sword'),SHIELD('shield_round')]);
unit('militia_4','casual',[H('shako'),T('coat'),RH('musket')],{recolor:COAT});
unit('militia_5','adv',[H('helm_brodie'),RH('rifle'),ARMBAND],{recolor:ADV_OLIVE,team:[]});unit('militia_5f','w_adv',[H('helm_brodie'),RH('rifle'),ARMBAND],{recolor:W_ADV_OLIVE,team:[]});
unit('militia_6','swat',[H('helm_m1'),RH('smg'),ARMBAND],{recolor:SWAT_WOOD,team:[]});unit('militia_6f','w_soldier',[H('helm_m1'),RH('smg'),ARMBAND],{recolor:W_SOLD_OLIVE,team:[]});
unit('militia_7','swat',[RH('smg')]);unit('militia_7f','w_soldier',[H('helm_mod'),RH('smg')]);
unit('militia_8','space',[RH('laser'),BACK('jetpack')]);unit('militia_8f','w_scifi',[H('helm_future'),RH('laser'),BACK('jetpack')]);
// ---------- lanceros y antitanque
unit('spear_0','farmer',[H('helm_kettle'),RH('spear')]);
unit('spear_1','adv',[H('helm_kettle'),T('tabard'),RH('spear'),SHIELD('shield_round')]);
unit('spear_2','king',[H('helm_sallet'),T('tabard'),RH('pike')]);
unit('spear_3','adv',[H('helm_morion'),T('cuirass'),RH('pike')]);
unit('spear_4','casual',[H('tricorn'),T('coat'),RH('musket')],{recolor:COAT});
unit('spear_5','adv',[H('helm_m1'),RH('bazooka'),ARMBAND],{recolor:ADV_OLIVE,team:[]});
unit('spear_6','swat',[H('helm_m1'),RH('atgm'),ARMBAND],{recolor:SWAT_OLIVE,team:[]});
unit('spear_7','swat',[RH('atgm')]);unit('spear_7f','w_soldier',[H('helm_mod'),RH('atgm')]);
unit('spear_8','space',[RH('pulse')]);unit('spear_8f','w_scifi',[H('helm_future'),RH('pulse')]);
// ---------- tiradores
unit('archer_0','adv',[H('hood'),LH('bow'),BACK('quiver')]);unit('archer_0f','w_med',[LH('bow'),BACK('quiver')]);
unit('archer_2','adv',[H('helm_kettle'),T('tabard'),RH('crossbow'),BACK('quiver')]);unit('archer_2f','w_med',[H('helm_kettle'),RH('crossbow'),BACK('quiver')]);
unit('archer_3','adv',[H('helm_morion'),RH('musket'),T('bandolier')]);
unit('archer_4','casual',[H('bicorne'),T('coat'),RH('rifle')],{recolor:COAT});
unit('archer_5','adv',[H('helm_brodie'),RH('mg'),ARMBAND],{recolor:ADV_OLIVE,team:[]});unit('archer_5f','w_adv',[H('helm_brodie'),RH('mg'),ARMBAND],{recolor:W_ADV_OLIVE,team:[]});
unit('archer_6','swat',[H('helm_m1'),RH('mg'),ARMBAND],{recolor:SWAT_OLIVE,team:[]});
unit('archer_7','swat',[H('beret'),RH('sniper')]);unit('archer_7f','w_soldier',[H('beret'),RH('sniper')]);
unit('archer_8','space',[RH('laser')]);unit('archer_8f','w_scifi',[H('helm_future'),RH('laser')]);
// ---------- monjes y sucesores
unit('monk_0','casual',[T('robe',{fit:1.05}),H('hood',{color:0x5a3e28}),RH('staff')],{recolor:ROBE,team:[]});
unit('monk_3','suit',[RH('cross'),ARMBAND]);
unit('monk_5','casual',[H('cap'),LH('medkit'),ARMBAND],{recolor:MEDIC,team:[]});unit('monk_5f','w_casual',[H('cap'),LH('medkit'),ARMBAND],{recolor:W_MEDIC,team:[]});
unit('monk_7','suit',[LH('tablet'),ARMBAND]);unit('monk_7f','w_suit',[LH('tablet'),ARMBAND]);
unit('monk_8','space',[LH('tablet')]);unit('monk_8f','w_scifi',[LH('tablet')]);
// ---------- unidades únicas (castillos)
unit('almogavar_0','adv',[H('cap'),RH('spear',{scale:.65}),SHIELD('shield_round')]);
unit('axeman_0','adv',[H('helm_nasal'),T('tabard'),RH('axe',{scale:1.2})]);
unit('longbow_0','adv',[H('hood'),LH('bow',{scale:1.35}),BACK('quiver')]);unit('longbow_0f','w_med',[LH('bow',{scale:1.35}),BACK('quiver')]);
unit('tknight_0','king',[H('helm_great'),T('surcoat'),RH('greatsword',{scale:1.15})]);

// ---------- caballería (edades 0-4): caballo animado + jinete sentado soldado al lomo
const A=n=>'../assets_src/animals/'+n+'.gltf';
const HCLIPS={idle:'Idle',walk:'Walk',run:'Gallop',attack:{name:'Attack_Headbutt',loop:false},die:{name:'Death',loop:false},gather:'Eating'};
const SIT=[['UpperLeg.L','LowerLeg.L',[.5,-.3,.8]],['LowerLeg.L','Foot.L',[.15,-1,-.15]],['UpperLeg.R','LowerLeg.R',[-.5,-.3,.8]],['LowerLeg.R','Foot.R',[-.15,-1,-.15]],
 ['UpperArm.R','LowerArm.R',[-.3,-.75,.55]],['LowerArm.R','Wrist.R',[-.05,-.25,1]],['UpperArm.L','LowerArm.L',[.3,-.75,.55]],['LowerArm.L','Wrist.L',[.05,-.25,1]]];
const RHEAD=(kind,sc)=>({kind,bone:'Head',off:[0,.035,0],scale:sc||.068});
function cav(key,horse,rider,rprops,o){const b=BODY[rider];M.push(Object.assign({key,file:A(horse),team:[],clips:HCLIPS,height:1.05,tris0:4200,tris1:1300,props:[],
 riders:[Object.assign({file:b.file,team:b.team,hideMats:b.hideMats,clip:'Idle',t:.2,aim:SIT,bone:'Torso',ratio:.78,off:[0,-.02,0],props:rprops},o&&o.rider||{})]},o||{},{rider:undefined}))}
const LANCE={kind:'lance',bone:'Wrist.R',rot:[-.25,0,0],scale:1.1},SABRE={kind:'sword',bone:'Wrist.R',rot:[-.9,0,0]},CARB={kind:'musket',bone:'Wrist.R',rot:[-.2,0,0],scale:.8};
cav('scout_0','Horse','adv',[RHEAD('hood',.052),{kind:'spear',bone:'Wrist.R',rot:[-.5,0,0],scale:.8}]);
cav('scout_3','Horse_White','casual',[RHEAD('shako',.066),SABRE],{rider:{recolor:COAT}});
cav('scout_4','Horse','casual',[RHEAD('bicorne',.066),CARB],{rider:{recolor:COAT}});
cav('knight_0','Horse','king',[RHEAD('helm_nasal'),LANCE]);
cav('knight_1','Horse','king',[RHEAD('helm_great',.064),LANCE]);
cav('knight_2','Horse_White','king',[RHEAD('helm_great',.064),LANCE]);
cav('knight_3','Horse','adv',[RHEAD('helm_morion'),SABRE]);
cav('knight_4','Horse_White','casual',[RHEAD('tricorn',.066),CARB],{rider:{recolor:COAT}});
cav('cataphract_0','Horse','king',[RHEAD('helm_nasal'),LANCE]);

// ---------- era IX: mech de asalto (Quaternius Animated Mech, CC0)
M.push({key:'knight_8',file:'../assets_src/mech/George.gltf',team:['Main'],clips:{idle:'Idle',walk:'Walk',run:'Run',shoot:{name:'Shoot',loop:false},attack:{name:'Punch',loop:false},die:{name:'Death',loop:false}},
 height:1.3,gun:true,fold:'(Pinky|Ring|Index|Thumb|Palm)',tris0:3600,tris1:1100,props:[]});

const cfg={out:'../web/chars_data.js',fps:15,models:M};
fs.writeFileSync(new URL('./chars.json',import.meta.url),JSON.stringify(cfg,null,1));console.log('modelos',M.length);
