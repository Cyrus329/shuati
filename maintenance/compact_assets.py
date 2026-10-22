"""离线题目包图片压缩；保留全部题目记录，重写所有图片引用。"""
from pathlib import Path
from PIL import Image,ImageOps,ImageFile
from concurrent.futures import ThreadPoolExecutor
import argparse,hashlib,json,re,collections,io

def compact(root):
 root=Path(root);files=sorted(f for f in root.rglob('*') if f.is_file() and f.suffix.lower() in ['.png','.jpg','.jpeg','.webp'] and not (f.suffix.lower()=='.webp' and any(f.with_suffix(ext).exists() for ext in ['.png','.jpg','.jpeg'])))
 files.sort(key=lambda f:(0 if f.relative_to(root).parts[0]=='images' else 1,str(f)))
 originals=sum(f.stat().st_size for f in files);seen={};duplicates={};unique=[]
 for f in files:
  digest=hashlib.sha256(f.read_bytes()).hexdigest()
  if digest in seen:duplicates[f]=seen[digest]
  else:seen[digest]=f;unique.append(f)
 def convert(f):
  if f.suffix.lower()=='.webp':return f,f
  out=f.with_suffix('.webp')
  if out.exists():
   with Image.open(out) as test:test.load()
   if out.stat().st_size<f.stat().st_size*.92:return f,out
   out.unlink()
  with Image.open(f) as source:
   im=ImageOps.exif_transpose(source);size=im.size
   # 题目图和小图保持原尺寸并采用无损编码；全屏截图适当缩小。
   lossless=max(size)<=1100
   if not lossless:im.thumbnail((2200,2200),Image.Resampling.LANCZOS)
   im=im.convert('RGBA' if 'A' in im.getbands() else 'RGB')
   buffer=io.BytesIO();im.save(buffer,format='WEBP',lossless=lossless,quality=85,method=6)
   out.write_bytes(buffer.getvalue())
  if out.stat().st_size>=f.stat().st_size*.92:out.unlink();return f,f
  with Image.open(out) as test:test.load()
  return f,out
 with ThreadPoolExecutor(max_workers=4) as pool:converted=dict(pool.map(convert,unique))
 replacements={str(f.relative_to(root)):str(out.relative_to(root)) for f,out in converted.items()}
 for f,target in duplicates.items():replacements[str(f.relative_to(root))]=str(converted[target].relative_to(root))
 def remap(value):
  if isinstance(value,str):return replacements.get(value,value)
  if isinstance(value,list):return [remap(x) for x in value]
  if isinstance(value,dict):return {k:remap(v) for k,v in value.items()}
  return value
 for f in root.rglob('*'):
  if not f.is_file():continue
  if f.suffix=='.json':
   data=remap(json.loads(f.read_text()));f.write_text(json.dumps(data,ensure_ascii=False,separators=(',',':'))+'\n')
  elif f.suffix in ['.html','.js','.css','.txt']:
   s=f.read_text()
   # 文件路径替换只匹配完整路径，避免编号前缀重叠。
   pattern=re.compile('|'.join(re.escape(k) for k in sorted(replacements,key=len,reverse=True)))
   s=pattern.sub(lambda m:replacements[m.group()],s)
   if f.name=='app.js':s=s.replace('(png|jpg|jpeg)','(png|jpg|jpeg|webp)')
   f.write_text(s)
 for f,out in converted.items():
  if f!=out and f.exists():f.unlink()
 for f in duplicates:
  if f.exists():f.unlink()
 # 再按应用实际引用清理，避免同时打包压缩图与旧格式图。
 texts='\n'.join(f.read_text() for f in root.rglob('*') if f.is_file() and f.suffix in ['.json','.js','.html','.css','.txt'])
 referenced=set(re.findall(r'(?:images|reference-images)/[a-z0-9-]+\.(?:png|jpe?g|webp)',texts))
 unused=0
 for f in list(root.rglob('*')):
  if f.is_file() and f.suffix.lower() in ['.png','.jpg','.jpeg','.webp'] and str(f.relative_to(root)) not in referenced:
   f.unlink();unused+=1
 used=referenced;total=sum((root/f).stat().st_size for f in used)
 audit={'originalImageBytes':originals,'compactImageBytes':total,'originalImageCount':len(files),'compactImageCount':len(used),'exactDuplicateFilesRemoved':len(duplicates),'convertedFiles':sum(f!=out for f,out in converted.items()),'maxScreenshotSide':2200,'screenshotWebPQuality':85,'smallQuestionDiagrams':'保持原尺寸，无损压缩','futureImports':'新增题目先提取文字；必要图和作答证据压缩；完全相同图片仅存一份。新增资源后运行本脚本。'}
 audit['unreferencedImageFilesRemoved']=unused
 (root/'asset-policy.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2)+'\n')
 return audit

if __name__=='__main__':
 ap=argparse.ArgumentParser();ap.add_argument('root',nargs='?',default='.');args=ap.parse_args();print(json.dumps(compact(args.root),ensure_ascii=False))
