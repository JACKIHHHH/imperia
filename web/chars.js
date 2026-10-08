// Imperia — personajes esqueléticos con animación horneada en textura (VAT) e instancing.
// Todos los soldados de un mismo modelo se dibujan en una sola llamada; la GPU interpola entre fotogramas.
// Color de equipo por máscara de vértice, piezas intercambiables (herramientas) por máscara de bits, LOD por zoom.
(function(root){
'use strict';
const TH=root.THREE;
const CH={ok:false,models:{},list:[]};
function dec(b64,T){const s=atob(b64),u=new Uint8Array(s.length);for(let i=0;i<s.length;i++)u[i]=s.charCodeAt(i);return new T(u.buffer)}

const VHEAD=`
uniform highp sampler2D uVat;
attribute vec4 aSkin;attribute vec4 aW;attribute vec4 aCol;attribute float aPart;
attribute vec4 iClip;attribute vec4 iMisc;attribute vec3 iTeam;attribute vec3 iCarry;
varying vec3 vTint;varying float vGlow;varying vec3 vTeamC;mat4 vS;
vec4 vatRow(int x,int y0,int y1,float a){return mix(texelFetch(uVat,ivec2(x,y0),0),texelFetch(uVat,ivec2(x,y1),0),a);}
mat4 vatBone(float b,int y0,int y1,float a){int x=int(b)*3;vec4 r0=vatRow(x,y0,y1,a),r1=vatRow(x+1,y0,y1,a),r2=vatRow(x+2,y0,y1,a);
 return mat4(vec4(r0.x,r1.x,r2.x,0.),vec4(r0.y,r1.y,r2.y,0.),vec4(r0.z,r1.z,r2.z,0.),vec4(r0.w,r1.w,r2.w,1.));}
mat4 vatSkin(){float n=iClip.y,fr=iMisc.x*iClip.w;float f0,f1,a;
 if(iClip.z>.5){fr=mod(fr,n);f0=floor(fr);f1=mod(f0+1.,n);}else{fr=clamp(fr,0.,n-1.);f0=floor(fr);f1=min(f0+1.,n-1.);}
 a=fr-f0;int y0=int(f0+iClip.x),y1=int(f1+iClip.x);
 mat4 m=aW.x*vatBone(aSkin.x,y0,y1,a);
 if(aW.y>0.)m+=aW.y*vatBone(aSkin.y,y0,y1,a);
 if(aW.z>0.)m+=aW.z*vatBone(aSkin.z,y0,y1,a);
 if(aW.w>0.)m+=aW.w*vatBone(aSkin.w,y0,y1,a);
 return m;}
bool vatHidden(){if(aPart<.5)return false;return mod(floor(iMisc.y/exp2(aPart)),2.)<.5;}
`;
const VSKIN='vS=vatSkin();\n#define VAT_N\n';
function patchVertex(sh,withColor){
 sh.uniforms.uVat={value:null};
 sh.vertexShader=VHEAD+sh.vertexShader
  .replace('#include <beginnormal_vertex>',VSKIN+'vec3 objectNormal=normalize(mat3(vS)*normal);\n#ifdef USE_TANGENT\nvec3 objectTangent=vec3(tangent.xyz);\n#endif')
  .replace('#include <begin_vertex>','\n#ifndef VAT_N\nvS=vatSkin();\n#endif\nvec3 transformed=(vS*vec4(position,1.)).xyz;if(vatHidden())transformed=vec3(0.);'
   +(withColor?`vec3 c0=pow(aCol.rgb,vec3(2.2));float tm=step(.75,aCol.a),gl=step(.25,aCol.a)*(1.-tm);
    vTeamC=iTeam;if(aPart>14.5)c0=iCarry;float lu=dot(c0,vec3(.3,.59,.11));vTint=mix(c0,iTeam*clamp(.55+lu*2.2,.55,1.35),tm);vGlow=gl;`:''));
 return sh}
function makeMaterials(tex){
 // (van en la lista transparente, después de su silueta, para que la silueta solo compare con árboles y edificios, no con otras unidades)
 const m=new TH.MeshStandardMaterial({roughness:.78,metalness:.05,transparent:true,depthWrite:true});
 m.onBeforeCompile=sh=>{patchVertex(sh,true);sh.uniforms.uVat.value=tex;
  sh.fragmentShader='varying vec3 vTint;varying float vGlow;\n'+sh.fragmentShader.replace('#include <color_fragment>','diffuseColor.rgb*=vTint;')
   .replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance+=vTint*vGlow*1.8;')};
 m.customProgramCacheKey=()=>'vat1';
 const d=new TH.MeshDepthMaterial({depthPacking:TH.RGBADepthPacking});
 d.onBeforeCompile=sh=>{patchVertex(sh,false);sh.uniforms.uVat.value=tex};d.customProgramCacheKey=()=>'vatd1';
 // silueta: la parte del personaje tapada por árboles o edificios se ve como una sombra del color del jugador
 const x=new TH.MeshBasicMaterial({transparent:true,depthWrite:false,depthFunc:TH.GreaterDepth,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-8});
 x.onBeforeCompile=sh=>{patchVertex(sh,true);sh.uniforms.uVat.value=tex;
  sh.fragmentShader='varying vec3 vTint;varying float vGlow;varying vec3 vTeamC;\n'+sh.fragmentShader.replace('#include <color_fragment>','diffuseColor=vec4(vTeamC*1.15+.06,.5);')};
 x.customProgramCacheKey=()=>'vatx1';
 return{m,d,x}}

function buildModel(key,D,VT){
 const n=D.v,ps=D.ps;const pq=dec(D.pos,Int16Array),pos=new Float32Array(n*3);for(let i=0;i<pos.length;i++)pos[i]=pq[i]*ps;
 const attrs={position:new TH.BufferAttribute(pos,3),normal:new TH.BufferAttribute(dec(D.nor,Int8Array),3,true),
  aCol:new TH.BufferAttribute(dec(D.col,Uint8Array),4,true),aSkin:new TH.BufferAttribute(dec(D.si,Uint8Array),4,false),
  aW:new TH.BufferAttribute(dec(D.sw,Uint8Array),4,true),aPart:new TH.BufferAttribute(dec(D.part,Uint8Array),1,false)};
 const IT=D.i32?Uint32Array:Uint16Array;
 const geos=[D.i0,D.i1].map(ix=>{const g=new TH.BufferGeometry();for(const k in attrs)g.setAttribute(k,attrs[k]);g.setIndex(new TH.BufferAttribute(dec(ix,IT),1));
  g.boundingSphere=new TH.Sphere(new TH.Vector3(0,.4,0),1.2);return g});
 let vat=VT[D.vat];if(!vat){vat=VT[D.vat]=new TH.DataTexture(dec(root.IMPERIA_CHARS.vats[D.vat],Uint16Array),D.bones*3,D.frames,TH.RGBAFormat,TH.HalfFloatType);vat.needsUpdate=true;
 vat.magFilter=vat.minFilter=TH.NearestFilter;vat.generateMipmaps=false}
 const {m,d,x}=makeMaterials(vat);
 const M={key,D,geos,mat:m,dmat:d,xmat:x,cap:0,n:0,h:[],meshes:[],clips:D.clips,lod:0};grow(M,32);return M}
function grow(M,cap){
 const old=M.inst;M.cap=cap;
 const I={clip:new TH.InstancedBufferAttribute(new Float32Array(cap*4),4),misc:new TH.InstancedBufferAttribute(new Float32Array(cap*4),4),
  team:new TH.InstancedBufferAttribute(new Float32Array(cap*3),3),carry:new TH.InstancedBufferAttribute(new Float32Array(cap*3),3),
  mat:new TH.InstancedBufferAttribute(new Float32Array(cap*16),16)};
 for(const k in I)I[k].setUsage(TH.DynamicDrawUsage);
 if(old)for(const k in I)I[k].array.set(old[k].array.subarray(0,Math.min(old[k].array.length,I[k].array.length)));
 M.inst=I;
 for(const me of M.meshes){me.parent&&me.parent.remove(me);me.dispose()}M.meshes=[];
 M.geos.forEach((g,li)=>{g.setAttribute('iClip',I.clip);g.setAttribute('iMisc',I.misc);g.setAttribute('iTeam',I.team);g.setAttribute('iCarry',I.carry);
  const me=new TH.InstancedMesh(g,M.mat,cap);me.instanceMatrix=I.mat;me.customDepthMaterial=M.dmat;me.castShadow=true;me.receiveShadow=true;me.frustumCulled=false;me.count=0;
  me.visible=li===M.lod;me.renderOrder=30;me.userData.chars=true;M.meshes.push(me);if(CH.parent)CH.parent.add(me)});
 const xm=new TH.InstancedMesh(M.geos[M.lod],M.xmat,cap);xm.instanceMatrix=I.mat;xm.frustumCulled=false;xm.count=0;xm.renderOrder=20;xm.castShadow=false;xm.receiveShadow=false;xm.userData.chars=true;xm.userData.xray=true;M.meshes.push(xm);if(CH.parent)CH.parent.add(xm)}

CH.init=function(parent){const D=root.IMPERIA_CHARS;CH.parent=parent;
 // nueva partida: instancias y búferes nuevos (reutilizar los de la partida anterior dejaba en la GPU matrices viejas: unidades invisibles con solo el círculo de selección)
 if(CH.ok){for(const k in CH.models){const M=CH.models[k];M.n=0;M.h.length=0;M.mat.dispose();M.dmat.dispose();M.xmat.dispose();const c=M.cap;M.inst=null;grow(M,c)}return true}
 if(!D||!D.models||!TH)return false;
 try{const VT={};for(const k in D.models)CH.models[k]=buildModel(k,D.models[k],VT);CH.ok=true}catch(e){console.error('personajes',e);CH.ok=false}
 return CH.ok};
CH.has=k=>!!CH.models[k];
CH.alloc=function(key){const M=CH.models[key];if(!M)return null;if(M.n>=M.cap)grow(M,M.cap*2);const h={M,i:M.n++,clip:null,t:0};M.h[h.i]=h;return h};
CH.free=function(h){if(!h||h.i<0)return;const M=h.M,last=M.n-1;if(h.i!==last){const o=M.h[last];const I=M.inst;
  for(const [a,s] of[[I.clip,4],[I.misc,4],[I.team,3],[I.carry,3],[I.mat,16]])a.array.copyWithin(h.i*s,last*s,last*s+s);o.i=h.i;M.h[h.i]=o}
 M.h.length=last;M.n=last;h.i=-1;M.dirty=true};
const _c=new TH.Color();
// clip: nombre del clip; t: segundos dentro del clip; mask: bits de piezas visibles; team/carry: colores hex (sRGB)
CH.set=function(h,matrix,clip,t,team,mask,carry){if(!h||h.i<0)return;const M=h.M,I=M.inst,i=h.i;const c=M.clips[clip]||M.clips.idle||Object.values(M.clips)[0];
 I.clip.array.set(c,i*4);const mi=i*4;I.misc.array[mi]=Number.isFinite(t)?t:0;I.misc.array[mi+1]=mask||0;
 if(h.team!==team){h.team=team;_c.setHex(team);I.team.array[i*3]=_c.r;I.team.array[i*3+1]=_c.g;I.team.array[i*3+2]=_c.b}
 if(carry!=null&&h.carryC!==carry){h.carryC=carry;_c.setHex(carry);I.carry.array[i*3]=_c.r;I.carry.array[i*3+1]=_c.g;I.carry.array[i*3+2]=_c.b}
 matrix.toArray(I.mat.array,i*16);M.dirty=true};
CH.clipLen=(key,clip)=>{const M=CH.models[key];const c=M&&M.clips[clip];return c?(c[2]?c[1]:c[1]-1)/c[3]:0};
CH.hasClip=(key,clip)=>{const M=CH.models[key];return!!(M&&M.clips[clip])};
CH.frame=function(far){if(!CH.ok)return;let n=0;for(const k in CH.models){const M=CH.models[k];const lod=far?1:0;
  if(M.lod!==lod){M.lod=lod;M.meshes[2].geometry=M.geos[lod]}
  // sin unidades de este modelo no se dibuja (cada malla vacía costaba una llamada de dibujo, también en la pasada de sombras)
  const on=M.n>0;for(let li=0;li<M.meshes.length;li++){const me=M.meshes[li];me.count=M.n;me.visible=on&&(li>=2||li===M.lod)}if(M.dirty){const I=M.inst;for(const k2 in I)I[k2].needsUpdate=true;M.dirty=false}n+=M.n}CH.count=n};
root.ImperiaChars=CH;
})(window);
