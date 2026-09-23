/**
 * FFmpeg.wasm 引擎封装
 * 负责复杂滤镜、格式转换、水印、字幕等操作
 */
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'

let ffmpegInstance: FFmpeg | null = null
let loadPromise: Promise<void> | null = null

const FFMEPG_VERSION = '0.12.10'

export async function getFFmpeg(): Promise<FFmpeg> {
  if (ffmpegInstance?.loaded) return ffmpegInstance
  if (loadPromise) {
    await loadPromise
    return ffmpegInstance!
  }

  loadPromise = (async () => {
    const ffmpeg = new FFmpeg()
    ffmpegInstance = ffmpeg

    ffmpeg.on('log', ({ message }) => {
      console.debug('[ffmpeg]', message)
    })

    const baseURL = `https://unpkg.com/@ffmpeg/core@${FFMEPG_VERSION}/dist/umd`
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    })
  })()

  await loadPromise
  return ffmpegInstance!
}

export interface FFmpegProgress {
  progress: number
  time: number
}

export function onFFmpegProgress(cb: (p: FFmpegProgress) => void) {
  if (!ffmpegInstance) return
  ffmpegInstance.on('progress', ({ progress, time }) => {
    cb({ progress: Math.min(progress, 1), time })
  })
}

export interface FFmpegTask {
  inputFiles: { name: string; file: File | Blob }[]
  args: string[]
  outputName: string
  onProgress?: (p: FFmpegProgress) => void
}

export async function runFFmpegTask(task: FFmpegTask): Promise<Blob> {
  const ffmpeg = await getFFmpeg()

  // 清理旧文件
  try {
    await ffmpeg.deleteFile(task.outputName)
  } catch {}

  // 写入输入文件
  for (const input of task.inputFiles) {
    await ffmpeg.writeFile(input.name, await fetchFile(input.file))
  }

  // 进度回调
  if (task.onProgress) {
    ffmpeg.on('progress', ({ progress, time }) => {
      task.onProgress!({ progress: Math.min(progress, 1), time })
    })
  }

  // 执行
  await ffmpeg.exec(task.args)

  // 读取输出
  const data = await ffmpeg.readFile(task.outputName)
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
    mp4: 'video/mp4',
    webm: 'video/webm',
    mov: 'video/quicktime',
    mkv: 'video/x-matroska',
    avi: 'video/x-msvideo',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    aac: 'audio/aac',
    ogg: 'audio/ogg',
    flac: 'audio/flac',
    m4a: 'audio/mp4',
    gif: 'image/gif',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
    srt: 'text/plain',
    vtt: 'text/vtt',
    txt: 'text/plain',
  }
  return map[ext || ''] || 'application/octet-stream'
}

/** 检查浏览器是否支持 SharedArrayBuffer（ffmpeg多线程需要） */
export function checkSharedArrayBuffer(): boolean {
  return typeof SharedArrayBuffer !== 'undefined'
}
