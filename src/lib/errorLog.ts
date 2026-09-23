/**
 * 前端错误日志系统
 * 捕获全局错误，存储在 localStorage，支持查看和导出
 */

export interface ErrorLog {
  id: string
  type: 'error' | 'unhandledrejection' | 'ffmpeg' | 'user'
  message: string
  stack?: string
  toolId?: string
  url: string
  createdAt: number
  userAgent: string
}

const ERROR_LOG_KEY = 'vk_error_logs'
const MAX_LOGS = 200

export function getErrorLogs(): ErrorLog[] {
  try {
    return JSON.parse(localStorage.getItem(ERROR_LOG_KEY) || '[]')
  } catch {
    return []
  }
}

export function addErrorLog(log: Omit<ErrorLog, 'id' | 'createdAt' | 'url' | 'userAgent'>): ErrorLog {
  const logs = getErrorLogs()
  const newLog: ErrorLog = {
    ...log,
    id: Math.random().toString(36).substring(2, 10),
    createdAt: Date.now(),
    url: window.location.href,
    userAgent: navigator.userAgent,
  }
  logs.unshift(newLog)
  const trimmed = logs.slice(0, MAX_LOGS)
  localStorage.setItem(ERROR_LOG_KEY, JSON.stringify(trimmed))
  console.error('[ErrorLog]', newLog)
  return newLog
}

export function clearErrorLogs() {
  localStorage.removeItem(ERROR_LOG_KEY)
}

export function exportErrorLogs(): string {
  const logs = getErrorLogs()
  return JSON.stringify(logs, null, 2)
}

/**
 * 初始化全局错误监听
 */
export function initErrorMonitoring() {
  window.addEventListener('error', (event) => {
    addErrorLog({
      type: 'error',
      message: event.message || 'Unknown error',
      stack: event.error?.stack,
    })
  })

  window.addEventListener('unhandledrejection', (event) => {
    addErrorLog({
      type: 'unhandledrejection',
      message: event.reason?.message || String(event.reason),
      stack: event.reason?.stack,
    })
  })

  console.log('✅ 错误监控已初始化')
}
