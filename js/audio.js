/* 音效模块（原 index.html 迁移）：tone / playSuccess / playFail / playWin / setSound
   阶段2·T6（AIL-12）：音效按玩法区分 —— 单词版保留清脆/低沉提示音，
   音标版提供木鱼/水滴变体音色，游戏初始化时通过 setSoundVariant 选择 */

let audioCtx = null;
let soundOn = true;

/* 当前音色变体：'word' = 单词版（清脆/低沉），'phonetic' = 音标版（木鱼/水滴） */
let soundVariant = 'word';

/* 按玩法选择音色（游戏初始化时调用）：'word' 或 'phonetic' */
function setSoundVariant(variant) {
  soundVariant = variant === 'phonetic' ? 'phonetic' : 'word';
}

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

/* 木鱼音色：短促高频敲击（方波快速起音 + 轻微下滑 + 快速衰减，模拟木质敲击声） */
function woodblock(freq, dur, vol, when) {
  const ctx = getCtx();
  const t = ctx.currentTime + when;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = 'square';
  o.frequency.setValueAtTime(freq, t);
  o.frequency.exponentialRampToValueAtTime(freq * 0.88, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(ctx.destination);
  o.start(t);
  o.stop(t + dur + 0.05);
}

/* 水滴音色：高频正弦快速下滑（模拟水滴入水声），快速衰减 */
function waterDrop(freq, dur, vol, when) {
  const ctx = getCtx();
  const t = ctx.currentTime + when;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(freq, t);
  o.frequency.exponentialRampToValueAtTime(freq * 0.4, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(ctx.destination);
  o.start(t);
  o.stop(t + dur + 0.05);
}

/* 配对成功提示音：单词版清脆上行三音；音标版三滴水滴上行 */
function playSuccess() {
  if (!soundOn) return;
  if (soundVariant === 'phonetic') {
    waterDrop(880, 0.16, 0.32, 0);
    waterDrop(1100, 0.16, 0.32, 0.11);
    waterDrop(1400, 0.2, 0.32, 0.22);
  } else {
    tone(523.25, 0.4, 'triangle', 0.3, 0);
    tone(659.25, 0.4, 'triangle', 0.3, 0.12);
    tone(783.99, 0.5, 'triangle', 0.3, 0.24);
  }
}

/* 配对失败提示音：单词版低沉下行音；音标版两声低沉木鱼闷响 */
function playFail() {
  if (!soundOn) return;
  if (soundVariant === 'phonetic') {
    woodblock(240, 0.14, 0.32, 0);
    woodblock(200, 0.18, 0.3, 0.11);
    return;
  }
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

/* 胜利音效：单词版逐级上行四音；音标版木鱼+水滴交替上行琶音 */
function playWin() {
  if (!soundOn) return;
  if (soundVariant === 'phonetic') {
    woodblock(660, 0.1, 0.3, 0);
    waterDrop(780, 0.18, 0.3, 0.12);
    woodblock(880, 0.1, 0.3, 0.24);
    waterDrop(1040, 0.2, 0.3, 0.36);
  } else {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, 0.5, 'triangle', 0.3, i * 0.15));
  }
}

/* 音效开关 */
function setSound(on) {
  soundOn = on;
  soundBtn.textContent = on ? '音效 开' : '音效 关';
  soundBtn.classList.toggle('off', !on);
}