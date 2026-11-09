'use strict';
(() => {
 const M=typeof window!=='undefined'?window.DailyMasteryCore:require('./daily-mastery-core.js');
 const subjects=['高等数学','英语','计算机'];
 const T=typeof window!=='undefined'?window.DailyTypePolicy:require('./daily-type-policy.js');
 const norm=s=>String(s??'').normalize('NFKC').toLowerCase().replace(/\s|\\[()[\]]/g,'');
 const fingerprint=q=>JSON.stringify([q.subject,norm(q.stem),Object.values(q.options||{}).map(norm).sort()]);
 const structure=q=>q.subject==='高等数学'?JSON.stringify([q.subject,norm(q.stem).replace(/[−–]/g,'-').replace(/\d+(?:\.\d+)?/g,'#')]):fingerprint(q);
 const text=(s,name)=>{if(typeof s!=='string'||!s.trim()||s.length>20000)throw Error('题包字段不完整：'+name);return s.trim();};
 function validateBank(records){
  if(!Array.isArray(records)||!records.length||records.length>5000)throw Error('题包需要1–5000道完整题目。');
  const seen=new Map(),out=[];
  for(const input of records){const q=JSON.parse(JSON.stringify(input));if(!q||!subjects.includes(q.subject)||!/^[-A-Za-z0-9_]{1,100}$/.test(q.id||''))throw Error('题目学科或编号无效。');
   for(const k of ['stem','section','skillTag','topic','point','analysis'])q[k]=text(q[k],q.id+' '+k);
   q.type=T.normalize(q.type);if(!T.allowed[q.subject]?.includes(q.type))throw Error(q.id+'题型不在当前已导入的学科题型范围内。');
   if(!q.options||typeof q.options!=='object'||Array.isArray(q.options))q.options={};
   if(T.written(q)){q.verifiedAnswer=text(q.verifiedAnswer,q.id+'参考答案');if(Object.keys(q.options).length)throw Error(q.id+'书面题不应带选择题选项。');if(!Array.isArray(q.scoringPoints)||!q.scoringPoints.length||q.scoringPoints.length>10)throw Error(q.id+'书面题缺少评分要点。');q.scoringPoints=q.scoringPoints.map(v=>text(v,q.id+'评分要点'));q.autoGradeDisabled=true;}
   else {const letters=Object.keys(q.options).sort().join('');if(letters!==(q.type==='判断题'?'AB':'ABCD'))throw Error(q.id+'选项不完整。');for(const letter of Object.keys(q.options))q.options[letter]=text(q.options[letter],q.id+' '+letter);const raw=String(q.verifiedAnswer||''),keys=[...raw];if(!raw||!keys.every(k=>Object.hasOwn(q.options,k))||new Set(keys).size!==keys.length||(q.type!=='多选题'&&keys.length!==1)||(q.type==='多选题'&&keys.length<2))throw Error(q.id+'正确选项无效。');q.verifiedAnswer=keys.sort().join('');if(new Set(Object.values(q.options).map(v=>String(v).normalize('NFKC').replace(/\s/g,''))).size!==Object.keys(q.options).length)throw Error(q.id+'含重复选项。');}
   if(q.subject==='高等数学'){const l=q.mathLesson;if(!l||!Array.isArray(l.steps)||l.steps.length<2||l.steps.length>5)throw Error(q.id+'缺少数学推导。');for(const k of ['method','conclusion','pitfall'])text(l[k],q.id+' '+k);l.steps.forEach(s=>text(s,q.id+' step'));l.caveat=String(l.caveat||'');}
   if(q.subject==='英语'){const l=q.englishLesson;if(!l||!Array.isArray(l.steps)||l.steps.length<2||l.steps.length>5)throw Error(q.id+'缺少英语详细讲解。');for(const k of ['translation','answerExplanation','memoryTip'])text(l[k],q.id+' '+k);for(const k of Object.keys(q.options||{}))for(const field of ['meaning','reason'])text(l.optionAnalysis?.[k]?.[field],q.id+' '+k+' '+field);l.steps.forEach(s=>text(s,q.id+' step'));l.caveat=String(l.caveat||'');l.references=Array.isArray(l.references)?l.references.filter(r=>r&&typeof r.url==='string'&&r.url.startsWith('https://')):[];}
   if(seen.has(q.id)){if(JSON.stringify(seen.get(q.id))!==JSON.stringify(q))throw Error('同编号内容冲突：'+q.id);continue;}seen.set(q.id,q);out.push(q);
  }return out;
 }
 function skill(q){if(q.subject==='高等数学'){const specific=M.tag(q);if(specific)return specific;}if(q.skillTag)return q.skillTag;const t=[q.point,q.topic,q.stem].join(' ');
  if(q.subject==='高等数学'){if(/恒非负|参数|值域|有界|最大|最小/.test(t))return '参数与值域';if(/反函数/.test(t))return '反函数';if(/定义域/.test(t))return '定义域';if(/奇偶|奇函数|偶函数|周期|单调|同一函数|相同函数|函数相等|性质/.test(t))return '奇偶与性质';if(/极限|连续|间断/.test(t))return q.point||'未分类';return /解析式|复合|表达式|代入|换元/.test(t)?'解析式与复合':'未分类';}
  if(q.subject==='英语'){if(/所有格|双重|所属/.test(t))return '所有格';if(/不可数|可数|复数|单复|many|much|few|little|数量/.test(t))return '可数与数量';if(/冠词/.test(q.point+' '+q.topic))return '冠词';if(/词义|搭配|辨析/.test(q.point||''))return '词义搭配';if(/代词|替代|宾格|主格|反身|one|those|that/.test(t))return '代词';return '词义搭配';}
  if(/数制|编码|进制|补码|字节|ASCII|汉字|字符/.test(t))return '数制与编码';if(/Windows|窗口|文件|文件夹|回收站|任务栏|快捷方式/.test(t))return 'Windows操作';if(/计算思维|算法|流程|程序设计/.test(t))return '计算思维';if(/系统组成|硬件|CPU|内存|总线|存储器|输入设备|输出设备|软件/.test(t))return '系统组成';return '计算机基础';
 }
 function profile(questions,subject,section,{allSections=false}={}){
  const W=typeof window!=='undefined'?window.WeaknessCore:require('./weakness-core.js');
  return W.build(questions.filter(q=>q.subject===subject&&(allSections||subject==='高等数学'||(q.section||'当前已学内容')===section)),skill).reduce((out,g)=>{const old=out[g.tag]||{weak:0,good:0};out[g.tag]={weak:old.weak+g.priority,good:old.good+g.good};return out;},{});
 }
 function createDay(bank,plan={},questions=[],date,{fillMissing=false,sectionPractice=false,allowPartial=false}={}){if(!/^\d{4}-\d{2}-\d{2}$/.test(date||''))throw Error('日期无效。');const mastery=M.summarize(questions),mastered=mastery.masteredTags;const original=plan.days?.[date];if(original&&!fillMissing)return {day:original,records:[],existing:true,shortages:[],mastered,mastery};const present=new Set((original?.groups||[]).map(g=>JSON.stringify([g.subject,g.section])));
  const usedIds=new Set(questions.filter(q=>q.dailyNew).map(q=>q.id)),usedFingerprints=new Set(questions.map(fingerprint)),usedStructures=new Set(questions.filter(q=>q.dailyNew).map(structure));for(const day of Object.values(plan.days||{}))for(const g of day.groups||[])g.ids.forEach(id=>usedIds.add(id));
  const groups=new Map();for(const q of bank){const key=JSON.stringify([q.subject,sectionPractice?q.section:q.subject==='高等数学'?'全章统筹':q.section]);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(q);}
  const records=[],result=[],shortages=[];
  for(const [key,candidates] of groups){const [subject,section]=JSON.parse(key);if(present.has(key)||subject==='高等数学'&&original?.groups?.some(g=>g.subject==='高等数学'))continue;const available=[...new Map(candidates.filter(q=>!M.isMastered(q,mastery)&&!usedIds.has(q.id)&&!usedFingerprints.has(fingerprint(q))&&!usedStructures.has(structure(q))).map(q=>[structure(q),q])).values()];if(available.length<(sectionPractice?5:7)){shortages.push({subject,section,remaining:available.length,allMastered:subject==='高等数学'&&candidates.every(q=>M.isMastered(q,mastery))});if(!allowPartial||!available.length)continue;}
   const scores=profile(questions,subject,section,{allSections:sectionPractice}),chosen=[],selected=new Set(),tags={};
   const take=(role,n,score)=>{const sorted=[...available].filter(q=>!selected.has(q.id)).sort((a,b)=>score(b)-score(a)||a.id.localeCompare(b.id)),roleTags={};for(const preferred of [true,false])for(const cap of [3,Infinity])for(const q of sorted){if(n===0)break;if(selected.has(q.id)||(preferred&&score(q)<=0)||(roleTags[q.skillTag]||0)>=cap||chosen.some(v=>fingerprint(v.q)===fingerprint(q)))continue;selected.add(q.id);roleTags[q.skillTag]=(roleTags[q.skillTag]||0)+1;chosen.push({q,role});n--;}};
   take('weak',sectionPractice?Math.min(4,Math.max(0,available.length-1)):5,q=>scores[skill(q)]?.weak||0);take('strong',sectionPractice?1:2,q=>{const p=scores[skill(q)]||{};return (p.good||0)*10/(1+(p.weak||0));});
   T.balance(chosen,available,scores);
   const ids=[];for(const {q,role}of chosen){const item={...q,canonicalId:q.id,dailyNew:true,dailyDate:date,dailyRole:role,firstStatus:'未作答',ownAnswer:'',memo:'',custom:true,source:'每日新题·核对题库',sourceAnswer:q.verifiedAnswer,batch:date+' · 每日新题',archivedAt:date,answerQuality:'题包答案与解析已核对',difficulty:q.difficulty||'中',sourceImageRefs:[],needsReview:false,issue:false,guessed:false,autoGradeDisabled:T.written(q)||!!q.autoGradeDisabled};records.push(item);ids.push(item.id);usedIds.add(item.id);usedFingerprints.add(fingerprint(item));usedStructures.add(structure(item));}
   result.push({key:subject+' / '+section,subject,section,ids,weak:chosen.filter(q=>q.role==='weak').length,strong:chosen.filter(q=>q.role==='strong').length,profile:scores});
  }return {day:{...original,date,groups:[...(original?.groups||[]),...result],diversityVersion:original?.diversityVersion??1},records,existing:!!original,extended:!!original&&result.length>0,shortages,mastered,mastery};
 }
 function refreshDiversity(bank,value={},questions=[],date){
  const plan=JSON.parse(JSON.stringify(value)),day=plan.days?.[date];
  if(!day||day.diversityVersion===1)return {plan,records:[],replaced:0,changed:false};
  // Existing assignments and drafts remain intact. New scheduling handles diversity and mastery.
  day.diversityVersion=1;return {plan,records:[],replaced:0,changed:true};
 }
 function needsCompletion(bank,plan,date){const groups=plan.days?.[date]?.groups||[],keys=new Set(groups.map(g=>JSON.stringify([g.subject,g.section])));return bank.some(q=>q.subject==='高等数学'?!groups.some(g=>g.subject==='高等数学'):!keys.has(JSON.stringify([q.subject,q.section])));}
 const api={validateBank,fingerprint,structure,skill,profile,createDay,refreshDiversity,needsCompletion};if(typeof module!=='undefined')module.exports=api;if(typeof window!=='undefined')window.DailyNewCore=api;
})();
