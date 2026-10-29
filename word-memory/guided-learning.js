(function(root){
  'use strict';
  const minute=60000,day=86400000;
  const S=typeof module==='object'&&module.exports?require('./sense-learning.js'):root.WordMemorySenses;
  const gradeNames=new Set(['remember','new','forgot','fuzzy']);
  function dateKey(date=new Date()) {return [date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');}
  function rollDaily(daily,date=new Date()){return daily.date===dateKey(date)?daily:{date:dateKey(date),newIds:[]};}
  function resolve(words,task){if(!task)return null;return words.find(w=>w.id===task.id)||words.find(w=>task.term&&String(w.term).trim().toLowerCase()===String(task.term).trim().toLowerCase());}
  function plan(words,now,newIds=[],limit=20){
    const due=[],fresh=[];
    for(const word of words){
      const card=word.progress?.card||{},spell=word.progress?.spell||{};
      const choices=[];
      const tracked=S.tracked(word),senseNext=tracked?S.next(word,now):null,all=S.units(word);
      if(senseNext?.kind==='review')choices.push({id:word.id,term:word.term,mode:'card',kind:'review',attempt:0,score:senseNext.score,senseKey:senseNext.unit.key,trackSense:true});
      for(const mode of ['card','spell']){
        if(mode==='card'&&tracked)continue;
        const p=mode==='card'?card:spell;
        const at=Date.parse(p.nextReviewAt||'');
        if(p.stage>=6||p.status==='mature'||!Number.isFinite(at)||at>now)continue;
        if(mode==='spell' && (!(card.stage>=0||Object.values(card.senses||{}).some(p=>p.successCount>0))||now-S.latest(word)<5*minute))continue;
        const last=(p.history||[]).filter(h=>gradeNames.has(h.result)).at(-1);
        const weak=last&&['forgot','fuzzy'].includes(last.result);
        const target=all.find(u=>S.read(word,u).successCount>0)||all[0];
        choices.push({id:word.id,term:word.term,mode,kind:'review',attempt:0,score:(weak?3*day:0)+Math.min(30*day,now-at),senseKey:target.key});
      }
      if(choices.length)due.push(choices.sort((a,b)=>b.score-a.score)[0]);
      else if(senseNext?.kind==='study')fresh.push({id:word.id,term:word.term,mode:'card',kind:'study',attempt:0,senseKey:senseNext.unit.key,trackSense:true});
      else if(!tracked&&!(card.stage>=0)&&card.status!=='learning'&&!card.nextReviewAt&&!newIds.includes(word.id))fresh.push({id:word.id,term:word.term,mode:'card',kind:'study',attempt:0,senseKey:all[0].key});
      else if((card.stage>=0||Object.values(card.senses||{}).some(p=>p.successCount>0)) && now-S.latest(word)>=5*minute && !(spell.stage>=0) && !spell.nextReviewAt){
        const last=(card.history||[]).filter(h=>gradeNames.has(h.result)).at(-1);
        if(!last||!['forgot','fuzzy'].includes(last.result))due.push({id:word.id,term:word.term,mode:'spell',kind:'review',attempt:0,score:-1,senseKey:(all.find(u=>S.read(word,u).successCount>0)||all[0]).key});
      }
    }
    due.sort((a,b)=>b.score-a.score);
    const capacity=Math.max(0,Math.min(5-newIds.length,limit-due.length));
    return due.slice(0,limit).concat(fresh.slice(0,capacity));
  }
  function schedule(p,result,now,responseMs=0){
    const previous=Math.max(-1,Math.min(5,Number(p.stage)||0));
    const last=(p.history||[]).filter(h=>h.guidedIntervalMs).at(-1);
    const learned=Date.parse(p.lastStudiedAt||'');
    const elapsed=Number.isFinite(learned)?Math.max(0,now-learned):0;
    const oldInterval=last?.guidedIntervalMs || Math.max(10*minute,(Date.parse(p.nextReviewAt||'')||now)-(learned||now));
    let delay,stage=previous;
    if(result==='study'){delay=10*minute;stage=Math.max(0,previous);}
    else if(result==='forgot'){delay=10*minute;stage=Math.max(0,previous-1);}
    else if(result==='fuzzy'){delay=20*minute;stage=Math.max(0,previous);}
    else {
      const factor=responseMs>20000?1.6:2.1;
      delay=previous<0?10*minute:Math.min(30*day,Math.max(day,Math.min(oldInterval,Math.max(10*minute,elapsed))*factor));
      if(elapsed<5*minute)delay=Math.min(day,delay);
      stage=Math.max(0,Math.min(5,previous+(elapsed>=5*minute?1:0)));
    }
    delay=Math.round(delay/minute)*minute;
    return {stage,delay,nextReviewAt:new Date(now+delay).toISOString()};
  }
  function retry(task,done,now){return task.attempt?null:{id:task.id,term:task.term,mode:task.mode,kind:'rehearsal',attempt:1,afterDone:done+3,readyAt:now+minute,senseKey:task.senseKey,trackSense:task.trackSense};}
  function ready(task,done,now){return (!task.afterDone||done>=task.afterDone)&&(!task.readyAt||now>=task.readyAt);}
  const api={dateKey,rollDaily,resolve,plan,schedule,retry,ready};
  if(typeof module==='object'&&module.exports){module.exports=api;return;}
  root.WordMemoryGuidedPolicy=api;
  const key=STORAGE_KEY+':guided-session:v1';
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let data={daily:{date:dateKey(),newIds:[]},session:null},overlay=null,timer=null,busy=false;
  function load(){
    try{const raw=JSON.parse(localStorage.getItem(key)||'null');if(raw&&raw.daily&&Array.isArray(raw.daily.newIds))data=raw;}
    catch{showToast('本轮记录无法读取，请先导出备份；旧词库未修改。');}
    data.daily=rollDaily(data.daily);
    if(data.session&&(!Array.isArray(data.session.queue)||!Array.isArray(data.session.results)))data.session=null;
  }
  function persist(){
    try{localStorage.setItem(key,JSON.stringify(data));return true;}
    catch{showToast('本轮进度未能保存，请导出备份；已完成的背词记录仍会尝试保存到词库存档。');return false;}
  }
  function scoped(){return state.words.filter(wordMatchesActiveGroup);}
  function wordFor(task){return resolve(state.words,task);}
  function current(){return data.session?.queue[0];}
  function unitFor(task=current()){const word=wordFor(task);return word?S.selected(word,task.senseKey):null;}
  function quizNeeded(task=current()){const word=wordFor(task),unit=unitFor(task);if(!word||!unit||task.mode!=='card')return false;const all=S.units(word);return S.quiz(unit,all)&&Boolean(unit.example||all.every(u=>u.pos===unit.pos));}
  function nextReady(){
    const s=data.session;
    s.queue=s.queue.filter(t=>wordFor(t)&&unitFor(t));
    const index=s.queue.findIndex(t=>ready(t,s.results.length,Date.now()));
    if(index<0)return false;
    if(index>0)s.queue.unshift(s.queue.splice(index,1)[0]);
    s.phase='question';s.draft='';s.shown=false;s.questionAt=Date.now();s.feedback=null;s.posAnswer=null;s.posWrong=false;s.senseHintUsed=false;
    persist();return true;
  }
  function entry(){
    const host=document.querySelector('.hero-workbench[data-module-section="study"]');
    if(!host||document.getElementById('guidedEntry'))return;
    const panel=document.createElement('div');panel.id='guidedEntry';panel.className='guided-entry';
    panel.innerHTML='<div><h2>一次记一项，软件带着练</h2><p>多义词按词性和释义分项；短语按用法分项。先记当前一项，再逐步补充。每轮最多15分钟 / 20次练习，每天最多5个新学习目标。</p><small>认识、词性和拼写不混算；已会的释义少练，薄弱项稍后再来。</small></div><div><button type="button" class="primary-button" data-guided-launch>开始本轮学习</button><button type="button" class="secondary-button" data-guided-fresh>另开一轮</button></div>';
    host.prepend(panel);
    panel.querySelector('[data-guided-launch]').onclick=()=>start(false);
    panel.querySelector('[data-guided-fresh]').onclick=()=>start(true);
    refreshEntry();
  }
  function refreshEntry(){
    const button=document.querySelector('[data-guided-launch]');
    if(button)button.textContent=data.session&&!data.session.ended&&Date.now()<data.session.deadline?'继续本轮学习':'开始本轮学习';
  }
  function start(fresh){
    if(!guardEditable())return;
    load();
    if(data.session&&!data.session.senseVersion){data.previousSession=data.session;data.session=null;showToast('已升级分项学习。原来的学习记录保留，从新一轮开始。');}
    if(data.session){
      for(const task of data.session.queue){const word=wordFor(task);if(word)task.id=word.id;}
      if(data.session.phase==='feedback'&&wordFor(current()))data.session.feedback.id=wordFor(current()).id;
      persist();
    }
    let created=false;
    if(fresh||!data.session||data.session.ended||Date.now()>=data.session.deadline){
      created=true;
      const queue=plan(scoped(),Date.now(),data.daily.newIds);
      data.session={id:typeof crypto.randomUUID==='function'?crypto.randomUUID():String(Date.now()),senseVersion:1,group:state.activeGroup,queue,results:[],startedAt:Date.now(),deadline:Date.now()+15*minute,phase:'question',questionAt:Date.now(),draft:'',shown:false,ended:false,posAnswer:null,posWrong:false,senseHintUsed:false};
      persist();
    }
    if(!overlay){
      overlay=document.createElement('div');overlay.id='guidedOverlay';overlay.className='guided-overlay';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','本轮学习');
      document.body.append(overlay);document.body.classList.add('guided-open');
      overlay.addEventListener('click',event=>{const button=event.target.closest('[data-guided-action]');if(button&&!busy)action(button.dataset.guidedAction);});
      overlay.addEventListener('input',event=>{if(event.target.matches('[data-guided-input]')){data.session.draft=event.target.value;persist();}});
      overlay.addEventListener('toggle',event=>{if(event.target.matches('[data-sense-original]')&&event.target.open&&data.session.phase==='question'){data.session.senseHintUsed=true;persist();}},true);
      overlay.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();close();}else if(event.key==='Enter'&&!event.isComposing&&event.target.matches('[data-guided-input]')){event.preventDefault();if(!busy)action(data.session.phase==='feedback'?'next':'check');}});
      timer=setInterval(()=>{const clock=document.getElementById('guidedClock');if(clock)clock.textContent=remaining();if(!busy&&data.session&&!data.session.ended&&Date.now()>=data.session.deadline){finish('时间到了，这轮先到这里。');}},1000);
    }
    if(data.session.phase!=='feedback'&&(created||!current()||!ready(current(),data.session.results.length,Date.now()))&&!nextReady())finish(state.words.length?'当前可练的词已完成，不需要空等错词。':'先添加或导入你的词库，再开始学习。');
    draw();refreshEntry();
  }
  function close(){
    if(busy)return;
    persist();if(timer)clearInterval(timer);timer=null;overlay?.remove();overlay=null;document.body.classList.remove('guided-open');refreshEntry();
  }
  function remaining(){const seconds=Math.max(0,Math.ceil((data.session.deadline-Date.now())/1000));return Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0');}
  function finish(message){const s=data.session;s.ended=true;s.message=message;persist();draw();refreshEntry();}
  function summary(){
    const s=data.session,results=s.phase==='feedback'&&s.feedback?[...s.results,s.feedback]:s.results,first=results.filter(r=>!r.rehearsal&&r.kind!=='study');
    const correct=first.filter(r=>r.result==='remember').length;
    const weak=[...new Set(results.filter(r=>r.result==='forgot'||r.result==='fuzzy').map(r=>r.id))];
    return `<h2>这一轮完成了</h2><p>${esc(s.message||'这轮先到这里。')}</p><div class="guided-stats"><span>完成 <b>${results.length}</b> 次</span><span>独立答对 <b>${correct}/${first.length}</b></span><span>今天新词 <b>${data.daily.newIds.length}/5</b></span></div><p>本轮补测只算巩固，不当作长期掌握。剩余到期单词可以留到下一轮。</p>${weak.length?'<h3>之后重点复习</h3><p>'+weak.map(id=>esc(state.words.find(w=>w.id===id)?.term||'')).join(' · ')+'</p>':'<p>这轮没有标记新的薄弱词。</p>'}<p>${s.queue.length?'部分词已安排稍后复习，不必守着计时器等待。':'下次打开会重新挑选最需要练的词。'}</p><button type="button" class="primary-button" data-guided-action="close">结束，休息一下</button><button type="button" class="secondary-button" data-guided-action="fresh">我还想再练一轮</button>`;
  }
  function sensePanel(word,task,revealed){
    const unit=unitFor(task),all=S.units(word),s=data.session;
    const position=all.findIndex(u=>u.key===unit.key)+1;
    const showPos=task.kind==='study'||!quizNeeded(task)||s.posAnswer!==null;
    const recorded=all.filter(u=>S.read(word,u).introducedAt).length;
    return `<div class="sense-focus"><span>当前第 ${position}/${all.length} 项</span><strong data-sense-pos>${showPos?esc(unit.label+(unit.pos!=='unknown'&&unit.pos!=='phrase'?' · '+unit.pos+'.':'')):'再回想词性'}</strong><small>本次只检查这一项${task.trackSense?' · 已开始 '+recorded+'/'+all.length+' 项':''}</small></div>${task.mode==='card'&&unit.example?'<p class="sense-example"><span lang="en">'+esc(unit.example.en)+'</span>'+(revealed?'<br>'+esc(unit.example.zh):'')+'</p>':''}`;
  }
  function originalMeanings(word){return '<details class="sense-original" data-sense-original><summary>查看完整原释义</summary><p>'+esc(word.meaning||word.phrase||'未填释义')+'</p><small>查看后这次只作巩固，其他意思不会自动算掌握。</small></details>';}
  function posButtons(task){
    if(!quizNeeded(task))return '';
    const unit=unitFor(task),s=data.session,codes=[...new Set(['n','v','adj','adv',unit.pos])];
    return '<div class="sense-quiz"><p>再回想：这一项用法的词性是什么？</p>'+codes.map(code=>`<button type="button" class="secondary-button${s.posAnswer===code?' sense-selected':''}" data-guided-action="pos:${code}" aria-pressed="${s.posAnswer===code}">${esc(S.labels[code])} · ${code}.</button>`).join('')+'<button type="button" class="secondary-button" data-guided-action="pos:unknown">想不起词性</button>'+(s.posAnswer!==null?'<p role="status">'+(s.posWrong?'这次词性需要巩固。正确标注：':'词性核对正确：')+esc(unit.label)+'</p>':'')+'</div>';
  }
  function draw(){
    if(!overlay)return;
    const s=data.session,task=current(),word=wordFor(task),unit=unitFor(task);
    const heading=`<header><strong>分项学习 · ${esc(s.group==='all'?'全部词库':s.group)}</strong><span id="guidedClock">${remaining()}</span><button type="button" class="secondary-button" data-guided-action="close">暂停退出</button></header>`;
    let body;
    if(s.ended)body=summary();
    else if(!word||!unit){finish(state.words.length?'当前释义已变动，请重新开始一轮。':'先添加或导入你的词库，再开始学习。');return;}
    else if(s.phase==='feedback'){
      const f=s.feedback;
      body=`<p class="guided-tag">${f.rehearsal?'本轮巩固':f.result==='remember'?'本项独立回想正确':f.kind==='study'?'一次先学这一项':'这一项需要再巩固'}</p><h2 lang="en">${esc(word.term)}</h2>${sensePanel(word,task,true)}<p class="guided-meaning" data-sense-gloss>${esc(unit.gloss)}</p>${f.input?'<p>你的拼写：<span lang="en">'+esc(f.input)+'</span></p>':''}<p>${esc(f.message)}</p><button type="button" class="primary-button" data-guided-action="next">下一个</button><button type="button" class="secondary-button" data-guided-action="speak">听读音</button>${originalMeanings(word)}`;
    }else{
      const study=task.kind==='study',spell=task.mode==='spell';
      const prompt=study?'先学当前一项':task.kind==='rehearsal'?'隔开后再回想 · 只算巩固':spell?'看这一项中文，拼英文':'回想当前这一项意思';
      body=`<p class="guided-tag">${prompt} · 已完成 ${s.results.length}/20</p><h2 ${!spell?'lang="en"':''}>${esc(spell?unit.gloss:word.term)}</h2>${sensePanel(word,task,study||s.shown)}`;
      if(study)body+=`<p class="guided-meaning" data-sense-gloss>${esc(unit.gloss)}</p><p>只记这一项的意思和标注。其他意思之后再逐步加入。</p><button type="button" class="primary-button" data-guided-action="study">这一项看好了，盖住稍后测</button><button type="button" class="secondary-button" data-guided-action="speak">听读音</button>`;
      else if(spell)body+=`<label>不看答案，输入英文<input data-guided-input lang="en" autocomplete="off" autocapitalize="none" spellcheck="false" value="${esc(s.draft)}"></label><button type="button" class="primary-button" data-guided-action="check">检查拼写</button><button type="button" class="secondary-button" data-guided-action="forgot">不会，先看答案</button>`;
      else if(s.shown)body+=`<p class="guided-meaning" data-sense-gloss>${esc(unit.gloss)}</p>${posButtons(task)}<p>按看答案之前的回想情况评分。想起其他意思，不代表当前这一项也掌握了。</p><button type="button" class="primary-button" data-guided-action="remember" ${quizNeeded(task)&&s.posAnswer===null?'disabled':''}>${s.posWrong?'词义会了，词性需巩固':'这一项回想正确'}</button><button type="button" class="secondary-button" data-guided-action="fuzzy">意思或词性有遗漏</button><button type="button" class="danger-button" data-guided-action="forgot">没想起来</button>`;
      else body+=`<p>先回想这一项的意思，或写在下面；词性有标注时一起记。</p><label>可以写下核心意思<input data-guided-input value="${esc(s.draft)}" placeholder="先回想，不要求输入"></label><button type="button" class="primary-button" data-guided-action="reveal">核对这一项</button>`;
      body+=originalMeanings(word);
    }
    overlay.innerHTML='<main class="guided-panel">'+heading+'<section>'+body+'</section><footer>分项记录 · 拼写单独记录 <button type="button" data-guided-action="finish">结束本轮</button></footer><p id="guidedStatus" role="status"></p></main>';
    if(s.phase==='question'&&!s.ended)overlay.querySelector('[data-guided-input]')?.focus({preventScroll:true});
    else overlay.querySelector('[data-guided-action="next"], [data-guided-action="close"]')?.focus({preventScroll:true});
  }
  async function grade(result){
    if(busy||data.session.ended||!guardEditable())return;
    const s=data.session,task=current(),word=wordFor(task);if(!word||s.phase==='feedback')return;
    busy=true;
    try{
      const p=modeProgress(word,task.mode),now=Date.now(),actionId=s.id+':'+s.results.length+':'+task.mode;
      const unit=unitFor(task),perSense=task.mode==='card'&&task.trackSense;
      const senseProgress=perSense?S.read(word,unit):null;
      data.daily=rollDaily(data.daily,new Date(now));
      if(task.kind==='study'&&data.daily.newIds.length>=5&&!data.daily.newIds.includes(word.id)){
        s.queue=s.queue.filter(t=>t.kind!=='study');
        if(nextReady())draw();else finish('今天已经初学5个新词，先巩固已学单词。');
        return;
      }
      let saved=(p.history||[]).find(h=>h.guidedActionId===actionId);
      if(!saved&&senseProgress?.lastActionId===actionId)saved={guidedOutcome:senseProgress.lastResult};
      if(!saved){
        let actual=result;
        if(task.mode==='card'&&result==='remember'&&(s.posWrong||s.senseHintUsed))actual='fuzzy';
        if(task.mode==='spell'&&result==='remember'&&root.WordMemoryLearningPolicy.spellingEvidence(p,now))actual='fuzzy';
        const rehearsal=task.kind==='rehearsal';
        const planned=rehearsal?null:schedule(perSense?senseProgress:p,actual,now,now-s.questionAt);
        if(planned&&perSense){
          p.senses=p.senses||{};
          p.senses[unit.key]={...senseProgress,key:unit.key,pos:unit.pos,gloss:unit.gloss,stage:planned.stage,status:'learning',nextReviewAt:planned.nextReviewAt,lastStudiedAt:new Date(now).toISOString(),updatedAt:new Date(now).toISOString(),introducedAt:senseProgress.introducedAt||new Date(now).toISOString(),successCount:Number(senseProgress.successCount||0)+(actual==='remember'?1:0),lastResult:actual,lastActionId:actionId};
        }else if(planned){p.stage=planned.stage;p.status='learning';p.nextReviewAt=planned.nextReviewAt;p.lastStudiedAt=new Date(now).toISOString();}
        const due=perSense?p.senses?.[unit.key]?.nextReviewAt:p.nextReviewAt;
        saved={time:new Date(now).toISOString(),result:rehearsal?'guided-rehearsal':perSense?'sense-'+actual:actual==='study'?'guided-study':actual,guidedOutcome:actual,guidedActionId:actionId,senseKey:unit.key,sensePos:unit.pos,senseGloss:unit.gloss,guidedIntervalMs:planned?.delay||null,nextReviewAt:due||'',responseMs:now-s.questionAt};
        recordModeHistory(word,saved,task.mode);
        if(!rehearsal&&actual!=='study'){recordMemoryMetric(word,task.mode==='spell'?'spelling':'recognition',actual==='remember');markDailyCompleted(word,new Date(now));}
        if(task.mode==='card'&&!perSense)for(const field of ['status','stage','nextReviewAt','lastStudiedAt'])word[field]=p[field];
        word.updatedAt=new Date(now).toISOString();
        if(actual==='forgot'||actual==='fuzzy')word.important=true;
      }
      const persisted=await saveWordsDurably();
      if(!persisted)throw Error('学习记录未保存成功。请重试或先导出备份，这个词不会重复推进。');
      const actual=saved.guidedOutcome,rehearsal=task.kind==='rehearsal';
      if(task.kind==='study'&&!data.daily.newIds.includes(word.id))data.daily.newIds.push(word.id);
      const nextDate=perSense?p.senses?.[unit.key]?.nextReviewAt:p.nextReviewAt;
      const message=rehearsal?'这是隔开后的巩固，只检查当前一项，不提升长期进度。':actual==='study'?'先盖住，隔几个词再回想。当前这一项10分钟后正式复习；其他项不算已会。':actual==='remember'?'只记录当前这一项。下次复习：'+formatDateTime(nextDate):s.posWrong?'词性需要再巩固，本次没有算成独立通过。':s.senseHintUsed?'看过完整释义，本次只作巩固，稍后重新回想。':'这一项稍后再练，其他已会的意思不会被清零。';
      s.feedback={id:word.id,term:word.term,mode:task.mode,kind:task.kind,result:actual,rehearsal,senseKey:unit.key,senseGloss:unit.gloss,input:task.mode==='spell'?s.draft:'',message,actionId};
      s.phase='feedback';persist();draw();
      render();
      if(actual==='remember'&&task.mode==='spell'&&!rehearsal){
        setTimeout(()=>{if(overlay&&!busy&&!s.ended&&data.session===s&&s.phase==='feedback'&&s.feedback?.actionId===actionId)advance();},900);
      }
    }catch(error){const status=document.getElementById('guidedStatus');if(status)status.textContent=error.message;}
    finally{busy=false;}
  }
  function advance(){
    const s=data.session;if(s.phase!=='feedback')return;
    const task=s.queue.shift(),f=s.feedback;s.results.push(f);
    s.feedback=null;s.phase='between';
    if(f.result!=='remember'||task.kind==='study'){
      const again=retry(task,s.results.length,Date.now());if(again)s.queue.push(again);
    }
    if(s.results.length>=20){finish('已经完成20次单词练习，这轮先收好。');return;}
    if(Date.now()>=s.deadline){finish('15分钟到了，这轮先到这里。');return;}
    if(!nextReady()){finish('当前可练的词已完成。剩下的错词按到期时间再来，不需要空等。');return;}
    draw();
  }
  function action(name){
    if(name==='close')close();
    else if(name==='fresh'){close();start(true);}
    else if(name==='finish')finish('你选择结束本轮。已完成的练习都已保存。');
    else if(name==='next')advance();
    else if(name==='speak'){const word=wordFor(current());if(word)speakTerm(word.term,{accent:'uk'});}
    else if(name==='reveal'){data.session.shown=true;persist();draw();}
    else if(name.startsWith('pos:')){const code=name.slice(4);data.session.posAnswer=code;data.session.posWrong=data.session.posWrong||code!==unitFor().pos;persist();draw();}
    else if(name==='check'){
      if(current()?.mode==='spell'){
        if(!data.session.draft.trim()){showToast('先尝试输入；不会可以点“不会，先看答案”。');return;}
        grade(isSpellingCorrect(data.session.draft,wordFor(current()))?'remember':'forgot');
      }else{data.session.shown=true;persist();draw();}
    }else if(name==='study')grade('study');
    else if(['remember','fuzzy','forgot'].includes(name)){if(name==='remember'&&quizNeeded()&&data.session.posAnswer===null){showToast('先回想并选择词性；不确定也可以选择。');return;}grade(name);}
  }
  function init(){load();entry();}
  root.WordMemoryGuided={start,close,storageKey:key};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})(typeof window==='object'?window:globalThis);
