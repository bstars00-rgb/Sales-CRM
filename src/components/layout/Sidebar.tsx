import { useMemo, useState } from 'react'
import {
  PanelLeftClose, PanelLeftOpen, RotateCcw, Search, Star,
  Layers, User as UserIcon, Building2, X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useFilters } from '@/contexts/FilterContext'
import { mockClients } from '@/mocks/clients'
import { mockUsers } from '@/mocks/users'
import type { Tier } from '@/types'

const TIER_OPTIONS: { value: Tier | 'All'; label: string; color: string }[] = [
  { value: 'All', label: 'All', color: '' },
  { value: 1, label: 'T1 전략', color: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30' },
  { value: 2, label: 'T2 성장', color: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30' },
  { value: 3, label: 'T3 신규', color: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30' },
]

export default function Sidebar() {
  const {
    filters, setFilters, resetFilters,
    sidebarCollapsed, toggleSidebar, activeFilterCount, toggleFavorite,
  } = useFilters()
  const [showChannelResults, setShowChannelResults] = useState(false)

  // PIC 옵션: 채널이 할당된 모든 사용자 (cascading 없음 — 채널은 위치 무관)
  const picOptions = useMemo(() => {
    const picIds = new Set(
      mockClients
        .map((c) => c.assignedManager ?? c.picUserId)
        .filter((p): p is string => !!p)
    )
    return mockUsers
      .filter((u) => picIds.has(u.id))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [])

  // 채널 검색 결과 — 이름 / 담당PIC / Tier 기준 (위치 무관)
  const channelResults = useMemo(() => {
    if (!filters.channelQuery.trim()) return []
    const q = filters.channelQuery.toLowerCase()
    const tierFilter = filters.tier
    return mockClients
      .filter((c) => {
        if (tierFilter !== 'All' && (c.autoTier ?? c.tier) !== tierFilter) return false
        return c.name.toLowerCase().includes(q)
      })
      .slice(0, 20)
  }, [filters.channelQuery, filters.tier])

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
    <aside className="w-64 bg-card border-r border-border flex flex-col shrink-0 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto">
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

      <p className="text-[10px] text-muted-foreground px-4 pt-3">
        Period · 통계 필터는 Overview 페이지에서 설정합니다.
      </p>

      <div className="flex flex-col gap-4 px-4 py-4">
        {/* Tier */}
        <Section icon={Layers} title="Tier">
          <div className="grid grid-cols-2 gap-1">
            {TIER_OPTIONS.map((t) => (
              <button
                key={t.value}
                onClick={() => setFilters({ tier: t.value })}
                className={cn(
                  'h-8 px-2 text-xs rounded-md border',
                  filters.tier === t.value
                    ? t.value === 'All'
                      ? 'bg-primary text-primary-foreground border-primary'
                      : `${t.color} ring-2 ring-primary/40`
                    : 'border-border hover:bg-accent'
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </Section>

        {/* PIC (전체 PIC, cascading 없음) */}
        <Section icon={UserIcon} title="담당 PIC">
          <select
            value={filters.pic}
            onChange={(e) => setFilters({ pic: e.target.value })}
            className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
            aria-label="PIC 필터"
          >
            <option value="All">전체 ({picOptions.length}명)</option>
            {picOptions.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </Section>

        {/* Channel 검색 */}
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
                      className="w-full text-left px-2 py-1.5 hover:bg-primary/10 text-xs"
                    >
                      <div className="font-medium truncate">{c.name}</div>
                      <div className="text-[10px] text-muted-foreground">
                        T{c.autoTier ?? c.tier ?? '?'}
                      </div>
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

        {/* Reset */}
        <button
          onClick={resetFilters}
          className="flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-md border border-border hover:bg-accent transition-colors text-muted-foreground"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          필터 초기화
        </button>

        {/* 즐겨찾기 채널 */}
        {favoriteChannelObjects.length > 0 && (
          <Section icon={Star} title={`즐겨찾기 (${favoriteChannelObjects.length})`}>
            <ul className="space-y-1">
              {favoriteChannelObjects.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center gap-2 px-2 py-1.5 text-xs rounded hover:bg-accent group"
                >
                  <button
                    onClick={() => setFilters({ selectedChannelId: c.id })}
                    className="flex-1 text-left truncate"
                  >
                    {c.name}
                  </button>
                  <button
                    onClick={() => toggleFavorite(c.id)}
                    aria-label={`${c.name} 즐겨찾기 해제`}
                    className="text-amber-500 hover:scale-110 opacity-70 group-hover:opacity-100"
                  >
                    <Star className="w-3 h-3 fill-amber-500" />
                  </button>
                </li>
              ))}
            </ul>
          </Section>
        )}
      </div>
    </aside>
  )
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Layers
  title: string
  children: React.ReactNode
}) {
  return (
    <section>
      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {title}
      </label>
      {children}
    </section>
  )
}
