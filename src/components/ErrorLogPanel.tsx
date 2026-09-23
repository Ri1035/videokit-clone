import { useState, useEffect } from 'react'
import { getErrorLogs, clearErrorLogs, exportErrorLogs, ErrorLog } from '../lib/errorLog'
import { useI18n } from '../i18n'
import { downloadBlob } from '../lib/utils'

interface Props {
  onClose: () => void
}

export default function ErrorLogPanel({ onClose }: Props) {
  const { lang } = useI18n()
  const [logs, setLogs] = useState<ErrorLog[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    setLogs(getErrorLogs())
  }, [])

  const handleClear = () => {
    if (confirm(lang === 'zh' ? '确定清空所有错误日志？' : 'Clear all error logs?')) {
      clearErrorLogs()
      setLogs([])
    }
  }

  const handleExport = () => {
    const data = exportErrorLogs()
    const blob = new Blob([data], { type: 'application/json' })
    downloadBlob(blob, `videokit-error-logs-${Date.now()}.json`)
  }

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleString(lang === 'zh' ? 'zh-CN' : 'en-US')
  }

  const typeColors: Record<string, string> = {
    error: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    unhandledrejection: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
    ffmpeg: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    user: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="card w-full max-w-2xl max-h-[80vh] flex flex-col animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-slate-700">
          <div>
            <h2 className="text-lg font-bold">{lang === 'zh' ? '错误日志' : 'Error Logs'}</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {logs.length} {lang === 'zh' ? '条记录（本地存储，最多200条）' : 'records (local, max 200)'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleExport} className="btn-ghost text-sm" disabled={logs.length === 0}>
              {lang === 'zh' ? '导出' : 'Export'}
            </button>
            <button onClick={handleClear} className="btn-ghost text-sm text-red-500 hover:bg-red-50">
              {lang === 'zh' ? '清空' : 'Clear'}
            </button>
            <button onClick={onClose} className="btn-ghost text-sm">✕</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {logs.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <div className="text-4xl mb-3">✅</div>
              <p>{lang === 'zh' ? '暂无错误记录' : 'No errors logged'}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <div key={log.id} className="rounded-xl bg-gray-50 dark:bg-slate-700/50 overflow-hidden">
                  <button
                    onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                    className="w-full p-3 text-left hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`badge text-[10px] ${typeColors[log.type] || 'bg-gray-100'}`}>
                        {log.type}
                      </span>
                      <span className="text-xs text-gray-400">{formatTime(log.createdAt)}</span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-slate-200 line-clamp-1">{log.message}</p>
                  </button>
                  {expanded === log.id && (
                    <div className="px-3 pb-3 border-t border-gray-200 dark:border-slate-600 pt-2">
                      {log.toolId && <p className="text-xs text-gray-400 mb-1">Tool: {log.toolId}</p>}
                      {log.stack && (
                        <pre className="text-xs bg-gray-900 text-green-400 p-2 rounded-lg overflow-x-auto max-h-40">
                          {log.stack}
                        </pre>
                      )}
                      <p className="text-xs text-gray-400 mt-2 truncate">UA: {log.userAgent}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
