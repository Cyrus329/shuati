'use strict';
(()=>{
const D=window.COMPUTER_SPECIAL_DATA,C=window.ComputerClozeCore,$=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let api,chapter=0,selected='',shown=new Set(),lastRendered='',onlyWeak=false,wholeChapter=true;
const sections=()=>D.chapters.flatMap(c=>c.sections),sectionById=id=>sections().find(s=>s.id===id)||{parts:[]};
function state(){return api.get()||{records:{}};}
function entry(id){return C.record(sectionById(id),state().records?.[id]||{});}
async function update(id,patch){const s=structuredClone(state());s.records=s.records||{};s.records[id]={...entry(id),...patch,at:new Date().toISOString()};s.selected=id;const ok=await api.save(s);if($('computerSave'))$('computerSave').textContent=ok?'学习记录已保存':'保存失败，请重试或导出整站备份';return ok;}
function merge(a={},b={}){const out={...a,records:{...(a.records||{})}};if(!out.selected&&b.selected)out.selected=b.selected;for(const[id,item]of Object.entries(b.records||{}))out.records[id]=C.mergeRecord(sectionById(id),out.records[id]||{},item);return out;}
const chapterWeak=ch=>ch.sections.reduce((total,s)=>total+C.weakCount(s,entry(s.id)),0);
function comparisonTable(caption,headers,rows,rowHeaders=false){
 return `<div class="computer-table-scroll" tabindex="0" role="region" aria-label="${esc(caption)}"><table class="computer-base-table"><caption>${esc(caption)}</caption><thead><tr>${headers.map(label=>`<th scope="col">${esc(label)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map((cell,i)=>i===0&&rowHeaders?`<th scope="row">${cell}</th>`:`<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
function tableRows(block,runHTML){
 const blanks=[];
 const text=block.runs.map(run=>run.blank?`«${blanks.push(run)-1}»`:run.text).join('');
 return text.trim().split(/\n/).map(line=>line.trim().split(/\s+/).map(cell=>{
  const match=cell.match(/^«(\d+)»$/);
  return match?runHTML(blanks[Number(match[1])]):C.html(cell);
 }));
}
function displayBlocks(part,guide){
 const blocks=[];
 for(const block of C.blocks(part)){
  const first=block.runs[0]?.text||'';
  if(guide&&!block.runs.some(run=>run.blank)){
   const text=block.runs.map(run=>run.text).join('').trim();
   const chunks=text.split(/❖|(?=(?:10 计算机文化|16 字符编码|17 汉字编码)$)/);
   for(const chunk of chunks){
    const title=chunk.trim();
    if(!title)continue;
    const kind=/^(?:第[一二三]章|考纲要求$|主要考点$)/.test(title)?'guide-heading':/^\d{2}\s+\p{Script=Han}|^\d{2}\s+CPU$/u.test(title)?'guide-point':title.startsWith('·')?'guide-bullet':'paragraph';
    blocks.push({kind,runs:[{text:title}]});
   }
   continue;
  }
  if(block.kind==='formula'&&block.runs.length===1&&first.trim()==='2 2')continue;
  const previous=blocks.at(-1),tail=previous?.runs.at(-1)?.text?.trimEnd();
  const shortContinuation=/^[\p{Script=Han}]{1,3}[；，。！？]\s*$/u.test(first);
  const continuedHeading=previous?.kind==='subheading'&&tail&&!/[。！？；：:]$/.test(tail)&&!/^\s*(?:[（(]\d|\d+[、.．]|[①-⑩]|[-•·])/.test(first);
  if(block.kind==='paragraph'&&(continuedHeading||shortContinuation)&&previous?.kind!=='formula'&&previous?.kind!=='case'){
   blocks[blocks.length-1]={...previous,runs:[...previous.runs,...block.runs]};
  }else blocks.push(block);
 }
 return blocks;
}
function partHTML(part,weak,guide){
 const runHTML=run=>{if(!run.blank)return C.html(run.text);const open=shown.has(run.blank),marked=weak.has(run.blank),label='第'+run.number+'空'+(open?'，点击收起答案':'，点击查看答案');return `<span class="computer-blank-unit"><button type="button" class="computer-blank ${open?'is-revealed':''}" data-computer-blank="${run.blank}" aria-label="${label}" aria-expanded="${open}" style="--blank-width:${Math.min(12,Math.max(2.8,run.text.length*.75+1.6))}em"><span class="blank-number">${String(run.number).padStart(2,'0')}</span><span class="blank-value">${open?C.html(run.text):'____'}</span></button><button type="button" class="computer-weak-toggle ${marked?'is-weak':''}" data-computer-weak="${run.blank}" aria-label="${marked?'取消':'标记'}第${run.number}空不太会" aria-pressed="${marked}" title="${marked?'取消不太会标记':'标记不太会'}"><span aria-hidden="true">${marked?'⚑':'⚐'}</span></button></span>`;};
 const blocks=displayBlocks(part,guide);
 const visible=(...group)=>!onlyWeak||group.some(block=>block.runs.some(run=>run.blank&&weak.has(run.blank)));
 const conversion=blocks.findIndex(b=>b.runs.some(run=>run.blank==='computer-ch2-11-blank-36'));
 const ascii=blocks.findIndex(b=>b.runs.some(run=>run.blank==='computer-ch2-16-blank-14'));
 const tableStart=blocks.findIndex(b=>b.runs.some(run=>run.text==='进位制 二进制 八进制 十进制 十六进制')&&b.runs.some(run=>run.blank==='computer-ch2-11-blank-10'));
 const formulaStart=tableStart>=0?blocks.findIndex(b=>b.runs[0]?.text?.startsWith('任意一个r进制数N可表示为')):-1;
 return blocks.map((b,index)=>{
  if(conversion>=0&&index>=conversion-2&&index<=conversion){
   if(index!==conversion||!visible(b))return '';
   const digits=new Map();
   for(const cells of tableRows(b,runHTML)){
    const [,octal,binaryOctal,decimalHex,hex,binaryHex,upper,upperHex,upperBinary]=cells;
    digits.set(decimalHex,[decimalHex,octal,binaryOctal,hex,binaryHex]);
    if(upper)digits.set(upper,[upper,'—','—',upperHex,upperBinary]);
   }
   const rows=[...digits.values()].sort((a,b)=>Number(a[0])-Number(b[0]));
   return comparisonTable('十进制、八进制与十六进制换算',['十进制','八进制','二进制（按三位分组）','十六进制','二进制（按四位分组）'],rows,true);
  }
  if(ascii>=0&&index>=ascii-1&&index<=ascii){
   return index===ascii&&visible(b)?comparisonTable('ASCII 编码对照',['字符','二进制','十进制','十六进制'],tableRows(b,runHTML),true):'';
  }
  const truth=b.runs.find(run=>/^computer-ch2-13-blank-(12|14|18|20|22|26)$/.test(run.blank||''));
  if(blocks[index+1]?.runs.some(run=>/^computer-ch2-13-blank-(12|14|18|22|26)$/.test(run.blank||'')))return '';
  if(truth){
   if(!visible(b))return '';
   const labels={12:'逻辑非',14:'逻辑与',18:'逻辑或',20:'逻辑或（续）',22:'逻辑异或',26:'逻辑同或'};
   return comparisonTable(labels[truth.number]+'真值表',truth.number===12?['A','结果 F']:['A','B','结果 F'],tableRows(b,runHTML));
  }
  if(index===tableStart){
   if(!visible(...blocks.slice(index,index+8)))return '';
   const byNumber=new Map(blocks.slice(index,index+8).flatMap(row=>row.runs).filter(run=>run.blank).map(run=>[run.number,run]));
   const blank=n=>runHTML(byNumber.get(n));
   const rows=[
    ['进退位规则',...[0,1,2,3].map(i=>`逢${blank(10+i*2)}进 1<br>借 1 当${blank(11+i*2)}`)],
    ['基数',...[18,19,20,21].map(n=>'r = '+blank(n))],
    ['基本符号','0、1','0–7','0–9','0–9、'+blank(22)],
    ['位权',...[23,24,25,26].map(n=>blank(n)+'<sup>i</sup>')],
    ['字母标记',...['Binary','Octal','Decimal','Hexadecimal'].map((label,i)=>blank(27+i)+'<br><small>'+label+'</small>')]
   ];
   return comparisonTable('常用进位制对照',['项目','二进制','八进制','十进制','十六进制'],rows,true);
  }
  if(tableStart>=0&&index>tableStart&&index<=tableStart+8)return '';
  if(!onlyWeak&&index===formulaStart){
   return '<p class="cloze-paragraph">任意一个 r 进制数 N 可按位权展开。</p><div class="cloze-formula"><div>(N)<sub>r</sub> = a<sub>n−1</sub>r<sup>n−1</sup> + ⋯ + a<sub>0</sub> + a<sub>−1</sub>r<sup>−1</sup> + ⋯ + a<sub>−m</sub>r<sup>−m</sup><br>= ∑ a<sub>i</sub>r<sup>i</sup>（i 从 −m 到 n−1）</div></div>';
  }
  if(!onlyWeak&&formulaStart>=0&&index>formulaStart&&index<=formulaStart+8&&!b.runs.some(run=>run.blank))return '';
  if(!onlyWeak&&formulaStart>=0&&index===formulaStart+10&&b.runs.length===1&&b.runs[0].text.trim()==='𝑖')return '';
  if(!visible(b))return '';
  const proseFormula=b.kind==='formula'&&b.runs[0]?.text?.startsWith('数 。 例 如');
  const html=proseFormula?b.runs.map(run=>run.blank?runHTML(run):C.html(run.text.replace(/(?<=[\p{Script=Han}，。]) (?=[\p{Script=Han}，。])/gu,''))).join(''):b.runs.map(runHTML).join('');
  if(b.kind==='guide-heading')return `<h4 class="computer-guide-heading">${html}</h4>`;
  if(b.kind==='guide-point')return `<h5 class="computer-guide-point">${html}</h5>`;
  if(b.kind==='guide-bullet')return `<p class="computer-guide-bullet">${html}</p>`;
  if(b.kind==='case')return `<h4 class="cloze-case">${html}</h4>`;
  if(b.kind==='subheading'){
   const comma=b.runs.findIndex(run=>!run.blank&&run.text.includes('，'));
   if(comma>=0){
    const {text}=b.runs[comma],separator=text.indexOf('，');
    const heading=b.runs.slice(0,comma).map(runHTML).join('')+C.html(text.slice(0,separator));
    const body=C.html(text.slice(separator+1))+b.runs.slice(comma+1).map(runHTML).join('');
    return `<div class="computer-numbered-item"><h5 class="cloze-subheading">${heading.replace(/^01、(?=8、)/,'')}</h5><p class="cloze-paragraph">${body}</p></div>`;
   }
   return `<h5 class="cloze-subheading">${html}</h5>`;
  }
  if(b.kind==='formula'&&!proseFormula)return `<div class="cloze-formula"><small>公式 / 表格 · 可对照原页</small><div>${html}</div></div>`;
  return `<p class="cloze-paragraph">${html}</p>`;
 }).join('');
}
function renderPart(chapterData,p,weak,sectionId){return `<section class="computer-page-part"><div class="computer-source-line"><span>原 PDF 第 ${p.page} 页</span><a href="${chapterData.pdf}#page=${p.page}" target="_blank" rel="noopener">对照原页 ↗</a></div><div class="computer-text">${partHTML(p,weak,sectionId.endsWith('-intro'))}</div><details class="computer-original"><summary>查看原页图片 · 公式、表格与图示</summary><img src="${p.image}" loading="lazy" alt="第${chapterData.number}章原 PDF 第${p.page}页"></details></section>`;}
function reviewButton(section){
 const marked=entry(section.id).reviewed?.value===true;
 return `<button type="button" class="study-stamp computer-reviewed" data-computer-reviewed="${section.id}" aria-pressed="${marked}"><i aria-hidden="true">▣</i><span><strong>${marked?'已复习完':'标记已复习完'}</strong><small>${marked?'本节已盖章 · 点此取消':'复习完本节后点一下'}</small></span></button>`;
}
function bindReviewButtons(host){
 host.querySelectorAll('[data-computer-reviewed]').forEach(button=>button.onclick=async()=>{
  const id=button.dataset.computerReviewed,marked=button.getAttribute('aria-pressed')==='true';
  button.disabled=true;
  const saved=await update(id,{reviewed:{value:!marked,at:new Date().toISOString()}});
  if(!saved){button.textContent='保存失败，点击重试';button.disabled=false;return;}
  if(!button.isConnected)return;
  render();
  host.querySelector('[data-computer-reviewed="'+id+'"]')?.focus({preventScroll:true});
 });
}
function renderChapter(ch) {
 const host=$('computerSpecialView');
 const paper=host.querySelector('.computer-paper');
 paper.innerHTML=`<div class="computer-section-title"><span>第${ch.number}章 · 整章阅读</span><h3>${esc(ch.title)}</h3><p>${ch.sections.length} 节连续显示 · 点编号看答案，点旗标标记“不太会”。</p></div><div id="computerChapterSpeech"></div>
 ${ch.sections.map(section=>{const e=entry(section.id),weak=C.weakIds(section,e);return `<section class="computer-chapter-unit" id="computer-unit-${section.id}" data-computer-unit="${section.id}"><header><h4>${esc(section.number)} · ${esc(section.title)}</h4><div class="computer-unit-actions">${reviewButton(section)}<button type="button" class="mini-link" data-computer-detail="${section.id}">本节朗读与笔记 →</button></div></header>
 ${section.parts.map(part=>renderPart(ch,part,weak,section.id)).join('')}</section>`;}).join('')}`;
 window.ComputerSpeech.attachChapter(ch.number,ch.sections.map(section=>[
   section.title,C.text(section,new Set(C.blanks(section).map(blank=>blank.id)))
 ]),$('computerChapterSpeech'));
 bindReviewButtons(host);
 host.querySelectorAll('[data-computer-section]').forEach(button=>button.onclick=()=>$(`computer-unit-${button.dataset.computerSection}`)?.scrollIntoView({block:'start'}));
 paper.querySelectorAll('[data-computer-detail]').forEach(button=>button.onclick=()=>{window.ComputerSpeech.cancel();wholeChapter=false;selected=button.dataset.computerDetail;render();window.scrollTo(0,0);});
 paper.querySelectorAll('[data-computer-blank]').forEach(button=>button.onclick=()=>{
  const id=button.dataset.computerBlank,open=!shown.has(id);
  const section=sectionById(button.closest('[data-computer-unit]').dataset.computerUnit);
  if(open)shown.add(id);else shown.delete(id);
  button.classList.toggle('is-revealed',open);
  button.setAttribute('aria-expanded',String(open));
  const run=C.blanks(section).find(item=>item.id===id);
  button.setAttribute('aria-label','第'+button.querySelector('.blank-number').textContent+'空，'+(open?'点击收起答案':'点击查看答案'));
  button.querySelector('.blank-value').innerHTML=open?C.html(run.answer??run.text):'____';
 });
 paper.querySelectorAll('[data-computer-weak]').forEach(button=>button.onclick=async()=>{
  const section=sectionById(button.closest('[data-computer-unit]').dataset.computerUnit),id=button.dataset.computerWeak;
  const record=entry(section.id),marked=!C.weakIds(section,record).has(id);
  button.disabled=true;
  try { if(await update(section.id,{weakBlanks:C.markWeak(section,record,id,marked).weakBlanks})){render();host.querySelector('[data-computer-weak="'+id+'"]')?.focus({preventScroll:true});} }
  finally {button.disabled=false;}
 });
}
function render(){const all=sections();if(!selected)selected=state().selected||all.find(s=>C.blanks(s).length)?.id||all[0].id;if(!all.some(x=>x.id===selected))selected=all[0].id;if(lastRendered!==selected){shown=new Set();lastRendered=selected;}chapter=D.chapters.findIndex(c=>c.sections.some(s=>s.id===selected));const c=D.chapters[chapter],section=c.sections.find(x=>x.id===selected),e=entry(selected),blanks=C.blanks(section),weak=C.weakIds(section,e),nav=onlyWeak?c.sections.filter(s=>C.weakCount(s,entry(s.id))):c.sections,index=nav.findIndex(s=>s.id===selected),visibleParts=section.parts.filter(p=>!onlyWeak||C.blocks(p,{onlyWeak:true,weakIds:weak}).length);
const paper=visibleParts.length?visibleParts.map(p=>renderPart(c,p,weak,section.id)).join(''):'<div class="computer-weak-empty"><strong>本节没有标记“不太会”的空。</strong><p>取消“本节只看不会”，可继续查看完整内容。</p></div>';
$('computerSpecialView').innerHTML=`<header class="computer-heading"><p class="eyebrow">COMPUTER STUDY</p><h2>计算机专项</h2><p>点击编号看答案 · 点旗标标记“不太会”，再集中复习</p></header><div class="computer-chapters">${D.chapters.map((ch,i)=>`<div class="computer-chapter-group"><button type="button" class="btn ${i===chapter?'primary':'neutral'}" data-computer-chapter="${i}">第${ch.number}章 · ${esc(ch.title)}</button><button type="button" class="mini-link computer-chapter-weak" data-computer-chapter-weak="${i}" ${chapterWeak(ch)?'':'disabled'}>本章不会 · ${chapterWeak(ch)} 空</button></div>`).join('')}</div><div class="computer-mode"><button type="button" class="btn neutral" id="computerMode">${wholeChapter?'切换单节精练':'查看整章知识点'}</button><span>${wholeChapter?'整章阅读':'单节精练'}</span></div><div class="computer-layout"><aside class="computer-index"><p>本章目录</p>${c.sections.map(s=>{const count=C.weakCount(s,entry(s.id));return `<button type="button" class="computer-section ${s.id===selected?'selected':''}" data-computer-section="${s.id}"><span>${esc(s.number)}</span><strong>${esc(s.title)}</strong><small>${[entry(s.id).reviewed?.value?'✓ 已复习完':entry(s.id).read?'已读':'',count?'不会 '+count+' 空':''].filter(Boolean).join(' · ')}</small></button>`;}).join('')}<a href="${c.pdf}" target="_blank" rel="noopener">打开本章原 PDF ↗</a></aside><article class="computer-paper"><div class="computer-section-title"><span>第${c.number}章 / ${esc(section.number)}</span><h3>${esc(section.title)}</h3><p>来源：2026强化班讲义 · 原 PDF 第 ${[...new Set(section.parts.map(x=>x.page))].join('、')} 页</p></div>${reviewButton(section)}<div id="computerSpeechHost"></div>${D.errata.filter(x=>x.section===section.id).map(x=>`<aside class="computer-errata"><strong>原文核对 · ${esc(x.title)}</strong><p>${esc(x.text)}</p><a href="${x.url}" target="_blank" rel="noopener">核对标准依据 ↗</a></aside>`).join('')}<div class="computer-cloze-toolbar"><div><strong>${blanks.length?'本节 '+blanks.length+' 个空':'章节导读'}</strong><span>${blanks.length?'已看 '+shown.size+' 个 · 不太会 '+weak.size+' 个':'这一节没有填空，可直接阅读'}</span></div><div><label class="computer-weak-filter"><input type="checkbox" id="computerOnlyWeak" ${onlyWeak?'checked':''}>本节只看不会</label><button type="button" class="btn neutral" id="computerShowAll" ${blanks.length?'':'disabled'}>显示本节答案</button><button type="button" class="mini-link" id="computerHideAll" ${blanks.length?'':'disabled'}>全部遮住</button></div></div>${onlyWeak?'<p class="computer-filter-note">保留不会的空所在段落，方便结合上下文复习。标记不计错题次数，也不改变已读和听完记录。</p>':''}${paper}<label class="input-row"><span>本节笔记 · 自动保存</span><textarea id="computerNote" rows="3" placeholder="记下易混淆处或老师补充的内容"></textarea></label><div class="computer-bottom"><button class="btn neutral" id="computerPrev" ${index<=0?'disabled':''}>← ${onlyWeak?'上个不会小节':'上一节'}</button><button class="btn ${e.read?'neutral':'primary'}" id="computerRead">${e.read?'✓ 本节已读过':'标记本节已读过'}</button><button class="btn neutral" id="computerNext" ${index>=nav.length-1||!nav.length?'disabled':''}>${onlyWeak?'下个不会小节':'下一节'} →</button></div><p class="fine-note">已完整听完 ${e.plays.length} 次 · 已读过只作学习进度，不记为答题正确。</p><p id="computerSave" role="status">记录随整站备份一起保留。</p></article></div>`;
$('computerMode').onclick=()=>{window.ComputerSpeech.cancel();wholeChapter=!wholeChapter;onlyWeak=false;render();};
async function choose(id){if(!id)return;window.ComputerSpeech.cancel();selected=id;await update(id,{});render();window.scrollTo({top:0,behavior:'auto'});}
document.querySelectorAll('[data-computer-chapter]').forEach(b=>b.onclick=()=>{onlyWeak=false;return choose(D.chapters[Number(b.dataset.computerChapter)].sections[0].id);});document.querySelectorAll('[data-computer-chapter-weak]').forEach(b=>b.onclick=()=>{const ch=D.chapters[Number(b.dataset.computerChapterWeak)],next=ch.sections.find(s=>C.weakCount(s,entry(s.id)));if(next){wholeChapter=false;onlyWeak=true;return choose(next.id);}});document.querySelectorAll('[data-computer-section]').forEach(b=>b.onclick=()=>choose(b.dataset.computerSection));$('computerPrev').onclick=()=>choose(nav[index-1]?.id);$('computerNext').onclick=()=>choose(nav[index+1]?.id);$('computerRead').onclick=async()=>{if(await update(section.id,{read:true}))render();};$('computerNote').value=e.note||'';$('computerNote').oninput=()=>update(section.id,{note:$('computerNote').value});
document.querySelectorAll('[data-computer-blank]').forEach(button=>button.onclick=()=>{const id=button.dataset.computerBlank;window.ComputerSpeech.cancel();if(shown.has(id))shown.delete(id);else shown.add(id);render();document.querySelector('[data-computer-blank="'+id+'"]').focus({preventScroll:true});});document.querySelectorAll('[data-computer-weak]').forEach(button=>button.onclick=async()=>{const id=button.dataset.computerWeak,next=C.markWeak(section,entry(section.id),id,!C.weakIds(section,entry(section.id)).has(id));window.ComputerSpeech.cancel();if(await update(section.id,{weakBlanks:next.weakBlanks})){render();(document.querySelector('[data-computer-weak="'+id+'"]')||$('computerOnlyWeak')).focus({preventScroll:true});}});$('computerOnlyWeak').onchange=ev=>{onlyWeak=ev.target.checked;window.ComputerSpeech.cancel();render();};$('computerShowAll').onclick=()=>{window.ComputerSpeech.cancel();shown=new Set(blanks.map(b=>b.id));render();};$('computerHideAll').onclick=()=>{window.ComputerSpeech.cancel();shown.clear();render();};
if(wholeChapter){renderChapter(c);return;}
bindReviewButtons($('computerSpecialView'));
const correction=D.errata.filter(x=>x.section===section.id).map(x=>'原文核对。'+x.text).join('。');window.ComputerSpeech.attachText(section.id,section.title,C.text(section,shown,{onlyWeak,weakIds:weak})+(correction?'\n'+correction:''),$('computerSpeechHost'),async()=>{await update(section.id,{plays:[...entry(section.id).plays,new Date().toISOString()]});if(selected===section.id&&!$('computerSpecialView').classList.contains('hidden'))render();});}
window.ComputerSpecialUI={init:x=>api=x,render,merge};
})();
