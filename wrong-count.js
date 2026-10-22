'use strict';
(() => {
 function count(q,events=q.events||[],edits={}){
  const sources=q.occurrences?.length?q.occurrences:[q],seenSources=new Set(),seenEvents=new Set();let total=0;
  for(const source of sources){const id=source.id||source.canonicalId;if(id&&seenSources.has(id))continue;if(id)seenSources.add(id);const status=edits[id]?.firstStatus??source.firstStatus;if(status==='错误'&&!source.guessed)total++;}
  for(const event of events){if(event.result!=='不会'&&event.result!=='错误')continue;const key=event.eventId||JSON.stringify([event.at,event.result,event.answer,event.sessionId]);if(seenEvents.has(key))continue;seenEvents.add(key);total++;}
  return total;
 }
 const api={count};if(typeof module!=='undefined')module.exports=api;if(typeof window!=='undefined')window.WrongCount=api;
})();
