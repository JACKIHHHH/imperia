require('../web/game.js');
const fs=require('fs'),os=require('os'),path=require('path');
const I=globalThis.Imperia,T=I.T,{mkUnit,mkBld,applyTech}=I._dbg;
const G=I.newGame({map:'arabia',size:'medium',nAI:1,diff:'hard',civ:'francos'},777);
G.t=880;for(const p of G.players){p.age=2;p.res={food:2000,wood:2000,gold:2000,stone:2000}}
for(const t of ['forge','fletch','mail','masonry','barding','wheel'])applyTech(0,t);
G.ev.length=0;
const eb=G.bases[1],mb=G.bases[0];
// base enemiga: muralla con puerta, torres y ejército
const r=6,cx=eb.x+1,cy=eb.y+1,dir=Math.sign(mb.cx-eb.cx)||1,diry=Math.sign(mb.cy-eb.cy)||1;
const wx=cx+dir*r;for(let y=cy-r;y<=cy+r;y++){if(y===cy)mkBld('gate',1,wx,y,true);else if(I.canPlace('wall',wx,y,1))mkBld('wall',1,wx,y,true)}
const wy=cy+diry*r;for(let x=cx-r;x<=cx+r;x++)if(I.canPlace('palisade',x,wy,1))mkBld('palisade',1,x,wy,true);
for(const [dx,dy] of [[-3,3],[3,-3]])if(I.canPlace('tower',cx+dx*diry,cy+dy,1))mkBld('tower',1,cx+dx*diry,cy+dy,true);
for(const [t,n] of [['spear',6],['archer',6],['knight',3],['monk',2]])for(let k=0;k<n;k++)mkUnit(t,1,(cx+dir*2+(k%3))*T,(cy-2+k/3+(t==='archer'?2:0))*T);
mkBld('barracks',1,cx-dir*5,cy-4,true);mkBld('smith',1,cx-dir*5,cy+2,true);mkBld('monastery',1,cx-dir*1,cy+diry*3,true);
// mi ejército frente a la muralla
const ax=wx+dir*8,ay=cy;const add=(t,n,ox,oy)=>{for(let k=0;k<n;k++)mkUnit(t,0,(ax+ox+(k%4)*.8)*T,(ay+oy+Math.floor(k/4)*.8)*T)};
add('knight',8,0,-4);add('militia',8,1,0);add('archer',8,3,-1);add('ram',2,-1,3);add('mangonel',2,4,3);add('monk',3,5,-3);add('scout',2,2,-6);
mkBld('siege',0,ax+6,ay+6,true);mkBld('monastery',0,ax+6,ay-9,true);mkBld('stable',0,ax+10,ay-3,true);
for(let y=0;y<I.MH;y++)for(let x=0;x<I.MW;x++){if(Math.hypot(x-ax,y-ay)<20)G.exp[y*I.MW+x]=1}
G.ai[1].passive=true;G.ai[1].next=99999;
const etc=G.list.find(e=>e.owner===1&&e.type==='tc');I.formMove(G.list.filter(e=>e.owner===0&&e.kind==='unit'),etc.x,etc.y,true);
for(let i=0;i<30*9;i++){I.update(1/30)}G.ev.length=0;G.t=880;
const dirp=path.join(os.homedir(),'Library/Application Support/Imperia');
fs.writeFileSync(path.join(dirp,'slot2.json'),I.serialize());
fs.writeFileSync(path.join(dirp,'slot2meta.json'),JSON.stringify({date:new Date().toISOString(),t:G.t,civ:'francos',map:'arabia',size:'medium',diff:'hard',n:2,teams:'ffa',age:2}));
console.log('ok entidades',G.list.length,'mi ejército',G.list.filter(e=>e.owner===0&&e.kind==='unit').length,'enemigo',G.list.filter(e=>e.owner===1&&e.kind==='unit').length,'cam',ax,ay);
