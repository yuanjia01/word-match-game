/* 通用逻辑（原 index.html 迁移）：shuffle / pickPairs / luminance / shade / buildBoard，供各玩法复用 */

/* 洗牌 */
function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* 抽取本关 9 个词条（不重复），不足时重置已用集合 */
function pickPairs() {
  const pool = WORDS.map((word, index) => ({ word, index }))
    .filter(item => activeLevel === 'all' || item.word[2] === activeLevel);
  let avail = pool.filter(item => !usedIdx.has(item.index));
  if (avail.length < 9) { usedIdx = new Set(); avail = pool; }
  shuffle(avail);
  const chosen = avail.slice(0, 9);
  chosen.forEach(item => usedIdx.add(item.index));
  return chosen.map(item => item.word);
}

/* 计算颜色亮度（0~1） */
function luminance(hex) {
  const c = hex.replace('#', '');
  const r = parseInt(c.substr(0, 2), 16), g = parseInt(c.substr(2, 2), 16), b = parseInt(c.substr(4, 2), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

/* 按系数调整颜色深浅，返回 rgb() 字符串 */
function shade(hex, f) {
  const c = hex.replace('#', '');
  const r = Math.round(parseInt(c.substr(0, 2), 16) * f);
  const g = Math.round(parseInt(c.substr(2, 2), 16) * f);
  const b = Math.round(parseInt(c.substr(4, 2), 16) * f);
  return 'rgb(' + r + ',' + g + ',' + b + ')';
}

/* 根据词条列表生成 18 个泡泡（中英各一个，随机排列） */
function buildBoard(list) {
  pairs = list;
  matched = 0;
  selected = null;
  board.innerHTML = '';
  const tiles = [];
  list.forEach((w, i) => {
    tiles.push({ key: i, type: 'en', text: w[0] });
    tiles.push({ key: i, type: 'zh', text: w[1] });
  });
  shuffle(tiles);
  tiles.forEach(t => {
    const el = document.createElement('div');
    el.className = 'bubble' + (t.text.length > 7 ? ' long' : '');
    el.textContent = t.text;
    el.dataset.key = t.key;
    el.dataset.type = t.type;
    el.dataset.text = t.text;
    el.dataset.level = list[t.key][2];
    const color = PALETTE[Math.floor(Math.random() * PALETTE.length)];
    el.style.background = 'radial-gradient(circle at 32% 28%, rgba(255,255,255,.9), ' + color + ' 58%, ' + shade(color, 0.45) + ' 100%)';
    el.style.boxShadow = 'inset -8px -12px 18px rgba(0,0,0,.18), inset 6px 10px 14px rgba(255,255,255,.4), 0 10px 22px rgba(0,0,0,.22)';
    el.style.color = luminance(color) > 0.55 ? '#333' : '#fff';
    el.style.textShadow = luminance(color) > 0.55 ? '0 1px 2px rgba(255,255,255,.6)' : '0 1px 3px rgba(0,0,0,.45)';
    board.appendChild(el);
  });
}