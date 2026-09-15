"""Import Illustrator's PDF-compatible artwork; never save the AI originals.

Requires PyMuPDF and Pillow. Run with --source PATH --output PATH.
The review JSON records detected photo areas for every artboard.
"""
import argparse, base64, hashlib, io, json, math, re, sys
from pathlib import Path
import xml.etree.ElementTree as ET
try:
    import pymupdf as fitz
except ImportError:
    sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'.tmp-photocanvas/python-deps'))
    import pymupdf as fitz

SVG='http://www.w3.org/2000/svg'; XL='http://www.w3.org/1999/xlink'; INK='http://www.inkscape.org/namespaces/inkscape'
ET.register_namespace('',SVG);ET.register_namespace('xlink',XL)
I=(1,0,0,1,0,0)
def mul(a,b):
    return (a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5])
def inv(m):
    a,b,c,d,e,f=m;det=a*d-b*c
    return(d/det,-b/det,-c/det,a/det,(c*f-d*e)/det,(b*e-a*f)/det)
def point(m,p):return(m[0]*p[0]+m[2]*p[1]+m[4],m[1]*p[0]+m[3]*p[1]+m[5])
def matrix(s):
    if not s:return I
    m=re.fullmatch(r'matrix\(([^)]+)\)',s)
    if not m:raise ValueError('Unsupported transform '+s)
    return tuple(map(float,re.findall(r'[-+]?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?',m[1])))
def polygon(s):
    # MuPDF emits absolute M/L/H/V for Illustrator rectangle/quad clipping paths.
    if re.search('[CcQqSsTtAa]',s):return None
    tokens=re.findall(r'[A-Za-z]|[-+]?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?',s)
    pts=[];x=y=0;i=0;cmd='';moves=0
    try:
        while i<len(tokens):
            if tokens[i].isalpha():cmd=tokens[i];i+=1
            if cmd=='Z':break
            if cmd in ('M','L'):
                x=float(tokens[i]);y=float(tokens[i+1]);i+=2
                if cmd=='M':moves+=1;cmd='L'
            elif cmd=='H':x=float(tokens[i]);i+=1
            elif cmd=='V':y=float(tokens[i]);i+=1
            else:return None
            pts.append((x,y))
        if pts and pts[-1]==pts[0]:pts.pop()
        return pts if len(pts)==4 and moves==1 else None
    except (ValueError,IndexError):return None
def area(p):return abs(sum(p[i][0]*p[(i+1)%len(p)][1]-p[(i+1)%len(p)][0]*p[i][1] for i in range(len(p)))/2)
def bbox(p):return(min(x for x,y in p),min(y for x,y in p),max(x for x,y in p),max(y for x,y in p))
def rectpoly(r):return[(r[0],r[1]),(r[2],r[1]),(r[2],r[3]),(r[0],r[3])]
def contains(a,b,tol=.2):
    a=bbox(a);b=bbox(b)
    return a[0]-tol<=b[0] and a[1]-tol<=b[1] and a[2]+tol>=b[2] and a[3]+tol>=b[3]

def import_page(doc,page_index,source):
    page=doc[page_index];w=page.rect.width;h=page.rect.height;total=w*h
    root=ET.fromstring(page.get_svg_image());defs=root.find('{'+SVG+'}defs')
    if defs is None:defs=ET.SubElement(root,'{'+SVG+'}defs')
    ids={e.get('id'):e for e in root.iter() if e.get('id')}
    candidates=[];paths=[];parents={c:p for p in root.iter() for c in p}
    def photo_mask(ancestors):
        from PIL import Image
        for ancestor in ancestors:
            name=ancestor.get('mask','')
            if not name:continue
            mask=ids.get(name[5:-1])
            if mask is None:return False
            images=list(mask.iter('{'+SVG+'}image'))
            if len(images)!=1:return False
            data=images[0].get('{'+XL+'}href','')
            try:
                im=Image.open(io.BytesIO(base64.b64decode(data.split(',',1)[1]))).convert('L');im.thumbnail((100,100))
                hist=im.histogram()
                if sum(hist[180:])/sum(hist)<.6:return False
            except Exception:return False
        return True
    def walk(e,parent_matrix=I,clips=(),layer='',ancestors=()):
        tag=e.tag.split('}')[-1]
        if tag=='defs':return
        transform=mul(parent_matrix,matrix(e.get('transform')))
        layer=e.get('{'+INK+'}label',layer)
        cp=e.get('clip-path','')
        if cp:
            el=ids.get(cp[5:-1]);ps=[]
            if el is not None:
                for path in el:
                    p=polygon(path.get('d',''))
                    if p:ps.append([point(mul(transform,matrix(path.get('transform'))),v) for v in p])
            if ps:clips=clips+(min(ps,key=area),)
        if tag=='image':
            width=float(e.get('width','0'));height=float(e.get('height','0'))
            p=[point(transform,v) for v in rectpoly((0,0,width,height))]
            smaller=[c for c in clips if area(c)<area(p)*1.02]
            if smaller:p=min(smaller,key=area)
            r=bbox(p)
            if area(p)>total*.004 and (r[2]-r[0])>w*.04 and (r[3]-r[1])>h*.04:
                candidates.append(dict(node=e,poly=p,matrix=parent_matrix,layer=layer,ancestors=ancestors,kind='image',masked=any(a.get('mask') for a in ancestors)))
        if tag=='path' and e.get('fill','none')!='none':
            p=polygon(e.get('d',''))
            if p:
                p=[point(transform,v) for v in p]
                if area(p)>total*.004 and area(p)<total*.94:
                    paths.append(dict(node=e,poly=p,matrix=parent_matrix,layer=layer,ancestors=ancestors,kind='path',masked=False))
        for c in e:walk(c,transform,clips,layer,ancestors+(e,))
    walk(root)
    if '--debug' in sys.argv:
        print('CANDIDATES',page_index+1,[{'id':c['node'].get('id'),'layer':c['layer'],'bounds':bbox(c['poly']),'masked':c['masked'],'photoMask':photo_mask(c['ancestors'])} for c in candidates],flush=True)
    # Photo images are large, unmasked raster objects. Masked raster objects in
    # these sources contain logos, clock numerals and decorative frame strips.
    images=[c for c in candidates if not c['masked'] and not re.search(r'PHOTOCANVAS|KHAT|LOGO|TEMPLATE',c['layer'],re.I)]
    masked=[c for c in candidates if c['masked'] and photo_mask(c['ancestors']) and not re.search(r'PHOTOCANVAS|KHAT|LOGO|TEMPLATE',c['layer'],re.I)
            and bbox(c['poly'])[2]-bbox(c['poly'])[0]>w*.08 and bbox(c['poly'])[3]-bbox(c['poly'])[1]>h*.08
            ]
    images+= [c for c in masked if not any(q is not c and area(q['poly'])<area(c['poly'])*.98 and contains(c['poly'],q['poly']) for q in masked)]
    # Prefer the innermost solid rectangles (photo placeholders), never their
    # surrounding white mat or black frame.
    blanks=[p for p in paths if not re.search(r'TEMPLATE|PHOTOCANVAS|KHAT|LOGO',p['layer'],re.I)
            and bbox(p['poly'])[0]>.01 and bbox(p['poly'])[1]>.01
            and bbox(p['poly'])[2]<w-.01 and bbox(p['poly'])[3]<h-.01
            and bbox(p['poly'])[2]-bbox(p['poly'])[0]>w*.08
            and bbox(p['poly'])[3]-bbox(p['poly'])[1]>h*.08]
    blanks=[p for p in blanks if not any(q is not p and area(q['poly'])>area(p['poly'])*1.02 and contains(q['poly'],p['poly'])
            and ((abs(bbox(q['poly'])[1]-bbox(p['poly'])[1])<.1 and abs(bbox(q['poly'])[3]-bbox(p['poly'])[3])<.1)
                 or (abs(bbox(q['poly'])[0]-bbox(p['poly'])[0])<.1 and abs(bbox(q['poly'])[2]-bbox(p['poly'])[2])<.1)) for q in blanks)]
    blanks=[p for p in blanks if not any(q is not p and area(q['poly'])<area(p['poly'])*.98 and contains(p['poly'],q['poly']) for q in blanks)]
    if images:
        selected=images+[p for p in blanks if not any(contains(p['poly'],q['poly']) or contains(q['poly'],p['poly']) for q in images)]
        # A main rectangular raster can cover authored vector lettering; the
        # original lettering remains in its original position in the SVG tree.
    else:selected=blanks
    if source=='12x24 CUSTOM.ai':
        # The outer raster is the original decorative background, not a photo.
        selected=[c for c in selected if not any(q is not c and contains(c['poly'],q['poly']) and area(q['poly'])<area(c['poly'])*.8 for q in selected)]
    if source=='10X12/10x12 - DOUBLE BORDER ZIKIR.ai':
        # This source is a flattened raster. These are the inner edges of its
        # original cream mat, measured in source artboard points.
        selected=[dict(node=None,poly=rectpoly((209,209,727,871)),matrix=I,layer='flattened photo opening',ancestors=(),kind='top-opening',masked=False)]
    # Bare single-photo frames use a compound rectangle with a transparent hole.
    if not selected:
        holes=[]
        for d in page.get_drawings():
            if len(d['items'])>=2:
                for it in d['items']:
                    if it[0]=='re':
                        r=it[1]
                        if total*.1<r.get_area()<total*.97:holes.append(rectpoly(r))
        if not holes:
            left=top=0;right=w;bottom=h
            for d in page.get_drawings():
                r=d['rect']
                if r.height>h*.9 and r.width<w*.2:
                    if r.x0<w*.1:left=max(left,r.x1)
                    if r.x1>w*.9:right=min(right,r.x0)
                if r.width>w*.9 and r.height<h*.2:
                    if r.y0<h*.1:top=max(top,r.y1)
                    if r.y1>h*.9:bottom=min(bottom,r.y0)
            if left>0 and top>0 and right<w and bottom<h:holes.append(rectpoly((left,top,right,bottom)))
        if not holes:
            # Some Illustrator compound frames are emitted as line segments.
            # Their central transparent region gives the authored opening.
            pix=page.get_pixmap(matrix=fitz.Matrix(600/w,600/w),alpha=True)
            from PIL import Image
            im=Image.frombytes('RGBA',(pix.width,pix.height),pix.samples)
            alpha=im.getchannel('A'); cx,cy=im.width//2,im.height//2
            if alpha.getpixel((cx,cy))==0:
                x0=x1=cx;y0=y1=cy
                while x0>0 and alpha.getpixel((x0-1,cy))==0:x0-=1
                while x1<im.width-1 and alpha.getpixel((x1+1,cy))==0:x1+=1
                while y0>0 and alpha.getpixel((cx,y0-1))==0:y0-=1
                while y1<im.height-1 and alpha.getpixel((cx,y1+1))==0:y1+=1
                holes.append(rectpoly((x0*w/im.width,y0*h/im.height,(x1+1)*w/im.width,(y1+1)*h/im.height)))
        if holes:
            p=min(holes,key=area)
            selected=[dict(node=None,poly=p,matrix=I,layer='frame opening',ancestors=(),kind='top-opening' if source=='12x53.ai' else 'opening',masked=False)]
    # Slots outside an artboard or duplicating another placeholder are excluded.
    unique=[]
    for c in selected:
        r=bbox(c['poly'])
        if r[2]<=0 or r[3]<=0 or r[0]>=w or r[1]>=h:continue
        if any(max(abs(x-y) for x,y in zip(r,bbox(q['poly'])))<1 for q in unique):
            if c['node'] is not None:parents[c['node']].remove(c['node'])
            continue
        unique.append(c)
    selected=sorted(unique,key=lambda c:(round(bbox(c['poly'])[1]/8),bbox(c['poly'])[0]))
    slots=[]
    for i,c in enumerate(selected):
        p=c['poly'];x,y,x2,y2=bbox(p);slotid=f'photo-{i+1}'
        clipid=f'kc-clip-{i+1}'
        clip=ET.SubElement(defs,'{'+SVG+'}clipPath',{'id':clipid,'clipPathUnits':'userSpaceOnUse'})
        ET.SubElement(clip,'{'+SVG+'}polygon',{'points':' '.join(f'{px},{py}' for px,py in p)})
        group=ET.Element('{'+SVG+'}g',{'transform':'matrix('+','.join(map(str,inv(c['matrix'])))+')','clip-path':f'url(#{clipid})'})
        ET.SubElement(group,'{'+SVG+'}rect',{'x':str(x),'y':str(y),'width':str(x2-x),'height':str(y2-y),'fill':'#eeeae3'})
        ET.SubElement(group,'{'+SVG+'}image',{'id':'kc-'+slotid,'x':str(x),'y':str(y),'width':str(x2-x),'height':str(y2-y),'preserveAspectRatio':'none'})
        if c['node'] is None:
            if c['kind']=='top-opening':root.append(group)
            else:root.insert(list(root).index(defs)+1,group)
        else:
            parent=parents[c['node']];pos=list(parent).index(c['node']);parent.remove(c['node']);parent.insert(pos,group)
            for a in c['ancestors']:
                if a.get('opacity') is not None:a.set('opacity','1')
                if c['kind']=='image' and a.get('mask') is not None:del a.attrib['mask']
        slots.append({'id':slotid,'label':f'Photo {i+1}','x':x/w*100,'y':y/h*100,'width':(x2-x)/w*100,'height':(y2-y)/h*100,'polygon':[[((px-x)/(x2-x))*100,((py-y)/(y2-y))*100] for px,py in p]})
    # Discard unreachable masks/images from removed customer photos.
    changed=True
    while changed:
        text=ET.tostring(root,encoding='unicode');changed=False
        for el in list(defs):
            id=el.get('id')
            if id and f'url(#{id})' not in text and f'"#{id}"' not in text:
                defs.remove(el);changed=True
    return root,slots,w,h

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--source',required=True);parser.add_argument('--output',required=True);parser.add_argument('--only');parser.add_argument('--debug',action='store_true');args=parser.parse_args()
    source=Path(args.source);out=Path(args.output);out.mkdir(parents=True,exist_ok=True)
    manifest=[];errors=[]
    for path in sorted(source.rglob('*')):
        if path.suffix.lower()!='.ai' or 'draft' in path.name.lower():continue
        rel=path.relative_to(source).as_posix()
        if args.only and args.only.lower() not in rel.lower():continue
        try:
            doc=fitz.open(path)
            for page in range(len(doc)):
                root,slots,w,h=import_page(doc,page,rel)
                ident=re.sub('[^a-z0-9]+','-',path.stem.lower()).strip('-')+'-'+hashlib.sha256(rel.encode()).hexdigest()[:6]+f'-{page+1}'
                filename=ident+'.svg';(out/filename).write_text(ET.tostring(root,encoding='unicode'),encoding='utf-8')
                category='Photo clock' if 'JAM' in rel.upper() and 'TIADA JAM' not in rel.upper() else ('Collage' if len(slots)>1 else 'Single photo')
                size=re.search(r'(\d+)\s*[xX]\s*(\d+)',path.stem)
                manifest.append({'id':ident,'name':path.stem+(f' · Artboard {page+1}' if len(doc)>1 else ''),'category':category,'size':f'{size[1]} × {size[2]}'+(' cm' if 'CM' in path.stem.upper() else ' in') if size else 'Original size','sourceFile':rel,'artboard':page+1,'width':w,'height':h,'aspectRatio':f'{w} / {h}','svg':'/templates/photo-canvas/library/'+filename,'preview':'/templates/photo-canvas/library/'+ident+'.webp','slots':slots})
                print(len(manifest),rel,page+1,'slots',len(slots),flush=True)
        except Exception as e:
            errors.append({'source':rel,'error':str(e)});print('ERROR',rel,str(e),flush=True)
    (out/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
    (out/'import-errors.json').write_text(json.dumps(errors,indent=2),encoding='utf-8')
if __name__=='__main__':main()
