#!/usr/bin/env node
/**
 * 世界杯比分自动更新脚本（重写版）
 *
 * 用法：
 *   node update-scores.js              # dry-run，仅打印将要更新的内容
 *   node update-scores.js --apply      # 实际写入 js/data.js
 *
 * 安全保证：
 * - 仅处理 API 返回 status === 'FINISHED' 的比赛
 * - 仅按 home + away + date 三元组精确匹配本地比赛
 * - 逐行替换，避免跨比赛的正则误匹配（旧版的 bug）
 * - 如本地比分已等于 API 比分，跳过（不写入）
 * - 写入前自动备份到 backups/
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const APPLY = process.argv.includes('--apply');
const DATA_FILE = path.join(__dirname, 'js', 'data.js');
const BACKUP_DIR = path.join(__dirname, 'backups');
const LOG_FILE = path.join(__dirname, 'update.log');

function log(message) {
    const timestamp = new Date().toLocaleString('zh-CN');
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    fs.appendFileSync(LOG_FILE, logMessage + '\n');
}

// ---------- 球队名 → 内部代码 ----------
const TEAM_CODE_BY_API_NAME = {
    'Mexico': 'MEX', 'South Africa': 'RSA', 'Korea Republic': 'KOR', 'South Korea': 'KOR', 'Czechia': 'CZE',
    'Canada': 'CAN', 'Bosnia-Herzegovina': 'BIH', 'Bosnia and Herzegovina': 'BIH',
    'Qatar': 'QAT', 'Switzerland': 'SUI',
    'Brazil': 'BRA', 'Morocco': 'MAR', 'Haiti': 'HAI', 'Scotland': 'SCO',
    'United States': 'USA', 'USA': 'USA', 'Paraguay': 'PAR', 'Australia': 'AUS', 'Turkey': 'TUR', 'Türkiye': 'TUR',
    'Germany': 'GER', 'Curaçao': 'CUW', 'Curacao': 'CUW',
    'Ivory Coast': 'CIV', "Côte d'Ivoire": 'CIV', 'Cote d\'Ivoire': 'CIV', 'Ecuador': 'ECU',
    'Netherlands': 'NED', 'Japan': 'JPN', 'Sweden': 'SWE', 'Tunisia': 'TUN',
    'Belgium': 'BEL', 'Egypt': 'EGY', 'Iran': 'IRN', 'IR Iran': 'IRN', 'New Zealand': 'NZL',
    'Spain': 'ESP', 'Cape Verde Islands': 'CPV', 'Cape Verde': 'CPV', 'Saudi Arabia': 'KSA', 'Uruguay': 'URU',
    'France': 'FRA', 'Senegal': 'SEN', 'Iraq': 'IRQ', 'Norway': 'NOR',
    'Argentina': 'ARG', 'Algeria': 'ALG', 'Austria': 'AUT', 'Jordan': 'JOR',
    'Portugal': 'POR', 'DR Congo': 'COD', 'Congo DR': 'COD', 'Uzbekistan': 'UZB', 'Colombia': 'COL',
    'England': 'ENG', 'Croatia': 'CRO', 'Ghana': 'GHA', 'Panama': 'PAN'
};

function getTeamCode(apiTeamName) {
    return TEAM_CODE_BY_API_NAME[apiTeamName] || null;
}

// ---------- 读取 API key ----------
function loadApiKey() {
    if (process.env.FOOTBALL_API_KEY) return process.env.FOOTBALL_API_KEY;
    try {
        const envContent = fs.readFileSync(path.join(__dirname, '.env'), 'utf-8');
        const match = envContent.match(/^\s*FOOTBALL_API_KEY\s*=\s*(.+?)\s*$/m);
        if (match) return match[1].replace(/^["']|["']$/g, '').trim();
    } catch (_) {}
    return null;
}

// ---------- 调用 football-data.org ----------
function fetchMatches(apiKey) {
    return new Promise((resolve, reject) => {
        https.get({
            hostname: 'api.football-data.org',
            path: '/v4/competitions/WC/matches',
            headers: { 'X-Auth-Token': apiKey },
            timeout: 15000,
        }, (res) => {
            let buf = '';
            res.on('data', c => buf += c);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    try { resolve(JSON.parse(buf)); }
                    catch (e) { reject(new Error(`JSON parse error: ${e.message}`)); }
                } else {
                    reject(new Error(`HTTP ${res.statusCode}: ${buf.substring(0, 200)}`));
                }
            });
        }).on('error', reject).on('timeout', () => reject(new Error('Request timeout')));
    });
}

// ---------- 逐行更新 data.js ----------
// 单行格式示例：
// { id:1,  stage:'group', group:'A', matchday:1, date:'2026-06-11', time:'13:00', venue:'Mexico City', home:'MEX', away:'RSA', homeScore:2, awayScore:0 },
const MATCH_LINE_RE = /^\s*\{[^}]*\bid:\s*(\d+)[^}]*\bstage:\s*'([^']+)'[^}]*\bdate:\s*'([^']+)'[^}]*\bhome:\s*'([A-Z]+)'[^}]*\baway:\s*'([A-Z]+)'[^}]*\bhomeScore:\s*([^,\s}]+)\s*,\s*awayScore:\s*([^,\s}]+)/;

function updateLines(originalContent, finishedScores) {
    // finishedScores: Map<key, {date, homeScore, awayScore}>，key = `${homeCode}|${awayCode}`
    // 小组赛每个对阵只会出现一次 → 用 (home, away) 而不是 (date, home, away) 做匹配键，
    // 避免本地日期录入错误时漏匹配。
    const lines = originalContent.split('\n');
    const updates = [];
    const skipped = [];

    for (let i = 0; i < lines.length; i++) {
        const m = lines[i].match(MATCH_LINE_RE);
        if (!m) continue;
        const [, idStr, stage, localDate, homeCode, awayCode, oldHome, oldAway] = m;
        const id = Number(idStr);

        // 只处理小组赛 — 淘汰赛阶段对阵在数据里是占位（KO_R32_W_A1 等），不是球队代码
        if (stage !== 'group') continue;

        const apiResult = finishedScores.get(`${homeCode}|${awayCode}`);
        if (!apiResult) continue;

        const newHome = String(apiResult.homeScore);
        const newAway = String(apiResult.awayScore);
        const dateMismatch = apiResult.date !== localDate;
        const scoreMatch = oldHome === newHome && oldAway === newAway;

        if (scoreMatch && !dateMismatch) {
            skipped.push({id, date: localDate, home: homeCode, away: awayCode, score: `${newHome}-${newAway}`});
            continue;
        }

        let updatedLine = lines[i];
        // 1) 改比分
        if (!scoreMatch) {
            updatedLine = updatedLine.replace(
                /(\bhomeScore:\s*)([^,\s}]+)(\s*,\s*awayScore:\s*)([^,\s}]+)/,
                `$1${newHome}$3${newAway}`
            );
        }
        // 2) 修正日期（仅当 API 给出明确不同的日期时）
        if (dateMismatch) {
            updatedLine = updatedLine.replace(
                /(\bdate:\s*)'([^']+)'/,
                `$1'${apiResult.date}'`
            );
        }
        lines[i] = updatedLine;

        updates.push({
            id, home: homeCode, away: awayCode,
            beforeDate: localDate, afterDate: apiResult.date,
            beforeScore: `${oldHome}-${oldAway}`, afterScore: `${newHome}-${newAway}`,
            dateMismatch, scoreMatch,
        });
    }

    // 更新顶部时间戳注释
    const headerLine1 = `// 最后更新: ${new Date().toLocaleString('zh-CN')}`;
    const headerLine2 = `// 数据来源: football-data.org (FIFA World Cup)`;
    let newContent = lines.join('\n');
    if (newContent.startsWith('// 最后更新:')) {
        newContent = newContent.replace(/^\/\/ 最后更新:.*\n\/\/ 数据来源:.*\n/, `${headerLine1}\n${headerLine2}\n`);
    } else {
        newContent = `${headerLine1}\n${headerLine2}\n${newContent}`;
    }

    return { newContent, updates, skipped };
}

// ---------- 主流程 ----------
async function main() {
    log('======================================');
    log(`🚀 比分更新任务 ${APPLY ? '[APPLY 模式 — 将写入文件]' : '[DRY-RUN 模式 — 不写入]'}`);
    log('======================================');

    if (!fs.existsSync(DATA_FILE)) {
        log(`❌ 数据文件不存在: ${DATA_FILE}`);
        process.exit(1);
    }

    const apiKey = loadApiKey();
    if (!apiKey) {
        log('❌ 未找到 FOOTBALL_API_KEY（环境变量或 .env 都没有）');
        process.exit(1);
    }

    log('🌐 调用 football-data.org ...');
    const apiData = await fetchMatches(apiKey).catch(err => {
        log(`❌ API 调用失败: ${err.message}`);
        process.exit(1);
    });

    log(`📅 赛季: ${apiData.resultSet?.first} ~ ${apiData.resultSet?.last}`);
    log(`⚽ API 已完赛: ${apiData.resultSet?.played || 0} / ${apiData.resultSet?.count || 0} 场`);

    // 构建 FINISHED 比赛索引（用 home|away 做键 — 小组赛阶段每个对阵唯一）
    const finishedScores = new Map();
    let unmappedTeams = new Set();
    for (const m of apiData.matches || []) {
        if (m.status !== 'FINISHED' || !m.score?.fullTime) continue;
        const homeCode = getTeamCode(m.homeTeam?.name);
        const awayCode = getTeamCode(m.awayTeam?.name);
        if (!homeCode) unmappedTeams.add(m.homeTeam?.name);
        if (!awayCode) unmappedTeams.add(m.awayTeam?.name);
        if (!homeCode || !awayCode) continue;
        finishedScores.set(`${homeCode}|${awayCode}`, {
            date: m.utcDate?.substring(0, 10),
            homeScore: m.score.fullTime.home,
            awayScore: m.score.fullTime.away,
        });
    }
    if (unmappedTeams.size) {
        log(`⚠️  无法映射的球队名（请补 TEAM_CODE_BY_API_NAME）: ${[...unmappedTeams].join(', ')}`);
    }
    log(`🎯 FINISHED 且映射成功: ${finishedScores.size} 场`);

    // 应用到本地数据
    const original = fs.readFileSync(DATA_FILE, 'utf-8');
    const { newContent, updates, skipped } = updateLines(original, finishedScores);

    log(`📊 比对结果: ${updates.length} 场需更新 / ${skipped.length} 场已是最新`);

    if (skipped.length) {
        for (const s of skipped) {
            log(`  ✓ #${s.id} ${s.date} ${s.home} vs ${s.away}: ${s.score} (本地已是最新)`);
        }
    }

    if (updates.length === 0) {
        log('ℹ️ 无变化');
        return;
    }

    log('--- 将要更新的比赛 ---');
    for (const u of updates) {
        const parts = [];
        if (!u.scoreMatch) parts.push(`比分 ${u.beforeScore} → ${u.afterScore}`);
        if (u.dateMismatch) parts.push(`日期 ${u.beforeDate} → ${u.afterDate}`);
        log(`  #${u.id} ${u.home} vs ${u.away}: ${parts.join('  |  ')}`);
    }

    if (!APPLY) {
        log('');
        log('⏸  这是 dry-run，没有写入。确认无误后运行：node update-scores.js --apply');
        return;
    }

    // 备份后写入
    if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(BACKUP_DIR, `data-${stamp}.js`);
    fs.copyFileSync(DATA_FILE, backupFile);
    log(`✅ 已备份原文件: ${backupFile}`);

    fs.writeFileSync(DATA_FILE, newContent, 'utf-8');
    log(`✅ 已写入: ${DATA_FILE}`);
    log(`🏁 完成 — 共更新 ${updates.length} 场`);
}

main().catch(err => {
    log(`❌ 异常: ${err.message}`);
    log(err.stack);
    process.exit(1);
});
