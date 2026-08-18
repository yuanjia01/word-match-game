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

/* 毫秒格式化为 MM:SS */
function fmt(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return String(m).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
}

/* 开始计时 */
function startTimer() {
  startAt = Date.now();
  clearInterval(timerId);
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

/* 每关混合难度选词（T9/AIL-15）：覆盖 js/match-core.js 的全局 pickPairs（本脚本后加载生效）。
   按数据层配比 LEVEL_MIX_RATIO 从各难度区间抽取 9 对，保证每关简单+中等+难混合；
   同一关内单词不重复，跨关沿用 usedIdx 尽量不重复。 */
function pickPairs() {
  const ratio = LEVEL_MIX_RATIO[activeLevel] || LEVEL_MIX_RATIO.all;
  const difficulties = Object.keys(ratio);
  const pool = WORDS.map((word, index) => ({ word, index }));
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
  finalTimeEl.textContent = '本次用时：' + fmt(Date.now() - startAt);
  overlay.classList.remove('hidden');
  playWin();
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

/* 下一关 */
nextBtn.addEventListener('click', function () {
  overlay.classList.add('hidden');
  round++;
  roundLabel.textContent = GRADE_LABELS[activeLevel] + ' · 第 ' + (round + 1) + ' 关';
  startAt = 0;
  timerEl.textContent = '用时 00:00';
  buildBoard(pickPairs());
});

/* 切换难度 */
difficultySelect.addEventListener('change', function () {
  activeLevel = difficultySelect.value;
  usedIdx = new Set();
  round = 0;
  startAt = 0;
  stopTimer();
  timerEl.textContent = '用时 00:00';
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
  timerEl.textContent = '用时 00:00';
};

/* 初始化：开始第一关（T6：单词玩法使用清脆/低沉音色） */
setSoundVariant('word');
buildBoard(pickPairs());
