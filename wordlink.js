'use strict';
(()=>{const K='cqzsb-wordlink-v1',TYPE='cqzsb-wordlink:v1',C=window.WordLinkCore;let data={target:'',pending:[],receipts:{}},child=null,nonce='',ready=false,inflight=null,ping=null,dialog;try{data={...data,...JSON.parse(localStorage.getItem(K)||'{}')};if(!Array.isArray(data.pending))data.pending=[];}catch{}

function pruneLegacySubmittedReading(items){
  const automaticGroup='已做英语题 · 重点短语';
  const sharedGroup='阅读与练习生词';
  const oldReadingLine=/^阅读精读第 \d+ 段 · /;
  return items.flatMap(item=>{
    const word=item?.word;
    if(!Array.isArray(word?.groups)||!word.groups.includes(automaticGroup))return [item];
    const notes=String(word.note||'').split('\n');
    if(!notes.some(line=>oldReadingLine.test(line)))return [item];
    // 自动条目由作答记录重新整理。另有手动收藏分组的词条继续保留。
    if(word.groups.every(group=>group===automaticGroup||group===sharedGroup))return [];
    return [{...item,word:{...word,note:notes.filter(line=>!oldReadingLine.test(line)).join('\n')}}];
  });
}
function collapseExercisePending(items){
 const result=new Map();
 for(const item of items){
   if(!item?.word||window.ExerciseVocabularyDedupe.isDisposable(item.word))continue;
   const word=window.ExerciseVocabularyDedupe.canonicalize(item.word);
   const key=C.key(word.term),previous=result.get(key);
   if(!previous)result.set(key,word===item.word?item:{...item,word});
   else{
     const [merged]=C.merge([previous.word],[word]).words;
     const info=window.ExerciseVocabularyDedupe.termInfo(word.term);
     result.set(key,{...previous,word:C.clean(info?{...merged,meaning:info.meaning}:merged)});
   }
 }
 return [...result.values()];
}
const previousPending=data.pending;
data.pending=collapseExercisePending(pruneLegacySubmittedReading(previousPending));
const legacyQueueChanged=data.pending.length!==previousPending.length||data.pending.some((item,index)=>item!==previousPending[index]);

function normalizedAddress(value){try{const u=new URL(value,location.href);return decodeURI(u.href.split(/[?#]/)[0]).replaceAll('\\','/').toLowerCase();}catch{return '';}}
const localRoute=location.protocol==='file:'?(window.WORDLINK_LOCATIONS||[]).find(route=>normalizedAddress(route.page)===normalizedAddress(location.href)):null;
const bundledAddress=new URL('word-memory/index.html',location.href).href;let repairedTarget=false;if(location.protocol!=='file:'&&/^(?:file:|[a-z]:[\\/])/i.test(data.target||'')){data.target=bundledAddress;repairedTarget=true;}
if(localRoute?.target&&(!data.target||normalizedAddress(data.target)===normalizedAddress(bundledAddress))){data.target=localRoute.target;repairedTarget=true;}

const displayAddress=value=>{try{return decodeURI(value);}catch{return String(value||'');}};
const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function confirmed(word){const term=C.key(word.term);return !data.pending.some(x=>C.key(x.word.term)===term)&&[JSON.stringify(C.clean(word)),JSON.stringify(C.clean(C.clean(word)))].includes(data.receipts?.[term]?.snapshot);}
function queueBreakdown(){
 const groups={automatic:0,manual:0,other:0};
 for(const {word} of data.pending){
  const tags=word.groups||[];
  if(tags.some(tag=>tag==='已做英语题 · 重点短语'))groups.automatic++;
  else if(tags.some(tag=>tag==='练习题生词'||tag==='手动收藏的题目生词'))groups.manual++;
  else groups.other++;
 }
 return groups;
}
function label(message){const breakdown=queueBreakdown();document.querySelectorAll('[data-wordlink-breakdown]').forEach(el=>el.textContent='待发 '+data.pending.length+' 条 · 已做题重点短语 '+breakdown.automatic+' · 手动题目生词 '+breakdown.manual+' · 其他收藏 '+breakdown.other);document.querySelectorAll('.top-actions [data-wordlink-open]').forEach(el=>el.textContent=data.pending.length?'单词程序 · '+data.pending.length+' 待发':'我的单词程序');document.querySelectorAll('[data-wordlink-status]').forEach(el=>el.textContent=message||`${data.pending.length?data.pending.length+' 个待发送':'遇到生词，选中后加入这里'}`);}
const queueStorage=window.JournalStorage?.create({key:K+'-database'});
const queueReady=queueStorage?.load().then(stored=>{
 const saved=stored.ui?.wordlink;
 if(saved&&Array.isArray(saved.pending)){
   data={...data,...saved,pending:collapseExercisePending(pruneLegacySubmittedReading(saved.pending))};
   if(localRoute?.target&&(!data.target||normalizedAddress(data.target)===normalizedAddress(bundledAddress)))data.target=localRoute.target;
 }
 label();
});
function persist(){
 let localSaved=false;
 let snapshot;
 try{snapshot=JSON.stringify(data);localStorage.setItem(K,snapshot);localSaved=true;}catch{}
 if(queueStorage&&snapshot){
  queueStorage.save({ui:{wordlink:JSON.parse(snapshot)}}).then(ok=>{
   if(!ok&&!localSaved)label('浏览器存储未写入。待发词仍可发送，或立即导出给 B226。');
  });
 }
 return !!snapshot;
}
function target(value){let s=String(value||'').trim();if(/^[a-z]:[\\/]/i.test(s))s='file:///'+s.replaceAll('\\','/');const u=new URL(s||localRoute?.target||'word-memory/index.html',location.href);if(location.protocol!=='file:'&&u.protocol==='file:')return bundledAddress;if(!['file:','https:','http:'].includes(u.protocol))throw Error('请输入单词程序的网页或本地 index.html 地址');return u.href;}
function send(){if(!ready||!child||child.closed||inflight||!data.pending.length)return;const items=data.pending.slice(0,100),id=crypto.randomUUID();inflight={id,items};child.postMessage({type:TYPE,action:'add',nonce,id,words:items.map(x=>x.word)},new URL(target(data.target)).protocol==='file:'?'*':new URL(target(data.target)).origin);label(`正在发送 ${items.length} 个词…`);setTimeout(()=>{if(inflight?.id===id){inflight=null;label('未收到保存确认，生词仍在待发送列表，可点重试');}},20000);}
function handshake(){ready=false;clearInterval(ping);let tries=0;const hello=()=>{if(!child||child.closed||tries++>60){clearInterval(ping);ping=null;label(!child||child.closed?'单词页面已关闭，待发送生词仍保留。':'没有收到单词程序响应，请刷新单词页面后重试；生词仍保留。');return;}try{child.postMessage({type:TYPE,action:'hello',nonce},new URL(target(data.target)).protocol==='file:'?'*':new URL(target(data.target)).origin);}catch{clearInterval(ping);ping=null;label('无法联系这个页面，请核对完整地址；生词仍保留。');}};label('正在连接单词程序…');ping=setInterval(hello,300);hello();}
function connect(){try{if(child&&!child.closed){if(!inflight)handshake();return;}nonce=crypto.randomUUID();ready=false;inflight=null;child=window.open(target(data.target),'cqzsb-b226-word-memory');if(!child){label('浏览器阻止了打开单词程序，请允许本次弹窗后重试');return;}handshake();}catch(e){label(e.message);}}
window.addEventListener('message',e=>{const m=e.data||{};if(e.source!==child||m.type!==TYPE||m.nonce!==nonce)return;const expected=new URL(target(data.target)).origin;const local=new URL(target(data.target)).protocol==='file:'&&['null','file://'].includes(e.origin);if(!local&&e.origin!==expected)return;if(m.action==='ready'){ready=true;clearInterval(ping);ping=null;label('已连接单词程序');send();}if(m.action==='saved'&&inflight?.id===m.id){data.receipts=data.receipts||{};const accepted=Array.isArray(m.acceptedKeys)?inflight.items.filter(item=>m.acceptedKeys.includes(C.key(item.word.term))):(m.skipped?[]:inflight.items);for(const item of accepted)data.receipts[C.key(item.word.term)]={snapshot:JSON.stringify(C.clean(item.word)),at:new Date().toISOString()};const sent=new Set(accepted.map(x=>x.revision));data.pending=data.pending.filter(x=>!sent.has(x.revision));persist();inflight=null;window.dispatchEvent(new Event('wordlink-saved'));label(`已存入单词程序 · 新增 ${m.added}，合并 ${m.merged}${m.skipped?' · '+m.skipped+' 个未存入，仍待发':data.pending.length?' · 继续发送中':''}`);if(!m.skipped)send();}if(m.action==='error'&&inflight?.id===m.id){inflight=null;label('未存入单词程序：'+String(m.message||'请重试'));}});
function enqueue(words,{connect:openReceiver=true}={}){
  const entries=new Map(data.pending.map(item=>[C.key(item.word.term),item]));
  for(const entry of words){
    if(window.ExerciseVocabularyDedupe.isDisposable(entry))continue;
    let word=C.clean(window.ExerciseVocabularyDedupe.canonicalize(entry));
    const term=C.key(word.term),previous=entries.get(term);
    if(previous){
      const {words:[merged]}=C.merge([previous.word],[word]);
      word=C.clean(merged);
      if(JSON.stringify(word)===JSON.stringify(previous.word))continue;
    }
    entries.set(term,{word,revision:crypto.randomUUID()});
  }
  const previous=data.pending;
  data.pending=[...entries.values()];
  if(!persist()){data.pending=previous;return false;}
  label();
  if(!inflight){
    if(child&&!child.closed){if(ready)send();else if(!ping)handshake();}
    else if(openReceiver&&data.target)connect();
  }
  return true;
}
function panel(){if(dialog?.open){label();return;}if(!dialog){dialog=document.createElement('dialog');dialog.className='wordlink-dialog';document.body.append(dialog);}dialog.innerHTML=`<form method="dialog"><header><h2>我的单词程序</h2><button class="btn neutral">关闭</button></header></form><p>批量同步只统计已做英语题的重点短语。手动收藏的生词也可以发送到 B226。</p><label>单词程序地址<input id="wordlinkTarget" value="${esc(displayAddress(data.target||localRoute?.target||''))}" placeholder="粘贴正在背词的原页面完整地址"></label><p class="fine-note">${localRoute?'已找到原B226程序目录，地址已填好。':'只需连接一次。'}已有学习记录请连接原来的页面，不新建词库。</p><button type="button" class="btn primary" id="wordlinkConnect">连接 / 重试发送</button><p data-wordlink-status role="status"></p><p class="fine-note" data-wordlink-breakdown></p><button type="button" class="btn neutral" id="wordlinkDownload">导出待同步词给 B226</button><p class="fine-note">连接卡住时，导出后到 B226 点「导入旧数据」。</p><button type="button" class="btn neutral" id="wordlinkRecoverManual">补发手动收藏的题目生词</button><p id="wordlinkManualStatus" class="fine-note" role="status"></p><details id="wordlinkManualPreview" hidden><summary></summary><p></p></details><hr><button type="button" class="btn neutral" id="wordlinkSubmitted">统计并同步已做英语题短语</button><p id="wordlinkSubmittedStatus" class="fine-note" role="status"></p>`;dialog.querySelector('#wordlinkConnect').onclick=()=>{try{data.target=target(dialog.querySelector('#wordlinkTarget').value);persist();ready=false;if(child&&!child.closed)child=null;connect();}catch(e){label(e.message);}};
  dialog.querySelector('#wordlinkDownload').onclick=()=>{
    const words=data.pending.map(item=>item.word);
    if(!words.length){label('没有待同步生词。可先点下方的补发或统计按钮。');return;}
    const url=URL.createObjectURL(new Blob([JSON.stringify({words},null,2)],{type:'application/json'}));
    const link=document.createElement('a');
    link.href=url;
    link.download='B226-待同步生词.json';
    link.click();
    setTimeout(()=>URL.revokeObjectURL(url),30000);
    label('已导出 '+words.length+' 条。到 B226 点「导入旧数据」。');
  };
  const syncButton=dialog.querySelector('#wordlinkSubmitted'),syncStatus=dialog.querySelector('#wordlinkSubmittedStatus');
  const showSubmitted=value=>{
    if(!value)return;
    syncStatus.textContent=value.terms?`已整理 ${value.terms} 个短语 · ${value.questions} 道英语题 · ${value.alreadySynced} 个已确认存入，${value.pending} 个待同步`:'已提交的英语题里暂时没有识别到可同步的短语。';
  };
  const updateSubmitted=()=>showSubmitted(window.SubmittedPhrases?.status());
  window.addEventListener('wordlink-saved',updateSubmitted);
  dialog.addEventListener('close',()=>window.removeEventListener('wordlink-saved',updateSubmitted),{once:true});
  updateSubmitted();
  function selectReceiver(){
    const address=target(dialog.querySelector('#wordlinkTarget').value);
    if(data.target===address)return;
    data.target=address;
    persist();
    child=null;
    clearInterval(ping);ping=null;inflight=null;
    ready=false;
  }
  dialog.querySelector('#wordlinkRecoverManual').onclick=()=>{
    const output=dialog.querySelector('#wordlinkManualStatus');
    try{
      selectReceiver();
      const words=window.ListeningVocabUI?.exerciseWordsToRecover()||[];
      const preview=dialog.querySelector('#wordlinkManualPreview');
      preview.hidden=!words.length;
      preview.querySelector('summary').textContent='查看这次补发的 '+words.length+' 条';
      preview.querySelector('p').textContent=words.map(word=>word.term).join(' · ');
      if(!words.length){output.textContent='没有找到可补发的手动题目生词。';return;}
      output.textContent=enqueue(words)?`已把 ${words.length} 个手动收藏的题目生词交给发送队列。上方会显示 B226 的保存回执。存入后在 B226「全词浏览」选择「手动收藏的题目生词」。`:'手动生词尚未加入发送队列，请重试。';
    }catch(error){output.textContent=error.message||'暂未能补发，请重试。';}
  };
  syncButton.onclick=async()=>{
    syncButton.disabled=true;
    syncStatus.textContent='正在整理已提交题目的短语…';
    try{
      selectReceiver();
      showSubmitted(await window.SubmittedPhrases.sync({connect:true}));
    }catch(e){syncStatus.textContent=e.message||'短语暂未整理成功，请重试。';}
    finally{syncButton.disabled=false;}
  };
  dialog.showModal();label();
}
function resetPending(){clearInterval(ping);ping=null;nonce='';ready=false;inflight=null;child=null;data={target:data.target||'',pending:[],receipts:{}};const ok=persist();if(dialog?.open)dialog.close();label();return ok;}
function restorePersonal(value){if(!value||typeof value!=='object')return false;clearInterval(ping);ping=null;nonce='';ready=false;inflight=null;child=null;data={target:target(data.target||String(value.target||'')),pending:Array.isArray(value.pending)?collapseExercisePending(pruneLegacySubmittedReading(structuredClone(value.pending))):[],receipts:value.receipts&&typeof value.receipts==='object'?structuredClone(value.receipts):{}};label();return persist();}
document.addEventListener('click',e=>{if(e.target.closest('[data-wordlink-open]'))panel();});
queueReady?.then(()=>{if(repairedTarget||legacyQueueChanged)persist();});label();window.WordLink={ready:queueReady,confirmed,enqueue,panel,connect,status:label,pending:()=>structuredClone(data.pending),snapshot:()=>structuredClone(data),resetPending,restorePersonal};
})();
