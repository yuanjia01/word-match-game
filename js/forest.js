/* ============================================================
   森林场景模块（js/forest.js）
   动态生成内嵌于场景的动物元素 —— 纯内联 SVG，无外部图片资源
   动物分别藏在树洞、灌木丛、树后、树枝上，属于场景的一部分
   仅做视觉与互动装饰，绝不改动游戏逻辑与数据结构
   ============================================================ */
(function () {
  'use strict';

  /* 防止重复初始化；body 存在即直接构建（脚本置于 body 末尾加载） */
  if (window.forestInited || !document.body) return;
  window.forestInited = true;

  /* 动物点击音（复用 audio.js 暴露的 tone 作曲，无则静默跳过） */
  function chirp(kind) {
    try {
      if (window.soundOn === false) return;
      if (typeof tone !== 'function') return;
      var notes = {
        chirp:  [[1568, 0.12, 'sine', 0.15, 0], [2093, 0.12, 'sine', 0.15, 0.1], [2637, 0.16, 'sine', 0.12, 0.2]],
        squeak: [[880, 0.1, 'sine', 0.14, 0], [1175, 0.1, 'sine', 0.14, 0.09], [1568, 0.14, 'sine', 0.12, 0.18]],
        bleat:  [[440, 0.18, 'sine', 0.18, 0], [554, 0.22, 'sine', 0.16, 0.12]],
        hop:    [[520, 0.08, 'sine', 0.12, 0], [392, 0.1, 'sine', 0.1, 0.09]]
      };
      (notes[kind] || notes.chirp).forEach(function (n) { tone(n[0], n[1], n[2], n[3], n[4]); });
    } catch (e) { /* 音效异常不影响游戏 */ }
  }

  /* 点击动物：抖动 / 眨眼 + 叫声提示 */
  function playAnimal(animal) {
    var kind = animal.getAttribute('data-sound') || 'chirp';
    animal.classList.remove('wiggle');
    void animal.offsetWidth; /* 强制重新触发 CSS 动画 */
    animal.classList.add('wiggle');
    chirp(kind);
  }

  /* ---------- 场景骨架（固定铺底，位于内容下层） ---------- */
  var scene = document.createElement('div');
  scene.id = 'forestScene';
  scene.setAttribute('aria-hidden', 'true');

  /* 内联 SVG 动物：松鼠探出树洞 / 兔子躲灌木 / 小鸟停枝 / 小鹿藏树后 */
  var squirrelSvg =
    '<svg viewBox="0 0 220 560" xmlns="http://www.w3.org/2000/svg">' +
    '  <defs>' +
    '    <linearGradient id="fsBarkL" x1="0" y1="0" x2="1" y2="0">' +
    '      <stop offset="0" stop-color="#8a5a33"/><stop offset=".5" stop-color="#7a4c2a"/><stop offset="1" stop-color="#5d3a1e"/>' +
    '    </linearGradient>' +
    '    <radialGradient id="fsHole" cx=".5" cy=".35" r=".8">' +
    '      <stop offset="0" stop-color="#241408"/><stop offset="1" stop-color="#100a05"/>' +
    '    </radialGradient>' +
    '  </defs>' +
    '  <rect x="18" y="-30" width="160" height="620" rx="20" fill="url(#fsBarkL)"/>' +
    '  <path d="M38 -20 v600 M62 -20 v600 M88 -20 v600 M114 -20 v600 M140 -20 v600 M158 -20 v600" stroke="#4e3118" stroke-width="2" opacity=".45" fill="none"/>' +
    '  <path d="M28 80 q30 -14 60 4 M30 180 q26 10 52 -6 M34 430 q30 -12 60 2" stroke="#4e3118" stroke-width="3" opacity=".5" fill="none"/>' +
    '  <ellipse cx="60" cy="140" rx="10" ry="14" fill="#6d4526" opacity=".5"/>' +
    '  <ellipse cx="130" cy="478" rx="12" ry="16" fill="#6d4526" opacity=".5"/>' +
    '  <ellipse cx="110" cy="300" rx="46" ry="56" fill="url(#fsHole)"/>' +
    '  <ellipse cx="106" cy="304" rx="36" ry="46" fill="#180d05"/>' +
    '  <ellipse cx="86" cy="262" rx="10" ry="18" fill="#a9602f" transform="rotate(-12 86 262)"/>' +
    '  <ellipse cx="134" cy="262" rx="10" ry="18" fill="#a9602f" transform="rotate(12 134 262)"/>' +
    '  <ellipse cx="88" cy="266" rx="5" ry="11" fill="#d89a6a" transform="rotate(-12 88 266)"/>' +
    '  <ellipse cx="132" cy="266" rx="5" ry="11" fill="#d89a6a" transform="rotate(12 132 266)"/>' +
    '  <ellipse cx="110" cy="300" rx="36" ry="32" fill="#a9602f"/>' +
    '  <ellipse cx="110" cy="318" rx="21" ry="16" fill="#e2ab73"/>' +
    '  <ellipse class="eye" cx="92" cy="294" rx="5" ry="6.5" fill="#33221a"/>' +
    '  <ellipse class="eye" cx="128" cy="294" rx="5" ry="6.5" fill="#33221a"/>' +
    '  <circle cx="93.5" cy="291.5" r="1.6" fill="#fff"/>' +
    '  <circle cx="129.5" cy="291.5" r="1.6" fill="#fff"/>' +
    '  <ellipse cx="110" cy="324" rx="6" ry="5" fill="#5a3218"/>' +
    '  <ellipse cx="92" cy="344" rx="13" ry="8" fill="#c8824c"/>' +
    '  <ellipse cx="128" cy="344" rx="13" ry="8" fill="#c8824c"/>' +
    '  <ellipse cx="70" cy="72" rx="16" ry="10" fill="#4e8b4e"/>' +
    '  <ellipse cx="96" cy="58" rx="14" ry="9" fill="#5f9e5f" transform="rotate(18 96 58)"/>' +
    '  <ellipse cx="90" cy="556" rx="48" ry="12" fill="#5f9e5f"/>' +
    '  <ellipse cx="58" cy="546" rx="26" ry="10" fill="#7fb069"/>' +
    '</svg>';

  var deerSvg =
    '<svg viewBox="0 0 220 560" xmlns="http://www.w3.org/2000/svg">' +
    '  <defs>' +
    '    <linearGradient id="fsBarkR" x1="0" y1="0" x2="1" y2="0">' +
    '      <stop offset="0" stop-color="#8a5a33"/><stop offset=".5" stop-color="#7a4c2a"/><stop offset="1" stop-color="#5d3a1e"/>' +
    '    </linearGradient>' +
    '    <linearGradient id="fsDeer" x1="0" y1="0" x2="0" y2="1">' +
    '      <stop offset="0" stop-color="#b0703a"/><stop offset="1" stop-color="#94592a"/>' +
    '    </linearGradient>' +
    '  </defs>' +
    '  <rect x="34" y="250" width="58" height="230" rx="24" fill="url(#fsDeer)"/>' +
    '  <g stroke="#7a4a24" stroke-width="7" stroke-linecap="round" fill="none">' +
    '    <path d="M40 208 Q32 168 22 140"/>' +
    '    <path d="M22 140 L10 128 M22 140 L24 124"/>' +
    '    <path d="M36 208 Q40 170 38 138"/>' +
    '    <path d="M38 138 L52 126 M38 138 L34 122"/>' +
    '  </g>' +
    '  <ellipse cx="22" cy="216" rx="8" ry="17" fill="#a06a35" transform="rotate(-18 22 216)"/>' +
    '  <ellipse cx="66" cy="212" rx="8" ry="17" fill="#a06a35" transform="rotate(20 66 212)"/>' +
    '  <ellipse cx="42" cy="240" rx="38" ry="34" fill="url(#fsDeer)"/>' +
    '  <ellipse class="eye" cx="26" cy="234" rx="4.5" ry="6" fill="#2c1c10"/>' +
    '  <ellipse class="eye" cx="58" cy="234" rx="4.5" ry="6" fill="#2c1c10"/>' +
    '  <circle cx="27.5" cy="231.5" r="1.6" fill="#fff"/>' +
    '  <circle cx="59.5" cy="231.5" r="1.6" fill="#fff"/>' +
    '  <ellipse cx="42" cy="260" rx="18" ry="13" fill="#e0a86b"/>' +
    '  <ellipse cx="42" cy="266" rx="6" ry="5" fill="#3a2416"/>' +
    '  <rect x="70" y="-30" width="170" height="620" rx="20" fill="url(#fsBarkR)"/>' +
    '  <path d="M84 -20 v600 M106 -20 v600 M132 -20 v600 M158 -20 v600 M184 -20 v600 M210 -20 v600" stroke="#4e3118" stroke-width="2" opacity=".45" fill="none"/>' +
    '  <path d="M88 120 q26 12 54 0 M84 360 q30 -12 62 2" stroke="#4e3118" stroke-width="3" opacity=".5" fill="none"/>' +
    '  <ellipse cx="150" cy="210" rx="11" ry="15" fill="#6d4526" opacity=".5"/>' +
    '  <ellipse cx="120" cy="560" rx="40" ry="14" fill="#4e8b4e"/>' +
    '  <ellipse cx="80" cy="550" rx="26" ry="12" fill="#5f9e5f"/>' +
    '  <ellipse cx="160" cy="552" rx="24" ry="11" fill="#447a44"/>' +
    '</svg>';

  var rabbitSvg =
    '<svg viewBox="0 0 320 250" xmlns="http://www.w3.org/2000/svg">' +
    '  <defs>' +
    '    <radialGradient id="fsBush" cx=".35" cy=".3" r=".9">' +
    '      <stop offset="0" stop-color="#7fb069"/><stop offset="1" stop-color="#4e7d3a"/>' +
    '    </radialGradient>' +
    '    <radialGradient id="fsBushF" cx=".35" cy=".3" r=".9">' +
    '      <stop offset="0" stop-color="#6da558"/><stop offset="1" stop-color="#3f6b30"/>' +
    '    </radialGradient>' +
    '  </defs>' +
    '  <ellipse cx="90" cy="225" rx="85" ry="46" fill="url(#fsBush)"/>' +
    '  <ellipse cx="230" cy="225" rx="95" ry="49" fill="url(#fsBush)"/>' +
    '  <ellipse cx="160" cy="198" rx="75" ry="40" fill="url(#fsBush)"/>' +
    '  <ellipse cx="92" cy="84" rx="12" ry="46" fill="#efe2c8" transform="rotate(-10 92 84)"/>' +
    '  <ellipse cx="130" cy="78" rx="12" ry="46" fill="#efe2c8" transform="rotate(12 130 78)"/>' +
    '  <ellipse cx="93" cy="88" rx="5.5" ry="30" fill="#f3b8c4" transform="rotate(-10 93 88)"/>' +
    '  <ellipse cx="128" cy="82" rx="5.5" ry="30" fill="#f3b8c4" transform="rotate(12 128 82)"/>' +
    '  <ellipse cx="112" cy="142" rx="38" ry="33" fill="#f2e5ca"/>' +
    '  <ellipse class="eye" cx="96" cy="134" rx="4.5" ry="6" fill="#3a2a1c"/>' +
    '  <ellipse class="eye" cx="128" cy="134" rx="4.5" ry="6" fill="#3a2a1c"/>' +
    '  <circle cx="97.5" cy="131.5" r="1.7" fill="#fff"/>' +
    '  <circle cx="129.5" cy="131.5" r="1.7" fill="#fff"/>' +
    '  <ellipse cx="112" cy="146" rx="4.5" ry="3.6" fill="#e88a9a"/>' +
    '  <ellipse cx="112" cy="155" rx="16" ry="11" fill="#fff" opacity=".85"/>' +
    '  <g stroke="#cbb58a" stroke-width="1.6" fill="none">' +
    '    <path d="M96 152 L70 146 M96 158 L70 162 M128 152 L154 146 M128 158 L154 162"/>' +
    '  </g>' +
    '  <ellipse cx="60" cy="212" rx="70" ry="42" fill="url(#fsBushF)"/>' +
    '  <ellipse cx="185" cy="214" rx="80" ry="44" fill="url(#fsBushF)"/>' +
    '  <ellipse cx="112" cy="206" rx="58" ry="34" fill="url(#fsBushF)"/>' +
    '  <circle cx="52" cy="184" r="5" fill="#fff"/><circle cx="52" cy="184" r="2.2" fill="#f2c14e"/>' +
    '  <circle cx="190" cy="182" r="5" fill="#fff"/><circle cx="190" cy="182" r="2.2" fill="#f2c14e"/>' +
    '  <circle cx="140" cy="202" r="4.4" fill="#fdf0f4"/><circle cx="140" cy="202" r="2" fill="#f2c14e"/>' +
    '</svg>';

  var birdSvg =
    '<svg viewBox="0 0 260 190" xmlns="http://www.w3.org/2000/svg">' +
    '  <defs>' +
    '    <linearGradient id="fsBranch" x1="0" y1="0" x2="0" y2="1">' +
    '      <stop offset="0" stop-color="#8a5a33"/><stop offset="1" stop-color="#5d3a1e"/>' +
    '    </linearGradient>' +
    '  </defs>' +
    '  <path d="M260 80 Q170 66 24 104" stroke="url(#fsBranch)" stroke-width="13" stroke-linecap="round" fill="none"/>' +
    '  <ellipse cx="120" cy="74" rx="22" ry="10" fill="#5f9e5f" transform="rotate(-28 120 74)"/>' +
    '  <ellipse cx="196" cy="60" rx="22" ry="10" fill="#6da558" transform="rotate(22 196 60)"/>' +
    '  <ellipse cx="76" cy="88" rx="18" ry="9" fill="#4e8b4e" transform="rotate(30 76 88)"/>' +
    '  <polygon points="176,44 208,30 196,52" fill="#c75a2a"/>' +
    '  <ellipse cx="152" cy="50" rx="30" ry="24" fill="#e8703a"/>' +
    '  <ellipse cx="152" cy="58" rx="20" ry="15" fill="#f5b26b"/>' +
    '  <ellipse cx="160" cy="50" rx="16" ry="11" fill="#cf5f2c" transform="rotate(-14 160 50)"/>' +
    '  <circle cx="128" cy="32" r="16" fill="#e8703a"/>' +
    '  <circle class="eye" cx="122" cy="30" r="3.4" fill="#33221a"/>' +
    '  <circle cx="123.2" cy="28.8" r="1.3" fill="#fff"/>' +
    '  <polygon points="112,32 100,34 112,38" fill="#f2b33d"/>' +
    '  <line x1="142" y1="70" x2="142" y2="77" stroke="#8a5a33" stroke-width="3"/>' +
    '  <line x1="162" y1="69" x2="162" y2="76" stroke="#8a5a33" stroke-width="3"/>' +
    '  <path d="M136 80 L142 78 L148 80 M156 79 L162 77 L168 79" stroke="#8a5a33" stroke-width="2.4" fill="none" stroke-linecap="round"/>' +
    '</svg>';

  scene.innerHTML = [
    '<div class="forest-sun"></div>',
    '<svg class="hills" viewBox="0 0 1200 260" preserveAspectRatio="none">' +
      '<path d="M0 260 V150 Q 200 60 420 140 T 900 118 T 1200 150 V260 Z" fill="#7fae6b" opacity=".5"/>' +
      '<path d="M0 260 V192 Q 300 92 700 170 T 1200 170 V260 Z" fill="#5e9452" opacity=".55"/>' +
      '<path d="M0 260 V222 Q 400 150 800 210 T 1200 205 V260 Z" fill="#477a44" opacity=".65"/>' +
    '</svg>',
    '<div class="mist mist-1"></div>',
    '<div class="mist mist-2"></div>',
    '<span class="leaf leaf-1"></span>',
    '<span class="leaf leaf-2"></span>',
    '<span class="leaf leaf-3"></span>',
    '<span class="leaf leaf-4"></span>',
    '<span class="leaf leaf-5"></span>',
    '<span class="leaf leaf-6"></span>',
    '<div class="animal animal-squirrel" data-sound="squeak">' + squirrelSvg + '<span class="call">吱吱~</span></div>',
    '<div class="animal animal-rabbit" data-sound="hop">' + rabbitSvg + '<span class="call">蹦蹦~</span></div>',
    '<div class="animal animal-bird" data-sound="chirp">' + birdSvg + '<span class="call">啾啾~</span></div>',
    '<div class="animal animal-deer" data-sound="bleat">' + deerSvg + '<span class="call">呦~</span></div>'
  ].join('');

  /* 绑定动物点击互动 */
  var animals = scene.querySelectorAll('.animal');
  Array.prototype.forEach.call(animals, function (el) {
    el.addEventListener('click', function () { playAnimal(el); });
  });

  try {
    document.body.appendChild(scene);
  } catch (e) { /* 场景构建失败也不影响游戏主流程 */ }
})();