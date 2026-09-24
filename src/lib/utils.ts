/**
 * 工具函数库
 */

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || ''
}

export function replaceExtension(filename: string, newExt: string): string {
  const parts = filename.split('.')
  parts.pop()
  return parts.join('.') + '.' + newExt
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as ArrayBuffer)
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 10)
}

/**
 * 把文字渲染成透明 PNG 图层，供 ffmpeg 的 overlay 滤镜合成。
 *
 * 为什么不用 drawtext：@ffmpeg/core 的 wasm 文件系统里没有任何字体，
 * drawtext 会直接 "Error initializing filter 'drawtext'" 而无法工作；
 * 若自带字体则要为中文支持背上 20MB+ 的 CJK 字体，且还要塞进 wasm 内存。
 * 改用浏览器 Canvas 渲染，直接复用系统字体（含中文），零额外体积。
 */
export function renderTextToPng(opts: {
  text: string
  fontSize: number
  color: string
  shadow?: boolean
}): Promise<Blob> {
  const { text, fontSize, color, shadow } = opts
  const pad = Math.ceil(fontSize * 0.4)
  const font = `${fontSize}px system-ui, -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif`
  const canvas = document.createElement('canvas')
  const probe = canvas.getContext('2d')!
  probe.font = font
  const textW = Math.ceil(probe.measureText(text).width)
  canvas.width = Math.max(textW + pad * 2, fontSize)
  canvas.height = Math.ceil(fontSize * 1.35) + pad * 2

  // 调整尺寸会重置 2D 上下文，字体等设置必须在这之后重新应用
  const ctx = canvas.getContext('2d')!
  ctx.font = font
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = color
  if (shadow) {
    ctx.shadowColor = 'rgba(0,0,0,0.5)'
    ctx.shadowBlur = 2
    ctx.shadowOffsetX = 2
    ctx.shadowOffsetY = 2
  }
  ctx.fillText(text, pad, canvas.height / 2)

  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('文字图层渲染失败'))), 'image/png')
  })
}

export const VIDEO_EXTENSIONS = ['mp4', 'webm', 'mov', 'mkv', 'avi', 'flv', 'wmv', 'm4v', '3gp']
export const AUDIO_EXTENSIONS = ['mp3', 'wav', 'aac', 'ogg', 'flac', 'm4a', 'wma', 'opus']
export const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp']

export function isVideoFile(file: File): boolean {
  return VIDEO_EXTENSIONS.includes(getFileExtension(file.name)) || file.type.startsWith('video/')
}

export function isAudioFile(file: File): boolean {
  return AUDIO_EXTENSIONS.includes(getFileExtension(file.name)) || file.type.startsWith('audio/')
}

export function isImageFile(file: File): boolean {
  return IMAGE_EXTENSIONS.includes(getFileExtension(file.name)) || file.type.startsWith('image/')
}
