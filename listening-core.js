'use strict';
(() => {
 const clean=v=>typeof v==='string'?v.slice(0,12000):'';
 function normalise(v={}){const notes={};for(const [id,n]of Object.entries(v?.notes||{}))if(n&&typeof n==='object')notes[clean(id)]={text:clean(n.text),at:clean(n.at)};const ids=new Set(),marks=[];for(const m of Array.isArray(v?.marks)?v.marks:[]){if(!m||typeof m.id!=='string'||ids.has(m.id)||![0,1].includes(m.track)||!Number.isFinite(m.time)||m.time<0||m.time>700)continue;ids.add(m.id);marks.push({id:clean(m.id),group:clean(m.group),track:m.track,time:m.time,at:clean(m.at)});}return {version:1,notes,marks};}
 function note(v,id,text){const s=normalise(v);s.notes[id]={text:clean(text),at:new Date().toISOString()};return s;}
 function mark(v,group,track,time){const s=normalise(v),at=new Date().toISOString();if([0,1].includes(track)&&Number.isFinite(time)&&time>=0&&time<=700)s.marks.push({id:'listen-'+Date.now()+'-'+Math.random().toString(36).slice(2,10),group,track,time,at});return s;}
 function merge(a,b){const left=normalise(a),right=normalise(b),notes={...right.notes};for(const [id,n]of Object.entries(left.notes))if(!notes[id]||n.at>=notes[id].at)notes[id]=n;return normalise({notes,marks:[...left.marks,...right.marks].sort((a,b)=>a.at.localeCompare(b.at))});}
 function range(a,b,duration){return Number.isFinite(a)&&Number.isFinite(b)&&a>=0&&b>a+.15&&b<=duration?{valid:true,a,b}:{valid:false};}
 const api={normalise,note,mark,merge,range};if(typeof module!=='undefined')module.exports=api;if(typeof window!=='undefined')window.ListeningCore=api;
})();
