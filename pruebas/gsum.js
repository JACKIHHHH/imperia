// resumen de un glTF: mallas, materiales, huesos y animaciones
const fs=require('fs');
for(const f of process.argv.slice(2)){const j=JSON.parse(fs.readFileSync(f,'utf8'));
 const acc=j.accessors||[];
 const meshes=(j.meshes||[]).map(m=>m.name+'['+m.primitives.map(p=>(acc[p.attributes.POSITION]||{}).count+'v m'+p.material+(p.attributes.JOINTS_0!=null?' skin':'')).join(',')+']');
 const mats=(j.materials||[]).map(m=>m.name+':'+((m.pbrMetallicRoughness||{}).baseColorFactor||[]).map(v=>v.toFixed(2)).join('/')+((m.pbrMetallicRoughness||{}).baseColorTexture?' TEX':''));
 const skins=(j.skins||[]).map(s=>s.joints.length);
 const anims=(j.animations||[]).map(a=>{let mx=0;for(const s of a.samplers){const c=acc[s.input];if(c&&c.max)mx=Math.max(mx,c.max[0])}return a.name+'('+mx.toFixed(2)+')'});
 console.log('###',f.split('/').pop(),'| nodes',j.nodes.length,'| skins',skins.join(','),'| images',(j.images||[]).length);
 console.log(' mallas:',meshes.join(' '));console.log(' materiales:',mats.join(' '));console.log(' anims:',anims.join(' '))}
