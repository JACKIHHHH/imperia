# Crea un .ico de Windows con varias resoluciones (PNG incrustados) a partir de PNG ya escalados. Uso: make_ico.py salida.ico a.png b.png ...
import struct,sys
out=sys.argv[1];imgs=[open(p,'rb').read() for p in sys.argv[2:]]
def dims(b):w,h=struct.unpack('>II',b[16:24]);return w,h
hdr=struct.pack('<HHH',0,1,len(imgs));off=6+16*len(imgs);ent=b'';data=b''
for b in imgs:
  w,h=dims(b);ent+=struct.pack('<BBBBHHII',w%256,h%256,0,0,1,32,len(b),off+len(data));data+=b
open(out,'wb').write(hdr+ent+data)
