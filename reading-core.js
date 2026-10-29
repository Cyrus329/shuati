'use strict';
(()=>{
const normalise=value=>String(value??'').normalize('NFKC').replace(/[‘’]/g,"'").replace(/[‐‑–—]/g,'-').trim().replace(/[.。!！?？]+$/,'').trim().replace(/\s+/g,' ').toLowerCase();
function correct(question,value){if(!String(value??'').trim())return false;return [question.answer,...(question.acceptedAnswers||[])].some(key=>normalise(value)===normalise(key));}
function outcome(question,attempt){const explicit=attempt.importedEvidence&&attempt.originalOutcomes?.[question.id];if(explicit==='correct'||explicit==='incorrect')return explicit==='correct';return correct(question,attempt.answers?.[question.id]);}
function score(passage,answers){return passage.questions.filter(q=>correct(q,answers[q.id])).length;}
function withSource(passage,entry={}){const clean=window.PersonalHistory?.isCleanStart(),result={answers:{},attempts:[],notes:'',marks:{},words:[],...entry,attempts:[...(entry.attempts||[])].filter(a=>!clean||!a.importedEvidence&&!a.originalTimeUnknown)},source=clean?null:passage.sourceAttempt;if(source&&!result.attempts.some(a=>a.id===source.id)){const imported={...source,answers:{...source.answers},importedEvidence:true,originalTimeUnknown:true};delete imported.at;const provided=passage.questions.filter(q=>Object.prototype.hasOwnProperty.call(imported.answers,q.id));imported.total=provided.length;imported.score=provided.filter(q=>outcome(q,imported)).length;result.attempts.unshift(imported);}return result;}
function wrongCount(question,attempts=[]){return attempts.filter(a=>Object.prototype.hasOwnProperty.call(a.answers||{},question.id)&&!outcome(question,a)).length;}
function nativeAttempts(attempts=[]){return attempts.filter(a=>!a.importedEvidence&&!a.originalTimeUnknown);}
window.ReadingCore={normalise,correct,outcome,score,withSource,wrongCount,nativeAttempts};
})();
