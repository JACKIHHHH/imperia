// Genera una partida avanzada (IA contra IA) y la guarda en la ranura 3 de la app
require('../web/game.js');
const fs=require('fs'),os=require('os'),path=require('path');
const I=globalThis.Imperia;
const G=I.newGame({map:process.argv[3]||'continental',size:process.argv[4]||'medium',nAI:3,teams:'teams',diff:'hard',civ:'teutones'},4242);
G.players[0].ai=true;G.ai[0]={tick:1,next:420,wave:9,attacking:false};
const want=+process.argv[2]||1150;
for(let i=0;i<want*30;i++){I.update(1/30);G.ev.length=0;if(G.over)break}
G.players[0].ai=false;delete G.ai[0];
for(const e of G.list)if(e.owner===0&&e.kind==='unit'&&e.type!=='villager')e.o={t:'idle'};
const dir=path.join(os.homedir(),'Library/Application Support/Imperia');fs.mkdirSync(dir,{recursive:true});
fs.writeFileSync(path.join(dir,'slot3.json'),I.serialize());
const p=G.players[0];
fs.writeFileSync(path.join(dir,'slot3meta.json'),JSON.stringify({date:new Date().toISOString(),t:G.t,civ:p.civ,map:G.cfg.map,size:G.cfg.size,diff:G.cfg.diff,n:G.players.length,teams:G.cfg.teams,age:p.age}));
const c={};for(const e of G.list)if(!e.dead&&e.owner!=null)c[e.owner+':'+e.type]=(c[e.owner+':'+e.type]||0)+1;
console.log('t',(G.t/60).toFixed(1),'over',G.over,JSON.stringify(G.players.map(p=>[p.name,p.age,p.out,p.pop])));
console.log(Object.entries(c).filter(([k])=>k.startsWith('0:')).map(([k,v])=>k.slice(2)+'='+v).join(' '));
