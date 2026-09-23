/**
 * FFmpeg.wasm 引擎封装（v4 混合托管修复版）
 * core.js 本地自托管（同源稳定），wasm 从 CDN 直接加载（避开 CF 25MB 限制）
 * 多 CDN fallback + 详细错误诊断
 */
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'

let ffmpegInstance: FFmpeg | null = null
let loadPromise: Promise<void> | null = null
let loadFailed = false

const FFMEPG_CORE_VERSION = '0.12.10'

// core.js 本地自托管（esm版本，110KB，同源无跨域问题）
// 注意：必须用esm版本，因为ffmpeg.wasm的worker是type:"module"，umd版本没有default export
const LOCAL_CORE_URL = '/ffmpeg-core/ffmpeg-core.js'

// wasm CDN 列表（esm路径，wasm文件与umd版本相同）
const WASM_CDNS = [
  `https://unpkg.com/@ffmpeg/core@${FFMEPG_CORE_VERSION}/dist/esm/ffmpeg-core.wasm`,
  `https://cdn.jsdelivr.net/npm/@ffmpeg/core@${FFMEPG_CORE_VERSION}/dist/esm/ffmpeg-core.wasm`,
  `https://fastly.jsdelivr.net/npm/@ffmpeg/core@${FFMEPG_CORE_VERSION}/dist/esm/ffmpeg-core.wasm`,
]

// 完整 CDN fallback（core+wasm 都从 CDN esm版本）
const FULL_CDNS = [
  `https://unpkg.com/@ffmpeg/core@${FFMEPG_CORE_VERSION}/dist/esm`,
  `https://cdn.jsdelivr.net/npm/@ffmpeg/core@${FFMEPG_CORE_VERSION}/dist/esm`,
]

function formatError(e: any): string {
  if (!e) return '未知错误（null/undefined）'
  if (e.message) return e.message
  if (typeof e === 'string') return e
  try { return JSON.stringify(e) } catch { return String(e) }
}

export async function getFFmpeg(): Promise<FFmpeg> {
  if (ffmpegInstance?.loaded && !loadFailed) return ffmpegInstance

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
    let lastError: any = null
    let attempt = 0

    // === 策略1：本地 core.js + CDN wasm（直接 URL）===
    for (const wasmURL of WASM_CDNS) {
      attempt++
      try {
        const ffmpeg = new FFmpeg()
        ffmpegInstance = ffmpeg
        console.log(`[ffmpeg] 尝试 ${attempt}: 本地core + ${wasmURL}`)

        await ffmpeg.load({
          coreURL: LOCAL_CORE_URL,
          wasmURL: wasmURL,
        })

        console.log(`[ffmpeg] 加载成功 ✓ (本地core + CDN wasm)`)
        lastError = null
        return
      } catch (e: any) {
        lastError = e
        console.warn(`[ffmpeg] 策略1失败 (${wasmURL}):`, formatError(e))
        ffmpegInstance = new FFmpeg()
      }
    }

    // === 策略2：本地 core.js + CDN wasm（toBlobURL）===
    for (const wasmURL of WASM_CDNS.slice(0, 2)) {
      attempt++
      try {
        const ffmpeg = new FFmpeg()
        ffmpegInstance = ffmpeg
        console.log(`[ffmpeg] 尝试 ${attempt}: 本地core + toBlobURL(${wasmURL})`)

        const blobWasm = await toBlobURL(wasmURL, 'application/wasm')
        await ffmpeg.load({
          coreURL: LOCAL_CORE_URL,
          wasmURL: blobWasm,
        })

        console.log(`[ffmpeg] 加载成功 ✓ (本地core + toBlobURL wasm)`)
        lastError = null
        return
      } catch (e: any) {
        lastError = e
        console.warn(`[ffmpeg] 策略2失败:`, formatError(e))
        ffmpegInstance = new FFmpeg()
      }
    }

    // === 策略3：全部从 CDN（toBlobURL）===
    for (const baseURL of FULL_CDNS) {
      attempt++
      try {
        const ffmpeg = new FFmpeg()
        ffmpegInstance = ffmpeg
        console.log(`[ffmpeg] 尝试 ${attempt}: 全CDN toBlobURL (${baseURL})`)

        await ffmpeg.load({
          coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
          wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        })

        console.log(`[ffmpeg] 加载成功 ✓ (全CDN)`)
        lastError = null
        return
      } catch (e: any) {
        lastError = e
        console.warn(`[ffmpeg] 策略3失败 (${baseURL}):`, formatError(e))
        ffmpegInstance = new FFmpeg()
      }
    }

    // 全部失败
    loadFailed = true
    loadPromise = null
    const errDetail = formatError(lastError)
    throw new Error(
      `FFmpeg 引擎加载失败（已尝试 ${attempt} 种方式）。\n\n` +
      `最后错误: ${errDetail}\n\n` +
      `排查建议：\n` +
      `1. 按 F12 打开控制台，查看 Console 和 Network 标签的具体错误\n` +
      `2. 确认浏览器支持 WebAssembly（Chrome/Edge/Firefox 最新版）\n` +
      `3. 检查网络是否能访问 unpkg.com / jsdelivr.net\n` +
      `4. 尝试刷新页面或清除缓存后重试\n` +
      `5. 如使用公司网络/代理，可能拦截了 wasm 文件下载`
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
  toolId?: string
}

export async function runFFmpegTask(task: FFmpegTask): Promise<Blob> {
  const ffmpeg = await getFFmpeg()

  try { await ffmpeg.deleteFile(task.outputName) } catch {}

  for (const input of task.inputFiles) {
    try {
      await ffmpeg.writeFile(input.name, await fetchFile(input.file))
    } catch (e: any) {
      throw new Error(`写入输入文件失败: ${input.name} - ${e?.message || e}`)
    }
  }

  if (task.onProgress) {
    ffmpeg.on('progress', ({ progress, time }) => {
      task.onProgress!({ progress: Math.min(Math.max(progress, 0), 1), time })
    })
  }

  let lastLogs: string[] = []
  ffmpeg.on('log', ({ message }) => {
    lastLogs.push(message)
    if (lastLogs.length > 30) lastLogs.shift()
  })

  try {
    console.log('[ffmpeg] 执行命令:', task.args.join(' '))
    const exitCode = await ffmpeg.exec(task.args)

    if (exitCode !== 0) {
      throw new Error(`FFmpeg 退出码: ${exitCode}\n最近日志:\n${lastLogs.slice(-8).join('\n')}`)
    }
  } catch (e: any) {
    for (const input of task.inputFiles) {
      try { await ffmpeg.deleteFile(input.name) } catch {}
    }

    const errMsg = e?.message || String(e)
    const cmdStr = task.args.join(' ')

    // 分类错误，给出针对性建议
    let userMessage = ''
    if (errMsg.includes('memory access out of bounds') || errMsg.includes('RuntimeError')) {
      userMessage =
        `处理失败：内存访问越界（memory access out of bounds）\n\n` +
        `这是 ffmpeg.wasm 的已知限制，常见原因：\n` +
        `1. 视频编码/格式不被 wasm 版本支持（如某些 HEVC、AV1、ProRes）\n` +
        `2. 视频分辨率过高或文件过大\n` +
        `3. 某些滤镜组合触发 wasm bug\n\n` +
        `建议：\n` +
        `• 先用「无损转封装」工具转为 MP4 后再处理\n` +
        `• 尝试降低视频分辨率后再处理\n` +
        `• 换用「视频格式转换」工具先转码\n\n` +
        `技术详情：${errMsg.slice(0, 200)}\n` +
        `执行命令：${cmdStr.slice(0, 200)}`
    } else if (errMsg.includes('Invalid data found') || errMsg.includes('Invalid argument')) {
      userMessage =
        `处理失败：无法识别文件格式或参数无效\n\n` +
        `可能原因：文件损坏、格式不支持、或参数组合有误\n` +
        `建议：先用「视频格式转换」转为标准 MP4 后再处理\n\n` +
        `技术详情：${errMsg.slice(0, 200)}`
    } else if (errMsg.includes('Permission denied') || errMsg.includes('Operation not permitted')) {
      userMessage =
        `处理失败：文件访问权限问题\n\n` +
        `建议：刷新页面后重试，或重新上传文件\n\n` +
        `技术详情：${errMsg.slice(0, 200)}`
    } else {
      userMessage =
        `处理失败：${errMsg.slice(0, 300)}\n\n` +
        `提示：某些视频格式/编码可能不被支持，请尝试先用「无损转封装」或「视频格式转换」转为 MP4 后再处理。\n` +
        `执行命令：${cmdStr.slice(0, 200)}`
    }

    throw new Error(userMessage)
  }

  let data
  try {
    data = await ffmpeg.readFile(task.outputName)
  } catch (e: any) {
    throw new Error(`读取输出文件失败: ${e?.message || e}`)
  }

  const blob = new Blob([new Uint8Array(data as Uint8Array)], { type: getMimeType(task.outputName) })

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

export function checkSharedArrayBuffer(): boolean {
  return typeof SharedArrayBuffer !== 'undefined'
}

export function resetFFmpeg() {
  ffmpegInstance = null
  loadPromise = null
  loadFailed = false
}
