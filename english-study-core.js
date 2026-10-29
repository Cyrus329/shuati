'use strict';
(()=>{
function items(){return (window.ENGLISH_STUDY_CARDS||[]).map(card=>{
 const parent=card.source==='reading'?(window.READING_DATA||[]).find(p=>p.id===card.group):(window.LISTENING_DATA?.groups||[]).find(p=>p.id===card.group);
 const sentence=card.source==='reading'?parent?.sentences[card.sentence]:parent?.sentences.find(s=>s.id===card.sentence);
 if(!sentence)throw Error('积累句来源不存在：'+card.id);
 return {...card,text:sentence.text.replace(/^[WM]:\s*/,''),translation:sentence.translation,sourceTitle:parent.title};
 });}
const ids=()=>new Set((window.ENGLISH_STUDY_CARDS||[]).map(x=>x.id));
function normalise(value={}){const allowed=ids(),saved={};for(const [id,v] of Object.entries(value?.saved||{}))if(allowed.has(id)&&v&&typeof v.value==='boolean'&&Number.isFinite(Date.parse(v.updatedAt)))saved[id]={value:v.value,updatedAt:v.updatedAt};const drafts={};for(const [id,v]of Object.entries(value?.drafts||{}))if(allowed.has(id)&&v&&Number.isFinite(Date.parse(v.updatedAt)))drafts[id]={blanks:Array.isArray(v.blanks)?Array.from(v.blanks.slice(0,8),x=>String(x??'').slice(0,1000)):[],sentence:String(v.sentence||'').slice(0,5000),updatedAt:v.updatedAt};return {version:1,saved,drafts};}
function mark(state,id,value,at=new Date().toISOString()){const next=normalise(state);if(ids().has(id))next.saved[id]={value:!!value,updatedAt:at};return next;}
function merge(a,b){const result=normalise(a),other=normalise(b);for(const [id,v] of Object.entries(other.saved))if(!result.saved[id]||Date.parse(v.updatedAt)>Date.parse(result.saved[id].updatedAt))result.saved[id]=v;for(const [id,v]of Object.entries(other.drafts))if(!result.drafts[id]||Date.parse(v.updatedAt)>Date.parse(result.drafts[id].updatedAt))result.drafts[id]=v;return result;}
function filter(list,{kind='',source='',query='',savedOnly=false}={},state={}){const saved=normalise(state).saved,q=String(query).trim().toLowerCase();return list.filter(x=>(!kind||kind==='writing'&&x.writing||kind==='translation'&&x.translationPractice)&&(!source||x.source===source)&&(!savedOnly||saved[x.id]?.value)&&(!q||[x.text,x.translation,x.pattern,x.grammar,x.note,x.use,x.sourceTitle].join(' ').toLowerCase().includes(q)));}
function topics(questions){const groups=new Map();for(const q of questions.filter(q=>q.subject==='英语'&&!q.dailyNew)){const name=q.topic||'其他英语题';groups.set(name,(groups.get(name)||0)+1);}return [...groups].sort((a,b)=>a[0].localeCompare(b[0],'zh')).map(([name,count])=>({name,count}));}
window.EnglishStudyCore={items,normalise,mark,merge,filter,topics};
})();
