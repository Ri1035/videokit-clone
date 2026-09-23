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
