'use strict';
(() => {
 const allowed={'高等数学':['单选题','填空题','计算题'],'英语':['单选题','填空题','翻译题'],'计算机':['单选题','多选题','判断题','填空题','应用题']};
 const normalize=t=>({'选择题':'单选题','填空/计算题':'填空题','计算/填空题':'填空题'}[t]||t);
 const family=q=>normalize(q.type),written=q=>['填空题','计算题','翻译题','应用题'].includes(normalize(q.type));
 function balance(chosen,available,scores){const types=[...new Set(available.map(family))];for(const type of types){if(chosen.some(x=>family(x.q)===type))continue;const counts={};chosen.forEach(x=>counts[family(x.q)]=(counts[family(x.q)]||0)+1);const slot=chosen.findLastIndex(x=>counts[family(x.q)]>1);if(slot<0)continue;const role=chosen[slot].role,selected=new Set(chosen.map(x=>x.q.id)),score=q=>role==='weak'?(scores[q.skillTag]?.weak||0):(scores[q.skillTag]?.good||0)*10/(1+(scores[q.skillTag]?.weak||0));const options=available.filter(q=>family(q)===type&&!selected.has(q.id)).sort((a,b)=>score(b)-score(a)||a.id.localeCompare(b.id));if(options.length)chosen[slot]={q:options[0],role};}return chosen;}
 const api={allowed,normalize,family,written,balance};if(typeof module!=='undefined')module.exports=api;if(typeof window!=='undefined')window.DailyTypePolicy=api;
})();
