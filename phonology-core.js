'use strict';
(() => {
 const vowels=new Set('AA AE AH AO AW AY EH ER EY IH IY OW OY UH UW'.split(' ')),stops=new Set('P B T D K G'.split(' ')),weak=new Set('a an the and or but as at to for of from can have has had do does are was were he him her them us your our than'.split(' '));
 const key=s=>s.toLowerCase().replace(/[’‘]/g,"'").replace(/[‐‑–]/g,'-'),tokens=text=>{const prefix=text.match(/^(?:[WM]:|Question(?: number \d+)?:)\s*/)?.[0]||'';return [...text.slice(prefix.length).matchAll(/[A-Za-z]+(?:['’‐‑-][A-Za-z]+)*/g)].map(m=>({word:m[0],key:key(m[0]),start:m.index+prefix.length,end:m.index+prefix.length+m[0].length}));};
 function scan(sentence,lexicon){const ts=tokens(sentence.text),hints=[],boundaries=[],missing=[];const push=(kind,indices,text)=>hints.push({id:sentence.id+':'+indices.join('-')+':'+kind,kind,indices,phrase:indices.map(i=>ts[i].word).join(kind==='连读候选'?'‿':' '),text,status:'pending-audio'});
  ts.forEach((t,i)=>{if(!lexicon[t.key])missing.push(t.word);if(weak.has(t.key))push('弱读候选',[i],'这个功能词在非重读位置常被弱化；若用于强调、对比或位于停顿前，读法可能不同。请回听原音核对。');});
  for(let i=0;i<ts.length-1;i++){const left=ts[i],right=ts[i+1],between=sentence.text.slice(left.end,right.start),record={left:i,right:i+1,status:'checked-text',kinds:[]};boundaries.push(record);if(!/^\s+$/.test(between)){record.status='punctuation-boundary';continue;}const a=lexicon[left.key],b=lexicon[right.key];if(!a||!b){record.status='missing-pronunciation';continue;}const pairs=a.flatMap(x=>b.map(y=>[x[1],y[0]])),some=fn=>pairs.some(([end,start])=>fn(end,start)),all=fn=>pairs.every(([end,start])=>fn(end,start));
   const add=(kind,predicate,text)=>{if(!some(predicate))return;record.kinds.push(kind);push(kind,[i,i+1],text+(all(predicate)?'':' 词典存在不同读音，是否适用取决于本句实际发音。'));};
   add('连读候选',(e,s)=>!vowels.has(e)&&vowels.has(s),'前词的词尾辅音接后词的词首元音，可能紧密衔接；不必等两个词之间出现明显停顿。文字不能证明原音确实连读。');
   add('元音衔接候选',(e,s)=>vowels.has(s)&&['IY','EY','AY','OY','UW','OW','AW'].includes(e),'两个元音之间可能有很轻的 /j/ 或 /w/ 过渡，取决于前词元音和说话方式；不要刻意加出一个很重的音。');
   add('辅音衔接候选',(e,s)=>!vowels.has(e)&&e===s,'相邻两个词的边界辅音相同，可能连成较长的一次衔接；不等于一定省掉一个词或一个音。');
   add('不完全爆破候选',(e,s)=>stops.has(e)&&!vowels.has(s),'前词以爆破音结尾、后词以辅音开头，前面的爆破可能很轻或不完全释放；不能把词尾直接当作不存在。');
  }
  return {sentenceId:sentence.id,tokens:ts,hints,boundaries,missing,verification:'pending-audio'};
 }
 const api={tokens,scan};if(typeof module!=='undefined')module.exports=api;if(typeof window!=='undefined')window.PhonologyCore=api;
})();
