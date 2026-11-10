'use strict';
(() => {
 try{const appearance=JSON.parse(localStorage.getItem('cqzsb-journal-appearance-v218')||'{}');document.documentElement.dataset.theme=['day','care','night'].includes(appearance.theme)?appearance.theme:'day';if(['16','18','20','22'].includes(String(appearance.size)))document.documentElement.style.setProperty('--reading',appearance.size+'px');}catch{document.documentElement.dataset.theme='day';}
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const all=window.INITIAL_QUESTIONS.filter(q=>q.subject==='英语'&&window.EnglishLesson.get(q));
 const $=id=>document.getElementById(id);let page=0;const size=20;
 for(const key of ['topic','type'])for(const value of [...new Set(all.map(q=>q[key]))].sort())$(key).insertAdjacentHTML('beforeend',`<option>${esc(value)}</option>`);
 function render(){
  const needle=$('search').value.trim().toLowerCase();
  const filtered=all.filter(q=>(!$('topic').value||q.topic===$('topic').value)&&(!$('type').value||q.type===$('type').value)&&(!needle||[q.id,q.stem,q.point,q.topic,JSON.stringify(window.EnglishLesson.get(q))].join(' ').toLowerCase().includes(needle)));
  const pages=Math.max(1,Math.ceil(filtered.length/size));page=Math.min(page,pages-1);
  $('count').textContent=`共 ${all.length} 道精讲 · 当前找到 ${filtered.length} 道`;
  $('questions').innerHTML=filtered.slice(page*size,(page+1)*size).map(q=>`<details class="question" data-id="${esc(q.id)}"><summary><small>${esc(q.id)} · ${esc(q.point||q.topic)} · ${esc(q.type)}</small>${esc(q.stem)}</summary><div class="lesson-body"></div></details>`).join('')||'<p>没有找到匹配的题目，试试其他关键词。</p>';
  for(const item of $('questions').children)item.addEventListener('toggle',()=>{if(!item.open||item.dataset.loaded)return;const q=all.find(v=>v.id===item.dataset.id);item.querySelector('.lesson-body').innerHTML=`<div class="original">${Object.entries(q.options||{}).map(([k,v])=>`<p>${esc(k)}. ${esc(v)}</p>`).join('')}<p>原题参考答案：${esc(q.verifiedAnswer||q.sourceAnswer||'见解析')}</p></div>${window.EnglishLesson.render(q)}`;item.dataset.loaded='true';});
  $('page').textContent=`${page+1} / ${pages}`;$('previous').disabled=page===0;$('next').disabled=page>=pages-1;
 }
 for(const id of ['search','topic','type'])$(id).addEventListener(id==='search'?'input':'change',()=>{page=0;render();});
 $('previous').onclick=()=>{page--;render();window.scrollTo(0,0);};$('next').onclick=()=>{page++;render();window.scrollTo(0,0);};render();
})();
