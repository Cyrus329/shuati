'use strict';
(() => {
  // 补录来源的实际作答时间未知，放在已保存复练之前，不抢占“最近一次”。
  function compare(a,b){const sourceA=!!a.originalTimeUnknown,sourceB=!!b.originalTimeUnknown;if(sourceA!==sourceB)return sourceA?-1:1;return String(a.at).localeCompare(String(b.at));}
  function seed(state,entries){
    if(state.ui?.cleanStart===true)return {added:0,corrected:0};
    state.attempts=state.attempts||{};let added=0,corrected=0;
    const ids=new Set(Object.values(state.attempts).flatMap(list=>Array.isArray(list)?list.map(e=>e.eventId):[]));
    for(const {questionId,event} of entries||[]){
      if(!questionId||!event?.eventId)continue;
      if(ids.has(event.eventId)){
        if(event.correctsImportedEvidence){const list=state.attempts[questionId]||[],i=list.findIndex(a=>a.eventId===event.eventId),old=list[i];if(old?.importedEvidence&&old.sourceImage===event.sourceImage&&!old.correctsImportedEvidence){list[i]={...event,previousImportClassification:{result:old.result,answer:old.answer,note:old.note}};list.sort(compare);corrected++;}}
        continue;
      }
      state.attempts[questionId]=[...(state.attempts[questionId]||[]),{...event}].sort(compare);ids.add(event.eventId);added++;
    }
    return {added,corrected};
  }
  function category(events){const last=events.at(-1);return !last?'未完成':last.result==='会了'?'已会':last.result==='不会'?'未掌握':'不确定';}
  function choiceKey(q){
    const checked=typeof window!=='undefined'&&window.IndividualAudit?.choices(q);if(checked)return checked.join('');
    if(q.autoGradeDisabled||q.sourceGradingDispute)return '';
    const raw=String(q.verifiedAnswer||(!(q.audit||q.issue)?q.sourceAnswer:'')||'').trim();
    const text=raw.replace(/^(?:参考答案|正确答案|答案)\s*[:：]?\s*/,'');
    const match=text.match(/^([A-Z]+)\s*[:：]/),key=match?match[1]:text;
    return /^[A-Z]+$/.test(key)&&new Set(key).size===key.length&&[...key].every(k=>Object.hasOwn(q.options||{},k))?[...key].sort().join(''):'';
  }
  function autoResult(q,answer){
    const checked=typeof window!=='undefined'&&window.IndividualAudit?.gradeChoice(q,answer);if(checked)return checked;
    if(q.type==='多选题')return '';
    const key=choiceKey(q);
    return key.length===1&&/^[A-Z]$/.test(answer)&&Object.hasOwn(q.options||{},answer)?answer===key?'会了':'不会':'';
  }
  function hasRegression(q,events=q.events||[]){
    let right=q.firstStatus==='正确';
    for(const event of events){const resolved=typeof window!=='undefined'&&window.IndividualAudit?.gradeChoice(q,event.answer||'')||event.result;if(resolved==='会了')right=true;else if(resolved==='不会'&&right)return true;}
    return false;
  }
  const api={seed,category,autoResult,choiceKey,hasRegression,compare};if(typeof module!=='undefined')module.exports=api;if(typeof window!=='undefined')window.CompletionCore=api;
})();
