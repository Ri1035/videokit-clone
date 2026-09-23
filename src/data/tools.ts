/**
 * 工具注册表 - 数据驱动（v2 精简分类版）
 * 分类：格式转换 / 视频工具 / 音频工具
 */

export type ToolCategory = 'convert' | 'video' | 'audio'

export interface ToolMeta {
  id: string
  name: string
  nameEn: string
  description: string
  descriptionEn: string
  category: ToolCategory
  icon: string
  tags: string[]
  pageType: 'generic' | 'special'
  genericConfig?: GenericToolConfig
}

export interface GenericToolConfig {
  accept: string
  outputExt: string
  command: string
  showQuality?: boolean
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

export const CATEGORY_LABELS: Record<ToolCategory, { zh: string; en: string; icon: string }> = {
  convert: { zh: '格式转换', en: 'Convert', icon: '🔄' },
  video: { zh: '视频工具', en: 'Video Tools', icon: '🎬' },
  audio: { zh: '音频工具', en: 'Audio Tools', icon: '🎵' },
}

export const TOOLS: ToolMeta[] = [
  // ==================== 格式转换（13个） ====================
  {
    id: 'video-converter', name: '视频格式转换', nameEn: 'Video Converter',
    description: '支持 MP4、WebM、MOV 等多种格式互转', descriptionEn: 'Convert between MP4, WebM, MOV and more',
    category: 'convert', icon: '🔄', tags: ['MP4', 'WebM', 'MOV'], pageType: 'special',
  },
  {
    id: 'stream-copy', name: '无损转封装', nameEn: 'Stream Copy',
    description: '不重新编码，画质零损失、速度极快', descriptionEn: 'Lossless remux, no re-encoding',
    category: 'convert', icon: '⚡', tags: ['无损', '极速'], pageType: 'special',
  },
  {
    id: 'batch-transcode', name: '批量转码', nameEn: 'Batch Transcode',
    description: '一次性转换多个视频文件', descriptionEn: 'Convert multiple videos at once',
    category: 'convert', icon: '📦', tags: ['批量', '统一参数'], pageType: 'special',
  },
  {
    id: 'video-to-gif', name: '视频转 GIF', nameEn: 'Video to GIF',
    description: '自定义宽度、帧率和质量', descriptionEn: 'Custom FPS and size',
    category: 'convert', icon: '🎞️', tags: ['GIF', '自定义帧率'], pageType: 'special',
  },
  {
    id: 'gif-to-video', name: 'GIF 转视频', nameEn: 'GIF to Video',
    description: 'GIF 转 MP4，体积更小', descriptionEn: 'Convert GIF to MP4, 95% smaller',
    category: 'convert', icon: '🎬', tags: ['MP4', '体积缩小'], pageType: 'generic',
    genericConfig: { accept: 'image/gif,.gif', outputExt: 'mp4', command: 'gif-to-mp4' },
  },
  {
    id: 'image-to-video', name: '图片转视频', nameEn: 'Image to Video',
    description: '多张图片合成相册视频', descriptionEn: 'Create video from images',
    category: 'convert', icon: '🖼️', tags: ['JPG', 'PNG', '自定义时长'], pageType: 'special',
  },
  {
    id: 'image-to-gif', name: '图片转 GIF', nameEn: 'Image to GIF',
    description: '多张照片合成动态 GIF', descriptionEn: 'Create animated GIF from photos',
    category: 'convert', icon: '✨', tags: ['GIF', '动态图片'], pageType: 'special',
  },
  {
    id: 'gif-compress', name: 'GIF 压缩', nameEn: 'GIF Compressor',
    description: '压缩 GIF 体积，可调尺寸和颜色', descriptionEn: 'Compress GIF size',
    category: 'convert', icon: '🗜️', tags: ['GIF', '体积压缩'], pageType: 'special',
  },
  {
    id: 'mov-to-mp4', name: 'MOV 转 MP4', nameEn: 'MOV to MP4',
    description: 'iPhone/Mac 录制的 MOV 转通用 MP4', descriptionEn: 'Convert MOV to MP4',
    category: 'convert', icon: '📱', tags: ['MOV', 'MP4', 'iPhone'], pageType: 'generic',
    genericConfig: { accept: 'video/quicktime,.mov,.mp4', outputExt: 'mp4', command: 'to-mp4' },
  },
  {
    id: 'mkv-to-mp4', name: 'MKV 转 MP4', nameEn: 'MKV to MP4',
    description: 'MKV 高清影片转 MP4', descriptionEn: 'Convert MKV to MP4',
    category: 'convert', icon: '🎥', tags: ['MKV', 'MP4', '高清'], pageType: 'generic',
    genericConfig: { accept: 'video/x-matroska,.mkv,.mp4', outputExt: 'mp4', command: 'to-mp4' },
  },
  {
    id: 'webm-to-mp4', name: 'WebM 转 MP4', nameEn: 'WebM to MP4',
    description: 'Chrome 录屏 WebM 转 MP4', descriptionEn: 'Convert WebM to MP4',
    category: 'convert', icon: '🌐', tags: ['WebM', 'MP4', 'Chrome'], pageType: 'generic',
    genericConfig: { accept: 'video/webm,.webm,.mp4', outputExt: 'mp4', command: 'to-mp4' },
  },
  {
    id: 'mp4-to-mov', name: 'MP4 转 MOV', nameEn: 'MP4 to MOV',
    description: '适合导入 Final Cut Pro 和 iMovie', descriptionEn: 'For Final Cut Pro',
    category: 'convert', icon: '🍎', tags: ['MP4', 'MOV', 'Final Cut'], pageType: 'generic',
    genericConfig: { accept: 'video/mp4,.mp4,.mov', outputExt: 'mov', command: 'to-mov' },
  },
  {
    id: 'mp4-to-webm', name: 'MP4 转 WebM', nameEn: 'MP4 to WebM',
    description: '体积更小，适合网页嵌入', descriptionEn: 'For web embedding',
    category: 'convert', icon: '💻', tags: ['MP4', 'WebM', 'HTML5'], pageType: 'generic',
    genericConfig: { accept: 'video/mp4,.mp4,.webm', outputExt: 'webm', command: 'to-webm' },
  },

  // ==================== 视频工具（20个） ====================
  {
    id: 'video-compress', name: '视频压缩', nameEn: 'Video Compressor',
    description: '减小体积，保持画质', descriptionEn: 'Compress while keeping quality',
    category: 'video', icon: '📉', tags: ['智能码率', '保留画质'], pageType: 'special',
  },
  {
    id: 'batch-compress', name: '批量压缩', nameEn: 'Batch Compress',
    description: '一次性压缩多个视频', descriptionEn: 'Compress multiple videos',
    category: 'video', icon: '📦', tags: ['批量', '节省40%-70%'], pageType: 'special',
  },
  {
    id: 'video-trimmer', name: '视频裁剪', nameEn: 'Video Trimmer',
    description: '可视化时间轴，精确到 0.1 秒', descriptionEn: 'Trim with timeline',
    category: 'video', icon: '✂️', tags: ['时间轴', '精确0.1秒'], pageType: 'special',
  },
  {
    id: 'video-splitter', name: '视频分割', nameEn: 'Video Splitter',
    description: '按时间节点切割成多个片段', descriptionEn: 'Split into clips',
    category: 'video', icon: '🔪', tags: ['等分切割', '自定义'], pageType: 'special',
  },
  {
    id: 'video-merger', name: '视频拼接', nameEn: 'Video Merger',
    description: '合并多个片段，拖拽排序', descriptionEn: 'Merge with drag sort',
    category: 'video', icon: '🔗', tags: ['拖拽排序'], pageType: 'special',
  },
  {
    id: 'add-watermark', name: '添加水印', nameEn: 'Add Watermark',
    description: '图片水印，保护版权', descriptionEn: 'Add image watermark',
    category: 'video', icon: '💧', tags: ['图片水印', '版权'], pageType: 'special',
  },
  {
    id: 'remove-watermark', name: '去水印', nameEn: 'Remove Watermark',
    description: '框选区域，模糊遮盖', descriptionEn: 'Blur out watermark',
    category: 'video', icon: '🧹', tags: ['模糊遮盖', '马赛克'], pageType: 'special',
  },
  {
    id: 'video-color', name: '视频调色', nameEn: 'Color Adjust',
    description: '亮度/对比度/饱和度/色相', descriptionEn: 'Adjust color',
    category: 'video', icon: '🎨', tags: ['亮度', '对比度', '一键去色'], pageType: 'special',
  },
  {
    id: 'video-rotate', name: '视频旋转', nameEn: 'Rotate Video',
    description: '90°/180°/270° 旋转', descriptionEn: 'Rotate 90/180/270',
    category: 'video', icon: '🔃', tags: ['90°', '180°', '270°'], pageType: 'generic',
    genericConfig: {
      accept: 'video/*', outputExt: 'mp4', command: 'rotate',
      params: [{ key: 'angle', label: '旋转角度', labelEn: 'Angle', type: 'select', default: '90', options: [
        { value: '90', label: '顺时针 90°' }, { value: '180', label: '180°' }, { value: '270', label: '逆时针 90°' },
      ]}],
    },
  },
  {
    id: 'video-flip', name: '视频翻转', nameEn: 'Flip Video',
    description: '水平/垂直镜像翻转', descriptionEn: 'Mirror flip',
    category: 'video', icon: '🪞', tags: ['水平翻转', '垂直翻转'], pageType: 'generic',
    genericConfig: {
      accept: 'video/*', outputExt: 'mp4', command: 'flip',
      params: [{ key: 'direction', label: '翻转方向', labelEn: 'Direction', type: 'select', default: 'horizontal', options: [
        { value: 'horizontal', label: '水平翻转' }, { value: 'vertical', label: '垂直翻转' }, { value: 'both', label: '水平+垂直' },
      ]}],
    },
  },
  {
    id: 'video-crop', name: '画面裁剪', nameEn: 'Crop Video',
    description: '拖拽选框，多种比例预设', descriptionEn: 'Crop frame',
    category: 'video', icon: '⬜', tags: ['16:9', '9:16', '4:3', '1:1'], pageType: 'special',
  },
  {
    id: 'video-resize', name: '尺寸调整', nameEn: 'Resize Video',
    description: '修改分辨率，一键转社媒格式', descriptionEn: 'Change resolution',
    category: 'video', icon: '📐', tags: ['9:16', '1:1', '16:9'], pageType: 'special',
  },
  {
    id: 'video-speed', name: '视频调速', nameEn: 'Change Speed',
    description: '0.25x 慢放到 4x 快放', descriptionEn: 'Speed 0.25x to 4x',
    category: 'video', icon: '⚡', tags: ['0.25x', '2x', '4x'], pageType: 'generic',
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
    description: '反向播放，反重力效果', descriptionEn: 'Play backwards',
    category: 'video', icon: '⏪', tags: ['倒放', '反向'], pageType: 'generic',
    genericConfig: { accept: 'video/*', outputExt: 'mp4', command: 'reverse' },
  },
  {
    id: 'fps-converter', name: '帧率转换', nameEn: 'FPS Converter',
    description: '24fps电影感/30fps/60fps', descriptionEn: 'Convert frame rate',
    category: 'video', icon: '🎞️', tags: ['24fps', '30fps', '60fps'], pageType: 'generic',
    genericConfig: {
      accept: 'video/*', outputExt: 'mp4', command: 'fps',
      params: [{ key: 'fps', label: '目标帧率', labelEn: 'Target FPS', type: 'select', default: '30', options: [
        { value: '24', label: '24 fps 电影感' }, { value: '30', label: '30 fps 标准' },
        { value: '60', label: '60 fps 流畅' }, { value: '120', label: '120 fps 高刷' },
      ]}],
    },
  },
  {
    id: 'add-subtitles', name: '添加字幕', nameEn: 'Add Subtitles',
    description: 'SRT/VTT 字幕，软字幕或硬字幕', descriptionEn: 'Embed subtitles',
    category: 'video', icon: '💬', tags: ['SRT', 'VTT', '软字幕', '硬字幕'], pageType: 'special',
  },
  {
    id: 'remove-subtitles', name: '去除字幕', nameEn: 'Remove Subtitles',
    description: '遮盖硬字幕，丢弃软字幕', descriptionEn: 'Remove subtitles',
    category: 'video', icon: '🚫', tags: ['硬字幕', '软字幕'], pageType: 'special',
  },
  {
    id: 'add-text', name: '添加文字', nameEn: 'Add Text',
    description: '叠加文字，位置/颜色/时间段', descriptionEn: 'Overlay text',
    category: 'video', icon: '🔤', tags: ['文字叠加', '多颜色'], pageType: 'special',
  },
  {
    id: 'thumbnail-extract', name: '提取预览图', nameEn: 'Extract Thumbnails',
    description: '一键提取关键帧，生成缩略图', descriptionEn: 'Extract keyframes',
    category: 'video', icon: '🖼️', tags: ['PNG', 'JPEG', 'WebP'], pageType: 'special',
  },
  {
    id: 'add-bgm', name: '添加背景音乐', nameEn: 'Add BGM',
    description: '添加背景音乐，循环播放', descriptionEn: 'Add background music',
    category: 'video', icon: '🎵', tags: ['MP3', 'AAC', '循环'], pageType: 'special',
  },

  // ==================== 音频工具（19个） ====================
  {
    id: 'extract-audio', name: '提取音频', nameEn: 'Extract Audio',
    description: '从视频提取 MP3/WAV/AAC/OGG', descriptionEn: 'Extract audio from video',
    category: 'audio', icon: '🎶', tags: ['MP3', 'WAV', 'AAC', 'OGG'], pageType: 'special',
  },
  {
    id: 'mute-video', name: '视频消音', nameEn: 'Mute Video',
    description: '去除全部音频轨道，输出无声 MP4', descriptionEn: 'Remove audio from video',
    category: 'audio', icon: '🔇', tags: ['MP4', '无声', '静音'], pageType: 'generic',
    genericConfig: { accept: 'video/*', outputExt: 'mp4', command: 'mute' },
  },
  {
    id: 'video-to-mp3', name: '视频转 MP3', nameEn: 'Video to MP3',
    description: '提取 MP3，可调音质', descriptionEn: 'Extract MP3 from video',
    category: 'audio', icon: '🎧', tags: ['MP3', '320kbps'], pageType: 'generic',
    genericConfig: { accept: 'video/*', outputExt: 'mp3', command: 'to-mp3', showQuality: true },
  },
  {
    id: 'wav-to-mp3', name: 'WAV 转 MP3', nameEn: 'WAV to MP3',
    description: 'WAV/OGG/FLAC 转 MP3', descriptionEn: 'Convert WAV to MP3',
    category: 'audio', icon: '🎵', tags: ['WAV', 'MP3'], pageType: 'generic',
    genericConfig: { accept: 'audio/*,.wav,.mp3,.ogg,.flac,.m4a', outputExt: 'mp3', command: 'to-mp3', showQuality: true },
  },
  {
    id: 'm4a-to-mp3', name: 'M4A 转 MP3', nameEn: 'M4A to MP3',
    description: 'M4A/MP4/MOV 转 MP3', descriptionEn: 'Convert M4A to MP3',
    category: 'audio', icon: '📱', tags: ['M4A', 'iPhone', 'MP3'], pageType: 'generic',
    genericConfig: { accept: 'audio/*,.m4a,.mp3,.wav', outputExt: 'mp3', command: 'to-mp3', showQuality: true },
  },
  {
    id: 'mp4-to-mp3', name: 'MP4 转 MP3', nameEn: 'MP4 to MP3',
    description: '从 MP4/MKV/WebM 提取 MP3', descriptionEn: 'Extract MP3 from MP4',
    category: 'audio', icon: '🎬', tags: ['MP4', 'MKV', 'WebM', 'MP3'], pageType: 'generic',
    genericConfig: { accept: 'video/*,.mp4,.mkv,.webm', outputExt: 'mp3', command: 'to-mp3', showQuality: true },
  },
  {
    id: 'mp3-to-wav', name: 'MP3 转 WAV', nameEn: 'MP3 to WAV',
    description: '转 WAV 无损格式', descriptionEn: 'Convert to WAV lossless',
    category: 'audio', icon: '💿', tags: ['MP3', 'WAV', '无损'], pageType: 'generic',
    genericConfig: { accept: 'audio/*,.mp3,.wav,.ogg,.flac,.m4a', outputExt: 'wav', command: 'to-wav' },
  },
  {
    id: 'flac-to-mp3', name: 'FLAC 转 MP3', nameEn: 'FLAC to MP3',
    description: 'FLAC 无损转 MP3', descriptionEn: 'Convert FLAC to MP3',
    category: 'audio', icon: '🎵', tags: ['FLAC', 'MP3', '无损'], pageType: 'generic',
    genericConfig: { accept: 'audio/*,.flac,.mp3,.wav', outputExt: 'mp3', command: 'to-mp3', showQuality: true },
  },
  {
    id: 'ogg-to-mp3', name: 'OGG 转 MP3', nameEn: 'OGG to MP3',
    description: 'OGG/Vorbis 转 MP3', descriptionEn: 'Convert OGG to MP3',
    category: 'audio', icon: '🎵', tags: ['OGG', 'Vorbis', 'MP3'], pageType: 'generic',
    genericConfig: { accept: 'audio/*,.ogg,.mp3,.wav', outputExt: 'mp3', command: 'to-mp3', showQuality: true },
  },
  {
    id: 'flac-to-wav', name: 'FLAC 转 WAV', nameEn: 'FLAC to WAV',
    description: 'FLAC 转 WAV，专业兼容', descriptionEn: 'Convert FLAC to WAV',
    category: 'audio', icon: '💿', tags: ['FLAC', 'WAV', '无损'], pageType: 'generic',
    genericConfig: { accept: 'audio/*,.flac,.wav,.mp3', outputExt: 'wav', command: 'to-wav' },
  },
  {
    id: 'ogg-to-wav', name: 'OGG 转 WAV', nameEn: 'OGG to WAV',
    description: 'OGG 转 WAV 无损', descriptionEn: 'Convert OGG to WAV',
    category: 'audio', icon: '💿', tags: ['OGG', 'WAV', '无损'], pageType: 'generic',
    genericConfig: { accept: 'audio/*,.ogg,.wav,.mp3', outputExt: 'wav', command: 'to-wav' },
  },
  {
    id: 'mp3-to-ogg', name: 'MP3 转 OGG', nameEn: 'MP3 to OGG',
    description: '转 OGG(Opus)，体积更小', descriptionEn: 'Convert to OGG Opus',
    category: 'audio', icon: '🎵', tags: ['MP3', 'OGG', 'Opus'], pageType: 'generic',
    genericConfig: { accept: 'audio/*,.mp3,.wav,.flac,.ogg,.m4a', outputExt: 'ogg', command: 'to-ogg' },
  },
  {
    id: 'wav-to-ogg', name: 'WAV 转 OGG', nameEn: 'WAV to OGG',
    description: 'WAV 压缩为 OGG', descriptionEn: 'Compress WAV to OGG',
    category: 'audio', icon: '🎵', tags: ['WAV', 'OGG', 'Opus'], pageType: 'generic',
    genericConfig: { accept: 'audio/*,.wav,.mp3,.flac,.ogg', outputExt: 'ogg', command: 'to-ogg' },
  },
  {
    id: 'wav-to-flac', name: 'WAV 转 FLAC', nameEn: 'WAV to FLAC',
    description: 'WAV 无损转 FLAC，体积缩小40-60%', descriptionEn: 'Convert WAV to FLAC',
    category: 'audio', icon: '💿', tags: ['WAV', 'FLAC', '无损'], pageType: 'generic',
    genericConfig: { accept: 'audio/*,.wav,.flac,.mp3', outputExt: 'flac', command: 'to-flac' },
  },
  {
    id: 'mp3-to-flac', name: 'MP3 转 FLAC', nameEn: 'MP3 to FLAC',
    description: '转封装为 FLAC', descriptionEn: 'Convert MP3 to FLAC',
    category: 'audio', icon: '💿', tags: ['MP3', 'FLAC', '格式统一'], pageType: 'generic',
    genericConfig: { accept: 'audio/*,.mp3,.flac,.wav', outputExt: 'flac', command: 'to-flac' },
  },
  {
    id: 'ogg-to-flac', name: 'OGG 转 FLAC', nameEn: 'OGG to FLAC',
    description: 'OGG 转 FLAC，兼容更广', descriptionEn: 'Convert OGG to FLAC',
    category: 'audio', icon: '💿', tags: ['OGG', 'FLAC', '兼容'], pageType: 'generic',
    genericConfig: { accept: 'audio/*,.ogg,.flac,.wav,.mp3', outputExt: 'flac', command: 'to-flac' },
  },
  {
    id: 'audio-trimmer', name: '音频剪辑', nameEn: 'Audio Trimmer',
    description: '可视化时间轴裁剪音频', descriptionEn: 'Trim audio with timeline',
    category: 'audio', icon: '✂️', tags: ['MP3', 'WAV', 'OGG', 'FLAC'], pageType: 'special',
  },
  {
    id: 'audio-merger', name: '音频合并', nameEn: 'Audio Merger',
    description: '多个音频按顺序拼接', descriptionEn: 'Merge multiple audio files',
    category: 'audio', icon: '🔗', tags: ['MP3', 'WAV', 'OGG', 'FLAC'], pageType: 'special',
  },
  {
    id: 'audio-compress', name: '音频压缩', nameEn: 'Audio Compressor',
    description: '降低码率，减小体积', descriptionEn: 'Compress audio file size',
    category: 'audio', icon: '🗜️', tags: ['MP3', 'WAV', '体积压缩'], pageType: 'special',
  },
]

export function getToolById(id: string): ToolMeta | undefined {
  return TOOLS.find(t => t.id === id)
}

export function getToolsByCategory(category: ToolCategory): ToolMeta[] {
  return TOOLS.filter(t => t.category === category)
}

export const TOTAL_TOOLS = TOOLS.length
