'use strict';
const papers=window.ENGLISH_EXAMS;
const el=id=>document.getElementById(id);
const vocabularyKey='english-exams-vocabulary-v1';
window.ListeningVocabUI.init({
 get(){
  try{return JSON.parse(localStorage.getItem(vocabularyKey)||'{}');}
  catch{return {};}
 },
 save(value){
  try{localStorage.setItem(vocabularyKey,JSON.stringify(value));return true;}
  catch{return false;}
 }
});
const minutes=paper=>paper?.examMinutes||120;
let selected=null, active=null, waitingNumber='1', dirty=false, shelf='';
const key=paper=>'english-exams-v1:'+(paper.storageKey||paper.pdf);
function read(paper){
 try{return JSON.parse(localStorage.getItem(key(paper))||'null');}
 catch{return null;}
}
function write(next){
 try{localStorage.setItem(key(selected),JSON.stringify(next));active=next;return true;}
 catch{el('status').textContent='浏览器存储不可用，请在答题区复制你的答案。';return false;}
}
function updateClock(){
 if(!active||selected?.examNote)return;
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
 el('clock').hidden=true;
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
 el('status').textContent=done?(active.ended===active.deadline?'时间到，已自动交卷':'已交卷'):(active?'考试进行中':'');
 el('solutions').hidden=!selected.answer;
 el('pending').hidden=!!(selected.answer||selected.solutions?.length);
 if(done)renderSolutions();
 if(done&&selected.answer)el('solutions').href=selected.answer;
 else el('solutions').removeAttribute('href');
 renderSaved();
 renderMarks();
 syncQuestionAnswer();
 updateClock();
}
function renderMarks(){
 const marks=active?.marks||{};
 for(const button of el('questionNav').children){
  const number=button.dataset.number;
  button.dataset.answered=String(Boolean(active?.answers?.[number]?.trim()));
  button.textContent=button.dataset.label+(marks[number]?' ★':'');
  button.setAttribute('aria-label',(button.title||button.dataset.label)+(marks[number]?' 已标记':''));
 }
 const mark=el('markQuestion');
 mark.hidden=!selected?.structured||!active;
 mark.textContent=marks[waitingNumber]?'取消标记':'标记本题';
 mark.setAttribute('aria-pressed',String(Boolean(marks[waitingNumber])));
}
function autoScored(question){
 return Boolean(question.correctOption||question.acceptedAnswers?.length||question.optionScores);
}
function automaticallyCorrect(question,answer){
 if(question.correctOption)return answer===question.correctOption;
 const normalize=value=>{
  const text=String(value??'').normalize('NFKC').trim().replace(/\s+/g,' ');
  return question.caseSensitive?text:text.toLowerCase();
 };
 return question.acceptedAnswers.some(value=>normalize(value)===normalize(answer));
}
function renderScore(){
 const summary=el('scoreSummary');
 summary.hidden=!selected.scored;
 if(!selected.scored)return;
 if(selected.choiceOnly){
  const choices=selected.questions.filter(q=>q.correctOption);
  const right=choices.filter(q=>active.answers?.[q.number]===q.correctOption).length;
  summary.textContent='客观题 '+right+'/'+choices.length+' 题正确 · 书面题对照参考自行核对';
  return;
 }
 let total=0, earned=0, graded=0, correct=0, pending=0, maximum=0;
 for(const question of selected.questions){
  const {number,points}=question;
  if(!points)continue;
  total+=points;
  const answer=active.answers?.[number];
  const score=question.optionScores ? (Object.hasOwn(question.optionScores,answer)?question.optionScores[answer]:0)
   : autoScored(question) ? (automaticallyCorrect(question,answer)?points:0)
   : answer?.trim() ? active.selfScores?.[number] : 0;
  if(score===undefined){pending++;continue;}
  graded++;
  maximum+=points;
  earned+=score;
  correct+=Number(score===points);
 }
 const rate=graded?(100*correct/graded).toFixed(1):'0.0';
 summary.textContent=(pending?'已评得分 '+earned+'/'+maximum+' 分，待自评 '+pending+' 题（可计总分 '+total+' 分）'
  :(selected.series==='湖北英语'?'总分 ':'可计题得分 ')+earned+'/'+total+' 分')+' · 已评题正确率 '+rate+'%（满分题 '+correct+'/'+graded+'）';
}
function appendSolution(block,item){
  const answer=document.createElement('p');
  const steps=document.createElement('p');
  answer.textContent='答案　'+item.answer;
  steps.textContent=item.explanation;
  block.append(answer,steps);
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
   notice.textContent='复核说明 · '+item.review;
   block.insertBefore(notice,answer);
  }
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
 const questionByNumber=new Map((selected.questions||[]).map(question=>[question.number,question]));
 renderScore();
 for(const item of selected.solutions||[]){
  const block=document.createElement('details');
  const summary=document.createElement('summary');
  summary.textContent=questionLabel(questionByNumber.get(item.number));
  block.append(summary);
  appendSolution(block,item);
  const question=questionByNumber.get(item.number);
  const response=active.answers?.[item.number];
  if(selected.scored&&response?.trim()){
   const original=document.createElement('p');
   original.textContent='你的作答 · '+response;
   block.append(original);
   if(question.points&&!autoScored(question)){
    const label=document.createElement('label');
    label.textContent='自评得分（满分 '+question.points+'） ';
    const score=document.createElement('input');
    score.type='number';score.min=0;score.max=question.points;score.step='any';
    score.value=active.selfScores?.[item.number]??'';
    score.onchange=()=>{
     const current=read(selected);
     if(!current?.ended||!score.reportValidity())return;
     const selfScores={...current.selfScores};
     if(score.value==='')delete selfScores[item.number];
     else selfScores[item.number]=score.valueAsNumber;
     if(write({...current,selfScores}))renderScore();
    };
    label.append(score);block.append(label);
   }
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
 const solution=el('currentQuestionSolution');
 if(solution){
  solution.hidden=!(active?.ended||active?.answers?.[waitingNumber]?.trim());
  if(active?.ended)solution.open=true;
  else if(solution.hidden)solution.open=false;
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
function questionLabel(question){
 const label=question.originalLabel;
 return label&&!/^\d+$/.test(label)?label:'第 '+(label||question.number)+' 题';
}
function showQuestion(){
 const items=selected?.questions;
 el('singleQuestion').hidden=!items;
 el('viewer').hidden=!!items;
 if(!items)return;
 const i=Math.max(0,items.findIndex(q=>String(q.number)===waitingNumber));
 const question=items[i];
 const heading=document.createElement('h3');
 heading.textContent=questionLabel(question);
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
  stem.textContent=question.stem;
  const type=document.createElement('small');
  type.textContent=question.type;
  host.append(type);
  const material=selected.materials?.[question.materialId];
  const directions=material?.directions||question.directions;
  if(directions&&!/^This part is to test your ability to use words and phrases correctly\b/i.test(directions.trim())){
   const p=document.createElement('p');p.className='exam-directions';p.textContent=directions;host.append(p);
  }
  if(material){
   const details=document.createElement('details'), caption=document.createElement('summary');
   const body=document.createElement('div');
   details.className='english-passage';details.open=true;
   caption.textContent=material.title;
   body.className='english-passage-text';body.textContent=material.text;
   if(material.materialComplete===false){
    const note=document.createElement('p');note.className='review-note';
    note.textContent=material.note||'原卷部分材料缺失。';
    body.prepend(note);
   }
   details.append(caption);
   if(material.image){
    const original=document.createElement('img');
    original.src=material.image;
    original.alt=material.title+' · 原卷阅读材料';
    details.append(original);
   }
   details.append(body);host.append(details);
  }
  if(question.notice){
   const p=document.createElement('p');p.className='review-note';p.textContent=question.notice;host.append(p);
  }
  host.append(stem);
  const paper=selected;
  host.insertAdjacentHTML('beforeend',window.ExerciseVocabUI.entry({
   ...question,
   id:'english-exam:'+(paper.storageKey||paper.pdf)+':'+question.number,
   subject:'英语',
   topic:paper.title+' · 第 '+question.number+' 题',
   source:paper.title,
   passage:material?.text,
   get analysis(){
    return selected===paper&&active?.ended
     ?paper.solutions?.find(item=>String(item.number)===String(question.number))?.explanation
     :'';
   }
  }));
  for(const [index,path] of (question.figures||[]).entries()){
   const img=document.createElement('img');
   img.src=path;img.alt='第 '+question.number+' 题区域图 '+(index+1);
   host.append(img);
  }
  const options=Object.entries(question.options||{});
  if(question.writtenAnswer&&options.length){
   const list=document.createElement('ul');
   list.className='exam-written-options';
   for(const [letter,text] of options){
    const item=document.createElement('li');
    item.textContent=letter+'. '+text;
    list.append(item);
   }
   host.append(list);
  }else if(options.length){
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
    content.textContent=text;
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
  const solution=selected.solutions?.find(item=>String(item.number)===String(question.number));
  if(solution?.explanation){
   const details=document.createElement('details'), caption=document.createElement('summary');
   details.id='currentQuestionSolution';
   details.className='current-question-solution';
   details.hidden=true;
   caption.textContent='查看本题答案与解析';
   details.append(caption);
   appendSolution(details,solution);
   host.append(details);
  }
  const source=document.createElement('details'), summary=document.createElement('summary');
  summary.textContent='对照原题';
  source.append(summary,...images);
  if(images.length)host.append(source);
  else if(question.sourcePage){
   const link=document.createElement('a');
   link.textContent='对照原卷第 '+question.sourcePage+' 页';
   link.href=selected.pdf+'#page='+question.sourcePage;
   link.target='_blank';link.rel='noopener';
   host.append(link);
  }
  typeset(host);
 }else host.append(...images);
 syncQuestionAnswer();
 for(const b of el('questionNav').children){
  if(b.dataset.number===String(question.number))b.setAttribute('aria-current','step');
  else b.removeAttribute('aria-current');
 }
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
 syncQuestionAnswer();
 renderMarks();
 if(showFeedback){el('feedback').textContent='已保存第 '+waitingNumber+' 题';renderSaved();}
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
function openPaper(paper){
 selected=paper;
 active=read(paper);
 waitingNumber='1';dirty=false;el('number').value='1';
 el('answer').value=active?.answers?.['1']||'';
 el('feedback').textContent='';
 el('catalog').hidden=true;el('exam').hidden=false;
 el('title').textContent=routeName(paper)+(paper.route?' · '+level(paper):'');
 el('original').href=paper.originalLink||paper.pdf;
 el('viewer').removeAttribute('src');
 if(!paper.questions)el('viewer').src=paper.pdf;
 el('number').readOnly=!!paper.questions;
 el('questionNav').replaceChildren();
 for(const q of paper.questions||[]){
  const b=document.createElement('button');
  b.type='button';b.dataset.number=String(q.number);b.title=q.originalLabel||'';
  b.dataset.label=b.title.match(/^(?:[AB] )?\d+/)?.[0]||(b.title?q.type:String(q.number));
  b.textContent=b.dataset.label;
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
function level(paper){return paper.series;}
function routeName(paper){return paper.title;}
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
const englishLevels=['基础','进阶','强化','挑战','冲刺'];
let difficultyFilter='';
function englishDifficulty(paper){
 if(paper.series==='英语基础练习'){
  const chapter=Number(paper.storageKey.split('-')[2]);
  return chapter<=2?0:1;
 }
 if(paper.series==='湖北英语')return paper.choiceOnly?1:2;
 if(paper.series==='陕西英语')return paper.storageKey.endsWith('-english')&&!paper.storageKey.endsWith('-non-english')?3:(paper.choiceOnly?1:2);
 if(paper.series==='四川英语')return paper.questions.some(q=>q.type==='作文题')?3:2;
 if(paper.series==='四川英语模拟')return 3;
 if(paper.series==='安徽英语模拟')return 4;
 return 2;
}
function englishDemand(paper){
 return paper.questions.filter(q=>!Object.keys(q.options||{}).length).length*4
  +paper.questions.length+Object.values(paper.materials||{}).reduce((n,m)=>n+m.text.split(/\s+/).length,0)/90;
}
function renderCatalog(){
 const query=el('search').value.trim().toLowerCase();
 const entries=papers.filter(paper=>(!shelf||paper.series===shelf)
  &&(!difficultyFilter||englishLevels[englishDifficulty(paper)]===difficultyFilter)
  &&(!query||[paper.title,paper.series,englishLevels[englishDifficulty(paper)]].join(' ').toLowerCase().includes(query)))
  .map(paper=>({paper,tier:englishDifficulty(paper),demand:englishDemand(paper)}))
  .sort((a,b)=>a.tier-b.tier
  ||Number(b.paper.series==='英语基础练习')-Number(a.paper.series==='英语基础练习')
  ||(a.paper.series==='英语基础练习'?0:a.demand-b.demand))
  .map(({paper,tier})=>({paper,difficulty:englishLevels[tier],caption:paper.title,subtitle:paper.series==='英语基础练习'?'':paper.series,activate:()=>openPaper(paper)}));
 const series=['',...new Set(papers.map(paper=>paper.series))];
 el('seriesNav').replaceChildren(...series.map(value=>{
  const button=document.createElement('button');button.type='button';button.textContent=value||'全部试卷与练习';
  button.setAttribute('aria-pressed',String(value===shelf));
  button.onclick=()=>{shelf=value;difficultyFilter='';renderCatalog();};return button;
 }));
 el('difficultyNav').replaceChildren(...['',...englishLevels].map(name=>{
  const button=document.createElement('button');
  button.type='button';button.textContent=name||'全部难度';
  button.setAttribute('aria-pressed',String(name===difficultyFilter));
  button.onclick=()=>{difficultyFilter=name;renderCatalog();};
  return button;
 }));
 appendCatalogCards(englishLevels,entries);
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
 if(write({deadline:Number.MAX_SAFE_INTEGER,answers:{}}))showState();
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
renderCatalog();

