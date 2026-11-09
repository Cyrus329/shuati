'use strict';
(()=>{
 const tools=()=>document.querySelector('.v3-tools');
 window.addEventListener('journal-view-change',e=>{document.body.dataset.v3View=e.detail?.view||'';if(tools())tools().open=false;});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&tools())tools().open=false;});
 document.addEventListener('click',e=>{if(tools()?.open&&!tools().contains(e.target))tools().open=false;});
 function importResult(r){
  const old=document.getElementById('v3ImportResult');old?.remove();
  const dialog=document.createElement('dialog');dialog.id='v3ImportResult';dialog.className='v3-import-result';
  const heading=document.createElement('h2');heading.textContent=r.saved?'导入核对结果':'内容已读入，尚未保存';dialog.append(heading);
  const text=document.createElement('p');text.textContent=`新增题目 ${r.added} 条 · 合并复练 ${r.events} 次 · 相同编号 ${r.duplicates} 条 · 非题目内容 ${r.rejected} 条`;dialog.append(text);
  const quality=document.createElement('p');quality.textContent=r.quality;dialog.append(quality);
  const note=document.createElement('p');note.textContent='导入前已发起完整备份下载，请保留下载文件。重复编号的题目内容不覆盖；已有作答、笔记继续保留。不完整题目放在“记录与工具 → 题目待整理”，不计为答错。';dialog.append(note);
  const close=document.createElement('button');close.className='btn primary';close.textContent='知道了';close.onclick=()=>dialog.close();dialog.append(close);document.body.append(dialog);dialog.showModal();
 }
 window.V3Shell={importResult};
})();
