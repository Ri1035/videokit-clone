import { useState } from 'react'
import { APP_VERSION, APP_BUILD_DATE, APP_REPO } from '../version/version'
import { useI18n } from '../i18n'
import HistoryPanel from './HistoryPanel'
import ErrorLogPanel from './ErrorLogPanel'

export default function VersionBadge() {
  const { lang } = useI18n()
  const [showHistory, setShowHistory] = useState(false)
  const [showErrors, setShowErrors] = useState(false)

  return (
    <>
      <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-slate-500">
        <a
          href={APP_REPO}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-brand-500 transition-colors font-mono"
          title={`构建于 ${APP_BUILD_DATE}`}
        >
          v{APP_VERSION}
        </a>
        <span>·</span>
        <button
          onClick={() => setShowHistory(true)}
          className="hover:text-brand-500 transition-colors"
        >
          {lang === 'zh' ? '历史记录' : 'History'}
        </button>
        <span>·</span>
        <button
          onClick={() => setShowErrors(true)}
          className="hover:text-brand-500 transition-colors"
        >
          {lang === 'zh' ? '错误日志' : 'Error Log'}
        </button>
      </div>

      {showHistory && <HistoryPanel onClose={() => setShowHistory(false)} />}
      {showErrors && <ErrorLogPanel onClose={() => setShowErrors(false)} />}
    </>
  )
}
