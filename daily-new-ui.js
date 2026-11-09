'use strict';
(() => {
 const C=window.DailyNewCore,$=id=>document.getElementById(id),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const today=()=>window.StudyCore.dayKey();let api,selectedDate=today(),busy=false,message='',lastToday=today();
 const P=window.ChapterPractice;
 let preview=-1, assignedPreview=null;
 let chapterPreview=null;
 const copy=v=>JSON.parse(JSON.stringify(v));
 const bank=()=>C.validateBank([...(window.DAILY_NEW_BANK?.records||[]),...(api.getPlan().bank||[])]);
 // Legacy assignments stay available in the question archive.
 function isCurrentGroup(group){
  return !!group.mode&&(group.mode!=='challenge'||group.optionalFlow===true);
 }
 function currentPlan(plan){
  const date=today(),day=plan.days?.[date];
  if(!day)return plan;
  return {...plan,days:{...plan.days,[date]:{...day,groups:(day.groups||[]).filter(isCurrentGroup)}}};
 }
 function currentSession(session,plan){
  if(!session?.dailyNew||session.dailyDate!==today())return session;
  const groups=currentPlan(plan).days?.[today()]?.groups||[];
  return groups.some(g=>session.ids?.some(id=>g.ids.includes(id)))?session:null;
 }
 function chapterLocation(q){
  if(q.bookCode)return window.BookDirectory.locate(q);
  if(q.subject==='高等数学'){
   const point=String(q.point||'');
   if(/二元|多元/.test(point))return window.BookDirectory.locate({...q,bookCode:'4.1'});
   if(/不定积分|原函数/.test(point))return window.BookDirectory.locate({...q,bookCode:'3.1'});
  }
  if(q.subject==='高等数学'&&['函数','极限','连续与间断'].includes(P.section(q))){
   return {chapter:'第一章 函数、极限与连续'};
  }
  return window.BookDirectory.locate(q);
 }
 function chapterChoices(subject, rows){
  return [...new Set(rows.filter(q=>q.subject===subject).map(q=>chapterLocation(q).chapter))]
   .filter(chapter=>chapter&&chapter!=='待对应目录')
   .sort((a,b)=>a.localeCompare(b,'zh-CN'));
 }
 const chapterOneSupplements=[
  [
    "函数 · 单调性：区间平移|单式求解",
    "已知 f 在 (1,4) 上递增，则 g(x)=f(x−2) 在对应平移区间 ____ 上递增。",
    "(3,6)",
    "令 1<x−2<4，平移保持自变量次序。"
  ],
  [
    "函数 · 直接求定义域：偶次根式·二次被开方式|常规定义条件",
    "函数 y=√(4−x²) 的定义域为 ____。",
    "[−2,2]",
    "被开方数非负，解 4−x²≥0。"
  ],
  [
    "函数 · 换元求解析式：x+1/x整体|只求f(x)",
    "已知 x>0 时 f(x+1/x)=x²+1/x²，求 f(t) 的解析式及对应范围。",
    "f(t)=t²−2，t≥2",
    "设 t=x+1/x，平方后减 2；由基本不等式及连续性，t 的范围为 [2,+∞)。"
  ],
  [
    "函数 · 反函数：有理分式·求值或范围|只求表达式",
    "函数 y=(2x+1)/(x−1) 的反函数为 ____。",
    "y=(x+1)/(x−2)，x≠2",
    "解出原自变量 x=(y+1)/(y−2)，交换字母。"
  ],
  [
    "函数 · 反函数：三角与反三角·求解析式|只求表达式",
    "函数 y=2 arcsin x 的反函数为 ____。",
    "y=sin(x/2)，−π≤x≤π",
    "先除以 2 再取正弦，反函数定义域是原函数值域。"
  ],
  [
    "函数 · 奇偶性：单式判断·含三角函数|含分式",
    "函数 f(x)=sin x/(1+x²) 的奇偶性为 ____。",
    "奇函数",
    "定义域关于原点对称，分子为奇函数，分母为非零偶函数。"
  ],
  [
    "函数 · 奇偶性与周期：函数关系推导|",
    "已知非恒零偶函数 f 满足 f(x+2)=−f(x)，则 f(−3) 与 f(1) 的关系为 ____。",
    "f(−3)=−f(1)",
    "偶性给出 f(−3)=f(3)，再代 x=1。此关系也给出 4 是周期。"
  ],
  [
    "函数 · 复合函数：拆分内外层|多层",
    "设 f(t)=ln t，g(t)=√t，h(x)=1+x²，则 f(g(h(x)))=____。",
    "ln(√(1+x²))",
    "从最内层开始代入，根号内恒正。"
  ],
  [
    "函数 · 分段函数：改写分段式|max",
    "将 f(x)=max{2x,x+1} 写成分段函数。",
    "x≤1 时为 x+1；x>1 时为 2x。",
    "比较差 2x−(x+1)=x−1。"
  ],
  [
    "函数 · 抽象定义域：已知复合反推原函数·指数内层·单项|无参数·端点[]",
    "已知 f(eˣ) 的定义域恰为 [0,ln 3]，则 f(t) 在 t>0 范围内的定义域为 ____。",
    "[1,3]",
    "指数函数把给定闭区间一一映为 [1,3]。"
  ],
  [
    "函数 · 周期：正弦或余弦|单一关系",
    "函数 f(x)=cos(3x−1) 的最小正周期为 ____。",
    "2π/3",
    "相位每增加 2π 重复一次，令 3T=2π。"
  ],
  [
    "函数 · 反函数：三角与反三角·求解析式|另需范围限制",
    "设 y=cos x，0≤x≤π。求其反函数并写出定义域和值域。",
    "y=arccos x；定义域 [−1,1]，值域 [0,π]。",
    "余弦在限制区间单调递减，交换原函数的定义域和值域。"
  ],
  [
    "函数 · 反函数：指数与对数·求值或范围|只求表达式",
    "函数 y=e^(2x)+1 的反函数为 ____。",
    "y=(ln(x−1))/2，x>1",
    "移项后取自然对数，原函数值域为 (1,+∞)。"
  ],
  [
    "函数 · 分段函数：改写分段式|绝对值",
    "将 f(x)=|x−2|+x 写成分段函数。",
    "x<2 时为 2；x≥2 时为 2x−2。",
    "按绝对值内部 x−2 的符号分段。"
  ],
  [
    "函数 · 反函数：根式或幂函数·求解析式|只求表达式",
    "函数 y=√(x+2) 的反函数为 ____。",
    "y=x²−2，x≥0",
    "两边平方后解原自变量，反函数输入为原函数非负值域。"
  ],
  [
    "函数 · 分段函数：直接求值|按给定分支",
    "设 f(x)={x+2 (x<0), x² (x≥0)}，则 f(−1)+f(2)=____。",
    "5",
    "分别代入对应分支，得到 1 和 4。"
  ],
  [
    "函数 · 直接求定义域：三角|常规定义条件",
    "函数 y=tan(2x) 的定义域应排除哪些点？",
    "x=π/4+kπ/2，k 为整数。",
    "令 cos(2x)=0 求出所有排除点。"
  ],
  [
    "函数 · 分段函数：值域|按给定分支",
    "求 f(x)={x² (x≤−1), x+2 (x>−1)} 的值域。",
    "[1,+∞)",
    "两段分别取到 [1,+∞) 与 (1,+∞)，取并集。"
  ],
  [
    "函数 · 周期：正切|组合式",
    "函数 f(x)=1+2tan(4x+1) 的最小正周期为 ____。",
    "π/4",
    "正切的最小正周期为 π，令 4T=π。"
  ],
  [
    "函数 · 单调性：抽象关系|单式求解",
    "已知 f 在 ℝ 上严格递增，若 f(2x−1)<f(x+2)，则 x 的取值范围为 ____。",
    "(−∞,3)",
    "严格递增可将比较化为 2x−1<x+2。"
  ],
  [
    "函数 · 直接求定义域：偶次根式·二次被开方式＋反正弦或反余弦＋分母限制|常规定义条件",
    "求函数 y=(√(4−x²)+arcsin x)/(x−1) 的定义域。",
    "[−1,1)",
    "分别要求 |x|≤2、|x|≤1、x≠1，再取交集。"
  ],
  [
    "函数 · 换元求解析式：分式内层|另需代入求值",
    "已知 x≠0 时 f(1/x)=2x−1，则 f(2)=____。",
    "0",
    "令 1/x=2，即 x=1/2，再代入右式。"
  ],
  [
    "连续与间断 · 定义域含参数：二次式恒非负|非负或全实数·根式非负",
    "若 y=√(x²−4x+a) 的定义域为 ℝ，则 a 的取值范围为 ____。",
    "[4,+∞)",
    "配方得 (x−2)²+a−4；最小值非负等价于 a≥4。"
  ]
];
 function comprehensive(subject, chapter, questions, date){
  const title=chapter;
  const seen=new Set(questions.filter(q=>q.events?.length).map(q=>C.fingerprint(q)));
  const candidates=bank().filter(q=>q.subject===subject&&chapterLocation(q).chapter===chapter);
  const byPoint=new Map();
  function coverageKey(q){
   if(subject==='高等数学'&&chapter==='第一章 函数、极限与连续'){
    const label=String(q.point||'');
    if(/定义域/.test(label)){
     return /参数|恒非负/.test(label)?'函数 · 含参数的定义域':'函数 · 一元函数定义域';
    }
    if(/分段.*(?:求值|代入)/.test(label))return '函数 · 分段函数求值';
   }
   return P.section(q)+' · '+C.skill(q);
  }
  for(const q of candidates){
   const key=coverageKey(q);
   const current=byPoint.get(key);
   if(!current||(seen.has(C.fingerprint(current))&&!seen.has(C.fingerprint(q))))byPoint.set(key,q);
  }
  const section='章末综合 · '+title;
  const originals=questions.filter(q=>!q.dailyNew&&q.subject===subject&&chapterLocation(q).chapter===chapter);
  const sourcePoints=new Set();
  for(const q of originals){
   const key=coverageKey(q);
   sourcePoints.add(key);
   const answer=String(q.verifiedAnswer||'').trim();
   if(byPoint.has(key)||!answer||!q.stem||q.issue||q.needsReview||q.sourceIssue)continue;
   if(Object.keys(q.options||{}).length&&![...answer].every(letter=>Object.hasOwn(q.options,letter)))continue;
   const {id,subject,topic,point,stem,type,options,verifiedAnswer,analysis,source,sourceImageRefs,autoGradeDisabled,difficulty}=q;
   byPoint.set(key,{id,subject,topic,point,stem,type,options,verifiedAnswer,analysis,source,sourceImageRefs,autoGradeDisabled,difficulty,mathLesson:window.MathLesson?.get(q),coverageOriginal:true});
  }
  if(subject==='高等数学'&&chapter==='第一章 函数、极限与连续'){
   chapterOneSupplements.forEach(([key,stem,verifiedAnswer,analysis],i)=>{
    if(byPoint.has(key))return;
    byPoint.set(key,{id:'MATH-C1-SUPPLEMENT-'+(i+1),subject,topic:'函数、极限与连续',
     point:key.split(' · ')[1].split('|')[0],stem,verifiedAnswer,analysis,options:{},
     type:stem.includes('____')?'填空题':'计算题',autoGradeDisabled:true,scoringPoints:[analysis]});
   });
  }
  const supplementalChoices=[
   ['英语','第一章 基础语法','词汇与语法结构 · 代词','The two notebooks look alike, but the blue one is ____.',
    ['my','mine','me','myself'],'B','mine 是名词性物主代词，在此等于 my notebook。'],
   ['计算机','第一章 计算机基础知识','计算机文化基础 · 计算思维','将校园导航问题拆成定位、路径规划和路线显示三个子问题，主要体现了（　）。',
    ['分解','枚举','编码','排序'],'A','分解把复杂问题拆成较容易处理的子问题。'],
   ['计算机','第一章 计算机基础知识','计算机系统组成 · 计算思维','用流程描述计算机从接收键盘数据到在屏幕上显示结果，正确的先后顺序是（　）。',
    ['输出、处理、输入','处理、输入、输出','输入、处理、输出','输入、输出、处理'],'C','键盘提供输入，处理器执行运算，屏幕显示输出。'],
   ['计算机','第一章 计算机基础知识','计算机系统组成 · 数制与编码','某存储单元中的一个字节为 00101101，按无符号二进制整数解释，其十进制值是（　）。',
    ['21','37','44','45'],'D','按位权相加，32+8+4+1=45。']
  ];
  supplementalChoices.forEach(([itemSubject,itemChapter,key,stem,choices,verifiedAnswer,analysis],i)=>{
   if(subject!==itemSubject||chapter!==itemChapter||byPoint.has(key))return;
   const options=Object.fromEntries(choices.map((choice,index)=>['ABCD'[index],choice]));
   byPoint.set(key,{id:'CHAPTER-AUDIT-SUPPLEMENT-'+(i+1),subject,topic:chapter,
    point:key.split(' · ')[1],stem,options,verifiedAnswer,analysis,type:'单选题'});
  });
  const coverage=[...byPoint.keys()];
  const missing=[...sourcePoints].filter(point=>!byPoint.has(point));
  const records=[...byPoint.values()].map(q=>{
   const id='CHAPTER-COVER-'+date+'-'+q.id;
   return {...q,id,canonicalId:id,section,custom:true,dailyNew:true,dailyDate:date,
    dailyRole:'comprehensive',firstStatus:'未作答',source:q.coverageOriginal?(q.source||'原题档案'):'自编 · 每日题库',sourceAnswer:q.verifiedAnswer,batch:date+' · '+section};
  });
  return {records,group:{subject,section,mode:'comprehensive',coverage,missing,ids:records.map(q=>q.id)}};
 }
 function modePicker(day, byId){
  const rows=bank().map(q=>({...q,section:P.section(q)}));
  return P.sets.map(({subject,title},i)=>{
   const sections=[...new Set(rows.filter(q=>q.subject===subject).map(q=>q.section))];
   const chapters=chapterChoices(subject,rows);
   const sectionGroup=day?.groups?.find(g=>g.subject===subject&&g.mode==='section');
   const compositeGroup=day?.groups?.find(g=>g.subject===subject&&g.mode==='comprehensive'&&g.coverage?.length);
   const practiceLink=(group,label)=>{const done=group.ids.filter(id=>byId.get(id)?.events?.length).length;return `<div class="daily-assigned"><span>${esc(group.section)} · ${done}/${group.ids.length}</span><button class="btn neutral" data-start-new="${day.groups.indexOf(group)}">${done===group.ids.length?'回看':done?'继续':label}</button></div>`;};
   const readyForChallenge=day?.groups?.some(g=>g.subject===subject&&g.mode!=='challenge'&&g.ids.every(id=>byId.get(id)?.events?.length));
   const usedChallenge=Object.values(api.getPlan().days||{}).some(d=>d.groups.some(g=>g.subject===subject&&g.mode==='challenge'));
   const disabled=busy||!sections.length||selectedDate!==today();
   const newComprehensiveLocked=busy||selectedDate!==today()||day?.groups?.some(g=>g.subject===subject&&g.mode!=='challenge'&&(g.mode==='comprehensive'&&g.coverage?.length));
   return `<article class="new-daily-group daily-subject-row" data-daily-subject="${esc(subject)}">
    <h3>${esc(subject)}</h3>
    <div class="daily-mode"><strong>小节练习</strong>${sectionGroup?practiceLink(sectionGroup,'开始小节'):`<label>选择小节<select data-chapter-section="${i}">${sections.map(section=>`<option>${esc(section)}</option>`).join('')}</select></label><button class="btn primary" data-chapter-mode="section" data-chapter-subject="${i}" ${disabled?'disabled':''}>安排最多 5 题</button>`}</div>
    <div class="daily-mode"><strong>章末综合</strong>${compositeGroup?practiceLink(compositeGroup,'开始综合'):`<label>选择章节<select aria-label="${esc(subject)}综合章节" data-comprehensive-chapter="${i}">${chapters.map(chapter=>`<option>${esc(chapter)}</option>`).join('')}</select></label><button class="btn neutral" data-chapter-mode="comprehensive" data-chapter-subject="${i}" ${(newComprehensiveLocked||!chapters.length)?'disabled':''}>查看考点</button>`}</div>
    ${readyForChallenge&&!usedChallenge?`<button class="mini-link" data-chapter-mode="preview" data-chapter-subject="${i}">选做挑战</button>`:''}
    ${preview===i?`<div class="report-card"><p>选做挑战 · 1 题</p><p>考点：${esc(P.sets[i].challenge[0])}</p><button class="btn primary" data-chapter-mode="accept" data-chapter-subject="${i}">开始挑战</button> <button class="btn neutral" data-chapter-mode="skip" data-chapter-subject="${i}">跳过</button></div>`:''}
   </article>`;
  }).join('');
 }
 async function chooseMode(index,mode,section){
  if(busy)return;
  busy=true;
  try{
   const date=today(),subject=P.sets[index].subject,questions=api.questions();
   const {plan}=window.DailyBacklogCore.skipPast(api.getPlan(),questions,date);
   const day=plan.days?.[date]||{date,groups:[],diversityVersion:1};
   if(mode!=='challenge'&&day.groups.some(g=>isCurrentGroup(g)&&g.subject===subject&&g.mode===mode&&(mode!=='comprehensive'||g.coverage?.length)))return;
   let group,records;
   if(mode==='section'){
    const candidates=bank().filter(q=>q.subject===subject&&P.section(q)===section).map(q=>({...q,section}));
    const pastDays={...plan.days};
    delete pastDays[date];
    const built=C.createDay(candidates,{...plan,days:pastDays},questions,date,{sectionPractice:true,allowPartial:true});
    records=built.records;
    if(!records.length){message=`「${section}」剩余 0 道可安排新题，可以换个小节。`;return;}
    group={...built.day.groups[0],mode};
    if(records.length<5)message=`「${section}」还有 ${records.length} 道符合条件的新题，已按实际数量安排。`;
   }else if(mode==='comprehensive'){
    ({group,records}=comprehensive(subject,section,questions,date));
    if(!records.length){message='该范围还没有可用的综合题。';return;}
   }else{
    if(Object.values(plan.days||{}).some(d=>d.groups.some(g=>g.subject===subject&&g.mode===mode)))return;
    ({group,records}=P.authored(subject,date,mode==='challenge'));
    group.optionalFlow=true;
   }
   day.groups.push(group);
   plan.days={...plan.days,[date]:day};
   if(await api.installDay(plan,records))await api.startGroup(day,group);
   else message='安排尚未保存，请重试。';
  }catch(error){message=error.message;}finally{busy=false;render();}
 }
 function sourceCategory(q){
  if(q.coverageOriginal)return String(q.source||'原题档案');
  if(q.dailyRole==='challenge'||q.dailyRole==='comprehensive')return '自编 · 章节练习';
  if(q.dailyNew)return '自编或导入 · 每日题包';
  return String(q.source||'').trim()||'来源未注明';
 }
 function bindSources(questions){
  const panel=$('dailySourcePanel'),subject=$('dailySourceSubject'),list=$('dailySourceList');
  function show(){
   const groups=new Map();
   for(const q of questions){
    if(subject.value&&q.subject!==subject.value)continue;
    const name=sourceCategory(q);
    if(!groups.has(name))groups.set(name,[]);
    groups.get(name).push(q);
   }
   list.innerHTML=[...groups].sort(([a],[b])=>a.localeCompare(b,'zh-CN')).map(([name,items],i)=>
    `<details data-source-group="${i}"><summary>${esc(name)} · ${items.length} 题</summary><div></div></details>`).join('')||'<p>这个学科暂无题目。</p>';
   const entries=[...groups].sort(([a],[b])=>a.localeCompare(b,'zh-CN'));
   list.querySelectorAll('[data-source-group]').forEach(group=>group.ontoggle=()=>{
    if(!group.open||group.dataset.loaded)return;
    group.dataset.loaded='true';
    const items=entries[Number(group.dataset.sourceGroup)][1];
    const target=group.querySelector('div');
    let offset=0;
    function append(){
     for(const q of items.slice(offset,offset+40)){
      const button=document.createElement('button');
      button.type='button';
      button.className='mini-link daily-source-question';
      button.textContent=[q.id,q.point||q.topic,String(q.stem||'').replace(/\s+/g,' ').slice(0,64)].filter(Boolean).join(' · ');
      button.onclick=()=>api.openQuestion(q.id);
      target.insertBefore(button,more);
     }
     offset+=40;
     more.hidden=offset>=items.length;
    }
    const more=document.createElement('button');
    more.type='button';more.className='btn neutral';more.textContent='显示更多';
    more.onclick=append;target.append(more);append();
   });
  }
  panel.ontoggle=()=>{if(panel.open&&!list.hasChildNodes())show();};
  subject.onchange=show;
 }
 function render(){if(lastToday!==today()){lastToday=today();selectedDate=lastToday;}const plan=api.getPlan(),day=currentPlan(plan).days?.[selectedDate],questions=api.questions(),byId=new Map(questions.map(q=>[q.id,q]));
  const mastered=window.DailyMasteryCore.summarize(questions).masteredTags;
  const ids=day?.groups?.flatMap(g=>g.ids)||[],completed=ids.filter(id=>byId.get(id)?.events?.length).length;
  $('newDailyView').innerHTML=`<div class="new-daily-welcome"><div><h2>每日新题</h2><p class="daily-exam-label">重庆普通高校专升本 · 已学章节专项</p><p class="studio-intro">每科每天可分别练一组小节 <strong>5</strong> 题和一套章末综合。挑战题单独选做。小节练习和章末综合分别选择范围。综合卷会列出所选章节在题库中已收录的考点。</p></div><aside class="studio-date"><span>YOUR DAILY EDITION</span><strong>${esc(selectedDate.slice(8))}<i> / ${esc(selectedDate.slice(5,7))}</i></strong><div>${esc(selectedDate)}<b>${ids.length?`${completed} / ${ids.length} 已完成`:'等待今日安排'}</b></div></aside></div>${message?`<p class="new-daily-message" role="status">${esc(message)}</p>`:''}<section aria-label="选择练习"><h3 class="daily-panel-title">${selectedDate===today()?'选学科和小节':'历史练习'}</h3>${selectedDate===today() ? `<div class="new-daily-groups daily-pickers">${modePicker(day,byId)}</div>` : `<button class="btn neutral" id="dailyBackToday">回到今天</button>`}</section>${chapterPreview? `<section class="report-card" id="chapterCoveragePreview"><h3>${esc(chapterPreview.chapter)} · 考点清单</h3><p class="fine-note">已有 ${chapterPreview.coverage.length} 个考点 · 待补 ${chapterPreview.missing.length} 个</p><ol>${chapterPreview.coverage.map(p=>`<li>${esc(p)} · 有题</li>`).join('')}${chapterPreview.missing.map(p=>`<li>${esc(p)} · 待补题</li>`).join('')}</ol><button type="button" class="btn primary" id="startCoveredChapter" ${!chapterPreview.coverage.length?'disabled':''}>${chapterPreview.missing.length?`先练已有 ${chapterPreview.coverage.length} 个考点`:'开始整章练习'}</button><button type="button" class="btn neutral" id="closeCoveredChapter">关闭</button>${chapterPreview.missing.length?'<p>已有题可先练。标为待补的考点暂未覆盖。</p>':''}</section>`:''}<details class="daily-exam-scope daily-admin" ${selectedDate!==today()?'open':''}><summary>本日练习明细</summary><div class="new-daily-groups">${day?.groups?.length?day.groups.map((g,i)=>{const items=g.ids.map(id=>byId.get(id)).filter(Boolean),done=items.filter(q=>q.events?.length).length,skipped=g.ids.filter(id=>(day.skippedIds||[]).includes(id)).length;return `<article class="new-daily-group" data-subject="${esc(g.subject)}"><div class="studio-cover"><span class="studio-number">0${i+1}</span><span class="studio-cover-label">DAILY PRACTICE / ${g.ids.length}</span></div><div class="new-daily-heading"><div><p class="eyebrow">${esc(g.section)}</p><h3>${esc(g.subject)}</h3><p class="fine-note">本组题型：${[...new Set(items.map(q=>q.type))].map(esc).join(' / ')}</p><p class="fine-note">${esc(selectedDate)} · 已完成 ${done} / ${g.ids.length} 题${skipped?' · 已跳过 '+skipped+' 题':''}</p></div><button class="btn primary" data-start-new="${i}" ${skipped&&!done?'disabled':''}>${skipped?(done?'回看已作答':'已跳过，无需补做'):done===g.ids.length?'回看本组结果':done?'继续本组':'开始本组练习'}</button></div><div class="studio-progress" aria-label="已完成 ${done} 题，共 ${g.ids.length} 题">${items.map(q=>`<span class="${q.events?.length?'done':''}"></span>`).join('')}</div>${g.coverage?.length?`<details class="daily-group-details"><summary>本套覆盖 ${g.coverage.length} 个题库考点</summary><ol>${g.coverage.map(point=>`<li>${esc(point)}</li>`).join('')}</ol></details>`: ''}<details class="daily-group-details"><summary>查看本组题目 · ${g.ids.length} 道</summary><ol class="new-daily-list">${items.map(q=>`<li><span class="status-chip ${q.dailyRole==='weak'?'warn':'good'}">${({weak:'强化新题',strong:'巩固新题',challenge:'选做挑战',comprehensive:'综合小问'})[q.dailyRole]||'练习题'}</span><span>${esc(q.point)}<em class="daily-question-type">${esc(q.type)} · ${Object.keys(q.options||{}).length?'客观题核对':'参考答案与要点核对'}</em></span><small>${q.events?.length?'已作答 · '+esc(q.events.at(-1).result):(day.skippedIds||[]).includes(q.id)?'已跳过 · 不计成绩':'未作答'}</small></li>`).join('')}</ol></details></article>`;}).join(''):'<div class="report-card empty-state"><h3>这一天还没有新题</h3><p>从上面选择今天想练的小节或章末综合。</p></div>'}</div></details><details class="daily-exam-scope daily-admin" id="dailySourcePanel"><summary>按题目来源查看</summary><label>学科 <select id="dailySourceSubject"><option value="">全部学科</option><option>高等数学</option><option>英语</option><option>计算机</option></select></label><p class="fine-note">按题目原有的资料名称归组。点题目可打开档案。</p><div id="dailySourceList"></div></details><details class="daily-exam-scope daily-admin"><summary>历史日期、题库与出题说明</summary><div class="new-daily-tools"><label>查看日期<input id="newDailyDate" type="date" value="${esc(selectedDate)}"></label><button class="btn neutral" id="importDailyBank">导入新题包</button><a class="mini-link" href="每日新题导入说明.txt" target="_blank">导入格式说明 ↗</a></div><p class="fine-note">往日未做完的自动跳过，不要求补做，已作答记录保留。已掌握的数学题型不再常规出题，其他类型按累计错次和最近作答安排；有库存时兼顾已有题型；同一解题结构只换数字也算重复；库存不足时提示补题，不用模板凑数。题目安排后固定，刷新不换题。</p><details class="daily-exam-scope"><summary>数学已掌握 · ${mastered.length} 类</summary><p>原题与同类每日新题均独立做对，之后没有再错的类型，退出后续日常安排。以后再错或不确定会恢复；已安排题及历史记录保留。</p>${mastered.length?`<ul>${mastered.map(tag=>`<li>${esc(tag.replace(/\|/g," · "))}</li>`).join("")}</ul>`:"<p>暂未发现同时满足两项答对证据的具体类型；未作答、看过答案和订正不算掌握。</p>"}</details><details class="daily-exam-scope"><summary>出题范围与题型说明</summary><p>备考方向固定为重庆普通高校专升本的高等数学、大学英语和计算机基础；优先已学章节和错因，同类新题尽量不重复原题。</p><p>当前题库共${bank().length}道已学章节自编专项题，沿用已有的选择、判断、填空、计算、翻译和应用题。不是官方真题或完整模拟卷；暂不新增尚未收到的阅读等题型。</p><p>新增题包须按最新官方考纲核对；不会把考研、成人高考或其他省份的题包直接当作重庆专升本练习。</p><a href="https://www.cqksy.cn/web/article/2026-10/20/content_7135.html" target="_blank" rel="noopener">2027重庆专升本官方考纲入口 ↗</a><p class="fine-note">入口由高校招生网链接核对；未据此宣称当前题库已完成2027逐条覆盖审核。</p></details><div class="new-daily-archive"><span>已归档日期</span>${Object.keys(plan.days||{}).sort().reverse().map(d=>`<button class="mini-link" data-new-date="${esc(d)}">${esc(d)}${plan.days[d].skippedIds?.length?' · 已跳过':''}</button>`).join('')||'<span class="fine-note">还没有安排新题</span>'}</div></details><input id="dailyBankFile" type="file" accept=".json,application/json" hidden>`;
  $('startCoveredChapter')?.addEventListener('click',()=>{
   const {index,chapter}=chapterPreview;
   chapterPreview=null;
   return chooseMode(index,'comprehensive',chapter);
  });
  $('closeCoveredChapter')?.addEventListener('click',()=>{chapterPreview=null;render();});
  bindSources(questions);
  $('dailyBackToday')?.addEventListener('click',()=>{selectedDate=today();message='';render();});
  $('newDailyDate').onchange=()=>{selectedDate=$('newDailyDate').value||today();preview=-1;assignedPreview=null;chapterPreview=null;message='';render();};document.querySelectorAll('[data-chapter-mode]').forEach(button=>button.onclick=()=>{
   const index=Number(button.dataset.chapterSubject);
   const mode=button.dataset.chapterMode;
   if(mode==='preview'||mode==='skip'){assignedPreview=null;preview=mode==='preview'?index:-1;render();return;}
   if(mode==='accept'&&assignedPreview){const group=assignedPreview;assignedPreview=null;preview=-1;return api.startGroup(day,group);}
   preview=-1;
   if(mode==='comprehensive'){
    const chapter=document.querySelector(`[data-comprehensive-chapter="${index}"]`).value;
    const {group}=comprehensive(P.sets[index].subject,chapter,questions,today());
    chapterPreview={index,chapter,coverage:group.coverage,missing:group.missing};
    render();$('chapterCoveragePreview')?.scrollIntoView({block:'start'});return;
   }
   return chooseMode(index,mode==='accept'?'challenge':mode,document.querySelector(`[data-chapter-section="${index}"]`)?.value);
  });$('importDailyBank').onclick=()=>$('dailyBankFile').click();$('dailyBankFile').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{await importData(JSON.parse(await file.text()));}catch(error){message=error.message||'题包无法读取。';render();}};
  document.querySelectorAll('[data-new-date]').forEach(b=>b.onclick=()=>{selectedDate=b.dataset.newDate;preview=-1;assignedPreview=null;chapterPreview=null;message='';render();});document.querySelectorAll('[data-start-new]').forEach(b=>b.onclick=async()=>{if(busy)return;busy=true;try{const group=day.groups[Number(b.dataset.startNew)],ids=group.ids.filter(id=>!(day.skippedIds||[]).includes(id));if(ids.length&&group.mode==='challenge'&&!ids.some(id=>byId.get(id)?.events?.length)){assignedPreview={...group,ids};preview=P.sets.findIndex(set=>set.subject===group.subject);render();document.querySelector('[data-chapter-mode=accept]')?.scrollIntoView({block:'center'});return;}if(ids.length)await api.startGroup(day,{...group,ids});}finally{busy=false;}});

 }
 async function importData(data){if(busy)return;busy=true;try{if(data?.examTarget&&data.examTarget!=='重庆普通高校专升本')throw Error('本题包标注的考试方向不是重庆普通高校专升本，请核对后再导入。');if(data?.format!=='cqzsb-daily-bank-v1')throw Error('请选择每日新题题包（cqzsb-daily-bank-v1）。');const incoming=C.validateBank(data.records),plan=copy(api.getPlan()),existing=bank(),ids=new Set(existing.map(q=>q.id));C.validateBank([...existing,...incoming]);const additions=incoming.filter(q=>!ids.has(q.id));if(!additions.length){const ok=await api.savePlan(plan);message=ok?'这些题已存在并已保存，没有重复导入。':'题包尚未保存成功，请重试或导出备份。';return;}plan.bank=[...(plan.bank||[]),...additions];const ok=await api.savePlan(plan);message=ok?`已导入 ${additions.length} 道新题；可以选择对应小节开始练习。`:'题包尚未保存成功，请重试。';}finally{busy=false;render();}}
 async function ensureToday(){
  const current=api.getPlan(),rolled=window.DailyBacklogCore.skipPast(current,api.questions(),today());
  if(rolled.count||JSON.stringify(rolled.plan)!==JSON.stringify(current))await api.savePlan(rolled.plan);
  return '';
 }
 async function startSubject(subject){
  await ensureToday();
  const day=currentPlan(api.getPlan()).days?.[today()],group=day?.groups?.find(g=>g.subject===subject&&g.mode!=='challenge');
  if(group)await api.startGroup(day,group);
  else api.openPicker();
  return '';
 }
 async function startPoint(pointId){await ensureToday();const day=currentPlan(api.getPlan()).days?.[today()],qs=new Map(api.questions().map(q=>[q.id,q]));for(const group of day?.groups||[]){const ids=group.ids.filter(id=>{const q=qs.get(id);return q&&!q.events?.length&&window.KnowledgeCore.classify(q).id===pointId;});if(ids.length){const point=window.KnowledgeCore.classify(qs.get(ids[0]));await api.startGroup(day,{...group,section:group.section+' · '+point.point,ids},{unfinishedOnly:true});return '';}}return '今天没有该知识点尚未作答的新题。可以从“每日新题”看当前学科安排，或导入后续题包。';}
 window.DailyNewUI={currentPlan,currentSession,init(value){api=value;},render,importData,ensureToday,startSubject,startPoint,showToday(subject){selectedDate=today();message='';render();if(subject)[...document.querySelectorAll('[data-daily-subject]')].find(row=>row.dataset.dailySubject===subject)?.scrollIntoView({block:'center'});}};
})();
