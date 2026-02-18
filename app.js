'use strict';

/* ================================================================
   CONSTANTS
   ================================================================ */
const WIN_COMBOS = [
  [0,1,2],[3,4,5],[6,7,8],   // rows
  [0,3,6],[1,4,7],[2,5,8],   // cols
  [0,4,8],[2,4,6]            // diagonals
];

const APP_URL = 'https://alpiepho.github.io/my_tic_tac_toe/';

const CONFETTI_COLORS = [
  '#ff6b6b','#ffd93d','#6bcb77','#4d96ff',
  '#ff9ff3','#ff9f43','#54a0ff','#5f27cd','#ffeaa7'
];

const DEFAULTS = {
  theme:      'dark',
  mode:       '1p',
  difficulty: 'medium',
  p1Name:     'Player 1',
  p2Name:     'Player 2'
};

/* ================================================================
   STATE
   ================================================================ */
let state = {
  // Persisted settings
  theme:      DEFAULTS.theme,
  mode:       DEFAULTS.mode,
  difficulty: DEFAULTS.difficulty,
  p1Name:     DEFAULTS.p1Name,
  p2Name:     DEFAULTS.p2Name,

  // Persisted stats (per mode)
  stats: {
    '1p': { p1Wins: 0, p2Wins: 0, draws: 0 },
    '2p': { p1Wins: 0, p2Wins: 0, draws: 0 }
  },

  // Session game state (not persisted)
  board:          Array(9).fill(null),
  currentPlayer:  'X',
  gameOver:       false,
  winnerSymbol:   null,
  winningCombo:   null,
  isComputerTurn: false
};

/* ================================================================
   PERSISTENCE
   ================================================================ */
function saveSettings() {
  const { theme, mode, difficulty, p1Name, p2Name, stats } = state;
  localStorage.setItem('ttt_v1', JSON.stringify({ theme, mode, difficulty, p1Name, p2Name, stats }));
}

function loadSettings() {
  try {
    const raw = localStorage.getItem('ttt_v1');
    if (!raw) return;
    const s = JSON.parse(raw);
    state.theme      = s.theme      || DEFAULTS.theme;
    state.mode       = s.mode       || DEFAULTS.mode;
    state.difficulty = s.difficulty || DEFAULTS.difficulty;
    state.p1Name     = s.p1Name     || DEFAULTS.p1Name;
    state.p2Name     = s.p2Name     || DEFAULTS.p2Name;
    if (s.stats) {
      state.stats['1p'] = { ...state.stats['1p'], ...s.stats['1p'] };
      state.stats['2p'] = { ...state.stats['2p'], ...s.stats['2p'] };
    }
  } catch (e) { /* ignore */ }
}

/* ================================================================
   GAME LOGIC
   ================================================================ */
function checkWinner(board) {
  for (const [a,b,c] of WIN_COMBOS) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], combo: [a,b,c] };
    }
  }
  if (board.every(v => v !== null)) return { winner: 'draw', combo: null };
  return null;
}

function makeMove(index) {
  if (state.board[index] || state.gameOver || state.isComputerTurn) return;

  placeAndCheck(index, state.currentPlayer);
}

function placeAndCheck(index, player) {
  state.board[index] = player;
  animateCell(index);

  const result = checkWinner(state.board);
  if (result) { endGame(result); return; }

  state.currentPlayer = player === 'X' ? 'O' : 'X';

  if (state.mode === '1p' && state.currentPlayer === 'O') {
    scheduleComputerMove();
  } else {
    updateStatus();
    updateActivePlayer();
  }
}

function scheduleComputerMove() {
  state.isComputerTurn = true;
  lockBoard(true);
  updateStatus('thinking');

  // Tiny delay so player can see their own move, then AI responds
  setTimeout(() => {
    const idx = getComputerMove();
    state.isComputerTurn = false;
    placeAndCheck(idx, 'O');
    if (!state.gameOver) {
      lockBoard(false);
      updateStatus();
      updateActivePlayer();
    }
  }, 480);
}

/* ----------------------------------------------------------------
   AI — Easy: random
   AI — Medium: win/block/center/random
   AI — Hard: minimax with alpha-beta pruning
   ---------------------------------------------------------------- */
function getComputerMove() {
  const empties = state.board.map((v,i) => v == null ? i : null).filter(i => i !== null);

  if (state.difficulty === 'easy') {
    return empties[Math.floor(Math.random() * empties.length)];
  }

  if (state.difficulty === 'medium') {
    return findWin('O') ?? findWin('X') ?? (state.board[4] == null ? 4 : null)
      ?? empties[Math.floor(Math.random() * empties.length)];
  }

  // Hard: minimax
  return minimaxBest();
}

function findWin(player) {
  for (const [a,b,c] of WIN_COMBOS) {
    const vals = [state.board[a], state.board[b], state.board[c]];
    if (vals.filter(v => v === player).length === 2 && vals.includes(null)) {
      return [a,b,c][vals.indexOf(null)];
    }
  }
  return null;
}

function minimaxBest() {
  let bestScore = -Infinity, bestMove = null;
  const board = [...state.board];
  for (let i = 0; i < 9; i++) {
    if (board[i] == null) {
      board[i] = 'O';
      const score = minimax(board, 0, false, -Infinity, Infinity);
      board[i] = null;
      if (score > bestScore) { bestScore = score; bestMove = i; }
    }
  }
  return bestMove;
}

function minimax(board, depth, isMax, alpha, beta) {
  const res = checkWinner(board);
  if (res) {
    if (res.winner === 'O') return 10 - depth;
    if (res.winner === 'X') return depth - 10;
    return 0;
  }
  if (isMax) {
    let best = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (board[i] == null) {
        board[i] = 'O';
        best = Math.max(best, minimax(board, depth+1, false, alpha, beta));
        board[i] = null;
        alpha = Math.max(alpha, best);
        if (beta <= alpha) break;
      }
    }
    return best;
  } else {
    let best = Infinity;
    for (let i = 0; i < 9; i++) {
      if (board[i] == null) {
        board[i] = 'X';
        best = Math.min(best, minimax(board, depth+1, true, alpha, beta));
        board[i] = null;
        beta = Math.min(beta, best);
        if (beta <= alpha) break;
      }
    }
    return best;
  }
}

function endGame(result) {
  state.gameOver    = true;
  state.winnerSymbol = result.winner;
  state.winningCombo = result.combo;
  lockBoard(true);

  // Highlight winning cells
  if (result.combo) {
    result.combo.forEach(i => {
      document.querySelector(`[data-index="${i}"]`).classList.add('win-cell');
    });
  }

  // Record stat
  const s = state.stats[state.mode];
  if (result.winner === 'X')    s.p1Wins++;
  else if (result.winner === 'O') s.p2Wins++;
  else                            s.draws++;
  saveSettings();
  renderStats();

  // Show result overlay after a short pause to let winning cells animate
  setTimeout(() => showResult(result), 680);
}

function resetGame() {
  state.board         = Array(9).fill(null);
  state.currentPlayer = 'X';
  state.gameOver      = false;
  state.winnerSymbol  = null;
  state.winningCombo  = null;
  state.isComputerTurn = false;

  renderBoard();
  lockBoard(false);
  updateStatus();
  updateActivePlayer();
  hideResult();
}

/* ================================================================
   BOARD RENDERING
   ================================================================ */
function renderBoard() {
  document.querySelectorAll('.cell').forEach((cell, i) => {
    cell.textContent = '';
    cell.className = 'cell';
    cell.setAttribute('aria-label', `Cell ${i+1}`);
  });
}

function animateCell(index) {
  const cell = document.querySelector(`[data-index="${index}"]`);
  const sym  = state.board[index];
  cell.textContent = sym;
  cell.classList.add(sym === 'X' ? 'x-cell' : 'o-cell', 'cell-pop');
  cell.setAttribute('aria-label', `${sym} at cell ${index+1}`);
  cell.addEventListener('animationend', () => cell.classList.remove('cell-pop'), { once: true });
}

function lockBoard(lock) {
  document.getElementById('board').classList.toggle('locked', lock);
}

/* ================================================================
   STATUS & SCOREBOARD
   ================================================================ */
function updateStatus(type) {
  const sym = document.getElementById('status-sym');
  const txt = document.getElementById('status-txt');

  if (type === 'thinking') {
    sym.textContent = 'O';
    sym.className = 'status-sym o-color';
    txt.textContent = ' is thinking…';
    return;
  }

  if (state.gameOver) {
    if (state.winnerSymbol === 'draw') {
      sym.textContent = '🤝';
      sym.className = 'status-sym';
      txt.textContent = ' It\'s a Draw!';
    } else {
      const name = state.winnerSymbol === 'X' ? state.p1Name : p2DisplayName();
      sym.textContent = state.winnerSymbol;
      sym.className = `status-sym ${state.winnerSymbol === 'X' ? 'x-color' : 'o-color'}`;
      txt.textContent = ` wins! (${name})`;
    }
    return;
  }

  sym.textContent = state.currentPlayer;
  sym.className = `status-sym ${state.currentPlayer === 'X' ? 'x-color' : 'o-color'}`;
  const name = state.currentPlayer === 'X' ? state.p1Name : p2DisplayName();
  txt.textContent = `'s turn — ${name}`;
}

function updateActivePlayer() {
  document.getElementById('p1-card').classList.toggle('active', state.currentPlayer === 'X' && !state.gameOver);
  document.getElementById('p2-card').classList.toggle('active', state.currentPlayer === 'O' && !state.gameOver && !state.isComputerTurn);
}

function renderStats() {
  const s = state.stats[state.mode];
  el('p1-wins-badge').textContent  = `${s.p1Wins}W`;
  el('p1-loss-badge').textContent  = `${s.p2Wins}L`;
  el('p2-wins-badge').textContent  = `${s.p2Wins}W`;
  el('p2-loss-badge').textContent  = `${s.p1Wins}L`;
  el('draw-val').textContent       = `${s.draws}`;
}

function renderNames() {
  el('p1-name-display').textContent = state.p1Name;
  el('p2-name-display').textContent = p2DisplayName();
  // hide P2 name input in 1P mode
  el('p2-name-field').style.display = state.mode === '1p' ? 'none' : '';
}

function p2DisplayName() {
  if (state.mode === '1p') {
    const labels = { easy: 'Easy AI', medium: 'Medium AI', hard: 'Hard AI' };
    return labels[state.difficulty];
  }
  return state.p2Name;
}

/* ================================================================
   RESULT OVERLAY
   ================================================================ */
function showResult(result) {
  const card     = el('result-card');
  const iconEl   = el('result-icon');
  const headline = el('result-headline');
  const subline  = el('result-subline');

  card.className = 'result-card';
  clearConfetti();

  const is1p   = state.mode === '1p';
  const p1     = state.p1Name;
  const p2     = p2DisplayName();
  const diff   = state.difficulty;

  if (result.winner === 'draw') {
    iconEl.textContent   = '🤝';
    headline.textContent = "It's a Draw!";
    headline.style.color = '#f59e0b';

    const drawQuip = is1p
      ? (diff === 'hard' ? `You matched the machine! 🤖 Most humans can't do that!`
                         : `The AI couldn't beat you — try Hard mode!`)
      : `Great minds think alike, ${p1} & ${p2}. Rematch?`;
    subline.textContent = drawQuip;

    card.classList.add('bounce');
    launchConfetti(28, ['#f59e0b','#fbbf24','#fcd34d','#94a3b8','#fff']);

  } else if (result.winner === 'X') {
    if (is1p) {
      iconEl.textContent   = diff === 'hard' ? '🏆' : '🎉';
      headline.textContent = `You Win, ${p1}!`;
      headline.style.color = '#3b82f6';
      const winQuip = diff === 'hard'
        ? `Unbelievable! You beat the unbeatable AI! Screenshot this! 📸`
        : diff === 'medium'
          ? `Nice moves! The ${p2} couldn't keep up!`
          : `${p2} never stood a chance. Try a harder difficulty!`;
      subline.textContent = winQuip;
    } else {
      iconEl.textContent   = '🎉';
      headline.textContent = `${p1} Wins!`;
      headline.style.color = '#3b82f6';
      subline.textContent  = `Congratulations, ${p1}! Another round?`;
    }
    launchConfetti(65, ['#3b82f6','#93c5fd','#fff','#fbbf24','#60a5fa','#bfdbfe']);

  } else {
    // O wins
    if (is1p) {
      const roboLines = {
        easy:   `Even I'm surprised! 😱 But the circuits don't lie — rematch?`,
        medium: `Beep boop! 🤖 ${p2} calculated your downfall. Try again!`,
        hard:   `Resistance is futile! ⚡🤖 The algorithm prevails. Dare you try again?`
      };
      iconEl.textContent   = '🤖';
      headline.textContent = `${p2} Wins!`;
      headline.style.color = '#ef4444';
      subline.textContent  = roboLines[diff];
      card.classList.add('shake');
      launchConfetti(22, ['#ef4444','#fca5a5','#334155','#94a3b8']);
    } else {
      iconEl.textContent   = '🎉';
      headline.textContent = `${p2} Wins!`;
      headline.style.color = '#ef4444';
      subline.textContent  = `Well played, ${p2}! ${p1} wants a rematch!`;
      launchConfetti(65, ['#ef4444','#fca5a5','#fff','#fbbf24','#f87171']);
    }
  }

  el('result-overlay').classList.remove('hidden');
}

function hideResult() {
  el('result-overlay').classList.add('hidden');
  clearConfetti();
}

/* ================================================================
   CONFETTI
   ================================================================ */
function launchConfetti(count, colors) {
  const container = el('confetti-layer');
  for (let i = 0; i < count; i++) {
    const p       = document.createElement('div');
    p.className   = 'confetti-piece';
    const size    = 6 + Math.random() * 9;
    const isRound = Math.random() > .45;
    const color   = colors[Math.floor(Math.random() * colors.length)];
    const x       = Math.random() * 100;
    const dur     = 1.7 + Math.random() * 1.6;
    const delay   = Math.random() * .6;
    p.style.cssText = `
      left: ${x}%;
      width: ${size}px;
      height: ${isRound ? size : size * (1 + Math.random() * .8)}px;
      background: ${color};
      border-radius: ${isRound ? '50%' : '2px'};
      animation-duration: ${dur}s;
      animation-delay: ${delay}s;
    `;
    container.appendChild(p);
  }
}

function clearConfetti() { el('confetti-layer').innerHTML = ''; }

/* ================================================================
   MODALS
   ================================================================ */
function openModal(id) {
  el(id).classList.remove('hidden');
  if (id === 'settings-modal') {
    el('p1-name-input').value = state.p1Name;
    el('p2-name-input').value = state.p2Name;
    renderNames(); // updates P2 field visibility
  }
  if (id === 'info-modal') initQR();
}

function closeModal(id) { el(id).classList.add('hidden'); }

/* ================================================================
   QR CODE
   ================================================================ */
let qrDone = false;
function initQR() {
  if (qrDone) return;
  const container = el('qrcode-container');
  if (typeof QRCode !== 'undefined') {
    try {
      new QRCode(container, {
        text: APP_URL,
        width: 160, height: 160,
        colorDark: '#000000', colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H
      });
      qrDone = true;
    } catch (e) { showQRFallback(container); }
  } else {
    showQRFallback(container);
  }
}

function showQRFallback(container) {
  container.innerHTML =
    `<div style="width:160px;height:160px;display:flex;align-items:center;justify-content:center;
      background:#f1f5f9;border-radius:8px;font-size:11px;color:#475569;text-align:center;padding:16px;
      line-height:1.5;">QR unavailable offline.<br>Use the link below.</div>`;
}

/* ================================================================
   THEME / MODE / DIFFICULTY APPLIERS
   ================================================================ */
function applyTheme() {
  document.documentElement.setAttribute('data-theme', state.theme);
  el('theme-icon').textContent = state.theme === 'dark' ? '☀️' : '🌙';
  el('meta-theme-color').content = state.theme === 'dark' ? '#0f172a' : '#f0f9ff';
}

function applyMode() {
  el('mode-1p').classList.toggle('active', state.mode === '1p');
  el('mode-2p').classList.toggle('active', state.mode === '2p');
  el('difficulty-row').style.display = state.mode === '1p' ? '' : 'none';
  renderNames();
  renderStats();
}

function applyDifficulty() {
  document.querySelectorAll('.diff-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.diff === state.difficulty));
  renderNames();
}

/* ================================================================
   EVENT LISTENERS
   ================================================================ */
function setup() {
  // Board clicks
  el('board').addEventListener('click', e => {
    const cell = e.target.closest('.cell');
    if (!cell) return;
    makeMove(parseInt(cell.dataset.index));
  });

  // Theme
  el('theme-btn').addEventListener('click', () => {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    applyTheme();
    saveSettings();
  });

  // Mode
  document.querySelectorAll('[data-mode]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (state.mode === btn.dataset.mode) return;
      state.mode = btn.dataset.mode;
      applyMode();
      saveSettings();
      resetGame();
    });
  });

  // Difficulty
  document.querySelectorAll('.diff-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (state.difficulty === btn.dataset.diff) return;
      state.difficulty = btn.dataset.diff;
      applyDifficulty();
      saveSettings();
      resetGame();
    });
  });

  // New game / Play again / Dismiss
  el('new-game-btn').addEventListener('click', resetGame);
  el('play-again-btn').addEventListener('click', resetGame);
  el('result-dismiss-btn').addEventListener('click', hideResult);

  // Open modals
  el('info-btn').addEventListener('click', () => openModal('info-modal'));
  el('settings-btn').addEventListener('click', () => openModal('settings-modal'));

  // Close modals (close button and backdrop)
  document.querySelectorAll('[data-close]').forEach(el_ => {
    el_.addEventListener('click', () => closeModal(el_.dataset.close));
  });

  // Player name inputs (live save)
  el('p1-name-input').addEventListener('input', e => {
    state.p1Name = e.target.value.trim() || DEFAULTS.p1Name;
    renderNames();
    updateStatus();
    saveSettings();
  });
  el('p2-name-input').addEventListener('input', e => {
    state.p2Name = e.target.value.trim() || DEFAULTS.p2Name;
    renderNames();
    updateStatus();
    saveSettings();
  });

  // Reset current game (from settings)
  el('reset-game-btn').addEventListener('click', () => {
    closeModal('settings-modal');
    resetGame();
  });

  // Reset ALL
  el('reset-all-btn').addEventListener('click', () => {
    if (!confirm('Reset all settings and stats? This cannot be undone.')) return;
    localStorage.removeItem('ttt_v1');
    state.theme      = DEFAULTS.theme;
    state.mode       = DEFAULTS.mode;
    state.difficulty = DEFAULTS.difficulty;
    state.p1Name     = DEFAULTS.p1Name;
    state.p2Name     = DEFAULTS.p2Name;
    state.stats      = {
      '1p': { p1Wins: 0, p2Wins: 0, draws: 0 },
      '2p': { p1Wins: 0, p2Wins: 0, draws: 0 }
    };
    applyTheme();
    applyMode();
    applyDifficulty();
    renderStats();
    closeModal('settings-modal');
    resetGame();
  });

  // Copy link
  el('copy-link-btn').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(APP_URL);
    } catch {
      // Fallback for older browsers
      const ta = document.createElement('textarea');
      ta.value = APP_URL;
      ta.style.position = 'fixed';
      ta.style.opacity  = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    const toast = el('copy-toast');
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 2600);
  });

  // Escape closes any open modal
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal:not(.hidden)').forEach(m => m.classList.add('hidden'));
    }
  });
}

/* ================================================================
   SERVICE WORKER
   ================================================================ */
function registerSW() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () =>
      navigator.serviceWorker.register('./sw.js').catch(() => {})
    );
  }
}

/* ================================================================
   HELPERS
   ================================================================ */
function el(id) { return document.getElementById(id); }

/* ================================================================
   INIT
   ================================================================ */
function init() {
  loadSettings();
  applyTheme();
  applyMode();
  applyDifficulty();
  renderBoard();
  renderStats();
  renderNames();
  updateStatus();
  updateActivePlayer();
  setup();
  registerSW();
}

init();
