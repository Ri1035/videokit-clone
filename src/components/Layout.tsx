import { ReactNode, useState, useRef, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useI18n } from '../i18n'
import { useTheme } from '../hooks/useTheme'
import { TOTAL_TOOLS } from '../data/tools'
import VersionBadge from './VersionBadge'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const { lang, setLang, t } = useI18n()
  const { dark, toggle } = useTheme()
  const location = useLocation()
  const isHome = location.pathname === '/'
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  // 点击外部关闭浮动框
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const features = [
    { icon: '🔒', label: t('privacy'), sub: t('localProcess') },
    { icon: '🆓', label: t('free'), sub: t('allFree') },
    { icon: '⚡', label: t('fast'), sub: t('browserFast') },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-lg bg-white/80 dark:bg-slate-900/80 border-b border-gray-100 dark:border-slate-700">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/favicon.svg" alt="VideoKit" className="w-9 h-9 rounded-xl object-contain" />
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

            {/* 个人主页按钮 */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
              >
                👤
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-11 w-72 card p-4 animate-pop-in shadow-lg z-50">
                  <div className="flex items-center gap-3 pb-3 border-b border-gray-100 dark:border-slate-700">
                    <img src="/favicon.svg" alt="VideoKit" className="w-12 h-12 rounded-xl object-contain" />
                    <div>
                      <p className="font-bold text-gray-800 dark:text-white">{t('appName')}</p>
                      <p className="text-xs text-gray-400">{t('tagline')}</p>
                    </div>
                  </div>

                  <div className="space-y-2.5 mt-3">
                    {features.map((f, i) => (
                      <div key={i} className="flex items-center gap-3 px-2 py-1.5 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                        <span className="text-xl">{f.icon}</span>
                        <div>
                          <p className="text-sm font-semibold text-gray-700 dark:text-slate-200">{f.label}</p>
                          <p className="text-xs text-gray-400">{f.sub}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-700">
                    <VersionBadge />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 dark:border-slate-700 py-6 mt-8">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-xs text-gray-400 dark:text-slate-500">{t('footer')}</p>
          <div className="flex justify-center gap-4 mt-2 text-xs text-gray-400 dark:text-slate-500">
            <span>{t('privacyPolicy')}</span>
            <span>{t('terms')}</span>
            <span>{t('feedback')}</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
