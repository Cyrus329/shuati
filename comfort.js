'use strict';
(() => {
  const key='cqzsb-journal-appearance-v218';
  const C=window.PersonalCore;
  let settings=C.appearance({});
  try{settings=C.appearance(JSON.parse(localStorage.getItem(key)||'{}'));}catch{}
  const $=id=>document.getElementById(id);
  function apply(){
    for(const name of ['theme','accent','font','density','background'])document.documentElement.dataset[name]=settings[name];
    document.documentElement.dataset.metrics=String(settings.showMetrics);document.documentElement.dataset.subjects=String(settings.showSubjects);document.documentElement.dataset.shortcuts=String(settings.showShortcuts);
    document.documentElement.style.setProperty('--reading',settings.size+'px');
    document.querySelectorAll('.brand h1,[data-space-title]').forEach(title=>title.textContent=settings.title||'个人刷题记录中心');
    const greeting=document.querySelector('.study-welcome h2');if(greeting)greeting.textContent=settings.greeting||'把知识，变成自己的底气。';
    document.body.classList.toggle('focus-mode',!!settings.focus);
    if($('themeSelect'))$('themeSelect').value=document.documentElement.dataset.theme;
    if($('fontSize'))$('fontSize').value=['16','18','20','22'].includes(settings.size)?settings.size:'18';
    if($('focusToggle')){$('focusToggle').textContent=settings.focus?'退出专注':'进入专注';$('focusToggle').setAttribute('aria-pressed',String(!!settings.focus));}
  }
  function save(){settings=C.appearance({...settings,updatedAt:new Date().toISOString()});apply();let localSaved=true;try{localStorage.setItem(key,JSON.stringify(settings));}catch{localSaved=false;}window.dispatchEvent(new CustomEvent('journal-appearance-change',{detail:{settings:{...settings},localSaved}}));}
  window.JournalAppearance={get:()=>({...settings}),apply,update(patch){settings={...settings,...patch};save();},restore(value){settings=C.appearance(value);try{localStorage.setItem(key,JSON.stringify(settings));}catch{}apply();},reset(){settings=C.appearance({});save();}};
  apply();
  $('themeSelect')?.addEventListener('change',e=>{settings.theme=e.target.value;save();});
  $('fontSize')?.addEventListener('change',e=>{settings.size=e.target.value;save();});
  $('focusToggle')?.addEventListener('click',()=>{settings.focus=!settings.focus;save();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&settings.focus&&!document.querySelector('dialog[open]')){settings.focus=false;save();}});
  const panel=document.querySelector('.list-panel');
  $('mobileListToggle')?.addEventListener('click',()=>{const closed=panel.classList.toggle('list-collapsed');$('mobileListToggle').textContent=closed?'展开目录':'收起目录';$('mobileListToggle').setAttribute('aria-expanded',String(!closed));});
})();
