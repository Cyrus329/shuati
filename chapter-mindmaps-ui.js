(() => {
  'use strict';

  function el(tag, text = '', className = '') {
    const node = document.createElement(tag);
    node.textContent = text;
    node.className = className;
    return node;
  }

  function branch(data, depth = 0, math = false) {
    const item = el('li', '', 'mm-branch');
    if (!data.children.length) {
      const leaf = el('span', data.title, 'mm-node mm-leaf');
      if (math && window.MathNotation) {
        leaf.innerHTML = window.MathNotation.html('数学', data.title);
      }
      item.append(leaf);
      return item;
    }
    const button = el('button', data.title, 'mm-node mm-level-' + depth);
    button.type = 'button';
    const list = el('ul', '', 'mm-children');
    function toggle(open) {
      button.setAttribute('aria-expanded', String(open));
      list.hidden = !open;
      if (open && !list.childElementCount) {
        list.append(...data.children.map(child => branch(child, depth + 1, math)));
        if (math && depth > 0) window.MathNotation?.typeset(list);
      }
    }
    button.onclick = () => toggle(list.hidden);
    item.append(button, list);
    toggle(depth === 0);
    return item;
  }

  function mount(host, subject) {
    const maps = window.JOURNAL_MINDMAPS;
    if (!maps?.length) return;
    const panel = el('details');
    panel.id = 'journalMindmaps';
    panel.append(el('summary', '知识点思维导图'));
    panel.addEventListener('toggle', () => {
      if (!panel.open || panel.childElementCount > 1) return;
      const tabs = el('div', '', 'mm-tabs');
      tabs.setAttribute('role', 'group');
      tabs.setAttribute('aria-label', '导图章节');
      const canvas = el('div', '', 'mm-canvas');
      canvas.tabIndex = 0;
      canvas.setAttribute('role', 'region');
      canvas.setAttribute('aria-label', '思维导图，可横向滚动');
      const guide = el('p', '', 'mm-guide');
      function show(index) {
        const map = maps[index];
        [...tabs.children].forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
        guide.textContent = map.note;
        const tree = el('ul', '', 'mm-tree');
        tree.append(branch(map, 0, map.title.startsWith('数学')));
        canvas.replaceChildren(tree);
        canvas.scrollLeft = canvas.scrollTop = 0;
      }
      maps.forEach((map, index) => {
        const button = el('button', map.title);
        button.type = 'button';
        button.onclick = () => show(index);
        tabs.append(button);
      });
      panel.append(tabs, guide, canvas);
      show(Math.max(0, maps.findIndex(map => map.title.startsWith(subject === '高等数学' ? '数学' : subject))));
    });
    host.querySelector('.learn-book-heading').after(panel);
  }

  window.JournalMindmaps = {mount};
})();
