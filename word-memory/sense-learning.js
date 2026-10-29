(function(root){
 'use strict';
 const labels={n:'名词',v:'动词',adj:'形容词',adv:'副词',prep:'介词',conj:'连词',pron:'代词',det:'限定词',num:'数词',modal:'情态动词',aux:'助动词',int:'感叹词',phrase:'短语用法',unknown:'词性未标注'};
 const opening='(（[【',closing=')）]】';
 function pieces(text){let depth=0,start=0,out=[];for(let i=0;i<text.length;i++){if(opening.includes(text[i]))depth++;else if(closing.includes(text[i]))depth=Math.max(0,depth-1);else if(!depth&&/[;；]/.test(text[i])){out.push(text.slice(start,i));start=i+1;}}out.push(text.slice(start));return out;}
 function hash(text){let h=2166136261;for(const c of text){h^=c.codePointAt(0);h=Math.imul(h,16777619);}return 's'+(h>>>0).toString(16).padStart(8,'0');}
 function example(term,pos,gloss){
  const rules=[['book','n','书','read a book','读一本书'],['book','v','预订','book a room','预订房间'],['work','n','工作','a lot of work','很多工作'],['work','v','工作','work in a hospital','在医院工作'],['right','adj','正确','the right answer','正确的答案'],['right','n','权利','the right to vote','投票权'],['watch','n','手表','a new watch','一块新手表'],['watch','v','观看','watch a film','看一部电影']];
  const rule=rules.find(r=>r[0]===String(term).toLowerCase()&&r[1]===pos&&gloss.includes(r[2]));return rule?{en:rule[3],zh:rule[4]}:null;
 }
 function units(word){
  const text=String(word.meaning||word.phrase||'未填释义').trim();
  const result=[],seen=new Set();
  function add(pos,body){for(const piece of pieces(body)){const gloss=piece.replace(/^[\s;；:：]+|[\s;；]+$/g,'');if(!gloss)continue;const key=hash(pos+'|'+gloss.normalize('NFKC').replace(/\s+/g,' ').trim());if(seen.has(key))continue;seen.add(key);result.push({key,pos,label:labels[pos]||labels.unknown,gloss,example:example(word.term,pos,gloss)});}}
  if(word.kind==='phrase')add('phrase',text);
  else{
   const regexp=/(^|[\s;；])((?:adj|adv|prep|conj|pron|det|num|modal|aux|int|vt|vi|n|v)\.)\s*/gi;
   const matches=[...text.matchAll(regexp)].filter(match=>{let depth=0;for(const c of text.slice(0,match.index)){if(opening.includes(c))depth++;else if(closing.includes(c))depth=Math.max(0,depth-1);}return depth===0;});
   if(!matches.length)add('unknown',text);
   else{if(text.slice(0,matches[0].index).trim())add('unknown',text.slice(0,matches[0].index));for(let i=0;i<matches.length;i++){let pos=matches[i][2].slice(0,-1).toLowerCase();if(pos==='vt'||pos==='vi')pos='v';add(pos,text.slice(matches[i].index+matches[i][0].length,matches[i+1]?.index??text.length));}}
  }
  return result.length?result:[{key:hash('unknown|未填释义'),pos:'unknown',label:labels.unknown,gloss:'未填释义',example:null}];
 }
 function tracked(word){const u=units(word);return u.length>1||!['phrase','unknown'].includes(u[0].pos);}
 function read(word,unit){return word.progress?.card?.senses?.[unit.key]||{stage:-1,status:'new',history:[],successCount:0};}
 function dateKey(date){return [date.getFullYear(),date.getMonth()+1,date.getDate()].join('-');}
 function next(word,now){
  const all=units(word),introduced=all.filter(u=>read(word,u).introducedAt);
  const due=introduced.filter(u=>Date.parse(read(word,u).nextReviewAt||'')<=now).sort((a,b)=>{
   const pa=read(word,a),pb=read(word,b);return Number(pb.lastResult==='forgot')-Number(pa.lastResult==='forgot')||Date.parse(pa.nextReviewAt)-Date.parse(pb.nextReviewAt);
  });
  if(due.length){const unit=due[0],progress=read(word,unit);return {unit,progress,kind:'review',score:(['forgot','fuzzy'].includes(progress.lastResult)?3*86400000:0)+Math.min(30*86400000,now-Date.parse(progress.nextReviewAt))};}
  const unseen=all.find(u=>!read(word,u).introducedAt);
  if(!unseen)return null;
  if(introduced.length){
   if(introduced.some(u=>dateKey(new Date(read(word,u).introducedAt))===dateKey(new Date(now))))return null;
   const previous=all[all.indexOf(unseen)-1];if(!previous||!(read(word,previous).successCount>0)||read(word,previous).lastResult!=='remember')return null;
  }
  return {unit:unseen,progress:read(word,unseen),kind:'study',score:0};
 }
 function quiz(unit,all){return !['unknown','phrase'].includes(unit.pos)&&!all.some(u=>u.key!==unit.key&&u.gloss===unit.gloss&&u.pos!==unit.pos);}
 function normalise(map){const result={};if(!map||typeof map!=='object'||Array.isArray(map))return result;for(const [key,value]of Object.entries(map)){if(!/^s[0-9a-f]{8}$/.test(key)||!value||typeof value!=='object'||typeof value.gloss!=='string')continue;result[key]=JSON.parse(JSON.stringify(value));}return result;}
 function merge(a,b,resetAt){const out={},reset=Date.parse(resetAt||'')||0;for(const map of [normalise(a),normalise(b)])for(const [key,value]of Object.entries(map)){const at=Date.parse(value.updatedAt||value.lastStudiedAt||'')||0;if(at<=reset)continue;const old=out[key],oldAt=Date.parse(old?.updatedAt||old?.lastStudiedAt||'')||0;if(!old||at>oldAt||(at===oldAt&&(value.stage??-1)<(old.stage??-1)))out[key]=value;}return out;}
 function latest(word){return Math.max(Date.parse(word.progress?.card?.lastStudiedAt||'')||0,...Object.values(word.progress?.card?.senses||{}).map(p=>Date.parse(p.lastStudiedAt||'')||0));}
 function selected(word,key){const all=units(word);return key?all.find(u=>u.key===key):all[0];}
 const api={labels,units,tracked,read,next,quiz,normalise,merge,latest,selected};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.WordMemorySenses=api;
})(typeof window==='object'?window:globalThis);
