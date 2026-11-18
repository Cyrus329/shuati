'use strict';
(()=>{
 const data=window.INDIVIDUAL_AUDIT||{},reviews=window.QUESTION_CHOICE_REVIEW||{};
 const review=q=>q.userConfirmedWrong?null:reviews[q.id]||reviews[q.canonicalId]||null;
 const originalLookup=q=>q.userConfirmedWrong?{kind:'incorrect',completed:true,historicalWrong:true,originalAnswer:q.ownAnswer||'',answer:q.verifiedAnswer||'',reason:'本人确认按错题记录。'+(q.questionNote||''),evidence:'本人确认'}:window.MathChapter1Nov4?.lookup(q)||data[q.id];
 function lookup(q){
   const original=originalLookup(q),checked=review(q);
   if(!checked||!original)return original;
   return {...original,answer:checked.answer||checked.preferredAnswer||checked.acceptedChoices.join(' / '),reason:checked.analysis,acceptedChoices:checked.acceptedChoices||[...checked.answer]};
 }
 function applyReview(q){
   const checked=review(q);
   if(!checked)return q;
   return {...q,stem:checked.stem||q.stem,type:checked.type||q.type,
     verifiedAnswer:checked.answer||checked.preferredAnswer||checked.acceptedChoices.join(' / '),
     analysis:checked.analysis,answerQuality:checked.mode==='ambiguous-single'?'原题有多个可成立选项，按解析核对':'本题答案已核定',
     autoGradeDisabled:false,sourceGradingDispute:false,choiceReview:checked};
 }
 function applySource(q){const a=lookup(q);if(!a)return q;return {...q,...(a.stemCorrection?{stem:a.stemCorrection}:{}),...(a.optionsCorrection?{options:a.optionsCorrection}:{}),...(a.canonicalIdCorrection?{canonicalId:a.canonicalIdCorrection}:{}),verifiedAnswer:a.answer,analysis:a.reason,answerQuality:'已逐题对照原图并独立核定；原始平台答案和个人记录保留',referenceUrl:a.reference||q.referenceUrl,individualAudit:true};}
 function choices(q){const checked=review(q);if(checked){const keys=(checked.acceptedChoices||[...checked.answer]).filter(k=>Object.hasOwn(q.options||{},k));return keys.length?keys:null;}if(q.contentRestored){if(q.autoGradeDisabled||q.sourceGradingDispute)return null;const key=String(q.verifiedAnswer||'');return /^[A-D]+$/.test(key)&&[...key].every(k=>q.options?.[k])?[...key]:null;}const a=lookup(q);if(!a||!Object.keys(q.options||{}).length)return null;if(a.acceptedChoices)return a.acceptedChoices.filter(k=>q.options[k]);const s=String(a.answer||'').trim(),parts=s.match(/^([A-D](?:\s*[/、]\s*[A-D])*)/);if(!parts)return null;const keys=parts[1].split(/\s*[/、]\s*/);return keys.every(k=>q.options[k])?keys:null;}
 function gradeChoice(q,answer){
   const checked=review(q),keys=choices(q);
   if(!keys)return null;
   if(q.type==='多选题')return checked?.mode==='multi'&&/^[A-D]+$/.test(answer)?[...answer].sort().join('')===keys.join('')?'会了':'不会':null;
   return /^[A-D]$/.test(answer)?keys.includes(answer)?'会了':'不会':null;
 }
 function reconcileEvents(q,events){return events.map(e=>{const result=review(q)&&!e.importedEvidence&&e.result==='蒙对'?null:gradeChoice(q,e.answer||'');return result&&result!==e.result?{...e,result,originalSavedResult:e.result,viewReconciled:true}:e;});}
 function nativeEvents(q,events){return reconcileEvents(q,events).filter(e=>!e.importedEvidence&&!e.originalTimeUnknown&&!e.viewOnly);}
 window.IndividualAudit={lookup,applySource,applyReview,choices,gradeChoice,reconcileEvents,nativeEvents};
})();
