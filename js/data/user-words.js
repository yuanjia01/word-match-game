/* 自定义词库存储（阶段1·T8 / AIL-14）
   仅负责「自定义词库」数据的持久化读写（localStorage），不含任何解析逻辑。
   暴露全局 window.USER_WORDS：get / save / clear / count / hasWords。
   数据形状与内置 BASE_WORDS 一致：[['英文', '中文'], ...] */
(function () {
  'use strict';

  var KEY = 'userWords';
  var list = [];

  /* 读取已持久化的词库（损坏数据自动丢弃） */
  function load() {
    try {
      var raw = window.localStorage.getItem(KEY);
      if (!raw) return;
      var parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return;
      list = parsed.filter(function (item) {
        return Array.isArray(item) && item.length >= 2 &&
          typeof item[0] === 'string' && item[0] &&
          item[1] !== null && item[1] !== undefined;
      }).map(function (item) { return [item[0], String(item[1])]; });
    } catch (e) {
      list = [];
    }
  }

  function persist() {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(list));
    } catch (e) { /* 存储失败不阻断游戏 */ }
  }

  load();

  window.USER_WORDS = {
    /* 返回词库副本：[[英文, 中文], ...] */
    get: function () { return list.slice(); },
    /* 整体替换词库 */
    save: function (words) {
      list = (Array.isArray(words) ? words : []).map(function (w) {
        return [String(w[0]), String(w[1])];
      });
      persist();
    },
    /* 清空词库 */
    clear: function () {
      list = [];
      try { window.localStorage.removeItem(KEY); } catch (e) { /* 忽略 */ }
    },
    /* 词条数量 */
    count: function () { return list.length; },
    /* 是否有词可玩 */
    hasWords: function () { return list.length > 0; }
  };
})();