import { useState, useRef } from 'react'
import ProgressBar from './ProgressBar'
import { runFFmpegTask } from '../lib/ffmpegEngine'
import { transcodeWithFallback, type NativeContainer } from '../lib/webcodecs'
import { downloadBlob, replaceExtension, formatFileSize } from '../lib/utils'
import { useI18n } from '../i18n'
import { addHistory, updateHistory } from '../lib/history'
import { addErrorLog } from '../lib/errorLog'

interface ResultState {
  blob: Blob
  name: string
}

interface UseToolProcessorOptions {
  outputExt: string
  buildArgs: (inputNames: string[], outputName: string, params: Record<string, string>) => string[]
  inputFiles: { name: string; file: File | Blob }[]
  /**
   * 可选：该工具的输出容器适合用浏览器原生 WebCodecs 转码（webm / ogg）。
   * 传入后优先走原生管线，不可用时自动回退到 buildArgs 生成的 ffmpeg 命令。
   */
  native?: NativeContainer
  onSuccess?: (result: ResultState) => void
  toolId?: string
  toolName?: string
}

export function useToolProcessor() {
  const { t } = useI18n()
  const [processing, setProcessing] = useState(false)
  const [engineLoading, setEngineLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [result, setResult] = useState<ResultState | null>(null)
  const historyIdRef = useRef<string | null>(null)
  const startTimeRef = useRef<number>(0)

  const process = async (opts: UseToolProcessorOptions) => {
    setProcessing(true)
    setEngineLoading(true)
    setProgress(0)
    setError('')
    setResult(null)
    startTimeRef.current = Date.now()

    const firstFile = opts.inputFiles[0]?.file
    const inputFileName = firstFile instanceof File ? firstFile.name : 'input'
    const inputFileSize = firstFile instanceof File ? firstFile.size : 0

    // 记录历史（处理中状态）
    const record = addHistory({
      toolId: opts.toolId || 'unknown',
      toolName: opts.toolName || 'Unknown Tool',
      inputFileName,
      inputFileSize,
      outputExt: opts.outputExt,
      status: 'processing',
    })
    historyIdRef.current = record.id

    const outputName = `output_${Date.now()}.${opts.outputExt}`

    try {
      const args = opts.buildArgs(
        opts.inputFiles.map(f => f.name),
        outputName,
        {}
      )

      const ffmpegRun = () => runFFmpegTask({
        inputFiles: opts.inputFiles,
        args,
        outputName,
        onProgress: (p) => {
          setEngineLoading(false)
          setProgress(p.progress)
        },
      })

      const blob = opts.native && firstFile
        ? await transcodeWithFallback({
            file: firstFile,
            container: opts.native,
            onProgress: (p) => { setEngineLoading(false); setProgress(p) },
            ffmpegFallback: ffmpegRun,
          })
        : await ffmpegRun()

      const firstName = opts.inputFiles[0]?.name || 'output'
      const resultName = replaceExtension(firstName.replace(/^input_\d+/, ''), opts.outputExt)
      const r = { blob, name: resultName }
      setResult(r)

      // 更新历史为成功
      updateHistory(record.id, {
        status: 'success',
        outputFileName: resultName,
        outputFileSize: blob.size,
        duration: Date.now() - startTimeRef.current,
      })

      opts.onSuccess?.(r)
    } catch (e: any) {
      const errMsg = e?.message || '处理失败，请重试'
      setError(errMsg)

      // 更新历史为失败
      updateHistory(record.id, {
        status: 'failed',
        errorMessage: errMsg,
        duration: Date.now() - startTimeRef.current,
      })

      // 记录错误日志
      addErrorLog({
        type: 'ffmpeg',
        message: errMsg,
        stack: e?.stack,
        toolId: opts.toolId,
      })
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
        <ProgressBar
          progress={progress}
          label={engineLoading ? t('loadingEngine') : t('processing')}
          indeterminate={engineLoading}
          showPercent={!engineLoading}
        />
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
