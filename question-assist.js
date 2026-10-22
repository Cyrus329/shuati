'use strict';
(() => {
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const memory=new Map();
 function checks(q){
  const topic=[q.point,q.skillTag,q.topic].join(' ');
  if(q.subject==='高等数学'){
   if(/定义域|根式|对数/.test(topic))return ['先列限制：分母不能为零，偶次根号内非负，对数真数为正。','复合表达式的限制取交集，检查是否漏掉外层函数的要求。','最后逐个检查端点能否代入，确认开区间与闭区间。'];
   if(/极限|连续/.test(topic))return ['先确定趋近点与左右方向，再判断能否直接代入。','约分、换元或套公式前，核对适用条件与等价范围。','分段点分别看左右极限，连续还要与函数值比较。'];
   if(/导数|微分|切线|单调|极值/.test(topic))return ['先确认定义域，辨认复合、乘积或商的结构。','求导后检查内层导数、符号与常数因子。','判断单调或极值时检查驻点、不可导点和区间端点。'];
   if(/积分/.test(topic))return ['区分定积分与不定积分，先看积分区间或原函数要求。','换元检查微分与上下限；分部积分检查符号。','不定积分别漏常数；定积分检查上限减下限。'];
   if(/集合/.test(topic))return ['分清题目问元素、集合还是集合间的关系。','检查对象是否确定，区分空集与含零的集合。','核对交、并、补及端点，别把属于与包含混用。'];
   if(/复合|反函数/.test(topic))return ['分清内外层和复合次序，先确定输入允许的范围。','反函数注意原函数是否一一对应，交换自变量与因变量。','把结果代回检查，定义域和值域不能遗漏。'];
   return ['先圈出所求量与已知条件，确定公式的适用范围。','运算中检查负号、括号和分母，换元时写清对应关系。','结果代回原条件，确认范围、端点和特殊情况。'];
  }
  if(q.subject==='英语'||q.subject==='大学英语'){
   if(/所有格/.test(topic))return ['先确定谁拥有谁，再看一个物品共用还是各自拥有。','检查名词单复数，以及所有格撇号的位置。','把选项放回原句，确认修饰关系和句意。'];
   if(/名词|可数|数量/.test(topic))return ['先判断空格所填名词可数还是不可数。','看数量词、冠词和谓语，核对单复数是否一致。','填回整句，检查量词结构和句意。'];
   if(/代词|指代/.test(topic))return ['找到代词指代的人或物，确认单复数与范围。','判断空格作主语、宾语还是修饰名词，核对代词形式。','分清两者与多者，检查否定和句意是否吻合。'];
   if(/冠词/.test(topic))return ['判断是泛指、特指还是固定搭配，留意首次提及与再次提及。','a / an 看起始音素，不能只看首字母。','检查序数词、球类、交通方式等搭配，再读整句。'];
   return ['先看题目问肯定还是否定，留意 not、except 等限定词。','找句子主干，判断空格成分，再看搭配、时态和一致关系。','把选项填回原句，核对语法与上下文是否同时成立。'];
  }
  if(q.subject==='计算机')return ['先看问“正确”还是“不正确”，圈出全部、只能、一定等限定词。','核对软件版本、操作对象、单位和适用条件。','区分易混概念，按题干要求选择，不凭选项熟悉程度。'];
  return ['先确认题目要求与限定条件。','核对关键步骤与选项差别。','提交前检查是否答非所问。'];
 }
 const group=q=>[q.subject,q.skillTag||q.point||q.topic,q.type].join('|');
 function mastered(q,qs=[]){
  const latest=qs.filter(x=>group(x)===group(q)&&x.events?.length).map(x=>({id:x.canonicalId||x.id,event:x.events.at(-1)})).sort((a,b)=>(Date.parse(b.event.at)||0)-(Date.parse(a.event.at)||0));
  const distinct=latest.filter((x,i,a)=>a.findIndex(y=>y.id===x.id)===i).slice(0,3);
  return distinct.length===3&&distinct.every(x=>x.event.result==='会了');
 }
 function safeAsset(value,kind){const s=String(value||'');return (kind==='pdf'?/^sources\/[\w\u3400-\u9fff .()-]+\.pdf$/i:/^(?:images|reference-images)\/[\w\u3400-\u9fff .()-]+\.(?:png|jpe?g|webp)$/i).test(s)&&!s.includes('..')?s:'';}
 function sourceFields(q){return {sourceImageRefs:[...new Set([...(Array.isArray(q.sourceImageRefs)?q.sourceImageRefs:[]),q.image].map(v=>safeAsset(v,'image')).filter(Boolean))],answerSourcePath:safeAsset(q.answerSourcePath,'pdf'),answerSourcePage:Number.isSafeInteger(Number(q.answerSourcePage))&&Number(q.answerSourcePage)>0?Number(q.answerSourcePage):null};}
 function render(q,qs=[]){
  const key=String(q.canonicalId||q.id),saved=memory.get(key),collapsed=saved?.open===false||(!saved&&mastered(q,qs)),fields=sourceFields(q),items=checks(q),pdf=fields.answerSourcePath,page=fields.answerSourcePage;
  return `<div class="question-assist" data-assist-question="${esc(key)}"><details class="preflight-check" ${collapsed?'':'open'}><summary><span>做题前 · 小检查</span><small>${collapsed?'展开提醒':'先检查，再下笔'}</small></summary><div class="preflight-items">${items.map((s,i)=>`<label><input type="checkbox" data-preflight-index="${i}" ${saved?.ticks?.includes(i)?'checked':''}><span>${esc(s)}</span></label>`).join('')}</div><p class="fine-note">仅辅助检查，不计作答；同类三道不同题最近均做对后，提醒默认收起。</p></details><details class="question-provenance" ${fields.sourceImageRefs.length||pdf?'open':''}><summary>题目出处 <span>${fields.sourceImageRefs.length?'原图 '+fields.sourceImageRefs.length+' 张':pdf?'答案文档':q.dailyNew?'新编题':'查看来源'} ↗</span></summary><p>${esc(q.source||q.batch||(q.dailyNew?'每日新编练习题':'题目未记录出处名称'))}${q.sourceNo?' · '+esc(q.sourceNo):''}</p><div class="source-direct-links">${fields.sourceImageRefs.map((src,i)=>`<a href="${esc(src)}" target="_blank" rel="noopener">打开原图 ${i+1} ↗</a>`).join('')}${pdf?`<a href="${esc(pdf)}${page?'#page='+page:''}" target="_blank" rel="noopener">${page?'答案 PDF · 第 '+page+' 页':'打开答案 PDF'} ↗</a>`:''}${/^https:\/\//i.test(q.referenceUrl||'')?`<a href="${esc(q.referenceUrl)}" target="_blank" rel="noopener noreferrer">用法核查依据 ↗</a>`:''}</div>${!fields.sourceImageRefs.length?`<p class="fine-note">${q.dailyNew?'本题为每日新编题，没有原始截图。':'本题未附可直接打开的原始截图。'}</p>`:''}${!pdf?'<p class="fine-note">未附答案 PDF，可查看题内答案与解析。</p>':''}${pdf&&!page?'<p class="fine-note">未记录可靠页码，打开文档后需自行定位。</p>':''}</details></div>`;
 }
 if(typeof document!=='undefined'){
  document.addEventListener('change',e=>{if(!e.target.matches('[data-preflight-index]'))return;const box=e.target.closest('[data-assist-question]'),old=memory.get(box.dataset.assistQuestion)||{};memory.set(box.dataset.assistQuestion,{...old,ticks:[...box.querySelectorAll('[data-preflight-index]:checked')].map(x=>Number(x.dataset.preflightIndex))});});
  document.addEventListener('click',e=>{const summary=e.target.closest('.preflight-check>summary');if(!summary)return;const detail=summary.parentElement,box=detail.closest('[data-assist-question]'),old=memory.get(box.dataset.assistQuestion)||{};memory.set(box.dataset.assistQuestion,{...old,open:!detail.open});});
  document.addEventListener('toggle',e=>{if(!e.target.matches('.preflight-check'))return;const small=e.target.querySelector('summary small');if(small)small.textContent=e.target.open?'先检查，再下笔':'展开提醒';},true);
 }
 const api={checks,mastered,render,sourceFields};if(typeof module!=='undefined')module.exports=api;if(typeof window!=='undefined')window.QuestionAssist=api;
})();
