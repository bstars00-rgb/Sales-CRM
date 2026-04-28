import { useMemo, useState } from 'react'
import {
  PanelLeftClose, PanelLeftOpen, RotateCcw, Search, Star,
  Globe, User as UserIcon, Building2, X, Bookmark,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useFilters, SALES_COUNTRIES } from '@/contexts/FilterContext'
import { mockClients } from '@/mocks/clients'
import { SALES_PICS } from '@/mocks/users'

export default function Sidebar() {
  const {
    filters, setFilters, resetFilters,
    sidebarCollapsed, toggleSidebar, activeFilterCount,
    toggleFavorite, toggleCountry,
  } = useFilters()
  const [showChannelResults, setShowChannelResults] = useState(false)

  // 채널 검색 (Tier 표시 제거)
  const channelResults = useMemo(() => {
    if (!filters.channelQuery.trim()) return []
    const q = filters.channelQuery.toLowerCase()
    return mockClients
      .filter((c) => c.name.toLowerCase().includes(q))
      .slice(0, 20)
  }, [filters.channelQuery])

  const favoriteChannelObjects = useMemo(
    () => mockClients.filter((c) => filters.favoriteChannels.includes(c.id)),
    [filters.favoriteChannels]
  )

  const selectedChannel = filters.selectedChannelId
    ? mockClients.find((c) => c.id === filters.selectedChannelId)
    : null

  // ─── Collapsed mode ───
  if (sidebarCollapsed) {
    return (
      <aside className="w-12 bg-card border-r border-border flex flex-col items-center pt-3 shrink-0 sticky top-14 h-[calc(100vh-3.5rem)]">
        <button
          onClick={toggleSidebar}
          className="relative p-2 rounded-md hover:bg-accent transition-colors"
          title="필터 열기"
          aria-label="필터 열기"
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

  // ─── Expanded mode ───
  return (
    <aside className="w-72 bg-card border-r border-border flex flex-col shrink-0 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="text-sm font-semibold flex items-center gap-1.5">
          채널 필터
          {activeFilterCount > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-primary text-primary-foreground">
              {activeFilterCount}
            </span>
          )}
        </span>
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-md hover:bg-accent transition-colors"
          title="필터 닫기"
          aria-label="필터 닫기"
        >
          <PanelLeftClose className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      <p className="text-[10px] text-muted-foreground px-4 pt-3 leading-relaxed">
        Period · 통계 필터는 Overview 페이지에서 설정합니다.
      </p>

      <div className="flex flex-col gap-5 px-4 py-4">
        {/* 1. 판매 국가 (multi-select) */}
        <Section icon={Globe} title="판매 국가" badge={filters.salesCountries.length > 0 ? `${filters.salesCountries.length}개 선택` : undefined}>
          <div className="grid grid-cols-2 gap-1">
            {SALES_COUNTRIES.map((c) => {
              const selected = filters.salesCountries.includes(c.code)
              return (
                <button
                  key={c.code}
                  onClick={() => toggleCountry(c.code)}
                  className={cn(
                    'flex items-center gap-1.5 px-2 py-1.5 rounded-md border text-xs transition-colors',
                    selected
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                      : 'border-border hover:bg-accent'
                  )}
                  aria-pressed={selected}
                >
                  <span className="text-base leading-none">{c.flag}</span>
                  <span className="truncate">{c.label}</span>
                </button>
              )
            })}
          </div>
          {filters.salesCountries.length > 0 && (
            <button
              onClick={() => setFilters({ salesCountries: [] })}
              className="mt-1.5 text-[10px] text-muted-foreground hover:text-foreground"
            >
              전체 해제
            </button>
          )}
        </Section>

        {/* 2. 담당 PIC */}
        <Section icon={UserIcon} title="담당 PIC">
          <select
            value={filters.pic}
            onChange={(e) => setFilters({ pic: e.target.value })}
            className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
            aria-label="PIC 필터"
          >
            <option value="All">전체 ({SALES_PICS.length}명)</option>
            {SALES_PICS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.country})
              </option>
            ))}
          </select>
        </Section>

        {/* 3. 채널 검색 */}
        <Section icon={Building2} title="채널 검색">
          {selectedChannel ? (
            <div className="flex items-center gap-1 border rounded-md px-2 py-1.5 bg-primary/10">
              <span className="text-xs font-medium truncate flex-1">{selectedChannel.name}</span>
              <button
                onClick={() => setFilters({ selectedChannelId: null, channelQuery: '' })}
                aria-label="선택 채널 해제"
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  value={filters.channelQuery}
                  onChange={(e) => {
                    setFilters({ channelQuery: e.target.value })
                    setShowChannelResults(true)
                  }}
                  onFocus={() => setShowChannelResults(true)}
                  placeholder="채널명 입력..."
                  aria-label="채널 검색"
                  className="w-full pl-7 pr-3 h-8 rounded-md border border-input bg-background text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              {showChannelResults && channelResults.length > 0 && (
                <div className="mt-1 max-h-48 overflow-y-auto border rounded-md divide-y">
                  {channelResults.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setFilters({ selectedChannelId: c.id, channelQuery: '' })
                        setShowChannelResults(false)
                      }}
                      className="w-full text-left px-2 py-1.5 hover:bg-primary/10 text-xs flex items-center justify-between gap-2"
                    >
                      <span className="font-medium truncate">{c.name}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleFavorite(c.id)
                        }}
                        className="shrink-0 text-muted-foreground hover:text-amber-500"
                        aria-label="북마크 토글"
                      >
                        <Bookmark
                          className={cn(
                            'w-3 h-3',
                            filters.favoriteChannels.includes(c.id) && 'fill-amber-500 text-amber-500'
                          )}
                        />
                      </button>
                    </button>
                  ))}
                </div>
              )}
              {showChannelResults && filters.channelQuery && channelResults.length === 0 && (
                <p className="mt-1 text-[10px] text-muted-foreground text-center py-2 border rounded-md">
                  검색 결과 없음
                </p>
              )}
            </>
          )}
        </Section>

        {/* 4. 북마크 (즐겨찾기 채널) */}
        <Section
          icon={Bookmark}
          title="북마크"
          badge={favoriteChannelObjects.length > 0 ? `${favoriteChannelObjects.length}` : undefined}
        >
          {favoriteChannelObjects.length === 0 ? (
            <p className="text-[10px] text-muted-foreground py-2">
              채널 검색 시 ⭐ 아이콘으로 북마크 추가
            </p>
          ) : (
            <ul className="space-y-1">
              {favoriteChannelObjects.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center gap-2 px-2 py-1.5 text-xs rounded hover:bg-accent group"
                >
                  <Bookmark className="w-3 h-3 fill-amber-500 text-amber-500 shrink-0" />
                  <button
                    onClick={() => setFilters({ selectedChannelId: c.id })}
                    className="flex-1 text-left truncate"
                  >
                    {c.name}
                  </button>
                  <button
                    onClick={() => toggleFavorite(c.id)}
                    aria-label={`${c.name} 북마크 해제`}
                    className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* Reset */}
        <button
          onClick={resetFilters}
          className="flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-md border border-border hover:bg-accent transition-colors text-muted-foreground"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          필터 초기화
        </button>
      </div>
    </aside>
  )
}

function Section({
  icon: Icon,
  title,
  badge,
  children,
}: {
  icon: typeof Globe
  title: string
  badge?: string
  children: React.ReactNode
}) {
  return (
    <section>
      <label className="text-[11px] font-bold uppercase tracking-wider text-foreground/80 mb-2 flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5" />
        <span className="flex-1">{title}</span>
        {badge && (
          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/15 text-primary font-medium">
            {badge}
          </span>
        )}
      </label>
      {children}
    </section>
  )
}
