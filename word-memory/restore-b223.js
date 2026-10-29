(() => {
  const init = () => {
    if (!window.WordMemoryApp || typeof window.setFocusVocabularyKind !== "function") { setTimeout(init, 50); return; }
    document.querySelectorAll('[data-focus-vocab-select]').forEach(select => {
      select.value = focusVocabularyKind;
      select.addEventListener('change', () => setFocusVocabularyKind(select.value));
    });
    document.querySelector('#focusGroupProgress')?.addEventListener('click', event => {
      const button = event.target.closest('[data-focus-kind-open]');
      if (!button) return;
      setFocusVocabularyKind(button.dataset.focusKindOpen);
      document.querySelector('#mobileFocusEntry')?.click();
    });
    const history = document.getElementById('mobileFocusHistory');
    for (const [id,css,label] of [['mobileFocusHistoryMaskEnglish','mask-english','英文'],['mobileFocusHistoryMaskChinese','mask-chinese','中文']]) {
      document.getElementById(id)?.addEventListener('click', event => {
        const hidden = history.classList.toggle(css);
        event.currentTarget.textContent = (hidden ? '显示' : '遮住') + label;
        event.currentTarget.setAttribute('aria-pressed', String(hidden));
      });
    }
    renderGroupProgress();
  };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true}); else init();
})();
