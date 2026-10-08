// Imperia para Windows (y cualquier sistema con Electron): ventana, partidas guardadas y red local.
// Reproduce el puente nativo de la versión de Mac (main.swift) para que el juego web funcione sin cambios.
const {app,BrowserWindow,ipcMain,Menu,powerSaveBlocker}=require('electron');
const path=require('path'),fs=require('fs'),net=require('net'),os=require('os');
let Bonjour=null;try{Bonjour=require('bonjour-service').Bonjour}catch(e){}

app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-background-timer-throttling');

// datos internos del navegador aparte de las partidas guardadas (que van en …/Imperia)
app.setPath('userData',path.join(app.getPath('appData'),'Imperia','Chromium'));

let win=null;
const WINDOWED=!!process.env.IMPERIA_WINDOWED;
const js=s=>{if(win&&!win.isDestroyed())win.webContents.executeJavaScript(s).catch(()=>{})};

function createWindow(){
 Menu.setApplicationMenu(null);
 win=new BrowserWindow({width:1440,height:900,minWidth:1024,minHeight:640,backgroundColor:'#07080a',title:'Imperia',show:false,fullscreen:!WINDOWED,autoHideMenuBar:true,
  icon:path.join(__dirname,'icon.png'),
  webPreferences:{preload:path.join(__dirname,'preload.js'),contextIsolation:true,nodeIntegration:false,sandbox:true,backgroundThrottling:false,spellcheck:false}});
 win.once('ready-to-show',()=>win.show());
 win.loadFile(path.join(__dirname,'web','index.html'));
 // F11 o Alt+Intro: pantalla completa; Ctrl+Mayús+I: herramientas de depuración
 win.webContents.on('before-input-event',(e,inp)=>{if(inp.type!=='keyDown')return;
  if(inp.key==='F11'||(inp.alt&&inp.key==='Enter')){win.setFullScreen(!win.isFullScreen());e.preventDefault()}
  if(inp.control&&inp.shift&&(inp.key==='I'||inp.key==='i'))win.webContents.toggleDevTools()});
 // los mensajes de consola salen por la salida estándar (pruebas automáticas)
 win.webContents.on('console-message',(ev,level,msg)=>{const m=typeof level==='object'?level.message:msg;process.stdout.write('[web] log: '+m+'\n')});
 win.webContents.on('did-finish-load',()=>{const ev=process.env.IMPERIA_EVAL;if(ev)setTimeout(()=>js(ev),2000)});
 win.webContents.setWindowOpenHandler(()=>({action:'deny'}));
 win.on('closed',()=>{win=null;lan.closeAll()});
}

// ---------- partidas guardadas y opciones: %APPDATA%\Imperia (Windows) · ~/Library/Application Support/Imperia (Mac)
const storeDir=path.join(app.getPath('appData'),'Imperia');
function handleStore(m){if(!m||typeof m.id!=='number'||typeof m.op!=='string'||typeof m.key!=='string')return;
 const key=[...m.key].filter(c=>/[\p{L}\p{N}_]/u.test(c)).join('').slice(0,40);const file=path.join(storeDir,key+'.json');let reply='null';
 try{fs.mkdirSync(storeDir,{recursive:true});
  if(m.op==='write'&&typeof m.data==='string'){const tmp=file+'.tmp';fs.writeFileSync(tmp,m.data,'utf8');fs.renameSync(tmp,file);reply='true'}
  else if(m.op==='read'&&fs.existsSync(file))reply=JSON.stringify(fs.readFileSync(file,'utf8'))}
 catch(e){reply=m.op==='write'?'false':'null'}
 js(`window.__storeReply(${m.id},${reply})`)}

// ---------- red local: servidor TCP, mensajes JSON por líneas, anuncio y búsqueda Bonjour (_imperia._tcp, compatible con la versión de Mac)
const lan={srv:null,conns:new Map(),bufs:new Map(),next:1,bj:null,pub:null,browser:null,found:new Map(),awake:null,
 emit(o){js(`window.__net&&window.__net(${JSON.stringify(o)})`)},
 keepAwake(on){if(on&&this.awake==null)this.awake=powerSaveBlocker.start('prevent-app-suspension');if(!on&&this.awake!=null){powerSaveBlocker.stop(this.awake);this.awake=null}},
 bonjour(){if(!Bonjour)return null;if(!this.bj)try{this.bj=new Bonjour()}catch(e){this.bj=null}return this.bj},
 closeAll(){this.keepAwake(false);if(this.pub){try{this.pub.stop()}catch(e){}this.pub=null}if(this.srv){try{this.srv.close()}catch(e){}this.srv=null}
  this.stopBrowse();for(const s of this.conns.values())s.destroy();this.conns.clear();this.bufs.clear()},
 stopBrowse(){if(this.browser){try{this.browser.stop()}catch(e){}this.browser=null}},
 adopt(sock){const id=this.next++;this.conns.set(id,sock);this.bufs.set(id,'');sock.setNoDelay(true);sock.setEncoding('utf8');
  const open=()=>this.emit({type:'open',id,addr:(sock.remoteAddress||'').replace(/^::ffff:/,'')});
  if(sock.connecting)sock.once('connect',open);else open();
  sock.on('data',d=>{let b=(this.bufs.get(id)||'')+d,i;while((i=b.indexOf('\n'))>=0){const line=b.slice(0,i);b=b.slice(i+1);if(line)this.emit({type:'msg',id,data:line})}this.bufs.set(id,b)});
  let gone=false;const drop=why=>{if(gone)return;gone=true;this.conns.delete(id);this.bufs.delete(id);this.emit({type:'close',id,why:why||''})};
  sock.on('error',e=>drop(e.message));sock.on('close',()=>drop(''));return id},
 host(name,port){this.closeAll();const srv=net.createServer(s=>this.adopt(s));this.srv=srv;
  srv.on('error',e=>this.emit({type:'error',msg:`No se pudo abrir el puerto ${port}: ${e.message}`}));
  srv.listen(port,'0.0.0.0',()=>{this.emit({type:'hosted',port,ips:localIPs()});const bj=this.bonjour();if(bj)try{this.pub=bj.publish({name,type:'imperia',protocol:'tcp',port})}catch(e){}});
  this.keepAwake(true)},
 join(host,port){this.closeAll();const s=net.connect({host,port});s.setTimeout(6000,()=>{if(s.connecting)s.destroy(new Error('Tiempo de espera agotado'))});s.once('connect',()=>s.setTimeout(0));this.adopt(s);this.keepAwake(true)},
 joinService(name){const sv=this.found.get(name);if(!sv){this.emit({type:'error',msg:'Partida no encontrada: '+name});return}
  const ip=(sv.addresses||[]).find(a=>/^\d+\.\d+\.\d+\.\d+$/.test(a))||sv.host;this.join(ip,sv.port)},
 browse(){this.stopBrowse();const bj=this.bonjour();if(!bj){this.emit({type:'error',msg:'Búsqueda automática no disponible: únete por IP'});return}
  this.found.clear();const upd=()=>this.emit({type:'peers',list:[...this.found.keys()]});
  try{this.browser=bj.find({type:'imperia',protocol:'tcp'});this.browser.on('up',s=>{this.found.set(s.name,s);upd()});this.browser.on('down',s=>{this.found.delete(s.name);upd()});upd()}
  catch(e){this.emit({type:'error',msg:'Búsqueda en la red: '+e.message})}},
 write(id,s){const c=this.conns.get(id);if(c&&!c.destroyed)c.write(s+'\n')},
 handle(m){if(!m||typeof m.op!=='string')return;switch(m.op){
  case'host':return this.host(String(m.name||'Imperia'),+m.port||47800);
  case'join':return this.join(String(m.host||'127.0.0.1'),+m.port||47800);
  case'joinService':return this.joinService(String(m.name||''));
  case'browse':return this.browse();
  case'stopBrowse':return this.stopBrowse();
  case'send':return this.write(m.id,String(m.data));
  case'broadcast':for(const id of this.conns.keys())this.write(id,String(m.data));return;
  case'kick':{const c=this.conns.get(m.id);if(c)c.destroy();return}
  case'close':return this.closeAll();
  case'ips':return this.emit({type:'ips',ips:localIPs()})}}};
function localIPs(){const out=[];for(const [n,list] of Object.entries(os.networkInterfaces()))for(const a of list||[]){if(a.family==='IPv4'&&!a.internal&&!/^169\.254\./.test(a.address)&&!/vEthernet|VirtualBox|VMware|WSL|Hyper-V/i.test(n))out.push(a.address)}return out}

ipcMain.on('imp',(ev,name,m)=>{
 if(name==='store')return handleStore(m);
 if(name==='net')return lan.handle(m);
 if(name==='nativeApp'&&m){if(m.cmd==='quit')return app.quit();if(m.cmd==='fullscreen'&&win)return win.setFullScreen(!win.isFullScreen())}});

app.whenReady().then(createWindow);
app.on('window-all-closed',()=>{lan.closeAll();if(lan.bj)try{lan.bj.destroy()}catch(e){}app.quit()});
