"use client"

import { useState, useEffect, useRef } from "react"

interface SortConfig<K extends string> {
  key: K | null
  direction: 'asc' | 'desc' | 'none'
}

/**
 * Hook that persists sort configuration in sessionStorage.
 * Falls back gracefully if sessionStorage is unavailable.
 */
export function useSessionSort<K extends string>(
  storageKey: string,
  defaultConfig: SortConfig<K> = { key: null, direction: 'none' }
) {
  const [sortConfig, setSortConfig] = useState<SortConfig<K>>(defaultConfig)
  const hasLoadedFromStorage = useRef(false)

  // Load from sessionStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') return
    try {
      const saved = sessionStorage.getItem(storageKey)
      if (saved) setSortConfig(JSON.parse(saved))
    } catch { /* ignore */ }
    hasLoadedFromStorage.current = true
  }, [storageKey])

  // Persist to sessionStorage on change
  useEffect(() => {
    if (!hasLoadedFromStorage.current) return
    if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') return
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(sortConfig))
    } catch { /* ignore */ }
  }, [storageKey, sortConfig])

  /** Cycle sort direction: asc -> desc -> none (or start asc for new column) */
  function handleSort(key: K) {
    setSortConfig(prev => {
      if (prev.key === key) {
        const next = prev.direction === 'asc' ? 'desc' : prev.direction === 'desc' ? 'none' : 'asc'
        return { key, direction: next }
      }
      return { key, direction: 'asc' }
    })
  }

  return { sortConfig, handleSort } as const
}
