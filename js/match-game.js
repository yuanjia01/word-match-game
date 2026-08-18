/* 单词消消乐游戏逻辑（原 index.html 迁移）：计时 / 胜负 / 关卡 / 事件绑定 / 初始化入口 */

/* 由词库数据生成带分级的完整词表，并校验分级完整性 */
const wordLevels = new Map();
let gradedWordCount = 0;
Object.entries(GRADE_WORDS).forEach(([level, words]) => {
  words.forEach(word => {
    if (wordLevels.has(word)) throw new Error('单词重复分级：' + word);
    wordLevels.set(word, level);
    gradedWordCount++;
  });
});

const WORDS = BASE_WORDS.map(([english, chinese]) => [english, chinese, wordLevels.get(english)]);
if (gradedWordCount !== BASE_WORDS.length || WORDS.some(word => !word[2])) {
  throw new Error('词库分级不完整，请检查 GRADE_WORDS');
}

const board = document.getElementById('board');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlayTitle');
const finalTimeEl = document.getElementById('finalTime');
const timerEl = document.getElementById('timer');
const roundLabel = document.getElementById('roundLabel');
const nextBtn = document.getElementById('nextBtn');
const difficultySelect = document.getElementById('difficultySelect');
const soundBtn = document.getElementById('soundBtn');

let usedIdx = new Set();
let activeLevel = 'all';
let round = 0;
let pairs = [];
let selected = null;
let matched = 0;
let startAt = 0;
let timerId = null;

/* 双模式状态（T7/AIL-13）：hard 限时倒计时，超时重开本关 */
let hardMode = false;
let timeLimit = 60;
let timedOut = false;
let hardDeadline = 0;

/* 毫秒格式化为 MM:SS */
function fmt(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return String(m).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
}

/* 倒计时显示：剩余秒数向上取整，避免过早显示 00:00 */
function fmtLeft(ms) {
  const s = Math.ceil(ms / 1000);
  const m = Math.floor(s / 60);
  return String(m).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
}

/* 模式读取（T7/AIL-13）：window.gameMode 由 js/app.js 在进入游戏前设置 */
function syncMode() {
  hardMode = window.gameMode === 'hard';
  timeLimit = hardTime();
}

/* Hard 模式每关限时（秒）：低年级时间长、高年级时间短 */
function hardTime() {
  switch (activeLevel) {
    case 'lower': return 75;
    case 'upper': return 60;
    case 'middle': return 45;
    default: return 60;
  }
}

/* 计时文本：Hard 显示剩余倒计时，Easy 显示正向用时 */
function timerText() {
  return hardMode ? '剩余 ' + fmt(timeLimit * 1000) : '用时 00:00';
}

/* 开始计时：Easy 正向计时；Hard 倒计时，到点弹窗并重开本关 */
function startTimer() {
  startAt = Date.now();
  clearInterval(timerId);
  if (hardMode) {
    hardDeadline = startAt + timeLimit * 1000;
    timerEl.textContent = '剩余 ' + fmt(timeLimit * 1000);
    timerId = setInterval(function () {
      const left = hardDeadline - Date.now();
      if (left <= 0) {
        stopTimer();
        showTimeout();
        return;
      }
      timerEl.textContent = '剩余 ' + fmtLeft(left);
    }, 250);
    return;
  }
  timerId = setInterval(function () {
    timerEl.textContent = '用时 ' + fmt(Date.now() - startAt);
  }, 250);
}

/* 停止计时 */
function stopTimer() { clearInterval(timerId); }

/* 词条所属难度区间（T9/AIL-15）：按词池档位映射到 GRADE_DIFFICULTY_RANGES 的难度区间 */
function difficultyOf(word) {
  return LEVEL_TO_DIFFICULTY[word[2]] || 'easy';
}

/* 当前词池（T8/AIL-14）：主页选中「自定义词库」且有词时使用自定义词库，否则用内置词库。
   自定义词档位固定为 custom，difficultyOf 兜底归入 easy，可正常参与配对玩法。 */
function wordPool() {
  if (window.wordSource === 'custom' && window.USER_WORDS && window.USER_WORDS.hasWords()) {
    return window.USER_WORDS.get().map(w => [w[0], w[1], 'custom']);
  }
  return WORDS;
}

/* 每关混合难度选词（T9/AIL-15）：覆盖 js/match-core.js 的全局 pickPairs（本脚本后加载生效）。
   按数据层配比 LEVEL_MIX_RATIO 从各难度区间抽取 9 对，保证每关简单+中等+难混合；
   同一关内单词不重复，跨关沿用 usedIdx 尽量不重复。 */
function pickPairs() {
  const ratio = LEVEL_MIX_RATIO[activeLevel] || LEVEL_MIX_RATIO.all;
  const difficulties = Object.keys(ratio);
  const pool = wordPool().map((word, index) => ({ word, index }));
  const byDiff = {};
  difficulties.forEach(d => {
    byDiff[d] = pool.filter(item => difficultyOf(item.word) === d);
  });
  const chosen = [];
  const picked = new Set();
  difficulties.forEach(d => {
    const need = ratio[d];
    let avail = byDiff[d].filter(item => !usedIdx.has(item.index));
    if (avail.length < need) avail = byDiff[d].slice();
    shuffle(avail);
    avail.slice(0, need).forEach(item => {
      chosen.push(item.word);
      picked.add(item.index);
      usedIdx.add(item.index);
    });
  });
  /* 兜底：某难度词池不足时，用剩余未用词补齐到 9 对 */
  if (chosen.length < 9) {
    const rest = pool.filter(item => !picked.has(item.index));
    shuffle(rest);
    rest.slice(0, 9 - chosen.length).forEach(item => {
      chosen.push(item.word);
      picked.add(item.index);
      usedIdx.add(item.index);
    });
  }
  return chosen;
}

/* 胜利弹窗 */
function showWin() {
  stopTimer();
  timedOut = false;
  overlayTitle.textContent = '恭喜你挑战成功！';
  finalTimeEl.textContent = '本次用时：' + fmt(Date.now() - startAt);
  nextBtn.textContent = '继续挑战';
  overlay.classList.remove('hidden');
  playWin();
}

/* Hard 模式超时（T7/AIL-13）：弹窗提示"时间到"，点击后重开本关（关数不前进） */
function showTimeout() {
  timedOut = true;
  overlayTitle.textContent = '时间到';
  finalTimeEl.textContent = '未在限定时间内完成，本关重新开始';
  nextBtn.textContent = '再来一次';
  overlay.classList.remove('hidden');
  playFail();
}

/* 重开本关：重置棋盘与计时，关数不前进（复用本关词条，重新洗牌） */
function restartCurrentRound() {
  timedOut = false;
  startAt = 0;
  timerEl.textContent = timerText();
  buildBoard(pairs);
}

/* 泡泡点击：配对 / 朗读 / 计分 */
board.addEventListener('click', function (e) {
  const el = e.target.closest('.bubble');
  if (!el || el.classList.contains('gone')) return;
  if (!startAt) startTimer();
  if (el.classList.contains('selected')) {
    el.classList.remove('selected');
    selected = null;
    return;
  }
  if (el.dataset.type === 'en') speak(el.dataset.text);
  if (!selected) {
    selected = el;
    el.classList.add('selected');
    return;
  }
  const a = selected, b = el;
  selected = null;
  if (a.dataset.key === b.dataset.key && a.dataset.type !== b.dataset.type) {
    playSuccess();
    a.classList.remove('selected');
    a.classList.add('gone');
    b.classList.add('gone');
    matched++;
    if (matched === pairs.length) showWin();
  } else {
    playFail();
    a.classList.add('wrong');
    b.classList.add('wrong');
    setTimeout(function () {
      a.classList.remove('selected', 'wrong');
      b.classList.remove('wrong');
    }, 480);
  }
});

/* 下一关 / 超时重开（T7/AIL-13：超时后关数不前进） */
nextBtn.addEventListener('click', function () {
  overlay.classList.add('hidden');
  if (timedOut) {
    restartCurrentRound();
    return;
  }
  round++;
  roundLabel.textContent = GRADE_LABELS[activeLevel] + ' · 第 ' + (round + 1) + ' 关';
  startAt = 0;
  timerEl.textContent = timerText();
  buildBoard(pickPairs());
});

/* 切换难度 */
difficultySelect.addEventListener('change', function () {
  activeLevel = difficultySelect.value;
  syncMode();
  usedIdx = new Set();
  round = 0;
  timedOut = false;
  startAt = 0;
  stopTimer();
  timerEl.textContent = timerText();
  roundLabel.textContent = GRADE_LABELS[activeLevel] + ' · 第 1 关';
  overlay.classList.add('hidden');
  buildBoard(pickPairs());
});

/* 音效开关按钮 */
soundBtn.addEventListener('click', function () {
  setSound(!soundOn);
});

/* 离开单词游戏页时由 app.js 调用：停止计时并清零，避免计时器在另一玩法/主页期间残留运行（AIL-11/T5） */
window.stopMatchTimer = function () {
  stopTimer();
  startAt = 0;
  timedOut = false;
  timerEl.textContent = timerText();
};

/* 初始化：开始第一关（T6：单词玩法使用清脆/低沉音色） */
setSoundVariant('word');
syncMode();
buildBoard(pickPairs());
