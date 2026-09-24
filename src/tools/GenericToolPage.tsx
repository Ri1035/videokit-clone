import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getToolById } from '../data/tools'
import { useI18n } from '../i18n'
import FileUpload from '../components/FileUpload'
import ProgressBar from '../components/ProgressBar'
import { runFFmpegTask } from '../lib/ffmpegEngine'
import { generateFFmpegArgs, QUALITY_OPTIONS } from '../lib/ffmpegCommands'
import { transcodeWithFallback, type NativeContainer } from '../lib/webcodecs'
import { replaceExtension, downloadBlob, formatFileSize } from '../lib/utils'

export default function GenericToolPage() {
  const { id } = useParams<{ id: string }>()
  const tool = getToolById(id || '')
  const { lang, t } = useI18n()

  const [file, setFile] = useState<File | null>(null)
  const [params, setParams] = useState<Record<string, string>>({})
  const [quality, setQuality] = useState('192k')
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<{ blob: Blob; name: string } | null>(null)
  const [error, setError] = useState('')
  const [engineLoading, setEngineLoading] = useState(false)

  if (!tool) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">工具不存在</p>
        <Link to="/" className="btn-primary mt-4 inline-block">返回首页</Link>
      </div>
    )
  }

  const config = tool.genericConfig

  const handleStart = async () => {
    if (!file || !config) return
    setProcessing(true)
    setEngineLoading(true)
    setProgress(0)
    setError('')
    setResult(null)

    const inputName = `input_${Date.now()}.${file.name.split('.').pop()}`
    const outputName = `output_${Date.now()}.${config.outputExt}`

    try {
      const allParams = { ...params }
      if (config.showQuality) allParams.quality = quality

      const args = generateFFmpegArgs(config.command, inputName, outputName, allParams)

      // WebM / OGG 走浏览器原生 WebCodecs（ffmpeg.wasm 的 libvpx-vp9 / libopus 会崩），
      // 不支持 WebCodecs 时自动回退到上面的 ffmpeg 命令。
      const container: NativeContainer | null =
        config.command === 'to-webm' ? 'webm' : config.command === 'to-ogg' ? 'ogg' : null

      const ffmpegRun = () => runFFmpegTask({
        inputFiles: [{ name: inputName, file }],
        args,
        outputName,
        onProgress: (p) => {
          setEngineLoading(false)
          setProgress(p.progress)
        },
      })

      const blob = container
        ? await transcodeWithFallback({
            file,
            container,
            onProgress: (p) => { setEngineLoading(false); setProgress(p) },
            ffmpegFallback: ffmpegRun,
          })
        : await ffmpegRun()

      setResult({ blob, name: replaceExtension(file.name, config.outputExt) })
    } catch (e: any) {
      setError(e?.message || '处理失败，请重试')
    } finally {
      setProcessing(false)
      setEngineLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      {/* 工具标题 */}
      <div className="mb-6">
        <Link to="/" className="text-sm text-gray-400 hover:text-brand-500 transition-colors">← {t('back')}</Link>
        <div className="flex items-center gap-3 mt-2">
          <span className="text-3xl">{tool.icon}</span>
          <div>
            <h1 className="text-xl font-bold text-gray-800 dark:text-white">
              {lang === 'zh' ? tool.name : tool.nameEn}
            </h1>
            <p className="text-sm text-gray-400">{lang === 'zh' ? tool.description : tool.descriptionEn}</p>
          </div>
        </div>
      </div>

      <div className="card p-6">
        {!result ? (
          <>
            <FileUpload
              accept={config?.accept || '*'}
              selectedFiles={file ? [file] : []}
              onFilesSelected={(files) => { setFile(files[0]); setResult(null) }}
              onRemove={() => setFile(null)}
            />

            {/* 参数面板 */}
            {file && config?.params && config.params.length > 0 && (
              <div className="mt-5 space-y-4 animate-slide-up">
                {config.params.map(p => (
                  <div key={p.key}>
                    <label className="label">{lang === 'zh' ? p.label : p.labelEn}</label>
                    {p.type === 'select' && (
                      <select
                        className="select"
                        value={params[p.key] || String(p.default)}
                        onChange={(e) => setParams(prev => ({ ...prev, [p.key]: e.target.value }))}
                      >
                        {p.options?.map(o => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    )}
                    {p.type === 'slider' && (
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min={p.min} max={p.max} step={p.step}
                          value={params[p.key] || String(p.default)}
                          onChange={(e) => setParams(prev => ({ ...prev, [p.key]: e.target.value }))}
                        />
                        <span className="text-sm font-medium text-gray-600 dark:text-slate-300 w-16 text-right">
                          {params[p.key] || p.default}{p.unit}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* 质量选项 */}
            {file && config?.showQuality && (
              <div className="mt-5 animate-slide-up">
                <label className="label">{t('quality')}</label>
                <select className="select" value={quality} onChange={(e) => setQuality(e.target.value)}>
                  {QUALITY_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            )}

            {/* 进度 */}
            {processing && (
              <div className="mt-5 animate-slide-up">
                <ProgressBar progress={progress} label={engineLoading ? t('loadingEngine') : t('processing')} />
              </div>
            )}

            {/* 错误 */}
            {error && (
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm">
                {error}
              </div>
            )}

            {/* 开始按钮 */}
            <div className="mt-6 flex gap-3">
              <button
                onClick={handleStart}
                disabled={!file || processing}
                className="btn-primary flex-1"
              >
                {processing ? t('processing') : t('start')}
              </button>
              {file && !processing && (
                <button onClick={() => { setFile(null); setResult(null) }} className="btn-secondary">
                  {t('reset')}
                </button>
              )}
            </div>
          </>
        ) : (
          /* 结果页 */
          <div className="text-center py-6 animate-slide-up">
            <div className="text-5xl mb-4">✅</div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-1">{t('done')}</h3>
            <p className="text-sm text-gray-400 mb-4">{result.name}</p>
            <p className="text-xs text-gray-400 mb-6">{formatFileSize(result.blob.size)}</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => downloadBlob(result.blob, result.name)}
                className="btn-primary"
              >
                ⬇ {t('download')}
              </button>
              <button
                onClick={() => { setResult(null); setFile(null); setProgress(0) }}
                className="btn-secondary"
              >
                {t('reset')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
