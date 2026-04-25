import { createContext, useContext, useState, type ReactNode } from 'react'
import type { GlobalFilters } from '@/types'

interface FilterContextType {
  filters: GlobalFilters
  setFilters: (f: Partial<GlobalFilters>) => void
  resetFilters: () => void
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  activeFilterCount: number
}

const DEFAULT_FILTERS: GlobalFilters = {
  clients: [],
  countries: [],
  hotels: [],
  dateRange: { start: '2026-01-01', end: '2026-12-31' },
  currency: 'JPY',
}

const FilterContext = createContext<FilterContextType | null>(null)

export function FilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFiltersState] = useState<GlobalFilters>(DEFAULT_FILTERS)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const setFilters = (partial: Partial<GlobalFilters>) => {
    setFiltersState(prev => ({ ...prev, ...partial }))
  }

  const resetFilters = () => setFiltersState(DEFAULT_FILTERS)

  const toggleSidebar = () => setSidebarCollapsed(prev => !prev)

  const activeFilterCount = [
    filters.clients.length > 0,
    filters.countries.length > 0,
    filters.hotels.length > 0,
  ].filter(Boolean).length

  return (
    <FilterContext.Provider value={{
      filters, setFilters, resetFilters,
      sidebarCollapsed, toggleSidebar, activeFilterCount,
    }}>
      {children}
    </FilterContext.Provider>
  )
}

export function useFilters() {
  const ctx = useContext(FilterContext)
  if (!ctx) throw new Error('useFilters must be used within FilterProvider')
  return ctx
}
