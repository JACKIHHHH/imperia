// Imperia — renderizado 3D v3 (Three.js r158). Mundo: 1 casilla = 1 unidad; lógica x→X, y→Z.
(function(root){
'use strict';
const I=root.Imperia,{T,U,B,RDEF}=I,TH=root.THREE;
let MW=88,MH=88;
const PCOL=[0x3a78e0,0xd4442f,0xdcae2c,0x8f5bd6],PROOF=[0x33589a,0x9c3a2c,0xa98526,0x68439e],PVIL=[0x6f93c9,0xc07a66,0xcfb56a,0x9f86c9];
const C={STONE:0xa39b8c,STONE_D:0x7a7367,PLASTER:0xe4d9c0,TIMBER:0x4a3829,WOOD:0x8f6b45,WOOD_D:0x5e4530,THATCH:0xbc9d5d,SOIL:0x6d5037,STEEL:0xb3b9c1,SKIN:0xdcaa84,DARK:0x2a2420,HORSE:0x6e4a2e,GOLD:0xe8c24c,LEATHER:0x7a5534};
const fogU={value:null},mapU={value:new TH.Vector2(88,88)};
let renderer,scene,camera,sun,hemi,world,unitRoot,bldRoot,fxRoot,resRoot,ghostRoot,ghosts=[],ghostKey='';
let paveData=null,paveTex=null,paveU={value:0},paveTU={value:null},waterMat,fogTex,fogData,fogCur,whiteTex,flagGeo,flagBase,frame=0,winMat,quality='high',dayNight=false,dayK=1,fpsCap=60;
const view={tx:44,tz:44,ty:0,dist:34,tdist:34,yaw:Math.PI/4,pitch:.9};
const objs=new Map(),resInst=new Map(),instMeshes=[],fx=[],rubble=[];
let stumps,selSet=new Set(),W=1,H=1;
const ray=new TH.Raycaster(),ndc=new TH.Vector2(),gplane=new TH.Plane(new TH.Vector3(0,1,0),0),tmpV=new TH.Vector3();
const dummy=new TH.Object3D();
const ME=()=>(I.G&&I.G.me)||0;
const hT=(x,z)=>I.G&&I.G.hgt?I.hAtT(x,z):0;
let memRoot=null;const memObjs=new Map();

// ---------- materiales con niebla de guerra por shader
function fogify(m){m.onBeforeCompile=sh=>{sh.uniforms.uFog=fogU;sh.uniforms.uMap=mapU;
 sh.vertexShader='varying vec3 vFogW;\n'+sh.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\nvec4 fwp=vec4(transformed,1.0);\n#ifdef USE_INSTANCING\nfwp=instanceMatrix*fwp;\n#endif\nvFogW=(modelMatrix*fwp).xyz;');
 sh.fragmentShader='uniform sampler2D uFog;\nuniform vec2 uMap;\nvarying vec3 vFogW;\n'+sh.fragmentShader.replace('#include <dithering_fragment>','#include <dithering_fragment>\nfloat fogv=texture2D(uFog,vFogW.xz/uMap).r;\ngl_FragColor.rgb*=fogv;')};
 m.customProgramCacheKey=()=>'imfog2';return m}
const mats={};
function mat(color,o){const k=color+'|'+(o?JSON.stringify(o):'');if(mats[k])return mats[k];
 return mats[k]=fogify(new TH.MeshStandardMaterial(Object.assign({color,roughness:.84,metalness:0,flatShading:true},o||{})))}
const geos={};
const gc=(k,f)=>geos[k]||(geos[k]=f());
const boxG=(w,h,d)=>gc('b'+[w,h,d],()=>new TH.BoxGeometry(w,h,d).translate(0,h/2,0));
const boxD=(w,h,d)=>gc('bd'+[w,h,d],()=>new TH.BoxGeometry(w,h,d).translate(0,-h/2,0));
const cylG=(a,b,h,s)=>gc('c'+[a,b,h,s],()=>new TH.CylinderGeometry(a,b,h,s||8).translate(0,h/2,0));
const coneG=(r,h,s)=>gc('k'+[r,h,s],()=>new TH.ConeGeometry(r,h,s||8).translate(0,h/2,0));
const pyrG=(w,h)=>gc('p'+[w,h],()=>{const g=new TH.ConeGeometry(w*Math.SQRT1_2,h,4,1);g.rotateY(Math.PI/4);return g.translate(0,h/2,0)});
const sphG=(r,d)=>gc('s'+[r,d],()=>new TH.IcosahedronGeometry(r,d||0));
const pine1G=()=>gc('pine1',()=>new TH.ConeGeometry(.42,.95,7).translate(0,.78,0)),pine2G=()=>gc('pine2',()=>new TH.ConeGeometry(.3,.75,7).translate(0,1.25,0)),rockG=()=>gc('rock',()=>new TH.DodecahedronGeometry(.24,0)),nugG=()=>gc('nug',()=>new TH.OctahedronGeometry(.1,0)),bushG=()=>gc('bush',()=>new TH.IcosahedronGeometry(.3,1).translate(0,.2,0));
function gableG(w,h,d){return gc('g'+[w,h,d],()=>{const x=w/2,z=d/2;const v=[-x,0,z,x,0,z,x,h,0,-x,0,z,x,h,0,-x,h,0,x,0,-z,-x,0,-z,-x,h,0,x,0,-z,-x,h,0,x,h,0,x,0,z,x,0,-z,x,h,0,-x,0,-z,-x,0,z,-x,h,0];
 const g=new TH.BufferGeometry();g.setAttribute('position',new TH.Float32BufferAttribute(v,3));g.computeVertexNormals();return g})}
function P(g,m,x,y,z,ry,rx,rz){const me=new TH.Mesh(g,m);me.position.set(x||0,y||0,z||0);if(ry)me.rotation.y=ry;if(rx)me.rotation.x=rx;if(rz)me.rotation.z=rz;me.castShadow=true;me.receiveShadow=true;return me}
function canvasTex(w,h,draw,rep){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new TH.CanvasTexture(c);t.colorSpace=TH.SRGBColorSpace;if(rep){t.wrapS=t.wrapT=TH.RepeatWrapping;t.repeat.set(rep,rep)}t.anisotropy=8;return t}
let soilMat,targetMat,flagMats;

// ---------- edificios
function flag(o,h){const g=new TH.Group();g.add(P(cylG(.022,.022,h,6),mat(C.WOOD_D)));const f=new TH.Mesh(flagGeo,flagMats[o]);f.position.set(0,h-.02,0);f.castShadow=true;g.add(f);return g}
function timberFrame(g,w,h,d,y,z){const m=mat(C.TIMBER);for(const sx of[-1,1])for(const sz of[-1,1])g.add(P(boxG(.07,h,.07),m,sx*(w/2-.02),y,z+sz*(d/2-.02)));g.add(P(boxG(w+.02,.06,d+.02),m,0,y+h*.62,z))}
function wallDir(e){if(!e)return 0;const G=I.G;const at=(x,y)=>{if(x<0||y<0||x>=MW||y>=MH)return false;const o=G.occ[y*MW+x];const b=o&&G.ents.get(o);return !!(b&&b.kind==='bld'&&B[b.type].wall)};
 const h=at(e.tx-1,e.ty)||at(e.tx+1,e.ty),v=at(e.tx,e.ty-1)||at(e.tx,e.ty+1);return v&&!h?1:0}
const ART=root.ImperiaArt,NAT=root.ImperiaNature&&root.ImperiaNature.ok?root.ImperiaNature:null;
function tierOf(o){const G=I.G;const p=G&&G.players[o];return p?Math.min(8,p.age):0}
function buildModel(type,o,e,tier){const g=ART.building(type,o,tier??tierOf(o),e?wallDir(e):0);
 if(type==='farm'){const n=7,crop=new TH.InstancedMesh(gc('cropG',()=>{const k=new ART.Kit();for(let i=0;i<3;i++)k.add(new TH.ConeGeometry(.018,.3,4).translate(0,.15,0),'matte',[0xb8b04a,0xc8b85a,0x9aa844][i],(i-1)*.03,0,(i%2)*.02,0,(i-1)*.15,0);return k.geos().matte}),ART.M.matte,n*n);crop.castShadow=true;crop.receiveShadow=true;
  let i=0;for(let a=0;a<n;a++)for(let b=0;b<n;b++){dummy.position.set(-.78+a*.26,.06,-.78+b*.26);dummy.rotation.set(0,a*b*1.7,0);dummy.scale.set(1,1,1);dummy.updateMatrix();crop.setMatrixAt(i++,dummy.matrix)}g.add(crop);g.userData.crop=crop}
 return g}
function unitModel(type,o,up,age){return(age!=null&&ART.unitEra&&ART.unitEra(type,o,age))||ART.unit(type,o,up)}
const eraOf=e=>ART.unitEraTier?ART.unitEraTier(e.type,tierOf(e.owner)):null;
function relicModel(){return ART.relic()}
// ---------- terreno
let splatTex,splatData,depthTex;
function coastDistT(G){const d=new Float32Array(MW*MH).fill(99),q=[];for(let i=0;i<MW*MH;i++)if(G.ter[i]!==1){d[i]=0;q.push(i)}
 for(let h=0;h<q.length;h++){const i=q[h],x=i%MW,y=(i/MW)|0;for(const [dx,dy,w] of[[1,0,1],[-1,0,1],[0,1,1],[0,-1,1],[1,1,1.41],[1,-1,1.41],[-1,1,1.41],[-1,-1,1.41]]){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=MW||ny>=MH)continue;const j=ny*MW+nx;if(d[j]>d[i]+w){d[j]=d[i]+w;q.push(j)}}}return d}
function landDistT(G){const d=new Float32Array(MW*MH).fill(99),q=[];for(let i=0;i<MW*MH;i++)if(G.ter[i]===1){d[i]=0;q.push(i)}
 for(let h=0;h<q.length;h++){const i=q[h],x=i%MW,y=(i/MW)|0;for(const [dx,dy] of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=MW||ny>=MH)continue;const j=ny*MW+nx;if(d[j]>d[i]+1){d[j]=d[i]+1;q.push(j)}}}return d}
// agua: mar/lagos grandes frente a ríos (la arena de playa solo va junto al mar)
let WI=null;
function waterInfo(G){const n=MW*MH,sea=new Uint8Array(n),RC=I.realCells?I.realCells():null;
 if(RC){for(let i=0;i<n;i++)sea[i]=G.ter[i]===1&&RC.wa[i]?1:0}
 else{const c=new Int32Array(n).fill(-1);for(let s0=0;s0<n;s0++){if(G.ter[s0]!==1||c[s0]>=0)continue;const q=[s0];c[s0]=s0;for(let h=0;h<q.length;h++){const i=q[h],x=i%MW,y=(i/MW)|0;for(const [dx,dy] of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=MW||ny>=MH)continue;const j=ny*MW+nx;if(G.ter[j]===1&&c[j]<0){c[j]=s0;q.push(j)}}}
  let minx=1e9,maxx=-1,miny=1e9,maxy=-1;for(const i of q){const x=i%MW,y=(i/MW)|0;minx=Math.min(minx,x);maxx=Math.max(maxx,x);miny=Math.min(miny,y);maxy=Math.max(maxy,y)}
  const thick=q.length/Math.max(1,Math.max(maxx-minx,maxy-miny));if(q.length>=40&&thick>3)for(const i of q)sea[i]=1}}
 const dist=src=>{const d=new Float32Array(n).fill(99),q=[];for(let i=0;i<n;i++)if(src(i)){d[i]=0;q.push(i)}for(let h=0;h<q.length;h++){const i=q[h],x=i%MW,y=(i/MW)|0;for(const [dx,dy] of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=MW||ny>=MH)continue;const j=ny*MW+nx;if(d[j]>d[i]+1){d[j]=d[i]+1;q.push(j)}}}return d};
 return WI={sea,seaD:dist(i=>sea[i]===1),wD:dist(i=>G.ter[i]===1||G.ter[i]===2),RC}}
function buildSplat(G){splatData=new Uint8Array(MW*MH*4);paveData=new Uint8Array(MW*MH*4);waterInfo(G);const ld=WI.seaD,wd0=WI.wD,arid=G.cfg&&G.cfg.map==='arabia';
 for(let y=0;y<MH;y++)for(let x=0;x<MW;x++){const i=y*MW+x,t=G.ter[i];let dirt=0,sand=0,rock=0;
  if(t===1)sand=WI.sea[i]?255:150;else if(t===2)sand=200;else{const cd=ld[i];if(cd<=1)sand=240;else if(cd<=2)sand=120;else if(wd0[i]<=1)dirt=150;
   const h=G.hgt?G.hgt[i]:0,hx=G.hgt?Math.abs((G.hgt[Math.min(MW*MH-1,i+1)]||0)-(G.hgt[Math.max(0,i-1)]||0))+Math.abs((G.hgt[Math.min(MW*MH-1,i+MW)]||0)-(G.hgt[Math.max(0,i-MW)]||0)):0;
   rock=Math.max(0,Math.min(255,(hx-.35)*400));const n=ART.fbm(x/9,y/9,77,3);dirt=Math.max(dirt,Math.max(0,Math.min(255,(n-(arid?.42:.6))*700)));}
  const o=G.occ[i],e=o&&G.ents.get(o);if(e&&e.kind==='res'&&(e.type==='gold'||e.type==='stone'))rock=Math.max(rock,220);
  splatData[i*4]=dirt;splatData[i*4+1]=sand;splatData[i*4+2]=rock;splatData[i*4+3]=Math.round(ART.fbm(x/22,y/22,91,3)*255)}
 for(const b of G.bases)stampDirt(b.cx-1.5,b.cy-1.5,3,5.5,1);
 for(const e of G.list)if(e.kind==='res'&&(e.type==='gold'||e.type==='stone'))stampRock(e.tx,e.ty);
 if(splatTex)splatTex.dispose();splatTex=new TH.DataTexture(splatData,MW,MH);splatTex.magFilter=TH.LinearFilter;splatTex.minFilter=TH.LinearFilter;splatTex.needsUpdate=true;
 if(paveTex)paveTex.dispose();paveTex=new TH.DataTexture(paveData,MW,MH);paveTex.magFilter=TH.LinearFilter;paveTex.minFilter=TH.LinearFilter;paveTex.needsUpdate=true}
function stampRock(tx,ty){for(let y=ty-1;y<=ty+1;y++)for(let x=tx-1;x<=tx+1;x++){if(x<0||y<0||x>=MW||y>=MH)continue;const i=(y*MW+x)*4;splatData[i+2]=Math.max(splatData[i+2],x===tx&&y===ty?170:45)}}
// tierra pisada alrededor de un edificio (como en los RTS clásicos)
function stampDirt(tx,ty,size,rad,k){if(!splatData)return;const cx=tx+size/2,cy=ty+size/2,R=size/2+rad;
 for(let y=Math.floor(cy-R-1);y<=cy+R+1;y++)for(let x=Math.floor(cx-R-1);x<=cx+R+1;x++){if(x<0||y<0||x>=MW||y>=MH)continue;const d=Math.hypot(x+.5-cx,y+.5-cy);if(d>R)continue;
  const i=(y*MW+x)*4;if(splatData[i+1]>200)continue;const v=Math.round(255*Math.min(1,(R-d)/Math.max(.8,rad*.7))*(k??1));splatData[i]=Math.max(splatData[i],v);
  if(paveData){const R2=size/2+Math.min(rad*.9,2);if(d<R2)paveData[i]=Math.max(paveData[i],Math.round(255*Math.min(1,(R2-d)/1.1)))}}
 if(splatTex)splatTex.needsUpdate=true;if(paveTex)paveTex.needsUpdate=true}
const timeU=()=>ART.timeU;
// texturas fotográficas del suelo (ambientCG, CC0) empaquetadas en terrain_data.js
let TX=null;function terrTex(){if(TX)return TX;const D=root.IMPERIA_TERRAIN;if(!D)return null;TX={};const L=new TH.TextureLoader();for(const k in D){const t=L.load(D[k]);t.wrapS=t.wrapT=TH.RepeatWrapping;t.anisotropy=8;if(k!=='rockN')t.colorSpace=TH.SRGBColorSpace;TX[k]=t}return TX}
if(root.IMPERIA_TERRAIN)setTimeout(()=>{try{terrTex()}catch(e){}},0);
// relieve visual: montañas escarpadas (el juego solo guarda la altura media; aquí se añaden picos y crestas)
let TR=null;
const sstep=(a,b,v)=>{const t=Math.max(0,Math.min(1,(v-a)/(b-a)));return t*t*(3-2*t)};
function terrH(x,z){if(!TR)return hT(x,z);const gx=Math.max(0,Math.min(TR.gw-1.001,(x+TR.MG)*TR.seg)),gz=Math.max(0,Math.min(TR.gh-1.001,(z+TR.MG)*TR.seg)),x0=gx|0,z0=gz|0,fx=gx-x0,fz=gz-z0,W=TR.gw+0,Y=TR.Y;
 const a=Y[z0*W+x0],b=Y[z0*W+x0+1],c=Y[(z0+1)*W+x0],d=Y[(z0+1)*W+x0+1];return a+(b-a)*fx+(c-a)*fz+(a-b-c+d)*fx*fz}
function buildTerrain(G){
 buildSplat(G);const T2=ART.T,PX=terrTex();const RC=WI.RC;const n=MW*MH;
 // por casilla: profundidad dentro de la montaña, nieve, aridez, desierto, verdor y tinte del satélite
 const md=new Float32Array(n),q=[];for(let i=0;i<n;i++){if(G.ter[i]===3)md[i]=99;else q.push(i)}
 for(let h=0;h<q.length;h++){const i=q[h],x=i%MW,y=(i/MW)|0;for(const [dx,dy] of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=MW||ny>=MH)continue;const j=ny*MW+nx;if(md[j]>md[i]+1){md[j]=md[i]+1;q.push(j)}}}
 let hmax=0;if(G.hgt)for(let i=0;i<n;i++)hmax=Math.max(hmax,G.hgt[i]);
 const snowT=new Float32Array(n),aridT=new Float32Array(n),desT=new Float32Array(n),lushT=new Float32Array(n),tint=new Float32Array(n*3).fill(1);const mapId=G.cfg&&G.cfg.map;
 for(let y=0;y<MH;y++){const lat=RC&&NAT?Math.abs(NAT.latAt(G.real,y,MH)):45;const snowLine=4700-Math.max(0,lat-22)*95;
  for(let x=0;x<MW;x++){const i=y*MW+x;
   if(RC){const r=RC.col[i*3],g=RC.col[i*3+1],b=RC.col[i*3+2],l=r*.3+g*.59+b*.11,el=RC.el[i];
    snowT[i]=Math.max(sstep(snowLine,snowLine+900,el),l>175&&b>150?sstep(175,215,l):0);
    aridT[i]=r>g+3&&l>75?Math.min(1,((r-g)/30+(l-90)/120)*.8):0;desT[i]=r>g+8&&l>120?sstep(120,165,l):0;lushT[i]=Math.max(0,Math.min(1,(g-Math.max(r,b)-3)/8))*sstep(95,55,l);
    const L=Math.max(20,l);tint[i*3]=Math.min(1.5,Math.max(.6,r/L));tint[i*3+1]=Math.min(1.5,Math.max(.6,g/L));tint[i*3+2]=Math.min(1.5,Math.max(.6,b/L))}
   else{const h=G.hgt?G.hgt[i]:0,f=ART.fbm(x/16,y/16,211,3);snowT[i]=hmax>2.6?sstep(hmax*.82,hmax*.95,h):0;
    if(mapId==='arabia'){aridT[i]=.55+f*.5;desT[i]=sstep(.5,.75,f)}else{aridT[i]=sstep(.62,.8,f)*.6;lushT[i]=sstep(.45,.25,f)*(mapId==='bosque'?1:.7)}}}}
 // malla del terreno
 const seg=RC?2.5:2,MG=20,gw=Math.round((MW+2*MG)*seg)+1,gh=Math.round((MH+2*MG)*seg)+1;const geo=new TH.PlaneGeometry(MW+2*MG,MH+2*MG,gw-1,gh-1);geo.rotateX(-Math.PI/2);geo.translate(MW/2,0,MH/2);
 {const uv=geo.attributes.uv,pp=geo.attributes.position;for(let i=0;i<uv.count;i++)uv.setXY(i,pp.getX(i)/MW,1-pp.getZ(i)/MH)}
 const pos=geo.attributes.position,cnt=pos.count,Y=new Float32Array(cnt),mixA=new Float32Array(cnt*4),tintA=new Float32Array(cnt*4);
 const tileAt=(A,x,z)=>{const fx=Math.max(0,Math.min(MW-1.001,x-.5)),fz=Math.max(0,Math.min(MH-1.001,z-.5)),x0=fx|0,z0=fz|0,tx=fx-x0,tz=fz-z0,x1=Math.min(MW-1,x0+1),z1=Math.min(MH-1,z0+1);
  return A[z0*MW+x0]*(1-tx)*(1-tz)+A[z0*MW+x1]*tx*(1-tz)+A[z1*MW+x0]*(1-tx)*tz+A[z1*MW+x1]*tx*tz};
 const mdV=new Float32Array(cnt);
 for(let i=0;i<cnt;i++){const x=pos.getX(i),z=pos.getZ(i);let w=0,f=0,nn=0,mm=0;
  // orillas redondeadas: peso por distancia a los centros de las casillas cercanas (evita la escalera de casillas)
  for(let dz=-2;dz<=1;dz++)for(let dx=-2;dx<=1;dx++){const tx=Math.floor(x)+dx,tz=Math.floor(z)+dz;const wt=Math.max(0,1.3-Math.hypot(tx+.5-x,tz+.5-z));if(wt<=0)continue;nn+=wt;const t=G.ter[Math.min(MH-1,Math.max(0,tz))*MW+Math.min(MW-1,Math.max(0,tx))];if(t===1)w+=wt;else if(t===2)f+=wt}
  const a=w/nn,b=f/nn,nz=(ART.fbm(x*.9,z*.9,5,2)-.5)*.06;
  // montaña: sube con la distancia al borde, con crestas (ruido "ridged") y picos
  const m=tileAt(md,x,z);let boost=0;if(m>.55){const k=Math.min(m-.55,3.6);const r1=1-Math.abs(ART.fbm(x*.23,z*.23,41,3)*2-1),r2=1-Math.abs(ART.fbm(x*.61,z*.61,43,2)*2-1);boost=k*.85+(r1*r1*1.3+r2*.35)*Math.min(1,k*.9)}
  mdV[i]=m;Y[i]=(a>0||b>0?-.75*a*a-.08*a-.34*b:nz)+hT(x,z)+boost;pos.setY(i,Y[i]);
  mixA[i*4+1]=tileAt(snowT,x,z);mixA[i*4+2]=tileAt(aridT,x,z);mixA[i*4+3]=tileAt(desT,x,z);
  tintA[i*4]=tileAt(tint,x,z)/1;tintA[i*4+3]=tileAt(lushT,x,z)}
 // el tinte se interpola por canal
 if(RC){const tr=new Float32Array(n),tg=new Float32Array(n),tb=new Float32Array(n);for(let i=0;i<n;i++){tr[i]=tint[i*3];tg[i]=tint[i*3+1];tb[i]=tint[i*3+2]}for(let i=0;i<cnt;i++){const x=pos.getX(i),z=pos.getZ(i);tintA[i*4]=tileAt(tr,x,z);tintA[i*4+1]=tileAt(tg,x,z);tintA[i*4+2]=tileAt(tb,x,z)}}
 else for(let i=0;i<cnt;i++){tintA[i*4]=tintA[i*4+1]=tintA[i*4+2]=1}
 geo.computeVertexNormals();const nor=geo.attributes.normal;
 for(let i=0;i<cnt;i++){const ny=nor.getY(i);const slope=1-ny;mixA[i*4]=Math.max(sstep(.22,.45,slope),sstep(.6,1.4,mdV[i]));
  // nieve: en cumbres altas (también por altura en las montañas); menos en paredes muy verticales
  const hs=mdV[i]>1.2&&Y[i]>(RC?3.6:2.9)?sstep(RC?3.6:2.9,(RC?3.6:2.9)+1.2,Y[i]):0;mixA[i*4+1]=Math.max(mixA[i*4+1],hs)*(1-sstep(.45,.75,slope)*.7)}
 geo.setAttribute('aMix',new TH.BufferAttribute(mixA,4));geo.setAttribute('aTint',new TH.BufferAttribute(tintA,4));
 TR={seg,MG,gw,gh,Y,md,snowT,aridT,lushT};
 const tx=k=>PX&&PX[k]?PX[k]:null;
 const m=new TH.MeshStandardMaterial({map:tx('grass')||T2.grass,roughness:.95,metalness:0});
 const U2={tPave:{get value(){return paveTex}},tPaveM:paveTU,uPave:paveU,tDirt:{value:tx('dirt')||T2.dirt},tSand:{value:tx('sand')||T2.sand},tRock:{value:tx('rock')||T2.rock},tSplat:{value:splatTex},uRep:{value:new TH.Vector2(MW/3.2,MH/3.2)},
  tLush:{value:tx('lush')||T2.grass},tArid:{value:tx('arid')||T2.sand},tDes:{value:tx('desert')||T2.sand},tSnow:{value:tx('snow')||T2.sand},uTintK:{value:RC?.42:0},uPhoto:{value:PX?1:0}};
 fogify(m);const pf=m.onBeforeCompile;m.onBeforeCompile=sh=>{pf(sh);Object.assign(sh.uniforms,U2);
  sh.vertexShader='attribute vec4 aMix,aTint;varying vec4 vMix,vTint;varying vec3 vWP,vWN;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvMix=aMix;vTint=aTint;vWP=position;vWN=normal;');
  sh.fragmentShader='uniform sampler2D tDirt,tSand,tRock,tSplat,tPave,tPaveM,tLush,tArid,tDes,tSnow;uniform vec2 uRep;uniform float uPave,uTintK,uPhoto;varying vec4 vMix,vTint;varying vec3 vWP,vWN;\n'+sh.fragmentShader.replace('#include <map_fragment>',`
  vec2 tuv=vMapUv*uRep;vec4 sp=texture2D(tSplat,vec2(vMapUv.x,1.-vMapUv.y));
  vec3 g1=texture2D(map,tuv).rgb,g2=texture2D(map,tuv*.31+vec2(.37,.11)).rgb;vec3 gr=mix(g1,g2,.45);
  float nz=texture2D(tRock,tuv*.043+.17).g;float edge=(nz-.3)*2.;
  vec3 lu=mix(texture2D(tLush,tuv*.8).rgb,texture2D(tLush,tuv*.27+.3).rgb,.4);gr=mix(gr,lu,smoothstep(.2,.8,vTint.a+edge*.2)*.85);
  vec3 ar=mix(texture2D(tArid,tuv*.9).rgb,texture2D(tArid,tuv*.27+.2).rgb,.4);ar=mix(ar,gr*vec3(1.1,1.,.8),.3);gr=mix(gr,ar,smoothstep(.3,.8,vMix.z+edge*.3)*.85);
  vec3 de=mix(texture2D(tDes,tuv*.7).rgb,texture2D(tDes,tuv*.21+.4).rgb,.4);gr=mix(gr,de,smoothstep(.3,.7,vMix.w+edge*.25));
  vec3 di=mix(texture2D(tDirt,tuv*.9).rgb,texture2D(tDirt,tuv*.23+.5).rgb,.4);vec3 sa=mix(texture2D(tSand,tuv*1.1).rgb,texture2D(tSand,tuv*.3+.2).rgb,.35);
  // roca con proyección biplanar para que las laderas no se estiren
  vec3 an=abs(normalize(vWN));an=pow(an,vec3(4.));an/=an.x+an.y+an.z;
  vec3 ro=texture2D(tRock,vWP.xz*.23).rgb*an.y+texture2D(tRock,vWP.xy*.23).rgb*an.z+texture2D(tRock,vWP.zy*.23).rgb*an.x;
  vec3 sn=texture2D(tSnow,tuv*.6).rgb*1.05;
  float wd=smoothstep(.25,.6,sp.r+edge*.35),ws=smoothstep(.3,.62,sp.g+edge*.25),wr=smoothstep(.3,.65,max(sp.b,vMix.x*.95)+edge*.3);ro*=1.25;
  vec3 col=mix(gr,di,wd);col=mix(col,sa,ws);col=mix(col,ro,wr);
  col=mix(col,sn,smoothstep(.35,.62,vMix.y+edge*.25));
  col*=mix(vec3(1.),vTint.rgb,uTintK*(1.-ws)*(1.-smoothstep(.35,.62,vMix.y)));
  col*=mix(.86,1.12,sp.a);
  float od=max(max(-vWP.x,vWP.x-uMap.x),max(-vWP.z,vWP.z-uMap.y));col*=1.-.8*smoothstep(0.,6.,od);
  float pv=texture2D(tPave,vec2(vMapUv.x,1.-vMapUv.y)).r;col=mix(col,texture2D(tPaveM,tuv*1.6).rgb,smoothstep(.35,.75,pv+edge*.15)*uPave);
  diffuseColor.rgb*=col;`)};
 m.customProgramCacheKey=()=>'terrain6';
 const gm=new TH.Mesh(geo,m);gm.receiveShadow=true;gm.castShadow=!!RC;world.add(gm);
 world.add(new TH.Mesh(new TH.PlaneGeometry(MW+300,MH+300).rotateX(-Math.PI/2).translate(MW/2,-1.4,MH/2),new TH.MeshBasicMaterial({color:0x07080a})));
 // agua: color por profundidad, espuma en la orilla y oleaje. La superficie sigue la altura local (ríos y lagos de montaña) y forma cascadas donde el río baja de golpe
 const cd=coastDistT(G),dd=new Uint8Array(n*4);for(let i=0;i<n;i++){const v=G.ter[i]===1?Math.min(255,Math.round(cd[i]/5*255)):0;dd[i*4]=v;dd[i*4+1]=WI.seaD[i]<=1.5?255:0;dd[i*4+3]=255}
 if(depthTex)depthTex.dispose();depthTex=new TH.DataTexture(dd,MW,MH);depthTex.magFilter=depthTex.minFilter=TH.LinearFilter;depthTex.needsUpdate=true;
 const wn=T2.wn;wn.repeat.set(MW/5,MH/5);
 waterMat=new TH.MeshStandardMaterial({color:0xffffff,roughness:.12,metalness:.1,transparent:true,opacity:1,normalMap:wn,normalScale:new TH.Vector2(.45,.45)});
 fogify(waterMat);const pw=waterMat.onBeforeCompile;const WU={tDepth:{value:depthTex},uTime:ART.timeU,uMap2:mapU};
 waterMat.onBeforeCompile=sh=>{pw(sh);Object.assign(sh.uniforms,WU);
  sh.vertexShader='attribute float aFoam;attribute vec2 aFlow;varying float vFoam;varying vec2 vFlow;varying vec2 vWUv;\nuniform vec2 uMap2;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvFoam=aFoam;vFlow=aFlow;vWUv=(modelMatrix*vec4(position,1.)).xz/uMap2;');
  sh.fragmentShader='uniform sampler2D tDepth;uniform float uTime;uniform vec2 uMap2;varying vec2 vWUv;varying float vFoam;varying vec2 vFlow;\n'+sh.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
  vec4 dpt=texture2D(tDepth,vWUv);float dp=dpt.r,seaK=dpt.g;
  vec3 shallow=vec3(.20,.52,.50),mid=vec3(.08,.33,.42),deep=vec3(.03,.16,.28);
  vec3 wc=mix(shallow,mid,smoothstep(.0,.35,dp));wc=mix(wc,deep,smoothstep(.35,1.,dp));wc=mix(vec3(.10,.34,.38),wc,seaK);
  float fo=(smoothstep(.16,.0,dp)*(.55+.45*sin(uTime*1.6+dp*55.+vWUv.x*40.))+smoothstep(.07,.0,dp)*.6)*seaK;
  vec2 wp=vWUv*uMap2;vec2 fd=normalize(vFlow+vec2(1e-4));vec2 sd=vec2(-fd.y,fd.x);
  float along=dot(wp,fd),across=dot(wp,sd);
  float st=fract(along*2.2-uTime*2.4+sin(across*9.)*.35)*.6+fract(along*4.1-uTime*3.7+sin(across*17.+1.3)*.4)*.4;
  float streak=smoothstep(.25,.75,st)*(.6+.4*sin(across*23.));
  fo+=vFoam*(.35+.75*streak);
  diffuseColor.rgb=mix(wc,vec3(.92,.95,.93),clamp(fo,0.,1.)*.85);
  float od=max(max(-vWUv.x,vWUv.x-1.)*uMap2.x,max(-vWUv.y,vWUv.y-1.)*uMap2.y);diffuseColor.rgb*=1.-.8*smoothstep(0.,6.,od);
  diffuseColor.a=mix(mix(.86,.72,seaK),.94,smoothstep(0.,.5,dp))+fo*.2;`)};
 waterMat.customProgramCacheKey=()=>'water7';
 {const wseg=2,WG=20,ww=(MW+2*WG)*wseg+1,wh=(MH+2*WG)*wseg+1;const P=[],F=[],FL=[],IX=[];const vid=new Int32Array(ww*wh).fill(-1);const near=new Uint8Array(n);
  for(let i=0;i<n;i++)if(G.ter[i]===1||G.ter[i]===2){const x=i%MW,y=(i/MW)|0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=x+dx,yy=y+dy;if(xx>=0&&yy>=0&&xx<MW&&yy<MH)near[yy*MW+xx]=1}}
  // caída del agua por casilla: desnivel con las casillas de agua vecinas (solo ríos; el mar no tiene saltos)
  const fall=new Float32Array(n);if(G.hgt)for(let i=0;i<n;i++){if(!(G.ter[i]===1||G.ter[i]===2)||WI.sea[i])continue;const x=i%MW,y=(i/MW)|0;let m=0;for(const [dx,dy] of[[1,0],[-1,0],[0,1],[0,-1]]){const xx=x+dx,yy=y+dy;if(xx<0||yy<0||xx>=MW||yy>=MH)continue;const j=yy*MW+xx;if(G.ter[j]===1||G.ter[j]===2)m=Math.max(m,Math.abs(G.hgt[j]-G.hgt[i]))}fall[i]=sstep(.12,.4,m)}
  const V=(gx,gz)=>{const k=gz*ww+gx;if(vid[k]>=0)return vid[k];const x=gx/wseg-WG,z=gz/wseg-WG;const h=hT(x,z);const g=tileAt(fall,x,z);const ti=Math.min(MH-1,Math.max(0,Math.floor(z)))*MW+Math.min(MW-1,Math.max(0,Math.floor(x)));P.push(x,h-.2,z);F.push(WI.seaD[ti]<=1?0:g);{const e=.35,ax=hT(x-e,z)-hT(x+e,z),az=hT(x,z-e)-hT(x,z+e),l=Math.hypot(ax,az)||1;FL.push(ax/l,az/l)}return vid[k]=P.length/3-1};
  for(let gz=0;gz<wh-1;gz++)for(let gx=0;gx<ww-1;gx++){const tx=Math.min(MW-1,Math.max(0,Math.floor(gx/wseg)-WG)),tz=Math.min(MH-1,Math.max(0,Math.floor(gz/wseg)-WG));if(!near[tz*MW+tx])continue;const a=V(gx,gz),b=V(gx+1,gz),c=V(gx,gz+1),d=V(gx+1,gz+1);IX.push(a,c,b,b,c,d)}
  const wg=new TH.BufferGeometry();wg.setAttribute('position',new TH.Float32BufferAttribute(P,3));wg.setAttribute('aFoam',new TH.Float32BufferAttribute(F,1));wg.setAttribute('aFlow',new TH.Float32BufferAttribute(FL,2));
  const uv=new Float32Array(P.length/3*2);for(let i=0;i<P.length/3;i++){uv[i*2]=P[i*3]/MW;uv[i*2+1]=1-P[i*3+2]/MH}wg.setAttribute('uv',new TH.BufferAttribute(uv,2));
  wg.setIndex(IX);wg.computeVertexNormals();const nr=wg.attributes.normal;for(let i=0;i<nr.count;i++)nr.setXYZ(i,0,1,0);
  // cascadas: puntos de salpicadura donde la lámina de agua cae
  falls=[];for(let i=0;i<F.length;i++)if(F[i]>.55&&Math.random()<.35)falls.push([P[i*3],P[i*3+1],P[i*3+2]]);
  const wm=new TH.Mesh(wg,waterMat);wm.receiveShadow=true;world.add(wm)}
}
let falls=[];
let VEG=null;
function buildDecor(G){if(NAT)return buildDecorNat(G);
 let s=77;const rr=()=>{s=(s*16807)%2147483647;return s/2147483647};const k=(MW*MH/7744)*(quality==='low'?.35:quality==='medium'?.7:1);
 const spots=[];for(let y=1;y<MH-1;y++)for(let x=1;x<MW-1;x++){const i=y*MW+x;if(!G.block[i]&&!G.occ[i]&&G.ter[i]===0&&splatData[i*4+1]<150)spots.push([x,y])}if(!spots.length)return;
 const nt=Math.round(5200*k),nr=Math.round(420*k),nf=Math.round(1200*k),nb=Math.round(260*k);
 const tuft=new TH.InstancedMesh(VEG.tuft,ART.M.grassBlade,nt),rock=new TH.InstancedMesh(VEG.rock[0],ART.M.stone,nr),flower=new TH.InstancedMesh(sphG(.028,0),mat(0xffffff,{roughness:.6}),nf),bush=new TH.InstancedMesh(VEG.bush[0],ART.M.leaf,nb);
 const add=(m,n,f)=>{for(let i=0;i<n;i++){const [x,y]=spots[Math.floor(rr()*spots.length)];f(i,x+rr(),y+rr())}m.instanceMatrix.needsUpdate=true};
 const col=new TH.Color(),arid=G.cfg&&G.cfg.map==='arabia';
 add(tuft,nt,(i,x,z)=>{dummy.position.set(x,hT(x,z),z);dummy.rotation.set(0,rr()*6,0);const q=.6+rr()*.9;dummy.scale.set(q,q*(.6+rr()*.8),q);dummy.updateMatrix();tuft.setMatrixAt(i,dummy.matrix);col.setHSL(arid?.15+rr()*.05:.22+rr()*.06,.5,.55+rr()*.3);tuft.setColorAt(i,col)});
 add(rock,nr,(i,x,z)=>{dummy.position.set(x,hT(x,z),z);dummy.rotation.set(0,rr()*6,0);const q=.35+rr()*.8;dummy.scale.set(q,q,q);dummy.updateMatrix();rock.setMatrixAt(i,dummy.matrix)});
 const fc=[0xf3efe2,0xf1d25a,0xb48ad6,0xe9786b];
 add(flower,nf,(i,x,z)=>{dummy.position.set(x,.08+hT(x,z),z);dummy.rotation.set(0,0,0);dummy.scale.setScalar(.8+rr()*.6);dummy.updateMatrix();flower.setMatrixAt(i,dummy.matrix);col.setHex(fc[Math.floor(rr()*4)]);flower.setColorAt(i,col)});
 // arbustos: preferentemente junto a los bosques
 let bi=0;for(const e of G.list){if(bi>=nb)break;if(e.kind!=='res'||e.type!=='tree'||rr()>.12)continue;const a=rr()*6,x=e.tx+.5+Math.cos(a)*1.1,z=e.ty+.5+Math.sin(a)*1.1,tx=x|0,tz=z|0;if(tx<0||tz<0||tx>=MW||tz>=MH||G.block[tz*MW+tx])continue;
  dummy.position.set(x,hT(x,z),z);dummy.rotation.set(0,rr()*6,0);dummy.scale.setScalar(.7+rr()*.6);dummy.updateMatrix();bush.setMatrixAt(bi++,dummy.matrix)}bush.count=bi;bush.instanceMatrix.needsUpdate=true;
 for(const m of[tuft,rock,bush])m.receiveShadow=true;bush.castShadow=true;rock.castShadow=true;world.add(tuft,rock,flower,bush);
}// decorado con modelos reales: hierba, flores, matorrales y rocas (también sobre las montañas)
function buildDecorNat(G){let s=77;const rr=()=>{s=(s*16807)%2147483647;return s/2147483647};const k=(MW*MH/7744)*(quality==='low'?.35:quality==='medium'?.7:1);
 const spots=[],dry=[];for(let y=1;y<MH-1;y++)for(let x=1;x<MW-1;x++){const i=y*MW+x;if(G.block[i]||G.occ[i]||G.ter[i]!==0||splatData[i*4+1]>=150)continue;if(TR&&(TR.snowT[i]>.4))continue;if(TR&&TR.aridT[i]>.8&&(!WI||WI.wD[i]>2))dry.push([x,y]);else spots.push([x,y])}
 const col=new TH.Color();const all=spots.concat(dry);if(!all.length)return;
 const inst=(key,n,f,shadow)=>{const M=NAT.model(key);if(!M||n<=0)return;const ms=M.parts.map(P=>{const im=new TH.InstancedMesh(P.g0,P.mat,n);im.customDepthMaterial=P.dmat;im.castShadow=!!shadow;im.receiveShadow=true;world.add(im);return{im,P}});
  let c=0;for(let i=0;i<n;i++){const r=f(i);if(!r)continue;dummy.position.set(r.x,r.y,r.z);dummy.rotation.set(0,r.ry,0);dummy.scale.set(r.s,r.sy||r.s,r.s);dummy.updateMatrix();for(const {im,P} of ms){im.setMatrixAt(c,dummy.matrix);if(P.leaf){if(/Flowers/.test(P.tex||''))col.setRGB(1,1,1);else col.setRGB(r.cr??1,r.cg??1,r.cb??1);im.setColorAt(c,col)}}c++}
  for(const {im} of ms){im.count=c;im.instanceMatrix.needsUpdate=true;if(im.instanceColor)im.instanceColor.needsUpdate=true}};
 const at=(list)=>{const [x,y]=list[Math.floor(rr()*list.length)];const px=x+rr(),pz=y+rr();return{x:px,z:pz,i:y*MW+x,y:hT(px,pz)}};
 const grassCol=(i,r)=>{const a=TR?Math.min(1,TR.aridT[i]):0;const v=.8+r*.35;return{cr:v*(1+a*.35),cg:v*(1-a*.08),cb:v*(1-a*.45)}};
 if(spots.length){const ng=Math.round(3600*k);for(const key of['grass1','grass2'])inst(key,ng>>1,()=>{const p=at(spots);const q=.8+rr()*.7;return Object.assign({x:p.x,y:p.y,z:p.z,s:q,sy:q*(.7+rr()*.6),ry:rr()*6},grassCol(p.i,rr()))});
  const nf=Math.round(420*k);for(const key of['flower1','flower2'])inst(key,nf>>1,()=>{const p=at(spots);if(TR&&TR.aridT[p.i]>.5)return null;const q=.8+rr()*.6;return{x:p.x,y:p.y,z:p.z,s:q,ry:rr()*6}})}
 // matorrales junto a los bosques
 const trees=G.list.filter(e=>e.kind==='res'&&e.type==='tree');const nb=Math.round(300*k);
 for(const key of['bush1','bush2','bush3','bushf'])inst(key,Math.round(nb/4),()=>{if(!trees.length)return null;for(let t=0;t<6;t++){const e=trees[Math.floor(rr()*trees.length)];const a=rr()*6,x=e.tx+.5+Math.cos(a)*1.1,z=e.ty+.5+Math.sin(a)*1.1,tx=x|0,tz=z|0;if(tx<0||tz<0||tx>=MW||tz>=MH||G.block[tz*MW+tx])continue;const q=.42+rr()*.32;const tc=NAT.tint('bush',rr(),new TH.Color(),TR?Math.min(1,TR.aridT[tz*MW+tx]):0);return{x,y:hT(x,z),z,s:q,ry:rr()*6,cr:tc.r,cg:tc.g,cb:tc.b}}return null},true);
 // rocas: dispersas por el llano, más en zonas secas y muchas en las montañas
 const mt=[];if(TR)for(let i=0;i<MW*MH;i++)if(G.ter[i]===3)mt.push(i);
 const nr=Math.round(110*k)+Math.min(1600,mt.length*.8|0);let ri=0;
 for(const key of['rock1','rock2','rock3','rock4','rock5'])inst(key,Math.round(nr/5),()=>{ri++;if(mt.length&&rr()<mt.length*.8/nr){const i=mt[Math.floor(rr()*mt.length)];const x=i%MW+rr(),z=((i/MW)|0)+rr();const q=.8+rr()*1.6;return{x,y:terrH(x,z)-.05,z,s:q,sy:q*(.55+rr()*.4),ry:rr()*6}}
  const p=at(dry.length&&rr()<.5?dry:all);const q=.45+rr()*.9;return{x:p.x,y:p.y-.03,z:p.z,s:q,sy:q*(.5+rr()*.4),ry:rr()*6}},true);
}

// ---------- vegetación realista (nature.js)
const natChunks=[];
// contexto del bioma por casilla para elegir especie
function natCtx(G){const RC=WI&&WI.RC,mapId=G.cfg&&G.cfg.map;let hmax=0;if(G.hgt)for(let i=0;i<MW*MH;i++)hmax=Math.max(hmax,G.hgt[i]);
 const lat=y=>RC?NAT.latAt(G.real,y,MH):mapId==='arabia'?29:mapId==='islas'?19:mapId==='bosque'?52:46;
 const f=(x,y,u)=>{const i=y*MW+x;return{lat:lat(y),el:RC?RC.el[i]:0,r:RC?RC.col[i*3]:null,g:RC?RC.col[i*3+1]:null,b:RC?RC.col[i*3+2]:null,hi:G.hgt&&hmax>.5?G.hgt[i]/hmax:0,coast:WI?WI.seaD[i]:99,arid:mapId==='arabia'?.75:TR?TR.aridT[i]:0,patch:ART.fbm(x/13,y/13,313,2),u}};
 f.aridAt=(x,y)=>TR?Math.min(1,TR.aridT[y*MW+x]):0;return f}
// instancias por (especie, trozo); los recursos se registran para poder talarlos y los decorativos no
function buildNat(items,reg,place,col){const CS=16,groups=new Map();
 for(const it of items){const k=it.key+'|'+Math.floor(it.x/CS)+','+Math.floor(it.z/CS);(groups.get(k)||groups.set(k,[]).get(k)).push(it)}
 for(const [k,list] of groups){const key=k.slice(0,k.indexOf('|'));const M=NAT.model(key);if(!M)continue;let cx=0,cz=0;for(const it of list){cx+=it.x;cz+=it.z}cx/=list.length;cz/=list.length;
  for(const P of M.parts){const im=new TH.InstancedMesh(P.g0,P.mat,list.length);im.customDepthMaterial=P.dmat;im.castShadow=true;im.receiveShadow=true;im.userData.ids=new Array(list.length);
   list.forEach((it,i)=>{if(it.e)place(reg(it.e,im,i,it.x,0,it.z,it.s,it.ry,it.sy));else{dummy.position.set(it.x,it.y,it.z);dummy.rotation.set(0,it.ry,0);dummy.scale.set(it.s,it.sy,it.s);dummy.updateMatrix();im.setMatrixAt(i,dummy.matrix)}
    if(P.leaf){NAT.tint(key,it.u,col,it.arid);im.setColorAt(i,col)}});
   im.instanceMatrix.needsUpdate=true;if(im.instanceColor)im.instanceColor.needsUpdate=true;resRoot.add(im);natChunks.push({m:im,g0:P.g0,g1:P.g1,x:cx,z:cz})}}}
function natLod(){if(!natChunks.length)return;const far=view.dist>48,R2=(view.dist*.62+9)**2;for(const c of natChunks){const d=(c.x-view.tx)**2+(c.z-view.tz)**2;const g=!far&&d<R2?c.g0:c.g1;if(c.m.geometry!==g)c.m.geometry=g}}
function buildResources(G){if(!VEG)VEG=ART.trees();
 const L={tree:[],gold:[],stone:[],berry:[],fish:[]};for(const e of G.list)if(e.kind==='res'&&!e.dead)L[e.type].push(e);
 const col=new TH.Color();
 const IM=(geo,m,n,shadow)=>{const im=new TH.InstancedMesh(geo,m,Math.max(1,n));im.count=n;im.castShadow=shadow!==false;im.receiveShadow=true;im.userData.ids=new Array(n);instMeshes.push(im);resRoot.add(im);return im};
 const reg=(e,m,i,x,y,z,s,ry,sy,kind)=>{m.userData.ids[i]=e.id;const rec={m,i,x,y:y+(e.type==='fish'?0:hT(x,z)),z,s,ry,sy:sy||s,kind};(resInst.get(e.id)||resInst.set(e.id,[]).get(e.id)).push(rec);return rec};
 const place=rec=>{dummy.position.set(rec.x,rec.y,rec.z);dummy.rotation.set(rec.rx||0,rec.ry,rec.rz||0);dummy.scale.set(rec.s*(rec.f??1),rec.sy*(rec.f??1),rec.s*(rec.f??1));dummy.updateMatrix();rec.m.setMatrixAt(rec.i,dummy.matrix)};
 // árboles: modelos realistas por especie según el bioma, en trozos de 16×16 casillas (recorte por cámara) con dos niveles de detalle
 if(NAT){natChunks.length=0;const items=[];const ctx=natCtx(G);
  for(const e of L.tree){const x=e.tx+.5+(e.v*7%1-.5)*.3,z=e.ty+.5+(e.v*13%1-.5)*.3,u=e.v*57%1;const key=NAT.species(ctx(e.tx,e.ty,u));const s=(.78+(e.v*31%1)*.4)*(key.startsWith('palm')?1.05:1);items.push({e,key,x,z,s,sy:s*(1+(e.v*3%1)*.18),ry:e.v*40,u:e.v*91%1,arid:ctx.aridAt(e.tx,e.ty)})}
  // árboles decorativos en las laderas de las montañas (no se talan)
  if(TR){let q=991;const r2=()=>{q=(q*16807)%2147483647;return q/2147483647};for(let i=0;i<MW*MH;i++){if(G.ter[i]!==3||TR.snowT[i]>.35)continue;const tx=i%MW,ty=(i/MW)|0;const m=TR.md[i];const p=m<=1?.55:m<=2?.3:.1;
   for(let k=0;k<2;k++){if(r2()>p*.6)continue;const x=tx+r2(),z=ty+r2(),y=terrH(x,z);if(TR.snowT[i]>.2&&r2()<.5)continue;const u=r2();const key=NAT.species(Object.assign(ctx(tx,ty,u),{hi:1}));const s=.7+r2()*.4;items.push({e:null,key,x,z,y,s,sy:s,ry:r2()*6,u:r2(),arid:0})}}}
  buildNat(items,reg,place,col);
  const proxy=IM(gc('treeProxy',()=>new TH.CylinderGeometry(.35,.35,1.7,6).translate(0,.85,0)),gc('proxyM',()=>new TH.MeshBasicMaterial({visible:false})),L.tree.length,false);
  L.tree.forEach((e,i)=>{const it=items[i];place(reg(e,proxy,i,it.x,0,it.z,it.s,0,it.sy))})}
 else{const vk=e=>e.v<.45?'pine'+(Math.floor(e.v*97)%VEG.pine.length):'oak'+(Math.floor(e.v*89)%VEG.oak.length);
 const byV={};for(const e of L.tree)(byV[vk(e)]||(byV[vk(e)]=[])).push(e);
 for(const key in byV){const list=byV[key],V=key.startsWith('pine')?VEG.pine[+key.slice(4)]:VEG.oak[+key.slice(3)];const crownM=key.startsWith('pine')?ART.M.needle:ART.M.leaf;
  const tr=IM(V.trunk,ART.M.bark,list.length),cr=IM(V.crown,crownM,list.length);
  list.forEach((e,i)=>{const x=e.tx+.5+(e.v*7%1-.5)*.3,z=e.ty+.5+(e.v*13%1-.5)*.3,s=.85+(e.v*31%1)*.45,ry=e.v*40;place(reg(e,tr,i,x,0,z,s,ry,s*(1+(e.v*3%1)*.25)));const c=reg(e,cr,i,x,0,z,s,ry,s*(1+(e.v*3%1)*.25));place(c);
   col.setRGB(.85+(e.v*11%1)*.3,.85+(e.v*5%1)*.3,.8+(e.v*7%1)*.25);cr.setColorAt(i,col)})}}
 // oro y piedra: rocas texturizadas con pepitas
 const gKit=new ART.Kit();gKit.add(new TH.OctahedronGeometry(.07,0),'gold',0xffffff,0,0,0);const nugGeo=gKit.geos().gold;
 const goldRock=IM(VEG.rock[0],ART.M.stone,L.gold.length*3),nug=IM(nugGeo,ART.M.gold,L.gold.length*5);let gi=0,ni=0;
 for(const e of L.gold){for(let q=0;q<3;q++){const a=e.v*20+q*2.1,rec=reg(e,goldRock,gi,e.tx+.5+Math.cos(a)*.22,.02,e.ty+.5+Math.sin(a)*.22,1.1+q*.18,a,1.2);place(rec);col.setRGB(.75,.68,.55);goldRock.setColorAt(gi++,col)}
  for(let q=0;q<5;q++){const a=e.v*9+q*1.3,rec=reg(e,nug,ni++,e.tx+.5+Math.cos(a)*.24,.12+q%2*.08,e.ty+.5+Math.sin(a)*.24,1+(q%3)*.3,a,1);rec.rx=a;place(rec)}}
 const stoneRock=IM(VEG.rock[1],ART.M.stone,L.stone.length*4);let si=0;
 for(const e of L.stone)for(let q=0;q<4;q++){const a=e.v*20+q*1.6,rec=reg(e,stoneRock,si,e.tx+.5+Math.cos(a)*(q?.24:0),.02,e.ty+.5+Math.sin(a)*(q?.24:0),(q?1.1:1.7)+q*.1,a,q?1.1:1.5);place(rec);col.setRGB(1.05,1.05,1.08);stoneRock.setColorAt(si++,col)}
 // arbustos de bayas
 const bush=IM(VEG.bush[1],ART.M.leaf,L.berry.length),berry=IM(sphG(.03,1),mat(0xa81c30,{roughness:.35,flatShading:false}),L.berry.length*9,false);
 let ui=0,bj=0;for(const e of L.berry){place(reg(e,bush,ui++,e.tx+.5,0,e.ty+.5,1.5,e.v*9,1.3));for(let q=0;q<9;q++){const a=q*.7+e.v*5,rr2=.12+(q%3)*.08,rec=reg(e,berry,bj++,e.tx+.5+Math.cos(a)*rr2,.2+(q%3)*.09,e.ty+.5+Math.sin(a)*rr2,1,0,1);rec.kind='b'+q;place(rec)}}
 const fishM=IM(gc('fishG',()=>new TH.IcosahedronGeometry(.1,0).scale(1.8,.5,.7)),mat(0x9fb4bd,{metalness:.5,roughness:.35}),L.fish.length*4,false),shoal=IM(gc('shoal',()=>new TH.CircleGeometry(.46,18).rotateX(-Math.PI/2)),fogify(new TH.MeshBasicMaterial({color:0x1d4c63,transparent:true,opacity:.35,depthWrite:false})),L.fish.length,false);
 let fi=0,si2=0;for(const e of L.fish){place(reg(e,shoal,si2++,e.tx+.5,-.17,e.ty+.5,1,0,1));for(let q=0;q<4;q++){const a=e.v*11+q*1.6,rec=reg(e,fishM,fi++,e.tx+.5+Math.cos(a)*.24,-.2,e.ty+.5+Math.sin(a)*.24,1,-a,1);rec.kind='f';place(rec)}}
 R._fish=fishM;
 for(const im of instMeshes){im.instanceMatrix.needsUpdate=true;if(im.instanceColor)im.instanceColor.needsUpdate=true}
 stumps=new TH.InstancedMesh(gc('stumpG',()=>{const k=new ART.Kit();k.add(new TH.CylinderGeometry(.08,.1,.1,7).translate(0,.05,0),'bark',0xffffff,0,0,0);return k.geos().bark}),ART.M.bark,L.tree.length+10);stumps.count=0;stumps.receiveShadow=true;resRoot.add(stumps);
 R._place=place;
 for(const e of G.list)if(e.kind==='res'&&!e.dead&&e.amt<e.max)updateRes(e);
}
function updateRes(e){const recs=resInst.get(e.id);if(!recs)return;const f=Math.sqrt(Math.max(0,e.amt)/e.max);
 for(const rec of recs){if(e.type==='berry'&&rec.kind&&rec.kind[0]==='b'){rec.f=+rec.kind.slice(1)<Math.ceil(9*f)?1:0}else if(e.type==='gold'||e.type==='stone'||e.type==='fish')rec.f=.35+.65*f;else continue;
  R._place(rec);rec.m.instanceMatrix.needsUpdate=true}}
function removeRes(id,type){const recs=resInst.get(id);if(!recs)return;let x=0,z=0;for(const rec of recs){rec.f=0;R._place(rec);rec.m.instanceMatrix.needsUpdate=true;rec.m.userData.ids[rec.i]=0;x=rec.x;z=rec.z}
 resInst.delete(id);if(type==='tree'&&stumps.count<stumps.instanceMatrix.count){dummy.position.set(x,hT(x,z),z);dummy.rotation.set(0,Math.random()*6,0);dummy.scale.setScalar(1);dummy.updateMatrix();stumps.setMatrixAt(stumps.count++,dummy.matrix);stumps.instanceMatrix.needsUpdate=true}
 puff(x,.4+(type==='fish'?-.3:hT(x,z)),z,type==='tree'?0x7d6a4a:type==='fish'?0xcfe3ea:0xb8b2a4,6)}

// ---------- efectos
const fxGeo=()=>gc('fxs',()=>new TH.IcosahedronGeometry(.12,0));
function puff(x,y,z,color,n,o){for(let i=0;i<n;i++){const m=new TH.Mesh(fxGeo(),new TH.MeshBasicMaterial({color,transparent:true,opacity:.55,depthWrite:false,blending:o&&o.add?TH.AdditiveBlending:TH.NormalBlending}));
 const sp=(o&&o.spread)||.6;m.position.set(x+(Math.random()-.5)*sp,y+Math.random()*.3,z+(Math.random()-.5)*sp);if(o&&o.size)m.scale.setScalar(o.size);fxRoot.add(m);
 fx.push({m,t:0,life:(o&&o.life||1)+Math.random()*.6,vy:(o&&o.vy!=null?o.vy:.35)+Math.random()*.4,grow:o&&o.grow!=null?o.grow:1.8,base:m.scale.x})}}
function marker(wx,wz,color){const m=new TH.Mesh(gc('mk',()=>new TH.RingGeometry(.22,.3,32).rotateX(-Math.PI/2)),new TH.MeshBasicMaterial({color,transparent:true,opacity:1,depthWrite:false}));m.position.set(wx,.05+hT(wx,wz),wz);m.renderOrder=3;fxRoot.add(m);fx.push({m,t:0,life:.6,ring:true})}
function updFx(dt){for(const f of fx){f.t+=dt;const k=f.t/f.life;if(f.ring){f.m.scale.setScalar(1+k*1.8);f.m.material.opacity=1-k}else{f.m.position.y+=f.vy*dt;f.m.scale.setScalar(f.base*(1+k*f.grow));f.m.material.opacity=.55*(1-k)}
 if(k>=1){fxRoot.remove(f.m);f.m.material.dispose();f.dead=true}}
 for(let i=fx.length-1;i>=0;i--)if(fx[i].dead)fx.splice(i,1)}
let arrowPool=[],stonePool=[],javPool=[],axePool=[];
const PPOOL={};const addM=(c,o)=>new TH.MeshBasicMaterial(Object.assign({color:c,transparent:true,blending:TH.AdditiveBlending,depthWrite:false,toneMapped:false},o||{}));
const PMK={bullet:()=>new TH.Mesh(gc('trc',()=>new TH.BoxGeometry(.018,.018,.55)),addM(0xffe6a0)),
 laser:()=>new TH.Mesh(gc('lsr',()=>new TH.BoxGeometry(.03,.03,1.3)),addM(0x6ff4ff)),
 plasma:()=>{const g=new TH.Group();g.add(new TH.Mesh(gc('plc',()=>new TH.SphereGeometry(.06,10,8)),addM(0xd8fff0)),new TH.Mesh(gc('plh',()=>new TH.SphereGeometry(.14,10,8)),addM(0x5affb0,{opacity:.5})));return g},
 rocket:()=>{const g=new TH.Group();g.add(new TH.Mesh(gc('rkt',()=>new TH.CylinderGeometry(.025,.025,.24,6).rotateX(Math.PI/2)),mat(0x9aa0a4)),new TH.Mesh(gc('rkf',()=>new TH.ConeGeometry(.035,.16,6).rotateX(-Math.PI/2).translate(0,0,-.2)),addM(0xffa040)));return g},
 grenade:()=>new TH.Mesh(gc('grn',()=>new TH.SphereGeometry(.035,8,6)),mat(0x3a4a2a)),
 ball:()=>new TH.Mesh(gc('bal',()=>new TH.SphereGeometry(.06,10,8)),mat(0x222222)),
 shell:()=>new TH.Mesh(gc('shl',()=>new TH.CapsuleGeometry(.035,.09,3,8).rotateX(Math.PI/2)),mat(0x4a4436))};
function javMesh(){const g=new TH.Group();g.add(new TH.Mesh(gc('jav',()=>new TH.CylinderGeometry(.014,.014,.7,4).rotateX(Math.PI/2)),mat(0x6b4a2d)),new TH.Mesh(gc('javt',()=>new TH.ConeGeometry(.03,.1,4).rotateX(Math.PI/2).translate(0,0,.38)),mat(C.STEEL)));fxRoot.add(g);return g}
function axeMesh(){const g=new TH.Group(),h=new TH.Group();h.add(new TH.Mesh(gc('axh',()=>new TH.BoxGeometry(.03,.3,.03)),mat(0x6b4a2d)),new TH.Mesh(gc('axb',()=>new TH.BoxGeometry(.04,.1,.12).translate(0,.13,.05)),mat(C.STEEL)));g.add(h);g.userData.h=h;fxRoot.add(g);return g}
function arrowMesh(){const g=new TH.Group();g.add(new TH.Mesh(gc('arw',()=>new TH.CylinderGeometry(.012,.012,.42,4).rotateX(Math.PI/2)),mat(0x5a4632)),new TH.Mesh(gc('arwt',()=>new TH.ConeGeometry(.025,.07,4).rotateX(Math.PI/2).translate(0,0,.24)),mat(C.STEEL)));fxRoot.add(g);return g}
function stoneMesh(){const m=new TH.Mesh(sphG(.1,0),mat(0x8d877c));m.castShadow=true;fxRoot.add(m);return m}
function drawProj(G){let i=0,j=0,v=0,w=0;for(const p of G.proj){if(!I.isAlly(p.owner,ME())&&!G.vis[I.idx(Math.min(MW-1,Math.max(0,p.x/T|0)),Math.min(MH-1,Math.max(0,p.y/T|0)))])continue;
 const hy=p.h+hT(p.x/T,p.y/T);
 if(PMK[p.kind]){const L=PPOOL[p.kind]||(PPOOL[p.kind]={a:[],n:0});const m=L.a[L.n]||(L.a[L.n]=(()=>{const q=PMK[p.kind]();fxRoot.add(q);return q})());L.n++;m.visible=true;m.position.set(p.x/T,hy,p.y/T);tmpV.set(p.x/T+p.vx/T*4,hy+p.vh*4,p.y/T+p.vy/T*4);m.lookAt(tmpV);if(p.kind==='rocket'&&Math.random()<.5)puff(p.x/T,hy,p.y/T,0xb0aaa0,1,{spread:.02,size:.25,life:.5,vy:.1,grow:2});continue}
 if(p.kind==='stone'){const s=stonePool[j]||(stonePool[j]=stoneMesh());s.visible=true;s.position.set(p.x/T,hy,p.y/T);s.rotation.x+=.2;j++;continue}
 if(p.kind==='axe'){const a=axePool[w]||(axePool[w]=axeMesh());a.visible=true;a.position.set(p.x/T,hy,p.y/T);tmpV.set(p.x/T+p.vx/T*4,hy,p.y/T+p.vy/T*4);a.lookAt(tmpV);a.userData.h.rotation.x=p.k*14;w++;continue}
 const pool=p.kind==='javelin'?javPool:arrowPool,ix=p.kind==='javelin'?v++:i++;const a=pool[ix]||(pool[ix]=p.kind==='javelin'?javMesh():arrowMesh());a.visible=true;a.position.set(p.x/T,hy,p.y/T);tmpV.set(p.x/T+p.vx/T*4,hy+p.vh*4,p.y/T+p.vy/T*4);a.lookAt(tmpV)}
 for(const k in PPOOL){const L=PPOOL[k];for(let q=L.n;q<L.a.length;q++)L.a[q].visible=false;L.n=0}
 for(let k=i;k<arrowPool.length;k++)arrowPool[k].visible=false;for(let k=j;k<stonePool.length;k++)stonePool[k].visible=false;for(let k=v;k<javPool.length;k++)javPool[k].visible=false;for(let k=w;k<axePool.length;k++)axePool[k].visible=false}

// ---------- sincronización con la simulación
// ---------- personajes esqueléticos (chars.js): clave de modelo por tipo, edad y mejora; variante femenina alterna
const CHR=root.ImperiaChars,CH_TYPES={villager:1,militia:1,spear:1,archer:1,monk:1,almogavar:1,axeman:1,longbow:1,tknight:1,scout:1,knight:1,cataphract:1},CH_SKIP={scout:[5,6,7,8],knight:[5,6,7]};
const _cm=new TH.Matrix4(),_cq=new TH.Quaternion(),_cy=new TH.Vector3(0,1,0),_c1=new TH.Vector3(1,1,1),_c0=new TH.Vector3(0,0,0);
const TOOLBIT={axe:1,pick:2,hoe:3,hammer:4,basket:5};const CARRYC={food:0xc2533d,wood:0x8a5c33,gold:0xe8c24c,stone:0xa8adb2};
function charKey(e){if(!CHR||!CHR.ok||!CH_TYPES[e.type])return null;const p=I.G.players[e.owner];let t=p?Math.min(8,p.age):0;if(t<2&&upOf(e))t++;if(CH_SKIP[e.type]&&CH_SKIP[e.type].includes(t))return null;
 for(let k=t;k>=0;k--){const key=e.type+'_'+k;if(CHR.has(key))return(e.id%3===1&&CHR.has(key+'f'))?key+'f':key}return null}
function dropObj(o){(o.e.kind==='bld'?bldRoot:unitRoot).remove(o.g);if(o.ch){CHR.free(o.ch);o.ch=null}}
function charPose(o,e,dt,g,dying){const h=o.ch;const key=o.ck;const pc=(ART._&&ART._.PC||[0x2f6fd6,0xc8352a,0xe0b12a,0x8a4fcf])[e.owner%4];
 if(!g.visible){_cm.compose(_c0,_cq.identity(),_c0);CHRset(h,_cm,'idle',0,pc,0);return}
 _cq.setFromAxisAngle(_cy,g.rotation.y);_cm.compose(g.position,_cq,_c1);
 if(dying!=null){CHRset(h,_cm,'die',dying,pc,0);return}
 const gun=CHR.models[key].D.gun,d=U[e.type],task=e.work?e.task:null;
 if(e.atkAnim>0&&e.atkAnim>(o.pa||0)+.01){o.atkT=0;o.atkC=gun?'shoot':'attack'}o.pa=e.atkAnim;
 let clip,rate=1;
 if(o.atkT!=null&&o.atkT<CHR.clipLen(key,o.atkC)){clip=o.atkC;o.atkT+=dt*1.25}
 else{o.atkT=null;
  if(task==='chop'||task==='mine'||task==='build')clip='work';
  else if(task==='farm'||task==='forage')clip='gather';
  else if(task==='heal'||task==='conv')clip='cast';
  else if(e.walk){const sp=I.uSpeed?I.uSpeed(e):d.speed;if(sp>75){clip='run';rate=sp/120}else{clip='walk';rate=sp/52}}
  else clip=gun?'idle_gun':'idle'}
 if(o.cc!==clip||!Number.isFinite(o.ct)){o.cc=clip;o.ct=clip==='idle'||clip==='idle_gun'||clip==='walk'?(e.id*.37)%2:0}o.ct+=Number.isFinite(rate)?dt*rate:dt;
 let mask=0;if(e.type==='villager'){let tool=null;if(e.o.t==='build'&&(e.work||e.walk))tool='hammer';else if(e.o.t==='gather'){const r=I.G.ents.get(e.o.id);tool=r&&r.kind==='bld'?'hoe':({wood:'axe',gold:'pick',stone:'pick'})[e.o.rt]||(r&&r.type==='berry'?'basket':null)}
  if(tool)mask|=1<<TOOLBIT[tool];if(e.carry&&e.carry.a>0)mask|=1<<15}
 CHRset(h,_cm,clip,o.ct,pc,mask,e.carry&&CARRYC[e.carry.t])}
function CHRset(h,m,clip,t,pc,mask,carry){CHR.set(h,m,clip,t,pc,mask,carry)}
function upOf(e){const p=I.G.players[e.owner];return !!(p&&p.up&&p.up[e.type])}
function bldY(e){const s=e.size;let m=99;for(const [x,z] of[[e.tx,e.ty],[e.tx+s,e.ty],[e.tx,e.ty+s],[e.tx+s,e.ty+s],[e.tx+s/2,e.ty+s/2]])m=Math.min(m,hT(x,z));return B[e.type].coast?0:m}
function createObj(e){let g;
 if(e.kind==='relic'){g=relicModel();unitRoot.add(g);g.traverse(o=>{o.userData.id=e.id});return{g,e,seen:frame,rot:0,owner:null}}
 if(e.kind==='unit'){const up=upOf(e);g=unitModel(e.type,e.owner,up,tierOf(e.owner));unitRoot.add(g);g.traverse(o=>{o.userData.id=e.id});g.userData.id=e.id;const ck=charKey(e);const ob={g,e,seen:frame,rot:-(e.dir||0),owner:e.owner,up,ck,ut:eraOf(e)};
  if(ck){ob.ch=CHR.alloc(ck);const P2=g.userData.parts;if(P2.body)P2.body.visible=false}return ob}
 else{g=new TH.Group();const m=buildModel(e.type,e.owner,e);g.add(m);g.userData.model=m;const s=e.size,wall=B[e.type].wall;
  const sc=ART.rig?ART.rig(s,tierOf(e.owner)):new TH.Group();g.add(sc);g.userData.scaf=sc;
  const fnd=P(boxG(s-.08,.03,s-.08),mat(0x8c7355));g.add(fnd);g.userData.fnd=fnd;
  const ring=new TH.Mesh(gc('sq'+s,()=>new TH.RingGeometry(s*.72,s*.72+.1,4,1,Math.PI/4).rotateX(-Math.PI/2)),new TH.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.85,depthWrite:false}));ring.position.y=.06;ring.visible=false;g.add(ring);g.userData.ring=ring;
  if(wall)sc.visible=false;
  g.position.set(e.tx+s/2,bldY(e),e.ty+s/2);bldRoot.add(g);if(!wall&&!B[e.type].farm&&!B[e.type].coast)stampDirt(e.tx,e.ty,s,s>=3?1.6:1.1,.9)}
 g.traverse(o=>{o.userData.id=e.id});g.userData.id=e.id;
 return{g,e,seen:frame,rot:-(e.dir||0),owner:e.owner,tier:e.kind==='bld'?tierOf(e.owner):0}}
function angLerp(a,b,t){let d=b-a;while(d>Math.PI)d-=Math.PI*2;while(d<-Math.PI)d+=Math.PI*2;return a+d*t}
const TOOL={wood:'axe',gold:'pick',stone:'pick'};
function updUnitObj(o,e,dt,G){const g=o.g,p=g.userData.parts;
 // red de seguridad: si la instancia del personaje se perdió, se vuelve a pedir (nunca debe quedar solo el círculo de selección)
 if(o.ck&&(!o.ch||o.ch.i<0||o.ch.M.h[o.ch.i]!==o.ch)){o.ch=CHR.alloc(o.ck);if(!o.ch&&p.body)p.body.visible=true}
 const ti=I.idx(Math.min(MW-1,Math.max(0,e.x/T|0)),Math.min(MH-1,Math.max(0,e.y/T|0)));
 g.visible=!e.gar&&(I.isAlly(e.owner,ME())||G.vis[ti]===1);if(!g.visible){if(o.ch)charPose(o,e,dt,g);return}
 const px=e.x/T,pz=e.y/T;
 if(p.ship){const bob=Math.sin(frame*.05+e.id)*.025;g.position.set(px,-.2+bob,pz);g.rotation.z=Math.sin(frame*.04+e.id*.7)*.035;
  if(p.oars){const k=e.walk?Math.sin(frame*.25):0;for(const r of p.oars)r.o.rotation.y=k*.5*r.s}if(p.net)p.net.visible=e.work}
 else g.position.set(px,(G.ter[ti]===2?-.16:0)+hT(px,pz),pz);
 if(p.fly)g.position.y=Math.max(g.position.y,0)+.85+Math.sin(frame*.05+e.id)*.05;else if(p.hover)g.position.y=Math.max(g.position.y,p.ship?-.1:0)+.08+Math.sin(frame*.07+e.id)*.025;
 if(p.rotors)for(const r of p.rotors)r.rotation.y+=dt*38;
 if(p.turret){let ta=0;const tg=(e.o&&(e.o.t==='attack'||e.o.t==='atk'))&&G.ents.get(e.o.id);if(tg){ta=Math.atan2(-(tg.y-e.y),tg.x-e.x)-g.rotation.y}p.turret.rotation.y=angLerp(p.turret.rotation.y,ta,Math.min(1,dt*3))}
 o.rot=angLerp(o.rot,-e.dir,Math.min(1,dt*(p.ship?3:12)));g.rotation.y=o.rot;
 if(p.relic)p.relic.visible=!!e.relic;
 const t=e.anim,w=e.walk?Math.sin(t*(p.horse?13:10.5)):0,task=e.work?e.task:null;
 if(p.horse){const l=p.legs;l[0].rotation.z=w*.6;l[3].rotation.z=w*.6;l[1].rotation.z=-w*.6;l[2].rotation.z=-w*.6;p.horse.position.y=e.walk?Math.abs(w)*.03:0}
 else if(p.legs&&p.legs.length){p.legs[0].rotation.z=w*.55;p.legs[1].rotation.z=-w*.55;p.body.position.y=e.walk?Math.abs(w)*.025:0}
 else if(e.type==='monk')p.body.position.y=e.walk?Math.abs(Math.sin(t*9))*.02:0;
 if(p.wheels&&e.walk)for(const wh of p.wheels)wh.rotation.z-=dt*6;
 if(p.log){const k=e.atkAnim>0?1-e.atkAnim/.32:1;p.log.position.x=e.atkAnim>0?(k<.4?-.18*k/.4:-.18+.38*(k-.4)/.6):0}
 if(p.arm){if(e.atkAnim>0)p.arm.rotation.z=1.05-2.3*Math.min(1,(1-e.atkAnim/.32)*2.5);else p.arm.rotation.z+=(1.05-p.arm.rotation.z)*Math.min(1,dt*1.2)}
 let lean=0;
 if(p.armR){let ra=w*.45,la=-w*.45;
  if(e.atkAnim>0&&e.type!=='monk'){const k=1-e.atkAnim/.32;ra=e.type==='archer'?1.35:(k<.35?2.4*k/.35:2.4-2.4*(k-.35)/.65);if(e.type==='archer')la=1.5}
  else if(task==='chop'){ra=1.7+Math.sin(t*7)*1.1;la=ra*.8;lean=-.12}
  else if(task==='mine'){ra=2+Math.sin(t*6)*1.3;la=ra;lean=-.15}
  else if(task==='farm'){ra=.8+Math.sin(t*5)*.55;la=ra;lean=-.3}
  else if(task==='forage'){ra=.9+Math.sin(t*6)*.35;la=.9+Math.cos(t*6)*.35;lean=-.38}
  else if(task==='build'){ra=1.2+Math.sin(t*13)*.75;lean=-.1}
  else if(task==='heal'){ra=1.9+Math.sin(t*3)*.15;la=1.9-Math.sin(t*3)*.15}
  else if(task==='conv'){ra=2.7+Math.sin(t*5)*.2;la=2.7+Math.cos(t*5)*.2}
  p.armR.rotation.z=ra;p.armL.rotation.z=la}
 p.body.rotation.z+=(lean-p.body.rotation.z)*Math.min(1,dt*8);
 if(p.tools){let want=null;if(e.o.t==='build'&&(e.work||e.walk))want='hammer';else if(e.o.t==='gather'){const r=G.ents.get(e.o.id);want=r&&r.kind==='bld'?'hoe':TOOL[e.o.rt]||null}
  if(o.tool!==want){for(const k in p.tools)p.tools[k].visible=k===want;o.tool=want}}
 if(p.bundle){const a=e.carry.a>0;p.bundle.visible=a;if(a&&o.bt!==e.carry.t){o.bt=e.carry.t;p.bundle.material=mat({food:0xc2533d,wood:0x8a5c33,gold:0xe8c24c,stone:0xa8adb2}[e.carry.t])}}
 if(p.beam){const tg=e.work&&task==='conv'&&G.ents.get(e.o.id);p.beam.visible=!!tg;if(tg){const a=p.beam.geometry.attributes.position;const dx=tg.x/T-g.position.x,dz=tg.y/T-g.position.z,c=Math.cos(-g.rotation.y),s=Math.sin(-g.rotation.y);
   a.setXYZ(0,.05,.9,0);a.setXYZ(1,dx*c-dz*s,.5,dx*s+dz*c);a.needsUpdate=true;p.beam.material.opacity=.4+.4*Math.abs(Math.sin(t*9))}}
 if(task==='heal'&&Math.random()<dt*3){const tg=G.ents.get(e.o.id);if(tg)puff(tg.x/T,.5,tg.y/T,0x7dff9a,1,{add:true,size:.5,life:.7,vy:.6,grow:.2})}
 p.ring.visible=selSet.has(e.id);if(p.ring.visible)p.ring.material.color.setHex(e.owner===ME()?0xe9f2d9:I.isAlly(e.owner,ME())?0x8fd0ff:0xff6a55);if(o.ch)charPose(o,e,dt,g)}
function updRelicObj(o,e,G){const g=o.g;g.visible=I.isVisible(e);if(!g.visible)return;const x=e.x/T,z=e.y/T;g.position.set(x,hT(x,z)+.02,z);g.rotation.y+=.01;g.userData.glow.material.opacity=.25+.2*Math.sin(frame*.06)}
function updBldObj(o,e,dt,G){const g=o.g,ud=g.userData;const live=I.isVisible(e);g.visible=live||G.mem.has(e.id);if(!g.visible)return;const wantScan=!live&&scanMode()&&e.owner!==ME()&&!I.isAlly(e.owner,ME());if(o.scan!==wantScan){o.scan=wantScan;memLook(ud.model,wantScan)}if(!live){ud.ring.visible=selSet.has(e.id);const m=G.mem.get(e.id);if(m&&o.memBp!==m.bp){o.memBp=m.bp;const k=m.bp<1?Math.max(.02,m.bp):1;ud.model.scale.y=k;ud.model.visible=m.bp>=.12||!!B[e.type].farm;ud.scaf.visible=m.bp<1&&!B[e.type].wall;ud.fnd.visible=m.bp<1}return}
 o.memBp=undefined;
 const k=e.bp<1?Math.max(.02,e.bp):1;ud.model.scale.y=k;ud.model.visible=e.bp>=.12||!!B[e.type].farm;ud.scaf.visible=e.bp<1&&!B[e.type].wall;ud.fnd.visible=e.bp<1;if(ud.scaf.visible&&ART.rigUpdate)ART.rigUpdate(ud.scaf,e.bp,ART.timeU.value);
 const mu=ud.model.userData;if(mu.spin)mu.spin[0].rotation.y+=dt*mu.spin[1];if(mu.spin2){mu.spin2[0].rotation.y+=dt*mu.spin2[1];mu.spin2[0].position.y=mu.holo[1]+Math.sin(ART.timeU.value*1.6)*.06}
 ud.ring.visible=selSet.has(e.id);if(ud.ring.visible)ud.ring.material.color.setHex(e.owner===ME()?0xe9f2d9:I.isAlly(e.owner,ME())?0x8fd0ff:0xff6a55);
 if(ud.model.userData.crop&&(e.chg||o.cropInit===undefined)){e.chg=false;o.cropInit=1;const c=ud.model.userData.crop,f=Math.max(.15,e.amt/e.max);
  const n=36,show=Math.ceil(n*Math.max(e.amt/e.max,.02));for(let i=0;i<n;i++){c.getMatrixAt(i,dummy.matrix);dummy.matrix.decompose(dummy.position,dummy.quaternion,dummy.scale);const v=i<show?(.45+.55*f)*(e.bp<1?e.bp:1):0;dummy.scale.set(v?1:0,v,v?1:0);dummy.updateMatrix();c.setMatrixAt(i,dummy.matrix)}c.instanceMatrix.needsUpdate=true}
 const sm=ud.model.userData.smoke;if(sm&&e.bp>=1&&Math.random()<dt*(e.type==='smith'?2.2:.35))puff(g.position.x+sm[0],sm[1]+g.position.y,g.position.z+sm[2],0x9a948c,1,{spread:.1,size:.7,life:1.6,vy:.45,grow:2.4});
 const door=ud.model.userData.door;if(door&&frame%8===0){let open=false;for(const u of G.ul){if(u.dead||!I.isAlly(u.owner,e.owner))continue;if(Math.abs(u.x/T-g.position.x)<1.4&&Math.abs(u.y/T-g.position.z)<1.4){open=true;break}}o.open=open}
 if(door)door.position.y+=((o.open?.85:0)-door.position.y)*Math.min(1,dt*6);
 const burning=e.bp>=1&&e.hp<e.maxhp*.5&&!B[e.type].wall;
 if(burning){if(!ud.fire){ud.fire=new TH.Group();for(let i=0;i<3;i++){const f=new TH.Mesh(gc('flame',()=>new TH.ConeGeometry(.14,.45,6).translate(0,.22,0)),new TH.MeshBasicMaterial({color:i%2?0xffa53a:0xff6a2a,transparent:true,opacity:.85,blending:TH.AdditiveBlending,depthWrite:false}));f.position.set((Math.random()-.5)*e.size*.5,.6+Math.random()*.5,(Math.random()-.5)*e.size*.5);ud.fire.add(f)}g.add(ud.fire)}
  ud.fire.children.forEach((f,i)=>{const s=.7+Math.sin(frame*.3+i*2)*.25+Math.random()*.15;f.scale.set(s,s*(1+Math.random()*.3),s)});
  if(Math.random()<dt*3)puff(g.position.x+(Math.random()-.5)*e.size*.5,1.2+g.position.y,g.position.z+(Math.random()-.5)*e.size*.5,0x3a3632,1)}
 else if(ud.fire){g.remove(ud.fire);ud.fire=null}}
function onEvent(ev,G){
 if(ev.ev==='die'){const o=objs.get(ev.id);if(o&&o.dying===undefined){o.dying=0;if(o.e.kind==='bld'&&!I.isVisible(o.e)){o.g.visible=false;o.dying=99;return}o.g.visible=o.e.kind==='unit'?o.g.visible:I.isVisible(o.e);if(o.e.kind==='bld')puff(o.g.position.x,.5,o.g.position.z,0x9c9080,B[o.e.type].wall?4:14);else puff(o.g.position.x,.1,o.g.position.z,0x8a7a62,3,{spread:.3,size:.6,life:.6,vy:.2})}}
 else if(ev.ev==='depleted')removeRes(ev.id,ev.type);
 else if(ev.ev==='built'){const o=objs.get(ev.id);if(o&&!B[o.e.type].wall)puff(o.g.position.x,.3,o.g.position.z,0xcdbb98,8)}
 else if(ev.ev==='shoot'||ev.ev==='lob'){const k=ev.k;if(k&&k!=='arrow'&&k!=='javelin'&&k!=='axe'&&k!=='stone'&&G.vis[I.idx(Math.min(MW-1,ev.x/T|0),Math.min(MH-1,ev.y/T|0))]){const h=hT(ev.x/T,ev.y/T)+.45;const c=k==='laser'?0x6ff4ff:k==='plasma'?0x7affc0:0xffd070;
   puff(ev.x/T,h,ev.y/T,c,k==='bullet'?1:2,{add:true,spread:.04,size:k==='bullet'?.22:.4,life:.1,vy:0});if(k==='ball'||k==='shell'||k==='rocket')puff(ev.x/T,h,ev.y/T,0xc8c0b0,3,{spread:.15,size:.5,life:.9,vy:.3,grow:2})}}
 else if(ev.ev==='boom'){if(G.vis[I.idx(Math.min(MW-1,ev.x/T|0),Math.min(MH-1,ev.y/T|0))]){const h=hT(ev.x/T,ev.y/T)+.2,pl=ev.k==='plasma';puff(ev.x/T,h,ev.y/T,pl?0x7affc0:0xffa040,5,{add:true,spread:.25,size:.6,life:.25,vy:.4});if(!pl)puff(ev.x/T,h,ev.y/T,0x5a5450,5,{spread:.35,size:.7,life:1.1,vy:.5,grow:2.2})}}
 else if(ev.ev==='impact'){if(ev.k&&ev.k!=='stone'&&G.vis[I.idx(Math.min(MW-1,ev.x/T|0),Math.min(MH-1,ev.y/T|0))])puff(ev.x/T,.3+hT(ev.x/T,ev.y/T),ev.y/T,ev.k==='plasma'?0x7affc0:0xffa040,6,{add:true,spread:.4,size:.8,life:.3,vy:.5});if(G.vis[I.idx(Math.min(MW-1,ev.x/T|0),Math.min(MH-1,ev.y/T|0))])puff(ev.x/T,.1,ev.y/T,0xa89c86,8,{spread:1.2,life:.8,vy:.5})}
 else if(ev.ev==='convert'){const o=objs.get(ev.id);if(o){puff(o.g.position.x,.4,o.g.position.z,0xffe28a,6,{add:true,spread:.5,size:.6,life:.9,vy:.8})}}
}
function animDying(o,dt){o.dying+=dt;const g=o.g;
 if(o.e.kind==='relic')return true;
 if(o.e.kind==='unit'&&o.ch){if(o.y0==null)o.y0=g.position.y;g.position.y=o.y0-Math.max(0,o.dying-3)*.2;charPose(o,o.e,dt,g,o.dying);return o.dying>5}
 if(o.e.kind==='unit'){if(o.y0==null)o.y0=g.position.y;const k=Math.min(1,o.dying/.45);if(o.g.userData.parts.ship){g.rotation.z=k*.6;g.position.y=o.y0-Math.min(1,o.dying/3)*.6}else g.rotation.x=k*Math.PI/2*(o.e.id%2?1:-1);g.position.y=o.y0-Math.max(0,o.dying-2.5)*.18;if(o.dying>4.5)return true}
 else{if(o.dying>=99)return true;if(o.y0==null)o.y0=g.position.y;g.position.y=o.y0-Math.min(1,o.dying/1.6)*2.2;if(o.dying>1.7){if(!B[o.e.type].wall&&g.visible)addRubble(o.e);return true}}
 return false}
function addRubble(e){const g=new TH.Group(),m=mat(0x5d5750),m2=mat(0x3d3631);for(let i=0;i<e.size*5;i++){const s=.12+Math.random()*.22,x=e.tx+.2+Math.random()*(e.size-.4),z=e.ty+.2+Math.random()*(e.size-.4);g.add(P(boxG(s,s*.6,s),i%3?m:m2,x,hT(x,z),z,Math.random()*3))}resRoot.add(g);rubble.push(g)}

// edificios enemigos recordados que ya no existen (el jugador aún no lo ha visto)
function memLook(g,on){g.traverse(c=>{if(!c.isMesh)return;if(on){if(!c.userData.m0){c.userData.m0=c.material;c.userData.s0=c.castShadow}c.material=ART.M.holoWire;c.castShadow=false}else if(c.userData.m0){c.material=c.userData.m0;c.castShadow=c.userData.s0;c.userData.m0=null}})}
const scanMode=()=>tierOf(ME())>=5&&!!(ART.M&&ART.M.holoWire);
function syncMem(G){const sm=scanMode();if(sm!==syncMem.sm){syncMem.sm=sm;for(const [,g] of memObjs)memLook(g,sm)}for(const [id,m] of G.mem){if(G.ents.has(id)||memObjs.has(id))continue;const g=buildModel(m.type,m.owner,{tx:m.tx,ty:m.ty});if(sm)memLook(g,true);
  g.position.set(m.tx+m.size/2,bldY(m),m.ty+m.size/2);if(m.bp<1)g.scale.y=Math.max(.05,m.bp);memRoot.add(g);memObjs.set(id,g)}
 for(const [id,g] of memObjs)if(!G.mem.has(id)){memRoot.remove(g);memObjs.delete(id)}}
// ---------- luz: ciclo de día y noche
const cDay=new TH.Color(0xfff0d6),cDusk=new TH.Color(0xff9a58),cNight=new TH.Color(0xc2c8da),hDay=new TH.Color(0xdfe9ff),hNight=new TH.Color(0x8793b4),gDay=new TH.Color(0x4a3f2c),gNight=new TH.Color(0x2e3040),tc1=new TH.Color();
const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t)};
let sunOff=[-14,26,8];
function updLight(t){let k=1,dusk=0,a=Math.PI*.6,h=1;
 if(dayNight){const ph=(t/480+.3)%1;a=ph*Math.PI*2;h=Math.sin(a);k=smooth(-.55,.12,h);dusk=h>-.2?Math.max(0,1-Math.abs(h+.05)/.3):0}
 tc1.copy(cNight).lerp(cDay,k).lerp(cDusk,dusk*.65);sun.color.copy(tc1);sun.intensity=1.25+1.45*k;
 hemi.color.copy(hNight).lerp(hDay,k);hemi.groundColor.copy(gNight).lerp(gDay,k);hemi.intensity=.85+.3*k;
 winMat.emissiveIntensity=(1-k)*1.8;for(const [m,a,b] of (ART.nightMats||[]))m.emissiveIntensity=a+(b-a)*(1-k);renderer.toneMappingExposure=1.02+.06*k;dayK=k;
 if(dayNight){const el=Math.max(.35,Math.abs(h));sunOff=[Math.cos(a)*18,8+20*el,Math.sin(a*.5+.6)*12]}else sunOff=[-14,26,8]}

// ---------- API
const R={};
R.init=function(canvas){
 renderer=new TH.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
 renderer.setPixelRatio(Math.min(2,root.devicePixelRatio||1));renderer.outputColorSpace=TH.SRGBColorSpace;renderer.toneMapping=TH.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=TH.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;
 scene=new TH.Scene();scene.background=new TH.Color(0x07080a);scene.fog=new TH.Fog(0x07080a,60,130);
 camera=new TH.PerspectiveCamera(22,1,.5,500);
 hemi=new TH.HemisphereLight(0xdfe9ff,0x4a3f2c,1.15);scene.add(hemi);
 sun=new TH.DirectionalLight(0xfff0d6,2.7);sun.castShadow=true;sun.shadow.mapSize.set(3072,3072);sun.shadow.bias=-.0004;sun.shadow.normalBias=.03;scene.add(sun,sun.target);
 whiteTex=new TH.DataTexture(new Uint8Array([255,255,255,255]),1,1);whiteTex.needsUpdate=true;fogU.value=whiteTex;
 flagGeo=new TH.PlaneGeometry(.5,.3,8,1).translate(.25,-.15,0);flagBase=flagGeo.attributes.position.array.slice();
 flagMats=PCOL.map(c=>fogify(new TH.MeshStandardMaterial({color:c,side:TH.DoubleSide,roughness:.9})));
 ART.init({fogify});ART.initVeg();if(NAT)NAT.init({fogify,timeU:ART.timeU});if(ART.initEras)ART.initEras();winMat=ART.M.window;
 soilMat=fogify(new TH.MeshStandardMaterial({roughness:1,map:canvasTex(128,128,(c,w,h)=>{c.fillStyle='#6b4e34';c.fillRect(0,0,w,h);for(let i=0;i<16;i++){c.fillStyle=i%2?'#5a412b':'#7a5b3e';c.fillRect(i*8,0,5,h)}for(let k=0;k<700;k++){c.fillStyle='rgba(30,20,10,.25)';c.fillRect(Math.random()*w,Math.random()*h,1,1)}})}));
 targetMat=fogify(new TH.MeshStandardMaterial({roughness:.9,map:canvasTex(64,64,(c)=>{const cols=['#f2ecdc','#c0392b','#f2ecdc','#c0392b','#f2d15a'];for(let i=0;i<5;i++){c.fillStyle=cols[i];c.beginPath();c.arc(32,32,32-i*6.2,0,7);c.fill()}})}));
 ghostRoot=new TH.Group();scene.add(ghostRoot);
 R.resize();
};
// ---------- post-proceso ligero: bloom para neones, LED y ventanas de noche (calidad media y alta)
const BL={on:false};
function fsq(frag,uni){const m=new TH.ShaderMaterial({uniforms:uni,vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',fragmentShader:frag,depthTest:false,depthWrite:false});return m}
function initBloom(){const HF=TH.HalfFloatType;const mk=(w,h,s)=>new TH.WebGLRenderTarget(w,h,{type:HF,samples:s||0,depthBuffer:!!s});
 BL.rt=mk(4,4,4);BL.a=mk(4,4);BL.b=mk(4,4);BL.c=mk(4,4);BL.d=mk(4,4);
 BL.quad=new TH.Mesh(new TH.PlaneGeometry(2,2));BL.scene=new TH.Scene();BL.scene.add(BL.quad);BL.cam=new TH.OrthographicCamera(-1,1,1,-1,0,1);
 BL.bright=fsq('uniform sampler2D t;uniform float th;uniform vec2 px;varying vec2 vUv;void main(){vec3 c=vec3(0.);for(int i=0;i<4;i++){vec2 o=vec2(i==1||i==3?1.:-1.,i>1?1.:-1.)*px;c+=texture2D(t,vUv+o).rgb;}c*=.25;float l=max(c.r,max(c.g,c.b));gl_FragColor=vec4(c*max(0.,l-th)/max(l,1e-4),1.);}',{t:{value:null},th:{value:1},px:{value:new TH.Vector2()}});
 BL.blur=fsq('uniform sampler2D t;uniform vec2 d;varying vec2 vUv;void main(){vec3 c=texture2D(t,vUv).rgb*.2270;c+=(texture2D(t,vUv+d*1.3846).rgb+texture2D(t,vUv-d*1.3846).rgb)*.3162;c+=(texture2D(t,vUv+d*3.2308).rgb+texture2D(t,vUv-d*3.2308).rgb)*.0703;gl_FragColor=vec4(c,1.);}',{t:{value:null},d:{value:new TH.Vector2()}});
 BL.comp=fsq('uniform sampler2D t;uniform sampler2D b1;uniform sampler2D b2;uniform float k;varying vec2 vUv;void main(){vec3 c=texture2D(t,vUv).rgb+(texture2D(b1,vUv).rgb*.6+texture2D(b2,vUv).rgb*.9)*k;gl_FragColor=vec4(c,1.);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}',{t:{value:null},b1:{value:null},b2:{value:null},k:{value:.5}});
 BL.ready=true}
function bloomSize(){const pr=renderer.getPixelRatio(),w=Math.max(4,Math.floor(W*pr)),h=Math.max(4,Math.floor(H*pr));if(BL.w===w&&BL.h===h)return;BL.w=w;BL.h=h;
 BL.rt.setSize(w,h);BL.a.setSize(w>>1,h>>1);BL.b.setSize(w>>1,h>>1);BL.c.setSize(w>>2,h>>2);BL.d.setSize(w>>2,h>>2)}
function pass(mat,target){BL.quad.material=mat;renderer.setRenderTarget(target);renderer.render(BL.scene,BL.cam)}
function renderBloom(strength){if(!BL.ready)initBloom();bloomSize();
 renderer.setRenderTarget(BL.rt);renderer.render(scene,camera);
 BL.bright.uniforms.t.value=BL.rt.texture;BL.bright.uniforms.px.value.set(.5/BL.w,.5/BL.h);BL.bright.uniforms.th.value=.95;pass(BL.bright,BL.a);
 BL.blur.uniforms.t.value=BL.a.texture;BL.blur.uniforms.d.value.set(2/BL.w,0);pass(BL.blur,BL.b);BL.blur.uniforms.t.value=BL.b.texture;BL.blur.uniforms.d.value.set(0,2/BL.h);pass(BL.blur,BL.a);
 BL.blur.uniforms.t.value=BL.a.texture;BL.blur.uniforms.d.value.set(4/BL.w,0);pass(BL.blur,BL.c);BL.blur.uniforms.t.value=BL.c.texture;BL.blur.uniforms.d.value.set(0,4/BL.h);pass(BL.blur,BL.d);
 BL.comp.uniforms.t.value=BL.rt.texture;BL.comp.uniforms.b1.value=BL.a.texture;BL.comp.uniforms.b2.value=BL.d.texture;BL.comp.uniforms.k.value=strength;pass(BL.comp,null)}
function bloomStrength(){if(quality==='low')return 0;const t=I.G?tierOf(ME()):0;return(t>=6?.55:t>=4?.3:.18)+(1-dayK)*.25}
R.setQuality=function(q){quality=q;if(!renderer)return;const dpr=root.devicePixelRatio||1;renderer.setPixelRatio(q==='low'?1:q==='medium'?Math.min(1.5,dpr):Math.min(2,dpr));
 sun.castShadow=q!=='low';const ms=q==='high'?2048:q==='medium'?1536:1024;if(sun.shadow.mapSize.x!==ms){sun.shadow.mapSize.set(ms,ms);if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null}}R.resize()};
R.setDayNight=v=>{dayNight=!!v};R.setFpsCap=v=>{fpsCap=v||0;DR.ema=fpsCap?1/fpsCap:1/60};
R.dayK=()=>dayK;
R.resize=function(){const c=renderer.domElement;W=c.clientWidth||1;H=c.clientHeight||1;renderer.setSize(W,H,false);camera.aspect=W/H;camera.updateProjectionMatrix()};
R.build=function(G){
 MW=I.MW;MH=I.MH;mapU.value.set(MW,MH);
 if(world){scene.remove(world);world.traverse(o=>{if(o.isInstancedMesh&&!o.userData.chars)o.dispose()})}
 objs.clear();resInst.clear();instMeshes.length=0;fx.length=0;rubble.length=0;arrowPool=[];stonePool=[];selSet=new Set();R.setGhost(null);rallyObj=null;
 for(const k in PPOOL)delete PPOOL[k];world=new TH.Group();scene.add(world);arrowPool=[];stonePool=[];javPool=[];axePool=[];unitRoot=new TH.Group();bldRoot=new TH.Group();fxRoot=new TH.Group();resRoot=new TH.Group();world.add(unitRoot,bldRoot,fxRoot,resRoot);if(CHR)CHR.init(world);
 buildTerrain(G);buildResources(G);buildDecor(G);
 fogData=new Uint8Array(MW*MH*4);fogCur=new Float32Array(MW*MH);if(fogTex)fogTex.dispose();fogTex=new TH.DataTexture(fogData,MW,MH);fogTex.magFilter=fogTex.minFilter=TH.LinearFilter;
 for(let i=0;i<MW*MH;i++)fogCur[i]=G.vis[i]?1:(G.exp[i]?.42:0);writeFog();fogU.value=fogTex;
 const b=G.bases[G.me||0]||G.bases[0];R.centerOn(b.cx,b.cy+1.5);view.dist=view.tdist=34;
 memObjs.clear();memRoot=new TH.Group();world.add(memRoot);
};
function writeFog(){for(let i=0;i<MW*MH;i++){const v=Math.round(fogCur[i]*255);fogData[i*4]=v;fogData[i*4+1]=v;fogData[i*4+2]=v;fogData[i*4+3]=255}fogTex.needsUpdate=true}
function fwd(){return[-Math.sin(view.yaw),-Math.cos(view.yaw)]}
function rgt(){return[Math.cos(view.yaw),-Math.sin(view.yaw)]}
function clampView(){view.tx=Math.max(2,Math.min(MW-2,view.tx));view.tz=Math.max(2,Math.min(MH-2,view.tz))}
R.pan=function(dx,dy){const k=view.dist/H*.9,[fx,fz]=fwd(),[rx,rz]=rgt();view.tx+=(-dx*rx+dy*fx)*k;view.tz+=(-dx*rz+dy*fz)*k;clampView()};
R.move=function(ax,ay,dt){const k=view.dist*.65*dt,[fx,fz]=fwd(),[rx,rz]=rgt();view.tx+=(ax*rx+ay*fx)*k;view.tz+=(ax*rz+ay*fz)*k;clampView()};
R.zoom=function(f){view.tdist=Math.max(15,Math.min(72,view.tdist*f))};
R.centerOn=function(x,z){view.tx=x;view.tz=z;clampView()};
R.view=view;R._objs=()=>objs;R._world=()=>world;R._renderer=()=>renderer;
function updCamera(){const cp=Math.cos(view.pitch),sp=Math.sin(view.pitch);view.ty+=(hT(view.tx,view.tz)*.7-view.ty)*.08;
 camera.position.set(view.tx+Math.sin(view.yaw)*cp*view.dist,view.ty+sp*view.dist,view.tz+Math.cos(view.yaw)*cp*view.dist);camera.lookAt(view.tx,view.ty,view.tz);
 sun.position.set(view.tx+sunOff[0],sunOff[1],view.tz+sunOff[2]);sun.target.position.set(view.tx,0,view.tz);
 const e=view.dist*.72;const sc=sun.shadow.camera;if(sc.right!==e){sc.left=-e;sc.right=e;sc.top=e;sc.bottom=-e;sc.near=1;sc.far=110;sc.updateProjectionMatrix()}
 scene.fog.near=view.dist+18;scene.fog.far=view.dist+70}
R.screenToWorld=function(sx,sy){ndc.set(sx/W*2-1,-(sy/H)*2+1);ray.setFromCamera(ndc,camera);let h=0,p=null;
 for(let k=0;k<4;k++){gplane.constant=-h;p=ray.ray.intersectPlane(gplane,tmpV);if(!p)break;const nh=Math.max(0,hT(p.x,p.z));if(Math.abs(nh-h)<.01)break;h=nh}gplane.constant=0;return p?{x:p.x,z:p.z}:null};
R.hAt=hT;R.terrH=terrH;R.falls=()=>falls;
R.pickEntity=function(sx,sy){ndc.set(sx/W*2-1,-(sy/H)*2+1);ray.setFromCamera(ndc,camera);
 const hits=ray.intersectObjects([unitRoot,bldRoot,...instMeshes],true);
 for(const h of hits){if(!h.object.visible||h.object.isLine)continue;let o=h.object,vis=true;while(o){if(!o.visible){vis=false;break}o=o.parent}if(!vis)continue;
  const id=h.object.isInstancedMesh?(h.object.userData.ids?h.object.userData.ids[h.instanceId]:0):h.object.userData.id;if(id){const e=I.G.ents.get(id);if(e&&!e.dead&&(!objs.get(id)||objs.get(id).dying===undefined))return e}}
 return null};
R.project=function(x,y,z){tmpV.set(x,y,z).project(camera);return{x:(tmpV.x+1)/2*W,y:(1-tmpV.y)/2*H,z:tmpV.z}};
R.frustum=function(){const pts=[];for(const [sx,sy] of[[0,0],[W,0],[W,H],[0,H]]){const p=R.screenToWorld(sx,sy)||{x:view.tx,z:view.tz};pts.push([p.x,p.z])}return pts};
R.setSelection=function(ids){selSet=new Set(ids)};
R.marker=marker;
const gOK=new TH.MeshStandardMaterial({color:0x7fd67f,transparent:true,opacity:.55,depthWrite:false}),gBad=new TH.MeshStandardMaterial({color:0xe0574a,transparent:true,opacity:.55,depthWrite:false});
R.setGhost=function(type,tiles){if(!type){for(const g of ghosts)ghostRoot.remove(g);ghosts=[];ghostKey='';return}
 if(ghostKey!==type){for(const g of ghosts)ghostRoot.remove(g);ghosts=[];ghostKey=type}
 const s=B[type].size;while(ghosts.length<tiles.length){const g=buildModel(type,ME(),null);g.traverse(o=>{if(o.isMesh){o.castShadow=false;o.material=gOK}});ghostRoot.add(g);ghosts.push(g)}
 ghosts.forEach((g,i)=>{const t=tiles[i];g.visible=!!t;if(!t)return;g.position.set(t[0]+s/2,.02+(B[type].coast?0:Math.min(hT(t[0],t[1]),hT(t[0]+s,t[1]+s),hT(t[0]+s,t[1]),hT(t[0],t[1]+s))),t[1]+s/2);const m=t[2]?gOK:gBad;if(g.userData.m!==m){g.userData.m=m;g.traverse(o=>{if(o.isMesh)o.material=m})}})};
let rallyObj=null;
R.setRally=function(r){if(!rallyObj){rallyObj=new TH.Group();rallyObj.add(flag(0,.9));world.add(rallyObj)}rallyObj.visible=!!r;if(r)rallyObj.position.set(r.x/T,hT(r.x/T,r.y/T),r.y/T)};
R._pave=()=>[paveData&&paveData.reduce((a,b)=>a+b,0),paveU.value,!!paveTU.value,paveTex&&paveTex.image.width];R.onEvent=onEvent;R.puff=puff;R.me=ME;R.stampDirt=stampDirt;
// resolución dinámica: mantiene ~60 FPS bajando o subiendo la densidad de píxeles según el tiempo real de fotograma
const DR={ema:1/60,t:0,max:0};
function dynRes(dt){if(!renderer||dt<=0||dt>.25)return;DR.ema+=(dt-DR.ema)*.05;DR.t+=dt;if(DR.t<1.5)return;DR.t=0;
 const dpr=root.devicePixelRatio||1,top=quality==='low'?1:quality==='medium'?Math.min(1.5,dpr):Math.min(2,dpr);const pr=renderer.getPixelRatio();let np=pr;
 const tf=fpsCap?1/fpsCap:1/60;if(DR.ema>tf*1.18&&pr>1)np=Math.max(1,pr-.15);else if(DR.ema<tf*.9&&pr<top)np=Math.min(top,pr+.1);if(np!==pr){renderer.setPixelRatio(np);R.resize()}}
R.render=function(dt,G){frame++;dynRes(dt);ART.timeU.value+=dt;{const tr=tierOf(ME());const pm=tr>=8?ART.TE&&ART.TE.tech:tr>=5?ART.TE&&ART.TE.asphalt:tr>=3?ART.T.cobble:null;paveU.value=pm?1:0;paveTU.value=pm||ART.T.dirt}
 view.dist+=(view.tdist-view.dist)*Math.min(1,dt*10);if(G)updLight(G.t);updCamera();
 if(G&&world){
  for(const e of G.list){if(e.dead)continue;if(e.kind==='res'){if(e.chg){e.chg=false;updateRes(e)}continue}
   let o=objs.get(e.id);if(o&&o.dying===undefined&&(o.owner!==e.owner||(e.kind==='unit'&&(o.up!==upOf(e)||o.ck!==charKey(e)||o.ut!==eraOf(e)))||(e.kind==='bld'&&o.tier!==tierOf(e.owner)&&I.isVisible(e)))){const ageUp=e.kind==='bld'&&o.owner===e.owner;dropObj(o);objs.delete(e.id);o=null;if(ageUp&&!B[e.type].wall)puff(e.x/T,.4+hT(e.x/T,e.y/T),e.y/T,0xd8c8a8,Math.min(12,e.size*3),{spread:e.size*.6})}
   if(!o){o=createObj(e);objs.set(e.id,o)}o.seen=frame;if(o.dying!==undefined)continue;
   if(e.kind==='unit')updUnitObj(o,e,dt,G);else if(e.kind==='relic')updRelicObj(o,e,G);else updBldObj(o,e,dt,G)}
  syncMem(G);
  for(const [id,o] of objs){if(o.seen!==frame&&o.dying===undefined)o.dying=0;if(o.dying!==undefined){if(animDying(o,dt)){dropObj(o);objs.delete(id)}}}
  if(CHR&&CHR.ok)CHR.frame(view.dist>48);
  if(frame%6===0)natLod();if(falls.length&&frame%5===0){for(let k=0;k<2;k++){const f=falls[Math.floor(Math.random()*falls.length)];if(Math.abs(f[0]-view.tx)<view.dist&&Math.abs(f[2]-view.tz)<view.dist)puff(f[0],f[1]+.05,f[2],0xe8f2f4,1,{spread:.5,vy:.25,life:.9,grow:2.4,size:.9})}}
  drawProj(G);updFx(dt);
  let ch=false;const n=MW*MH;for(let i=0;i<n;i++){const tgt=G.vis[i]?1:(G.exp[i]?.42:0),c=fogCur[i];if(c!==tgt){const d=tgt-c,s=dt*3.5;fogCur[i]=Math.abs(d)<s?tgt:c+Math.sign(d)*s;ch=true}}if(ch)writeFog();
  const a=flagGeo.attributes.position;for(let i=0;i<a.count;i++){const x=flagBase[i*3];a.setZ(i,Math.sin(x*9-frame*.12)*.05*x*2)}a.needsUpdate=true;
  if(waterMat){waterMat.normalMap.offset.x=(frame*.0004)%1;waterMat.normalMap.offset.y=(frame*.00025)%1}
 }
 // sombras a la mitad de ritmo (ahorra una pasada completa de la escena uno de cada dos fotogramas)
 renderer.shadowMap.needsUpdate=frame%2===0||!!view._moved;
 const bs=bloomStrength();if(bs>0)renderBloom(bs);else renderer.render(scene,camera)};
R.info=()=>renderer.info.render;

// ---------- iconos para la interfaz
const iconCache={};let iconR=null,iconS,iconC;
R.icon=function(key0){let key=key0,bt=0;if(key0[0]==='b'||key0[0]==='u'){try{bt=tierOf(ME())||0}catch(e){}key=key0+'#'+bt}if(iconCache[key])return iconCache[key];
 const i=key0.indexOf(':'),k=key0.slice(0,i),t=key0.slice(i+1);
 if(k==='x'||(k==='t'&&!t.startsWith('u_')))return iconCache[key]=glyph(t);
 if(!iconR){iconR=new TH.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});iconR.setSize(128,128);iconR.outputColorSpace=TH.SRGBColorSpace;iconR.toneMapping=TH.ACESFilmicToneMapping;iconR.toneMappingExposure=1.15;
  iconS=new TH.Scene();iconS.add(new TH.HemisphereLight(0xffffff,0x554433,1.4));const d=new TH.DirectionalLight(0xffffff,2.4);d.position.set(3,5,4);iconS.add(d);iconC=new TH.PerspectiveCamera(26,1,.1,50)}
 let m;
 const upT=k==='t'&&t.startsWith('u_');
 if(upT){m=unitModel(I.TECH[t].up,0,true);m.userData.parts.ring.visible=false}
 else if(k==='u'){m=unitModel(t,0,false,bt);m.userData.parts.ring.visible=false;if(m.userData.parts.armR)m.userData.parts.armR.rotation.z=.5;if(m.userData.parts.tools)m.userData.parts.tools.axe.visible=true}
 else if(k==='b'){m=buildModel(t,0,null,bt)}
 else if(k==='r'){m=new TH.Group();if(t==='tree'){m.add(P(cylG(.055,.09,.55,6),mat(C.WOOD_D)));m.add(P(pine1G(),mat(0x2f5a34)));m.add(P(pine2G(),mat(0x2f5a34)))}
  else if(t==='berry'){m.add(P(bushG(),mat(0x3f6a33)));for(let i=0;i<7;i++)m.add(P(sphG(.05,0),mat(0xc0263b),Math.cos(i)*.27,.2+(i%3)*.1,Math.sin(i)*.27))}
  else if(t==='fish'){for(let i=0;i<4;i++){const f=P(gc('fishG',()=>new TH.IcosahedronGeometry(.1,0).scale(1.8,.5,.7)),mat(0x9fb4bd,{metalness:.5,roughness:.35}),Math.cos(i*1.6)*.2,.05*i,Math.sin(i*1.6)*.2,-i*1.6);m.add(f)}}
  else if(t==='relic'){m.add(relicModel())}
  else{const c=t==='gold'?0x8a7a5c:0xb3b0a6;for(let i=0;i<3;i++)m.add(P(rockG(),mat(c),Math.cos(i*2.1)*.2,.05,Math.sin(i*2.1)*.2,i));if(t==='gold')for(let i=0;i<4;i++)m.add(P(nugG(),mat(C.GOLD,{metalness:.75,roughness:.3,emissive:0x3a2800}),Math.cos(i*1.6)*.25,.2,Math.sin(i*1.6)*.25))}}
 iconS.add(m);const box=new TH.Box3().setFromObject(m),sph=box.getBoundingSphere(new TH.Sphere());
 const dist=sph.radius/Math.sin(TH.MathUtils.degToRad(13))*1.02;iconC.position.set(sph.center.x+dist*.62,sph.center.y+dist*.5,sph.center.z+dist*.6);iconC.lookAt(sph.center);
 const prev=fogU.value,pk=winMat.emissiveIntensity;fogU.value=whiteTex;winMat.emissiveIntensity=0;iconR.render(iconS,iconC);fogU.value=prev;winMat.emissiveIntensity=pk;iconS.remove(m);
 if(upT){const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d');g.drawImage(iconR.domElement,0,0);g.fillStyle='#d8b46a';g.strokeStyle='#1b1d21';g.lineWidth=4;
  g.beginPath();g.moveTo(100,52);g.lineTo(122,80);g.lineTo(108,80);g.lineTo(108,108);g.lineTo(92,108);g.lineTo(92,80);g.lineTo(78,80);g.closePath();g.stroke();g.fill();return iconCache[key]=c.toDataURL('image/png')}
 return iconCache[key]=iconR.domElement.toDataURL('image/png')};
function glyph(t){const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d');g.translate(64,64);g.lineCap='round';g.lineJoin='round';
 const gold='#d8b46a',dark='#1b1d21';g.strokeStyle=gold;g.fillStyle=gold;g.lineWidth=7;const L=(pts,close)=>{g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));if(close)g.closePath()};
 switch(t){
 case'stop':g.beginPath();g.roundRect(-30,-30,60,60,8);g.stroke();break;
 case'amove':for(const s of[-1,1]){g.save();g.rotate(s*.78);L([[0,-40],[0,26]]);g.stroke();L([[-12,20],[12,20]]);g.stroke();g.restore()}break;
 case'age1':case'age2':case'age3':case'age4':case'age5':case'age6':case'age7':case'age8':g.beginPath();for(let i=0;i<5;i++){const a=-Math.PI/2+i*Math.PI*2/5;g.lineTo(Math.cos(a)*40,Math.sin(a)*40);const b=a+Math.PI/5;g.lineTo(Math.cos(b)*17,Math.sin(b)*17)}g.closePath();g.fill();
  g.fillStyle=dark;g.font='bold 26px Baskerville, Georgia, serif';g.textAlign='center';g.textBaseline='middle';g.fillText(['','II','III','IV','V','VI','VII','VIII','IX'][+t.slice(3)],0,4);break;
 case'del':L([[-26,-26],[26,26]]);g.stroke();L([[26,-26],[-26,26]]);g.stroke();break;
 case'page0':L([[-30,34],[-30,-4],[0,-32],[30,-4],[30,34]],true);g.stroke();L([[-9,34],[-9,12],[9,12],[9,34]]);g.stroke();break;
 case'page1':for(const s of[-1,1]){g.save();g.scale(s,1);g.rotate(-.8);L([[0,-40],[0,22]]);g.stroke();L([[-11,18],[11,18]]);g.stroke();L([[0,22],[0,34]]);g.stroke();g.restore()}break;
 case'wheel':g.beginPath();g.arc(0,0,34,0,7);g.stroke();for(let i=0;i<6;i++){const a=i*Math.PI/3;L([[0,0],[Math.cos(a)*34,Math.sin(a)*34]]);g.stroke()}g.beginPath();g.arc(0,0,8,0,7);g.fill();break;
 case'plow':L([[-36,-24],[10,4]]);g.stroke();L([[4,0],[34,10],[20,30],[-4,16]],true);g.fill();L([[-36,-24],[-40,-10]]);g.stroke();break;
 case'axe':L([[-26,36],[20,-30]]);g.stroke();L([[10,-40],[40,-20],[30,4],[14,-12]],true);g.fill();break;
 case'pick':L([[-24,36],[10,-20]]);g.stroke();g.beginPath();g.moveTo(-26,-24);g.quadraticCurveTo(12,-44,40,-6);g.stroke();break;
 case'forge':L([[-34,30],[34,30],[24,14],[-24,14]],true);g.fill();L([[-8,14],[-12,-2],[16,-2],[10,14]],true);g.fill();L([[-6,-14],[26,-40]]);g.stroke();L([[18,-46],[34,-32]]);g.lineWidth=12;g.stroke();break;
 case'fletch':L([[-34,34],[30,-30]]);g.stroke();L([[30,-30],[14,-30],[30,-14]],true);g.fill();L([[-34,34],[-34,18]]);g.stroke();L([[-34,34],[-18,34]]);g.stroke();L([[-26,26],[-26,12]]);g.stroke();L([[-26,26],[-12,26]]);g.stroke();break;
 case'mail':L([[0,-38],[32,-26],[28,12],[0,38],[-28,12],[-32,-26]],true);g.stroke();g.lineWidth=4;for(let y=-20;y<=20;y+=12)for(let x=-18;x<=18;x+=12){g.beginPath();g.arc(x,y,5,0,7);g.stroke()}break;
 case'masonry':g.lineWidth=5;for(let r=0;r<4;r++)for(let i=-1;i<3;i++){const x=-40+i*28+(r%2?14:0),y=-34+r*17;g.strokeRect(Math.max(-38,x),y,Math.min(26,38-Math.max(-38,x)),15)}break;
 case'barding':g.lineWidth=10;g.beginPath();g.arc(0,-2,28,Math.PI*.15,Math.PI*.85,true);g.stroke();g.beginPath();g.arc(0,-2,28,Math.PI*.15,Math.PI*.85,true);g.lineWidth=3;g.strokeStyle=dark;g.stroke();g.fillStyle=gold;g.fillRect(-32,18,14,14);g.fillRect(18,18,14,14);break;
 case'st0':g.save();g.rotate(.78);L([[0,-40],[0,26]]);g.stroke();L([[-12,20],[12,20]]);g.stroke();g.restore();L([[-36,34],[-10,34]]);g.stroke();L([[-18,26],[-10,34],[-18,42]]);g.stroke();break;
 case'st1':L([[0,-38],[32,-26],[28,12],[0,38],[-28,12],[-32,-26]],true);g.stroke();g.lineWidth=5;L([[-12,4],[0,-10],[12,4]]);g.stroke();L([[0,-10],[0,18]]);g.stroke();break;
 case'st2':g.beginPath();g.moveTo(-10,-40);g.lineTo(-10,36);g.stroke();L([[-10,-40],[30,-28],[-10,-14]],true);g.fill();L([[-30,36],[10,36]]);g.stroke();break;
 case'ungar':L([[-30,34],[-30,-4],[0,-32],[30,-4],[30,34]],true);g.stroke();L([[-4,14],[40,14]]);g.stroke();L([[28,2],[40,14],[28,26]]);g.stroke();break;
 case'bell':g.beginPath();g.moveTo(-26,20);g.quadraticCurveTo(-24,-34,0,-34);g.quadraticCurveTo(24,-34,26,20);g.closePath();g.fill();g.fillRect(-32,20,64,8);g.beginPath();g.arc(0,34,7,0,7);g.fill();break;
 case'unload':L([[-38,10],[38,10],[26,30],[-26,30]],true);g.fill();L([[0,-40],[0,0]]);g.stroke();L([[-12,-12],[0,0],[12,-12]]);g.stroke();break;
 case'buy_food':case'buy_wood':case'buy_stone':case'sell_food':case'sell_wood':case'sell_stone':{const [op,r]=t.split('_'),col={food:'#e07b5f',wood:'#bf8f5c',stone:'#aab2b9'}[r];
  g.fillStyle=col;g.beginPath();if(r==='food'){g.arc(-10,-2,22,0,7)}else if(r==='wood'){g.roundRect(-36,-16,52,30,14)}else{g.moveTo(-34,14);g.lineTo(-24,-18);g.lineTo(4,-22);g.lineTo(14,4);g.lineTo(-6,18)}g.fill();
  g.fillStyle='#e8c45a';g.beginPath();g.arc(24,22,14,0,7);g.fill();g.strokeStyle=op==='buy'?'#8fca7b':'#ea7a63';g.lineWidth=7;
  if(op==='buy'){L([[26,-40],[26,-10]]);g.stroke();L([[14,-22],[26,-10],[38,-22]]);g.stroke()}else{L([[26,-10],[26,-40]]);g.stroke();L([[14,-28],[26,-40],[38,-28]]);g.stroke()}break}
 case'gillnets':g.lineWidth=4;for(let i=-3;i<=3;i++){L([[i*11,-34],[i*11,30]]);g.stroke();L([[-34,i*10],[34,i*10]]);g.stroke()}g.fillStyle='#9fb4bd';g.beginPath();g.ellipse(0,0,20,9,0,0,7);g.fill();break;
 case'fervor':g.beginPath();g.moveTo(0,-40);g.bezierCurveTo(26,-12,22,26,0,36);g.bezierCurveTo(-22,26,-26,-12,0,-40);g.fill();g.fillStyle=dark;g.beginPath();g.moveTo(0,-4);g.bezierCurveTo(12,8,10,26,0,30);g.bezierCurveTo(-10,26,-12,8,0,-4);g.fill();break;
 }
 return c.toDataURL()}
root.ImperiaR=R;
})(window);
