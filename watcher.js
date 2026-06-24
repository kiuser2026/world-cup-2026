#!/usr/bin/env node
/**
 * 世界杯比分常驻监听器
 *
 * 每 60 秒执行一次 update-scores.js --apply --push --quiet
 * 实现接近实时的比分同步。
 *
 * 启动方式：
 *   node watcher.js                 # 前台运行
 *   nohup node watcher.js &         # 后台运行（退出终端也保持）
 *   pm2 start watcher.js --name wc-updater   # 使用 pm2 管理
 *
 * 停止方式：
 *   pkill -f watcher.js
 *   或 pm2 stop wc-updater
 */

const { spawn } = require('child_process');
const path = require('path');

const UPDATE_INTERVAL_MS = 60 * 1000; // 1 分钟
const SCRIPT = path.join(__dirname, 'update-scores.js');

let isRunning = false;

function timestamp() {
  return new Date().toLocaleString('zh-CN');
}

function runUpdate() {
  if (isRunning) {
    console.log(`[${timestamp()}] ⏭ 上次同步仍在运行，本次跳过`);
    return;
  }
  isRunning = true;

  const startedAt = Date.now();
  console.log(`[${timestamp()}] ⏳ 开始同步比分...`);

  const child = spawn('node', [SCRIPT, '--apply', '--push', '--quiet'], {
    cwd: __dirname,
    stdio: 'inherit',
  });

  child.on('error', (err) => {
    console.error(`[${timestamp()}] ❌ 更新任务启动失败: ${err.message}`);
    isRunning = false;
  });

  child.on('close', (code) => {
    isRunning = false;
    const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
    if (code === 0) {
      console.log(`[${timestamp()}] ✅ 同步完成，耗时 ${elapsed}s`);
    } else {
      console.error(`[${timestamp()}] ⚠️ 同步退出码 ${code}，耗时 ${elapsed}s`);
    }
  });
}

console.log(`[${timestamp()}] 🚀 世界杯比分监听器已启动`);
console.log(`[${timestamp()}] ⏱  每 ${UPDATE_INTERVAL_MS / 1000} 秒同步一次比分`);

runUpdate();
setInterval(runUpdate, UPDATE_INTERVAL_MS);
