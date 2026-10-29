'use strict';
(() => {
  const C=window.StudyCore,$=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let api,session=null,busy=false,lastFeedback='',writeError=false;
  const copy=v=>JSON.parse(JSON.stringify(v));
  const html=(q,text)=>window.MathNotation?window.MathNotation.html(q.subject,text):esc(text);
  function typeset(){const box=$('practiceView');if(window.MathNotation?.typeset)window.MathNotation.typeset(box);else window.MathJax?.typesetPromise?.([box]).catch(()=>{});}
  function progress(s){return s.ids.filter(id=>s.results[id]).length;}
  function restored(qs){return C.restore(api.getSession(),qs);}
  function failed(){writeError=true;api.toast('尚未保存成功，请重试或导出备份；本轮进度仍在本页。');}
  async function persist(value){const ok=await api.saveSession(copy(value));if(!ok)failed();else writeError=false;return ok;}
  function renderHome(){
    const qs=api.questions(),stats=C.today(qs),s=restored(qs),pending=qs.filter(q=>q.review),active=s&&s.index<s.ids.length;
    const preferences=api.preferences(),subject=preferences.subject||'',size=String(preferences.size||20);
    $('homeView').innerHTML=`<div class="study-welcome"><div class="editorial-title-block"><p class="eyebrow">THE DAILY EDITION <span>／</span> 个人学习刊</p><h2>把知识，变成自己的底气。</h2><p>认真对待每一次练习，也欣赏每一小步进步。</p></div><div class="editorial-edition" aria-hidden="true"><span>READ · THINK · GROW</span><strong>学</strong><small>STUDY<br>JOURNAL</small></div><span class="today-date">${esc(new Date().toLocaleDateString('zh-CN',{month:'long',day:'numeric',weekday:'long'}))}</span></div>
      <div class="daily-grid"><article class="daily-main"><div class="daily-main-top"><span class="study-label">今日复习台</span><span class="pill">${pending.length} 道待复习</span></div><h3>今天，专注这一轮。</h3><p class="description">先把尚未复练的题轮完，刚做错的往后放；全部轮过后，再从最久没练的题开始。</p>
        <div class="daily-metrics"><div><strong>${stats.questions}</strong><span>今日已练题目</span></div><div><strong>${stats.attempts}</strong><span>今日复练次数</span></div><div><strong>${stats.good}</strong><span>今日标记会了</span></div></div>
        ${active?`<div class="resume-banner"><span class="resume-dot"></span><div><strong>上次的练习，还在这里</strong><p>已完成 ${progress(s)} / ${s.ids.length} 题 · 接着第 ${s.index+1} 题</p></div><button type="button" class="btn primary" id="resumeSession">继续练习 →</button></div>`:
        `<div class="session-setup"><label>练习学科<select id="dailySubject"><option value="">三科一起练</option>${[...new Set(qs.map(q=>q.subject))].map(v=>`<option value="${esc(v)}" ${v===subject?'selected':''}>${esc(v)}</option>`).join('')}</select></label><label>本轮题量<select id="dailySize">${[10,20,30].map(v=>`<option value="${v}" ${String(v)===size?'selected':''}>${v} 题</option>`).join('')}</select></label><button type="button" class="btn primary" id="startDaily">开始今日复习 →</button></div><p class="fine-note" id="queueHint"></p>`}
        ${s&&!active?'<button type="button" class="mini-link" id="lastSummary">查看上一轮结果 →</button>':''}
      </article><aside class="daily-aside"><p class="eyebrow">SUBJECT INDEX / 学科索引</p><h3>从薄弱处，向前一步。</h3><div class="subject-cards">${[...new Set(qs.map(q=>q.subject))].map((sub,i)=>{const n=qs.filter(q=>q.subject===sub&&q.review).length;return `<button class="subject-card" data-study-subject="${esc(sub)}" type="button"><span class="subject-icon">${['数','机','英'][i]||'学'}</span><span><strong>${esc(sub)}</strong><small>${n} 道待复习</small></span><span class="subject-arrow">↗</span></button>`;}).join('')}</div><div class="daily-tip"><span class="study-label">给今天的一点提醒</span><p>“会了”记录这次的掌握情况，历史错题仍会保留。拿不准时，就标记“不确定”。</p></div></aside></div>
      <div class="study-shortcuts"><button class="study-shortcut" id="openArchive"><span>01 / 题目档案</span><strong>找一道题，慢慢看</strong><small>搜索、筛选、原始截图与个人备注 ↗</small></button><button class="study-shortcut" id="openReview"><span>02 / 错题复习</span><strong>把卡住的地方弄懂</strong><small>保留你的每一次复练历史 ↗</small></button><button class="study-shortcut" id="openStats"><span>03 / 薄弱点追踪</span><strong>换题后，也能做对吗</strong><small>反复错的考点、换题表现与下一轮安排 ↗</small></button></div>`;
    $('resumeSession')?.addEventListener('click',()=>{session=s;lastFeedback='';api.navigate('practice');});
    $('lastSummary')?.addEventListener('click',()=>{session=s;api.navigate('practice');});
    $('openArchive').onclick=()=>api.navigate('archive');$('openReview').onclick=()=>api.navigate('review');$('openStats').onclick=()=>api.navigate('stats');
    async function startSelected(){const sub=$('dailySubject')?.value||'',n=Number($('dailySize')?.value||20);await api.savePreferences({subject:sub,size:n});await start(sub,n);}
    $('startDaily')?.addEventListener('click',startSelected);
    function hint(){const sub=$('dailySubject').value,n=Number($('dailySize').value),available=C.queue(qs,sub,n);$('queueHint').textContent=available.length?`本轮安排 ${available.length} 题；未复练题不足一轮时不补入刚做过的题。可暂停后接着练。`:'这科当前没有待练错题；正确题不再刷，可到“薄弱点追踪”看新题表现。';}
    if($('dailySubject')){$('dailySubject').onchange=hint;$('dailySize').onchange=hint;hint();}
    document.querySelectorAll('[data-study-subject]').forEach(el=>el.onclick=async()=>{if(active){session=s;api.navigate('practice');api.toast('先继续或结束当前这轮，再切换学科。');return;}await start(el.dataset.studySubject,Number(size));});
  }
  async function start(subject='',size=20,ids){
    if(busy)return;busy=true;
    try{const qs=api.questions();let queue=ids||C.queue(qs,subject,size);if(!queue.length){api.toast('当前没有待练错题，正确题不再安排；可到薄弱点追踪看新题表现。');return;}
      const next={id:'study-'+Date.now()+'-'+Math.random().toString(36).slice(2,8),startedAt:new Date().toISOString(),subject,ids:queue,index:0,results:{},drafts:{}};
      session=next;lastFeedback='';await persist(next);api.navigate('practice');
    }finally{busy=false;}
  }
  function renderPractice(){
    const qs=api.questions();session=C.restore(session||api.getSession(),qs);
    if(!session){$('practiceView').innerHTML='<div class="report-card empty-state"><h2>准备好开始了吗？</h2><p>去每日复习台，安排一轮适合自己的练习。</p><button id="practiceHome" class="btn primary">前往复习台</button></div>';$('practiceHome').onclick=()=>api.navigate('home');return;}
    if(session.index>=session.ids.length){renderSummary(qs);return;}
    const q=qs.find(q=>q.id===session.ids[session.index]),draft=session.drafts[q.id]||{answer:'',note:''},key=C.answerKey(q),result=session.results[q.id];
    const marks=window.OptionCore.normalize(api.getOptionMarks(q.id),Object.keys(q.options||{}));
    const optionText=value=>[...String(value||'')].map(k=>q.options?.[k]?k+' · '+q.options[k]:k).join('；');
    const rubric=Array.isArray(q.scoringPoints)&&q.scoringPoints.length?`<section class="written-rubric"><h4>核对要点</h4><ol>${q.scoringPoints.map(p=>`<li>${esc(p)}</li>`).join('')}</ol><p class="fine-note">参考答案允许合理同义表达；按内容和步骤核对，不按文字完全一致判错。</p></section>`:'';
    const comparison=result?`<section class="grade-comparison ${result.result==='会了'?'grade-right':'grade-wrong'}" role="status"><div class="grade-comparison-heading"><strong>${key?(result.result==='会了'?'✓ 答对了':result.result==='不会'?'× 答错了':'? 不确定'):'已记录：'+result.result}</strong><span>本次结果已保存</span></div><div class="grade-comparison-grid"><div><span>你的答案</span><p>${html(q,key?optionText(result.answer):(result.answer||'本次未填写文字答案'))}</p></div><div><span>${key?'正确答案':'参考答案'}</span><p>${html(q,key?optionText(key):(q.verifiedAnswer||q.sourceAnswer||'暂未提供'))}</p></div></div>${!key?rubric:''}${window.LearningBookUI?.insight(q,result)||''}${window.EnglishPhraseUI?.render(q,{answered:true})||''}<button class="btn primary" type="button" id="studyNext">${session.index+1===session.ids.length?'看完了，查看本轮汇总 →':'看完了，下一题 →'}</button></section>`:'';

    const options=Object.entries(q.options||{}),answer=q.verifiedAnswer||q.sourceAnswer||'暂无可靠参考答案';
    const showLearning=!!draft.revealed||(['英语','计算机'].includes(q.subject)&&!!result&&draft.lessonHidden!==true);
    $('practiceView').innerHTML=`<div class="practice-shell"><div class="practice-top"><button type="button" class="mini-link" id="pauseSession">← 暂停，回到今日学习</button><span>本轮 ${session.index+1} / ${session.ids.length} 题</span></div><div class="session-progress" role="progressbar" aria-label="本轮已完成" aria-valuenow="${progress(session)}" aria-valuemin="0" aria-valuemax="${session.ids.length}"><span style="width:${progress(session)/session.ids.length*100}%"></span></div>
      ${comparison}${lastFeedback?`<div class="session-feedback" role="status">${esc(lastFeedback)}</div>`:''}
      <article class="practice-card"><div class="practice-question-head"><div><p class="eyebrow">ONE QUESTION AT A TIME</p><p class="pathline">${esc(q.subject)} / ${esc(q.topic)} · ${esc(q.type)}</p></div><div class="question-corner"><span class="wrong-count" data-wrong-count="${q.wrongCount||0}">累计错了 ${q.wrongCount||0} 次</span><span class="pill">${esc(q.difficulty||'未分级')}</span></div></div>${window.QuestionAssist?.render(q,qs)||''}${window.QuestionCompare?.entry(q)||''}${window.ExerciseVocabUI?.entry(q)||''}<div class="stem">${html(q,q.stem)}</div>
      ${q.questionImage&&/^images\/[\w.-]+$/.test(q.questionImage)?`<figure class="screen-figure"><img src="${esc(q.questionImage)}" alt="题目配图"></figure>`:''}
      ${options.length?window.OptionUI.render(q,{answer:draft.answer||'',marks,revealed:!!result||!!draft.checked||!!draft.revealed,key,scope:'practice',format:text=>html(q,text)})+`<p class="fine-note">${q.type==='多选题'?'可选择多个选项，选完后点“核对并记录”。':q.type==='判断题'?'选择正确或错误后自动记录；不会把未选择当成错误。':'选择答案后立即自动判分、保存，顶部显示答案对照；看完再点下一题。'}</p>${draft.checked?'<p class="option-check-message" role="status">选项已核对；本次核对不记录作答，也不跳题。</p>':''}`:'<label class="input-row practice-written"><span>本次答案或解题步骤 · 对照参考答案和核对要点记录</span><textarea id="studyWritten" rows="2" placeholder="写下本次答案或关键步骤"></textarea></label>'}
      <div class="practice-utilities"><button type="button" class="mini-link" id="studyReveal" aria-expanded="${showLearning}">${showLearning?(q.subject==='英语'?'收起翻译与详细解析':'收起答案与解析'):(q.subject==='英语'?'查看题目翻译与逐项解析':window.MathLesson?.get(q)?'需要帮助？提示 / 思路 / 完整过程':'先看看答案与解析')}</button><button type="button" class="mini-link" id="studySource" aria-expanded="${!!draft.source}">${draft.source?'收起原图':'查看原始截图'}</button></div>
      ${showLearning&&q.subject==='高等数学'&&window.MathLesson?.get(q)?`<div class="answer-content guided-math">${window.MathLesson.render(q)}${!result?rubric:''}</div>`:showLearning?`<div class="answer-content"><p class="mini-label">参考答案</p><p class="answer-line">${html(q,answer)}</p>${q.analysis?`<p>${html(q,q.analysis)}</p>`:''}${q.questionNote?`<p>${html(q,q.questionNote)}</p>`:''}${q.dailyNew&&!options.length?'<p class="fine-note">本题为书面题，请按参考答案及核对要点记录；合理的同义表达可以接受。</p>':q.audit||q.autoGradeDisabled||q.sourceGradingDispute?'<p class="answer-issue">本题存在核查说明或不适合自动判分，请对照原图自行记录。</p>':''}${window.EnglishLesson?.render(q)||''}${window.MathLesson?.render(q)||''}${!result?rubric:''}</div>`:''}
      ${draft.source?`<div class="practice-sources">${(q.sourceImageRefs||[]).filter(v=>/^(images|reference-images)\/[\w.-]+$/.test(v)).map((src,i)=>`<figure class="screen-figure"><img src="${esc(src)}" alt="原始题目截图 ${i+1}" loading="lazy"></figure>`).join('')||'<p class="fine-note">本题没有可用的原始截图。</p>'}</div>`:''}
      <label class="input-row practice-note"><span>本次笔记 · 自动保存草稿</span><textarea id="studyNote" rows="2" placeholder="卡在哪里？或者记下一条新理解。"></textarea></label>
      <div class="practice-submit"><div><strong>记录这次的掌握情况</strong><p class="fine-note">保存后在顶部对照答案，看完再进入下一题；历史记录保留。</p></div>${key&&options.length&&q.type==='多选题'?'<div class="practice-submit-actions"><button class="btn neutral" type="button" id="studyInspect">仅核对选项</button><button class="btn primary" type="button" id="studyCheck">核对并记录 →</button></div>':''}</div>
      <div class="study-self-grade">${!key?'<button class="mark-btn good" type="button" data-study-mark="会了">本次会了</button><button class="mark-btn bad" type="button" data-study-mark="不会">仍然不会</button>':''}<button class="mark-btn warn" type="button" data-study-mark="蒙对">蒙对 / 不确定</button></div>
      <p class="fine-note session-save-error ${writeError?'':'hidden'}" id="studySaveError">刚才未能保存，请重试；也可用页面顶部“导出备份”保留进度。</p>
      <div class="practice-bottom"><span>${esc(q.sourceNo||'')} · ${esc(q.id)}</span><button type="button" class="mini-link" id="finishEarly">结束本轮并汇总</button></div></article></div>`;
    window.ComputerSpeech?.attachQuestion(q,showLearning,$('practiceView').querySelector('.practice-card'));
    $('studyNote').value=draft.note||'';
    if($('studyWritten'))$('studyWritten').value=draft.answer||'';
    function capture(){session.drafts[q.id]={...draft,answer:$('studyWritten')?$('studyWritten').value:draft.answer||'',note:$('studyNote').value};return session.drafts[q.id];}
    function saveDraft(){capture();persist(session).then(ok=>{if(!ok)$('studySaveError')?.classList.remove('hidden');});}
    $('studyNote').addEventListener('input',saveDraft);$('studyWritten')?.addEventListener('input',saveDraft);
    document.querySelectorAll('[data-study-option]').forEach(el=>el.onclick=async()=>{if(busy||result)return;capture();const next=window.OptionCore.choose(draft.answer||'',marks,el.dataset.studyOption,q.type==='多选题');Object.assign(draft,{answer:next.answer,checked:false});session.drafts[q.id]={...session.drafts[q.id],answer:next.answer,checked:false};if(marks[el.dataset.studyOption]==='exclude')await api.saveOptionMarks(q.id,next.marks);if(key&&q.type!=='多选题'&&next.answer){await submit('auto');return;}persist(session);renderPractice();});
    $('practiceView').querySelectorAll('[data-option-mark]').forEach(el=>el.onclick=()=>{capture();const next=window.OptionCore.mark(session.drafts[q.id].answer,marks,el.dataset.optionMark,el.dataset.markKind);session.drafts[q.id].answer=next.answer;persist(session);const task=api.saveOptionMarks(q.id,next.marks);renderPractice();task.then(ok=>{if(!ok)failed();});});
    $('practiceView').querySelector('[data-clear-option-marks]')?.addEventListener('click',()=>{capture();persist(session);const task=api.saveOptionMarks(q.id,{});renderPractice();task.then(ok=>{if(!ok)failed();});});
    $('studyInspect')?.addEventListener('click',()=>{capture();if(!session.drafts[q.id].answer){api.toast('先选择答案，再核对选项。');return;}session.drafts[q.id].checked=true;persist(session);renderPractice();$('practiceView').querySelector('.marked-options')?.scrollIntoView({block:'center',behavior:'smooth'});});
    $('studyReveal').onclick=()=>{capture();session.drafts[q.id].revealed=!showLearning;session.drafts[q.id].lessonHidden=showLearning;persist(session);renderPractice();};
    $('studySource').onclick=()=>{capture();session.drafts[q.id].source=!draft.source;persist(session);renderPractice();};
    $('pauseSession').onclick=async()=>{capture();await persist(session);api.navigate('dashboard');};
    $('finishEarly').onclick=async()=>{if(busy)return;busy=true;capture();const next={...copy(session),index:session.ids.length,endedAt:new Date().toISOString()};const ok=await persist(next);busy=false;if(ok){session=next;renderPractice();}else $('studySaveError').classList.remove('hidden');};
    async function submit(mark){
      if(busy)return;capture();const answer=session.drafts[q.id].answer;
      if(mark==='auto'&&!answer){api.toast('先选一个答案，再核对。');return;}
      busy=true;document.querySelectorAll('[data-study-mark],#studyCheck,#studyInspect,#finishEarly,#pauseSession,#practiceView .opt-button,#practiceView .option-mark-button,#practiceView [data-clear-option-marks]').forEach(el=>el.disabled=true);
      const outcome=mark==='auto'?(answer===key?'会了':'不会'):mark;
      const event={eventId:session.id+'-'+q.id,at:new Date().toISOString(),result:outcome,answer,note:session.drafts[q.id].note,optionMarks:marks,sessionId:session.id};
      const next=copy(session);next.results[q.id]=event;
      if(['英语','计算机'].includes(q.subject))Object.assign(next.drafts[q.id],{revealed:true,lessonHidden:false});
      try{const ok=await api.commit(next,q.id,event);if(ok){session=next;writeError=false;lastFeedback=`本题已记录：${outcome==='蒙对'?'蒙对 / 不确定':outcome}${mark==='auto'?' · 参考答案 '+key:''}`;renderPractice();window.scrollTo({top:0,behavior:'smooth'});}else{failed();renderPractice();}}finally{busy=false;}
    }
    if(result)window.LearningBookUI?.bindInsight($('practiceView'),q,result);
    if(result){$('practiceView').querySelectorAll('.opt-button,.option-mark-button,[data-study-mark],#studyCheck,#studyInspect').forEach(b=>b.disabled=true);}
    $('studyNext')?.addEventListener('click',async()=>{if(busy)return;busy=true;try{const next=copy(session);next.index++;if(next.index===next.ids.length)next.endedAt=new Date().toISOString();if(await persist(next)){session=next;lastFeedback='';renderPractice();window.scrollTo({top:0,behavior:'smooth'});}}finally{busy=false;}});
    $('studyCheck')?.addEventListener('click',()=>submit('auto'));
    document.querySelectorAll('[data-study-mark]').forEach(el=>el.onclick=()=>submit(el.dataset.studyMark));
    typeset();
  }
  function renderSummary(qs){
    window.ComputerSpeech?.cancel();
    const entries=session.ids.filter(id=>session.results[id]).map(id=>({q:qs.find(q=>q.id===id),a:session.results[id]}));
    const good=entries.filter(x=>x.a.result==='会了').length,bad=entries.filter(x=>x.a.result==='不会'),unsure=entries.filter(x=>x.a.result==='蒙对');
    $('practiceView').innerHTML=`<div class="session-summary"><p class="eyebrow">EVERY EFFORT COUNTS</p><div class="summary-medal" aria-hidden="true">✓</div><h2>${entries.length===session.ids.length?'这一轮，认真完成了。':'先歇一歇，进度已记录。'}</h2><p class="description">已完成 ${entries.length} / ${session.ids.length} 题。${session.ids.length-entries.length?'尚未作答的题目没有新增复练记录。':'每一次练习，都在为下一次积累把握。'}</p><div class="session-results"><div><strong>${good}</strong><span>本次会了</span></div><div><strong>${bad.length}</strong><span>仍然不会</span></div><div><strong>${unsure.length}</strong><span>蒙对 / 不确定</span></div></div>${window.LearningBookUI?.summary(entries)||''}<div class="summary-buttons"><button class="btn primary" id="summaryHome">回到今日学习</button>${!session.dailyNew&&bad.length+unsure.length?'<button class="btn neutral" id="retrySession">再练本轮未掌握题</button>':''}</div><div class="session-result-list"><h3>本轮作答回看</h3>${entries.map(({q,a})=>`<details class="session-result"><summary><span class="status-chip ${a.result==='会了'?'good':a.result==='不会'?'bad':'warn'}">${esc(a.result)}</span><span>${esc(q.subject)} · ${esc(q.stem.slice(0,80))}</span></summary><div class="answer-content"><p>${html(q,q.stem)}</p><p>本次作答：${esc(a.answer||'未填写')}</p><p>参考答案：${html(q,q.verifiedAnswer||q.sourceAnswer||'未提供')}</p>${a.note?`<p>本次笔记：${esc(a.note)}</p>`:''}${q.analysis?`<p>${html(q,q.analysis)}</p>`:''}${window.OptionUI.render(q,{answer:a.answer||'',marks:a.optionMarks||{},revealed:true,key:C.answerKey(q),format:text=>html(q,text),scope:'practice',readonly:true})}${window.EnglishLesson?.render(q)||''}${window.MathLesson?.render(q)||''}</div></details>`).join('')||'<p class="fine-note">本轮还未提交题目，你可以回到复习台重新开始。</p>'}</div></div>`;
    window.LearningBookUI?.bindSummary($('practiceView'));
    $('summaryHome').onclick=()=>{const target='dashboard';session=null;api.navigate(target);};$('retrySession')?.addEventListener('click',()=>start('',20,[...bad,...unsure].map(x=>x.q.id)));
    typeset();
  }
  window.StudyUI={init(value){api=value;},render(view){if(view==='home')renderHome();if(view==='practice')renderPractice();},reset(){session=null;}};
})();
