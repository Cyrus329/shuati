'use strict';
const papers=window.MATH_EXAMS;
const el=id=>document.getElementById(id);
const minutes=paper=>paper?.examMinutes||120;
let selected=null, active=null, waitingNumber='1', dirty=false, shelf='';
const key=paper=>'math-exams-v1:'+(paper.storageKey||paper.pdf);
const records=new Map();
const saveModes=new Map();
let database=null;

function readFrom(storage,id){
 try{return JSON.parse(window[storage].getItem(id)||'null');}
 catch{return null;}
}
function newest(records){
 return records.reduce((latest,record)=>record&&(!latest||stamp(record)>stamp(latest))?record:latest,null);
}
function stamp(record){return record?.savedAt||0;}
function read(paper){
 const id=key(paper);
 return newest([records.get(id),readFrom('localStorage',id),readFrom('sessionStorage',id)]);
}
function openBackup(){
 return new Promise(resolve=>{
  let request;
  try{request=indexedDB.open('journal-math-exam-backup',1);}
  catch{resolve();return;}
  request.onupgradeneeded=()=>request.result.createObjectStore('records',{keyPath:'id'});
  request.onerror=request.onblocked=()=>resolve();
  request.onsuccess=()=>{
   database=request.result;
   database.onversionchange=()=>{database.close();database=null;};
   let load;
   try{load=database.transaction('records').objectStore('records').getAll();}
   catch{database=null;resolve();return;}
   load.onerror=()=>resolve();
   load.onsuccess=()=>{
    for(const {id,state} of load.result){
     const previous=newest([records.get(id),readFrom('localStorage',id),readFrom('sessionStorage',id)]);
     if(!previous||stamp(state)>stamp(previous)){
      records.set(id,state);
      saveModes.set(id,'backup');
     }
    }
    resolve();
   };
  };
 });
}
function showExamStatus(){
 if(!selected)return;
 const id=key(selected);
 const mode=saveModes.get(id)||(active&&stamp(readFrom('sessionStorage',id))>stamp(readFrom('localStorage',id))?'tab':'local');
 const status=active?.ended?(active.ended===active.deadline?'时间到，已自动交卷':'已交卷'):(active?'考试进行中':'');
 const saveNotice={backup:'进度已存入本机备用存储',tab:'进度暂存在此标签页，关闭前请核对作答',memory:'进度仅保留在当前页面，刷新或关闭会丢失',pending:'正在写入本机备用存储'}[mode];
 el('status').textContent=[status,saveNotice].filter(Boolean).join(' · ');
}
function write(next){
 const id=key(selected);
 const state={...next,savedAt:Math.max(Date.now(),stamp(read(selected))+1)};
 records.set(id,state);
 active=state;
 const setMode=mode=>{
  if(records.get(id)!==state)return;
  saveModes.set(id,mode);
  if(selected&&key(selected)===id)showExamStatus();
 };
 const payload=JSON.stringify(state);
 try{localStorage.setItem(id,payload);setMode('local');return true;}catch{}
 let fallback='memory';
 try{sessionStorage.setItem(id,payload);fallback='tab';}catch{}
 if(database){
  try{
   const tx=database.transaction('records','readwrite');
   tx.objectStore('records').put({id,state});
   tx.oncomplete=()=>setMode('backup');
   tx.onabort=()=>setMode(fallback);
   setMode(fallback==='tab'?'tab':'pending');
   return true;
  }catch{}
 }
 setMode(fallback);
 return true;
}
function updateClock(){
 if(!active)return;
 const remaining=Math.max(0,active.deadline-(active.ended||Date.now()));
 el('clock').textContent=[Math.floor(Math.ceil(remaining/1000)/3600),Math.floor(Math.ceil(remaining/1000)/60)%60,Math.ceil(remaining/1000)%60].map(n=>String(n).padStart(2,'0')).join(':');
 if(!remaining&&!active.ended){
  const now={...active,ended:active.deadline};
  if(dirty&&waitingNumber&&el('answer').value.trim()) now.answers={...now.answers,[waitingNumber]:el('answer').value};
  if(write(now)){dirty=false;showState();}
  else {el('answer').readOnly=true;el('saveAnswer').disabled=true;el('finish').disabled=true;}
 }
}
function showState(){
 const done=Boolean(active?.ended);
 el('start').hidden=!!active;
 el('finish').hidden=!active||done;
 el('clock').hidden=!selected.practice;
 el('response').hidden=!active;
 el('answer').readOnly=done;
 el('saveAnswer').hidden=done;
 el('saveAnswer').disabled=false;
 el('finish').disabled=false;
 el('review').hidden=!done;
 if(!done){
  window.MathJax?.typesetClear?.([el('questionSolutions')]);
  el('questionSolutions').replaceChildren();
 }
 showExamStatus();
 el('solutions').hidden=!selected.answer;
 el('pending').hidden=!!(selected.answer||selected.solutions?.length);
 if(done){renderSolutions();queueJournalSync();}
 if(done&&selected.answer)el('solutions').href=selected.answer;
 else el('solutions').removeAttribute('href');
 renderSaved();
 renderQuestionGrade();
 renderMarks();
 syncQuestionAnswer();
 updateClock();
}
function renderMarks(){
 const marks=active?.marks||{};
 for(const button of el('questionNav').children){
  const number=button.dataset.number;
  button.dataset.answered=String(Boolean(active?.answers?.[number]?.trim()));
  const grade=active?.ended?gradingFor(selected)?.questions.get(number):null;
  const wrong=grade&&isMistake(active,number,grade);
  button.dataset.mistake=String(Boolean(wrong));
  button.textContent=number+(marks[number]?' ★':'');
  button.setAttribute('aria-label',number+(marks[number]?' 已标记':'')+(wrong?' 错题':''));
 }
 const mark=el('markQuestion');
 mark.hidden=!selected?.structured||!active;
 mark.textContent=marks[waitingNumber]?'取消标记':'标记本题';
 mark.setAttribute('aria-pressed',String(Boolean(marks[waitingNumber])));
}
const gradingCache=new WeakMap();
function gradingFor(paper){
 if(!paper.questions?.length||!paper.solutions?.length)return null;
 if(gradingCache.has(paper))return gradingCache.get(paper);
 const solutions=new Map(paper.solutions.map(item=>[String(item.number),item]));
 const printedFirst=paper.pdf==='pdf/fa2b7991d4df9c.pdf';
 const practice=!paper.scored&&!printedFirst;
 const questions=new Map();
 for(const q of paper.questions){
  const number=String(q.number), solution=solutions.get(number);
  if(!solution)continue;
  const points=paper.scored?q.points:(printedFirst?(q.number<=14?4:q.number<=22?8:10):1);
  const held=q.points===0||(!paper.scored&&/暂不计分|暂停计分/.test(solution.review||''));
  if(held||!points){questions.set(number,{points:0,solution});continue;}
  const verified=solution.answer?.trim();
  const correctOption=q.correctOption||(!paper.scored&&/^[A-Z]$/.test(verified||'')&&Object.hasOwn(q.options||{},verified)&&!solution.review?verified:'');
  questions.set(number,{points,correctOption,solution});
 }
 const grading={questions,practice};
 gradingCache.set(paper,grading);
 return grading;
}
function submittedScore(record,number,grade){
 if(!grade?.points)return undefined;
 if(Object.hasOwn(record?.selfScores||{},number))return record.selfScores[number];
 const answer=record?.answers?.[number];
 if(!answer?.trim())return 0;
 return grade.correctOption?(answer===grade.correctOption?grade.points:0):undefined;
}
function isMistake(record,number,grade){
 if(!record?.ended)return false;
 const score=submittedScore(record,number,grade);
 if(score===grade.points&&grade.points)return false;
 if(!record.answers?.[number]?.trim())return true;
 return Boolean(record.mistakes?.[number]||(score!==undefined&&score<grade.points));
}
function renderQuestionGrade(){
 const host=el('questionGrade');
 const grade=active?.ended?gradingFor(selected)?.questions.get(waitingNumber):null;
 host.hidden=!grade;
 host.replaceChildren();
 if(!grade)return;
 const heading=document.createElement('strong'), state=document.createElement('span');
 const controls=document.createElement('div'), mistake=document.createElement('button'), review=document.createElement('button');
 heading.textContent='本题评分';
 state.id='currentGradeStatus';
 controls.className='actions';
 if(grade.points){
  const label=document.createElement('label'), input=document.createElement('input'), reset=document.createElement('button');
  input.id='manualGrade';input.type='number';input.min='0';input.max=String(grade.points);input.step='any';
  input.value=active.selfScores?.[waitingNumber]??'';
  label.textContent='改分（满分 '+grade.points+'）';label.append(input);
  reset.type='button';reset.textContent='恢复默认评分';reset.id='resetGrade';
  input.onchange=()=>{if(input.reportValidity())saveGrade(input.value===''?undefined:input.valueAsNumber);};
  reset.onclick=()=>{input.value='';saveGrade(undefined);};
  controls.append(label,reset);
 }
 mistake.type='button';mistake.id='toggleMistake';
 mistake.onclick=()=>{
  const current=read(selected);
  if(!current?.ended)return;
  write({...current,mistakes:{...current.mistakes,[waitingNumber]:!isMistake(current,waitingNumber,grade)}});
  refreshGrade();
 };
 review.type='button';review.textContent='查看本题答案与解析';
 review.onclick=()=>{
  const details=Array.from(el('questionSolutions').querySelectorAll('details')).find(x=>x.dataset.number===waitingNumber);
  if(details){details.open=true;details.scrollIntoView({block:'start'});}
 };
 controls.append(mistake,review);
 host.append(heading,state,controls);
 refreshGradeStatus();
}
function saveGrade(score){
 const current=read(selected);
 if(!current?.ended)return;
 const selfScores={...current.selfScores};
 if(score===undefined)delete selfScores[waitingNumber];
 else selfScores[waitingNumber]=score;
 write({...current,selfScores});
 refreshGrade();
}
function refreshGradeStatus(){
 const label=el('currentGradeStatus');
 const grade=gradingFor(selected)?.questions.get(waitingNumber);
 if(!label||!grade)return;
 const score=submittedScore(active,waitingNumber,grade);
 const wrong=isMistake(active,waitingNumber,grade);
 label.textContent=grade.points?(score===undefined?'待自评':score+' / '+grade.points+' 分'):'本题暂不计分';
 const button=el('toggleMistake');
 const auto=!active.answers?.[waitingNumber]?.trim()||score!==undefined&&score<grade.points;
 button.disabled=auto||score===grade.points&&Boolean(grade.points);
 button.textContent=score===grade.points&&grade.points?'满分':auto?'已按扣分或空题记错':wrong?'取消手动记错':'手动记错';
 button.setAttribute('aria-pressed',String(wrong));
}
function refreshGrade(){
 renderScore();
 renderMarks();
 refreshGradeStatus();
 queueJournalSync();
}
let syncTimer, journalFrame, syncTimeout, syncQueued=false;
const syncType='math-exam-journal-v1';
function queueJournalSync(){
 clearTimeout(syncTimer);
 syncTimer=setTimeout(syncJournal,250);
}
function syncJournal(){
 if(journalFrame){syncQueued=true;return;}
 const updates=[];
 for(const paper of papers){
  const record=read(paper),grading=gradingFor(paper);
  if(!record?.ended||!grading)continue;
  const questions=new Map(paper.questions.map(q=>[String(q.number),q]));
  for(const [number,grade] of grading.questions){
   const question=questions.get(number),score=submittedScore(record,number,grade);
   const wrong=isMistake(record,number,grade);
   if(!wrong&&score===undefined)continue;
   const image=question.figures?.[0]||question.images?.[0];
   updates.push({
    id:'MATH-EXAM-'+encodeURIComponent(paper.storageKey||paper.pdf)+'-'+number,
    at:new Date(record.ended).toISOString(),stamp:record.savedAt||record.ended,
    wrong,answer:record.answers?.[number]||'',score,points:grade.points,
    number,title:routeName(paper),source:paper.title,
    ...(wrong?{stem:question.stem||'请对照原试卷题面。',options:question.options||{},
     type:question.type||'其他',reference:grade.solution.answer||'',choice:grade.correctOption||'',
     analysis:grade.solution.explanation||'',image:image?'math-exams/'+image:'',
     pdf:'math-exams/'+paper.pdf}:{}),
   });
  }
 }
 if(!updates.length)return;
 const token=crypto.randomUUID();
 journalFrame=document.createElement('iframe');journalFrame.hidden=true;
 journalFrame.src='../index.html?mathExamSync='+encodeURIComponent(token);
 const frame=journalFrame;
 const receive=e=>{
  if(e.source!==frame.contentWindow||e.data?.type!==syncType||e.data.token!==token)return;
  if(e.data.action==='ready')frame.contentWindow.postMessage({type:syncType,token,action:'merge',updates},location.protocol==='file:'?'*':location.origin);
  if(e.data.action==='saved')finishSync(e.data.ok);
 };
 function finishSync(ok){
  clearTimeout(syncTimeout);window.removeEventListener('message',receive);frame.remove();journalFrame=null;
  const label=el('journalSyncStatus');
  label.textContent=ok?'错题已同步到个人学习册':'此次未同步，重新打开数学套卷可重试';
  if(syncQueued){syncQueued=false;queueJournalSync();}
 }
 el('journalSyncStatus').textContent='正在同步错题到个人学习册…';
 window.addEventListener('message',receive);
 syncTimeout=setTimeout(()=>finishSync(false),35000);
 document.body.append(frame);
}
function renderScore(){
 const summary=el('scoreSummary');
 const grading=gradingFor(selected);
 summary.hidden=!grading;
 if(!grading)return;
 let total=0, earned=0, graded=0, correct=0, pending=0, maximum=0;
 for(const [number,grade] of grading.questions){
  const {points}=grade;
  if(!points)continue;
  total+=points;
  const score=submittedScore(active,number,grade);
  if(score===undefined){pending++;continue;}
  graded++;
  maximum+=points;
  earned+=score;
  correct+=Number(score===points);
 }
 const rate=graded?(100*correct/graded).toFixed(1):'0.0';
 summary.textContent=(pending?'已评得分 '+earned+'/'+maximum+' 分，待自评 '+pending+' 题（可计总分 '+total+' 分）'
  :(grading.practice?'练习得分 ':'总分 ')+earned+'/'+total+' 分')+' · 已评题正确率 '+rate+'%（满分题 '+correct+'/'+graded+'）';
}
function renderSolutions(){
 const host=el('questionSolutions');
 window.MathJax?.typesetClear?.([host]);
 host.replaceChildren();
 if(selected.answerKind){
  const note=document.createElement('p');
  note.textContent=selected.answerKind;
  host.append(note);
 }
 renderScore();
 for(const item of selected.solutions||[]){
  const block=document.createElement('details');
  block.dataset.number=String(item.number);
  const summary=document.createElement('summary');
  const answer=document.createElement('p');
  const steps=document.createElement('p');
  summary.textContent='第 '+item.number+' 题';
  answer.textContent='答案　'+window.formatExamFractions(item.answer);
  steps.textContent=window.formatExamFractions(item.explanation);
  block.append(summary,answer,steps);
  for(const path of item.figures||[]){
   const img=document.createElement('img');
   img.src=path;
   img.alt='第 '+item.number+' 题解题辅助图';
   img.loading='lazy';
   block.append(img);
  }
  if(item.review){
   const notice=document.createElement('p');
   notice.className='review-note';
   notice.textContent='复核说明 · '+window.formatExamFractions(item.review);
   block.insertBefore(notice,answer);
  }
  const response=active.answers?.[item.number];
  if(response?.trim()){
   const original=document.createElement('p');
   original.textContent='你的作答 · '+response;
   block.append(original);
  }
  if(gradingFor(selected)?.questions.has(String(item.number))){
   const edit=document.createElement('button');
   edit.type='button';edit.textContent='返回本题评分';
   edit.onclick=()=>{jump(item.number);el('questionGrade').scrollIntoView({block:'start'});};
   block.append(edit);
  }
  host.append(block);
 }
 if(selected.structured)typeset(host);
}
function syncQuestionAnswer(){
 const structured=!!selected?.structured;
 const options=el('questionBody').querySelectorAll('input[type=radio]');
 el('answer').closest('label').hidden=structured&&!!options.length;
 el('saveAnswer').hidden=!!active?.ended||(structured&&!!options.length);
 for(const input of options){
  input.disabled=!active||!!active.ended;
  input.checked=input.value===el('answer').value;
 }
 const marks=active?.optionMarks?.[waitingNumber]||{};
 for(const row of el('questionBody').querySelectorAll('.exam-choice')){
  const letter=row.dataset.letter;
  row.dataset.mark=marks[letter]||'';
  for(const button of row.querySelectorAll('button')){
   button.disabled=!active||!!active.ended;
   button.setAttribute('aria-pressed',String(marks[letter]===button.dataset.mark));
  }
 }
}
function setOptionMark(letter,mark){
 const current=read(selected);
 if(!current||current.ended||Date.now()>=current.deadline)return;
 const optionMarks={...current.optionMarks};
 const marks={...optionMarks[waitingNumber]};
 if(marks[letter]===mark)delete marks[letter];
 else marks[letter]=mark;
 optionMarks[waitingNumber]=marks;
 if(write({...current,optionMarks}))syncQuestionAnswer();
}
async function typeset(host){
 try{
  await window.MathJax?.startup?.promise;
  if(selected?.structured)await window.MathJax?.typesetPromise?.([host]);
 }catch(error){console.warn('公式排版：',error);}
}
function showQuestion(){
 const items=selected?.questions;
 el('singleQuestion').hidden=!items;
 el('viewer').hidden=!!items;
 if(!items)return;
 const i=Math.max(0,items.findIndex(q=>String(q.number)===waitingNumber));
 const question=items[i];
 const heading=document.createElement('h3');
 heading.textContent='第 '+question.number+' 题';
 const images=question.images.map((path,j)=>{
  const img=document.createElement('img');
  img.src=path; img.alt='第 '+question.number+' 题'+(j?'续页':'题面');
  return img;
 });
 const host=el('questionBody');
 window.MathJax?.typesetClear?.([host]);
 host.replaceChildren(heading);
 if(question.stem){
  const stem=document.createElement('p');
  stem.className='structured-stem';
  stem.textContent=window.formatExamFractions(question.stem);
  const type=document.createElement('small');
  type.textContent=question.type;
  host.append(type,stem);
  for(const [index,path] of (question.figures||[]).entries()){
   const img=document.createElement('img');
   img.src=path;img.alt='第 '+question.number+' 题区域图 '+(index+1);
   host.append(img);
  }
  const options=Object.entries(question.options||{});
  if(options.length){
   const field=document.createElement('fieldset');
   field.className='structured-options';
   const legend=document.createElement('legend');
   legend.textContent='选择一个选项';field.append(legend);
   for(const [letter,text] of options){
    const label=document.createElement('label');
    const input=document.createElement('input');
    input.type='radio';input.name='question-choice';input.value=letter;
    input.onchange=()=>{
     el('answer').value=letter;
     dirty=true;
     storeAnswer();
    };
    const content=document.createElement('span');
    content.textContent=window.formatExamFractions(text);
    const badge=document.createElement('span');badge.className='choice-letter';badge.textContent=letter;
    const row=document.createElement('div');row.className='exam-choice';row.dataset.letter=letter;
    const controls=document.createElement('div');controls.className='choice-actions';
    for(const [mark,caption] of [['exclude','× 排除'],['doubt','? 存疑']]){
     const button=document.createElement('button');button.type='button';
     button.textContent=caption;button.dataset.mark=mark;
     button.setAttribute('aria-label',letter+' '+caption);
     button.onclick=()=>setOptionMark(letter,mark);
     controls.append(button);
    }
    label.append(input,badge,content);row.append(label,controls);field.append(row);
   }
   host.append(field);
  }
  const source=document.createElement('details'), summary=document.createElement('summary');
  summary.textContent='对照原题';
  source.append(summary,...images);
  host.append(source);
  typeset(host);
 }else host.append(...images);
 syncQuestionAnswer();
 for(const b of el('questionNav').children){
  if(b.dataset.number===String(question.number))b.setAttribute('aria-current','step');
  else b.removeAttribute('aria-current');
 }
 renderQuestionGrade();
 renderMarks();
 el('prevQuestion').disabled=i===0;
 el('nextQuestion').disabled=i+1===items.length;
 el('prevQuestion').onclick=()=>jump(items[i-1]?.number);
 el('nextQuestion').onclick=()=>jump(items[i+1]?.number);
}
function jump(number){
 if(!number)return;
 el('number').value=String(number);
 chooseNumber();
}
function renderSaved(){
 el('saved').replaceChildren();
 for(const number of Object.keys(active?.answers||{})){
  const button=document.createElement('button');
  button.type='button';
  button.textContent='第 '+number+' 题';
  button.onclick=()=>{el('number').value=number;chooseNumber();};
  el('saved').append(button);
 }
}
function storeAnswer(showFeedback=true){
 if(!active||active.ended||!waitingNumber)return false;
 const current=read(selected);
 if(!current||current.ended||Date.now()>=current.deadline){active=current||active;updateClock();return false;}
 const answers={...current.answers};
 const raw=el('answer').value;
 if(raw.trim())answers[waitingNumber]=raw;else delete answers[waitingNumber];
 if(!write({...current,answers}))return false;
 dirty=false;
 renderMarks();
 if(showFeedback){el('feedback').textContent='已记录第 '+waitingNumber+' 题';renderSaved();}
 return true;
}
function chooseNumber(){
 const number=el('number').value.trim();
 if(!/^[0-9]+(?:[.（(][0-9]+[）)]?)?$/.test(number)){
  el('number').value=waitingNumber;
  el('feedback').textContent='请输入题号，例如 12 或 12(2)。';
  return;
 }
 if(dirty&&!storeAnswer(false)){el('number').value=waitingNumber;return;}
 waitingNumber=number;
 el('answer').value=Object.hasOwn(active?.answers||{},number)?active.answers[number]:'';
 el('feedback').textContent='';
 showQuestion();
}
function open(paper){
 selected=paper;
 active=read(paper);
 waitingNumber='1';dirty=false;el('number').value='1';
 el('answer').value=active?.answers?.['1']||'';
 el('feedback').textContent='';
 el('catalog').hidden=true;el('exam').hidden=false;
 el('title').textContent=routeName(paper)+(paper.route?' · '+level(paper):'')+(paper.examNote?' · '+paper.title:'');
 el('original').href=paper.pdf;
 el('viewer').removeAttribute('src');
 if(!paper.questions)el('viewer').src=paper.pdf;
 el('number').readOnly=!!paper.questions;
 el('questionNav').replaceChildren();
 for(const q of paper.questions||[]){
  const b=document.createElement('button');
  b.type='button';b.dataset.number=String(q.number);b.textContent=q.number;
  b.onclick=()=>jump(q.number);el('questionNav').append(b);
 }
 showQuestion();
 el('info').textContent=paper.pages+' 页'+(paper.collection?' · 合集按原文件展示':!paper.practice?' · 按章节查阅':'');
 if(paper.examNote)el('info').textContent+=' · '+paper.examNote;
 el('controls').hidden=!paper.practice;
 el('clock').textContent=String(Math.floor(minutes(paper)/60)).padStart(2,'0')+':'+String(minutes(paper)%60).padStart(2,'0')+':00';
 showState();
 window.scrollTo(0,0);
}
const levels=['基础','进阶','强化','挑战','冲刺'];
function level(paper){
 return paper.difficulty||levels[Math.min(4,Math.floor((paper.route-1)*5/83))]||'参考资料';
}
function routeName(paper){
 return paper.route?'第 '+String(paper.route).padStart(2,'0')+' 套':paper.title;
}
function appendCatalogCards(panels, entries){
 const root=el('papers');
 if(!entries.length){
  const message=document.createElement('p');
  message.className='catalog-empty';message.textContent='没有匹配的试卷';
  root.replaceChildren(message);
  return;
 }
 root.replaceChildren(...panels.map(name=>{
  const group=entries.filter(entry=>entry.difficulty===name);
  if(!group.length)return null;
  const section=document.createElement('section'), heading=document.createElement('h2');
  const total=document.createElement('small'),tiles=document.createElement('div');
  section.className='catalog-level';section.dataset.level=name;
  heading.textContent=name;total.textContent=group.length+' 项';heading.append(total);
  tiles.className='tiles route-tiles';
  for(const {paper, caption, subtitle, activate} of group){
   const button=document.createElement('button'), title=document.createElement('strong'), meta=document.createElement('small');
   const record=read(paper);
   button.type='button';button.className='exam-tile';button.dataset.pdf=paper.pdf;
   if(paper.storageKey)button.dataset.paperKey=paper.storageKey;
   if(record)button.dataset.progress=record.ended?'done':'active';
   title.textContent=caption;
   meta.textContent=[subtitle,paper.questions?paper.questions.length+' 题':'',record?.ended?'已交卷':record?'继续答题':''].filter(Boolean).join(' · ');
   button.append(title,meta);button.onclick=activate;tiles.append(button);
  }
  section.append(heading,tiles);return section;
 }).filter(Boolean));
}
function renderCatalog(){
 const query=el('search').value.trim().toLowerCase();
 const visible=papers.filter(p=>p.route||(p.archived&&read(p))||!p.practice)
  .sort((a,b)=>(a.route||Infinity)-(b.route||Infinity));
 const panels=[...levels,'参考资料'];
 el('seriesNav').replaceChildren(...['',...panels].map(name=>{
  const button=document.createElement('button');
  button.type='button';button.textContent=name||'全部试卷';
  button.setAttribute('aria-pressed',String(shelf===name));
  button.onclick=()=>{shelf=name;renderCatalog();};return button;
 }));
 const entries=visible.filter(paper=>(!shelf||level(paper)===shelf)&&
  (!query||[routeName(paper),paper.title,paper.series,level(paper)].join(' ').toLowerCase().includes(query)))
  .map(paper=>({paper,difficulty:level(paper),caption:routeName(paper),subtitle:paper.route?paper.title:'',activate:()=>open(paper)}));
 appendCatalogCards(panels,entries);
}
el('markQuestion').onclick=()=>{
 if(!selected?.structured)return;
 const current=read(selected);
 if(!current)return;
 const marks={...current.marks};
 if(marks[waitingNumber])delete marks[waitingNumber];
 else marks[waitingNumber]=true;
 if(write({...current,marks}))renderMarks();
};
el('search').oninput=renderCatalog;
el('start').onclick=()=>{
 if(!selected.practice)return;
 const old=read(selected);
 if(old){active=old;showState();return;}
 if(write({deadline:Date.now()+minutes(selected)*60000,answers:{}}))showState();
};
el('finish').onclick=()=>{
 if(!active||active.ended||!confirm('现在交卷并查看答案？'))return;
 if(dirty&&!storeAnswer(false))return;
 const current=read(selected);
 if(current&&!current.ended&&write({...current,ended:Math.min(Date.now(),current.deadline)}))showState();
};
el('answer').oninput=()=>{dirty=true;storeAnswer();};
el('number').onchange=chooseNumber;
el('saveAnswer').onclick=()=>storeAnswer();
el('back').onclick=()=>{
 if(dirty&&!storeAnswer(false)&&!confirm('有未保存的作答，返回卷库？'))return;
 selected=null;active=null;dirty=false;
 el('viewer').removeAttribute('src');
 el('exam').hidden=true;el('catalog').hidden=false;renderCatalog();
};
window.addEventListener('storage',event=>{
 if(!selected||event.key!==key(selected))return;
 const next=read(selected);
 if(next){active=next;showState();}
});
setInterval(updateClock,250);
Promise.race([openBackup(),new Promise(resolve=>setTimeout(resolve,1200))]).finally(()=>{renderCatalog();queueJournalSync();});


