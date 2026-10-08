// Imperia — vegetación realista (modelos Quaternius CC0 horneados en nature_data.js): geometrías con LOD, materiales con viento y especies por bioma
(function(root){'use strict';
const TH=root.THREE,D=root.IMPERIA_NATURE;const N={ok:!!(D&&TH)};root.ImperiaNature=N;if(!N.ok)return;
const dec=(b,T)=>{const s=atob(b),u=new Uint8Array(s.length);for(let i=0;i<s.length;i++)u[i]=s.charCodeAt(i);return new T(u.buffer)};
let fogify=m=>m,timeU={value:0};const texC={},matC={},geoC={};
N.init=function(o){fogify=o.fogify||fogify;timeU=o.timeU||timeU};
function tex(f){if(!f||!D.tex[f])return null;if(texC[f])return texC[f];const t=new TH.TextureLoader().load(D.tex[f]);t.colorSpace=TH.SRGBColorSpace;t.anisotropy=4;t.wrapS=t.wrapT=TH.RepeatWrapping;return texC[f]=t}
// viento: balanceo según la altura y la posición de cada instancia
function windy(m,amp,key){const prev=m.onBeforeCompile;m.onBeforeCompile=sh=>{prev&&prev(sh);sh.uniforms.uTime=timeU;
 sh.vertexShader='uniform float uTime;\n'+sh.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
#ifdef USE_INSTANCING
 vec3 ip=instanceMatrix[3].xyz;float hh=max(transformed.y-.3,0.);hh*=hh;
 float ph=ip.x*.61+ip.z*.37;
 transformed.x+=(sin(uTime*1.3+ph)*.6+sin(uTime*2.9+ph*1.7+transformed.y*2.)*.25)*${amp}*hh;
 transformed.z+=(cos(uTime*1.07+ph*1.3)*.6+sin(uTime*3.3+ph+transformed.x*3.)*.2)*${amp}*hh;
#endif`)};m.customProgramCacheKey=()=>'natw'+key;return m}
function material(part,key){const leaf=!!part.leaf,k=(leaf?'L':'B')+(part.tex||'-')+(key.startsWith('dead')?'d':'');if(matC[k])return matC[k];
 const map=tex(part.tex)||(key.startsWith('dead')?tex('NormalTree_Bark.jpg'):null);
 const o={map,roughness:leaf?.78:.95,metalness:0,color:key.startsWith('dead')?0x8a8680:0xffffff};
 if(leaf)Object.assign(o,{alphaTest:.42,side:TH.DoubleSide});
 const m=new TH.MeshStandardMaterial(o);fogify(m);
 if(leaf)windy(m,/Grass|Flowers/.test(part.tex||'')?.09:.018,part.tex);else m.customProgramCacheKey=()=>'natb';
 const d=new TH.MeshDepthMaterial({depthPacking:TH.RGBADepthPacking,map:leaf?map:null,alphaTest:leaf?.42:0,side:leaf?TH.DoubleSide:TH.FrontSide});
 return matC[k]={m,d}}
// geometrías (LOD0 y LOD1 comparten vértices). En las copas, normales "esféricas" desde el centro para una luz suave y creíble
N.model=function(key){if(geoC[key])return geoC[key];const M=D.models[key];if(!M)return null;
 const out=M.parts.map(p=>{const pos=dec(p.pos,Float32Array),nr=dec(p.nor,Int8Array),uv=dec(p.uv,Float32Array);const n=pos.length/3,nor=new Float32Array(n*3);for(let i=0;i<n*3;i++)nor[i]=nr[i]/127;
  if(p.leaf&&M.h>.35){let cx=0,cy=0,cz=0;for(let i=0;i<n;i++){cx+=pos[i*3];cy+=pos[i*3+1];cz+=pos[i*3+2]}cx/=n;cy/=n;cz/=n;const sq=M.h>1.2?1:.8;
   for(let i=0;i<n;i++){let x=pos[i*3]-cx,y=(pos[i*3+1]-cy)*sq+.25,z=pos[i*3+2]-cz;const l=Math.hypot(x,y,z)||1;const a=.75;let nx=x/l*a+nor[i*3]*(1-a),ny=y/l*a+nor[i*3+1]*(1-a),nz=z/l*a+nor[i*3+2]*(1-a);const l2=Math.hypot(nx,ny,nz)||1;nor[i*3]=nx/l2;nor[i*3+1]=ny/l2;nor[i*3+2]=nz/l2}}
  const T=p.i32?Uint32Array:Uint16Array;const g0=new TH.BufferGeometry();g0.setAttribute('position',new TH.BufferAttribute(pos,3));g0.setAttribute('normal',new TH.BufferAttribute(nor,3));g0.setAttribute('uv',new TH.BufferAttribute(uv,2));
  g0.setIndex(new TH.BufferAttribute(dec(p.idx,T),1));const g1=new TH.BufferGeometry();for(const a in g0.attributes)g1.setAttribute(a,g0.attributes[a]);g1.setIndex(new TH.BufferAttribute(dec(p.idx1,T),1));
  g0.computeBoundingSphere();g1.boundingSphere=g0.boundingSphere.clone();g0.computeBoundingBox();g1.boundingBox=g0.boundingBox.clone();
  const mt=material(p,key);return{g0,g1,mat:mt.m,dmat:mt.d,leaf:!!p.leaf,tex:p.tex}});
 return geoC[key]={parts:out,h:M.h,r:M.r}};
N.has=k=>!!D.models[k];
N.keys=pre=>Object.keys(D.models).filter(k=>k.startsWith(pre));
// geografía de los mapas reales (para la latitud de cada casilla)
const GEO={iberia:[-3.6,40.2,13.5],europa:[13,48.5,42],mediterraneo:[17,38.5,34],africa:[19,2,76],asia:[108,33,58],namerica:[-98,40,60],samerica:[-60,-20,62],oceania:[148,-28,52]};
N.latAt=function(map,y,MH){const g=GEO[map];if(!g)return 45;const D2R=Math.PI/180,my=lat=>(1-Math.log(Math.tan(Math.PI/4+lat*D2R/2))/Math.PI)/2;const w=g[2]/360,yc=my(g[1]);const v=yc-w/2+w*(y+.5)/MH;return 180/Math.PI*(2*Math.atan(Math.exp(Math.PI*(1-2*v)))-Math.PI/2)};
// especie según el entorno: c={lat, el (m), r,g,b (satélite o null), hi (0..1 altura relativa), coast (casillas al mar), arid, patch (0..1 ruido regional), u (azar)}
const pick=(a,u)=>a[Math.min(a.length-1,Math.floor(u*a.length))];
N.species=function(c){const L=Math.abs(c.lat),u=c.u,p=c.patch;
 let arid=c.arid||0;if(c.r!=null){const l=c.r*.3+c.g*.59+c.b*.11;if(c.r>c.g+4&&l>85)arid=Math.max(arid,Math.min(1,(c.r-c.g)/25+(l-85)/80))}
 const alpine=c.el>1600||c.hi>.75,boreal=L>56;
 if(arid>.6){if(L<34&&c.coast<7&&u<.8)return pick(['palm1','palm2','palm3'],u/.8);if(arid>.85&&u<.45)return pick(['dead1','dead2','dead3'],u/.45);return p<.5?pick(['pine1','pine3','pine4'],u):pick(['oak3','oak4','oak5'],u)}
 if(alpine||boreal){if(boreal&&u<.28)return pick(['birch1','birch2','birch3'],u/.28);return pick(['pine1','pine2','pine3','pine4'],u)}
 if(L<24){if(c.coast<5||u<.3)return pick(['palm1','palm2','palm3'],u);return pick(['oak4','oak5','oak1','oak2','oak3'],u)}
 if(arid>.25||(L<42&&c.r!=null&&arid>.1)){return p<.45?pick(['pine1','pine3','pine4'],u):pick(['oak3','oak4','oak5','oak2'],u)}
 // templado: rodales de especies según el ruido regional
 if(p<.28)return pick(['pine1','pine2','pine3','pine4'],u);if(p<.45&&L>40)return pick(['birch1','birch2','birch3'],u);if(p<.7)return pick(['oak1','oak2','oak3','oak4','oak5'],u);return pick(['maple1','maple2','maple3'],u)};
// tinte de hojas por instancia (los arces llevan hojas en escala de grises: verdes y, alguno, otoñal)
// (las texturas de hojas vienen en grises: aquí se da el color natural de cada especie, con variación y algún árbol otoñal)
N.tint=function(key,u,col,arid){const k=.85+u*.3,a=arid||0;
 if(key.startsWith('maple')){if(u<.08)col.setRGB(1,.46,.14);else if(u<.13)col.setRGB(.86,.26,.12);else col.setRGB(k*.42,k*.6,k*.2)}
 else if(key.startsWith('pine'))col.setRGB(k*.27,k*.42,k*.3);
 else if(key.startsWith('oak'))col.setRGB(k*(.36+a*.12),k*(.54+a*.02),k*.2);
 else if(key.startsWith('birch')){if(u<.1)col.setRGB(.95,.78,.22);else col.setRGB(k*.42,k*.6,k*.22)}
 else if(key.startsWith('palm'))col.setRGB(k*.3,k*.46,k*.17);
 else if(key.startsWith('bush'))col.setRGB(k*.36,k*.52,k*.2);
 else col.setRGB(k,k,k);return col};
})(window);
