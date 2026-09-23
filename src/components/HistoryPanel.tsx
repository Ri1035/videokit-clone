import { useState, useEffect } from 'react'
import { getHistory, clearHistory, removeHistory, getHistoryStats, HistoryRecord } from '../lib/history'
import { useI18n } from '../i18n'
import { formatFileSize } from '../lib/utils'

interface Props {
  onClose: () => void
}

export default function HistoryPanel({ onClose }: Props) {
  const { lang } = useI18n()
  const [records, setRecords] = useState<HistoryRecord[]>([])
  const [stats, setStats] = useState(getHistoryStats())

  useEffect(() => {
    setRecords(getHistory())
    setStats(getHistoryStats())
  }, [])

  const handleClear = () => {
    if (confirm(lang === 'zh' ? '确定清空所有历史记录？' : 'Clear all history?')) {
      clearHistory()
      setRecords([])
      setStats(getHistoryStats())
    }
  }

  const handleRemove = (id: string) => {
    removeHistory(id)
    setRecords(getHistory())
    setStats(getHistoryStats())
  }

  const formatTime = (ts: number) => {
    const d = new Date(ts)
    return d.toLocaleString(lang === 'zh' ? 'zh-CN' : 'en-US', {
      month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="card w-full max-w-2xl max-h-[80vh] flex flex-col animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-slate-700">
          <div>
            <h2 className="text-lg font-bold">{lang === 'zh' ? '处理历史' : 'Processing History'}</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {lang === 'zh' ? '共' : 'Total'} {stats.total} {lang === 'zh' ? '条记录' : 'records'} ·
              {lang === 'zh' ? '成功' : 'Success'} {stats.success} ·
              {lang === 'zh' ? '失败' : 'Failed'} {stats.failed} ·
              {lang === 'zh' ? '处理总量' : 'Processed'} {formatFileSize(stats.totalInputSize)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleClear} className="btn-ghost text-sm text-red-500 hover:bg-red-50">
              {lang === 'zh' ? '清空' : 'Clear'}
            </button>
            <button onClick={onClose} className="btn-ghost text-sm">✕</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {records.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <div className="text-4xl mb-3">📋</div>
              <p>{lang === 'zh' ? '暂无处理记录' : 'No records yet'}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {records.map((r) => (
                <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-slate-700/50 group">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    r.status === 'success' ? 'bg-green-400' : r.status === 'failed' ? 'bg-red-400' : 'bg-yellow-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{r.toolName}</p>
                    <p className="text-xs text-gray-400 truncate">{r.inputFileName}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-gray-400">{formatTime(r.createdAt)}</p>
                    {r.outputFileSize && (
                      <p className="text-xs text-gray-400">{formatFileSize(r.outputFileSize)}</p>
                    )}
                    {r.duration && (
                      <p className="text-xs text-gray-400">{(r.duration / 1000).toFixed(1)}s</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemove(r.id)}
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all p-1"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
