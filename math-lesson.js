'use strict';
(() => {
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const exponentChars={'⁰':'0','¹':'1','²':'2','³':'3','⁴':'4','⁵':'5','⁶':'6','⁷':'7','⁸':'8','⁹':'9','⁻':'-','⁺':'+','ˣ':'x','ʸ':'y','ᵗ':'t','ᵃ':'a','ᵇ':'b','ⁿ':'n'};
 const normalize=v=>String(v??'').replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺ˣʸᵗᵃᵇⁿ]+/g,s=>'^('+[...s].map(c=>exponentChars[c]).join('')+')');
 function create(byId={}){
  const workedExamples={
   'CQZSB-20261013-001-003':{
    steps:[
     '分母要求 \\(x\\ne0\\)。两个对数的真数都必须严格大于零，所以两个被开方数也必须严格大于零。',
     '由 \\(x^2-3x+2=(x-1)(x-2)>0\\)，得 \\(x<1\\) 或 \\(x>2\\)。',
     '由 \\(-x^2-3x+4=-(x+4)(x-1)>0\\)，得 \\((x+4)(x-1)<0\\)，即 \\(-4<x<1\\)。',
     '取上述两个不等式解集的交集，得到 \\((-4,1)\\)。再排除分母为零的点 \\(x=0\\)。'
    ],
    conclusion:'定义域为 \\((-4,0)\\cup(0,1)\\)，选 B。',
    pitfall:'外层对数要求根号的值大于零，端点 −4、1 都不能取。'
   }
  };
  const get=q=>{
   if(q.subject!=='高等数学')return null;
   const ids=[q.id,q.canonicalId,...(q.aliases||[])];
   return ids.map(id=>workedExamples[id]).find(Boolean)||
    q.mathLesson||ids.map(id=>byId[id]).find(l=>l?.verifiedCurrentStem===q.stem)||(!q.contentRestored?ids.map(id=>byId[id]).find(Boolean):null)||null;
  };
  function render(q){
   if(q.subject!=='高等数学')return '';
   const lesson=get(q);
   const fmt=v=>typeof window!=='undefined'&&window.MathNotation?window.MathNotation.html('高等数学',normalize(v)):esc(v);
   const answer=q.verifiedAnswer||q.sourceAnswer;
   const answerText=answer&&q.options?.[answer]?`${answer} · ${q.options[answer]}`:answer;
   const partial=[...new Set([...(q.scoringPoints||[]),q.analysis].filter(Boolean))];
   const steps=lesson?.steps||partial;
   const originalSolutions=!lesson&&String(q.analysis||'').includes('完整推导见下方原版逐题解析图')
    ? (q.sourceImageRefs||[]).filter(src=>/^images\/chapter2-source-[a-f0-9]+\.webp$/.test(src)) : [];
   return `<section class="english-lesson math-lesson" aria-label="数学解答"><div class="english-lesson-title"><h3>${lesson?'完整解答':'参考答案与现有解题要点'}</h3></div>
    ${lesson?.caveat?`<p class="answer-issue">${fmt(lesson.caveat)}</p>`:''}
    ${lesson?.method?`<p>${fmt(lesson.method)}</p>`:''}
    ${steps.length?`<ol class="english-steps">${steps.map(step=>`<li>${fmt(step)}</li>`).join('')}</ol>`:''}
    <div class="english-memory"><strong>本题结论</strong><p>${fmt(lesson?.conclusion||answerText||'暂无可靠参考答案')}</p></div>
    ${lesson?.pitfall?`<p><strong>易错点：</strong>${fmt(lesson.pitfall)}</p>`:''}
    ${originalSolutions.map(src=>`<figure class="screen-figure"><figcaption>原版解析页</figcaption><img src="${esc(src)}" alt="原版逐题解析" loading="lazy"></figure>`).join('')}
    ${lesson?'':`<p class="fine-note">${originalSolutions.length?'独立文字推导待补，可直接看上方原版解析。':'本题的完整推导待补。'}</p>`}</section>`;
  }
  return {get,render};
 }
 if(typeof module!=='undefined')module.exports={create};if(typeof window!=='undefined')window.MathLesson=create(window.MATH_LESSONS?.byId||{});
})();

