/* =============================================================
   Hidden Picture Gameshow — Game Logic
   Vanilla JS, modular, no external dependencies.
============================================================= */

(() => {
  'use strict';

  /* ---------------- State ---------------- */
  const state = {
    players: [
      { name: 'Player 1', score: 0 },
      { name: 'Player 2', score: 0 },
    ],
    imageUrl: null,
    gridSize: 5,
    revealedCount: 0,
  };

  /* ---------------- DOM references ---------------- */
  const el = {
    startScreen: document.getElementById('start-screen'),
    gameScreen: document.getElementById('game-screen'),
    startForm: document.getElementById('start-form'),
    startError: document.getElementById('start-error'),

    player1Input: document.getElementById('player1-name'),
    player2Input: document.getElementById('player2-name'),
    imageUpload: document.getElementById('image-upload'),
    imageUrlInput: document.getElementById('image-url'),
    gridSizeSelect: document.getElementById('grid-size'),
    imagePreviewWrap: document.getElementById('image-preview-wrap'),
    imagePreview: document.getElementById('image-preview'),

    scoreName1: document.getElementById('score-name-1'),
    scoreName2: document.getElementById('score-name-2'),
    scoreValue1: document.getElementById('score-value-1'),
    scoreValue2: document.getElementById('score-value-2'),

    hiddenImage: document.getElementById('hidden-image'),
    tileGrid: document.getElementById('tile-grid'),

    btnReveal: document.getElementById('btn-reveal'),
    btnNextRound: document.getElementById('btn-next-round'),
    btnReset: document.getElementById('btn-reset'),
    nextRoundUpload: document.getElementById('next-round-upload'),
  };

  /* ---------------- Helpers ---------------- */

  /** Reads a File object and resolves with an object URL / data URL. */
  function readImageFile(file) {
    return new Promise((resolve, reject) => {
      if (!file) return reject(new Error('No file provided'));
      try {
        const url = URL.createObjectURL(file);
        resolve(url);
      } catch (err) {
        reject(err);
      }
    });
  }

  function showError(message) {
    el.startError.textContent = message;
    el.startError.classList.remove('hidden');
  }

  function clearError() {
    el.startError.textContent = '';
    el.startError.classList.add('hidden');
  }

  /* ---------------- Start screen: image preview ---------------- */

  el.imageUpload.addEventListener('change', async () => {
    const file = el.imageUpload.files && el.imageUpload.files[0];
    if (!file) return;
    el.imageUrlInput.value = '';
    try {
      const url = await readImageFile(file);
      state.imageUrl = url;
      el.imagePreview.src = url;
      el.imagePreviewWrap.classList.remove('hidden');
      clearError();
    } catch (err) {
      showError('Could not read that image file.');
    }
  });

  el.imageUrlInput.addEventListener('input', () => {
    const url = el.imageUrlInput.value.trim();
    if (!url) return;
    el.imageUpload.value = '';
    state.imageUrl = url;
    el.imagePreview.src = url;
    el.imagePreviewWrap.classList.remove('hidden');
    clearError();
  });

  /* ---------------- Start form submit ---------------- */

  el.startForm.addEventListener('submit', (event) => {
    event.preventDefault();
    clearError();

    const name1 = el.player1Input.value.trim() || 'Player 1';
    const name2 = el.player2Input.value.trim() || 'Player 2';
    const gridSize = parseInt(el.gridSizeSelect.value, 10) || 5;

    if (!state.imageUrl) {
      showError('Please upload an image or paste an image URL to hide.');
      return;
    }

    state.players[0].name = name1;
    state.players[1].name = name2;
    state.players[0].score = 0;
    state.players[1].score = 0;
    state.gridSize = gridSize;

    startGame();
  });

  /* ---------------- Game start / transition ---------------- */

  function startGame() {
    el.scoreName1.textContent = state.players[0].name;
    el.scoreName2.textContent = state.players[1].name;
    updateScoreDisplay(1, false);
    updateScoreDisplay(2, false);

    el.hiddenImage.src = state.imageUrl;

    buildGrid(state.gridSize);

    el.startScreen.classList.add('hidden');
    el.gameScreen.classList.remove('hidden');
  }

  /* ---------------- Grid building & tile reveal ---------------- */

  function buildGrid(size) {
    el.tileGrid.innerHTML = '';
    el.tileGrid.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    el.tileGrid.style.gridTemplateRows = `repeat(${size}, 1fr)`;
    state.revealedCount = 0;

    const totalTiles = size * size;
    for (let i = 0; i < totalTiles; i++) {
      const tile = document.createElement('div');
      tile.className = 'tile';
      tile.dataset.index = String(i);
      tile.dataset.number = String(i + 1);
      tile.addEventListener('click', () => revealTile(tile));
      el.tileGrid.appendChild(tile);
    }
  }

  function revealTile(tile) {
    if (tile.classList.contains('revealed')) return;
    tile.classList.add('revealed');
    state.revealedCount += 1;
  }

  function revealAllTiles() {
    const tiles = el.tileGrid.querySelectorAll('.tile:not(.revealed)');
    tiles.forEach((tile, i) => {
      // Slight stagger for a nicer cascading reveal effect.
      setTimeout(() => revealTile(tile), i * 25);
    });
  }

  /* ---------------- Scoreboard ---------------- */

  function updateScoreDisplay(playerNum, animate = true) {
    const valueEl = playerNum === 1 ? el.scoreValue1 : el.scoreValue2;
    const score = state.players[playerNum - 1].score;
    valueEl.textContent = String(score);
    if (animate) {
      valueEl.classList.remove('bump');
      // Force reflow so the animation can retrigger.
      void valueEl.offsetWidth;
      valueEl.classList.add('bump');
    }
  }

  document.querySelectorAll('.score-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const playerNum = parseInt(btn.dataset.player, 10);
      const delta = parseInt(btn.dataset.delta, 10);
      const player = state.players[playerNum - 1];
      player.score = Math.max(0, player.score + delta);
      updateScoreDisplay(playerNum, true);
    });
  });

  /* ---------------- Host controls ---------------- */

  el.btnReveal.addEventListener('click', () => {
    revealAllTiles();
  });

  el.btnNextRound.addEventListener('click', () => {
    el.nextRoundUpload.value = '';
    el.nextRoundUpload.click();
  });

  el.nextRoundUpload.addEventListener('change', async () => {
    const file = el.nextRoundUpload.files && el.nextRoundUpload.files[0];
    if (!file) return;
    try {
      const url = await readImageFile(file);
      state.imageUrl = url;
      el.hiddenImage.src = url;
      buildGrid(state.gridSize);
    } catch (err) {
      // If reading fails, keep the previous round's image/grid untouched.
      console.error('Failed to load next round image:', err);
    }
  });

  el.btnReset.addEventListener('click', () => {
    // Keep names/scores cleared and return to the start screen.
    state.players[0].score = 0;
    state.players[1].score = 0;
    state.imageUrl = null;

    el.startForm.reset();
    el.imagePreviewWrap.classList.add('hidden');
    el.imagePreview.src = '';
    clearError();

    el.gameScreen.classList.add('hidden');
    el.startScreen.classList.remove('hidden');
  });
})();
