'use strict';
(async () => {
  const STORAGE_KEY = 'cqzsb-personal-journal-v1';
  const base = Array.isArray(window.INITIAL_QUESTIONS) ? window.INITIAL_QUESTIONS : [];
  const defaults = () => ({format:'cqzsb-personal-journal-state-v1', custom:[], attempts:{}, edits:{}});
  let storageOkay=true;
  const persistence=window.JournalStorage.create({key:STORAGE_KEY,onStatus:info=>{
    const box=document.getElementById('storageStatus'),text=document.getElementById('storageMessage');
    if(!box||!text)return;
    const warn=info.dirty&&!info.pending||!!info.message&&!info.pending;
    box.classList.toggle('storage-warning',warn);
    text.textContent=info.message|| (info.pending?'正在保存学习记录…':info.lastSavedAt?'学习记录已保存'+(info.mode==='indexedDB'?' · 浏览器数据库':' · 兼容存储'):info.mode==='indexedDB'?'学习记录存储已就绪':'兼容存储已就绪；保存时会检查写入结果');
  }});
  let state={...defaults(),...await persistence.load()};
  state.ui={hideCorrectFamilies:true,hideCorrectQuestions:true,...(state.ui||{})};
  state.library=window.PersonalCore.normalizeLibrary(state.library);
  const storedAppearance=window.PersonalCore.appearance(state.ui.appearance),localAppearance=window.JournalAppearance.get();
  state.ui.appearance=storedAppearance.updatedAt>localAppearance.updatedAt?storedAppearance:localAppearance;
  window.JournalAppearance.restore(state.ui.appearance);
  let view='daily';
  let chosenId='';
  let selectedOption='';
  let showAnswer=false;
  let showImage=false;
  let autoSaving=false,autoSavedChoice='',completedCategory='',gradedPin='';
  const noteDrafts = {};
  const personalDrafts = {};
  const $ = id => document.getElementById(id);
  const escape = s => String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const mathText=(q,v)=>window.MathNotation?window.MathNotation.html(q.subject,v):escape(v);
  const dateStr = iso => {try{return new Date(iso).toLocaleString('zh-CN',{hour12:false,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'});}catch{return String(iso)}};
  const nowISO = () => new Date().toISOString();
  const removedIds = new Set(window.REMOVED_QUESTION_IDS||[]);
  const raw = () => [...base,...(Array.isArray(state.custom)?state.custom:[])].filter(q=>!removedIds.has(q.id)&&!removedIds.has(q.canonicalId));
  // 一个数学题一个档案，各来源和重做痕迹留在 occurrences。
  const all = () => {
    const groups=new Map();
    for(const q of raw()) {
      const key=q.canonicalId || q.id;
      if(!groups.has(key))groups.set(key,[]);
      groups.get(key).push(q);
    }
    return [...groups.values()].map(members=>{
      const rep=members[0];
      const statuses=members.map(q=>state.edits[q.id]?.firstStatus ?? q.firstStatus);
      const historicalAttempts=members.flatMap(q=>Array.isArray(state.attempts[q.id])?state.attempts[q.id]:[]);
      const groupStatus=statuses.includes('错误')||historicalAttempts.some(a=>a.result==='不会')?'错误':statuses.includes('蒙对')?'蒙对':statuses.includes('正确')?'正确':statuses.includes('已完成')?'已完成':'待核查';
      const pics=[...new Set(members.flatMap(q=>q.sourceImageRefs?.length?q.sourceImageRefs:(q.image?[q.image]:[])))];
      const wrongWithNote=members.find(q=>(state.edits[q.id]?.firstStatus??q.firstStatus)==='错误'&&(q.memo||q.analysis));
      return {...rep,memo:wrongWithNote?.memo??rep.memo,analysis:wrongWithNote?.analysis??rep.analysis,groupStatus,aliases:members.map(x=>x.id),occurrences:members,
        sourceImageRefs:pics,guessed:members.some(x=>x.guessed),
        sourceGradingDispute:members.some(x=>x.sourceGradingDispute), autoGradeDisabled:members.some(x=>x.autoGradeDisabled), issue:members.some(x=>x.issue), needsReview:members.some(x=>x.needsReview),
        related:members.length>1 ? members.length+' 次题源/作答记录已合并；任意一次错，按错优先统计。' : rep.related};
    });
  };
  const change = (q, key) => state.edits[q.id]?.[key] ?? q[key];
  const firstStatus = q => q.groupStatus || change(q,'firstStatus');
  const pointOf = q => change(q,'point') || '未分类';
  const topicOf = q => {const t=change(q,'topic') || '未分类';return /函数/.test(t)?'函数':t;};
  const attempts = q => (q.aliases||[q.id]).flatMap(id=>Array.isArray(state.attempts[id])?state.attempts[id]:[]).sort((a,b)=>String(a.at).localeCompare(String(b.at)));
  const wrongCount = q => window.WrongCount.count(q,attempts(q),state.edits);
  const isGuessed = q => q.guessed || firstStatus(q)==='蒙对';
  const currentState = q => {
    if(q.dailyNew&&!attempts(q).length)return '尚未作答';
    const list=attempts(q); if(!list.length)return firstStatus(q)==='已完成'?'作答结果未提供':firstStatus(q)==='错误'?'尚未复练':isMistake(q)?'不确定':'初次做对';
    if(list[list.length-1].result==='不会')return '仍不会';
    if(list[list.length-1].result!=='会了')return '不确定';
    let streak=0;for(let i=list.length-1;i>=0&&list[i].result==='会了';i--)streak++;
    return streak>=2?'连续做对':'最近做对';
  };
  const reviewPolicy = q => window.ReviewPolicy.classify({...q,firstStatus:firstStatus(q),audit:hasAuditIssue(q)},attempts(q));
  const isMistake = q => reviewPolicy(q).mistake;
  const isCorrectOnly = q => reviewPolicy(q).correct;
  const needReview = q => reviewPolicy(q).pending;
  const errorCategories=['分母或定义域条件遗漏','区间与端点错误','复合次序与换元错误','反函数概念或范围混淆','奇偶性或周期判断','公式与计算失误','审题或输入失误','没有解题思路','其他已记录错误','编码规则与进制运算','系统组成与软件概念','Windows操作与文件管理','基础概念与应用分类','名词单复数与可数性','所有格与复合形容词','代词指代与范围','冠词与数词','介词及固定搭配','词义与词性辨析','从句结构','题源多解或判分争议'];
  const errorCause = q => {
    if(q.subject==='英语'){
      if(q.sourceGradingDispute)return '题源多解或判分争议';
      const t=pointOf(q);
      if(/所有格|复合形容词/.test(t))return '所有格与复合形容词';
      if(/冠词|数词/.test(t))return '冠词与数词';
      if(/从句|关系代词/.test(t))return '从句结构';
      if(/代词|替代|neither|none|family/.test(t))return '代词指代与范围';
      if(/介词|固定|搭配|it用于/.test(t))return '介词及固定搭配';
      if(/不可数|单复数|复数|可数/.test(t))return '名词单复数与可数性';
      return '词义与词性辨析';
    }

    if(q.subject==='计算机') {
      const point=pointOf(q);
      if(/数制|编码/.test(point))return '编码规则与进制运算';
      if(/Windows/.test(point))return 'Windows操作与文件管理';
      if(/系统组成|软件|存储器|操作系统|性能指标/.test(point))return '系统组成与软件概念';
      return '基础概念与应用分类';
    }
    const text=[q.memo,q.analysis,...(q.occurrences||[]).flatMap(o=>[o.memo,o.analysis]),...attempts(q).filter(a=>a.result==='不会').map(a=>a.note)].filter(Boolean).join(' ');
    if(/分母|底数|真数|不能等于/.test(text))return errorCategories[0];
    if(/端点|开闭|区间|变号/.test(text))return errorCategories[1];
    if(/反函数|原值域|坐标互换/.test(text))return errorCategories[3];
    if(/复合|代入|换元|自变量|平方提前|复合层次/.test(text))return errorCategories[2];
    if(/奇偶|周期|奇函数|偶函数/.test(text))return errorCategories[4];
    if(/不细心|敲错|审题|格式|没注意/.test(text))return errorCategories[6];
    if(/公式|计算|立方|符号|移项/.test(text))return errorCategories[5];
    if(/不会|没思路|没有思路/.test(text))return errorCategories[7];
    return errorCategories[8];
  };
  const hasAuditIssue = q => !!q.issue || /待核查|未独立核查/.test(q.answerQuality||'');
  const hasRegression = q => window.CompletionCore.hasRegression(q,attempts(q));
  const getBadge = q => {
    if(hasRegression(q))return ['先对后错','bad'];
    if(isMistake(q))return [hasAuditIssue(q)?'错题 · 待核查':isGuessed(q)||currentState(q)==='不确定'?'错题 · 不确定':'错题','bad'];
    const s=firstStatus(q);
    if(s==='正确')return ['正确','good'];
    if(s==='已完成')return ['已完成',''];
    if(s==='蒙对')return ['蒙对','warn'];
    if(s==='错误')return ['错误','bad'];
    return ['待判定','warn'];
  };
  const countStatus = s => all().filter(q=>s==='错误'?isMistake(q):s==='正确'?isCorrectOnly(q):firstStatus(q)===s).length;
  async function save(){storageOkay=await persistence.save(state);return storageOkay;}

  let toastTimer;
  function toast(s){const el=$('toast');el.textContent=s;el.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('visible'),3800);}
  function updateSummary(){let qs=all();$('statTotal').textContent=qs.length;$('statCorrect').textContent=countStatus('正确');$('statWrong').textContent=countStatus('错误');let denom=countStatus('正确')+countStatus('错误');$('correctPercent').textContent=denom ? `${(100*countStatus('正确')/denom).toFixed(1)}% · 唯一题数`:'暂无足够记录';let n=qs.filter(needReview).length;$('statNeed').textContent=n;$('reviewTabCount').textContent=n;if($('completedTabCount'))$('completedTabCount').textContent=qs.filter(q=>attempts(q).length).length;}
  function populateFilters(){
    const oldSubject=$('subject').value,oldTopic=$('topic').value;
    const subjects=[...new Set(all().map(q=>q.subject).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'zh'));
    $('subject').innerHTML='<option value="">全部学科</option>'+subjects.map(s=>`<option value="${escape(s)}">${escape(s)}</option>`).join('');
    $('subject').value=subjects.includes(oldSubject)?oldSubject:'';
    const topics=[...new Set(all().filter(q=>!$('subject').value||q.subject===$('subject').value).map(topicOf))].sort((a,b)=>a.localeCompare(b,'zh'));
    $('topic').innerHTML='<option value="">全部专题</option>'+topics.map(s=>`<option value="${escape(s)}">${escape(s)}</option>`).join('');
    $('topic').value=topics.includes(oldTopic)?oldTopic:'';
  }
  // 题型是展示分组，不替代 canonicalId；不会删除题目或改变历史判定。
  const familyExample=(q,n=64)=>/\\(?:[()[\]]|frac|sqrt|ln|sin|cos|tan|begin)/.test(q.stem)?pointOf(q)+' · '+(q.sourceNo||q.seq):concise(q.stem,n);
  const familySpecCache=new Map();
  const familySpec=q=>{const key=[q.id,pointOf(q),q.stem,q.type].join('|');if(!familySpecCache.has(key))familySpecCache.set(key,window.QuestionFamilies.classify({...q,point:pointOf(q)}));return familySpecCache.get(key);};
  function familyGroups(qs=all()){
    const groups=new Map();
    for(const q of qs){const spec=familySpec(q);if(!groups.has(spec.id))groups.set(spec.id,{...spec,members:[],specs:[]});const g=groups.get(spec.id);g.members.push(q);g.specs.push(spec);}
    for(const g of groups.values()){
      g.wrong=g.members.filter(isMistake);
      g.correct=g.members.filter(isCorrectOnly);
      g.unknown=[];
      g.blocked=g.members.some(q=>hasAuditIssue(q)||q.autoGradeDisabled||isGuessed(q)||attempts(q).some(a=>a.result==='蒙对')||q.occurrences.some(o=>!['正确','错误'].includes(o.firstStatus)));
      g.sameConditions=new Set(g.specs.map(x=>x.template)).size===1||g.specs.every(x=>x.canAutoHide);
      g.hidden=g.confirmed&&g.members.length>=2&&g.correct.length===g.members.length&&!g.blocked&&g.sameConditions;
      g.reason=g.wrong.length?'同类曾错，继续显示':g.unknown.length?'对错未明确，继续显示':g.blocked?'含不确定或题源瑕疵，继续显示':g.members.length<2?'单题类型，继续显示':!g.sameConditions?'条件或问法有变化，继续显示':g.hidden?'同类均对，默认隐藏':'单独保留';
    }
    return [...groups.values()];
  }
  let familySelection='';
  const familyLookup=groups=>new Map(groups.flatMap(g=>g.members.map(q=>[q.id,g])));
  function refreshFamilyFilters(){
    const groups=familyGroups().filter(g=>(!$('subject').value||g.subject===$('subject').value)&&(!$('topic').value||g.members.some(q=>topicOf(q)===$('topic').value))),old=familySelection;
    $('familyType').innerHTML='<option value="">全部题型</option>'+groups.filter(g=>g.members.length>1||g.wrong.length||g.id===familySelection).sort((a,b)=>a.subject.localeCompare(b.subject,'zh')||a.name.localeCompare(b.name,'zh')).map(g=>`<option value="${escape(g.id)}">${escape(g.subject+' · '+g.name+' · '+g.members.length+'题 / 错'+g.wrong.length+' · 例：'+familyExample(g.members[0],18))}</option>`).join('');
    $('familyType').value=groups.some(g=>g.id===old)?old:'';
    familySelection=$('familyType').value;
  }
  function openFamily(id,errorsOnly=false){
    clearSearchPreserveTopic();familySelection=id;refreshFamilyFilters();$('familyType').value=id;
    $('status').value=errorsOnly?'错误':'';$('showCompleted').checked=false;
    view='archive';chosenId='';setViewUI();
  }
  function renderFamilyReport(qs=all()){
    const cards=window.CorrectMethods.build(qs,familySpec,reviewPolicy),correct=qs.filter(isCorrectOnly),mistakes=qs.filter(isMistake);
    $('familyReport').innerHTML=`<div class="method-heading"><div><p class="eyebrow">KEEP THE METHOD</p><h3>正确题，只复习方法。</h3><p class="description">${correct.length} 道纯正确题已收起，整理为 ${cards.length} 张方法卡。错题池共 ${mistakes.length} 道，包含不确定、蒙对、不会、未明确和核查题。原题与历史记录均保留。</p></div></div><div class="method-tools"><label>学科<select id="methodSubject"><option value="">全部学科</option>${[...new Set(cards.map(g=>g.subject))].map(v=>`<option>${escape(v)}</option>`).join('')}</select></label><label>找一个方法<input id="methodSearch" type="search" placeholder="如：所有格、定义域、编码…"></label></div><p class="fine-note" id="methodCount"></p><div id="correctMethodCards" class="method-grid"></div>`;
    function paint(){
      const subject=$('methodSubject').value,term=$('methodSearch').value.trim().toLowerCase(),visible=cards.filter(g=>(!subject||g.subject===subject)&&(!term||[g.name,g.method,g.trap,...g.correct.map(q=>pointOf(q))].join(' ').toLowerCase().includes(term)));
      $('methodCount').textContent=`${visible.length} 张方法卡 · 不安排正确题重刷`;
      $('correctMethodCards').innerHTML=visible.map(g=>`<details class="correct-method-card"><summary><span class="mini-label">${escape(g.subject)} · ${g.correct.length} 道正确题</span><strong>${escape(g.name)}</strong><span class="method-preview">${escape(concise(g.method,58))}</span><span class="method-expand">展开方法 ＋</span></summary><div class="method-body"><p><strong>这样做</strong><br>${escape(g.method)}</p><p><strong>留意条件</strong><br>${escape(g.trap)}</p><p class="fine-note">本卡覆盖：${escape([...new Set(g.correct.map(pointOf))].join('、'))}。归纳自现有题目，不代表此类所有题都已掌握。</p>${g.mistakes.length?`<p class="method-related">同类还有 ${g.mistakes.length} 道错题或不确定题。</p><button type="button" class="mini-link" data-method-mistakes="${escape(g.key)}">只看同类错题 →</button>`:'<p class="method-related">本卡当前没有同类错题，看看方法就好。</p>'}</div></details>`).join('')||'<p class="empty-state">没有匹配的方法，试试其他关键词。</p>';
      $('correctMethodCards').querySelectorAll('[data-method-mistakes]').forEach(b=>b.onclick=()=>{const card=cards.find(g=>g.key===b.dataset.methodMistakes);if(!card)return;methodMistakeIds=new Set(card.mistakes.map(q=>q.id));clearSearchPreserveTopic();methodMistakeIds=new Set(card.mistakes.map(q=>q.id));view='review';chosenId='';setViewUI();});
    }
    $('methodSubject').onchange=paint;$('methodSearch').oninput=paint;paint();
  }
  let methodMistakeIds=null;

  function getFiltered(){
    const term=$('search').value.trim().toLowerCase(),sub=$('subject').value,top=$('topic').value,status=$('status').value;
    const source=all(),byFamily=familyLookup(familyGroups(source));
    return source.filter(q=>{
      if(q.dailyNew&&view==='archive'&&chosenId!==q.id)return false;
      const family=byFamily.get(q.id);
      if(familySelection&&family?.id!==familySelection)return false;
      if(methodMistakeIds&&!methodMistakeIds.has(q.id))return false;
      if(view!=='completed'&&!$('showCompleted').checked&&status!=='正确'&&isCorrectOnly(q))return false;
      if(view==='completed'&&(!attempts(q).length||completedCategory&&(completedCategory==='先对后错'?!hasRegression(q):window.CompletionCore.category(attempts(q))!==completedCategory)&&gradedPin!==q.id))return false;
      if($('currentState').value && currentState(q)!==$ ('currentState').value)return false;
      if($('errorCause').value && (!isMistake(q)||errorCause(q)!==$ ('errorCause').value))return false;
      if(view==='review' && !needReview(q)&&gradedPin!==q.id)return false;
      if(sub && q.subject!==sub || top && topicOf(q)!==top)return false;
      if(status==='蒙对'&&!isGuessed(q) || status==='待核查'&&!hasAuditIssue(q))return false;
      if(status==='正确'&&!isCorrectOnly(q)||status==='错误'&&!isMistake(q)||status==='已完成'&&firstStatus(q)!=='已完成')return false;
      if($('difficulty').value && q.difficulty!==$('difficulty').value)return false;
      if(term&&!([q.stem,topicOf(q),pointOf(q),q.analysis,q.memo,q.id,q.sourceNo,q.source,Object.values(q.options||{}).join(' ')].join(' ').toLowerCase().includes(term)))return false;
      return true;
    });
  }
  const concise=(s,n=42)=>{s=String(s||'').replace(/\s+/g,' ');return s.length>n?s.slice(0,n)+'…':s;};
  function renderList(qs){
    if(view==='completed')qs=[...qs].sort((a,b)=>window.CompletionCore.category(attempts(a)).localeCompare(window.CompletionCore.category(attempts(b)),'zh')||a.subject.localeCompare(b.subject,'zh')||String(attempts(b).at(-1)?.at).localeCompare(String(attempts(a).at(-1)?.at)));
    const oldScroll=$('questionList').scrollTop;
    $('listCount').textContent=qs.length+' 条';
    $('questionList').innerHTML=qs.length ? qs.map(q=>{
      const [label,sty]=getBadge(q);
      return `<button type="button" role="option" aria-selected="${q.id===chosenId}" class="q-item ${q.id===chosenId?'active':''}" data-qid="${escape(q.id)}"><span class="q-top"><span>${escape(q.subject)} · ${escape(q.batch||'自录')} #${escape(q.seq)}</span><span class="status-chip ${sty}">${escape(label)}</span></span><span class="q-title">${escape(concise(q.stem,50))}</span><span class="q-point">${escape(pointOf(q))} · ${escape(q.difficulty||'待分级')} · ${escape(currentState(q))}</span></button>`;
    }).join('') : '<div class="empty-state"><h3>没有符合条件的题目</h3><p>可以清除筛选条件，或添加新的题目。</p></div>';
    $('questionList').scrollTop=oldScroll;
    $('questionList').querySelectorAll('[data-qid]').forEach(el=>el.addEventListener('click',()=>select(el.dataset.qid)));
  }
  const answerValue=q=>(q.verifiedAnswer||q.sourceAnswer||'').trim();
  function answerChoice(q){return window.StudyCore.answerKey({...q,audit:hasAuditIssue(q)});}
  function renderDetail(q){
    if(!q){$('detail').innerHTML='<div class="empty-state"><h3>选择一道题开始查看</h3><p>每道题保留原题、首次记录和后续复练历史。</p></div>';return;}
    const [badge,style]=getBadge(q);
    const last=attempts(q).at(-1),key=answerChoice(q),lastAnswer=last?.answer||'';
    const answerText=value=>[...String(value)].map(k=>q.options?.[k]?k+' · '+q.options[k]:k).join('；');
    const feedback=last&&lastAnswer&&key?`<section class="grade-comparison ${last.result==='会了'?'grade-right':'grade-wrong'}" role="status"><div class="grade-comparison-heading"><strong>${last.result==='会了'?'✓ 答对了':last.result==='不会'?'× 答错了':'? 不确定'}</strong><span>本次结果已保存 · 已归入完成记录</span></div><div class="grade-comparison-grid"><div><span>你的答案</span><p>${mathText(q,answerText(lastAnswer))}</p></div><div><span>正确答案</span><p>${mathText(q,answerText(key))}</p></div></div><p class="fine-note">结果留在本题供你对比，看完再点下一题。</p></section>`:'';

    const answer=answerValue(q);
    const spec=familySpec(q);
    const opt=Object.entries(q.options||{}).filter(([k,v])=>v);
    const optionMarks=window.OptionCore.normalize(state.edits[q.id]?.optionMarks,opt.map(([letter])=>letter));
    const optionsHTML=window.OptionUI.render(q,{answer:selectedOption,marks:optionMarks,revealed:showAnswer,key:answerChoice(q),format:txt=>mathText(q,txt)});
    const pics=(q.sourceImageRefs||[]).filter(x=>/^images\/[a-z0-9-]+\.(png|jpg|jpeg|webp)$/.test(x));
    const original=pics.length?`<div class="detail-section"><button class="collapsible" type="button" id="imageToggle">原始截图（${pics.length}张） <span>${showImage?'收起 −':'展开 ＋'}</span></button>${showImage?pics.map((pic,idx)=>`<figure class="screen-figure"><img src="${escape(pic)}" loading="lazy" alt="原始截图${idx+1}" /></figure>`).join(''):''}</div>`:'';
    const memoList=[q.memo?`<div class="memo-box"><span class="mini-label">你当时的记录</span><p>${escape(q.memo)}</p></div>`:'',q.analysis?`<div class="memo-box"><span class="mini-label">考点与错因分析</span><p>${mathText(q,q.analysis)}</p></div>`:''].join('');
    const reviewHistory=attempts(q).slice(-7).reverse().map(a=>`<div class="history-item"><strong>${escape(a.result)}</strong> · ${escape(dateStr(a.at))}${a.answer?' · 作答 '+escape(a.answer):''}${a.note?' · '+escape(concise(a.note,120)):''}</div>`).join('');
    const customMemo=noteDrafts[q.id] ?? state.edits[q.id]?.notes ?? '';
    if(window.MathJax?.typesetClear)window.MathJax.typesetClear([$ ('detail')]);
    $('detail').innerHTML=`
      ${feedback}<div class="detail-heading"><span class="wrong-count" data-wrong-count="${wrongCount(q)}">累计错了 ${wrongCount(q)} 次</span><div><div class="pathline">${escape(q.subject)} / ${escape(topicOf(q))} / ${escape(q.batch||'手动记录')} · 编号 ${escape(q.seq)}</div><h2>${escape(pointOf(q))}</h2><p class="fine-note">题源：${escape(q.source||'未记录')}</p><div class="pills"><span class="pill">${escape(q.type)}</span><span class="pill">难度：${escape(q.difficulty||'待分级')}</span><span class="pill">${escape(q.sourceNo||'原题')}</span><span class="status-chip ${style}">历史：${escape(badge)}</span><span class="pill">当前：${escape(currentState(q))}</span>${hasRegression(q)?'<span class="status-chip bad">先对后错 · 历史保留</span>':''}${hasAuditIssue(q)?'<span class="status-chip warn">需要核查</span>':''}${q.related?'<span class="pill">同题重做</span>':''}</div></div></div>
      ${window.QuestionAssist?.render({...q,events:attempts(q)},all().map(x=>({...x,events:attempts(x)})))||''}${window.QuestionCompare?.entry({...q,wrongCount:wrongCount(q)})||''}${window.ExerciseVocabUI?.entry(q)||''}
      <div class="detail-section"><h3 class="section-title">原题 · 完整题干</h3><div class="stem">${mathText(q,q.stem)}</div>${q.questionImage&&/^images\/[a-z0-9-]+\.(png|jpg|jpeg|webp)$/.test(q.questionImage)?`<figure class="screen-figure"><img src="${escape(q.questionImage)}" alt="题目所需接口图" /></figure>`:''}${optionsHTML}${opt.length?'<p class="fine-note">答案明确的单选题选完即自动判分并保存；首次作答不变。</p>':''}</div>
      <div class="detail-section family-method"><h3 class="section-title">所属题型 · ${escape(spec.name)}</h3><p><strong>共同方法：</strong>${mathText(q,spec.method)}</p><p><strong>易错提醒：</strong>${mathText(q,spec.trap)}</p><button class="mini-link" id="openSameFamily" type="button">统计并查看本类题目</button></div>
      <div class="detail-section"><h3 class="section-title">第一次作答记录</h3><div class="record-strip"><div class="record-box"><span class="mini-label">其中一次答案</span><span class="record-value">${mathText(q,q.ownAnswer||'未记录')}</span></div><div class="record-box"><span class="mini-label">错优先结果</span><span class="record-value">${escape(badge)}</span></div><div class="record-box"><span class="mini-label">知识点</span><span class="record-value">${escape(pointOf(q))}</span></div></div>${memoList||'<p class="fine-note">当时没有记录额外错因。</p>'}${q.occurrences?.length>1?`<div class="memo-box"><span class="mini-label">全部来源与历次作答（错优先统计）</span>${q.occurrences.map(o=>`<p>${escape(o.batch||'')} · ${escape(o.source||'')} · ${escape(o.firstStatus||'待核查')} · ${escape(o.ownAnswer||o.memo||'未记录答案')}</p>`).join('')}</div>`:''}</div>
      <div class="detail-section"><button class="collapsible" id="answerToggle" type="button">${q.subject==='英语'?'题目翻译 / 详细解析 / 选项辨析':'答案 / 解析与核查'} <span>${showAnswer?'收起 −':'查看 ＋'}</span></button>${showAnswer?`<div class="answer-content"><p class="answer-line">${mathText(q,answer||'暂无可靠参考答案')}</p>${q.verifiedAnswer?`<p>独立核查：${mathText(q,q.verifiedAnswer)}</p><p>原平台给出：${mathText(q,q.sourceAnswer||'未显示')}</p>`:''}${q.subject==='英语'?`<p class="fine-note">核对依据：${escape(q.answerQuality||'')}</p>`:''}${q.referenceUrl&&String(q.referenceUrl).startsWith('https://')?`<p><a href="${escape(q.referenceUrl)}" target="_blank" rel="noopener">查看用法核对依据</a></p>`:''}${q.questionNote?`<p>核查备注：${mathText(q,q.questionNote)}</p>`:''}${q.answerSourcePath?`<p><a href="${escape(q.answerSourcePath)}#page=${Number(q.answerSourcePage)}" target="_blank">查看对应官方答案页</a></p>`:''}${hasAuditIssue(q)?`<p class="answer-issue">核查状态：${escape(q.answerQuality||'尚待核对')}。请优先对照原图，不自动判定未经核查的答案。</p>`:''}${window.EnglishLesson?.render(q)||''}${window.MathLesson?.render(q)||''}${!window.EnglishLesson?.get(q)&&!window.MathLesson?.get(q)&&!q.analysis&&!q.questionNote?'<p class="fine-note">此批记录保留原题和原始备注，未另行编造标准解析。</p>':''}</div>`:''}</div>
      ${original}
      <div class="detail-section"><div class="review-dock"><h3>${view==='review'?'本次错题重练':'记录本次复习'}</h3><p>答案明确的单选题点击即判分并保存，多选题提交后自动判分；已完成记录按最近结果归类。</p><label class="input-row"><span>本次笔记（可选）</span><textarea id="reviewNote" rows="2" placeholder="这次为什么做对 / 还卡在哪里">${escape(customMemo)}</textarea></label><div class="review-actions">${opt.length&&(!answerChoice(q)||q.type==='多选题')?'<button type="button" class="mark-btn" id="checkChoice">提交并自动判分</button>':''}${!answerChoice(q)?'<button type="button" class="mark-btn good" data-mark="会了">本次会了</button><button type="button" class="mark-btn bad" data-mark="不会">仍然不会</button>':''}<button type="button" class="mark-btn warn" data-mark="蒙对">蒙对 / 不确定</button></div>${reviewHistory?`<div class="review-history"><strong>最近复练记录</strong>${reviewHistory}</div>`:'<p class="fine-note" style="margin-top:10px">暂无再次复习的记录。</p>'}</div></div>
      ${q.related?`<div class="memo-box warning-box"><span class="mini-label">重复 / 关联信息</span><p>${escape(q.related)}。统计按作答记录计算，不等同于独立题目数。</p></div>`:''}
      <div class="detail-section"><h3 class="section-title">个人补充备注</h3><label class="input-row"><span>自己随时更新的理解（不覆盖当时原始备注）</span><textarea id="personalNote" rows="3" placeholder="复习后补充的规律、公式、易错点">${escape(personalDrafts[q.id]??state.edits[q.id]?.personal??'')}</textarea></label><div style="margin-top:10px"><button class="btn neutral" id="savePersonal" type="button">保存备注</button></div></div>
      <div class="bottom-nav"><button class="btn neutral" type="button" id="prevQuestion">← 上一题</button><button class="btn neutral" type="button" id="nextQuestion">下一题 →</button></div>`;
    if(window.MathJax?.startup?.promise)window.MathJax.startup.promise.then(()=>window.MathJax.typesetPromise([$ ('detail')])).catch(()=>{});
    else if(window.MathJax?.typesetPromise)window.MathJax.typesetPromise([$ ('detail')]).catch(()=>{});
    const linkedNotes=window.PersonalCore.normalizeLibrary(state.library).notes.filter(n=>!n.deletedAt&&(q.aliases||[q.id]).includes(n.questionId));
    if(linkedNotes.length)$('detail').insertAdjacentHTML('beforeend','<div class="detail-section"><h3 class="section-title">原有笔记</h3>'+linkedNotes.map(n=>`<details><summary>${escape(n.title)}</summary><p style="white-space:pre-wrap">${escape(n.content||n.description||'')}</p></details>`).join('')+'</div>');
    const captureNote = () => { if($('reviewNote')) noteDrafts[q.id]=$('reviewNote').value;if($('personalNote'))personalDrafts[q.id]=$('personalNote').value; };
    $('detail').querySelectorAll('[data-option]').forEach(el=>el.addEventListener('click',async()=>{
      if(autoSaving)return;captureNote();const letter=el.dataset.option,outcome=window.CompletionCore.autoResult({...q,audit:hasAuditIssue(q)},letter);
      if(outcome){selectedOption=letter;showAnswer=true;if(autoSavedChoice===q.id+'|'+letter){renderDetail(q);return;}autoSaving=true;gradedPin=q.id;$('detail').querySelectorAll('.opt-button,.option-mark-button').forEach(b=>b.disabled=true);
        try{if(optionMarks[letter]==='exclude')await saveOptionMarks(q.id,{...optionMarks,[letter]:undefined});const ok=await recordAttempt(q,outcome);if(ok){autoSavedChoice=q.id+'|'+letter;toast(outcome==='会了'?'已自动判对并保存到“已完成记录”':'已自动判错并保存到“已完成记录”，继续保留待练');}}
        finally{autoSaving=false;if(q.id===chosenId)renderDetail(q);}return;
      }
      const next=window.OptionCore.choose(selectedOption,optionMarks,letter,q.type==='多选题');selectedOption=next.answer;if(optionMarks[letter]==='exclude')await saveOptionMarks(q.id,next.marks);renderDetail(q);
    }));
    $('detail').querySelectorAll('[data-option-mark]').forEach(el=>el.onclick=()=>{captureNote();const next=window.OptionCore.mark(selectedOption,optionMarks,el.dataset.optionMark,el.dataset.markKind);selectedOption=next.answer;const task=saveOptionMarks(q.id,next.marks);renderDetail(q);task.then(ok=>{if(!ok)toast('选项标记尚未保存，请导出备份');});});
    $('detail').querySelector('[data-clear-option-marks]')?.addEventListener('click',()=>{captureNote();const task=saveOptionMarks(q.id,{});renderDetail(q);task.then(ok=>{if(!ok)toast('选项标记尚未保存，请导出备份');});});
    $('detail').querySelectorAll('[data-mark]').forEach(el=>el.addEventListener('click',()=>recordAttempt(q,el.dataset.mark)));
    $('openSameFamily').addEventListener('click',()=>openFamily(spec.id));
    $('answerToggle').addEventListener('click',()=>{captureNote();showAnswer=!showAnswer;renderDetail(q)});
    if($('imageToggle')) $('imageToggle').addEventListener('click',()=>{captureNote();showImage=!showImage;renderDetail(q)});
    if($('checkChoice'))$('checkChoice').addEventListener('click',async()=>{
      if(!selectedOption){toast('请先选择选项');return;}
      const key=answerChoice(q);if(!key){showAnswer=true;renderDetail(q);toast('该题答案不适合自动判分，请对照原图后手动记录');return;}
      captureNote();showAnswer=true;const ok=await recordAttempt(q,selectedOption===key?'会了':'不会');if(q.id===chosenId)$('detail').querySelector('.marked-options')?.scrollIntoView({block:'center',behavior:'smooth'});if(ok)toast(selectedOption===key?'本次答案正确，复练已保存':'本次答案不正确，复练已保存');
    });
    $('savePersonal').addEventListener('click',async()=>{
      state.edits[q.id]={...(state.edits[q.id]||{}),personal:$('personalNote').value,modifiedAt:nowISO()};
      const ok=await save();if(ok)delete personalDrafts[q.id];toast(ok?'个人备注已保存':'备注仍在本页，尚未保存；请立即导出备份');
    });
    const ids=getFiltered().map(x=>x.id),i=ids.indexOf(q.id);
    $('prevQuestion').disabled=i<=0; $('nextQuestion').disabled=i<0||i>=ids.length-1;
    $('prevQuestion').addEventListener('click',()=>select(ids[i-1]));
    $('nextQuestion').addEventListener('click',()=>select(ids[i+1]));
  }
  function renderQuestions(){
    const qs=getFiltered();
    const hidden=familyGroups().filter(g=>g.hidden).reduce((n,g)=>n+g.members.length,0);
    $('familyNotice').textContent=view==='completed'?'已保存的作答集中在这里：按学科筛选，按最近结果分为已会、未掌握、不确定。历史始终保留。':$('showCompleted').checked?'已手动显示正确题；日常练习仍只安排错题。':`正确题默认隐藏，搜索和选择题型也不会自动展开。到“薄弱点追踪”查看同类新题的表现；原题可手动显示。`;
    if(!qs.some(q=>q.id===chosenId)){chosenId=qs[0]?.id||'';selectedOption='';showAnswer=false;showImage=false;}
    renderList(qs);renderDetail(qs.find(q=>q.id===chosenId));
  }
  function select(id){if(!id||chosenId===id)return;chosenId=id;gradedPin='';autoSavedChoice='';selectedOption='';showAnswer=false;showImage=false;renderQuestions();if(window.matchMedia('(max-width:700px)').matches)$('detail').scrollIntoView({behavior:'smooth',block:'start'});}
  async function saveOptionMarks(id,value){const q=all().find(q=>q.id===id);if(!q)return false;state.edits[id]={...(state.edits[id]||{}),optionMarks:window.OptionCore.normalize(value,Object.keys(q.options||{})),modifiedAt:nowISO()};return save();}
  async function recordAttempt(q,result){
    const n=$('reviewNote')?.value||'';
    const a={eventId:'event-'+Date.now()+'-'+Math.random().toString(36).slice(2),at:nowISO(),result,answer:selectedOption,note:n,optionMarks:window.OptionCore.normalize(state.edits[q.id]?.optionMarks,Object.keys(q.options||{}))};
    state.attempts[q.id]=[...(Array.isArray(state.attempts[q.id])?state.attempts[q.id]:[]),a];
    state.edits[q.id]={...(state.edits[q.id]||{}),notes:n,modifiedAt:nowISO()};
    delete noteDrafts[q.id];
    const ok=await save();updateSummary();refreshFamilyFilters();renderQuestions();toast(ok?'本次复练已保存，可在顶部对照答案':'本次记录仍在本页，尚未保存；请立即导出备份');return ok;
  }
  function renderStats(){
    const qs=all();renderFamilyReport(qs);const grouped=new Map();
    for(const q of qs){const key=q.subject+'｜'+topicOf(q);if(!grouped.has(key))grouped.set(key,[]);grouped.get(key).push(q);}
    $('topicReport').innerHTML='<h3>章节与当前掌握</h3><p class="description">同一章节集中统计，展开查看考点。历史错误永久保留；连续做对指最近两次复练均标记会了。</p>'+[...grouped.entries()].map(([key,items])=>{
      const wrong=items.filter(isMistake).length;const states=new Map();for(const q of items){const name=currentState(q);states.set(name,(states.get(name)||0)+1);}
      const points=new Map();for(const q of items){const name=pointOf(q);if(!points.has(name))points.set(name,[]);points.get(name).push(q);}
      return `<div class="topic-row"><div class="topic-stats"><strong>${escape(key)}</strong><span>${items.length} 道独立题</span></div><p class="fine-note">错题池 ${wrong} · 待复习 ${items.filter(needReview).length}</p><div class="pills">${[...states].map(([name,n])=>`<span class="pill">${escape(name)} ${n}</span>`).join('')}</div><details class="point-details"><summary>展开内部考点</summary>${[...points].map(([name,list])=>`<div class="point-summary"><span>${escape(name)}</span><span>${list.length}题 · 曾错${list.filter(isMistake).length}</span></div>`).join('')}</details></div>`;
    }).join('');
    const errors=qs.filter(isMistake);
    $('errorReport').innerHTML='<h3>错因汇总</h3><p class="description">数学依据备注与现有分析归纳；计算机与英语按错题涉及的知识点归类；英语判分争议单列，不推断未提供的个人原因。每题只计一类，原始记录保留。</p>'+errorCategories.map(c=>{const list=errors.filter(q=>errorCause(q)===c);if(!list.length)return '';return `<div class="error-line"><div class="topic-stats"><strong>${escape(c)}</strong><button type="button" class="mini-link" data-cause="${escape(c)}">查看 ${list.length} 题</button></div><small>仍待复习 ${list.filter(needReview).length} 题</small></div>`;}).join('');
    const events=qs.flatMap(attempts);const latest=qs.map(q=>attempts(q).at(-1)).filter(a=>a&&['会了','不会'].includes(a.result));
    const initial=qs.filter(q=>q.occurrences?.some(o=>o.firstStatus==='正确'||o.firstStatus==='错误'));
    const firstRight=initial.filter(q=>q.occurrences[0].firstStatus==='正确').length;
    const rate=(right,total)=>total?(100*right/total).toFixed(1)+'%':'暂无记录';
    $('reviewReport').innerHTML=`<h3>复练进步与复习顺序</h3><div class="record-strip"><div class="record-box"><span class="mini-label">独立题目</span><strong>${qs.length}</strong></div><div class="record-box"><span class="mini-label">已保存来源 / 作答记录</span><strong>${raw().length} + ${events.length} 次复练</strong></div><div class="record-box"><span class="mini-label">最近复练正确率（每题最后一次）</span><strong>${rate(latest.filter(a=>a.result==='会了').length,latest.length)}</strong></div></div><p class="description">首次正确率 ${rate(firstRight,initial.length)}：按现有最早来源记录统计；上方“正确/错题”按统一复习规则统计。来源顺序未必是实际首次作答时间。蒙对和不确定不计入正确率。</p><div class="tier-list">${['易','中','难'].map(level=>{const list=qs.filter(q=>q.difficulty===level);return `<div class="tier-row"><span class="tier-tag">${level}</span><strong>${list.length} 题</strong><span>错题池 ${list.filter(isMistake).length}</span><span>待复习 ${list.filter(needReview).length}</span></div>`;}).join('')}</div><p class="description">复习顺序：先轮完尚未复练的题，再从最久没练的题开始；刚做错的往后放，不因不会而反复抢占下一轮。最近做对和连续做对单独显示，历史错题数量不因此减少。</p>`;
    $('errorReport').querySelectorAll('[data-cause]').forEach(el=>el.addEventListener('click',()=>{clearSearchPreserveTopic();$('errorCause').value=el.dataset.cause;view='archive';chosenId='';setViewUI();}));
  }
  function clearSearchPreserveTopic(){methodMistakeIds=null;$('difficulty').value='';if($('showCompleted'))$('showCompleted').checked=!state.ui.hideCorrectQuestions;familySelection='';if($('familyType'))$('familyType').value='';$('currentState').value='';$('errorCause').value='';$('search').value='';$('status').value='';$('subject').value='';populateFilters();$('topic').value='';}
  function setViewUI(){
    $('listeningView').classList.toggle('hidden',view!=='listening');if(view!=='listening')window.ListeningUI.pause();
    document.querySelectorAll('[data-view]').forEach(btn=>btn.classList.toggle('selected',btn.dataset.view===view||(view==='practice'&&btn.dataset.view===(state.ui.studySession?.dailyNew?'daily':'home'))));
    window.DeskUI.sync(view);
    $('statsView').classList.toggle('hidden',view!=='stats');$('questionsView').classList.toggle('hidden',!['archive','review','completed'].includes(view));
    $('newDailyView').classList.toggle('hidden',view!=='daily');
    $('homeView').classList.toggle('hidden',view!=='home');$('practiceView').classList.toggle('hidden',view!=='practice');
    document.body.classList.toggle('study-view',view==='daily'||view==='home'||view==='practice');
    document.body.classList.toggle('practice-view',view==='practice');
    $('libraryView').classList.toggle('hidden',view!=='library');$('personalizeView').classList.toggle('hidden',view!=='personalize');
    document.body.classList.toggle('personal-view',view==='library'||view==='personalize');
    if(view==='listening'){window.ListeningUI.render();window.JournalAppearance.apply();return;}
    if(view==='daily'){window.DailyNewUI.render();window.JournalAppearance.apply();return;}
    if(view==='library'){window.LibraryUI.render();return;}
    if(view==='personalize'){window.PersonalizeUI.render();return;}
    if(view==='daily'||view==='home'||view==='practice'){window.StudyUI.render(view);window.JournalAppearance.apply();return;}
    $('listEyebrow').textContent=view==='review'?'REVIEW':'ARCHIVE';
    $('listHeading').textContent=view==='completed'?'已完成记录':view==='review'?'待练错题与不确定题':'题目目录';
    $('completedGroups').classList.toggle('hidden',view!=='completed');
    if(view==='completed'){const done=all().filter(q=>attempts(q).length);$('completedGroups').innerHTML=['','已会','未掌握','不确定','先对后错'].map(name=>`<button class="mini-link ${completedCategory===name?'selected':''}" type="button" data-completed-category="${name}">${name||'全部完成'} · ${done.filter(q=>!name||(name==='先对后错'?hasRegression(q):window.CompletionCore.category(attempts(q))===name)).length}</button>`).join('');$('completedGroups').querySelectorAll('[data-completed-category]').forEach(el=>el.onclick=()=>{completedCategory=el.dataset.completedCategory;chosenId='';setViewUI();});}
    if(view==='stats')window.WeaknessUI.render();else renderQuestions();
  }
  function changeView(v){if(v==='library')v='stats';gradedPin='';methodMistakeIds=null;completedCategory='';clearSearchPreserveTopic();view=v;chosenId='';selectedOption='';showAnswer=false;showImage=false;setViewUI();if(['daily','home','practice','library','personalize','listening'].includes(v))window.scrollTo({top:0,behavior:'auto'});}
  async function addQuestion(form){
    let f=new FormData(form);let v=k=>String(f.get(k)||'').trim();
    if(!v('stem')||!v('topic')||!v('subject')){toast('请填写学科、专题和完整题干');return;}
    const seq=all().length+1,id='CQZSB-CUSTOM-'+Date.now()+'-'+Math.random().toString(36).slice(2,6);
    const options={};for(const x of 'ABCD')if(v(x))options[x]=v(x);
    const q={id,seq,batch:'手动录入',archivedAt:new Date().toISOString().slice(0,10),subject:v('subject'),topic:v('topic'),point:v('point'),type:v('type'),stem:v('stem'),options,sourceAnswer:v('answer'),verifiedAnswer:'',answerQuality:'手动录入，未独立核查',ownAnswer:v('ownAnswer'),firstStatus:v('firstStatus'),memo:v('memo'),analysis:'',questionNote:'',needsReview:v('firstStatus')!=='正确',issue:!v('answer'),guessed:false,related:'',image:'',source:v('source'),sourceNo:'手动添加',difficulty:v('difficulty')||'中',canonicalId:id,sourceImageRefs:[],custom:true};
    state.custom.push(q);const ok=await save();form.reset();$('addDialog').close();populateFilters();view='archive';chosenId=q.id;clearSearchPreserveTopic();updateSummary();refreshFamilyFilters();setViewUI();toast(ok?'题目已添加并保存。':'题目已添加到本页，尚未保存；请立即导出备份。');
  }
  async function exportJson(){
    await window.ListeningUI.flush();
    const backup={format:'cqzsb-personal-journal-backup-v1',exportedAt:nowISO(),description:'个人刷题记录中心：基础题目 + 新增题目 + 历次复习 + 个性备注',baseRecordCount:base.length,records:all(),state};
    const recovery=persistence.getRecovery();if(recovery.length)backup.storageRecovery=recovery;
    const blob=new Blob([JSON.stringify(backup,null,2)],{type:'application/json;charset=utf-8'});
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='专升本_刷题记录备份_'+new Date().toISOString().slice(0,10)+'.json';document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},1000);toast('完整 JSON 备份已导出。换浏览器或更换新版前请保存好。');
  }
  function normaliseImported(q){
    if(!q||typeof q!=='object'||typeof q.stem!=='string'||!q.stem.trim())return null;
    let daily={};if(q.dailyNew){try{window.DailyNewCore.validateBank([q]);daily={dailyNew:true,dailyDate:q.dailyDate,dailyRole:q.dailyRole,section:q.section,skillTag:q.skillTag,mathLesson:q.mathLesson,englishLesson:q.englishLesson};}catch{return null;}}
    return {...daily,id:String(q.id||'CQZSB-IMPORTED-'+Date.now()+'-'+Math.random().toString(36).slice(2)),seq:q.seq||all().length+1,batch:q.batch||'导入题目',archivedAt:q.archivedAt||new Date().toISOString().slice(0,10),subject:q.subject||'未分类',topic:q.topic||'未分类',point:q.point||'',type:q.type||'其他',stem:q.stem,options:q.options&&typeof q.options==='object'?q.options:{},sourceAnswer:q.sourceAnswer||'',verifiedAnswer:q.verifiedAnswer||'',answerQuality:q.answerQuality||'导入题目，未人工核查',ownAnswer:q.ownAnswer||'',firstStatus:q.firstStatus||'待核查',memo:q.memo||'',analysis:q.analysis||'',questionNote:q.questionNote||'',sourceGradingDispute:!!q.sourceGradingDispute,userCorrection:q.userCorrection||'',platformStatus:q.platformStatus||'',autoGradeDisabled:!!q.autoGradeDisabled,referenceUrl:q.referenceUrl||'',needsReview:!!q.needsReview,issue:!!q.issue,guessed:!!q.guessed,related:q.related||'',image:'',source:q.source||'',sourceNo:q.sourceNo||'导入',custom:true,canonicalId:q.canonicalId||q.id,difficulty:q.difficulty||'中',sourceImageRefs:[],...(window.QuestionAssist?.sourceFields(q)||{})};
  }
  async function importJson(file){
    await window.ListeningUI.flush();
    let data;try{data=JSON.parse(await file.text());}catch{toast('文件不是有效 JSON 格式');return;}
    if(data?.format==='cqzsb-daily-bank-v1'){try{await window.DailyNewUI.importData(data);changeView('daily');}catch(error){toast(error.message);}return;}
    const knownIds=new Set(raw().map(q=>q.id));let newCount=0,newEvents=0;
    const inputs=Array.isArray(data)?data : (Array.isArray(data.records)?data.records:[]);
    for(const q0 of inputs){
      if(q0&&knownIds.has(q0.id))continue;
      const q=normaliseImported(q0);if(!q||knownIds.has(q.id))continue;
      if(removedIds.has(q.id)||removedIds.has(q.canonicalId))continue;
      state.custom.push(q);knownIds.add(q.id);newCount++;
    }
    if(data.format==='cqzsb-personal-journal-backup-v1' && data.state){
      const other=data.state;
      if(other.ui?.listeningVocabulary)state.ui.listeningVocabulary=window.ListeningVocabCore.merge(state.ui.listeningVocabulary,other.ui.listeningVocabulary);
      if(other.ui?.listeningRoute)state.ui.listeningRoute=window.ListeningRouteCore.merge(state.ui.listeningRoute,other.ui.listeningRoute);
      if(other.ui?.listeningPractice)state.ui.listeningPractice=window.ListeningCore.merge(state.ui.listeningPractice,other.ui.listeningPractice);
      state.library=window.PersonalCore.mergeLibrary(state.library,other.library);
      if(other.ui?.appearance){const appearance=window.PersonalCore.appearance(other.ui.appearance);if(appearance.updatedAt>=(state.ui.appearance?.updatedAt||'')){state.ui.appearance=appearance;window.JournalAppearance.restore(appearance);}}
      if(!state.ui.dailyPreferences&&other.ui?.dailyPreferences)state.ui.dailyPreferences=other.ui.dailyPreferences;
      if(other.ui?.sessionArchive&&typeof other.ui.sessionArchive==='object')state.ui.sessionArchive={...other.ui.sessionArchive,...(state.ui.sessionArchive||{})};
      if(other.ui?.dailyNew){const incoming=other.ui.dailyNew,current=state.ui.dailyNew||{};let bank=current.bank||[];try{bank=window.DailyNewCore.validateBank([...(current.bank||[]),...(incoming.bank||[])]);}catch{}state.ui.dailyNew={...incoming,...current,days:{...(incoming.days||{}),...(current.days||{})},bank};}
      if(other.attempts&&typeof other.attempts==='object'){
        for(const [id,events] of Object.entries(other.attempts)){
          if(!knownIds.has(id)||!Array.isArray(events))continue;
          const existing=state.attempts[id]||[],evIDs=new Set(existing.map(e=>e.eventId||e.at+'-'+e.result+'-'+e.answer));
          for(const ev of events){if(!ev||typeof ev!=='object')continue;const key=ev.eventId||ev.at+'-'+ev.result+'-'+ev.answer;if(!evIDs.has(key)){existing.push(ev);evIDs.add(key);newEvents++;}}
          existing.sort((a,b)=>String(a.at).localeCompare(String(b.at)));state.attempts[id]=existing;
        }
      }
      if(other.edits&&typeof other.edits==='object')for(const [id,edit] of Object.entries(other.edits)){
        if(!knownIds.has(id)||!edit)continue;
        if(!state.edits[id]||String(edit.modifiedAt||'')>String(state.edits[id].modifiedAt||''))state.edits[id]=edit;
      }
      // Restore portable study progress into an empty installation without replacing an active round.
      if(!state.ui.studySession&&other.ui?.studySession){
        const restored=window.StudyCore.restore(other.ui.studySession,all().map(q=>({...q,mistake:isMistake(q)})));
        if(restored)state.ui.studySession=restored;
      }

    }
    if(!newCount&&!newEvents && data.format!=='cqzsb-personal-journal-backup-v1'){toast('未找到可新增的题目；请选择本程序导出的备份或规范化记录 JSON');return;}
    window.StudyUI.reset();const ok=await save();populateFilters();refreshFamilyFilters();updateSummary();setViewUI();toast(ok?`导入并保存完成：新增题目 ${newCount} 条，合并复练 ${newEvents} 次。相同编号不会重复添加。`:'已读入当前页面，但浏览器未能保存；请立即导出备份。');
  }
  $('showCompleted').checked=!state.ui.hideCorrectQuestions;
  $('showCompleted').addEventListener('change',async()=>{state.ui.hideCorrectQuestions=!$('showCompleted').checked;renderQuestions();await save();});
  $('familyType').addEventListener('change',()=>{familySelection=$('familyType').value;renderQuestions();});
  $('topic').addEventListener('change',()=>{familySelection='';$('familyType').value='';refreshFamilyFilters();renderQuestions();});
  $('difficulty').addEventListener('change',()=>renderQuestions());
  document.querySelectorAll('.nav-tab').forEach(btn=>btn.addEventListener('click',()=>changeView(btn.dataset.view)));
  ['search','status','currentState','errorCause'].forEach(id=>$(id).addEventListener(id==='search'?'input':'change',()=>renderQuestions()));
  $('subject').addEventListener('change',()=>{familySelection='';$('familyType').value='';$('errorCause').value='';populateFilters();refreshFamilyFilters();renderQuestions()});
  $('clearFilters').addEventListener('click',()=>{clearSearchPreserveTopic();renderQuestions()});
  $('exportButton').addEventListener('click',exportJson);
  $('importButton').addEventListener('click',()=>$('importFile').click());
  $('importFile').addEventListener('change',async e=>{if(e.target.files?.[0])await importJson(e.target.files[0]);e.target.value='';});
  $('addButton').addEventListener('click',()=>$('addDialog').showModal());
  document.querySelectorAll('[data-close]').forEach(el=>el.addEventListener('click',()=>$((el.dataset.close)).close()));
  $('addForm').addEventListener('submit',e=>{e.preventDefault();addQuestion(e.target)});
  document.addEventListener('keydown',e=>{
    const tag=document.activeElement?.tagName?.toLowerCase();if(['input','textarea','select'].includes(tag)||['stats','home','practice','library','personalize'].includes(view)||document.querySelector('dialog[open]')||e.ctrlKey||e.altKey||e.metaKey)return;
    const ids=getFiltered().map(x=>x.id),i=ids.indexOf(chosenId);
    if(e.key==='ArrowRight'&&i<ids.length-1){e.preventDefault();select(ids[i+1])}
    if(e.key==='ArrowLeft'&&i>0){e.preventDefault();select(ids[i-1])}
  });
  function openArchivedQuestion(id){document.querySelectorAll('dialog[open]').forEach(d=>d.close());clearSearchPreserveTopic();$('search').value=id;view='archive';chosenId=id;gradedPin='';autoSavedChoice='';selectedOption='';showAnswer=false;showImage=false;setViewUI();$('detail').scrollIntoView({block:'start'});}
  window.DeskUI.init({navigate:changeView,questions:()=>all(),resources:()=>[],openQuestion:openArchivedQuestion});
  window.LibraryUI.init({questions:()=>all(),openQuestion:openArchivedQuestion,getLibrary:()=>state.library,async saveLibrary(value){state.library=window.PersonalCore.normalizeLibrary(value);return save();},navigate:changeView,toast});
  window.addEventListener('journal-appearance-change',async e=>{
    state.ui.appearance=window.PersonalCore.appearance(e.detail.settings);
    const ok=await save();const label=$('appearanceSaveStatus');if(label)label.textContent=ok?'外观已保存，也会随完整 JSON 备份导出。':'外观已应用，但尚未保存，请导出备份。';
    if(!ok)toast('外观尚未保存，请导出备份以保留设置。');
  });
  window.StudyUI.init({
    getOptionMarks:id=>state.edits[id]?.optionMarks||{},saveOptionMarks,
    questions:()=>all().map(q=>({...q,topic:topicOf(q),current:currentState(q),wrongCount:wrongCount(q),review:needReview(q),mistake:isMistake(q),events:attempts(q),audit:hasAuditIssue(q)})),
    getSession:()=>state.ui.studySession,
    preferences:()=>state.ui.dailyPreferences||{},
    async savePreferences(value){state.ui.dailyPreferences=value;return save();},
    async saveSession(value){state.ui.studySession=value;return save();},
    async commit(session,id,event){
      if(!all().some(q=>q.id===id))return false;
      const events=Array.isArray(state.attempts[id])?state.attempts[id]:[];
      state.attempts[id]=[...events.filter(a=>a.eventId!==event.eventId),event];
      state.edits[id]={...(state.edits[id]||{}),notes:event.note,modifiedAt:event.at};
      state.ui.studySession=session;
      const ok=await save();updateSummary();refreshFamilyFilters();return ok;
    },
    navigate:changeView,toast
  });
  const dailyQuestions=()=>all().map(q=>({...q,events:attempts(q),wrongCount:wrongCount(q),initialCorrect:(q.occurrences||[q]).some(o=>(state.edits[o.id]?.firstStatus??o.firstStatus)==='正确')}));
  window.ListeningVocabUI.init({get:()=>state.ui.listeningVocabulary||{},async save(value){state.ui.listeningVocabulary=window.ListeningVocabCore.normalise(value);return save();}});
  window.ListeningRoute.init({get:()=>state.ui.listeningRoute||{},async save(value){state.ui.listeningRoute=window.ListeningRouteCore.normalise(value);return save();}});
  window.ListeningUI.init({get:()=>state.ui.listeningPractice||{},async save(value){state.ui.listeningPractice=window.ListeningCore.normalise(value);return save();}});
  window.QuestionCompare.init({questions:dailyQuestions});
  window.WeaknessUI.init({questions:dailyQuestions,plan:()=>state.ui.dailyNew||{days:{},bank:[]},navigate:changeView,openQuestion:id=>{openArchivedQuestion(id);$('showCompleted').checked=true;chosenId=id;renderQuestions();}});
  window.DailyNewUI.init({
    getPlan:()=>state.ui.dailyNew||{version:1,stage:{oldQuestionsCompleted:true,declaredOn:'2026-10-19'},days:{},bank:[]},
    questions:dailyQuestions,
    async savePlan(value){state.ui.dailyNew=value;return save();},
    async installDay(plan,records){const known=new Map(raw().map(q=>[q.id,q]));for(const q of records){if(known.has(q.id)&&window.DailyNewCore.fingerprint(known.get(q.id))!==window.DailyNewCore.fingerprint(q))throw Error('新题编号与原题冲突：'+q.id);}state.custom.push(...records.filter(q=>!known.has(q.id)));state.ui.dailyNew=plan;const ok=await save();populateFilters();refreshFamilyFilters();updateSummary();return ok;},
    async startGroup(day,group){
      const groupId='daily-'+day.date+'-'+group.subject+'-'+group.section;
      const current=state.ui.studySession;
      if(current?.id!==groupId){if(current){state.ui.sessionArchive=state.ui.sessionArchive||{};state.ui.sessionArchive[current.id]={...current,archivedAt:nowISO()};}
        const archived=state.ui.sessionArchive?.[groupId],results={};for(const id of group.ids){const events=state.attempts[id]||[];if(events.length)results[id]=events.at(-1);}
        const index=group.ids.findIndex(id=>!results[id]);state.ui.studySession={...(archived||{}),id:groupId,dailyNew:true,dailyDate:day.date,subject:group.subject,startedAt:archived?.startedAt||nowISO(),ids:[...group.ids],index:index<0?group.ids.length:index,results,drafts:archived?.drafts||{}};
      }
      if(await save()){window.StudyUI.reset();changeView('practice');}else toast('练习轮次尚未保存，请重试或导出备份。');
    }
  });
  const proof=window.CompletionCore.seed(state,(window.CONFIRMED_PROGRESS||[]).filter(x=>all().some(q=>q.id===x.questionId)));
  if(proof.added)await save();
  populateFilters();refreshFamilyFilters();updateSummary();setViewUI();
  $('storageExport').addEventListener('click',exportJson);
  window.addEventListener('beforeunload',e=>{const s=persistence.getStatus();if(s.dirty||s.pending){e.preventDefault();e.returnValue='';}});
})();
