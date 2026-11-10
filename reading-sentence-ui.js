'use strict';
(()=>{const C=window.ReadingSentenceCore,esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),records=new Map(),mounted=new WeakSet();let api;
const structurePattern=/\b(?:sb|sth|oneself|doing|to do)\b|\+/i;
const fixedPhrases=/^(?:bring new vitality to|make up for|keep in touch with|take part in|rather than|in memory of|play an important role in|out of place|at a loss|by no means|come under fire|make a difference|end up|suffer from|cut down on|give off|stick to)$/i;
const meanings={
 'allow sb to do sth':'允许某人做某事；使某人能够做某事',
 'allow sb/sth to do sth':'允许某人或某物做某事；使其能够做某事',
 'help sb (to) do sth':'帮助某人做某事',
 'enable sb to do sth':'使某人能够做某事',
 'want sb to do sth':'想让某人做某事',
 'force sb to do sth':'迫使某人做某事',
 'push sb to do sth':'推动某人做某事',
 'advise sb to do sth':'建议某人做某事',
 'advise sb not to do sth':'建议某人别做某事',
 'stop sb from doing sth':'阻止某人做某事',
 'keep doing sth':'持续做某事',
 'enjoy doing sth':'喜欢做某事',
 'avoid doing sth':'避免做某事',
 'learn to do sth':'学会做某事',
 'choose to do sth':'选择做某事',
 'fail to do sth':'未能做某事',
 'be willing to do sth':'愿意做某事',
 'be eager to do':'渴望做某事',
 'by doing sth':'通过做某事',
 'a way for sb to do sth':'供某人做某事的一种方法',
 'make + 宾语 + 形容词':'使某人或某物处于某种状态',
 'one of + 最高级 + 复数名词':'最……的……之一'
};
function phraseMeaning(phrase){
 const term=phrase.term.toLowerCase().replace(/\./g,'');
 return structurePattern.test(term)?meanings[term]||'':phrase.meaning;
}
function structures(phrases){
 const items=phrases.map((phrase,i)=>({phrase,html:`<article><button type="button" data-study-phrase="${i}" aria-expanded="false">${esc(phrase.term)}</button></article>`}));
 const important=items.filter(({phrase})=>structurePattern.test(phrase.term)||fixedPhrases.test(phrase.term));
 const extra=items.filter(item=>!important.includes(item));
 const panel='<aside class="read-study-phrase-panel" data-study-phrase-panel hidden aria-live="polite"></aside>';
 return `<section class="read-study-structures"><h4>重点结构与固定搭配</h4>${important.map(item=>item.html).join('')||'<small>本段的词组见下方。</small>'}${extra.length?`<details><summary>其他词组 · ${extra.length} 项</summary><div class="read-study-extra">${extra.map(item=>item.html).join('')}</div></details>`:''}${panel}</section>`;
}
function render(article,index,marked,words){const sentence=article.sentences[index],key=article.id+':'+index,analysis=window.READING_SENTENCE_DATA[key];if(!analysis)return `<div class="read-focus"><p class="read-english">${words(sentence.text,index)}</p><p>${esc(sentence.translation)}</p><p class="fine-note">这个片段的短语和语法说明尚待补充。</p></div>`;const unit=article.questions[0]?.type==='matching'?'段':'句';const record={article,index,sentence,analysis,marked};records.set(key,record);const source=words(sentence.text,index);return `<section class="sentence-study" data-reading-sentence-key="${esc(key)}"><div class="read-study-top"><span>${marked?'✓ 已读懂 · 复习巩固':'逐'+unit+'精读'}</span><span>第 ${index+1} ${unit} · ${analysis.phrases.length} 个短语</span></div><p class="read-english read-study-source" data-sentence="${index}">${source}</p>${analysis.phrases.length?structures(analysis.phrases):''}<details class="read-study-translation read-study-detail"><summary>完整翻译</summary><p>${esc(sentence.translation)}</p></details><details class="read-study-detail"><summary>顺着英文理解 · 分段对照</summary><ol class="read-study-chunks">${analysis.chunks.map((chunk,i)=>`<li><span class="read-study-order">${i+1}</span><div><span class="read-study-role">${esc(chunk.role)}</span><p lang="en">${esc(chunk.en)}</p><p>${esc(chunk.zh)}</p></div></li>`).join('')}</ol></details><details class="read-study-detail"><summary>中文怎么组织 · 翻译顺序</summary><p class="read-study-help">这是一种参考译法，先理解主干与修饰关系，再按中文习惯组织，不是逐词硬套顺序。</p><ol class="read-study-chinese-order">${analysis.order.map(step=>`<li>${esc(step)}</li>`).join('')}</ol></details><details class="read-study-detail"><summary>本${unit}用到了什么语法 · ${analysis.grammar.length} 个点</summary><div class="read-study-grammar">${analysis.grammar.map(point=>`<article><strong>${esc(point.name)}</strong><p>${esc(point.explanation)}</p></article>`).join('')}</div></details></section>`;}
function mount(host,value){api=value;if(mounted.has(host))return;mounted.add(host);host.addEventListener('click',event=>{const button=event.target.closest('[data-study-phrase],[data-study-phrase-add],[data-study-phrase-close]');if(!button)return;const wrapper=button.closest('[data-reading-sentence-key]'),record=records.get(wrapper?.dataset.readingSentenceKey);if(!record)return;event.preventDefault();event.stopPropagation();const panel=wrapper.querySelector('[data-study-phrase-panel]');if(button.hasAttribute('data-study-phrase-close')){wrapper.querySelector('[data-study-phrase][aria-expanded=true]')?.focus();panel.hidden=true;wrapper.querySelectorAll('[data-study-phrase]').forEach(b=>b.setAttribute('aria-expanded','false'));return;}const index=Number(button.dataset.studyPhrase??button.dataset.studyPhraseAdd),phrase=record.analysis.phrases[index];if(!phrase)return;if(button.hasAttribute('data-study-phrase-add')){api.collect(phrase.term,{id:'reading:'+record.article.id+':'+record.index,kind:'exercise',questionId:record.article.id,location:record.marked?'阅读已读懂句子 · 短语':'阅读逐句精读 · 短语',source:'蓝色森林 · 阅读精读',group:record.article.title,text:record.sentence.text,translation:'',surface:phrase.surface,meaning:phraseMeaning(phrase),meaningKind:structurePattern.test(phrase.term)?'structure':'phrase'});return;}wrapper.querySelectorAll('[data-study-phrase]').forEach(b=>b.setAttribute('aria-expanded',String(b===button)));panel.innerHTML=`<div><strong lang="en">${esc(phrase.term)}</strong><button type="button" class="mini-link" data-study-phrase-close aria-label="收起短语释义">收起 ×</button></div><p class="read-study-phrase-meaning">${esc(phraseMeaning(phrase)||'可收藏这个结构，并填写自己的释义。')}</p><button type="button" class="btn neutral" data-study-phrase-add="${index}">选择加入生词 / 单词程序</button>`;panel.hidden=false;panel.scrollIntoView({block:'nearest'});});}
window.ReadingSentenceUI={render,mount};})();
