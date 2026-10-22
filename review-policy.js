'use strict';
(() => {
  const uncertain = value => /错误|不会|蒙对|不确定|待核查|待判定/.test(String(value||''));
  function classify(q,events=q.events||[]){
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
    return {mistake,correct:!mistake&&status==='正确',unscored:!mistake&&status==='已完成',pending:mistake&&latest?.result!=='会了'};
  }
  const api={classify};
  if(typeof module!=='undefined')module.exports=api;
  if(typeof window!=='undefined')window.ReviewPolicy=api;
})();
