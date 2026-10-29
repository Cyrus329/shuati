// v70 B112 2026-08-27：英文词条缺失音标已全量补齐；一屏一词不再用“点击发音按钮听读”冒充音标。
(function (root, factory) {
  const api = factory();

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  } else {
    root.MobileFocus = api;
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const MAX_GESTURE_ELAPSED_MS = 1400;
  const MIN_HORIZONTAL_SWIPE_PX = 64;
  const HORIZONTAL_DOMINANCE_RATIO = 1.25;
  const MEDIUM_TERM_LENGTH_THRESHOLD = 11;
  const LONG_TERM_LENGTH_THRESHOLD = 18;

  function classifyGesture({ dx, dy, elapsed }) {
    const horizontalDistance = Math.abs(dx);
    const verticalDistance = Math.abs(dy);

    if (
      elapsed > MAX_GESTURE_ELAPSED_MS
      || horizontalDistance < MIN_HORIZONTAL_SWIPE_PX
      || horizontalDistance <= verticalDistance * HORIZONTAL_DOMINANCE_RATIO
    ) {
      return 'none';
    }

    return dx < 0 ? 'next' : 'previous';
  }

  function termSizeClass(term) {
    const length = String(term || '').length;

    if (length > LONG_TERM_LENGTH_THRESHOLD) return 'long';
    if (length > MEDIUM_TERM_LENGTH_THRESHOLD) return 'medium';
    return 'normal';
  }

  function moveIndex(index, delta, total) {
    if (total <= 0) return 0;
    return Math.min(Math.max(index + delta, 0), total - 1);
  }

  function createController(adapter = {}) {
    const elements = adapter.elements || {};
    const environment = adapter.env || {};
    const windowObject = environment.window
      || (typeof window !== 'undefined' ? window : null);
    const documentObject = environment.document
      || (typeof document !== 'undefined' ? document : null);
    const historyObject = environment.history
      || windowObject?.history
      || (typeof history !== 'undefined' ? history : null);
    const timers = environment.timers || windowObject || globalThis;
    const now = typeof environment.now === 'function' ? environment.now : Date.now;
    const session = {
      active: false,
      ids: [],
      index: 0,
      revealed: false,
      locked: false,
      pointer: null,
      suppressClickUntil: 0,
      previous: null,
      mode: 'recall',
      spellingDraft: '',
      spellingResult: null,
      chopping: false,
      choppingReturnMode: 'recall',
      choiceOptions: [],
      choiceResult: null,
      choiceWordId: null,
      autoSpokenId: null,
      questionStartedAt: now(),
    };
    let historyPushed = false;
    let bound = false;
    let pendingAdvanceTimer = null;
    let sessionGeneration = 0;

    function listen(element, type, listener) {
      element?.addEventListener?.(type, listener);
    }

    function setRatingLocked(locked) {
      session.locked = Boolean(locked);
      elements.ratingButtons?.forEach?.((button) => { button.disabled = session.locked; });
      elements.choiceButtons?.forEach?.((button) => {
        button.disabled = session.locked || Boolean(session.choiceResult);
      });
    }

    function cancelPendingAdvance() {
      sessionGeneration += 1;
      if (pendingAdvanceTimer !== null) {
        timers.clearTimeout?.(pendingAdvanceTimer);
        pendingAdvanceTimer = null;
      }
      setRatingLocked(false);
    }

    function currentId() {
      return session.ids[session.index] || null;
    }

    function currentWord() {
      while (session.index < session.ids.length) {
        const id = currentId();
        const word = id && typeof adapter.getWord === 'function' ? adapter.getWord(id) : null;
        if (word) return word;
        session.index += 1;
      }
      return null;
    }

    function refreshQueue(preferredId = null) {
      const oldId = currentId();
      const queued = typeof adapter.queue === 'function' ? adapter.queue() : [];
      session.ids = Array.isArray(queued)
        ? queued.map((item) => (typeof item === 'string' ? item : item?.id)).filter(Boolean)
        : [];
      const targetId = preferredId || (typeof adapter.activeId === 'function' ? adapter.activeId() : null) || oldId;
      const targetIndex = targetId ? session.ids.indexOf(targetId) : -1;
      session.index = targetIndex >= 0
        ? targetIndex
        : Math.min(Math.max(session.index, 0), Math.max(0, session.ids.length - 1));
      const selectedId = currentId();
      if (selectedId && typeof adapter.select === 'function') adapter.select(selectedId);
      return selectedId;
    }

    function resetSpellingState(options = {}) {
      session.spellingDraft = '';
      session.spellingResult = null;
      if (elements.spellingInput) elements.spellingInput.value = '';
      if (elements.spellingFeedback) {
        elements.spellingFeedback.textContent = '';
        elements.spellingFeedback.classList?.remove?.('is-correct', 'is-wrong');
      }
      if (!options.keepReveal) setExpanded(false);
    }

    function resetChoiceState() {
      session.choiceOptions = [];
      session.choiceResult = null;
      session.choiceWordId = null;
      if (elements.choiceFeedback) {
        elements.choiceFeedback.textContent = '';
        elements.choiceFeedback.classList?.remove?.('is-correct', 'is-wrong');
      }
      elements.choiceButtons?.forEach?.((button) => {
        button.disabled = false;
        button.textContent = '';
        button.classList?.remove?.('is-correct', 'is-wrong', 'is-selected');
      });
    }

    function resetQuestionState(options = {}) {
      resetSpellingState(options);
      resetChoiceState();
      session.questionStartedAt = now();
    }

    function setMode(mode) {
      if (session.locked) return;
      const nextMode = ['recall', 'choice', 'choiceReverse', 'spelling'].includes(mode) ? mode : 'recall';
      if (session.mode === nextMode) return;
      session.mode = nextMode;
      session.chopping = false;
      resetQuestionState();
      render();
      if (session.mode === 'spelling' && currentWord()) {
        timers.setTimeout?.(() => elements.spellingInput?.focus?.(), 0);
      } else if (['choice', 'choiceReverse'].includes(session.mode) && currentWord()) {
        timers.setTimeout?.(() => elements.choiceButtons?.[0]?.focus?.(), 0);
      } else {
        elements.card?.focus?.();
      }
    }

    function normalizedSpelling(value) {
      return String(value || '')
        .toLowerCase()
        .replace(/[’‘`]/g, "'")
        .replace(/[^a-z0-9'\s-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }

    function checkSpelling() {
      if (!session.active || session.locked || session.mode !== 'spelling') return;
      const word = currentWord();
      if (!word) return;
      const input = elements.spellingInput?.value ?? session.spellingDraft;
      session.spellingDraft = String(input || '');
      const correct = typeof adapter.checkSpelling === 'function'
        ? Boolean(adapter.checkSpelling(session.spellingDraft, word))
        : normalizedSpelling(session.spellingDraft) === normalizedSpelling(word.term);
      const firstCorrect = correct && !session.spellingResult?.correct;
      session.spellingResult = { correct };
      if (firstCorrect) adapter.autoSpeak?.(word);
      if (session.chopping && correct) {
        adapter.chop?.(String(word.id));
        session.chopping = false;
        session.mode = session.choppingReturnMode;
        move(1);
        return;
      }
      setExpanded(true);
      render();
      elements.spellingInput?.focus?.();
    }

    function normalizedMeaning(value) {
      const text = value && typeof value === 'object' ? value.meaning : value;
      return String(text || '').replace(/\s+/g, ' ').trim().toLowerCase();
    }

    function ensureChoiceOptions(word, correctLabel, direction = 'enToZh') {
      if (session.choiceWordId === word.id && session.choiceOptions.length === 4) return session.choiceOptions;
      const supplied = typeof adapter.choiceOptions === 'function' ? adapter.choiceOptions(word, direction) : [];
      const unique = [];
      const seen = new Set();
      [...(Array.isArray(supplied) ? supplied : []), { meaning: correctLabel, wordId: word.id }].forEach((item) => {
        const option = item && typeof item === 'object'
          ? { meaning: String(item.meaning || '').trim(), wordId: String(item.wordId || '') }
          : { meaning: String(item || '').trim(), wordId: '' };
        const key = normalizedMeaning(option.meaning);
        if (!option.meaning || seen.has(key)) return;
        seen.add(key);
        unique.push(option);
      });
      const fillers = direction === 'zhToEn'
        ? ['unrelated answer', 'unknown word', 'no matching word']
        : ['未掌握该词义', '与本词无关的释义', '暂无对应释义'];
      fillers.forEach((item) => {
        if (unique.length < 4 && !seen.has(normalizedMeaning(item))) {
          seen.add(normalizedMeaning(item));
          unique.push({ meaning: item, wordId: '' });
        }
      });
      session.choiceOptions = unique.slice(0, 4);
      session.choiceWordId = word.id;
      session.choiceResult = null;
      return session.choiceOptions;
    }

    function selectChoice(index) {
      if (!session.active || session.locked || !['choice', 'choiceReverse'].includes(session.mode) || session.choiceResult) return;
      const word = currentWord();
      if (!word) return;
      const view = typeof adapter.view === 'function' ? (adapter.view(word) || {}) : word;
      const reverse = session.mode === 'choiceReverse';
      const correctLabel = reverse ? String(view.term || word.term || '') : String(view.answer || word.meaning || '未填中文');
      const options = ensureChoiceOptions(word, correctLabel, reverse ? 'zhToEn' : 'enToZh');
      const selectedIndex = Number(index);
      if (!Number.isInteger(selectedIndex) || selectedIndex < 0 || selectedIndex >= options.length) return;
      const correctIndex = options.findIndex((item) => normalizedMeaning(item.meaning) === normalizedMeaning(correctLabel));
      const correct = selectedIndex === correctIndex;
      session.choiceResult = {
        selectedIndex,
        correctIndex,
        correct,
        selectedWordId: options[selectedIndex]?.wordId || '',
      };
      setExpanded(true);
      setRatingLocked(true);
      render();

      const generation = sessionGeneration;
      pendingAdvanceTimer = timers.setTimeout(() => {
        if (!session.active || generation !== sessionGeneration) return;
        pendingAdvanceTimer = null;
        setRatingLocked(false);
        rate(correct ? 'remember' : 'forgot');
      }, 650);
    }

    function setExpanded(revealed) {
      session.revealed = Boolean(revealed);
      if (elements.answer) elements.answer.hidden = !session.revealed;
      elements.card?.setAttribute?.('aria-expanded', String(session.revealed));
    }

    function setProgress(current, total) {
      const percent = total > 0 ? Math.round((current / total) * 100) : 0;
      if (elements.count) elements.count.textContent = `${current} / ${total}`;
      elements.progress?.setAttribute?.('aria-valuemin', '0');
      elements.progress?.setAttribute?.('aria-valuemax', '100');
      elements.progress?.setAttribute?.('aria-valuenow', String(percent));
      if (elements.progressFill?.style) elements.progressFill.style.width = `${percent}%`;
    }

    function renderPrevious() {
      const previous = session.previous;
      if (!previous) {
        if (elements.previous) elements.previous.hidden = true;
        if (elements.previousTerm) elements.previousTerm.textContent = '';
        if (elements.previousMeaning) elements.previousMeaning.textContent = '';
        return;
      }

      if (elements.previousTerm) elements.previousTerm.textContent = previous.term;
      if (elements.previousMeaning) elements.previousMeaning.textContent = previous.meaning;
      if (elements.previous) elements.previous.hidden = false;
    }

    function renderEmpty(total) {
      const completed = total > 0 ? total : 0;
      setProgress(completed, total);
      if (elements.card) elements.card.hidden = true;
      if (elements.actions) elements.actions.hidden = true;
      if (elements.navigate) elements.navigate.hidden = true;
      if (elements.empty) elements.empty.hidden = false;
      if (elements.spelling) elements.spelling.hidden = true;
      if (elements.choice) elements.choice.hidden = true;
      if (elements.completeTitle && elements.completeText && elements.completeActions) {
        let copy;
        if (!session.ids.length) {
          copy = {title:'今日任务已完成',text:'你可以查看已练记录，或等待到期后在专注模式复习。',first:'退出专注模式',firstAction:'close',second:'退出',secondAction:'close'};
        } else if (session.mode === 'recall') {
          copy = { title:`本组 ${session.ids.length} 条已看完`, text:'现在做一次英文选中文，检查是否真的记住；也可以先跳过，继续下一组。', first:'开始英文选中文', firstAction:'choice', second:'先不测，下一组', secondAction:'next' };
        } else if (session.mode === 'choice') {
          copy = { title:'英文选中文完成', text:'接着做同一组的中文选英文，再决定要不要拼写。', first:'开始中文选英文', firstAction:'choiceReverse', second:'先不测，下一组', secondAction:'next' };
        } else if (session.mode === 'choiceReverse') {
          copy = { title:'本组中英文选择完成', text:'中文选英文已写入艾宾浩斯复习。要不要再拼写这一组？', first:'继续拼写这一组', firstAction:'spelling', second:'不拼写，下一组', secondAction:'next' };
        } else {
          copy = { title:'本组拼写完成', text:'这一组的拼写练习已结束。可以继续下一组，或退出休息。', first:'下一组', firstAction:'next', second:'退出专注模式', secondAction:'close' };
        }
        elements.completeTitle.textContent = copy.title;
        elements.completeText.textContent = copy.text;
        elements.completeActions.innerHTML = `<button type="button" data-mobile-focus-complete="${copy.firstAction}">${copy.first}</button><button type="button" data-mobile-focus-complete="${copy.secondAction}" class="secondary-button">${copy.second}</button>`;
      }
      setExpanded(false);
    }

    function render() {
      const total = session.ids.length;
      const word = currentWord();

      if (elements.title && typeof adapter.title === 'function') {
        elements.title.textContent = String(adapter.title() || '');
      }
      if (elements.source && typeof adapter.source === 'function') {
        elements.source.textContent = String(adapter.source() || '');
      }
      if (elements.groupStatus && typeof adapter.groupStatus === 'function') {
        elements.groupStatus.textContent = String(adapter.groupStatus() || '');
      }
      renderPrevious();

      if (!word) {
        renderEmpty(total);
        return;
      }

      const view = typeof adapter.view === 'function' ? (adapter.view(word) || {}) : word;
      if (elements.card) elements.card.hidden = false;
      if (elements.actions) elements.actions.hidden = true;
      if (elements.navigate) elements.navigate.hidden = false;
      if (elements.empty) elements.empty.hidden = true;
      setProgress(session.index + 1, total);
      if (elements.previousButton) elements.previousButton.disabled = session.index <= 0;
      if (elements.nextButton) elements.nextButton.textContent = session.index >= total - 1 ? '完成本组 →' : '下一个 →';

      const englishTerm = String(view.term || word.term || '');
      const chineseMeaning = String(view.answer || word.meaning || '未填中文');
      const spellingMode = session.mode === 'spelling';
      const reverseChoiceMode = session.mode === 'choiceReverse';
      const choiceMode = session.mode === 'choice' || reverseChoiceMode;
      const displayTerm = spellingMode || reverseChoiceMode ? chineseMeaning : englishTerm;

      elements.modeButtons?.forEach?.((button) => {
        const active = button.dataset?.mobileFocusMode === session.mode;
        button.classList?.toggle?.('is-active', active);
        button.setAttribute?.('aria-pressed', String(active));
      });
      if (elements.kicker) {
        elements.kicker.textContent = spellingMode
          ? '看中文，拼写英文'
          : (reverseChoiceMode ? '第 3 步 · 看中文，选择英文' : (choiceMode ? '第 2 步 · 看英文，选择中文' : '第 1 步 · 完整看词'));
      }
      if (elements.tip) {
        elements.tip.textContent = spellingMode
          ? '第一次 Enter 检查；拼对后再按一次记住，拼错后再按一次忘了'
          : (choiceMode
            ? '选择答案后自动判定；按 1—4 或 A—D 也可作答'
            : '中文释义已直接显示；看完后点“下一个”。');
      }

      if (elements.term) {
        elements.term.textContent = displayTerm;
        elements.term.classList?.remove?.('normal', 'medium', 'long', 'is-chinese-prompt');
        elements.term.classList?.add?.(termSizeClass(displayTerm));
        if (spellingMode) elements.term.classList?.add?.('is-chinese-prompt');
      }
      if (elements.phonetic) {
        elements.phonetic.hidden = spellingMode || reverseChoiceMode;
        elements.phonetic.textContent = spellingMode || reverseChoiceMode ? '' : String(view.phonetic || '');
      }
      if (elements.audio) {
        elements.audio.hidden = spellingMode && !session.spellingResult;
      }
      if (elements.spelling) {
        elements.spelling.hidden = !spellingMode;
      }
      if (elements.chop) elements.chop.hidden = spellingMode || Boolean(adapter.isChopped?.(String(word.id)));
      if (elements.skipSpelling) elements.skipSpelling.hidden = !spellingMode || !adapter.isDueSession?.();
      if (elements.choice) {
        elements.choice.hidden = !choiceMode;
      }
      if (elements.spellingInput && spellingMode && elements.spellingInput.value !== session.spellingDraft) {
        elements.spellingInput.value = session.spellingDraft;
      }

      if (spellingMode) {
        const result = session.spellingResult;
        if (elements.spellingFeedback) {
          elements.spellingFeedback.classList?.remove?.('is-correct', 'is-wrong');
          if (!result) {
            elements.spellingFeedback.textContent = '';
          } else if (result.correct) {
            elements.spellingFeedback.textContent = '拼写正确。再按一次 Enter，直接记住并进入下一个。';
            elements.spellingFeedback.classList?.add?.('is-correct');
          } else {
            elements.spellingFeedback.textContent = session.chopping ? '还没拼对，请修改后再检查；拼对才会斩词。' : `拼写错误。正确答案：${englishTerm}。再按一次 Enter，记为忘了。`;
            elements.spellingFeedback.classList?.add?.('is-wrong');
          }
        }
        if (elements.meaning) {
          elements.meaning.textContent = session.spellingResult ? `正确拼写：${englishTerm}` : '';
        }
        if (elements.detail) {
          elements.detail.textContent = session.spellingResult
            ? [view.example].filter(Boolean).join(' · ')
            : '';
        }
        if (session.chopping && result && !result.correct) {
          elements.meaning.textContent = '';
          elements.detail.textContent = '';
        }
        setExpanded(Boolean(session.spellingResult) && !session.chopping);
      } else if (choiceMode) {
        const correctLabel = reverseChoiceMode ? englishTerm : chineseMeaning;
        const options = ensureChoiceOptions(word, correctLabel, reverseChoiceMode ? 'zhToEn' : 'enToZh');
        const result = session.choiceResult;
        elements.choiceButtons?.forEach?.((button, index) => {
          const option = options[index] || { meaning: '' };
          button.textContent = option.meaning ? `${String.fromCharCode(65 + index)}. ${option.meaning}` : '';
          button.hidden = !option.meaning;
          button.disabled = session.locked || Boolean(result);
          button.classList?.remove?.('is-correct', 'is-wrong', 'is-selected');
          if (result && index === result.correctIndex) button.classList?.add?.('is-correct');
          if (result && index === result.selectedIndex) {
            button.classList?.add?.('is-selected');
            if (!result.correct) button.classList?.add?.('is-wrong');
          }
        });
        if (elements.choiceFeedback) {
          elements.choiceFeedback.classList?.remove?.('is-correct', 'is-wrong');
          if (!result) {
            elements.choiceFeedback.textContent = '';
          } else if (result.correct) {
            elements.choiceFeedback.textContent = reverseChoiceMode ? '选择正确，已写入学习进度。' : '选择正确，继续下一词。';
            elements.choiceFeedback.classList?.add?.('is-correct');
          } else {
            elements.choiceFeedback.textContent = `选择错误，正确答案：${correctLabel}。`;
            elements.choiceFeedback.classList?.add?.('is-wrong');
          }
        }
        if (elements.meaning) elements.meaning.textContent = result ? `正确答案：${correctLabel}` : '';
        if (elements.detail) elements.detail.textContent = result ? String(view.example || '') : '';
        setExpanded(Boolean(result));
      } else {
        if (typeof adapter.renderAnswer === 'function') {
          adapter.renderAnswer(view, {
            answer: elements.answer,
            meaning: elements.meaning,
            detail: elements.detail,
          }, word);
        } else {
          if (elements.meaning) elements.meaning.textContent = chineseMeaning;
          if (elements.detail) elements.detail.textContent = String(view.example || '');
        }
        // 十词首轮是“完整看词”，不再把中文或资料藏在点击卡片之后。
        session.revealed = true;
        setExpanded(true);
      }
      // 自动播放始终绑定“此刻正在显示”的词；不复用上一个词，也不在选择/拼写阶段乱播。
      if (!spellingMode && !choiceMode && currentId() && session.autoSpokenId !== currentId()) {
        session.autoSpokenId = currentId();
        adapter.autoSpeak?.(word);
      }
    }

    function toggleReveal() {
      // 保留函数供旧事件调用；首轮完整内容始终可见。
      if (!session.active || !currentWord() || session.locked || session.mode !== 'recall') return;
      session.revealed = true;
      setExpanded(true);
    }

    function move(delta) {
      if (!session.active || session.locked || !session.ids.length) return;
      adapter.stopAudio?.();
      // 学习阶段右滑最后一个词后进入“本组完成”；不能在第10词原地打转。
      session.index = delta > 0 && session.index >= session.ids.length - 1
        ? session.ids.length
        : moveIndex(session.index, delta, session.ids.length);
      if (currentId() && typeof adapter.select === 'function') adapter.select(currentId());
      resetQuestionState();
      setExpanded(false);
      render();
    }

    function restartGroup(mode) {
      session.index = 0;
      session.previous = null;
      session.mode = mode;
      cancelPendingAdvance();
      resetQuestionState();
      setExpanded(false);
      render();
      if (mode === 'spelling') timers.setTimeout?.(() => elements.spellingInput?.focus?.(), 0);
    }

    function completeAction(action) {
      if (!session.active) return;
      if (session.mode === 'recall' && (action === 'choice' || action === 'next')) {
        adapter.completeGroup?.(session.ids.slice());
      }
      if (action === 'choice') return restartGroup('choice');
      if (action === 'choiceReverse') return restartGroup('choiceReverse');
      if (action === 'spelling') return restartGroup('spelling');
      if (action === 'close') return close();
      if (action === 'next') {
        if (adapter.nextGroup?.() === false) return close();
        session.index = 0; session.previous = null; session.mode = 'recall';
        refreshQueue(null); resetQuestionState(); setExpanded(false); render();
        elements.card?.focus?.();
      }
    }

    async function rate(result) {
      if (
        !session.active
        || session.locked
        || !['forgot', 'fuzzy', 'remember'].includes(result)
      ) return;
      const id = currentId();
      const word = currentWord();
      if (!id || !word) return;

      setRatingLocked(true);
      try {
        const ratingGeneration = sessionGeneration;
        const rateHandler = session.mode === 'choice' && typeof adapter.ratePreview === 'function'
          ? adapter.ratePreview
          : (session.mode === 'spelling' && typeof adapter.rateSpelling === 'function' ? adapter.rateSpelling : adapter.rate);
        const outcome = rateHandler?.(id, result, {
          mode: session.mode,
          responseMs: Math.max(0, now() - Number(session.questionStartedAt || now())),
          choiceCorrect: session.choiceResult?.correct,
          spellingCorrect: session.spellingResult?.correct,
          spellingInput: session.spellingDraft,
          confusedWithId: session.choiceResult?.correct ? '' : (session.choiceResult?.selectedWordId || ''),
        });
        const accepted = outcome && typeof outcome.then === 'function' ? await outcome : outcome;
        if (!session.active || ratingGeneration !== sessionGeneration) return;
        if (accepted === false) { setRatingLocked(false); render(); return; }
      } catch (error) {
        setRatingLocked(false);
        throw error;
      }

      const view = typeof adapter.view === 'function' ? (adapter.view(word) || {}) : word;
      session.previous = {
        id,
        term: String(view.term || word.term || ''),
        meaning: String(view.answer || word.meaning || '未填释义'),
      };
      renderPrevious();


      const generation = sessionGeneration;
      resetSpellingState({ keepReveal: true });
      pendingAdvanceTimer = timers.setTimeout(() => {
        if (!session.active || generation !== sessionGeneration) return;
        pendingAdvanceTimer = null;
        // 十词专注的题序是本组固定顺序。不能每答一题又回读普通卡片的 activeId，
        // 否则外部当前卡片若恰好在第10词，就会从第1题直接跳到最后一题。
        const shouldSyncQueue = Boolean(adapter.syncQueueAfterRate?.({ id, result, mode: session.mode }));
        if (shouldSyncQueue) {
          const sharedActiveId = typeof adapter.activeId === 'function' ? adapter.activeId() : null;
          if (sharedActiveId && session.ids.includes(String(sharedActiveId))) refreshQueue(sharedActiveId);
          else session.index = Math.min(session.index + 1, session.ids.length);
        } else {
          session.index = Math.min(session.index + 1, session.ids.length);
        }
        setRatingLocked(false);
        resetQuestionState();
        setExpanded(false);
        render();
      }, 220);
    }

    function open() {
      if (session.active) return;
      adapter.stopAudio?.();
      cancelPendingAdvance();
      session.active = true;
      session.index = 0;
      refreshQueue(typeof adapter.activeId === 'function' ? adapter.activeId() : null);
      session.pointer = null;
      session.suppressClickUntil = 0;
      session.autoSpokenId = null;
      session.previous = null;
      session.mode = 'recall';
      resetQuestionState();
      renderPrevious();
      setExpanded(false);
      if (elements.root) elements.root.hidden = false;
      documentObject?.body?.classList?.add?.('mobile-focus-active');
      try {
        historyObject?.pushState?.({ mobileFocus: true }, '', '#mobile-focus');
        historyPushed = Boolean(historyObject?.pushState);
      } catch {
        historyPushed = false;
      }
      render();
      if (currentWord()) {
        elements.card?.focus?.();
      } else {
        elements.exit?.focus?.();
      }
    }

    function close(options = {}) {
      const fromPopState = Boolean(options.fromPopState);
      if (!session.active) return;
      adapter.stopAudio?.();
      adapter.cancelPendingRating?.();
      cancelPendingAdvance();
      if (currentId() && typeof adapter.select === 'function') adapter.select(currentId());
      session.active = false;
      session.pointer = null;
      resetQuestionState();
      setExpanded(false);
      if (elements.root) elements.root.hidden = true;
      documentObject?.body?.classList?.remove?.('mobile-focus-active');
      adapter.onClose?.();
      if (historyPushed && !fromPopState) {
        historyPushed = false;
        historyObject?.back?.();
      } else if (fromPopState) {
        historyPushed = false;
      }
      elements.entry?.focus?.();
    }

    function restart() {
      if (!session.active) return;
      adapter.stopAudio?.();
      cancelPendingAdvance();
      session.index = 0;
      session.previous = null;
      session.autoSpokenId = null;
      session.mode = 'recall';
      refreshQueue(null);
      resetQuestionState();
      setExpanded(false);
      render();
      if (currentWord()) elements.card?.focus?.();
    }

    function bind() {
      if (bound) return;
      bound = true;
      listen(elements.entry, 'click', open);
      listen(elements.exit, 'click', () => close());
      listen(elements.previousButton, 'click', () => move(-1));
      listen(elements.nextButton, 'click', () => move(1));
      listen(elements.card, 'click', (event) => {
        if (session.mode !== 'recall' || event?.target === elements.audio || now() <= session.suppressClickUntil) return;
        toggleReveal();
      });
      listen(elements.card, 'keydown', (event) => {
        if (event?.target && event.target !== elements.card) return;
        if (event?.key !== 'Enter' && event?.key !== ' ') return;
        event.preventDefault?.();
        toggleReveal();
      });
      listen(elements.audio, 'click', (event) => {
        event.stopPropagation?.();
        const word = currentWord();
        if (session.active && word) adapter.speak?.(word);
      });
      elements.ratingButtons?.forEach?.((button) => {
        listen(button, 'click', (event) => {
          event.stopPropagation?.();
          rate(button.dataset?.mobileFocusRate);
        });
      });
      elements.modeButtons?.forEach?.((button) => {
        listen(button, 'click', () => setMode(button.dataset?.mobileFocusMode));
      });
      elements.choiceButtons?.forEach?.((button, index) => {
        listen(button, 'click', (event) => {
          event.stopPropagation?.();
          selectChoice(index);
        });
      });
      listen(elements.spellingInput, 'input', (event) => {
        session.spellingDraft = String(event?.target?.value || '');
        if (session.spellingResult) {
          session.spellingResult = null;
          setExpanded(false);
          render();
          elements.spellingInput?.focus?.();
        }
      });
      listen(elements.spellingInput, 'keydown', (event) => {
        if (event.key !== 'Enter') return;
        event.preventDefault?.();
        if (session.spellingResult) {
          if (session.chopping) checkSpelling();
          else rate(session.spellingResult.correct ? 'remember' : 'forgot');
        } else {
          checkSpelling();
        }
      });
      listen(elements.spellingCheck, 'click', (event) => {
        event.stopPropagation?.();
        checkSpelling();
      });
      listen(elements.spellingClear, 'click', (event) => {
        event.stopPropagation?.();
        resetSpellingState();
        render();
        elements.spellingInput?.focus?.();
      });
      listen(elements.chop, 'click', () => {
        if (!session.active || session.locked || !currentWord()) return;
        session.choppingReturnMode = session.mode;
        session.chopping = true;
        session.mode = 'spelling';
        resetQuestionState();
        render();
        elements.spellingInput?.focus?.();
      });
      listen(elements.skipSpelling, 'click', () => {
        if (!session.active || !adapter.isDueSession?.()) return;
        session.chopping = false;
        adapter.skipDue?.(currentId());
        move(1);
      });
      listen(elements.empty, 'click', (event) => {
        const button = event.target?.closest?.('[data-mobile-focus-complete]');
        if (button) completeAction(button.dataset.mobileFocusComplete);
      });
      listen(elements.card, 'pointerdown', (event) => {
        if (
          !session.active
          || session.locked
          || (elements.spellingInput && event.target === elements.spellingInput)
          || (elements.spellingCheck && event.target === elements.spellingCheck)
          || (elements.spellingClear && event.target === elements.spellingClear)
          || elements.choiceButtons?.includes?.(event.target)
          || (event.button != null && event.button !== 0)
        ) return;
        session.pointer = {
          id: event.pointerId,
          x: event.clientX,
          y: event.clientY,
          time: now(),
        };
      });
      listen(elements.card, 'pointerup', (event) => {
        const pointer = session.pointer;
        session.pointer = null;
        if (!pointer || (event.pointerId != null && pointer.id !== event.pointerId)) return;
        const gesture = classifyGesture({
          dx: event.clientX - pointer.x,
          dy: event.clientY - pointer.y,
          elapsed: now() - pointer.time,
        });
        if (gesture === 'none') return;
        session.suppressClickUntil = now() + 400;
        move(gesture === 'next' ? 1 : -1);
      });
      listen(elements.card, 'pointercancel', () => { session.pointer = null; });
      listen(windowObject, 'keydown', (event) => {
        if (!session.active || session.locked) return;
        const typingSpelling = session.mode === 'spelling' && event.target === elements.spellingInput;
        if (event.key === 'Escape') {
          event.preventDefault?.();
          close();
          return;
        }
        if (['choice', 'choiceReverse'].includes(session.mode) && !session.choiceResult) {
          const key = String(event.key || '').toUpperCase();
          const choiceIndex = ['1', '2', '3', '4'].indexOf(key) >= 0
            ? Number(key) - 1
            : ['A', 'B', 'C', 'D'].indexOf(key);
          if (choiceIndex >= 0) {
            event.preventDefault?.();
            selectChoice(choiceIndex);
            return;
          }
        }
        if (event.key === 'Shift' && !typingSpelling) {
          event.preventDefault?.();
          toggleReveal();
          return;
        }
        if (event.key === 'ArrowLeft' && !typingSpelling) {
          event.preventDefault?.();
          rate('remember');
          return;
        }
        if (event.key === 'ArrowRight' && !typingSpelling) {
          event.preventDefault?.();
          rate('forgot');
        }
      });
      listen(windowObject, 'popstate', () => close({ fromPopState: true }));
    }

    bind();

    return {
      open,
      close,
      render,
      rate,
      move,
      restart,
      toggleReveal,
      setMode,
      checkSpelling,
      selectChoice,
      session,
    };
  }

  return {
    classifyGesture,
    termSizeClass,
    moveIndex,
    createController,
  };
}));
