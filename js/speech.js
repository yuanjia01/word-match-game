/* 朗读模块（原 index.html 迁移）：loadVoices / speak（Web Speech API）
   阶段2·T6（AIL-12）：新增 speakPhonetic —— 音标玩法朗读音标，
   读取 PHONETICS 数据里的示例词与中文描述
   阶段2·修复：恢复有道发音兜底（原版 1aab6520 有，T0 重构时丢失）。
   手机/平板（iOS Safari、微信内嵌浏览器）无系统语音包时 speechSynthesis 不发声，
   改用有道词典发音接口兜底 */

let voices = [];

/* 加载浏览器可用语音 */
function loadVoices() { voices = speechSynthesis.getVoices(); }
if ('speechSynthesis' in window) {
  loadVoices();
  speechSynthesis.onvoiceschanged = loadVoices;
}

/* 有道词典发音兜底（美音），兼容手机端无 TTS 语音包的场景 */
function youdaoSpeak(word) {
  const a = new Audio('https://dict.youdao.com/dictvoice?type=2&audio=' + encodeURIComponent(word));
  a.play().catch(function () {});
  return a;
}

/* 有可用英文语音即认为原生 TTS 可用 */
function hasEnglishVoice() {
  return 'speechSynthesis' in window && voices.length > 0 &&
    voices.some(v => v.lang.replace('_', '-').toLowerCase().startsWith('en'));
}

/* 朗读英文单词（单词版现用逻辑）；手机端无 TTS 语音包时降级为有道发音 */
function speak(word) {
  if (!hasEnglishVoice()) {
    youdaoSpeak(word);
    return;
  }
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(word);
  u.lang = 'en-US';
  u.rate = 0.95;
  u.pitch = 1.05;
  const v = voices.find(v => v.lang.replace('_', '-').toLowerCase().startsWith('en'));
  if (v) u.voice = v;
  speechSynthesis.speak(u);
}

/* 朗读音标（音标版）：只朗读音标本身的发音，不读示例词（避免泄露答案）。
   用 PHONETICS 数据里的 sound 字段（音素的近似拼读，如 i: → "ee"）做英文朗读，
   再读中文描述（如"长音 i"）；找不到对应词条则直接读符号文本兜底 */
function speakPhonetic(symbol) {
  let item = null;
  if (typeof PHONETICS !== 'undefined') {
    item = PHONETICS.find(p => p.symbol === symbol);
  }
  if (!item) { speak(symbol); return; }
  /* 手机端无 TTS 语音包：用有道读音素近似拼读（如 "ee"），中文描述无法朗读则跳过 */
  if (!hasEnglishVoice()) {
    youdaoSpeak(item.sound);
    return;
  }
  speechSynthesis.cancel();
  /* 音素近似拼读 · 英文朗读（仅音素本身，不含示例词） */
  const uEn = new SpeechSynthesisUtterance(item.sound);
  uEn.lang = 'en-US';
  uEn.rate = 0.8;
  uEn.pitch = 1.0;
  const vEn = voices.find(v => v.lang.replace('_', '-').toLowerCase().startsWith('en'));
  if (vEn) uEn.voice = vEn;
  speechSynthesis.speak(uEn);
  /* 中文描述 · 中文朗读 */
  const uZh = new SpeechSynthesisUtterance(item.cn);
  uZh.lang = 'zh-CN';
  uZh.rate = 0.9;
  uZh.pitch = 1.1;
  const vZh = voices.find(v => v.lang.replace('_', '-').toLowerCase().startsWith('zh'));
  if (vZh) uZh.voice = vZh;
  speechSynthesis.speak(uZh);
}