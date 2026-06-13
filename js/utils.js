// ============================================================
// 工具函数
// ============================================================

const Utils = (() => {

  /** 格式化日期: 2026-06-11 → 6月11日 周四 */
  function formatDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00+08:00');
    const weekDays = ['周日','周一','周二','周三','周四','周五','周六'];
    return `${d.getMonth()+1}月${d.getDate()}日 ${weekDays[d.getDay()]}`;
  }

  /** 格式化日期+时间 */
  function formatDateTime(dateStr, timeStr) {
    return `${formatDate(dateStr)} ${timeStr}`;
  }

  /** 获取队伍信息的简写 */
  function teamDisplay(code) {
    const t = TEAMS[code];
    if (!t) return code; // 可能是 "1A" "W73" 等占位符
    return `${t.flag} ${t.name}`;
  }

  /** 队伍短名（带 flag） */
  function teamShort(code) {
    const t = TEAMS[code];
    if (!t) return code;
    return `${t.flag}${t.name}`;
  }

  /** 比分显示 */
  function scoreDisplay(homeScore, awayScore) {
    if (homeScore === null || awayScore === null) return 'vs';
    return `${homeScore} - ${awayScore}`;
  }

  /** 获取今天日期字符串 YYYY-MM-DD */
  function today() {
    const d = new Date();
    return d.getFullYear() + '-' +
           String(d.getMonth()+1).padStart(2,'0') + '-' +
           String(d.getDate()).padStart(2,'0');
  }

  /** 判断比赛是否已结束 */
  function isFinished(match) {
    return match.homeScore !== null && match.awayScore !== null;
  }

  /** 判断比赛是否进行中（简化：日期是今天且未结束） */
  function isLive(match) {
    return !isFinished(match) && match.date === today();
  }

  /** 判断比赛是否未开始 */
  function isUpcoming(match) {
    return !isFinished(match) && match.date > today();
  }

  /** 比赛状态 */
  function matchStatus(match) {
    if (isFinished(match)) return 'finished';
    if (isLive(match)) return 'live';
    return 'upcoming';
  }

  /** 结果颜色 class */
  function resultClass(points) {
    if (points === 5) return 'result-exact';
    if (points === 3) return 'result-correct';
    return 'result-wrong';
  }

  /** 创建 DOM 元素 */
  function el(tag, attrs = {}, children = []) {
    const elem = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (k === 'class') elem.className = v;
      else if (k === 'html') elem.innerHTML = v;
      else if (k === 'text') elem.textContent = v;
      else if (k.startsWith('on')) elem.addEventListener(k.slice(2).toLowerCase(), v);
      else elem.setAttribute(k, v);
    });
    children.forEach(child => {
      if (typeof child === 'string') elem.appendChild(document.createTextNode(child));
      else if (child) elem.appendChild(child);
    });
    return elem;
  }

  /** 按日期分组比赛 */
  function groupByDate(matches) {
    const groups = {};
    matches.forEach(m => {
      if (!groups[m.date]) groups[m.date] = [];
      groups[m.date].push(m);
    });
    return Object.entries(groups).sort(([a],[b]) => a.localeCompare(b));
  }

  /** 节流 */
  function throttle(fn, ms) {
    let last = 0;
    return function(...args) {
      const now = Date.now();
      if (now - last >= ms) {
        last = now;
        return fn.apply(this, args);
      }
    };
  }

  /** 胜平负颜色 */
  function resultColor(result) {
    if (result === 'win')  return 'var(--win)';
    if (result === 'draw') return 'var(--draw)';
    return 'var(--loss)';
  }

  return {
    formatDate, formatDateTime, teamDisplay, teamShort,
    scoreDisplay, today, isFinished, isLive, isUpcoming,
    matchStatus, resultClass, el, groupByDate, throttle, resultColor,
  };
})();
