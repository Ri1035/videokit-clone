# 部署记录

记录每次生产环境部署的版本、时间和变更。

## 部署信息

| 项目 | 值 |
|---|---|
| 平台 | Cloudflare Pages |
| 项目名 | videokit |
| 生产地址 | https://videokit-9kp.pages.dev |
| GitHub | https://github.com/Ri1035/videokit-clone |
| 部署方式 | Wrangler CLI 直接上传 |
| 构建命令 | `npm run build` |
| 输出目录 | `dist` |

## 部署历史

### 2026-09-23 v0.3.5 — 修复视频调速音画不同步等 4 项问题

- **版本**: v0.3.5
- **部署时间**: 2026-09-23
- **部署人**: VideoKit Dev
- **Commit**: fb79d6e
- **部署地址**: https://142f35a5.videokit-9kp.pages.dev （生产别名 https://videokit-9kp.pages.dev）
- **变更**:
  - 修复「视频调速」慢放档位音画不同步（0.25x/0.5x 音频被反向加速）
  - 修复「视频调速」对无音轨视频直接失败
  - 修复本地开发环境 ffmpeg-core.js 加载失败（Vite dev 的 `?import` 问题）
  - 修复 FFmpeg 单例监听器泄漏
  - 移除未使用的 mediabunny 依赖；vite preview 补齐 COOP/COEP
- **验证**:
  - ✅ HTTP 200，COOP/COEP headers 生效
  - ✅ 部署包 hash `index-D6_6P_1F.js` 与本地 `npm run build` 产物一致
  - ✅ 线上真实转码：合成 WAV(31.29 KB) → MP3(18.33 KB)，处理成功并可下载
  - ✅ 线上引擎在第 1 次加载策略即成功（本地 core + CDN wasm）
  - ✅ 首页 52 个工具正常渲染（格式转换 13 / 视频工具 20 / 音频工具 19）

### 2026-09-23 v0.1.0 — 首次部署

- **版本**: v0.1.0
- **部署时间**: 2026-09-23
- **部署人**: VideoKit Dev
- **Commit**: 10da4d3
- **变更**:
  - 项目初始化，53个视频/音频处理工具
  - 基于 ffmpeg.wasm，纯前端本地处理
  - 中英双语 + 深色模式 + 收藏功能
  - Cloudflare Pages 首次上线
- **验证**:
  - ✅ HTTP 200
  - ✅ COOP/COEP headers 生效
  - ✅ 首页53个工具正常渲染
  - ✅ 工具页面路由正常

### 2026-09-23 v0.2.0 — 版本管理与日志系统

- **版本**: v0.2.0
- **部署时间**: 2026-09-23
- **变更**:
  - 新增版本管理体系（semver、版本脚本、Git Tag）
  - 新增用户操作历史记录
  - 新增错误日志系统（全局捕获+本地存储+导出）
  - 页脚显示版本号、历史记录、错误日志入口
  - 新增部署记录文档和自动化部署脚本
- **验证**:
  - ✅ HTTP 200
  - ✅ 页脚显示 v0.2.0 版本号
  - ✅ 历史记录面板正常
  - ✅ 错误日志面板正常
  - ✅ COOP/COEP headers 生效

## 部署流程

### 手动部署

```bash
# 1. 构建
npm run build

# 2. 部署
wrangler pages deploy dist --project-name=videokit --branch=main
```

### 一键部署

```bash
npm run deploy
```

### 版本发布流程

```bash
# 1. 升级版本号（自动更新 package.json 和 src/version/version.ts）
npm run version:patch   # 或 version:minor / version:major

# 2. 更新 CHANGELOG.md（手动）

# 3. 提交并打 tag
git add -A
git commit -m "release: v0.x.x"
git tag v0.x.x

# 4. 推送
git push origin main --tags

# 5. 部署
npm run deploy

# 6. 在 GitHub 创建 Release
```

## 回滚方案

Cloudflare Pages 保留每次部署的历史版本，可在 Dashboard 中一键回滚到任意历史部署。

部署预览地址格式：`https://<deployment-hash>.videokit-9kp.pages.dev`
