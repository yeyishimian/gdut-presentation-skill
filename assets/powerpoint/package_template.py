"""Finalize Artifact Tool output as a clean, reusable GDUT PPTX/POTX package.

Prunes unused stock layouts/masters and turns the footer marker into the
standard PowerPoint slide-number field. Does not flatten editable objects.
"""
from pathlib import Path, PurePosixPath
import argparse, copy, posixpath, uuid, zipfile
import xml.etree.ElementTree as ET

P='http://schemas.openxmlformats.org/presentationml/2006/main'
A='http://schemas.openxmlformats.org/drawingml/2006/main'
R='http://schemas.openxmlformats.org/officeDocument/2006/relationships'
REL='http://schemas.openxmlformats.org/package/2006/relationships'
CT='http://schemas.openxmlformats.org/package/2006/content-types'
for pref,uri in [('p',P),('a',A),('r',R)]: ET.register_namespace(pref,uri)
ET.register_namespace('',CT)
def parse(b): return ET.fromstring(b)
def dump(e): return ET.tostring(e,encoding='utf-8',xml_declaration=True)
def resolve(owner,target):
    return posixpath.normpath(target.lstrip('/') if target.startswith('/') else posixpath.join(posixpath.dirname(owner),target))
def relpath(owner):
    return str(PurePosixPath(owner).parent/'_rels'/(PurePosixPath(owner).name+'.rels'))
def clean(source,dest,potx=None):
    with zipfile.ZipFile(source) as z: parts={n:z.read(n) for n in z.namelist()}
    slides=[n for n in parts if n.startswith('ppt/slides/slide') and n.endswith('.xml')]
    used_layouts=set()
    for n in slides:
        for rel in parse(parts[relpath(n)]):
            if rel.get('Type','').endswith('/slideLayout'): used_layouts.add(resolve(n,rel.get('Target')))
    used_masters=set()
    for n in used_layouts:
        for rel in parse(parts[relpath(n)]):
            if rel.get('Type','').endswith('/slideMaster'): used_masters.add(resolve(n,rel.get('Target')))
    removed=set()
    for n in list(parts):
        if n.startswith('ppt/slideLayouts/slideLayout') and n.endswith('.xml') and n not in used_layouts: removed.update([n,relpath(n)])
        if n.startswith('ppt/slideMasters/slideMaster') and n.endswith('.xml') and n not in used_masters: removed.update([n,relpath(n)])
    for n in used_masters:
        rels=parse(parts[relpath(n)]);dead=[]
        for rel in list(rels):
            if rel.get('Type','').endswith('/slideLayout') and resolve(n,rel.get('Target')) not in used_layouts:
                dead.append(rel.get('Id'));rels.remove(rel)
        root=parse(parts[n]);ids=root.find(f'{{{P}}}sldLayoutIdLst')
        if ids is not None:
            for entry in list(ids):
                if entry.get(f'{{{R}}}id') in dead: ids.remove(entry)
        parts[n]=dump(root);parts[relpath(n)]=dump(rels)
    rels=parse(parts['ppt/_rels/presentation.xml.rels']);dead=[]
    for rel in list(rels):
        if rel.get('Type','').endswith('/slideMaster') and resolve('ppt/presentation.xml',rel.get('Target')) not in used_masters:
            dead.append(rel.get('Id'));rels.remove(rel)
    root=parse(parts['ppt/presentation.xml']);ids=root.find(f'{{{P}}}sldMasterIdLst')
    if ids is not None:
        for entry in list(ids):
            if entry.get(f'{{{R}}}id') in dead: ids.remove(entry)
    parts['ppt/presentation.xml']=dump(root);parts['ppt/_rels/presentation.xml.rels']=dump(rels)
    field_count=0
    for n in used_layouts:
        root=parse(parts[n])
        for para in root.iter(f'{{{A}}}p'):
            for run in list(para):
                t=run.find(f'{{{A}}}t')
                if t is not None and t.text=='#':
                    field=ET.Element(f'{{{A}}}fld',{'id':'{'+str(uuid.uuid4()).upper()+'}','type':'slidenum'})
                    rp=run.find(f'{{{A}}}rPr')
                    if rp is not None: field.append(copy.deepcopy(rp))
                    ET.SubElement(field,f'{{{A}}}t').text='1'
                    ix=list(para).index(run);para.remove(run);para.insert(ix,field);field_count+=1
        parts[n]=dump(root)
    for n in removed: parts.pop(n,None)
    types=parse(parts['[Content_Types].xml'])
    for entry in list(types):
        if entry.get('PartName','').lstrip('/') in removed: types.remove(entry)
    parts['[Content_Types].xml']=dump(types)
    def write(out,d):
        Path(out).parent.mkdir(parents=True,exist_ok=True)
        with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED) as z:
            for n,b in d.items(): z.writestr(n,b)
    write(dest,parts)
    if potx:
        t=parse(parts['[Content_Types].xml'])
        for entry in t:
            if entry.get('PartName')=='/ppt/presentation.xml': entry.set('ContentType','application/vnd.openxmlformats-officedocument.presentationml.template.main+xml')
        parts['[Content_Types].xml']=dump(t);write(potx,parts)
    print(f'slides={len(slides)} layouts={len(used_layouts)} masters={len(used_masters)} slide-number fields={field_count}')
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('source');p.add_argument('dest');p.add_argument('--potx');a=p.parse_args();clean(a.source,a.dest,a.potx)
