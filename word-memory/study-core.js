'use strict';
(() => {
  const object=v=>v&&typeof v==='object'&&!Array.isArray(v);
  const dayKey=(date=new Date())=>[date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');
  function queue(questions,subject='',limit=20,all=false){
    const pool=[...new Map(questions.filter(q=>(!subject||q.subject===subject)&&q.review).map(q=>[q.id,q])).values()];
    const unseen=pool.filter(q=>!(q.events||[]).length);
    const lastTime=q=>Math.max(0,...(q.events||[]).map(a=>Number.isFinite(Date.parse(a.at))?Date.parse(a.at):0));
    // Finish unreviewed questions first; do not pad a short round with recent mistakes.
    const next=unseen.length?unseen:pool.sort((a,b)=>lastTime(a)-lastTime(b));
    return next.slice(0,Math.max(1,Math.min(100,Number(limit)||20))).map(q=>q.id);
  }
  function today(questions,date=new Date()){
    const key=dayKey(date),events=new Map(),ids=new Set();
    for(const q of questions)for(const a of q.events||[]){const d=new Date(a.at);if(!Number.isNaN(+d)&&dayKey(d)===key){const id=a.eventId||[q.id,a.at,a.result,a.answer].join('|');events.set(id,a);ids.add(q.id);}}
    return {questions:ids.size,attempts:events.size,good:[...events.values()].filter(a=>a.result==='会了').length};
  }
  function restore(value,questions){
    if(!object(value)||!Array.isArray(value.ids))return null;
    const known=new Set(questions.filter(q=>q.mistake!==false||q.dailyNew).map(q=>q.id)),original=[...new Set(value.ids.filter(id=>typeof id==='string'))];
    const ids=original.filter(id=>known.has(id));if(!ids.length)return null;
    const oldIndex=Math.max(0,Math.min(original.length,Number.isInteger(value.index)?value.index:0));
    const index=original.slice(0,oldIndex).filter(id=>known.has(id)).length;
    return {...value,ids,index,results:object(value.results)?value.results:{},drafts:object(value.drafts)?value.drafts:{}};
  }
  function answerKey(q){
    const C=typeof window!=='undefined'?window.CompletionCore:require('./completion-core.js');
    return C.choiceKey(q);
  }

  const api={queue,today,restore,dayKey,answerKey};
  if(typeof module!=='undefined')module.exports=api;
  if(typeof window!=='undefined')window.StudyCore=api;
})();
