/* 朗读模块（原 index.html 迁移）：loadVoices / speak（Web Speech API）
   阶段2·T6（AIL-12）：新增 speakPhonetic —— 音标玩法朗读音标，
   读取 PHONETICS 数据里的示例词与中文描述
   阶段2·修复：恢复有道发音兜底（原版 1aab6520 有，T0 重构时丢失）。
   关键：iOS/微信内嵌浏览器 speechSynthesis 多静默失败，且音频播放必须发生在
   用户点击手势内（setTimeout 回调中的 play() 会被拦截）。因此触摸设备直接走
   有道发音（手势内播放），PC 走原生 TTS 并保留延迟实播检测兜底 */

let voices = [];

/* 加载浏览器可用语音 */
function loadVoices() { voices = speechSynthesis.getVoices(); }
if ('speechSynthesis' in window) {
  loadVoices();
  speechSynthesis.onvoiceschanged = loadVoices;
}

/* 触摸设备判定（iOS/Android 手机平板；iPad 桌面 UA 也有 maxTouchPoints） */
function isTouchDevice() {
  return ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
}

/* 有道词典发音兜底（美音）：必须在用户手势内调用 play() 才不会被 iOS 拦截 */
function youdaoSpeak(word) {
  const a = new Audio('https://dict.youdao.com/dictvoice?type=2&audio=' + encodeURIComponent(word));
  a.play().catch(function () {});
  return a;
}

/* PC 端实播检测：speak 后 900ms 仍未发声则用有道兜底 */
function ttsFallbackWatch(word) {
  setTimeout(function () {
    if (!speechSynthesis.speaking && !speechSynthesis.pending) youdaoSpeak(word);
  }, 900);
}

/* 朗读英文单词（单词版现用逻辑）。触摸设备直接有道；PC 原生 TTS + 实播检测兜底 */
function speak(word) {
  if (isTouchDevice() || !('speechSynthesis' in window)) {
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
  ttsFallbackWatch(word);
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
  if (isTouchDevice() || !('speechSynthesis' in window)) {
    /* 触摸设备：有道读音素近似拼读（如 "ee"），中文描述有道不支持则跳过 */
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
  /* PC 实播检测：900ms 未发声则降级为有道读音素拼读 */
  setTimeout(function () {
    if (!speechSynthesis.speaking && !speechSynthesis.pending) youdaoSpeak(item.sound);
  }, 900);
}