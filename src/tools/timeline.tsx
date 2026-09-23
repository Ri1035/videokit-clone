/**
 * 时间轴型工具
 * 包含：视频裁剪、视频分割、音频剪辑
 */
import { useState, useRef, useEffect } from 'react'
import ToolShell from '../components/ToolShell'
import FileUpload from '../components/FileUpload'
import { useToolProcessor } from '../components/useToolProcessor'
import { getToolById } from '../data/tools'
import { useI18n } from '../i18n'
import { formatDuration } from '../lib/utils'
import { runFFmpegTask } from '../lib/ffmpegEngine'
import { downloadBlob, replaceExtension } from '../lib/utils'
import ProgressBar from '../components/ProgressBar'

/* 共享：时间范围选择器 */
function TimeRangePicker({
  duration,
  start,
  end,
  onStartChange,
  onEndChange,
}: {
  duration: number
  start: number
  end: number
  onStartChange: (v: number) => void
  onEndChange: (v: number) => void
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <label className="label">开始时间</label>
          <div className="flex items-center gap-2">
            <input type="range" min={0} max={duration} step={0.1} value={start}
              onChange={(e) => onStartChange(Math.min(parseFloat(e.target.value), end - 0.1))} />
            <span className="text-sm font-mono text-gray-600 dark:text-slate-300 w-16 text-right">{formatDuration(start)}</span>
          </div>
        </div>
        <div className="flex-1">
          <label className="label">结束时间</label>
          <div className="flex items-center gap-2">
            <input type="range" min={0} max={duration} step={0.1} value={end}
              onChange={(e) => onEndChange(Math.max(parseFloat(e.target.value), start + 0.1))} />
            <span className="text-sm font-mono text-gray-600 dark:text-slate-300 w-16 text-right">{formatDuration(end)}</span>
          </div>
        </div>
      </div>
      <div className="h-2 bg-gray-100 dark:bg-slate-700 rounded-full relative overflow-hidden">
        <div className="absolute h-full bg-brand-400 rounded-full"
          style={{ left: `${(start / duration) * 100}%`, width: `${((end - start) / duration) * 100}%` }} />
      </div>
      <p className="text-xs text-gray-400">选中片段时长: {formatDuration(end - start)}</p>
    </div>
  )
}

/* ========== 视频裁剪 ========== */
export function VideoTrimmer() {
  const tool = getToolById('video-trimmer')!
  const { t } = useI18n()
  const [file, setFile] = useState<File | null>(null)
  const [videoUrl, setVideoUrl] = useState('')
  const [duration, setDuration] = useState(0)
  const [start, setStart] = useState(0)
  const [end, setEnd] = useState(0)
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
      const d = videoRef.current.duration
      setDuration(d)
      setEnd(d)
    }
  }

  const handleStart = () => {
    if (!file) return
    const inputName = `input_${Date.now()}.${file.name.split('.').pop()}`
    process({
      outputExt: 'mp4',
      inputFiles: [{ name: inputName, file }],
      buildArgs: (inp, out) => ['-i', inp[0], '-ss', String(start), '-to', String(end), '-c:v', 'libx264', '-preset', 'fast', '-crf', '23', '-c:a', 'aac', '-movflags', '+faststart', out],
    })
  }

  return (
    <ToolShell tool={tool} maxWidth="max-w-3xl">
      <ResultView onReset={() => { setFile(null); setVideoUrl('') }} />
      <FileUpload accept="video/*" selectedFiles={file ? [file] : []}
        onFilesSelected={(f) => { setFile(f[0]); reset() }} onRemove={() => { setFile(null); setVideoUrl('') }} />
      {file && videoUrl && (
        <div className="mt-5 animate-slide-up">
          <video ref={videoRef} src={videoUrl} controls onLoadedMetadata={onLoaded}
            className="w-full rounded-xl bg-black max-h-64" />
          {duration > 0 && (
            <div className="mt-4">
              <TimeRangePicker duration={duration} start={start} end={end}
                onStartChange={setStart} onEndChange={setEnd} />
              <div className="mt-6 flex gap-3">
                <button onClick={handleStart} disabled={processing} className="btn-primary flex-1">{t('start')}</button>
                <button onClick={() => { setFile(null); setVideoUrl(''); reset() }} className="btn-secondary">{t('reset')}</button>
              </div>
            </div>
          )}
        </div>
      )}
      <ProgressView />
      <ErrorView />
    </ToolShell>
  )
}

/* ========== 视频分割 ========== */
export function VideoSplitter() {
  const tool = getToolById('video-splitter')!
  const { t } = useI18n()
  const [file, setFile] = useState<File | null>(null)
  const [videoUrl, setVideoUrl] = useState('')
  const [duration, setDuration] = useState(0)
  const [splitPoints, setSplitPoints] = useState<number[]>([])
  const [newPoint, setNewPoint] = useState('')
  const [mode, setMode] = useState<'custom' | 'equal'>('custom')
  const [equalCount, setEqualCount] = useState(2)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [processing, setProcessing] = useState(false)
  const [results, setResults] = useState<{ blob: Blob; name: string }[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file)
      setVideoUrl(url)
      return () => URL.revokeObjectURL(url)
    }
  }, [file])

  const onLoaded = () => {
    if (videoRef.current) setDuration(videoRef.current.duration)
  }

  const addPoint = () => {
    const v = parseFloat(newPoint)
    if (!isNaN(v) && v > 0 && v < duration && !splitPoints.includes(v)) {
      setSplitPoints([...splitPoints, v].sort((a, b) => a - b))
      setNewPoint('')
    }
  }

  const getSegments = (): [number, number][] => {
    if (mode === 'equal') {
      const segLen = duration / equalCount
      return Array.from({ length: equalCount }, (_, i) => [i * segLen, (i + 1) * segLen] as [number, number])
    }
    const points = [0, ...splitPoints, duration]
    return points.slice(0, -1).map((s, i) => [s, points[i + 1]] as [number, number])
  }

  const handleStart = async () => {
    if (!file) return
    setProcessing(true)
    setResults([])
    const segments = getSegments()
    const inputName = `input_${Date.now()}.${file.name.split('.').pop()}`

    for (let i = 0; i < segments.length; i++) {
      setCurrentIdx(i)
      const [s, e] = segments[i]
      const outputName = `part_${i + 1}.mp4`
      try {
        const blob = await runFFmpegTask({
          inputFiles: [{ name: inputName, file }],
          args: ['-i', inputName, '-ss', String(s), '-to', String(e), '-c:v', 'libx264', '-preset', 'fast', '-c:a', 'aac', '-movflags', '+faststart', outputName],
          outputName,
        })
        setResults(prev => [...prev, { blob, name: `part_${i + 1}_${replaceExtension(file.name, 'mp4')}` }])
      } catch {}
    }
    setProcessing(false)
  }

  return (
    <ToolShell tool={tool} maxWidth="max-w-3xl">
      {results.length > 0 && !processing && (
        <div className="text-center py-4">
          <div className="text-4xl mb-3">✅</div>
          <h3 className="text-lg font-bold mb-4">分割为 {results.length} 个片段</h3>
          <div className="space-y-2 mb-5">
            {results.map((r, i) => (
              <div key={i} className="flex items-center justify-between bg-gray-50 dark:bg-slate-700/50 rounded-xl px-4 py-2.5">
                <span className="text-sm">{r.name}</span>
                <button onClick={() => downloadBlob(r.blob, r.name)} className="text-brand-500 text-sm hover:underline">下载</button>
              </div>
            ))}
          </div>
          <button onClick={() => results.forEach((r, i) => setTimeout(() => downloadBlob(r.blob, r.name), i * 200))} className="btn-primary">⬇ {t('downloadAll')}</button>
          <button onClick={() => { setResults([]); setFile(null) }} className="btn-secondary ml-3">{t('reset')}</button>
        </div>
      )}
      {!(results.length > 0 && !processing) && (
        <>
          <FileUpload accept="video/*" selectedFiles={file ? [file] : []}
            onFilesSelected={(f) => { setFile(f[0]); setResults([]) }} onRemove={() => setFile(null)} />
          {file && videoUrl && (
            <div className="mt-5 animate-slide-up">
              <video ref={videoRef} src={videoUrl} controls onLoadedMetadata={onLoaded}
                className="w-full rounded-xl bg-black max-h-64" />
              {duration > 0 && (
                <div className="mt-4 space-y-4">
                  <div className="flex gap-2">
                    <button onClick={() => setMode('custom')}
                      className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${mode === 'custom' ? 'bg-brand-500 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-600'}`}>
                      自定义切割点
                    </button>
                    <button onClick={() => setMode('equal')}
                      className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${mode === 'equal' ? 'bg-brand-500 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-600'}`}>
                      等分切割
                    </button>
                  </div>
                  {mode === 'custom' ? (
                    <div>
                      <div className="flex gap-2">
                        <input type="number" className="input flex-1" placeholder="切割时间点（秒）"
                          value={newPoint} onChange={(e) => setNewPoint(e.target.value)} min={0} max={duration} step={0.1} />
                        <button onClick={addPoint} className="btn-secondary">添加</button>
                      </div>
                      {splitPoints.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {splitPoints.map((p, i) => (
                            <span key={i} className="badge bg-brand-50 text-brand-600 dark:bg-brand-900/30">
                              {formatDuration(p)}
                              <button onClick={() => setSplitPoints(splitPoints.filter((_, idx) => idx !== i))} className="ml-1.5 hover:text-red-500">✕</button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <label className="label">等分数</label>
                      <select className="select" value={equalCount} onChange={(e) => setEqualCount(parseInt(e.target.value))}>
                        {[2, 3, 4, 5, 6, 8, 10].map(n => <option key={n} value={n}>{n} 段</option>)}
                      </select>
                    </div>
                  )}
                  <p className="text-xs text-gray-400">将分割为 {getSegments().length} 个片段</p>
                  {processing && <ProgressBar progress={(currentIdx + 1) / getSegments().length} label={`分割中 ${currentIdx + 1}/${getSegments().length}`} />}
                  <div className="flex gap-3">
                    <button onClick={handleStart} disabled={processing} className="btn-primary flex-1">{t('start')}</button>
                    <button onClick={() => { setFile(null); setSplitPoints([]) }} className="btn-secondary">{t('reset')}</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </ToolShell>
  )
}

/* ========== 音频剪辑 ========== */
export function AudioTrimmer() {
  const tool = getToolById('audio-trimmer')!
  const { t } = useI18n()
  const [file, setFile] = useState<File | null>(null)
  const [audioUrl, setAudioUrl] = useState('')
  const [duration, setDuration] = useState(0)
  const [start, setStart] = useState(0)
  const [end, setEnd] = useState(0)
  const audioRef = useRef<HTMLAudioElement>(null)
  const { processing, process, reset, ResultView, ProgressView, ErrorView } = useToolProcessor()

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file)
      setAudioUrl(url)
      return () => URL.revokeObjectURL(url)
    }
  }, [file])

  const onLoaded = () => {
    if (audioRef.current) {
      const d = audioRef.current.duration
      setDuration(d)
      setEnd(d)
    }
  }

  const handleStart = () => {
    if (!file) return
    const ext = file.name.split('.').pop() || 'mp3'
    const inputName = `input_${Date.now()}.${ext}`
    process({
      outputExt: ext,
      inputFiles: [{ name: inputName, file }],
      buildArgs: (inp, out) => ['-i', inp[0], '-ss', String(start), '-to', String(end), '-acodec', 'copy', out],
    })
  }

  return (
    <ToolShell tool={tool}>
      <ResultView onReset={() => { setFile(null); setAudioUrl('') }} />
      <FileUpload accept="audio/*" selectedFiles={file ? [file] : []}
        onFilesSelected={(f) => { setFile(f[0]); reset() }} onRemove={() => { setFile(null); setAudioUrl('') }} />
      {file && audioUrl && (
        <div className="mt-5 animate-slide-up">
          <audio ref={audioRef} src={audioUrl} controls onLoadedMetadata={onLoaded} className="w-full" />
          {duration > 0 && (
            <div className="mt-4">
              <TimeRangePicker duration={duration} start={start} end={end}
                onStartChange={setStart} onEndChange={setEnd} />
              <div className="mt-6 flex gap-3">
                <button onClick={handleStart} disabled={processing} className="btn-primary flex-1">{t('start')}</button>
                <button onClick={() => { setFile(null); reset() }} className="btn-secondary">{t('reset')}</button>
              </div>
            </div>
          )}
        </div>
      )}
      <ProgressView />
      <ErrorView />
    </ToolShell>
  )
}
