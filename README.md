# ⚽ 2026 世界杯比分预测

2026 FIFA 世界杯(美加墨)比分预测 Web 应用,结合 **AI 预测** 和 **用户竞猜** 两种方式。

## 功能

| Tab | 说明 |
|-----|------|
| 📋 赛程 | 查看全部 104 场比赛,支持按阶段/小组/状态过滤 |
| 🔮 预测 | 填写你的比分预测,AI 自动给出参考 |
| 📊 排行榜 | 查看你的得分、准确率、每场预测记录 |
| 📈 分析 | AI 预测 vs 实际结果对比图表 |

## 使用方式

直接用浏览器打开 `index.html` 即可,无需服务器、无需安装。

```bash
# macOS
open index.html

# 或者直接双击 index.html 文件
```

## 得分规则

| 预测结果 | 得分 |
|---------|------|
| 猜对比分 | 5 分 🎯 |
| 猜对胜负(含平局) | 3 分 ✅ |
| 猜错 | 0 分 ❌ |

## AI 预测算法

基于以下因素的泊松分布模型:

- **FIFA 排名** — 排名差距决定强弱对比
- **进攻/防守强度** — 根据排名换算为攻防评分
- **主场优势** — 东道主加成(中立场赛事有小幅加成)
- **泊松采样** — 用泊松分布模拟真实比分分布

## 项目结构

```
世界杯/
├── index.html              # 主页面
├── css/
│   └── style.css           # 样式(深色足球主题)
├── js/
│   ├── data.js             # 48 队 + 104 场赛程数据 (会被 update-scores.js 自动更新)
│   ├── teamProfiles.js     # 球队档案: 阵容·战术·伤员
│   ├── h2h.js              # 历史交锋数据库
│   ├── venues.js           # 球场环境数据 (海拔/气候/草皮)
│   ├── predictor.js        # AI 多因素预测引擎 (9维度加权)
│   ├── user.js             # 用户竞猜 (localStorage)
│   ├── utils.js            # 工具函数
│   └── app.js              # 主逻辑
├── update-scores.js        # 比分自动同步脚本(从 football-data.org)
├── .env                    # API key 配置(不要提交到 git)
├── backups/                # data.js 历次备份
├── archive/                # 早期调试/原型 HTML(可忽略)
├── API-配置指南.md
├── README-自动更新.md
└── README.md
```

## 数据更新

**已自动化**。每天 12:00 由 macOS launchd 触发 [update-scores.js](update-scores.js),从 [football-data.org](https://www.football-data.org/) 抓取最新比分写入 [js/data.js](js/data.js)。

- 配置 API key:见 [API-配置指南.md](API-配置指南.md)
- 配置/调整定时任务:见 [README-自动更新.md](README-自动更新.md)
- 手动同步一次:`node update-scores.js --apply`

> 淘汰赛阶段的对阵队伍(如 `KO_R32_W_A1`)目前仍需在小组赛全部踢完后**手动**根据出线情况填入具体队伍代码,自动脚本暂不处理这部分。

## 技术栈

- 纯 HTML + CSS + JavaScript(零依赖)
- localStorage 本地存储
- 响应式设计,支持手机浏览
- Node.js (仅 update-scores.js 用,浏览器端不需要)
