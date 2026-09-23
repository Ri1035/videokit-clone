# VideoKit 项目转手文档

> 本文档供后续开发者/Agent 快速上手项目、修复 bug、继续开发。
> 最后更新：v0.3.5 / 2026-09-23

---

## 一、项目概述

**VideoKit** 是一个纯前端在线视频工具箱，复刻自 videokit.cc。所有处理在浏览器本地完成，无需后端服务器。

- **在线地址**：https://videokit-9kp.pages.dev
- **GitHub 仓库**：https://github.com/Ri1035/videokit-clone
- **当前版本**：v0.3.5
- **工具数量**：52 个（格式转换 13 / 视频工具 20 / 音频工具 19）
- **部署平台**：Cloudflare Pages
- **分支**：main

---

## 二、技术栈

| 类别 | 技术 | 版本 |
|---|---|---|
| 框架 | React + TypeScript | React 18 |
| 构建 | Vite | 5.x |
| 样式 | Tailwind CSS | 3.x |
| 路由 | react-router-dom（HashRouter） | 6.x |
| 视频处理 | @ffmpeg/ffmpeg + @ffmpeg/core | 0.12.x |
| 状态管理 | React Hooks（useState/useContext） | - |
| 国际化 | 自定义 i18n（zh/en） | - |

**关键依赖**（以 package.json 实际为准）：
```json
"@ffmpeg/ffmpeg": "^0.12.15",
"@ffmpeg/util": "^0.12.2",
"@ffmpeg/core": "^0.12.10"   // 已安装，core.js 自托管到 public/ffmpeg-core/
"react": "^18.3.1",
"react-dom": "^18.3.1",
"react-router-dom": "^6.26.0"
```
> v0.3.5 已移除未使用的 `mediabunny` 依赖（此前它只出现在 vite 的 manualChunks 里，构建产物是一个 0 字节空 chunk）。

---

## 三、项目结构

```
videokit-clone/
├── public/
│   ├── favicon.svg              # 网站图标（用户提供的彩色SVG）
│   ├── ffmpeg-core/
│   │   └── ffmpeg-core.js       # ⚠️ 必须是esm版本！从node_modules/@ffmpeg/core/dist/esm/复制
│   └── _headers                 # Cloudflare Pages COOP/COEP配置
├── src/
│   ├── data/
│   │   └── tools.ts             # ⭐ 工具注册表（52个工具的元数据，配置驱动）
│   ├── lib/
│   │   ├── ffmpegEngine.ts      # ⭐⭐ FFmpeg引擎封装（最容易出bug的文件）
│   │   ├── ffmpegCommands.ts    # ⭐ ffmpeg 参数生成器（generateFFmpegArgs，按 command 分发）
│   │   ├── history.ts           # 用户操作历史（localStorage）
│   │   ├── errorLog.ts          # 全局错误日志
│   │   └── utils.ts             # 工具函数（下载、文件大小等）
│   ├── components/
│   │   ├── Layout.tsx           # 全局布局（Header/Footer/个人主页浮动框）
│   │   ├── ToolCard.tsx         # 工具卡片
│   │   ├── ToolShell.tsx        # 工具页面外壳
│   │   ├── FileUpload.tsx       # 文件上传组件
│   │   ├── ProgressBar.tsx      # 进度条（支持indeterminate模式）
│   │   ├── useToolProcessor.tsx # ⭐ 通用处理逻辑hook
│   │   ├── VersionBadge.tsx     # 版本号徽章 + 历史记录/错误日志入口（在右上角 👤 浮层内，不在页脚）
│   │   ├── HistoryPanel.tsx     # 历史记录面板
│   │   └── ErrorLogPanel.tsx    # 错误日志面板
│   ├── tools/
│   │   ├── SpecialToolPage.tsx  # ⭐ 特殊工具页面分发器
│   │   ├── GenericToolPage.tsx  # 通用工具页面（约26个简单工具通过配置生成）
│   │   ├── simple-special.tsx   # 简单特殊工具（视频转换、压缩等7个）
│   │   ├── multi-file.tsx       # 多文件工具（批量转码、合并等6个）
│   │   ├── timeline.tsx         # 时间轴工具（裁剪、分割等3个）
│   │   ├── visual-edit.tsx      # 可视化编辑工具（裁剪、水印、调色等6个）
│   │   ├── gif-tools.tsx        # GIF工具（2个）
│   │   └── misc.tsx             # 杂项工具（缩略图、BGM等）
│   ├── hooks/
│   │   ├── useFavorites.ts      # 收藏功能
│   │   └── useTheme.ts          # 主题切换
│   ├── i18n/
│   │   └── index.tsx            # 国际化（中/英）
│   ├── version/
│   │   └── version.ts           # 自动生成的版本信息
│   ├── HomePage.tsx             # 首页（工具列表+搜索+分类筛选）
│   ├── App.tsx                  # 路由配置
│   ├── main.tsx                 # 入口
│   └── index.css                # 全局样式+动画
├── scripts/
│   ├── update-version.js        # 版本号同步脚本
│   └── release.js               # 发布脚本
├── docs/
│   └── DEPLOY.md                # 部署记录
├── CHANGELOG.md                 # 变更日志
├── HANDOFF.md                   # 本文档
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── wrangler.toml                # Cloudflare配置（如有）
```

---

## 四、核心架构说明

### 4.1 配置驱动的工具注册

所有工具在 `src/data/tools.ts` 中注册，每个工具有：
- `pageType: 'generic' | 'special'`
  - `generic`：通用工具，通过 `GenericToolPage` + `genericConfig` 自动生成页面（约26个）
  - `special`：特殊工具，在 `SpecialToolPage.tsx` 中分发到具体组件（约26个）
- `category: 'convert' | 'video' | 'audio'`（3个分类）

**新增工具步骤**：
1. 在 `tools.ts` 添加元数据
2. 如果是 generic 工具，配置 `genericConfig` 即可
3. 如果是 special 工具，在对应文件中实现组件，并在 `SpecialToolPage.tsx` 的 `SPECIAL_COMPONENTS` 中注册

### 4.2 FFmpeg 引擎（最关键，最容易出bug）

文件：`src/lib/ffmpegEngine.ts`

**加载机制（v0.3.5 修复后）**：
1. `core.js` 本地自托管（`new URL('/ffmpeg-core/ffmpeg-core.js', location.origin).href`），**必须是 esm 版本**
2. `wasm` 从 CDN 直接加载（unpkg → jsdelivr → fastly.jsdelivr）
3. 三级 fallback：本地core+CDN wasm → 本地core+toBlobURL wasm → 全CDN toBlobURL
4. 正常情况应在**第 1 次尝试**就成功。若日志里看到「尝试 6: 全CDN」才成功，说明本地 core.js 这一级挂了。

**⚠️ 历史踩坑记录**：
- ❌ umd 版本的 core.js 不能用！ffmpeg.wasm 的 Worker 是 `type:"module"`，需要 esm 版本的 default export
- ❌ wasm 文件 31MB，超过 Cloudflare Pages 单文件 25MB 限制，不能自托管
- ❌ `toBlobURL` 在 COEP 环境下跨域 fetch 可能失败
- ❌ 单例模式加载失败后不重置，会导致后续永久失败
- ❌ **`LOCAL_CORE_URL` 不能写成 `'/ffmpeg-core/ffmpeg-core.js'`（v0.3.5 修复）**：
  Vite dev 会把 worker 内的 `import(url)` 改写成 `import(__vite__injectQuery(url, 'import'))`，
  请求变成 `/ffmpeg-core/ffmpeg-core.js?import`；而 Vite 的 `servePublicMiddleware` 遇到
  `isImportRequest`（`?import`）会直接 `next()`，public 目录文件不再命中，
  最终落到 SPA fallback 返回 `index.html`（`Content-Type: text/html`），动态 import 报
  `TypeError: Failed to fetch dynamically imported module: .../ffmpeg-core.js?import=`。
  `injectQuery` 对不以 `./` 或 `/` 开头的绝对 URL 会原样返回，所以必须拼上 origin。
  症状：**dev 下必然失败并回退到全 CDN，生产构建却正常**——很容易被误判为「线上问题」。
- ✅ COOP/COEP headers 必须设置（`public/_headers`），`vite preview` 也已在 `vite.config.ts` 里补齐

**COOP/COEP 配置（public/_headers）**：
```
/*
  Cross-Origin-Embedder-Policy: require-corp
  Cross-Origin-Opener-Policy: same-origin
```

### 4.3 通用处理流程

`useToolProcessor.tsx` 封装了通用处理逻辑：
1. 显示"加载处理引擎"进度条（indeterminate）
2. 调用 `runFFmpegTask` 执行 ffmpeg 命令
3. 显示处理进度（0-100%）
4. 成功后显示下载按钮
5. 失败后显示错误信息
6. 自动记录操作历史和错误日志

---

## 五、版本管理流程

### 5.1 版本号规范
遵循 Semantic Versioning：`MAJOR.MINOR.PATCH`
- PATCH：bug修复、小改进（0.3.1 → 0.3.2）
- MINOR：新功能、UI重构（0.2.0 → 0.3.0）
- MAJOR：不兼容的大改动

### 5.2 发版步骤
```bash
# 1. 修改代码
# 2. 更新版本号（手动或脚本）
node scripts/update-version.js 0.3.4

# 3. 更新 CHANGELOG.md
# 4. 构建验证
npm run build

# 5. 提交
git add -A
git commit -m "v0.3.4: 描述"

# 6. 打tag并推送
git tag v0.3.4
git push origin main
git push origin v0.3.4

# 7. 部署
CLOUDFLARE_API_TOKEN=<token> npx wrangler pages deploy dist --project-name=videokit --branch=main
```

### 5.3 版本相关文件
- `package.json` - 版本号
- `src/version/version.ts` - 自动生成，在右上角 👤 浮层内显示
- `CHANGELOG.md` - 变更日志（每个版本必须记录）
- `docs/DEPLOY.md` - 部署记录
- Git tags - v0.1.0 ~ v0.3.3

---

## 六、部署流程

### 6.1 Cloudflare Pages
- 项目名：`videokit`
- 账号ID：`f1b789793774805c136bd7dfc86febd4`
- 部署命令：
```bash
CLOUDFLARE_API_TOKEN=<token> npx wrangler pages deploy dist --project-name=videokit --branch=main
```
- 构建命令：`npm run build`（tsc -b && vite build）
- 输出目录：`dist`

### 6.2 GitHub
- 仓库：https://github.com/Ri1035/videokit-clone
- 分支：main
- Token：用户提供（需自行保管）

### 6.3 本地开发
```bash
npm install
npm run dev    # 开发服务器，已配置COOP/COEP headers
npm run build  # 生产构建
```

---

## 七、已知问题与 Bug 排查指南

### 7.1 FFmpeg 引擎加载失败

**症状**：点击处理后一直显示"加载处理引擎"，最终报错。

**排查步骤**：
1. 按 F12 打开控制台，搜索 `[ffmpeg]` 日志
2. 检查 Network 标签，看 `ffmpeg-core.js` 和 `ffmpeg-core.wasm` 是否加载成功
3. 确认 `public/ffmpeg-core/ffmpeg-core.js` 是 **esm 版本**（开头是 `var createFFmpegCore = (() => { var _scriptDir = import.meta.url;`）
4. 确认 `public/_headers` 存在且 COOP/COEP 配置正确
5. 测试 CDN 可访问性：`curl -I https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm/ffmpeg-core.wasm`

**常见原因**：
- core.js 是 umd 版本 → 换成 esm 版本
- wasm CDN 被墙 → 增加更多 CDN fallback
- COOP/COEP 未生效 → 检查 `_headers` 文件和 CF 配置
- 浏览器不支持 WebAssembly → 提示用户换浏览器

### 7.2 memory access out of bounds（内存访问越界）

**症状**：处理过程中报错 `RuntimeError: memory access out of bounds`

**原因**：这是 ffmpeg.wasm 的已知限制，通常由以下原因触发：
- 视频编码不被 wasm 版本支持（如某些 HEVC、AV1、ProRes）
- 视频分辨率过高（4K以上）
- 某些滤镜组合触发 wasm bug
- 文件损坏或非标准编码

**当前处理**：`ffmpegEngine.ts` 中已分类识别此错误，给出针对性建议。

**可能的修复方向**：
1. 在执行前先用 ffprobe 检测视频编码，不支持的编码提前提示
2. 对高分辨率视频自动降采样后再处理
3. 尝试添加 `-threads 1` 参数（单线程更稳定）
4. 先转封装为 MP4（`-c copy`）再处理
5. 升级 ffmpeg.wasm 版本（如果有新版）

### 7.3 处理失败但错误信息不明确

**排查**：
1. 查看控制台 `[ffmpeg] 执行命令:` 日志，确认 ffmpeg 参数
2. 查看 `[ffmpeg]` log 回调输出的 ffmpeg 原生日志
3. 错误日志面板（页脚版本号 → 错误日志）中有记录
4. 尝试在本地用命令行 ffmpeg 执行相同命令，看是否报错

### 7.4 页面白屏/路由不工作

**原因**：使用 HashRouter，URL 格式为 `/#/tool/xxx`。如果部署后直接访问子路径可能404，但HashRouter不依赖服务器路由配置，应该正常。

**排查**：确认 `App.tsx` 中使用的是 `HashRouter` 而不是 `BrowserRouter`。

### 7.5 样式问题（圆角/主题）
- 全局圆角风格：`.card` 类用 `rounded-2xl`，按钮用 `rounded-xl`
- 主题切换：`useTheme` hook，dark 类在根元素
- 不要用尖锐方框，保持轻简风

### 7.6 连续处理多个文件后进度异常 / 内存持续增长
**症状**：同一页面连续处理多次后，进度条跳动异常，或页面内存只增不减。
**原因**（v0.3.5 已修复）：`FFmpeg` 是全局单例，`runFFmpegTask` 每次调用都
`ffmpeg.on('progress'|'log', ...)` 却从不 `off`，监听器随调用次数线性累积。
**约定**：今后在 `runFFmpegTask` 里新增任何 `ffmpeg.on()` 都必须配对 `ffmpeg.off()`，
放在 `finally` 里以保证异常路径也能清理。

### 7.7 滤镜类工具的两条硬约束（写新工具时务必遵守）
1. **atempo 单次只接受 0.5~100**。需要更极端的倍速时必须串联，例如 0.25x → `atempo=0.5,atempo=0.5`。
   参考 `ffmpegCommands.ts` 中的 `buildAtempoFilter()`。
2. **不要轻易用 `[0:a]` 做 filter_complex 输入**。视频没有音轨时 ffmpeg 会直接失败：
   `Stream specifier ':a' in filtergraph description ... matches no streams`。
   优先用 `-vf` / `-af`（无对应流时会被忽略），或先用 `ffprobe` 判断音轨是否存在。
   > 已知遗留：`src/tools/misc.tsx` 的「添加背景音乐 - 混合原声」模式仍使用 `[0:a]`，
   > 对无音轨视频会失败，属于待修复项。
3. **音画同步**：改变视频时长（setpts / reverse / 变速）时必须同步处理音频，且方向一致。
   v0.3.5 修复的 `speed` 就是踩了「慢放时音频取倒数」的坑。

---

## 八、错误日志系统

### 8.1 用户操作历史
- 存储：localStorage（key: `videokit_history`）
- 记录：工具ID、工具名、输入文件名、输入大小、输出文件名、输出大小、状态、耗时
- 入口：右上角 👤 浮层 → 版本号旁的「历史记录」（**注意：不在页脚**，v0.3.1 起已移入 👤 浮层）
- 上限：最近50条

### 8.2 全局错误日志
- 存储：localStorage（key: `videokit_error_logs`）
- 捕获：JS错误、Promise拒绝、ffmpeg错误
- 入口：右上角 👤 浮层 → 版本号旁的「错误日志」（**注意：不在页脚**）
- 支持导出JSON

### 8.3 控制台日志
所有 ffmpeg 相关操作都有 `[ffmpeg]` 前缀的控制台日志，便于调试。

---

## 九、后续开发建议
### 高优先级
1. **修复 memory access out of bounds**：添加 ffprobe 预检测，对不支持的编码提前提示
2. **修复「添加背景音乐 - 混合原声」对无音轨视频失败**：`src/tools/misc.tsx` 仍用 `[0:a]`（见 7.7）
3. **添加处理超时**：长时间处理自动取消，避免页面卡死
4. **大文件分片处理**：对大文件先降采样再处理

### 中优先级
4. **更多工具**：视频拼接转场、音频降噪、字幕烧录样式自定义
5. **处理队列**：批量处理时显示队列进度
6. **快捷键**：常用操作快捷键支持

### 低优先级
7. **PWA支持**：离线使用
8. **主题色自定义**：用户选择主题色
9. **多语言**：更多语言支持

---

## 十、关键联系人/资源

- **ffmpeg.wasm 官方文档**：https://ffmpegwasm.netlify.app/
- **ffmpeg.wasm GitHub**：https://github.com/ffmpegwasm/ffmpeg.wasm
- **Cloudflare Pages 文档**：https://developers.cloudflare.com/pages/
- **videokit.cc（参考站）**：https://www.videokit.cc/

---

## 十一、快速修复 Bug 检查清单

接到 bug 报告时，按此顺序检查：

1. ☐ 复现 bug：什么工具、什么文件、什么操作
2. ☐ 控制台 `[ffmpeg]` 日志：加载成功了吗？执行的什么命令？
3. ☐ Network 标签：core.js 和 wasm 加载状态
4. ☐ 错误日志面板：有没有记录具体错误
5. ☐ 本地开发环境复现：`npm run dev`
6. ☐ 定位到具体文件：ffmpegEngine.ts / tools.ts / 对应工具组件
7. ☐ 修复后：`npm run build` 验证 → 更新版本号 → 更新 CHANGELOG → 提交 → 部署
8. ☐ 线上验证：上传测试文件确认修复

---

## 十二、接手记录（v0.3.5 / 2026-09-23）
### 已验证的现状
- 线上 https://videokit-9kp.pages.dev 返回 200，COOP/COEP 头生效
- `npm install` / `npm run build`（tsc -b && vite build）均通过，无 TS 报错
- 浏览器端到端实测：无损转封装、视频调速 0.25x 在 dev 与生产构建下均处理成功
- 三个 CDN（unpkg / jsdelivr / fastly.jsdelivr）的 wasm 均可达，且都带
  `cross-origin-resource-policy: cross-origin`，在 COEP 环境下可用
- GitHub token 对 Ri1035/videokit-clone 具备 push/admin 权限；Cloudflare API Token 状态 active

### 本次修复
见 CHANGELOG `[0.3.5]`：视频调速音画不同步、无音轨视频失败、dev 下 core.js 加载失败、
FFmpeg 单例监听器泄漏；并移除未使用的 mediabunny 依赖、补齐 preview 响应头。

### 文档修正
- 原文多处写「页脚版本号 → 历史记录/错误日志」，实测页脚只有版权信息。
  `VersionBadge` 自 v0.3.1 起已移入**右上角 👤 浮层**，本文档相关描述已更正。

### 实测踩坑（排查时容易被误导）
- 在**线上页面**里用 `fetch('http://localhost:xxxx/...')` 注入测试文件会因混合内容/CORS 被拦截，
  失败后 ffmpeg 会报 `Invalid data found when processing input`（退出码 1）。
  **这不是产品 bug，是测试方法问题**——注入测试文件请用同源 URL 或 `vite preview` 本地复现。
- dev 环境与生产构建的 worker 打包方式不同，**ffmpeg 加载相关问题必须在 `npm run preview` 下复现**，
  只看 `npm run dev` 会得出错误结论（v0.3.5 之前的 core.js 问题正是如此）。

---

*文档结束。如有疑问，先看 CHANGELOG.md 和 Git 提交历史，再看控制台日志。*
