'use strict';
(() => {
  function seed(state,entries){
    state.attempts=state.attempts||{};let added=0;
    const ids=new Set(Object.values(state.attempts).flatMap(list=>Array.isArray(list)?list.map(e=>e.eventId):[]));
    for(const {questionId,event} of entries||[]){if(!questionId||!event?.eventId||ids.has(event.eventId))continue;state.attempts[questionId]=[...(state.attempts[questionId]||[]),{...event}].sort((a,b)=>String(a.at).localeCompare(String(b.at)));ids.add(event.eventId);added++;}
    return {added};
  }
  function category(events){const last=events.at(-1);return !last?'未完成':last.result==='会了'?'已会':last.result==='不会'?'未掌握':'不确定';}
  function choiceKey(q){
    if(q.autoGradeDisabled||q.sourceGradingDispute)return '';
    const raw=String(q.verifiedAnswer||(!(q.audit||q.issue)?q.sourceAnswer:'')||'').trim();
    const text=raw.replace(/^(?:参考答案|正确答案|答案)\s*[:：]?\s*/,'');
    const match=text.match(/^([A-Z]+)\s*[:：]/),key=match?match[1]:text;
    return /^[A-Z]+$/.test(key)&&new Set(key).size===key.length&&[...key].every(k=>Object.hasOwn(q.options||{},k))?[...key].sort().join(''):'';
  }
  function autoResult(q,answer){
    if(q.type==='多选题')return '';
    const key=choiceKey(q);
    return key.length===1&&/^[A-Z]$/.test(answer)&&Object.hasOwn(q.options||{},answer)?answer===key?'会了':'不会':'';
  }
  function hasRegression(q,events=q.events||[]){
    let right=q.firstStatus==='正确';
    for(const event of events){if(event.result==='会了')right=true;else if(event.result==='不会'&&right)return true;}
    return false;
  }
  const api={seed,category,autoResult,choiceKey,hasRegression};if(typeof module!=='undefined')module.exports=api;if(typeof window!=='undefined')window.CompletionCore=api;
})();
