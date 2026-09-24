/**
 * 浏览器原生 WebCodecs 转码（基于 mediabunny，MPL-2.0）
 *
 * 为什么需要它：
 *   `@ffmpeg/core@0.12.x` 的 **libvpx-vp9** 与 **libopus** 编码器在 wasm 中会执行越界内存访问。
 *   线上表现为 `RuntimeError: memory access out of bounds`；实测在 Chromium 中直接触发
 *   `Received signal 11 SEGV_ACCERR`（渲染进程崩溃）。已用给定样例视频验证：
 *   - libvpx-vp9：单帧可编码，多帧必崩
 *   - libopus：任何参数组合都崩
 *   - libvpx(VP8) / libvorbis / libx264 / libmp3lame / 无损转封装：稳定
 *   因此「MP4 → WebM」「→ OGG」这两条链路在 ffmpeg.wasm 下必然失败，不是参数问题。
 *
 * 方案：
 *   优先使用浏览器原生 WebCodecs（无 wasm 堆限制，多数平台走硬件加速，快一个数量级）；
 *   不支持 WebCodecs 的浏览器回退到 ffmpeg.wasm 的 VP8 + Vorbis（实测稳定）。
 *
 * mediabunny 体积较大（约 1.2MB），因此全部改为动态 import，不进主包。
 */

export type NativeContainer = 'webm' | 'ogg'

/**
 * 原生转码的视频质量档位（mediabunny 的 0~1 质量标度：very-low=0 / low=0.25 /
 * medium=0.5 / high=0.75 / very-high=1）。
 * 配合 preferBitrate 使用，会按分辨率换算出目标码率。
 */
const QUALITY = 'medium' as const

/** 便宜的同步能力探测：用于决定是否值得走原生管线（真正的编码器可用性在 transcodeNative 内确认） */
export function webCodecsSupported(): boolean {
  const g = globalThis as unknown as { VideoEncoder?: unknown; AudioEncoder?: unknown }
  return typeof g.VideoEncoder !== 'undefined' && typeof g.AudioEncoder !== 'undefined'
}

export interface TranscodeNativeOptions {
  file: Blob
  container: NativeContainer
  /** 0~1 的进度回调 */
  onProgress?: (progress: number) => void
}

/**
 * 用 WebCodecs 把输入媒体转成 WebM(VP9/Opus) 或 OGG(Opus)。
 * 编码器不可用或输入无法解码时抛出错误，由调用方决定是否回退。
 */
export async function transcodeNative(opts: TranscodeNativeOptions): Promise<Blob> {
  const {
    Input, Output, BlobSource, BufferTarget,
    WebMOutputFormat, OggOutputFormat, ALL_FORMATS, Conversion, Quality,
    getFirstEncodableVideoCodec, getFirstEncodableAudioCodec,
  } = await import('mediabunny')

  const input = new Input({ source: new BlobSource(opts.file), formats: ALL_FORMATS })

  const videoTrack = await input.getPrimaryVideoTrack()
  const audioTrack = await input.getPrimaryAudioTrack()

  const video = videoTrack && opts.container === 'webm'
    ? await getFirstEncodableVideoCodec(['vp9', 'vp8'], {
        width: await videoTrack.getCodedWidth(),
        height: await videoTrack.getCodedHeight(),
      })
    : null
  const audio = audioTrack
    ? await getFirstEncodableAudioCodec(['opus'], {
        numberOfChannels: await audioTrack.getNumberOfChannels(),
        sampleRate: await audioTrack.getSampleRate(),
      })
    : null

  // WebM 需要视频编码器；如果源里有视频轨但浏览器编不了 VP9/VP8，
  // 直接抛错让上层回退 ffmpeg.wasm（VP8），而不是静默丢掉画面产出「只有声音」的文件。
  if (opts.container === 'webm' && videoTrack && !video) {
    throw new Error('浏览器不支持 VP9/VP8 编码')
  }
  if (audioTrack && !audio) {
    throw new Error('浏览器不支持 Opus 编码')
  }
  if (!video && !audio) {
    throw new Error('浏览器原生编码器不可用（VP9/VP8/Opus 均不支持）')
  }

  const target = new BufferTarget()
  const output = new Output({
    format: opts.container === 'webm' ? new WebMOutputFormat() : new OggOutputFormat(),
    target,
  })

  const conversion = await Conversion.init({
    input,
    output,
    // ⚠️ mediabunny 的 quality 必须是 Quality 实例，传字符串会抛
    //   TypeError: options.video.quality, when provided, must be a Quality
    // 之前传 'medium' 导致原生路径永远失败、静默回退到慢速的 ffmpeg.wasm。
    // 另外必须带 preferBitrate：否则 mediabunny 走「逐帧 quantizer」模式，
    // 而 Chromium 的 VP9 编码器并不真正吃 vp9.quantizer，实测会退化成 ~3.8Mbps，
    // 10s 素材产出 4.7MB（比 1.4MB 的源文件还大）。preferBitrate 会按
    // 「分辨率 + 质量档位」算出目标码率，输出体积可控且符合「体积更小」的定位。
    video: video
      ? { codec: video, quality: new Quality({ quality: QUALITY, preferBitrate: true }) }
      : { discard: true },
    audio: audio ? { codec: audio } : { discard: true },
    showWarnings: false,
  })
  if (!conversion.isValid) {
    const reasons = conversion.discardedTracks.map((d) => `${d.track.type}:${d.reason}`).join(', ')
    throw new Error(`原生转码配置无效${reasons ? `（${reasons}）` : ''}`)
  }
  if (opts.onProgress) conversion.onProgress = (p) => opts.onProgress!(p)

  await conversion.execute()

  if (!target.buffer) throw new Error('原生转码未产出数据')
  return new Blob([target.buffer], {
    type: opts.container === 'webm' ? 'video/webm' : 'audio/ogg',
  })
}

/**
 * 统一的「WebM / OGG 导出」入口：原生 WebCodecs 优先，不可用或失败时回退到传入的 ffmpeg 任务。
 */
export async function transcodeWithFallback(params: {
  file: Blob
  container: NativeContainer
  onProgress?: (progress: number) => void
  ffmpegFallback: () => Promise<Blob>
}): Promise<Blob> {
  if (webCodecsSupported()) {
    try {
      return await transcodeNative({
        file: params.file,
        container: params.container,
        onProgress: params.onProgress,
      })
    } catch (e) {
      console.warn('[webcodecs] 原生转码失败，回退 ffmpeg.wasm：', e)
    }
  }
  return params.ffmpegFallback()
}