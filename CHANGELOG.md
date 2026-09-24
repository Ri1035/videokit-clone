# Changelog

所有重要变更都记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
版本号遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/)。

## [未发布]

## [0.3.7] - 2026-09-24

### 修复
- **「视频拼接」不同分辨率/朝向的视频拼出来只有第一段能播（严重）**
  - 复现：640×360(3s) + 480×854(2s) 拼接，产物容器显示 5s，但第 4.5s 抽帧为 **0 字节**
    —— concat demuxer 只按包拼接，分辨率一变后续帧就解不出来
  - 根因：`-f concat -i list.txt` 要求所有输入流参数完全一致，异构输入会产出「时长正常但画面损坏」的坏文件
  - 修复：改用 `filter_complex` 的 concat 滤镜，逐段 `scale + pad + setsar + fps + format` 归一化后再拼
  - 画布取第一个输入的分辨率（偶数化），探测失败时退回 1920×1080
- **「音频合并」混合格式（如 mp3 + wav）第二段整段丢失**
  - 复现：mp3(3.03s) + wav(3.00s)，产物只有 3.03s，日志刷屏
    `Error while decoding stream #0:0: Invalid data found when processing input`
  - 根因同上：concat demuxer 把 wav 的包喂给了 mp3 解码器
  - 修复：改用 concat 滤镜，先 `aformat` 统一采样格式/采样率/声道再拼接
- **滤镜链缺陷（上一轮已改、本轮回归确认）**
  - 图片转视频/转 GIF 混格式（jpg + png/webp/gif）改用 filter_complex concat，不再走 concat demuxer
  - 去水印/去硬字幕改 `crop + boxblur + overlay`（wasm 里 delogo 参数不能带表达式）
  - 文字叠加 / Sora2 水印改 Canvas 渲染 PNG + overlay（wasm 内无字体，drawtext 必失败）
  - GIF 压缩的 `palettegen` 参数名更正为 `max_colors`
  - GIF 压缩探针用例修正：缩放系数误写成 `iw*50`（16000px 宽触发 OOM），实为 `iw*0.5`

### 变更
- 新增 `probeInput()`：拼接前探测每个输入的分辨率与是否含音轨
  （concat 滤镜要求各段流数量一致，混入无音轨输入时自动退回纯视频拼接）

### 验证
- 全工具回归探针 **78/78 通过**（52 个工具的实际 ffmpeg 参数）
- 拼接产物抽帧校验：第二段 t=4.5s 可正常解码（修复前 0 字节）
- 其余修复项产物时长/尺寸与预期一致（图片转视频 6s/1920×1080、GIF 压缩 160×120 等）

## [0.3.6] - 2026-09-24

### 修复
- **「MP4 → WebM / → OGG」必崩 `memory access out of bounds`（严重）**
  - 根因：`@ffmpeg/core@0.12.x` 的 `libvpx-vp9` 与 `libopus` 编码器在 wasm 中越界访问内存
    （Chromium 实测直接 `Received signal 11 SEGV_ACCERR`），与视频编码格式、分辨率、滤镜组合均无关
  - 实测边界：`libvpx-vp9` 单帧可编码、**多帧必崩**；`libopus` 任何参数组合都崩；
    `libvpx(VP8)` / `libvorbis` / `libx264` / `libmp3lame` / 无损转封装 全部稳定
  - 结论：只要用 wasm 里的这两个编码器，链路就必然失败，**不是参数问题**
  - 修复：WebM / OGG 改走浏览器原生 WebCodecs（VP9 / Opus），不再依赖 wasm 的这两个编码器
  - 降级：不支持 WebCodecs 的浏览器回退 ffmpeg.wasm 的 VP8 + Vorbis
  - 实测（10s / 720×1280 / H.264+AAC 样例）：原生路径 **4.2s / 1.19MB / VP9+Opus / 10.06s**；
    旧路线 50s+ 且直接报错
- **mediabunny 参数错误导致原生路径静默失效**（本轮自测发现并修复）
  - `video.quality` 必须是 `Quality` 实例，传字符串抛
    `TypeError: options.video.quality, when provided, must be a Quality`
    → 原生路径 100% 失败并静默回退慢速 ffmpeg.wasm（表面上「能用」，实际退化成 50s+）
  - 必须补 `preferBitrate`：否则 mediabunny 走逐帧 quantizer 模式，而 Chromium 的 VP9 编码器
    并不真正消费 `vp9.quantizer`，实测输出退化为 ~3.8Mbps（10s 素材产出 4.7MB，比 1.4MB 源文件还大）；
    改后按「分辨率 + 质量档位」折算目标码率，输出体积可控
- **批量转码选 WebM 产出坏文件**
  - 根因：无论选什么格式都硬编码 H.264/AAC 参数，选 WebM 会得到「`.webm` 后缀 + H.264 内容」
  - 修复：按目标格式生成参数，并对 WebM 接入原生 WebCodecs
- **`memory access out of bounds` 错误文案误导**
  - 原文案归因于「编码格式不被 wasm 支持 / 分辨率过高 / 文件过大 / 滤镜组合」，与实测根因不符
  - 修复：改为说明是 wasm 内核编码器缺陷、应用已自动改走原生路径

### 变更
- 恢复 `mediabunny` 依赖（v0.3.5 曾移除该未使用依赖），MPL-2.0 开源；体积约 600KB，
  全部改为动态 `import()`，不进主包（主包仍为 117KB）
- 「视频格式转换」「批量转码」的 WebM 降级路径由 VP9 + Opus 改为 **VP8 + Vorbis**

### 验证
- 线上真实环境（Cloudflare Pages）实测通过：视频格式转换 → WebM、MP4 转 WebM、
  批量转码 → WebM、MP3 → OGG、提取音频 → OGG
- 强制屏蔽 WebCodecs（模拟不支持环境）：回退 VP8 + Vorbis，产物有效可播放
- 17 个常用工具冒烟测试全部 SUCCESS
- COOP/COEP 响应头保持生效，ffmpeg.wasm 降级路径不受影响

## [0.3.5] - 2026-09-23

### 修复
- **视频调速音画不同步（严重）**：所有慢放档位（0.25x / 0.5x）音频被反向加速
  - 根因：`atempo` 取值为 `speed > 1 ? speed : 1 / speed`，慢放时取到的是倒数（0.25x → `atempo=4`）
  - 实测：3.000s 输入 → 输出视频 11.934s，音轨仅 0.743s，音画完全错位
  - 修复：atempo 与视频同向取值，并按 atempo 单次 0.5~100 的限制串联（0.25x → `atempo=0.5,atempo=0.5`）
  - 实测修复后：视频 11.994s / 音轨 11.993s，完全同步
- **视频调速对无音轨视频直接失败**：`-filter_complex [0:a]` 报 `Stream specifier ':a' ... matches no streams`
  - 修复：改用 `-vf` / `-af`，无音频流时 `-af` 会被自动忽略
- **本地开发环境 ffmpeg-core.js 加载失败**：dev 下前 5 次加载策略全部失败，只能回退到全 CDN（第 6 次）
  - 根因：Vite dev 会把 worker 内 `import(url)` 改写为 `import(__vite__injectQuery(url, 'import'))`，
    请求变成 `/ffmpeg-core/ffmpeg-core.js?import`；而 Vite 的 `servePublicMiddleware` 对
    `isImportRequest` 直接 `next()`，public 目录文件不再命中，最终回退到 SPA `index.html`（`text/html`），
    动态 import 报 `TypeError: Failed to fetch dynamically imported module`
  - 修复：`LOCAL_CORE_URL` 改为带 origin 的绝对 URL（`injectQuery` 对绝对 URL 原样返回）
  - 实测修复后：dev 与生产构建均在第 1 次尝试即加载成功
- **FFmpeg 单例监听器泄漏**：`runFFmpegTask` 每次调用都注册 progress/log 监听器且从不移除，
  多次处理后监听器持续累积（内存泄漏 + 旧任务进度回调串扰新任务）
  - 修复：任务结束（含异常路径）时用 `ffmpeg.off()` 移除

### 优化
- 移除未使用的 `mediabunny` 依赖及对应空 chunk（构建产物不再出现 `Generated an empty chunk: "mediabunny"`）
- `vite preview` 补齐 COOP/COEP 等响应头，使本地预览能真实复现 Cloudflare Pages 环境
- `LOCAL_CORE_URL` 常量名拼写修正（`FFMEPG` → `FFMPEG`）

### 文档
- HANDOFF.md 更新至 v0.3.5：补充 Vite dev 下 core.js 的踩坑记录、监听器泄漏、视频调速滤镜约束

## [0.3.4] - 2026-09-23

### 新增
- 项目转手文档 HANDOFF.md（含架构说明、bug排查指南、部署流程）

### 优化
- 默认打开「格式转换」分类菜单
- 错误信息分类优化：memory access out of bounds / 格式不支持 / 权限问题 分别给出针对性建议
- ffmpeg 错误时显示执行命令，便于排查

### 文档
- 确认版本管理体系完善：6个Git tag、CHANGELOG、version.ts自动同步、release脚本、DEPLOY.md
- 确认日志体系完善：用户操作历史(localStorage)、全局错误日志、控制台[ffmpeg]日志

## [0.3.3] - 2026-09-23

### 修复
- **根因修复**：FFmpeg 引擎加载失败 "failed to import ffmpeg-core.js"
  - 根因：ffmpeg.wasm 的 Web Worker 是 `type: "module"`，需要 esm 版本的 core.js
  - umd 版本没有 default export，import() 加载后 .default 为 undefined，抛出 ERROR_IMPORT_FAILURE
  - 修复：本地 core.js 和所有 CDN 路径从 `dist/umd/` 改为 `dist/esm/`
  - 验证：预览环境上传测试视频，4秒内加载引擎并处理成功

## [0.3.2] - 2026-09-23

### 修复
- **关键修复**：解决 FFmpeg 引擎加载失败"未知错误"问题
  - 根因：COEP 环境下 toBlobURL 跨域 fetch CDN 资源失败
  - 方案：core.js 本地自托管（同源稳定），wasm 从 CDN 直接加载
  - 三级 fallback 策略：本地core+CDN wasm → 本地core+toBlobURL wasm → 全CDN toBlobURL
  - 增加 fastly.jsdelivr.net 作为第三个 CDN
  - 错误信息大幅改进，显示原始错误和排查建议
- ffmpeg-core.js 自托管到 public/ffmpeg-core/（110KB）

## [0.3.1] - 2026-09-23

### 新增
- 右上角个人主页浮动框（点击👤弹出），包含产品特性信息
- ffmpeg 引擎加载时显示不确定进度条动画

### 优化
- 菜单排序调整为：格式转换 → 视频工具 → 音频工具 → 我的收藏 → 全部工具
- 首页特性卡片移入右上角个人主页，首页更简洁
- 主标题旁图标替换为用户提供的彩色 SVG 图标

## [0.3.0] - 2026-09-23

### 新增
- 网站图标替换为用户提供的彩色视频风格 SVG

### 修复
- **严重bug修复**：重写 ffmpeg 引擎，解决"上传文件就处理失败"问题
  - 多 CDN fallback（unpkg → jsdelivr → cdnjs），提高引擎加载成功率
  - 加载失败自动重置，不再永久卡死
  - 详细错误信息，不再只显示"处理失败"
  - 安全文件名处理，避免中文/特殊字符导致命令解析失败
  - 退出码检查，ffmpeg 执行失败时抛出明确错误

### 重构
- UI 分类从 5 类合并为 3 类：格式转换(13) / 视频工具(20) / 音频工具(19)
- 移除"特色玩法"分类及 Sora2 水印工具
- 共 52 个工具，分类更清晰，减少菜单冗余

## [0.2.0] - 2026-09-23

### 新增
- **版本管理体系**：语义化版本号（semver）、版本升级脚本（patch/minor/major）、自动版本号注入
- **Git Tag 管理**：规范的发布流程，版本号与 Git Tag 对应
- **应用内版本显示**：页脚显示版本号，点击可跳转 GitHub 仓库
- **用户操作历史**：记录每次视频处理操作（工具、文件名、大小、耗时、状态），支持查看/删除/清空/统计
- **错误日志系统**：全局错误捕获（JS错误/Promise拒绝/ffmpeg错误），本地存储最多200条，支持查看详情/导出JSON/清空
- **错误监控初始化**：应用启动时自动注册全局错误监听
- **部署记录文档**：DEPLOY.md 记录每次部署的版本、时间、变更
- **自动化部署脚本**：`npm run deploy` 一键构建+部署到 Cloudflare Pages
- **发布脚本**：`npm run release` 标准化发布流程

### 改进
- 处理流程 Hook 集成历史记录和错误日志，每次处理自动记录
- 页脚增加版本号、历史记录、错误日志入口

### 技术
- 新增 `src/version/version.ts` 版本常量（自动生成）
- 新增 `src/lib/history.ts` 历史记录管理
- 新增 `src/lib/errorLog.ts` 错误日志管理
- 新增 `src/components/VersionBadge.tsx` 版本徽章组件
- 新增 `src/components/HistoryPanel.tsx` 历史记录面板
- 新增 `src/components/ErrorLogPanel.tsx` 错误日志面板
- 新增 `scripts/update-version.js` 版本同步脚本
- 新增 `scripts/release.js` 发布脚本
- 新增 `.npmrc` 配置

## [0.1.0] - 2026-09-23

### 新增
- 项目初始化：Vite + React 18 + TypeScript + Tailwind CSS
- ffmpeg.wasm 引擎封装，支持浏览器端视频处理
- 通用工具页面框架（配置驱动，支持动态参数面板）
- 首页：工具分类展示、搜索、收藏、标签筛选
- 布局组件：响应式头部/底部、主题切换、语言切换
- 文件上传组件：支持拖拽、多文件、文件信息展示
- 处理流程 Hook：统一的加载→处理→进度→结果→下载流程

### 工具实现（53个）

**格式转换（13个）**
- 视频格式转换（MP4/WebM/MOV/MKV/AVI）
- 视频流复制（无损转封装）
- 视频批量转码
- 视频转 GIF（自定义帧率/尺寸/画质）
- GIF 转视频
- 图片转视频（自定义时长）
- 图片转 GIF
- GIF 压缩（尺寸/帧率/颜色数）
- MOV → MP4、MKV → MP4、WebM → MP4、MP4 → MOV、MP4 → WebM

**压缩优化（2个）**
- 视频压缩（4档强度）
- 视频批量压缩

**编辑处理（16个）**
- 视频裁剪（可视化时间轴，精确到0.1秒）
- 视频分割（自定义切割点/等分切割）
- 视频拼接（多文件拖拽排序）
- 添加水印（图片水印，位置/大小/透明度）
- 去水印（模糊遮盖/黑色遮挡）
- 视频调色（亮度/对比度/饱和度/色相/一键去色）
- 视频旋转（90°/180°/270°）
- 视频翻转（水平/垂直/双向）
- 画面裁剪（比例预设/自定义坐标）
- 尺寸调整（多种社媒分辨率预设）
- 视频调速（0.25x~4x）
- 视频倒放
- 帧率转换（24/30/60/120fps）
- 添加字幕（硬字幕烧录/软字幕轨道）
- 去除字幕（软字幕丢弃/硬字幕模糊）
- 添加文字（位置/颜色/字号/时间段）

**提取导出（21个）**
- 视频预览图提取（多帧批量抽取）
- 添加背景音乐（替换/混合原声、音量、循环）
- 提取音频（MP3/WAV/AAC/OGG/FLAC）
- 视频消音
- 视频转 MP3（可调音质）
- 13种音频格式互转（WAV/M4A/MP4/FLAC/OGG ↔ MP3/WAV/OGG/FLAC）
- 音频剪辑（时间轴裁剪）
- 音频合并（多文件排序拼接）
- 音频压缩（码率调节）

**特色玩法（1个）**
- 假装是 Sora2（自动识别横竖屏添加水印）

### 其他
- 中英双语国际化
- 浅色/深色主题切换
- 工具收藏功能（localStorage）
- Cloudflare Pages 部署配置（_headers COOP/COEP）
- HashRouter 路由（兼容静态托管）
- 代码分包：ffmpeg / mediabunny / react-vendor 独立 chunk

---

[0.2.0]: https://github.com/Ri1035/videokit-clone/releases/tag/v0.2.0
[0.1.0]: https://github.com/Ri1035/videokit-clone/releases/tag/v0.1.0
