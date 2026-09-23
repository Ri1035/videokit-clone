# VideoKit - 在线视频工具箱

纯前端在线视频处理工具集合，基于 **WebCodecs + ffmpeg.wasm**，所有处理在浏览器本地完成，无需上传服务器，保护隐私。

> 复刻自 [videokit.cc](https://www.videokit.cc/)，A类功能（53个工具）已全部实现。

## ✨ 特性

- **🔒 本地优先**：所有视频/音频处理在浏览器内完成，文件不上传任何服务器
- **🆓 完全免费**：所有功能免费使用，无水印、无时长限制
- **⚡ 高速处理**：ffmpeg.wasm 引擎，支持多线程
- **🌓 深色模式**：支持浅色/深色主题切换
- **🌍 中英双语**：内置中文/英文界面
- **⭐ 收藏功能**：常用工具一键收藏，快速访问
- **📱 响应式**：适配桌面和移动端

## 🛠️ 功能清单（53个工具）

### 格式转换（13个）
视频格式转换、无损流复制、批量转码、视频转GIF、GIF转视频、图片转视频、图片转GIF、GIF压缩、MOV→MP4、MKV→MP4、WebM→MP4、MP4→MOV、MP4→WebM

### 压缩优化（2个）
视频压缩、视频批量压缩

### 编辑处理（16个）
视频裁剪、视频分割、视频拼接、添加水印、去水印、视频调色、视频旋转、视频翻转、画面裁剪、尺寸调整、视频调速、视频倒放、帧率转换、添加字幕、去除字幕、添加文字

### 提取导出（21个）
预览图提取、添加背景音乐、提取音频、视频消音、视频转MP3、WAV→MP3、M4A→MP3、MP4→MP3、MP3→WAV、FLAC→MP3、OGG→MP3、FLAC→WAV、OGG→WAV、MP3→OGG、WAV→OGG、WAV→FLAC、MP3→FLAC、OGG→FLAC、音频剪辑、音频合并、音频压缩

### 特色玩法（1个）
假装是 Sora2（水印伪装）

## 🚀 快速开始

### 开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 生产构建
npm run build

# 预览构建产物
npm run preview
```

### 技术栈

| 类别 | 技术 |
|---|---|
| 框架 | React 18 + TypeScript |
| 构建 | Vite 5 |
| 样式 | Tailwind CSS 3 |
| 路由 | React Router 6 (HashRouter) |
| 视频引擎 | @ffmpeg/ffmpeg (ffmpeg.wasm) |
| 媒体库 | mediabunny（预留） |

## ☁️ Cloudflare Pages 部署

### 方式一：Git 集成（推荐）

1. 将本项目推送到 GitHub
2. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/) → Workers & Pages → Create → Pages → Connect to Git
3. 选择你的仓库
4. 构建配置：
   - **Framework preset**: None
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Node version**: 20.x
5. 部署完成后，在 **Settings → Functions → Headers** 中确认 `_headers` 文件已生效（项目已内置 `public/_headers`）

### 方式二：Wrangler CLI

```bash
npm install -g wrangler
wrangler login
wrangler pages deploy dist --project-name=videokit
```

### 重要：COOP/COEP Headers

ffmpeg.wasm 多线程需要 `SharedArrayBuffer`，必须设置以下响应头。项目已在 `public/_headers` 中配置：

```
/*
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Embedder-Policy: require-corp
```

Cloudflare Pages 会自动识别 `public/_headers` 文件。如果使用其他托管平台，请确保配置了这些头。

## 📁 项目结构

```
videokit-clone/
├── public/
│   ├── _headers              # CF Pages 安全头配置
│   └── favicon.svg
├── src/
│   ├── components/           # 通用组件
│   │   ├── Layout.tsx        # 页面布局（头部/底部）
│   │   ├── ToolShell.tsx     # 工具页外壳
│   │   ├── ToolCard.tsx      # 首页工具卡片
│   │   ├── FileUpload.tsx    # 文件上传（拖拽）
│   │   ├── ProgressBar.tsx   # 进度条
│   │   └── useToolProcessor.tsx  # 处理流程 Hook
│   ├── tools/                # 工具页面
│   │   ├── GenericToolPage.tsx   # 通用工具页（配置驱动）
│   │   ├── SpecialToolPage.tsx   # 特殊工具分发器
│   │   ├── simple-special.tsx    # 简单参数型工具
│   │   ├── multi-file.tsx        # 多文件型工具
│   │   ├── timeline.tsx          # 时间轴型工具
│   │   ├── visual-edit.tsx       # 视觉编辑型工具
│   │   ├── gif-tools.tsx         # GIF 相关工具
│   │   └── misc.tsx              # 其他工具
│   ├── lib/
│   │   ├── ffmpegEngine.ts   # ffmpeg.wasm 引擎封装
│   │   ├── ffmpegCommands.ts # ffmpeg 命令生成器
│   │   └── utils.ts          # 工具函数
│   ├── data/
│   │   └── tools.ts          # 工具注册表（53个工具元数据）
│   ├── hooks/                # 自定义 Hooks
│   ├── i18n/                 # 国际化
│   ├── HomePage.tsx          # 首页
│   ├── App.tsx               # 应用入口
│   ├── main.tsx              # 渲染入口
│   └── index.css             # 全局样式
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

## 📝 版本日志

见 [CHANGELOG.md](./CHANGELOG.md)

## ⚠️ 已知限制

1. **ffmpeg.wasm 首次加载**：需要从 CDN 下载约 30MB 的 wasm 核心，首次使用较慢，后续有缓存
2. **大文件处理**：浏览器内存限制，建议处理 500MB 以内的视频
3. **编码格式**：输出主要为 H.264/AAC，部分格式（如 HEVC）浏览器不支持编码
4. **平台下载功能**：未包含（需要后端服务，属于C类功能）
5. **AI语音识别/OCR**：未包含（属于B类功能，需额外集成模型）

## 📄 License

MIT
