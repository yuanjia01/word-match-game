/* 音标学习闭环：卡片学习 -> 听音辨音 -> 本课消消乐测验。 */
(function () {
  'use strict';

  var STORAGE_KEY = 'word-match-phonetic-progress-v1';
  var completedLessons = loadProgress();
  var activeLesson = null;
  var heardSymbols = new Set();
  var quizQuestions = [];
  var quizIndex = 0;
  var quizCorrect = 0;

  var listView = document.getElementById('phoneticLessonList');
  var detailView = document.getElementById('phoneticLessonDetail');
  var quizView = document.getElementById('phoneticListeningQuiz');
  var lessonGrid = document.getElementById('phoneticLessonGrid');
  var progressText = document.getElementById('phoneticProgressText');
  var progressBar = document.getElementById('phoneticProgressBar');
  var notice = document.getElementById('phoneticLearningNotice');
  var lessonTitle = document.getElementById('phoneticLessonTitle');
  var lessonDesc = document.getElementById('phoneticLessonDesc');
  var phonemeCards = document.getElementById('phoneticStudyCards');
  var heardProgress = document.getElementById('phoneticHeardProgress');
  var startQuizBtn = document.getElementById('phoneticStartQuizBtn');
  var quizCounter = document.getElementById('phoneticQuizCounter');
  var quizAudioBtn = document.getElementById('phoneticQuizAudioBtn');
  var quizOptions = document.getElementById('phoneticQuizOptions');
  var quizFeedback = document.getElementById('phoneticQuizFeedback');
  var quizActionBtn = document.getElementById('phoneticQuizActionBtn');

  function loadProgress() {
    try {
      var parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]');
      return new Set(Array.isArray(parsed) ? parsed : []);
    } catch (e) {
      return new Set();
    }
  }

  function saveProgress() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(completedLessons)));
    } catch (e) { /* 无痕模式下仍允许本次学习 */ }
  }

  function shuffled(list) {
    var copy = list.slice();
    for (var i = copy.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = copy[i];
      copy[i] = copy[j];
      copy[j] = temp;
    }
    return copy;
  }

  function lessonItems(lesson) {
    return lesson.symbols.map(function (symbol) {
      return PHONETICS.find(function (item) { return item.symbol === symbol; });
    }).filter(Boolean);
  }

  function showView(name) {
    listView.classList.toggle('hidden', name !== 'list');
    detailView.classList.toggle('hidden', name !== 'detail');
    quizView.classList.toggle('hidden', name !== 'quiz');
  }

  function renderLessonList(message) {
    lessonGrid.innerHTML = '';
    PHONETIC_LESSONS.forEach(function (lesson) {
      var done = completedLessons.has(lesson.id);
      var button = document.createElement('button');
      button.className = 'phonetic-lesson-card' + (done ? ' complete' : '');
      button.type = 'button';
      button.dataset.lesson = lesson.id;

      var status = document.createElement('span');
      status.className = 'lesson-status';
      status.textContent = done ? '已完成' : lesson.symbols.length + ' 个音标';
      var title = document.createElement('strong');
      title.textContent = lesson.title;
      var desc = document.createElement('span');
      desc.textContent = lesson.desc;
      var symbols = document.createElement('span');
      symbols.className = 'lesson-symbols';
      symbols.textContent = '/' + lesson.symbols.join('  ') + '/';

      button.appendChild(status);
      button.appendChild(title);
      button.appendChild(desc);
      button.appendChild(symbols);
      button.addEventListener('click', function () { openLesson(lesson.id); });
      lessonGrid.appendChild(button);
    });

    var doneCount = PHONETIC_LESSONS.filter(function (lesson) {
      return completedLessons.has(lesson.id);
    }).length;
    progressText.textContent = '已完成 ' + doneCount + ' / ' + PHONETIC_LESSONS.length + ' 课';
    progressBar.style.width = Math.round(doneCount / PHONETIC_LESSONS.length * 100) + '%';
    notice.textContent = message || '';
  }

  function openLesson(lessonId) {
    activeLesson = PHONETIC_LESSONS.find(function (lesson) { return lesson.id === lessonId; });
    if (!activeLesson) return;
    heardSymbols = new Set();
    lessonTitle.textContent = activeLesson.title;
    lessonDesc.textContent = activeLesson.desc + '。先逐个点击音标听音，再进入听音辨音。';
    phonemeCards.innerHTML = '';
    lessonItems(activeLesson).forEach(renderStudyCard);
    updateHeardProgress();
    showView('detail');
  }

  function renderStudyCard(item) {
    var card = document.createElement('article');
    card.className = 'phonetic-study-card';
    card.dataset.symbol = item.symbol;

    var symbolButton = document.createElement('button');
    symbolButton.type = 'button';
    symbolButton.className = 'phonetic-symbol-button';
    symbolButton.setAttribute('aria-label', '播放音标 ' + item.symbol);
    symbolButton.setAttribute('aria-pressed', 'false');
    var symbolText = document.createElement('strong');
    symbolText.textContent = '/' + item.symbol + '/';
    var listenState = document.createElement('span');
    listenState.textContent = '点击听音';
    symbolButton.appendChild(symbolText);
    symbolButton.appendChild(listenState);
    symbolButton.addEventListener('click', function () {
      speakPhonetic(item.symbol);
      heardSymbols.add(item.symbol);
      card.classList.add('heard');
      symbolButton.setAttribute('aria-pressed', 'true');
      listenState.textContent = '已听';
      updateHeardProgress();
    });

    var wordButton = document.createElement('button');
    wordButton.type = 'button';
    wordButton.className = 'phonetic-word-button';
    wordButton.setAttribute('aria-label', '分段拼读单词 ' + item.example);
    var word = document.createElement('strong');
    word.textContent = item.example;
    var ipa = document.createElement('span');
    ipa.className = 'study-word-ipa';
    ipa.appendChild(document.createTextNode('/'));
    item.segments.forEach(function (symbol, index) {
      var part = document.createElement('span');
      part.className = 'phonetic-part';
      part.textContent = symbol;
      part.dataset.segment = index;
      ipa.appendChild(part);
      if (index < item.segments.length - 1) ipa.appendChild(document.createTextNode(' '));
    });
    ipa.appendChild(document.createTextNode('/'));
    var blendStatus = document.createElement('span');
    blendStatus.className = 'phonetic-blend-status';
    blendStatus.textContent = '点击开始拼读';
    wordButton.appendChild(word);
    wordButton.appendChild(ipa);
    wordButton.appendChild(blendStatus);
    wordButton.addEventListener('click', function () {
      var parts = wordButton.querySelectorAll('.phonetic-part');
      speakPhoneticWord(item, function (index, symbol) {
        parts.forEach(function (part, partIndex) {
          part.classList.toggle('active', index === -2 || index === partIndex);
        });
        if (index === -2) blendStatus.textContent = '合起来：' + item.example;
        else if (index >= 0) blendStatus.textContent = '听 /' + symbol + '/';
        else blendStatus.textContent = '点击开始拼读';
      }).then(function () {
        parts.forEach(function (part) { part.classList.remove('active'); });
        blendStatus.textContent = '点击开始拼读';
      });
    });

    var hint = document.createElement('p');
    hint.textContent = item.cn;
    card.appendChild(symbolButton);
    card.appendChild(wordButton);
    card.appendChild(hint);
    phonemeCards.appendChild(card);
  }

  function updateHeardProgress() {
    var total = activeLesson ? activeLesson.symbols.length : 0;
    heardProgress.textContent = '已听 ' + heardSymbols.size + ' / ' + total + ' 个音标';
    startQuizBtn.disabled = !total || heardSymbols.size < total;
    startQuizBtn.textContent = startQuizBtn.disabled ? '听完本课音标后开始' : '开始听音辨音';
  }

  function startQuiz() {
    var items = lessonItems(activeLesson);
    quizQuestions = shuffled(items).slice(0, Math.min(5, items.length));
    quizIndex = 0;
    quizCorrect = 0;
    showView('quiz');
    renderQuizQuestion(true);
  }

  function renderQuizQuestion(playNow) {
    var question = quizQuestions[quizIndex];
    quizCounter.textContent = '第 ' + (quizIndex + 1) + ' / ' + quizQuestions.length + ' 题';
    quizFeedback.textContent = '听发音，选择对应的音标';
    quizFeedback.className = 'phonetic-quiz-feedback';
    quizActionBtn.classList.add('hidden');
    quizOptions.innerHTML = '';

    var distractors = shuffled(lessonItems(activeLesson).filter(function (item) {
      return item.symbol !== question.symbol;
    })).slice(0, 2);
    shuffled([question].concat(distractors)).forEach(function (item) {
      var option = document.createElement('button');
      option.type = 'button';
      option.className = 'phonetic-quiz-option';
      option.textContent = '/' + item.symbol + '/';
      option.dataset.symbol = item.symbol;
      option.addEventListener('click', function () { answerQuiz(option, question); });
      quizOptions.appendChild(option);
    });
    if (playNow) speakPhonetic(question.symbol);
  }

  function answerQuiz(selected, question) {
    var options = quizOptions.querySelectorAll('.phonetic-quiz-option');
    options.forEach(function (option) {
      option.disabled = true;
      if (option.dataset.symbol === question.symbol) option.classList.add('correct');
    });
    if (selected.dataset.symbol === question.symbol) {
      quizCorrect++;
      quizFeedback.textContent = '答对了！';
      quizFeedback.classList.add('ok');
    } else {
      selected.classList.add('wrong');
      quizFeedback.textContent = '正确答案是 /' + question.symbol + '/';
      quizFeedback.classList.add('err');
    }
    quizActionBtn.textContent = quizIndex === quizQuestions.length - 1 ? '查看结果' : '下一题';
    quizActionBtn.dataset.action = quizIndex === quizQuestions.length - 1 ? 'finish' : 'next';
    quizActionBtn.classList.remove('hidden');
  }

  function finishQuiz() {
    var passScore = Math.ceil(quizQuestions.length * 0.8);
    quizCounter.textContent = activeLesson.title;
    quizOptions.innerHTML = '';
    if (quizCorrect >= passScore) {
      quizFeedback.textContent = '听音辨音通过：答对 ' + quizCorrect + ' / ' + quizQuestions.length + ' 题';
      quizFeedback.className = 'phonetic-quiz-feedback ok result';
      quizActionBtn.textContent = '进入消消乐测验';
      quizActionBtn.dataset.action = 'game';
    } else {
      quizFeedback.textContent = '本次答对 ' + quizCorrect + ' / ' + quizQuestions.length + ' 题，再听一遍会更稳';
      quizFeedback.className = 'phonetic-quiz-feedback err result';
      quizActionBtn.textContent = '重新听音辨音';
      quizActionBtn.dataset.action = 'retry';
    }
    quizActionBtn.classList.remove('hidden');
  }

  startQuizBtn.addEventListener('click', startQuiz);
  document.getElementById('phoneticLessonBackBtn').addEventListener('click', function () {
    activeLesson = null;
    renderLessonList();
    showView('list');
  });
  document.getElementById('phoneticQuizBackBtn').addEventListener('click', function () {
    showView('detail');
  });
  quizAudioBtn.addEventListener('click', function () {
    if (quizQuestions[quizIndex]) speakPhonetic(quizQuestions[quizIndex].symbol);
  });
  quizActionBtn.addEventListener('click', function () {
    var action = quizActionBtn.dataset.action;
    if (action === 'next') {
      quizIndex++;
      renderQuizQuestion(true);
    } else if (action === 'finish') {
      finishQuiz();
    } else if (action === 'retry') {
      startQuiz();
    } else if (action === 'game' && typeof window.openPhoneticLessonTest === 'function') {
      window.openPhoneticLessonTest(activeLesson);
    }
  });

  window.initPhoneticLearning = function () {
    activeLesson = null;
    renderLessonList();
    showView('list');
  };

  window.resumePhoneticLearning = function () {
    if (activeLesson) showView('detail');
    else showView('list');
  };

  window.finishPhoneticLessonTest = function (lessonId) {
    if (lessonId) {
      completedLessons.add(lessonId);
      saveProgress();
    }
    activeLesson = null;
    renderLessonList('本课学习完成，进度已保存在当前设备。');
    showView('list');
    if (typeof window.returnToPhoneticLearning === 'function') {
      window.returnToPhoneticLearning();
    }
  };
})();
