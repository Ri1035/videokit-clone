/**
 * 工具注册表 - 数据驱动
 * 所有工具的元数据集中管理
 */

export type ToolCategory = 'convert' | 'compress' | 'edit' | 'extract' | 'fun'

export interface ToolMeta {
  id: string
  name: string
  nameEn: string
  description: string
  descriptionEn: string
  category: ToolCategory
  icon: string
  tags: string[]
  /** 使用通用页面还是特殊页面 */
  pageType: 'generic' | 'special'
  /** 通用页面的配置（仅 generic 类型） */
  genericConfig?: GenericToolConfig
}

export interface GenericToolConfig {
  /** 接受的文件类型 */
  accept: string
  /** 输出扩展名 */
  outputExt: string
  /** ffmpeg 参数生成函数的标识 */
  command: string
  /** 是否显示质量选项 */
  showQuality?: boolean
  /** 是否显示分辨率选项 */
  showResolution?: boolean
  /** 自定义参数面板 */
  params?: ToolParam[]
}

export interface ToolParam {
  key: string
  label: string
  labelEn: string
  type: 'select' | 'slider' | 'number' | 'checkbox'
  options?: { value: string; label: string }[]
  min?: number
  max?: number
  step?: number
  default: string | number | boolean
  unit?: string
}

export const CATEGORY_LABELS: Record<ToolCategory, { zh: string; en: string }> = {
  convert: { zh: '格式转换', en: 'Convert' },
  compress: { zh: '压缩优化', en: 'Compress' },
  edit: { zh: '编辑处理', en: 'Edit' },
  extract: { zh: '提取导出', en: 'Extract' },
  fun: { zh: '特色玩法', en: 'Fun' },
}

export const TOOLS: ToolMeta[] = [
  // ========== 格式转换 ==========
  {
    id: 'video-converter', name: '视频格式转换', nameEn: 'Video Converter',
    description: '支持 MP4、WebM、MOV 等多种格式互转', descriptionEn: 'Convert between MP4, WebM, MOV and more',
    category: 'convert', icon: '🔄', tags: ['MP4', 'WebM', 'MOV'],
    pageType: 'special',
  },
  {
    id: 'stream-copy', name: '视频流复制', nameEn: 'Stream Copy',
    description: '无损转封装，不重新编码，画质零损失、速度极快', descriptionEn: 'Lossless remux, no re-encoding',
    category: 'convert', icon: '⚡', tags: ['无损', '极速'],
    pageType: 'special',
  },
  {
    id: 'batch-transcode', name: '视频批量转码', nameEn: 'Batch Transcode',
    description: '一次性转换多个视频文件，提高工作效率', descriptionEn: 'Convert multiple videos at once',
    category: 'convert', icon: '📦', tags: ['批量', '统一参数'],
    pageType: 'special',
  },
  {
    id: 'video-to-gif', name: '视频转 GIF', nameEn: 'Video to GIF',
    description: '将视频转换为 GIF 动图，支持自定义宽度、帧率和质量', descriptionEn: 'Convert video to GIF with custom FPS and size',
    category: 'convert', icon: '🎞️', tags: ['GIF', '自定义帧率'],
    pageType: 'special',
  },
  {
    id: 'gif-to-video', name: 'GIF 转视频', nameEn: 'GIF to Video',
    description: '将 GIF 动图转换为 MP4 视频，体积更小', descriptionEn: 'Convert GIF to MP4, 95% smaller',
    category: 'convert', icon: '🎬', tags: ['MP4', '体积缩小'],
    pageType: 'generic',
    genericConfig: { accept: 'image/gif,.gif', outputExt: 'mp4', command: 'gif-to-mp4' },
  },
  {
    id: 'image-to-video', name: '图片转视频', nameEn: 'Image to Video',
    description: '多张图片合成 MP4 相册视频，自定义每张显示时长', descriptionEn: 'Create video from images with custom duration',
    category: 'convert', icon: '🖼️', tags: ['JPG', 'PNG', '自定义时长'],
    pageType: 'special',
  },
  {
    id: 'image-to-gif', name: '图片转 GIF', nameEn: 'Image to GIF',
    description: '多张照片合成 GIF 动态图片', descriptionEn: 'Create animated GIF from photos',
    category: 'convert', icon: '✨', tags: ['GIF', '动态图片'],
    pageType: 'special',
  },
  {
    id: 'gif-compress', name: 'GIF 压缩', nameEn: 'GIF Compressor',
    description: '压缩 GIF 动图体积，可调尺寸、帧数和颜色质量', descriptionEn: 'Compress GIF size, adjust dimensions and colors',
    category: 'convert', icon: '🗜️', tags: ['GIF', '体积压缩'],
    pageType: 'special',
  },
  {
    id: 'mov-to-mp4', name: 'MOV 转 MP4', nameEn: 'MOV to MP4',
    description: '将 iPhone/Mac 录制的 MOV 视频转换为通用 MP4 格式', descriptionEn: 'Convert iPhone/Mac MOV to MP4',
    category: 'convert', icon: '📱', tags: ['MOV', 'MP4', 'iPhone'],
    pageType: 'generic',
    genericConfig: { accept: 'video/quicktime,.mov,.mp4', outputExt: 'mp4', command: 'to-mp4' },
  },
  {
    id: 'mkv-to-mp4', name: 'MKV 转 MP4', nameEn: 'MKV to MP4',
    description: '将 MKV 高清影片转换为 MP4，方便在手机和电视上播放', descriptionEn: 'Convert MKV to MP4 for devices',
    category: 'convert', icon: '🎥', tags: ['MKV', 'MP4', '高清'],
    pageType: 'generic',
    genericConfig: { accept: 'video/x-matroska,.mkv,.mp4', outputExt: 'mp4', command: 'to-mp4' },
  },
  {
    id: 'webm-to-mp4', name: 'WebM 转 MP4', nameEn: 'WebM to MP4',
    description: '将 Chrome 录屏或网页视频的 WebM 文件转换为 MP4', descriptionEn: 'Convert WebM screen recording to MP4',
    category: 'convert', icon: '🌐', tags: ['WebM', 'MP4', 'Chrome'],
    pageType: 'generic',
    genericConfig: { accept: 'video/webm,.webm,.mp4', outputExt: 'mp4', command: 'to-mp4' },
  },
  {
    id: 'mp4-to-mov', name: 'MP4 转 MOV', nameEn: 'MP4 to MOV',
    description: '将 MP4 视频转换为 MOV，适合导入 Final Cut Pro 和 iMovie', descriptionEn: 'Convert MP4 to MOV for Final Cut Pro',
    category: 'convert', icon: '🍎', tags: ['MP4', 'MOV', 'Final Cut'],
    pageType: 'generic',
    genericConfig: { accept: 'video/mp4,.mp4,.mov', outputExt: 'mov', command: 'to-mov' },
  },
  {
    id: 'mp4-to-webm', name: 'MP4 转 WebM', nameEn: 'MP4 to WebM',
    description: '将 MP4 转换为 WebM，体积更小，适合 HTML5 网页嵌入', descriptionEn: 'Convert MP4 to WebM for web embedding',
    category: 'convert', icon: '💻', tags: ['MP4', 'WebM', 'HTML5'],
    pageType: 'generic',
    genericConfig: { accept: 'video/mp4,.mp4,.webm', outputExt: 'webm', command: 'to-webm' },
  },

  // ========== 压缩优化 ==========
  {
    id: 'video-compress', name: '视频压缩', nameEn: 'Video Compressor',
    description: '快速压缩视频文件，减小体积，保持画质', descriptionEn: 'Compress video while keeping quality',
    category: 'compress', icon: '📉', tags: ['智能码率', '保留画质'],
    pageType: 'special',
  },
  {
    id: 'batch-compress', name: '视频批量压缩', nameEn: 'Batch Compress',
    description: '一次性压缩多个视频文件，节省存储空间', descriptionEn: 'Compress multiple videos at once',
    category: 'compress', icon: '📦', tags: ['批量', '节省40%-70%'],
    pageType: 'special',
  },

  // ========== 编辑处理 ==========
  {
    id: 'video-trimmer', name: '视频裁剪', nameEn: 'Video Trimmer',
    description: '可视化时间轴，快速截取视频片段，精确到 0.1 秒', descriptionEn: 'Trim video with visual timeline',
    category: 'edit', icon: '✂️', tags: ['时间轴', '精确0.1秒'],
    pageType: 'special',
  },
  {
    id: 'video-splitter', name: '视频分割', nameEn: 'Video Splitter',
    description: '将视频按时间节点切割成多个片段', descriptionEn: 'Split video into multiple clips',
    category: 'edit', icon: '🔪', tags: ['等分切割', '自定义切割点'],
    pageType: 'special',
  },
  {
    id: 'video-merger', name: '视频拼接', nameEn: 'Video Merger',
    description: '轻松合并多个视频片段，拖拽排序', descriptionEn: 'Merge multiple videos with drag sort',
    category: 'edit', icon: '🔗', tags: ['拖拽排序', 'WebCodecs'],
    pageType: 'special',
  },
  {
    id: 'add-watermark', name: '视频添加水印', nameEn: 'Add Watermark',
    description: '为视频添加图片水印，保护版权', descriptionEn: 'Add image watermark to video',
    category: 'edit', icon: '💧', tags: ['图片水印', '版权保护'],
    pageType: 'special',
  },
  {
    id: 'remove-watermark', name: '视频去水印', nameEn: 'Remove Watermark',
    description: '框选水印区域，模糊遮盖一键处理', descriptionEn: 'Blur out watermark area',
    category: 'edit', icon: '🧹', tags: ['模糊遮盖', '马赛克'],
    pageType: 'special',
  },
  {
    id: 'video-color', name: '视频调色', nameEn: 'Color Adjust',
    description: '调整亮度、对比度、饱和度和色相', descriptionEn: 'Adjust brightness, contrast, saturation, hue',
    category: 'edit', icon: '🎨', tags: ['亮度对比度', '一键去色'],
    pageType: 'special',
  },
  {
    id: 'video-rotate', name: '视频旋转', nameEn: 'Rotate Video',
    description: '在线旋转视频方向，支持 90°/180°/270°', descriptionEn: 'Rotate video 90/180/270 degrees',
    category: 'edit', icon: '🔃', tags: ['90°', '180°', '270°'],
    pageType: 'generic',
    genericConfig: {
      accept: 'video/*', outputExt: 'mp4', command: 'rotate',
      params: [{ key: 'angle', label: '旋转角度', labelEn: 'Angle', type: 'select', default: '90', options: [
        { value: '90', label: '顺时针 90°' }, { value: '180', label: '180°' }, { value: '270', label: '逆时针 90°' },
      ]}],
    },
  },
  {
    id: 'video-flip', name: '视频翻转', nameEn: 'Flip Video',
    description: '在线水平/垂直镜像翻转视频', descriptionEn: 'Horizontal/vertical mirror flip',
    category: 'edit', icon: '🪞', tags: ['水平翻转', '垂直翻转'],
    pageType: 'generic',
    genericConfig: {
      accept: 'video/*', outputExt: 'mp4', command: 'flip',
      params: [{ key: 'direction', label: '翻转方向', labelEn: 'Direction', type: 'select', default: 'horizontal', options: [
        { value: 'horizontal', label: '水平翻转' }, { value: 'vertical', label: '垂直翻转' }, { value: 'both', label: '水平+垂直' },
      ]}],
    },
  },
  {
    id: 'video-crop', name: '视频画面裁剪', nameEn: 'Crop Video',
    description: '拖拽选框裁剪视频画面，支持多种比例预设', descriptionEn: 'Crop video frame with drag selection',
    category: 'edit', icon: '⬜', tags: ['16:9', '9:16', '4:3', '1:1'],
    pageType: 'special',
  },
  {
    id: 'video-resize', name: '视频尺寸调整', nameEn: 'Resize Video',
    description: '修改视频分辨率和宽高比，一键转为社媒格式', descriptionEn: 'Change resolution and aspect ratio',
    category: 'edit', icon: '📐', tags: ['9:16', '1:1', '16:9'],
    pageType: 'special',
  },
  {
    id: 'video-speed', name: '视频调速', nameEn: 'Change Speed',
    description: '调整播放速度，支持 0.25x 慢放到 4x 快放', descriptionEn: 'Speed from 0.25x to 4x',
    category: 'edit', icon: '⚡', tags: ['0.25x', '0.5x', '2x', '4x'],
    pageType: 'generic',
    genericConfig: {
      accept: 'video/*', outputExt: 'mp4', command: 'speed',
      params: [{ key: 'speed', label: '播放速度', labelEn: 'Speed', type: 'select', default: '2', options: [
        { value: '0.25', label: '0.25x 极慢' }, { value: '0.5', label: '0.5x 慢速' },
        { value: '1.5', label: '1.5x 较快' }, { value: '2', label: '2x 快速' }, { value: '4', label: '4x 极快' },
      ]}],
    },
  },
  {
    id: 'video-reverse', name: '视频倒放', nameEn: 'Reverse Video',
    description: '把视频倒着播放，做反重力、复原类效果', descriptionEn: 'Play video backwards',
    category: 'edit', icon: '⏪', tags: ['倒放', '反向播放'],
    pageType: 'generic',
    genericConfig: { accept: 'video/*', outputExt: 'mp4', command: 'reverse' },
  },
  {
    id: 'fps-converter', name: '视频帧率转换', nameEn: 'FPS Converter',
    description: '在线调整视频帧率，24fps电影感/30fps标准/60fps流畅', descriptionEn: 'Convert video frame rate',
    category: 'edit', icon: '🎞️', tags: ['24fps', '30fps', '60fps'],
    pageType: 'generic',
    genericConfig: {
      accept: 'video/*', outputExt: 'mp4', command: 'fps',
      params: [{ key: 'fps', label: '目标帧率', labelEn: 'Target FPS', type: 'select', default: '30', options: [
        { value: '24', label: '24 fps 电影感' }, { value: '30', label: '30 fps 标准' },
        { value: '60', label: '60 fps 流畅' }, { value: '120', label: '120 fps 高刷' },
      ]}],
    },
  },
  {
    id: 'add-subtitles', name: '视频添加字幕', nameEn: 'Add Subtitles',
    description: '嵌入 SRT/VTT 字幕，可选软字幕轨道或硬字幕烧录', descriptionEn: 'Embed SRT/VTT subtitles',
    category: 'edit', icon: '💬', tags: ['SRT', 'VTT', '软字幕', '硬字幕'],
    pageType: 'special',
  },
  {
    id: 'remove-subtitles', name: '去除视频字幕', nameEn: 'Remove Subtitles',
    description: '遮盖画面中的硬字幕条，丢弃软字幕轨道', descriptionEn: 'Remove hard/soft subtitles',
    category: 'edit', icon: '🚫', tags: ['硬字幕', '软字幕', '马赛克'],
    pageType: 'special',
  },
  {
    id: 'add-text', name: '视频添加文字', nameEn: 'Add Text',
    description: '在视频画面上叠加自定义文字，支持位置/颜色/描边', descriptionEn: 'Overlay text with position and color',
    category: 'edit', icon: '🔤', tags: ['文字叠加', '多颜色'],
    pageType: 'special',
  },

  // ========== 提取导出 ==========
  {
    id: 'thumbnail-extract', name: '视频预览图提取', nameEn: 'Extract Thumbnails',
    description: '一键提取视频关键帧，生成高质量预览图和缩略图', descriptionEn: 'Extract keyframes as thumbnails',
    category: 'extract', icon: '🖼️', tags: ['PNG', 'JPEG', 'WebP'],
    pageType: 'special',
  },
  {
    id: 'add-bgm', name: '视频添加背景音乐', nameEn: 'Add BGM',
    description: '为视频添加背景音乐，支持循环播放与自动截断', descriptionEn: 'Add background music to video',
    category: 'extract', icon: '🎵', tags: ['MP3', 'AAC', '循环'],
    pageType: 'special',
  },
  {
    id: 'extract-audio', name: '视频提取音频', nameEn: 'Extract Audio',
    description: '从视频中提取音频，支持 MP3、WAV、AAC、OGG 等格式', descriptionEn: 'Extract audio from video',
    category: 'extract', icon: '🎶', tags: ['MP3', 'WAV', 'AAC', 'OGG'],
    pageType: 'special',
  },
  {
    id: 'mute-video', name: '视频消音', nameEn: 'Mute Video',
    description: '一键去除视频中的全部音频轨道，输出无声 MP4', descriptionEn: 'Remove all audio from video',
    category: 'extract', icon: '🔇', tags: ['MP4', '无声', '静音'],
    pageType: 'generic',
    genericConfig: { accept: 'video/*', outputExt: 'mp4', command: 'mute' },
  },
  {
    id: 'video-to-mp3', name: '视频转 MP3', nameEn: 'Video to MP3',
    description: '从视频中提取 MP3 音频，支持调节音质', descriptionEn: 'Extract MP3 from video',
    category: 'extract', icon: '🎧', tags: ['MP3', '320kbps', '128kbps'],
    pageType: 'generic',
    genericConfig: {
      accept: 'video/*', outputExt: 'mp3', command: 'to-mp3',
      showQuality: true,
    },
  },
  // 音频格式互转（通用页面）
  {
    id: 'wav-to-mp3', name: 'WAV 转 MP3', nameEn: 'WAV to MP3',
    description: '将 WAV/OGG/FLAC 音频转为 MP3，体积缩小 90%', descriptionEn: 'Convert WAV to MP3',
    category: 'extract', icon: '🎵', tags: ['WAV', 'MP3'],
    pageType: 'generic',
    genericConfig: { accept: 'audio/*,.wav,.mp3,.ogg,.flac,.m4a', outputExt: 'mp3', command: 'to-mp3', showQuality: true },
  },
  {
    id: 'm4a-to-mp3', name: 'M4A 转 MP3', nameEn: 'M4A to MP3',
    description: '将 M4A/MP4/MOV 音频转为 MP3，支持 iPhone 录音', descriptionEn: 'Convert M4A to MP3',
    category: 'extract', icon: '📱', tags: ['M4A', 'iPhone', 'MP3'],
    pageType: 'generic',
    genericConfig: { accept: 'audio/*,.m4a,.mp3,.wav', outputExt: 'mp3', command: 'to-mp3', showQuality: true },
  },
  {
    id: 'mp4-to-mp3', name: 'MP4 转 MP3', nameEn: 'MP4 to MP3',
    description: '从 MP4/MKV/WebM 视频中提取 MP3 音频', descriptionEn: 'Extract MP3 from MP4',
    category: 'extract', icon: '🎬', tags: ['MP4', 'MKV', 'WebM', 'MP3'],
    pageType: 'generic',
    genericConfig: { accept: 'video/*,.mp4,.mkv,.webm', outputExt: 'mp3', command: 'to-mp3', showQuality: true },
  },
  {
    id: 'mp3-to-wav', name: 'MP3 转 WAV', nameEn: 'MP3 to WAV',
    description: '将 MP3/OGG/FLAC 转为 WAV 无损格式', descriptionEn: 'Convert MP3 to WAV lossless',
    category: 'extract', icon: '💿', tags: ['MP3', 'WAV', '无损'],
    pageType: 'generic',
    genericConfig: { accept: 'audio/*,.mp3,.wav,.ogg,.flac,.m4a', outputExt: 'wav', command: 'to-wav' },
  },
  {
    id: 'flac-to-mp3', name: 'FLAC 转 MP3', nameEn: 'FLAC to MP3',
    description: '将 FLAC 无损音频转为 MP3，体积缩小 90%', descriptionEn: 'Convert FLAC to MP3',
    category: 'extract', icon: '🎵', tags: ['FLAC', 'MP3', '无损'],
    pageType: 'generic',
    genericConfig: { accept: 'audio/*,.flac,.mp3,.wav', outputExt: 'mp3', command: 'to-mp3', showQuality: true },
  },
  {
    id: 'ogg-to-mp3', name: 'OGG 转 MP3', nameEn: 'OGG to MP3',
    description: '将 OGG/Vorbis 音频转为 MP3，兼容所有设备', descriptionEn: 'Convert OGG to MP3',
    category: 'extract', icon: '🎵', tags: ['OGG', 'Vorbis', 'MP3'],
    pageType: 'generic',
    genericConfig: { accept: 'audio/*,.ogg,.mp3,.wav', outputExt: 'mp3', command: 'to-mp3', showQuality: true },
  },
  {
    id: 'flac-to-wav', name: 'FLAC 转 WAV', nameEn: 'FLAC to WAV',
    description: '将 FLAC 无损转为 WAV 格式，专业软件兼容性最佳', descriptionEn: 'Convert FLAC to WAV',
    category: 'extract', icon: '💿', tags: ['FLAC', 'WAV', '无损'],
    pageType: 'generic',
    genericConfig: { accept: 'audio/*,.flac,.wav,.mp3', outputExt: 'wav', command: 'to-wav' },
  },
  {
    id: 'ogg-to-wav', name: 'OGG 转 WAV', nameEn: 'OGG to WAV',
    description: '将 OGG 文件转为 WAV 无损格式，适合专业编辑', descriptionEn: 'Convert OGG to WAV',
    category: 'extract', icon: '💿', tags: ['OGG', 'WAV', '无损'],
    pageType: 'generic',
    genericConfig: { accept: 'audio/*,.ogg,.wav,.mp3', outputExt: 'wav', command: 'to-wav' },
  },
  {
    id: 'mp3-to-ogg', name: 'MP3 转 OGG', nameEn: 'MP3 to OGG',
    description: '将 MP3/WAV/FLAC 转为 OGG（Opus），体积更小音质更好', descriptionEn: 'Convert MP3 to OGG Opus',
    category: 'extract', icon: '🎵', tags: ['MP3', 'OGG', 'Opus'],
    pageType: 'generic',
    genericConfig: { accept: 'audio/*,.mp3,.wav,.flac,.ogg,.m4a', outputExt: 'ogg', command: 'to-ogg' },
  },
  {
    id: 'wav-to-ogg', name: 'WAV 转 OGG', nameEn: 'WAV to OGG',
    description: '将 WAV 无损压缩为 OGG，体积缩小 90%', descriptionEn: 'Convert WAV to OGG',
    category: 'extract', icon: '🎵', tags: ['WAV', 'OGG', 'Opus'],
    pageType: 'generic',
    genericConfig: { accept: 'audio/*,.wav,.mp3,.flac,.ogg', outputExt: 'ogg', command: 'to-ogg' },
  },
  {
    id: 'wav-to-flac', name: 'WAV 转 FLAC', nameEn: 'WAV to FLAC',
    description: '将 WAV 无损转为 FLAC，体积缩小 40%-60% 且音质零损失', descriptionEn: 'Convert WAV to FLAC lossless',
    category: 'extract', icon: '💿', tags: ['WAV', 'FLAC', '无损'],
    pageType: 'generic',
    genericConfig: { accept: 'audio/*,.wav,.flac,.mp3', outputExt: 'flac', command: 'to-flac' },
  },
  {
    id: 'mp3-to-flac', name: 'MP3 转 FLAC', nameEn: 'MP3 to FLAC',
    description: '将 MP3 转封装为 FLAC，便于统一无损音乐库', descriptionEn: 'Convert MP3 to FLAC',
    category: 'extract', icon: '💿', tags: ['MP3', 'FLAC', '格式统一'],
    pageType: 'generic',
    genericConfig: { accept: 'audio/*,.mp3,.flac,.wav', outputExt: 'flac', command: 'to-flac' },
  },
  {
    id: 'ogg-to-flac', name: 'OGG 转 FLAC', nameEn: 'OGG to FLAC',
    description: '将 OGG 转为 FLAC，兼容性更广', descriptionEn: 'Convert OGG to FLAC',
    category: 'extract', icon: '💿', tags: ['OGG', 'FLAC', '兼容'],
    pageType: 'generic',
    genericConfig: { accept: 'audio/*,.ogg,.flac,.wav,.mp3', outputExt: 'flac', command: 'to-flac' },
  },
  {
    id: 'audio-trimmer', name: '音频剪辑', nameEn: 'Audio Trimmer',
    description: '在线裁剪 MP3、WAV、OGG、FLAC 音频，可视化时间轴', descriptionEn: 'Trim audio with visual timeline',
    category: 'extract', icon: '✂️', tags: ['MP3', 'WAV', 'OGG', 'FLAC'],
    pageType: 'special',
  },
  {
    id: 'audio-merger', name: '音频合并', nameEn: 'Audio Merger',
    description: '把多个音频按顺序拼接成一个文件，支持混合格式', descriptionEn: 'Merge multiple audio files',
    category: 'extract', icon: '🔗', tags: ['MP3', 'WAV', 'OGG', 'FLAC'],
    pageType: 'special',
  },
  {
    id: 'audio-compress', name: '音频压缩', nameEn: 'Audio Compressor',
    description: '降低码率压缩音频体积，满足微信、邮件附件限制', descriptionEn: 'Compress audio file size',
    category: 'extract', icon: '🗜️', tags: ['MP3', 'WAV', '体积压缩'],
    pageType: 'special',
  },

  // ========== 特色玩法 ==========
  {
    id: 'sora2-watermark', name: '假装是 Sora2', nameEn: 'Fake Sora2',
    description: '为视频添加 Sora2 风格水印，自动识别横竖屏', descriptionEn: 'Add Sora2 style watermark',
    category: 'fun', icon: '✨', tags: ['一键伪装', '自动识别'],
    pageType: 'special',
  },
]

export function getToolById(id: string): ToolMeta | undefined {
  return TOOLS.find(t => t.id === id)
}

export function getToolsByCategory(category: ToolCategory): ToolMeta[] {
  return TOOLS.filter(t => t.category === category)
}

export const TOTAL_TOOLS = TOOLS.length
