/**
 * 多文件型特殊工具
 * 包含：批量转码、批量压缩、视频拼接、音频合并、图片转视频、图片转GIF
 */
import { useState } from 'react'
import ToolShell from '../components/ToolShell'
import FileUpload from '../components/FileUpload'
import { useToolProcessor } from '../components/useToolProcessor'
import { getToolById } from '../data/tools'
import { useI18n } from '../i18n'
import { runFFmpegTask, probeInput } from '../lib/ffmpegEngine'
import { transcodeWithFallback } from '../lib/webcodecs'
import { downloadBlob, replaceExtension, formatFileSize } from '../lib/utils'
import ProgressBar from '../components/ProgressBar'

/** 读取图片文件的实际像素尺寸（用于确定合成 GIF 的画布比例） */
function getImageSize(file: File): Promise<{ w: number; h: number }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => { resolve({ w: img.naturalWidth, h: img.naturalHeight }); URL.revokeObjectURL(url) }
    img.onerror = () => { resolve({ w: 0, h: 0 }); URL.revokeObjectURL(url) }
    img.src = url
  })
}

/* ========== 批量转码 ========== */
export function BatchTranscode() {
  const tool = getToolById('batch-transcode')!
  const { t } = useI18n()
  const [files, setFiles] = useState<File[]>([])
  const [format, setFormat] = useState('mp4')
  const [processing, setProcessing] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [results, setResults] = useState<{ blob: Blob; name: string }[]>([])
  const [error, setError] = useState('')

  const handleStart = async () => {
    if (files.length === 0) return
    setProcessing(true)
    setResults([])
    setError('')
    setCurrentIndex(0)

    for (let i = 0; i < files.length; i++) {
      setCurrentIndex(i)
      const file = files[i]
      const inputName = `input_${i}.${file.name.split('.').pop()}`
      const outputName = `output_${i}.${format}`
      try {
        // 之前这里无视 format，永远输出 H.264/AAC 的 MP4 数据，选 WebM 会得到「.webm 后缀 + H.264 内容」的坏文件。
        const args =
          format === 'webm'
            ? ['-i', inputName, '-c:v', 'libvpx', '-crf', '30', '-b:v', '0', '-c:a', 'libvorbis', '-b:a', '128k', outputName]
            : format === 'mov'
              ? ['-i', inputName, '-c:v', 'libx264', '-preset', 'fast', '-crf', '23', '-c:a', 'aac', '-b:a', '192k', outputName]
              : ['-i', inputName, '-c:v', 'libx264', '-preset', 'fast', '-crf', '23', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', outputName]

        const ffmpegRun = () => runFFmpegTask({
          inputFiles: [{ name: inputName, file }],
          args,
          outputName,
        })

        const blob = format === 'webm'
          ? await transcodeWithFallback({ file, container: 'webm', ffmpegFallback: ffmpegRun })
          : await ffmpegRun()

        setResults(prev => [...prev, { blob, name: replaceExtension(file.name, format) }])
      } catch (e: any) {
        setError(`第 ${i + 1} 个文件处理失败: ${e?.message || '未知错误'}`)
      }
    }
    setProcessing(false)
  }

  const downloadAll = () => {
    results.forEach((r, i) => {
      setTimeout(() => downloadBlob(r.blob, r.name), i * 200)
    })
  }

  return (
    <ToolShell tool={tool} maxWidth="max-w-3xl">
      {results.length > 0 && !processing && (
        <div className="text-center py-4 animate-slide-up">
          <div className="text-4xl mb-3">✅</div>
          <h3 className="text-lg font-bold mb-4">完成 {results.length} 个文件</h3>
          <div className="space-y-2 mb-5 max-h-48 overflow-y-auto">
            {results.map((r, i) => (
              <div key={i} className="flex items-center justify-between bg-gray-50 dark:bg-slate-700/50 rounded-xl px-4 py-2.5">
                <span className="text-sm truncate max-w-[200px]">{r.name}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400">{formatFileSize(r.blob.size)}</span>
                  <button onClick={() => downloadBlob(r.blob, r.name)} className="text-brand-500 text-sm hover:underline">下载</button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-3 justify-center">
            <button onClick={downloadAll} className="btn-primary">⬇ {t('downloadAll')}</button>
            <button onClick={() => { setResults([]); setFiles([]) }} className="btn-secondary">{t('reset')}</button>
          </div>
        </div>
      )}

      {!(results.length > 0 && !processing) && (
        <>
          <FileUpload
            accept="video/*" multiple
            selectedFiles={files}
            onFilesSelected={(f) => setFiles(prev => [...prev, ...f])}
            onRemove={(i) => setFiles(prev => prev.filter((_, idx) => idx !== i))}
            label="点击或拖拽多个视频文件"
          />
          {files.length > 0 && (
            <div className="mt-5 animate-slide-up">
              <label className="label">{t('outputFormat')}</label>
              <select className="select" value={format} onChange={(e) => setFormat(e.target.value)}>
                <option value="mp4">MP4</option>
                <option value="webm">WebM</option>
                <option value="mov">MOV</option>
              </select>
              {processing && (
                <div className="mt-4">
                  <ProgressBar progress={(currentIndex + 1) / files.length} label={`处理中 ${currentIndex + 1}/${files.length}`} />
                </div>
              )}
              {error && <div className="mt-3 text-red-500 text-sm">{error}</div>}
              <div className="mt-6 flex gap-3">
                <button onClick={handleStart} disabled={processing || files.length === 0} className="btn-primary flex-1">
                  {processing ? t('processing') : `${t('start')} (${files.length}个文件)`}
                </button>
                <button onClick={() => setFiles([])} className="btn-secondary">{t('reset')}</button>
              </div>
            </div>
          )}
        </>
      )}
    </ToolShell>
  )
}

/* ========== 批量压缩 ========== */
export function BatchCompress() {
  const tool = getToolById('batch-compress')!
  const { t } = useI18n()
  const [files, setFiles] = useState<File[]>([])
  const [level, setLevel] = useState('medium')
  const [processing, setProcessing] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [results, setResults] = useState<{ blob: Blob; name: string }[]>([])

  const crfMap: Record<string, string> = { low: '28', medium: '32', high: '36', extreme: '40' }

  const handleStart = async () => {
    setProcessing(true)
    setResults([])
    setCurrentIndex(0)
    for (let i = 0; i < files.length; i++) {
      setCurrentIndex(i)
      const file = files[i]
      const inputName = `input_${i}.${file.name.split('.').pop()}`
      const outputName = `output_${i}.mp4`
      try {
        const blob = await runFFmpegTask({
          inputFiles: [{ name: inputName, file }],
          args: ['-i', inputName, '-c:v', 'libx264', '-preset', 'fast', '-crf', crfMap[level], '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', outputName],
          outputName,
        })
        setResults(prev => [...prev, { blob, name: `compressed_${replaceExtension(file.name, 'mp4')}` }])
      } catch {}
    }
    setProcessing(false)
  }

  return (
    <ToolShell tool={tool} maxWidth="max-w-3xl">
      {results.length > 0 && !processing && (
        <div className="text-center py-4">
          <div className="text-4xl mb-3">✅</div>
          <h3 className="text-lg font-bold mb-4">完成 {results.length} 个文件</h3>
          <div className="space-y-2 mb-5 max-h-48 overflow-y-auto">
            {results.map((r, i) => (
              <div key={i} className="flex items-center justify-between bg-gray-50 dark:bg-slate-700/50 rounded-xl px-4 py-2.5">
                <span className="text-sm truncate max-w-[200px]">{r.name}</span>
                <button onClick={() => downloadBlob(r.blob, r.name)} className="text-brand-500 text-sm hover:underline">下载</button>
              </div>
            ))}
          </div>
          <button onClick={() => results.forEach((r, i) => setTimeout(() => downloadBlob(r.blob, r.name), i * 200))} className="btn-primary">⬇ {t('downloadAll')}</button>
          <button onClick={() => { setResults([]); setFiles([]) }} className="btn-secondary ml-3">{t('reset')}</button>
        </div>
      )}
      {!(results.length > 0 && !processing) && (
        <>
          <FileUpload accept="video/*" multiple selectedFiles={files}
            onFilesSelected={(f) => setFiles(prev => [...prev, ...f])}
            onRemove={(i) => setFiles(prev => prev.filter((_, idx) => idx !== i))}
            label="点击或拖拽多个视频文件" />
          {files.length > 0 && (
            <div className="mt-5">
              <label className="label">压缩强度</label>
              <select className="select" value={level} onChange={(e) => setLevel(e.target.value)}>
                <option value="low">轻度</option>
                <option value="medium">标准</option>
                <option value="high">强力</option>
                <option value="extreme">极致</option>
              </select>
              {processing && <div className="mt-4"><ProgressBar progress={(currentIndex + 1) / files.length} label={`处理中 ${currentIndex + 1}/${files.length}`} /></div>}
              <div className="mt-6 flex gap-3">
                <button onClick={handleStart} disabled={processing} className="btn-primary flex-1">{processing ? t('processing') : `${t('start')} (${files.length}个)`}</button>
                <button onClick={() => setFiles([])} className="btn-secondary">{t('reset')}</button>
              </div>
            </div>
          )}
        </>
      )}
    </ToolShell>
  )
}

/* ========== 视频拼接 ========== */
export function VideoMerger() {
  const tool = getToolById('video-merger')!
  const { t } = useI18n()
  const [files, setFiles] = useState<File[]>([])
  const [probing, setProbing] = useState(false)
  const { processing, process, reset, ResultView, ProgressView, ErrorView } = useToolProcessor()

  const moveFile = (index: number, dir: -1 | 1) => {
    const newFiles = [...files]
    const target = index + dir
    if (target < 0 || target >= newFiles.length) return
    ;[newFiles[index], newFiles[target]] = [newFiles[target], newFiles[index]]
    setFiles(newFiles)
  }

  const handleStart = async () => {
    if (files.length < 2 || probing || processing) return
    setProbing(true)
    const inputFiles = files.map((f, i) => ({ name: `input_${i}.${f.name.split('.').pop()}`, file: f }))

    // 之前用 concat demuxer：它在分辨率/朝向不一致时只是按包拼接，
    // 容器时长看着对（3s+2s=5s），但第二段根本解不出画面（抽帧 0 字节）。
    // 改用 filter_complex 的 concat 滤镜，先给每段做 scale/pad/setsar 归一化。
    const probes = await Promise.all(inputFiles.map((f) => probeInput(f.file, f.name)))
    setProbing(false)

    // concat 滤镜要求每段流数量一致，只要有一个输入没音轨，[i:a] 就会报错，
    // 因此先探测再决定是否带上音频轨。
    const withAudio = probes.every((p) => p.hasAudio)
    // 画布取第一个输入的分辨率（偶数化），探测失败时退回 1920x1080
    const first = probes[0]
    const W = first.width ? Math.round(first.width / 2) * 2 : 1920
    const H = first.height ? Math.round(first.height / 2) * 2 : 1080

    const inputs = inputFiles.flatMap((f) => ['-i', f.name])
    const parts = inputFiles.map((_, i) =>
      `[${i}:v]scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30,format=yuv420p[v${i}]`
    )

    let filter: string
    let maps: string[]
    if (withAudio) {
      const audio = inputFiles.map((_, i) =>
        `[${i}:a:0]aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo[a${i}]`
      )
      const seq = inputFiles.map((_, i) => `[v${i}][a${i}]`).join('')
      filter = [...parts, ...audio, `${seq}concat=n=${inputFiles.length}:v=1:a=1[ov][oa]`].join(';')
      maps = ['-map', '[ov]', '-map', '[oa]']
    } else {
      const seq = inputFiles.map((_, i) => `[v${i}]`).join('')
      filter = [...parts, `${seq}concat=n=${inputFiles.length}:v=1:a=0[ov]`].join(';')
      maps = ['-map', '[ov]', '-an']
    }

    process({
      outputExt: 'mp4',
      inputFiles,
      buildArgs: (_inp, out) => [...inputs, '-filter_complex', filter, ...maps, '-c:v', 'libx264', '-preset', 'fast', '-crf', '23', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', out],
    })
  }

  return (
    <ToolShell tool={tool} maxWidth="max-w-3xl">
      <ResultView onReset={() => setFiles([])} />
      <FileUpload accept="video/*" multiple selectedFiles={files}
        onFilesSelected={(f) => setFiles(prev => [...prev, ...f])}
        onRemove={(i) => setFiles(prev => prev.filter((_, idx) => idx !== i))}
        label="点击或拖拽多个视频（按顺序拼接）" />
      {files.length > 0 && (
        <div className="mt-4 space-y-2 animate-slide-up">
          {files.map((f, i) => (
            <div key={i} className="flex items-center gap-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl px-4 py-2.5">
              <span className="w-6 h-6 rounded-full bg-brand-100 dark:bg-brand-900 text-brand-600 dark:text-brand-300 text-xs flex items-center justify-center font-bold">{i + 1}</span>
              <span className="text-sm truncate flex-1">{f.name}</span>
              <div className="flex gap-1">
                <button onClick={() => moveFile(i, -1)} disabled={i === 0} className="w-7 h-7 rounded-lg bg-gray-200 dark:bg-slate-600 text-xs disabled:opacity-30 hover:bg-gray-300">↑</button>
                <button onClick={() => moveFile(i, 1)} disabled={i === files.length - 1} className="w-7 h-7 rounded-lg bg-gray-200 dark:bg-slate-600 text-xs disabled:opacity-30 hover:bg-gray-300">↓</button>
              </div>
            </div>
          ))}
          <div className="mt-4 flex gap-3">
            <button onClick={handleStart} disabled={processing || probing || files.length < 2} className="btn-primary flex-1">{t('start')}</button>
            <button onClick={() => { setFiles([]); reset() }} className="btn-secondary">{t('reset')}</button>
          </div>
        </div>
      )}
      <ProgressView />
      <ErrorView />
    </ToolShell>
  )
}

/* ========== 音频合并 ========== */
export function AudioMerger() {
  const tool = getToolById('audio-merger')!
  const { t } = useI18n()
  const [files, setFiles] = useState<File[]>([])
  const { processing, process, reset, ResultView, ProgressView, ErrorView } = useToolProcessor()

  const moveFile = (index: number, dir: -1 | 1) => {
    const newFiles = [...files]
    const target = index + dir
    if (target < 0 || target >= newFiles.length) return
    ;[newFiles[index], newFiles[target]] = [newFiles[target], newFiles[index]]
    setFiles(newFiles)
  }

  const handleStart = () => {
    if (files.length < 2) return
    const inputFiles = files.map((f, i) => ({ name: `input_${i}.${f.name.split('.').pop()}`, file: f }))

    // 之前用 concat demuxer：对 mp3+wav 这类混合格式，它把 wav 的包丢给 mp3 解码器，
    // 满屏 "Invalid data found when processing input"，第二段整段丢失
    // （3s+3s 只剩 3.03s）。改用 concat 滤镜，先统一采样格式/采样率/声道再拼接。
    const inputs = inputFiles.flatMap((f) => ['-i', f.name])
    const parts = inputFiles.map((_, i) =>
      `[${i}:a:0]aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo[a${i}]`
    )
    const seq = inputFiles.map((_, i) => `[a${i}]`).join('')
    const filter = [...parts, `${seq}concat=n=${inputFiles.length}:v=0:a=1[oa]`].join(';')

    process({
      outputExt: 'mp3',
      inputFiles,
      buildArgs: (_inp, out) => [...inputs, '-filter_complex', filter, '-map', '[oa]', '-acodec', 'libmp3lame', '-b:a', '192k', out],
    })
  }

  return (
    <ToolShell tool={tool} maxWidth="max-w-3xl">
      <ResultView onReset={() => setFiles([])} />
      <FileUpload accept="audio/*" multiple selectedFiles={files}
        onFilesSelected={(f) => setFiles(prev => [...prev, ...f])}
        onRemove={(i) => setFiles(prev => prev.filter((_, idx) => idx !== i))}
        label="点击或拖拽多个音频（按顺序拼接）" />
      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((f, i) => (
            <div key={i} className="flex items-center gap-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl px-4 py-2.5">
              <span className="w-6 h-6 rounded-full bg-brand-100 dark:bg-brand-900 text-brand-600 text-xs flex items-center justify-center font-bold">{i + 1}</span>
              <span className="text-sm truncate flex-1">{f.name}</span>
              <div className="flex gap-1">
                <button onClick={() => moveFile(i, -1)} disabled={i === 0} className="w-7 h-7 rounded-lg bg-gray-200 dark:bg-slate-600 text-xs disabled:opacity-30">↑</button>
                <button onClick={() => moveFile(i, 1)} disabled={i === files.length - 1} className="w-7 h-7 rounded-lg bg-gray-200 dark:bg-slate-600 text-xs disabled:opacity-30">↓</button>
              </div>
            </div>
          ))}
          <div className="mt-4 flex gap-3">
            <button onClick={handleStart} disabled={processing || files.length < 2} className="btn-primary flex-1">{t('start')}</button>
            <button onClick={() => { setFiles([]); reset() }} className="btn-secondary">{t('reset')}</button>
          </div>
        </div>
      )}
      <ProgressView />
      <ErrorView />
    </ToolShell>
  )
}

/* ========== 图片转视频 ========== */
export function ImageToVideo() {
  const tool = getToolById('image-to-video')!
  const { t } = useI18n()
  const [files, setFiles] = useState<File[]>([])
  const [duration, setDuration] = useState('3')
  const { processing, process, reset, ResultView, ProgressView, ErrorView } = useToolProcessor()

  const handleStart = () => {
    if (files.length === 0) return
    const inputFiles = files.map((f, i) => ({ name: `img_${i}.${f.name.split('.').pop()}`, file: f }))

    // 必须用 -filter_complex concat，不能再用 concat demuxer：
    // concat demuxer 会把不同格式的图片塞给同一个解码器（jpg 后接 png/webp），
    // 解码器按上一张的编码格式解析下一张 => "mjpeg: unsupported coding type"，
    // 最终 "Output file is empty"（可能 exit=0 却产出 0 字节，或直接退出码非 0）。
    // 多输入 + filter_complex 让每张图各自走解码器，再统一 concat。
    const inputs = inputFiles.flatMap((f) => [
      // GIF 用 -stream_loop 循环，静态图用 -loop 1；都限定 -t 保证每张图的时长
      ...(/\.gif$/i.test(f.name) ? ['-stream_loop', '-1'] : ['-loop', '1']),
      '-t', duration, '-i', f.name,
    ])
    const parts = inputFiles.map((_, i) =>
      `[${i}:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30,format=yuv420p[v${i}]`
    )
    const concat = `${inputFiles.map((_, i) => `[v${i}]`).join('')}concat=n=${inputFiles.length}:v=1:a=0[o]`

    process({
      outputExt: 'mp4',
      inputFiles,
      buildArgs: (_inp, out) => [...inputs, '-filter_complex', `${parts.join(';')};${concat}`, '-map', '[o]', '-c:v', 'libx264', '-preset', 'fast', '-movflags', '+faststart', out],
    })
  }

  return (
    <ToolShell tool={tool} maxWidth="max-w-3xl">
      <ResultView onReset={() => setFiles([])} />
      <FileUpload accept="image/*" multiple selectedFiles={files}
        onFilesSelected={(f) => setFiles(prev => [...prev, ...f])}
        onRemove={(i) => setFiles(prev => prev.filter((_, idx) => idx !== i))}
        label="点击或拖拽多张图片（按顺序合成视频）" />
      {files.length > 0 && (
        <div className="mt-5 animate-slide-up">
          <label className="label">每张图片显示时长（秒）</label>
          <select className="select" value={duration} onChange={(e) => setDuration(e.target.value)}>
            <option value="1">1 秒</option>
            <option value="2">2 秒</option>
            <option value="3">3 秒</option>
            <option value="5">5 秒</option>
            <option value="10">10 秒</option>
          </select>
          <div className="mt-6 flex gap-3">
            <button onClick={handleStart} disabled={processing} className="btn-primary flex-1">{t('start')}</button>
            <button onClick={() => { setFiles([]); reset() }} className="btn-secondary">{t('reset')}</button>
          </div>
        </div>
      )}
      <ProgressView />
      <ErrorView />
    </ToolShell>
  )
}

/* ========== 图片转GIF ========== */
export function ImageToGif() {
  const tool = getToolById('image-to-gif')!
  const { t } = useI18n()
  const [files, setFiles] = useState<File[]>([])
  const [delay, setDelay] = useState('50')
  const { processing, process, reset, ResultView, ProgressView, ErrorView } = useToolProcessor()

  const handleStart = async () => {
    if (files.length === 0) return
    const inputFiles = files.map((f, i) => ({ name: `img_${i}.${f.name.split('.').pop()}`, file: f }))
    const dur = String(parseInt(delay) / 100)

    // 画布取第一张图的宽高比（宽度固定 480），保证所有帧尺寸一致才能 concat；
    // 尺寸必须为偶数，否则 GIF 编码器会报错。
    const src = await getImageSize(files[0])
    const cw = 480
    const ch = src.w > 0 ? Math.max(2, Math.round((cw * src.h) / src.w / 2) * 2) : 360

    // 同 ImageToVideo：混格式图片必须走 filter_complex concat，concat demuxer 会解码错乱
    const inputs = inputFiles.flatMap((f) => [
      ...(/\.gif$/i.test(f.name) ? ['-stream_loop', '-1'] : ['-loop', '1']),
      '-t', dur, '-i', f.name,
    ])
    const parts = inputFiles.map((_, i) =>
      `[${i}:v]scale=${cw}:${ch}:force_original_aspect_ratio=decrease,pad=${cw}:${ch}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=10,format=rgb24[v${i}]`
    )
    const concat = `${inputFiles.map((_, i) => `[v${i}]`).join('')}concat=n=${inputFiles.length}:v=1:a=0[s]`
    const palette = `[s]split[p0][p1];[p0]palettegen[p];[p1][p]paletteuse[o]`

    process({
      outputExt: 'gif',
      inputFiles,
      buildArgs: (_inp, out) => [...inputs, '-filter_complex', `${parts.join(';')};${concat};${palette}`, '-map', '[o]', '-loop', '0', out],
    })
  }

  return (
    <ToolShell tool={tool} maxWidth="max-w-3xl">
      <ResultView onReset={() => setFiles([])} />
      <FileUpload accept="image/*" multiple selectedFiles={files}
        onFilesSelected={(f) => setFiles(prev => [...prev, ...f])}
        onRemove={(i) => setFiles(prev => prev.filter((_, idx) => idx !== i))}
        label="点击或拖拽多张图片（按顺序合成GIF）" />
      {files.length > 0 && (
        <div className="mt-5">
          <label className="label">帧间隔（毫秒，越小越快）</label>
          <select className="select" value={delay} onChange={(e) => setDelay(e.target.value)}>
            <option value="100">100ms (慢)</option>
            <option value="50">50ms (标准)</option>
            <option value="30">30ms (快)</option>
            <option value="20">20ms (很快)</option>
          </select>
          <div className="mt-6 flex gap-3">
            <button onClick={handleStart} disabled={processing} className="btn-primary flex-1">{t('start')}</button>
            <button onClick={() => { setFiles([]); reset() }} className="btn-secondary">{t('reset')}</button>
          </div>
        </div>
      )}
      <ProgressView />
      <ErrorView />
    </ToolShell>
  )
}
