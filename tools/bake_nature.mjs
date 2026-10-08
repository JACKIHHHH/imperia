// Imperia — vegetación y rocas (Quaternius Ultimate Stylized Nature, CC0) → web/nature_data.js
// Une cada modelo en dos partes (corteza/tallo y hojas con transparencia), normaliza la altura y empaqueta texturas reducidas.
// Uso: node tools/bake_nature.mjs   (requiere three@0.158, pngjs, jpeg-js)
globalThis.self=globalThis;if(!globalThis.ProgressEvent)globalThis.ProgressEvent=class extends Event{constructor(t,o){super(t);Object.assign(this,o||{})}};
globalThis.document={createElementNS:()=>({addEventListener(){},removeEventListener(){},setAttribute(){},style:{}}),createElement:()=>({getContext:()=>null,style:{}})};
import * as THREE from 'three';import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';import {FBXLoader} from 'three/examples/jsm/loaders/FBXLoader.js';
import fs from 'fs';import path from 'path';import {PNG} from 'pngjs';import jpeg from 'jpeg-js';import {MeshoptSimplifier} from 'meshoptimizer';await MeshoptSimplifier.ready;
const dir=path.dirname(new URL(import.meta.url).pathname),src=path.join(dir,'../assets_src/nature');
// qué modelos: [clave, archivo, altura objetivo, textura de hojas forzada (tintada en el juego)]
const LIST=[
 ['oak1','fbx/NormalTree_1.fbx',2.0],['oak2','fbx/NormalTree_2.fbx',2.1],['oak3','fbx/NormalTree_3.fbx',1.9],['oak4','fbx/NormalTree_4.fbx',2.2],['oak5','fbx/NormalTree_5.fbx',2.0],
 ['birch1','BirchTree_1.gltf',2.1],['birch2','BirchTree_2.gltf',2.2],['birch3','BirchTree_3.gltf',2.0],
 ['maple1','MapleTree_1.gltf',2.1,'MapleTree_Leaves_BW.png'],['maple2','MapleTree_2.gltf',2.0,'MapleTree_Leaves_BW.png'],['maple3','MapleTree_3.gltf',2.2,'MapleTree_Leaves_BW.png'],
 ['pine1','fbx/PineTree_1.fbx',2.3],['pine2','fbx/PineTree_2.fbx',2.5],['pine3','fbx/PineTree_3.fbx',2.2],['pine4','fbx/PineTree_4.fbx',2.6],
 ['palm1','fbx/PalmTree_1.fbx',2.3],['palm2','fbx/PalmTree_2.fbx',2.5],['palm3','fbx/PalmTree_3.fbx',2.2],
 ['dead1','DeadTree_1.gltf',1.7],['dead2','DeadTree_3.gltf',1.6],['dead3','DeadTree_6.gltf',1.8],
 ['bush1','Bush.gltf',.55],['bush2','Bush_Large.gltf',.8],['bush3','Bush_Small.gltf',.4],['bushf','Bush_Large_Flowers.gltf',.75],
 ['rock1','fbx/Rock_1.fbx',.55],['rock2','fbx/Rock_2.fbx',.7],['rock3','fbx/Rock_3.fbx',.5],['rock4','fbx/Rock_4.fbx',.9],['rock5','fbx/Rock_5.fbx',.6],
 ['grass1','Grass_Large.gltf',.28],['grass2','Grass_Small.gltf',.2],['flower1','Flower_3_Clump.gltf',.22],['flower2','Flower_4_Clump.gltf',.22]];
const TEXSIZE={leaves:512,bark:256,other:256};
function loadModel(file){const p=path.join(src,file);const buf=fs.readFileSync(p);
 if(file.endsWith('.fbx'))return new FBXLoader().parse(buf.buffer.slice(buf.byteOffset,buf.byteOffset+buf.byteLength),path.dirname(p)+'/');
 const j=JSON.parse(buf.toString('utf8'));for(const b of j.buffers||[])if(b.uri&&!b.uri.startsWith('data:'))b.uri='data:application/octet-stream;base64,'+fs.readFileSync(path.join(path.dirname(p),b.uri)).toString('base64');
 // sin imágenes (las texturas se empaquetan aparte por nombre de material)
 delete j.images;delete j.textures;delete j.samplers;for(const m of j.materials||[]){if(m.pbrMetallicRoughness){delete m.pbrMetallicRoughness.baseColorTexture;delete m.pbrMetallicRoughness.metallicRoughnessTexture}delete m.normalTexture;delete m.emissiveTexture;delete m.occlusionTexture}
 return new Promise((res,rej)=>new GLTFLoader().parse(JSON.stringify(j),path.dirname(p)+'/',g=>res(g.scene),rej))}
// reduce las hojas quitando racimos enteros (componentes conexas) hasta un máximo de triángulos
function thinLeaves(idx,maxT,seed,pid){const nt=idx.length/3;if(nt<=maxT)return idx;const par=new Int32Array(nt).fill(-1);const vmap=new Map();
 const find=a=>{while(par[a]>=0&&par[par[a]]>=0)a=par[a]=par[par[a]];return par[a]>=0?par[a]:a};
 for(let t=0;t<nt;t++)for(let c=0;c<3;c++){const v=pid[idx[t*3+c]];const o=vmap.get(v);if(o==null)vmap.set(v,t);else{const a=find(t),b=find(o);if(a!==b)par[a]=b}}
 const comps=new Map();for(let t=0;t<nt;t++){const r=find(t);(comps.get(r)||comps.set(r,[]).get(r)).push(t)}
 const list=[...comps.values()];if(list.length<4)return idx;let r=seed;const rnd=()=>{r=(r*16807)%2147483647;return r/2147483647};
 for(let i=list.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[list[i],list[j]]=[list[j],list[i]]}
 const out=[];let n=0;for(const cp of list){if(n+cp.length>maxT&&n>0)continue;n+=cp.length;for(const t of cp)out.push(idx[t*3],idx[t*3+1],idx[t*3+2])}return out}
// textura: nombre de archivo del material (glTF: uri de la imagen; FBX: nombre del material → nombre de textura por convención)
function texFor(mat,file){const n=(mat.name||'').toLowerCase();const base=path.basename(file).split('_')[0];
 const exist=f=>fs.existsSync(path.join(src,f))?f:null;
 if(/leaf|leav|foliage/.test(n))return exist(base+'_Leaves.png')||exist('Leaves_BW.png');
 if(/bark|trunk|wood/.test(n))return exist(base+'_Bark.jpg')||exist(base+'_Trunk.jpg');
 if(/rock|stone/.test(n))return exist('Rocks.jpg');if(/flower/.test(n))return exist('Flowers.png');if(/grass/.test(n))return exist('Grass.png');return null}
function readImg(f){const b=fs.readFileSync(path.join(src,f));if(f.endsWith('.png')){const p=PNG.sync.read(b);return{w:p.width,h:p.height,d:p.data}}const j=jpeg.decode(b,{useTArray:true,maxMemoryUsageInMB:1024});return{w:j.width,h:j.height,d:j.data}}
function shrink(img,S){const out=new Uint8Array(S*S*4),fx=img.w/S,fy=img.h/S;
 for(let y=0;y<S;y++)for(let x=0;x<S;x++){let r=0,g=0,b=0,a=0,n=0;for(let yy=Math.floor(y*fy);yy<Math.floor((y+1)*fy);yy++)for(let xx=Math.floor(x*fx);xx<Math.floor((x+1)*fx);xx++){const o=(yy*img.w+xx)*4;const al=img.d[o+3];r+=img.d[o]*al;g+=img.d[o+1]*al;b+=img.d[o+2]*al;a+=al;n++}
  const o=(y*S+x)*4;out[o]=a?r/a:0;out[o+1]=a?g/a:0;out[o+2]=a?b/a:0;out[o+3]=n?a/n:255}return out}
// hojas en escala de grises con volumen (bordes más oscuros y ruido suave): el color natural lo pone el juego por especie
function grayLeaves(px,S){const A=new Float32Array(S*S);for(let i=0;i<S*S;i++)A[i]=px[i*4+3]/255;
 const R=Math.max(2,Math.round(S/64));const blur1=(src,dst,stride,step)=>{for(let l=0;l<S;l++){const P=new Float32Array(S+1);for(let k=0;k<S;k++)P[k+1]=P[k]+src[l*stride+k*step];for(let k=0;k<S;k++){const a0=Math.max(0,k-R),a1=Math.min(S,k+R+1);dst[l*stride+k*step]=(P[a1]-P[a0])/(a1-a0)}}};
 const T=new Float32Array(S*S),B=new Float32Array(S*S);blur1(A,T,S,1);blur1(T,B,1,S);
 const h=(x,y)=>{const n=Math.sin(x*127.1+y*311.7)*43758.5453;return n-Math.floor(n)};const vn=(x,y)=>{const xi=Math.floor(x),yi=Math.floor(y),fx=x-xi,fy=y-yi,a=h(xi,yi),b=h(xi+1,yi),c=h(xi,yi+1),d=h(xi+1,yi+1);const u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v};
 for(let y=0;y<S;y++)for(let x=0;x<S;x++){const o=(y*S+x)*4;const r=px[o],g=px[o+1],b=px[o+2];if(px[o+3]<8)continue;if(r>g*1.05&&g<160&&r>b)continue;// ramas (marrones) se quedan
  const n=vn(x/S*9,y/S*9)*.6+vn(x/S*31,y/S*31)*.4;const e=Math.min(1,Math.max(0,(B[y*S+x]-.35)/.6));let v=.52+.28*e+.2*n;v=Math.min(1,v)*235;px[o]=px[o+1]=px[o+2]=v}}
const GRAY=/NormalTree_Leaves|BirchTree_Leaves|PineTree_Leaves|PalmTree_Leaves|Bush_Leaves|Leaves_BW|MapleTree_Leaves_BW/;
const texOut={};function packTex(f,kind){if(!f)return null;if(texOut[f])return f;const img=readImg(f);const S=Math.min(TEXSIZE[kind]||256,img.w);const px=shrink(img,S);if(GRAY.test(f))grayLeaves(px,S);
 if(f.endsWith('.png')){const p=new PNG({width:S,height:S});p.data=Buffer.from(px);texOut[f]='data:image/png;base64,'+PNG.sync.write(p).toString('base64')}
 else texOut[f]='data:image/jpeg;base64,'+Buffer.from(jpeg.encode({data:px,width:S,height:S},82).data).toString('base64');return f}
const b64=a=>Buffer.from(a.buffer,a.byteOffset,a.byteLength).toString('base64');
const out={};
for(const [key,file,H,forceLeaf] of LIST){let root;try{root=await loadModel(file)}catch(e){console.error('ERROR',key,e.message);continue}
 root.updateMatrixWorld(true);const parts={};const bb=new THREE.Box3();
 root.traverse(o=>{if(!o.isMesh)return;const mats=Array.isArray(o.material)?o.material:[o.material];const g=o.geometry.clone().applyMatrix4(o.matrixWorld);
  const groups=g.groups.length?g.groups:[{start:0,count:g.index?g.index.count:g.attributes.position.count,materialIndex:0}];
  for(const gr of groups){const mt=mats[gr.materialIndex]||mats[0];let tf=texFor(mt,file);const leaf=/leaf|leav|foliage|flower|grass/i.test(mt.name||'')||/Leaves|Flowers|Grass/.test(tf||'');if(leaf&&forceLeaf)tf=forceLeaf;
   const k=(leaf?'L':'B')+'|'+(tf||'');const P=parts[k]||(parts[k]={leaf,tex:tf,color:mt.color?mt.color.getHex():0xffffff,pos:[],nor:[],uv:[],idx:[]});
   const pa=g.attributes.position,na=g.attributes.normal,ua=g.attributes.uv;const base=P.pos.length/3,map=new Map();
   for(let t=gr.start;t<gr.start+gr.count;t++){const vi=g.index?g.index.getX(t):t;let j=map.get(vi);if(j==null){j=P.pos.length/3;map.set(vi,j);P.pos.push(pa.getX(vi),pa.getY(vi),pa.getZ(vi));const n=na?[na.getX(vi),na.getY(vi),na.getZ(vi)]:[0,1,0];P.nor.push(...n);P.uv.push(ua?ua.getX(vi):0,ua?ua.getY(vi):0)}P.idx.push(j)}
   for(let i=base;i<P.pos.length/3;i++)bb.expandByPoint(new THREE.Vector3(P.pos[i*3],P.pos[i*3+1],P.pos[i*3+2]))}});
 const s=H/(bb.max.y-bb.min.y),cx=(bb.min.x+bb.max.x)/2,cz=(bb.min.z+bb.max.z)/2;const res=[];let tris=0,tris1=0;
 for(const k in parts){const P=parts[k];const nv=P.pos.length/3;
  // escala/centrado
  const pos=new Float32Array(nv*3);for(let i=0;i<nv*3;i+=3){pos[i]=(P.pos[i]-cx)*s;pos[i+1]=(P.pos[i+1]-bb.min.y)*s;pos[i+2]=(P.pos[i+2]-cz)*s}
  // soldadura (posición+normal+uv) → malla indexada simplificable
  const wm=new Map(),wmap=new Int32Array(nv);let wn=0;const W=[],WN=[],WU=[];
  for(let i=0;i<nv;i++){const kk=Math.round(pos[i*3]*2e3)+','+Math.round(pos[i*3+1]*2e3)+','+Math.round(pos[i*3+2]*2e3)+'|'+Math.round(P.nor[i*3]*20)+','+Math.round(P.nor[i*3+1]*20)+','+Math.round(P.nor[i*3+2]*20)+'|'+Math.round(P.uv[i*2]*1e3)+','+Math.round(P.uv[i*2+1]*1e3);
   let j=wm.get(kk);if(j==null){j=wn++;wm.set(kk,j);W.push(pos[i*3],pos[i*3+1],pos[i*3+2]);WN.push(P.nor[i*3],P.nor[i*3+1],P.nor[i*3+2]);WU.push(P.uv[i*2],P.uv[i*2+1])}wmap[i]=j}
  const W3=new Float32Array(W);let widx=[];for(let t=0;t<P.idx.length;t+=3){const a=wmap[P.idx[t]],b=wmap[P.idx[t+1]],c=wmap[P.idx[t+2]];if(a!==b&&b!==c&&a!==c)widx.push(a,b,c)}
  // conectividad por posición (para quitar hojas enteras)
  const pm=new Map(),pid=new Int32Array(wn);for(let j=0;j<wn;j++){const kk=Math.round(W3[j*3]*2e3)+','+Math.round(W3[j*3+1]*2e3)+','+Math.round(W3[j*3+2]*2e3);let q=pm.get(kk);if(q==null){q=pm.size;pm.set(kk,q)}pid[j]=q}
  const simp=(ix,target,err)=>{if(ix.length/3<=target)return ix;return Array.from(MeshoptSimplifier.simplify(Uint32Array.from(ix),W3,3,Math.floor(target)*3,err)[0])};
  const big=H>1.2;let L0,L1;
  if(P.leaf){L0=thinLeaves(widx,big?2600:9999,7,pid);L1=thinLeaves(L0,big?760:9999,11,pid);if(!big)L1=L0}
  else{L0=simp(widx,big?1800:900,.015);L1=big?simp(L0,420,.12):L0}
  const use=new Int32Array(wn).fill(-1);let vn=0;for(const i of L0)if(use[i]<0)use[i]=vn++;
  const pos2=new Float32Array(vn*3),nor2=new Int8Array(vn*3),uv2=new Float32Array(vn*2);
  for(let j=0;j<wn;j++){const q=use[j];if(q<0)continue;pos2.set(W3.subarray(j*3,j*3+3),q*3);for(let c=0;c<3;c++)nor2[q*3+c]=Math.round(Math.max(-1,Math.min(1,WN[j*3+c]))*127);uv2[q*2]=WU[j*2];uv2[q*2+1]=WU[j*2+1]}
  const T=vn<65536?Uint16Array:Uint32Array;const ix=T.from(L0.map(i=>use[i])),ix1=T.from(L1.map(i=>use[i]));tris+=ix.length/3;tris1+=ix1.length/3;
  res.push({leaf:P.leaf?1:0,tex:packTex(P.tex,P.leaf?'leaves':/Bark|Trunk/.test(P.tex||'')?'bark':'other'),color:P.color,pos:b64(pos2),nor:b64(nor2),uv:b64(uv2),idx:b64(ix),idx1:b64(ix1),i32:vn>=65536?1:0})}
 out[key]={h:H,r:Math.max(bb.max.x-bb.min.x,bb.max.z-bb.min.z)*s/2,parts:res};console.log(key.padEnd(8),'partes',res.length,'tri',tris,'lod1',tris1,'radio',out[key].r.toFixed(2),res.map(p=>(p.leaf?'hojas:':'')+p.tex).join(' '))}
const js='// Generado por tools/bake_nature.mjs — Quaternius Ultimate Stylized Nature (CC0)\nwindow.IMPERIA_NATURE='+JSON.stringify({tex:texOut,models:out})+';\n';
fs.writeFileSync(path.join(dir,'../web/nature_data.js'),js);console.log('→ web/nature_data.js',(js.length/1048576).toFixed(2),'MB');
