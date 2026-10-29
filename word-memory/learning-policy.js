(function (root) {
  'use strict';
  const minute = 60000, day = 86400000;
  // Practical starting intervals, not a universal forgetting-curve formula.
  const steps = [
    {label:'20分钟',ms:20*minute}, {label:'1天',ms:day},
    {label:'3天',ms:3*day}, {label:'7天',ms:7*day},
    {label:'14天',ms:14*day}, {label:'30天',ms:30*day}
  ];
  const ratings = new Set(['new','remember','fuzzy','forgot']);
  function schedule(progress, result, now) {
    const previous = Number.isInteger(progress.stage) ? progress.stage : -1;
    const last = (progress.history || []).filter(h=>ratings.has(h.result)).at(-1);
    const relearning = last && ['forgot','fuzzy'].includes(last.result);
    let stage, delay, label;
    if (result === 'forgot') {
      stage = Math.max(0, Math.min(steps.length-1,previous-1));
      delay = 10*minute; label = '10分钟重学';
    } else if (result === 'fuzzy') {
      stage = Math.max(0,Math.min(steps.length-1,previous));
      delay = 20*minute; label = '20分钟巩固';
    } else {
      stage = Math.max(0,Math.min(steps.length-1,previous+(relearning?0:1)));
      delay = relearning ? 20*minute : steps[stage].ms;
      label = relearning ? '20分钟巩固' : steps[stage].label;
    }
    return {stage,delay,label,nextReviewAt:new Date(Number(now)+delay).toISOString()};
  }
  function spellingOutcome(correct, hadError, hintUsed) {
    return correct && !hadError && !hintUsed ? 'remember' : 'forgot';
  }
  function spellingEvidence(progress, now) {
    return (progress.history || []).some(entry=>{
      const age=Number(now)-Date.parse(entry.time || '');
      return ['spell-wrong','spell-hint','spell-assisted'].includes(entry.result) && age>=-5000 && age<10*minute;
    });
  }
  function spellingCandidates(words, now) {
    return words.filter(word=>{
      const card=word.progress?.card || {}, spell=word.progress?.spell || {};
      const last=(card.history || []).filter(h=>ratings.has(h.result)).at(-1);
      const learnedAt=Date.parse(card.lastStudiedAt || '');
      if (!(card.stage>=0) || !Number.isFinite(learnedAt) || now-learnedAt<5*minute) return false;
      if (last && ['forgot','fuzzy'].includes(last.result)) return false;
      if (spell.status==='mature' || spell.stage>=6) return false;
      if (spell.nextReviewAt) return Date.parse(spell.nextReviewAt)<=now;
      return !(spell.stage>=0);
    });
  }
  const api={steps,schedule,spellingOutcome,spellingEvidence,spellingCandidates};
  if (typeof module==='object' && module.exports) module.exports=api;
  else root.WordMemoryLearningPolicy=api;
})(typeof window==='object'?window:globalThis);
