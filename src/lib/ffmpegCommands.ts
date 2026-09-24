/**
 * FFmpeg 命令生成器
 * 根据工具类型和参数生成 ffmpeg 命令行参数
 */
import { GenericToolConfig } from '../data/tools'

export interface CommandParams {
  [key: string]: string | number | boolean
}

/**
 * 生成 atempo 滤镜串。
 * atempo 单次只接受 0.5~100 的取值，超出范围必须串联多个 atempo。
 * 例：0.25x 慢放 => "atempo=0.5,atempo=0.5"
 */
function buildAtempoFilter(speed: number): string {
  const parts: string[] = []
  let remaining = speed
  while (remaining < 0.5) { parts.push('atempo=0.5'); remaining /= 0.5 }
  while (remaining > 100) { parts.push('atempo=100'); remaining /= 100 }
  parts.push(`atempo=${Number(remaining.toFixed(4))}`)
  return parts.join(',')
}

export function generateFFmpegArgs(
  command: string,
  inputName: string,
  outputName: string,
  params: CommandParams = {},
): string[] {
  switch (command) {
    case 'to-mp4':
      return ['-i', inputName, '-c:v', 'libx264', '-preset', 'fast', '-crf', '23', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', outputName]

    case 'to-mov':
      return ['-i', inputName, '-c:v', 'libx264', '-preset', 'fast', '-crf', '23', '-c:a', 'aac', '-b:a', '192k', outputName]

    // ⚠️ 这里只作为「WebCodecs 不可用」时的降级路径，必须用 wasm 里实测稳定的编码器：
    //   libvpx-vp9 与 libopus 在 @ffmpeg/core 0.12.x 中会越界访问 wasm 内存
    //   （线上报 RuntimeError: memory access out of bounds，实测直接 SIGSEGV），
    //   而 libvpx(VP8) / libvorbis 稳定。正常路径请走 src/lib/webcodecs.ts 的原生转码。
    case 'to-webm':
      return ['-i', inputName, '-c:v', 'libvpx', '-crf', '30', '-b:v', '0', '-c:a', 'libvorbis', '-b:a', '128k', outputName]

    case 'gif-to-mp4':
      return ['-i', inputName, '-movflags', '+faststart', '-pix_fmt', 'yuv420p', '-c:v', 'libx264', outputName]

    case 'to-mp3': {
      const quality = params.quality ? String(params.quality) : '192k'
      return ['-i', inputName, '-vn', '-acodec', 'libmp3lame', '-b:a', quality, outputName]
    }

    case 'to-wav':
      return ['-i', inputName, '-vn', '-acodec', 'pcm_s16le', outputName]

    case 'to-ogg':
      // 同 to-webm：libopus 在 wasm 内核中不可用，降级用 libvorbis（OGG 原生编码器）
      return ['-i', inputName, '-vn', '-acodec', 'libvorbis', '-b:a', '128k', outputName]

    case 'to-flac':
      return ['-i', inputName, '-vn', '-acodec', 'flac', outputName]

    case 'mute':
      return ['-i', inputName, '-an', '-c:v', 'copy', '-movflags', '+faststart', outputName]

    case 'rotate': {
      const angle = params.angle || '90'
      const transpose = angle === '90' ? '1' : angle === '180' ? '1,transpose=1' : '2'
      return ['-i', inputName, '-vf', `transpose=${transpose}`, '-c:a', 'copy', '-movflags', '+faststart', outputName]
    }

    case 'flip': {
      const dir = params.direction || 'horizontal'
      const filter = dir === 'horizontal' ? 'hflip' : dir === 'vertical' ? 'vflip' : 'hflip,vflip'
      return ['-i', inputName, '-vf', filter, '-c:a', 'copy', '-movflags', '+faststart', outputName]
    }

    case 'speed': {
      const speed = parseFloat(String(params.speed || '2'))
      // setpts：speed>1 时 pts 变小 => 变快；speed<1 时 pts 变大 => 变慢
      const videoSpeed = `setpts=${(1 / speed).toFixed(4)}*PTS`
      // atempo 必须与视频同向变化。此前写成 speed > 1 ? speed : 1/speed，
      // 导致所有慢放档位（0.25x / 0.5x）音频反而被加速，音画严重不同步。
      const audioSpeed = buildAtempoFilter(speed)
      // 使用 -vf/-af 而不是 -filter_complex：无音轨的视频上 [0:a] 会直接失败
      // （Stream specifier ':a' ... matches no streams），而 -af 在没有音频流时会被忽略。
      return ['-i', inputName, '-vf', videoSpeed, '-af', audioSpeed, '-c:v', 'libx264', '-preset', 'fast', '-c:a', 'aac', '-movflags', '+faststart', outputName]
    }

    case 'reverse':
      return ['-i', inputName, '-vf', 'reverse', '-af', 'areverse', '-c:v', 'libx264', '-preset', 'fast', '-c:a', 'aac', '-movflags', '+faststart', outputName]

    case 'fps': {
      const fps = params.fps || '30'
      return ['-i', inputName, '-r', String(fps), '-c:v', 'libx264', '-preset', 'fast', '-c:a', 'copy', '-movflags', '+faststart', outputName]
    }

    default:
      // 通用转码
      return ['-i', inputName, '-c:v', 'libx264', '-preset', 'fast', '-crf', '23', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', outputName]
  }
}

/** 质量选项 */
export const QUALITY_OPTIONS = [
  { value: '320k', label: '320 kbps (极高)' },
  { value: '256k', label: '256 kbps (高)' },
  { value: '192k', label: '192 kbps (标准)' },
  { value: '128k', label: '128 kbps (紧凑)' },
  { value: '96k', label: '96 kbps (极小)' },
]
