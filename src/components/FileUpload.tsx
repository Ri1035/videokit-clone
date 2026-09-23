import { useRef, useState, useCallback, DragEvent, ChangeEvent } from 'react'
import { formatFileSize } from '../lib/utils'

interface FileUploadProps {
  accept?: string
  multiple?: boolean
  onFilesSelected: (files: File[]) => void
  selectedFiles?: File[]
  onRemove?: (index: number) => void
  label?: string
  sublabel?: string
}

export default function FileUpload({
  accept = '*',
  multiple = false,
  onFilesSelected,
  selectedFiles = [],
  onRemove,
  label,
  sublabel,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) onFilesSelected(files)
  }, [onFilesSelected])

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) onFilesSelected(files)
    e.target.value = ''
  }

  return (
    <div className="w-full">
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${
          dragging
            ? 'border-brand-400 bg-brand-50 dark:bg-brand-900/20 scale-[1.01]'
            : 'border-gray-200 dark:border-slate-600 hover:border-brand-300 hover:bg-gray-50 dark:hover:bg-slate-700/50'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          className="hidden"
        />
        <div className="text-4xl mb-3">📁</div>
        <p className="text-sm font-medium text-gray-700 dark:text-slate-200">
          {label || '点击或拖拽文件到这里'}
        </p>
        <p className="text-xs text-gray-400 dark:text-slate-400 mt-1">
          {sublabel || '所有处理在浏览器本地完成，保护隐私'}
        </p>
      </div>

      {selectedFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          {selectedFiles.map((file, i) => (
            <div
              key={i}
              className="flex items-center justify-between bg-gray-50 dark:bg-slate-700/50 rounded-xl px-4 py-3 animate-fade-in"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xl">📄</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate max-w-[240px]">{file.name}</p>
                  <p className="text-xs text-gray-400">{formatFileSize(file.size)}</p>
                </div>
              </div>
              {onRemove && (
                <button
                  onClick={(e) => { e.stopPropagation(); onRemove(i) }}
                  className="text-gray-400 hover:text-red-500 transition-colors p-1"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
