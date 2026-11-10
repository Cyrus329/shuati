'use strict';
(() => {
 const normalize=value=>String(value??'').normalize('NFKC').toLocaleLowerCase().replace(/\s+/g,' ').trim();
 function search(items,query='',limit=12){
  const needle=normalize(query),tokens=needle.split(' ').filter(Boolean);
  if(!tokens.length)return items.filter(x=>x.kind==='action'||x.kind==='navigation').slice(0,limit);
  return items.map((item,index)=>{const title=normalize(item.title),meta=normalize(item.meta),body=normalize(item.text),all=[title,meta,body].join(' ');if(!tokens.every(t=>all.includes(t)))return null;const score=title===needle?100:title.startsWith(needle)?80:title.includes(needle)?60:tokens.every(t=>title.includes(t))?50:tokens.some(t=>title.includes(t))?30:meta.includes(needle)?20:10;return {item,index,score};}).filter(Boolean).sort((a,b)=>b.score-a.score||a.index-b.index).slice(0,Math.max(0,limit)).map(x=>x.item);
 }
 const api={search};if(typeof module!=='undefined')module.exports=api;if(typeof window!=='undefined')window.DeskCore=api;
})();
