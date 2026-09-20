/* =============================================================
   דו-קרב הניחושים — לוגיקת המשחק
   Vanilla JS ללא תלויות חיצוניות.

   מנגנון המשחק:
   - כל סיבוב מציג פריט אחד (אמוג'י גדול) מתוך הקטגוריה שנבחרה.
   - יש תור למתמודד אחד. אם הוא מנחש נכון (המנחה לוחץ "ניחוש נכון")
     הוא מקבל נקודה והסיבוב מסתיים.
   - אם הוא לא ידע / טעה (המנחה לוחץ "לא ידע / העבר תור") - התור
     עובר למתמודד השני, וזה נרשם כ"פסילה" עבורו באותו סיבוב.
   - אם אותו מתמודד נכשל פעמיים באותו סיבוב - הוא "מפסיד" את הסיבוב,
     היריב מקבל את הנקודה באופן אוטומטי, והתשובה מוצגת.
============================================================= */

(() => {
  'use strict';

  /* ---------------- מאגר קטגוריות (אמוג'י + תשובה בעברית) ---------------- */
  const CATEGORIES = {
    fruits: {
      name: 'פירות',
      emoji: '🍎',
      items: [
        { emoji: '🍎', answer: 'תפוח' },
        { emoji: '🍌', answer: 'בננה' },
        { emoji: '🍇', answer: 'ענבים' },
        { emoji: '🍉', answer: 'אבטיח' },
        { emoji: '🍊', answer: 'תפוז' },
        { emoji: '🍓', answer: 'תות' },
        { emoji: '🍍', answer: 'אננס' },
        { emoji: '🍒', answer: 'דובדבן' },
        { emoji: '🍑', answer: 'אפרסק' },
        { emoji: '🍋', answer: 'לימון' },
        { emoji: '🥝', answer: 'קיווי' },
        { emoji: '🥭', answer: 'מנגו' },
      ],
    },
    animals: {
      name: 'חיות',
      emoji: '🐶',
      items: [
        { emoji: '🐶', answer: 'כלב' },
        { emoji: '🐱', answer: 'חתול' },
        { emoji: '🦁', answer: 'אריה' },
        { emoji: '🐘', answer: 'פיל' },
        { emoji: '🦒', answer: 'ג\'ירפה' },
        { emoji: '🐒', answer: 'קוף' },
        { emoji: '🦓', answer: 'זברה' },
        { emoji: '🐧', answer: 'פינגווין' },
        { emoji: '🐻', answer: 'דוב' },
        { emoji: '🐰', answer: 'ארנב' },
        { emoji: '🐴', answer: 'סוס' },
        { emoji: '🐸', answer: 'צפרדע' },
      ],
    },
    cars: {
      name: 'כלי רכב',
      emoji: '🚗',
      items: [
        { emoji: '🚗', answer: 'מכונית' },
        { emoji: '🚕', answer: 'מונית' },
        { emoji: '🚓', answer: 'ניידת משטרה' },
        { emoji: '🚑', answer: 'אמבולנס' },
        { emoji: '🚚', answer: 'משאית' },
        { emoji: '🚌', answer: 'אוטובוס' },
        { emoji: '🚜', answer: 'טרקטור' },
        { emoji: '🏍️', answer: 'אופנוע' },
        { emoji: '🚒', answer: 'מכבי אש' },
        { emoji: '🏎️', answer: 'מכונית מירוץ' },
      ],
    },
    flags: {
      name: 'דגלים',
      emoji: '🏳️',
      items: [
        { emoji: '🇮🇱', answer: 'ישראל' },
        { emoji: '🇺🇸', answer: 'ארצות הברית' },
        { emoji: '🇫🇷', answer: 'צרפת' },
        { emoji: '🇯🇵', answer: 'יפן' },
        { emoji: '🇧🇷', answer: 'ברזיל' },
        { emoji: '🇮🇹', answer: 'איטליה' },
        { emoji: '🇪🇸', answer: 'ספרד' },
        { emoji: '🇬🇧', answer: 'בריטניה' },
        { emoji: '🇩🇪', answer: 'גרמניה' },
        { emoji: '🇨🇦', answer: 'קנדה' },
      ],
    },
  };

  const MAX_MISSES = 2;

  /* ---------------- הגדרות לטעינת קטגוריות מתיקיית images/ בריפו ---------------- */
  const REMOTE_REPO = { owner: 'eyalravit-cloud', repo: 'hidden-picture-gameshow', branch: 'main', imagesPath: 'images' };
  const IMAGE_EXT_REGEX = /\.(png|jpe?g|gif|webp|bmp|svg)$/i;

  /* ---------------- מצב המשחק ---------------- */
  const state = {
    players: [
      { name: 'מתמודד 1', score: 0 },
      { name: 'מתמודד 2', score: 0 },
    ],
    categoryKey: 'fruits',
    currentItem: null,
    previousItem: null,
    turnIndex: 0,      // 0 = מתמודד 1, 1 = מתמודד 2
    misses: [0, 0],    // פסילות בסיבוב הנוכחי לכל שחקן
    roundCount: 0,
    roundLocked: false, // חוסם פעולות בזמן הצגת הבאנר בין סיבובים
    customItems: [],    // {id, imageUrl, answer} - תמונות שהמנחה העלה בעצמו
    customCategoryName: '',
  };

  /* ---------------- הפניות DOM ---------------- */
  const el = {
    startScreen: document.getElementById('start-screen'),
    gameScreen: document.getElementById('game-screen'),
    startForm: document.getElementById('start-form'),
    startError: document.getElementById('start-error'),

    player1Input: document.getElementById('player1-name'),
    player2Input: document.getElementById('player2-name'),
    categoryPicker: document.getElementById('category-picker'),

    categoryBadge: document.getElementById('category-badge'),
    categorySelect: document.getElementById('category-select'),

    scoreboards: [
      document.getElementById('scoreboard-1'),
      document.getElementById('scoreboard-2'),
    ],
    scoreNames: [
      document.getElementById('score-name-1'),
      document.getElementById('score-name-2'),
    ],
    scoreValues: [
      document.getElementById('score-value-1'),
      document.getElementById('score-value-2'),
    ],
    missDots: [
      document.getElementById('miss-dots-1'),
      document.getElementById('miss-dots-2'),
    ],
    turnFlags: [
      document.getElementById('turn-flag-1'),
      document.getElementById('turn-flag-2'),
    ],

    itemEmoji: document.getElementById('item-emoji'),
    itemImage: document.getElementById('item-image'),
    itemAnswer: document.getElementById('item-answer'),
    roundBanner: document.getElementById('round-banner'),

    btnCorrect: document.getElementById('btn-correct'),
    btnMiss: document.getElementById('btn-miss'),
    btnReveal: document.getElementById('btn-reveal'),
    btnNext: document.getElementById('btn-next'),
    btnManageCustom: document.getElementById('btn-manage-custom'),
    btnReset: document.getElementById('btn-reset'),
    btnRefreshFoldersStart: document.getElementById('btn-refresh-folders-start'),
    btnRefreshFoldersGame: document.getElementById('btn-refresh-folders-game'),

    btnOpenCustomBuilder: document.getElementById('btn-open-custom-builder'),
    customModal: document.getElementById('custom-builder-modal'),
    btnCloseCustomModal: document.getElementById('btn-close-custom-modal'),
    customCategoryNameInput: document.getElementById('custom-category-name'),
    customImageUpload: document.getElementById('custom-image-upload'),
    customItemsList: document.getElementById('custom-items-list'),
    btnSaveCustom: document.getElementById('btn-save-custom'),
    customError: document.getElementById('custom-error'),
  };

  let selectedCategoryKey = 'fruits';

  /* ---------------- בניית בורר הקטגוריות במסך הפתיחה ---------------- */
  function buildCategoryPicker() {
    el.categoryPicker.innerHTML = '';
    Object.entries(CATEGORIES).forEach(([key, cat]) => {
      const option = document.createElement('div');
      option.className = 'category-option';
      option.dataset.key = key;
      if (key === selectedCategoryKey) option.classList.add('selected');
      option.innerHTML = `<span class="cat-emoji">${cat.emoji}</span><span>${cat.name}</span>`;
      option.addEventListener('click', () => {
        selectedCategoryKey = key;
        [...el.categoryPicker.children].forEach((c) => c.classList.remove('selected'));
        option.classList.add('selected');
      });
      el.categoryPicker.appendChild(option);
    });
  }

  /* ---------------- בניית בורר הקטגוריות בפאנל המנחה ---------------- */
  function buildCategorySelect() {
    el.categorySelect.innerHTML = '';
    Object.entries(CATEGORIES).forEach(([key, cat]) => {
      const opt = document.createElement('option');
      opt.value = key;
      opt.textContent = `${cat.emoji} ${cat.name}`;
      el.categorySelect.appendChild(opt);
    });
  }

  el.categorySelect?.addEventListener('change', () => {
    state.categoryKey = el.categorySelect.value;
    state.previousItem = null;
    el.categoryBadge.textContent = `קטגוריה: ${CATEGORIES[state.categoryKey].name}`;
    startNewRound({ resetTurn: false });
  });

  /* =============================================================
     קטגוריית תמונות מותאמת אישית (העלאה עצמית)
  ============================================================= */

  function isGameRunning() {
    return !el.gameScreen.classList.contains('hidden');
  }

  /* =============================================================
     קטגוריות שנטענות מהתיקייה images/ בריפו ב-GitHub (קבועות)
     כל תת-תיקייה = קטגוריה. שם הקובץ (בלי סיומת) = התשובה הנכונה.
  ============================================================= */

  async function fetchJson(url) {
    const res = await fetch(url, { headers: { Accept: 'application/vnd.github+json' } });
    if (!res.ok) throw new Error(`GitHub API error ${res.status} for ${url}`);
    return res.json();
  }

  async function loadFolderCategories() {
    const base = `https://api.github.com/repos/${REMOTE_REPO.owner}/${REMOTE_REPO.repo}/contents/${REMOTE_REPO.imagesPath}`;

    // מנקים קטגוריות תיקייה קודמות (למקרה שתיקייה נמחקה בינתיים).
    Object.keys(CATEGORIES).forEach((key) => {
      if (key.startsWith('folder:')) delete CATEGORIES[key];
    });

    let dirs = [];
    try {
      const rootEntries = await fetchJson(`${base}?ref=${REMOTE_REPO.branch}`);
      dirs = Array.isArray(rootEntries) ? rootEntries.filter((e) => e.type === 'dir') : [];
    } catch (err) {
      console.warn('לא ניתן היה לטעון קטגוריות מהתיקייה images/:', err);
    }

    await Promise.all(
      dirs.map(async (dir) => {
        try {
          const files = await fetchJson(`${base}/${encodeURIComponent(dir.name)}?ref=${REMOTE_REPO.branch}`);
          const items = (Array.isArray(files) ? files : [])
            .filter((f) => f.type === 'file' && IMAGE_EXT_REGEX.test(f.name))
            .map((f) => ({
              imageUrl: f.download_url,
              answer: f.name.replace(IMAGE_EXT_REGEX, '').replace(/[-_]+/g, ' ').trim(),
            }))
            .filter((it) => it.answer);

          if (items.length >= 2) {
            CATEGORIES[`folder:${dir.name}`] = { name: dir.name, emoji: '📁', items };
          }
        } catch (err) {
          console.warn(`לא ניתן היה לטעון את תיקיית הקטגוריה "${dir.name}":`, err);
        }
      })
    );

    buildCategoryPicker();
    if (isGameRunning()) {
      const prevValue = el.categorySelect.value;
      buildCategorySelect();
      if (CATEGORIES[prevValue]) el.categorySelect.value = prevValue;
    }
  }

  el.btnRefreshFoldersStart?.addEventListener('click', () => loadFolderCategories());
  el.btnRefreshFoldersGame?.addEventListener('click', () => loadFolderCategories());

  /** מסנכרן את CATEGORIES.custom עם state.customItems הנוכחי. */
  function refreshCustomCategory() {
    const validItems = state.customItems.filter((it) => it.answer.trim() !== '');
    if (validItems.length >= 2 && validItems.length === state.customItems.length) {
      CATEGORIES.custom = {
        name: state.customCategoryName || 'התמונות שלי',
        emoji: '🖼️',
        items: state.customItems.map((it) => ({ imageUrl: it.imageUrl, answer: it.answer.trim() })),
      };
    } else {
      delete CATEGORIES.custom;
    }
  }

  function renderCustomItemsList() {
    el.customItemsList.innerHTML = '';
    if (state.customItems.length === 0) {
      const hint = document.createElement('p');
      hint.className = 'custom-empty-hint';
      hint.textContent = 'עדיין לא הועלו תמונות. בחרו קובץ אחד או יותר למעלה.';
      el.customItemsList.appendChild(hint);
      return;
    }
    state.customItems.forEach((item) => {
      const row = document.createElement('div');
      row.className = 'custom-item-row';
      row.dataset.id = item.id;

      const thumb = document.createElement('img');
      thumb.className = 'custom-item-thumb';
      thumb.src = item.imageUrl;
      thumb.alt = 'תצוגה מקדימה';

      const answerInput = document.createElement('input');
      answerInput.type = 'text';
      answerInput.className = 'custom-item-answer';
      answerInput.placeholder = 'מה (או מי) מופיע בתמונה?';
      answerInput.maxLength = 40;
      answerInput.value = item.answer;
      answerInput.addEventListener('input', () => {
        item.answer = answerInput.value;
      });

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'custom-item-remove';
      removeBtn.textContent = '✕';
      removeBtn.setAttribute('aria-label', 'הסר תמונה');
      removeBtn.addEventListener('click', () => {
        state.customItems = state.customItems.filter((it) => it.id !== item.id);
        renderCustomItemsList();
      });

      row.appendChild(thumb);
      row.appendChild(answerInput);
      row.appendChild(removeBtn);
      el.customItemsList.appendChild(row);
    });
  }

  function openCustomModal() {
    el.customCategoryNameInput.value = state.customCategoryName;
    el.customImageUpload.value = '';
    el.customError.classList.add('hidden');
    renderCustomItemsList();
    el.customModal.classList.remove('hidden');
  }

  function closeCustomModal() {
    el.customModal.classList.add('hidden');
  }

  el.btnOpenCustomBuilder?.addEventListener('click', openCustomModal);
  el.btnManageCustom?.addEventListener('click', openCustomModal);
  el.btnCloseCustomModal?.addEventListener('click', closeCustomModal);
  el.customModal?.addEventListener('click', (event) => {
    if (event.target === el.customModal) closeCustomModal();
  });

  el.customImageUpload?.addEventListener('change', () => {
    const files = Array.from(el.customImageUpload.files || []);
    files.forEach((file, idx) => {
      const imageUrl = URL.createObjectURL(file);
      state.customItems.push({
        id: `${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 7)}`,
        imageUrl,
        answer: '',
      });
    });
    el.customImageUpload.value = '';
    renderCustomItemsList();
  });

  el.btnSaveCustom?.addEventListener('click', () => {
    const validItems = state.customItems.filter((it) => it.answer.trim() !== '');
    if (state.customItems.length < 2) {
      el.customError.textContent = 'יש להעלות לפחות 2 תמונות.';
      el.customError.classList.remove('hidden');
      return;
    }
    if (validItems.length !== state.customItems.length) {
      el.customError.textContent = 'יש למלא תשובה לכל תמונה שהועלתה.';
      el.customError.classList.remove('hidden');
      return;
    }

    state.customCategoryName = el.customCategoryNameInput.value.trim();
    refreshCustomCategory();

    if (isGameRunning()) {
      buildCategorySelect();
      el.categorySelect.value = 'custom';
      state.categoryKey = 'custom';
      state.previousItem = null;
      el.categoryBadge.textContent = `קטגוריה: ${CATEGORIES.custom.name}`;
      startNewRound({ resetTurn: false });
    } else {
      selectedCategoryKey = 'custom';
      buildCategoryPicker();
    }

    closeCustomModal();
  });

  /* ---------------- טופס ההתחלה ---------------- */
  function showError(message) {
    el.startError.textContent = message;
    el.startError.classList.remove('hidden');
  }
  function clearError() {
    el.startError.textContent = '';
    el.startError.classList.add('hidden');
  }

  el.startForm.addEventListener('submit', (event) => {
    event.preventDefault();
    clearError();

    const name1 = el.player1Input.value.trim() || 'מתמודד 1';
    const name2 = el.player2Input.value.trim() || 'מתמודד 2';

    if (!selectedCategoryKey || !CATEGORIES[selectedCategoryKey]) {
      showError('נא לבחור קטגוריה כדי להתחיל.');
      return;
    }

    state.players[0].name = name1;
    state.players[1].name = name2;
    state.players[0].score = 0;
    state.players[1].score = 0;
    state.categoryKey = selectedCategoryKey;
    state.roundCount = 0;
    state.previousItem = null;

    startGame();
  });

  /* ---------------- מעבר למסך המשחק ---------------- */
  function startGame() {
    el.scoreNames[0].textContent = state.players[0].name;
    el.scoreNames[1].textContent = state.players[1].name;
    updateScoreDisplay(0, false);
    updateScoreDisplay(1, false);

    buildCategorySelect();
    el.categorySelect.value = state.categoryKey;
    el.categoryBadge.textContent = `קטגוריה: ${CATEGORIES[state.categoryKey].name}`;

    startNewRound({ resetTurn: true });

    el.startScreen.classList.add('hidden');
    el.gameScreen.classList.remove('hidden');
  }

  /* ---------------- בחירת פריט אקראי מהקטגוריה (ללא חזרה מיידית) ---------------- */
  function pickRandomItem() {
    const items = CATEGORIES[state.categoryKey].items;
    if (items.length === 1) return items[0];
    let candidate;
    do {
      candidate = items[Math.floor(Math.random() * items.length)];
    } while (state.previousItem && candidate.answer === state.previousItem.answer);
    return candidate;
  }

  /* ---------------- התחלת סיבוב חדש ---------------- */
  function startNewRound({ resetTurn }) {
    state.roundLocked = false;
    state.misses = [0, 0];
    state.currentItem = pickRandomItem();
    state.previousItem = state.currentItem;

    if (resetTurn) {
      state.turnIndex = state.roundCount % 2; // כל סיבוב מתחיל עם מתמודד אחר
    }
    state.roundCount += 1;

    if (state.currentItem.imageUrl) {
      el.itemImage.src = state.currentItem.imageUrl;
      el.itemImage.classList.remove('hidden');
      el.itemEmoji.classList.add('hidden');
    } else {
      el.itemEmoji.textContent = state.currentItem.emoji;
      el.itemEmoji.classList.remove('hidden');
      el.itemImage.classList.add('hidden');
      el.itemImage.removeAttribute('src');
    }
    el.itemAnswer.textContent = '';
    el.itemAnswer.classList.add('hidden');
    el.roundBanner.classList.add('hidden');
    el.roundBanner.className = 'round-banner hidden';

    renderMissDots();
    renderTurnHighlight();
    setControlsEnabled(true);
  }

  /* ---------------- תצוגת ניקוד ---------------- */
  function updateScoreDisplay(playerIdx, animate = true) {
    const valueEl = el.scoreValues[playerIdx];
    valueEl.textContent = String(state.players[playerIdx].score);
    if (animate) {
      valueEl.classList.remove('bump');
      void valueEl.offsetWidth;
      valueEl.classList.add('bump');
    }
  }

  document.querySelectorAll('.score-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const playerIdx = parseInt(btn.dataset.player, 10) - 1;
      const delta = parseInt(btn.dataset.delta, 10);
      const player = state.players[playerIdx];
      player.score = Math.max(0, player.score + delta);
      updateScoreDisplay(playerIdx, true);
    });
  });

  /* ---------------- תצוגת נקודות פסילה ---------------- */
  function renderMissDots() {
    [0, 1].forEach((idx) => {
      const dots = el.missDots[idx].querySelectorAll('.dot');
      dots.forEach((dot, dotIdx) => {
        dot.classList.toggle('used', dotIdx < state.misses[idx]);
      });
    });
  }

  /* ---------------- הדגשת תור נוכחי ---------------- */
  function renderTurnHighlight() {
    [0, 1].forEach((idx) => {
      const isActive = idx === state.turnIndex;
      el.scoreboards[idx].classList.toggle('active-turn', isActive);
    });
  }

  /* ---------------- הפעלה/נטרול כפתורי המנחה ---------------- */
  function setControlsEnabled(enabled) {
    el.btnCorrect.disabled = !enabled;
    el.btnMiss.disabled = !enabled;
  }

  /* ---------------- ניחוש נכון ---------------- */
  el.btnCorrect.addEventListener('click', () => {
    if (state.roundLocked) return;
    const winnerIdx = state.turnIndex;
    state.players[winnerIdx].score += 1;
    updateScoreDisplay(winnerIdx, true);
    endRound({
      type: 'correct',
      message: `✅ ${state.players[winnerIdx].name} ניחש/ה נכון! התשובה: ${state.currentItem.answer}`,
    });
  });

  /* ---------------- לא ידע / העבר תור ---------------- */
  el.btnMiss.addEventListener('click', () => {
    if (state.roundLocked) return;
    const missedIdx = state.turnIndex;
    state.misses[missedIdx] += 1;
    renderMissDots();

    if (state.misses[missedIdx] >= MAX_MISSES) {
      const winnerIdx = missedIdx === 0 ? 1 : 0;
      state.players[winnerIdx].score += 1;
      updateScoreDisplay(winnerIdx, true);
      endRound({
        type: 'lost',
        message: `❌ ${state.players[missedIdx].name} פספס/ה פעמיים! הנקודה עוברת ל-${state.players[winnerIdx].name}. התשובה: ${state.currentItem.answer}`,
      });
    } else {
      state.turnIndex = missedIdx === 0 ? 1 : 0;
      renderTurnHighlight();
    }
  });

  /* ---------------- סיום סיבוב עם באנר ---------------- */
  function endRound({ type, message }) {
    state.roundLocked = true;
    setControlsEnabled(false);

    el.itemAnswer.textContent = state.currentItem.answer;
    el.itemAnswer.classList.remove('hidden');

    el.roundBanner.textContent = message;
    el.roundBanner.className = `round-banner ${type}`;
    el.roundBanner.classList.remove('hidden');

    // מעבר אוטומטי לסיבוב הבא לאחר השהיה קצרה.
    setTimeout(() => {
      startNewRound({ resetTurn: true });
    }, 2200);
  }

  /* ---------------- הצג תשובה (ידני, ללא סיום סיבוב) ---------------- */
  el.btnReveal.addEventListener('click', () => {
    el.itemAnswer.textContent = state.currentItem.answer;
    el.itemAnswer.classList.toggle('hidden');
  });

  /* ---------------- תמונה הבאה (דילוג ידני ללא ניקוד) ---------------- */
  el.btnNext.addEventListener('click', () => {
    startNewRound({ resetTurn: true });
  });

  /* ---------------- איפוס המשחק ---------------- */
  el.btnReset.addEventListener('click', () => {
    state.players[0].score = 0;
    state.players[1].score = 0;
    state.roundCount = 0;
    state.previousItem = null;

    el.startForm.reset();
    clearError();

    el.gameScreen.classList.add('hidden');
    el.startScreen.classList.remove('hidden');
  });

  /* ---------------- אתחול ---------------- */
  buildCategoryPicker();
  loadFolderCategories();
})();
