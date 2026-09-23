/**
 * 用户操作历史记录
 * 记录每次视频处理操作，存储在 localStorage
 */

export interface HistoryRecord {
  id: string
  toolId: string
  toolName: string
  inputFileName: string
  inputFileSize: number
  outputFileName?: string
  outputFileSize?: number
  outputExt?: string
  status: 'success' | 'failed' | 'processing'
  errorMessage?: string
  params?: Record<string, string>
  createdAt: number
  duration?: number // 处理耗时（毫秒）
}

const HISTORY_KEY = 'vk_history'
const MAX_RECORDS = 100

export function getHistory(): HistoryRecord[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]')
  } catch {
    return []
  }
}

export function addHistory(record: Omit<HistoryRecord, 'id' | 'createdAt'>): HistoryRecord {
  const history = getHistory()
  const newRecord: HistoryRecord = {
    ...record,
    id: Math.random().toString(36).substring(2, 10),
    createdAt: Date.now(),
  }
  history.unshift(newRecord)
  // 限制最大记录数
  const trimmed = history.slice(0, MAX_RECORDS)
  localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed))
  return newRecord
}

export function updateHistory(id: string, updates: Partial<HistoryRecord>) {
  const history = getHistory()
  const idx = history.findIndex(r => r.id === id)
  if (idx !== -1) {
    history[idx] = { ...history[idx], ...updates }
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
  }
}

export function clearHistory() {
  localStorage.removeItem(HISTORY_KEY)
}

export function removeHistory(id: string) {
  const history = getHistory().filter(r => r.id !== id)
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
}

export function getHistoryStats() {
  const history = getHistory()
  const success = history.filter(r => r.status === 'success').length
  const failed = history.filter(r => r.status === 'failed').length
  const totalInputSize = history.reduce((sum, r) => sum + (r.inputFileSize || 0), 0)
  const totalOutputSize = history.reduce((sum, r) => sum + (r.outputFileSize || 0), 0)
  return { total: history.length, success, failed, totalInputSize, totalOutputSize }
}
