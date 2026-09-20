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
    itemAnswer: document.getElementById('item-answer'),
    roundBanner: document.getElementById('round-banner'),

    btnCorrect: document.getElementById('btn-correct'),
    btnMiss: document.getElementById('btn-miss'),
    btnReveal: document.getElementById('btn-reveal'),
    btnNext: document.getElementById('btn-next'),
    btnReset: document.getElementById('btn-reset'),
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

    el.itemEmoji.textContent = state.currentItem.emoji;
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
})();
