// Genera las voces del juego con ElevenLabs (multilingüe v2, español) → web/voces/*.mp3 + web/voces/index.js
// Uso:  ELEVENLABS_API_KEY=tu_clave node tools/voces.mjs      (opcional: VOZ_narrador=<voice_id> para cambiar una voz)
// Los audios ya generados no se vuelven a pedir (borra un .mp3 para regenerarlo).
import fs from 'fs';import path from 'path';import crypto from 'crypto';
const dir=path.dirname(new URL(import.meta.url).pathname),out=path.join(dir,'../web/voces');fs.mkdirSync(out,{recursive:true});
const key=process.env.ELEVENLABS_API_KEY;if(!key){console.error('Falta ELEVENLABS_API_KEY. Ejemplo: ELEVENLABS_API_KEY=xxxx node tools/voces.mjs');process.exit(1)}
const cfg=JSON.parse(fs.readFileSync(path.join(dir,'voces.json'),'utf8'));const map={};let n=0,err=0;
const settings={narrador:{stability:.55,similarity_boost:.8,style:.35},futuro:{stability:.7,similarity_boost:.7,style:.1}};
for(const f of cfg.frases){const vid=process.env['VOZ_'+f.voz]||cfg.voces[f.voz];const id=f.voz+'_'+crypto.createHash('md5').update(f.voz+'|'+f.texto).digest('hex').slice(0,10);const file=path.join(out,id+'.mp3');
 map[f.texto+'|'+f.voz]=id+'.mp3';if(!map[f.texto])map[f.texto]=id+'.mp3';
 if(fs.existsSync(file)&&fs.statSync(file).size>1000){n++;continue}
 const r=await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${vid}?output_format=mp3_44100_128`,{method:'POST',headers:{'xi-api-key':key,'content-type':'application/json',accept:'audio/mpeg'},
  body:JSON.stringify({text:f.texto,model_id:'eleven_multilingual_v2',voice_settings:Object.assign({stability:.45,similarity_boost:.8,style:.25,use_speaker_boost:true},settings[f.voz]||{})})});
 if(!r.ok){err++;console.error('ERROR',r.status,f.texto,(await r.text()).slice(0,200));if(r.status===401)process.exit(1);continue}
 fs.writeFileSync(file,Buffer.from(await r.arrayBuffer()));n++;console.log('ok',f.voz.padEnd(9),f.texto)}
fs.writeFileSync(path.join(out,'index.js'),'// Generado por tools/voces.mjs (ElevenLabs)\nwindow.IMPERIA_VOCES='+JSON.stringify(map)+';\n');
console.log(`\n${n} audios listos${err?`, ${err} errores`:''} → web/voces. Recompila con ./build.sh`);
