interface ProgressBarProps {
  progress: number // 0-1
  label?: string
  showPercent?: boolean
  indeterminate?: boolean // 不确定进度（引擎加载中）
}

export default function ProgressBar({ progress, label, showPercent = true, indeterminate = false }: ProgressBarProps) {
  const pct = Math.round(progress * 100)
  return (
    <div className="w-full">
      {(label || showPercent) && (
        <div className="flex justify-between text-xs text-gray-500 dark:text-slate-400 mb-1.5">
          <span>{label || '处理中...'}</span>
          {showPercent && !indeterminate && <span>{pct}%</span>}
          {indeterminate && <span className="animate-pulse">加载中...</span>}
        </div>
      )}
      <div className="w-full h-2.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden relative">
        {indeterminate ? (
          <div className="h-full w-1/3 bg-gradient-to-r from-brand-400 to-brand-600 rounded-full animate-indeterminate" />
        ) : (
          <div
            className="h-full bg-gradient-to-r from-brand-400 to-brand-600 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${pct}%` }}
          />
        )}
      </div>
    </div>
  )
}
