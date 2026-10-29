'use strict';
(() => {
 function count(q,events=q.events||[],edits={}){
  const clean=typeof window!=='undefined'&&window.PersonalHistory?.isCleanStart(q);if(clean){const seen=new Set();return events.filter(e=>{if(e.importedEvidence||e.originalTimeUnknown||e.viewOnly)return false;const result=window.IndividualAudit?.gradeChoice(q,e.answer||'')||e.result;if(!['\u4e0d\u4f1a','\u9519\u8bef'].includes(result))return false;const id=e.eventId||JSON.stringify([e.at,e.result,e.answer,e.sessionId]);if(seen.has(id))return false;seen.add(id);return true;}).length;}
  const audited=typeof window!=='undefined'&&window.IndividualAudit?.lookup(q);if(audited){const seen=new Set();return Number(!!audited.historicalWrong)+events.filter(e=>{const resolved=window.IndividualAudit.gradeChoice(q,e.answer||'')||e.result;if(e.importedEvidence||!['不会','错误'].includes(resolved))return false;const key=e.eventId||JSON.stringify([e.at,e.result,e.answer,e.sessionId]);if(seen.has(key))return false;seen.add(key);return true;}).length;}
  const sources=q.occurrences?.length?q.occurrences:[q],seenSources=new Set(),seenEvents=new Set();let total=0;
  for(const source of sources){const id=source.id||source.canonicalId;if(id&&seenSources.has(id))continue;if(id)seenSources.add(id);const status=edits[id]?.firstStatus??source.firstStatus;const checked=typeof window!=='undefined'&&window.AnswerJudgement?.source(source);if(checked?checked.historicalWrong:status==='错误'&&!source.guessed)total++;}
  for(const event of events){if(event.result!=='不会'&&event.result!=='错误')continue;const key=event.eventId||JSON.stringify([event.at,event.result,event.answer,event.sessionId]);if(seenEvents.has(key))continue;seenEvents.add(key);total++;}
  return total;
 }
 const api={count};if(typeof module!=='undefined')module.exports=api;if(typeof window!=='undefined')window.WrongCount=api;
})();
