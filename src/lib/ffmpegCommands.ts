/**
 * FFmpeg 命令生成器
 * 根据工具类型和参数生成 ffmpeg 命令行参数
 */
import { GenericToolConfig } from '../data/tools'

export interface CommandParams {
  [key: string]: string | number | boolean
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

    case 'to-webm':
      return ['-i', inputName, '-c:v', 'libvpx-vp9', '-crf', '30', '-b:v', '0', '-c:a', 'libopus', '-b:a', '128k', outputName]

    case 'gif-to-mp4':
      return ['-i', inputName, '-movflags', '+faststart', '-pix_fmt', 'yuv420p', '-c:v', 'libx264', outputName]

    case 'to-mp3': {
      const quality = params.quality ? String(params.quality) : '192k'
      return ['-i', inputName, '-vn', '-acodec', 'libmp3lame', '-b:a', quality, outputName]
    }

    case 'to-wav':
      return ['-i', inputName, '-vn', '-acodec', 'pcm_s16le', outputName]

    case 'to-ogg':
      return ['-i', inputName, '-vn', '-acodec', 'libopus', '-b:a', '128k', outputName]

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
      const atempo = speed > 1 ? speed : 1 / speed
      // ffmpeg setpts 加速：speed>1 时 pts 减小
      const videoSpeed = speed > 1 ? `setpts=${(1/speed).toFixed(4)}*PTS` : `setpts=${(1/speed).toFixed(4)}*PTS`
      const audioSpeed = `atempo=${atempo}`
      return ['-i', inputName, '-filter_complex', `[0:v]${videoSpeed}[v];[0:a]${audioSpeed}[a]`, '-map', '[v]', '-map', '[a]', '-c:v', 'libx264', '-preset', 'fast', '-c:a', 'aac', '-movflags', '+faststart', outputName]
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
