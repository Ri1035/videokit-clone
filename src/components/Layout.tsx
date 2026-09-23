import { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useI18n } from '../i18n'
import { useTheme } from '../hooks/useTheme'
import { TOTAL_TOOLS } from '../data/tools'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const { lang, setLang, t } = useI18n()
  const { dark, toggle } = useTheme()
  const location = useLocation()
  const isHome = location.pathname === '/'

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-lg bg-white/80 dark:bg-slate-900/80 border-b border-gray-100 dark:border-slate-700">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-lg shadow-sm">
              ▶
            </div>
            <div>
              <span className="font-bold text-lg text-gray-800 dark:text-white">{t('appName')}</span>
              <span className="ml-2 text-xs text-gray-400 hidden sm:inline">{TOTAL_TOOLS} {t('toolsCount')}</span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            {!isHome && (
              <Link to="/" className="btn-ghost text-sm">
                ← {t('back')}
              </Link>
            )}
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as 'zh' | 'en')}
              className="bg-transparent text-sm text-gray-600 dark:text-slate-300 cursor-pointer rounded-lg px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors border-0 focus:outline-none"
            >
              <option value="zh">中文</option>
              <option value="en">English</option>
            </select>
            <button
              onClick={toggle}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
            >
              {dark ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 dark:border-slate-700 py-6 mt-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-xs text-gray-400 dark:text-slate-500">
          <p>{t('footer')}</p>
          <div className="flex justify-center gap-4 mt-2">
            <span>{t('privacyPolicy')}</span>
            <span>{t('terms')}</span>
            <span>{t('feedback')}</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
