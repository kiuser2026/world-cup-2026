# Football-Data.org API 配置指南

> 本项目通过 [football-data.org](https://www.football-data.org/) 自动同步世界杯比分。
> API key 已在 [.env](.env) 中配好,如果你拿到的项目 .env 是空的 / 失效了,按本文重配。

## 第一步:注册账号并拿到 API Key

1. 打开 https://www.football-data.org/
2. 点 **"Sign Up"** 或 **"Get API Key"**,填邮箱和密码
3. 邮箱收到验证邮件后激活账号
4. 登录后到 **My Account**(或 **Dashboard**),复制 **API Token**(32 位 hex 字符串)

### 免费版够用吗?

够。免费额度是 10 次请求/分钟,本项目每天定时跑 1 次(也可手动多跑几次),完全在限额内。

| 套餐 | 限额 | 价格 |
|------|------|------|
| Free Tier | 10 req/min | $0 |
| Tier One | 30 req/min | $19/月 |
| Tier Two | 60 req/min | $59/月 |

## 第二步:写入 `.env` 文件(推荐方式)

本项目优先从项目根目录的 `.env` 文件读取 key,这是最简单也最不会泄漏的方式。

```bash
cd ~/Desktop/世界杯

# 把 YOUR_API_KEY 替换成你刚复制的那串字符
echo 'FOOTBALL_API_KEY=YOUR_API_KEY' > .env
```

`.env` 已加进 [.gitignore](.gitignore),不会被 git 误传。

### (可选)环境变量方式

如果你希望多个项目共用同一个 key,可以放进 shell 配置:

```bash
echo 'export FOOTBALL_API_KEY="YOUR_API_KEY"' >> ~/.zshrc
source ~/.zshrc
```

[update-scores.js](update-scores.js) 优先读环境变量,找不到再读 `.env`。

## 第三步:验证

```bash
cd ~/Desktop/世界杯
node update-scores.js          # dry-run,只看会更新什么,不写文件
```

期望看到:

```
🌐 调用 football-data.org ...
📅 赛季: 2026-06-11 ~ 2026-07-19
⚽ API 已完赛: N / 104 场
🎯 FINISHED 且映射成功: N 场
📊 比对结果: ... 场需更新 / ... 场已是最新
```

如果想真的写入数据文件,加 `--apply`:

```bash
node update-scores.js --apply
```

> 自动定时任务跑的就是 `--apply` 模式,详见 [README-自动更新.md](README-自动更新.md)。

### 用 curl 单独测 key

```bash
curl -H "X-Auth-Token: $(grep FOOTBALL_API_KEY .env | cut -d= -f2)" \
     "https://api.football-data.org/v4/competitions/WC/matches?limit=1"
```

返回 HTTP 200 + JSON 数据即正常。

## 常见问题

**Q: 报 HTTP 403**
A: API Key 错了或失效。回 football-data.org 的 Dashboard 重新复制,或重发激活邮件。

**Q: 报 HTTP 429**
A: 请求超频(>10 次/分钟)。等 1 分钟。

**Q: 数据有延迟吗?**
A: 通常比赛结束后 5–10 分钟内 API 会标记为 FINISHED。本项目每天 12:00 跑一次,正好覆盖前一天和当天上午的所有已结束比赛。

**Q: API 返回的球队名我项目里没有?**
A: [update-scores.js](update-scores.js) 的 `TEAM_CODE_BY_API_NAME` 是手工映射表。如果 API 用了新的拼写(例如 `Türkiye` vs `Turkey`),日志里会出现 `⚠️ 无法映射的球队名`,把那个名字加进映射表即可。

## 备选 API(目前不需要)

如果哪天 football-data.org 出问题,这些是可选的替代:

- [API-Football](https://www.api-football.com/) — 100 次/天免费
- [Sportmonks](https://www.sportmonks.com/) — 180 次/小时免费
- [OpenLigaDB](https://www.openligadb.de/) — 完全免费,但延迟较大

切换的话需要改 [update-scores.js](update-scores.js) 里的 `fetchMatches()` 函数(URL、鉴权头、JSON 字段名都不一样)。
