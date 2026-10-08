import re,sys,urllib.request,html
def ls(fid):
    h=urllib.request.urlopen("https://drive.google.com/embeddedfolderview?id="+fid,timeout=30).read().decode('utf8','ignore')
    out=[]
    for m in re.finditer(r'href="https://drive.google.com/(drive/folders|file/d)/([A-Za-z0-9_-]+)[^"]*".*?flip-entry-title">([^<]+)',h,re.S):
        out.append((m.group(1)=='drive/folders',m.group(2),html.unescape(m.group(3))))
    return out
def walk(fid,ind=0,depth=3):
    for isd,i,n in ls(fid):
        print('  '*ind+('[D] ' if isd else '')+n+('' if isd else '  '+i))
        if isd and ind<depth-1: walk(i,ind+1,depth)
if __name__=='__main__': walk(sys.argv[1],0,int(sys.argv[2]) if len(sys.argv)>2 else 3)
