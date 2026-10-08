// Imperia — arte procedural v4: texturas pintadas por código, geometría fusionada y modelos detallados.
// Todo se genera aquí (sin recursos externos). Coordenadas: 1 casilla = 1 unidad; los modelos miran hacia +X.
(function(root){
'use strict';
const TH=root.THREE;
const A={};
let fogify=m=>m;

// ---------- ruido determinista
function hash2(x,y,s){let h=(x*374761393+y*668265263+s*1442695041)|0;h=Math.imul(h^(h>>>13),1274126177);return((h^(h>>>16))>>>0)/4294967296}
function vnoise(x,y,s,per){const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi,w=v=>v*v*(3-2*v),P=v=>per?((v%per)+per)%per:v;
 const a=hash2(P(xi),P(yi),s),b=hash2(P(xi+1),P(yi),s),c=hash2(P(xi),P(yi+1),s),d=hash2(P(xi+1),P(yi+1),s),u=w(xf),v=w(yf);
 return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v}
function fbm(x,y,s,oct,per){let v=0,a=.5,f=1,n=0;for(let i=0;i<oct;i++){v+=a*vnoise(x*f,y*f,s+i*17,per?per*f:0);n+=a;a*=.5;f*=2}return v/n}
let rs=1;const rnd=()=>{rs=(rs*16807)%2147483647;return rs/2147483647};
A.hash2=hash2;A.fbm=fbm;

// ---------- lienzos y texturas
const S=512;
function canvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h||w;return c}
function tex(c,o){const t=new TH.CanvasTexture(c);t.colorSpace=(o&&o.linear)?TH.NoColorSpace:TH.SRGBColorSpace;t.wrapS=t.wrapT=TH.RepeatWrapping;t.anisotropy=8;t.generateMipmaps=true;t.minFilter=TH.LinearMipmapLinearFilter;return t}
// campo de ruido teselable en píxeles: f(x,y)->[r,g,b]
function field(w,h,f){const c=canvas(w,h),x=c.getContext('2d'),d=x.createImageData(w,h);for(let j=0;j<h;j++)for(let i=0;i<w;i++){const k=(j*w+i)*4,[r,g,b]=f(i,j);d.data[k]=r;d.data[k+1]=g;d.data[k+2]=b;d.data[k+3]=255}x.putImageData(d,0,0);return c}
const cl=v=>v<0?0:v>255?255:v;
function mixc(a,b,t){return[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t]}
// dibuja con envoltura para que la textura sea continua
function wrapDraw(ctx,w,h,x,y,r,fn){for(const dx of[-w,0,w])for(const dy of[-h,0,h]){if(x+dx<-r||x+dx>w+r||y+dy<-r||y+dy>h+r)continue;fn(x+dx,y+dy)}}
const P=(w)=>w/S*8;// periodo de ruido para que tesele
function grassTex(){rs=11;const c=field(S,S,(i,j)=>{const n=fbm(i/64,j/64,3,4,8),m=fbm(i/16,j/16,9,3,32),t=fbm(i/180,j/180,5,2,3);
  const base=mixc([96,128,58],[128,150,66],n);const dry=mixc(base,[150,146,82],Math.max(0,t-.55)*1.6);const k=.82+m*.36;return[cl(dry[0]*k),cl(dry[1]*k),cl(dry[2]*k)]});
 const x=c.getContext('2d');for(let i=0;i<9000;i++){const px=rnd()*S,py=rnd()*S,l=3+rnd()*7,a=-1.9+rnd()*.8,dk=rnd()<.5;
  x.strokeStyle=dk?`rgba(46,70,26,${.25+rnd()*.25})`:`rgba(${170+rnd()*40|0},${190+rnd()*30|0},${90+rnd()*30|0},${.18+rnd()*.2})`;x.lineWidth=.8+rnd()*.8;
  wrapDraw(x,S,S,px,py,12,(X,Y)=>{x.beginPath();x.moveTo(X,Y);x.lineTo(X+Math.cos(a)*l,Y+Math.sin(a)*l);x.stroke()})}
 for(let i=0;i<260;i++){const px=rnd()*S,py=rnd()*S,col=['#f4eed8','#f2d25a','#c9a0e0','#e98070'][i%4];x.fillStyle=col;wrapDraw(x,S,S,px,py,3,(X,Y)=>{x.beginPath();x.arc(X,Y,1.1+rnd(),0,7);x.fill()})}
 return c}
function dirtTex(){rs=21;const c=field(S,S,(i,j)=>{const n=fbm(i/48,j/48,4,5,P(S)*1.33),m=fbm(i/8,j/8,7,2,64);const b=mixc([122,94,62],[160,128,86],n);const k=.85+m*.3;return[cl(b[0]*k),cl(b[1]*k),cl(b[2]*k)]});
 const x=c.getContext('2d');for(let i=0;i<1600;i++){const px=rnd()*S,py=rnd()*S,r=1+rnd()*3.2,g=90+rnd()*80|0;x.fillStyle=`rgba(${g+30},${g+10},${g-10},${.5+rnd()*.4})`;
  wrapDraw(x,S,S,px,py,6,(X,Y)=>{x.beginPath();x.ellipse(X,Y,r,r*.75,rnd()*3,0,7);x.fill();x.fillStyle='rgba(40,28,18,.35)';x.beginPath();x.ellipse(X+.8,Y+.9,r*.9,r*.5,0,0,7);x.fill()})}
 for(let i=0;i<120;i++){const px=rnd()*S,py=rnd()*S;x.strokeStyle='rgba(70,50,32,.35)';x.lineWidth=1;wrapDraw(x,S,S,px,py,30,(X,Y)=>{x.beginPath();x.moveTo(X,Y);let a=rnd()*6;for(let k=0;k<5;k++){a+=rnd()-.5;X+=Math.cos(a)*5;Y+=Math.sin(a)*5;x.lineTo(X,Y)}x.stroke()})}
 return c}
function sandTex(){rs=31;return field(S,S,(i,j)=>{const n=fbm(i/60,j/60,8,4,P(S)*1.07),rip=Math.sin((i*.6+j*.25)/5+fbm(i/40,j/40,2,2,12.8)*6)*.5+.5,g=hash2(i,j,5);
  const b=mixc([206,184,134],[226,208,160],n);const k=.93+rip*.06+(g-.5)*.12;return[cl(b[0]*k),cl(b[1]*k),cl(b[2]*k)]})}
function rockTex(){rs=41;const c=field(S,S,(i,j)=>{const n=fbm(i/40,j/40,12,5,P(S)*1.6),m=fbm(i/10,j/10,13,3,51.2);const b=mixc([106,100,90],[152,146,132],n);const k=.8+m*.4;return[cl(b[0]*k),cl(b[1]*k),cl(b[2]*k+4)]});
 const x=c.getContext('2d');x.lineWidth=1.4;for(let i=0;i<70;i++){x.strokeStyle=`rgba(40,36,32,${.35+rnd()*.3})`;const px=rnd()*S,py=rnd()*S;wrapDraw(x,S,S,px,py,60,(X,Y)=>{x.beginPath();x.moveTo(X,Y);let a=rnd()*6;for(let k=0;k<9;k++){a+=(rnd()-.5)*.9;X+=Math.cos(a)*7;Y+=Math.sin(a)*7;x.lineTo(X,Y)}x.stroke()})}
 return c}
function thatchTex(){rs=51;const W=256,c=field(W,W,(i,j)=>{const n=fbm(i/30,j/30,14,3,8.53);const b=mixc([150,118,70],[196,164,104],n);return b.map(cl)});const x=c.getContext('2d');
 for(let i=0;i<5200;i++){const px=rnd()*W,py=rnd()*W,l=10+rnd()*18,a=Math.PI/2+(rnd()-.5)*.25,lt=rnd();x.strokeStyle=lt<.5?`rgba(226,196,130,${.35+rnd()*.3})`:`rgba(92,66,36,${.3+rnd()*.3})`;x.lineWidth=.7+rnd()*.7;
  wrapDraw(x,W,W,px,py,30,(X,Y)=>{x.beginPath();x.moveTo(X,Y);x.lineTo(X+Math.cos(a)*l,Y+Math.sin(a)*l);x.stroke()})}
 for(let r=0;r<4;r++){const y=r*64+60;const g=x.createLinearGradient(0,y-10,0,y+4);g.addColorStop(0,'rgba(40,26,12,0)');g.addColorStop(1,'rgba(40,26,12,.55)');x.fillStyle=g;x.fillRect(0,y-10,W,14)}
 return c}
function tilesTex(){rs=61;const W=256,c=canvas(W),x=c.getContext('2d');x.fillStyle='#5e2a1c';x.fillRect(0,0,W,W);const rows=8,cols=8,th=W/rows,tw=W/cols;
 for(let r=rows;r>=-1;r--)for(let q=-1;q<=cols;q++){const ox=(r%2)*tw/2,X=q*tw+ox,Y=r*th;const v=rnd();const base=[160+v*40|0,74+v*26|0,48+v*16|0];
  const g=x.createLinearGradient(X,Y,X+tw,Y);g.addColorStop(0,`rgb(${base[0]*.72|0},${base[1]*.7|0},${base[2]*.7|0})`);g.addColorStop(.45,`rgb(${base[0]},${base[1]},${base[2]})`);g.addColorStop(1,`rgb(${base[0]*.6|0},${base[1]*.6|0},${base[2]*.6|0})`);
  x.fillStyle=g;x.beginPath();x.moveTo(X+1,Y);x.lineTo(X+tw-1,Y);x.lineTo(X+tw-1,Y+th*1.15);x.quadraticCurveTo(X+tw/2,Y+th*1.45,X+1,Y+th*1.15);x.closePath();x.fill();
  x.fillStyle='rgba(30,12,6,.35)';x.fillRect(X,Y+th*1.12,tw,3)}
 const d=x.getImageData(0,0,W,W);for(let i=0;i<W*W;i++){const n=(fbm((i%W)/20,((i/W)|0)/20,3,3,12.8)-.5)*40;d.data[i*4]+=n;d.data[i*4+1]+=n*.7;d.data[i*4+2]+=n*.5}x.putImageData(d,0,0);return c}
function slateTex(){rs=62;const W=256,c=canvas(W),x=c.getContext('2d');x.fillStyle='#2f3338';x.fillRect(0,0,W,W);const rows=10,th=W/rows;
 for(let r=0;r<rows;r++){let X=-(r%2)*12;while(X<W){const tw=18+rnd()*14,v=60+rnd()*40|0;x.fillStyle=`rgb(${v},${v+6},${v+14})`;x.fillRect(X+1,r*th+1,tw-2,th-1);x.fillStyle='rgba(0,0,0,.3)';x.fillRect(X+1,r*th+th-3,tw-2,2);X+=tw}}return c}
function planksTex(dark){rs=dark?71:72;const W=256,c=canvas(W),x=c.getContext('2d');const bw=32;
 for(let b=0;b<W/bw;b++){const v=rnd();const base=dark?[70+v*20,50+v*14,34+v*10]:[140+v*30,104+v*22,66+v*16];const d=x.createImageData(bw,W);
  for(let j=0;j<W;j++)for(let i=0;i<bw;i++){const gr=Math.sin((i+fbm(i/8,j/40,b,2)*18)*1.3)*.5+.5,n=fbm(i/6,j/60,b+5,3);const k=.78+gr*.14+n*.2-(i<2||i>bw-3?.3:0);const q=(j*bw+i)*4;d.data[q]=cl(base[0]*k);d.data[q+1]=cl(base[1]*k);d.data[q+2]=cl(base[2]*k);d.data[q+3]=255}
  x.putImageData(d,b*bw,0);const cut=rnd()*W;x.fillStyle='rgba(20,12,6,.6)';x.fillRect(b*bw,cut,bw,2);x.fillStyle='rgba(30,30,30,.7)';for(const yy of[cut-8,cut+8]){x.fillRect(b*bw+5,yy,2,2);x.fillRect(b*bw+bw-7,yy,2,2)}}
 return c}
function stoneTex(){rs=81;const W=256,c=canvas(W),x=c.getContext('2d');x.fillStyle='#8c8476';x.fillRect(0,0,W,W);const rows=8,th=W/rows;
 for(let r=0;r<rows;r++){let X=-rnd()*30;while(X<W+30){const bw=26+rnd()*30,v=rnd();const base=[150+v*40,142+v*36,126+v*30];const Y=r*th;
   const g=x.createLinearGradient(X,Y,X,Y+th);g.addColorStop(0,`rgb(${base[0]+14|0},${base[1]+14|0},${base[2]+12|0})`);g.addColorStop(1,`rgb(${base[0]*.78|0},${base[1]*.78|0},${base[2]*.78|0})`);
   x.fillStyle=g;const rr=4;x.beginPath();x.roundRect(X+2,Y+2,bw-4,th-4,rr);x.fill();for(const dx of[-W,W]){x.beginPath();x.roundRect(X+2+dx,Y+2,bw-4,th-4,rr);x.fill()}X+=bw}}
 const d=x.getImageData(0,0,W,W);for(let i=0;i<W*W;i++){const n=(fbm((i%W)/9,((i/W)|0)/9,5,3,28.4)-.5)*46;d.data[i*4]+=n;d.data[i*4+1]+=n;d.data[i*4+2]+=n*.9}x.putImageData(d,0,0);return c}
function plasterTex(){rs=91;return field(256,256,(i,j)=>{const n=fbm(i/36,j/36,21,4,7.11),m=fbm(i/6,j/6,22,2,42.7);const b=mixc([214,200,168],[236,226,200],n);const k=.9+m*.14;return[cl(b[0]*k),cl(b[1]*k),cl(b[2]*k)]})}
function cobbleTex(){rs=95;const W=256,c=canvas(W),x=c.getContext('2d');x.fillStyle='#6b6356';x.fillRect(0,0,W,W);for(let i=0;i<420;i++){const px=rnd()*W,py=rnd()*W,r=6+rnd()*6,v=120+rnd()*60|0;
 wrapDraw(x,W,W,px,py,14,(X,Y)=>{const g=x.createRadialGradient(X-2,Y-2,1,X,Y,r);g.addColorStop(0,`rgb(${v+30},${v+26},${v+20})`);g.addColorStop(1,`rgb(${v-30},${v-32},${v-36})`);x.fillStyle=g;x.beginPath();x.ellipse(X,Y,r,r*.8,rnd()*3,0,7);x.fill()})}return c}
function soilTex(){rs=97;const W=256;return field(W,W,(i,j)=>{const f=Math.sin(i/W*Math.PI*2*8)*.5+.5,n=fbm(i/12,j/12,31,3,21.3);const b=mixc([74,52,32],[118,86,56],f*.7+n*.3);return b.map(cl)})}
function clothTex(){rs=99;const W=128;return field(W,W,(i,j)=>{const w=((i%4<2)^(j%4<2))?1:.9,n=fbm(i/20,j/20,41,2,6.4);const v=(200+n*55)*w;return[cl(v),cl(v),cl(v)]})}
function barkTex(){rs=101;const W=128;return field(W,W,(i,j)=>{const s=Math.sin((i+fbm(i/10,j/30,51,3,12.8)*30)*.5)*.5+.5,n=fbm(i/5,j/5,52,2,25.6);const b=mixc([58,42,30],[104,80,58],s*.6+n*.4);return b.map(cl)})}
function waterNormal(){const W=256,c=canvas(W),x=c.getContext('2d'),d=x.createImageData(W,W),h=new Float32Array(W*W);
 for(let j=0;j<W;j++)for(let i=0;i<W;i++)h[j*W+i]=fbm(i/32,j/32,61,4,8);
 for(let j=0;j<W;j++)for(let i=0;i<W;i++){const k=j*W+i,dx=h[j*W+(i+1)%W]-h[k],dy=h[((j+1)%W)*W+i]-h[k];d.data[k*4]=128+dx*420;d.data[k*4+1]=128+dy*420;d.data[k*4+2]=255;d.data[k*4+3]=255}x.putImageData(d,0,0);return c}

// ---------- materiales
const M={};A.M=M;
function std(o){return fogify(new TH.MeshStandardMaterial(Object.assign({roughness:.9,metalness:0,vertexColors:true},o)))}
A.init=function(opts){fogify=opts.fogify||fogify;
 const t0=performance.now();
 const T={grass:tex(grassTex()),dirt:tex(dirtTex()),sand:tex(sandTex()),rock:tex(rockTex()),thatch:tex(thatchTex()),tiles:tex(tilesTex()),slate:tex(slateTex()),planks:tex(planksTex(false)),timber:tex(planksTex(true)),
  stone:tex(stoneTex()),plaster:tex(plasterTex()),cobble:tex(cobbleTex()),soil:tex(soilTex()),cloth:tex(clothTex()),bark:tex(barkTex()),wn:tex(waterNormal(),{linear:true})};
 A.T=T;
 const bump=(t,s)=>({map:t,bumpMap:t,bumpScale:s});
 M.thatch=std(Object.assign(bump(T.thatch,.04),{roughness:1}));M.tiles=std(Object.assign(bump(T.tiles,.03),{roughness:.8}));M.slate=std(Object.assign(bump(T.slate,.02),{roughness:.7}));
 M.planks=std(bump(T.planks,.02));M.timber=std(bump(T.timber,.02));M.stone=std(Object.assign(bump(T.stone,.035),{roughness:.95}));M.plaster=std(Object.assign(bump(T.plaster,.01),{roughness:.95}));
 M.cobble=std(bump(T.cobble,.03));M.soil=std(bump(T.soil,.03));M.cloth=std({map:T.cloth,roughness:1,side:TH.DoubleSide});M.bark=std(bump(T.bark,.02));
 M.matte=std({roughness:.85});M.metal=std({roughness:.38,metalness:.65});M.gold=std({roughness:.3,metalness:.8,emissive:0x2a1c00});
 M.leaf=std({roughness:.8});M.glow=fogify(new TH.MeshStandardMaterial({color:0x2a1a12,emissive:0xff7a2a,emissiveIntensity:1.4,vertexColors:true}));
 M.window=fogify(new TH.MeshStandardMaterial({color:0x2a2f38,roughness:.4,emissive:0xffb35c,emissiveIntensity:0,vertexColors:true}));
 A.ms=performance.now()-t0};

// ---------- geometría: primitivas con UV proporcionales y fusión por material
const V3=TH.Vector3,Mx=TH.Matrix4,Q=TH.Quaternion,E=TH.Euler;
function scaleUV(g,su,sv){const uv=g.attributes.uv;if(!uv)return g;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*su,uv.getY(i)*(sv??su));return g}
// caja con la base en y=0 y UV según las dimensiones (d = densidad: repeticiones por unidad)
function box(w,h,d,den){den=den??1;const g=new TH.BoxGeometry(w,h,d);const uv=g.attributes.uv;
 const dims=[[d,h],[d,h],[w,d],[w,d],[w,h],[w,h]];for(let f=0;f<6;f++)for(let k=0;k<4;k++){const i=f*4+k;uv.setXY(i,uv.getX(i)*dims[f][0]*den,uv.getY(i)*dims[f][1]*den)}
 return g.translate(0,h/2,0)}
function cyl(a,b,h,s,den,open){const g=new TH.CylinderGeometry(a,b,h,s||10,1,!!open);scaleUV(g,Math.PI*(a+b)*(den??1),h*(den??1));return g.translate(0,h/2,0)}
function cone(r,h,s,den){const g=new TH.ConeGeometry(r,h,s||10);scaleUV(g,Math.PI*r*2*(den??1),Math.hypot(r,h)*(den??1));return g.translate(0,h/2,0)}
function cylC(a,b,h,s,den){const g=new TH.CylinderGeometry(a,b,h,s||10);scaleUV(g,Math.PI*(a+b)*(den??1),h*(den??1));return g}
function sph(r,ws,hs){return new TH.SphereGeometry(r,ws||10,hs||8)}
function caps(r,l,rs2){return new TH.CapsuleGeometry(r,l,3,rs2||8)}
// tejado a dos aguas: largo w (eje X), fondo d, altura h, alero o
function gable(w,d,h,o,den){den=den??1;o=o??.12;const x=w/2+o,z=d/2+o,sl=Math.hypot(z,h);const P=[],N=[],UV=[];
 const quad=(a,b,c,dd,n,uvs)=>{for(const [p,u] of[[a,uvs[0]],[b,uvs[1]],[c,uvs[2]],[a,uvs[0]],[c,uvs[2]],[dd,uvs[3]]]){P.push(...p);N.push(...n);UV.push(...u)}};
 const ny=z/sl,nz=h/sl;
 quad([-x,0,z],[x,0,z],[x,h,0],[-x,h,0],[0,ny,nz],[[0,0],[2*x*den,0],[2*x*den,sl*den],[0,sl*den]]);
 quad([x,0,-z],[-x,0,-z],[-x,h,0],[x,h,0],[0,ny,-nz],[[0,0],[2*x*den,0],[2*x*den,sl*den],[0,sl*den]]);
 // hastiales
 const tri=(a,b,c,n)=>{for(const p of[a,b,c]){P.push(...p);N.push(...n);UV.push(p[2]*den,p[1]*den)}};
 const xi=w/2;tri([xi,0,-d/2],[xi,0,d/2],[xi,h*(d/2)/z,0],[1,0,0]);tri([-xi,0,d/2],[-xi,0,-d/2],[-xi,h*(d/2)/z,0],[-1,0,0]);
 // grosor del alero (canto)
 const t=.05;quad([-x,-t,z],[x,-t,z],[x,0,z],[-x,0,z],[0,0,1],[[0,0],[2*x*den,0],[2*x*den,.1],[0,.1]]);quad([x,-t,-z],[-x,-t,-z],[-x,0,-z],[x,0,-z],[0,0,-1],[[0,0],[2*x*den,0],[2*x*den,.1],[0,.1]]);
 const g=new TH.BufferGeometry();g.setAttribute('position',new TH.Float32BufferAttribute(P,3));g.setAttribute('normal',new TH.Float32BufferAttribute(N,3));g.setAttribute('uv',new TH.Float32BufferAttribute(UV,2));return g}
// hastial de pared (triángulo macizo con grosor) para cerrar el tejado
function gableWall(d,h,t){const s=new TH.Shape();s.moveTo(-d/2,0);s.lineTo(d/2,0);s.lineTo(0,h);s.closePath();const g=new TH.ExtrudeGeometry(s,{depth:t,bevelEnabled:false});g.rotateY(Math.PI/2);g.translate(-t/2,0,0);return scaleUV(g,1)}
// tejado a cuatro aguas / piramidal
function hip(w,d,h,o){o=o??.1;const g=new TH.ConeGeometry(Math.SQRT1_2,1,4,1,true);g.rotateY(Math.PI/4);g.scale(w+2*o,h,d+2*o);g.translate(0,h/2,0);return scaleUV(g,(w+d)*.7,h*1.6)}
A.prim={box,cyl,cylC,cone,sph,caps,gable,gableWall,hip};

// Kit: acumula piezas por material con color de vértice y las fusiona en pocas mallas
class Kit{constructor(){this.bins=new Map();this.m=new Mx();this.q=new Q();this.e=new E();this.s=new V3();this.p=new V3()}
 add(geo,mk,col,x,y,z,ry,rx,rz,sx,sy,sz){let g=geo.index?geo.toNonIndexed():geo.clone();
  this.e.set(rx||0,ry||0,rz||0,'YXZ');this.q.setFromEuler(this.e);this.p.set(x||0,y||0,z||0);this.s.set(sx??1,sy??sx??1,sz??sx??1);this.m.compose(this.p,this.q,this.s);g.applyMatrix4(this.m);
  if(!g.attributes.uv){g.setAttribute('uv',new TH.Float32BufferAttribute(new Float32Array(g.attributes.position.count*2),2))}
  const c=new TH.Color(col==null?0xffffff:col),n=g.attributes.position.count,ca=new Float32Array(n*3);for(let i=0;i<n;i++){ca[i*3]=c.r;ca[i*3+1]=c.g;ca[i*3+2]=c.b}g.setAttribute('color',new TH.BufferAttribute(ca,3));
  (this.bins.get(mk)||this.bins.set(mk,[]).get(mk)).push(g);return this}
 geos(){const out={};for(const [k,list] of this.bins)out[k]=merge(list);return out}
 build(opts){const g=new TH.Group(),gs=this.geos();for(const k in gs){const me=new TH.Mesh(gs[k],typeof k==='string'&&M[k]?M[k]:M.matte);me.castShadow=!(opts&&opts.noShadow);me.receiveShadow=true;g.add(me)}return g}}
function merge(list){let n=0;for(const g of list)n+=g.attributes.position.count;const pos=new Float32Array(n*3),nor=new Float32Array(n*3),uv=new Float32Array(n*2),col=new Float32Array(n*3);let o=0;
 for(const g of list){const c=g.attributes.position.count;pos.set(g.attributes.position.array,o*3);if(g.attributes.normal)nor.set(g.attributes.normal.array,o*3);uv.set(g.attributes.uv.array,o*2);col.set(g.attributes.color.array,o*3);o+=c}
 const g=new TH.BufferGeometry();g.setAttribute('position',new TH.BufferAttribute(pos,3));g.setAttribute('normal',new TH.BufferAttribute(nor,3));g.setAttribute('uv',new TH.BufferAttribute(uv,2));g.setAttribute('color',new TH.BufferAttribute(col,3));
 g.computeBoundingSphere();g.computeBoundingBox();return g}
// oscurece las piezas cercanas al suelo (oclusión ambiental falsa)
function groundAO(g,h0,h1,k){const p=g.attributes.position,c=g.attributes.color;for(let i=0;i<p.count;i++){const t=Math.min(1,Math.max(0,(p.getY(i)-h0)/(h1-h0)));const f=1-k*(1-t);c.setXYZ(i,c.getX(i)*f,c.getY(i)*f,c.getZ(i)*f)}return g}
A.Kit=Kit;A.merge=merge;A.groundAO=groundAO;

// ---------- colores
const PC=[0x2f6fd6,0xc8352a,0xe0b12a,0x8a4fcf],PCD=[0x1f4c96,0x8e2419,0xa37c16,0x5e3591];
const CO={skin:0xd9a37e,skin2:0xb07a58,hair:0x3b2a1e,wood:0x7a5634,woodD:0x4a3322,iron:0x9aa1a8,steel:0xc4cad0,leather:0x6e4b30,rope:0xb99e6c,straw:0xd2b46a,cream:0xe8dcc0,dark:0x22201e,gold:0xe2b84a,red:0xa8322a,green:0x4d6b34,brown:0x7a5a3a,grey:0x77736c};
A.PC=PC;A.CO=CO;

// ---------- atrezo
function barrel(k,x,z,y,s){s=s||1;k.add(cyl(.11*s,.11*s,.26*s,10,2),'planks',0xd8c8b0,x,y||0,z);k.add(cyl(.117*s,.117*s,.03*s,10),'metal',0x55504a,x,(y||0)+.05*s,z);k.add(cyl(.117*s,.117*s,.03*s,10),'metal',0x55504a,x,(y||0)+.19*s,z)}
function crate(k,x,z,y,s,r){s=s||1;k.add(box(.22*s,.2*s,.22*s,3),'planks',0xe0c8a0,x,y||0,z,r||0)}
function sack(k,x,z,col){k.add(sph(.09,8,6),'cloth',col||0xcdb58a,x,.07,z,0,0,0,1,.8,1)}
function woodpile(k,x,z,r){for(let i=0;i<3;i++)for(let j=0;j<3-i;j++)k.add(cylC(.045,.045,.44,6),'bark',0xffffff,x+(j-(2-i)/2)*.095,.045+i*.08,z,(r||0)+Math.PI/2,Math.PI/2)}
function hay(k,x,z,r){k.add(cylC(.16,.16,.26,12),'thatch',0xf0d890,x,.16,z,r||0,0,Math.PI/2)}
function fence(k,x0,z0,x1,z1,col){const L=Math.hypot(x1-x0,z1-z0),n=Math.max(2,Math.round(L/.3)),a=Math.atan2(z1-z0,x1-x0);
 for(let i=0;i<=n;i++){const t=i/n;k.add(box(.04,.26,.04),'planks',col||0xb09070,x0+(x1-x0)*t,0,z0+(z1-z0)*t)}
 for(const y of[.1,.2])k.add(box(L,.025,.025,1),'planks',col||0xb09070,(x0+x1)/2,y,(z0+z1)/2,-a)}
function banner(k,o,x,z,h,y){y=y||0;k.add(cyl(.02,.025,h,6),'planks',0x8a6a4a,x,y,z);k.add(box(.02,.26,.2,1),'cloth',PC[o],x+.01,y+h-.32,z+.1);k.add(sph(.03,6,4),'gold',0xffffff,x,y+h,z)}
function torch(k,x,y,z){k.add(cyl(.015,.015,.14,5),'planks',0x6a4a30,x,y,z);k.add(sph(.03,6,4),'glow',0xffffff,x,y+.15,z)}
function cart(k,x,z,r){const c=Math.cos(r||0),s=Math.sin(r||0),P=(dx,dz)=>[x+dx*c-dz*s,z+dx*s+dz*c];let [a,b]=P(0,0);k.add(box(.5,.12,.3,3),'planks',0xd8b890,a,.14,b,-(r||0));
 for(const dz of[-.17,.17]){[a,b]=P(0,dz);k.add(new TH.CylinderGeometry(.11,.11,.03,12).rotateX(Math.PI/2),'planks',0x9a7a58,a,.11,b,-(r||0))}[a,b]=P(.4,0);k.add(box(.4,.03,.03),'planks',0xb09070,a,.18,b,-(r||0));
 [a,b]=P(-.05,0);k.add(sph(.1,8,6),'cloth',0xcdb58a,a,.3,b);[a,b]=P(.12,.05);k.add(sph(.08,8,6),'cloth',0xb8a070,a,.29,b)}
function well(k,x,z){k.add(cyl(.2,.22,.24,14,2),'stone',0xffffff,x,0,z);k.add(cyl(.17,.17,.02,14),'matte',0x1c2c3a,x,.22,z);for(const dz of[-.19,.19])k.add(box(.04,.46,.04),'planks',0xffffff,x,.2,z+dz);k.add(gable(.2,.48,.16,.04,2),'thatch',0xffffff,x,.66,z,Math.PI/2);k.add(cylC(.02,.02,.38,6),'planks',0xffffff,x,.52,z,0,Math.PI/2)}
function win(k,x,y,z,ry,w,h){w=w||.14;h=h||.16;k.add(box(.03,h,w),'window',0xffffff,x,y,z,ry);k.add(box(.04,h+.04,.025,4),'timber',0xffffff,x,y-.02,z+w/2+.012,ry);k.add(box(.04,h+.04,.025,4),'timber',0xffffff,x,y-.02,z-w/2-.012,ry);k.add(box(.05,.025,w+.06,4),'timber',0xffffff,x,y-.03,z,ry)}
function door(k,x,z,ry,w,h){w=w||.2;h=h||.34;k.add(box(.04,h,w,5),'planks',0x9a7a58,x,0,z,ry);k.add(box(.05,.03,w+.06,4),'timber',0xffffff,x,h,z,ry)}
// muro de entramado: caja de revoco + vigas vistas (X = ancho, Z = fondo)
function framed(k,w,h,d,x,y,z,opt){opt=opt||{};k.add(box(w,h,d,1.4),'plaster',opt.col||0xffffff,x,y,z);const T=.045;
 for(const sx of[-1,1])for(const sz of[-1,1])k.add(box(T,h,T,4),'timber',0xffffff,x+sx*(w/2-T/2+.01),y,z+sz*(d/2-T/2+.01));
 for(const yy of[0,h*.5,h-T]){k.add(box(w+.02,T,.03,4),'timber',0xffffff,x,y+yy,z+d/2+.005);k.add(box(w+.02,T,.03,4),'timber',0xffffff,x,y+yy,z-d/2-.005);k.add(box(.03,T,d+.02,4),'timber',0xffffff,x+w/2+.005,y+yy,z);k.add(box(.03,T,d+.02,4),'timber',0xffffff,x-w/2-.005,y+yy,z)}
 const nx=Math.max(1,Math.round(w/.42));for(let i=1;i<nx;i++){const px=x-w/2+i*w/nx;for(const sz of[-1,1])k.add(box(T,h,.03,4),'timber',0xffffff,px,y,z+sz*(d/2+.005))}
 const nz=Math.max(1,Math.round(d/.42));for(let i=1;i<nz;i++){const pz=z-d/2+i*d/nz;for(const sx of[-1,1])k.add(box(.03,h,T,4),'timber',0xffffff,x+sx*(w/2+.005),y,pz)}
 if(opt.brace!==false){const L=Math.hypot(w/nx,h*.5);const a=Math.atan2(h*.5,w/nx);for(const sz of[-1,1])k.add(box(L,T*.8,.028,4),'timber',0xffffff,x-w/2+w/nx/2,y+h*.25-T*.4,z+sz*(d/2+.006),0,0,a)}}
// tejado completo: faldones + cumbrera + hastiales del material de la pared
function roof(k,mat,w,d,h,x,y,z,ry,o,wallMat){const R=ry||0;k.add(gable(w,d,h,o??.14,1.6),mat,0xffffff,x,y,z,R);k.add(cylC(.035,.035,w+2*(o??.14),6),mat==='thatch'?'thatch':'timber',mat==='thatch'?0xc8a868:0xffffff,x,y+h-.01,z,R,0,Math.PI/2);
 if(wallMat){const c=Math.cos(R),s=Math.sin(R);for(const sx of[-1,1]){k.add(gableWall(d,h,.04),wallMat,0xffffff,x+sx*(w/2-.02)*c,y,z-sx*(w/2-.02)*s,R)}}}
function chimney(k,x,y,z,h){k.add(box(.16,h,.16,3),'stone',0xffffff,x,y,z);k.add(box(.2,.04,.2,3),'stone',0xcfc8bc,x,y+h,z)}
function base(k,w,d,h,mat,col){k.add(box(w,h||.06,d,1),mat||'stone',col??0xd8d0c4,0,0,0)}
function stairs(k,x,z,ry,n,w){for(let i=0;i<n;i++)k.add(box(.12,.05*(n-i),w||.3,3),'stone',0xffffff,x+i*.1*Math.cos(ry||0),0,z-i*.1*Math.sin(ry||0),ry||0)}
function crenel(k,w,d,y,x0,z0,step,s,mat){const n=Math.round(w/step);for(let i=0;i<=n;i++){const px=x0-w/2+i*w/n;for(const sz of[-1,1])k.add(box(s,s,s,3),mat||'stone',0xffffff,px,y,z0+sz*d/2)}const m=Math.round(d/step);for(let i=1;i<m;i++){const pz=z0-d/2+i*d/m;for(const sx of[-1,1])k.add(box(s,s,s,3),mat||'stone',0xffffff,x0+sx*w/2,y,pz)}}
A.props={barrel,crate,sack,woodpile,hay,fence,banner,torch,cart,well,win,door,framed,roof,chimney,stairs,crenel};

// ---------- edificios (tier: 0 = edad oscura (paja), 1+ = tejas)
function building(type,o,tier,dir){const k=new Kit(),ud={};const tile=tier>0?'tiles':'thatch',tileB=tier===0?'thatch':tier===1?'tiles':'slate',gw=tier===0?'planks':'plaster';rs=7+type.length*13+o;
 // paredes según la edad: 0 tablones y postes, 1 entramado con revoco, 2 zócalo de piedra alto + entramado
 const F=(k,w,h,d,x,y,z,opt)=>{if(tier===0){k.add(box(w,h,d,1.8),'planks',0xd8c0a0,x,y,z);for(const sx of[-1,1])for(const sz of[-1,1])k.add(cyl(.045,.05,h+.06,7),'bark',0xffffff,x+sx*w/2,y,z+sz*d/2);k.add(box(w+.04,.05,d+.04,3),'timber',0xffffff,x,y+h-.05,z)}
  else if(tier===1)framed(k,w,h,d,x,y,z,opt);else{const hs=Math.min(h*.45,.4);k.add(box(w+.03,hs,d+.03,1.5),'stone',0xffffff,x,y,z);framed(k,w,h-hs,d,x,y+hs,z,Object.assign({brace:true},opt))}};
 switch(type){
 case'house':{base(k,1.7,1.7,.05,'cobble',0xb0a898);k.add(box(1.3,.12,1.02,2),'stone',0xffffff,-.05,.04,-.05);F(k,1.24,.62,.96,-.05,.16,-.05);
  roof(k,tile,1.24,.96,.52,-.05,.78,-.05,0,.16,gw);chimney(k,.3,.78,-.36,.62);door(k,.575,.05,0);win(k,.575,.42,-.3);win(k,-.05,.42,.43,-Math.PI/2);win(k,-.35,.42,.43,-Math.PI/2);
  barrel(k,.72,.5);barrel(k,.72,.32,0,.85);woodpile(k,-.72,.45,Math.PI/2);k.add(box(.3,.02,.3,2),'planks',0xc0a070,.66,.02,-.55);sack(k,.66,-.5);
  fence(k,-.8,.78,.35,.78);ud.smoke=[.3,1.45,-.36];break}
 case'tc':{base(k,2.95,2.95,.08,'cobble');k.add(box(2.4,.14,2.2,2),'stone',0xffffff,-.05,.06,-.05);
  F(k,1.8,.8,1.1,-.35,.2,.38);F(k,1.8,.55,1.1,-.35,1.0,.38,{brace:false});roof(k,tile,1.8,1.1,.62,-.35,1.55,.38,0,.16,gw);
  if(tier===0){for(const sx of[-1,1])for(const sz of[-1,1])k.add(cyl(.05,.06,1.7,7),'bark',0xffffff,.62+sx*.36,.2,-.55+sz*.36);k.add(box(.9,.08,.9,2),'planks',0xffffff,.62,1.4,-.55);k.add(box(.9,.3,.9,2),'planks',0xd0b890,.62,1.48,-.55);k.add(hip(.9,.9,.6,.14),'thatch',0xffffff,.62,1.78,-.55);banner(k,o,.62,-.55,.8,2.35)}
  else{const th=tier===2?2.3:1.75;k.add(box(.9,th,.9,2),'stone',0xffffff,.62,.2,-.55);crenel(k,.9,.9,th+.2,.62,-.55,.3,.12);k.add(hip(.9,.9,tier===2?1.0:.8,.12),tileB,0xffffff,.62,th+.3,-.55);banner(k,o,.62,-.55,.9,th+1.05);if(tier===2){for(const sx of[-1,1])banner(k,o,-1.3,sx*.9,.9);torch(k,.2,.5,-.08)}}
  F(k,1.0,.62,.8,-.75,.2,-.72);roof(k,tile,1.0,.8,.46,-.75,.82,-.72,0,.14,gw);chimney(k,-1.05,.82,-.9,.5);
  k.add(box(1.2,.05,.5,2),'planks',0xd0b088,.55,.2,.9);for(const px of[.05,.55,1.05])k.add(cyl(.03,.03,.6,6),'timber',0xffffff,px,.2,1.12);k.add(gable(1.2,.5,.2,.06,2),tile,0xffffff,.55,.8,.9);
  door(k,.56,.55,0,.3,.42);win(k,.56,.62,.1);win(k,.56,.62,.7);win(k,.56,1.25,.2);win(k,.56,1.25,.6);win(k,-.35,.52,.94,-Math.PI/2);win(k,-.8,.52,.94,-Math.PI/2);if(tier>0){win(k,1.075,.9,-.55,0,.12,.2);win(k,1.075,1.45,-.55,0,.12,.2)}
  stairs(k,.8,.35,0,3,.32);well(k,1.15,-1.2);cart(k,-1.1,1.15,.4);barrel(k,1.25,1.2);barrel(k,1.05,1.3,0,.9);crate(k,-1.25,.6,0,1,.3);crate(k,-1.25,.6,.2,.9,.6);sack(k,-1.05,.7);
  banner(k,o,1.3,.55,.9);banner(k,o,1.3,-.1,.9);torch(k,1.08,.45,.3);torch(k,1.08,.45,.85);ud.smoke=[-1.05,1.45,-.9];break}
 case'store':{base(k,1.75,1.75,.05,'dirt');k.add(box(1.4,.08,.9,2),'planks',0xcaa880,0,.02,-.35);for(const [px,pz] of[[-.65,-.75],[.65,-.75],[-.65,.05],[.65,.05]])k.add(cyl(.035,.035,.62,6),'timber',0xffffff,px,.08,pz);
  k.add(box(1.36,.5,.05,2),'planks',0xffffff,0,.08,-.78);roof(k,tile,1.5,.95,.36,0,.7,-.35,0,.12);
  woodpile(k,-.35,-.4,0);woodpile(k,.1,-.4,0);k.add(box(.3,.18,.3),'stone',0xc8c0b4,.45,.1,-.45);k.add(sph(.08,6,4),'gold',0xffffff,.45,.3,-.45);k.add(sph(.07,6,4),'stone',0xaaa49a,.52,.3,-.38);
  barrel(k,.6,.5);crate(k,.3,.55);crate(k,.3,.55,.2,.8,.4);sack(k,-.05,.55);sack(k,-.25,.6,0xb89a70);cart(k,-.5,.55,1.2);k.add(cyl(.02,.02,.5,5),'planks',0x9a7a58,-.75,.1,.35,0,.3);k.add(box(.03,.09,.12),'metal',0xffffff,-.72,.58,.35);break}
 case'farm':{k.add(box(1.92,.06,1.92,1),'soil',0xffffff,0,0,0);fence(k,-.96,-.96,.96,-.96);fence(k,-.96,.96,.96,.96);fence(k,-.96,-.96,-.96,.96);fence(k,.96,-.96,.96,.35);hay(k,.75,.7,0);k.add(box(.3,.02,.2),'planks',0xffffff,-.7,.07,.75);break}
 case'barracks':{base(k,2.95,2.95,.08,'dirt',0xd0c0a0);k.add(box(2.4,.35,1.2,2),'stone',0xffffff,0,.06,-.6);F(k,2.4,.55,1.2,0,.41,-.6);roof(k,tileB,2.4,1.2,.6,0,.96,-.6,0,.16,gw);
  if(tier>0){const th=tier===2?1.9:1.5;k.add(box(.6,th,.6,2),'stone',0xffffff,1.05,.06,-1.0);crenel(k,.6,.6,th+.06,1.05,-1.0,.2,.1);k.add(hip(.6,.6,.55,.08),tileB,0xffffff,1.05,th+.14,-1.0);banner(k,o,1.05,-1.0,.7,th+.6)}else banner(k,o,1.2,-1.1,1.0);
  door(k,.1,.01,-Math.PI/2,.34,.42);win(k,-.6,.66,.005,-Math.PI/2);win(k,.7,.66,.005,-Math.PI/2);for(let i=0;i<4;i++)win(k,-.8+i*.55,.2,.005,-Math.PI/2,.08,.1);
  fence(k,-1.4,1.4,1.4,1.4,0x8a6a4a);fence(k,-1.4,.25,-1.4,1.4,0x8a6a4a);for(const px of[-.8,.1]){k.add(cyl(.03,.03,.5,6),'planks',0xffffff,px,0,.75);k.add(box(.3,.05,.05),'planks',0xffffff,px,.38,.75);k.add(sph(.08,8,6),'cloth',0xd8c090,px,.52,.75)}
  k.add(box(.7,.05,.1),'planks',0xffffff,.85,.4,.55);for(let i=0;i<5;i++){k.add(cyl(.01,.01,.62,4),'planks',0x9a7a58,.6+i*.12,0,.58,0,.12);k.add(cone(.02,.08,4),'metal',0xffffff,.6+i*.12+.04,.62,.58)}
  barrel(k,-1.2,-.1);crate(k,1.2,.2,0,1,.4);torch(k,-.3,.65,.02);break}
 case'range':{base(k,2.95,2.95,.06,'dirt',0xd8c8a0);k.add(box(2.4,.5,.9,2),'planks',0xffffff,0,.06,-.85);roof(k,tile,2.4,1.0,.45,0,.56,-.85,0,.14);for(const px of[-1.1,-.4,.4,1.1])k.add(cyl(.035,.035,.56,6),'timber',0xffffff,px,.06,-.35);
  k.add(box(2.3,.06,.12),'planks',0xc8a878,0,.35,-.35);for(let i=0;i<3;i++){const px=-.8+i*.8;k.add(cylC(.2,.2,.05,18),'cloth',[0xe8dcc0,0xc84a3a,0xe8dcc0][i],px,.36,.95,0,Math.PI/2);k.add(cylC(.12,.12,.055,18),'cloth',0xc84a3a,px,.36,.95,0,Math.PI/2);k.add(cylC(.05,.05,.06,12),'cloth',0xf0d060,px,.36,.95,0,Math.PI/2);
   k.add(cyl(.025,.025,.5,5),'planks',0xffffff,px-.12,0,1.0,0,.2);k.add(cyl(.025,.025,.5,5),'planks',0xffffff,px+.12,0,1.0,0,-.2);hay(k,px,1.25)}
  banner(k,o,-1.25,.2,1);banner(k,o,1.25,.2,1);barrel(k,.9,.2);k.add(cyl(.05,.05,.3,8),'leather',0x7a5a3a,.7,.06,.15,0,.3);break}
 case'stable':{base(k,2.95,2.95,.05,'dirt',0xd8c8a0);k.add(box(2.4,.62,1.1,2),'planks',0xffffff,0,.05,-.72);roof(k,tile==='tiles'?'tiles':'thatch',2.4,1.1,.56,0,.67,-.72,0,.18,'planks');
  for(let i=0;i<4;i++){k.add(box(.03,.5,.45,2),'window',0x303030,-.9+i*.6,.05,-.165);k.add(box(.05,.03,.5,2),'timber',0xffffff,-.9+i*.6,.36,-.16)}
  fence(k,-1.35,.1,1.35,.1);fence(k,-1.35,1.35,1.35,1.35);fence(k,-1.35,.1,-1.35,1.35);fence(k,1.35,.1,1.35,1.35);k.add(box(.7,.14,.18,2),'planks',0xffffff,-.5,.02,1.1);k.add(box(.64,.02,.12),'matte',0x3a5a6a,-.5,.15,1.1);
  hay(k,.8,.6);hay(k,1.05,.8,.3);hay(k,.9,.9,.2);banner(k,o,1.3,-1.1,1.1);break}
 case'smith':{base(k,2.95,2.95,.06,'cobble',0xa09888);k.add(box(1.8,.7,1.2,2),'stone',0xffffff,-.35,.06,-.55);roof(k,tile,1.8,1.2,.55,-.35,.76,-.55,0,.14,'stone');chimney(k,.35,.76,-.95,.95);
  k.add(box(.05,.36,.5,2),'glow',0xffffff,.555,.06,-.5);k.add(box(.06,.06,.6,2),'stone',0xffffff,.56,.42,-.5);
  for(const pz of[.35,1.1])k.add(cyl(.035,.035,.62,6),'timber',0xffffff,.9,.06,pz);k.add(box(1.0,.03,1.0),'planks',0xffffff,.45,.68,.7);k.add(gable(1.0,1.0,.25,.06,2),tile,0xffffff,.45,.7,.7,Math.PI/2);
  k.add(box(.22,.2,.14,3),'stone',0x807870,.35,.06,.65);k.add(box(.3,.08,.16),'metal',0x505458,.35,.26,.65);k.add(cyl(.12,.12,.2,10),'planks',0xffffff,.8,.06,.95);k.add(cyl(.1,.1,.03,10),'matte',0x2a3a44,.8,.26,.95);
  k.add(new TH.CylinderGeometry(.14,.14,.05,14).rotateX(Math.PI/2),'stone',0xa09888,-.6,.24,.7);k.add(box(.06,.2,.06),'planks',0xffffff,-.6,.06,.7);
  for(let i=0;i<4;i++)k.add(box(.03,.4,.04),'metal',0xc0c4c8,-1.2+i*.12,.06,.2+i*.03,0,0,.1);barrel(k,-1.1,-1.2);crate(k,1.2,-1.1);ud.smoke=[.35,1.9,-.95];break}
 case'tower':{base(k,1.5,1.5,.1,'stone');k.add(box(1.05,2.25,1.05,1.6),'stone',0xffffff,0,.1,0);k.add(box(1.25,.12,1.25,2),'stone',0xd0c8bc,0,2.3,0);crenel(k,1.25,1.25,2.42,0,0,.25,.14);
  k.add(box(1.0,.36,1.0,2),'planks',0xffffff,0,2.42,0);k.add(hip(1.05,1.05,.8,.12),tile,0xffffff,0,2.78,0);for(const [x,z,r] of[[.53,0,0],[0,.53,-Math.PI/2],[-.53,0,Math.PI],[0,-.53,Math.PI/2]]){win(k,x,1.3,z,r,.08,.24);win(k,x,.6,z,r,.06,.16)}
  door(k,.53,-.2,0,.22,.36);banner(k,o,0,0,.8,3.3);torch(k,.55,.9,.2);break}
 case'siege':{base(k,2.95,2.95,.05,'dirt',0xc8b898);for(const [px,pz] of[[-1.2,-1.2],[1.2,-1.2],[-1.2,.5],[1.2,.5],[0,-1.2],[0,.5]])k.add(cyl(.05,.06,1.25,7),'timber',0xffffff,px,.05,pz);
  roof(k,tile,2.5,1.9,.62,0,1.28,-.35,0,.16);k.add(box(2.4,.7,.06,2),'planks',0xffffff,0,.05,-1.2);
  for(let i=0;i<4;i++)k.add(cylC(.07,.07,1.7,8),'bark',0xffffff,.1,.12+i*.13,.9-i*.04,0,0,Math.PI/2);for(const [px,pz] of[[-.8,-.5],[-.3,-.6]]){const w=new TH.CylinderGeometry(.3,.3,.07,14).rotateX(Math.PI/2);k.add(w,'planks',0xffffff,px,.3,pz,0,0,.2)}
  k.add(box(.9,.3,.35,2),'planks',0xffffff,.6,.05,-.4);crate(k,1.1,1.1);barrel(k,-1.1,1.1);banner(k,o,1.25,.9,1);break}
 case'monastery':{base(k,2.95,2.95,.08,'cobble',0xb8b0a0);k.add(box(1.2,1.0,2.2,1.5),'stone',0xf0e8dc,-.5,.08,0);roof(k,tile==='tiles'?'slate':'thatch',2.2,1.2,.7,-.5,1.08,0,Math.PI/2,.12,'stone');
  k.add(box(.72,2.2,.72,1.5),'stone',0xf0e8dc,.72,.08,-.72);k.add(box(.8,.1,.8,2),'stone',0xd8d0c4,.72,2.28,-.72);k.add(hip(.72,.72,1.0,.08),tile==='tiles'?'slate':'thatch',0xffffff,.72,2.38,-.72);k.add(box(.03,.3,.04),'gold',0xffffff,.72,3.38,-.72);k.add(box(.14,.03,.04),'gold',0xffffff,.72,3.58,-.72);
  k.add(new TH.CylinderGeometry(.18,.18,.04,16).rotateZ(Math.PI/2),'window',0xffffff,-.5,.85,1.11,Math.PI/2);door(k,-.5,1.11,-Math.PI/2,.26,.42);for(let i=0;i<3;i++)win(k,-1.11,.55,-.7+i*.6,Math.PI,.08,.3);win(k,1.085,1.6,-.72,0,.1,.3);
  k.add(box(1.1,.25,.04,2),'stone',0xd8d0c4,.72,.08,.9);for(let i=0;i<4;i++)k.add(cyl(.03,.03,.5,6),'stone',0xe0d8cc,.3+i*.28,.08,.62);k.add(box(1.2,.04,.4),'tiles',0xffffff,.72,.58,.62);
  k.add(cone(.18,.5,8),'leaf',0x3e5e2e,1.15,.08,1.15);k.add(cone(.14,.4,8),'leaf',0x4a6a36,.95,.08,1.25);break}
 case'market':{base(k,2.95,2.95,.06,'cobble');F(k,1.3,.8,1.05,.55,.06,-.75);roof(k,tile,1.3,1.05,.52,.55,.86,-.75,0,.14,gw);door(k,.55,-.22,-Math.PI/2,.26,.4);win(k,1.2,.5,-.75);
  const aw=[PC[o],0xe8dcc0,0xb84a36,0x5a7a3a];
  for(let i=0;i<3;i++){const x=-1.0+i*.7,z=.45+(i%2)*.3;for(const [dx,dz] of[[-.28,-.22],[.28,-.22],[-.28,.22],[.28,.22]])k.add(cyl(.022,.022,dz<0?.62:.48,5),'timber',0xffffff,x+dx,0,z+dz);
   k.add(box(.7,.025,.56,1),'cloth',aw[i],x,.62,z,0,.26);k.add(box(.62,.2,.28,3),'planks',0xffffff,x,0,z-.05);const goods=[0xc2533d,0xe8c24c,0x6e9a3e][i];for(let q=0;q<5;q++)k.add(sph(.045,6,4),'matte',goods,x-.2+q*.1,.24,z-.05)}
  well(k,-.95,-.95);for(const [x,z] of[[1.15,.9],[1.25,.62]])barrel(k,x,z);crate(k,1.0,1.2);crate(k,.4,1.2,0,1,.5);sack(k,.2,1.25);cart(k,-.4,-1.25,0);banner(k,o,1.3,-.1,1.1);break}
 case'dock':{k.add(box(2.9,.08,2.9,1),'planks',0xffffff,0,.02,0);for(const x of[-1.35,-.45,.45,1.35])for(const z of[-1.35,-.45,.45,1.35])k.add(cyl(.06,.07,.9,7),'bark',0xffffff,x,-.8,z);
  F(k,1.0,.6,.8,-.8,.1,-.85);roof(k,tile,1.0,.8,.42,-.8,.7,-.85,0,.14,gw);door(k,-.3,-.9,0,.22,.36);
  k.add(cyl(.05,.06,1.7,7),'timber',0xffffff,.9,.1,-.8);k.add(box(1.1,.06,.06),'timber',0xffffff,.55,1.62,-.8);k.add(cyl(.008,.008,.8,4),'matte',0xcfc4a8,.05,.85,-.8);k.add(box(.2,.14,.2),'planks',0xffffff,.05,.75,-.8);
  for(const [x,z] of[[.6,.7],[.95,.4],[.3,1.0]])barrel(k,x,z,.1);k.add(cyl(.16,.16,.06,14),'matte',0xcfc4a8,-.9,.1,.8);crate(k,-.5,.9,.1);for(const [x,z] of[[1.4,1.4],[1.4,-1.4],[-1.4,1.4]])k.add(cyl(.05,.05,.3,7),'timber',0xffffff,x,.1,z);
  banner(k,o,-1.3,-1.3,1.1,.1);ud.smoke=[-.6,1.2,-.95];break}
 case'castle':{const W=3.3,wh=1.25;base(k,3.95,3.95,.2,'stone');
  for(const [x,z,w,d] of[[0,-W/2,W,.36],[0,W/2,W,.36],[-W/2,0,.36,W],[W/2,0,.36,W]])k.add(box(w,wh,d,1.4),'stone',0xffffff,x,.2,z);
  crenel(k,W,W,.2+wh,0,0,.3,.16);
  for(const sx of[-1,1])for(const sz of[-1,1]){k.add(cyl(.46,.52,1.8,14,1.4),'stone',0xffffff,sx*W/2,.2,sz*W/2);k.add(cyl(.54,.54,.14,14,2),'stone',0xd0c8bc,sx*W/2,2.0,sz*W/2);k.add(cone(.56,.8,14,1.2),tile,0xffffff,sx*W/2,2.14,sz*W/2);win(k,sx*W/2+sx*.48,1.3,sz*W/2,sx>0?0:Math.PI,.07,.22)}
  k.add(box(1.8,2.6,1.8,1.4),'stone',0xffffff,0,.2,0);crenel(k,1.9,1.9,2.9,0,0,.32,.2);k.add(hip(1.7,1.7,1.1,.1),tile,0xffffff,0,2.95,0);
  for(const [x,z,r] of[[.9,0,0],[0,.9,-Math.PI/2],[-.9,0,Math.PI],[0,-.9,Math.PI/2]]){win(k,x,1.8,z+.3*Math.cos(r),r,.09,.3);win(k,x,1.8,z-.3*Math.cos(r),r,.09,.3);win(k,x,1.1,z,r,.08,.22)}
  k.add(box(.12,.8,.7,2),'planks',0xffffff,W/2+.2,.2,0);k.add(box(.2,.3,.95,2),'stone',0xd8d0c4,W/2+.22,1.0,0);for(const sz of[-1,1])k.add(box(.4,1.5,.3,2),'stone',0xffffff,W/2+.1,.2,sz*.62);
  banner(k,o,0,0,1.2,4.05);for(const sx of[-1,1])banner(k,o,W/2+.3,sx*.62,.6,1.7);torch(k,W/2+.32,.9,.3);torch(k,W/2+.32,.9,-.3);break}
 case'wonder':{const Mt='stone';base(k,4.95,4.95,.25,'cobble');for(let i=0;i<3;i++)k.add(box(4.5-i*.4,.14,4.5-i*.4,2),Mt,0xe8e0d0,0,.25+i*.14,0);
  k.add(box(3.8,1.5,1.6,1.3),Mt,0xf0e8dc,0,.67,0);roof(k,'slate',3.8,1.6,.9,0,2.17,0,0,.1,Mt);k.add(box(1.6,1.3,3.4,1.3),Mt,0xf0e8dc,-.6,.67,0);roof(k,'slate',3.4,1.6,.9,-.6,1.97,0,Math.PI/2,.1,Mt);
  for(const sz of[-1,1]){k.add(box(.8,3.2,.8,1.3),Mt,0xf0e8dc,1.5,.67,sz*.95);k.add(cone(.52,1.5,8,1),'slate',0xffffff,1.5,3.87,sz*.95);k.add(sph(.08,8,6),'gold',0xffffff,1.5,5.4,sz*.95);crenel(k,.8,.8,3.87,1.5,sz*.95,.2,.1,Mt);
   for(const y of[1.3,2.2,3.0])win(k,1.905,y,sz*.95,0,.14,.4)}
  k.add(cyl(.62,.62,.8,16,1),Mt,0xf0e8dc,-.6,2.6,0);k.add(new TH.SphereGeometry(.64,18,10,0,Math.PI*2,0,Math.PI/2),'gold',0xffffff,-.6,3.4,0);k.add(box(.03,.4,.03),'gold',0xffffff,-.6,4.02,0);
  k.add(new TH.CylinderGeometry(.34,.34,.04,20).rotateZ(Math.PI/2),'window',0xffffff,1.905,1.55,0);door(k,1.905,0,0,.44,.72);for(let i=0;i<5;i++){win(k,-.2+i*.5-1.4,1.3,.81,-Math.PI/2,.14,.46);win(k,-.2+i*.5-1.4,1.3,-.81,Math.PI/2,.14,.46)}
  for(let i=0;i<8;i++){const a=i/8*Math.PI*2;k.add(cone(.2,.6,8),'leaf',0x3e5e2e,Math.cos(a)*2.2,.25,Math.sin(a)*2.2)}banner(k,o,2.2,1.9,1.2,.25);banner(k,o,2.2,-1.9,1.2,.25);break}
 case'palisade':{const d=dir;for(let i=0;i<4;i++){const a=-.36+i*.24;const x=d?0:a,z=d?a:0;k.add(cyl(.1,.11,.85+hash2(i,o,3)*.12,7),'bark',0xffffff,x,0,z);k.add(cone(.1,.2,7),'planks',0xc0a070,x,.9,z)}
  k.add(box(d?.06:.98,.06,d?.98:.06),'timber',0xffffff,d?.1:0,.5,d?0:.1);break}
 case'wall':{k.add(box(1,.95,1,1.2),'stone',0xffffff,0,0,0);k.add(box(1.04,.1,1.04,2),'stone',0xd8d0c4,0,.95,0);for(const [x,z] of[[-.32,-.32],[.32,-.32],[-.32,.32],[.32,.32]])k.add(box(.26,.2,.26,3),'stone',0xffffff,x,1.05,z);break}
 case'gate':{const ry=dir?Math.PI/2:0,c=Math.cos(ry),s=Math.sin(ry),at=(x,z)=>[x*c+z*s,-x*s+z*c];
  for(const sx of[-1,1]){const [x,z]=at(sx*.36,0);k.add(box(.28,1.3,1,1.2),'stone',0xffffff,x,0,z,ry)}const [x0,z0]=at(0,0);k.add(box(1,.32,1,1.2),'stone',0xffffff,x0,.98,z0,ry);k.add(box(1.04,.1,1.04,2),'stone',0xd8d0c4,x0,1.3,z0,ry);
  ud.doorGeo=true;break}
 }
 return{k,ud}}
A.building=function(type,o,tier,dir){const {k,ud}=(tier>=3&&A.eraBuilding)?A.eraBuilding(type,o,tier,dir||0):building(type,o,tier||0,dir||0);const g=k.build();
 if(ud.doorGeo){const ry=dir?Math.PI/2:0;const d=new TH.Group();d.rotation.y=ry;const dk=new Kit();dk.add(box(.44,.9,.07,3),'planks',0xffffff,0,0,0);dk.add(box(.45,.05,.08),'metal',0x3a3632,0,.3,0);dk.add(box(.45,.05,.08),'metal',0x3a3632,0,.65,0);const dm=dk.build();d.add(dm);g.add(d);ud.door=d}
 if(tier>=3&&A.eraDecor)A.eraDecor(g,ud);g.userData=Object.assign(g.userData||{},ud);return g};

// ---------- personajes (miran a +X). Cada parte es un grupo con mallas fusionadas por material y color de vértice.
const PV=[0x7ea0d6,0xd08a78,0xdcc07a,0xab90d8];
const partCache=new Map();
function partMesh(key,build){let gs=partCache.get(key);if(!gs){const k=new Kit();build(k);gs=k.geos();partCache.set(key,gs)}const g=new TH.Group();for(const m in gs){const me=new TH.Mesh(gs[m],M[m]||M.matte);me.castShadow=true;me.receiveShadow=false;g.add(me)}return g}
function pivot(x,y,z){const g=new TH.Group();g.position.set(x,y,z);return g}
const skinOf=o=>[CO.skin,0xe0b090,0xc68c64,0xd8a078][o%4];
function headKit(k0,y,o,hat,up){const hs=.84,k={add:(g,m,c,x,yy,z,ry,rx,rz,sx,sy,sz)=>k0.add(g,m,c,(x||0)*hs,y-.075+((yy||0)-y+.075)*hs,(z||0)*hs,ry,rx,rz,(sx??1)*hs,(sy??sx??1)*hs,(sz??sx??1)*hs)};const sk=skinOf(o);k.add(cyl(.028,.03,.05,8),'matte',sk,0,y-.075,0);k.add(sph(.066,12,10),'matte',sk,0,y,0,0,0,0,1,1.08,.95);k.add(sph(.014,6,4),'matte',sk,.062,y-.004,0);
 const hair=[0x3b2a1e,0x6a4a2a,0x2a2220,0x8a6a3a][o%4];
 switch(hat){
 case'straw':k.add(cyl(.12,.12,.012,14),'thatch',0xf0e0a0,0,y+.03,0);k.add(cone(.07,.08,12),'thatch',0xf0e0a0,0,y+.035,0);break;
 case'hood':k.add(sph(.078,12,8,0,Math.PI*2,0,Math.PI*.6),'cloth',0x4f6b3a,0,y+.004,0);k.add(cone(.05,.1,8),'cloth',0x4f6b3a,-.05,y+.02,0,0,0,1.9);break;
 case'hoodDark':k.add(sph(.078,12,8,0,Math.PI*2,0,Math.PI*.6),'cloth',0x2f4a2a,0,y+.004,0);break;
 case'kettle':k.add(sph(.072,12,8,0,Math.PI*2,0,Math.PI/2),'metal',CO.steel,0,y+.01,0);k.add(cyl(.115,.115,.012,14),'metal',CO.iron,0,y+.01,0);break;
 case'nasal':k.add(sph(.072,12,8,0,Math.PI*2,0,Math.PI/2),'metal',CO.steel,0,y+.008,0);k.add(cone(.04,.05,10),'metal',CO.steel,0,y+.05,0);k.add(box(.01,.07,.014),'metal',CO.steel,.07,y-.04,0);if(up)k.add(cone(.02,.12,5),'matte',0xd23b2e,0,y+.1,0);break;
 case'great':k.add(cyl(.074,.07,.13,12),'metal',CO.steel,0,y-.06,0);k.add(box(.012,.012,.1),'matte',0x151515,.072,y+.0,0);k.add(box(.014,.012,.03),'matte',0x151515,.072,y-.03,0);k.add(box(.03,.06,.012),'gold',0xffffff,.07,y-.03,0);if(up)k.add(cone(.02,.14,5),'matte',0xf0f0f0,0,y+.1,0);break;
 case'barretina':k.add(cyl(.07,.06,.05,12),'cloth',0xb03028,0,y+.02,0);k.add(cone(.05,.1,10),'cloth',0xb03028,-.03,y+.05,0,0,0,.9);k.add(sph(.062,10,6,0,Math.PI*2,Math.PI*.35,Math.PI*.4),'matte',hair,0,y-.01,0);break;
 case'cap':k.add(sph(.07,12,8,0,Math.PI*2,0,Math.PI/2),'leather',CO.leather,0,y+.008,0);break;
 case'tonsure':k.add(sph(.068,12,6,0,Math.PI*2,Math.PI*.3,Math.PI*.35),'matte',hair,0,y,0);break;
 case'conical':k.add(cone(.072,.1,12),'metal',CO.steel,0,y+.01,0);k.add(cyl(.074,.074,.014,12),'metal',CO.iron,0,y+.008,0);break;
 default:k.add(sph(.069,12,8,0,Math.PI*2,0,Math.PI*.55),'matte',hair,0,y+.004,0)}
 if(hat==='beard'||hat==='conical')k.add(sph(.04,8,6),'matte',hair,.045,y-.05,0,0,0,0,.9,1.1,1.2)}
// cuerpo humano genérico
function human(parts,o,d){const body=parts.body;const key=d.key;
 const legs=[];for(const sz of[-1,1]){const l=pivot(0,.3,sz*.055);l.add(partMesh(key+'|leg',k=>{k.add(caps(.04,.16),'cloth',d.pants,0,-.13,0);k.add(box(.1,.07,.075,2),'leather',d.boots||0x3a2a1c,.018,-.3,0)}));body.add(l);legs.push(l)}parts.legs=legs;
 const torso=partMesh(key+'|torso',k=>{d.torso(k)});body.add(torso);
 const armK=(side)=>partMesh(key+'|arm'+side,k=>{k.add(caps(.03,.15),d.sleeveMat||'cloth',d.sleeve,0,-.1,0);k.add(sph(.03,8,6),'matte',d.glove||skinOf(o),.005,-.21,0);if(d.pauldron)k.add(sph(.05,10,6,0,Math.PI*2,0,Math.PI/2),'metal',CO.steel,0,.0,0,0,0,0,1,.8,1)});
 const ar=pivot(0,.52,.125),al=pivot(0,.52,-.125);ar.add(armK('R'));al.add(armK('L'));body.add(ar,al);parts.armR=ar;parts.armL=al;return{legs,ar,al}}
function tunicTorso(k,shirt,tunic,belt,o,hat,extra){k.add(caps(.09,.12,8),'cloth',shirt,0,.44,0,0,0,0,.9,1,1.15);k.add(cyl(.1,.13,.16,12,1,true),'cloth',tunic,0,.23,0);k.add(cyl(.098,.1,.03,12),'leather',belt||CO.leather,0,.34,0);headKit(k,.64,o,hat);if(extra)extra(k)}
function tabard(k,col,y,h){k.add(box(.03,h||.22,.13,2),'cloth',col,.083,(y||.24),0);k.add(box(.03,h||.22,.13,2),'cloth',col,-.083,(y||.24),0)}
// espada con la empuñadura en el origen y la hoja hacia +Y
function sword(k,len){len=len||.34;k.add(cyl(.011,.011,.07,5),'leather',CO.leather,0,-.035,0);k.add(sph(.016,6,4),'gold',0xffffff,0,-.045,0);k.add(box(.1,.014,.02),'gold',0xffffff,0,.035,0);const bl=box(.03,len,.01,2);k.add(bl,'metal',CO.steel,0,.04,0);k.add(cone(.015,.04,4),'metal',CO.steel,0,.04+len,0,0,0,0,1,1,.35)}
function handItem(arm,key,build,rz){const m=partMesh(key,build);m.position.set(.01,-.21,0);m.rotation.z=rz??-1.35;arm.add(m);return m}
function shield(k,o,kind,x,y,z){if(kind==='kite'){const s=new TH.Shape();s.moveTo(0,.14);s.quadraticCurveTo(.1,.13,.09,0);s.lineTo(0,-.16);s.lineTo(-.09,0);s.quadraticCurveTo(-.1,.13,0,.14);const g=new TH.ExtrudeGeometry(s,{depth:.02,bevelEnabled:false});g.rotateY(-Math.PI/2);
  k.add(g,'cloth',PC[o],x,y,z+.0);k.add(box(.03,.3,.02),'matte',0xf0e8d8,x-.01,y-.16,z,0,0,0);}
 else{k.add(new TH.CylinderGeometry(.12,.12,.025,18).rotateZ(Math.PI/2),'cloth',PC[o],x,y,z);k.add(new TH.TorusGeometry(.12,.012,6,20).rotateY(Math.PI/2),'metal',CO.iron,x,y,z);k.add(sph(.03,8,6),'metal',CO.steel,x+.015,y,z)}}
// caballo (mira a +X), piernas articuladas
function horseModel(parts,key,col,drape,drapeCol,armor){const hb=new TH.Group();parts.body.add(hb);parts.horse=hb;
 hb.add(partMesh(key+'|horse',k=>{k.add(caps(.12,.3,10),'matte',col,0,.47,0,0,0,Math.PI/2,1,1,.85);k.add(sph(.12,10,8),'matte',col,.17,.49,0,0,0,0,1,1.05,.85);
  k.add(caps(.06,.16,8),'matte',col,.27,.62,0,0,0,-.75);k.add(caps(.045,.12,8),'matte',col,.37,.7,0,0,0,-2.0);k.add(sph(.035,8,6),'matte',0x2a201a,.44,.66,0);
  for(const sz of[-1,1])k.add(cone(.015,.05,5),'matte',col,.32,.79,sz*.025);k.add(box(.2,.06,.02,2),'matte',0x2a201a,.27,.7,0,0,0,-.75);k.add(cone(.04,.2,6),'matte',0x2a201a,-.22,.36,0,0,0,2.5);
  if(drape){k.add(cyl(.17,.19,.2,16,1,true),'cloth',drapeCol,.02,.32,0,0,0,Math.PI/2,1,1.2,.8);k.add(box(.3,.02,.3),'cloth',drapeCol,.02,.6,0)}
  else{k.add(box(.2,.03,.26,2),'cloth',drapeCol||0x6a3a2a,-.02,.58,0);k.add(box(.16,.04,.2,2),'leather',CO.leather,-.02,.6,0)}
  if(armor){k.add(caps(.126,.22,10),'metal',CO.iron,0,.48,0,0,0,Math.PI/2,1,1,.9);k.add(box(.08,.1,.08),'metal',CO.steel,.4,.7,0,0,0,-2.0)}}));
 const legs=[];for(const [x,z] of[[.17,.07],[.17,-.07],[-.17,.07],[-.17,-.07]]){const l=pivot(x,.42,z);l.add(partMesh(key+'|hleg',k=>{k.add(caps(.03,.26),'matte',col,0,-.15,0);k.add(cyl(.032,.034,.04,8),'matte',0x221a14,0,-.36,0)}));hb.add(l);legs.push(l)}parts.legs=legs;return hb}
function rider(parts,key,o,d){const r=pivot(-.02,.58,0);parts.body.add(r);
 r.add(partMesh(key+'|rider',k=>{k.add(caps(.085,.1,8),d.mat||'cloth',d.torso,0,.06,0,0,0,0,.9,1,1.1);if(d.tabard)k.add(cyl(.09,.12,.16,12,1,true),'cloth',PC[o],0,-.06,0);for(const sz of[-1,1])k.add(caps(.035,.12),'cloth',d.legs||0x5a4a3a,.05,-.06,sz*.1,0,0,1.3);headKit(k,.27,o,d.hat,d.up);if(d.cape)k.add(box(.02,.26,.2,2),'cloth',PC[o],-.09,-.05,0,0,0,-.1)}));
 const ar=pivot(0,.15,.115),al=pivot(0,.15,-.115);ar.add(partMesh(key+'|rarm',k=>{k.add(caps(.028,.13),d.mat||'cloth',d.torso,0,-.08,0);k.add(sph(.028,8,6),'matte',skinOf(o),0,-.17,0)}));al.add(partMesh(key+'|rarmL',k=>{k.add(caps(.028,.13),d.mat||'cloth',d.torso,0,-.08,0);k.add(sph(.028,8,6),'matte',skinOf(o),0,-.17,0)}));r.add(ar,al);parts.armR=ar;parts.armL=al;return r}
function wheel(k,r,x,y,z){k.add(new TH.TorusGeometry(r,.018,6,16).rotateY(0),'planks',0xb09070,x,y,z);k.add(new TH.CylinderGeometry(.025,.025,.06,8).rotateX(Math.PI/2),'metal',CO.iron,x,y,z);for(let i=0;i<4;i++)k.add(box(.012,r*2,.012),'planks',0xb09070,x,y-r,z,0,0,i*Math.PI/4)}
function shipModel(parts,key,type,o){const L=type==='fishship'?1.0:type==='galley'?1.7:1.5,W=type==='fishship'?.42:type==='galley'?.5:.66;
 parts.body.add(partMesh(key+'|hull',k=>{const s=new TH.Shape();s.moveTo(-L/2,-W/2*.8);s.lineTo(L/2-W*.7,-W/2);s.quadraticCurveTo(L/2,-W*.2,L/2+W*.2,0);s.quadraticCurveTo(L/2,W*.2,L/2-W*.7,W/2);s.lineTo(-L/2,W/2*.8);s.closePath();
  const hg=new TH.ExtrudeGeometry(s,{depth:.26,bevelEnabled:true,bevelThickness:.02,bevelSize:.02,bevelSegments:1});hg.rotateX(Math.PI/2);hg.translate(0,.12,0);scaleUV(hg,2.2);k.add(hg,'planks',0x9a7050,0,0,0);
  k.add(box(L*.86,.02,W*.8,2),'planks',0xd0b088,-.03,.1,0);for(const sz of[-1,1])k.add(box(L*.88,.04,.03,3),'cloth',PC[o],-.02,.1,sz*(W/2-.01));
  k.add(box(.3,.18,W*.7,2),'planks',0xc0a078,-L/2+.2,.1,0);k.add(box(.34,.03,W*.74,2),'planks',0x8a6a4a,-L/2+.2,.28,0);
  const mh=type==='fishship'?.8:1.3;k.add(cyl(.025,.03,mh,6),'timber',0xffffff,-.02,.1,0);k.add(cylC(.012,.012,type==='fishship'?.56:.95,5),'timber',0xffffff,-.02,.1+mh*.92,0,0,Math.PI/2);
  if(type==='galley'){k.add(cone(.05,.2,6),'metal',CO.iron,L/2+.18,.04,0,0,0,-Math.PI/2);for(let i=0;i<5;i++)for(const sz of[-1,1])k.add(sph(.03,6,4),'cloth',PC[o],-.4+i*.24,.2,sz*W/2)}
  if(type==='transport'){for(const [x,z] of[[.3,.12],[.45,-.1],[-.4,.14],[.1,-.15]])k.add(box(.16,.14,.16,4),'planks',0xe0c8a0,x,.12,z);barrel(k,.2,.1,.12,.7)}
  if(type==='fishship'){k.add(cyl(.012,.012,.7,4),'timber',0xffffff,.25,.12,0,0,0,-.6);barrel(k,-.15,.1,.12,.6)}
  k.add(cyl(.008,.008,.4,4),'timber',0xffffff,-L/2+.1,.3,0);k.add(box(.02,.12,.18,1),'cloth',PC[o],-L/2+.1,.58,.09)}));
 const mh=type==='fishship'?.8:1.3,sw=type==='fishship'?.5:.85;const sl=new TH.Mesh(new TH.PlaneGeometry(sw,mh*.62,6,3).translate(0,mh*.55,0),M.cloth);
 const sc=new TH.Float32BufferAttribute(new Float32Array(sl.geometry.attributes.position.count*3).fill(1),3);const pc=new TH.Color(PC[o]),wh=new TH.Color(0xf2ead8);
 for(let i=0;i<sc.count;i++){const y=sl.geometry.attributes.position.getY(i);const c=(Math.floor((y-mh*.24)/(mh*.62)*4)%2===0)?wh:pc;sc.setXYZ(i,c.r,c.g,c.b)}sl.geometry.setAttribute('color',sc);
 sl.position.set(-.02,.1,0);sl.rotation.y=Math.PI/2;sl.castShadow=true;parts.body.add(sl);parts.sail=sl;
 if(type==='galley'){parts.oars=[];for(let i=0;i<5;i++)for(const sz of[-1,1]){const oa=pivot(-.45+i*.24,.12,sz*W/2);oa.add(partMesh('oar',k=>k.add(box(.025,.025,.46,2),'planks',0xc0a078,0,-.02,.22)));oa.rotation.y=sz<0?Math.PI:0;parts.body.add(oa);parts.oars.push({o:oa,s:sz})}}
 if(type==='fishship'){const n=new TH.Mesh(new TH.IcosahedronGeometry(.1,1),new TH.MeshStandardMaterial({color:0xcfc4a8,transparent:true,opacity:.7}));n.position.set(.5,.02,0);parts.body.add(n);parts.net=n}
 parts.ship=true;parts.legs=[]}
A.unit=function(type,o,up){const g=new TH.Group(),body=new TH.Group();g.add(body);const parts={body};const key=type+'|'+o+'|'+(up?1:0),pc=PC[o];
 switch(type){
 case'villager':{human(parts,o,{key,pants:0x6a5238,sleeve:PV[o],torso:k=>tunicTorso(k,PV[o],PV[o],null,o,'straw',k=>{k.add(box(.03,.14,.1,2),'cloth',0xe8dcc0,.09,.28,0)})});
  const tools={};const mk=(name,b)=>{const t=partMesh('tool|'+name,b);t.position.set(.01,-.21,0);t.visible=false;parts.armR.add(t);tools[name]=t};
  mk('axe',k=>{k.add(cyl(.012,.012,.36,5),'planks',0x8a6a4a,0,-.05,0,0,0,-1.3);k.add(box(.03,.09,.11),'metal',CO.steel,.32,.02,0)});
  mk('pick',k=>{k.add(cyl(.012,.012,.36,5),'planks',0x8a6a4a,0,-.05,0,0,0,-1.3);k.add(box(.025,.26,.035),'metal',CO.iron,.33,.02,0,0,0,.25)});
  mk('hoe',k=>{k.add(cyl(.011,.011,.5,5),'planks',0x8a6a4a,-.08,-.06,0,0,0,-1.3);k.add(box(.09,.025,.1),'metal',CO.iron,.42,-.06,0)});
  mk('hammer',k=>{k.add(cyl(.012,.012,.26,5),'planks',0x8a6a4a,0,-.04,0,0,0,-1.3);k.add(box(.06,.06,.1),'metal',0x55585c,.24,.01,0)});
  mk('basket',k=>{k.add(cyl(.07,.05,.07,10,1,true),'thatch',0xffffff,.02,-.04,0)});
  parts.tools=tools;const bundle=new TH.Mesh(new TH.BoxGeometry(.14,.13,.12),M.matte.clone());bundle.material.vertexColors=false;bundle.position.set(-.14,.42,0);bundle.visible=false;bundle.castShadow=true;body.add(bundle);parts.bundle=bundle;break}
 case'militia':{human(parts,o,{key,pants:0x5a4a3a,sleeve:0x8a9098,sleeveMat:'metal',pauldron:up,torso:k=>{k.add(caps(.092,.12,8),'metal',0x9aa0a6,0,.44,0,0,0,0,.9,1,1.15);k.add(cyl(.1,.13,.16,12,1,true),'metal',0x8a9096,0,.23,0);tabard(k,pc,.26,.26);k.add(cyl(.1,.1,.03,12),'leather',CO.leather,0,.34,0);headKit(k,.64,o,'nasal',up)}});
  handItem(parts.armR,'sword'+(up?2:1),k=>sword(k,up?.42:.34));
  parts.armL.add(partMesh('shield|'+o+'|r',k=>shield(k,o,'round',.06,-.16,-.03)));break}
 case'spear':{human(parts,o,{key,pants:0x5a4a3a,sleeve:0xb8a07a,torso:k=>{k.add(caps(.092,.12,8),'cloth',0xc0a880,0,.44,0,0,0,0,.9,1,1.15);k.add(cyl(.1,.13,.16,12,1,true),'cloth',0xa89068,0,.23,0);tabard(k,pc,.28,.22);k.add(cyl(.1,.1,.03,12),'leather',CO.leather,0,.34,0);headKit(k,.64,o,'kettle');if(up)k.add(cone(.02,.1,5),'matte',0xd23b2e,0,.72,0)}});
  const sp=partMesh('spear'+(up?2:1),k=>{k.add(cyl(.013,.013,up?1.2:1.05,5),'planks',0x8a6a4a,0,0,0);k.add(cone(.028,.13,5),'metal',CO.steel,0,up?1.2:1.05,0)});sp.position.set(.02,-.2,0);sp.rotation.z=-.95;parts.armR.add(sp);break}
 case'archer':case'longbow':{const lb=type==='longbow';human(parts,o,{key,pants:0x4a4a36,sleeve:lb?0x3a5230:0x5a6e3e,torso:k=>tunicTorso(k,lb?0x3a5230:0x5a6e3e,pc,null,o,lb?'hoodDark':'hood',k=>{k.add(cyl(.04,.04,.3,8),'leather',CO.leather,-.11,.36,-.04,0,0,.35);for(let i=0;i<4;i++)k.add(cyl(.006,.006,.08,4),'matte',0xe8e0d0,-.16+i*.01,.54,-.04+i*.012,0,0,.35)})});
  const bow=partMesh('bow'+(lb?2:1),k=>{const br=lb?.3:.2;k.add(new TH.TorusGeometry(br,.012,5,14,Math.PI*.8).rotateZ(-Math.PI*.4),'planks',0x7a5230,.03,-.21,0);k.add(box(.004,br*1.9,.004),'matte',0xe8e0d0,.03+br*Math.cos(Math.PI*.4)*0,-.21-br*.95,0)});parts.armL.add(bow);if(lb)g.scale.setScalar(1.05);break}
 case'almogavar':{human(parts,o,{key,pants:0x6a5a44,sleeve:skinOf(o),boots:0x6a4a30,torso:k=>tunicTorso(k,0xd8c8a8,pc,null,o,'barretina',k=>{k.add(box(.02,.2,.2),'leather',CO.leather,.02,.34,0,0,0,.6)})});
  parts.armR.add(partMesh('jav',k=>{for(let i=0;i<2;i++){k.add(cyl(.011,.011,.8,4),'planks',0x8a6a4a,.02,-.2,(i-.5)*.05,0,0,-1.1);k.add(cone(.022,.09,4),'metal',CO.steel,.02+Math.sin(1.1)*.8,-.2+Math.cos(1.1)*.8,(i-.5)*.05,0,0,-1.1)}}));
  parts.armL.add(partMesh('buckler|'+o,k=>{k.add(new TH.CylinderGeometry(.08,.08,.02,14).rotateZ(Math.PI/2),'cloth',pc,.05,-.18,-.02);k.add(sph(.022,6,4),'metal',CO.steel,.062,-.18,-.02)}));break}
 case'axeman':{human(parts,o,{key,pants:0x5a4a3a,sleeve:0x8a6a48,torso:k=>tunicTorso(k,0x8a6a48,pc,null,o,'conical',k=>{k.add(box(.05,.12,.26),'matte',0x6a5040,0,.52,0)})});
  const ax=partMesh('taxe',k=>{k.add(cyl(.013,.013,.36,5),'planks',0x8a6a4a,0,-.05,0,0,0,-1.3);k.add(box(.04,.1,.13),'metal',CO.steel,.3,.03,.04)});ax.position.set(.01,-.2,0);parts.armR.add(ax);
  parts.armL.add(partMesh('taxe2',k=>{k.add(box(.03,.08,.1),'metal',CO.steel,.05,-.22,0)}));break}
 case'tknight':{human(parts,o,{key,pants:0x8a9098,boots:0x6a7078,sleeve:0x9aa0a8,sleeveMat:'metal',glove:0x8a9098,pauldron:true,torso:k=>{k.add(caps(.1,.12,8),'metal',CO.steel,0,.44,0,0,0,0,.95,1,1.2);k.add(cyl(.11,.14,.18,12,1,true),'metal',0x9aa0a8,0,.22,0);
   tabard(k,0xf0ece0,.24,.3);k.add(box(.035,.2,.03),'matte',0x151515,.1,.3,0);k.add(box(.035,.03,.1),'matte',0x151515,.1,.38,0);k.add(box(.035,.2,.03),'cloth',pc,-.1,.3,0);headKit(k,.65,o,'great',up)}});
  handItem(parts.armR,'greatsword',k=>sword(k,.6),-1.3);parts.armL.add(partMesh('shield|'+o+'|k',k=>shield(k,o,'kite',.07,-.12,-.02)));g.scale.setScalar(1.12);break}
 case'monk':{const b=parts.body;b.add(partMesh(key+'|robe',k=>{k.add(cyl(.1,.16,.56,14,1),'cloth',0x7a5a3a,0,.04,0);k.add(caps(.085,.1,8),'cloth',0x7a5a3a,0,.52,0);k.add(cyl(.1,.1,.03,12),'matte',CO.rope,0,.38,0);headKit(k,.66,o,'tonsure');
   k.add(sph(.09,10,8,0,Math.PI*2,0,Math.PI*.5),'cloth',0x6a4a2e,-.03,.58,0,0,0,-1.3);k.add(box(.02,.12,.08,2),'cloth',pc,.1,.44,0)}));
  const ar=pivot(0,.54,.13),al=pivot(0,.54,-.13);ar.add(partMesh('marm',k=>{k.add(caps(.036,.16),'cloth',0x7a5a3a,0,-.1,0);k.add(sph(.03,8,6),'matte',skinOf(o),0,-.21,0);k.add(cyl(.013,.013,.9,5),'planks',0x8a6a4a,.02,-.6,0);k.add(box(.012,.12,.012),'gold',0xffffff,.02,.28,0);k.add(box(.012,.012,.07),'gold',0xffffff,.02,.34,0)}));
  al.add(partMesh('marm2',k=>{k.add(caps(.036,.16),'cloth',0x7a5a3a,0,-.1,0);k.add(sph(.03,8,6),'matte',skinOf(o),0,-.21,0)}));b.add(ar,al);parts.armR=ar;parts.armL=al;parts.legs=[];
  const rl=partMesh('relic',k=>{k.add(box(.16,.12,.12,3),'gold',0xffffff,0,0,0)});rl.position.set(-.16,.42,0);rl.visible=false;b.add(rl);parts.relic=rl;
  const beam=new TH.Line(new TH.BufferGeometry().setFromPoints([new TH.Vector3(),new TH.Vector3(0,0,1)]),new TH.LineBasicMaterial({color:0xffe28a,transparent:true,opacity:.8}));beam.visible=false;beam.frustumCulled=false;g.add(beam);parts.beam=beam;break}
 case'scout':case'knight':case'cataphract':{const kn=type==='knight',ca=type==='cataphract';
  horseModel(parts,key,kn?0x5a3a24:ca?0x3a302a:0x9a7650,kn,pc,ca);
  const r=rider(parts,key,o,kn?{torso:CO.steel,mat:'metal',tabard:true,hat:'great',legs:0x9aa0a8,up}:ca?{torso:0xa0a6ac,mat:'metal',tabard:true,hat:'conical',legs:0x8a9098,cape:true}:{torso:pc,hat:up?'kettle':'cap',cape:true,legs:0x6a5238});
  if(kn){const l=partMesh('lance',k=>{k.add(cyl(.016,.012,1.25,5),'planks',0xd8c8a0,0,0,0);k.add(cone(.03,.12,5),'metal',CO.steel,0,1.25,0);k.add(box(.01,.1,.08),'cloth',pc,0,1.0,.05)});l.position.set(0,-.17,0);l.rotation.z=-1.25;parts.armR.add(l);parts.armL.add(partMesh('shield|'+o+'|k',k=>shield(k,o,'kite',.06,-.1,-.03)))}
  else if(ca){parts.armR.add(partMesh('mace',k=>{k.add(cyl(.013,.013,.36,5),'planks',0x6a4a30,.02,-.2,0,0,0,-1.3);k.add(sph(.05,8,6),'metal',CO.steel,.36,-.12,0)}));parts.armL.add(partMesh('shield|'+o+'|r',k=>shield(k,o,'round',.06,-.12,-.03)))}
  else{const sb=handItem(parts.armR,'sabre',k=>sword(k,.3),-1.2);sb.position.set(0,-.17,0)}
  g.scale.setScalar(kn||ca?1.08:1);break}
 case'trade':{horseModel(parts,key,0x8a6445,false,0x7a5a3a);parts.horse.position.x=.36;parts.horse.scale.setScalar(.82);
  parts.body.add(partMesh(key+'|cart',k=>{k.add(box(.62,.2,.46,3),'planks',0xd0b088,-.3,.22,0);k.add(box(.62,.02,.5,3),'planks',0x9a7a58,-.3,.22,0);for(const sz of[-1,1])k.add(box(.58,.02,.02),'planks',0x8a6a4a,.18,.34,sz*.13);
   for(let i=0;i<4;i++)k.add(new TH.TorusGeometry(.24,.012,5,10,Math.PI).rotateY(Math.PI/2),'planks',0x8a6a4a,-.55+i*.16,.42,0);k.add(new TH.CylinderGeometry(.24,.24,.62,12,1,true,0,Math.PI).rotateZ(Math.PI/2).rotateX(-Math.PI/2),'cloth',0xe8dcc0,-.3,.42,0);
   k.add(box(.64,.03,.03),'cloth',pc,-.3,.66,0);sack(k,.0,0,0xb8a070)}));
  parts.wheels=[];for(const z of[.26,-.26]){const w=pivot(-.3,.16,z);w.add(partMesh('cwheel',k=>wheel(k,.15,0,0,0)));parts.body.add(w);parts.wheels.push(w)}break}
 case'ram':{parts.body.add(partMesh(key+'|ram',k=>{k.add(box(.95,.1,.52,3),'planks',0xd0b088,0,.12,0);k.add(gable(.95,.62,.4,.06,2),'planks',0xc0a078,0,.28,0);k.add(box(.97,.04,.06),'cloth',pc,0,.52,.2);k.add(box(.97,.04,.06),'cloth',pc,0,.52,-.2);
   for(const sz of[-1,1])for(const x of[-.4,0,.4])k.add(box(.05,.26,.05),'timber',0xffffff,x,.12,sz*.24);k.add(box(.3,.2,.02,2),'leather',0x7a5a3a,-.2,.3,.3,0,-.4)}));
  parts.wheels=[];for(const [x,z] of[[.32,.29],[-.32,.29],[.32,-.29],[-.32,-.29]]){const w=pivot(x,.15,z);w.add(partMesh('rwheel',k=>wheel(k,.14,0,0,0)));parts.body.add(w);parts.wheels.push(w)}
  const log=pivot(0,.34,0);log.add(partMesh('ramlog',k=>{k.add(new TH.CylinderGeometry(.08,.08,1.15,10).rotateZ(Math.PI/2),'bark',0xffffff,.1,0,0);k.add(sph(.1,10,8),'metal',CO.iron,.68,0,0,0,0,0,1.2,1,1);k.add(cyl(.008,.008,.2,4),'matte',CO.rope,-.2,0,0);k.add(cyl(.008,.008,.2,4),'matte',CO.rope,.3,0,0)}));parts.body.add(log);parts.log=log;g.scale.setScalar(1.1);break}
 case'mangonel':{parts.body.add(partMesh(key+'|mang',k=>{k.add(box(.82,.08,.48,3),'planks',0xd0b088,0,.14,0);for(const sz of[-1,1]){k.add(box(.08,.44,.06,2),'timber',0xffffff,-.05,.2,sz*.16,0,0,.25);k.add(box(.5,.05,.05,2),'timber',0xffffff,.1,.2,sz*.2)}
   k.add(new TH.CylinderGeometry(.05,.05,.4,8).rotateX(Math.PI/2),'bark',0xffffff,-.12,.24,0);k.add(box(.12,.12,.4,2),'cloth',pc,.25,.22,0);k.add(box(.1,.06,.3),'matte',CO.rope,-.3,.2,0)}));
  parts.wheels=[];for(const [x,z] of[[.28,.27],[-.28,.27],[.28,-.27],[-.28,-.27]]){const w=pivot(x,.15,z);w.add(partMesh('rwheel',k=>wheel(k,.14,0,0,0)));parts.body.add(w);parts.wheels.push(w)}
  const arm=pivot(-.1,.52,0);arm.add(partMesh('marm3',k=>{k.add(box(.06,.72,.06,2),'timber',0xffffff,0,0,0);k.add(cyl(.09,.07,.08,10,1,true),'leather',0x6a4a30,0,.7,0);k.add(sph(.07,8,6),'stone',0xa09888,0,.78,0)}));arm.rotation.z=1.05;parts.body.add(arm);parts.arm=arm;break}
 case'fishship':case'galley':case'transport':shipModel(parts,key,type,o);break;
 default:{human(parts,o,{key,pants:0x5a4a3a,sleeve:pc,torso:k=>tunicTorso(k,pc,pc,null,o,'cap')})}}
 const ring=new TH.Mesh(new TH.RingGeometry(.3,.37,32).rotateX(-Math.PI/2),new TH.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.9,depthWrite:false}));ring.position.y=.03;ring.visible=false;ring.renderOrder=2;g.add(ring);parts.ring=ring;
 if(['knight','scout','ram','mangonel','cataphract','trade'].includes(type))ring.scale.setScalar(1.35);if(type==='fishship')ring.scale.setScalar(1.6);else if(type==='galley'||type==='transport')ring.scale.setScalar(2.1);
 g.userData.parts=parts;return g};
A.relic=function(){const k=new Kit();k.add(box(.34,.22,.24,3),'gold',0xffffff,0,0,0);k.add(box(.36,.06,.26),'cloth',0x7a2020,0,.22,0);k.add(box(.04,.2,.04),'gold',0xffffff,0,.28,0);k.add(box(.14,.04,.04),'gold',0xffffff,0,.34,0);const g=k.build();
 const glow=new TH.Mesh(new TH.RingGeometry(.2,.42,24).rotateX(-Math.PI/2),new TH.MeshBasicMaterial({color:0xffe28a,transparent:true,opacity:.35,depthWrite:false,blending:TH.AdditiveBlending}));glow.position.y=.03;g.add(glow);g.userData.glow=glow;return g};

// ---------- vegetación
function leafTex(){rs=111;const W=256,c=canvas(W),x=c.getContext('2d');x.fillStyle='#4a6a2c';x.fillRect(0,0,W,W);
 for(let i=0;i<2600;i++){const px=rnd()*W,py=rnd()*W,r=3+rnd()*6,l=rnd();x.fillStyle=l<.33?`rgba(28,48,18,${.5+rnd()*.3})`:l<.8?`rgba(${86+rnd()*40|0},${120+rnd()*40|0},${48+rnd()*20|0},${.6+rnd()*.3})`:`rgba(${150+rnd()*40|0},${170+rnd()*30|0},${80+rnd()*30|0},.7)`;
  wrapDraw(x,W,W,px,py,10,(X,Y)=>{x.beginPath();x.ellipse(X,Y,r,r*.6,rnd()*3,0,7);x.fill()})}return c}
function needleTex(){rs=113;const W=128,c=canvas(W),x=c.getContext('2d');x.fillStyle='#24422a';x.fillRect(0,0,W,W);for(let i=0;i<2400;i++){const px=rnd()*W,py=rnd()*W,a=Math.PI/2+(rnd()-.5)*1.2,l=4+rnd()*6;x.strokeStyle=rnd()<.5?'rgba(16,30,18,.7)':`rgba(${60+rnd()*40|0},${100+rnd()*40|0},${60+rnd()*20|0},.7)`;x.lineWidth=1;
  wrapDraw(x,W,W,px,py,10,(X,Y)=>{x.beginPath();x.moveTo(X,Y);x.lineTo(X+Math.cos(a)*l,Y+Math.sin(a)*l);x.stroke()})}return c}
const timeU={value:0};A.timeU=timeU;
function windify(m,amp){const prev=m.onBeforeCompile;m.onBeforeCompile=sh=>{prev&&prev(sh);sh.uniforms.uTime=timeU;
 sh.vertexShader='uniform float uTime;\n'+sh.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
#ifdef USE_INSTANCING
 vec3 ip=instanceMatrix[3].xyz;float hh=max(transformed.y-.35,0.);
 transformed.x+=sin(uTime*1.4+ip.x*.61+ip.z*.37)*${amp}*hh+sin(uTime*3.1+ip.z)*${amp*.3}*hh;
 transformed.z+=cos(uTime*1.17+ip.x*.43+ip.z*.71)*${amp}*hh;
#endif`)};m.customProgramCacheKey=()=>'wind'+amp;return m}
function jitter(g,a,seed){const p=g.attributes.position;const map=new Map();for(let i=0;i<p.count;i++){const key=Math.round(p.getX(i)*1e3)+','+Math.round(p.getY(i)*1e3)+','+Math.round(p.getZ(i)*1e3);let d=map.get(key);if(!d){d=[(hash2(i,1,seed)-.5)*a,(hash2(i,2,seed)-.5)*a,(hash2(i,3,seed)-.5)*a];map.set(key,d)}p.setXYZ(i,p.getX(i)+d[0],p.getY(i)+d[1],p.getZ(i)+d[2])}g.computeVertexNormals();return g}
// tinte por altura dentro de la copa: más oscuro abajo y dentro, más claro arriba
function crownShade(g,y0,y1){const p=g.attributes.position,c=g.attributes.color;for(let i=0;i<p.count;i++){const t=Math.min(1,Math.max(0,(p.getY(i)-y0)/(y1-y0)));const f=.55+.6*t;c.setXYZ(i,c.getX(i)*f,c.getY(i)*f,c.getZ(i)*f)}return g}
A.trees=function(){const out={};
 const oak=seed=>{rs=seed;const t=new Kit(),c=new Kit();const h=.55+rnd()*.25;t.add(cyl(.05,.085,h,7,2),'bark',0xffffff,0,0,0);for(let i=0;i<3;i++){const a=i*2.1+rnd();t.add(cyl(.02,.035,.28,5,2),'bark',0xffffff,Math.cos(a)*.06,h*.7,Math.sin(a)*.06,a,0,.7)}
  for(let i=0;i<3;i++){const a=rnd()*6;t.add(cone(.05,.12,5),'bark',0xffffff,Math.cos(a)*.07,-.02,Math.sin(a)*.07,0,0,0,1,.4,1)}
  const n=5+Math.floor(rnd()*2);for(let i=0;i<n;i++){const a=i/n*Math.PI*2+rnd(),r=i===0?0:.18+rnd()*.12,y=h+.2+(i===0?.25:rnd()*.22),sz=.24+rnd()*.12;const g=jitter(new TH.IcosahedronGeometry(sz,1),.05,seed+i);c.add(g,'leaf',new TH.Color().setHSL(.24+rnd()*.06,.45+rnd()*.15,.36+rnd()*.12).getHex(),Math.cos(a)*r,y,Math.sin(a)*r)}
  const cg=c.geos().leaf;crownShade(cg,h,h+.85);return{trunk:t.geos().bark,crown:cg}};
 const pine=seed=>{rs=seed;const t=new Kit(),c=new Kit();const h=.3;t.add(cyl(.04,.07,h+.3,7,2),'bark',0xffffff,0,0,0);const tiers=4+Math.floor(rnd()*2);
  for(let i=0;i<tiers;i++){const k=i/(tiers-1),r=.42-.28*k,y=h+i*.26;const g=jitter(new TH.ConeGeometry(r,.48,9,2),.035,seed+i);g.translate(0,.24,0);c.add(g,'needle',new TH.Color().setHSL(.34+rnd()*.04,.35,.26+rnd()*.06+k*.05).getHex(),0,y,0,rnd()*6)}
  const cg=c.geos().needle;crownShade(cg,h,h+tiers*.26+.4);return{trunk:t.geos().bark,crown:cg}};
 out.oak=[oak(3),oak(8),oak(13)];out.pine=[pine(4),pine(9)];
 const bush=seed=>{rs=seed;const c=new Kit();for(let i=0;i<4;i++){const a=rnd()*6,r=rnd()*.12;c.add(jitter(new TH.IcosahedronGeometry(.13+rnd()*.07,1),.03,seed+i),'leaf',new TH.Color().setHSL(.25+rnd()*.05,.45,.3+rnd()*.1).getHex(),Math.cos(a)*r,.08+rnd()*.06,Math.sin(a)*r)}const g=c.geos().leaf;crownShade(g,0,.3);return g};
 out.bush=[bush(21),bush(22)];
 const tuft=()=>{const c=new Kit();for(let i=0;i<5;i++){const a=i/5*6.28;c.add(new TH.ConeGeometry(.018,.2,3).translate(0,.1,0),'matte',new TH.Color().setHSL(.23,.5,.32+i*.02).getHex(),Math.cos(a)*.025,0,Math.sin(a)*.025,0,Math.cos(a)*.35,Math.sin(a)*.35)}return c.geos().matte};
 out.tuft=tuft();
 const rock=seed=>{rs=seed;const g=jitter(new TH.IcosahedronGeometry(.12,1),.06,seed);g.scale(1,.6,1);const k=new Kit();k.add(g,'stone',0xd0ccc4,0,.03,0);return k.geos().stone};out.rock=[rock(31),rock(32)];
 return out};
A.initVeg=function(){M.leaf=windify(std({map:tex(leafTex()),roughness:.85}),.035);M.needle=windify(std({map:tex(needleTex()),roughness:.9}),.02);M.grassBlade=windify(std({roughness:.9}),.08);
 for(const k of['leaf','needle']){M[k].map.repeat.set(2,2)}};
A._={canvas,field,tex,fbm,hash2,vnoise,mixc,cl,wrapDraw,std:o=>std(o),seed:v=>{rs=v},rnd,scaleUV,box,cyl,cylC,cone,sph,caps,gable,gableWall,hip,Kit,merge,groundAO,M,PC,PCD,CO,props:A.props,get fogify(){return fogify}};
root.ImperiaArt=A;
})(window);
