// Imperia — audio sintetizado: música procedural (modo dórico) y efectos.
(function(root){
'use strict';
let AC=null,master,mus,fx,rev,noiseBuf,musicOn=false,timer=null,nextT=0,step=0,chordI=0,tension=0,melo=4;
const vol={music:.55,sfx:.8};const last={};
function init(){if(AC){if(AC.state==='suspended')AC.resume();return}
 try{AC=new(root.AudioContext||root.webkitAudioContext)()}catch(e){return}
 master=AC.createGain();master.gain.value=1;master.connect(AC.destination);
 mus=AC.createGain();fx=AC.createGain();mus.connect(master);fx.connect(master);apply();
 // reverberación sencilla para la música
 const len=AC.sampleRate*2.2,ir=AC.createBuffer(2,len,AC.sampleRate);for(let c=0;c<2;c++){const d=ir.getChannelData(c);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,2.6)}
 rev=AC.createConvolver();rev.buffer=ir;const rg=AC.createGain();rg.gain.value=.32;rev.connect(rg).connect(mus);
 const nl=AC.sampleRate;noiseBuf=AC.createBuffer(1,nl,AC.sampleRate);const nd=noiseBuf.getChannelData(0);for(let i=0;i<nl;i++)nd[i]=Math.random()*2-1}
function apply(){if(!AC)return;mus.gain.value=vol.music*.9;fx.gain.value=vol.sfx}
function setVolumes(m,s){vol.music=m;vol.sfx=s;apply()}
const mtof=m=>440*Math.pow(2,(m-69)/12);
function tone(f,d,type,v,o){o=o||{};const t=AC.currentTime+(o.delay||0),os=AC.createOscillator(),g=AC.createGain();os.type=type;os.frequency.setValueAtTime(f,t);if(o.f2)os.frequency.exponentialRampToValueAtTime(o.f2,t+d);
 g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+(o.a||.008));g.gain.exponentialRampToValueAtTime(.0001,t+d);let n=os.connect(g);
 if(o.lp){const f2=AC.createBiquadFilter();f2.type='lowpass';f2.frequency.value=o.lp;n=g.connect(f2)}n.connect(o.dest||fx);os.start(t);os.stop(t+d+.05)}
function noise(d,v,freq,o){o=o||{};const t=AC.currentTime+(o.delay||0),s=AC.createBufferSource();s.buffer=noiseBuf;s.loop=true;const f=AC.createBiquadFilter();f.type=o.type||'bandpass';f.frequency.setValueAtTime(freq,t);if(o.f2)f.frequency.exponentialRampToValueAtTime(o.f2,t+d);f.Q.value=o.q||1.1;
 const g=AC.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+(o.a||.004));g.gain.exponentialRampToValueAtTime(.0001,t+d);s.connect(f).connect(g).connect(o.dest||fx);s.start(t,Math.random()*.5);s.stop(t+d+.05)}
function sfx(k,v){if(!AC||vol.sfx<=0)return;v=v==null?1:v;const now=AC.currentTime,gap={hit:.07,shoot:.09,chop:.05,mine:.05,farm:.08,forage:.08,build:.05,die:.12,lob:.2,impact:.15,gun:.05,mg:.12,cannon:.2,rocket:.15,laser:.06,plasma:.08,boom:.12}[k]||.04;if(last[k]&&now-last[k]<gap)return;last[k]=now;
 switch(k){
 case'click':tone(720,.05,'triangle',.04*v);break;case'hover':tone(1320,.03,'sine',.018*v);tone(1980,.02,'sine',.008*v);break;
 case'cmd':tone(470,.07,'triangle',.045*v,{f2:640});break;
 case'train':tone(523,.12,'sine',.06*v);tone(784,.22,'sine',.05*v,{delay:.08});break;
 case'built':tone(392,.16,'triangle',.06*v);tone(587,.28,'triangle',.05*v,{delay:.1});noise(.1,.15*v,900,{delay:.02});break;
 case'tech':[523,659,880].forEach((f,i)=>tone(f,.45,'sine',.045*v,{delay:i*.09}));break;
 case'place':noise(.14,.3*v,420);break;
 case'age':[392,494,587,784].forEach((f,i)=>tone(f,.8,'sine',.05*v,{delay:i*.14}));[196,294].forEach(f=>tone(f,1.6,'triangle',.03*v,{a:.3}));break;
 case'alert':tone(330,.25,'square',.03*v,{lp:1800});tone(247,.42,'square',.03*v,{delay:.24,lp:1800});break;
 case'err':tone(210,.14,'sawtooth',.025*v,{f2:150,lp:1200});break;
 case'convert':[587,740,880,1175].forEach((f,i)=>tone(f,.7,'sine',.035*v,{delay:i*.11}));noise(.9,.05*v,5000,{type:'highpass',a:.2});break;
 case'hit':noise(.07,.16*v,2400,{q:.8});tone(1300+Math.random()*500,.12,'triangle',.022*v);break;
 case'ram':tone(95,.3,'sine',.14*v,{f2:55});noise(.18,.2*v,300,{type:'lowpass'});break;
 case'shoot':noise(.14,.08*v,3800,{f2:1400,q:.7});break;
 case'gun':noise(.09,.22*v,1800,{type:'lowpass',f2:500});noise(.03,.16*v,5200,{type:'highpass'});tone(110,.08,'square',.03*v,{f2:60,lp:900});break;
 case'mg':for(let i=0;i<3;i++)noise(.05,.16*v,2200,{type:'lowpass',f2:600,delay:i*.07});break;
 case'cannon':noise(.7,.3*v,420,{type:'lowpass',f2:90});tone(58,.55,'sine',.14*v,{f2:34});break;
 case'rocket':noise(.8,.14*v,1400,{f2:400,a:.05});tone(220,.5,'sawtooth',.02*v,{f2:90,lp:1200});break;
 case'laser':tone(1900,.18,'sawtooth',.03*v,{f2:380,lp:5000});tone(950,.22,'sine',.03*v,{f2:240});break;
 case'plasma':tone(420,.35,'square',.025*v,{f2:1200,lp:2600});noise(.25,.06*v,3000,{type:'highpass'});break;
 case'boom':noise(.9,.3*v,380,{type:'lowpass',f2:70});tone(48,.8,'sine',.14*v,{f2:30});break;
 case'lob':tone(140,.22,'triangle',.06*v,{f2:90});noise(.2,.08*v,700);break;
 case'impact':noise(.55,.22*v,500,{type:'lowpass',f2:120});tone(70,.4,'sine',.1*v,{f2:40});break;
 case'chop':noise(.05,.28*v,780,{q:2});tone(190,.09,'triangle',.05*v,{f2:120});break;
 case'mine':tone(1650+Math.random()*200,.16,'sine',.04*v);tone(2480,.1,'sine',.02*v);noise(.03,.1*v,3000);break;
 case'farm':noise(.14,.06*v,2600,{f2:1400,q:.6});break;
 case'forage':noise(.09,.05*v,4200,{type:'highpass'});break;
 case'build':tone(230,.07,'square',.03*v,{lp:1400});noise(.05,.14*v,1300);break;
 case'die':tone(210,.25,'triangle',.035*v,{f2:120});noise(.12,.08*v,400);break;
 case'collapse':noise(1.3,.28*v,420,{type:'lowpass',f2:80,a:.02});tone(55,1,'sine',.1*v,{f2:35});break;
 case'win':[523,659,784,1046].forEach((f,i)=>tone(f,1,'sine',.06*v,{delay:i*.17}));break;
 case'lose':[392,330,262].forEach((f,i)=>tone(f,1.1,'sine',.06*v,{delay:i*.26}));break}}
// música: pad + laúd + tambor de marco, en re dórico
const SCALE=[62,64,65,67,69,71,72,74,76,77,79,81];
const PROG=[{r:50,n:[0,3,7]},{r:48,n:[0,4,7]},{r:43,n:[0,4,7]},{r:50,n:[0,3,7]},{r:45,n:[0,3,7]},{r:48,n:[0,4,7]},{r:41,n:[0,4,7]},{r:45,n:[0,4,7]}];
function pad(t,ch,dur){for(const iv of ch.n){for(const det of[-6,6]){const o=AC.createOscillator(),g=AC.createGain(),f=AC.createBiquadFilter();o.type='sawtooth';o.frequency.value=mtof(ch.r+12+iv);o.detune.value=det;f.type='lowpass';f.frequency.value=620;
 g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.016,t+1.4);g.gain.setValueAtTime(.016,t+dur-1.2);g.gain.linearRampToValueAtTime(0,t+dur+.6);o.connect(f).connect(g);g.connect(mus);g.connect(rev);o.start(t);o.stop(t+dur+.7)}}
 const b=AC.createOscillator(),bg=AC.createGain();b.type='sine';b.frequency.value=mtof(ch.r);bg.gain.setValueAtTime(0,t);bg.gain.linearRampToValueAtTime(.05,t+.8);bg.gain.linearRampToValueAtTime(0,t+dur+.4);b.connect(bg).connect(mus);b.start(t);b.stop(t+dur+.5)}
function pluck(t,m,v){const o=AC.createOscillator(),o2=AC.createOscillator(),g=AC.createGain(),f=AC.createBiquadFilter();o.type='triangle';o2.type='sawtooth';o.frequency.value=mtof(m);o2.frequency.value=mtof(m)*2.001;
 f.type='lowpass';f.frequency.setValueAtTime(3200,t);f.frequency.exponentialRampToValueAtTime(600,t+.5);const g2=AC.createGain();g2.gain.value=.25;
 g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.005);g.gain.exponentialRampToValueAtTime(.0001,t+1.1);o.connect(f);o2.connect(g2).connect(f);f.connect(g);g.connect(mus);g.connect(rev);o.start(t);o2.start(t);o.stop(t+1.2);o2.stop(t+1.2)}
function drum(t,v,hi){const o=AC.createOscillator(),g=AC.createGain();o.type='sine';o.frequency.setValueAtTime(hi?180:95,t);o.frequency.exponentialRampToValueAtTime(hi?110:48,t+.2);g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+.3);o.connect(g).connect(mus);o.start(t);o.stop(t+.35);
 if(hi){const s=AC.createBufferSource();s.buffer=noiseBuf;const f=AC.createBiquadFilter();f.type='bandpass';f.frequency.value=1800;const ng=AC.createGain();ng.gain.setValueAtTime(v*.5,t);ng.gain.exponentialRampToValueAtTime(.0001,t+.09);s.connect(f).connect(ng).connect(mus);s.start(t);s.stop(t+.1)}}
function schedule(){const spb=60/(tension>0?96:72)/2;
 while(nextT<AC.currentTime+.6){const t=nextT,s=step%16;
  if(s===0){if(step%32===0){chordI=(chordI+1)%PROG.length}const ch=PROG[chordI];if(step%32===0)pad(t,ch,spb*32);
   if(Math.random()<.5){ch.n.forEach((iv,i)=>pluck(t+i*spb*.5,ch.r+24+iv,.03))}}
  const ch=PROG[chordI];
  if(s%8===0)drum(t,tension>0?.2:.12,false);if(s%8===6&&Math.random()<.6)drum(t,tension>0?.12:.06,false);if(tension>0&&s%4===2)drum(t,.08,true);
  if(Math.random()<(tension>0?.6:.42)&&!(s%2&&Math.random()<.5)){melo+=Math.round((Math.random()-.5)*3.2);if(melo<0)melo=1;if(melo>SCALE.length-1)melo=SCALE.length-2;
   let m=SCALE[melo];if(s%4===0){const tones=ch.n.map(iv=>ch.r+24+iv);m=tones.reduce((a,b)=>Math.abs(b-m)<Math.abs(a-m)?b:a)}
   pluck(t,m,.05+Math.random()*.02)}
  nextT+=spb;step++}
 if(tension>0)tension-=.2}
function startMusic(){if(!AC||musicOn)return;musicOn=true;nextT=AC.currentTime+.2;step=0;timer=setInterval(()=>{if(AC.state==='running')schedule()},200)}
function stopMusic(){musicOn=false;clearInterval(timer)}
function setTension(sec){tension=Math.max(tension,sec)}
root.ImperiaAudio={init,sfx,setVolumes,startMusic,stopMusic,setTension,get ready(){return!!AC}};
})(window);
