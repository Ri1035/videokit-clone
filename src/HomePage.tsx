import { useState, useMemo } from 'react'
import { TOOLS, CATEGORY_LABELS, ToolCategory, TOTAL_TOOLS } from './data/tools'
import { useI18n } from './i18n'
import { useFavorites } from './hooks/useFavorites'
import ToolCard from './components/ToolCard'

type FilterTab = 'all' | 'favorites' | ToolCategory

export default function HomePage() {
  const { lang, t } = useI18n()
  const { favorites, toggleFavorite, isFavorite } = useFavorites()
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [search, setSearch] = useState('')

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: t('allTools') },
    { key: 'favorites', label: `${t('favorites')}${favorites.length > 0 ? ` (${favorites.length})` : ''}` },
    ...(['convert', 'compress', 'edit', 'extract', 'fun'] as ToolCategory[]).map(c => ({
      key: c as FilterTab,
      label: CATEGORY_LABELS[c][lang],
    })),
  ]

  const filteredTools = useMemo(() => {
    let tools = TOOLS
    if (activeTab === 'favorites') {
      tools = tools.filter(t => favorites.includes(t.id))
    } else if (activeTab !== 'all') {
      tools = tools.filter(t => t.category === activeTab)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      tools = tools.filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.nameEn.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.tags.some(tag => tag.toLowerCase().includes(q))
      )
    }
    return tools
  }, [activeTab, search, favorites])

  const categoryOrder: ToolCategory[] = ['convert', 'compress', 'edit', 'extract', 'fun']

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <div className="text-center py-8 md:py-12">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white mb-3">
          {t('appName')}
          <span className="text-brand-500">.</span>
        </h1>
        <p className="text-gray-500 dark:text-slate-400 text-sm md:text-base max-w-xl mx-auto">
          {t('tagline')}
        </p>
        <div className="flex flex-wrap justify-center gap-3 mt-5">
          {[
            { icon: '🔒', label: t('privacy'), sub: t('localProcess') },
            { icon: '🆓', label: t('free'), sub: t('allFree') },
            { icon: '⚡', label: t('fast'), sub: t('browserFast') },
          ].map((f, i) => (
            <div key={i} className="card px-4 py-2.5 flex items-center gap-2.5">
              <span className="text-lg">{f.icon}</span>
              <div className="text-left">
                <p className="text-xs font-semibold text-gray-700 dark:text-slate-200">{f.label}</p>
                <p className="text-[10px] text-gray-400">{f.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="max-w-md mx-auto mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('search')}
          className="input pl-10"
          style={{ backgroundImage: 'none' }}
        />
        <span className="relative -mt-9 ml-3 block text-gray-400 text-sm w-4">🔍</span>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 justify-center mb-8">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              activeTab === tab.key
                ? 'bg-brand-500 text-white shadow-sm'
                : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tools Grid */}
      {activeTab === 'all' && !search ? (
        // 按分类展示
        <div className="space-y-10">
          {categoryOrder.map(cat => {
            const catTools = filteredTools.filter(t => t.category === cat)
            if (catTools.length === 0) return null
            return (
              <section key={cat}>
                <h2 className="text-lg font-bold text-gray-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                  {CATEGORY_LABELS[cat][lang]}
                  <span className="text-xs font-normal text-gray-400 bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                    {catTools.length}
                  </span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {catTools.map(tool => (
                    <ToolCard
                      key={tool.id}
                      tool={tool}
                      isFavorite={isFavorite(tool.id)}
                      onToggleFavorite={toggleFavorite}
                    />
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      ) : (
        // 筛选/搜索结果
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTools.map(tool => (
            <ToolCard
              key={tool.id}
              tool={tool}
              isFavorite={isFavorite(tool.id)}
              onToggleFavorite={toggleFavorite}
            />
          ))}
        </div>
      )}

      {filteredTools.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-4">🔍</div>
          <p>{lang === 'zh' ? '没有找到匹配的工具' : 'No tools found'}</p>
        </div>
      )}
    </div>
  )
}
