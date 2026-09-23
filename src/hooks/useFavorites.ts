/**
 * 收藏功能 Hook
 */
import { useState, useEffect, useCallback } from 'react'

const FAV_KEY = 'vk_favorites'

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(FAV_KEY) || '[]')
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem(FAV_KEY, JSON.stringify(favorites))
  }, [favorites])

  const toggleFavorite = useCallback((id: string) => {
    setFavorites(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    )
  }, [])

  const isFavorite = useCallback((id: string) => favorites.includes(id), [favorites])

  return { favorites, toggleFavorite, isFavorite }
}
