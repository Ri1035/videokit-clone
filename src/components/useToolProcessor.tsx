import { useState } from 'react'
import ProgressBar from './ProgressBar'
import { runFFmpegTask } from '../lib/ffmpegEngine'
import { downloadBlob, replaceExtension, formatFileSize } from '../lib/utils'
import { useI18n } from '../i18n'

interface ResultState {
  blob: Blob
  name: string
}

interface UseToolProcessorOptions {
  outputExt: string
  buildArgs: (inputNames: string[], outputName: string, params: Record<string, string>) => string[]
  inputFiles: { name: string; file: File | Blob }[]
  onSuccess?: (result: ResultState) => void
}

export function useToolProcessor() {
  const { t } = useI18n()
  const [processing, setProcessing] = useState(false)
  const [engineLoading, setEngineLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [result, setResult] = useState<ResultState | null>(null)

  const process = async (opts: UseToolProcessorOptions) => {
    setProcessing(true)
    setEngineLoading(true)
    setProgress(0)
    setError('')
    setResult(null)

    const outputName = `output_${Date.now()}.${opts.outputExt}`

    try {
      const args = opts.buildArgs(
        opts.inputFiles.map(f => f.name),
        outputName,
        {}
      )

      const blob = await runFFmpegTask({
        inputFiles: opts.inputFiles,
        args,
        outputName,
        onProgress: (p) => {
          setEngineLoading(false)
          setProgress(p.progress)
        },
      })

      const firstName = opts.inputFiles[0]?.name || 'output'
      const resultName = replaceExtension(firstName.replace(/^input_\d+/, ''), opts.outputExt)
      const r = { blob, name: resultName }
      setResult(r)
      opts.onSuccess?.(r)
    } catch (e: any) {
      setError(e?.message || '处理失败，请重试')
    } finally {
      setProcessing(false)
      setEngineLoading(false)
    }
  }

  const reset = () => {
    setResult(null)
    setProgress(0)
    setError('')
  }

  const ResultView = ({ onReset }: { onReset?: () => void }) => {
    if (!result) return null
    return (
      <div className="text-center py-6 animate-slide-up">
        <div className="text-5xl mb-4">✅</div>
        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-1">{t('done')}</h3>
        <p className="text-sm text-gray-400 mb-4">{result.name}</p>
        <p className="text-xs text-gray-400 mb-6">{formatFileSize(result.blob.size)}</p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => downloadBlob(result.blob, result.name)} className="btn-primary">
            ⬇ {t('download')}
          </button>
          <button onClick={() => { reset(); onReset?.() }} className="btn-secondary">
            {t('reset')}
          </button>
        </div>
      </div>
    )
  }

  const ProgressView = () => {
    if (!processing) return null
    return (
      <div className="mt-5 animate-slide-up">
        <ProgressBar progress={progress} label={engineLoading ? t('loadingEngine') : t('processing')} />
      </div>
    )
  }

  const ErrorView = () => {
    if (!error) return null
    return (
      <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm">
        {error}
      </div>
    )
  }

  return { processing, progress, error, result, process, reset, ResultView, ProgressView, ErrorView }
}
