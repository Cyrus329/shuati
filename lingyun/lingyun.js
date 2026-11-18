'use strict';
(() => {
  const bank = window.LINGYUN_PAPERS;
  const root = document.getElementById('lingyun');
  const storageKey = 'personal-records-lingyun-20261115';
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(storageKey) || '{}') || {}; } catch {}
  let selected = null;
  let current = 1;
  let typesetting = Promise.resolve();
  let renderId = 0;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const format = value => esc(value).replace(/\n/g, '<br>');
  function typeset() {
    const id = ++renderId;
    typesetting = typesetting.catch(() => {}).then(async () => {
      await window.MathJax?.startup?.promise;
      if (id === renderId && window.MathJax?.typesetPromise) await window.MathJax.typesetPromise([root]);
    });
  }
  function save(status) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(saved));
      if (status) status.textContent = '本次进度已保存';
    } catch {
      if (status) status.textContent = '当前浏览器未能保存进度';
    }
  }
  const finished = item => Boolean(item?.result);
  function card(paper) {
    const progress = saved[paper.id] || {};
    const done = paper.entries.filter(q => finished(progress.answers?.[q.n])).length;
    return `<article class="tile"><h3>${esc(paper.unit)}</h3><span>${esc(paper.label)} · ${paper.entries.length} 题${done ? ' · 已复刷 '+done+' 题' : ''}</span><br><button type="button" data-open="${paper.id}">${progress.current ? '继续练习' : '打开练习'}</button></article>`;
  }
  function list() {
    renderId++;
    window.MathJax?.typesetClear?.([root]);
    selected = null;
    root.innerHTML = '<h1>凌云班专区</h1>' + ['数学','计算机'].map(subject => `<section><h2>${subject}</h2><div class="tiles">${bank.filter(p => p.subject === subject).map(card).join('')}</div></section>`).join('');
    root.querySelectorAll('[data-open]').forEach(button => button.onclick = () => {
      selected = bank.find(p => p.id === button.dataset.open);
      const progress = saved[selected.id] ||= {answers:{}};
      current = (selected.entries.find(q => q.n >= progress.current) || selected.entries[0]).n;
      show();
    });
  }
  function openQuestion(number) {
    current = number;
    saved[selected.id].current = number;
    save();
    show();
    window.scrollTo(0, 0);
  }
  function answerFields(q, value, field, label) {
    const entries = Object.entries(q.options || {});
    if (!entries.length) {
      return `<label for="${field}">${esc(label)}</label><textarea id="${field}" data-answer="${field}" placeholder="写答案或解题步骤">${esc(value)}</textarea>`;
    }
    const multi = q.kind === '多选题' || q.multiple === true;
    const picked = new Set(/^[A-F]+$/.test(value || '') ? value.split('') : []);
    return `<fieldset class="paper-options"><legend>${multi ? '选择一项或多项' : '选择一个答案'}</legend>
      ${entries.map(([key, text]) => `<label class="paper-option"><input type="${multi ? 'checkbox' : 'radio'}" name="${field}" data-option-set="${field}" value="${esc(key)}" ${picked.has(key) ? 'checked' : ''}><b>${esc(key)}</b><span>${format(text)}</span></label>`).join('')}
    </fieldset>${value && !picked.size ? `<p class="muted">此前填写的答案 · ${format(value)}</p>` : ''}`;
  }
  function show() {
    window.MathJax?.typesetClear?.([root]);
    const position = selected.entries.findIndex(item => item.n === current);
    const q = selected.entries[position];
    const previous = selected.entries[position - 1];
    const next = selected.entries[position + 1];
    const progress = saved[selected.id];
    const groups = Map.groupBy(selected.entries, item => item.kind);
    const record = progress.answers[q.n] ||= {};
    const refs = q.sources || [];
    const link = i => `<a href="images/source-${i}.jpg" target="_blank" rel="noopener">原截图 ${i} ↗</a>`;
    const original = refs.length ? refs.map(link).join(' ') : '可从本单元的原截图查阅。';
    const subquestions = (q.parts || []).map((part, i) => `<section class="paper-part">
      <h3>（${i+1}）${format(part.stem)}</h3>${answerFields(part,record.parts?.[i] || '', 'sub-'+i,'本小题答案')}
    </section>`).join('');
    const reference = q.parts?.length
      ? q.parts.map((part,i)=>`<p><strong>（${i+1}）</strong>${format(part.answer || '见原批改')}${part.analysis ? '<br>'+format(part.analysis) : ''}</p>`).join('')
      : q.answer ? `<p class="paper-reference"><strong>参考答案</strong> ${format(q.answer)}</p>` : '';
    root.innerHTML = `<button id="all">← 返回凌云班单元</button><h1>${esc(selected.unit)} <small>${esc(selected.label)}</small></h1>
      <div class="layout"><nav class="paper-nav" aria-label="原卷题号">${[...groups].map(([kind, qs]) => `<h3>${esc(kind)}</h3><div class="numbers">${qs.map(item => `<button type="button" data-number="${item.n}" ${item.n === q.n ? 'aria-current="step"' : ''} class="${finished(progress.answers[item.n]) ? 'marked' : ''}">${item.n}</button>`).join('')}</div>`).join('')}</nav>
      <article class="paper"><div class="page-heading"><h2>第 ${q.n} 题</h2><span>${position + 1} / ${selected.entries.length}</span></div>
      ${q.stem ? `<div class="paper-stem">${format(q.stem)}</div>` : `<p class="note">${esc(q.sourceNote || '题面待核对，原截图可在下方打开。')}</p>`}
      ${q.figure ? `<img class="question" src="images/${esc(q.figure)}" alt="第 ${q.n} 题配图">` : ''}
      ${q.stem ? subquestions || answerFields(q,record.answer || '', 'response','本次作答') : ''}
      ${subquestions && record.answer ? `<p class="muted">此前填写的答案 · ${format(record.answer)}</p>` : ''}
      <details id="check-answer"><summary>核对答案与原批改</summary>
        ${reference}${q.analysis ? `<p>${format(q.analysis)}</p>` : ''}
        <div class="source-list">${original}</div>
        <div class="result">${['做对','需复刷'].map(v => `<button type="button" data-result="${v}" aria-pressed="${record.result === v}">${v}</button>`).join('')}</div></details>
      <p class="status" role="status"></p>
      ${!q.parts?.length && q.answer && Object.keys(q.options || {}).length ? '<button class="primary" id="grade" type="button">核对并记录</button>' : ''}
      <div class="buttons"><button id="prev" ${!previous ? 'disabled' : ''}>上一题</button><button class="primary" id="next" ${!next ? 'disabled' : ''}>下一题</button></div>
      <details><summary>查看本单元全部原截图</summary><div class="source-list">${selected.scans.slice().reverse().map(link).join('')}</div></details>
      </article></div>`;
    const status = root.querySelector('.status');
    function writeAnswer(field,value) {
      if (field === 'response') record.answer = value;
      else (record.parts ||= {})[Number(field.slice(4))] = value;
      progress.current = current;
      save(status);
    }
    root.querySelector('#all').onclick = list;
    root.querySelectorAll('[data-number]').forEach(button => button.onclick = () => openQuestion(Number(button.dataset.number)));
    root.querySelectorAll('[data-answer]').forEach(input => input.oninput = () => writeAnswer(input.dataset.answer,input.value));
    root.querySelectorAll('[data-option-set]').forEach(input => input.onchange = () => {
      const field = input.dataset.optionSet;
      const value = Array.from(root.querySelectorAll(`[data-option-set="${field}"]:checked`), item => item.value).sort().join('');
      writeAnswer(field,value);
    });
    root.querySelectorAll('[data-result]').forEach(button => button.onclick = () => {
      record.result = button.dataset.result;progress.current = current;save(status);
      root.querySelectorAll('[data-result]').forEach(el => el.setAttribute('aria-pressed', el === button));
      root.querySelector('[aria-current="step"]')?.classList.add('marked');
    });
    const grade = root.querySelector('#grade');
    if (grade) grade.onclick = () => {
      const expected = q.answer.replace(/[\s、,，]/g, '').split('').sort().join('');
      if (!/^[A-F]+$/.test(record.answer || '') || !Object.keys(q.options).every(key => /^[A-F]$/.test(key))) {
        status.textContent = '请先选择答案';
        return;
      }
      if (/^[A-F]+$/.test(expected)) {
        const correct = record.answer === expected;
        root.querySelector(`[data-result="${correct ? '做对' : '需复刷'}"]`).click();
        status.textContent = correct ? '答对了，已记录' : '答错了，已加入需复刷';
      }
      root.querySelector('#check-answer').open = true;
    };
    root.querySelector('#prev').onclick = () => { if (previous) openQuestion(previous.n); };
    root.querySelector('#next').onclick = () => { if (next) openQuestion(next.n); };
    typeset();
  }
  list();
})();
