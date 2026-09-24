/**
 * 视觉编辑型工具
 * 包含：画面裁剪、添加水印、去水印、调色、添加文字、添加字幕
 */
import { useState, useRef, useEffect } from 'react'
import ToolShell from '../components/ToolShell'
import FileUpload from '../components/FileUpload'
import { useToolProcessor } from '../components/useToolProcessor'
import { getToolById } from '../data/tools'
import { useI18n } from '../i18n'
import { renderTextToPng } from '../lib/utils'

/* ========== 视频画面裁剪 ========== */
export function VideoCrop() {
  const tool = getToolById('video-crop')!
  const { t } = useI18n()
  const [file, setFile] = useState<File | null>(null)
  const [videoUrl, setVideoUrl] = useState('')
  const [dimensions, setDimensions] = useState({ w: 0, h: 0 })
  const [preset, setPreset] = useState('free')
  const [crop, setCrop] = useState({ x: 0, y: 0, w: 0, h: 0 })
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
      const w = videoRef.current.videoWidth
      const h = videoRef.current.videoHeight
      setDimensions({ w, h })
      setCrop({ x: 0, y: 0, w, h })
    }
  }

  const applyPreset = (p: string) => {
    setPreset(p)
    if (dimensions.w === 0) return
    const ratios: Record<string, number> = { '16:9': 16/9, '9:16': 9/16, '4:3': 4/3, '1:1': 1, '3:4': 3/4 }
    if (p === 'free') {
      setCrop({ x: 0, y: 0, w: dimensions.w, h: dimensions.h })
      return
    }
    const ratio = ratios[p]
    let cw = dimensions.w, ch = dimensions.h
    if (dimensions.w / dimensions.h > ratio) {
      cw = Math.round(dimensions.h * ratio)
    } else {
      ch = Math.round(dimensions.w / ratio)
    }
    setCrop({ x: Math.round((dimensions.w - cw) / 2), y: Math.round((dimensions.h - ch) / 2), w: cw, h: ch })
  }

  const handleStart = () => {
    if (!file) return
    const inputName = `input_${Date.now()}.${file.name.split('.').pop()}`
    process({
      outputExt: 'mp4',
      inputFiles: [{ name: inputName, file }],
      buildArgs: (inp, out) => ['-i', inp[0], '-vf', `crop=${crop.w}:${crop.h}:${crop.x}:${crop.y}`, '-c:v', 'libx264', '-preset', 'fast', '-c:a', 'copy', '-movflags', '+faststart', out],
    })
  }

  return (
    <ToolShell tool={tool} maxWidth="max-w-3xl">
      <ResultView onReset={() => { setFile(null); setVideoUrl('') }} />
      <FileUpload accept="video/*" selectedFiles={file ? [file] : []}
        onFilesSelected={(f) => { setFile(f[0]); reset() }} onRemove={() => setFile(null)} />
      {file && videoUrl && (
        <div className="mt-5 animate-slide-up">
          <div className="relative inline-block w-full">
            <video ref={videoRef} src={videoUrl} onLoadedMetadata={onLoaded}
              className="w-full rounded-xl bg-black max-h-64 object-contain" />
          </div>
          {dimensions.w > 0 && (
            <div className="mt-4 space-y-4">
              <div>
                <label className="label">裁剪比例</label>
                <div className="flex flex-wrap gap-2">
                  {['free', '16:9', '9:16', '4:3', '1:1', '3:4'].map(p => (
                    <button key={p} onClick={() => applyPreset(p)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${preset === p ? 'bg-brand-500 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-600'}`}>
                      {p === 'free' ? '自由' : p}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">X 偏移</label><input type="number" className="input" value={crop.x} onChange={(e) => setCrop({ ...crop, x: parseInt(e.target.value) || 0 })} /></div>
                <div><label className="label">Y 偏移</label><input type="number" className="input" value={crop.y} onChange={(e) => setCrop({ ...crop, y: parseInt(e.target.value) || 0 })} /></div>
                <div><label className="label">宽度</label><input type="number" className="input" value={crop.w} onChange={(e) => setCrop({ ...crop, w: parseInt(e.target.value) || 0 })} /></div>
                <div><label className="label">高度</label><input type="number" className="input" value={crop.h} onChange={(e) => setCrop({ ...crop, h: parseInt(e.target.value) || 0 })} /></div>
              </div>
              <p className="text-xs text-gray-400">原始分辨率: {dimensions.w}×{dimensions.h} → 裁剪: {crop.w}×{crop.h}</p>
              <div className="flex gap-3">
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

/* ========== 添加水印 ========== */
export function AddWatermark() {
  const tool = getToolById('add-watermark')!
  const { t } = useI18n()
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [watermarkFile, setWatermarkFile] = useState<File | null>(null)
  const [position, setPosition] = useState('bottom-right')
  const [opacity, setOpacity] = useState(80)
  const [scale, setScale] = useState(20)
  const { processing, process, reset, ResultView, ProgressView, ErrorView } = useToolProcessor()

  const positions = [
    { value: 'top-left', label: '左上角', filter: '10:10' },
    { value: 'top-right', label: '右上角', filter: 'W-w-10:10' },
    { value: 'bottom-left', label: '左下角', filter: '10:H-h-10' },
    { value: 'bottom-right', label: '右下角', filter: 'W-w-10:H-h-10' },
    { value: 'center', label: '居中', filter: '(W-w)/2:(H-h)/2' },
  ]

  const handleStart = () => {
    if (!videoFile || !watermarkFile) return
    const vName = `video_${Date.now()}.${videoFile.name.split('.').pop()}`
    const wName = `watermark_${Date.now()}.${watermarkFile.name.split('.').pop()}`
    const pos = positions.find(p => p.value === position)?.filter || 'W-w-10:H-h-10'
    process({
      outputExt: 'mp4',
      inputFiles: [{ name: vName, file: videoFile }, { name: wName, file: watermarkFile }],
      buildArgs: (inp, out) => ['-i', inp[0], '-i', inp[1], '-filter_complex', `[1:v]scale=iw*${scale/100}:-1,format=rgba,colorchannelmixer=aa=${opacity/100}[wm];[0:v][wm]overlay=${pos}`, '-c:v', 'libx264', '-preset', 'fast', '-c:a', 'copy', '-movflags', '+faststart', out],
    })
  }

  return (
    <ToolShell tool={tool} maxWidth="max-w-3xl">
      <ResultView onReset={() => { setVideoFile(null); setWatermarkFile(null) }} />
      <div className="space-y-4">
        <div>
          <label className="label">视频文件</label>
          <FileUpload accept="video/*" selectedFiles={videoFile ? [videoFile] : []}
            onFilesSelected={(f) => { setVideoFile(f[0]); reset() }} onRemove={() => setVideoFile(null)} />
        </div>
        <div>
          <label className="label">水印图片（PNG 推荐）</label>
          <FileUpload accept="image/*" selectedFiles={watermarkFile ? [watermarkFile] : []}
            onFilesSelected={(f) => setWatermarkFile(f[0])} onRemove={() => setWatermarkFile(null)} />
        </div>
      </div>
      {videoFile && watermarkFile && (
        <div className="mt-5 space-y-4 animate-slide-up">
          <div>
            <label className="label">水印位置</label>
            <div className="grid grid-cols-5 gap-2">
              {positions.map(p => (
                <button key={p.value} onClick={() => setPosition(p.value)}
                  className={`py-2 rounded-lg text-xs font-medium transition-all ${position === p.value ? 'bg-brand-500 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-600'}`}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">水印大小: {scale}%</label>
            <input type="range" min={5} max={100} value={scale} onChange={(e) => setScale(parseInt(e.target.value))} />
          </div>
          <div>
            <label className="label">不透明度: {opacity}%</label>
            <input type="range" min={10} max={100} value={opacity} onChange={(e) => setOpacity(parseInt(e.target.value))} />
          </div>
          <div className="flex gap-3">
            <button onClick={handleStart} disabled={processing} className="btn-primary flex-1">{t('start')}</button>
            <button onClick={() => { setVideoFile(null); setWatermarkFile(null); reset() }} className="btn-secondary">{t('reset')}</button>
          </div>
        </div>
      )}
      <ProgressView />
      <ErrorView />
    </ToolShell>
  )
}

/* ========== 去水印 ========== */
export function RemoveWatermark() {
  const tool = getToolById('remove-watermark')!
  const { t } = useI18n()
  const [file, setFile] = useState<File | null>(null)
  const [videoUrl, setVideoUrl] = useState('')
  const [dimensions, setDimensions] = useState({ w: 0, h: 0 })
  const [area, setArea] = useState({ x: 0, y: 0, w: 100, h: 50 })
  const [mode, setMode] = useState<'blur' | 'black'>('blur')
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
      setArea({ x: 0, y: videoRef.current.videoHeight - 60, w: 200, h: 50 })
    }
  }

  const handleStart = () => {
    if (!file) return
    const inputName = `input_${Date.now()}.${file.name.split('.').pop()}`
    // delogo 要求区域完整落在画面内且参数为常量，越界或表达式都会
    // "Failed to configure input pad"，这里先夹取到画面范围内
    const x = Math.max(0, Math.min(area.x, dimensions.w - 2))
    const y = Math.max(0, Math.min(area.y, dimensions.h - 2))
    const w = Math.max(2, Math.min(area.w, dimensions.w - x))
    const h = Math.max(2, Math.min(area.h, dimensions.h - y))
    if (mode === 'blur') {
      // 用 crop + boxblur + overlay 做区域模糊，替代 wasm 里不可用的 delogo
      const fc = `[0:v]split[base][b];[b]crop=${w}:${h}:${x}:${y},boxblur=luma_radius=9:luma_power=2:chroma_radius=4:chroma_power=2[blur];[base][blur]overlay=${x}:${y}[v]`
      process({
        outputExt: 'mp4',
        inputFiles: [{ name: inputName, file }],
        buildArgs: (inp, out) => ['-i', inp[0], '-filter_complex', fc, '-map', '[v]', '-map', '0:a?', '-c:v', 'libx264', '-preset', 'fast', '-c:a', 'copy', '-movflags', '+faststart', out],
      })
      return
    }
    process({
      outputExt: 'mp4',
      inputFiles: [{ name: inputName, file }],
      buildArgs: (inp, out) => ['-i', inp[0], '-vf', `drawbox=x=${x}:y=${y}:w=${w}:h=${h}:color=black:t=fill`, '-c:v', 'libx264', '-preset', 'fast', '-c:a', 'copy', '-movflags', '+faststart', out],
    })
  }

  return (
    <ToolShell tool={tool} maxWidth="max-w-3xl">
      <ResultView onReset={() => { setFile(null); setVideoUrl('') }} />
      <FileUpload accept="video/*" selectedFiles={file ? [file] : []}
        onFilesSelected={(f) => { setFile(f[0]); reset() }} onRemove={() => setFile(null)} />
      {file && videoUrl && (
        <div className="mt-5 animate-slide-up">
          <video ref={videoRef} src={videoUrl} onLoadedMetadata={onLoaded} controls className="w-full rounded-xl bg-black max-h-64" />
          {dimensions.w > 0 && (
            <div className="mt-4 space-y-4">
              <div className="flex gap-2">
                <button onClick={() => setMode('blur')} className={`flex-1 py-2 rounded-xl text-sm ${mode === 'blur' ? 'bg-brand-500 text-white' : 'bg-gray-100 dark:bg-slate-700'}`}>模糊遮盖</button>
                <button onClick={() => setMode('black')} className={`flex-1 py-2 rounded-xl text-sm ${mode === 'black' ? 'bg-brand-500 text-white' : 'bg-gray-100 dark:bg-slate-700'}`}>黑色遮挡</button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">X</label><input type="number" className="input" value={area.x} onChange={(e) => setArea({ ...area, x: parseInt(e.target.value) || 0 })} /></div>
                <div><label className="label">Y</label><input type="number" className="input" value={area.y} onChange={(e) => setArea({ ...area, y: parseInt(e.target.value) || 0 })} /></div>
                <div><label className="label">宽度</label><input type="number" className="input" value={area.w} onChange={(e) => setArea({ ...area, w: parseInt(e.target.value) || 0 })} /></div>
                <div><label className="label">高度</label><input type="number" className="input" value={area.h} onChange={(e) => setArea({ ...area, h: parseInt(e.target.value) || 0 })} /></div>
              </div>
              <p className="text-xs text-gray-400">视频分辨率: {dimensions.w}×{dimensions.h}</p>
              <div className="flex gap-3">
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

/* ========== 视频调色 ========== */
export function VideoColor() {
  const tool = getToolById('video-color')!
  const { t } = useI18n()
  const [file, setFile] = useState<File | null>(null)
  const [brightness, setBrightness] = useState(0)
  const [contrast, setContrast] = useState(1)
  const [saturation, setSaturation] = useState(1)
  const [hue, setHue] = useState(0)
  const [grayscale, setGrayscale] = useState(false)
  const { processing, process, reset, ResultView, ProgressView, ErrorView } = useToolProcessor()

  const handleStart = () => {
    if (!file) return
    const inputName = `input_${Date.now()}.${file.name.split('.').pop()}`
    const eq = `eq=brightness=${brightness}:contrast=${contrast}:saturation=${saturation}`
    const hueFilter = hue !== 0 ? `,hue=h=${hue}` : ''
    const gray = grayscale ? ',hue=s=0' : ''
    process({
      outputExt: 'mp4',
      inputFiles: [{ name: inputName, file }],
      buildArgs: (inp, out) => ['-i', inp[0], '-vf', `${eq}${hueFilter}${gray}`, '-c:v', 'libx264', '-preset', 'fast', '-c:a', 'copy', '-movflags', '+faststart', out],
    })
  }

  const sliders = [
    { label: '亮度', value: brightness, set: setBrightness, min: -1, max: 1, step: 0.05 },
    { label: '对比度', value: contrast, set: setContrast, min: 0, max: 2, step: 0.05 },
    { label: '饱和度', value: saturation, set: setSaturation, min: 0, max: 3, step: 0.05 },
    { label: '色相', value: hue, set: setHue, min: -180, max: 180, step: 5 },
  ]

  return (
    <ToolShell tool={tool}>
      <ResultView onReset={() => setFile(null)} />
      <FileUpload accept="video/*" selectedFiles={file ? [file] : []}
        onFilesSelected={(f) => { setFile(f[0]); reset() }} onRemove={() => setFile(null)} />
      {file && (
        <div className="mt-5 space-y-4 animate-slide-up">
          {sliders.map((s, i) => (
            <div key={i}>
              <label className="label flex justify-between"><span>{s.label}</span><span className="text-gray-400">{s.value.toFixed(2)}</span></label>
              <input type="range" min={s.min} max={s.max} step={s.step} value={s.value} onChange={(e) => s.set(parseFloat(e.target.value))} />
            </div>
          ))}
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={grayscale} onChange={(e) => setGrayscale(e.target.checked)} className="w-4 h-4 rounded" />
            <span className="text-sm">一键去色（黑白）</span>
          </label>
          <div className="flex gap-3">
            <button onClick={handleStart} disabled={processing} className="btn-primary flex-1">{t('start')}</button>
            <button onClick={() => { setBrightness(0); setContrast(1); setSaturation(1); setHue(0); setGrayscale(false) }} className="btn-secondary">重置参数</button>
          </div>
        </div>
      )}
      <ProgressView />
      <ErrorView />
    </ToolShell>
  )
}

/* ========== 添加文字 ========== */
export function AddText() {
  const tool = getToolById('add-text')!
  const { t } = useI18n()
  const [file, setFile] = useState<File | null>(null)
  const [text, setText] = useState('')
  const [fontSize, setFontSize] = useState(36)
  const [fontColor, setFontColor] = useState('white')
  const [position, setPosition] = useState('bottom')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const { processing, process, reset, ResultView, ProgressView, ErrorView } = useToolProcessor()

  // overlay 的位置表达式里 w/h 是图层尺寸，W/H 是视频尺寸
  const posMap: Record<string, string> = {
    top: '(W-w)/2:40',
    center: '(W-w)/2:(H-h)/2',
    bottom: '(W-w)/2:H-h-40',
  }

  const handleStart = async () => {
    if (!file || !text) return
    const inputName = `input_${Date.now()}.${file.name.split('.').pop()}`
    // 用 Canvas 渲染文字图层再 overlay：wasm 里没有字体，drawtext 必然初始化失败
    const layer = await renderTextToPng({ text, fontSize, color: fontColor, shadow: true })
    let enable = ''
    if (endTime) enable = `:enable='between(t,${startTime || 0},${endTime})'`
    else if (startTime) enable = `:enable='gte(t,${startTime})'`
    process({
      outputExt: 'mp4',
      inputFiles: [{ name: inputName, file }, { name: 'text_layer.png', file: layer }],
      buildArgs: (inp, out) => ['-i', inp[0], '-i', inp[1], '-filter_complex', `[0:v][1:v]overlay=${posMap[position]}${enable}[v]`, '-map', '[v]', '-map', '0:a?', '-c:v', 'libx264', '-preset', 'fast', '-c:a', 'copy', '-movflags', '+faststart', out],
    })
  }

  return (
    <ToolShell tool={tool}>
      <ResultView onReset={() => setFile(null)} />
      <FileUpload accept="video/*" selectedFiles={file ? [file] : []}
        onFilesSelected={(f) => { setFile(f[0]); reset() }} onRemove={() => setFile(null)} />
      {file && (
        <div className="mt-5 space-y-4 animate-slide-up">
          <div><label className="label">文字内容</label><input type="text" className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="输入要叠加的文字" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">字号</label><input type="number" className="input" value={fontSize} onChange={(e) => setFontSize(parseInt(e.target.value) || 24)} /></div>
            <div><label className="label">颜色</label>
              <select className="select" value={fontColor} onChange={(e) => setFontColor(e.target.value)}>
                <option value="white">白色</option><option value="black">黑色</option><option value="red">红色</option><option value="yellow">黄色</option><option value="blue">蓝色</option><option value="green">绿色</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">位置</label>
            <div className="grid grid-cols-3 gap-2">
              {['top', 'center', 'bottom'].map(p => (
                <button key={p} onClick={() => setPosition(p)}
                  className={`py-2 rounded-lg text-xs ${position === p ? 'bg-brand-500 text-white' : 'bg-gray-100 dark:bg-slate-700'}`}>
                  {p === 'top' ? '顶部' : p === 'center' ? '居中' : '底部'}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">开始时间（秒，留空=全程）</label><input type="number" className="input" value={startTime} onChange={(e) => setStartTime(e.target.value)} placeholder="0" /></div>
            <div><label className="label">结束时间（秒）</label><input type="number" className="input" value={endTime} onChange={(e) => setEndTime(e.target.value)} placeholder="10" /></div>
          </div>
          <div className="flex gap-3">
            <button onClick={handleStart} disabled={processing || !text} className="btn-primary flex-1">{t('start')}</button>
            <button onClick={() => { setFile(null); reset() }} className="btn-secondary">{t('reset')}</button>
          </div>
        </div>
      )}
      <ProgressView />
      <ErrorView />
    </ToolShell>
  )
}

/* ========== 添加字幕 ========== */
export function AddSubtitles() {
  const tool = getToolById('add-subtitles')!
  const { t } = useI18n()
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [subtitleFile, setSubtitleFile] = useState<File | null>(null)
  const [mode, setMode] = useState<'hard' | 'soft'>('hard')
  const { processing, process, reset, ResultView, ProgressView, ErrorView } = useToolProcessor()

  const handleStart = async () => {
    if (!videoFile || !subtitleFile) return
    const vName = `video_${Date.now()}.${videoFile.name.split('.').pop()}`
    const sName = `sub_${Date.now()}.${subtitleFile.name.split('.').pop()}`
    const outputExt = mode === 'soft' ? 'mkv' : 'mp4'

    if (mode === 'soft') {
      // 软字幕：直接复制流，添加字幕轨道
      process({
        outputExt,
        inputFiles: [{ name: vName, file: videoFile }, { name: sName, file: subtitleFile }],
        buildArgs: (inp, out) => ['-i', inp[0], '-i', inp[1], '-c', 'copy', '-c:s', 'srt', out],
      })
    } else {
      // 硬字幕：烧录进画面
      // 需要把字幕文件内容写入，ffmpeg subtitles filter 需要文件路径
      process({
        outputExt,
        inputFiles: [{ name: vName, file: videoFile }, { name: sName, file: subtitleFile }],
        buildArgs: (inp, out) => ['-i', inp[0], '-vf', `subtitles=${inp[1]}`, '-c:v', 'libx264', '-preset', 'fast', '-c:a', 'copy', '-movflags', '+faststart', out],
      })
    }
  }

  return (
    <ToolShell tool={tool} maxWidth="max-w-3xl">
      <ResultView onReset={() => { setVideoFile(null); setSubtitleFile(null) }} />
      <div className="space-y-4">
        <div><label className="label">视频文件</label>
          <FileUpload accept="video/*" selectedFiles={videoFile ? [videoFile] : []}
            onFilesSelected={(f) => { setVideoFile(f[0]); reset() }} onRemove={() => setVideoFile(null)} /></div>
        <div><label className="label">字幕文件（SRT / VTT）</label>
          <FileUpload accept=".srt,.vtt" selectedFiles={subtitleFile ? [subtitleFile] : []}
            onFilesSelected={(f) => setSubtitleFile(f[0])} onRemove={() => setSubtitleFile(null)} /></div>
      </div>
      {videoFile && subtitleFile && (
        <div className="mt-5 animate-slide-up">
          <div className="flex gap-2 mb-4">
            <button onClick={() => setMode('hard')} className={`flex-1 py-2.5 rounded-xl text-sm font-medium ${mode === 'hard' ? 'bg-brand-500 text-white' : 'bg-gray-100 dark:bg-slate-700'}`}>硬字幕（烧录进画面）</button>
            <button onClick={() => setMode('soft')} className={`flex-1 py-2.5 rounded-xl text-sm font-medium ${mode === 'soft' ? 'bg-brand-500 text-white' : 'bg-gray-100 dark:bg-slate-700'}`}>软字幕（独立轨道，MKV）</button>
          </div>
          <p className="text-xs text-gray-400 mb-4">
            {mode === 'hard' ? '硬字幕会重新编码，所有播放器可见' : '软字幕不重新编码，速度快，输出MKV格式，可开关字幕'}
          </p>
          <div className="flex gap-3">
            <button onClick={handleStart} disabled={processing} className="btn-primary flex-1">{t('start')}</button>
            <button onClick={() => { setVideoFile(null); setSubtitleFile(null); reset() }} className="btn-secondary">{t('reset')}</button>
          </div>
        </div>
      )}
      <ProgressView />
      <ErrorView />
    </ToolShell>
  )
}
