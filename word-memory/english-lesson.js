'use strict';
(() => {
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const paragraphs=value=>String(value||'').split(/\n+/).filter(Boolean).map(v=>`<p>${esc(v)}</p>`).join('');
  function create(byId={}){
    function get(q){if(q.subject!=='英语')return null;if(q.englishLesson)return q.englishLesson;for(const id of [q.id,q.canonicalId,...(q.aliases||[])])if(byId[id])return byId[id];return null;}
    function render(q){
      const lesson=get(q);if(!lesson)return '';
      const read=typeof window!=='undefined'?window.LessonReader:null;
      const options=Object.entries(q.options||{}),links=(lesson.references||[]).filter(r=>/^https:\/\//.test(r.url||''));
      return `<section class="english-lesson" aria-label="英语详细讲解"><div class="english-lesson-title"><span class="eyebrow">READ · UNDERSTAND · REMEMBER</span><h3>看懂这道题</h3></div>${lesson.caveat?`<aside class="english-caveat"><strong>先看题源说明</strong>${paragraphs(lesson.caveat)}</aside>`:''}<details class="english-sentence lesson-stage"><summary>点开原句 · 翻译与拆句</summary><div class="lesson-original">${read?read.words(q.stem,q,lesson):esc(q.stem)}</div><p class="lesson-word-result" role="status" hidden></p><div class="english-translation"><h4>题干翻译</h4>${paragraphs(lesson.translation)}</div>${read?.skeleton(q.id)?`<div class="english-skeleton"><h4>句子主干与修饰</h4>${paragraphs(read.skeleton(q.id))}</div>`:''}${lesson.steps?.length?`<div class="english-sentence-clues"><h4>拆句与解题线索</h4><ol>${lesson.steps.map(v=>`<li>${esc(v)}</li>`).join('')}</ol></div>`:''}</details><div class="english-explanation"><h4>详细解析</h4>${paragraphs(lesson.answerExplanation)}${lesson.steps?.length?`<ol class="english-steps">${lesson.steps.map(v=>`<li>${esc(v)}</li>`).join('')}</ol>`:''}</div>${options.length?`<details class="english-options" open><summary>逐项分析 · 为什么选 / 为什么不选</summary><div class="english-options-list">${options.map(([letter,text])=>{const detail=lesson.optionAnalysis?.[letter];return detail?`<details class="english-option-analysis" data-explain-option="${esc(letter)}"><summary class="english-option-heading"><span>${esc(letter)}</span><strong>${esc(text)}</strong><small>词义 / 为什么选或不选</small></summary><p class="english-option-meaning">${esc(detail.meaning)}</p>${paragraphs(detail.reason)}</details>`:'';}).join('')}</div></details>`:''}${lesson.memoryTip?`<aside class="english-memory"><strong>记住这一点</strong>${paragraphs(lesson.memoryTip)}</aside>`:''}${links.length?`<details class="english-references"><summary>用法核查依据</summary><ul>${links.map(r=>`<li><a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">${esc(r.title||r.url)}</a></li>`).join('')}</ul></details>`:''}</section>`;
    }
    return {get,render};
  }
  if(typeof module!=='undefined')module.exports={create};
  if(typeof window!=='undefined')window.EnglishLesson=create(window.ENGLISH_LESSONS?.byId||{});
})();
