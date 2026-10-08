// Imperia — horneado de personajes animados (glTF CC0) a un formato compacto para instancing en GPU.
// Cada modelo se fusiona en una sola malla con color por vértice (máscara de color de equipo en el canal A),
// se simplifica (LOD0/LOD1 con meshoptimizer) y sus animaciones se hornean a matrices de hueso (VAT, media precisión).
// Uso: node tools/bake_chars.mjs tools/chars.json   (requiere: npm i three@0.158.0 meshoptimizer@0.21.0)
globalThis.self=globalThis;if(!globalThis.ProgressEvent)globalThis.ProgressEvent=class extends Event{constructor(t,o){super(t);Object.assign(this,o||{})}};
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {MeshoptSimplifier} from 'meshoptimizer';
import fs from 'fs';import path from 'path';

const cfgPath=path.resolve(process.argv[2]);const cfg=JSON.parse(fs.readFileSync(cfgPath,'utf8'));const base=path.dirname(cfgPath);
await MeshoptSimplifier.ready;
const FPS=cfg.fps||20;

function loadGLTF(file){const buf=fs.readFileSync(file);const data=file.endsWith('.glb')?buf.buffer.slice(buf.byteOffset,buf.byteOffset+buf.byteLength):buf.toString('utf8');
 return new Promise((res,rej)=>new GLTFLoader().parse(data,path.dirname(file)+'/',res,rej))}
const cache=new Map();async function gltfOf(f){const p=path.resolve(base,f);if(!cache.has(p))cache.set(p,await loadGLTF(p));return cache.get(p)}
const toSRGB=c=>{c=Math.max(0,Math.min(1,c));return c<=.0031308?c*12.92:1.055*Math.pow(c,1/2.4)-.055};

// ---------- utilería (armas y herramientas) en el espacio de agarre: mango en el origen, a lo largo de +Z, arriba +Y
function propGeo(kind){const L=[];const add=(g,col,x=0,y=0,z=0,rx=0,ry=0,rz=0,team=0)=>{g=g.index?g.toNonIndexed():g;g.rotateX(rx);g.rotateY(ry);g.rotateZ(rz);g.translate(x,y,z);g.userData={col,team};L.push(g)};
 const B=(w,h,d)=>new THREE.BoxGeometry(w,h,d),C=(r1,r2,h,s=8)=>new THREE.CylinderGeometry(r1,r2,h,s),CZ=(r1,r2,h,s=8)=>C(r1,r2,h,s).rotateX(Math.PI/2),K=(r,h,s=8)=>new THREE.ConeGeometry(r,h,s),S=(r)=>new THREE.SphereGeometry(r,8,6);
 const steel=0xb8c0c8,dark=0x2a2a2e,wood=0x7a5230,brass=0xc8a040,olive=0x4a5a32;
 switch(kind){
 case'sword':add(CZ(.012,.012,.09),0x3a2a1c,0,0,0);add(B(.1,.018,.02),brass,0,0,.05);add(B(.03,.008,.36),steel,0,0,.23);add(K(.017,.05,4).rotateX(Math.PI/2),steel,0,0,.43);break;
 case'greatsword':add(CZ(.013,.013,.14),0x3a2a1c,0,0,.02);add(B(.14,.02,.022),brass,0,0,.09);add(B(.036,.009,.52),steel,0,0,.36);break;
 case'axe':add(CZ(.013,.015,.5),wood,0,0,.14);add(B(.012,.1,.08),steel,0,.045,.36);break;
 case'pick':add(CZ(.013,.015,.5),wood,0,0,.14);add(C(.012,.004,.26,5).rotateZ(0),0x707478,0,0,.37);break;
 case'hoe':add(CZ(.012,.012,.56),wood,0,0,.16);add(B(.09,.012,.06),0x707478,0,-.03,.43);break;
 case'hammer':add(CZ(.012,.012,.3),wood,0,0,.08);add(B(.05,.05,.1),0x606468,0,0,.24);break;
 case'wrench':add(B(.02,.012,.26),0x9aa0a8,0,0,.1);add(B(.06,.014,.04),0x9aa0a8,0,0,.24);break;
 case'spear':add(CZ(.011,.011,1.3),wood,0,0,.28);add(K(.025,.12,4).rotateX(Math.PI/2),steel,0,0,.99);break;
 case'pike':add(CZ(.011,.011,1.8),wood,0,0,.45);add(K(.022,.12,4).rotateX(Math.PI/2),steel,0,0,1.41);break;
 case'lance':add(CZ(.018,.008,1.4),0xd8d0c0,0,0,.45);add(K(.04,.08,8).rotateX(-Math.PI/2),steel,0,0,-.06,0,0,0);break;
 case'bow':{const lim=(sg)=>{const c=CZ(.011,.007,.3,5);c.rotateX(sg*(Math.PI/2-.28));add(c,wood,0,sg*.14,-.04)};lim(1);lim(-1);add(C(.014,.014,.08,6),0x3a2a1c,0,0,0);add(C(.002,.002,.58,3),0xeeeeee,0,0,-.085);break}
 case'crossbow':add(B(.04,.04,.34),wood,0,0,.1);add(B(.34,.02,.02),0x5a4a3a,0,0,.24);break;
 case'shield':add(C(.14,.14,.03,16).rotateZ(Math.PI/2),0xffffff,-.05,0,0,0,0,0,1);add(new THREE.TorusGeometry(.14,.012,5,18).rotateY(Math.PI/2),0x606468,-.07,0,0);break;
 case'musket':add(B(.035,.05,.28),wood,0,-.02,-.02);add(CZ(.011,.011,.62),dark,0,.01,.36);break;
 case'rifle':add(B(.035,.06,.26),wood,0,-.02,-.02);add(CZ(.012,.012,.5),dark,0,.012,.3);add(B(.02,.06,.03),dark,0,-.05,.08);break;
 case'smg':add(B(.04,.07,.3),dark,0,-.01,.06);add(CZ(.012,.012,.18),dark,0,.01,.28);add(B(.02,.1,.03),dark,0,-.08,.1);break;
 case'mg':add(B(.05,.07,.42),dark,0,-.01,.1);add(CZ(.015,.015,.4),dark,0,.01,.46);add(B(.08,.05,.08),olive,0,-.06,.1);break;
 case'sniper':add(B(.035,.06,.3),olive,0,-.02,-.02);add(CZ(.011,.011,.7),dark,0,.012,.4);add(CZ(.022,.022,.16),dark,0,.06,.12);break;
 case'bazooka':add(CZ(.045,.045,.9),olive,0,.04,.12);add(CZ(.055,.05,.1),dark,0,.04,.58);break;
 case'atgm':add(CZ(.05,.05,.8),0x6a6a60,0,.05,.12);add(B(.08,.08,.12),dark,0,-.02,.02);break;
 case'laser':add(B(.05,.08,.36),0xd8dde2,0,-.01,.06);add(CZ(.016,.02,.3),0x2a3036,0,.01,.34);add(B(.052,.018,.2),0x39f0ff,0,.035,.1,0,0,0,2);break;
 case'pulse':add(CZ(.06,.05,.7),0xd8dde2,0,.04,.14);add(new THREE.TorusGeometry(.06,.012,5,14),0x39f0ff,0,.04,.4,0,0,0,2);add(new THREE.TorusGeometry(.06,.012,5,14),0x39f0ff,0,.04,.28,0,0,0,2);break;
 case'staff':add(CZ(.013,.013,1.2),wood,0,0,.25);break;
 case'cross':add(CZ(.012,.012,.9),brass,0,0,.2);add(B(.14,.02,.02),brass,0,0,.55);break;
 case'medkit':add(B(.16,.12,.08),0xf2f2f2,0,-.06,0);add(B(.1,.03,.082),0xd23030,0,-.06,0);add(B(.03,.1,.082),0xd23030,0,-.06,0);break;
 case'tablet':add(B(.14,.01,.1),0x1a1e22,0,0,.05);add(B(.12,.012,.08),0x39f0ff,0,.002,.05,0,0,0,2);break;
 case'torch':add(CZ(.014,.012,.4),wood,0,0,.1);add(S(.035),0xffa030,0,0,.3,0,0,0,2);break;
 case'basket':add(C(.08,.06,.1,10),0xb89060,0,-.08,.04);break;
 case'bundle':add(B(.14,.1,.1),0xffffff,0,-.07,.03,0,0,0,3);break;
 case'backpack':add(B(.16,.2,.1),0x6a5a42,0,0,0);add(B(.14,.05,.1),0x5a4a36,0,.12,0);break;
 case'visor':add(B(.1,.03,.04),0x39f0ff,0,0,0,0,0,0,2);break;
 // ---- equipación ajustada (radio 1 = media anchura del segmento). Adelante +Z, izquierda del personaje +X
 case'helm_kettle':add(S(1.12).scale(1,.8,1),steel,0,.28,0);add(C(1.38,1.38,.08,20),steel,0,.28,0);break;
 case'helm_nasal':add(new THREE.SphereGeometry(1.12,14,8,0,Math.PI*2,0,Math.PI*.55),steel,0,.12,0);add(K(.5,.55,10),steel,0,1.05,0);add(B(.14,.7,.12),steel,0,-.2,1.08);break;
 case'helm_great':add(C(1.14,1.1,2.1,14),steel,0,.05,0);add(S(1.14).scale(1,.45,1),steel,0,1.1,0);add(B(1.4,.12,.2),dark,0,.25,1.05);add(B(.5,.9,.1),brass,0,-.2,1.1);break;
 case'helm_morion':add(S(1.1).scale(1,.85,1),steel,0,.25,0);add(new THREE.TorusGeometry(1.25,.18,5,18).rotateX(Math.PI/2).scale(1,1,1.3),steel,0,.08,0);add(B(.14,.55,1.9),steel,0,.95,0);break;
 case'helm_sallet':add(S(1.14).scale(1,.85,1.1),steel,0,.2,-.1);add(B(1.9,.1,.1),dark,0,.1,1.08);break;
 case'tricorn':add(C(1.7,1.7,.22,3),dark,0,.62,0,0,Math.PI,0);add(S(1.05).scale(1,.6,1),dark,0,.55,0);add(new THREE.TorusGeometry(1.55,.07,4,3),brass,0,.72,0,Math.PI/2,Math.PI,0);break;
 case'bicorne':add(C(1.9,1.9,.6,20).scale(1,1,.35),dark,0,.85,0);add(S(1.02).scale(1,.55,1),dark,0,.5,0);add(S(.25),0xffffff,-.9,1.1,0,0,0,0,1);break;
 case'shako':add(C(1,1.08,1.5,14),dark,0,1.05,0);add(C(1.12,1.12,.1,14),brass,0,1.8,0);add(B(1.4,.08,.7),dark,0,.35,.9);add(S(.28),0xffffff,0,2.05,.3,0,0,0,1);add(B(.5,.5,.06),brass,0,1.1,1.03);break;
 case'helm_brodie':add(S(1.15).scale(1,.62,1),olive,0,.42,0);add(C(1.7,1.7,.08,18),olive,0,.36,0);break;
 case'helm_m1':add(new THREE.SphereGeometry(1.22,14,9,0,Math.PI*2,0,Math.PI*.58),olive,0,.18,0);add(new THREE.TorusGeometry(1.2,.08,4,18).rotateX(Math.PI/2),olive,0,-.2,0);add(B(2.2,.15,.1),0x2a2a24,0,.2,1.05,0,0,0,1);break;
 case'helm_mod':add(new THREE.SphereGeometry(1.24,14,9,0,Math.PI*2,0,Math.PI*.6),0x3a3e36,0,.2,-.05);add(B(1.5,.34,.25),0x151515,0,.02,1.1);add(B(.3,.3,.3),0x2a2a2a,1.1,.3,.3);break;
 case'helm_future':add(S(1.3).scale(1,1.08,1.12),0xe8ecef,0,.1,0);add(S(1.1).scale(1,.5,.5),0x39f0ff,0,.05,.85,0,0,0,2);add(B(.18,.9,1.6),0xffffff,0,1.0,-.1,0,0,0,1);break;
 case'hood':add(S(1.12).scale(1,1.05,1.12),0xffffff,0,.15,-.1,0,0,0,1);add(K(.4,.9,8).rotateX(-2.5),0xffffff,0,.45,-1.1,0,0,0,1);break;
 case'cap':add(S(1.08).scale(1,.55,1),0xffffff,0,.55,0,0,0,0,1);add(B(1.3,.08,.9),0xffffff,0,.45,.95,0,0,0,1);break;
 case'beret':add(S(1.2).scale(1,.32,1.05),0xffffff,.15,.72,0,0,0,.2,1);break;
 case'tabard':add(B(1.75,2.9,.14),0xffffff,0,-.9,.8,0,0,0,1);add(B(1.75,2.9,.14),0xffffff,0,-.9,-.8,0,0,0,1);add(B(1.9,.28,1.75),0x3a2a1c,0,-.55,0);break;
 case'surcoat':add(C(1.12,1.45,3.2,14,1,true),0xffffff,0,-1.25,0,0,0,0,1);add(C(1.14,1.14,.3,14),0x3a2a1c,0,-.5,0);break;
 case'cuirass':add(S(1.18).scale(1,1.15,.95),steel,0,.05,.05);add(C(1.2,1.25,.3,14),dark,0,-.75,0);break;
 case'coat':add(C(1.12,1.55,3.4,14,1,true),0xffffff,0,-1.2,0,0,0,0,1);add(B(.2,2.6,.1),brass,0,-.6,1.08);add(B(2.35,.25,1.8),0xf0f0f0,0,.3,0);break;
 case'robe':add(C(1.15,1.75,3.8,14,1,true),0x5a3e28,0,-1.6,0);add(C(1.17,1.2,.25,14),0xffffff,0,-.3,0,0,0,0,1);break;
 case'cape':add(B(2.1,3.2,.1),0xffffff,0,-1.2,-1.02,-.1,0,0,1);break;
 case'vest':add(C(1.2,1.2,2.2,14,1,true).scale(1,1,.9),0xffffff,0,-.25,0,0,0,0,1);break;
 case'pauldron':add(S(1.35).scale(1,.7,1.1),steel,0,.2,0);break;
 case'armband':add(C(1.18,1.18,.7,12,1,true),0xffffff,0,0,0,0,0,0,1);break;
 case'shield_kite':{const sh=new THREE.Shape();sh.moveTo(0,1.2);sh.quadraticCurveTo(.85,1.1,.78,0);sh.lineTo(0,-1.4);sh.lineTo(-.78,0);sh.quadraticCurveTo(-.85,1.1,0,1.2);const g=new THREE.ExtrudeGeometry(sh,{depth:.12,bevelEnabled:false});g.rotateY(Math.PI/2);add(g,0xffffff,0,0,0,0,0,0,1);add(B(.14,2.4,.2),0xf0f0f0,.07,-.1,0);break}
 case'shield_round':add(C(1,1,.14,20).rotateZ(Math.PI/2),0xffffff,0,0,0,0,0,0,1);add(new THREE.TorusGeometry(1,.08,5,22).rotateY(Math.PI/2),0x707478,.05,0,0);add(S(.22),steel,.1,0,0);break;
 case'shield_riot':add(B(.12,2.2,1.3),0x2a3036,0,0,0);add(B(.13,.4,.9),0x9fd8ff,.01,.6,0);add(B(.14,.3,1.3),0xffffff,.01,-.8,0,0,0,0,1);break;
 case'quiver':add(C(.3,.26,1.5,8),0x6a4a2a,0,0,0,.35,0,0);for(let i=0;i<4;i++)add(C(.04,.04,.5,4),0xe8e0d0,(i-1.5)*.1,.95,-.25,.35,0,0);break;
 case'bandolier':add(new THREE.TorusGeometry(1.2,.1,4,18).rotateY(Math.PI/2).rotateX(.7),0x4a3020,0,0,0);break;
 case'radio':add(B(.9,1.3,.5),0x3a4030,0,0,0);add(C(.03,.03,1.8,4),0x151515,.3,1.4,0);break;
 case'jetpack':add(C(.35,.35,1.4,10),0xe8ecef,.45,0,0);add(C(.35,.35,1.4,10),0xe8ecef,-.45,0,0);add(S(.3),0x39f0ff,.45,-.8,0,0,0,0,2);add(S(.3),0x39f0ff,-.45,-.8,0,0,0,0,2);break;
 default:throw new Error('utilería desconocida '+kind)}
 return L}

// ---------- montaje de un modelo
function frameOfBone(b){const q=new THREE.Quaternion(),p=new THREE.Vector3(),s=new THREE.Vector3();b.matrixWorld.decompose(p,q,s);return{p,q}}
async function bake(m){
 const g=await gltfOf(m.file);const root=g.scene;root.position.set(0,0,0);root.rotation.set(0,0,0);root.scale.set(1,1,1);root.updateMatrixWorld(true);
 const sk=[];root.traverse(o=>{if(o.isSkinnedMesh)sk.push(o)});if(!sk.length)throw new Error('sin mallas con esqueleto: '+m.file);
 const bones=sk[0].skeleton.bones;const bIdx=new Map(bones.map((b,i)=>[b,i]));const nn=x=>x.replace(/^mixamorig:?/,'').replace(/[.\s]/g,'');const byName=n=>{const b=bones.find(b=>nn(b.name)===nn(n));if(!b)throw new Error('hueso '+n+' no existe en '+m.file);return b};
 const inv=sk[0].skeleton.boneInverses;
 // huesos plegados (dedos...): sus vértices pasan al antecesor conservado; la textura solo guarda los conservados
 const fre=m.fold?new RegExp(m.fold):null;const keep=bones.filter(b=>!fre||!fre.test(b.name));const kIdx=new Map(keep.map((b,i)=>[b,i]));
 const foldI=bones.map(b=>{let x=b;while(x&&!kIdx.has(x))x=x.parent;return kIdx.get(x)??0});
 // espacio de reposo: en la pose de enlace todos los huesos cumplen hueso·inversa = W (transformación del enlace)
 const W=new THREE.Matrix4().multiplyMatrices(bones[0].matrixWorld,inv[0]),Wi=W.clone().invert();
 // posición de cada articulación en la pose de enlace (la de referencia de los vértices), no en la pose cargada
 const bindPos=b=>new THREE.Vector3().setFromMatrixPosition(new THREE.Matrix4().multiplyMatrices(W,inv[bIdx.get(b)].clone().invert()));
 // reposo: pose de referencia = bind
 const P=[],N=[],Cc=[],SI=[],SW=[],PT=[],IDX=[];let nv=0;
 const hideMat=new Set(m.hideMats||[]),teamMat=new Set(m.team||[]),recolor=m.recolor||{};
 for(const s of sk){const geo=s.geometry;const pos=geo.attributes.position,nor=geo.attributes.normal,si=geo.attributes.skinIndex,sw=geo.attributes.skinWeight;
  const mats=Array.isArray(s.material)?s.material:[s.material];const groups=geo.groups.length?geo.groups:[{start:0,count:(geo.index?geo.index.count:pos.count),materialIndex:0}];
  const bm=new THREE.Matrix4().multiplyMatrices(W,s.bindMatrix),nm=new THREE.Matrix3().getNormalMatrix(bm);
  const sb=s.skeleton.bones.map(b=>bIdx.get(b));if(sb.some(v=>v==null))throw new Error('esqueletos distintos en '+m.file);
  const base0=nv,v=new THREE.Vector3(),n=new THREE.Vector3();
  for(let i=0;i<pos.count;i++){v.fromBufferAttribute(pos,i).applyMatrix4(bm);n.fromBufferAttribute(nor,i).applyMatrix3(nm).normalize();P.push(v.x,v.y,v.z);N.push(n.x,n.y,n.z);
   SI.push(foldI[sb[si.getX(i)]],foldI[sb[si.getY(i)]],foldI[sb[si.getZ(i)]],foldI[sb[si.getW(i)]]);SW.push(sw.getX(i),sw.getY(i),sw.getZ(i),sw.getW(i));Cc.push(0,0,0,0);PT.push(0);nv++}
  for(const gr of groups){const mt=mats[gr.materialIndex]||mats[0];if(hideMat.has(mt.name))continue;const c=new THREE.Color(recolor[mt.name]!=null?recolor[mt.name]:mt.color);
   const tf=teamMat.has(mt.name)?1:0;
   for(let k=gr.start;k<gr.start+gr.count;k++){const vi=geo.index?geo.index.getX(k):k;IDX.push(base0+vi);const o=(base0+vi)*4;Cc[o]=toSRGB(c.r);Cc[o+1]=toSRGB(c.g);Cc[o+2]=toSRGB(c.b);Cc[o+3]=tf}}}
 // segmentos por hueso (caja de los vértices cuyo peso dominante es ese hueso) para ajustar la equipación
 const seg=keep.map(()=>new THREE.Box3());{const v=new THREE.Vector3();for(let i=0;i<nv;i++){let bw=-1,bb=0;for(let c=0;c<4;c++)if(SW[i*4+c]>bw){bw=SW[i*4+c];bb=SI[i*4+c]}seg[bb].expandByPoint(v.fromArray(P,i*3))}}
 const body=new THREE.Box3();{const v=new THREE.Vector3();for(let i=0;i<nv;i++)body.expandByPoint(v.fromArray(P,i*3))}
 const GU=(body.max.y-body.min.y)/.8;// 1 unidad de juego (humano de 0,8) en unidades del modelo
 const segOf=n=>{const b=byName(n),bx=seg[foldI[bIdx.get(b)]];if(bx.isEmpty()){const p=bindPos(b);return new THREE.Box3(p.clone().addScalar(-.05*GU),p.clone().addScalar(.05*GU))}return bx};
 // utilería rígida pegada a un hueso. at: [ax,ay,az] en la caja del segmento (-1..1), off en unidades de juego;
 // fit: escala la pieza (creada para radio 1) a la media anchura del segmento; si no, se escala a unidades de juego.
 for(const pr of m.props||[]){const b=byName(pr.bone);const bi=foldI[bIdx.get(b)];const sg=segOf(pr.seg||pr.bone),c=sg.getCenter(new THREE.Vector3()),h=sg.getSize(new THREE.Vector3()).multiplyScalar(.5);
  if(pr.fitSeg){const fs=segOf(pr.fitSeg).getSize(new THREE.Vector3()).multiplyScalar(.5);h.x=fs.x;h.z=fs.z}
  const at=pr.at||null;const origin=at?new THREE.Vector3(c.x+at[0]*h.x,c.y+at[1]*h.y,c.z+at[2]*h.z):bindPos(b);
  origin.add(new THREE.Vector3(...(pr.off||[0,0,0])).multiplyScalar(GU));
  const sc=pr.fit?(pr.fitAxis==='z'?h.z:pr.fitAxis==='x'?h.x:Math.max(h.x,h.z))*(pr.fit===true?1:pr.fit):GU*(pr.scale||1);
  const grip=new THREE.Matrix4().compose(origin,new THREE.Quaternion().setFromEuler(new THREE.Euler(...(pr.rot||[0,0,0]))),pr.sxyz?new THREE.Vector3(...pr.sxyz).multiplyScalar(sc):new THREE.Vector3().setScalar(sc));
  const nm2=new THREE.Matrix3().getNormalMatrix(grip);
  for(const pg of propGeo(pr.kind)){const pa=pg.attributes.position,na=pg.attributes.normal,cc=new THREE.Color(pr.color!=null&&pg.userData.team!==2&&pg.userData.team!==1?pr.color:pg.userData.col);
   const tf=pg.userData.team===1||(pr.team&&pg.userData.team!==2)?1:pg.userData.team===2?2:0;const part=pr.part||0;const v=new THREE.Vector3(),n=new THREE.Vector3();
   for(let i=0;i<pa.count;i++){v.fromBufferAttribute(pa,i).applyMatrix4(grip);n.fromBufferAttribute(na,i).applyMatrix3(nm2).normalize();P.push(v.x,v.y,v.z);N.push(n.x,n.y,n.z);SI.push(bi,0,0,0);SW.push(1,0,0,0);
    Cc.push(toSRGB(cc.r),toSRGB(cc.g),toSRGB(cc.b),tf);PT.push(pg.userData.team===3?15:part);IDX.push(nv);nv++}}}
 // ---- jinetes: un personaje posado (sentado) y fundido rígidamente a un hueso del caballo
 for(const rd of m.riders||[]){const rg=await loadGLTF(path.resolve(base,rd.file));const rr=rg.scene;rr.updateMatrixWorld(true);
  const rsk=[];rr.traverse(o=>{if(o.isSkinnedMesh)rsk.push(o)});const rb=rsk[0].skeleton.bones,rinv=rsk[0].skeleton.boneInverses,rIdx=new Map(rb.map((b,i)=>[b,i]));
  const rby=n=>{const b=rb.find(b=>nn(b.name)===nn(n));if(!b)throw new Error('hueso jinete '+n);return b};
  const clip=rg.animations.find(a=>a.name===(rd.clip||'Idle'));if(clip){const mx=new THREE.AnimationMixer(rr);const ac=mx.clipAction(clip);ac.play();ac.time=rd.t||0;mx.update(0)}rr.updateMatrixWorld(true);
  // apunta un hueso para que su hijo quede en la dirección indicada (espacio mundo)
  const aim=(bn,cn,dir)=>{const b=rby(bn),c=rby(cn);rr.updateMatrixWorld(true);const pb=new THREE.Vector3().setFromMatrixPosition(b.matrixWorld),pc=new THREE.Vector3().setFromMatrixPosition(c.matrixWorld);
   const q=new THREE.Quaternion().setFromUnitVectors(pc.sub(pb).normalize(),new THREE.Vector3(...dir).normalize());const wq=new THREE.Quaternion();b.getWorldQuaternion(wq);const pq=new THREE.Quaternion();b.parent.getWorldQuaternion(pq);
   b.quaternion.copy(pq.invert().multiply(q.multiply(wq)));rr.updateMatrixWorld(true)};
  for(const [bn,cn,dir] of rd.aim||[])aim(bn,cn,dir);
  // vértices del jinete en su pose
  const RP=[],RN=[],RC=[];const v=new THREE.Vector3(),n=new THREE.Vector3(),acc=new THREE.Vector3(),accn=new THREE.Vector3(),Mb=new THREE.Matrix4(),rbb=new THREE.Box3();
  const rhide=new Set(rd.hideMats||[]),rteam=new Set(rd.team||[]),rrec=rd.recolor||{};
  for(const s2 of rsk){const geo=s2.geometry,pos=geo.attributes.position,nor=geo.attributes.normal,si=geo.attributes.skinIndex,sw=geo.attributes.skinWeight;const mats=Array.isArray(s2.material)?s2.material:[s2.material];
   const groups=geo.groups.length?geo.groups:[{start:0,count:(geo.index?geo.index.count:pos.count),materialIndex:0}];const sb=s2.skeleton.bones.map(b=>rIdx.get(b));
   const base1=RP.length/3;
   for(let i=0;i<pos.count;i++){v.fromBufferAttribute(pos,i).applyMatrix4(s2.bindMatrix);n.fromBufferAttribute(nor,i);acc.set(0,0,0);accn.set(0,0,0);
    for(let c=0;c<4;c++){const w=sw.getComponent(i,c);if(!w)continue;const bi=sb[si.getComponent(i,c)];Mb.multiplyMatrices(rb[bi].matrixWorld,rinv[bi]);acc.add(v.clone().applyMatrix4(Mb).multiplyScalar(w));accn.add(n.clone().transformDirection(Mb).multiplyScalar(w))}
    RP.push(acc.x,acc.y,acc.z);accn.normalize();RN.push(accn.x,accn.y,accn.z)}
   const vcol=new Array(pos.count).fill(null);
   for(const gr of groups){const mt=mats[gr.materialIndex]||mats[0];if(rhide.has(mt.name))continue;const c=new THREE.Color(rrec[mt.name]!=null?rrec[mt.name]:mt.color);const tf=rteam.has(mt.name)?1:0;
    for(let k=gr.start;k<gr.start+gr.count;k++){const vi=geo.index?geo.index.getX(k):k;vcol[vi]=[toSRGB(c.r),toSRGB(c.g),toSRGB(c.b),tf];RC.push(base1+vi)}}
   for(let i=0;i<pos.count;i++)RC['c'+(base1+i)]=vcol[i]}
  for(let i=0;i<RP.length/3;i++)rbb.expandByPoint(v.fromArray(RP,i*3));
  // colocación: caderas del jinete sobre el lomo (parte alta del segmento del hueso de silla)
  const hips=new THREE.Vector3().setFromMatrixPosition(rby('Hips').matrixWorld);const saddleB=byName(rd.bone||'Torso');const sgS=segOf(rd.seg||rd.bone||'Torso');
  const top=new THREE.Vector3(sgS.getCenter(new THREE.Vector3()).x,sgS.max.y,sgS.getCenter(new THREE.Vector3()).z);
  const hH=body.max.y-body.min.y;const sr=hH*(rd.ratio||.78)/(rbb.max.y-rbb.min.y);
  const Rm=new THREE.Matrix4().makeTranslation(top.x+(rd.off||[0,0,0])[0]*hH,top.y+(rd.off||[0,0,0])[1]*hH,top.z+(rd.off||[0,0,0])[2]*hH).multiply(new THREE.Matrix4().makeRotationY(rd.yaw||0)).multiply(new THREE.Matrix4().makeScale(sr,sr,sr)).multiply(new THREE.Matrix4().makeTranslation(-hips.x,-hips.y,-hips.z));
  const Rn=new THREE.Matrix3().getNormalMatrix(Rm);const sbi=foldI[bIdx.get(saddleB)];const vmap=new Map();
  for(const vi of RC){if(typeof vi!=='number')continue;let j=vmap.get(vi);if(j==null){j=nv++;vmap.set(vi,j);v.fromArray(RP,vi*3).applyMatrix4(Rm);n.fromArray(RN,vi*3).applyMatrix3(Rn).normalize();P.push(v.x,v.y,v.z);N.push(n.x,n.y,n.z);
    SI.push(sbi,0,0,0);SW.push(1,0,0,0);const cc=RC['c'+vi]||[1,1,1,0];Cc.push(cc[0],cc[1],cc[2],cc[3]);PT.push(0)}IDX.push(j)}
  // armas del jinete: en la posición de su mano posada, orientadas en el espacio del caballo
  for(const pr of rd.props||[]){const hb=rby(pr.bone);const hp=new THREE.Vector3().setFromMatrixPosition(hb.matrixWorld).applyMatrix4(Rm).add(new THREE.Vector3(...(pr.off||[0,0,0])).multiplyScalar(hH));
   const grip=new THREE.Matrix4().compose(hp,new THREE.Quaternion().setFromEuler(new THREE.Euler(...(pr.rot||[0,0,0]))),new THREE.Vector3().setScalar(hH/1.05*(pr.scale||1)));const nm3=new THREE.Matrix3().getNormalMatrix(grip);
   for(const pg of propGeo(pr.kind)){const pa=pg.attributes.position,na=pg.attributes.normal,cc=new THREE.Color(pr.color!=null&&pg.userData.team!==2&&pg.userData.team!==1?pr.color:pg.userData.col);const tf=pg.userData.team===1||(pr.team&&pg.userData.team!==2)?1:pg.userData.team===2?2:0;
    for(let i=0;i<pa.count;i++){v.fromBufferAttribute(pa,i).applyMatrix4(grip);n.fromBufferAttribute(na,i).applyMatrix3(nm3).normalize();P.push(v.x,v.y,v.z);N.push(n.x,n.y,n.z);SI.push(sbi,0,0,0);SW.push(1,0,0,0);Cc.push(toSRGB(cc.r),toSRGB(cc.g),toSRGB(cc.b),tf);PT.push(0);IDX.push(nv);nv++}}}
 }
 // compactar: quitar vértices sin usar (materiales ocultos)
 const used=new Int32Array(nv).fill(-1);let k2=0;for(const i of IDX)if(used[i]<0)used[i]=k2++;
 let cnt=k2,pos=new Float32Array(cnt*3),nor=new Float32Array(cnt*3),col=new Uint8Array(cnt*4),sidx=new Uint8Array(cnt*4),swt=new Uint8Array(cnt*4),part=new Uint8Array(cnt);
 for(let i=0;i<nv;i++){const j=used[i];if(j<0)continue;pos.set(P.slice(i*3,i*3+3),j*3);nor.set(N.slice(i*3,i*3+3),j*3);
  for(let c=0;c<3;c++)col[j*4+c]=Math.round(Cc[i*4+c]*255);col[j*4+3]=Cc[i*4+3]===1?255:Cc[i*4+3]===2?128:0;
  let w=[SW[i*4],SW[i*4+1],SW[i*4+2],SW[i*4+3]];const s=w.reduce((a,b)=>a+b,0)||1;w=w.map(x=>x/s);let q=w.map(x=>Math.round(x*255));q[0]+=255-q.reduce((a,b)=>a+b,0);
  for(let c=0;c<4;c++){sidx[j*4+c]=SI[i*4+c];swt[j*4+c]=Math.max(0,q[c])}part[j]=PT[i]}
 let idx=Uint32Array.from(IDX.map(i=>used[i]));
 // corrección de ejes: los modelos miran a +Z; el juego espera +X. Escala a la altura pedida, pies en y=0
 const bb=new THREE.Box3();const vv=new THREE.Vector3();bb.copy(body)
 const H=bb.max.y-bb.min.y,S=(m.height||.8)/H,ctr=bb.getCenter(new THREE.Vector3());
 const Cm=new THREE.Matrix4().makeRotationY(Math.PI/2+(m.yaw||0)).multiply(new THREE.Matrix4().makeScale(S,S,S)).multiply(new THREE.Matrix4().makeTranslation(-ctr.x,-bb.min.y,-ctr.z));
 const Ci=Cm.clone().invert(),Cn=new THREE.Matrix3().getNormalMatrix(Cm);
 for(let i=0;i<cnt;i++){vv.fromArray(pos,i*3).applyMatrix4(Cm).toArray(pos,i*3);vv.fromArray(nor,i*3).applyMatrix3(Cn).normalize().toArray(nor,i*3)}
 // soldadura: une vértices duplicados (mismo punto, color, huesos y pieza) para que la malla sea simplificable
 let ext0=0;for(const x of pos)ext0=Math.max(ext0,Math.abs(x));const qq=1e4/ext0;const wm=new Map(),wmap=new Int32Array(cnt);let wn=0;const acc=[];
 for(let i=0;i<cnt;i++){const k=Math.round(pos[i*3]*qq)+','+Math.round(pos[i*3+1]*qq)+','+Math.round(pos[i*3+2]*qq)+'|'+col.subarray(i*4,i*4+4).join(',')+'|'+sidx.subarray(i*4,i*4+4).join(',')+'|'+part[i];
  let j=wm.get(k);if(j==null){j=wn++;wm.set(k,j);acc.push(i,0,0,0)}wmap[i]=j;acc[j*4+1]+=nor[i*3];acc[j*4+2]+=nor[i*3+1];acc[j*4+3]+=nor[i*3+2]}
 const W3=new Float32Array(wn*3);for(let j=0;j<wn;j++)W3.set(pos.subarray(acc[j*4]*3,acc[j*4]*3+3),j*3);
 let widx=[];for(let t=0;t<idx.length;t+=3){const a2=wmap[idx[t]],b2=wmap[idx[t+1]],c2=wmap[idx[t+2]];if(a2!==b2&&b2!==c2&&a2!==c2)widx.push(a2,b2,c2)}widx=Uint32Array.from(widx);
 const simp=(ix,target,err)=>{if(ix.length/3<=target)return ix;return MeshoptSimplifier.simplify(ix,W3,3,Math.floor(target)*3,err)[0]};
 const L0=simp(widx,m.tris0||3200,.01),L1=simp(L0,m.tris1||900,.08);
 // compactar a los vértices soldados usados por el LOD0 (el LOD1 es un subconjunto)
 const use2=new Int32Array(wn).fill(-1);let vn=0;for(const i of L0)if(use2[i]<0)use2[i]=vn++;
 const pos2=new Float32Array(vn*3),nor2=new Float32Array(vn*3),col2=new Uint8Array(vn*4),si2=new Uint8Array(vn*4),sw2=new Uint8Array(vn*4),pt2=new Uint8Array(vn);
 for(let j=0;j<wn;j++){const k=use2[j];if(k<0)continue;const o=acc[j*4];pos2.set(W3.subarray(j*3,j*3+3),k*3);const nx=acc[j*4+1],ny=acc[j*4+2],nz=acc[j*4+3],l=Math.hypot(nx,ny,nz)||1;nor2[k*3]=nx/l;nor2[k*3+1]=ny/l;nor2[k*3+2]=nz/l;
  col2.set(col.subarray(o*4,o*4+4),k*4);si2.set(sidx.subarray(o*4,o*4+4),k*4);sw2.set(swt.subarray(o*4,o*4+4),k*4);pt2[k]=part[o]}
 const idx0=Uint32Array.from(L0,i=>use2[i]),idx1=Uint32Array.from(L1,i=>use2[i]);
 const cntF=cnt;{cnt=vn;pos=pos2;nor=nor2;col=col2;sidx=si2;swt=sw2;part=pt2}
 // animaciones → matrices por hueso (3 filas de 4) en media precisión
 const vkey=JSON.stringify([m.file,m.clips,m.fold||'',m.height||.8,m.yaw||0,FPS]);let V=VATS.get(vkey);
 if(!V){const mixer=new THREE.AnimationMixer(root);const clips={};const rows=[];let fr=0;const M=new THREE.Matrix4();
 const clipList=Object.entries(m.clips);
 for(const [key,spec] of clipList){const sp=typeof spec==='string'?{name:spec}:spec;const src=(sp.file?await gltfOf(sp.file):g).animations.find(a=>a.name===sp.name);
  if(!src)throw new Error('animación '+sp.name+' no existe en '+(sp.file||m.file)+': '+g.animations.map(a=>a.name).join(','));
  mixer.stopAllAction();mixer.uncacheRoot(root);const act=mixer.clipAction(src,root);act.play();const loop=sp.loop!==false&&key!=='die';
  let a0=sp.from||0,a1=sp.to??src.duration;if(sp.hold!=null){a0=a1=sp.hold==='end'?src.duration-1e-4:sp.hold}
  const n=a0===a1?1:Math.max(2,Math.round((a1-a0)*FPS));const count=loop||n===1?n:n+1;
  for(let f=0;f<count;f++){const t=a0+(a1-a0)*(n===1?0:(loop?f/n:f/n));mixer.setTime(0);act.time=t;mixer.update(0);root.updateMatrixWorld(true);
   const saved=sp.pose?bones.map(b=>b.quaternion.clone()):null;if(sp.pose){for(const [bn,rx,ry,rz] of sp.pose){const b=byName(bn);b.quaternion.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(rx,ry,rz)))}root.updateMatrixWorld(true)}
   for(const kb of keep){const bi=bIdx.get(kb);M.multiplyMatrices(bones[bi].matrixWorld,inv[bi]).multiply(Wi);M.premultiply(Cm).multiply(Ci);const e=M.elements;rows.push(e[0],e[4],e[8],e[12],e[1],e[5],e[9],e[13],e[2],e[6],e[10],e[14])}
   if(saved)bones.forEach((b,i)=>b.quaternion.copy(saved[i]))}
  clips[key]=[fr,count,loop?1:0,(n===1?1:n/(a1-a0))];fr+=count}
 const half=new Uint16Array(rows.length);for(let i=0;i<rows.length;i++)half[i]=THREE.DataUtils.toHalfFloat(rows[i]);
 V={id:'v'+VATS.size,clips,frames:fr,bones:keep.length,half};VATS.set(vkey,V)}
 const b64=a=>Buffer.from(a.buffer,a.byteOffset,a.byteLength).toString('base64');
 const posQ=new Int16Array(cnt*3);let ext=0;for(const x of pos)ext=Math.max(ext,Math.abs(x));const qs=32767/ext;for(let i=0;i<pos.length;i++)posQ[i]=Math.round(pos[i]*qs);
 const norQ=new Int8Array(cnt*3);for(let i=0;i<nor.length;i++)norQ[i]=Math.round(nor[i]*127);
 const ix16=a=>cnt<65536?Uint16Array.from(a):Uint32Array.from(a);
 console.log(m.key.padEnd(16),'vért',String(cntF).padStart(5),'→',String(cnt).padStart(5),'tri',String(idx0.length/3).padStart(5),'/',String(idx1.length/3).padStart(4),'huesos',V.bones,'fotogramas',V.frames,'vat',V.id);
 return{gun:m.gun?1:0,v:cnt,bones:V.bones,frames:V.frames,clips:V.clips,ps:1/qs,height:m.height||.8,pos:b64(posQ),nor:b64(norQ),col:b64(col),si:b64(sidx),sw:b64(swt),part:b64(part),i0:b64(ix16(idx0)),i1:b64(ix16(idx1)),i32:cnt>=65536?1:0,vat:V.id}}

const VATS=new Map();const out={};for(const m of cfg.models){try{out[m.key]=await bake(m)}catch(e){console.error('ERROR',m.key,e.message);process.exitCode=1}}
const js='// Generado por tools/bake_chars.mjs — personajes CC0 de Quaternius (ver licencias en assets_src)\nwindow.IMPERIA_CHARS='+JSON.stringify({fps:FPS,models:out,vats:Object.fromEntries([...VATS.values()].map(V=>[V.id,Buffer.from(V.half.buffer).toString('base64')]))})+';\n';
fs.writeFileSync(path.resolve(base,cfg.out),js);console.log('→',cfg.out,(js.length/1024/1024).toFixed(2),'MB');
