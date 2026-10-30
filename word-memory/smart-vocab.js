(function(){
  const panel = document.querySelector('#smartVocabPanel');
  const box = document.querySelector('#smartVocabContent');
  if(!panel || !box) return;
  const lib = window.ENGLISH_FOLDER_LIBRARY || [];
  const words = lib.flatMap(folder => (folder.children||[]).flatMap(group => (group.words||[]).map(w => ({...w, folder: folder.name, group: group.name}))));
  if(!words.length){ panel.hidden = true; return; }
  let active = 'synonym';
  let activeKey = '';
  let limit = 40;
  const esc = s => String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const norm = s => String(s||'').trim().toLowerCase();
  const uniqueByTerm = list => [...new Map(list.filter(w=>norm(w.term)).map(w=>[norm(w.term),w])).values()];

  const affixes = [
    {key:'前缀 re-', test:t=>t.startsWith('re'), tip:'again / back，表示再、回'},
    {key:'前缀 un-', test:t=>t.startsWith('un'), tip:'not，表示否定'},
    {key:'前缀 in-/im-/il-/ir-', test:t=>/^(in|im|il|ir)/.test(t), tip:'not / into，常见否定或进入'},
    {key:'前缀 dis-', test:t=>t.startsWith('dis'), tip:'not / opposite，表示否定、相反'},
    {key:'前缀 pre-', test:t=>t.startsWith('pre'), tip:'before，表示以前、预先'},
    {key:'前缀 pro-', test:t=>t.startsWith('pro'), tip:'forward，表示向前、支持'},
    {key:'前缀 trans-', test:t=>t.startsWith('trans'), tip:'across，表示穿过、转变'},
    {key:'后缀 -tion/-sion', test:t=>/(tion|sion)$/.test(t), tip:'名词后缀，动作或结果'},
    {key:'后缀 -ment', test:t=>/ment$/.test(t), tip:'名词后缀，行为或结果'},
    {key:'后缀 -ness', test:t=>/ness$/.test(t), tip:'名词后缀，性质、状态'},
    {key:'后缀 -able/-ible', test:t=>/(able|ible)$/.test(t), tip:'形容词后缀，可以……的'},
    {key:'后缀 -ly', test:t=>/ly$/.test(t), tip:'副词后缀，……地'},
    {key:'后缀 -er/-or', test:t=>/(er|or)$/.test(t), tip:'人或物，执行者'},
    {key:'词根 port', test:t=>t.includes('port'), tip:'carry，搬运、港口、输入输出'},
    {key:'词根 form', test:t=>t.includes('form'), tip:'shape，形式、形成'},
    {key:'词根 spect', test:t=>t.includes('spect'), tip:'look，看、观察'},
    {key:'词根 dict', test:t=>t.includes('dict'), tip:'say，说、断言'},
    {key:'词根 scrib/script', test:t=>/(scrib|script)/.test(t), tip:'write，写'},
  ];

  function affixGroups(){
    return affixes.map(a=>({
      name:a.key, tip:a.tip,
      words: uniqueByTerm(words.filter(w=>a.test(norm(w.term).replace(/[^a-z-]/g,''))))
    })).filter(g=>g.words.length);
  }
  function similarGroups(){
    const buckets = new Map();
    uniqueByTerm(words).forEach(w=>{
      const t=norm(w.term).replace(/[^a-z]/g,'');
      if(t.length<4) return;
      const key=t.slice(0,3);
      if(!buckets.has(key)) buckets.set(key, []);
      buckets.get(key).push(w);
    });
    return [...buckets.entries()].map(([key,list])=>({name:`${key} 开头形近词`, tip:'开头相近，容易看错或拼错', words:list}))
      .filter(g=>g.words.length>=2)
      .sort((a,b)=>b.words.length-a.words.length)
      .slice(0,30);
  }
  // Match lexical entries, never arbitrary substrings in examples or notes.
  const synonymSets = [
    ['参加', 'take part in|participate in|join in', 'take part in / participate in 后接活动；join in 常指加入正在进行的活动。join sb. / a club 的结构不同。'],
    ['导致', 'lead to|result in|cause|bring about', 'lead to / result in 后接名词或动名词；cause 可接 cause sb. to do sth.。result from 表示原因，不归入本组。'],
    ['由……组成', 'consist of|be made up of|be composed of', 'consist of 用主动形式；be made up of / be composed of 为被动形式。不要写 be consisted of。'],
    ['许多', 'a lot of|lots of|plenty of|many|much', 'a lot of / lots of 可接可数复数和不可数名词；many 接可数复数，much 接不可数名词；plenty of 还强调充足。'],
    ['因为', 'because of|due to|owing to|on account of', '这些表达后接名词或动名词；because 后接完整句子。due to 作表语也很常见。'],
    ['重要的', 'important|significant|essential|vital|crucial', 'important 表示重要；significant 可强调意义重大；essential 强调必不可少；vital / crucial 强调关键。'],
    ['帮助', 'help|assist|aid', 'help sb. (to) do；assist sb. in doing / with sth.；aid 可用作名词。相近含义需要配合各自结构。'],
    ['减少', 'reduce|decrease|cut down|cut down on', 'reduce / decrease 可表示数量减少；cut down on sth. 常指减少使用或消费。reduce to 与 reduce by 含义不同。'],
    ['提高、改善', 'improve|enhance|raise|boost', 'improve 强调改善质量；enhance 强调增强；raise 常指提高水平或数量，不能代替所有 improve。'],
    ['以……闻名', 'be famous for|be known for|be renowned for', 'for 后接闻名的原因或特色；be known as 后接身份，不与本组混用。'],
    ['照顾', 'look after|take care of|care for', 'look after / take care of 表示照料；care for 还可表示喜欢，须看语境。'],
    ['想要、渴望', 'want|wish|desire|be eager to do|be eager to', 'want to do；wish to do 较正式；be eager to do 强调迫切想做。wish 另有虚拟语气用法。'],
    ['发生', 'happen|occur|take place', 'happen / occur 常指事件发生；take place 常用于有计划的活动。均不可直接套用被动语态。'],
    ['提供', 'provide|offer|supply', 'provide sb. with sth. / provide sth. for sb.；offer sb. sth.；supply sb. with sth.。'],
    ['代替', 'replace|take the place of|substitute', 'replace A with B：用 B 替换 A；substitute B for A：用 B 代替 A，留意顺序。'],
    ['最后、终于', 'finally|eventually|at last|in the end', 'finally 可标记列举最后一点；eventually 强调一段过程后；at last 常带等待后的情绪。'],
    ['尽管', 'despite|in spite of', '后接名词或动名词；although / though 后接句子。despite 后不加 of。'],
    ['与……不同', 'be different from|differ from', 'be different from 是形容词结构；differ from 是动词结构，时态和主谓一致要相应变化。'],
    ['对……有益', 'be good for|be beneficial to|benefit', 'be good for / be beneficial to 后接受益对象；benefit sb. 为及物结构，benefit from 表示从中受益。'],
    ['关注', 'focus on|concentrate on|pay attention to', 'on / to 后接名词或动名词；pay attention to 中 to 是介词。']
  ];
  const lexicalKey = value => String(value||'').normalize('NFKC').toLowerCase().replace(/[‐‑–—]/g,'-').replace(/\./g,'').replace(/\s+/g,' ').trim();
  function synonymGroups(){
    const live = window.WordMemoryApp?.getWords?.() || [];
    return synonymSets.map(([name, terms, tip])=>{
      const keys=new Set(terms.split('|').map(lexicalKey));
      return {name,tip,words:live.filter(w=>keys.has(lexicalKey(w.term))).map(w=>({...w,folder:'我的词库',group:'近义表达'}))};
    }).filter(g=>g.words.length>=2);
  }
  const familyRoots = [
    ['act', 'act / active / action 一组'], ['form', 'form / inform / perform 一组'], ['port', 'port / import / export 一组'],
    ['press', 'press / express / pressure 一组'], ['spect', 'spect / inspect / respect 一组'], ['struct', 'struct / construct / instruction 一组'],
    ['duce', 'duce / produce / reduce 一组'], ['sign', 'sign / signal / significant 一组'], ['dict', 'dict / predict / dictionary 一组']
  ];
  function familyGroups(){
    return familyRoots.map(([root,name])=>({name, tip:'同一词根或同族词，放一起记更快', words:uniqueByTerm(words.filter(w=>norm(w.term).includes(root))) }))
      .filter(g=>g.words.length>=2);
  }
  function polysemyGroups(){
    const candidates = uniqueByTerm(words.filter(w=>/[；;]|一词多义|多义|熟词僻义/.test(`${w.meaning} ${w.note}`) || String(w.meaning||'').split(/[，,；;]/).filter(Boolean).length>=3));
    return [{name:'一词多义集中刷', tip:'一个词多个常考意思，适合阅读和完形', words:candidates}].filter(g=>g.words.length);
  }
  function collocationGroups(){
    const special = uniqueByTerm(words.filter(w=>Array.isArray(w.groups) && w.groups.includes('四级固定搭配专项')));
    const buckets = new Map();
    uniqueByTerm(words.filter(w=>String(w.phrase||'').trim())).forEach(w=>{
      const first = norm(w.phrase).split(/\s+/)[0] || '短语';
      const key = ['be','look','take','make','give','come','go','get','put','according','because','in','on','at','for','to'].includes(first) ? `${first} 搭配` : '常见固定搭配';
      if(!buckets.has(key)) buckets.set(key, []);
      buckets.get(key).push(w);
    });
    const general=[...buckets.entries()].map(([name,list])=>({name, tip:'固定搭配只速记，不再做填空', words:list})).filter(g=>g.words.length).sort((a,b)=>b.words.length-a.words.length);
    return special.length ? [{name:'四级固定搭配专项',tip:'政治/经济翻译 + Unit 10 高频搭配；可到拼写训练直接做中文→英文专项',words:special},...general] : general;
  }
  function groups(){
    if(active==='affix') return affixGroups();
    if(active==='similar') return similarGroups();
    if(active==='synonym') return synonymGroups();
    if(active==='family') return familyGroups();
    if(active==='polysemy') return polysemyGroups();
    if(active==='collocation') return collocationGroups();
    return affixGroups();
  }
  function render(){
    const gs=groups();
    if(!activeKey || !gs.some(g=>g.name===activeKey)) activeKey=gs[0]?.name||'';
    const g=gs.find(x=>x.name===activeKey);
    const list=(g?.words||[]).slice(0,limit);
    box.innerHTML=`
      <div class="smart-layout">
        <div class="smart-group-list">${gs.map(item=>`<button class="smart-group-btn ${item.name===activeKey?'active':''}" data-smart-key="${esc(item.name)}"><b>${esc(item.name)}</b><span>${item.words.length} 个 · ${esc(item.tip)}</span></button>`).join('')}</div>
        <div class="smart-detail">
          ${g?`<div class="smart-detail-head"><h3>${esc(g.name)}</h3><p>${esc(g.tip)}</p></div>`:'<p>当前词库还没有同组的两个表达。已收录的近义词会在这里自动归组；只归纳词库里的词，各自进度保留。</p>'}
          <div class="smart-word-grid">${list.map(w=>`<article class="smart-word-card"><strong>${esc(w.term)}</strong><p>${esc(w.meaning)}</p>${w.phrase?`<details><summary>例句 / 搭配</summary><p>${esc(w.phrase)}</p></details>`:''}<span>${esc(w.folder)} / ${esc(w.group)}</span>${active==='synonym'?`<button type="button" class="secondary-button" data-synonym-open="${esc(w.id)}">查看词卡</button>`:''}</article>`).join('')}</div>
          ${g && g.words.length>list.length?`<button class="secondary-button" data-smart-more type="button">再显示 40 个</button>`:''}
        </div>
      </div>`;
  }
  document.addEventListener('click', e=>{
    const open=e.target.closest('[data-synonym-open]');
    if(open){window.WordMemoryApp?.openWord?.(open.dataset.synonymOpen);return;}
    if(e.target.closest('[data-module-target="smart"]') && active==='synonym')render();
    const tab=e.target.closest('[data-smart-tab]');
    if(tab){ active=tab.dataset.smartTab; activeKey=''; limit=40; document.querySelectorAll('[data-smart-tab]').forEach(b=>b.classList.toggle('active', b===tab)); render(); return; }
    const key=e.target.closest('[data-smart-key]');
    if(key){ activeKey=key.dataset.smartKey; limit=40; render(); return; }
    if(e.target.closest('[data-smart-more]')){ limit+=40; render(); return; }
  });
  window.addEventListener('focus',()=>{if(active==='synonym')render();});
  const entry=document.querySelector('[data-module-target="smart"]');
  if(entry)entry.innerHTML='近义词归纳 <small>用法辨析 / 构词归类</small>';
  document.querySelectorAll('[data-smart-tab]').forEach(b=>b.classList.toggle('active',b.dataset.smartTab===active));
  const heading=panel.querySelector('h2');if(heading)heading.textContent='近义词归纳与用法辨析';
  render();
})();
