/* 音效模块（原 index.html 迁移）：tone / playSuccess / playFail / playWin / setSound */

let audioCtx = null;
let soundOn = true;

/* 获取并恢复 Web Audio 上下文 */
function getCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

/* 播放单个音符 */
function tone(freq, dur, type, vol, when) {
  const ctx = getCtx();
  const t = ctx.currentTime + when;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.03);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(ctx.destination);
  o.start(t);
  o.stop(t + dur + 0.05);
}

/* 配对成功提示音（清脆上行三音） */
function playSuccess() {
  if (!soundOn) return;
  tone(523.25, 0.4, 'triangle', 0.3, 0);
  tone(659.25, 0.4, 'triangle', 0.3, 0.12);
  tone(783.99, 0.5, 'triangle', 0.3, 0.24);
}

/* 配对失败提示音（低沉下行音） */
function playFail() {
  if (!soundOn) return;
  const ctx = getCtx();
  const t = ctx.currentTime;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = 'sawtooth';
  o.frequency.setValueAtTime(200, t);
  o.frequency.exponentialRampToValueAtTime(110, t + 0.45);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.18, t + 0.03);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
  o.connect(g).connect(ctx.destination);
  o.start(t);
  o.stop(t + 0.55);
}

/* 胜利音效 */
function playWin() {
  if (!soundOn) return;
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, 0.5, 'triangle', 0.3, i * 0.15));
}

/* 音效开关 */
function setSound(on) {
  soundOn = on;
  soundBtn.textContent = on ? '音效 开' : '音效 关';
  soundBtn.classList.toggle('off', !on);
}