'use strict';
(() => {
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const exponentChars={'⁰':'0','¹':'1','²':'2','³':'3','⁴':'4','⁵':'5','⁶':'6','⁷':'7','⁸':'8','⁹':'9','⁻':'-','⁺':'+','ˣ':'x','ʸ':'y','ᵗ':'t','ᵃ':'a','ᵇ':'b','ⁿ':'n'};
 const normalize=v=>String(v??'').replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺ˣʸᵗᵃᵇⁿ]+/g,s=>'^('+[...s].map(c=>exponentChars[c]).join('')+')');
 function create(byId={}){
  const get=q=>q.subject==='高等数学'?(q.mathLesson||[q.id,q.canonicalId,...(q.aliases||[])].map(id=>byId[id]).find(Boolean)||null):null;
  function render(q){const l=get(q);if(!l)return '';const fmt=v=>typeof window!=='undefined'&&window.MathNotation?window.MathNotation.html('高等数学',normalize(v)):esc(v);return `<section class="english-lesson math-lesson" aria-label="数学分步解析"><div class="english-lesson-title"><span class="eyebrow">THINK · TRY · UNDERSTAND</span><h3>先想一步，再看一步</h3><p class="fine-note">按需要展开，先试着自己做；查看提示不会提交答案。</p></div>${l.caveat?`<aside class="english-caveat"><strong>题目核查说明</strong><p>${fmt(l.caveat)}</p></aside>`:''}<details class="lesson-stage math-hint"><summary><span>01</span>先给我一个提示</summary><p>${fmt(q.point?`先关注「${q.point}」，辨认已知条件与要求，再选择适用的方法。`:'先列出题目已知条件和要求，检查公式适用范围，再尝试第一步。')}</p></details><details class="lesson-stage math-strategy"><summary><span>02</span>看看关键思路</summary><h4>解题方法</h4><p>${fmt(l.method)}</p></details><details class="lesson-stage math-full"><summary><span>03</span>展开完整过程与答案</summary><h4>关键步骤</h4><ol class="english-steps">${l.steps.map(s=>`<li>${fmt(s)}</li>`).join('')}</ol><div class="english-memory"><strong>本题结论</strong><p>${fmt(l.conclusion)}</p></div><div class="english-explanation"><h4>容易错的地方</h4><p>${fmt(l.pitfall)}</p></div></details></section>`;}
  return {get,render};
 }
 if(typeof module!=='undefined')module.exports={create};if(typeof window!=='undefined')window.MathLesson=create(window.MATH_LESSONS?.byId||{});
})();
