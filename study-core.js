'use strict';
(() => {
  const object=v=>v&&typeof v==='object'&&!Array.isArray(v);
  const dayKey=(date=new Date())=>[date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');
  function queue(questions,subject='',limit=20,all=false){
    const pool=[...new Map(questions.filter(q=>(!subject||q.subject===subject)&&q.review&&!q.unusableSource).map(q=>[q.id,q])).values()];
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
  function remapChoiceRecord(row,letters){
    if(!row||!letters)return row;
    const old=row.answer;
    let answer=old;
    if(typeof old==='string'&&/^[A-Z]+$/.test(old)&&[...old].every(k=>letters[k])){
      const values=[...old].map(k=>letters[k]);
      answer=values.every(value=>typeof value==='string')?values.sort().join('')
        :[...old].map(k=>typeof letters[k]==='string'?letters[k]:'原题选项 '+k+' · '+letters[k].original).join('；');
    }
    const optionMarks=row.optionMarks?Object.fromEntries(Object.entries(row.optionMarks).flatMap(([k,v])=>typeof letters[k]==='string'?[[letters[k],v]]:[])):row.optionMarks;
    return {...row,answer,optionMarks};
  }
  function restore(value,questions){
    if(!object(value)||!Array.isArray(value.ids))return null;
    const aliases=new Map(),optionRemaps=new Map();
    for(const q of questions.filter(q=>!q.unusableSource&&(value.bookSection||q.mistake!==false||q.dailyNew))){
      for(const id of q.aliases||[q.id])aliases.set(id,q.id);
      aliases.set(q.id,q.id);
      for(const [id,letters] of Object.entries(q.optionRemaps||{}))optionRemaps.set(id,letters);
    }
    const original=[...new Set(value.ids.filter(id=>typeof id==='string'))];
    const ids=[...new Set(original.map(id=>aliases.get(id)).filter(Boolean))];if(!ids.length)return null;
    const remap=source=>{
      const out={};
      for(const [id,item] of Object.entries(object(source)?source:{})){
        const target=aliases.get(id);
        if(target&&(!Object.hasOwn(out,target)||target===id||String(item?.at||'')>String(out[target]?.at||'')))out[target]=remapChoiceRecord(item,optionRemaps.get(id));
      }
      return out;
    };
    const oldIndex=Math.max(0,Math.min(original.length,Number.isInteger(value.index)?value.index:0));
    const index=new Set(original.slice(0,oldIndex).map(id=>aliases.get(id)).filter(Boolean)).size;
    return {...value,ids,index,results:remap(value.results),drafts:remap(value.drafts)};
  }
  function sectionQueue(items,saved=null){
    if(!items.some(q=>q.subject==='高等数学')){
      const eligible=new Set(items.map(q=>q.id));
      if(!saved)return [...eligible];
      const completed=saved.ids.filter(id=>eligible.has(id)&&saved.results?.[id]);
      const completedSet=new Set(completed);
      const ordered=new Set([...saved.ids.slice(saved.index),...saved.ids.slice(0,saved.index),...eligible]);
      const pending=[...ordered].filter(id=>eligible.has(id)&&!completedSet.has(id));
      const next={...saved,ids:[...completed,...pending],index:completed.length};
      if(pending.length)delete next.endedAt;
      return next;
    }
    const submitted=q=>(q.events||[]).filter(e=>!e.viewOnly&&!e.importedEvidence&&!e.originalTimeUnknown);
    const correct=q=>q.firstRecordedStatus==='correct'||!q.firstRecordedStatus&&submitted(q)[0]?.result==='会了';
    const known=new Set(saved?.ids||[]);
    const fresh=items.filter(q=>!known.has(q.id)&&!correct(q)&&!submitted(q).length).map(q=>q.id);
    if(!saved){
      const firstWrong=items.filter(q=>q.subject==='高等数学'&&q.firstRecordedStatus==='wrong').map(q=>q.id);
      const sectionHasHistory=items.some(q=>q.subject==='高等数学'&&q.firstRecordedStatus);
      if(sectionHasHistory)return [...firstWrong,...fresh.filter(id=>!firstWrong.includes(id))];
      return [...fresh,...items.filter(q=>!correct(q)&&submitted(q).length).map(q=>q.id)];
    }
    const eligible=new Map(items.map(q=>[q.id,q]));
    const completed=(saved.ids||[]).filter(id=>eligible.has(id)&&saved.results?.[id]);
    const completedSet=new Set(completed);
    const pending=items.filter(q=>!completedSet.has(q.id)&&!correct(q))
      .sort((a,b)=>Number(b.firstRecordedStatus==='wrong')-Number(a.firstRecordedStatus==='wrong'))
      .map(q=>q.id);
    const next={...saved,ids:[...completed,...pending],index:completed.length};
    if(pending.length)delete next.endedAt;
    return next;
  }
  function answerKey(q){
    const C=typeof window!=='undefined'?window.CompletionCore:require('./completion-core.js');
    return C.choiceKey(q);
  }

  const api={queue,today,restore,sectionQueue,dayKey,answerKey,remapChoiceRecord};
  if(typeof module!=='undefined')module.exports=api;
  if(typeof window!=='undefined')window.StudyCore=api;
})();
