/**
 * 简单参数型特殊工具
 * 包含：视频格式转换、无损转封装、提取音频、视频压缩、尺寸调整、音频压缩、去除字幕
 */
import { useState } from 'react'
import ToolShell from '../components/ToolShell'
import FileUpload from '../components/FileUpload'
import { useToolProcessor } from '../components/useToolProcessor'
import { getToolById } from '../data/tools'
import { useI18n } from '../i18n'
import { QUALITY_OPTIONS } from '../lib/ffmpegCommands'

/* ========== 视频格式转换 ========== */
export function VideoConverter() {
  const tool = getToolById('video-converter')!
  const { t } = useI18n()
  const [file, setFile] = useState<File | null>(null)
  const [format, setFormat] = useState('mp4')
  const { processing, result, process, reset, ResultView, ProgressView, ErrorView } = useToolProcessor()

  const formats = [
    { value: 'mp4', label: 'MP4 (H.264 + AAC)' },
    { value: 'webm', label: 'WebM (VP9 + Opus)' },
    { value: 'mov', label: 'MOV (H.264 + AAC)' },
    { value: 'mkv', label: 'MKV (H.264 + AAC)' },
    { value: 'avi', label: 'AVI (MPEG4 + MP3)' },
  ]

  const handleStart = () => {
    if (!file) return
    const inputName = `input_${Date.now()}.${file.name.split('.').pop()}`
    process({
      outputExt: format,
      inputFiles: [{ name: inputName, file }],
      // WebM 必须走原生 WebCodecs：ffmpeg.wasm 的 libvpx-vp9 / libopus 会越界崩
      native: format === 'webm' ? 'webm' : undefined,
      buildArgs: (inp, out) => {
        if (format === 'mp4') return ['-i', inp[0], '-c:v', 'libx264', '-preset', 'fast', '-crf', '23', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', out]
        // 降级路径（WebCodecs 不可用时）：VP8 + Vorbis，wasm 内实测稳定
        if (format === 'webm') return ['-i', inp[0], '-c:v', 'libvpx', '-crf', '30', '-b:v', '0', '-c:a', 'libvorbis', '-b:a', '128k', out]
        if (format === 'mov') return ['-i', inp[0], '-c:v', 'libx264', '-preset', 'fast', '-crf', '23', '-c:a', 'aac', '-b:a', '192k', out]
        if (format === 'mkv') return ['-i', inp[0], '-c:v', 'libx264', '-preset', 'fast', '-crf', '23', '-c:a', 'aac', '-b:a', '192k', out]
        return ['-i', inp[0], '-c:v', 'mpeg4', '-q:v', '5', '-c:a', 'libmp3lame', '-b:a', '192k', out]
      },
    })
  }

  return (
    <ToolShell tool={tool}>
      <ResultView onReset={() => setFile(null)} />
      {!result && (
        <>
          <FileUpload accept="video/*" selectedFiles={file ? [file] : []}
            onFilesSelected={(f) => { setFile(f[0]); reset() }} onRemove={() => setFile(null)} />
          {file && (
            <div className="mt-5 animate-slide-up">
              <label className="label">{t('outputFormat')}</label>
              <select className="select" value={format} onChange={(e) => setFormat(e.target.value)}>
                {formats.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
              <div className="mt-6 flex gap-3">
                <button onClick={handleStart} disabled={processing} className="btn-primary flex-1">{t('start')}</button>
                <button onClick={() => { setFile(null); reset() }} className="btn-secondary">{t('reset')}</button>
              </div>
            </div>
          )}
          <ProgressView />
          <ErrorView />
        </>
      )}
    </ToolShell>
  )
}

/* ========== 无损转封装 ========== */
export function StreamCopy() {
  const tool = getToolById('stream-copy')!
  const { t } = useI18n()
  const [file, setFile] = useState<File | null>(null)
  const [format, setFormat] = useState('mp4')
  const { processing, process, reset, ResultView, ProgressView, ErrorView } = useToolProcessor()

  const handleStart = () => {
    if (!file) return
    const inputName = `input_${Date.now()}.${file.name.split('.').pop()}`
    process({
      outputExt: format,
      inputFiles: [{ name: inputName, file }],
      buildArgs: (inp, out) => ['-i', inp[0], '-c', 'copy', '-movflags', '+faststart', out],
    })
  }

  return (
    <ToolShell tool={tool}>
      <ResultView onReset={() => setFile(null)} />
      <FileUpload accept="video/*" selectedFiles={file ? [file] : []}
        onFilesSelected={(f) => { setFile(f[0]); reset() }} onRemove={() => setFile(null)} />
      {file && (
        <div className="mt-5 animate-slide-up">
          <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-xl text-xs mb-4">
            ⚡ 无损转封装模式：不重新编码，画质零损失，速度极快
          </div>
          <label className="label">{t('outputFormat')}</label>
          <select className="select" value={format} onChange={(e) => setFormat(e.target.value)}>
            <option value="mp4">MP4</option>
            <option value="mkv">MKV</option>
            <option value="mov">MOV</option>
          </select>
          <div className="mt-6 flex gap-3">
            <button onClick={handleStart} disabled={processing} className="btn-primary flex-1">{t('start')}</button>
            <button onClick={() => { setFile(null); reset() }} className="btn-secondary">{t('reset')}</button>
          </div>
        </div>
      )}
      <ProgressView />
      <ErrorView />
    </ToolShell>
  )
}

/* ========== 提取音频 ========== */
export function ExtractAudio() {
  const tool = getToolById('extract-audio')!
  const { t } = useI18n()
  const [file, setFile] = useState<File | null>(null)
  const [format, setFormat] = useState('mp3')
  const [quality, setQuality] = useState('192k')
  const { processing, process, reset, ResultView, ProgressView, ErrorView } = useToolProcessor()

  const handleStart = () => {
    if (!file) return
    const inputName = `input_${Date.now()}.${file.name.split('.').pop()}`
    process({
      outputExt: format,
      inputFiles: [{ name: inputName, file }],
      // OGG 走原生 WebCodecs（Opus）；降级路径用 libvorbis（wasm 内 libopus 会崩）
      native: format === 'ogg' ? 'ogg' : undefined,
      buildArgs: (inp, out) => {
        if (format === 'mp3') return ['-i', inp[0], '-vn', '-acodec', 'libmp3lame', '-b:a', quality, out]
        if (format === 'wav') return ['-i', inp[0], '-vn', '-acodec', 'pcm_s16le', out]
        if (format === 'aac') return ['-i', inp[0], '-vn', '-acodec', 'aac', '-b:a', quality, out]
        if (format === 'ogg') return ['-i', inp[0], '-vn', '-acodec', 'libvorbis', '-b:a', '128k', out]
        if (format === 'flac') return ['-i', inp[0], '-vn', '-acodec', 'flac', out]
        return ['-i', inp[0], '-vn', '-acodec', 'libmp3lame', '-b:a', quality, out]
      },
    })
  }

  return (
    <ToolShell tool={tool}>
      <ResultView onReset={() => setFile(null)} />
      <FileUpload accept="video/*" selectedFiles={file ? [file] : []}
        onFilesSelected={(f) => { setFile(f[0]); reset() }} onRemove={() => setFile(null)} />
      {file && (
        <div className="mt-5 space-y-4 animate-slide-up">
          <div>
            <label className="label">{t('outputFormat')}</label>
            <select className="select" value={format} onChange={(e) => setFormat(e.target.value)}>
              <option value="mp3">MP3</option>
              <option value="wav">WAV (无损)</option>
              <option value="aac">AAC</option>
              <option value="ogg">OGG (Opus)</option>
              <option value="flac">FLAC (无损)</option>
            </select>
          </div>
          {['mp3', 'aac'].includes(format) && (
            <div>
              <label className="label">{t('quality')}</label>
              <select className="select" value={quality} onChange={(e) => setQuality(e.target.value)}>
                {QUALITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={handleStart} disabled={processing} className="btn-primary flex-1">{t('start')}</button>
            <button onClick={() => { setFile(null); reset() }} className="btn-secondary">{t('reset')}</button>
          </div>
        </div>
      )}
      <ProgressView />
      <ErrorView />
    </ToolShell>
  )
}

/* ========== 视频压缩 ========== */
export function VideoCompress() {
  const tool = getToolById('video-compress')!
  const { t } = useI18n()
  const [file, setFile] = useState<File | null>(null)
  const [level, setLevel] = useState('medium')
  const { processing, process, reset, ResultView, ProgressView, ErrorView } = useToolProcessor()

  const levels = [
    { value: 'low', label: '轻度压缩 (CRF 28)', crf: '28' },
    { value: 'medium', label: '标准压缩 (CRF 32)', crf: '32' },
    { value: 'high', label: '强力压缩 (CRF 36)', crf: '36' },
    { value: 'extreme', label: '极致压缩 (CRF 40)', crf: '40' },
  ]

  const handleStart = () => {
    if (!file) return
    const inputName = `input_${Date.now()}.${file.name.split('.').pop()}`
    const crf = levels.find(l => l.value === level)?.crf || '32'
    process({
      outputExt: 'mp4',
      inputFiles: [{ name: inputName, file }],
      buildArgs: (inp, out) => ['-i', inp[0], '-c:v', 'libx264', '-preset', 'fast', '-crf', crf, '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', out],
    })
  }

  return (
    <ToolShell tool={tool}>
      <ResultView onReset={() => setFile(null)} />
      <FileUpload accept="video/*" selectedFiles={file ? [file] : []}
        onFilesSelected={(f) => { setFile(f[0]); reset() }} onRemove={() => setFile(null)} />
      {file && (
        <div className="mt-5 animate-slide-up">
          <label className="label">压缩强度</label>
          <select className="select" value={level} onChange={(e) => setLevel(e.target.value)}>
            {levels.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>
          <div className="mt-6 flex gap-3">
            <button onClick={handleStart} disabled={processing} className="btn-primary flex-1">{t('start')}</button>
            <button onClick={() => { setFile(null); reset() }} className="btn-secondary">{t('reset')}</button>
          </div>
        </div>
      )}
      <ProgressView />
      <ErrorView />
    </ToolShell>
  )
}

/* ========== 视频尺寸调整 ========== */
export function VideoResize() {
  const tool = getToolById('video-resize')!
  const { t } = useI18n()
  const [file, setFile] = useState<File | null>(null)
  const [preset, setPreset] = useState('original')
  const { processing, process, reset, ResultView, ProgressView, ErrorView } = useToolProcessor()

  const presets = [
    { value: 'original', label: '保持原始', size: '-1:-1' },
    { value: '1080p', label: '1920×1080 (16:9)', size: '1920:1080' },
    { value: '720p', label: '1280×720 (16:9)', size: '1280:720' },
    { value: '480p', label: '854×480 (16:9)', size: '854:480' },
    { value: 'tiktok', label: '1080×1920 (9:16 竖屏)', size: '1080:1920' },
    { value: 'instagram', label: '1080×1080 (1:1 方形)', size: '1080:1080' },
    { value: 'youtube', label: '2560×1440 (16:9)', size: '2560:1440' },
  ]

  const handleStart = () => {
    if (!file) return
    const inputName = `input_${Date.now()}.${file.name.split('.').pop()}`
    const size = presets.find(p => p.value === preset)?.size || '-1:-1'
    process({
      outputExt: 'mp4',
      inputFiles: [{ name: inputName, file }],
      buildArgs: (inp, out) => {
        if (preset === 'original') return ['-i', inp[0], '-c:v', 'libx264', '-preset', 'fast', '-crf', '23', '-c:a', 'copy', '-movflags', '+faststart', out]
        return ['-i', inp[0], '-vf', `scale=${size}:force_original_aspect_ratio=decrease,pad=${size}:(ow-iw)/2:(oh-ih)/2`, '-c:v', 'libx264', '-preset', 'fast', '-crf', '23', '-c:a', 'aac', '-movflags', '+faststart', out]
      },
    })
  }

  return (
    <ToolShell tool={tool}>
      <ResultView onReset={() => setFile(null)} />
      <FileUpload accept="video/*" selectedFiles={file ? [file] : []}
        onFilesSelected={(f) => { setFile(f[0]); reset() }} onRemove={() => setFile(null)} />
      {file && (
        <div className="mt-5 animate-slide-up">
          <label className="label">{t('resolution')}</label>
          <select className="select" value={preset} onChange={(e) => setPreset(e.target.value)}>
            {presets.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
          <div className="mt-6 flex gap-3">
            <button onClick={handleStart} disabled={processing} className="btn-primary flex-1">{t('start')}</button>
            <button onClick={() => { setFile(null); reset() }} className="btn-secondary">{t('reset')}</button>
          </div>
        </div>
      )}
      <ProgressView />
      <ErrorView />
    </ToolShell>
  )
}

/* ========== 音频压缩 ========== */
export function AudioCompress() {
  const tool = getToolById('audio-compress')!
  const { t } = useI18n()
  const [file, setFile] = useState<File | null>(null)
  const [bitrate, setBitrate] = useState('128k')
  const { processing, process, reset, ResultView, ProgressView, ErrorView } = useToolProcessor()

  const handleStart = () => {
    if (!file) return
    const inputName = `input_${Date.now()}.${file.name.split('.').pop()}`
    process({
      outputExt: 'mp3',
      inputFiles: [{ name: inputName, file }],
      buildArgs: (inp, out) => ['-i', inp[0], '-vn', '-acodec', 'libmp3lame', '-b:a', bitrate, out],
    })
  }

  return (
    <ToolShell tool={tool}>
      <ResultView onReset={() => setFile(null)} />
      <FileUpload accept="audio/*" selectedFiles={file ? [file] : []}
        onFilesSelected={(f) => { setFile(f[0]); reset() }} onRemove={() => setFile(null)} />
      {file && (
        <div className="mt-5 animate-slide-up">
          <label className="label">目标码率</label>
          <select className="select" value={bitrate} onChange={(e) => setBitrate(e.target.value)}>
            <option value="64k">64 kbps (极小)</option>
            <option value="96k">96 kbps (很小)</option>
            <option value="128k">128 kbps (标准)</option>
            <option value="192k">192 kbps (较高)</option>
          </select>
          <div className="mt-6 flex gap-3">
            <button onClick={handleStart} disabled={processing} className="btn-primary flex-1">{t('start')}</button>
            <button onClick={() => { setFile(null); reset() }} className="btn-secondary">{t('reset')}</button>
          </div>
        </div>
      )}
      <ProgressView />
      <ErrorView />
    </ToolShell>
  )
}

/* ========== 去除字幕 ========== */
export function RemoveSubtitles() {
  const tool = getToolById('remove-subtitles')!
  const { t } = useI18n()
  const [file, setFile] = useState<File | null>(null)
  const [mode, setMode] = useState('soft')
  const { processing, process, reset, ResultView, ProgressView, ErrorView } = useToolProcessor()

  const handleStart = () => {
    if (!file) return
    const inputName = `input_${Date.now()}.${file.name.split('.').pop()}`
    process({
      outputExt: 'mp4',
      inputFiles: [{ name: inputName, file }],
      buildArgs: (inp, out) => {
        if (mode === 'soft') return ['-i', inp[0], '-c:v', 'copy', '-c:a', 'copy', '-sn', '-movflags', '+faststart', out]
        // 硬字幕：底部 15% 条带做区域模糊。
        // 这里不能用 delogo：它要求常量数值，写 ih*0.85 这类表达式会
        // "Error when parsing the expression 'ih*0.85' for y"，crop 则支持表达式。
        const fc = '[0:v]split[base][b];[b]crop=iw:ih*0.15:0:ih*0.85,boxblur=luma_radius=9:luma_power=2:chroma_radius=4:chroma_power=2[blur];[base][blur]overlay=0:H*0.85[v]'
        return ['-i', inp[0], '-filter_complex', fc, '-map', '[v]', '-map', '0:a?', '-c:v', 'libx264', '-preset', 'fast', '-c:a', 'copy', '-movflags', '+faststart', out]
      },
    })
  }

  return (
    <ToolShell tool={tool}>
      <ResultView onReset={() => setFile(null)} />
      <FileUpload accept="video/*" selectedFiles={file ? [file] : []}
        onFilesSelected={(f) => { setFile(f[0]); reset() }} onRemove={() => setFile(null)} />
      {file && (
        <div className="mt-5 animate-slide-up">
          <label className="label">字幕类型</label>
          <select className="select" value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="soft">软字幕（丢弃字幕轨道）</option>
            <option value="hard">硬字幕（底部区域模糊遮盖）</option>
          </select>
          <div className="mt-6 flex gap-3">
            <button onClick={handleStart} disabled={processing} className="btn-primary flex-1">{t('start')}</button>
            <button onClick={() => { setFile(null); reset() }} className="btn-secondary">{t('reset')}</button>
          </div>
        </div>
      )}
      <ProgressView />
      <ErrorView />
    </ToolShell>
  )
}
