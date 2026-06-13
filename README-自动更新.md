# 自动更新系统

每天中午 12:00 由 macOS launchd 触发 [update-scores.js](update-scores.js),从 [football-data.org](https://www.football-data.org/) 同步比分到 [js/data.js](js/data.js)。

## 当前状态

| 项目 | 值 |
|---|---|
| 任务名 | `com.worldcup.scores-update` |
| plist 位置 | `~/Library/LaunchAgents/com.worldcup.scores-update.plist` |
| 触发时间 | 每天 **12:00**(本地时间) |
| 执行命令 | `/opt/homebrew/bin/node update-scores.js --apply` |
| 工作目录 | `~/Desktop/世界杯` |
| 标准输出/错误 | `cron.log` |

> 如果电脑当时在睡眠/关机,launchd 在下次唤醒后会**自动补跑一次**。

## 文件结构

```
世界杯/
├── update-scores.js    # 核心更新脚本(支持 dry-run / --apply 两种模式)
├── .env                # 存放 API key(见 API-配置指南.md)
├── backups/            # 每次 --apply 写入前的 data.js 备份
├── update.log          # update-scores.js 的运行日志(含手动+自动)
├── cron.log            # launchd 捕获的 stdout/stderr
└── js/data.js          # 被更新的目标数据文件
```

## 常用命令

```bash
# 手动预览本次会改什么(不写文件)
node update-scores.js

# 手动同步一次(写入)
node update-scores.js --apply

# 立刻触发一次定时任务(等同于 launchd 12:00 那次)
launchctl kickstart gui/$(id -u)/com.worldcup.scores-update

# 查看最近一次自动跑的输出
tail -50 cron.log

# 查看完整历史日志
tail -200 update.log
```

## 改运行时间

当前是 12:00,要改成别的时间:

```bash
# 1. 编辑 plist
nano ~/Library/LaunchAgents/com.worldcup.scores-update.plist
```

找到 `StartCalendarInterval` 段,修改 `Hour` / `Minute`。要每天跑两次(比如 12:00 和 22:00),把单个 `<dict>` 替换成 `<array>`:

```xml
<key>StartCalendarInterval</key>
<array>
    <dict>
        <key>Hour</key><integer>12</integer>
        <key>Minute</key><integer>0</integer>
    </dict>
    <dict>
        <key>Hour</key><integer>22</integer>
        <key>Minute</key><integer>0</integer>
    </dict>
</array>
```

```bash
# 2. 重新加载
launchctl bootout gui/$(id -u) ~/Library/LaunchAgents/com.worldcup.scores-update.plist
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.worldcup.scores-update.plist
```

## 数据备份与恢复

每次 `--apply` 写入 [js/data.js](js/data.js) 之前都会先把原文件备份到 [backups/](backups/),文件名带 ISO 时间戳。

```bash
# 看备份列表
ls -lt backups/

# 恢复某次备份
cp backups/data-2026-06-13T09-02-41-058Z.js js/data.js
```

## 暂停/恢复/卸载

```bash
# 暂停(保留 plist 文件)
launchctl bootout gui/$(id -u) ~/Library/LaunchAgents/com.worldcup.scores-update.plist

# 恢复
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.worldcup.scores-update.plist

# 完全卸载
launchctl bootout gui/$(id -u) ~/Library/LaunchAgents/com.worldcup.scores-update.plist
rm ~/Library/LaunchAgents/com.worldcup.scores-update.plist
```

## 脚本行为(简版)

[update-scores.js](update-scores.js) 的安全机制:

1. **只处理小组赛** —— `stage === 'group'` 的行才会被改,淘汰赛阶段(目前数据里是 `KO_R32_W_A1` 这种占位符)完全不动
2. **只处理 FINISHED 比赛** —— API 返回 SCHEDULED / TIMED / IN_PLAY 的比赛会被忽略
3. **按 (home, away) 匹配** —— 不依赖日期,所以即使本地数据日期录错也能正确对齐
4. **逐行精确替换** —— 用 `\bhomeScore:\s*[^,\s}]+` 这类锚定的正则,不会跨比赛误匹配
5. **dry-run 是默认行为** —— 不带 `--apply` 只打印预期改动,不写文件
6. **写入前自动备份**

## 常见问题

**Q: 没有 API key 能跑吗?**
A: 不能。脚本会立即报错退出。先按 [API-配置指南.md](API-配置指南.md) 配 `.env`。

**Q: 自动任务是否在跑?**
A: `launchctl print gui/$(id -u)/com.worldcup.scores-update | head -20`,看 `state` 和 `last exit code`。`exit code = 0` 即上次成功。

**Q: 淘汰赛会被自动填吗?**
A: 不会。淘汰赛对阵是 `KO_R32_W_A1` 这种占位,需要在小组赛全部踢完后,根据出线情况手动改成具体球队代码。这部分是数据建模问题,不是脚本能自动处理的。

**Q: 怎么换成别的 API?**
A: 编辑 [update-scores.js](update-scores.js) 的 `fetchMatches()` 函数(URL、鉴权头、JSON 字段映射都要改)。
