/* 入口路由（阶段1·T2 / AIL-8）：玩法选择、年级选择、玩法间切换 */
(function () {
  'use strict';

  /* 页面区块 */
  var screens = {
    home: document.getElementById('screen-home'),
    grade: document.getElementById('screen-grade'),
    word: document.getElementById('screen-word'),
    phonetic: document.getElementById('screen-phonetic')
  };
  var gradeGrid = document.getElementById('gradeGrid');
  var difficultySelect = document.getElementById('difficultySelect');
  var roundLabel = document.getElementById('roundLabel');
  var phoneticPlaceholder = document.getElementById('phoneticPlaceholder');

  /* 当前所选年级（grade3~grade9 或 all） */
  var selectedGrade = 'all';

  /* 展示指定页面 */
  function showScreen(name) {
    Object.keys(screens).forEach(function (key) {
      screens[key].classList.toggle('hidden', key !== name);
    });
  }

  /* 年级 key 列表：优先读取 T1（AIL-7）提供的 GRADE_WORDS_3_9，缺失时兜底 3~9 年级 */
  function getGradeKeys() {
    if (typeof GRADE_WORDS_3_9 !== 'undefined' && GRADE_WORDS_3_9) {
      var keys = Object.keys(GRADE_WORDS_3_9).filter(function (k) { return /^grade\d+$/.test(k); });
      if (keys.length) return keys;
    }
    // TODO(AIL-7/T1)：js/data/grade-words.js 尚未就绪，先用固定 3~9 年级兜底
    return ['grade3', 'grade4', 'grade5', 'grade6', 'grade7', 'grade8', 'grade9'];
  }

  /* 'grade5' -> 5 */
  function gradeNumber(key) {
    var m = /^grade(\d+)$/.exec(key);
    return m ? parseInt(m[1], 10) : null;
  }

  /* 年级 -> 当前引擎难度档位。
     TODO(AIL-5/T5)：GRADE_WORDS_3_9 接入后可改为按真实年级过滤；现阶段映射到现有 all/lower/upper/middle 档位 */
  function legacyLevelFor(key) {
    var n = gradeNumber(key);
    if (n === null) return 'all';
    if (n <= 5) return 'lower';
    if (n <= 7) return 'upper';
    return 'middle';
  }

  /* 渲染年级按钮（3~9 年级 + 全部） */
  function buildGradeGrid() {
    gradeGrid.innerHTML = '';
    getGradeKeys().forEach(function (key) {
      var n = gradeNumber(key);
      var btn = document.createElement('button');
      btn.className = 'grade-btn';
      btn.textContent = (n === null ? key : n + ' 年级');
      btn.dataset.grade = key;
      btn.addEventListener('click', function () { startWordGame(key); });
      gradeGrid.appendChild(btn);
    });
    var allBtn = document.createElement('button');
    allBtn.className = 'grade-btn grade-all';
    allBtn.textContent = '全部';
    allBtn.dataset.grade = 'all';
    allBtn.addEventListener('click', function () { startWordGame('all'); });
    gradeGrid.appendChild(allBtn);
  }

  /* 进入单词消消乐：设置年级并初始化游戏 */
  function startWordGame(gradeKey) {
    selectedGrade = gradeKey;
    var level = gradeKey === 'all' ? 'all' : legacyLevelFor(gradeKey);
    difficultySelect.value = level;
    /* 触发 match-game.js 已绑定的 change 事件，完成关卡重建与计时重置 */
    difficultySelect.dispatchEvent(new Event('change'));
    /* 用所选年级覆盖关卡标签 */
    var n = gradeNumber(gradeKey);
    roundLabel.textContent = (n === null ? '全部词库' : n + ' 年级') + ' · 第 1 关';
    showScreen('word');
  }

  /* 进入音标消消乐：玩法模块（AIL-9/T3）提供 initPhoneticGame()，缺失时显示占位 */
  function enterPhonetic() {
    showScreen('phonetic');
    if (typeof initPhoneticGame === 'function') {
      if (phoneticPlaceholder) phoneticPlaceholder.classList.add('hidden');
      initPhoneticGame();
    } else {
      // TODO(AIL-9/T3)：js/phonetic-game.js 尚未就绪，暂显示占位提示
    }
  }

  /* 返回主页 */
  function goHome() {
    showScreen('home');
  }

  /* 事件绑定 */
  document.getElementById('modeWordBtn').addEventListener('click', function () {
    buildGradeGrid();
    showScreen('grade');
  });
  document.getElementById('modePhoneticBtn').addEventListener('click', enterPhonetic);
  document.getElementById('gradeBackBtn').addEventListener('click', goHome);
  document.getElementById('wordBackBtn').addEventListener('click', goHome);
  document.getElementById('phoneticBackBtn').addEventListener('click', goHome);

  /* 「继续挑战」后 match-game.js 会把标签重置为难度档名，这里按所选年级重新覆盖 */
  document.getElementById('nextBtn').addEventListener('click', function () {
    var n = gradeNumber(selectedGrade);
    if (n === null) return;
    var m = /第 (\d+) 关/.exec(roundLabel.textContent);
    roundLabel.textContent = n + ' 年级 · 第 ' + (m ? m[1] : 1) + ' 关';
  });

  /* 初始化：默认展示主页 */
  showScreen('home');
})();
