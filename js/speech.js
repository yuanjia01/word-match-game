/* 英式发音模块：整词优先使用 en-GB / 有道英音，音标使用本地教学音频。
   爆破音轻带 /ə/ 便于初学者辨音；双元音使用连续滑音，不从示例词截取。 */

let voices = [];
let speechRun = 0;
let activeSegmentCleanup = null;
let activePhonemeFinish = null;
let activeWordFinish = null;
const phonemePlayer = new Audio();
phonemePlayer.preload = 'auto';
const wordPlayer = new Audio();
wordPlayer.preload = 'auto';

function loadVoices() { voices = speechSynthesis.getVoices(); }
if ('speechSynthesis' in window) {
  loadVoices();
  speechSynthesis.onvoiceschanged = loadVoices;
}

function isTouchDevice() {
  return ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
}

function britishVoice() {
  return voices.find(function (voice) {
    return voice.lang.replace('_', '-').toLowerCase().startsWith('en-gb');
  });
}

function youdaoBritishUrl(word) {
  return 'https://dict.youdao.com/dictvoice?type=1&audio=' + encodeURIComponent(word);
}

function beginSpeechRun() {
  speechRun++;
  if (activeSegmentCleanup) activeSegmentCleanup();
  if (activePhonemeFinish) activePhonemeFinish(false);
  if (activeWordFinish) activeWordFinish(false);
  phonemePlayer.pause();
  phonemePlayer.removeAttribute('src');
  wordPlayer.pause();
  wordPlayer.removeAttribute('src');
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  return speechRun;
}

function waitFor(ms, token) {
  return new Promise(function (resolve) {
    setTimeout(function () { resolve(token === speechRun); }, ms);
  });
}

function playSource(src, rate, token) {
  return new Promise(function (resolve) {
    if (token !== speechRun) { resolve(false); return; }
    var settled = false;
    function finish(ok) {
      if (settled) return;
      settled = true;
      if (activePhonemeFinish === finish) activePhonemeFinish = null;
      phonemePlayer.onloadedmetadata = null;
      phonemePlayer.ontimeupdate = null;
      phonemePlayer.onended = null;
      phonemePlayer.onerror = null;
      resolve(ok && token === speechRun);
    }
    activePhonemeFinish = finish;
    phonemePlayer.pause();
    phonemePlayer.src = src;
    phonemePlayer.currentTime = 0;
    phonemePlayer.playbackRate = rate || 1;
    phonemePlayer.onended = function () { finish(true); };
    phonemePlayer.onerror = function () { finish(false); };
    var started = phonemePlayer.play();
    if (started && typeof started.catch === 'function') {
      started.catch(function () { finish(false); });
    }
  });
}

async function playPhoneticItem(item, token) {
  if (!item || !item.audio) return false;
  for (var i = 0; i < item.audio.length; i++) {
    if (token !== speechRun) return false;
    var ok = await playSource('assets/audio/phonemes/' + item.audio[i] + '.mp3', item.rate || 1, token);
    if (!ok) return false;
    if (i < item.audio.length - 1) await waitFor(45, token);
  }
  return token === speechRun;
}

function speakWholeWord(word, token, options) {
  options = options || {};
  if (token !== speechRun) return Promise.resolve(false);
  var rate = options.rate || 0.9;
  var voice = britishVoice();

  function playBritishRecording() {
    if (typeof options.onStart === 'function') options.onStart();
    return playSource(youdaoBritishUrl(word), rate, token).then(function (ok) {
      if (typeof options.onEnd === 'function') options.onEnd();
      return ok;
    });
  }

  if (options.preferRecording || isTouchDevice() || !('speechSynthesis' in window) || !voice) {
    return playBritishRecording();
  }

  var utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = 'en-GB';
  utterance.rate = rate;
  utterance.pitch = 1;
  utterance.voice = voice;
  var started = false;
  return new Promise(function (resolve) {
    var settled = false;
    function finish(ok) {
      if (settled) return;
      settled = true;
      if (typeof options.onEnd === 'function') options.onEnd();
      resolve(ok && token === speechRun);
    }
    function fallback() {
      if (settled || token !== speechRun) { finish(false); return; }
      settled = true;
      playBritishRecording().then(resolve);
    }
    utterance.onstart = function () {
      started = true;
      if (typeof options.onStart === 'function') options.onStart();
    };
    utterance.onend = function () { finish(true); };
    utterance.onerror = fallback;
    speechSynthesis.speak(utterance);
    setTimeout(function () {
      if (!started && !settled && token === speechRun && !speechSynthesis.speaking && !speechSynthesis.pending) {
        fallback();
      }
    }, 900);
  });
}

var MONOPHTHONG_SYMBOLS = ['iː', 'ɪ', 'e', 'æ', 'ɑː', 'ɒ', 'ɔː', 'ʊ', 'uː', 'ʌ', 'ɜː', 'ə'];
var DIPHTHONG_SYMBOLS = ['eɪ', 'aɪ', 'ɔɪ', 'aʊ', 'əʊ', 'ɪə', 'eə', 'ʊə'];
var VOWEL_SYMBOLS = MONOPHTHONG_SYMBOLS.concat(DIPHTHONG_SYMBOLS);
var STOP_SYMBOLS = ['p', 'b', 't', 'd', 'k', 'g'];
var TEACHING_AUDIO = {
  'p': 'p', 'b': 'b', 't': 't', 'd': 'd', 'k': 'k', 'g': 'g',
  'f': 'pure-f', 'v': 'pure-v', 'θ': 'theta', 'ð': 'pure-eth',
  's': 'pure-s', 'z': 'pure-z', 'ʃ': 'sh', 'ʒ': 'pure-zh', 'h': 'pure-h',
  'tʃ': 'aff-ch', 'dʒ': 'aff-j', 'm': 'pure-m', 'n': 'pure-n', 'ŋ': 'pure-eng',
  'l': 'pure-l', 'r': 'pure-r', 'w': 'pure-w', 'j': 'pure-y',
  'eɪ': 'diph-ei', 'aɪ': 'diph-ai', 'ɔɪ': 'diph-oi', 'aʊ': 'diph-au',
  'əʊ': 'diph-ou', 'ɪə': 'diph-ia', 'eə': 'diph-ea', 'ʊə': 'diph-ua'
};

function phoneticItem(symbol) {
  if (typeof PHONETICS === 'undefined') return null;
  return PHONETICS.find(function (entry) { return entry.symbol === symbol; });
}

function teachingAudioSource(symbol) {
  var name = TEACHING_AUDIO[symbol];
  return name ? 'assets/audio/teaching/' + name + '.wav' : '';
}

function segmentWeight(symbol) {
  if (VOWEL_SYMBOLS.indexOf(symbol) !== -1) return 1.6;
  if (STOP_SYMBOLS.indexOf(symbol) !== -1) return 0.65;
  return 1;
}

function segmentBoundaries(item) {
  var weights = item.segments.map(segmentWeight);
  var total = weights.reduce(function (sum, weight) { return sum + weight; }, 0);
  var elapsed = 0;
  return [0].concat(weights.map(function (weight) {
    elapsed += weight;
    return elapsed / total;
  }));
}

function wordSegmentRange(item, index) {
  var boundaries = segmentBoundaries(item);
  var clipStart = item.clip[0];
  var clipEnd = item.clip[1];
  var speechLength = clipEnd - clipStart;
  return {
    start: clipStart + speechLength * boundaries[index],
    end: clipStart + speechLength * boundaries[index + 1]
  };
}

function prepareWordSource(src, token) {
  return new Promise(function (resolve) {
    if (token !== speechRun) { resolve(0); return; }
    var settled = false;

    function finish(duration) {
      if (settled) return;
      settled = true;
      if (activeWordFinish === finish) activeWordFinish = null;
      wordPlayer.onloadedmetadata = null;
      wordPlayer.onerror = null;
      resolve(token === speechRun ? duration : 0);
    }
    activeWordFinish = finish;
    wordPlayer.pause();
    wordPlayer.onloadedmetadata = function () {
      finish(Number.isFinite(wordPlayer.duration) ? wordPlayer.duration : 0);
    };
    wordPlayer.onerror = function () { finish(0); };
    wordPlayer.src = src;
    wordPlayer.currentTime = 0;
    wordPlayer.load();
  });
}

function playLoadedWordRange(rangeStart, rangeEnd, rate, duration, token) {
  return new Promise(function (resolve) {
    if (token !== speechRun) { resolve(false); return; }
    var settled = false;
    var timer = null;
    var startAt = Math.max(0, rangeStart - 0.012);
    var endAt = Math.min(duration, rangeEnd + 0.012);

    function finish(ok) {
      if (settled) return;
      settled = true;
      if (activeWordFinish === finish) activeWordFinish = null;
      clearInterval(timer);
      wordPlayer.pause();
      wordPlayer.onended = null;
      wordPlayer.onerror = null;
      resolve(ok && token === speechRun);
    }
    activeWordFinish = finish;
    function watchRange() {
      if (token !== speechRun) { finish(false); return; }
      if (wordPlayer.currentTime >= endAt - 0.008) finish(true);
    }

    wordPlayer.currentTime = startAt;
    wordPlayer.playbackRate = rate;
    wordPlayer.onended = function () { finish(true); };
    wordPlayer.onerror = function () { finish(false); };
    timer = setInterval(watchRange, 12);
    var started = wordPlayer.play();
    if (started && typeof started.catch === 'function') {
      started.catch(function () { finish(false); });
    }
  });
}

/* 单词消消乐使用的整词朗读。 */
function speak(word) {
  var token = beginSpeechRun();
  speakWholeWord(word, token);
}

/* 点按单个音标时，辅音与双元音使用独立教学录音，单元音使用标准 IPA 录音。 */
function speakPhonetic(symbol) {
  var item = phoneticItem(symbol);
  if (!item) return Promise.resolve(false);
  var token = beginSpeechRun();
  var teachingSource = teachingAudioSource(symbol);
  return teachingSource ? playSource(teachingSource, 1, token) : playPhoneticItem(item, token);
}

/* 辅音与双元音播放独立教学录音，单元音播放标准 IPA 录音；
   依次拼读后再播放完整单词。
   onSegment(index, symbol) 用于高亮；-2 表示合成整词，-1 表示播放结束。 */
function speakPhoneticWord(item, onSegment) {
  if (!item || !item.segments || !item.clip) return Promise.resolve(false);
  var token = beginSpeechRun();
  var segmentRate = 0.88;
  var segmentGap = 130;
  var blendGap = 280;
  var cleaned = false;
  var wordReady = prepareWordSource(youdaoBritishUrl(item.example), token);

  function cleanup() {
    if (cleaned) return;
    cleaned = true;
    if (typeof onSegment === 'function') onSegment(-1, '');
    if (activeSegmentCleanup === cleanup) activeSegmentCleanup = null;
  }
  activeSegmentCleanup = cleanup;
  if (typeof onSegment === 'function') onSegment(0, item.segments[0]);

  return (async function () {
    var duration = 0;

    for (var i = 0; i < item.segments.length; i++) {
      var symbol = item.segments[i];
      if (i > 0 && typeof onSegment === 'function') onSegment(i, symbol);
      var teachingSource = teachingAudioSource(symbol);
      var segmentItem = phoneticItem(symbol);
      var ok;
      if (teachingSource) {
        ok = await playSource(teachingSource, 1, token);
      } else if (MONOPHTHONG_SYMBOLS.indexOf(symbol) !== -1 && segmentItem) {
        ok = await playPhoneticItem(segmentItem, token);
      } else {
        if (!duration) duration = await wordReady;
        if (!duration) { cleanup(); return false; }
        var range = wordSegmentRange(item, i);
        ok = await playLoadedWordRange(range.start, range.end, segmentRate, duration, token);
      }
      if (!ok) { cleanup(); return false; }
      if (i < item.segments.length - 1 && !await waitFor(segmentGap, token)) {
        cleanup();
        return false;
      }
    }

    if (!await waitFor(blendGap, token)) { cleanup(); return false; }
    if (typeof onSegment === 'function') onSegment(-2, '');
    if (!duration) duration = await wordReady;
    if (!duration) { cleanup(); return false; }
    var blended = await playLoadedWordRange(item.clip[0], item.clip[1], 1, duration, token);
    cleanup();
    return blended;
  })();
}

window.speakPhoneticWord = speakPhoneticWord;
