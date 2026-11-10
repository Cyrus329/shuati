'use strict';
(()=>{
const blanks=s=>(s.parts||[]).flatMap(p=>p.blanks||[]),escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const superchars='⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁼⁽⁾ⁿᵐⁱ',basechars='0123456789+-=()nmi',fromSuper=s=>[...s].map(c=>basechars[superchars.indexOf(c)]||c).join('');
function html(value){return escape(value).replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁼⁽⁾ⁿᵐⁱ]+/g,s=>'<sup>'+fromSuper(s)+'</sup>');}
function spoken(value){return String(value).replace(/([0-9𝟎-𝟗a-zA-Z]+)([⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁼⁽⁾ⁿᵐⁱ]+)/gu,(_,base,power)=>base.normalize('NFKC')+'的'+fromSuper(power)+'次方');}
function blocks(part,{onlyWeak=false,weakIds=new Set()}={}){return(part.blocks||[{kind:'paragraph',runs:[{text:part.text||''}]}]).filter(b=>b.kind!=='instruction'&&(!onlyWeak||b.runs.some(r=>r.blank&&weakIds.has(r.blank))));}
function text(section,shown=new Set(),options={}){return(section.parts||[]).map(p=>blocks(p,options).map(b=>b.runs.map(r=>r.blank&&!shown.has(r.blank)?`第${r.number}空`:spoken(r.text)).join('')).join('\n')).filter(Boolean).join('\n');}
function canonical(section,id){const b=blanks(section).find(b=>b.id===id||(b.aliases||[]).includes(id));return b?.id||id;}
function normaliseWeak(section,value={}){const out={};for(const [id,v] of Object.entries(value||{})){if(!v||typeof v.value!=='boolean'||!Number.isFinite(Date.parse(v.at)))continue;const key=canonical(section,id),old=out[key];if(!old||Date.parse(v.at)>Date.parse(old.at))out[key]={value:v.value,at:v.at};}return out;}
function record(section,value={}){return {read:false,note:'',plays:[],at:'',...value,plays:Array.isArray(value.plays)?value.plays:[],weakBlanks:normaliseWeak(section,value.weakBlanks)};}
function weakIds(section,value={}){const weak=normaliseWeak(section,value.weakBlanks);return new Set(blanks(section).filter(b=>weak[b.id]?.value).map(b=>b.id));}
const weakCount=(section,value={})=>weakIds(section,value).size;
function markWeak(section,value,id,marked,at=new Date().toISOString()){const next=record(section,value),key=canonical(section,id);if(blanks(section).some(b=>b.id===key))next.weakBlanks={...next.weakBlanks,[key]:{value:!!marked,at}};return next;}
function mergeRecord(section,a={},b={}){const left=record(section,a),right=record(section,b),newest=(right.at||'')>(left.at||'')?right:left,weak={...left.weakBlanks};for(const[id,v]of Object.entries(right.weakBlanks))if(!weak[id]||Date.parse(v.at)>Date.parse(weak[id].at))weak[id]=v;return {...newest,read:!!(left.read||right.read),plays:[...new Set([...(left.plays||[]),...(right.plays||[])])].sort(),weakBlanks:weak};}
const api={blanks,text,html,spoken,blocks,canonical,record,weakIds,weakCount,markWeak,mergeRecord};if(typeof module!=='undefined')module.exports=api;if(typeof window!=='undefined')window.ComputerClozeCore=api;
})();
