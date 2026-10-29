'use strict';
(() => {
 const kind=r=>['不会','错误'].includes(r)?'wrong':['会了','正确'].includes(r)?'right':/蒙对|不确定/.test(r||'')?'uncertain':'';
 const timestamp=e=>Number.isFinite(Date.parse(e.at))?Date.parse(e.at):0;
 function build(questions,skill=q=>q.skillTag||q.point||'未分类'){
  const groups=new Map(),seen=new Set();
  for(const q of questions){if(seen.has(q.id))continue;seen.add(q.id);const tag=skill(q),section=q.section||'当前已学内容',key=JSON.stringify([q.subject,section,tag]);if(!groups.has(key))groups.set(key,{key,subject:q.subject,section,tag,wrongCount:0,repeatedQuestions:0,repeatedErrors:0,good:0,questionCount:0,events:[],newAnswers:[],uncertain:0});const g=groups.get(key);g.questionCount++;
   const ids=new Set(),events=(typeof window!=='undefined'&&window.IndividualAudit?window.IndividualAudit.nativeEvents(q,q.events||[]):q.events||[]).filter(e=>{if(!kind(e.result))return false;const key=e.eventId||JSON.stringify([q.id,e.at,e.result,e.answer]);if(ids.has(key))return false;ids.add(key);return true;}).sort((a,b)=>timestamp(a)-timestamp(b));
   const count=Number.isFinite(q.wrongCount)?Math.max(0,q.wrongCount):(q.firstStatus==='错误'&&!q.guessed?1:0)+events.filter(e=>kind(e.result)==='wrong').length;g.wrongCount+=count;if(count>=2)g.repeatedQuestions++;g.repeatedErrors+=Math.max(0,count-1);const checked=typeof window!=='undefined'&&window.IndividualAudit?.lookup(q);g.good+=(typeof window!=='undefined'&&window.PersonalHistory?.isCleanStart(q)?false:checked?checked.kind==='correct'&&!checked.correctionOnly:q.initialCorrect??q.firstStatus==='正确')?1:0;g.good+=events.filter(e=>kind(e.result)==='right').length;g.uncertain+=events.filter(e=>kind(e.result)==='uncertain').length+(q.guessed?1:0);
   for(const e of events)g.events.push({...e,questionId:q.id,point:q.point||tag,stem:q.stem||'',dailyNew:!!q.dailyNew});
   if(q.dailyNew&&events.length)g.newAnswers.push({...events.at(-1),questionId:q.id,point:q.point||tag});
  }
  return [...groups.values()].map(g=>{
   const unique=new Map();for(const e of g.events){const key=e.eventId||JSON.stringify([e.questionId,e.at,e.result,e.answer]);unique.set(key,e);}g.events=[...unique.values()].sort((a,b)=>timestamp(a)-timestamp(b));g.recent=g.events.slice(-5).reverse();g.recentWrong=g.recent.filter(e=>kind(e.result)==='wrong').length;g.recentRight=g.recent.filter(e=>kind(e.result)==='right').length;g.recentUncertain=g.recent.filter(e=>kind(e.result)==='uncertain').length;
   g.newAnswers.sort((a,b)=>timestamp(a)-timestamp(b));const recentNew=g.newAnswers.slice(-3),newRight=g.newAnswers.filter(e=>kind(e.result)==='right').length,newWrong=g.newAnswers.filter(e=>kind(e.result)==='wrong').length,newUncertain=g.newAnswers.filter(e=>kind(e.result)==='uncertain').length;g.transfer={total:g.newAnswers.length,graded:newRight+newWrong,right:newRight,wrong:newWrong,uncertain:newUncertain};
   const run=new Set();for(const e of [...g.events].reverse()){if(kind(e.result)!=='right')break;if(e.dailyNew)run.add(e.questionId);if(run.size>=3)break;}
   g.transfer.allWrong=g.events.filter(e=>e.dailyNew&&kind(e.result)==='wrong').length;
   const latest=g.events.at(-1),stable=run.size>=3;
   g.priority=Math.min(g.wrongCount,30)+g.repeatedErrors*4+g.recentWrong*5+recentNew.filter(e=>kind(e.result)==='wrong').length*7+g.uncertain;
   if(stable){g.mode='新题暂时稳定';g.priority=Math.min(g.priority*.15,2);g.reason='最近3道不同的新题均答对，先减少强化量；历史错误继续保留。';}
   else if(!g.transfer.total){g.mode='尚未验证迁移';g.reason=g.wrongCount?'原题有错误记录，先用同类新题检查方法是否会用。':'原题曾学过，还需通过新题验证。';}
   else if(kind(g.newAnswers.at(-1)?.result)==='wrong'){g.mode='换题仍易错';g.reason='最近一道同类新题仍答错，优先继续用新情境强化。';}
   else {g.mode=g.transfer.graded<3?'新题样本不足':'还需连续验证';g.reason='目前的连续作答证据不足以判断稳定掌握，继续观察不同题目的表现。';}
   if(!stable&&kind(latest?.result)==='wrong'){g.priority+=4;if(g.mode!=='换题仍易错')g.reason='最近一次仍答错，下一次优先安排这一类型的新题。';}
   return g;
  }).sort((a,b)=>b.priority-a.priority||a.subject.localeCompare(b.subject,'zh')||a.tag.localeCompare(b.tag,'zh'));
 }
 const api={build,kind};if(typeof module!=='undefined')module.exports=api;if(typeof window!=='undefined')window.WeaknessCore=api;
})();
