'use strict';
(()=>{const C=window.ComputerSpeechCore;let generation=0,armed=false,current=null,lastQuestion='',lastRevealed=false,playing=false,paused=false,rate=1,automatic=true,queue=[],onFinish=null,voiceURI='',activeVoice=null,activeRate=1,previewing=false;try{const prefs=JSON.parse(localStorage.getItem('cqzsb-computer-speech-v1')||'{}');rate=Math.max(.5,Math.min(2,Number(prefs.rate)||1));automatic=prefs.automatic!==false;voiceURI=String(prefs.voiceURI||'');}catch{}
const sharedAudio=typeof Audio==='function'?new Audio():null;
let audioPlayer=null,audioMode=true;
let waitForBlank=false, waiting=null, blankPractice=false, retrySegment=null;
let lastStatus='', lastHighlight=0;
try { waitForBlank=localStorage.getItem('cqzsb-computer-wait-for-blank')==='on'; } catch {}
let follow=true, readingPosition=null, speechClock, activeUtterance, textCache;
function clearClock(){clearTimeout(speechClock);speechClock=null;}
function armClock(callback,ms){clearClock();speechClock=setTimeout(callback,ms);}
function localVoice(){return C.chooseVoice(voices().filter(voice=>voice.localService===true));}
try { follow=localStorage.getItem('cqzsb-computer-follow')!=='off'; } catch {}

function showPosition(position, scroll=false){
 readingPosition=position;
 const view=document.getElementById('computerSpecialView');
 if(!view)return;
 for(const item of view.querySelectorAll('.cspeech-current')){
  item.classList.remove('cspeech-current');
  item.removeAttribute('aria-current');
 }
 if(!position)return;
 const unit=document.getElementById('computer-unit-'+position.id);
 if(!unit){const part=view.querySelector('.computer-page-part[data-computer-page="'+position.page+'"]');part?.classList.add('cspeech-current');if(scroll&&follow)part?.scrollIntoView({block:'nearest',inline:'nearest'});return;}
 const section=view.querySelector('[data-computer-section="'+position.id+'"]');
 if(section){
  section.classList.add('cspeech-current');
  section.setAttribute('aria-current','location');
 }
 const target=position.page==null?unit:unit.querySelector('[data-computer-page="'+position.page+'"]')||unit;
 target.classList.add('cspeech-current');
 if(scroll&&follow)target.scrollIntoView({block:'nearest',inline:'nearest',behavior:'auto'});
}
function chapterPosition(id,page,scroll=true){
 if(!id)return;
 const next={id,page};
 const moved=readingPosition?.id!==id||readingPosition.page!==page;
 if(moved)showPosition(next,scroll);
}

function showSpoken(text='', index=-1, length=0){
 CSS.highlights?.delete('computer-spoken');
 if(!text)textCache=null;
 if(!text||!follow||previewing||!['chapter','text'].includes(current?.kind))return;
 const view=document.getElementById('computerSpecialView');
 const scope=view?.querySelector('.computer-page-part.cspeech-current')||
  view?.querySelector('.computer-chapter-unit.cspeech-current')||view;
 if(!scope||!CSS.highlights||typeof Highlight!=='function')return;
 if(!textCache||textCache.scope!==scope){
 const matches=[];
 let visible='';
 for(const body of scope.querySelectorAll('.computer-text')){
  const walker=document.createTreeWalker(body,NodeFilter.SHOW_TEXT,{acceptNode(node){
   return node.parentElement.closest('.blank-number,.computer-weak-toggle,.cloze-formula > small,[hidden]')?
    NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT;
  }});
  for(let node=walker.nextNode();node;node=walker.nextNode()){
   for(let offset=0;offset<node.length;offset++){
    const char=node.data[offset].normalize('NFKC');
    if(!/[\p{L}\p{N}]/u.test(char))continue;
    visible+=char;
    matches.push([node,offset]);
   }
  }
 }
 textCache={scope,matches,visible};
 }
 const {matches,visible}=textCache;
 const normalize=value=>value.normalize('NFKC').replace(/[^\p{L}\p{N}]/gu,'');
 const start=normalize(text.slice(0,Math.max(0,index))).length;
 const phrase=normalize(text);
 if(!phrase)return;
 let at=visible.indexOf(phrase);
 if(at<0){
  const from=Math.max(0,start-6);
  const sample=phrase.slice(from,start+8);
  at=visible.indexOf(sample);
  if(at<0||sample.length<4)return;
  at-=from;
 }
 const count=index<0?Math.min(phrase.length,32):Math.max(1,normalize(text.slice(index,index+(length||1))).length);
 const first=matches[at+start],last=matches[at+start+count-1]||first;
 if(!first)return;
 const range=new Range();
 range.setStart(...first);
 range.setEnd(last[0],last[1]+1);
 const style=document.createElement('style');
 style.className='cspeech-spoken-style';
 style.textContent='::highlight(computer-spoken){background:#dce8bd;color:#263829;}';
 if(!document.querySelector('.cspeech-spoken-style'))document.head.append(style);
 CSS.highlights.set('computer-spoken',new Highlight(range));
}

function status(text){lastStatus=text;document.querySelectorAll('[data-cspeech-status]').forEach(el=>el.textContent=text);}
function preferences(){try{localStorage.setItem('cqzsb-computer-speech-v1',JSON.stringify({rate,automatic,voiceURI}));}catch{}}
function cancel(){generation++;waiting=null;blankPractice=false;retrySegment=null;lastHighlight=0;document.querySelector('.cspeech-fill')?.remove();clearClock();activeUtterance=null;showSpoken();showPosition(null);if(audioPlayer){audioPlayer.onplaying=audioPlayer.onended=audioPlayer.onerror=audioPlayer.onwaiting=null;audioPlayer.pause();audioPlayer.removeAttribute('src');audioPlayer.load();audioPlayer=null;}queue=[];playing=false;paused=false;previewing=false;onFinish=null;window.speechSynthesis?.cancel();}
function voices(){try{return C.chineseVoices(window.speechSynthesis?.getVoices?.()||[]);}catch{return [];}}
function description(v){if(!v)return '未检测到中文音色';const name=/xiaoxiao|晓晓/i.test(v.name)?'晓晓':/yunxi|云希/i.test(v.name)?'云希':/yunyang|云扬/i.test(v.name)?'云扬':String(v.name).replace(/^Microsoft\s+/i,'').replace(/\s*-\s*Chinese.*$/i,'');const kind=C.isNatural(v)?(v.localService===false?'在线自然声':'自然声'):v.localService===true?'本机音色':v.localService===false?'在线音色':'浏览器音色';return name+' · '+kind;}
function syncVoices(){document.querySelectorAll('.cspeech-voice,[data-cspeech-preview],[data-cspeech-refresh]').forEach(el=>el.hidden=audioMode);const list=voices();document.querySelectorAll('[data-cspeech-voice]').forEach(select=>{const first=document.createElement('option');first.value='';first.textContent='自动优选自然中文声';const options=list.slice().sort((a,b)=>Number(C.isNatural(b))-Number(C.isNatural(a))).map(v=>{const option=document.createElement('option');option.value=C.voiceKey(v);option.textContent=description(v);return option;});select.replaceChildren(first,...options);select.value=list.some(v=>C.voiceKey(v)===voiceURI)?voiceURI:'';});const voice=playing?activeVoice:C.chooseVoice(list,voiceURI);document.querySelectorAll('[data-cspeech-voice-note]').forEach(el=>el.textContent=audioMode?'自然人声音频 · 云希；按当前题目和答案显示状态播放，点击空位后可重新播放。':voice?(playing?'本次音色：':'优选音色：')+description(voice)+(C.isNatural(voice)?'':'；当前未选到自然声，可刷新或换选其他音色'):'还未检测到中文音色，请点“刷新音色”。建议联网使用 Edge。');}
function waitVoices(token){const initial=voices();if(initial.length)return Promise.resolve(initial);return new Promise(resolve=>{const start=Date.now();function poll(){const list=voices();if(list.length||token!==generation||Date.now()-start>1800){resolve(list);return;}setTimeout(poll,100);}poll();});}
function blankButton(id){
 return Array.from(document.getElementById('computerSpecialView')?.querySelectorAll('[data-computer-blank]')||[])
  .find(button=>button.dataset.computerBlank===id);
}
function resumeBlank(){
 if(!waiting)return;
 const {token}=waiting;
 waiting=null;
 document.querySelector('.cspeech-fill')?.remove();
 speakNext(token);
}
function syncBlankPrompt(scroll=false){
 if(!waiting)return;
 const button=blankButton(waiting.item.blank);
 if(!button||button.getAttribute('aria-expanded')==='true'){resumeBlank();return;}
 status('等你填写第 '+waiting.item.number+' 空，提交后继续朗读');
 const figureHost=button.closest('.computer-figure-cloze')?.querySelector('.computer-figure-speech-answer');
 if(figureHost?.firstElementChild||button.parentElement.nextElementSibling?.classList.contains('cspeech-fill'))return;
 const form=document.createElement('form');
 form.className='cspeech-fill';
 const input=document.createElement('input');
 input.type='text';
 input.required=true;
 input.autocomplete='off';
 input.setAttribute('aria-label','填写第 '+waiting.item.number+' 空');
 input.placeholder='输入答案';
 input.value=waiting.draft;
 input.oninput=()=>{if(waiting)waiting.draft=input.value;};
 const submit=document.createElement('button');
 submit.type='submit';
 submit.className='btn neutral';
 submit.textContent='提交并继续';
 form.append(input,submit);
 form.onsubmit=event=>{event.preventDefault();if(input.value.trim())resumeBlank();};
 if(figureHost)figureHost.append(form);else button.parentElement.after(form);
 if(scroll&&follow)button.scrollIntoView({block:'nearest',inline:'nearest'});
 if(scroll)input.focus({preventScroll:true});
}
function speakNext(token){if(token!==generation)return;let item=queue.shift();
 while(item?.blank){
  const button=blankButton(item.blank);
  if(button&&button.getAttribute('aria-expanded')!=='true'){
   activeUtterance=null;
   showSpoken();
   chapterPosition(item.section||current?.id,item.page,false);
   waiting={item,token,draft:''};
   syncBlankPrompt(true);
   return;
  }
  if(button){item={...item,text:item.answer};break;}
  item=queue.shift();
 }if(!item){showSpoken();showPosition(null);playing=false;activeUtterance=null;status(previewing?'试听结束，喜欢这个声音就可开始朗读。':'本段朗读结束');const done=onFinish;onFinish=null;done?.();return;}const utterance=new SpeechSynthesisUtterance(C.pronounce(item.text));utterance.lang=activeVoice.lang||'zh-CN';utterance.voice=activeVoice;utterance.rate=activeRate;utterance.pitch=1;activeUtterance=utterance;
 const valid=()=>token===generation&&activeUtterance===utterance;
 let heardBoundary=false;
 const stalled=()=>{
  if(!valid()||paused)return;
  clearClock();
  activeUtterance=null;
  speechSynthesis.cancel();
  const retry=()=>{
   if(token!==generation)return;
   const fallback=localVoice();
   if(fallback)activeVoice=fallback;
   queue.unshift({...item,retries:(item.retries||0)+1});
   speakNext(token);
  };
  if(!item.retries){
   status('语音响应慢，正在重读当前片段…');
   setTimeout(retry,150);
  }else{
   retrySegment=retry;
   status('语音暂时卡住。点「暂停 / 继续」可重读当前片段。');
  }
 };
 const timeLimit=Math.max(5000,utterance.text.length*430/activeRate+2000);
 utterance.retryClock=()=>armClock(stalled,heardBoundary?7000:timeLimit);
 utterance.onstart=()=>{
 if(!valid())return;
 utterance.retryClock();
 chapterPosition(item.section||current?.id,item.page);
 showSpoken(utterance.text);
 const page=item.page==null?'':' · 原 PDF 第 '+item.page+' 页';
 status((current?.chapterProgress||'')+(previewing?'试听中':'正在朗读')+page+' · '+description(activeVoice)+' · '+activeRate+'×');
};utterance.onboundary=event=>{
 if(valid()&&event.name!=='sentence'&&event.charIndex<utterance.text.length){
  heardBoundary=true;
  if(!paused)utterance.retryClock();
  const now=performance.now();
  if(now-lastHighlight>=120){
   lastHighlight=now;
   showSpoken(utterance.text,event.charIndex,event.charLength);
  }
 }
};utterance.onend=()=>{if(valid()){clearClock();speakNext(token);}};
 utterance.onerror=stalled;
 armClock(stalled,4000);
 try{speechSynthesis.speak(utterance);}catch{stalled();}
}
function withoutParentheses(value){
 let text=String(value??'');
 const inside=/[（(][^()（）]*[)）]/g;
 let previous;
 do {
  previous=text;
  text=text.replace(inside, (match, index, source)=>
   /[a-z\d]$/i.test(source.slice(0,index)) &&
   /^[a-z\d]/i.test(source.slice(index+match.length)) ? ' ' : ''
  );
 } while(text!==previous);
 return text;
}
async function play(items,done,options={}){cancel();const token=generation;
if(current)current.chapterProgress=options.progress||'';
const audioText=items.map(x=>C.pronounce(withoutParentheses(typeof x==='string'?x:x.text))).join('\n');
const clip=window.COMPUTER_AUDIO_MANIFEST?.[audioText];
const needsFollow=follow&&!options.preview&&['chapter','text'].includes(current?.kind);
blankPractice=waitForBlank&&!options.preview&&Boolean(options.pages);
if(audioMode&&clip&&!options.preview&&!needsFollow&&!blankPractice&&!options.forceSystem){
 armed=true;playing=true;onFinish=done||null;audioPlayer=sharedAudio;audioPlayer.src=clip;audioPlayer.preload='metadata';audioPlayer.playbackRate=rate;
 const fallback=()=>{
  if(token===generation)play(items,done,{...options,forceSystem:true});
 };
 audioPlayer.onwaiting=()=>{if(!paused&&token===generation)armClock(fallback,6500);};
 audioPlayer.onplaying=()=>{if(token===generation){clearClock();chapterPosition(options.section);status((options.progress||'')+'自然语音 · 云希 · '+rate+'×');}};
 audioPlayer.onended=()=>{if(token!==generation)return;clearClock();playing=false;showPosition(null);status('本段朗读结束');const finish=onFinish;onFinish=null;finish?.();};
 audioPlayer.onerror=fallback;
 armClock(fallback,6500);
 try{await audioPlayer.play();}catch(e){if(token===generation){cancel();status('请再点一次开始朗读；iPhone需要手动允许播放。');}}return;
}
if(blankPractice)status('逐空暂停使用系统朗读。');
else if(audioMode&&needsFollow)status('跟读定位使用系统朗读。');
else if(audioMode&&!clip&&!options.preview)status('当前朗读内容暂无匹配录音，正在使用系统朗读。');
if(!('speechSynthesis'in window)||!('SpeechSynthesisUtterance'in window)){status('此浏览器暂不支持朗读，请使用 Edge');return;}status('正在加载中文自然音色…');const list=await waitVoices(token);if(token!==generation)return;activeVoice=C.chooseVoice(list,voiceURI);syncVoices();if(!activeVoice){status('未检测到可用中文音色，请刷新音色列表，或在 Edge 中检查中文朗读语音。');return;}const sources=options.pages
 ? [{text:items[0]},...options.pages]
 : items.map(item=>({text:typeof item==='string'?item:item.text}));
queue=sources.flatMap(source=>{
 const position={section:options.section,page:source.page};
 const chunks=text=>C.chunks(withoutParentheses(text)).map(text=>({text,...position}));
 return blankPractice&&source.segments
  ? source.segments.flatMap(segment=>segment.blank?[{...segment,...position}]:chunks(segment.text))
  : chunks(source.text);
});if(!queue.length){status('没有可朗读的内容');return;}previewing=!!options.preview;if(!previewing)armed=true;activeRate=previewing?1:rate;playing=true;onFinish=previewing?null:done||null;syncVoices();speakNext(token);}
function startCurrent(){
 if(!current?.sections){play(current.items,current.done,{section:current.id,pages:current.pages});return;}
 const chapter=current;
 let index=0;
 function next(){
  if(current!==chapter)return;
  if(index===chapter.sections.length){status('整章朗读结束');return;}
  const section=chapter.sections[index++];
  play(section.items,next,{
   progress:'第 '+index+' / '+chapter.sections.length+' 节 · '+section.title+' · ',
   section:section.id,
   pages:section.pages
  });
 }
 next();
}
function mount(host){host.querySelector('.computer-speech')?.remove();const bar=document.createElement('section');bar.className='computer-speech';bar.setAttribute('aria-label','计算机内容朗读');bar.innerHTML=`<div class="cspeech-buttons"><label>播放方式 <select data-cspeech-mode><option value="audio">自然人声音频</option><option value="system">手机 / 浏览器系统朗读</option></select></label><button type="button" class="btn primary" data-cspeech-play>开始朗读</button><button type="button" class="btn neutral" data-cspeech-pause>暂停 / 继续</button><button type="button" class="mini-link" data-cspeech-stop>停止</button><label>语速 <select data-cspeech-rate>${[.5,.75,1,1.25,1.5,1.75,2].map(n=>`<option value="${n}" ${n===rate?'selected':''}>${n}×</option>`).join('')}</select></label><label class="cspeech-voice">音色 <select data-cspeech-voice aria-label="中文朗读音色"></select></label><button type="button" class="mini-link" data-cspeech-preview>试听</button><button type="button" class="mini-link" data-cspeech-refresh>刷新音色</button><label class="cspeech-auto"><input type="checkbox" data-cspeech-auto ${automatic?'checked':''}> 切换题目 / 小节时自动读</label></div><p data-cspeech-voice-note class="cspeech-voice-note"></p><p data-cspeech-status role="status">先点开始；题目答案和解析仅在展开或判分后朗读。</p>`;host.prepend(bar);bar.querySelector('[data-cspeech-mode]').value=audioMode?'audio':'system';bar.querySelector('[data-cspeech-mode]').onchange=e=>{audioMode=e.target.value==='audio';cancel();syncVoices();status('播放方式已切换，点开始朗读。');};syncVoices();bar.querySelector('[data-cspeech-voice]').onchange=e=>{voiceURI=e.target.value;preferences();syncVoices();if(playing&&!previewing)activeVoice=C.chooseVoice(voices(),voiceURI)||activeVoice;};bar.querySelector('[data-cspeech-preview]').onclick=()=>play(['你好，我们按小节慢慢复习。遇到填空时，请先回忆，再查看答案。'],null,{preview:true});bar.querySelector('[data-cspeech-refresh]').onclick=()=>{syncVoices();status('已刷新音色列表；点试听可以比较声音。');};
bar.querySelector('[data-cspeech-play]').onclick=()=>{armed=true;startCurrent();};bar.querySelector('[data-cspeech-pause]').onclick=()=>{if(!playing||waiting)return;
 if(retrySegment){const retry=retrySegment;retrySegment=null;retry();return;}
 if(audioPlayer){if(audioPlayer.paused){paused=false;audioPlayer.play().catch(()=>status('请点开始朗读重试'));}else{audioPlayer.pause();paused=true;clearClock();status('已暂停');}return;}if(paused){speechSynthesis.resume();paused=false;activeUtterance?.retryClock?.();status('继续朗读');}else{speechSynthesis.pause();paused=true;clearClock();status('已暂停');}};bar.querySelector('[data-cspeech-stop]').onclick=()=>{armed=false;cancel();status('已停止');};bar.querySelector('[data-cspeech-rate]').onchange=e=>{rate=Number(e.target.value);preferences();if(audioPlayer){audioPlayer.playbackRate=rate;status('自然语音 · '+rate+'×');return;}if(!previewing)activeRate=rate;};bar.querySelector('[data-cspeech-auto]').onchange=e=>{automatic=e.target.checked;preferences();if(automatic){armed=true;startCurrent();}};}
function attachQuestion(q,revealed,host){if(q.subject!=='计算机'){if(current?.kind==='question')cancel();return;}const changed=lastQuestion!==q.id,newAnswer=!changed&&!lastRevealed&&revealed;current={kind:'question',id:q.id,items:C.sequence(q,revealed)};mount(host);if(armed&&automatic){if(changed)play(current.items);else if(newAnswer)play(C.sequence(q,true).filter(x=>['answer','analysis'].includes(x.kind)));}lastQuestion=q.id;lastRevealed=!!revealed;}
function followControl(host){
 const label=document.createElement('label');
 label.className='cspeech-follow';
 const checkbox=document.createElement('input');
 checkbox.type='checkbox';
 checkbox.checked=follow;
 checkbox.onchange=()=>{
  follow=checkbox.checked;
  try {localStorage.setItem('cqzsb-computer-follow',follow?'on':'off');} catch {}
  if(follow&&readingPosition)showPosition(readingPosition,true);
 if(!follow)showSpoken();
 };
 label.append(checkbox,' 自动跟读定位');
 host.querySelector('.cspeech-auto').after(label);
}
function blankControl(host){
 const label=document.createElement('label');
 label.className='cspeech-auto';
 const checkbox=document.createElement('input');
 checkbox.type='checkbox';
 checkbox.checked=waitForBlank;
 checkbox.onchange=()=>{
  waitForBlank=checkbox.checked;
  try {localStorage.setItem('cqzsb-computer-wait-for-blank',waitForBlank?'on':'off');}catch{}
  if(playing)cancel();
  status(waitForBlank?'逐空暂停使用系统朗读，点击开始。':'逐空暂停已关闭，点击开始朗读。');
 };
 label.append(checkbox,' 遇到未填空暂停');
 host.querySelector('.cspeech-auto').after(label);
}
function attachText(id,title,text,host,done,pages){const changed=current?.kind!=='text'||current.id!==id;const previousStatus=lastStatus;current={kind:'text',id,items:[title,text],done,pages};mount(host);followControl(host);blankControl(host);if(/第\d+空/.test(text))status('空位只读编号，不读隐藏答案。点空看答案后可重新朗读。');lastQuestion='';lastRevealed=false;if(changed&&armed&&automatic)startCurrent();else{
 if(playing){if(readingPosition)showPosition(readingPosition);status(previousStatus);}
 syncBlankPrompt();
}}
window.speechSynthesis?.addEventListener?.('voiceschanged',syncVoices);
function attachChapter(id,sections,host){
 if(current && (current.kind!=='chapter'||current.id!==id))cancel();
 if(current?.kind!=='chapter'||current.id!==id||!playing)current={kind:'chapter',id,sections};
 mount(host);
 host.querySelector('[data-cspeech-play]').textContent='朗读整章';
 const control=host.querySelector('.cspeech-auto');
 control.hidden=true;
 followControl(host);
 blankControl(host);
 if(readingPosition)showPosition(readingPosition);

 host.querySelector('[data-cspeech-voice-note]').textContent='开启自动跟读定位时使用系统语音。关闭后可使用匹配的自然人声录音。';
 if(playing)status(lastStatus);
 else status('点「朗读整章」开始。');
 syncBlankPrompt();
}
window.ComputerSpeech={attachQuestion,attachText,attachChapter,cancel,syncBlankPrompt};})();
