'use strict';
(()=>{const C=window.ReadingSentenceCore,esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),records=new Map(),mounted=new WeakSet();let api;
const structurePattern=/\b(?:sb|sth|oneself|doing|to do)\b|\+/i;
const fixedPhrases=/^(?:bring new vitality to|make up for|keep in touch with|take part in|rather than|in memory of|play an important role in|out of place|at a loss|by no means|come under fire|make a difference|end up|suffer from|cut down on|give off|stick to)$/i;
const meanings={
 "the + 序数词 + 名词 + to do":"第几个做某事的人或事物",
 "difficult to do":"难以做某事",
 "welcome sb to":"欢迎某人来到某处或加入某个群体",
 "be out doing sth":"外出做某事",
 "arrive on + 日期":"在某一天到达",
 "时间段 + ago":"……以前",
 "draw sb away from":"把某人从……吸引走",
 "only when … + 主句部分倒装":"只有当……时，才……",
 "more than sb can finish":"多到某人无法完成或用完",
 "one of the most + 形容词 + 复数名词":"最……的……之一",
 "classify sth into":"把某物划分为……",
 "情态动词 + be + 过去分词":"表示情态和被动，如可以被……、必须被……",
 "discuss sth with sb":"与某人讨论某事",
 "a large number of + 复数名词":"大量的……",
 "sth of all kinds":"各种各样的某物",
 "improve sb’s travel experience":"改善某人的出行体验",
 "help (to) do sth":"帮助做某事",
 "break the limitation of sth":"突破……的限制",
 "the way (that) sb does sth":"某人做某事的方式",
 "spend time on sth":"在某事上花时间",
 "reduce the depth of sth":"降低……的深度",
 "apart from doing sth":"除了做某事之外",
 "apply for sth":"申请某物或某项资格",
 "besides + 名词":"除……之外还……",
 "whether to do a or (to) do b":"是做 A 还是做 B",
 "逗号 + which 引导的非限制性定语从句":"补充说明前面的名词或整个分句",
 "attitude towards sth":"对某事的态度",
 "be required to do sth":"被要求做某事",
 "be viewed as sth":"被视为……",
 "an increasing number of + 复数名词":"越来越多的……",
 "after doing sth":"做完某事后",
 "the method is to do sth":"方法是做某事",
 "while doing sth":"在做某事的同时",
 "bring practical benefits for sb":"给某人带来实际好处",
 "maintain one’s connection with sth":"维持自己与某事物的联系",
 "the core of sth":"某事物的核心",
 "the most essential part of sth":"某事物最关键的部分",
 "a rising number of + 复数名词":"越来越多的……",
 "suffer from sth":"遭受……或受……困扰",
 "only to do sth":"结果却做了某事，常表示出乎意料的结果",
 "become + 形容词":"变得……",
 "in the past + 时间段":"在过去……这段时间里",
 "steal sth from sb/sth":"从某人或某处偷走某物",
 "to do sth 表目的":"为了做某事",
 "so + 形容词 + that 从句":"如此……，以至于……",
 "use sth to do sth":"用某物做某事",
 "set sth at a reasonable level":"把某物设定在合理水平",
 "at the top of sth":"在……的顶部或最前面",
 "offer ways for sb to do sth":"为某人提供做某事的方法",
 "check whether + 从句":"核查是否……",
 "talk with sb":"与某人交谈",
 "it is hard to do sth":"做某事很难",
 "come from sth":"来自某处或源于某事物",
 "when doing sth":"做某事时",
 "debate whether + 从句":"争论是否……",
 "narrowly win sth":"以微弱优势赢得某物",
 "be more likely to do sth":"更有可能做某事",
 "narrowly miss sth":"差一点就赶上或得到某物",
 "suffer lasting harm to sth":"某方面受到持久损害",
 "among those who + 定语从句":"在那些……的人中",
 "better + 名词 + than":"比……更好的某人或某物",
 "argue that + 从句":"主张或论证……",
 "give sth to sb":"把某物给某人",
 "a way of doing sth":"做某事的一种方法",
 "raise the overall efficiency of sth":"提高某事物的整体效率",
 "change one’s ideas about sth":"改变自己对某事的看法",
 "the end of sth":"某事物的结束或末端",
 "not always + 形容词":"并非总是……",
 "how + 主语 + 谓语":"……的方式或如何……",
 "surround oneself with":"使自己周围充满……",
 "beat oneself up":"自责或苛责自己",
 "allow sb sth":"允许某人获得或拥有某物",
 "it takes to do sth":"做某事需要……",
 'provide sth for sb':'为某人提供某物',
 'provide sb with sth':'为某人提供某物',
 'learn sth from sth':'从……中学到……',
 'learn sth from sb':'向某人学到某事',
 'be delighted to do':'很高兴做某事',
 'find oneself doing':'发现自己正在做某事',
 'take to do sth':'花费……来做某事',
 'pressure sb to do sth':'向某人施压，要求其做某事',
 'strike sb as':'给某人留下……的印象',
 'enough to do sth':'足以做某事',
 'over the past + 时间段':'在过去……这段时间里',
 'have the right to do sth':'有权做某事',
 'aim to do sth':'旨在做某事',
 'must be + 过去分词':'必须被……（情态动词的被动结构）',
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
 const term=phrase.term.toLowerCase().replace(/\./g,'').replace(/\s+/g,' ').trim();
 return structurePattern.test(term)?meanings[term]||'':phrase.meaning;
}
function structures(phrases){
 const items=phrases.map((phrase,i)=>({phrase,html:`<article><button type="button" data-study-phrase="${i}" aria-expanded="false">${esc(phrase.term)}</button>${phraseMeaning(phrase)?`<span class="read-inline-meaning">${esc(phraseMeaning(phrase))}</span>`:''}</article>`}));
 const important=items.filter(({phrase})=>structurePattern.test(phrase.term)||fixedPhrases.test(phrase.term));
 const extra=items.filter(item=>!important.includes(item));
 const panel='<aside class="read-study-phrase-panel" data-study-phrase-panel hidden aria-live="polite"></aside>';
 return `<section class="read-study-structures"><h4>重点结构与固定搭配</h4>${important.map(item=>item.html).join('')||'<small>本段的词组见下方。</small>'}${extra.length?`<details open><summary>其他词组 · ${extra.length} 项</summary><div class="read-study-extra">${extra.map(item=>item.html).join('')}</div></details>`:''}${panel}</section>`;
}
function render(article,index,marked,words){const sentence=article.sentences[index],key=article.id+':'+index,analysis=window.READING_SENTENCE_DATA[key];if(!analysis)return `<div class="read-focus"><p class="read-english">${words(sentence.text,index)}</p><p>${esc(sentence.translation)}</p><p class="fine-note">这个片段的短语和语法说明尚待补充。</p></div>`;const unit=article.questions[0]?.type==='matching'?'段':'句';const record={article,index,sentence,analysis,marked};records.set(key,record);const source=words(sentence.text,index);return `<section class="sentence-study ${marked?'is-reviewed':''}" data-reading-sentence-key="${esc(key)}"><div class="read-study-top"><span>${marked?'✓ 已读懂 · 复习巩固':'逐'+unit+'精读'}</span><span>第 ${index+1} ${unit} · ${analysis.phrases.length} 个短语</span></div><p class="read-english read-study-source" data-sentence="${index}">${source}</p>${analysis.phrases.length?structures(analysis.phrases):''}<details class="read-study-translation read-study-detail"><summary>完整翻译</summary><p>${esc(sentence.translation)}</p></details><details class="read-study-detail"><summary>顺着英文理解 · 分段对照</summary><ol class="read-study-chunks">${analysis.chunks.map((chunk,i)=>`<li><span class="read-study-order">${i+1}</span><div><span class="read-study-role">${esc(chunk.role)}</span><p lang="en">${esc(chunk.en)}</p><p>${esc(chunk.zh)}</p></div></li>`).join('')}</ol></details><details class="read-study-detail"><summary>中文怎么组织 · 翻译顺序</summary><p class="read-study-help">这是一种参考译法，先理解主干与修饰关系，再按中文习惯组织，不是逐词硬套顺序。</p><ol class="read-study-chinese-order">${analysis.order.map(step=>`<li>${esc(step)}</li>`).join('')}</ol></details><details class="read-study-detail"><summary>本${unit}用到了什么语法 · ${analysis.grammar.length} 个点</summary><div class="read-study-grammar">${analysis.grammar.map(point=>`<article><strong>${esc(point.name)}</strong><p>${esc(point.explanation)}</p></article>`).join('')}</div></details></section>`;}
function mount(host,value){api=value;if(mounted.has(host))return;mounted.add(host);host.addEventListener('click',event=>{const button=event.target.closest('[data-study-phrase],[data-study-phrase-add],[data-study-phrase-close]');if(!button)return;const wrapper=button.closest('[data-reading-sentence-key]'),record=records.get(wrapper?.dataset.readingSentenceKey);if(!record)return;event.preventDefault();event.stopPropagation();const panel=wrapper.querySelector('[data-study-phrase-panel]');if(button.hasAttribute('data-study-phrase-close')){wrapper.querySelector('[data-study-phrase][aria-expanded=true]')?.focus();panel.hidden=true;wrapper.querySelectorAll('[data-study-phrase]').forEach(b=>b.setAttribute('aria-expanded','false'));return;}const index=Number(button.dataset.studyPhrase??button.dataset.studyPhraseAdd),phrase=record.analysis.phrases[index];if(!phrase)return;if(button.hasAttribute('data-study-phrase-add')){api.collect(phrase.term,{id:'reading:'+record.article.id+':'+record.index,kind:'exercise',questionId:record.article.id,location:record.marked?'阅读已读懂句子 · 短语':'阅读逐句精读 · 短语',source:'蓝色森林 · 阅读精读',group:record.article.title,text:record.sentence.text,translation:'',surface:phrase.surface,meaning:phraseMeaning(phrase),meaningKind:structurePattern.test(phrase.term)?'structure':'phrase'});return;}const wasOpen=button.getAttribute('aria-expanded')==='true';
wrapper.querySelectorAll('[data-study-phrase]').forEach(b=>b.setAttribute('aria-expanded',String(b===button&&!wasOpen)));
panel.hidden=wasOpen;
if(wasOpen)return;
panel.innerHTML=`<button type="button" class="mini-link" data-study-phrase-add="${index}">加入生词</button>`;
button.closest('article').append(panel);});}
window.ReadingSentenceUI={render,mount};})();

