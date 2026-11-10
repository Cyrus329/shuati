'use strict';
(()=>{
function exercise(id){const row=(window.WRITING_PRACTICE_DATA||[]).find(x=>x.id===id);if(!row)return null;const parts=[],answers=[];let at=0;for(const m of row.template.matchAll(/\{\{([^}]+)\}\}/g)){parts.push(row.template.slice(at,m.index));answers.push(m[1]);at=m.index+m[0].length;}parts.push(row.template.slice(at));return {...row,parts,answers,reference:row.template.replace(/\{\{([^}]+)\}\}/g,'$1')};}
const normal=v=>String(v??'').normalize('NFKC').replace(/[‘’]/g,"'").trim().replace(/\s+/g,' ').toLowerCase();
function check(e,values){return e.answers.map((answer,i)=>normal(answer)===normal(values[i])&&!!normal(values[i]));}
function draft(state,id,fields,at=new Date().toISOString()){const next=window.EnglishStudyCore.normalise(state);if(exercise(id))next.drafts[id]={blanks:[],sentence:'',...(next.drafts[id]||{}),...fields,updatedAt:at};return window.EnglishStudyCore.normalise(next);}
window.WritingPracticeCore={exercise,check,draft};
})();
