// ============================================================
// 主逻辑 v2 — 多因素分析展示
// ============================================================

const App = (() => {
  const U = (typeof Utils !== 'undefined') ? Utils : {};
  const el = U.el || function(tag, attrs, children) { return document.createElement(tag); };
  const formatDate = U.formatDate || function(d) { return d; };
  const formatDateTime = U.formatDateTime || function(d, t) { return d + ' ' + t; };
  const teamDisplay = U.teamDisplay || function(c) { return c; };
  const teamShort = U.teamShort || function(c) { return c; };
  const scoreDisplay = U.scoreDisplay || function(h, a) { return h + '-' + a; };
  const isFinished = U.isFinished || function(m) { return m.homeScore !== null; };
  const isLive = U.isLive || function() { return false; };
  const isUpcoming = U.isUpcoming || function(m) { return m.homeScore === null; };
  const matchStatus = U.matchStatus || function(m) { return m.homeScore !== null ? 'finished' : 'upcoming'; };
  const resultClass = U.resultClass || function() { return ''; };
  const groupByDate = U.groupByDate || function(matches) {
    const g = {};
    matches.forEach(m => { if (!g[m.date]) g[m.date] = []; g[m.date].push(m); });
    return Object.entries(g).sort(([a],[b]) => a.localeCompare(b));
  };

  /** 比赛排序优先级: 进行中 > 未开始 > 已结束 */
  function matchPriority(m) {
    if (isFinished(m)) return 2;
    if (isLive(m)) return 0;
    return 1;
  }

  /** 按比赛时间(日期+时间)排序, 同时间用 id 兜底 */
  function compareMatchTime(a, b) {
    const ka = `${a.date} ${a.time || '00:00'}`;
    const kb = `${b.date} ${b.time || '00:00'}`;
    return ka.localeCompare(kb) || a.id - b.id;
  }

  function init() {
    try {
      bindTabs();
      renderSchedule();
      renderPredict();
      renderLeaderboard();
      renderAnalysis();
    } catch(e) {
      console.error('初始化错误:', e);
      document.getElementById('page-schedule').innerHTML =
        '<div style="color:#ff5252;padding:20px"><h3>⚠️ 加载出错</h3><pre>' + e.message + '\n' + e.stack + '</pre></div>';
    }
  }

  function bindTabs() {
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(`page-${tab.dataset.tab}`).classList.add('active');
        if (tab.dataset.tab === 'leaderboard') renderLeaderboard();
        if (tab.dataset.tab === 'analysis')    renderAnalysis();
      });
    });
  }

  // ════════════════════════════════════════════════════════
  // 赛程页
  // ════════════════════════════════════════════════════════
  function renderSchedule() {
    const page = document.getElementById('page-schedule');
    page.innerHTML = '';

    const filterBar = el('div', { class: 'filter-bar' });
    const stageSelect = el('select', { id: 'sched-stage' });
    ['全部阶段','小组赛','1/16 决赛','1/8 决赛','1/4 决赛','半决赛','三四名决赛','决赛']
      .forEach((label, i) => {
        const opt = el('option', { text: label });
        opt.value = i === 0 ? 'all' : ['group','r32','r16','qf','sf','third','final'][i-1];
        stageSelect.appendChild(opt);
      });

    const groupSelect = el('select', { id: 'sched-group' });
    ['全部小组', ...GROUPS.map(g => `${g} 组`)].forEach((label, i) => {
      const opt = el('option', { text: label });
      opt.value = i === 0 ? 'all' : GROUPS[i-1];
      groupSelect.appendChild(opt);
    });

    const statusSelect = el('select', { id: 'sched-status' });
    [['all','全部状态'],['finished','已结束'],['upcoming','未开始']].forEach(([v,t]) => {
      const opt = el('option', { text: t });
      opt.value = v;
      statusSelect.appendChild(opt);
    });

    filterBar.append(stageSelect, groupSelect, statusSelect);
    page.appendChild(filterBar);

    const listContainer = el('div', { id: 'sched-list' });
    page.appendChild(listContainer);

    [stageSelect, groupSelect, statusSelect].forEach(sel => {
      sel.addEventListener('change', () => {
        renderScheduleList(listContainer, stageSelect.value, groupSelect.value, statusSelect.value);
      });
    });

    renderScheduleList(listContainer, 'all', 'all', 'all');
  }

  function renderScheduleList(container, stage, group, status) {
    container.innerHTML = '';
    let matches = [...MATCHES];
    if (stage !== 'all') matches = matches.filter(m => m.stage === stage);
    if (group !== 'all') matches = matches.filter(m => m.group === group);
    if (status !== 'all') matches = matches.filter(m => matchStatus(m) === status);

    // 未开始/进行中的比赛置顶, 已结束的比赛置底; 同状态内按时间升序
    matches.sort((a, b) => matchPriority(a) - matchPriority(b) || compareMatchTime(a, b));

    if (!matches.length) {
      container.appendChild(el('div', { class: 'empty-state', html:
        '<div class="emoji">📭</div><p>没有符合条件的比赛</p>' }));
      return;
    }

    const grouped = groupByDate(matches);
    grouped.forEach(([date, dayMatches]) => {
      container.appendChild(el('div', { class: 'date-header', text: formatDate(date) }));
      dayMatches.forEach(m => container.appendChild(buildMatchCard(m)));
    });
  }

  function buildMatchCard(match) {
    const card = el('div', { class: 'match-card' });
    const status = matchStatus(match);
    const venue = VENUES[match.venue] || match.venue || '';
    const stageLabel = STAGE_NAMES[match.stage] || match.stage;

    const meta = el('div', { class: 'meta' });
    meta.innerHTML = `
      <span>${formatDateTime(match.date, match.time)}</span>
      <span class="stage-badge">${stageLabel}${match.group ? ' · ' + match.group + '组' : ''}</span>
      <span class="venue">${venue}</span>
    `;
    card.appendChild(meta);

    const teams = el('div', { class: 'teams' });
    const homeInfo = TEAMS[match.home];
    const awayInfo = TEAMS[match.away];

    const homeDiv = el('div', { class: 'team home' });
    const awayDiv = el('div', { class: 'team away' });

    if (homeInfo) {
      homeDiv.innerHTML = `<span class="flag">${homeInfo.flag}</span>
        <span>${homeInfo.name} <span class="rank">#${homeInfo.rank}</span></span>`;
    } else {
      homeDiv.innerHTML = `<span>${match.home}</span>`;
    }

    if (awayInfo) {
      awayDiv.innerHTML = `<span>${awayInfo.name} <span class="rank">#${awayInfo.rank}</span></span>
        <span class="flag">${awayInfo.flag}</span>`;
    } else {
      awayDiv.innerHTML = `<span>${match.away}</span>`;
    }

    const scoreBox = el('div', { class: `score-box ${status}` });
    scoreBox.textContent = status === 'finished'
      ? `${match.homeScore} - ${match.awayScore}`
      : (status === 'live' ? '🔴 LIVE' : 'vs');

    teams.append(homeDiv, scoreBox, awayDiv);
    card.appendChild(teams);

    // AI 预测 (多因素)
    if (TEAMS[match.home] && TEAMS[match.away]) {
      const pred = Predictor.predict(match.home, match.away, { match });
      const userPred = UserStore.get(match.id);

      const predsDiv = el('div', { class: 'predictions' });

      if (pred) {
        const confLabel = pred.confidence >= 0.7 ? '高' : pred.confidence >= 0.4 ? '中' : '低';
        predsDiv.appendChild(el('span', { class: 'ai-pred',
          text: `🤖 AI: ${pred.homeGoals}-${pred.awayGoals} (${pred.homeWin}%/${pred.draw}%/${pred.awayWin}%) 置信度:${confLabel}` }));
      }

      if (userPred) {
        predsDiv.appendChild(el('span', { class: 'user-pred',
          text: `👤 你: ${userPred.homeGoals}-${userPred.awayGoals}` }));
      }

      if (status === 'finished' && userPred) {
        const score = UserStore.calcScore(match);
        if (score) {
          predsDiv.appendChild(el('span', {
            class: `result-badge ${resultClass(score.points)}`,
            text: `${score.reason} +${score.points}分`
          }));
        }
      }

      if (predsDiv.children.length) card.appendChild(predsDiv);

      // 可展开的详细分析
      if (pred && pred.factors) {
        const detailBtn = el('button', {
          class: 'detail-toggle',
          text: '📊 查看 AI 分析详情 ▾',
          onClick: (e) => {
            e.stopPropagation();
            const detail = card.querySelector('.analysis-detail');
            if (detail) {
              detail.style.display = detail.style.display === 'none' ? 'block' : 'none';
              detailBtn.textContent = detail.style.display === 'none'
                ? '📊 查看 AI 分析详情 ▾' : '▴ 收起分析';
            }
          }
        });
        detailBtn.style.cssText = 'background:none;border:1px solid var(--border);color:var(--accent);padding:4px 12px;border-radius:6px;font-size:12px;cursor:pointer;margin-top:8px;width:100%';
        card.appendChild(detailBtn);

        const detailDiv = buildAnalysisDetail(pred, match);
        detailDiv.style.display = 'none';
        card.appendChild(detailDiv);
      }
    }

    return card;
  }

  // 构建 AI 分析详情面板
  function buildAnalysisDetail(pred, match) {
    const detail = el('div', { class: 'analysis-detail' });
    detail.style.cssText = 'margin-top:10px;padding:12px;background:var(--card-alt);border-radius:8px;border:1px solid var(--border);font-size:12px;line-height:1.8';

    const factors = pred.factors;
    const factorNames = {
      ranking:    '🏆 FIFA 排名',
      h2h:        '📜 历史交锋',
      tactical:   '⚔️ 战术分析',
      injuries:   '🏥 伤停影响',
      venue:      '🏟️ 球场环境',
      groupStage: '📋 小组形势',
      morale:     '💪 士气',
      fatigue:    '⚡ 体能',
      recentForm: '📈 近期状态',
    };

    let html = '<div style="font-weight:700;margin-bottom:8px;color:var(--accent)">AI 多因素分析报告</div>';

    Object.entries(factors).forEach(([key, data]) => {
      if (!data) return;
      const name = factorNames[key] || key;
      const barWidth = Math.abs(data.score) * 100;
      const isPositive = data.score > 0;
      const color = isPositive ? 'var(--win)' : data.score < 0 ? 'var(--loss)' : 'var(--text-dim)';
      const team = isPositive ? TEAMS[match.home]?.name || match.home
                 : data.score < 0 ? TEAMS[match.away]?.name || match.away : '中性';

      html += `
        <div style="margin-bottom:6px">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span>${name}</span>
            <span style="color:${color};font-weight:700">${data.score > 0 ? '+' : ''}${(data.score * 100).toFixed(0)}分</span>
          </div>
          <div style="background:var(--bg);border-radius:3px;height:4px;margin:2px 0;overflow:hidden">
            <div style="width:${barWidth}%;height:100%;background:${color};border-radius:3px;${isPositive ? '' : 'margin-left:auto'}"></div>
          </div>
          <div style="color:var(--text-dim);font-size:11px">${data.detail}</div>
        </div>
      `;
    });

    // 战术匹配详细分析
    if (factors.tactical && factors.tactical.analysis) {
      html += `
        <div style="margin-top:10px;padding-top:8px;border-top:1px solid var(--border)">
          <div style="font-weight:700;margin-bottom:4px">⚔️ 战术对决</div>
          <div style="color:var(--text-dim)">${factors.tactical.analysis.replace(/\n/g, '<br>')}</div>
          <div style="margin-top:4px;color:var(--text-dim)">
            阵型: ${factors.tactical.homeFormation || '?'} vs ${factors.tactical.awayFormation || '?'}
          </div>
        </div>
      `;
    }

    // 小组积分榜 + 出线形势
    if (factors.groupStage && factors.groupStage.standings) {
      const adv = factors.groupStage.advancement;
      html += `<div style="margin-top:10px;padding-top:8px;border-top:1px solid var(--border)">
        <div style="font-weight:700;margin-bottom:4px">📋 小组积分榜 & 出线形势</div>
        <div style="font-size:10px;color:var(--text-dim);margin-bottom:6px">规则: 前2名直接出线 + 8个最好第3名也出线 → 4分基本安全，强队可能收力</div>
        <table style="width:100%;font-size:11px;border-collapse:collapse">
          <tr style="color:var(--text-dim)"><td>#</td><td>球队</td><td>赛</td><td>胜</td><td>平</td><td>负</td><td>进</td><td>失</td><td>净</td><td>分</td><td>出线</td></tr>`;
      factors.groupStage.standings.forEach((s, idx) => {
        const t = TEAMS[s.team];
        const isHome = s.team === match.home;
        const isAway = s.team === match.away;
        const highlight = isHome || isAway ? 'color:var(--accent);font-weight:700' : '';
        const gd = s.gf - s.ga;
        const gdColor = gd > 0 ? 'var(--win)' : gd < 0 ? 'var(--loss)' : 'var(--text-dim)';
        const gdStr = gd > 0 ? `+${gd}` : `${gd}`;
        // 出线概率条
        const teamAdv = adv ? adv[s.team] : null;
        let probBar = '';
        if (teamAdv) {
          const pct = Math.round(teamAdv.prob * 100);
          const barColor = pct >= 80 ? 'var(--win)' : pct >= 50 ? 'var(--draw)' : pct >= 20 ? 'var(--accent2)' : 'var(--loss)';
          const statusLabel = teamAdv.status === 'safe' ? '✅稳'
                            : teamAdv.status === 'comfortable' ? '😌安'
                            : teamAdv.mustWin ? '🔥拼'
                            : teamAdv.eliminated ? '❌出'
                            : '⚡争';
          probBar = `<span style="display:inline-block;width:32px;text-align:center;font-size:10px;font-weight:700;color:${barColor}">${statusLabel}</span>
                     <div style="display:inline-block;width:40px;height:6px;background:var(--bg);border-radius:3px;vertical-align:middle">
                       <div style="width:${pct}%;height:100%;background:${barColor};border-radius:3px"></div>
                     </div>
                     <span style="font-size:9px;color:var(--text-dim)">${pct}%</span>`;
        }
        html += `<tr style="${highlight}">
          <td style="font-weight:700;color:var(--text-dim)">${idx + 1}</td>
          <td>${t ? t.flag : ''} ${t ? t.name : s.team}</td>
          <td>${s.played}</td><td>${s.won}</td><td>${s.drawn}</td><td>${s.lost}</td>
          <td>${s.gf}</td><td>${s.ga}</td><td style="color:${gdColor}">${gdStr}</td>
          <td style="font-weight:700">${s.pts}</td>
          <td style="min-width:90px">${probBar}</td>
        </tr>`;
      });
      html += '</table>';

      // 出线形势解读
      if (adv) {
        const hAdv = adv[match.home];
        const aAdv = adv[match.away];
        const interpretations = [];
        if (hAdv) {
          if (hAdv.status === 'safe') interpretations.push(`🟢 ${TEAMS[match.home]?.name || match.home}已确保出线，末轮可能大幅轮换`);
          else if (hAdv.status === 'comfortable') interpretations.push(`🟡 ${TEAMS[match.home]?.name || match.home}出线形势乐观，可能适度收力`);
          else if (hAdv.mustWin) interpretations.push(`🔴 ${TEAMS[match.home]?.name || match.home}背水一战，必须取胜`);
          else if (hAdv.eliminated) interpretations.push(`⚫ ${TEAMS[match.home]?.name || match.home}基本出局`);
          else interpretations.push(`⚪ ${TEAMS[match.home]?.name || match.home}出线概率 ${Math.round(hAdv.prob * 100)}%，需争取积分`);
        }
        if (aAdv) {
          if (aAdv.status === 'safe') interpretations.push(`🟢 ${TEAMS[match.away]?.name || match.away}已确保出线，末轮可能大幅轮换`);
          else if (aAdv.status === 'comfortable') interpretations.push(`🟡 ${TEAMS[match.away]?.name || match.away}出线形势乐观，可能适度收力`);
          else if (aAdv.mustWin) interpretations.push(`🔴 ${TEAMS[match.away]?.name || match.away}背水一战，必须取胜`);
          else if (aAdv.eliminated) interpretations.push(`⚫ ${TEAMS[match.away]?.name || match.away}基本出局`);
          else interpretations.push(`⚪ ${TEAMS[match.away]?.name || match.away}出线概率 ${Math.round(aAdv.prob * 100)}%，需争取积分`);
        }
        if (interpretations.length) {
          html += `<div style="margin-top:6px;padding-top:6px;border-top:1px dashed var(--border);font-size:11px;color:var(--text-dim);line-height:1.8">
            ${interpretations.map(i => `<div>${i}</div>`).join('')}
          </div>`;
        }

        // 收力提示
        const safeOrComfortable = [match.home, match.away].filter(code =>
          adv[code] && (adv[code].status === 'safe' || adv[code].status === 'comfortable'));
        if (safeOrComfortable.length) {
          const names = safeOrComfortable.map(c => TEAMS[c]?.name || c).join('、');
          html += `<div style="margin-top:4px;padding:4px 8px;background:rgba(255,152,0,0.1);border-radius:4px;font-size:11px;color:#ff9800">
            💡 ${names} 出线在握 → 可能轮换主力、保存体力应对淘汰赛，实际战力可能低于纸面实力
          </div>`;
        }
      }

      html += '</div>';
    }

    // 综合结论
    const homeTeam = TEAMS[match.home]?.name || match.home;
    const awayTeam = TEAMS[match.away]?.name || match.away;
    const conclusion = pred.totalScore > 0.15 ? `${homeTeam} 占据明显优势`
                     : pred.totalScore > 0 ? `${homeTeam} 略占优势`
                     : pred.totalScore < -0.15 ? `${awayTeam} 占据明显优势`
                     : pred.totalScore < 0 ? `${awayTeam} 略占优势`
                     : '双方势均力敌';

    html += `
      <div style="margin-top:10px;padding-top:8px;border-top:1px solid var(--border);text-align:center">
        <div style="font-weight:700;color:var(--accent);font-size:14px">📊 综合判断: ${conclusion}</div>
        <div style="color:var(--text-dim);margin-top:4px">
          综合评分 ${pred.totalScore > 0 ? '+' : ''}${(pred.totalScore * 100).toFixed(1)} · xG ${pred.homeXG} - ${pred.awayXG} · 置信度 ${(pred.confidence * 100).toFixed(0)}%
        </div>
      </div>
    `;

    detail.innerHTML = html;
    return detail;
  }

  // ════════════════════════════════════════════════════════
  // 预测页
  // ════════════════════════════════════════════════════════
  function renderPredict() {
    const page = document.getElementById('page-predict');
    page.innerHTML = '';

    // 预测页只展示尚未结束的比赛, 并进行中置顶、未开始随后(均按时间升序)
    const upcomingMatches = MATCHES.filter(m => !isFinished(m));

    if (!upcomingMatches.length) {
      page.appendChild(el('div', {
        style: 'text-align:center;padding:40px 20px;color:var(--text-dim)',
        text: '🎉 所有比赛都已结束 — 去「排行榜」查看你的预测得分'
      }));
      return;
    }

    upcomingMatches.sort((a, b) => {
      const aLive = isLive(a) ? 0 : 1;
      const bLive = isLive(b) ? 0 : 1;
      if (aLive !== bLive) return aLive - bLive;
      return compareMatchTime(a, b);
    });

    // 按日期分组,日期作为分隔标题
    let currentDate = null;
    upcomingMatches.forEach(m => {
      if (m.date !== currentDate) {
        currentDate = m.date;
        page.appendChild(el('div', { class: 'date-header', text: formatDateHeader(m.date) }));
      }
      page.appendChild(buildPredictCard(m));
    });
  }

  // 把 '2026-06-18' 渲染成 '6月18日 (周四)'
  function formatDateHeader(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    const week = ['周日','周一','周二','周三','周四','周五','周六'][d.getDay()];
    return `${d.getMonth() + 1}月${d.getDate()}日 (${week})`;
  }

  function buildPredictCard(match) {
    const card = el('div', { class: 'predict-card' });
    const homeInfo = TEAMS[match.home];
    const awayInfo = TEAMS[match.away];
    const saved = UserStore.get(match.id);
    const finished = isFinished(match);

    // 只有双方都是真实球队时才做 AI 预测
    const pred = (homeInfo && awayInfo)
      ? Predictor.predict(match.home, match.away, { match })
      : null;

    const header = el('div', { class: 'predict-header' });
    header.innerHTML = `<span style="color:var(--text-dim);font-size:12px">${formatDateTime(match.date, match.time)} · ${STAGE_NAMES[match.stage]}</span>`;
    if (saved) header.appendChild(el('span', { class: 'saved-badge', text: '✓ 已保存' }));
    card.appendChild(header);

    const teams = el('div', { class: 'predict-teams' });
    const homeTeam = el('div', { class: 'predict-team' });
    homeTeam.innerHTML = homeInfo ? `<span class="flag">${homeInfo.flag}</span>${homeInfo.name}` : match.home;
    const awayTeam = el('div', { class: 'predict-team' });
    awayTeam.innerHTML = awayInfo ? `<span class="flag">${awayInfo.flag}</span>${awayInfo.name}` : match.away;

    const inputs = el('div', { class: 'predict-inputs' });
    const homeInput = el('input', { type:'number', min:'0', max:'20', placeholder:'0' });
    const awayInput = el('input', { type:'number', min:'0', max:'20', placeholder:'0' });
    const vsSpan = el('span', { class:'vs', text:'-' });

    if (saved) { homeInput.value = saved.homeGoals; awayInput.value = saved.awayGoals; }
    if (finished) { homeInput.disabled = true; awayInput.disabled = true; }

    const saveHandler = Utils.throttle(() => {
      const h = parseInt(homeInput.value), a = parseInt(awayInput.value);
      if (!isNaN(h) && !isNaN(a) && h >= 0 && a >= 0) {
        UserStore.save(match.id, h, a);
        let badge = header.querySelector('.saved-badge');
        if (!badge) { badge = el('span', { class:'saved-badge', text:'✓ 已保存' }); header.appendChild(badge); }
      }
    }, 500);

    homeInput.addEventListener('input', saveHandler);
    awayInput.addEventListener('input', saveHandler);
    inputs.append(homeInput, vsSpan, awayInput);
    teams.append(homeTeam, inputs, awayTeam);
    card.appendChild(teams);

    // AI 预测参考
    if (pred) {
      const aiDiv = el('div', { class: 'predict-ai' });
      aiDiv.innerHTML = `🤖 AI 总览: 胜率 <span class="ai-score">${pred.homeWin}%</span> / 平 <span class="ai-score">${pred.draw}%</span> / 负 <span class="ai-score">${pred.awayWin}%</span>
        &nbsp;· xG ${pred.homeXG} - ${pred.awayXG}
        &nbsp;· 数据完整度 ${Math.round(pred.confidence * 100)}%`;
      card.appendChild(aiDiv);

      // 实力对比表(可折叠)
      if (pred.comparison?.rows.length) {
        card.appendChild(buildComparisonTable(pred.comparison, homeInfo, awayInfo, match));
      }

      // AI 关键判断(伤员/士气/形势这种"会改变结果"的因素)
      if (pred.narrative?.length) {
        const narrative = el('div', { class: 'predict-narrative' });
        narrative.innerHTML = '<div class="narrative-title">⚡ AI 重点关注</div>' +
          pred.narrative.map(n => `<div class="narrative-item">${n}</div>`).join('');
        card.appendChild(narrative);
      }

      // 小组出线形势(仅小组赛)
      if (match.stage === 'group' && pred.factors?.groupStage?.advancement) {
        const adv = pred.factors.groupStage.advancement;
        const hAdv = adv[match.home];
        const aAdv = adv[match.away];
        const standings = pred.factors.groupStage.standings;

        if (standings && (hAdv || aAdv)) {
          const advDiv = el('div', { class: 'predict-advancement' });
          advDiv.style.cssText = 'margin-top:8px;padding:8px 10px;background:var(--card-alt);border-radius:8px;border:1px solid var(--border);font-size:11px';

          let advHtml = '<div style="font-weight:700;margin-bottom:4px;color:var(--accent)">📋 小组出线形势 <span style="font-weight:400;font-size:10px;color:var(--text-dim)">前2名+8个最好第3名出线</span></div>';

          // 本场双方出线概率
          [match.home, match.away].forEach(code => {
            const teamAdv = adv[code];
            const t = TEAMS[code];
            if (!teamAdv) return;
            const pct = Math.round(teamAdv.prob * 100);
            const barColor = pct >= 80 ? 'var(--win)' : pct >= 50 ? 'var(--draw)' : pct >= 20 ? 'var(--accent2)' : 'var(--loss)';
            const label = teamAdv.status === 'safe' ? '稳出线'
                        : teamAdv.status === 'comfortable' ? '形势乐观'
                        : teamAdv.mustWin ? '必须赢'
                        : teamAdv.eliminated ? '已出局'
                        : '争取中';
            advHtml += `<div style="display:flex;align-items:center;gap:6px;margin:3px 0">
              <span>${t ? t.flag : ''} ${t ? t.name : code}</span>
              <div style="flex:1;height:6px;background:var(--bg);border-radius:3px;overflow:hidden">
                <div style="width:${pct}%;height:100%;background:${barColor};border-radius:3px"></div>
              </div>
              <span style="color:${barColor};font-weight:600;min-width:50px;text-align:right">${label} ${pct}%</span>
            </div>`;
          });

          // 收力提示
          const resting = [match.home, match.away].filter(c =>
            adv[c] && (adv[c].status === 'safe' || adv[c].status === 'comfortable'));
          if (resting.length) {
            const names = resting.map(c => TEAMS[c]?.name || c).join('、');
            advHtml += `<div style="margin-top:6px;padding:4px 8px;background:rgba(255,152,0,0.08);border-radius:4px;color:#ff9800;font-size:10px">
              💡 ${names} 出线在握 → 可能轮换主力收力，实际战力可能低于纸面实力
            </div>`;
          }

          advDiv.innerHTML = advHtml;
          card.appendChild(advDiv);
        }
      }

      // 多场景比分预测
      if (pred.scenarios?.length) {
        card.appendChild(buildScenariosBlock(pred.scenarios, homeInput, awayInput, finished));
      }

      // 关键因素摘要
      if (pred.factors) {
        const topFactors = Object.entries(pred.factors)
          .filter(([_, d]) => Math.abs(d.score) > 0.1)
          .sort((a, b) => Math.abs(b[1].score) - Math.abs(a[1].score))
          .slice(0, 4);

        if (topFactors.length) {
          const factorSummary = el('div', { class: 'predict-factors' });
          factorSummary.innerHTML = '<div class="factors-title">🔍 关键判断依据</div>' +
            topFactors.map(([key, d]) => {
              const emoji = { ranking:'🏆', h2h:'📜', tactical:'⚔️', injuries:'🏥', venue:'🏟️', groupStage:'📋', morale:'💪', fatigue:'⚡', recentForm:'📈' }[key] || '📊';
              const dir = d.score > 0 ? `→ 利于${homeInfo?.name || match.home}` : d.score < 0 ? `→ 利于${awayInfo?.name || match.away}` : '';
              return `<div class="factor-row"><span class="factor-icon">${emoji}</span><span class="factor-text">${d.detail}</span><span class="factor-dir">${dir}</span></div>`;
            }).join('');
          card.appendChild(factorSummary);
        }
      }
    }

    return card;
  }

  // 实力对比表
  function buildComparisonTable(comparison, homeInfo, awayInfo, match) {
    const wrap = el('div', { class: 'predict-comparison' });
    const header = el('div', { class: 'comparison-header' });
    header.innerHTML = `📊 实力对比 · 主队赢得 <b>${comparison.homeAdvCount}</b> 项 / 客队赢得 <b>${comparison.awayAdvCount}</b> 项`;
    wrap.appendChild(header);

    const table = el('table', { class: 'comparison-table' });
    const thead = el('thead');
    thead.innerHTML = `<tr>
      <th class="col-label"></th>
      <th class="col-home">${homeInfo?.flag || ''} ${homeInfo?.name || match.home}</th>
      <th class="col-vs"></th>
      <th class="col-away">${awayInfo?.flag || ''} ${awayInfo?.name || match.away}</th>
    </tr>`;
    table.appendChild(thead);

    const tbody = el('tbody');
    comparison.rows.forEach(row => {
      const tr = el('tr');
      const homeCls = row.advantage === 'home' ? 'cell-win' : '';
      const awayCls = row.advantage === 'away' ? 'cell-win' : '';
      tr.innerHTML = `
        <td class="col-label">${row.label}</td>
        <td class="col-home ${homeCls}">${row.home}</td>
        <td class="col-vs">${row.advantage === 'home' ? '◀' : row.advantage === 'away' ? '▶' : '='}</td>
        <td class="col-away ${awayCls}">${row.away}</td>
      `;
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    wrap.appendChild(table);
    return wrap;
  }

  // 多场景比分预测
  function buildScenariosBlock(scenarios, homeInput, awayInput, finished) {
    const wrap = el('div', { class: 'predict-scenarios' });
    wrap.appendChild(el('div', { class: 'scenarios-title', text: '🤖 AI 给出的 ' + scenarios.length + ' 种可能比分(点击应用到上方输入框)' }));

    scenarios.forEach(s => {
      const item = el('div', { class: 'scenario-item' });
      item.innerHTML = `
        <div class="scenario-head">
          <span class="scenario-label">${s.label}</span>
          <span class="scenario-score">${s.home} : ${s.away}</span>
          <span class="scenario-prob">概率 ${s.prob}%</span>
        </div>
        <div class="scenario-reason">${s.reasoning}</div>
      `;
      if (!finished) {
        item.classList.add('clickable');
        item.title = '点击把这个比分填入上方输入框';
        item.addEventListener('click', () => {
          homeInput.value = s.home;
          awayInput.value = s.away;
          homeInput.dispatchEvent(new Event('input', { bubbles: true }));
        });
      }
      wrap.appendChild(item);
    });

    return wrap;
  }

  // ════════════════════════════════════════════════════════
  // 排行榜页
  // ════════════════════════════════════════════════════════
  function renderLeaderboard() {
    const page = document.getElementById('page-leaderboard');
    page.innerHTML = '';
    const stats = UserStore.getStats(MATCHES);

    const grid = el('div', { class: 'stats-grid' });
    [
      { value: stats.totalPoints, label: '总积分' },
      { value: stats.played, label: '已预测场次' },
      { value: stats.exact, label: '猜对比分 🎯' },
      { value: stats.correct, label: '猜对胜负 ✅' },
      { value: stats.accuracy + '%', label: '综合准确率' },
      { value: stats.exactRate + '%', label: '比分命中率' },
    ].forEach(c => {
      const card = el('div', { class: 'stat-card' });
      card.innerHTML = `<div class="stat-value">${c.value}</div><div class="stat-label">${c.label}</div>`;
      grid.appendChild(card);
    });
    page.appendChild(grid);

    if (stats.results.length) {
      page.appendChild(el('div', { class: 'date-header', text: `预测记录 (${stats.results.length} 场)` }));
      const list = el('div', { class: 'result-list' });
      stats.results.sort((a,b) => b.match.date.localeCompare(a.match.date) || b.match.id - a.match.id);
      stats.results.forEach(r => {
        const item = el('div', { class: 'result-item' });
        const home = TEAMS[r.match.home], away = TEAMS[r.match.away];
        item.innerHTML = `
          <span class="ri-teams">${home ? home.flag : ''} ${home ? home.name : r.match.home} vs ${away ? away.name : r.match.away} ${away ? away.flag : ''}</span>
          <span class="ri-scores">
            <span>预测: ${r.prediction.homeGoals}-${r.prediction.awayGoals}</span>
            <span class="actual">实际: ${r.match.homeScore}-${r.match.awayScore}</span>
          </span>
          <span class="ri-points ${resultClass(r.points)}">${r.points > 0 ? '+' : ''}${r.points}</span>`;
        list.appendChild(item);
      });
      page.appendChild(list);
    } else {
      page.appendChild(el('div', { class: 'empty-state', html:
        '<div class="emoji">📊</div><p>还没有已结束的比赛数据<br>去「预测」页填写你的预测吧！</p>' }));
    }
  }

  // ════════════════════════════════════════════════════════
  // 分析页
  // ════════════════════════════════════════════════════════
  function renderAnalysis() {
    const page = document.getElementById('page-analysis');
    page.innerHTML = '';

    // 还没有比赛结束时，显示"即将开赛"和 AI 全面预测摘要
    const finishedMatches = MATCHES.filter(isFinished);
    const upcomingMatches = MATCHES.filter(m => isUpcoming(m) && TEAMS[m.home] && TEAMS[m.away]);

    if (!finishedMatches.length) {
      // 显示 AI 预测的前几场热门比赛分析
      page.appendChild(el('div', { class: 'chart-title', text: '🤖 AI 赛前分析 — 热门比赛' }));

      const hotMatches = MATCHES
        .filter(m => TEAMS[m.home] && TEAMS[m.away])
        .filter(m => {
          const hRank = TEAMS[m.home]?.rank || 100;
          const aRank = TEAMS[m.away]?.rank || 100;
          return hRank <= 20 || aRank <= 20;
        })
        .slice(0, 8);

      hotMatches.forEach(m => {
        const pred = Predictor.predict(m.home, m.away, { match: m });
        if (!pred) return;

        const home = TEAMS[m.home], away = TEAMS[m.away];
        const card = el('div', { class: 'chart-container' });
        card.innerHTML = `
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
            <span style="font-weight:700">${home.flag} ${home.name} vs ${away.name} ${away.flag}</span>
            <span style="font-size:12px;color:var(--text-dim)">${formatDate(m.date)}</span>
          </div>
          <div style="display:flex;justify-content:center;gap:20px;margin-bottom:12px">
            <div style="text-align:center">
              <div style="font-size:28px;font-weight:800;color:var(--accent)">${pred.homeGoals}</div>
              <div style="font-size:12px;color:var(--text-dim)">AI预测进球</div>
            </div>
            <div style="font-size:20px;color:var(--text-dim);align-self:center">-</div>
            <div style="text-align:center">
              <div style="font-size:28px;font-weight:800;color:var(--accent)">${pred.awayGoals}</div>
              <div style="font-size:12px;color:var(--text-dim)">AI预测进球</div>
            </div>
          </div>
          <div style="display:flex;justify-content:center;gap:16px;margin-bottom:12px">
            <span style="color:var(--win)">主胜 ${pred.homeWin}%</span>
            <span style="color:var(--draw)">平局 ${pred.draw}%</span>
            <span style="color:var(--loss)">客胜 ${pred.awayWin}%</span>
          </div>
        `;

        // 关键因素条
        if (pred.factors) {
          const topFactors = Object.entries(pred.factors)
            .filter(([_, d]) => Math.abs(d.score) > 0.05)
            .sort((a, b) => Math.abs(b[1].score) - Math.abs(a[1].score))
            .slice(0, 4);

          if (topFactors.length) {
            const factorDiv = el('div', { style: 'font-size:11px;color:var(--text-dim);border-top:1px solid var(--border);padding-top:8px' });
            factorDiv.innerHTML = topFactors.map(([key, d]) => {
              const emoji = { ranking:'🏆', h2h:'📜', tactical:'⚔️', injuries:'🏥', venue:'🏟️', groupStage:'📋', morale:'💪', fatigue:'⚡', recentForm:'📈' }[key] || '';
              return `<div>${emoji} ${d.detail}</div>`;
            }).join('');
            card.appendChild(factorDiv);
          }
        }

        page.appendChild(card);
      });

      // 晋级规则说明
      const rulesDiv = el('div', { class: 'chart-container' });
      rulesDiv.innerHTML = `
        <div class="chart-title">📋 2026 世界杯晋级规则</div>
        <div style="font-size:13px;line-height:2;color:var(--text-dim)">
          <div>▸ ${ADVANCEMENT_RULES.description}</div>
          <div>▸ ${ADVANCEMENT_RULES.pointsForThird}</div>
          <div>▸ 淘汰赛共 ${ADVANCEMENT_RULES.knockoutFormat.reduce((s, k) => s + k.matches, 0)} 场</div>
        </div>
      `;
      page.appendChild(rulesDiv);
      return;
    }

    // 有比赛结果后，先显示小组出线形势概览
    const groupsWithResults = [...new Set(finishedMatches.filter(m => m.stage === 'group').map(m => m.group))].sort();
    if (groupsWithResults.length) {
      page.appendChild(el('div', { class: 'chart-title', text: '📋 小组出线形势一览' }));
      page.appendChild(el('div', { style: 'font-size:12px;color:var(--text-dim);margin-bottom:12px',
        text: '前2名直接出线 + 8个最好第3名也出线 → 4分基本安全，强队可能收力' }));

      groupsWithResults.forEach(g => {
        const standings = Predictor.calcGroupStandings(g);
        const gCard = el('div', { class: 'chart-container', style: 'padding:10px 14px' });
        let html = `<div style="font-weight:700;margin-bottom:6px;font-size:13px">${g} 组</div>`;
        html += `<table style="width:100%;font-size:11px;border-collapse:collapse">
          <tr style="color:var(--text-dim);font-size:10px"><td>#</td><td>球队</td><td>赛</td><td>胜</td><td>平</td><td>负</td><td>净胜球</td><td>积分</td><td>出线形势</td></tr>`;
        standings.forEach((s, idx) => {
          const t = TEAMS[s.team];
          const gd = s.gf - s.ga;
          const gdStr = gd > 0 ? `+${gd}` : `${gd}`;
          const gdColor = gd > 0 ? 'var(--win)' : gd < 0 ? 'var(--loss)' : 'var(--text-dim)';
          // 出线形势判断
          let statusStr = '';
          let statusColor = 'var(--text-dim)';
          if (s.pts >= 6) { statusStr = '✅ 稳出线'; statusColor = 'var(--win)'; }
          else if (s.pts >= 4 && idx < 2) { statusStr = '😌 大概率'; statusColor = 'var(--win)'; }
          else if (s.pts >= 4 && idx === 2 && gd >= 0) { statusStr = '😌 第3也能出线'; statusColor = 'var(--draw)'; }
          else if (s.pts >= 3 && idx < 2) { statusStr = '⚡ 有望'; statusColor = 'var(--draw)'; }
          else if (s.pts >= 3 && idx === 2) { statusStr = '🔄 看命'; statusColor = 'var(--accent2)'; }
          else if (s.pts >= 1) { statusStr = '⚠️ 危险'; statusColor = 'var(--loss)'; }
          else { statusStr = '❌ 出局'; statusColor = 'var(--loss)'; }
          html += `<tr>
            <td style="font-weight:700;color:var(--text-dim)">${idx+1}</td>
            <td>${t ? t.flag : ''} ${t ? t.name : s.team}</td>
            <td>${s.played}</td><td>${s.won}</td><td>${s.drawn}</td><td>${s.lost}</td>
            <td style="color:${gdColor}">${gdStr}</td>
            <td style="font-weight:700">${s.pts}</td>
            <td style="color:${statusColor};font-weight:600">${statusStr}</td>
          </tr>`;
        });
        html += '</table>';
        gCard.innerHTML = html;
        page.appendChild(gCard);
      });
    }

    // 实际 vs 预测对比
    const teamPerf = {};
    finishedMatches.forEach(m => {
      const pred = Predictor.predict(m.home, m.away, { match: m });
      if (!pred) return;
      [m.home, m.away].forEach((code, idx) => {
        if (!teamPerf[code]) teamPerf[code] = { predicted:0, actual:0, matches:0 };
        teamPerf[code].predicted += idx === 0 ? pred.homeGoals : pred.awayGoals;
        teamPerf[code].actual   += idx === 0 ? m.homeScore : m.awayScore;
        teamPerf[code].matches++;
      });
    });

    const goalChart = el('div', { class: 'chart-container' });
    goalChart.appendChild(el('div', { class: 'chart-title', text: '各队进球: AI 预测 vs 实际' }));
    const sortedTeams = Object.entries(teamPerf).sort((a,b) => b[1].actual - a[1].actual).slice(0, 16);
    const maxGoals = Math.max(...sortedTeams.map(([_,d]) => Math.max(d.predicted, d.actual)), 1);
    const barChart = el('div', { class: 'bar-chart' });

    sortedTeams.forEach(([code, data]) => {
      const team = TEAMS[code];
      const row = el('div', { class: 'bar-row' });
      const pctPred = (data.predicted / maxGoals * 100).toFixed(0);
      const pctAct  = (data.actual / maxGoals * 100).toFixed(0);
      row.innerHTML = `
        <span class="bar-label">${team ? team.flag : ''} ${team ? team.name : code}</span>
        <div style="flex:1">
          <div class="bar-track" style="margin-bottom:3px">
            <div class="bar-fill" style="width:${pctPred}%;background:var(--accent2)"></div>
            <span class="bar-value" style="color:var(--accent2)">${data.predicted.toFixed(1)}</span>
          </div>
          <div class="bar-track">
            <div class="bar-fill" style="width:${pctAct}%;background:var(--draw)"></div>
            <span class="bar-value" style="color:var(--draw)">${data.actual}</span>
          </div>
        </div>`;
      barChart.appendChild(row);
    });
    goalChart.appendChild(barChart);
    goalChart.innerHTML += '<div style="font-size:12px;color:var(--text-dim);margin-top:8px">🟩 AI 预测进球 &nbsp; 🟨 实际进球</div>';
    page.appendChild(goalChart);

    // 胜负准确率
    const resultChart = el('div', { class: 'chart-container' });
    resultChart.appendChild(el('div', { class: 'chart-title', text: 'AI 胜平负预测准确率' }));
    let correctResult = 0, totalResult = 0;
    finishedMatches.forEach(m => {
      const pred = Predictor.predict(m.home, m.away, { match: m });
      if (!pred) return;
      totalResult++;
      const predResult = pred.homeGoals > pred.awayGoals ? 'H' : pred.homeGoals === pred.awayGoals ? 'D' : 'A';
      const actualResult = m.homeScore > m.awayScore ? 'H' : m.homeScore === m.awayScore ? 'D' : 'A';
      if (predResult === actualResult) correctResult++;
    });
    const pct = totalResult > 0 ? (correctResult / totalResult * 100).toFixed(1) : '0';
    resultChart.innerHTML += `
      <div style="text-align:center;padding:20px">
        <div style="font-size:64px;font-weight:800;color:var(--accent)">${pct}%</div>
        <div style="color:var(--text-dim);margin-top:8px">AI 猜对 ${correctResult}/${totalResult} 场胜负</div>
      </div>`;
    page.appendChild(resultChart);
  }

  // ════════════════════════════════════════════════════════
  // 自动刷新: 每 60 秒重新加载 js/data.js 并重新渲染
  // ════════════════════════════════════════════════════════
  const AUTO_REFRESH_INTERVAL = 60; // 秒
  let refreshCountdown = AUTO_REFRESH_INTERVAL;
  let countdownTimer = null;
  let autoRefreshInitialized = false;

  function reloadData() {
    // 如果用户正在输入比分, 跳过本次自动刷新
    const active = document.activeElement;
    if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) {
      console.log('用户正在输入，跳过自动刷新');
      return;
    }

    const existing = document.querySelector('script[data-reload="data"]');
    if (existing) existing.remove();

    const script = document.createElement('script');
    script.src = `js/data.js?t=${Date.now()}`;
    script.setAttribute('data-reload', 'data');
    script.onload = () => {
      console.log('[世界杯] 数据已重新加载:', new Date().toLocaleString('zh-CN'));
      init();
    };
    script.onerror = () => console.error('[世界杯] 数据重新加载失败');
    document.head.appendChild(script);
  }

  function startAutoRefresh() {
    if (autoRefreshInitialized) return;
    autoRefreshInitialized = true;

    const countdownEl = document.getElementById('refresh-countdown');
    const refreshBtn = document.getElementById('refresh-now');

    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        refreshCountdown = AUTO_REFRESH_INTERVAL;
        reloadData();
      });
    }

    countdownTimer = setInterval(() => {
      refreshCountdown--;
      if (countdownEl) countdownEl.textContent = `下次自动刷新: ${refreshCountdown}s`;
      if (refreshCountdown <= 0) {
        refreshCountdown = AUTO_REFRESH_INTERVAL;
        reloadData();
      }
    }, 1000);
  }

  document.addEventListener('DOMContentLoaded', () => {
    init();
    startAutoRefresh();
  });
  return { init, reloadData };
})();
