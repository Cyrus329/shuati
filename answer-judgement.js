'use strict';
(()=>{
 const data=typeof window!=='undefined'?window.ANSWER_JUDGEMENTS||{}:{},text=v=>String(v??''),normal=v=>text(v).normalize('NFKC').trim().toLowerCase().replace(/\s+/g,''),letter=v=>text(v).trim().match(/^([A-D]+)(?:$|[（(:：.、])/i)?.[1]?.toUpperCase();
 function source(q){if(window.PersonalHistory?.isCleanStart(q))return null;const audited=window.IndividualAudit?.lookup(q);if(audited)return audited;const saved=data[q.id];if(saved)return saved;if(q.firstStatus==='正确')return {kind:'correct',completed:true,historicalWrong:false,originalAnswer:q.ownAnswer||'',answer:q.verifiedAnswer||q.sourceAnswer||'',reason:'原始记录明确标为做对。',confidenceUncertain:!!q.guessed};if(q.firstStatus==='错误')return {kind:'incorrect',completed:true,historicalWrong:true,originalAnswer:q.ownAnswer||'',answer:q.verifiedAnswer||q.sourceAnswer||'',reason:'本人在原记录明确标为做错；本人历史记录保留。'};return null;}
 function result(kind,fields={}){return {kind,completed:kind!=='unanswered',...fields};}
 function current(q,events=q.events||[]){
  const clean=window.PersonalHistory?.isCleanStart(q);if(clean)events=events.filter(e=>!e.importedEvidence&&!e.originalTimeUnknown&&!e.viewOnly);
  const audit=window.IndividualAudit?.lookup(q),last=events.at(-1),sources=q.occurrences?.length?q.occurrences:[q],originals=sources.map(source).filter(Boolean),initial=audit||originals.at(-1)||source(q),ref=audit?.answer||q.verifiedAnswer||q.sourceAnswer||'';
  if(!clean&&audit&&(!last||last.importedEvidence))return result(audit.kind,{...audit});
  if(last){
   const checked=audit&&window.IndividualAudit.gradeChoice(q,last.answer||'');if(checked)return result(checked==='会了'?'correct':'incorrect',{originalAnswer:last.answer,answer:ref,reason:'最近实际作答为'+last.answer+'，按逐题核定的可接受答案重新对照。'+(audit.reason||''),evidence:audit.evidence,basis:'最近实际答案与独立核定对照',event:last});
   if(['会了','不会'].includes(last.result))return result(last.result==='会了'?'correct':'incorrect',{originalAnswer:last.answer||'原图未保留具体输入',answer:ref,reason:last.note||'依据最近保存的作答结果。',basis:'最近保存的作答',event:last});
   if(initial?.kind==='source_issue'&&last.importedEvidence)return result('source_issue',{...initial,basis:'原答与题源逐项核对',event:last});
   const own=last.answer||'',key=q.verifiedAnswer||q.sourceAnswer||'',a=letter(own),b=letter(key);
   if(own&&((a&&b&&!q.autoGradeDisabled)||(!q.issue&&normal(own)===normal(key))))return result(a&&b?(a===b?'correct':'incorrect'):'correct',{originalAnswer:own,answer:key,reason:'原来标为不确定，本次按实际答案与核定答案对照；原来的主观备注保留。',basis:'答案对照',event:last});
   return result('uncertain',{originalAnswer:own||'未保留具体答案',answer:ref,reason:'这条个人记录只表达了不确定，尚没有足够答案内容可判对错。',basis:'个人作答记录',event:last});
  }
  if(clean)return result('unanswered',{answer:ref,originalAnswer:'',reason:'学习记录已重新开始，本题尚未作答。'});
  if(initial)return result(initial.kind,{...initial,basis:'原始作答逐项核对'});
  if(q.dailyNew)return result('unanswered',{answer:'',originalAnswer:'',reason:'新题尚未作答。'});
  return result('uncertain',{originalAnswer:q.ownAnswer||'',answer:ref,reason:'尚未提供可对应的作答记录。'});
 }
 const category=(q,events)=>{const v=current(q,events);return v.correctionOnly?'已订正':({correct:'已会',incorrect:'未掌握',record_only:'原答未留存',source_issue:'题源问题',uncertain:'不确定',unanswered:'未完成'})[v.kind];};
 function viewEvents(q,events=q.events||[]){const v=current(q,events);if(!v.completed)return[];events=window.IndividualAudit?.reconcileEvents(q,events)||events;const verdict=v.correctionOnly?'已订正':v.kind==='correct'?'会了':v.kind==='incorrect'?'不会':v.kind==='source_issue'?'题源问题':v.kind==='record_only'?'原答未留存':'不确定';if(events.at(-1)?.result===verdict)return events;return [...events,{viewOnly:true,eventId:'view-result-'+q.id,result:verdict,answer:v.originalAnswer,note:v.reason}];}
 const escape=v=>text(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function render(q,events=q.events||[]){const v=current(q,events);if(!v.completed)return'';const title=v.correctionOnly?'原答曾错 · 已订正':{correct:'✓ 已判对',incorrect:'× 已判错',record_only:'已完成 · 原答未留存',source_issue:'核查说明 · 已完成',uncertain:'本条记录需核对'}[v.kind],fmt=x=>typeof window!=='undefined'&&window.MathNotation?window.MathNotation.html(q.subject,x):escape(x);return `<section class="answer-verdict verdict-${v.kind}" data-answer-verdict="${v.kind}"><header><strong>${title}</strong><span>${escape(v.basis)}</span></header><div class="answer-verdict-grid"><div><small>对应的原答 / 本次答案</small><p>${fmt(v.originalAnswer||'原图未填具体答案；个人结果按已确认规则记录')}</p></div><div><small>核定答案 / 对照要点</small><p>${fmt(v.answer||'见题内解析')}</p></div></div><p>${escape(v.reason)}</p>${v.evidence?`<details><summary>本题原图核对依据</summary><p>${escape(v.evidence)}</p></details>`:''}${v.correctionOnly?'<p>原稿订正保留，不冒充新增独立复练或掌握记录。</p>':''}${v.reference?`<a href="${escape(v.reference)}" target="_blank" rel="noopener noreferrer">核查依据 ↗</a>`:''}<small>做过并已记录；历史错答与当前判定分别保留。</small></section>`;}
 const api={source,current,category,viewEvents,render};if(typeof window!=='undefined')window.AnswerJudgement=api;if(typeof module!=='undefined')module.exports=api;
})();
