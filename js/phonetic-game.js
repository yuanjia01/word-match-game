/* 音标消消乐游戏逻辑（AIL-9/T3）
   复用 js/match-core.js 的通用逻辑（shuffle / luminance / shade）与 js/data/words.js 的 PALETTE，
   交互与计时、胜利弹窗与单词版（js/match-game.js）保持一致。
   单词版 pickPairs / buildBoard 依赖其全局状态（WORDS / activeLevel / usedIdx / board），
   故音标版按同一模式提供独立实现，避免与单词版状态互相污染。 */

(function () {
  'use strict';

  var board = document.getElementById('phoneticBoard');
  var overlay = document.getElementById('phoneticOverlay');
  var overlayTitle = document.getElementById('phoneticOverlayTitle');
  var finalTimeEl = document.getElementById('phoneticFinalTime');
  var timerEl = document.getElementById('phoneticTimer');
  var roundLabel = document.getElementById('phoneticRoundLabel');
  var nextBtn = document.getElementById('phoneticNextBtn');

  var usedIdx = new Set();
  var round = 0;
  var pairs = [];
  var selected = null;
  var matched = 0;
  var startAt = 0;
  var timerId = null;

  /* 双模式状态（T7/AIL-13）：hard 限时倒计时，超时重开本关 */
  var hardMode = false;
  var timeLimit = 60;
  var timedOut = false;
  var hardDeadline = 0;
  /* 当前生效模式（easy/hard），模式变化时重置本关 */
  var currentMode = null;

  /* 毫秒格式化为 MM:SS */
  function fmt(ms) {
    var s = Math.floor(ms / 1000);
    var m = Math.floor(s / 60);
    return String(m).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
  }

  /* 倒计时显示：剩余秒数向上取整，避免过早显示 00:00 */
  function fmtLeft(ms) {
    var s = Math.ceil(ms / 1000);
    var m = Math.floor(s / 60);
    return String(m).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
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
        var left = hardDeadline - Date.now();
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

  /* 胜利弹窗（与单词版一致） */
  function showWin() {
    stopTimer();
    timedOut = false;
    overlayTitle.textContent = '恭喜你挑战成功！';
    finalTimeEl.textContent = '本次用时：' + fmt(Date.now() - startAt);
    nextBtn.textContent = '再来一局';
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

  /* 重开本关：重置棋盘与计时，关数不前进（复用本关音标，重新洗牌） */
  function restartCurrentRound() {
    timedOut = false;
    startAt = 0;
    timerEl.textContent = timerText();
    buildBoard(pairs);
  }

  /* 抽取本关 9 个音标（不重复），不足时重置已用集合（复用 match-core 的 shuffle） */
  function pickPairs() {
    var pool = PHONETICS.map(function (p, i) { return { p: p, i: i }; });
    var avail = pool.filter(function (x) { return !usedIdx.has(x.i); });
    if (avail.length < 9) { usedIdx = new Set(); avail = pool; }
    shuffle(avail);
    var chosen = avail.slice(0, 9);
    chosen.forEach(function (x) { usedIdx.add(x.i); });
    return chosen.map(function (x) { return x.p; });
  }

  /* 根据词条列表生成 18 个泡泡（音标与示例词各一个，随机排列） */
  function buildBoard(list) {
    pairs = list;
    matched = 0;
    selected = null;
    board.innerHTML = '';
    var tiles = [];
    list.forEach(function (p, i) {
      tiles.push({ key: i, type: 'ph', text: p.symbol });
      tiles.push({ key: i, type: 'ex', text: p.example, cn: p.cn });
    });
    shuffle(tiles);
    tiles.forEach(function (t) {
      var el = document.createElement('div');
      el.className = 'bubble';
      el.dataset.key = t.key;
      el.dataset.type = t.type;
      el.dataset.text = t.text;
      if (t.type === 'ex') {
        /* 示例词 + 中文说明（两行展示） */
        el.style.flexDirection = 'column';
        var main = document.createElement('span');
        main.textContent = t.text;
        var sub = document.createElement('span');
        sub.textContent = t.cn;
        sub.style.display = 'block';
        sub.style.fontSize = '0.55em';
        sub.style.fontWeight = '700';
        sub.style.opacity = '.8';
        sub.style.marginTop = '3px';
        el.appendChild(main);
        el.appendChild(sub);
      } else {
        el.textContent = t.text;
      }
      if (el.textContent.length > 7) el.classList.add('long');
      var color = PALETTE[Math.floor(Math.random() * PALETTE.length)];
      el.style.background = 'radial-gradient(circle at 32% 28%, rgba(255,255,255,.9), ' + color + ' 58%, ' + shade(color, 0.45) + ' 100%)';
      el.style.boxShadow = 'inset -8px -12px 18px rgba(0,0,0,.18), inset 6px 10px 14px rgba(255,255,255,.4), 0 10px 22px rgba(0,0,0,.22)';
      el.style.color = luminance(color) > 0.55 ? '#333' : '#fff';
      el.style.textShadow = luminance(color) > 0.55 ? '0 1px 2px rgba(255,255,255,.6)' : '0 1px 3px rgba(0,0,0,.45)';
      board.appendChild(el);
    });
  }

  /* 泡泡点击：配对 / 朗读音标 / 计分 */
  board.addEventListener('click', function (e) {
    var el = e.target.closest('.bubble');
    if (!el || el.classList.contains('gone')) return;
    if (!startAt) startTimer();
    if (el.classList.contains('selected')) {
      el.classList.remove('selected');
      selected = null;
      return;
    }
    if (el.dataset.type === 'ph') speakPhonetic(el.dataset.text);
    if (!selected) {
      selected = el;
      el.classList.add('selected');
      return;
    }
    var a = selected, b = el;
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

  /* 再来一局 / 超时重开（T7/AIL-13：超时后关数不前进） */
  nextBtn.addEventListener('click', function () {
    overlay.classList.add('hidden');
    if (timedOut) {
      restartCurrentRound();
      return;
    }
    round++;
    roundLabel.textContent = '第 ' + (round + 1) + ' 关';
    startAt = 0;
    timerEl.textContent = timerText();
    buildBoard(pickPairs());
  });

  /* 入口（js/app.js 路由调用）：首次进入构建第一关，重复进入保持当前进度；
     模式变化时重置本关（T7/AIL-13） */
  function initPhoneticGame() {
    if (typeof PHONETICS === 'undefined') return;
    setSoundVariant('phonetic'); /* T6：音标玩法使用木鱼/水滴音色 */
    var mode = window.gameMode === 'hard' ? 'hard' : 'easy';
    if (!board.children.length || mode !== currentMode) {
      currentMode = mode;
      hardMode = mode === 'hard';
      timeLimit = 60;
      timedOut = false;
      round = 0;
      stopTimer();
      startAt = 0;
      roundLabel.textContent = '第 1 关';
      timerEl.textContent = timerText();
      buildBoard(pickPairs());
    }
  }

  /* 离开音标游戏页时由 app.js 调用：停止计时并清零，避免计时器在另一玩法/主页期间残留运行（AIL-11/T5） */
  window.stopPhoneticTimer = function () {
    stopTimer();
    startAt = 0;
    timedOut = false;
    timerEl.textContent = timerText();
  };

  window.initPhoneticGame = initPhoneticGame;
})();
