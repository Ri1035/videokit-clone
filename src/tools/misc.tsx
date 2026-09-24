/**
 * 其他特殊工具
 * 包含：预览图提取、添加背景音乐、Sora2水印
 */
import { useState, useRef, useEffect } from 'react'
import ToolShell from '../components/ToolShell'
import FileUpload from '../components/FileUpload'
import { useToolProcessor } from '../components/useToolProcessor'
import { getToolById } from '../data/tools'
import { useI18n } from '../i18n'
import { runFFmpegTask } from '../lib/ffmpegEngine'
import { downloadBlob, formatFileSize, renderTextToPng } from '../lib/utils'
import ProgressBar from '../components/ProgressBar'

/* ========== 视频预览图提取 ========== */
export function ThumbnailExtract() {
  const tool = getToolById('thumbnail-extract')!
  const { t } = useI18n()
  const [file, setFile] = useState<File | null>(null)
  const [count, setCount] = useState('6')
  const [format, setFormat] = useState('jpg')
  const [processing, setProcessing] = useState(false)
  const [results, setResults] = useState<{ blob: Blob; name: string; url: string }[]>([])
  const [progress, setProgress] = useState(0)

  const handleStart = async () => {
    if (!file) return
    setProcessing(true)
    setResults([])
    setProgress(0)
    const inputName = `input_${Date.now()}.${file.name.split('.').pop()}`
    const n = parseInt(count)

    // 先获取视频时长
    // 简化处理：均匀抽取 n 帧
    for (let i = 0; i < n; i++) {
      setProgress((i + 1) / n)
      const outputName = `frame_${i + 1}.${format}`
      // 估算时间点（假设视频时长，用百分比）
      // ffmpeg 可以用 -vf select 来均匀抽帧，但这里简单处理
      const timestamp = `${(i / n) * 100}%`
      try {
        const blob = await runFFmpegTask({
          inputFiles: [{ name: inputName, file }],
          args: ['-i', inputName, '-vf', `select='eq(n,${i * 30})'`, '-vsync', 'vfr', '-frames:v', '1', outputName],
          outputName,
        })
        const url = URL.createObjectURL(blob)
        setResults(prev => [...prev, { blob, name: `frame_${i + 1}.${format}`, url }])
      } catch {
        // 如果 select 失败，用时间戳方式
        try {
          const blob = await runFFmpegTask({
            inputFiles: [{ name: inputName, file }],
            args: ['-i', inputName, '-ss', timestamp, '-frames:v', '1', outputName],
            outputName,
          })
          const url = URL.createObjectURL(blob)
          setResults(prev => [...prev, { blob, name: `frame_${i + 1}.${format}`, url }])
        } catch {}
      }
    }
    setProcessing(false)
  }

  return (
    <ToolShell tool={tool} maxWidth="max-w-3xl">
      {results.length > 0 && !processing && (
        <div className="animate-slide-up">
          <div className="text-center mb-4">
            <div className="text-4xl mb-2">✅</div>
            <h3 className="text-lg font-bold">提取了 {results.length} 帧</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
            {results.map((r, i) => (
              <div key={i} className="relative group">
                <img src={r.url} alt={r.name} className="w-full rounded-xl object-cover aspect-video bg-gray-100" />
                <button onClick={() => downloadBlob(r.blob, r.name)}
                  className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center text-white text-sm">
                  ⬇ 下载
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-3 justify-center">
            <button onClick={() => results.forEach((r, i) => setTimeout(() => downloadBlob(r.blob, r.name), i * 150))} className="btn-primary">⬇ {t('downloadAll')}</button>
            <button onClick={() => { setResults([]); setFile(null) }} className="btn-secondary">{t('reset')}</button>
          </div>
        </div>
      )}
      {!(results.length > 0 && !processing) && (
        <>
          <FileUpload accept="video/*" selectedFiles={file ? [file] : []}
            onFilesSelected={(f) => { setFile(f[0]); setResults([]) }} onRemove={() => setFile(null)} />
          {file && (
            <div className="mt-5 space-y-4 animate-slide-up">
              <div>
                <label className="label">抽取帧数</label>
                <select className="select" value={count} onChange={(e) => setCount(e.target.value)}>
                  <option value="3">3 帧</option>
                  <option value="6">6 帧</option>
                  <option value="9">9 帧</option>
                  <option value="12">12 帧</option>
                  <option value="20">20 帧</option>
                </select>
              </div>
              <div>
                <label className="label">输出格式</label>
                <select className="select" value={format} onChange={(e) => setFormat(e.target.value)}>
                  <option value="jpg">JPEG</option>
                  <option value="png">PNG (无损)</option>
                  <option value="webp">WebP</option>
                </select>
              </div>
              {processing && <ProgressBar progress={progress} label="抽取帧中..." />}
              <div className="flex gap-3">
                <button onClick={handleStart} disabled={processing} className="btn-primary flex-1">{t('start')}</button>
                <button onClick={() => setFile(null)} className="btn-secondary">{t('reset')}</button>
              </div>
            </div>
          )}
        </>
      )}
    </ToolShell>
  )
}

/* ========== 添加背景音乐 ========== */
export function AddBgm() {
  const tool = getToolById('add-bgm')!
  const { t } = useI18n()
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [mode, setMode] = useState<'replace' | 'mix'>('replace')
  const [volume, setVolume] = useState('100')
  const [loop, setLoop] = useState(true)
  const { processing, process, reset, ResultView, ProgressView, ErrorView } = useToolProcessor()

  const handleStart = () => {
    if (!videoFile || !audioFile) return
    const vName = `video_${Date.now()}.${videoFile.name.split('.').pop()}`
    const aName = `audio_${Date.now()}.${audioFile.name.split('.').pop()}`
    const vol = parseInt(volume) / 100

    process({
      outputExt: 'mp4',
      inputFiles: [{ name: vName, file: videoFile }, { name: aName, file: audioFile }],
      buildArgs: (inp, out) => {
        if (mode === 'replace') {
          // 替换原声：视频静音 + 背景音乐
          const loopFilter = loop ? '-stream_loop -1' : ''
          return ['-i', inp[0], loopFilter ? '-stream_loop' : '', loopFilter ? '-1' : '', '-i', inp[1],
            '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k',
            '-filter_complex', `[1:a]volume=${vol}[a]`, '-map', '0:v', '-map', '[a]',
            '-shortest', '-movflags', '+faststart', out].filter(Boolean)
        }
        // 混合：原声 + 背景音乐
        return ['-i', inp[0], '-i', inp[1],
          '-filter_complex', `[1:a]volume=${vol}[bgm];[0:a][bgm]amix=inputs=2:duration=first[a]`,
          '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k',
          '-shortest', '-movflags', '+faststart', out]
      },
    })
  }

  return (
    <ToolShell tool={tool} maxWidth="max-w-3xl">
      <ResultView onReset={() => { setVideoFile(null); setAudioFile(null) }} />
      <div className="space-y-4">
        <div><label className="label">视频文件</label>
          <FileUpload accept="video/*" selectedFiles={videoFile ? [videoFile] : []}
            onFilesSelected={(f) => { setVideoFile(f[0]); reset() }} onRemove={() => setVideoFile(null)} /></div>
        <div><label className="label">背景音乐文件</label>
          <FileUpload accept="audio/*" selectedFiles={audioFile ? [audioFile] : []}
            onFilesSelected={(f) => setAudioFile(f[0])} onRemove={() => setAudioFile(null)} /></div>
      </div>
      {videoFile && audioFile && (
        <div className="mt-5 space-y-4 animate-slide-up">
          <div className="flex gap-2">
            <button onClick={() => setMode('replace')} className={`flex-1 py-2.5 rounded-xl text-sm font-medium ${mode === 'replace' ? 'bg-brand-500 text-white' : 'bg-gray-100 dark:bg-slate-700'}`}>替换原声</button>
            <button onClick={() => setMode('mix')} className={`flex-1 py-2.5 rounded-xl text-sm font-medium ${mode === 'mix' ? 'bg-brand-500 text-white' : 'bg-gray-100 dark:bg-slate-700'}`}>混合原声</button>
          </div>
          <div>
            <label className="label">背景音乐音量: {volume}%</label>
            <input type="range" min={10} max={200} value={volume} onChange={(e) => setVolume(e.target.value)} />
          </div>
          {mode === 'replace' && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={loop} onChange={(e) => setLoop(e.target.checked)} className="w-4 h-4 rounded" />
              <span className="text-sm">循环播放（音乐短于视频时）</span>
            </label>
          )}
          <div className="flex gap-3">
            <button onClick={handleStart} disabled={processing} className="btn-primary flex-1">{t('start')}</button>
            <button onClick={() => { setVideoFile(null); setAudioFile(null); reset() }} className="btn-secondary">{t('reset')}</button>
          </div>
        </div>
      )}
      <ProgressView />
      <ErrorView />
    </ToolShell>
  )
}

/* ========== 假装是 Sora2 ========== */
export function Sora2Watermark() {
  const tool = getToolById('sora2-watermark')!
  const { t } = useI18n()
  const [file, setFile] = useState<File | null>(null)
  const [videoUrl, setVideoUrl] = useState('')
  const [dimensions, setDimensions] = useState({ w: 0, h: 0 })
  const videoRef = useRef<HTMLVideoElement>(null)
  const { processing, process, reset, ResultView, ProgressView, ErrorView } = useToolProcessor()

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file)
      setVideoUrl(url)
      return () => URL.revokeObjectURL(url)
    }
  }, [file])

  const onLoaded = () => {
    if (videoRef.current) {
      setDimensions({ w: videoRef.current.videoWidth, h: videoRef.current.videoHeight })
    }
  }

  const handleStart = async () => {
    if (!file) return
    const inputName = `input_${Date.now()}.${file.name.split('.').pop()}`
    const isPortrait = dimensions.h > dimensions.w
    const fontSize = Math.max(16, isPortrait ? Math.round(dimensions.w * 0.035) : Math.round(dimensions.h * 0.04))
    const yPos = isPortrait ? 'H*0.93' : 'H*0.9'

    // wasm 内核里没有字体，drawtext 无法初始化；改用 Canvas 渲染文字图层再 overlay
    const layer = await renderTextToPng({ text: 'Sora 2', fontSize, color: 'white', shadow: true })

    process({
      outputExt: 'mp4',
      inputFiles: [{ name: inputName, file }, { name: 'text_layer.png', file: layer }],
      buildArgs: (inp, out) => [
        '-i', inp[0], '-i', inp[1],
        '-filter_complex', `[0:v][1:v]overlay=(W-w)/2:${yPos}[v]`,
        '-map', '[v]', '-map', '0:a?',
        '-c:v', 'libx264', '-preset', 'fast', '-c:a', 'copy', '-movflags', '+faststart', out,
      ],
    })
  }

  return (
    <ToolShell tool={tool}>
      <ResultView onReset={() => { setFile(null); setVideoUrl('') }} />
      <FileUpload accept="video/*" selectedFiles={file ? [file] : []}
        onFilesSelected={(f) => { setFile(f[0]); reset() }} onRemove={() => setFile(null)} />
      {file && videoUrl && (
        <div className="mt-5 animate-slide-up">
          <video ref={videoRef} src={videoUrl} onLoadedMetadata={onLoaded} controls className="w-full rounded-xl bg-black max-h-64" />
          <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-300 rounded-xl text-xs">
            ✨ 自动识别横竖屏，在视频底部居中添加 "Sora 2" 水印
          </div>
          <div className="mt-4 flex gap-3">
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
