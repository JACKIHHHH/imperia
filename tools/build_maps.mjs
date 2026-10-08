// Imperia — genera mapas de continentes con datos reales → web/maps_data.js
// Relieve: teselas "terrarium" de elevación (AWS Open Data, Mapzen). Ríos y lagos: Natural Earth (dominio público).
// Color del suelo: NASA Blue Marble (dominio público). Uso: node tools/build_maps.mjs   (npm i pngjs jpeg-js)
import fs from 'fs';import path from 'path';import {PNG} from 'pngjs';import jpeg from 'jpeg-js';
const dir=path.dirname(new URL(import.meta.url).pathname),geo=path.join(dir,'../assets_src/geo');fs.mkdirSync(path.join(geo,'tiles'),{recursive:true});
const N=160;// resolución guardada (el juego la remuestrea al tamaño elegido)
// mapas: centro (lon,lat) y anchura en longitud; se recorta un cuadrado en proyección Mercator
const MAPS=[
 {id:'iberia',name:'Península Ibérica',lon:-3.6,lat:40.2,span:13.5},
 {id:'europa',name:'Europa',lon:13,lat:48.5,span:42},
 {id:'mediterraneo',name:'Mediterráneo',lon:17,lat:38.5,span:34},
 {id:'africa',name:'África',lon:19,lat:2,span:76},
 {id:'asia',name:'Asia oriental',lon:108,lat:33,span:58},
 {id:'namerica',name:'Norteamérica',lon:-98,lat:40,span:60},
 {id:'samerica',name:'Sudamérica',lon:-60,lat:-20,span:62},
 {id:'oceania',name:'Oceanía',lon:148,lat:-28,span:52}];
const R2D=180/Math.PI,D2R=Math.PI/180;
const mx=lon=>(lon+180)/360,my=lat=>(1-Math.log(Math.tan(Math.PI/4+lat*D2R/2))/Math.PI)/2;// 0..1
const ilat=y=>R2D*(2*Math.atan(Math.exp(Math.PI*(1-2*y)))-Math.PI/2);
async function get(url,file){if(fs.existsSync(file)&&fs.statSync(file).size>100)return fs.readFileSync(file);for(let k=0;k<4;k++){try{const r=await fetch(url);if(!r.ok)throw new Error(r.status);const b=Buffer.from(await r.arrayBuffer());fs.writeFileSync(file,b);return b}catch(e){if(k===3)throw new Error(url+' '+e.message);await new Promise(r=>setTimeout(r,800))}}}
// ---------- datos globales
console.log('descargando datos globales…');
const NE='https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/';
const rivers=JSON.parse(await get(NE+'ne_10m_rivers_lake_centerlines.geojson',path.join(geo,'rivers10.geojson')));
const lakes=JSON.parse(await get(NE+'ne_10m_lakes.geojson',path.join(geo,'lakes10.geojson')));
const bmBuf=await get('https://eoimages.gsfc.nasa.gov/images/imagerecords/74000/74092/world.200407.3x5400x2700.jpg',path.join(geo,'bluemarble_jul.jpg'));
const BM=jpeg.decode(bmBuf,{useTArray:true,maxMemoryUsageInMB:512});console.log('Blue Marble',BM.width,'x',BM.height);
function bmColor(lon,lat){const x=((lon+180)/360)*BM.width,y=((90-lat)/180)*BM.height;const xi=Math.max(0,Math.min(BM.width-1,x|0)),yi=Math.max(0,Math.min(BM.height-1,y|0)),o=(yi*BM.width+xi)*4;return[BM.data[o],BM.data[o+1],BM.data[o+2]]}
// ---------- por mapa
const out={};
for(const M of MAPS){
 const x0=mx(M.lon-M.span/2),x1=mx(M.lon+M.span/2),w=x1-x0,yc=my(M.lat),y0=yc-w/2,y1=yc+w/2;
 let z=3;while(z<9&&w*256*(1<<z)<N*6)z++;const T=1<<z;
 const tx0=Math.floor(x0*T),tx1=Math.floor(x1*T),ty0=Math.max(0,Math.floor(y0*T)),ty1=Math.min(T-1,Math.floor(y1*T));
 const tiles=new Map();let got=0;
 for(let ty=ty0;ty<=ty1;ty++)for(let tx=tx0;tx<=tx1;tx++){const txw=((tx%T)+T)%T,f=path.join(geo,'tiles',`${z}_${txw}_${ty}.png`);
  const b=await get(`https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${z}/${txw}/${ty}.png`,f);tiles.set(tx+','+ty,PNG.sync.read(b));got++}
 const elevAt=(u,v)=>{// u,v en 0..1 mundo Mercator
  const px=u*T*256,py=v*T*256,tx=Math.floor(px/256),ty=Math.floor(py/256),t=tiles.get(tx+','+ty);if(!t)return -100;
  const ix=Math.min(255,Math.floor(px-tx*256)),iy=Math.min(255,Math.floor(py-ty*256)),o=(iy*256+ix)*4;return t.data[o]*256+t.data[o+1]+t.data[o+2]/256-32768};
 const elev=new Int16Array(N*N),col=new Uint8Array(N*N*3),water=new Uint8Array(N*N);const S=4;
 for(let j=0;j<N;j++)for(let i=0;i<N;i++){let e=0,emax=-1e9,wat=0,r=0,g=0,b=0;
  for(let sy=0;sy<S;sy++)for(let sx=0;sx<S;sx++){const u=x0+w*(i+(sx+.5)/S)/N,v=y0+w*(j+(sy+.5)/S)/N;const h=elevAt(u,v);e+=h;emax=Math.max(emax,h);if(h<=0)wat++;
   const c=bmColor(u*360-180,ilat(v));r+=c[0];g+=c[1];b+=c[2]}
  const k=j*N+i,n=S*S;const avg=e/n;const lumC=(r*.3+g*.59+b*.11)/n;if(wat>n*.55&&avg>-40&&lumC>70)wat=0;elev[k]=Math.max(-8000,Math.min(9000,Math.round(wat>n*.55?Math.min(avg,-1):Math.max(1,avg*.6+emax*.4))));water[k]=wat>n*.55?1:0;col[k*3]=r/n;col[k*3+1]=g/n;col[k*3+2]=b/n}
 // lagos (polígonos) y ríos (líneas) rasterizados
 const toG=(lon,lat)=>[(mx(lon)-x0)/w*N,(my(lat)-y0)/w*N];
 const lakeM=new Uint8Array(N*N),riv=new Uint8Array(N*N);
 const inBox=c=>c.some(([lo,la])=>{const [gx,gy]=toG(lo,la);return gx>-5&&gy>-5&&gx<N+5&&gy<N+5});
 for(const f of lakes.features){if((f.properties.scalerank??9)>6)continue;if(!/^(Lake|Reservoir)$/.test(f.properties.featurecla||'Lake'))continue;const polys=f.geometry.type==='Polygon'?[f.geometry.coordinates]:f.geometry.coordinates;
  for(const p of polys){const ring=p[0];if(!inBox(ring))continue;const pts=ring.map(([lo,la])=>toG(lo,la));
   for(let j=0;j<N;j++){const yy=j+.5;const xs=[];for(let a=0,b=pts.length-1;a<pts.length;b=a++){const [ax,ay]=pts[a],[bx,by]=pts[b];if((ay>yy)!==(by>yy))xs.push(ax+(yy-ay)/(by-ay)*(bx-ax))}xs.sort((p,q)=>p-q);
    for(let k=0;k+1<xs.length;k+=2)for(let i=Math.max(0,Math.ceil(xs[k]-.5));i<=Math.min(N-1,Math.floor(xs[k+1]-.5));i++)lakeM[j*N+i]=1}}}
 const maxRank=M.span<20?7:M.span<45?5:4;
 for(const f of rivers.features){const pr=f.properties;if((pr.scalerank??9)>maxRank||pr.featurecla==='Lake Centerline')continue;const lines=f.geometry.type==='LineString'?[f.geometry.coordinates]:f.geometry.coordinates;
  for(const l of lines){if(!inBox(l))continue;for(let a=0;a+1<l.length;a++){const [ax,ay]=toG(...l[a]),[bx,by]=toG(...l[a+1]);const n=Math.ceil(Math.hypot(bx-ax,by-ay)*2)+1;
   for(let s=0;s<=n;s++){const gx=Math.floor(ax+(bx-ax)*s/n),gy=Math.floor(ay+(by-ay)*s/n);if(gx>=0&&gy>=0&&gx<N&&gy<N)riv[gy*N+gx]=Math.max(riv[gy*N+gx],10-(pr.scalerank??9))}}}}
 let land=0,mountain=0;for(let k=0;k<N*N;k++){if(lakeM[k]){water[k]=1;elev[k]=Math.min(elev[k],-2)}if(!water[k])land++;if(elev[k]>1500)mountain++}
 // vista previa para revisar (relieve sombreado + color + ríos)
 {const P=3,png=new PNG({width:N*P,height:N*P});for(let j=0;j<N*P;j++)for(let i=0;i<N*P;i++){const k=Math.floor(j/P)*N+Math.floor(i/P),o=(j*N*P+i)*4;let r,g,b;
  if(water[k]){r=30;g=70;b=120}else{const e=elev[k],ex=elev[k+1<N*N?k+1:k],sh=Math.max(.55,Math.min(1.35,1+(e-ex)/300));r=col[k*3]*sh;g=col[k*3+1]*sh;b=col[k*3+2]*sh;if(riv[k]){r=40;g=110;b=200}}
  png.data[o]=r;png.data[o+1]=g;png.data[o+2]=b;png.data[o+3]=255}fs.writeFileSync(path.join(geo,'preview_'+M.id+'.png'),PNG.sync.write(png))}
 const b64=a=>Buffer.from(a.buffer,a.byteOffset,a.byteLength).toString('base64');
 out[M.id]={name:M.name,n:N,lon:M.lon,lat:M.lat,elev:b64(elev),water:b64(water),riv:b64(riv),col:b64(col)};
 console.log(M.id.padEnd(13),'zoom',z,'teselas',got,'tierra',Math.round(land/N/N*100)+'%','montaña',Math.round(mountain/N/N*100)+'%','ríos',riv.reduce((a,v)=>a+(v>0),0))}
fs.writeFileSync(path.join(dir,'../web/maps_data.js'),'// Generado por tools/build_maps.mjs — relieve AWS Terrain Tiles (Mapzen), ríos/lagos Natural Earth, color NASA Blue Marble\nwindow.IMPERIA_MAPS='+JSON.stringify(out)+';\n');
console.log('→ web/maps_data.js');
