// Resembrado automático de granjas: al agotarse, el granjero la vuelve a plantar en el mismo sitio y la sigue cultivando
const fs=require('fs'),vm=require('vm'),path=require('path');
const SRC=fs.readFileSync(path.join(__dirname,'../web/game.js'),'utf8');
function fresh(){const ctx={Math,JSON,Date,Map,Set,Array,Object,Uint8Array,Int8Array,Int16Array,Int32Array,Uint16Array,Float32Array,String,Number,Error,console,Buffer};ctx.globalThis=ctx;ctx.window=ctx;vm.createContext(ctx);vm.runInContext(SRC.replace('})(window);','})(globalThis);').replace('})(this);','})(globalThis);'),ctx);return ctx.Imperia}
let fails=0;const ok=(c,m)=>{if(!c){fails++;console.log('  ✗ FALLO:',m)}else console.log('  ✓',m)};
function run(auto){const I=fresh(),T=I.T;const G=I.newGame({map:'arabia',size:'small',nAI:1,diff:'easy'},5);const p=G.players[0],b=G.bases[0];
 if(!auto)I.exec(0,{c:'autofarm',on:false});
 let fx=-1,fy=-1;for(let r=3;r<12&&fx<0;r++)for(let dy=-r;dy<=r&&fx<0;dy++)for(let dx=-r;dx<=r;dx++){if(I.canPlace('farm',b.x+dx,b.y+dy,0)){fx=b.x+dx;fy=b.y+dy;break}}
 const f=I._dbg.mkBld('farm',0,fx,fy,true);f.amt=30;f.max=30;
 const v=G.ul.find(e=>e.owner===0&&e.type==='villager');for(const o of G.ul)if(o.owner===0&&o!==v)I._dbg.order(o,{t:'idle'});
 I.exec(0,{c:'right',ids:[v.id],x:f.x,y:f.y,tgt:f.id});p.res.wood=500;
 let reseeded=null;for(let k=0;k<30*120;k++){I.update(1/30);if(!reseeded){const nf=G.bl.find(e=>!e.dead&&e.type==='farm'&&e.owner===0&&e.id!==f.id&&e.tx===fx&&e.ty===fy);if(nf)reseeded={nf,wood:p.res.wood,t:G.t}}}
 const nf=reseeded&&reseeded.nf;return{f,nf,reseeded,v,p,G}}
const A=run(true);
ok(A.f.dead,'la granja original se agota');
ok(!!A.nf,'se vuelve a plantar en el mismo sitio');
ok(A.reseeded&&A.reseeded.wood===440,'cuesta 60 de madera (quedan '+(A.reseeded&&A.reseeded.wood)+')');
ok(A.nf&&A.nf.bp>=1,'el granjero la construye');
ok(A.nf&&A.nf.amt<A.nf.max,'y la sigue cultivando (comida '+(A.nf&&A.nf.amt)+'/'+(A.nf&&A.nf.max)+')');
const B=run(false);
ok(B.f.dead&&!B.nf,'con el resembrado desactivado no se replanta');
const C=(()=>{const I=fresh();const G=I.newGame({map:'arabia',size:'small',nAI:1,diff:'easy'},5);return I.exec(0,{c:'autofarm',on:'x'})})();
ok(C===false,'orden mal formada rechazada');
console.log(fails?'\nFALLOS: '+fails:'\nTODO CORRECTO');process.exit(fails?1:0);
