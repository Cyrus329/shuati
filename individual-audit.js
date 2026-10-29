'use strict';
(()=>{
 const data=window.INDIVIDUAL_AUDIT||{},lookup=q=>data[q.id];
 function applySource(q){const a=lookup(q);if(!a)return q;return {...q,...(a.stemCorrection?{stem:a.stemCorrection}:{}),...(a.optionsCorrection?{options:a.optionsCorrection}:{}),...(a.canonicalIdCorrection?{canonicalId:a.canonicalIdCorrection}:{}),verifiedAnswer:a.answer,analysis:a.reason,answerQuality:'已逐题对照原图并独立核定；原始平台答案和个人记录保留',referenceUrl:a.reference||q.referenceUrl,individualAudit:true};}
 function choices(q){const a=lookup(q);if(!a||!Object.keys(q.options||{}).length)return null;if(a.acceptedChoices)return a.acceptedChoices.filter(k=>q.options[k]);const s=String(a.answer||'').trim(),parts=s.match(/^([A-D](?:\s*[/、]\s*[A-D])*)/);if(!parts)return null;const keys=parts[1].split(/\s*[/、]\s*/);return keys.every(k=>q.options[k])?keys:null;}
 function gradeChoice(q,answer){if(q.type==='多选题')return null;const keys=choices(q);return keys&&/^[A-D]$/.test(answer)?keys.includes(answer)?'会了':'不会':null;}
 function reconcileEvents(q,events){return events.map(e=>{const result=gradeChoice(q,e.answer||'');return result&&result!==e.result?{...e,result,originalSavedResult:e.result,viewReconciled:true}:e;});}
 function nativeEvents(q,events){return reconcileEvents(q,events).filter(e=>!e.importedEvidence&&!e.originalTimeUnknown&&!e.viewOnly);}
 window.IndividualAudit={lookup,applySource,choices,gradeChoice,reconcileEvents,nativeEvents};
})();
