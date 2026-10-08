// Imperia — arquitectura de las edades IV a IX (Imperial → Futuro 2100). Amplía ImperiaArt.
// Cada edad tiene sus materiales (ladrillo y mármol, hierro y cinc, hormigón, paneles, vidrio, polímero)
// y un diseño propio para centro urbano, torre, castillo y maravilla. Modelos mirando a +X.
(function(root){
'use strict';
const A=root.ImperiaArt,TH=root.THREE;if(!A)return;
const {canvas,field,tex,fbm,hash2,mixc,cl,wrapDraw,std,seed,rnd,box,cyl,cylC,cone,sph,caps,gable,gableWall,hip,Kit,M,PC,PCD,CO}=A._;
const {barrel,crate,sack,banner,torch,crenel,door}=A.props;

// ---------- texturas
const W=256;
function brickTex(){seed(201);const c=canvas(W),x=c.getContext('2d');x.fillStyle='#b8ada0';x.fillRect(0,0,W,W);const rows=12,bh=W/rows;
 for(let r=0;r<rows;r++){const off=(r%2)*bh*1.1;for(let X=-off;X<W;X+=bh*2.2){const v=rnd(),b=[150+v*40,70+v*26,52+v*18];const g=x.createLinearGradient(0,r*bh,0,r*bh+bh);
   g.addColorStop(0,`rgb(${b[0]+12|0},${b[1]+8|0},${b[2]+6|0})`);g.addColorStop(1,`rgb(${b[0]*.8|0},${b[1]*.8|0},${b[2]*.8|0})`);x.fillStyle=g;x.fillRect(X+1.5,r*bh+1.5,bh*2.2-3,bh-3);if(X+bh*2.2>W)x.fillRect(X-W+1.5,r*bh+1.5,bh*2.2-3,bh-3)}}
 const d=x.getImageData(0,0,W,W);for(let i=0;i<W*W;i++){const n=(fbm((i%W)/7,((i/W)|0)/7,207,3,36.57)-.5)*38;d.data[i*4]+=n;d.data[i*4+1]+=n*.8;d.data[i*4+2]+=n*.7}x.putImageData(d,0,0);return c}
function marbleTex(){return field(W,W,(i,j)=>{const n=fbm(i/40,j/40,211,4,6.4),v=Math.abs(Math.sin((i*.02+j*.035+fbm(i/60,j/60,212,4,4.27)*5)*3));const k=v<.06?.72:1;const b=mixc([226,222,212],[246,243,236],n);return[cl(b[0]*k),cl(b[1]*k),cl(b[2]*k)]})}
function corrTex(rust){seed(rust?221:222);return field(W,W,(i,j)=>{const r=Math.sin(i/W*Math.PI*2*16)*.5+.5,n=fbm(i/30,j/30,223,3,8.53),ru=rust?Math.max(0,fbm(i/50,j/50,224,4,5.12)-.55)*2.2:0;
  const b=mixc(rust?[132,138,140]:[150,160,168],[96,62,40],ru);const k=.72+r*.36+(n-.5)*.14;return[cl(b[0]*k),cl(b[1]*k),cl(b[2]*k)]})}
function concreteTex(){seed(231);const c=field(W,W,(i,j)=>{const n=fbm(i/26,j/26,232,4,9.85),m=fbm(i/4,j/4,233,2,64);const v=136+n*40+(m-.5)*18;return[cl(v),cl(v-2),cl(v-6)]});const x=c.getContext('2d');
 x.strokeStyle='rgba(60,58,54,.55)';x.lineWidth=1.2;for(const p of[0,128]){x.beginPath();x.moveTo(p,0);x.lineTo(p,W);x.stroke();x.beginPath();x.moveTo(0,p);x.lineTo(W,p);x.stroke()}
 x.fillStyle='rgba(50,48,44,.6)';for(const px of[32,96,160,224])for(const py of[32,96,160,224]){x.beginPath();x.arc(px,py,2,0,7);x.fill()}
 for(let i=0;i<40;i++){x.fillStyle=`rgba(80,70,60,${.05+rnd()*.08})`;const px=rnd()*W;x.fillRect(px,rnd()*W,2+rnd()*3,20+rnd()*60)}return c}
function glassTex(em){seed(em?241:242);const c=canvas(W),x=c.getContext('2d');const n=4,p=W/n;
 for(let r=0;r<n;r++)for(let q=0;q<n;q++){if(em){const lit=rnd();x.fillStyle=lit<.45?`rgb(${255},${200+rnd()*40|0},${130+rnd()*60|0})`:lit<.6?'rgb(170,215,255)':'#000';x.fillRect(q*p+3,r*p+3,p-6,p-6);continue}
  const g=x.createLinearGradient(q*p,r*p,q*p+p,r*p+p);const v=rnd()*20;g.addColorStop(0,`rgb(${60+v|0},${96+v|0},${118+v|0})`);g.addColorStop(.5,`rgb(${120+v|0},${160+v|0},${178+v|0})`);g.addColorStop(1,`rgb(${40+v|0},${66+v|0},${84+v|0})`);x.fillStyle=g;x.fillRect(q*p,r*p,p,p)}
 if(!em){x.fillStyle='#c8ccd0';for(let i=0;i<=n;i++){x.fillRect(i*p-2,0,4,W);x.fillRect(0,i*p-2,W,4)}}return c}
function panelTex(){seed(251);const c=field(W,W,(i,j)=>{const n=fbm(i/50,j/50,252,3,5.12);const v=182+n*28;return[cl(v),cl(v+2),cl(v+6)]});const x=c.getContext('2d');
 x.strokeStyle='rgba(40,44,50,.7)';x.lineWidth=1.5;for(let i=0;i<=2;i++){x.beginPath();x.moveTo(i*128,0);x.lineTo(i*128,W);x.stroke()}for(let i=0;i<=4;i++){x.beginPath();x.moveTo(0,i*64);x.lineTo(W,i*64);x.stroke()}
 x.fillStyle='rgba(60,64,70,.8)';for(let i=0;i<2;i++)for(let j=0;j<4;j++)for(const [dx,dy] of[[6,6],[122,6],[6,58],[122,58]]){x.beginPath();x.arc(i*128+dx,j*64+dy,1.6,0,7);x.fill()}return c}
function polyTex(){return field(W,W,(i,j)=>{const n=fbm(i/60,j/60,261,3,4.27);const s=Math.abs(Math.sin((j/W)*Math.PI*6+Math.sin(i/W*Math.PI*2)*.6))<.02?.9:1;const v=(232+n*14)*s;return[cl(v),cl(v+2),cl(v+4)]})}
function camoTex(){seed(271);const c=canvas(W),x=c.getContext('2d');x.fillStyle='#6b6a44';x.fillRect(0,0,W,W);const cols=['#4a5230','#8a7a52','#3a3a28','#76784a'];
 for(let i=0;i<110;i++){x.fillStyle=cols[i%4];const px=rnd()*W,py=rnd()*W,r=10+rnd()*22;wrapDraw(x,W,W,px,py,r*1.6,(X,Y)=>{x.beginPath();for(let a=0;a<7;a++){const rr=r*(.6+rnd()*.6),aa=a/7*Math.PI*2;x.lineTo(X+Math.cos(aa)*rr,Y+Math.sin(aa)*rr*.8)}x.closePath();x.fill()})}return c}
function asphaltTex(){seed(281);const c=field(W,W,(i,j)=>{const n=fbm(i/20,j/20,282,3,12.8),g=hash2(i,j,283);const v=62+n*22+(g-.5)*26;return[cl(v),cl(v),cl(v+3)]});const x=c.getContext('2d');
 x.strokeStyle='rgba(20,20,20,.5)';for(let i=0;i<14;i++){const px=rnd()*W,py=rnd()*W;wrapDraw(x,W,W,px,py,40,(X,Y)=>{x.beginPath();x.moveTo(X,Y);let a=rnd()*6;for(let k=0;k<6;k++){a+=rnd()-.5;X+=Math.cos(a)*6;Y+=Math.sin(a)*6;x.lineTo(X,Y)}x.stroke()})}return c}
function techTex(){seed(291);const c=field(W,W,(i,j)=>{const n=fbm(i/30,j/30,292,2,8.53);const v=70+n*16;return[cl(v),cl(v+4),cl(v+10)]});const x=c.getContext('2d');
 x.strokeStyle='rgba(20,24,30,.9)';x.lineWidth=2;for(let i=0;i<=4;i++){x.beginPath();x.moveTo(i*64,0);x.lineTo(i*64,W);x.stroke();x.beginPath();x.moveTo(0,i*64);x.lineTo(W,i*64);x.stroke()}
 x.strokeStyle='rgba(90,230,255,.95)';x.lineWidth=1.4;x.beginPath();x.moveTo(0,128);x.lineTo(W,128);x.stroke();x.beginPath();x.moveTo(128,0);x.lineTo(128,W);x.stroke();return c}
function solarTex(){const c=canvas(128),x=c.getContext('2d');x.fillStyle='#1b2a4a';x.fillRect(0,0,128,128);x.strokeStyle='#8fa2c0';x.lineWidth=1;for(let i=0;i<=8;i++){x.beginPath();x.moveTo(i*16,0);x.lineTo(i*16,128);x.stroke();x.beginPath();x.moveTo(0,i*16);x.lineTo(128,i*16);x.stroke()}return c}

A.nightMats=A.nightMats||[];
A.initEras=function(){const t0=performance.now();
 const T={brick:tex(brickTex()),marble:tex(marbleTex()),zinc:tex(corrTex(false)),rust:tex(corrTex(true)),concrete:tex(concreteTex()),glass:tex(glassTex(false)),glassEm:tex(glassTex(true)),
  panel:tex(panelTex()),poly:tex(polyTex()),camo:tex(camoTex()),asphalt:tex(asphaltTex()),tech:tex(techTex()),solar:tex(solarTex())};A.TE=T;
 const bump=(t,s)=>({map:t,bumpMap:t,bumpScale:s});
 M.brick=std(Object.assign(bump(T.brick,.025),{roughness:.9}));M.marble=std({map:T.marble,roughness:.35});M.zinc=std(Object.assign(bump(T.zinc,.03),{roughness:.45,metalness:.55}));M.rust=std(Object.assign(bump(T.rust,.03),{roughness:.7,metalness:.35}));
 M.concrete=std(Object.assign(bump(T.concrete,.02),{roughness:.95}));M.panel=std({map:T.panel,roughness:.35,metalness:.55});M.poly=std({map:T.poly,roughness:.28,metalness:.05});
 M.camo=std({map:T.camo,roughness:1,side:TH.DoubleSide});M.asphalt=std({map:T.asphalt,roughness:.95});M.tech=std({map:T.tech,roughness:.5,metalness:.3});M.solar=std({map:T.solar,roughness:.25,metalness:.6});
 M.glass=std({map:T.glass,roughness:.12,metalness:.6,emissive:0xffffff,emissiveMap:T.glassEm,emissiveIntensity:.05});A.nightMats.push([M.glass,.05,.9]);
 M.steel=std({roughness:.42,metalness:.45});M.rubber=std({roughness:.95,color:0x222222});
 const fog=A._.fogify;
 M.neon=fog(new TH.MeshBasicMaterial({vertexColors:true,toneMapped:false}));
 M.holo=new TH.MeshBasicMaterial({vertexColors:true,transparent:true,opacity:.42,blending:TH.AdditiveBlending,depthWrite:false,side:TH.DoubleSide,toneMapped:false});
 M.holoWire=new TH.MeshBasicMaterial({color:0x5fe6ff,wireframe:true,transparent:true,opacity:.55,depthWrite:false,toneMapped:false});
 M.green=std({map:M.leaf&&M.leaf.map,roughness:.9});
 A.msEras=performance.now()-t0};

// ---------- estilo por edad
const NEON=[0,0,0,0,0,0,0xff8a3a,0x46d8ff,0x8affd0];
function sty(t){return{
 wall:['','','','brick','brick','concrete','concrete','glass','poly'][t],trim:['','','','marble','steel','concrete','panel','panel','poly'][t],
 base:['','','','cobble','cobble','asphalt','concrete','asphalt','tech'][t],roof:['','','','slate','zinc','concrete','concrete','panel','poly'][t],neon:NEON[t]}}

// ventana con marco de la edad
function winE(k,t,x,y,z,ry,w,h){w=w||.12;h=h||.2;const f=t===3?'marble':t===4?'steel':t>=7?'panel':'concrete';
 k.add(box(.03,h,w),'window',0xffffff,x,y,z,ry);
 if(t===3){k.add(box(.045,.03,w+.05,3),'marble',0xffffff,x,y+h,z,ry);k.add(box(.045,.03,w+.04,3),'marble',0xffffff,x,y-.03,z,ry)}
 else if(t===4){k.add(box(.04,h,.012),'steel',0x303438,x,y,z,ry);k.add(box(.04,.012,w),'steel',0x303438,x,y+h*.55,z,ry);k.add(box(.045,.025,w+.03),'brick',0xb08878,x,y+h,z,ry)}
 else k.add(box(.04,.02,w+.02,3),f,0xffffff,x,y-.02,z,ry)}
function neonRect(k,w,d,x,y,z,col,th){th=th||.022;for(const sz of[-1,1])k.add(box(w,th,th),'neon',col,x,y,z+sz*(d/2-th/2));for(const sx of[-1,1])k.add(box(th,th,d-2*th),'neon',col,x+sx*(w/2-th/2),y,z)}
// fachadas: reparte ventanas en las 4 caras de un bloque
function facade(k,t,w,h,d,x,y,z,opt){opt=opt||{};const fl=opt.floor||.46,nF=Math.max(1,Math.floor((h-.08)/fl)),ww=t===5?.2:t===6?.9:.12,wh=t===5?.06:t===6?.13:t===4?.24:.2;
 const faces=[[x+w/2+.001,z,0,d],[x-w/2-.001,z,Math.PI,d],[x,z+d/2+.001,-Math.PI/2,w],[x,z-d/2-.001,Math.PI/2,w]];
 for(let f=0;f<faces.length;f++){const [fx,fz,ry,len]=faces[f];if(opt.skip&&opt.skip.includes(f))continue;
  if(t===6){for(let i=0;i<nF;i++){const yy=y+.14+i*fl;k.add(box(.03,wh,len*.86),'window',0xffffff,fx,yy,fz,ry)}continue}
  const n=Math.max(1,Math.floor(len/(t===5?.5:.32)));for(let i=0;i<nF;i++)for(let j=0;j<n;j++){const u=-len/2+(j+.5)*len/n;if(opt.door&&f===0&&i===0&&Math.abs(u)<.2)continue;
   winE(k,t,ry===0||ry===Math.PI?fx:x+u,y+.12+i*fl,ry===0||ry===Math.PI?fz+u:fz,ry,ww,wh)}}}
// bloque con carácter de la edad (x,z centro; y base)
function block(k,t,w,h,d,x,y,z,opt){opt=opt||{};const s=sty(t),col=opt.col??0xffffff;
 if(t===3){k.add(box(w,h,d,1.1),'brick',col,x,y,z);k.add(box(w+.04,.08,d+.04,2),'marble',0xffffff,x,y,z);k.add(box(w+.08,.06,d+.08,2),'marble',0xffffff,x,y+h-.02,z);
  for(const sx of[-1,1])for(const sz of[-1,1])k.add(box(.07,h,.07,4),'marble',0xffffff,x+sx*(w/2-.02),y,z+sz*(d/2-.02))}
 else if(t===4){k.add(box(w,h,d,1.1),'brick',opt.col??0xc8b0a8,x,y,z);k.add(box(w+.03,.04,d+.03,3),'brick',0x8a6a60,x,y+h*.5,z);k.add(box(w+.05,.07,d+.05,3),'brick',0x7a5a50,x,y+h-.03,z)}
 else if(t===5){k.add(box(w,h,d,1),'concrete',opt.col??0xd0cabc,x,y,z);k.add(box(w+.04,.05,d+.04,2),'concrete',0xb0aa9c,x,y+h,z)}
 else if(t===6){k.add(box(w,h,d,.9),'concrete',opt.col??0xe0dcd4,x,y,z);k.add(box(w+.16,.07,d+.16,2),'concrete',0xc8c4bc,x,y+h,z);
  if(opt.neon!==false)neonRect(k,w+.17,d+.17,x,y+h+.03,z,s.neon)}
 else if(t===7){k.add(box(w,h,d,1.6),'glass',0xffffff,x,y,z);for(const sx of[-1,1])for(const sz of[-1,1])k.add(box(.05,h,.05,4),'panel',0xffffff,x+sx*w/2,y,z+sz*d/2);
  k.add(box(w+.04,.06,d+.04,2),'panel',0xffffff,x,y+h,z);k.add(box(w+.03,.12,d+.03,2),'panel',0xd8dce0,x,y,z);if(opt.neon!==false){neonRect(k,w+.05,d+.05,x,y+h+.065,z,s.neon);k.add(box(w+.035,.012,d+.035),'neon',s.neon,x,y+.125,z)}}
 else{const r=Math.min(.14,w*.2,d*.2);k.add(box(w-2*r,h,d,1),'poly',col,x,y,z);k.add(box(w,h,d-2*r,1),'poly',col,x,y,z);for(const sx of[-1,1])for(const sz of[-1,1])k.add(cyl(r,r,h,12),'poly',col,x+sx*(w/2-r),y,z+sz*(d/2-r));
  k.add(box(w-.02,.1,d-.02),'green',0x5e8a3e,x,y+h,z);if(opt.neon!==false){k.add(box(w+.012,.02,d-2*r+.012),'neon',s.neon,x,y+h*.55,z);k.add(box(w-2*r+.012,.02,d+.012),'neon',s.neon,x,y+h*.55,z)}}
 if(opt.win!==false&&t!==7&&t!==8)facade(k,t,w,h,d,x,y,z,opt);
 if(t===8&&opt.win!==false){for(let i=0;i<Math.floor(h/.5);i++)k.add(box(w*.5,.08,.02),'window',0xffffff,x,y+.25+i*.5,z+d/2+.005,0);}}
// cubiertas
function roofE(k,t,w,d,x,y,z,opt){opt=opt||{};
 if(t===3){k.add(hip(w,d,Math.min(w,d)*.42,.1),'slate',0xffffff,x,y+.06,z);if(opt.dormers)for(const sz of[-1,1]){k.add(box(.2,.16,.12),'marble',0xffffff,x,y+.08,z+sz*(d/2-.12));k.add(hip(.2,.12,.08,.03),'slate',0xffffff,x,y+.24,z+sz*(d/2-.12))}}
 else if(t===4){k.add(gable(w,d,Math.min(.5,d*.4),.1,2),'zinc',0xffffff,x,y+.06,z,opt.ry||0);if(opt.sky)k.add(box(w*.6,.03,.14,2),'glass',0xffffff,x,y+.2,z+d*.22,0,.5)}
 else if(t===5){k.add(box(w,.05,d,1),'concrete',0xbab4a6,x,y+.05,z);for(const [a,b,c2,e2] of[[w,.08,0,d/2],[w,.08,0,-d/2],[.08,d,w/2,0],[.08,d,-w/2,0]])k.add(box(a,.1,b,2),'concrete',0xc8c2b4,x+c2,y+.05,z+e2);
  if(opt.net){const g=new TH.PlaneGeometry(w*.9,d*.9,6,6);const p=g.attributes.position;for(let i=0;i<p.count;i++)p.setZ(i,Math.sin(p.getX(i)*9)*.03+Math.cos(p.getY(i)*7)*.03);g.rotateX(-Math.PI/2);k.add(g,'camo',0xffffff,x,y+.3,z)}}
 else if(t===6){for(let i=0;i<2;i++)k.add(box(.2,.12,.16,3),'panel',0xffffff,x-w*.25+i*.3,y+.07,z-d*.2);k.add(cyl(.012,.012,.6,5),'steel',0xffffff,x+w*.3,y+.07,z+d*.25);k.add(sph(.02,6,4),'neon',0xff3030,x+w*.3,y+.68,z+d*.25)}
 else if(t===7){const n=Math.max(1,Math.floor(w/.4));for(let i=0;i<n;i++)k.add(box(.32,.02,Math.min(.5,d*.5),2),'solar',0xffffff,x-w/2+.2+i*w/n,y+.12,z,0,0,-.35);k.add(box(.24,.14,.18,3),'panel',0xffffff,x+w*.3,y+.07,z-d*.3)}
 else if(t===8){for(let i=0;i<3;i++)k.add(cone(.07,.18+i*.04,7),'green',0x4a7a38,x-w*.3+i*w*.3,y+.1,z+(i%2?.1:-.12));k.add(sph(.08,8,6),'green',0x5a8a44,x+w*.2,y+.14,z+d*.2)}}
// suelo pavimentado según la edad
function pad(k,t,w,d,h){const s=sty(t);k.add(box(w,h||.05,d,1),s.base,t===8?0xe8ecf0:0xffffff,0,0,0);if(t>=7)k.add(box(w+.01,.012,.03),'neon',NEON[t],0,(h||.05),d/2-.02)}
// atrezo por edad
function drum(k,x,z,col,y){k.add(cyl(.07,.07,.2,10),'steel',col,x,y||0,z);k.add(cyl(.073,.073,.02,10),'steel',0x333333,x,(y||0)+.07,z)}
function sandbags(k,x0,z0,x1,z1,rows){const L=Math.hypot(x1-x0,z1-z0),n=Math.max(1,Math.round(L/.13)),a=Math.atan2(z1-z0,x1-x0);
 for(let r=0;r<(rows||2);r++)for(let i=0;i<n;i++){const tt=(i+(r%2)*.5)/n;if(tt>1)continue;k.add(caps(.035,.08,6),'cloth',0xb8a47a,x0+(x1-x0)*tt,.035+r*.06,z0+(z1-z0)*tt,-a,0,Math.PI/2)}}
function wire(k,x0,z0,x1,z1){const L=Math.hypot(x1-x0,z1-z0),a=Math.atan2(z1-z0,x1-x0),n=Math.max(2,Math.round(L/.4));for(let i=0;i<=n;i++){const tt=i/n;k.add(cyl(.012,.012,.3,4),'steel',0x5a5048,x0+(x1-x0)*tt,0,z0+(z1-z0)*tt)}
 for(const y of[.1,.18,.26])k.add(box(L,.008,.008),'steel',0x7a7068,(x0+x1)/2,y,(z0+z1)/2,-a);const g=new TH.TorusGeometry(.07,.006,4,10);for(let i=0;i<n*2;i++){const tt=(i+.5)/(n*2);k.add(g,'steel',0x8a8078,x0+(x1-x0)*tt,.3,z0+(z1-z0)*tt,-a+Math.PI/2)}}
function container(k,x,z,ry,col,y){k.add(box(.6,.26,.25,3),'zinc',col,x,y||0,z,ry)}
function lamp(k,t,x,z){if(t<=4){k.add(cyl(.012,.018,.5,6),'steel',0x2a2a2a,x,0,z);k.add(box(.05,.07,.05),'glow',0xffffff,x,.5,z)}else{k.add(cyl(.012,.012,.55,6),'steel',0x9aa0a8,x,0,z);k.add(box(.12,.015,.03),t>=7?'neon':'glow',t>=7?NEON[t]:0xffffff,x+.05,.55,z)}}
function flag(k,o,x,z,h,y){k.add(cyl(.012,.014,h,6),'steel',0xd0d4d8,x,y||0,z);k.add(box(.01,.18,.28,1),'cloth',PC[o],x+.006,(y||0)+h-.2,z+.14)}
function planter(k,x,z){k.add(cyl(.12,.1,.1,12),'poly',0xffffff,x,0,z);k.add(sph(.11,8,6),'green',0x4f8a3a,x,.14,z)}
function dish(k,x,y,z,r,ry){const g=new TH.SphereGeometry(r,14,6,0,Math.PI*2,0,Math.PI/3.2);g.rotateX(-Math.PI/2.4);k.add(g,'panel',0xffffff,x,y,z,ry||0);k.add(cyl(.012,.012,r*.6,5),'steel',0xffffff,x,y,z,ry||0,Math.PI/2.4)}
function holoRing(k,x,y,z,r,col){k.add(new TH.TorusGeometry(r,.012,6,40).rotateX(Math.PI/2),'neon',col,x,y,z)}
function cannon(k,x,y,z,ry,l){k.add(cylC(.035,.05,l||.34,10),'metal',0x3a3a3a,x,y,z,ry,0,Math.PI/2);k.add(new TH.CylinderGeometry(.06,.06,.03,10).rotateX(Math.PI/2),'planks',0x7a5a3a,x-.05,y-.04,z+.05,ry);k.add(new TH.CylinderGeometry(.06,.06,.03,10).rotateX(Math.PI/2),'planks',0x7a5a3a,x-.05,y-.04,z-.05,ry)}
function columns(k,x,z0,z1,y,h,n){for(let i=0;i<n;i++){const z=z0+(z1-z0)*i/(n-1);k.add(cyl(.045,.05,h,10),'marble',0xffffff,x,y,z);k.add(box(.1,.03,.1),'marble',0xffffff,x,y+h,z)}}
function pediment(k,x,y,z,w,h){k.add(box(.12,.05,w+.1,2),'marble',0xffffff,x,y,z);k.add(gableWall(w+.1,h,.12),'marble',0xffffff,x,y+.05,z,0)}

// ---------- edificios
function build(type,o,t,dir){const k=new Kit(),ud={};seed(311+type.length*7+t*31+o);const s=sty(t);
 switch(type){
 case'house':{pad(k,t,1.7,1.7);
  if(t===3){block(k,t,1.2,.72,.95,-.05,.05,-.05,{door:true});roofE(k,t,1.2,.95,-.05,.77,-.05,{dormers:true});A.props.chimney(k,.3,.8,-.3,.5);door(k,.555,-.05,0,.22,.36);barrel(k,.72,.5);crate(k,.7,-.55);ud.smoke=[.3,1.36,-.3]}
  else if(t===4){block(k,t,.62,.9,1.25,-.3,.05,-.05,{door:true});block(k,t,.62,.9,1.25,.34,.05,-.05,{col:0xb89890});roofE(k,t,.62,1.25,-.3,.95,-.05,{ry:Math.PI/2});roofE(k,t,.62,1.25,.34,.95,-.05,{ry:Math.PI/2});
   for(const px of[-.3,.34])k.add(box(.12,.3,.12,3),'brick',0x9a7066,px,1.1,-.5);door(k,.655,.3,0,.2,.34);lamp(k,t,.85,.7);drum(k,.8,-.6,0x5a5048);ud.smoke=[-.3,1.45,-.5]}
  else if(t===5){block(k,t,1.3,.62,.9,-.05,.05,-.1,{door:true});roofE(k,t,1.3,.9,-.05,.67,-.1);door(k,.605,-.1,0,.22,.36);sandbags(k,.75,-.5,.75,.4);drum(k,-.7,.6,0x4a5a34);drum(k,-.55,.66,0x4a5a34);flag(k,o,.7,.7,.9)}
  else if(t===6){block(k,t,1.3,.5,1.0,-.1,.05,-.05,{door:true});k.add(box(.7,.42,.8,1),'concrete',0xd8d4cc,.25,.62,-.1);neonRect(k,.72,.82,.25,1.04,-.1,NEON[t]);door(k,.555,-.05,0,.22,.36);roofE(k,t,1.3,1,-.1,.62,-.05);lamp(k,t,.75,.6)}
  else if(t===7){block(k,t,1.1,.62,.9,-.1,.05,-.1);block(k,t,.8,.5,.7,.1,.67,.0);roofE(k,t,.8,.7,.1,1.17,0);k.add(box(.5,.02,.5),'panel',0xffffff,.55,.02,.55);lamp(k,t,.75,.75)}
  else{k.add(new TH.SphereGeometry(.62,20,10,0,Math.PI*2,0,Math.PI/2),'poly',0xffffff,-.05,.05,-.05);k.add(new TH.SphereGeometry(.63,20,10,0,Math.PI*2,0,Math.PI/5),'green',0x5e8a3e,-.05,.07,-.05);
   k.add(new TH.TorusGeometry(.62,.015,6,40).rotateX(Math.PI/2),'neon',NEON[t],-.05,.2,-.05);k.add(box(.05,.34,.24),'window',0xffffff,.55,.05,-.05);planter(k,.7,.7);planter(k,-.7,.7)}
  break}
 case'tc':{pad(k,t,2.95,2.95,.07);
  if(t===3){// palacio con pórtico y cúpula
   block(k,t,2.2,.9,1.3,-.25,.07,.25,{door:true});roofE(k,t,2.2,1.3,-.25,.97,.25);block(k,t,1.0,.8,.9,-.8,.07,-.85);roofE(k,t,1.0,.9,-.8,.87,-.85);
   columns(k,.95,-.1,.6,.07,.8,5);pediment(k,.97,.87,.25,.9,.28);k.add(cyl(.34,.34,.5,18,1.2),'marble',0xffffff,-.25,1.2,.25);k.add(new TH.SphereGeometry(.36,18,10,0,Math.PI*2,0,Math.PI/2),'metal',0x5f9a86,-.25,1.7,.25);
   k.add(cyl(.06,.06,.2,8),'marble',0xffffff,-.25,2.05,.25);k.add(sph(.05,8,6),'gold',0xffffff,-.25,2.28,.25);for(let i=0;i<8;i++){const a=i/8*Math.PI*2;k.add(box(.03,.18,.06),'window',0xffffff,-.25+Math.cos(a)*.345,1.35,.25+Math.sin(a)*.345,-a)}
   stairs(k,1.08,.25,5);banner(k,o,1.3,-.5,1.1);banner(k,o,1.3,1.0,1.1);cannon(k,1.2,.12,-1.1,0);cannon(k,1.2,.12,1.3,0);ud.smoke=[-.8,1.5,-.85]}
  else if(t===4){// ayuntamiento con torre del reloj y chimenea
   block(k,t,2.1,1.0,1.2,-.3,.07,.3,{door:true});roofE(k,t,2.1,1.2,-.3,1.07,.3,{sky:true});block(k,t,.7,2.3,.7,.7,.07,-.75,{win:true});k.add(box(.76,.08,.76),'brick',0x7a5a50,.7,2.37,-.75);
   k.add(hip(.7,.7,.5,.06),'zinc',0xffffff,.7,2.45,-.75);for(const [x,z,r] of[[1.052,-.75,0],[.7,-.398,-Math.PI/2]]){k.add(new TH.CylinderGeometry(.2,.2,.02,20).rotateZ(Math.PI/2),'marble',0xffffff,x,1.95,z,r);k.add(box(.03,.14,.012),'metal',0x222222,x+.01,1.95,z,r);k.add(box(.03,.012,.1),'metal',0x222222,x+.01,1.95,z,r)}
   k.add(cyl(.14,.18,2.4,12,1),'brick',0xa88070,-1.15,.07,-1.1);k.add(cyl(.17,.17,.08,12),'brick',0x6a4a40,-1.15,2.47,-1.1);door(k,.755,.3,0,.3,.44);lamp(k,t,1.2,.9);lamp(k,t,1.2,-.1);drum(k,-1.2,1.0,0x5a5048);crate(k,-1.0,1.2);flag(k,o,.7,-.75,.6,2.9);ud.smoke=[-1.15,2.6,-1.1]}
  else if(t===5){// cuartel general de hormigón con mástil de radio
   block(k,t,2.2,.8,1.4,-.2,.07,.2,{door:true});roofE(k,t,2.2,1.4,-.2,.87,.2,{net:false});block(k,t,1.0,1.3,.8,.6,.07,-.9);roofE(k,t,1.0,.8,.6,1.37,-.9);
   k.add(cyl(.02,.03,1.8,6),'steel',0x5a5a5a,.6,1.42,-.9);for(let i=0;i<4;i++)k.add(box(.3-i*.06,.01,.01),'steel',0x5a5a5a,.6,1.8+i*.35,-.9);
   const g=new TH.PlaneGeometry(1.2,1.0,6,6);const p=g.attributes.position;for(let i=0;i<p.count;i++)p.setZ(i,Math.sin(p.getX(i)*8)*.04);g.rotateX(-Math.PI/2);k.add(g,'camo',0xffffff,-.9,.75,-.9);
   for(const [x,z] of[[-1.4,-1.4],[-.4,-1.4],[-1.4,-.4]])k.add(cyl(.015,.015,.7,5),'steel',0x4a4a3a,x,.07,z);sandbags(k,1.2,-.4,1.2,1.2,3);sandbags(k,.9,1.25,-1.3,1.25,2);door(k,.905,.2,0,.3,.42);flag(k,o,1.3,-1.2,1.3);drum(k,-1.2,.9,0x4a5a34);drum(k,-1.05,1.0,0x4a5a34)}
  else if(t===6){// zigurat brutalista con radar giratorio
   block(k,t,2.3,.6,1.9,-.1,.07,0);block(k,t,1.7,.55,1.4,-.1,.74,0);block(k,t,1.1,.5,.9,-.1,1.36,0);roofE(k,t,1.1,.9,-.1,1.93,0);
   k.add(cyl(.05,.07,.4,8),'steel',0xffffff,.2,1.93,-.2);ud.dish=[.2,2.36,-.2];door(k,1.055,0,0,.34,.44);for(const z of[-.8,.8])lamp(k,t,1.3,z);flag(k,o,1.3,1.25,1.2)}
  else if(t===7){// torre de cristal con corona led y helipuerto
   block(k,t,1.3,.7,1.8,-.55,.07,.2);block(k,t,.95,3.1,.95,.55,.07,-.6);k.add(box(.99,.05,.99),'neon',NEON[t],.55,2.6,-.6);k.add(box(.99,.05,.99),'neon',NEON[t],.55,2.9,-.6);
   k.add(cyl(.02,.02,.7,6),'steel',0xffffff,.55,3.2,-.6);k.add(sph(.025,6,4),'neon',0xff3030,.55,3.9,-.6);k.add(cylC(.48,.48,.03,24),'asphalt',0xffffff,-.55,.8,.2);k.add(new TH.TorusGeometry(.4,.012,4,32).rotateX(Math.PI/2),'neon',0xfff4a0,-.55,.82,.2);
   k.add(box(.03,.012,.3),'neon',0xfff4a0,-.55,.82,.2);k.add(box(.03,.012,.3),'neon',0xfff4a0,-.45,.82,.2);k.add(box(.1,.012,.03),'neon',0xfff4a0,-.5,.82,.2);door(k,1.045,-.6,0,.3,.44);lamp(k,t,1.3,.6);lamp(k,t,1.3,-1.3);flag(k,o,1.25,1.2,1.2)}
  else{// aguja orgánica con terrazas verdes y anillo holográfico
   for(let i=0;i<4;i++){const r=1.05-i*.2,y=.07+i*.62;k.add(cyl(r,r*.92,.5,28),'poly',0xffffff,-.1,y,0);k.add(cyl(r*.94,r*.94,.08,28),'green',0x5e8a3e,-.1,y+.5,0);k.add(cyl(r*.93,r*.93,.02,28),'neon',NEON[t],-.1,y+.26,0)}
   k.add(cone(.3,1.2,20),'poly',0xffffff,-.1,2.55,0);k.add(sph(.08,10,8),'neon',NEON[t],-.1,3.8,0);ud.holo=[-.1,2.0,0,1.2];for(const [x,z] of[[1.2,1.2],[1.2,-1.2],[-1.3,1.2]])planter(k,x,z);door(k,.95,0,0,.34,.5)}
  if(t<8)ud.smoke=ud.smoke||null;break}
 case'store':{pad(k,t,1.75,1.75);
  if(t<=4){block(k,t,1.4,.62,.9,0,.05,-.35,{win:false});roofE(k,t,1.4,.9,0,.67,-.35,{ry:0});k.add(box(.03,.44,.5,2),'planks',0x7a5a3a,.705,.05,-.35);crate(k,.3,.5);crate(k,.3,.5,.2,.8);barrel(k,.6,.5);t===4?drum(k,-.4,.55,0x5a5048):sack(k,-.4,.55)}
  else{block(k,t,1.5,.62,1.0,0,.05,-.3,{win:false});roofE(k,t,1.5,1.0,0,.67,-.3);k.add(box(.03,.44,.7,3),'zinc',0xb0b8c0,.755,.05,-.3);container(k,-.3,.55,0,t>=7?0x3a7ab0:0xb05a3a);container(k,-.3,.55,0,0x4a8a5a,.26);crate(k,.4,.55);lamp(k,t,.75,.75)}
  break}
 case'farm':{k.add(box(1.92,.06,1.92,1),'soil',0xffffff,0,0,0);
  if(t<=6){const c=t<=4?0xb09070:0x9aa0a8;const m=t<=4?'planks':'steel';for(const [a,b,c2,d2] of[[-.96,-.96,.96,-.96],[-.96,.96,.96,.96],[-.96,-.96,-.96,.96],[.96,-.96,.96,.35]]){const L=Math.hypot(c2-a,d2-b),n=Math.max(2,Math.round(L/.4)),an=Math.atan2(d2-b,c2-a);for(let i=0;i<=n;i++)k.add(box(.03,.22,.03),m,c,a+(c2-a)*i/n,0,b+(d2-b)*i/n);k.add(box(L,.02,.02),m,c,(a+c2)/2,.18,(b+d2)/2,-an)}
   if(t>=5){k.add(box(.3,.16,.18,2),'steel',PC[o],.7,.06,.72);for(const [x,z] of[[.6,.62],[.6,.82],[.82,.62],[.82,.82]])k.add(new TH.CylinderGeometry(.05,.05,.03,10).rotateX(Math.PI/2),'rubber',0xffffff,x,.06,z)}}
  else{for(let i=0;i<3;i++){const g=new TH.CylinderGeometry(.3,.3,1.8,12,1,true,0,Math.PI);g.rotateZ(Math.PI/2);k.add(g,'glass',0xffffff,0,.02,-.62+i*.62)}k.add(box(1.9,.02,.03),'neon',NEON[t],0,.06,.95)}
  break}
 case'barracks':{pad(k,t,2.95,2.95,.06);block(k,t,2.4,t===7?.9:.8,1.1,0,.06,-.7,{});roofE(k,t,2.4,1.1,0,t===7?.96:.86,-.7,{ry:0,net:t===5});door(k,.1,-.14,-Math.PI/2,.34,.42);
  if(t<=4){for(const px of[-.8,.1]){k.add(cyl(.03,.03,.5,6),'planks',0xffffff,px,0,.75);k.add(box(.3,.05,.05),'planks',0xffffff,px,.38,.75);k.add(sph(.08,8,6),'cloth',0xd8c090,px,.52,.75)}if(t===4)cannon(k,1.0,.12,.6,0);banner(k,o,1.25,.3,1.0)}
  else if(t<=6){sandbags(k,-1.3,.4,1.3,.4,3);for(let i=0;i<4;i++)k.add(box(.08,.3,.4,2),'planks',0x8a6a4a,-1+i*.6,0,1.0);wire(k,-1.4,1.4,1.4,1.4);flag(k,o,1.3,-.1,1.2)}
  else{k.add(cylC(.5,.5,.03,24),'asphalt',0xffffff,.6,.08,.7);k.add(new TH.TorusGeometry(.42,.012,4,32).rotateX(Math.PI/2),'neon',0xfff4a0,.6,.1,.7);flag(k,o,-1.2,.9,1.2);lamp(k,t,-1.3,.3)}
  break}
 case'range':{pad(k,t,2.95,2.95,.05);block(k,t,2.4,.6,.8,0,.05,-.95,{});roofE(k,t,2.4,.8,0,.65,-.95,{ry:0});
  for(let i=0;i<3;i++){const px=-.8+i*.8;if(t<=5){k.add(box(.03,.3,.24,2),'planks',0xe8dcc0,px,0,.95);k.add(cylC(.08,.08,.035,14),'cloth',0xc84a3a,px+.02,.2,.95,0,0,Math.PI/2)}
   else{k.add(box(.03,.34,.2,2),'panel',0xffffff,px,0,.95);k.add(box(.035,.2,.12),t>=7?'neon':'window',t>=7?NEON[t]:0xffffff,px+.005,.08,.95)}
   k.add(box(.02,.02,1.4),t>=7?'neon':'steel',t>=7?NEON[t]:0xd0d0d0,px,.02,.2)}
  if(t>=5)sandbags(k,-1.3,-.4,1.3,-.4,2);flag(k,o,1.3,-1.3,1.1);break}
 case'stable':{pad(k,t,2.95,2.95,.05);
  if(t<=4){block(k,t,2.4,.7,1.1,0,.05,-.72,{win:false});roofE(k,t,2.4,1.1,0,.75,-.72,{ry:0});for(let i=0;i<4;i++)k.add(box(.03,.5,.45,2),'window',0x303030,-.9+i*.6,.05,-.165);
   A.props.hay(k,.8,.6);A.props.hay(k,1.05,.8,.3);flag(k,o,1.3,-1.1,1.1)}
  else{block(k,t,2.4,.9,1.4,0,.05,-.55,{win:false});roofE(k,t,2.4,1.4,0,.95,-.55);for(let i=0;i<3;i++){k.add(box(.03,.62,.55,2),'zinc',0x9aa2a8,.001,.05,-.55,0);k.add(box(.62,.62,.03,2),'zinc',0x9aa2a8,-.8+i*.8,.05,.155)}
   for(let i=0;i<3;i++)k.add(box(.04,.02,.4),t>=7?'neon':'concrete',t>=7?NEON[t]:0xf0e060,-.8+i*.8,.06,.8);drum(k,1.2,1.1,t>=6?0xd8b020:0x4a5a34);drum(k,1.05,1.2,t>=6?0xd8b020:0x4a5a34);flag(k,o,1.3,-1.3,1.2)}
  break}
 case'smith':{pad(k,t,2.95,2.95,.06);
  if(t===3){block(k,t,1.8,.75,1.2,-.35,.06,-.55,{});roofE(k,t,1.8,1.2,-.35,.81,-.55);A.props.chimney(k,.35,.8,-.95,.95);k.add(box(.05,.36,.5,2),'glow',0xffffff,.555,.06,-.5);cannon(k,.8,.12,.6,0);cannon(k,.8,.12,1.0,0);ud.smoke=[.35,1.9,-.95]}
  else{// fábrica con cubierta en diente de sierra y chimeneas
   block(k,t,2.3,.8,1.6,-.1,.06,-.4,{win:t!==7});const n=4;for(let i=0;i<n;i++){const x=-1.1+(i+.5)*2.3/n;if(t<=6){k.add(box(.05,.3,1.6,2),'glass',0xffffff,x+.26,.86,-.4);k.add(gable(.575,1.6,.3,.02,2).rotateY(0),t===4?'zinc':'concrete',0xffffff,x,.86,-.4,Math.PI/2)}}
   if(t>=7)roofE(k,t,2.3,1.6,-.1,.86,-.4);for(const x of[.7,1.1])if(t<=6){k.add(cyl(.1,.13,1.6,12),t===4?'brick':'concrete',t===4?0xa88070:0xd0ccc4,x,.06,-1.1);k.add(cyl(.12,.12,.06,12),'steel',0x444444,x,1.66,-1.1)}
   ud.smoke=t<=6?[.7,1.8,-1.1]:null;container(k,.6,.8,0,0x4a6a8a);container(k,.6,.8,0,0xb05a3a,.26);drum(k,-1.1,.9,0x5a5048);lamp(k,t,1.3,.4)}
  break}
 case'tower':{
  if(t===3){// baluarte: bastión bajo con cañones
   const sh=new TH.Shape();sh.moveTo(.8,0);sh.lineTo(.2,.7);sh.lineTo(-.7,.7);sh.lineTo(-.7,-.7);sh.lineTo(.2,-.7);sh.closePath();const g=new TH.ExtrudeGeometry(sh,{depth:.8,bevelEnabled:false});g.rotateX(-Math.PI/2);k.add(g,'stone',0xffffff,0,0,0);
   const g2=new TH.ExtrudeGeometry(sh,{depth:.1,bevelEnabled:false});g2.rotateX(-Math.PI/2);g2.scale(1.06,1,1.06);k.add(g2,'marble',0xffffff,0,.8,0);cannon(k,.55,.98,.3,-.7);cannon(k,.55,.98,-.3,.7);cannon(k,.7,.98,0,0);
   k.add(box(.5,.5,.6,2),'brick',0xffffff,-.35,.9,0);k.add(hip(.5,.6,.3,.05),'slate',0xffffff,-.35,1.4,0);flag(k,o,-.35,0,.9,1.7)}
  else if(t===4){// torre artillada de ladrillo con torreta de hierro
   k.add(cyl(.62,.7,1.9,16,1),'brick',0xffffff,0,0,0);k.add(cyl(.68,.68,.1,16),'brick',0x7a5a50,0,1.9,0);for(let i=0;i<8;i++){const a=i/8*Math.PI*2;k.add(box(.03,.22,.1),'window',0xffffff,Math.cos(a)*.63,.9,Math.sin(a)*.63,-a)}
   k.add(cyl(.34,.38,.26,16),'steel',0x8a9096,0,2.0,0);k.add(new TH.SphereGeometry(.34,16,8,0,Math.PI*2,0,Math.PI/2),'steel',0x8a9096,0,2.26,0);for(let i=0;i<10;i++){const a=i/10*Math.PI*2;k.add(sph(.012,4,3),'steel',0x444444,Math.cos(a)*.35,2.2,Math.sin(a)*.35)}cannon(k,.45,2.16,0,0,.5);crenel(k,1.3,1.3,1.96,0,0,.26,.1,'brick');flag(k,o,-.2,-.2,.7,2.6)}
  else if(t===5){// nido de ametralladoras: búnker con sacos y alambrada
   k.add(cyl(.62,.7,.62,8),'concrete',0xd0cabc,0,0,0);k.add(cyl(.72,.72,.12,8),'concrete',0xb8b2a4,0,.62,0);for(let i=0;i<4;i++){const a=i/4*Math.PI*2+Math.PI/8;k.add(box(.04,.07,.34),'matte',0x151515,Math.cos(a)*.66,.38,Math.sin(a)*.66,-a)}
   k.add(cylC(.018,.018,.4,6),'metal',0x222222,.78,.42,0,0,0,Math.PI/2);sandbags(k,.9,-.5,.9,.5,3);wire(k,-1,1,1,1);wire(k,-1,-1,1,-1);
   k.add(cyl(.03,.03,1.3,5),'planks',0x7a6a4a,-.5,.74,-.5);k.add(box(.4,.04,.4),'planks',0x8a7a5a,-.5,2.0,-.5);k.add(box(.4,.25,.02),'planks',0x8a7a5a,-.5,2.04,-.3);flag(k,o,-.5,-.5,.6,2.04)}
  else if(t===6){// torre de misiles con radar
   k.add(box(1.2,.6,1.2,1),'concrete',0xe0dcd4,0,0,0);k.add(box(1.3,.06,1.3),'concrete',0xc8c4bc,0,.6,0);neonRect(k,1.31,1.31,0,.63,0,NEON[t]);k.add(cyl(.2,.24,.4,10),'panel',0xffffff,0,.66,0);
   for(let i=0;i<2;i++)for(let j=0;j<2;j++)k.add(cylC(.07,.07,.7,10),'panel',0xe8e8e8,.1,1.2+i*.16,-.09+j*.18,0,0,-1.0);k.add(cyl(.02,.02,.5,5),'steel',0xffffff,-.45,.66,-.45);ud.dish=[-.45,1.2,-.45];flag(k,o,.5,.5,.8,.66)}
  else if(t===7){// torreta automática hexagonal
   k.add(cyl(.55,.65,1.6,6),'panel',0xffffff,0,0,0);k.add(cyl(.66,.66,.04,6),'neon',NEON[t],0,1.0,0);k.add(cyl(.6,.6,.08,6),'panel',0xd0d4d8,0,1.6,0);
   k.add(new TH.SphereGeometry(.4,16,8,0,Math.PI*2,0,Math.PI/2),'panel',0xf0f2f4,0,1.68,0);for(const dz of[-.08,.08])k.add(cylC(.03,.03,.55,8),'steel',0x303030,.5,1.84,dz,0,0,Math.PI/2);k.add(box(.1,.06,.2),'neon',0xff3030,.34,1.95,0);flag(k,o,-.4,-.4,.6,1.68)}
  else{// torre láser: aguja blanca con cristal
   k.add(cyl(.2,.6,2.2,24),'poly',0xffffff,0,0,0);for(let i=0;i<3;i++)k.add(new TH.TorusGeometry(.45-i*.12,.02,6,40).rotateX(Math.PI/2),'neon',NEON[t],0,.6+i*.6,0);
   k.add(new TH.OctahedronGeometry(.22,0),'neon',0x9ff8ff,0,2.5,0);ud.holo=[0,2.5,0,.4];for(let i=0;i<3;i++){const a=i/3*Math.PI*2;k.add(cyl(.03,.05,.9,6),'poly',0xffffff,Math.cos(a)*.45,1.6,Math.sin(a)*.45,0,Math.cos(a)*.3,-Math.sin(a)*.3)}}
  break}
 case'siege':{pad(k,t,2.95,2.95,.05);block(k,t,2.4,1.0,1.6,0,.05,-.4,{win:false});roofE(k,t,2.4,1.6,0,1.05,-.4,{ry:0,net:t===5});k.add(box(.03,.8,1.0,2),t<=4?'planks':'zinc',0x9aa2a8,1.205,.05,-.4);
  if(t>=4){k.add(box(.08,1.6,.08,2),'steel',0xd0a020,-1.2,.05,.9);k.add(box(1.4,.06,.06),'steel',0xd0a020,-.6,1.62,.9);k.add(cyl(.005,.005,.6,3),'steel',0x333333,-.1,1.02,.9)}
  if(t===3)cannon(k,.6,.12,.9,0,.5);else{k.add(cylC(.05,.07,.8,10),'metal',0x4a4e44,.4,.2,.9,0,0,Math.PI/2);k.add(box(.5,.15,.3,2),'steel',0x5a5e4a,.2,.05,.9)}flag(k,o,1.3,1.3,1.1);break}
 case'monastery':{pad(k,t,2.95,2.95,.08);
  if(t<=4){// iglesia barroca
   block(k,t,1.2,1.1,2.2,-.5,.08,0,{});k.add(gable(2.2,1.2,.6,.1,1.6),'slate',0xffffff,-.5,1.18,0,Math.PI/2);block(k,t,.8,2.4,.8,.7,.08,-.7,{});k.add(cyl(.3,.3,.4,12),'marble',0xffffff,.7,2.48,-.7);
   k.add(new TH.SphereGeometry(.32,14,8,0,Math.PI*2,0,Math.PI/2),'metal',0x5f9a86,.7,2.88,-.7);k.add(box(.03,.3,.04),'gold',0xffffff,.7,3.2,-.7);k.add(box(.14,.03,.04),'gold',0xffffff,.7,3.4,-.7);door(k,-.5,1.105,-Math.PI/2,.26,.44)}
  else{// hospital con cruz roja
   block(k,t,2.2,.9,1.3,-.2,.08,-.4,{});roofE(k,t,2.2,1.3,-.2,.98,-.4);block(k,t,.9,.6,1.0,.5,.08,.75,{});roofE(k,t,.9,1.0,.5,.68,.75);
   k.add(box(.7,.02,.7),'matte',0xffffff,-.2,1.04,-.4);k.add(box(.5,.025,.15),'matte',0xd02020,-.2,1.05,-.4);k.add(box(.15,.025,.5),'matte',0xd02020,-.2,1.05,-.4);
   for(const [x,z] of[[.955,.75]]){k.add(box(.02,.2,.2),'matte',0xffffff,x,.4,z);k.add(box(.025,.14,.05),'matte',0xd02020,x,.43,z);k.add(box(.025,.05,.14),'matte',0xd02020,x,.43,z)}
   for(let i=0;i<2;i++){k.add(box(.5,.22,.26,2),'matte',0xf4f4f4,-1.0+i*.6,.08,1.1);k.add(box(.1,.06,.27),'matte',0xd02020,-1.0+i*.6,.2,1.1)}}
  break}
 case'market':{pad(k,t,2.95,2.95,.06);
  if(t===3){block(k,t,1.4,.8,1.0,.5,.06,-.8,{});roofE(k,t,1.4,1.0,.5,.86,-.8);for(let i=0;i<5;i++)k.add(cyl(.04,.045,.55,8),'marble',0xffffff,-1.1+i*.45,.06,.3);k.add(box(2.1,.1,.7),'marble',0xffffff,-.2,.61,.55);k.add(gable(2.1,.7,.2,.05,2),'slate',0xffffff,-.2,.71,.55);crate(k,1.0,1.1);barrel(k,1.2,.8)}
  else if(t<=6){// mercado de hierro y cristal con cubierta de bóveda
   for(const sx of[-1,1])k.add(box(2.2,.5,.06,2),t===4?'brick':'concrete',0xffffff,0,.06,sx*.8);const g=new TH.CylinderGeometry(.82,.82,2.2,20,1,true,-Math.PI/2,Math.PI);g.rotateZ(Math.PI/2);k.add(g,'glass',0xffffff,0,.56,0);
   for(let i=0;i<6;i++){const g2=new TH.TorusGeometry(.82,.02,4,20,Math.PI);g2.rotateY(Math.PI/2);k.add(g2,'steel',0x303438,-1.05+i*.42,.56,0)}for(let i=0;i<3;i++){k.add(box(.5,.2,.3,3),'planks',0xffffff,-.7+i*.7,.06,1.1);for(let q=0;q<4;q++)k.add(sph(.045,6,4),'matte',[0xc2533d,0xe8c24c,0x6e9a3e][i],-.85+i*.7+q*.1,.3,1.1)}flag(k,o,1.3,-1.3,1.1)}
  else if(t===7){block(k,t,2.0,1.4,1.3,-.2,.06,-.5,{});k.add(box(2.05,.12,.02),'neon',0x46ff7a,-.2,1.05,.16);k.add(box(2.05,.12,.02),'neon',0xff5050,-.2,.85,.16);roofE(k,t,2.0,1.3,-.2,1.46,-.5);flag(k,o,1.2,1.0,1.2);lamp(k,t,1.2,.4)}
  else{k.add(cylC(1.1,1.1,.06,32),'poly',0xffffff,0,.09,.2);holoRing(k,0,.5,.2,.8,NEON[t]);ud.holo=[0,.9,.2,.5];for(let i=0;i<4;i++){const a=i/4*Math.PI*2;k.add(new TH.SphereGeometry(.3,14,8,0,Math.PI*2,0,Math.PI/2),'poly',0xffffff,Math.cos(a)*1.0,.06,.2+Math.sin(a)*1.0);k.add(box(.2,.02,.2),'neon',NEON[t],Math.cos(a)*1.0,.38,.2+Math.sin(a)*1.0)}}
  break}
 case'dock':{k.add(box(2.9,.08,2.9,1),t<=4?'planks':'concrete',0xffffff,0,.02,0);for(const x of[-1.35,-.45,.45,1.35])for(const z of[-1.35,-.45,.45,1.35])k.add(cyl(.06,.07,.9,7),t<=4?'bark':'concrete',0xffffff,x,-.8,z);
  block(k,t,1.0,.62,.8,-.8,.1,-.85,{});roofE(k,t,1.0,.8,-.8,.72,-.85,{ry:0});
  if(t>=4){// grúa portuaria
   for(const [x,z] of[[.5,-1.2],[1.1,-1.2],[.5,-.6],[1.1,-.6]])k.add(box(.06,1.6,.06,2),'steel',0xd05a2a,x,.1,z);k.add(box(.8,.3,.8,2),'steel',0xd05a2a,.8,1.7,-.9);k.add(box(2.2,.08,.1,2),'steel',0xd05a2a,.4,1.95,-.9);k.add(cyl(.005,.005,1.2,3),'steel',0x333333,-.4,.75,-.9);k.add(box(.2,.1,.12),'steel',0x444444,-.4,.7,-.9)}
  for(let i=0;i<(t>=5?3:1);i++)container(k,.6,.6+i*.02,0,[0xb05a3a,0x3a7ab0,0x4a8a5a][i],.1+i*.26);lamp(k,t,-1.3,1.3);flag(k,o,-1.3,-1.3,1.1,.1);break}
 case'castle':{const Wd=3.3;k.add(box(3.95,.12,3.95,1),s.base,0xffffff,0,0,0);
  if(t<=4){// fortaleza abaluartada (estrella)
   const sh=new TH.Shape();const pts=[];for(let i=0;i<8;i++){const a=i/8*Math.PI*2+Math.PI/8,r=i%2?1.35:1.95;pts.push([Math.cos(a)*r,Math.sin(a)*r])}sh.moveTo(...pts[0]);for(const p of pts.slice(1))sh.lineTo(...p);sh.closePath();
   const g=new TH.ExtrudeGeometry(sh,{depth:.8,bevelEnabled:true,bevelThickness:.1,bevelSize:.12,bevelSegments:1});g.rotateX(-Math.PI/2);k.add(g,t===3?'stone':'brick',0xffffff,0,.1,0);
   block(k,t,1.4,1.1,1.4,0,.9,0,{});roofE(k,t,1.4,1.4,0,2.0,0,{ry:0});for(let i=0;i<4;i++){const a=i/4*Math.PI*2+Math.PI/8;cannon(k,Math.cos(a)*1.75,1.02,Math.sin(a)*1.75,-a,.4)}flag(k,o,0,0,1.0,2.4)}
  else if(t<=6){// búnker de mando
   k.add(box(3.2,.9,3.2,.8),'concrete',0xd0cabc,0,.12,0);k.add(box(3.3,.1,3.3),'concrete',0xb8b2a4,0,1.02,0);block(k,t,1.4,.8,1.4,-.4,1.12,-.4,{});roofE(k,t,1.4,1.4,-.4,1.92,-.4);
   for(let i=0;i<4;i++){const a=i/4*Math.PI*2;k.add(box(.04,.08,.6),'matte',0x151515,Math.cos(a)*1.61,.6,Math.sin(a)*1.61,-a)}if(t===6){k.add(cyl(.05,.07,.5,8),'steel',0xffffff,.8,1.12,.8);ud.dish=[.8,1.7,.8]}else{sandbags(k,1.7,-1.6,1.7,1.6,3);wire(k,-1.9,1.9,1.9,1.9)}flag(k,o,1.2,-1.2,1.2,1.12)}
  else if(t===7){block(k,t,2.4,1.2,2.4,0,.12,0,{});block(k,t,1.2,1.6,1.2,-.4,1.32,-.4,{});for(const [x,z] of[[.8,.8],[.9,-.9]]){k.add(cyl(.02,.02,1.2,5),'steel',0xffffff,x,1.32,z);k.add(sph(.03,6,4),'neon',0xff3030,x,2.55,z)}dish(k,.7,1.5,.2,.35);flag(k,o,1.3,1.3,1.4)}
  else{k.add(cyl(1.4,1.6,1.0,32),'poly',0xffffff,0,.12,0);k.add(cyl(1.42,1.42,.03,32),'neon',NEON[t],0,.8,0);k.add(new TH.SphereGeometry(1.8,28,14,0,Math.PI*2,0,Math.PI/2),'holo',0x5fe6ff,0,.12,0);
   k.add(cone(.35,2.2,18),'poly',0xffffff,0,1.12,0);k.add(sph(.12,10,8),'neon',NEON[t],0,3.4,0);ud.holo=[0,1.8,0,1.0]}
  break}
 case'wonder':{k.add(box(4.95,.2,4.95,1),s.base,0xffffff,0,0,0);
  if(t===3){// basílica con cúpula
   block(k,t,3.4,1.4,1.6,0,.2,0,{});block(k,t,1.6,1.4,3.4,0,.2,0,{});k.add(cyl(.8,.8,.8,24,1),'marble',0xffffff,0,1.6,0);k.add(new TH.SphereGeometry(.84,24,12,0,Math.PI*2,0,Math.PI/2),'metal',0x5f9a86,0,2.4,0);
   k.add(cyl(.12,.12,.4,10),'marble',0xffffff,0,3.2,0);k.add(sph(.08,8,6),'gold',0xffffff,0,3.65,0);columns(k,1.75,-.6,.6,.2,1.2,5);pediment(k,1.77,1.4,0,1.4,.35);for(const sz of[-1,1]){block(k,t,.6,2.4,.6,1.4,.2,sz*1.4,{});k.add(hip(.6,.6,.6,.04),'slate',0xffffff,1.4,2.66,sz*1.4)}}
  else if(t===4){// torre de hierro
   const C=0x6a5040,L=(y)=>.95-(.95-.18)*Math.pow(y/3.2,.8);
   for(const sx of[-1,1])for(const sz of[-1,1]){beam(k,'steel',C,[sx*.95,.2,sz*.95],[sx*L(1.1),1.1,sz*L(1.1)],.07);beam(k,'steel',C,[sx*L(1.1),1.1,sz*L(1.1)],[sx*L(2.2),2.2,sz*L(2.2)],.055);beam(k,'steel',C,[sx*L(2.2),2.2,sz*L(2.2)],[sx*.18,3.3,sz*.18],.045)}
   for(const [y0,y1] of[[.2,1.1],[1.1,2.2],[2.2,3.3]])for(const [ax,az,bx,bz] of[[1,1,1,-1],[1,-1,-1,-1],[-1,-1,-1,1],[-1,1,1,1]]){beam(k,'steel',C,[ax*L(y0),y0,az*L(y0)],[bx*L(y1),y1,bz*L(y1)],.015);beam(k,'steel',C,[bx*L(y0),y0,bz*L(y0)],[ax*L(y1),y1,az*L(y1)],.015)}
   for(const y of[1.1,2.2]){const r=L(y)+.08;k.add(box(r*2,.08,r*2,2),'steel',C,0,y,0);neonRect(k,r*2+.04,r*2+.04,0,y+.09,0,0xffd890,.02)}
   beam(k,'steel',C,[0,3.3,0],[0,5.2,0],.06);k.add(box(.3,.08,.3),'steel',C,0,3.3,0);k.add(box(.12,.12,.12),'glow',0xffffff,0,5.2,0);
   for(let i=0;i<4;i++){const a=i/4*Math.PI*2;const g=new TH.TorusGeometry(.62,.03,4,14,Math.PI);k.add(g,'steel',C,Math.cos(a)*.95,.2,Math.sin(a)*.95,a+Math.PI/2)}flag(k,o,0,0,.5,5.3)}
  else if(t===5){// arco monumental
   for(const sz of[-1,1])k.add(box(1.4,2.6,.9,1),'concrete',0xe0dcd0,0,.2,sz*1.1);k.add(box(1.4,1.0,3.1,1),'concrete',0xe0dcd0,0,2.8,0);const g=new TH.CylinderGeometry(.66,.66,1.42,20,1,false,0,Math.PI);g.rotateZ(Math.PI/2);g.rotateX(Math.PI/2);k.add(g,'concrete',0xd8d4c8,0,2.8,0);
   k.add(box(1.5,.12,3.2),'concrete',0xc8c4b8,0,3.8,0);for(const sz of[-1,1])flag(k,o,.8,sz*1.1,1.4,3.9);k.add(box(.02,.3,1.4),'gold',0xffffff,.71,3.2,0)}
  else if(t===6){// cohete espacial en su plataforma
   k.add(box(2.4,.3,2.4,1),'concrete',0xd8d4cc,0,.2,0);k.add(cyl(.42,.42,3.4,20),'panel',0xf4f4f4,0,.5,0);k.add(cone(.42,1.2,20),'panel',0xf4f4f4,0,3.9,0);k.add(cyl(.43,.43,.2,20),'matte',PC[o],0,2.8,0);
   for(let i=0;i<4;i++){const a=i/4*Math.PI*2;k.add(cyl(.18,.18,1.6,12),'panel',0xe8e8e8,Math.cos(a)*.6,.5,Math.sin(a)*.6);k.add(cone(.18,.5,12),'panel',0xe8e8e8,Math.cos(a)*.6,2.1,Math.sin(a)*.6)}
   k.add(box(.3,4.6,.3,1),'steel',0xd05a2a,-1.0,.5,-1.0);for(let i=0;i<5;i++)k.add(box(.9,.05,.05),'steel',0xd05a2a,-.6,1.0+i*.8,-1.0,Math.PI/4);k.add(box(.9,.2,.9,2),'neon',NEON[t],0,.51,0,0,0,0,1,.05,1)}
  else if(t===7){// rascacielos de cristal
   block(k,t,2.4,1.0,2.4,0,.2,0,{});block(k,t,1.6,4.4,1.6,0,1.2,0,{});block(k,t,1.0,1.2,1.0,0,5.6,0,{});k.add(cyl(.02,.03,1.4,6),'steel',0xffffff,0,6.8,0);k.add(sph(.04,6,4),'neon',0xff3030,0,8.2,0)}
  else{// arcología y ascensor espacial
   for(let i=0;i<5;i++){const r=2.1-i*.35;k.add(cyl(r,r*.95,.7,32),'poly',0xffffff,0,.2+i*.8,0);k.add(cyl(r*.97,r*.97,.1,32),'green',0x5e8a3e,0,.9+i*.8,0);k.add(cyl(r*.96,r*.96,.02,32),'neon',NEON[t],0,.55+i*.8,0)}
   k.add(cyl(.06,.06,6,8),'poly',0xffffff,0,4.2,0);k.add(new TH.OctahedronGeometry(.3,0),'neon',0x9ff8ff,0,10.2,0);ud.holo=[0,5.5,0,1.4]}
  break}
 case'palisade':{const d=dir;if(t<=4){for(let i=0;i<4;i++){const a=-.36+i*.24;const x=d?0:a,z=d?a:0;k.add(cyl(.1,.11,.85,7),'bark',0xffffff,x,0,z);k.add(cone(.1,.2,7),'planks',0xc0a070,x,.9,z)}k.add(box(d?.06:.98,.06,d?.98:.06),'timber',0xffffff,d?.1:0,.5,d?0:.1)}
  else if(d)wire(k,0,-.5,0,.5);else wire(k,-.5,0,.5,0);break}
 case'wall':{if(t===3){const g=new TH.CylinderGeometry(.55,.7,1.0,4,1);g.rotateY(Math.PI/4);g.translate(0,.5,0);k.add(g,'stone',0xffffff,0,0,0);k.add(box(1.04,.1,1.04,2),'marble',0xffffff,0,1.0,0)}
  else if(t===4){k.add(box(1,1.1,.9,1),'brick',0xffffff,0,0,0);k.add(box(1.04,.08,.96,2),'brick',0x7a5a50,0,1.1,0)}
  else if(t<=6){k.add(box(1,1.0,.7,1),'concrete',0xd8d4cc,0,0,0);k.add(box(1.02,.06,.74),'concrete',0xc0bcb4,0,1.0,0);if(t===5){k.add(cyl(.01,.01,.25,4),'steel',0x5a5048,.4,1.06,0);k.add(new TH.TorusGeometry(.08,.006,4,10).rotateY(Math.PI/2),'steel',0x8a8078,0,1.25,0)}else k.add(box(1.02,.02,.76),'neon',NEON[6],0,.7,0)}
  else if(t===7){k.add(box(1,1.2,.5,1),'panel',0xffffff,0,0,0);k.add(box(1.01,.03,.52),'neon',NEON[7],0,.9,0)}
  else{k.add(cyl(.12,.15,1.4,10),'poly',0xffffff,0,0,0);k.add(sph(.07,8,6),'neon',NEON[8],0,1.45,0);k.add(box(1,1.2,.04,1),'holo',0x5fe6ff,0,.1,0)}break}
 case'gate':{const ry=dir?Math.PI/2:0,c=Math.cos(ry),s2=Math.sin(ry),at=(x,z)=>[x*c+z*s2,-x*s2+z*c];const m=t<=3?'stone':t===4?'brick':t<=6?'concrete':t===7?'panel':'poly';
  for(const sx of[-1,1]){const [x,z]=at(sx*.38,0);k.add(box(.24,1.2,1,1.2),m,0xffffff,x,0,z,ry)}const [x0,z0]=at(0,0);k.add(box(1,.24,1,1.2),m,0xffffff,x0,1.0,z0,ry);if(t>=7)k.add(box(1.02,.03,1.02),'neon',NEON[t],x0,1.1,z0,ry);ud.doorGeo=true;break}
 default:return null}
 return{k,ud}}
function beam(k,m,col,a,b,r){const va=new TH.Vector3(...a),vb=new TH.Vector3(...b),d=vb.clone().sub(va),L=d.length();const g=new TH.CylinderGeometry(r,r,L,6);g.translate(0,L/2,0);g.applyQuaternion(new TH.Quaternion().setFromUnitVectors(new TH.Vector3(0,1,0),d.normalize()));g.translate(va.x,va.y,va.z);k.add(g,m,col)}
function stairs(k,x,z,n){for(let i=0;i<n;i++)k.add(box(.1,.04*(n-i),.5,3),'marble',0xffffff,x+i*.08,0,z)}
A.eraBuilding=function(type,o,tier,dir){return build(type,o,tier,dir)};
// piezas animadas: radar giratorio y anillos holográficos
A.eraDecor=function(g,ud){const nos=m=>{m.traverse(c=>{if(c.isMesh&&(c.material===M.neon||c.material===M.holo||c.material===M.holoWire))c.castShadow=false})};nos(g);
 if(ud.dish){const d=new TH.Group(),k=new Kit();k.add(cyl(.015,.015,.12,5),'steel',0xffffff,0,-.12,0);const s=new TH.SphereGeometry(.32,16,6,0,Math.PI*2,0,Math.PI/3);s.rotateX(-Math.PI/2.3);k.add(s,'panel',0xffffff,0,0,0);k.add(cyl(.01,.01,.25,4),'steel',0xffffff,0,0,0,0,Math.PI/2.3);
  d.add(k.build());d.position.set(ud.dish[0],ud.dish[1],ud.dish[2]);g.add(d);ud.spin=[d,.6]}
 if(ud.holo){const [x,y,z,r]=ud.holo,h=new TH.Group(),k=new Kit();k.add(new TH.TorusGeometry(r,.02,6,48).rotateX(Math.PI/2),'neon',0x5fe6ff,0,0,0);k.add(new TH.TorusGeometry(r*.8,.012,6,48).rotateX(Math.PI/2.4),'neon',0x9affd0,0,0,0);
  const b=k.build();b.traverse(c=>{if(c.isMesh)c.castShadow=false});h.add(b);const disc=new TH.Mesh(new TH.CylinderGeometry(r*.95,r*.95,.01,40,1,true),M.holo);disc.scale.y=30;h.add(disc);h.position.set(x,y,z);g.add(h);ud.spin2=[h,1.2];ud.bob=h}};

// ---------- andamios, grúas e impresión 3D según la edad (obras en curso)
A.rig=function(size,tier){const g=new TH.Group(),k=new Kit(),s=size,h=Math.min(2.2,.6+s*.4);g.userData.kind=tier>=7?'print':tier>=4?'crane':'scaf';
 if(tier<4){for(const sx of[-1,1])for(const sz of[-1,1])k.add(cyl(.025,.025,h,5),'planks',0xc8a878,sx*(s/2-.05),0,sz*(s/2-.05));
  for(let y=.4;y<h;y+=.45){for(const sz of[-1,1])k.add(box(s-.1,.02,.12),'planks',0xd8b890,0,y,sz*(s/2-.05));for(const sx of[-1,1])k.add(box(.12,.02,s-.1),'planks',0xd8b890,sx*(s/2-.05),y,0)}
  k.add(box(.03,h,.03),'planks',0xb09070,s/2-.05,0,0,0,0,.2)}
 else if(tier<7){for(const sx of[-1,1])for(const sz of[-1,1])k.add(cyl(.018,.018,h,5),'steel',0xd8b020,sx*(s/2-.05),0,sz*(s/2-.05));for(let y=.5;y<h;y+=.5){for(const sz of[-1,1])k.add(box(s-.1,.02,.02),'steel',0xd8b020,0,y,sz*(s/2-.05));for(const sx of[-1,1])k.add(box(.02,.02,s-.1),'steel',0xd8b020,sx*(s/2-.05),y,0)}
  const H=h+1.2;k.add(box(.12,H,.12,2),'steel',0xe0a020,-s/2-.15,0,-s/2-.15);const jib=new Kit();jib.add(box(s+1.2,.08,.1,2),'steel',0xe0a020,(s+1.2)/2-.4,0,0);jib.add(box(.3,.18,.18),'concrete',0x888888,-.3,-.05,0);jib.add(cyl(.004,.004,.9,3),'steel',0x222222,s*.6,-.9,0);jib.add(box(.12,.1,.12),'steel',0x333333,s*.6,-.98,0);
  const jm=jib.build();jm.position.set(-s/2-.15,H,-s/2-.15);g.add(jm);g.userData.jib=jm}
 else{for(const sx of[-1,1])for(const sz of[-1,1])k.add(box(.06,h,.06,2),'panel',0xffffff,sx*(s/2),0,sz*(s/2));for(const sz of[-1,1])k.add(box(s,.06,.06,2),'panel',0xffffff,0,h,sz*s/2);
  const hd=new Kit();hd.add(box(.12,.12,s,2),'panel',0xffffff,0,0,0);hd.add(box(.1,.08,.1),'neon',NEON[tier],0,-.1,0);const hm=hd.build();hm.position.y=h;g.add(hm);g.userData.head=hm;
  const box3=new TH.Mesh(new TH.BoxGeometry(s-.1,h,s-.1).translate(0,h/2,0),M.holoWire);g.add(box3);const scan=new TH.Mesh(new TH.PlaneGeometry(s-.1,s-.1).rotateX(-Math.PI/2),new TH.MeshBasicMaterial({color:0x5fe6ff,transparent:true,opacity:.25,depthWrite:false,side:TH.DoubleSide,toneMapped:false}));g.add(scan);g.userData.scan=scan}
 g.add(k.build({noShadow:false}));g.userData.h=h;g.userData.s=s;return g};
A.rigUpdate=function(g,bp,t){const u=g.userData;if(u.jib)u.jib.rotation.y=Math.sin(t*.4)*1.2;if(u.head){u.head.position.x=Math.sin(t*2.3)*(u.s/2-.1);u.head.position.y=Math.max(.05,bp*u.h)}if(u.scan)u.scan.position.y=Math.max(.02,bp*u.h)};
})(window);
