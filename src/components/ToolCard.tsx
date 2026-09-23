import { Link } from 'react-router-dom'
import { ToolMeta } from '../data/tools'
import { useI18n } from '../i18n'

interface ToolCardProps {
  tool: ToolMeta
  isFavorite: boolean
  onToggleFavorite: (id: string) => void
}

export default function ToolCard({ tool, isFavorite, onToggleFavorite }: ToolCardProps) {
  const { lang } = useI18n()
  return (
    <Link
      to={`/tool/${tool.id}`}
      className="group card p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer block"
    >
      <div className="flex items-start justify-between">
        <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-200">
          {tool.icon}
        </div>
        <button
          onClick={(e) => { e.preventDefault(); onToggleFavorite(tool.id) }}
          className={`text-lg transition-all ${isFavorite ? 'text-yellow-400 scale-110' : 'text-gray-300 dark:text-slate-600 hover:text-yellow-400'}`}
        >
          {isFavorite ? '★' : '☆'}
        </button>
      </div>
      <h3 className="font-semibold text-sm mb-1 text-gray-800 dark:text-slate-100">
        {lang === 'zh' ? tool.name : tool.nameEn}
      </h3>
      <p className="text-xs text-gray-400 dark:text-slate-400 line-clamp-2 mb-3 leading-relaxed">
        {lang === 'zh' ? tool.description : tool.descriptionEn}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {tool.tags.slice(0, 3).map(tag => (
          <span key={tag} className="badge bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300">
            {tag}
          </span>
        ))}
      </div>
    </Link>
  )
}
