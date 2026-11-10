'use strict';
(() => {
 const obj=v=>v&&typeof v==='object'&&!Array.isArray(v)?v:{};
 const text=(v,n=100000)=>typeof v==='string'?v.slice(0,n):'';
 const pick=(v,allowed,fallback)=>allowed.includes(v)?v:fallback;
 function appearance(value){const v=obj(value);return {
  theme:pick(v.theme,['day','care','night'],'day'),size:pick(v.size,['16','18','20','22'],'18'),focus:v.focus===true,
  accent:pick(v.accent,['forest','ocean','violet','rose','amber'],'forest'),font:pick(v.font,['modern','book','system'],'modern'),
  density:pick(v.density,['compact','comfortable','roomy'],'comfortable'),background:pick(v.background,['plain','dots','grid'],'plain'),
  title:text(v.title,24),greeting:text(v.greeting,42),showMetrics:v.showMetrics!==false,showSubjects:v.showSubjects!==false,showShortcuts:v.showShortcuts!==false,
  updatedAt:text(v.updatedAt,40)
 };}
 function note(value){const v=obj(value);if(typeof v.id!=='string'||!v.id||v.id.length>150)return null;
  return {id:v.id,title:text(v.title,100)||'未命名资料',subject:text(v.subject,30)||'综合',kind:pick(v.kind,['note','formula','vocab'],'note'),content:text(v.content),questionId:text(v.questionId,150),tags:Array.isArray(v.tags)?v.tags.filter(x=>typeof x==='string').slice(0,12).map(x=>x.slice(0,30)):[],updatedAt:text(v.updatedAt,40),deletedAt:text(v.deletedAt,40)};
 }
 function normalizeLibrary(value){const v=obj(value),favorites={},reading={};
  for(const [id,item] of Object.entries(obj(v.favorites))){if(id.length>150)continue;const x=obj(item);Object.defineProperty(favorites,id,{value:{value:x.value===true,updatedAt:text(x.updatedAt,40)},enumerable:true,configurable:true,writable:true});}
  for(const [id,item] of Object.entries(obj(v.reading))){if(id.length>150)continue;const x=obj(item);Object.defineProperty(reading,id,{value:{page:Math.max(0,Math.min(10000,Number.isInteger(x.page)?x.page:0)),updatedAt:text(x.updatedAt,40)},enumerable:true,configurable:true,writable:true});}
  return {notes:(Array.isArray(v.notes)?v.notes:[]).map(note).filter(Boolean),favorites,reading};
 }
 function mergeLibrary(older,newer){const a=normalizeLibrary(older),b=normalizeLibrary(newer),notes=new Map(),favorites={},reading={};
  for(const n of [...a.notes,...b.notes]){const prev=notes.get(n.id);if(!prev||n.updatedAt>=prev.updatedAt)notes.set(n.id,n);}
  for(const key of ['favorites','reading']){const out=key==='favorites'?favorites:reading;for(const [id,item] of [...Object.entries(a[key]),...Object.entries(b[key])])if(!out[id]||item.updatedAt>=out[id].updatedAt)Object.defineProperty(out,id,{value:item,writable:true,configurable:true,enumerable:true});}
  return {notes:[...notes.values()],favorites,reading};
 }
 const api={appearance,note,normalizeLibrary,mergeLibrary};if(typeof module!=='undefined')module.exports=api;if(typeof window!=='undefined')window.PersonalCore=api;
})();
