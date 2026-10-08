// Imperia (Windows/Electron): misma interfaz nativa que la app de Mac (window.webkit.messageHandlers.*)
const {contextBridge,ipcRenderer}=require('electron');
const h=name=>({postMessage:m=>ipcRenderer.send('imp',name,m)});
contextBridge.exposeInMainWorld('webkit',{messageHandlers:{store:h('store'),net:h('net'),nativeApp:h('nativeApp')}});
contextBridge.exposeInMainWorld('IMPERIA_PLATFORM','windows');
