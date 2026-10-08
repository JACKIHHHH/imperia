// Guardar y cargar en mapas reales y normales: la partida cargada sigue igual que la original (misma huella tras 3 min)
const fs=require('fs'),vm=require('vm'),path=require('path');
const SRC=fs.readFileSync(path.join(__dirname,'../web/game.js'),'utf8'),MD=fs.readFileSync(path.join(__dirname,'../web/maps_data.js'),'utf8');
function fresh(){const ctx={Math,JSON,Date,Map,Set,Array,Object,Uint8Array,Int8Array,Int16Array,Int32Array,Uint16Array,Float32Array,String,Number,Error,console,Buffer};ctx.globalThis=ctx;ctx.window=ctx;vm.createContext(ctx);vm.runInContext(MD,ctx);vm.runInContext(SRC.replace('})(window);','})(globalThis);').replace('})(this);','})(globalThis);'),ctx);return ctx.Imperia}
let fails=0;const ok=(c,m)=>{if(!c){fails++;console.log('  ✗ FALLO:',m)}else console.log('  ✓',m)};
for(const map of['iberia','africa','continental','islas']){const A=fresh();const G=A.newGame({map,size:'small',nAI:1,diff:'normal'},21);G.players[0].ai=true;G.ai[0]={tick:1,next:300,wave:7,attacking:false};
 for(let k=0;k<30*60*4;k++)A.update(1/30);A.exec(0,{c:'autofarm',on:false});const s=A.serialize();
 const B=fresh();const G2=B.deserialize(s);
 ok((G2.real||null)===(G.real||null)&&G2.players[0].autoFarm===false&&G2.list.length===G.list.filter(e=>!e.dead).length,`${map.padEnd(11)} carga: mapa real ${G2.real||'-'} resembrado ${G2.players[0].autoFarm} entidades ${G2.list.length} tamaño ${(s.length/1024)|0} KB`);
 const A2=fresh();A2.deserialize(s);for(let k=0;k<30*60*3;k++){A2.update(1/30);B.update(1/30)}ok(A2.hash()===B.hash(),`${map.padEnd(11)} dos cargas del mismo guardado siguen idénticas 3 min (hash ${B.hash()})`)}
console.log(fails?'\nFALLOS: '+fails:'\nTODO CORRECTO');process.exit(fails?1:0);
