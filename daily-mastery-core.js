'use strict';
(()=>{
 const norm=s=>String(s||'').normalize('NFKC').replace(/\s/g,'');
 const broad=new Set(['函数','极限','连续','极限与连续','参数与值域','奇偶与性质','解析式与复合','综合考点待细分','未分类']);
 const F=typeof window!=='undefined'?window.QuestionFamilies:require('./families.js');
 function tag(q){if(q.subject!=='高等数学'||/导数|求导|微分|积分|多元|二元/.test([q.section,q.point,q.topic].join(' ')))return '';const p=norm(q.point||q.skillTag),t=[q.point,q.stem].join(' ');if(!/函数|极限|连续|间断|定义域|值域|奇偶|周期|单调|反函数|复合|解析式|根式|有界/.test([q.section,p].join(' ')))return '';
 const f=F?.classify(q);if(f?.confirmed){let scope=f.scope||'';if(/定义域含参数/.test(f.name))scope+=/ln|lg|log|对数/.test(t)?'·对数严格为正':'·根式非负';return f.name+'|'+scope;}
 if(/值域/.test(t)){if(/分式|分母|\\frac|\//.test(t)&&!/根式|sqrt|√|对数|log|ln/.test(t))return '值域·分式|'+(/区间|限定|闭区间|开区间/.test(t)?p:'自然定义域');return '';}
 if(/极限|连续|间断/.test(t)){const rules=[['极限·因式分解',/因式分解|约去.*因子/],['极限·有理化',/有理化/],['极限·无穷远最高次',/最高次|无穷远.*分式/],['极限·三角标准式',/标准.*三角|三角.*标准|正弦.*重要极限/],['极限·三角恒等变换',/三角恒等/],['极限·夹逼',/夹逼/],['极限·左右比较',/左右极限|左.*右.*极限/],['极限·数列幂比',/数列.*幂|幂比/],['极限·复合换元',/极限.*换元|换元.*极限/],['极限·无穷大符号',/无穷大.*符号/],['连续·补定义',/补定义|补充定义/],['连续·分段参数',/连续.*参数|参数.*连续/],['间断·可去判别',/可去间断/],['间断·跳跃判别',/跳跃间断/],['连续·复合函数',/复合.*连续|连续.*复合/],['连续·零点存在',/零点.*存在|零点定理/],['间断·无穷间断',/无穷间断/]];for(const [name,re] of rules)if(q.skillTag===name||re.test(q.point||''))return name;return ''; }
 return !q.stem&&!broad.has(p)?p:'';
 }

 const kind=r=>['正确','会了'].includes(r)?'right':['错误','不会'].includes(r)?'wrong':/蒙对|不确定/.test(r||'')?'uncertain':'';
 function summarize(questions){const groups=new Map();for(const q of questions){const t=tag(q);if(!t)continue;if(!groups.has(t))groups.set(t,{tag:t,original:[],daily:[],bad:[],unknownBad:false});const g=groups.get(t);const audit=typeof window!=='undefined'&&window.IndividualAudit;const checked=audit&&audit.lookup(q);const cleanStart=typeof window!=='undefined'&&window.PersonalHistory?.isCleanStart(q);const boundary=Date.parse(q.sourceEvidenceAvailableAt);if(!q.dailyNew&&!cleanStart&&Number.isFinite(boundary)&&q.sourceEvidenceTimeBasis==='availability-boundary-not-attempt-time'&&(q.guessed||['wrong','uncertain'].includes(kind(q.firstStatus))))g.bad.push(boundary);if(!q.dailyNew&&!q.guessed&&!(typeof window!=='undefined'&&window.PersonalHistory?.isCleanStart(q))&&(checked?checked.kind==='correct'&&!checked.correctionOnly:q.initialCorrect===true||q.firstStatus==='正确'))g.original.push(0);const events=audit?audit.nativeEvents(q,q.events||[]):q.events||[];for(const e of events){const k=kind(e.result);if(!k||e.importedEvidence||e.viewOnly)continue;const time=Date.parse(e.at);if(k!=='right'){if(!Number.isFinite(time)||e.originalTimeUnknown)g.unknownBad=true;else g.bad.push(time);continue;}if(!Number.isFinite(time)||e.originalTimeUnknown||e.correctionOnly||e.correction||e.viewReconciled||e.answerViewed||e.revealed||e.independent===false||/订正|看答案|导入/.test(e.source||e.mode||''))continue;(q.dailyNew?g.daily:g.original).push(time);}}
 const masteredTags=[];for(const g of groups.values()){const o=Math.max(...g.original),d=Math.max(...g.daily),bad=Math.max(...g.bad);g.mastered=Number.isFinite(o)&&Number.isFinite(d)&&!g.unknownBad&&bad<Math.max(o,d);if(g.mastered)masteredTags.push(g.tag);}return {masteredTags,groups:[...groups.values()]};}
 const api={tag,summarize,isMastered:(q,summary)=>summary.masteredTags.includes(tag(q))};if(typeof module!=='undefined')module.exports=api;if(typeof window!=='undefined')window.DailyMasteryCore=api;
})();

if(typeof window!=='undefined')window.JournalReleaseStatus?.register('mastery','v4.0-workspace-20261108');
