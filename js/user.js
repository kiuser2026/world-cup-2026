// ============================================================
// 用户竞猜模块 — localStorage 读写
// ============================================================

const UserStore = (() => {
  const STORE_KEY = 'wc2026_predictions';
  const SCORES_KEY = 'wc2026_scores';

  /** 读取所有用户预测 */
  function getAll() {
    try {
      return JSON.parse(localStorage.getItem(STORE_KEY)) || {};
    } catch {
      return {};
    }
  }

  /** 保存单场预测 */
  function save(matchId, homeGoals, awayGoals) {
    const all = getAll();
    all[matchId] = { homeGoals: +homeGoals, awayGoals: +awayGoals, ts: Date.now() };
    localStorage.setItem(STORE_KEY, JSON.stringify(all));
    return all[matchId];
  }

  /** 获取单场预测 */
  function get(matchId) {
    return getAll()[matchId] || null;
  }

  /** 删除单场预测 */
  function remove(matchId) {
    const all = getAll();
    delete all[matchId];
    localStorage.setItem(STORE_KEY, JSON.stringify(all));
  }

  /** 清除所有预测 */
  function clearAll() {
    localStorage.removeItem(STORE_KEY);
  }

  /**
   * 计算用户得分
   * 猜对比分: 5 分
   * 猜对胜负(含平): 3 分
   * 猜错: 0 分
   */
  function calcScore(match) {
    const pred = get(match.id);
    if (!pred || match.homeScore === null || match.awayScore === null) return null;

    const actualResult = match.homeScore > match.awayScore ? 'H'
                       : match.homeScore === match.awayScore ? 'D' : 'A';
    const predResult   = pred.homeGoals > pred.awayGoals ? 'H'
                       : pred.homeGoals === pred.awayGoals ? 'D' : 'A';

    // 猜对比分
    if (pred.homeGoals === match.homeScore && pred.awayGoals === match.awayScore) {
      return { points: 5, reason: '猜对比分 🎯' };
    }
    // 猜对胜负
    if (predResult === actualResult) {
      return { points: 3, reason: '猜对胜负 ✅' };
    }
    return { points: 0, reason: '猜错 ❌' };
  }

  /**
   * 计算总分和统计
   */
  function getStats(matches) {
    let totalPoints = 0;
    let exact = 0;
    let correct = 0;
    let wrong = 0;
    let played = 0;
    const results = [];

    matches.forEach(m => {
      if (m.homeScore === null || m.awayScore === null) return;
      const score = calcScore(m);
      if (score === null) return;

      played++;
      totalPoints += score.points;
      if (score.points === 5) exact++;
      else if (score.points === 3) correct++;
      else wrong++;

      results.push({ match: m, ...score, prediction: get(m.id) });
    });

    return {
      totalPoints,
      played,
      exact,
      correct,
      wrong,
      accuracy: played > 0 ? ((exact + correct) / played * 100).toFixed(1) : '0.0',
      exactRate: played > 0 ? (exact / played * 100).toFixed(1) : '0.0',
      results,
    };
  }

  /** 导出预测数据为 JSON */
  function exportData() {
    return JSON.stringify(getAll(), null, 2);
  }

  /** 导入预测数据 */
  function importData(jsonStr) {
    try {
      const data = JSON.parse(jsonStr);
      localStorage.setItem(STORE_KEY, JSON.stringify(data));
      return true;
    } catch {
      return false;
    }
  }

  return { getAll, save, get, remove, clearAll, calcScore, getStats, exportData, importData };
})();
