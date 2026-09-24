/**
 * GIF 相关工具
 * 包含：视频转GIF、GIF压缩
 */
import { useState } from 'react'
import ToolShell from '../components/ToolShell'
import FileUpload from '../components/FileUpload'
import { useToolProcessor } from '../components/useToolProcessor'
import { getToolById } from '../data/tools'
import { useI18n } from '../i18n'

/* ========== 视频转 GIF ========== */
export function VideoToGif() {
  const tool = getToolById('video-to-gif')!
  const { t } = useI18n()
  const [file, setFile] = useState<File | null>(null)
  const [fps, setFps] = useState('15')
  const [width, setWidth] = useState('480')
  const [quality, setQuality] = useState('medium')
  const { processing, process, reset, ResultView, ProgressView, ErrorView } = useToolProcessor()

  const qualityMap: Record<string, string> = {
    low: 'stats_mode=diff',
    medium: 'stats_mode=full',
    high: 'stats_mode=single',
  }

  const handleStart = () => {
    if (!file) return
    const inputName = `input_${Date.now()}.${file.name.split('.').pop()}`
    process({
      outputExt: 'gif',
      inputFiles: [{ name: inputName, file }],
      buildArgs: (inp, out) => [
        '-i', inp[0],
        '-vf', `fps=${fps},scale=${width}:-1:flags=lanczos,split[s0][s1];[s0]palettegen=stats_mode=${qualityMap[quality] || 'full'}[p];[s1][p]paletteuse=dither=bayer:bayer_scale=5`,
        '-loop', '0',
        out,
      ],
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
            <label className="label">帧率 (FPS)</label>
            <select className="select" value={fps} onChange={(e) => setFps(e.target.value)}>
              <option value="10">10 fps (小体积)</option>
              <option value="15">15 fps (标准)</option>
              <option value="20">20 fps (流畅)</option>
              <option value="24">24 fps (电影感)</option>
              <option value="30">30 fps (高流畅)</option>
            </select>
          </div>
          <div>
            <label className="label">宽度（高度自动等比）</label>
            <select className="select" value={width} onChange={(e) => setWidth(e.target.value)}>
              <option value="320">320px (极小)</option>
              <option value="480">480px (小)</option>
              <option value="640">640px (中)</option>
              <option value="800">800px (大)</option>
              <option value="1080">1080px (高清)</option>
            </select>
          </div>
          <div>
            <label className="label">画质</label>
            <select className="select" value={quality} onChange={(e) => setQuality(e.target.value)}>
              <option value="low">低（体积小）</option>
              <option value="medium">中（推荐）</option>
              <option value="high">高（体积大）</option>
            </select>
          </div>
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

/* ========== GIF 压缩 ========== */
export function GifCompress() {
  const tool = getToolById('gif-compress')!
  const { t } = useI18n()
  const [file, setFile] = useState<File | null>(null)
  const [scale, setScale] = useState('100')
  const [fps, setFps] = useState('10')
  const [colors, setColors] = useState('128')
  const { processing, process, reset, ResultView, ProgressView, ErrorView } = useToolProcessor()

  const handleStart = () => {
    if (!file) return
    const inputName = `input_${Date.now()}.gif`
    process({
      outputExt: 'gif',
      inputFiles: [{ name: inputName, file }],
      buildArgs: (inp, out) => [
        '-i', inp[0],
        '-vf', `fps=${fps},scale=iw*${parseInt(scale)/100}:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=${colors}[p];[s1][p]paletteuse`,
        '-loop', '0',
        out,
      ],
    })
  }

  return (
    <ToolShell tool={tool}>
      <ResultView onReset={() => setFile(null)} />
      <FileUpload accept="image/gif,.gif" selectedFiles={file ? [file] : []}
        onFilesSelected={(f) => { setFile(f[0]); reset() }} onRemove={() => setFile(null)} />
      {file && (
        <div className="mt-5 space-y-4 animate-slide-up">
          <div>
            <label className="label">尺寸缩放: {scale}%</label>
            <input type="range" min={30} max={100} value={scale} onChange={(e) => setScale(e.target.value)} />
          </div>
          <div>
            <label className="label">帧率: {fps} fps</label>
            <input type="range" min={5} max={24} value={fps} onChange={(e) => setFps(e.target.value)} />
          </div>
          <div>
            <label className="label">颜色数: {colors}</label>
            <select className="select" value={colors} onChange={(e) => setColors(e.target.value)}>
              <option value="32">32色 (极小)</option>
              <option value="64">64色 (小)</option>
              <option value="128">128色 (标准)</option>
              <option value="256">256色 (高)</option>
            </select>
          </div>
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
