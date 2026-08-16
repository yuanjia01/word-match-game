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

/* 初始化：开始第一关 */
buildBoard(pickPairs());