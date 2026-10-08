// Órdenes malformadas o maliciosas (como las que podría mandar un cliente en red): no deben romper ni desincronizar
const fs=require('fs'),vm=require('vm'),path=require('path');const SRC=fs.readFileSync(path.join(__dirname,'../web/game.js'),'utf8');
function fresh(){const c={Math,JSON,Date,Map,Set,Array,Object,Uint8Array,Int16Array,Int32Array,Float32Array,String,Number,Error,console};c.globalThis=c;vm.createContext(c);vm.runInContext(SRC,c);return c.Imperia}
const A=fresh(),B=fresh();const cfg={map:'continental',size:'small',mp:true,players:[{civ:'iberos',team:0,ai:false,name:'A'},{civ:'francos',team:1,ai:false,name:'B'},{civ:'teutones',team:1,ai:true}]};
A.newGame(Object.assign({},cfg,{me:0}),9);B.newGame(Object.assign({},cfg,{me:1}),9);
let s=1;const r=()=>{s=(s*48271)%2147483647;return s/2147483647};const pick=a=>a[Math.floor(r()*a.length)];
const junk=[null,undefined,-1,1e9,'x',{},[],NaN,Infinity,'__proto__',3.7];
const kinds=['right','amove','stop','stance','place','wall','queue','cancel','ungar','bell','market','drop','nada',null];
let errA=0,errB=0,cmds=0,div=-1;
for(let turn=0;turn<3000;turn++){const list=[];
 for(let k=0;k<3;k++){const G=A.G,ids=G.list.slice(0,60).map(e=>e.id);const c={c:pick(kinds)};
  for(const f of['ids','x','y','tgt','q','s','b','tx','ty','tiles','id','k','n','i','op','r','pl']){if(r()<.5)continue;
   const v=r();c[f]=v<.3?pick(junk):f==='ids'?[pick(ids),pick(junk),pick(ids)]:f==='tiles'?Array.from({length:Math.floor(r()*400)},()=>[Math.floor(r()*200)-50,Math.floor(r()*200)-50]):f==='b'?pick(Object.keys(A.B).concat(['foo'])):f==='k'?pick(['villager','age','t:wheel','t:nope','knight','foo']):f==='op'?pick(['buy','sell','x']):f==='r'?pick(['food','wood','gold','stone','x']):typeof pick([1,'a'])==='number'?Math.floor(r()*3000):pick(ids)}
  list.push([Math.floor(r()*2),c])}
 for(const [X,e] of[[A,'a'],[B,'b']]){for(const [pl,c] of list){try{X.exec(pl,c)}catch(err){if(e==='a')errA++;else errB++}}for(let t=0;t<3;t++){X.update(1/30);X.G.ev.length=0}}
 cmds+=list.length;if(A.hash()!==B.hash()){div=turn;break}}
console.log('órdenes',cmds,'excepciones A/B',errA,errB,'divergencia',div,'t',A.G.t.toFixed(0));
process.exit(div<0&&errA===errB?0:1);
