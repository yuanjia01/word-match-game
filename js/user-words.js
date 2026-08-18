/* 自定义单词本导入逻辑（阶段1·T8 / AIL-14）
   入口：window.UserWordsImport.import(text) -> Promise
   支持三种格式：
     1) 每行一个单词/短语 —— 自动补中文释义（优先查内置词库，其次有道词典 suggest 接口，
        仍查不到则跳过该行并计数，保证可玩性）
     2) 每行 "word, 中文释义" 或 "word 中文释义"
     3) JSON 数组 [{"word":"apple","cn":"苹果"}]（也兼容 {"en":..., "zh":...} 等键名，可含单个对象）
   导入采用「整体替换」：新导入内容直接替换现有自定义词库，重新导入即覆盖。 */
(function () {
  'use strict';

  var TIMEOUT = 4000;

  /* 内置词库兜底翻译：命中内置 BASE_WORDS / GRADE_WORDS_3_9 则无需联网 */
  function builtinCn(word) {
    var w = String(word).toLowerCase();
    if (typeof BASE_WORDS !== 'undefined') {
      for (var i = 0; i < BASE_WORDS.length; i++) {
        if (String(BASE_WORDS[i][0]).toLowerCase() === w) return String(BASE_WORDS[i][1]);
      }
    }
    if (typeof GRADE_WORDS_3_9 !== 'undefined') {
      var grades = Object.keys(GRADE_WORDS_3_9);
      for (var g = 0; g < grades.length; g++) {
        var arr = GRADE_WORDS_3_9[grades[g]];
        for (var j = 0; j < arr.length; j++) {
          if (String(arr[j].en).toLowerCase() === w) return String(arr[j].cn);
        }
      }
    }
    return '';
  }

  /* 有道词典 suggest 接口（JSONP，规避跨域），超时或异常返回空串
     响应示例：{ "result": {code:200}, "data": { "entries": [{ "explain": "n. 苹果", "entry": "apple" }] } } */
  function youdaoCn(word) {
    return new Promise(function (resolve) {
      var cb = 'ydcb' + Date.now() + Math.floor(Math.random() * 1e6);
      var script = null;
      var done = false;
      function finish(val) {
        if (done) return;
        done = true;
        try {
          if (script && script.parentNode) script.parentNode.removeChild(script);
        } catch (e) { /* 忽略 */ }
        try { delete window[cb]; } catch (e) { window[cb] = undefined; }
        resolve(val);
      }
      window[cb] = function (data) {
        var cn = '';
        try {
          var entries = data && data.data && data.data.entries;
          if (Array.isArray(entries) && entries.length && entries[0].explain) {
            cn = String(entries[0].explain)
              .replace(/^[a-z]+\.\s*/i, '')
              .split(/[;；]/)[0]
              .trim();
          }
        } catch (e) { /* 忽略 */ }
        finish(cn);
      };
      var t = setTimeout(function () { finish(''); }, TIMEOUT);
      script = document.createElement('script');
      script.src = 'https://dict.youdao.com/suggest?num=1&doctype=json&callback=' + cb +
        '&q=' + encodeURIComponent(word);
      script.onerror = function () { finish(''); };
      document.head.appendChild(script);
    });
  }

  /* 为缺少中文的单词补释义：内置词库 -> 有道接口 */
  function fillCn(word) {
    return Promise.resolve().then(function () {
      var local = builtinCn(word);
      if (local) return local;
      return youdaoCn(word).then(function (cn) { return cn || ''; });
    });
  }

  /* 解析 JSON 数组/对象 */
  function parseJson(str) {
    var data;
    try {
      data = JSON.parse(str);
    } catch (e) {
      return { kind: 'json', valid: [], bare: [], invalid: [{ line: str.slice(0, 40) + '…', reason: 'JSON 格式错误' }] };
    }
    var arr = Array.isArray(data) ? data : [data];
    var valid = [], bare = [], invalid = [], seen = {};
    for (var i = 0; i < arr.length; i++) {
      var item = arr[i];
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        invalid.push({ line: '[' + i + ']', reason: '元素不是对象' });
        continue;
      }
      var en = item.word != null ? item.word : item.en;
      var cn = item.cn != null ? item.cn : (item.zh != null ? item.zh : item.chinese);
      if (en == null || String(en).trim() === '') {
        invalid.push({ line: '[' + i + '] ' + JSON.stringify(item), reason: '缺少单词字段 word/en' });
        continue;
      }
      var e = String(en).trim();
      if (seen[e]) { invalid.push({ line: e, reason: '重复单词：' + e }); continue; }
      seen[e] = true;
      if (cn == null || String(cn).trim() === '') {
        bare.push(e);
      } else {
        valid.push([e, String(cn).trim()]);
      }
    }
    return { kind: 'json', valid: valid, bare: bare, invalid: invalid };
  }

  /* 解析逐行文本（每行一个单词 / "word 中文" / "word, 中文"） */
  function parseLines(str) {
    var lines = str.split(/\r?\n/);
    var valid = [], bare = [], invalid = [], seen = {};
    function addPair(en, cn, raw) {
      if (!en) return false;
      if (seen[en]) { invalid.push({ line: raw, reason: '重复单词：' + en }); return true; }
      seen[en] = true;
      valid.push([en, cn]);
      return true;
    }
    function addBare(word, raw) {
      if (seen[word]) { invalid.push({ line: raw, reason: '重复单词：' + word }); return; }
      seen[word] = true;
      bare.push(word);
    }
    for (var i = 0; i < lines.length; i++) {
      var raw = lines[i].trim();
      if (!raw) continue;
      /* 含中文：按首个中文字符切开，左侧为英文、右侧为中文释义（兼容逗号/空格分隔） */
      var cjk = /[\u4e00-\u9fff]/.exec(raw);
      if (cjk) {
        var enA = raw.slice(0, cjk.index).trim().replace(/[,，、;：;\s]+$/g, '');
        var cnA = raw.slice(cjk.index).trim();
        if (enA) { addPair(enA, cnA, raw); continue; }
        invalid.push({ line: raw, reason: '缺少英文单词' });
        continue;
      }
      /* 无中文但含逗号：按首个逗号切开 */
      var ci = raw.indexOf(',');
      var czi = raw.indexOf('，');
      var comma = (ci < 0 ? czi : (czi < 0 ? ci : Math.min(ci, czi)));
      if (comma >= 0) {
        var enB = raw.slice(0, comma).trim();
        var cnB = raw.slice(comma + 1).trim();
        if (enB && cnB) { addPair(enB, cnB, raw); continue; }
        invalid.push({ line: raw, reason: '格式不完整' });
        continue;
      }
      /* 单个英文单词 -> 裸词，待自动补释义 */
      if (/^[A-Za-z][A-Za-z'’-]*$/.test(raw)) { addBare(raw, raw); continue; }
      /* 无中文无逗号的多词英文行 -> 视为一个短语，整体待补释义（如 "ice cream"） */
      if (/^[A-Za-z]/.test(raw) && /^[\sA-Za-z'’\-]+$/.test(raw)) { addBare(raw, raw); continue; }
      invalid.push({ line: raw, reason: '无法识别的行' });
    }
    return { kind: 'lines', valid: valid, bare: bare, invalid: invalid };
  }

  /* 同步解析文本，返回 { kind, valid: [[en, cn]], bare: [en], invalid: [{line, reason}] } */
  function parseText(text) {
    var trimmed = (text || '').trim();
    if (!trimmed) return { kind: 'lines', valid: [], bare: [], invalid: [{ line: '', reason: '内容为空' }] };
    var first = trimmed.charAt(0);
    if (first === '[' || first === '{') return parseJson(trimmed);
    return parseLines(trimmed);
  }

  /* 异步导入：解析 -> 为裸词补释义 -> 整体替换自定义词库 */
  function importText(text) {
    return Promise.resolve().then(function () {
      var parsed = parseText(text);
      var batch = parsed.bare.map(function (word) { return { word: word, cn: '' }; });
      function fillNext(idx) {
        if (idx >= batch.length) return Promise.resolve();
        return fillCn(batch[idx].word).then(function (cn) {
          batch[idx].cn = cn;
          return fillNext(idx + 1);
        });
      }
      return fillNext(0).then(function () {
        var words = [];
        var skipped = parsed.invalid.slice();
        parsed.valid.forEach(function (pair) { words.push(pair); });
        batch.forEach(function (item) {
          if (item.cn) words.push([item.word, item.cn]);
          else skipped.push({ line: item.word, reason: '未找到中文释义' });
        });
        window.USER_WORDS.save(words);
        return {
          imported: words.length,
          skipped: skipped,
          lines: parsed.valid.length + parsed.bare.length + parsed.invalid.length
        };
      });
    });
  }

  window.UserWordsImport = {
    import: importText,
    parse: parseText
  };
})();