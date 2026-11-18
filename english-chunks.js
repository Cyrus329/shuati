(() => {
  'use strict';
  const pronoun = '(?:i|you|he|she|it|we|they|there|those|these)';
  const finite = '(?:am|is|are|was|were|has|have|had|do|does|did|can|could|cannot|may|might|must|shall|should|will|would|\\w+(?:ed|s))';
  const startClause = new RegExp('^' + pronoun + '\\s+(?:(?:often|usually|never|seldom|always|not)\\s+)?' + finite + '\\b', 'i');
  const joiner = /\b(and|but|or|so|yet)\s+/gi;
  const opening = /^(even though|even if|as soon as|although|because|unless|whenever|while|when|before|after|if|since)\s+[^,]+,/i;
  const relative = /\b(?:who|which|that)\s+[^,]+?(?=\s+(?:will|would|can|could|must|should)\s)/i;
  const trailing = /\b(?:step by step|(?:in|for|within|after) (?:a few|several|\d+) (?:minutes?|hours?|days?|weeks?|years?))(?=[.!?]*$)/i;

  const segmenter = typeof Intl.Segmenter === 'function'
    ? new Intl.Segmenter('en', {granularity: 'sentence'}) : null;
  function sentences(text) {
    return segmenter ? [...segmenter.segment(text)] : [...text.matchAll(/[^\n]+?(?:[.!?](?=\s+[A-Z]|$)|$)/g)]
      .map(match => ({segment: match[0], index: match.index}));
  }
  const medial = /,\s*((?:while|whereas|although|though|because|unless|when|since|if)\b[^.!?]*)/i;
  const phraseTail = /\b(in memory of .+?|(?:on|during) (?:this|that|the) (?:festival|day|holiday|week|meeting)|for quick information reading)(?=[.!?]*\s*$)/i;

  function annotate(sentence) {
    const spans = [];
    const first = sentence.trimStart().match(opening);
    const medialClause = sentence.match(medial);
    if (medialClause) {
      const start = medialClause.index + medialClause[0].indexOf(medialClause[1]);
      const kind = /^(while|whereas)\b/i.test(medialClause[1]) ? '对比状语从句' : '后置状语从句';
      spans.push([start, sentence.length, kind]);
    }
    const phrase = sentence.match(phraseTail);
    if (phrase) {
      const kind = /^(?:on|during)\b/i.test(phrase[0]) ? '时间状语' : '目的状语';
      spans.push([phrase.index, sentence.length, kind]);
    }
    if (first) spans.push([0, first[0].length + sentence.length - sentence.trimStart().length, '句首状语从句']);
    for (const match of sentence.matchAll(joiner)) {
      const end = match.index + match[0].length;
      if (startClause.test(sentence.slice(end)) || /^(?:the|a|an|my|our|their|those|these)\s+(?:[\w’-]+\s+){1,7}(?:is|are|was|were|has|have|will|would|can|could|must|should)\b/i.test(sentence.slice(end))) {
        spans.push([match.index, end, '并列连词']);
      }
    }
    for (const match of sentence.matchAll(/,\s*(?:who|whom|whose|which)\s+[^,]+,/gi)) {
      spans.push([match.index + 1, match.index + match[0].length - 1, '非限制性定语从句']);
    }
    const rel = sentence.match(relative);
    if (rel && /\b(?:those|people|students|someone|one)\s+who\b/i.test(sentence.slice(0, rel.index + 3))) {
      spans.push([rel.index, rel.index + rel[0].length, '定语从句']);
    }
    const tail = sentence.match(trailing);
    if (tail) spans.push([tail.index, sentence.length, /^step/i.test(tail[0]) ? '方式状语' : '时间状语']);
    let offset = 0;
    const chunks = [];
    for (const [start, end, role] of spans.sort((a, b) => a[0] - b[0])) {
      if (start < offset) continue;
      if (start > offset) chunks.push([offset === 0 ? '主句片段' : '分句片段', sentence.slice(offset, start)]);
      chunks.push([role, sentence.slice(start, end)]);
      offset = end;
    }
    if (offset < sentence.length) chunks.push([chunks.length ? '分句片段' : '原文', sentence.slice(offset)]);
    return chunks;
  }

  const dialog = document.getElementById('englishChunks');
  const input = dialog.querySelector('textarea');
  const output = dialog.querySelector('.english-chunk-results');
  const open = document.getElementById('openEnglishChunks');
  function render() {
    output.replaceChildren();
    const value = input.value.trim();
    if (!value) return;
    for (const {segment: sentence} of sentences(value)) {
      const row = document.createElement('div');
      row.className = 'english-chunk-row';
      for (const [role, text] of annotate(sentence)) {
        const part = document.createElement('span');
        part.className = 'english-chunk';
        if (/状语/.test(role)) part.classList.add('english-chunk-adverbial');
        else if (/连词|从句/.test(role)) part.classList.add('english-chunk-clause');
        const label = document.createElement('small');
        label.textContent = role;
        const original = document.createElement('span');
        original.textContent = text;
        part.append(label, original);
        row.append(part);
      }
      output.append(row);
    }
  }
  let selected = '';
  open.addEventListener('pointerdown', () => {
    selected = window.getSelection()?.toString().trim() || '';
  });
  open.addEventListener('click', () => {
    const text = window.getSelection()?.toString().trim() || selected;
    selected = '';
    if (/[a-z]+\s+[a-z]+/i.test(text)) input.value = text.slice(0, input.maxLength);
    dialog.showModal();
    render();
  });
  dialog.querySelector('[data-chunk-run]').addEventListener('click', render);
  const textTargets = '.stem, #readBody .read-english, #readBody [data-read-question]';
  const attached = new WeakMap();
  function attach(target) {
    const text = target.textContent.trim();
    if (!/[a-z]+\s+[a-z]+/i.test(text) || attached.get(target)?.isConnected) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'english-chunk-context';
    button.textContent = '划分意群';
    button.setAttribute('aria-pressed', 'false');
    const hint = document.createElement('div');
    hint.className = 'english-chunk-hint english-chunk-explanation';
    hint.setAttribute('role', 'status');
    hint.hidden = true;
    let selection;
    button.addEventListener('pointerdown', () => {
      const range = window.getSelection();
      if (!range?.rangeCount || range.isCollapsed || !target.contains(range.anchorNode) || !target.contains(range.focusNode)) {
        selection = undefined;
        return;
      }
      const start = range.getRangeAt(0);
      const prefix = start.cloneRange();
      prefix.selectNodeContents(target);
      prefix.setEnd(start.startContainer, start.startOffset);
      selection = [prefix.toString().length, start.toString().length];
    });
    button.addEventListener('click', () => {
      if (button.getAttribute('aria-pressed') === 'true') {
        for (const mark of target.querySelectorAll('.english-inline-chunk')) mark.replaceWith(...mark.childNodes);
        target.normalize();
        hint.hidden = true;
        button.setAttribute('aria-pressed', 'false');
        button.textContent = '划分意群';
        return;
      }
      hint.hidden = true;
      const full = target.textContent;
      const [start, size] = selection || [0, full.length];
      selection = undefined;
      const text = full.slice(start, start + size);
      const key = target.closest('[data-reading-sentence-key]')?.dataset.readingSentenceKey;
      const source = window.READING_SENTENCE_DATA?.[key]?.chunks || [];
      let end = 0;
      const ranges = [];
      for (const chunk of source) {
        const offset = text.indexOf(chunk.en, end);
        if (offset < 0 || !chunk.en) continue;
        end = offset + chunk.en.length;
        ranges.push([offset + start, end + start, chunk.role]);
      }
      if (ranges.length < 2 || sentences(text).length > 1) {
        ranges.length = 0;
        for (const {segment, index} of sentences(text)) {
          let offset = start + index;
          for (const [role, value] of annotate(segment)) {
            ranges.push([offset, offset + value.length, role]);
            offset += value.length;
          }
        }
      }
      const adverbials = [
        [/\b(?:from books|in class|after school|before class|at the weekend|every (?:day|week|morning)|for example)\b/gi, '状语或插入语'],

        [/\b(?:effectively|seldom|often|usually|always|never|quickly|slowly|gradually|carefully|recently|yesterday|today|tomorrow|regularly)\b/gi, '副词作状语'],
        [/\b(?:step by step|little by little|in this way|by hand|on foot|at first|in the end)\b/gi, '方式或时间状语'],
        [/\b(?:on|during) (?:this|that|the) (?:festival|day|holiday|week|meeting)\b/gi, '时间状语'],
        [/\b(?:in|for|within|after) (?:a few|several|\d+) (?:minutes?|hours?|days?|weeks?|years?)\b/gi, '时间状语'],
        [/\b(?:by|before|after) (?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|noon|midnight)\b/gi, '时间状语'],
        [/\b(?:at (?:home|school|work)|in (?:the morning|the afternoon|the evening))\b/gi, '时间或地点状语'],
      ];
      adverbials.push(
        [/\b(?:during|before|after) (?:the |a |an |his |her |their )?(?:[\w’-]+ ){0,2}(?:class|lesson|exam|meeting|break|trip|holiday|ceremony|lecture|concert|dinner|lunch|breakfast)\b/gi, '时间状语'],
        [/\b(?:at|in|on) (?:the |a |an |our |their |his |her )?(?:[\w’-]+ ){0,2}(?:library|station|school|classroom|office|airport|park|hospital|campus|museum|street|kitchen|city)\b/gi, '地点状语'],
        [/\b(?:by (?:bus|train|car|bike|plane)|with great care|with confidence|without hesitation)\b/gi, '方式状语'],
        [/\b(?:to|in order to|so as to) (?:catch|help|improve|reduce|avoid|save|learn|support|protect|prepare|prevent|find|meet|get|reach)\b[^,.!?;]*/gi, '可能是目的'],
        [/\b(?:immediately|quietly|silently|hardly|nearly|frequently|successfully|together|alone|again|soon)\b/gi, '副词作状语']
      );
      for (const {segment, index} of sentences(text)) {
        for (const match of segment.matchAll(joiner)) {
          const after=segment.slice(match.index+match[0].length);
          if (startClause.test(after) || /^(?:the|a|an|my|our|their|those|these)\s+(?:[\w’-]+\s+){1,7}(?:is|are|was|were|has|have|will|would|can|could|must|should)\b/i.test(after)) {
            const at=start+index+match.index;
            ranges.push([at,at+match[1].length,'并列连词']);
          }
        }
      }
      for (const [pattern, role] of adverbials) {
        for (const match of text.matchAll(pattern)) {
          const from = start + match.index;
          const to = from + match[0].length;
          if (role === '可能是目的') {
            const before=text.slice(0,match.index).trimEnd();
            if (!/\b(?:ran|run|came|come|went|go|stayed|stay|stopped|stop|called|call|worked|work|studied|study|left|leave|hurried|hurry)(?:\s+(?:back|home|there|early|late|hard))?$/i.test(before)
                && !/^(?:in order to|so as to)\b/i.test(match[0])) continue;
          }
          if (ranges.some(([a,b,r]) => /状语|从句/.test(r) &&
            ((a === from && b <= to + 2 && b >= to) || (a < from && from < b && b < to) || (from < a && a < to && to < b)))) continue;
          ranges.push([from,to,role]);
        }
      }
      for (const {segment, index} of sentences(text)) {
        const add = (from,to,role) => ranges.push([start+index+from,start+index+to,role]);
        const structures = [
          [/\b(?:as|so)\s+(?:\w+\s+){1,4}as\b[^,.!?;]+/gi,'同级比较'],
          [/\b(?:rather than|instead of)\s+[^,.!?;]+/gi,'取舍结构'],
          [/\b(?:according to|because of|due to|in spite of|despite|thanks to)\s+[^,.!?;]+/gi,'原因或让步短语'],
          [/\b(?:every|each|last|next)\s+(?:day|week|month|year|morning|evening|night|summer|winter)\b/gi,'时间状语'],
          [/\b(?:at|around|before|after)\s+(?:\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?|o'clock)|sunrise|sunset)\b/gi,'时间状语'],
          [/\b(?:who|which|that)\s+(?:(?:wants?|wanted|needs?|needed|likes?|liked|lives?|lived|works?|worked|comes?|came)\s+)(?:(?!\b(?:is|are|was|were|has|have|must|can|will|should|would|could)\b)[^,.!?;])+?(?=\s+(?:is|are|was|were|has|have|must|can|will|should|would|could)\b)/gi,'定语从句'],
          [/\b(?:people|students|workers|children|man|woman|person|family|families)\s+((?:living|working|studying|standing|sitting)\s+(?:in|at|on|near|by)\s+(?:these|those|the|a|an|this|that)\s+[\w’'-]+(?:\s+(?:building|room|street|school|office|city|area))?)\b/gi,'分词后置修饰'],
          [/(?:^|[.!?]\s*)((?:Having\s+(?:been\s+)?[\w’'-]+|Born|Faced|Given|Seen|Seen from)\b[^,]+),/gi,'句首非谓语短语'],
          [/\b(?:in|on|at)\s+(?:the\s+)?(?:farm|Internet|table|floor|wall|meeting|conference|party|bus|train|room|garden)\b/gi,'时间或地点状语'],
          [/\b(?:one|two|three|four|five|\d+)\s+(?:hours?|minutes?|days?|weeks?)\s+(?:behind\s+[_\w-]+|later|earlier|ago)\b/gi,'时间状语'],
          [/\bbut\s+(?=[_]{2,}\s+of\s+them\b)/gi,'并列连词'],
          [/\b(?:feel|feels|felt|agree|agrees|agreed|hope|hopes|hoped|know|knows|knew|wonder|wondered|believe|believed|think|thought|said|says|say|asked|ask|remember|forgot)\s+((?:that|whether|if|why|how|what|where)\s+[^,.!?;]+)/gi,'宾语从句'],
          [/\b(?:happily|politely|suddenly|finally|especially|almost|already|still|even|rarely|sometimes|often|usually|always|never)\b/gi,'副词修饰'],
        ];
        for(const [pattern,role] of structures){
          for(const match of segment.matchAll(pattern)){
            const part=match[1]||match[0];
            const from=match.index+match[0].indexOf(part);
            add(from,from+part.length,role);
          }
        }
        const conditional=/\s+((?:because|unless|although|even though|provided that)\s+(?:I|you|he|she|it|we|they|there|the\s+\w+)\b[^,.!?;]+)/i.exec(segment);
        if(conditional){
          const from=conditional.index+conditional[0].indexOf(conditional[1]);
          add(from,from+conditional[1].length,'后置状语从句');
        }
        const comparison = /\bthan\s+[^.!?;,]+/i.exec(segment);
        if (!comparison) continue;
        const base = start + index;
        const from = base + comparison.index;
        ranges.push([from, from + comparison[0].length, '比较对象']);
        for (const match of segment.matchAll(/\bof\s+(?:(?:my|your|his|her|our|their|the|a|an)\s+)?[\w’'-]+(?:\s+[\w’'-]+){0,2}(?=\s+(?:is|are|was|were|has|have|will|can)\b|[,.!?;]|\s*$)/gi)) {
          ranges.push([base+match.index,base+match.index+match[0].length,'of 短语']);
        }
      }
      const candidates = ranges.filter(([, , role]) =>
        /状语|从句|并列连词|可能是目的|比较对象|of 短语|同级比较|取舍结构|原因或让步短语|副词修饰|分词后置修饰|句首非谓语短语/.test(role)
      ).map(([from, to, role]) => {
        const value = full.slice(from, to);
        return [from + value.length - value.trimStart().length, from + value.trimEnd().length, role];
      });
      const brackets = [];
      for (const [from,to,role] of candidates) {
        const end=from+full.slice(from,to).replace(/[\s,.!?;]+$/,'').length;
        if(end<=from || brackets.some(([a,b])=>(a===from&&b===end)||(a<from&&from<b&&b<end)||(from<a&&a<end&&end<b)))continue;
        brackets.push([from,end,role]);
      }
      const walker = document.createTreeWalker(target, NodeFilter.SHOW_TEXT);
      const nodes = [];
      let cursor = 0;
      while (walker.nextNode()) {
        const node = walker.currentNode;
        nodes.push([node, cursor]);
        cursor += node.length;
      }
      const positions = new Map();
      for (const [from, to, role] of brackets) {
        if (from >= to) continue;
        if (!positions.has(from)) positions.set(from, {open: 0, close: 0, roles: []});
        if (!positions.has(to)) positions.set(to, {open: 0, close: 0, roles: []});
        positions.get(from).open++;
        positions.get(from).roles.push(role);
        positions.get(to).close++;
      }
      if (!positions.size) {
        hint.textContent = '这句暂未识别出可以单独划的结构。可以先找谓语，再看有没有说明时间、地点、方式的部分。';
        hint.hidden = false;
        return;
      }
      const boundaries = [...positions.keys()];
      for (const [node, offset] of nodes) {
        const stop = offset + node.length;
        const cuts = [...new Set([offset, stop, ...boundaries.filter(x => x > offset && x < stop)])].sort((a,b) => a-b);
        for (let i = cuts.length - 2; i >= 0; i--) {
          const from = cuts[i], to = cuts[i + 1];
          const opening = positions.get(from);
          const closing = positions.get(to);
          if (!opening?.open && !closing?.close) continue;
          node.splitText(to - offset);
          const part = node.splitText(from - offset);
          const mark = document.createElement('span');
          mark.className = 'english-inline-chunk';
          if (opening?.open) {
            mark.dataset.open = '（'.repeat(opening.open);
            mark.title = opening.roles.join('、');
          }
          if (closing?.close) mark.dataset.close = '）'.repeat(closing.close);
          part.replaceWith(mark);
          mark.append(part);
        }
      }
      button.setAttribute('aria-pressed', 'true');
      button.textContent = '收起意群';
      const explain = role => role === '分词后置修饰' ? '分词短语放在名词后，说明是哪一类人或事物'
        : role === '句首非谓语短语' ? '先给出背景，再找逗号后的主语和谓语'
        : role === '同级比较' ? '用 as…as 比较程度，否定时也常见 not so…as'
        : role === '取舍结构' ? '表示选择前面的做法，舍去后面的做法'
        : role === '原因或让步短语' ? '介词结构，结合开头判断是说明原因还是让步'
        : role === '宾语从句' ? '整个从句回答前面动词所说、所想或所问的内容'
        : role === '副词修饰' ? '看它修饰哪个词，可表示频率、程度或方式'
        : role === '比较对象' ? 'than 引出拿来比较的另一边，注意两边比的是同一类事物'
        : role === 'of 短语' ? '说明前面的事物属于谁或和什么有关'
        : /并列/.test(role) ? '连接两边各有主语和谓语的分句'
        : /定语/.test(role) ? '补充说明前面的名词或代词'
        : /时间/.test(role) && !/方式|地点/.test(role) ? '说明什么时候、持续多久或何时截止'
        : /地点/.test(role) && !/时间/.test(role) ? '说明动作发生在哪里'
        : /方式/.test(role) && !/时间/.test(role) ? '说明动作是怎么做的'
        : /目的/.test(role) ? '说明做前面这件事的目的，可试译为「为了……」'
        : /对比/.test(role) ? '把两种情况放在一起对照'
        : /从句/.test(role) ? '给主句补充时间、条件、原因或让步'
        : '补充说明动作的时间、频率或方式';
      const list=document.createElement('ul');
      for(const [from,to,role] of brackets.sort((a,b)=>a[0]-b[0])){
        const item=document.createElement('li');
        const phrase=document.createElement('strong');
        phrase.textContent=full.slice(from,to);
        item.append(phrase,' · '+explain(role));
        list.append(item);
      }
      hint.replaceChildren(list);
      hint.hidden=false;
    });
    target.after(button, hint);
    attached.set(target, button);
  }
  document.querySelectorAll(textTargets).forEach(attach);
  new MutationObserver(records => {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (node instanceof Element) {
          if (node.matches(textTargets)) attach(node);
          node.querySelectorAll(textTargets).forEach(attach);
        }
      }
    }
  }).observe(document.body, {childList: true, subtree: true});
})();
