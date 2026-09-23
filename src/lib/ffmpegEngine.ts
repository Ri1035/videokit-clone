/**
 * FFmpeg.wasm 引擎封装（v2 修复版）
 * 修复：加载失败无重试、CDN不稳定、错误信息不明确、单例卡死等问题
 */
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'

let ffmpegInstance: FFmpeg | null = null
let loadPromise: Promise<void> | null = null
let loadFailed = false

const FFMEPG_CORE_VERSION = '0.12.10'

// 多CDN fallback，提高加载成功率
const CDN_BASES = [
  `https://unpkg.com/@ffmpeg/core@${FFMEPG_CORE_VERSION}/dist/umd`,
  `https://cdn.jsdelivr.net/npm/@ffmpeg/core@${FFMEPG_CORE_VERSION}/dist/umd`,
  `https://cdnjs.cloudflare.com/ajax/libs/ffmpeg-core/${FFMEPG_CORE_VERSION}`,
]

export async function getFFmpeg(): Promise<FFmpeg> {
  // 如果已有可用实例，直接返回
  if (ffmpegInstance?.loaded && !loadFailed) return ffmpegInstance

  // 如果之前加载失败，重置状态重试
  if (loadFailed) {
    loadFailed = false
    loadPromise = null
    ffmpegInstance = null
  }

  if (loadPromise) {
    await loadPromise
    if (ffmpegInstance?.loaded) return ffmpegInstance
    throw new Error('FFmpeg 引擎加载失败，请刷新页面重试')
  }

  loadPromise = (async () => {
    const ffmpeg = new FFmpeg()
    ffmpegInstance = ffmpeg

    let lastError: Error | null = null

    // 依次尝试各个CDN
    for (const baseURL of CDN_BASES) {
      try {
        console.log(`[ffmpeg] 尝试从 ${baseURL} 加载引擎...`)

        await ffmpeg.load({
          coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
          wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        })

        console.log('[ffmpeg] 引擎加载成功 ✓')
        lastError = null
        return
      } catch (e: any) {
        lastError = e
        console.warn(`[ffmpeg] 从 ${baseURL} 加载失败:`, e?.message || e)
        // 继续尝试下一个CDN
      }
    }

    // 所有CDN都失败
    loadFailed = true
    loadPromise = null
    throw new Error(
      `FFmpeg 引擎加载失败。可能原因：网络问题、浏览器不支持 WebAssembly、或缺少 COOP/COEP 安全头。\n` +
      `最后错误: ${lastError?.message || '未知错误'}\n` +
      `建议：检查网络连接，或使用 Chrome/Edge 最新版浏览器。`
    )
  })()

  await loadPromise
  return ffmpegInstance!
}

export interface FFmpegProgress {
  progress: number
  time: number
}

export interface FFmpegTask {
  inputFiles: { name: string; file: File | Blob }[]
  args: string[]
  outputName: string
  onProgress?: (p: FFmpegProgress) => void
  /** 工具ID，用于错误日志 */
  toolId?: string
}

/**
 * 生成安全的临时文件名
 * 避免中文/特殊字符导致 ffmpeg 命令解析失败
 */
function safeName(prefix: string, ext: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.${ext}`
}

export async function runFFmpegTask(task: FFmpegTask): Promise<Blob> {
  const ffmpeg = await getFFmpeg()

  // 清理旧的输出文件
  try { await ffmpeg.deleteFile(task.outputName) } catch {}

  // 写入输入文件
  for (const input of task.inputFiles) {
    try {
      await ffmpeg.writeFile(input.name, await fetchFile(input.file))
    } catch (e: any) {
      throw new Error(`写入输入文件失败: ${input.name} - ${e?.message || e}`)
    }
  }

  // 进度回调
  if (task.onProgress) {
    ffmpeg.on('progress', ({ progress, time }) => {
      task.onProgress!({ progress: Math.min(Math.max(progress, 0), 1), time })
    })
  }

  // 日志回调，便于调试
  let lastLogs: string[] = []
  ffmpeg.on('log', ({ message }) => {
    lastLogs.push(message)
    if (lastLogs.length > 20) lastLogs.shift()
  })

  try {
    console.log('[ffmpeg] 执行命令:', task.args.join(' '))
    const exitCode = await ffmpeg.exec(task.args)

    if (exitCode !== 0) {
      throw new Error(`FFmpeg 退出码: ${exitCode}\n最近日志:\n${lastLogs.slice(-5).join('\n')}`)
    }
  } catch (e: any) {
    // 清理输入文件
    for (const input of task.inputFiles) {
      try { await ffmpeg.deleteFile(input.name) } catch {}
    }
    throw new Error(`处理失败: ${e?.message || e}\n\n提示：某些视频格式/编码可能不被支持，请尝试转换为 MP4 后再处理。`)
  }

  // 读取输出
  let data
  try {
    data = await ffmpeg.readFile(task.outputName)
  } catch (e: any) {
    throw new Error(`读取输出文件失败: ${e?.message || e}`)
  }

  const blob = new Blob([new Uint8Array(data as Uint8Array)], { type: getMimeType(task.outputName) })

  // 清理
  for (const input of task.inputFiles) {
    try { await ffmpeg.deleteFile(input.name) } catch {}
  }
  try { await ffmpeg.deleteFile(task.outputName) } catch {}

  return blob
}

function getMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase()
  const map: Record<string, string> = {
    mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime',
    mkv: 'video/x-matroska', avi: 'video/x-msvideo',
    mp3: 'audio/mpeg', wav: 'audio/wav', aac: 'audio/aac',
    ogg: 'audio/ogg', flac: 'audio/flac', m4a: 'audio/mp4',
    gif: 'image/gif', png: 'image/png', jpg: 'image/jpeg',
    jpeg: 'image/jpeg', webp: 'image/webp',
    srt: 'text/plain', vtt: 'text/vtt', txt: 'text/plain',
  }
  return map[ext || ''] || 'application/octet-stream'
}

/** 检查浏览器是否支持 SharedArrayBuffer（ffmpeg多线程需要） */
export function checkSharedArrayBuffer(): boolean {
  return typeof SharedArrayBuffer !== 'undefined'
}

/** 重置引擎状态（用于错误恢复） */
export function resetFFmpeg() {
  ffmpegInstance = null
  loadPromise = null
  loadFailed = false
}
