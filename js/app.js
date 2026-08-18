/* 入口路由（阶段1·T2 / AIL-8）：玩法选择、模式选择、年级选择、玩法间切换
   阶段1·T7（AIL-13）：新增 Easy/Hard 模式选择，进入游戏前选定、进入后不可切换 */
(function () {
  'use strict';

  /* 页面区块 */
  var screens = {
    home: document.getElementById('screen-home'),
    mode: document.getElementById('screen-mode'),
    grade: document.getElementById('screen-grade'),
    word: document.getElementById('screen-word'),
    phonetic: document.getElementById('screen-phonetic'),
    import: document.getElementById('screen-import')
  };
  var gradeGrid = document.getElementById('gradeGrid');
  var difficultySelect = document.getElementById('difficultySelect');
  var roundLabel = document.getElementById('roundLabel');
  var phoneticPlaceholder = document.getElementById('phoneticPlaceholder');
  /* 导入单词本（T8/AIL-14）相关元素 */
  var importTextArea = document.getElementById('importTextArea');
  var importFileInput = document.getElementById('importFileInput');
  var importBtn = document.getElementById('importBtn');
  var importResult = document.getElementById('importResult');
  var userWordList = document.getElementById('userWordList');
  var userWordCount = document.getElementById('userWordCount');
  var clearWordsBtn = document.getElementById('clearWordsBtn');
  var wordSourceWrap = document.getElementById('wordSourceWrap');
  var srcBuiltinBtn = document.getElementById('srcBuiltinBtn');
  var srcCustomBtn = document.getElementById('srcCustomBtn');

  /* 当前所选年级（grade3~grade9 或 all） */
  var selectedGrade = 'all';
  /* 当前所选模式（easy/hard，T7/AIL-13）：进入游戏前通过 window.gameMode 传给玩法模块 */
  var selectedMode = 'easy';
  /* 模式选择后要进入的玩法（word/phonetic） */
  var pendingGame = 'word';
  /* 当前词库来源（T8/AIL-14）：builtin=内置词库，custom=自定义词库，传给 match-game.js */
  var wordSource = 'builtin';
  window.gameMode = selectedMode;
  window.wordSource = wordSource;

  /* 展示指定页面 */
  function showScreen(name) {
    Object.keys(screens).forEach(function (key) {
      screens[key].classList.toggle('hidden', key !== name);
    });
  }

  /* 年级 key 列表：由 T1（AIL-7）提供的 js/data/grade-words.js（GRADE_WORDS_3_9）生成，
     数据文件未加载时兜底 3~9 年级 */
  function getGradeKeys() {
    if (typeof GRADE_WORDS_3_9 !== 'undefined' && GRADE_WORDS_3_9) {
      var keys = Object.keys(GRADE_WORDS_3_9).filter(function (k) { return /^grade\d+$/.test(k); });
      if (keys.length) return keys;
    }
    return ['grade3', 'grade4', 'grade5', 'grade6', 'grade7', 'grade8', 'grade9'];
  }

  /* 'grade5' -> 5 */
  function gradeNumber(key) {
    var m = /^grade(\d+)$/.exec(key);
    return m ? parseInt(m[1], 10) : null;
  }

  /* 年级 -> 当前引擎难度档位。
     游戏词池（BASE_WORDS）按 低年级/高年级/初中 三档分组，GRADE_WORDS_3_9 里 3~9 年级词汇
     未全部收录进可玩词池（6~9 年级与 BASE_WORDS 交集很小），故按档位映射保证可玩：
     3~5 年级 -> 低年级，6~7 年级 -> 高年级，8~9 年级 -> 初中 */
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
    /* 自定义单词本（T8/AIL-14）：有导入词时在年级页提供「单词本」入口，直接进入自定义词库游戏 */
    if (window.USER_WORDS && window.USER_WORDS.hasWords()) {
      var customBtn = document.createElement('button');
      customBtn.className = 'grade-btn grade-custom';
      customBtn.textContent = '单词本';
      customBtn.dataset.grade = 'custom';
      customBtn.addEventListener('click', function () {
        startCustomWordGame();
      });
      gradeGrid.appendChild(customBtn);
    }
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

  /* 使用自定义词库直接进入单词消消乐（T8/AIL-14）：跳过年级选择，视同全部词库
     无自定义词时回退到内置词库的年级选择流程 */
  function startCustomWordGame() {
    if (!(window.USER_WORDS && window.USER_WORDS.hasWords())) {
      wordSource = 'builtin';
      window.wordSource = wordSource;
      buildGradeGrid();
      showScreen('grade');
      return;
    }
    wordSource = 'custom';
    window.wordSource = wordSource;
    selectedGrade = 'all';
    difficultySelect.value = 'all';
    difficultySelect.dispatchEvent(new Event('change'));
    roundLabel.textContent = '自定义词库 · 第 1 关';
    showScreen('word');
  }

  /* 刷新主页词库选择区：有自定义词库时显示并可切换（T8/AIL-14） */
  function refreshWordSourceUI() {
    var has = !!(window.USER_WORDS && window.USER_WORDS.hasWords());
    wordSourceWrap.classList.toggle('hidden', !has);
    if (!has && wordSource === 'custom') wordSource = 'builtin';
    window.wordSource = wordSource;
    srcBuiltinBtn.classList.toggle('active', wordSource === 'builtin');
    srcCustomBtn.classList.toggle('active', wordSource === 'custom');
  }

  /* 渲染已导入单词列表（T8/AIL-14） */
  function renderUserWords() {
    var words = window.USER_WORDS ? window.USER_WORDS.get() : [];
    userWordCount.textContent = words.length;
    userWordList.innerHTML = '';
    if (!words.length) {
      var empty = document.createElement('li');
      empty.className = 'user-word-empty';
      empty.textContent = '尚未导入任何单词';
      userWordList.appendChild(empty);
      return;
    }
    words.forEach(function (w) {
      var li = document.createElement('li');
      var en = document.createElement('span');
      en.className = 'uw-en';
      en.textContent = w[0];
      var cn = document.createElement('span');
      cn.className = 'uw-cn';
      cn.textContent = w[1];
      li.appendChild(en);
      li.appendChild(cn);
      userWordList.appendChild(li);
    });
  }

  /* 展示导入结果提示 */
  function showImportResult(msg, ok) {
    importResult.textContent = msg;
    importResult.classList.remove('hidden');
    importResult.classList.toggle('ok', !!ok);
    importResult.classList.toggle('err', !ok);
  }

  /* 执行导入：优先读取所选文件，否则读取粘贴文本（T8/AIL-14） */
  function doImport() {
    var file = importFileInput.files && importFileInput.files[0];
    if (file) {
      var reader = new FileReader();
      reader.onload = function () { runImport(String(reader.result || '')); };
      reader.readAsText(file, 'utf-8');
      return;
    }
    runImport(importTextArea.value);
  }

  /* 运行导入：解析 + 补释义 + 保存，展示成功/跳过统计 */
  function runImport(text) {
    if (typeof window.UserWordsImport === 'undefined') {
      showImportResult('导入模块未加载', false);
      return;
    }
    if (!text.trim()) {
      showImportResult('请先粘贴内容或选择 .txt 文件', false);
      return;
    }
    importBtn.disabled = true;
    importBtn.textContent = '导入中…';
    window.UserWordsImport.import(text).then(function (res) {
      importBtn.disabled = false;
      importBtn.textContent = '开始导入';
      var skippedMsg = '';
      if (res.skipped.length) {
        skippedMsg = '跳过 ' + res.skipped.length + ' 行：' + res.skipped.slice(0, 5)
          .map(function (s) { return s.reason + (s.line ? '（' + s.line + '）' : ''); })
          .join('；');
        if (res.skipped.length > 5) skippedMsg += ' 等';
      }
      if (res.imported > 0) {
        showImportResult('成功导入 ' + res.imported + ' 个单词。' + (res.skipped.length ? ' ' + skippedMsg : ''), true);
      } else {
        showImportResult('没有导入任何单词。' + (res.skipped.length ? ' ' + skippedMsg : ''), false);
      }
      renderUserWords();
      refreshWordSourceUI();
    }).catch(function () {
      importBtn.disabled = false;
      importBtn.textContent = '开始导入';
      showImportResult('导入失败，请重试', false);
    });
  }

  /* 清空自定义词库（T8/AIL-14） */
  function clearUserWords() {
    if (!(window.USER_WORDS && window.USER_WORDS.hasWords())) return;
    window.USER_WORDS.clear();
    renderUserWords();
    refreshWordSourceUI();
    importTextArea.value = '';
    importFileInput.value = '';
    showImportResult('已清空自定义词库', true);
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

  /* 选择玩法后先进入模式选择页（T7/AIL-13） */
  function chooseGame(game) {
    pendingGame = game;
    showScreen('mode');
  }

  /* 选定模式后进入对应流程：单词版 -> 年级选择，音标版 -> 直接开玩
     T8/AIL-14：选中自定义词库时单词版跳过年级选择直接开玩 */
  function chooseMode(mode) {
    selectedMode = mode;
    window.gameMode = mode;
    if (pendingGame === 'word') {
      if (wordSource === 'custom') {
        startCustomWordGame();
      } else {
        buildGradeGrid();
        showScreen('grade');
      }
    } else {
      enterPhonetic();
    }
  }

  /* 返回主页：先停止两个玩法的计时器并清零，避免跨页面残留计时（AIL-11/T5 双玩法状态串扰） */
  function goHome() {
    if (typeof window.stopMatchTimer === 'function') window.stopMatchTimer();
    if (typeof window.stopPhoneticTimer === 'function') window.stopPhoneticTimer();
    refreshWordSourceUI();
    showScreen('home');
  }

  /* 事件绑定 */
  document.getElementById('modeWordBtn').addEventListener('click', function () {
    chooseGame('word');
  });
  document.getElementById('modePhoneticBtn').addEventListener('click', function () {
    chooseGame('phonetic');
  });
  document.getElementById('modeEasyBtn').addEventListener('click', function () {
    chooseMode('easy');
  });
  document.getElementById('modeHardBtn').addEventListener('click', function () {
    chooseMode('hard');
  });
  document.getElementById('modeBackBtn').addEventListener('click', goHome);
  document.getElementById('gradeBackBtn').addEventListener('click', function () {
    showScreen('mode');
  });
  document.getElementById('wordBackBtn').addEventListener('click', goHome);
  document.getElementById('phoneticBackBtn').addEventListener('click', goHome);
  document.getElementById('importBackBtn').addEventListener('click', goHome);

  /* 词库来源切换（T8/AIL-14） */
  srcBuiltinBtn.addEventListener('click', function () {
    wordSource = 'builtin';
    window.wordSource = wordSource;
    refreshWordSourceUI();
  });
  srcCustomBtn.addEventListener('click', function () {
    wordSource = 'custom';
    window.wordSource = wordSource;
    refreshWordSourceUI();
  });

  /* 导入单词本（T8/AIL-14） */
  document.getElementById('importWordsBtn').addEventListener('click', function () {
    showScreen('import');
    renderUserWords();
  });
  importBtn.addEventListener('click', doImport);
  clearWordsBtn.addEventListener('click', clearUserWords);
  importFileInput.addEventListener('change', function () {
    if (importFileInput.files && importFileInput.files.length) importTextArea.value = '';
    importResult.classList.add('hidden');
  });
  importTextArea.addEventListener('input', function () {
    if (importFileInput.files && importFileInput.files.length) importFileInput.value = '';
  });

  /* 「继续挑战」后 match-game.js 会把标签重置为难度档名，这里按所选年级/词库重新覆盖 */
  document.getElementById('nextBtn').addEventListener('click', function () {
    var m = /第 (\d+) 关/.exec(roundLabel.textContent);
    if (wordSource === 'custom') {
      roundLabel.textContent = '自定义词库 · 第 ' + (m ? m[1] : 1) + ' 关';
      return;
    }
    var n = gradeNumber(selectedGrade);
    if (n === null) return;
    roundLabel.textContent = n + ' 年级 · 第 ' + (m ? m[1] : 1) + ' 关';
  });

  /* 初始化：刷新词库选择区，默认展示主页 */
  refreshWordSourceUI();
  showScreen('home');
})();
