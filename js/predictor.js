// ============================================================
// 多因素智能预测引擎 v2
// 考虑: FIFA排名 · 历史交锋 · 战术分析 · 球员伤停
//       球场环境 · 小组形势 · 士气体能 · 近期状态
// ============================================================

const Predictor = (() => {

  // ── 权重配置 ──────────────────────────────────────────
  const WEIGHTS = {
    ranking:      0.18,  // FIFA 排名
    h2h:          0.08,  // 历史交锋
    tactical:     0.14,  // 战术匹配
    injuries:     0.10,  // 伤停影响
    venue:        0.09,  // 球场环境
    groupStage:   0.12,  // 小组形势(保存体力/必须赢)
    morale:       0.07,  // 士气
    fatigue:      0.06,  // 体能
    recentForm:   0.09,  // 近期状态
    politics:     0.05,  // 政治/场外因素
    underdog:     0.07,  // 强弱博弈(弱队死守/强队轻敌)
  };

  // ── 场外因素/政治背景数据库 ───────────────────────────
  // impact: 对球队士气的加成/减成 (-0.2 ~ +0.2)
  const POLITICAL_CONTEXT = {
    MEX: { note: '东道主之一，主场气氛和民族情绪是巨大加成', impact: 0.15 },
    USA: { note: '东道主之一，主场作战士气高涨', impact: 0.12 },
    CAN: { note: '东道主之一，首次世界杯主场作战', impact: 0.12 },
    UKR: { note: '受俄乌冲突影响，球队承载国家期望，战意极强', impact: 0.20 },
    IRQ: { note: '国内局势复杂，国家队常成为民族凝聚象征', impact: 0.10 },
    IRN: { note: '国内社会舆论压力大，国家队表现受全民关注', impact: 0.05 },
    KSA: { note: '国家大力推动足球，世界杯成绩受高层重视', impact: 0.08 },
    QAT: { note: '世界杯后持续投入足球，本届是证明之战', impact: 0.05 },
    ARG: { note: '梅西最后一届世界杯，卫冕之路举国关注', impact: 0.10 },
    FRA: { note: '队内关系与团结问题常被媒体放大', impact: -0.08 },
    BEL: { note: '黄金一代谢幕，内部代际矛盾偶见报道', impact: -0.05 },
    POR: { note: 'C罗谢幕世界杯，球队围绕老将的争议不断', impact: -0.04 },
    KOR: { note: '民众对足球期待极高，国家队背负不小舆论压力', impact: 0.04 },
    JPN: { note: '国内对世界杯期待高，球队目标突破16强', impact: 0.05 },
  };

  // 历史恩怨/宿敌对决
  const RIVALRIES = {
    'ARG-ENG': '马岛战争历史让英阿对决情绪复杂',
    'ENG-ARG': '马岛战争历史让英阿对决情绪复杂',
    'GER-NED': '欧洲足坛传统宿敌',
    'NED-GER': '欧洲足坛传统宿敌',
    'BRA-ARG': '南美死敌，世仇对决',
    'ARG-BRA': '南美死敌，世仇对决',
    'POR-ESP': '伊比利亚德比',
    'ESP-POR': '伊比利亚德比',
    'MEX-USA': '中北美足球宿敌',
    'USA-MEX': '中北美足球宿敌',
    'KOR-JPN': '东亚足球宿敌',
    'JPN-KOR': '东亚足球宿敌',
    'ALG-MAR': '北非地缘竞争，场内场外情绪都强烈',
    'MAR-ALG': '北非地缘竞争，场内场外情绪都强烈',
    'CRO-SRB': '巴尔干恩怨，交锋火药味浓',
    'SRB-CRO': '巴尔干恩怨，交锋火药味浓',
  };

  // ── 辅助：读取带默认值的球队档案 ──────────────────────
  function getProfile(code) {
    const p = TeamProfiles[code];
    if (!p) return null;
    const rank = TEAMS[code]?.rank || 50;
    return {
      ...p,
      defensiveResolve: p.defensiveResolve != null
        ? p.defensiveResolve
        : Math.max(4, Math.min(9, 10 - Math.floor((rank - 20) / 15))),
      upsetPotential: p.upsetPotential != null
        ? p.upsetPotential
        : Math.max(3, Math.min(8, 7 - Math.floor((rank - 30) / 20))),
    };
  }

  // ── 10. 场外因素/政治评分 ─────────────────────────────
  function scorePolitics(homeCode, awayCode) {
    const hCtx = POLITICAL_CONTEXT[homeCode] || { note: '', impact: 0 };
    const aCtx = POLITICAL_CONTEXT[awayCode] || { note: '', impact: 0 };
    const rivalry = RIVALRIES[`${homeCode}-${awayCode}`];

    let score = hCtx.impact - aCtx.impact;
    if (rivalry) score *= 1.5; // 宿敌对决，场外情绪放大

    const notes = [];
    if (hCtx.note) notes.push(`${homeCode}: ${hCtx.note}`);
    if (aCtx.note) notes.push(`${awayCode}: ${aCtx.note}`);
    if (rivalry) notes.push(`宿敌情绪: ${rivalry}`);

    return {
      score: Math.max(-0.5, Math.min(0.5, score)),
      detail: notes.length ? `场外因素: ${notes.join('; ')}` : '无明显场外因素影响',
    };
  }

  // ── 11. 强弱博弈评分 ──────────────────────────────────
  // 弱队面对强队时的死命防守、摆大巴、伺机反击；
  // 强队面对弱队时可能的轻敌、轮换、破密集防守效率。
  function scoreUnderdog(homeCode, awayCode) {
    const hRank = TEAMS[homeCode]?.rank || 50;
    const aRank = TEAMS[awayCode]?.rank || 50;
    const hp = getProfile(homeCode);
    const ap = getProfile(awayCode);

    const rankGap = Math.abs(hRank - aRank);
    const notes = [];
    let score = 0;

    // 只有排名差距较大时才触发强弱博弈逻辑
    if (rankGap >= 25) {
      const favoriteCode = hRank < aRank ? homeCode : awayCode;
      const underdogCode = hRank < aRank ? awayCode : homeCode;
      const underdogProfile = hRank < aRank ? ap : hp;
      const underdogRank = hRank < aRank ? aRank : hRank;
      const isHomeFavorite = hRank < aRank;

      notes.push(`${favoriteCode}实力明显占优，${underdogCode}大概率采取守势`);

      // 是否擅长铁桶阵 / 大巴 / 防守反击
      const bunkerStyle = underdogProfile?.playStyle?.some(s => /铁桶|大巴|防守反击|密集防守/.test(s));
      const defensiveResolve = underdogProfile?.defensiveResolve || 5;

      if (bunkerStyle || defensiveResolve >= 7) {
        notes.push(`${underdogCode}擅长密集防守，可能摆出铁桶阵死命防守，把比赛拖入低比分`);
        score += isHomeFavorite ? -0.28 : 0.28; // 弱队死守削弱强队进攻
      } else if (defensiveResolve >= 5) {
        notes.push(`${underdogCode}预计稳守反击，压缩${favoriteCode}的进攻空间`);
        score += isHomeFavorite ? -0.15 : 0.15;
      } else {
        notes.push(`${underdogCode}防守韧性一般，${favoriteCode}可能较早破门`);
        score += isHomeFavorite ? -0.05 : 0.05;
      }

      // 爆冷/反击威胁
      const upsetPotential = underdogProfile?.upsetPotential || 4;
      if (upsetPotential >= 6) {
        notes.push(`${underdogCode}反击效率高，有偷一个或爆冷逼平的潜质`);
        // 给弱队 slight 加分，但主方向仍是压制强队进攻
        score += isHomeFavorite ? 0.06 : -0.06;
      }

      // 强队轻敌/轮换倾向（已出线的强队会更明显，groupStage 里处理）
      // 这里只处理阵容深度带来的轻敌空间
      const favoriteProfile = isHomeFavorite ? hp : ap;
      if (favoriteProfile?.squadDepth >= 8) {
        notes.push(`${favoriteCode}阵容深度好，但面对弱队可能出现注意力不集中的问题`);
      }
    }

    return {
      score: Math.max(-0.5, Math.min(0.5, score)),
      detail: notes.length ? `强弱博弈: ${notes.join('; ')}` : '双方实力接近，预计对攻',
    };
  }

  // ── 泊松采样 ─────────────────────────────────────────
  function poissonSample(lambda) {
    if (lambda <= 0) return 0;
    const L = Math.exp(-lambda);
    let k = 0, p = 1;
    do { k++; p *= Math.random(); } while (p > L);
    return k - 1;
  }

  function poissonPmf(k, lambda) {
    return Math.exp(-lambda) * Math.pow(lambda, k) / factorial(k);
  }

  function factorial(n) {
    if (n <= 1) return 1;
    let r = 1;
    for (let i = 2; i <= n; i++) r *= i;
    return r;
  }

  // ── 1. FIFA 排名评分 ─────────────────────────────────
  function scoreRanking(homeCode, awayCode) {
    const hRank = TEAMS[homeCode]?.rank || 50;
    const aRank = TEAMS[awayCode]?.rank || 50;
    // 排名差距 → 评分 (-1 到 +1, 正=有利主队)
    const hStr = 95 - 10 * Math.log2(Math.max(1, hRank));
    const aStr = 95 - 10 * Math.log2(Math.max(1, aRank));
    const diff = (hStr - aStr) / 40; // 归一化
    return {
      score: Math.max(-1, Math.min(1, diff)),
      detail: `FIFA排名 #${hRank} vs #${aRank}`,
      homeStr: +hStr.toFixed(1),
      awayStr: +aStr.toFixed(1),
    };
  }

  // ── 2. 历史交锋评分 ──────────────────────────────────
  function scoreH2H(homeCode, awayCode) {
    const record = getH2H(homeCode, awayCode);
    if (record.total === 0) {
      return { score: 0, detail: '无历史交锋记录', record };
    }

    // 趋势分 (-1 到 +1)
    const trendScore = record.trend;
    // 近3场权重更高
    let recentBoost = 0;
    record.meetings.slice(0, 3).forEach((m, i) => {
      const weight = (3 - i) / 6;
      if (m.winner === homeCode) recentBoost += weight;
      else if (m.winner === awayCode) recentBoost -= weight;
    });

    const finalScore = Math.max(-1, Math.min(1, trendScore * 0.6 + recentBoost * 0.4));

    return {
      score: finalScore,
      detail: `历史交锋 ${record.total} 场: ${homeCode} ${record.teamAWins}胜 ${record.draws}平 ${record.teamBWins}负`,
      record,
    };
  }

  // ── 3. 战术匹配评分 ─────────────────────────────────
  function scoreTactical(homeCode, awayCode) {
    const hp = TeamProfiles[homeCode];
    const ap = TeamProfiles[awayCode];
    if (!hp || !ap) return { score: 0, detail: '缺少战术数据', analysis: '' };

    let score = 0;
    const notes = [];

    // 3a. 战术相克分析
    const homeStyles = hp.playStyle;
    const awayStyles = ap.playStyle;

    // 高位逼抢 vs 控球型 → 逼抢占优
    if (homeStyles.includes('高位逼抢') && awayStyles.includes('控球型')) {
      score += 0.3;
      notes.push(`${homeCode}的逼抢克制${awayCode}的控球`);
    }
    if (awayStyles.includes('高位逼抢') && homeStyles.includes('控球型')) {
      score -= 0.3;
      notes.push(`${awayCode}的逼抢克制${homeCode}的控球`);
    }

    // 铁桶阵 vs 进攻型 → 铁桶阵有一定克制
    if (homeStyles.includes('铁桶阵') && awayStyles.includes('技术流')) {
      score += 0.2;
      notes.push(`${homeCode}密集防守限制${awayCode}的进攻空间`);
    }
    if (awayStyles.includes('铁桶阵') && homeStyles.includes('技术流')) {
      score -= 0.2;
      notes.push(`${awayCode}密集防守限制${homeCode}的进攻空间`);
    }

    // 快速反击 vs 高位逼抢 → 反击有空间
    if (homeStyles.includes('快速反击') && awayStyles.includes('高位逼抢')) {
      score += 0.25;
      notes.push(`${awayCode}高位逼抢留下身后空间，利于${homeCode}反击`);
    }
    if (awayStyles.includes('快速反击') && homeStyles.includes('高位逼抢')) {
      score -= 0.25;
      notes.push(`${homeCode}高位逼抢留下身后空间，利于${awayCode}反击`);
    }

    // 3b. 教练风格匹配
    if (hp.coachStyle === '进攻型' && ap.coachStyle === '防守型') {
      score -= 0.1;
      notes.push(`${ap.coach}的防守策略可能限制${hp.coach}的进攻体系`);
    }
    if (hp.coachStyle === '务实型' && ap.coachStyle === '进攻型') {
      score += 0.15;
      notes.push(`${hp.coach}的务实打法善于利用${ap.coach}进攻时的空当`);
    }

    // 3c. 阵型匹配
    const formScore = analyzeFormationMatchup(hp.formation, ap.formation);
    score += formScore * 0.2;
    if (formScore !== 0) {
      notes.push(`阵型 ${hp.formation} vs ${ap.formation}: ${formScore > 0 ? homeCode : awayCode} 占优`);
    }

    // 3d. 关键球员对位
    const keyPlayerAnalysis = analyzeKeyPlayers(hp, ap, homeCode, awayCode);
    score += keyPlayerAnalysis.score;
    if (keyPlayerAnalysis.note) notes.push(keyPlayerAnalysis.note);

    return {
      score: Math.max(-1, Math.min(1, score)),
      detail: `战术分析: ${notes.join('; ') || '势均力敌'}`,
      analysis: notes.join('\n'),
      homeFormation: hp.formation,
      awayFormation: ap.formation,
    };
  }

  // 阵型相克分析
  function analyzeFormationMatchup(homeForm, awayForm) {
    const matchups = {
      '4-3-3-4-2-3-1': 0.1,   // 4-3-3 略克 4-2-3-1 (中场人数优势)
      '4-2-3-1-4-3-3': -0.1,
      '3-4-3-4-3-3': 0.15,    // 三后卫翼卫克制边路
      '4-3-3-3-4-3': -0.15,
      '4-4-2-4-3-3': -0.2,    // 4-4-2 被 4-3-3 中场压制
      '4-3-3-4-4-2': 0.2,
      '5-4-1-4-3-3': 0.1,     // 五后卫克制边路进攻
      '4-3-3-5-4-1': -0.1,
    };
    const key = `${homeForm}-${awayForm}`;
    return matchups[key] || 0;
  }

  // 关键球员对位
  function analyzeKeyPlayers(homeProfile, awayProfile, homeCode, awayCode) {
    const hKey = homeProfile.keyPlayers.filter(p => p.status === 'fit');
    const aKey = awayProfile.keyPlayers.filter(p => p.status === 'fit');

    if (!hKey.length || !aKey.length) return { score: 0, note: '' };

    const hAvg = hKey.reduce((s, p) => s + p.rating, 0) / hKey.length;
    const aAvg = aKey.reduce((s, p) => s + p.rating, 0) / aKey.length;

    const diff = (hAvg - aAvg) / 20;

    let note = '';
    if (Math.abs(diff) > 0.15) {
      const stronger = diff > 0 ? homeCode : awayCode;
      note = `${stronger}核心球员平均评分更高`;
    }

    return { score: Math.max(-0.3, Math.min(0.3, diff)), note };
  }

  // ── 4. 伤停影响评分 ──────────────────────────────────
  function scoreInjuries(homeCode, awayCode) {
    const hp = TeamProfiles[homeCode];
    const ap = TeamProfiles[awayCode];
    if (!hp || !ap) return { score: 0, detail: '缺少伤停数据' };

    // 伤员对球队的影响 (每个关键球员伤停 -0.15 到 -0.3)
    const calcInjuryImpact = (profile) => {
      let impact = 0;
      const injuredNames = [];
      profile.injured.forEach(name => {
        const player = profile.keyPlayers.find(p => p.name === name);
        if (player) {
          const severity = player.rating >= 85 ? 0.3 : player.rating >= 80 ? 0.2 : 0.1;
          impact += severity;
          injuredNames.push(`${name}(${player.pos})`);
        }
      });
      profile.suspended.forEach(name => {
        const player = profile.keyPlayers.find(p => p.name === name);
        if (player) {
          impact += 0.15;
          injuredNames.push(`${name}(停赛)`);
        }
      });
      return { impact: Math.min(1, impact), names: injuredNames };
    };

    const hInj = calcInjuryImpact(hp);
    const aInj = calcInjuryImpact(ap);

    // 伤停影响差 → 评分 (正=主队更有利)
    const score = (aInj.impact - hInj.impact) * 0.5;

    const details = [];
    if (hInj.names.length) details.push(`${homeCode}缺阵: ${hInj.names.join(', ')}`);
    if (aInj.names.length) details.push(`${awayCode}缺阵: ${aInj.names.join(', ')}`);

    return {
      score: Math.max(-1, Math.min(1, score)),
      detail: details.length ? `伤停: ${details.join('; ')}` : '双方阵容齐整',
      homeInjured: hInj.names,
      awayInjured: aInj.names,
    };
  }

  // ── 5. 球场环境评分 ──────────────────────────────────
  function scoreVenue(venueCode, homeCode, awayCode) {
    const impact = getVenueImpact(venueCode, homeCode, awayCode);
    const score = impact.homeBonus + impact.awayPenalty;
    return {
      score: Math.max(-1, Math.min(1, score / 2)),
      detail: impact.notes.length ? `环境: ${impact.notes.join('; ')}` : '中立场，无明显环境影响',
      notes: impact.notes,
    };
  }

  // ── 6. 小组形势评分 ──────────────────────────────────
  // 2026 世界杯: 各组前2名 + 8个成绩最好第3名 = 32强
  // → 强队拿到4分基本"安全"(第3名也能出线), 收力概率大
  // → 6分 = 稳出线; 4分且净胜球优 = 大概率出线; 3分 = 仍有希望; ≤1分 = 危险
  function scoreGroupStage(match, homeCode, awayCode) {
    if (match.stage !== 'group') {
      return { score: 0, detail: '淘汰赛，双方全力以赴', advancement: null };
    }

    const standings = calcGroupStandings(match.group, match.id);
    const hIdx = standings.findIndex(s => s.team === homeCode);
    const aIdx = standings.findIndex(s => s.team === awayCode);
    const hStanding = standings[hIdx];
    const aStanding = standings[aIdx];

    if (!hStanding || !aStanding) return { score: 0, detail: '小组数据不足', standings, advancement: null };

    // ── 出线形势分析 ──
    const adv = analyzeGroupAdvancement(standings, match.matchday);
    const hAdv = adv[homeCode];
    const aAdv = adv[awayCode];

    let score = 0;
    const notes = [];

    // ── 收力逻辑 (核心: 前三都能出线,4分大概率安全) ──

    // 6分+ → 稳出线,大概率轮换
    const hSafe = hStanding.pts >= 6;
    const aSafe = aStanding.pts >= 6;
    // 4分且排名前2 → 大概率出线,可能适当收力
    const hComfortable = hStanding.pts >= 4 && hIdx < 2;
    const aComfortable = aStanding.pts >= 4 && aIdx < 2;
    // 4分排第3 → 看净胜球,大概率也能以第3出线
    const hLikelyThrough3rd = hStanding.pts >= 4 && hIdx === 2 && (hStanding.gf - hStanding.ga) >= 0;
    const aLikelyThrough3rd = aStanding.pts >= 4 && aIdx === 2 && (aStanding.gf - aStanding.ga) >= 0;

    // 已稳出线 → 轮换收力
    if (hSafe && !aSafe) {
      score -= 0.35;
      notes.push(`${homeCode}已确保出线，大概率轮换保存体力`);
    }
    if (aSafe && !hSafe) {
      score += 0.35;
      notes.push(`${awayCode}已确保出线，大概率轮换保存体力`);
    }
    // 都稳出线 → 都收力,差距缩小
    if (hSafe && aSafe) {
      score *= 0.5;
      notes.push('双方均已出线，可能同时轮换');
    }

    // 舒适区(4分+排名前2或第3净胜球优) → 适度收力
    if (!hSafe && (hComfortable || hLikelyThrough3rd) && !aComfortable && !aLikelyThrough3rd && !aSafe) {
      score -= 0.2;
      const reason = hComfortable ? '排名前2，基本锁定出线' : '4分+正净胜球，大概率以第3出线';
      notes.push(`${homeCode}${reason}，可能适度收力`);
    }
    if (!aSafe && (aComfortable || aLikelyThrough3rd) && !hComfortable && !hLikelyThrough3rd && !hSafe) {
      score += 0.2;
      const reason = aComfortable ? '排名前2，基本锁定出线' : '4分+正净胜球，大概率以第3出线';
      notes.push(`${awayCode}${reason}，可能适度收力`);
    }

    // ── 必须赢/拼命逻辑 ──
    const hMustWin = hAdv && hAdv.mustWin;
    const aMustWin = aAdv && aAdv.mustWin;

    if (hMustWin && !aMustWin) {
      score += 0.25;
      notes.push(`${homeCode}必须取胜才能出线，战意十足`);
    }
    if (aMustWin && !hMustWin) {
      score -= 0.25;
      notes.push(`${awayCode}必须取胜才能出线，战意十足`);
    }

    // ── 出局逻辑 ──
    const hEliminated = hAdv && hAdv.eliminated;
    const aEliminated = aAdv && aAdv.eliminated;

    if (hEliminated && !aEliminated) {
      score -= 0.25;
      notes.push(`${homeCode}基本出局，斗志存疑`);
    }
    if (aEliminated && !hEliminated) {
      score += 0.25;
      notes.push(`${awayCode}基本出局，斗志存疑`);
    }

    // ── 末轮特殊: 净胜球可能成为关键 ──
    if (match.matchday === 3) {
      const hGD = hStanding.gf - hStanding.ga;
      const aGD = aStanding.gf - aStanding.ga;
      // 同分情况下净胜球很重要 → 不敢松懈
      if (hStanding.pts === aStanding.pts && Math.abs(hGD - aGD) <= 1) {
        notes.push('末轮同分且净胜球接近，双方都不敢松懈');
        // 同分对决的紧迫感抵消收力倾向
        score *= 0.6;
      }
    }

    // ── 首轮无数据时给个提示 ──
    if (hStanding.played === 0 && aStanding.played === 0) {
      notes.push('小组首轮，双方全力出击');
    }

    return {
      score: Math.max(-1, Math.min(1, score)),
      detail: notes.length ? `小组形势: ${notes.join('; ')}` : '双方形势均衡',
      standings,
      advancement: adv,
    };
  }

  // ── 小组出线概率分析 ──────────────────────────────────
  // 2026 世界杯规则: 各组前2名(24队) + 8个成绩最好第3名 = 32强
  // 所以第3名也有很大机会出线,4分基本"安全"
  function analyzeGroupAdvancement(standings, matchday) {
    const result = {};
    const total = standings.length; // 4

    standings.forEach((s, idx) => {
      const pos = idx + 1; // 当前排名 1-4
      const gd = s.gf - s.ga;
      const maxPts = s.pts + (total - 1 - s.played) * 3; // 理论最高分

      // ── 出线概率估算 ──
      let prob = 0; // 0-1
      let status = 'normal'; // normal / safe / comfortable / mustWin / eliminated
      let needPts = 0; // 还需要几分

      if (s.played === 0) {
        // 首轮未打，无法判断
        prob = 0.5;
        status = 'normal';
      } else if (pos <= 2) {
        // 排名前2
        if (s.pts >= 6) {
          prob = 0.98;
          status = 'safe';
        } else if (s.pts >= 4) {
          prob = 0.80;
          status = 'comfortable';
        } else if (s.pts >= 3) {
          prob = 0.50;
          status = 'normal';
        } else {
          prob = 0.25;
          status = 'normal';
        }
      } else if (pos === 3) {
        // 第3名 — 关键: 8个最好第3出线
        if (s.pts >= 6) {
          prob = 0.95; // 6分第3几乎100%出线
          status = 'safe';
        } else if (s.pts >= 4) {
          prob = gd >= 0 ? 0.70 : 0.55; // 4分+正净胜球大概率出线
          status = 'comfortable';
        } else if (s.pts >= 3) {
          prob = 0.30; // 3分第3需要看其他组脸色
          status = 'normal';
        } else if (s.pts >= 1) {
          prob = 0.10;
          status = 'mustWin';
        } else {
          prob = 0.02;
          status = 'eliminated';
        }
      } else {
        // 第4名
        if (s.pts >= 4) {
          prob = 0.20; // 第4但有4分,仍有理论可能
          status = 'normal';
        } else if (s.pts >= 1) {
          prob = 0.05;
          status = 'mustWin';
        } else {
          if (s.played >= 2) {
            prob = 0;
            status = 'eliminated';
          } else {
            prob = 0.05;
            status = 'mustWin';
          }
        }
      }

      // ── 必须赢判断 ──
      const mustWin = (status === 'mustWin') ||
        (s.played >= 2 && s.pts <= 1 && pos >= 3) ||
        (matchday === 3 && s.pts <= 2 && pos >= 3);

      // ── 出局判断 ──
      const eliminated = status === 'eliminated' ||
        (s.played >= 2 && s.pts <= 0 && pos >= 3) ||
        (matchday === 3 && s.pts <= 1 && pos === 4);

      // ── 还需要几分 ──
      if (s.pts >= 6) needPts = 0;
      else if (s.pts >= 4 && pos <= 2) needPts = 0;
      else if (s.pts >= 4 && pos === 3 && gd >= 0) needPts = 0;
      else if (s.pts >= 3 && pos <= 2) needPts = 1; // 1分保前2
      else needPts = 3; // 需要赢

      result[s.team] = {
        position: pos,
        prob: +prob.toFixed(2),
        status,
        mustWin,
        eliminated,
        needPts,
        maxPts,
        canStillAdvance: maxPts >= 4 || (maxPts >= 3 && prob > 0),
      };
    });

    return result;
  }

  // 计算小组积分榜（排除某场比赛）
  function calcGroupStandings(groupCode, excludeMatchId) {
    const teamCodes = Object.entries(TEAMS)
      .filter(([_, t]) => t.group === groupCode)
      .map(([code]) => code);

    const standings = {};
    teamCodes.forEach(code => {
      standings[code] = { team: code, played:0, won:0, drawn:0, lost:0, gf:0, ga:0, pts:0 };
    });

    MATCHES.filter(m => m.group === groupCode && m.id !== excludeMatchId && m.homeScore !== null)
      .forEach(m => {
        const hs = standings[m.home];
        const as = standings[m.away];
        if (!hs || !as) return;
        hs.played++; as.played++;
        hs.gf += m.homeScore; hs.ga += m.awayScore;
        as.gf += m.awayScore; as.ga += m.homeScore;
        if (m.homeScore > m.awayScore) { hs.won++; as.lost++; hs.pts += 3; }
        else if (m.homeScore === m.awayScore) { hs.drawn++; as.drawn++; hs.pts++; as.pts++; }
        else { as.won++; hs.lost++; as.pts += 3; }
      });

    return Object.values(standings).sort((a,b) => b.pts - a.pts || (b.gf-b.ga)-(a.gf-a.ga) || b.gf - a.gf);
  }

  // ── 7. 士气评分 ──────────────────────────────────────
  function scoreMorale(homeCode, awayCode) {
    const hp = TeamProfiles[homeCode];
    const ap = TeamProfiles[awayCode];
    if (!hp || !ap) return { score: 0, detail: '缺少士气数据' };

    const diff = (hp.morale - ap.morale) / 10;
    return {
      score: Math.max(-1, Math.min(1, diff)),
      detail: `士气: ${homeCode} ${hp.morale}/10 vs ${awayCode} ${ap.morale}/10`,
      homeMorale: hp.morale,
      awayMorale: ap.morale,
    };
  }

  // ── 8. 体能评分 ──────────────────────────────────────
  function scoreFatigue(homeCode, awayCode) {
    const hp = TeamProfiles[homeCode];
    const ap = TeamProfiles[awayCode];
    if (!hp || !ap) return { score: 0, detail: '缺少体能数据' };

    // fatigue 越高越疲劳 → 对自己越不利
    const diff = (ap.fatigue - hp.fatigue) / 10;
    return {
      score: Math.max(-1, Math.min(1, diff)),
      detail: `体能: ${homeCode} ${hp.fatigue}/10 vs ${awayCode} ${ap.fatigue}/10`,
      homeFatigue: hp.fatigue,
      awayFatigue: ap.fatigue,
    };
  }

  // ── 9. 近期状态评分 ──────────────────────────────────
  function scoreRecentForm(homeCode, awayCode) {
    const hp = TeamProfiles[homeCode];
    const ap = TeamProfiles[awayCode];
    if (!hp || !ap) return { score: 0, detail: '缺少状态数据' };

    const formToScore = (form) => {
      let s = 0;
      form.forEach((r, i) => {
        const weight = (form.length - i) / form.length; // 近期权重更高
        if (r === 'W') s += weight;
        else if (r === 'D') s += weight * 0.3;
      });
      return s / form.length;
    };

    const hForm = formToScore(hp.recentForm);
    const aForm = formToScore(ap.recentForm);
    const diff = (hForm - aForm) * 2;

    return {
      score: Math.max(-1, Math.min(1, diff)),
      detail: `近期状态: ${homeCode} ${hp.recentForm.join('')} vs ${awayCode} ${ap.recentForm.join('')}`,
      homeFormStr: hp.recentForm.join(''),
      awayFormStr: ap.recentForm.join(''),
    };
  }

  // ═══════════════════════════════════════════════════════
  // 球队基础攻防能力(0~1 区间,1.0 = 顶级,0.3 = 鱼腩)
  // ═══════════════════════════════════════════════════════
  function teamBaseStrength(code) {
    const team = TEAMS[code];
    const profile = TeamProfiles[code];
    if (!team) return { attack: 0.5, defense: 0.5, overall: 0.5 };

    // 1) 排名分 — 用对数把 #1 ~ #150 映射到 0.95 ~ 0.20
    //    rank=1  → 0.95, rank=10 → 0.79, rank=30 → 0.62, rank=70 → 0.43, rank=150 → 0.20
    const rank = team.rank || 50;
    const rankScore = Math.max(0.20, Math.min(0.95, 1.05 - 0.13 * Math.log2(Math.max(1, rank))));

    if (!profile) {
      return { attack: rankScore, defense: rankScore, overall: rankScore };
    }

    // 2) 关键球员评分(分位置加权 — 攻击线影响 attack,后防线影响 defense)
    const fit = profile.keyPlayers.filter(p => p.status === 'fit');
    const attackers = fit.filter(p => /ST|LW|RW|CF|AM/.test(p.pos));
    const defenders = fit.filter(p => /CB|LB|RB|GK|DM/.test(p.pos));
    const midfielders = fit.filter(p => /CM|CDM|CAM/.test(p.pos));

    // 球员评分 70~95 → 归一到 0.4~0.95
    const ratingToScore = r => Math.max(0.4, Math.min(0.95, (r - 60) / 35));
    const avgScore = arr => arr.length
      ? arr.reduce((s, p) => s + ratingToScore(p.rating), 0) / arr.length
      : null;

    const attackerAvg  = avgScore(attackers);
    const defenderAvg  = avgScore(defenders);
    const midAvg       = avgScore(midfielders);

    // 3) 进攻能力 = 排名 × 0.55 + 攻击线球员 × 0.30 + 中场 × 0.15
    let attack  = rankScore * 0.55
                + (attackerAvg  != null ? attackerAvg  : rankScore) * 0.30
                + (midAvg       != null ? midAvg       : rankScore) * 0.15;
    let defense = rankScore * 0.55
                + (defenderAvg  != null ? defenderAvg  : rankScore) * 0.30
                + (midAvg       != null ? midAvg       : rankScore) * 0.15;

    // 4) 风格修正
    if (profile.playStyle?.includes('技术流'))   attack  += 0.04;
    if (profile.playStyle?.includes('快速反击')) attack  += 0.03;
    if (profile.playStyle?.includes('铁桶阵'))   defense += 0.06;
    if (profile.playStyle?.includes('高位逼抢')) { attack += 0.02; defense -= 0.02; }
    if (profile.weaknesses?.some(w => /防/.test(w))) defense -= 0.05;
    if (profile.weaknesses?.some(w => /锋|进攻/.test(w))) attack  -= 0.05;
    if (profile.strengths?.some(s => /防/.test(s)))  defense += 0.04;
    if (profile.strengths?.some(s => /锋|进攻/.test(s))) attack  += 0.04;

    // 5) 阵容深度 — 浅板凳在比赛后段会拖累
    const depth = profile.squadDepth || 6;
    const depthAdj = (depth - 6) * 0.01; // 深度每差 1 ±0.01
    attack  += depthAdj;
    defense += depthAdj;

    // 6) 锋线球员伤停的额外打击
    const attackerInjured = profile.injured.filter(name =>
      profile.keyPlayers.find(p => p.name === name && /ST|LW|RW|CF/.test(p.pos))
    ).length;
    attack -= attackerInjured * 0.05;

    return {
      attack:  Math.max(0.2, Math.min(1.0, attack)),
      defense: Math.max(0.2, Math.min(1.0, defense)),
      overall: Math.max(0.2, Math.min(1.0, (attack + defense) / 2)),
    };
  }

  // ═══════════════════════════════════════════════════════
  // 综合预测
  // ═══════════════════════════════════════════════════════
  function predict(homeCode, awayCode, opts = {}) {
    const match = opts.match || {};
    const venueCode = match.venue || '';

    // 1. 计算各维度修正分
    const factors = {
      ranking:    scoreRanking(homeCode, awayCode),
      h2h:        scoreH2H(homeCode, awayCode),
      tactical:   scoreTactical(homeCode, awayCode),
      injuries:   scoreInjuries(homeCode, awayCode),
      venue:      scoreVenue(venueCode, homeCode, awayCode),
      groupStage: scoreGroupStage(match, homeCode, awayCode),
      morale:     scoreMorale(homeCode, awayCode),
      fatigue:    scoreFatigue(homeCode, awayCode),
      recentForm: scoreRecentForm(homeCode, awayCode),
      politics:   scorePolitics(homeCode, awayCode),
      underdog:   scoreUnderdog(homeCode, awayCode),
    };

    // 2. 加权合成总分(-1 到 +1, 正=主队有利)
    let totalScore = 0;
    Object.entries(WEIGHTS).forEach(([key, weight]) => {
      totalScore += (factors[key]?.score || 0) * weight;
    });
    totalScore = Math.max(-1, Math.min(1, totalScore));

    // 3. 队伍基础攻防能力 → 推算 xG
    //    核心思路: xG = 我方攻击力 × 对方防守漏洞 × 大赛常数
    const home = teamBaseStrength(homeCode);
    const away = teamBaseStrength(awayCode);

    const BASE = 1.45;
    let homeXG = (home.attack / Math.max(0.25, away.defense)) * BASE;
    let awayXG = (away.attack / Math.max(0.25, home.defense)) * BASE;

    // 4. 每个软因素**直接乘进 xG**,而不是先合成再小幅调整 ——
    //    这样伤员、士气低落、连败这些因素能真正改变比分,而非象征性影响
    //    narrative 同步收集人话叙述,用于解释 AI 为什么这么判
    const narrative = [];

    // 4a. 伤停 — 受影响一方 xG 直接打折(关键锋将受伤可能 -25% 进攻)
    const hp = TeamProfiles[homeCode];
    const ap = TeamProfiles[awayCode];
    const calcInjuryDrag = (profile, label) => {
      if (!profile) return { atk: 0, def: 0 };
      let atkDrag = 0, defDrag = 0;
      const detail = [];
      [...(profile.injured || []), ...(profile.suspended || [])].forEach(name => {
        const player = profile.keyPlayers?.find(p => p.name === name);
        if (!player) return;
        const sev = player.rating >= 88 ? 0.18 : player.rating >= 82 ? 0.12 : 0.06;
        if (/ST|LW|RW|CF|AM/.test(player.pos))      atkDrag += sev;
        else if (/CB|LB|RB|GK|DM/.test(player.pos)) defDrag += sev;
        else { atkDrag += sev * 0.5; defDrag += sev * 0.5; }
        detail.push(`${name}(${player.pos}, ${player.rating}评分)`);
      });
      if (detail.length) narrative.push(`🏥 ${label}缺阵: ${detail.join('、')}`);
      return { atk: Math.min(0.4, atkDrag), def: Math.min(0.4, defDrag) };
    };
    const hInjury = calcInjuryDrag(hp, '主队');
    const aInjury = calcInjuryDrag(ap, '客队');
    homeXG *= (1 - hInjury.atk);                      // 主队进攻被自己的伤员拖累
    awayXG *= (1 + hInjury.def * 0.5);                // 主队后防伤员 → 客队多得分机会
    awayXG *= (1 - aInjury.atk);
    homeXG *= (1 + aInjury.def * 0.5);

    // 4b. 士气 — 满血士气 vs 低迷可能造成 ±18% 的差距
    if (hp && ap) {
      const moraleDelta = (hp.morale - ap.morale) / 10;
      homeXG *= (1 + moraleDelta * 0.18);
      awayXG *= (1 - moraleDelta * 0.18);
      if (Math.abs(hp.morale - ap.morale) >= 3) {
        narrative.push(`💪 士气 ${hp.morale}:${ap.morale} ${hp.morale > ap.morale ? '主队气势如虹' : '客队气势更盛'}`);
      }
    }

    // 4c. 近期状态 — 5W vs 5L 之类的极端差距可造成 ±30% 影响
    const formScore = factors.recentForm?.score || 0;
    homeXG *= (1 + formScore * 0.30);
    awayXG *= (1 - formScore * 0.30);
    if (Math.abs(formScore) > 0.4) {
      narrative.push(`📈 近期状态: 主队 ${hp?.recentForm?.join('') || '-'} vs 客队 ${ap?.recentForm?.join('') || '-'}`);
    }

    // 4d. 体能(疲劳越高越拖)
    if (hp && ap) {
      const fatigueDelta = (ap.fatigue - hp.fatigue) / 10;  // 主队不疲劳则正
      homeXG *= (1 + fatigueDelta * 0.12);
      awayXG *= (1 - fatigueDelta * 0.12);
      if (Math.abs(hp.fatigue - ap.fatigue) >= 3) {
        narrative.push(`⚡ 体能: 主队疲劳 ${hp.fatigue}/10 vs 客队 ${ap.fatigue}/10`);
      }
    }

    // 4e. 战术克制(高位逼抢克控球、铁桶克技术流等)
    const tacticalScore = factors.tactical?.score || 0;
    homeXG *= (1 + tacticalScore * 0.18);
    awayXG *= (1 - tacticalScore * 0.18);
    if (Math.abs(tacticalScore) > 0.2 && factors.tactical?.detail) {
      narrative.push(`⚔️ ${factors.tactical.detail}`);
    }

    // 4f. 历史交锋
    const h2hScore = factors.h2h?.score || 0;
    homeXG *= (1 + h2hScore * 0.10);
    awayXG *= (1 - h2hScore * 0.10);

    // 4g. 小组形势(必须赢/已晋级保留体力/出局摆烂)
    // 2026 规则: 前2名+8个最好第3名出线 → 4分基本安全，强队收力概率大
    const stageScore = factors.groupStage?.score || 0;
    homeXG *= (1 + stageScore * 0.25);
    awayXG *= (1 - stageScore * 0.25);
    if (Math.abs(stageScore) > 0.1 && factors.groupStage?.detail) {
      narrative.push(`📋 ${factors.groupStage.detail}`);
    }
    // 额外: 收力/拼命的叙事补充
    if (factors.groupStage?.advancement) {
      const hAdv = factors.groupStage.advancement[homeCode];
      const aAdv = factors.groupStage.advancement[awayCode];
      if (hAdv && hAdv.status === 'safe') {
        narrative.push(`💤 ${homeCode}已稳获出线权，预计大幅轮换，实际战力可能下降20-30%`);
      }
      if (aAdv && aAdv.status === 'safe') {
        narrative.push(`💤 ${awayCode}已稳获出线权，预计大幅轮换，实际战力可能下降20-30%`);
      }
      if (hAdv && hAdv.status === 'comfortable') {
        narrative.push(`😌 ${homeCode}出线形势乐观(概率${Math.round(hAdv.prob*100)}%)，可能适度轮换主力`);
      }
      if (aAdv && aAdv.status === 'comfortable') {
        narrative.push(`😌 ${awayCode}出线形势乐观(概率${Math.round(aAdv.prob*100)}%)，可能适度轮换主力`);
      }
      if (hAdv && hAdv.mustWin) {
        narrative.push(`🔥 ${homeCode}背水一战！必须赢球才能保留出线希望，战意值拉满`);
      }
      if (aAdv && aAdv.mustWin) {
        narrative.push(`🔥 ${awayCode}背水一战！必须赢球才能保留出线希望，战意值拉满`);
      }
    }

    // 4h. 球场/海拔/气候
    const venueScore = factors.venue?.score || 0;
    homeXG *= (1 + venueScore * 0.12);
    awayXG *= (1 - venueScore * 0.12);
    if (Math.abs(venueScore) > 0.2 && factors.venue?.detail) {
      narrative.push(`🏟️ ${factors.venue.detail}`);
    }

    // 4i. 场外因素/政治情绪
    const politicsScore = factors.politics?.score || 0;
    homeXG *= (1 + politicsScore * 0.15);
    awayXG *= (1 - politicsScore * 0.15);
    if (Math.abs(politicsScore) > 0.05 && factors.politics?.detail) {
      narrative.push(`⚖️ ${factors.politics.detail}`);
    }

    // 4j. 强弱博弈：弱队死命防守/摆大巴会显著压低强队 xG；
    //     弱队有爆冷潜质时可能偷分
    const underdogScore = factors.underdog?.score || 0;
    homeXG *= (1 + underdogScore * 0.35);
    awayXG *= (1 - underdogScore * 0.20);
    if (Math.abs(underdogScore) > 0.08 && factors.underdog?.detail) {
      narrative.push(`🛡️ ${factors.underdog.detail}`);
    }

    // 5. 上下限保护
    homeXG = Math.max(0.25, Math.min(5.5, homeXG));
    awayXG = Math.max(0.25, Math.min(5.5, awayXG));

    const isKnockout = ['r32','r16','qf','sf','final','third'].includes(match.stage);

    // 6. 枚举 0..8 球的所有比分组合,按概率排序
    const isFavoredHome = homeXG > awayXG;
    const allScorelines = [];
    for (let h = 0; h <= 8; h++) {
      for (let a = 0; a <= 8; a++) {
        const p = poissonPmf(h, homeXG) * poissonPmf(a, awayXG);
        if (p < 0.001) continue;
        if (isKnockout && h === a) continue;
        allScorelines.push({ home: h, away: a, prob: p });
      }
    }
    allScorelines.sort((x, y) => y.prob - x.prob);

    // 7. 选 3 个有代表性的场景
    const scenarios = pickScenarios(allScorelines, isFavoredHome, isKnockout);
    const top = scenarios[0] || { home: 1, away: 1 };

    // 8. 胜平负概率
    const probs = poissonProbabilities(homeXG, awayXG);

    // 9. 置信度
    const dataCompleteness = Object.values(factors).filter(f => f.score !== 0).length / Object.keys(factors).length;

    // 10. 实力对比表
    const comparison = buildComparison(homeCode, awayCode, factors, home, away);

    return {
      homeGoals: top.home,
      awayGoals: top.away,
      scenarios,
      comparison,
      narrative,  // AI 关键判断的人话叙述
      homeWin:  Math.round(probs.homeWin * 100),
      draw:     Math.round(probs.draw * 100),
      awayWin:  Math.round(probs.awayWin * 100),
      homeXG:   +homeXG.toFixed(2),
      awayXG:   +awayXG.toFixed(2),
      homeStrength: home,
      awayStrength: away,
      totalScore: +totalScore.toFixed(3),
      confidence: +dataCompleteness.toFixed(2),
      factors,
    };
  }

  // 从概率排序的比分列表中挑选 3 个有代表性的场景
  function pickScenarios(scorelines, favoredHome, isKnockout) {
    if (!scorelines.length) return [];

    const out = [];
    const used = new Set();
    const key = s => `${s.home}-${s.away}`;

    // 场景 1: 主流(概率最高)
    const main = scorelines[0];
    out.push({
      label: '🎯 主流预测',
      home: main.home,
      away: main.away,
      prob: +(main.prob * 100).toFixed(1),
      reasoning: '综合各项指标后概率最高的比分',
    });
    used.add(key(main));

    // 场景 2: 备选(概率第 2-4 名中,胜负方向跟主流不同的;否则取概率第 2)
    const mainWinner = main.home > main.away ? 'home' : main.home < main.away ? 'away' : 'draw';
    let alt = null;
    for (const s of scorelines.slice(1, 8)) {
      if (used.has(key(s))) continue;
      const w = s.home > s.away ? 'home' : s.home < s.away ? 'away' : 'draw';
      if (w !== mainWinner) { alt = s; break; }
    }
    if (!alt) alt = scorelines.find(s => !used.has(key(s)));
    if (alt) {
      const w = alt.home > alt.away ? 'home' : alt.home < alt.away ? 'away' : 'draw';
      const altLabel = w === 'draw' ? '🤝 互交白卷/握手言和'
                     : w !== mainWinner ? '🔄 反向走势'
                     : '🎲 备选比分';
      out.push({
        label: altLabel,
        home: alt.home,
        away: alt.away,
        prob: +(alt.prob * 100).toFixed(1),
        reasoning: w === 'draw' ? '若双方都谨慎踢、不冒险,平局是合理结局'
                 : w !== mainWinner ? '另一种合理走势,数值上虽不及主流但仍在可能区间'
                 : '次概率比分,常见替代结果',
      });
      used.add(key(alt));
    }

    // 场景 3: 爆冷(劣势方反而获胜的比分中,概率最高的)
    if (!isKnockout || true) { // 淘汰赛也可能爆冷
      const upsetSide = favoredHome ? 'away' : 'home';
      const upset = scorelines.find(s => {
        if (used.has(key(s))) return false;
        if (upsetSide === 'home') return s.home > s.away;
        return s.away > s.home;
      });
      if (upset && upset.prob > 0.01) {
        out.push({
          label: '🌶 爆冷剧本',
          home: upset.home,
          away: upset.away,
          prob: +(upset.prob * 100).toFixed(1),
          reasoning: '若处于劣势的一方抓住关键机会、对手发挥不佳,这是最可能的爆冷结果',
        });
        used.add(key(upset));
      }
    }

    return out.slice(0, 3);
  }

  // 构建实力对比表
  function buildComparison(homeCode, awayCode, factors, homeStr, awayStr) {
    const hp = TeamProfiles[homeCode];
    const ap = TeamProfiles[awayCode];
    const hRank = TEAMS[homeCode]?.rank;
    const aRank = TEAMS[awayCode]?.rank;

    // 每行: {label, home, away, advantage: 'home'|'away'|'tie'}
    const rows = [];

    if (hRank && aRank) {
      rows.push({
        key: 'ranking',
        label: 'FIFA 排名',
        home: `#${hRank}`,
        away: `#${aRank}`,
        advantage: hRank < aRank ? 'home' : hRank > aRank ? 'away' : 'tie',
      });
    }

    // 队伍攻防能力(本次重写新增,直观看出强弱差距)
    if (homeStr && awayStr) {
      const fmt = v => (v * 100).toFixed(0);
      rows.push({
        key: 'attack',
        label: '进攻能力',
        home: fmt(homeStr.attack),
        away: fmt(awayStr.attack),
        advantage: homeStr.attack > awayStr.attack ? 'home'
                 : homeStr.attack < awayStr.attack ? 'away' : 'tie',
      });
      rows.push({
        key: 'defense',
        label: '防守能力',
        home: fmt(homeStr.defense),
        away: fmt(awayStr.defense),
        advantage: homeStr.defense > awayStr.defense ? 'home'
                 : homeStr.defense < awayStr.defense ? 'away' : 'tie',
      });
    }

    if (factors.ranking?.homeStr != null && !homeStr) {
      // 仅在没有更精细的攻防分时才显示这个
      rows.push({
        key: 'strength',
        label: '综合实力分',
        home: factors.ranking.homeStr.toFixed(1),
        away: factors.ranking.awayStr.toFixed(1),
        advantage: factors.ranking.homeStr > factors.ranking.awayStr ? 'home'
                 : factors.ranking.homeStr < factors.ranking.awayStr ? 'away' : 'tie',
      });
    }

    if (hp && ap) {
      rows.push({
        key: 'formation',
        label: '阵型',
        home: hp.formation,
        away: ap.formation,
        advantage: 'tie',
      });
      rows.push({
        key: 'coach',
        label: '主帅风格',
        home: `${hp.coach}(${hp.coachStyle})`,
        away: `${ap.coach}(${ap.coachStyle})`,
        advantage: 'tie',
      });
      rows.push({
        key: 'morale',
        label: '士气',
        home: `${hp.morale}/10`,
        away: `${ap.morale}/10`,
        advantage: hp.morale > ap.morale ? 'home' : hp.morale < ap.morale ? 'away' : 'tie',
      });
      rows.push({
        key: 'fatigue',
        label: '体能(越低越好)',
        home: `${hp.fatigue}/10`,
        away: `${ap.fatigue}/10`,
        advantage: hp.fatigue < ap.fatigue ? 'home' : hp.fatigue > ap.fatigue ? 'away' : 'tie',
      });
      rows.push({
        key: 'recentForm',
        label: '近 5 场战绩',
        home: hp.recentForm.join(''),
        away: ap.recentForm.join(''),
        advantage: scoreFromForm(hp.recentForm) > scoreFromForm(ap.recentForm) ? 'home'
                 : scoreFromForm(hp.recentForm) < scoreFromForm(ap.recentForm) ? 'away' : 'tie',
      });

      const hKey = hp.keyPlayers.filter(p => p.status === 'fit');
      const aKey = ap.keyPlayers.filter(p => p.status === 'fit');
      if (hKey.length && aKey.length) {
        const hAvg = hKey.reduce((s,p)=>s+p.rating,0)/hKey.length;
        const aAvg = aKey.reduce((s,p)=>s+p.rating,0)/aKey.length;
        rows.push({
          key: 'keyplayer',
          label: '核心球员均评分',
          home: hAvg.toFixed(1),
          away: aAvg.toFixed(1),
          advantage: hAvg > aAvg ? 'home' : hAvg < aAvg ? 'away' : 'tie',
        });
      }

      const hInj = hp.injured.length + hp.suspended.length;
      const aInj = ap.injured.length + ap.suspended.length;
      rows.push({
        key: 'injuries',
        label: '伤停人数',
        home: `${hInj}`,
        away: `${aInj}`,
        advantage: hInj < aInj ? 'home' : hInj > aInj ? 'away' : 'tie',
      });
    }

    // h2h
    if (factors.h2h?.record && factors.h2h.record.total > 0) {
      const r = factors.h2h.record;
      rows.push({
        key: 'h2h',
        label: `历史交锋(${r.total} 场)`,
        home: `${r.teamAWins} 胜`,
        away: `${r.teamBWins} 胜`,
        advantage: r.teamAWins > r.teamBWins ? 'home' : r.teamAWins < r.teamBWins ? 'away' : 'tie',
      });
    }

    // 总评行
    const homeAdvCount = rows.filter(r => r.advantage === 'home').length;
    const awayAdvCount = rows.filter(r => r.advantage === 'away').length;

    return { rows, homeAdvCount, awayAdvCount };
  }

  function scoreFromForm(form) {
    return form.reduce((s, r) => s + (r === 'W' ? 3 : r === 'D' ? 1 : 0), 0);
  }

  function poissonProbabilities(lambdaH, lambdaA) {
    let homeWin = 0, draw = 0, awayWin = 0;
    for (let h = 0; h <= 8; h++) {
      for (let a = 0; a <= 8; a++) {
        const p = poissonPmf(h, lambdaH) * poissonPmf(a, lambdaA);
        if (h > a) homeWin += p;
        else if (h === a) draw += p;
        else awayWin += p;
      }
    }
    const total = homeWin + draw + awayWin;
    return { homeWin: homeWin/total, draw: draw/total, awayWin: awayWin/total };
  }

  /**
   * 批量预测
   */
  function predictAll(matches) {
    return matches.map(m => {
      if (!m.home || !m.away || !TEAMS[m.home] || !TEAMS[m.away]) {
        return { ...m, prediction: null };
      }
      return { ...m, prediction: predict(m.home, m.away, { match: m }) };
    });
  }

  return { predict, predictAll, calcGroupStandings, WEIGHTS };
})();
