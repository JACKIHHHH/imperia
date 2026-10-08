# Imperia — empaqueta texturas de suelo (ambientCG, CC0) a 512px → web/terrain_data.js
# Uso: python3 tools/pack_terrain.py [carpeta_texturas]   (requiere Pillow)
import sys,os,io,base64,json
from PIL import Image
here=os.path.dirname(os.path.abspath(__file__))
src=sys.argv[1] if len(sys.argv)>1 else os.path.join(here,'../assets_src/textures')
SEL={'grass':'Grass004','lush':'Grass001','dirt':'Ground003','arid':'Ground054','desert':'Ground026','sand':'Ground080','rock':'Rock030','snow':'Snow006'}
out={}
for k,n in SEL.items():
  im=Image.open(os.path.join(src,n,n+'_1K-JPG_Color.jpg')).convert('RGB').resize((512,512),Image.LANCZOS)
  b=io.BytesIO();im.save(b,'JPEG',quality=82,optimize=True);out[k]='data:image/jpeg;base64,'+base64.b64encode(b.getvalue()).decode()
im=Image.open(os.path.join(src,'Rock030','Rock030_1K-JPG_NormalGL.jpg')).convert('RGB').resize((512,512),Image.LANCZOS)
b=io.BytesIO();im.save(b,'JPEG',quality=85);out['rockN']='data:image/jpeg;base64,'+base64.b64encode(b.getvalue()).decode()
js='// Generado por tools/pack_terrain.py — texturas ambientCG (CC0)\nwindow.IMPERIA_TERRAIN='+json.dumps(out)+';\n'
open(os.path.join(here,'../web/terrain_data.js'),'w').write(js);print('terrain_data.js',round(len(js)/1024),'KB')
