interface ProgressBarProps {
  progress: number // 0-1
  label?: string
  showPercent?: boolean
}

export default function ProgressBar({ progress, label, showPercent = true }: ProgressBarProps) {
  const pct = Math.round(progress * 100)
  return (
    <div className="w-full">
      {(label || showPercent) && (
        <div className="flex justify-between text-xs text-gray-500 dark:text-slate-400 mb-1.5">
          <span>{label || '处理中...'}</span>
          {showPercent && <span>{pct}%</span>}
        </div>
      )}
      <div className="w-full h-2.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-brand-400 to-brand-600 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
