/**
 * 简易国际化 - 中英双语
 */
import { useState, useEffect, createContext, useContext, ReactNode } from 'react'

export type Lang = 'zh' | 'en'

const translations = {
  zh: {
    appName: 'VideoKit',
    tagline: '简单的在线视频处理工具，完全免费，隐私安全，超级快',
    allTools: '全部工具',
    favorites: '我的收藏',
    search: '搜索工具...',
    upload: '点击或拖拽文件到这里',
    uploadSub: '支持视频、音频文件，所有处理在浏览器本地完成',
    processing: '处理中...',
    download: '下载文件',
    downloadAll: '全部下载',
    start: '开始处理',
    back: '返回',
    reset: '重置',
    quality: '音频质量',
    outputFormat: '输出格式',
    resolution: '分辨率',
    keepOriginal: '保持原始',
    loadingEngine: '正在加载处理引擎...',
    engineReady: '引擎就绪',
    privacy: '本地优先，隐私安全',
    free: '完全免费使用',
    fast: '高效快速转换',
    localProcess: '编辑类工具本地处理',
    allFree: '所有功能免费使用',
    browserFast: '浏览器端高速处理',
    noFile: '请先选择文件',
    selectFile: '选择文件',
    orDrag: '或将文件拖到此处',
    fileInfo: '文件信息',
    fileName: '文件名',
    fileSize: '文件大小',
    duration: '时长',
    progress: '处理进度',
    done: '处理完成',
    error: '处理失败',
    retry: '重试',
    addMore: '添加更多',
    remove: '移除',
    preview: '预览',
    settings: '设置',
    language: '语言',
    theme: '主题',
    light: '浅色',
    dark: '深色',
    footer: '© 2026 VideoKit. 纯前端开源项目',
    guide: '视频处理指南',
    privacyPolicy: '隐私政策',
    terms: '服务条款',
    feedback: '反馈',
    toolsCount: '个工具',
    category: {
      convert: '格式转换',
      compress: '压缩优化',
      edit: '编辑处理',
      extract: '提取导出',
      fun: '特色玩法',
    },
  },
  en: {
    appName: 'VideoKit',
    tagline: 'Simple online video tools. Free, private, super fast.',
    allTools: 'All Tools',
    favorites: 'Favorites',
    search: 'Search tools...',
    upload: 'Click or drag file here',
    uploadSub: 'Video & audio files. All processing in your browser.',
    processing: 'Processing...',
    download: 'Download',
    downloadAll: 'Download All',
    start: 'Start',
    back: 'Back',
    reset: 'Reset',
    quality: 'Audio Quality',
    outputFormat: 'Output Format',
    resolution: 'Resolution',
    keepOriginal: 'Keep Original',
    loadingEngine: 'Loading engine...',
    engineReady: 'Engine Ready',
    privacy: 'Local-first, Private',
    free: '100% Free',
    fast: 'Fast Conversion',
    localProcess: 'Editing tools run locally',
    allFree: 'All features free',
    browserFast: 'Fast browser processing',
    noFile: 'Please select a file first',
    selectFile: 'Select File',
    orDrag: 'or drag file here',
    fileInfo: 'File Info',
    fileName: 'Filename',
    fileSize: 'File Size',
    duration: 'Duration',
    progress: 'Progress',
    done: 'Done',
    error: 'Failed',
    retry: 'Retry',
    addMore: 'Add More',
    remove: 'Remove',
    preview: 'Preview',
    settings: 'Settings',
    language: 'Language',
    theme: 'Theme',
    light: 'Light',
    dark: 'Dark',
    footer: '© 2026 VideoKit. Open source frontend project',
    guide: 'Video Guide',
    privacyPolicy: 'Privacy',
    terms: 'Terms',
    feedback: 'Feedback',
    toolsCount: 'tools',
    category: {
      convert: 'Convert',
      compress: 'Compress',
      edit: 'Edit',
      extract: 'Extract',
      fun: 'Fun',
    },
  },
}

interface I18nContextType {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: string) => string
}

const I18nContext = createContext<I18nContextType>({
  lang: 'zh',
  setLang: () => {},
  t: (k: string) => k,
})

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    return (localStorage.getItem('vk_lang') as Lang) || 'zh'
  })

  useEffect(() => {
    localStorage.setItem('vk_lang', lang)
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en'
  }, [lang])

  const setLang = (l: Lang) => setLangState(l)

  const t = (key: string): string => {
    const keys = key.split('.')
    let val: any = translations[lang]
    for (const k of keys) {
      val = val?.[k]
    }
    return val || key
  }

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  return useContext(I18nContext)
}
