import { createContext, useContext, useState, type ReactNode } from 'react'
import type { GlobalFilters, Tier } from '@/types'

// Period는 Overview 페이지 내부 필터로 이동 (oh-crm 패턴)
// 채널 단위 글로벌 필터: Tier / PIC / Channel + Favorites
interface SalesFilters extends GlobalFilters {
  tier: Tier | 'All'
  pic: string | 'All' // user id
  channelQuery: string
  selectedChannelId: string | null
  favoriteChannels: string[]
}

interface FilterContextType {
  filters: SalesFilters
  setFilters: (f: Partial<SalesFilters>) => void
  resetFilters: () => void
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  activeFilterCount: number
  toggleFavorite: (channelId: string) => void
}

const DEFAULT_FILTERS: SalesFilters = {
  // legacy (다른 페이지 호환용)
  clients: [],
  countries: [],
  hotels: [],
  regions: [],
  tiers: [],
  dateRange: { start: '2026-01-01', end: '2026-12-31' },
  currency: 'JPY',
  // 채널 단위 필터
  tier: 'All',
  pic: 'All',
  channelQuery: '',
  selectedChannelId: null,
  favoriteChannels: [],
}

const FAVORITES_KEY = 'sales-crm:favorite-channels'

function loadFavorites(): string[] {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

const FilterContext = createContext<FilterContextType | null>(null)

export function FilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFiltersState] = useState<SalesFilters>(() => ({
    ...DEFAULT_FILTERS,
    favoriteChannels: loadFavorites(),
  }))
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const setFilters = (partial: Partial<SalesFilters>) => {
    setFiltersState((prev) => {
      const next = { ...prev, ...partial }
      // 즐겨찾기 영속화
      if (partial.favoriteChannels) {
        try {
          localStorage.setItem(FAVORITES_KEY, JSON.stringify(partial.favoriteChannels))
        } catch {}
      }
      return next
    })
  }

  const resetFilters = () => {
    setFiltersState({ ...DEFAULT_FILTERS, favoriteChannels: filters.favoriteChannels })
  }

  const toggleFavorite = (channelId: string) => {
    const current = filters.favoriteChannels
    const next = current.includes(channelId)
      ? current.filter((id) => id !== channelId)
      : [...current, channelId]
    setFilters({ favoriteChannels: next })
  }

  const toggleSidebar = () => setSidebarCollapsed((prev) => !prev)

  const activeFilterCount = [
    filters.tier !== 'All',
    filters.pic !== 'All',
    filters.channelQuery.length > 0,
    filters.selectedChannelId !== null,
  ].filter(Boolean).length

  return (
    <FilterContext.Provider
      value={{
        filters,
        setFilters,
        resetFilters,
        sidebarCollapsed,
        toggleSidebar,
        activeFilterCount,
        toggleFavorite,
      }}
    >
      {children}
    </FilterContext.Provider>
  )
}

export function useFilters() {
  const ctx = useContext(FilterContext)
  if (!ctx) throw new Error('useFilters must be used within FilterProvider')
  return ctx
}
