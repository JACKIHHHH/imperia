import re,sys,os,urllib.request,html,time
sys.path.insert(0,os.path.dirname(__file__))
from gdlist import ls
# uso: gdget.py <folder_id> <destino> <patrón regex de nombre> [ruta de subcarpetas separada por />]
def find(fid,path):
    for part in [p for p in path.split('/') if p]:
        m=[i for d,i,n in ls(fid) if d and n==part]
        if not m: raise SystemExit('no existe '+part)
        fid=m[0]
    return fid
def get(fid,dst,pat):
    os.makedirs(dst,exist_ok=True)
    for d,i,n in ls(fid):
        if d: continue
        if not re.search(pat,n,re.I): continue
        out=os.path.join(dst,n)
        if os.path.exists(out) and os.path.getsize(out)>0: continue
        url='https://drive.usercontent.google.com/download?id=%s&export=download&confirm=t'%i
        for k in range(3):
            try:
                data=urllib.request.urlopen(url,timeout=120).read()
                if data[:15].lower().startswith(b'<!doctype html'): raise Exception('html')
                open(out,'wb').write(data);print('ok',n,len(data));break
            except Exception as e:
                print('reintento',n,e);time.sleep(2)
fid=find(sys.argv[1],sys.argv[4] if len(sys.argv)>4 else '')
get(fid,sys.argv[2],sys.argv[3])
