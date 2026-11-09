'use strict';
(function(root){
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function render(questions){
  const report=root.QuestionQuality.inspectAll(questions),pending=report.items.filter(x=>!x.practiceAllowed);
  return '<section class="quality-panel" aria-labelledby="quality-title"><h2 id="quality-title">待整理题目 <small>'+pending.length+' 题</small></h2><p>缺项只暂停进入练习，题目、原始来源和历史记录继续保留，不计为答错。请对照来源补齐资料；不会自动生成答案。</p>'+(pending.length?pending.map(item=>{
   const q=questions.find(q=>q.id===item.id)||{},refs=[...new Set([...(Array.isArray(q.sourceImageRefs)?q.sourceImageRefs:[]),q.image].filter(Boolean))];
   const pictures=refs.filter(src=>/^images\/[\w/-]+\.(?:png|jpe?g|webp)$/i.test(src)).map(src=>'<a href="'+esc(src)+'" target="_blank" rel="noopener">查看原图 '+esc(src.split('/').pop())+'</a>').join(' · ');
   return '<article class="quality-item"><h3>'+esc(q.subject||'未分类')+' · '+esc(q.topic||q.id||'待补题目')+'</h3><p class="quality-stem">'+esc(q.stem||'（缺少题干）')+'</p><ul>'+item.blockers.map(r=>'<li>'+esc(r.message)+'</li>').join('')+'</ul><details><summary>查看现有资料与原始来源</summary><p>题号：'+esc(q.id)+'<br>来源：'+esc(q.source||'未填写')+' '+esc(q.sourceNo||'')+'</p><p>'+pictures+'</p><pre>'+esc(JSON.stringify({type:q.type,options:q.options,verifiedAnswer:q.verifiedAnswer,sourceAnswer:q.sourceAnswer,analysis:q.analysis},null,2))+'</pre></details><p>请先对照原图确认缺项，再准备补齐资料；保留题号及原始记录，核定后更新题库。相同编号导入不会覆盖现有内容。</p></article>';
  }).join(''):'<p>目前没有因缺项暂停练习的题目。</p>')+'</section>';
 }
 function summary(questions){const r=root.QuestionQuality.inspectAll(questions);return '共 '+r.total+' 题；可练习 '+r.ready+' 题；待整理 '+r.pending+' 题；提示复核 '+r.review+' 题（其中人工判定 '+r.manual+' 题）。';}
 root.QuestionQualityUI={render,summary};
})(window);

