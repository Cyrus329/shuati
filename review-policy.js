'use strict';
(() => {
  const uncertain = value => /错误|不会|蒙对|不确定|待核查|待判定/.test(String(value||''));
  function classify(q,events=q.events||[]){
    const judge=typeof window!=='undefined'&&window.AnswerJudgement;
    if(judge){const current=judge.current(q,events),sources=q.occurrences?.length?q.occurrences:[q],audited=window.IndividualAudit?.lookup(q),sourceHistory=window.PersonalHistory?.isCleanStart(q)?false:audited?audited.historicalWrong||audited.confidenceUncertain:sources.some(s=>{const v=judge.source(s);return v&&(v.historicalWrong||v.confidenceUncertain);}),history=!!sourceHistory||events.some(e=>{const value=window.IndividualAudit?.gradeChoice(q,e.answer||'')||e.result;return !e.importedEvidence&&uncertain(value);});return {mistake:history,correct:current.kind==='correct',unscored:current.kind==='unanswered',pending:current.kind==='incorrect'||current.kind==='uncertain',disputed:current.kind==='source_issue',recordOnly:current.kind==='record_only',completed:current.completed,currentResult:current.kind};}
    if(q.dailyNew){const history=events.some(a=>uncertain(a.result)),latest=events.at(-1);return {mistake:history,correct:!history&&latest?.result==='会了',unscored:!events.length,pending:history&&latest?.result!=='会了'};}
    const status=q.groupStatus||q.firstStatus||'待核查';
    const sources=q.occurrences?.length?q.occurrences:[q];
    const history=events.some(a=>uncertain(a.result));
    // 题源瑕疵不能反推本人做错；明确的个人不确定与后续错误另算。
    const qualityIssue=o=>o.issue||o.audit||o.autoGradeDisabled||o.sourceGradingDispute;
    const personalRisk=o=>o.guessed||o.needsReview&&!qualityIssue(o);
    const sourceRisk=sources.some(o=>!['正确','已完成'].includes(o.firstStatus)||personalRisk(o));
    const mistake=!['正确','已完成'].includes(status)||sourceRisk||history||!!personalRisk(q);
    const latest=events.at(-1);
    const correct=!mistake&&(latest?.result==='会了'||status==='正确');
    return {mistake,correct,unscored:!mistake&&!correct,pending:mistake&&latest?.result!=='会了'};
  }
  function summary(questions,eventsOf=q=>q.events||[]){
    const out={total:0,correct:0,mistake:0,unscored:0,pending:0,recorded:0,originals:0,daily:0};
    if(typeof window!=='undefined'&&window.AnswerJudgement){out.disputed=0;out.recordOnly=0;out.historical=0;out.recovered=0;for(const q of questions){const c=classify(q,eventsOf(q));out.total++;out[q.dailyNew?'daily':'originals']++;out[c.recordOnly?'recordOnly':c.disputed?'disputed':c.correct?'correct':c.unscored?'unscored':'mistake']++;if(c.pending)out.pending++;if(c.completed)out.recorded++;if(c.mistake)out.historical++;if(c.mistake&&c.correct)out.recovered++;}return out;}
    for(const q of questions){const events=eventsOf(q),c=classify(q,events);out.total++;out[q.dailyNew?'daily':'originals']++;out[c.mistake?'mistake':c.correct?'correct':'unscored']++;if(c.pending)out.pending++;if(events.length)out.recorded++;}
    return out;
  }
  const api={classify,summary};
  if(typeof module!=='undefined')module.exports=api;
  if(typeof window!=='undefined')window.ReviewPolicy=api;
})();
