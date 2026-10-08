require('../web/game.js');
const I=globalThis.Imperia,T=I.T;
const G=I.newGame({map:'arabia',size:'small',nAI:1,diff:'easy'},8);G.ai[1].passive=true;G.exp.fill(1);G.players[0].age=2;
const add=(type,owner,x,y)=>{const u={kind:'unit',type,owner,x:x*T,y:y*T,hp:I.U[type].hp,maxhp:I.U[type].hp,o:{t:'idle'},path:[],pi:0,gk:null,cd:0,dir:0,carry:{t:null,a:0},anim:0,scan:0,rp:0,r:I.U[type].r,faith:1,id:G.nid++};G.ents.set(u.id,u);G.list.push(u);return u};
const bx=G.bases[0].cx,by=G.bases[0].cy;
const monk=add('monk',0,bx+4,by+4),kn=add('knight',1,bx+7,by+7);
I.cmdRight([monk.id],kn.x,kn.y,kn);
for(let s=0;s<8;s++){for(let i=0;i<30;i++){I.update(1/30);G.ev.length=0}
console.log(s,'monk hp',monk.hp,'dead',!!monk.dead,JSON.stringify(monk.o),'faith',monk.faith,'| kn owner',kn.owner,'hp',kn.hp,'d',(Math.hypot(kn.x-monk.x,kn.y-monk.y)/T).toFixed(2))}
const etc=G.list.find(e=>e.owner===1&&e.type==='tc');const ram=add('ram',0,etc.x/T-2.5,etc.y/T);
console.log('cmd',I.cmdRight([ram.id],etc.x,etc.y,etc),JSON.stringify(ram.o),'tc',etc.hp);
for(let s=0;s<5;s++){for(let i=0;i<30;i++){I.update(1/30);G.ev.length=0}
console.log(s,'ram',(ram.x/T).toFixed(2),(ram.y/T).toFixed(2),ram.hp,JSON.stringify(ram.o),'path',ram.path.length,ram.gk,'dist',(I.entDist(ram,etc)/T).toFixed(2),'tc',etc.hp.toFixed(0),'dead',!!ram.dead)}
