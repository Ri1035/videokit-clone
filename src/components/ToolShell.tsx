import { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ToolMeta } from '../data/tools'
import { useI18n } from '../i18n'

interface ToolShellProps {
  tool: ToolMeta
  children: ReactNode
  maxWidth?: string
}

export default function ToolShell({ tool, children, maxWidth = 'max-w-2xl' }: ToolShellProps) {
  const { lang, t } = useI18n()
  return (
    <div className={`${maxWidth} mx-auto animate-fade-in`}>
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
        {children}
      </div>
    </div>
  )
}
