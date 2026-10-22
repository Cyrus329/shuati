'use strict';
(() => {
 const subjects=['高等数学','英语','计算机'];
 const norm=s=>String(s??'').normalize('NFKC').toLowerCase().replace(/\s|\\[()[\]]/g,'');
 const fingerprint=q=>JSON.stringify([q.subject,norm(q.stem),Object.values(q.options||{}).map(norm).sort()]);
 const text=(s,name)=>{if(typeof s!=='string'||!s.trim()||s.length>20000)throw Error('题包字段不完整：'+name);return s.trim();};
 function validateBank(records){
  if(!Array.isArray(records)||!records.length||records.length>5000)throw Error('题包需要1–5000道完整题目。');
  const seen=new Map(),out=[];
  for(const input of records){const q=JSON.parse(JSON.stringify(input));if(!q||!subjects.includes(q.subject)||!/^[-A-Za-z0-9_]{1,100}$/.test(q.id||''))throw Error('题目学科或编号无效。');
   for(const k of ['stem','section','skillTag','topic','point','analysis'])q[k]=text(q[k],q.id+' '+k);
   if(q.type!=='单选题'||!q.options||Object.keys(q.options).sort().join('')!=='ABCD'||!Object.hasOwn(q.options,q.verifiedAnswer))throw Error(q.id+'需要四个选项和一个明确的正确答案。');
   for(const k of ['A','B','C','D'])q.options[k]=text(q.options[k],q.id+' '+k);
   if(new Set(Object.values(q.options).map(s=>String(s).normalize('NFKC').replace(/\s/g,''))).size!==4)throw Error(q.id+'含重复选项。');
   if(q.subject==='高等数学'){const l=q.mathLesson;if(!l||!Array.isArray(l.steps)||l.steps.length<2||l.steps.length>5)throw Error(q.id+'缺少数学推导。');for(const k of ['method','conclusion','pitfall'])text(l[k],q.id+' '+k);l.steps.forEach(s=>text(s,q.id+' step'));l.caveat=String(l.caveat||'');}
   if(q.subject==='英语'){const l=q.englishLesson;if(!l||!Array.isArray(l.steps)||l.steps.length<2||l.steps.length>5)throw Error(q.id+'缺少英语详细讲解。');for(const k of ['translation','answerExplanation','memoryTip'])text(l[k],q.id+' '+k);for(const k of ['A','B','C','D'])for(const field of ['meaning','reason'])text(l.optionAnalysis?.[k]?.[field],q.id+' '+k+' '+field);l.steps.forEach(s=>text(s,q.id+' step'));l.caveat=String(l.caveat||'');l.references=Array.isArray(l.references)?l.references.filter(r=>r&&typeof r.url==='string'&&r.url.startsWith('https://')):[];}
   if(seen.has(q.id)){if(JSON.stringify(seen.get(q.id))!==JSON.stringify(q))throw Error('同编号内容冲突：'+q.id);continue;}seen.set(q.id,q);out.push(q);
  }return out;
 }
 function skill(q){if(q.skillTag)return q.skillTag;const t=[q.point,q.topic,q.stem].join(' ');
  if(q.subject==='高等数学'){if(/恒非负|参数|值域|有界|最大|最小/.test(t))return '参数与值域';if(/反函数/.test(t))return '反函数';if(/定义域/.test(t))return '定义域';if(/奇偶|奇函数|偶函数|周期|单调|同一函数|相同函数|函数相等|性质/.test(t))return '奇偶与性质';return '解析式与复合';}
  if(q.subject==='英语'){if(/所有格|双重|所属/.test(t))return '所有格';if(/不可数|可数|复数|单复|many|much|few|little|数量/.test(t))return '可数与数量';if(/冠词/.test(q.point+' '+q.topic))return '冠词';if(/词义|搭配|辨析/.test(q.point||''))return '词义搭配';if(/代词|替代|宾格|主格|反身|one|those|that/.test(t))return '代词';return '词义搭配';}
  if(/数制|编码|进制|补码|字节|ASCII|汉字|字符/.test(t))return '数制与编码';if(/Windows|窗口|文件|文件夹|回收站|任务栏|快捷方式/.test(t))return 'Windows操作';if(/计算思维|算法|流程|程序设计/.test(t))return '计算思维';if(/系统组成|硬件|CPU|内存|总线|存储器|输入设备|输出设备|软件/.test(t))return '系统组成';return '计算机基础';
 }
 function profile(questions,subject,section){
  const W=typeof window!=='undefined'?window.WeaknessCore:require('./weakness-core.js');
  return Object.fromEntries(W.build(questions.filter(q=>q.subject===subject&&(q.section||'当前已学内容')===section),skill).map(g=>[g.tag,{weak:g.priority,good:g.good}]));
 }
 function createDay(bank,plan={},questions=[],date){if(!/^\d{4}-\d{2}-\d{2}$/.test(date||''))throw Error('日期无效。');if(plan.days?.[date])return {day:plan.days[date],records:[],existing:true,shortages:[]};
  const usedIds=new Set(questions.filter(q=>q.dailyNew).map(q=>q.id)),usedFingerprints=new Set(questions.map(fingerprint));for(const day of Object.values(plan.days||{}))for(const g of day.groups||[])g.ids.forEach(id=>usedIds.add(id));
  const groups=new Map();for(const q of bank){const key=JSON.stringify([q.subject,q.section]);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(q);}
  const records=[],result=[],shortages=[];
  for(const [key,candidates] of groups){const [subject,section]=JSON.parse(key),available=[...new Map(candidates.filter(q=>!usedIds.has(q.id)&&!usedFingerprints.has(fingerprint(q))).map(q=>[fingerprint(q),q])).values()];if(available.length<7){shortages.push({subject,section,remaining:available.length});continue;}
   const scores=profile(questions,subject,section),chosen=[],selected=new Set(),tags={};
   const take=(role,n,score)=>{const sorted=[...available].filter(q=>!selected.has(q.id)).sort((a,b)=>score(b)-score(a)||a.id.localeCompare(b.id)),roleTags={};for(const preferred of [true,false])for(const cap of [3,Infinity])for(const q of sorted){if(n===0)break;if(selected.has(q.id)||(preferred&&score(q)<=0)||(roleTags[q.skillTag]||0)>=cap||chosen.some(v=>fingerprint(v.q)===fingerprint(q)))continue;selected.add(q.id);roleTags[q.skillTag]=(roleTags[q.skillTag]||0)+1;chosen.push({q,role});n--;}};
   take('weak',5,q=>scores[q.skillTag]?.weak||0);take('strong',2,q=>{const p=scores[q.skillTag]||{};return (p.good||0)*10/(1+(p.weak||0));});
   const ids=[];for(const {q,role}of chosen){const item={...q,canonicalId:q.id,dailyNew:true,dailyDate:date,dailyRole:role,firstStatus:'未作答',ownAnswer:'',memo:'',custom:true,source:'每日新题·核对题库',sourceAnswer:q.verifiedAnswer,batch:date+' · 每日新题',archivedAt:date,answerQuality:'题包答案与解析已核对',difficulty:q.difficulty||'中',sourceImageRefs:[],needsReview:false,issue:false,guessed:false,autoGradeDisabled:false};records.push(item);ids.push(item.id);usedIds.add(item.id);usedFingerprints.add(fingerprint(item));}
   result.push({key:subject+' / '+section,subject,section,ids,weak:5,strong:2,profile:scores});
  }return {day:{date,groups:result},records,existing:false,shortages};
 }
 const api={validateBank,fingerprint,skill,profile,createDay};if(typeof module!=='undefined')module.exports=api;if(typeof window!=='undefined')window.DailyNewCore=api;
})();
