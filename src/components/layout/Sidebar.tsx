import { useState } from 'react'
import { PanelLeftClose, PanelLeftOpen, RotateCcw, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useFilters } from '@/contexts/FilterContext'

const REGIONS = ['East Asia', 'SE Asia', 'South Asia', 'Middle East', 'Oceania'] as const

const REGION_LABELS: Record<string, string> = {
  'East Asia': '동아시아',
  'SE Asia': '동남아시아',
  'South Asia': '남아시아',
  'Middle East': '중동',
  'Oceania': '오세아니아',
}

export default function Sidebar() {
  const { filters, setFilters, resetFilters, sidebarCollapsed, toggleSidebar, activeFilterCount } = useFilters()
  const [clientSearch, setClientSearch] = useState('')

  const handleCountryToggle = (region: string) => {
    const current = filters.countries
    if (current.includes(region)) {
      setFilters({ countries: current.filter((c) => c !== region) })
    } else {
      setFilters({ countries: [...current, region] })
    }
  }

  if (sidebarCollapsed) {
    return (
      <aside className="w-12 bg-card border-r border-border flex flex-col items-center pt-3 shrink-0 sticky top-14 h-[calc(100vh-3.5rem)]">
        <button
          onClick={toggleSidebar}
          className="relative p-2 rounded-md hover:bg-accent transition-colors"
          title="필터 열기"
        >
          <PanelLeftOpen className="w-5 h-5 text-muted-foreground" />
          {activeFilterCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </aside>
    )
  }

  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col shrink-0 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="text-sm font-semibold text-foreground">글로벌 필터</span>
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-md hover:bg-accent transition-colors"
          title="필터 닫기"
        >
          <PanelLeftClose className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      <div className="flex flex-col gap-5 px-4 py-4">
        {/* Client Filter */}
        <section>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
            클라이언트
          </label>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="클라이언트 검색..."
              value={clientSearch}
              onChange={(e) => setClientSearch(e.target.value)}
              className={cn(
                'w-full pl-8 pr-3 py-2 text-sm rounded-md border border-input bg-background',
                'placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring'
              )}
            />
          </div>
          {filters.clients.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {filters.clients.map((c) => (
                <span
                  key={c}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full"
                >
                  {c}
                  <button
                    onClick={() => setFilters({ clients: filters.clients.filter((x) => x !== c) })}
                    className="hover:text-destructive"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          )}
        </section>

        {/* Country/Region Filter */}
        <section>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
            지역
          </label>
          <div className="flex flex-col gap-1.5">
            {REGIONS.map((region) => (
              <label
                key={region}
                className="flex items-center gap-2 text-sm cursor-pointer hover:bg-accent rounded px-2 py-1 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={filters.countries.includes(region)}
                  onChange={() => handleCountryToggle(region)}
                  className="w-3.5 h-3.5 rounded border-input accent-primary"
                />
                <span>{REGION_LABELS[region]}</span>
              </label>
            ))}
          </div>
        </section>

        {/* Date Range Filter */}
        <section>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
            기간
          </label>
          <div className="flex flex-col gap-2">
            <div>
              <span className="text-xs text-muted-foreground">시작일</span>
              <input
                type="date"
                value={filters.dateRange.start}
                onChange={(e) =>
                  setFilters({ dateRange: { ...filters.dateRange, start: e.target.value } })
                }
                className="w-full px-2.5 py-1.5 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <span className="text-xs text-muted-foreground">종료일</span>
              <input
                type="date"
                value={filters.dateRange.end}
                onChange={(e) =>
                  setFilters({ dateRange: { ...filters.dateRange, end: e.target.value } })
                }
                className="w-full px-2.5 py-1.5 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        </section>

        {/* Currency Selector */}
        <section>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
            통화
          </label>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 text-sm rounded-md border border-input bg-muted font-medium">
              JPY (¥)
            </span>
            <span className="text-xs text-muted-foreground italic">추후 확장</span>
          </div>
        </section>

        {/* Reset Button */}
        <button
          onClick={resetFilters}
          className={cn(
            'flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-md',
            'border border-border hover:bg-accent transition-colors text-muted-foreground'
          )}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          필터 초기화
        </button>
      </div>
    </aside>
  )
}
