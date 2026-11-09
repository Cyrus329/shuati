'use strict';
(function(root){
 const BUILD='v4.0-workspace-20261108';
 function describeSave(s={}){
  if(s.pending>0)return {kind:'pending',text:'正在保存…'};
  if(s.mode==='memory'||s.dirty)return {kind:'error',text:'尚未保存，请导出备份'};
  if(s.mode==='localStorage')return {kind:'warning',text:s.lastSavedAt?'已保存到备用存储，建议导出备份':'使用备用存储，建议导出备份'};
  if(s.mode==='indexedDB'&&s.lastSavedAt)return {kind:'saved',text:'学习记录已保存'};
  return {kind:'neutral',text:s.mode==='loading'?'正在读取学习记录…':'等待保存状态'};
 }
 function compareModules(build,modules,required){
  const missing=required.filter(name=>!modules[name]);
  const stale=Object.keys(modules).filter(name=>modules[name]!==build);
  return {kind:stale.length?'mismatch':missing.length?'missing':'ok',missing,stale};
 }
 const api={describeSave,compareModules};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(!root||!root.document)return;
 const doc=root.document,modules={'release-status':BUILD},options={requiredModules:['release-info','release-status'],manifest:'release-manifest.json'};
 let save={kind:'neutral',text:'等待保存状态'},check={kind:'neutral',text:'打开版本说明可检查文件配套情况'},lastInfo=null,manifestPromise=null,checked=false,dialog,button,health,saveNode,checkNode,opener;
 function runtime(){
  const release=root.JournalRelease;
  if(release)modules['release-info']=release.build;
  const result=compareModules(release?.build||BUILD,modules,options.requiredModules);
  if(result.kind==='mismatch')return {kind:'error',text:'更新文件版本不一致：'+result.stale.join('、')+'。请重新完整覆盖更新文件；个人记录未改动。'};
  if(result.kind==='missing')return {kind:'error',text:'更新文件未完整加载：'+result.missing.join('、')+'。请检查文件后刷新；个人记录未改动。'};
  return {kind:'ok',text:'当前核心模块版本一致'};
 }
 function render(){
  if(saveNode){saveNode.textContent=save.text;saveNode.dataset.state=save.kind;}
  const current=runtime(),visible=current.kind==='error'?current:check;
  if(health){health.textContent=visible.kind==='error'?'更新待检查':'';health.hidden=visible.kind!=='error';}
  if(checkNode){checkNode.textContent=visible.text;checkNode.dataset.state=visible.kind;}
 }
 function setSave(info){lastInfo=info;save=describeSave(info);render();}
 async function verifyManifest(){
  checked=true;
  const state=runtime();if(state.kind==='error'){check=state;render();return;}
  if(root.location.protocol==='file:'){check={kind:'neutral',text:'本地文件模式：核心模块版本一致。浏览器不允许校验文件内容，请完整解压或覆盖更新包。'};render();return;}
  if(manifestPromise)return manifestPromise;
  check={kind:'neutral',text:'正在核对版本清单…'};render();
  manifestPromise=(async()=>{
   const controller=new AbortController(),timer=root.setTimeout(()=>controller.abort(),10000);
   try{
    if(root.navigator.onLine===false)throw new Error('offline');
    const base=new URL(options.manifest,doc.baseURI);
    if(base.origin!==root.location.origin)throw new Error('external manifest');
    const response=await root.fetch(base,{cache:'no-store',signal:controller.signal});
    if(!response.ok)throw new Error('manifest unavailable');
    const manifest=await response.json();
    if(typeof manifest.build!=='string'||!manifest.files||typeof manifest.files!=='object')throw new Error('invalid manifest');
    if(manifest.build!==(root.JournalRelease?.build||BUILD)){check={kind:'error',text:'页面与更新清单的版本不一致，请完整覆盖更新文件；个人记录未改动。'};return;}
    const files=Array.isArray(manifest.checkFiles)?manifest.checkFiles:Object.keys(manifest.files);
    if(!files.length||!root.crypto?.subtle)throw new Error('verification unavailable');
    const mismatches=[],unavailable=[];
    for(const name of files){
     const url=new URL(name,base);if(url.origin!==base.origin||!url.pathname.startsWith(new URL('.',base).pathname))throw new Error('invalid file path');
     const expected=manifest.files[name];if(!/^[a-f0-9]{64}$/i.test(expected||''))throw new Error('invalid digest');
     const r=await root.fetch(url,{cache:'no-store',signal:controller.signal});
     if(r.status===404||r.status===410){mismatches.push(name+'（缺失）');continue;}
     if(!r.ok){unavailable.push(name);continue;}
     const digest=await root.crypto.subtle.digest('SHA-256',await r.arrayBuffer());
     const actual=Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,'0')).join('');
     if(actual!==expected.toLowerCase())mismatches.push(name);
    }
    check=mismatches.length?{kind:'error',text:'更新文件缺失或内容不配套：'+mismatches.join('、')+'。请完整覆盖更新包；个人记录未改动。'}:unavailable.length?{kind:'neutral',text:'部分文件暂时无法核对，请联网后重试。'}:{kind:'ok',text:'版本清单及 '+files.length+' 个核心文件核对一致（专题资源在使用时加载）。'};
   }catch(e){check={kind:'neutral',text:'暂时无法核对文件（可能离线或清单不可用），请稍后重试。当前个人记录未改动。'};}
   finally{root.clearTimeout(timer);manifestPromise=null;render();}
  })();return manifestPromise;
 }
 function open(){
  if(doc.querySelector('dialog[open]'))return;
  opener=doc.activeElement;
  if(!dialog){
   dialog=doc.createElement('dialog');dialog.className='journal-release-dialog';dialog.setAttribute('aria-labelledby','journalReleaseTitle');
   const title=doc.createElement('h2');title.id='journalReleaseTitle';title.textContent='版本 '+(root.JournalRelease?.version||'未知')+' · '+(root.JournalRelease?.name||'版本信息未加载');
   const build=doc.createElement('p');build.className='journal-release-build';build.textContent='构建：'+(root.JournalRelease?.build||'未知');
   const list=doc.createElement('ul');for(const update of root.JournalRelease?.updates||[]){const li=doc.createElement('li');li.textContent=update;list.append(li);}
   checkNode=doc.createElement('p');checkNode.setAttribute('role','status');
   const retry=doc.createElement('button');retry.type='button';retry.textContent='重新检查文件';retry.onclick=()=>verifyManifest();
   const close=doc.createElement('button');close.type='button';close.textContent='关闭';close.onclick=()=>dialog.close();
   const actions=doc.createElement('div');actions.className='journal-release-actions';actions.append(retry,close);
   dialog.append(title,build,list,checkNode,actions);doc.body.append(dialog);
   dialog.addEventListener('close',()=>opener?.focus());
   dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
  }
  render();dialog.showModal();if(!checked)verifyManifest();
 }
 function mount(){
  if(button)return;
  const host=doc.querySelector('[data-release-host]')||doc.querySelector('#storageStatus')||doc.querySelector('.topbar');if(!host)return;
  const wrap=doc.createElement('span');wrap.className='journal-release-status';
  button=doc.createElement('button');button.type='button';button.className='mini-link journal-release-button';button.textContent='版本'+(root.JournalRelease?.shortVersion||'未知');button.setAttribute('aria-haspopup','dialog');button.onclick=open;
  saveNode=doc.createElement('span');saveNode.className='journal-release-save';saveNode.setAttribute('role','status');saveNode.setAttribute('aria-live','polite');
  health=doc.createElement('span');health.className='journal-release-health';
  wrap.append(button,saveNode,health);host.append(wrap);
  const message=doc.querySelector('#storageMessage');
  if(message){const observe=()=>{if(lastInfo)return;save={kind:'neutral',text:message.textContent.trim()||'等待保存状态'};render();};new MutationObserver(observe).observe(message,{childList:true,subtree:true,characterData:true});observe();}
  render();
 }
 api.register=(name,build)=>{modules[name]=build;render();};
 api.configure=config=>{if(Array.isArray(config.requiredModules))options.requiredModules=[...new Set(['release-info','release-status',...config.requiredModules])];if(config.manifest)options.manifest=config.manifest;render();};
 api.setSaveStatus=setSave;api.check=verifyManifest;api.open=open;api.mount=mount;api.getStatus=()=>({save:{...save},runtime:runtime(),check:{...check},modules:{...modules}});
 root.JournalReleaseStatus=api;
 root.addEventListener('journal-storage-status',e=>setSave(e.detail||{}));
 if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})(typeof window==='undefined'?null:window);
