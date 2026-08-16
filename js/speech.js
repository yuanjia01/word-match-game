/* 朗读模块（原 index.html 迁移）：loadVoices / speak（Web Speech API） */

let voices = [];

/* 加载浏览器可用语音 */
function loadVoices() { voices = speechSynthesis.getVoices(); }
if ('speechSynthesis' in window) {
  loadVoices();
  speechSynthesis.onvoiceschanged = loadVoices;
}

/* 朗读英文单词 */
function speak(word) {
  if (!('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(word);
  u.lang = 'en-US';
  u.rate = 0.95;
  u.pitch = 1.05;
  const v = voices.find(v => v.lang.replace('_', '-').toLowerCase().startsWith('en'));
  if (v) u.voice = v;
  speechSynthesis.speak(u);
}