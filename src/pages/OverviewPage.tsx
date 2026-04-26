import { useEffect, useMemo, useState } from 'react'
import {
  ArrowUpRight, ArrowDownRight, Minus, Settings, Loader2,
  Calendar as CalendarIcon, ChevronDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCurrency, formatPercent } from '@/utils/kpiCalc'
import { toast } from 'sonner'
import KPISettingsModal from '@/components/common/KPISettingsModal'
import { loadReport, AVAILABLE_WEEKS, LATEST_WEEK, type RealReport } from '@/services/reportData'
import { useFilters } from '@/contexts/FilterContext'
import { mockUsers } from '@/mocks/users'
import { mockClients } from '@/mocks/clients'

// oh-crm 패턴: 섹션 단위 Booking/Check-in/Check-out + Period 프리셋
const DATE_TYPES = [
  { key: 'booking', label: 'Booking Date' },
  { key: 'checkin', label: 'Check-in' },
  { key: 'checkout', label: 'Check-out' },
] as const

const PERIOD_PRESETS = [
  { key: 'last_week', label: 'Last Week' },
  { key: 'current_week', label: 'Current Week' },
  { key: 'last_month', label: 'Last Month' },
  { key: 'current_month', label: 'Current Month' },
  { key: 'ytd', label: 'YTD' },
  { key: 'custom', label: 'Custom' },
] as const
type PresetKey = (typeof PERIOD_PRESETS)[number]['key']

function getPresetDates(preset: PresetKey, today = new Date()): { start: string; end: string } {
  const f = (d: Date) => d.toISOString().split('T')[0]
  switch (preset) {
    case 'last_week': {
      const dow = today.getDay()
      const s = new Date(today); s.setDate(today.getDate() - dow - 6)
      const e = new Date(s); e.setDate(s.getDate() + 6)
      return { start: f(s), end: f(e) }
    }
    case 'current_week': {
      const dow = today.getDay()
      const s = new Date(today); s.setDate(today.getDate() - dow + 1)
      const e = new Date(s); e.setDate(s.getDate() + 6)
      return { start: f(s), end: f(e) }
    }
    case 'last_month': {
      const s = new Date(today.getFullYear(), today.getMonth() - 1, 1)
      const e = new Date(today.getFullYear(), today.getMonth(), 0)
      return { start: f(s), end: f(e) }
    }
    case 'current_month': {
      const s = new Date(today.getFullYear(), today.getMonth(), 1)
      const e = new Date(today.getFullYear(), today.getMonth() + 1, 0)
      return { start: f(s), end: f(e) }
    }
    case 'ytd': {
      const s = new Date(today.getFullYear(), 0, 1)
      return { start: f(s), end: f(today) }
    }
    default:
      return { start: f(today), end: f(today) }
  }
}

function ChangeIndicator({ value, label }: { value: number | null; label: string }) {
  if (value === null) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground">
        <Minus className="w-3 h-3" />
        {label} N/A
      </span>
    )
  }
  const isPositive = value >= 0
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 text-xs font-medium',
        isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'
      )}
    >
      {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
      {label} {formatPercent(value)}
    </span>
  )
}

export default function OverviewPage() {
  const { filters } = useFilters()
  const [kpiSettingsOpen, setKpiSettingsOpen] = useState(false)
  const [week, setWeek] = useState<string>(LATEST_WEEK)
  const [report, setReport] = useState<RealReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Period 필터 (Overview 내부, oh-crm 패턴)
  const [dateType, setDateType] = useState<(typeof DATE_TYPES)[number]['key']>('booking')
  const [preset, setPreset] = useState<PresetKey>('last_week')
  const presetDates = useMemo(() => getPresetDates(preset), [preset])
  const [customStart, setCustomStart] = useState(presetDates.start)
  const [customEnd, setCustomEnd] = useState(presetDates.end)
  useEffect(() => {
    if (preset !== 'custom') {
      const d = getPresetDates(preset)
      setCustomStart(d.start)
      setCustomEnd(d.end)
    }
  }, [preset])
  const periodStart = preset === 'custom' ? customStart : presetDates.start
  const periodEnd = preset === 'custom' ? customEnd : presetDates.end

  useEffect(() => {
    setLoading(true)
    setError(null)
    loadReport(week)
      .then((r) => setReport(r))
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false))
  }, [week])

  // 사이드바 필터 적용 — Tier / PIC / 선택채널 (early return 이전에 호출 필수)
  const filteredChannels = useMemo(() => {
    if (!report) return []
    let list = report.channels
    if (filters.selectedChannelId) {
      const sel = mockClients.find((c) => c.id === filters.selectedChannelId)
      if (sel) list = list.filter((c) => c.channel === sel.name)
    }
    if (filters.tier !== 'All') {
      const allowed = new Set(
        mockClients
          .filter((c) => (c.autoTier ?? c.tier) === filters.tier)
          .map((c) => c.name)
      )
      list = list.filter((c) => allowed.has(c.channel))
    }
    if (filters.pic !== 'All') {
      const allowed = new Set(
        mockClients
          .filter((c) => (c.assignedManager ?? c.picUserId) === filters.pic)
          .map((c) => c.name)
      )
      list = list.filter((c) => allowed.has(c.channel))
    }
    return list
  }, [report, filters.tier, filters.pic, filters.selectedChannelId])

  if (loading || !report) {
    return (
      <div className="max-w-7xl mx-auto py-20 flex flex-col items-center gap-3 text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="text-sm">실데이터 로딩 중... ({week})</span>
        {error && <span className="text-xs text-destructive">{error}</span>}
      </div>
    )
  }

  const k = report.kpi
  const kpiCards = [
    { title: 'TTV', value: k.totalTTV, wow: k.wowTTV, isCurrency: true },
    { title: 'Revenue', value: k.totalRevenue, wow: k.wowRevenue, isCurrency: true },
    { title: 'Room Nights', value: k.totalRN, wow: k.wowRN, isCurrency: false },
    { title: 'Bookings', value: k.totalCount, wow: k.wowCount, isCurrency: false },
  ]

  const dependency = report.ctrip
  const filteredTop5 = filteredChannels.slice(0, 5)
  const filteredTotal = filteredChannels.reduce((s, c) => s + c.ttv, 0)
  const sidebarFilterActive =
    filters.tier !== 'All' || filters.pic !== 'All' || filters.selectedChannelId !== null
  const picName = filters.pic !== 'All'
    ? mockUsers.find((u) => u.id === filters.pic)?.name ?? filters.pic
    : null

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-semibold">주간 실적</h2>
          <p className="text-xs text-muted-foreground">
            {report.period.start} ~ {report.period.end} · 기준: {report.dataBasis.thisWeek} · 실데이터
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={week}
            onChange={(e) => setWeek(e.target.value)}
            className="px-3 py-1.5 text-xs bg-background border border-border rounded-md"
            aria-label="주간 리포트 선택"
          >
            {AVAILABLE_WEEKS.map((w) => (
              <option key={w} value={w}>{w}</option>
            ))}
          </select>
          <button
            onClick={() => setKpiSettingsOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-border hover:bg-accent transition-colors"
          >
            <Settings className="w-3.5 h-3.5" />
            KPI 설정
          </button>
        </div>
      </div>

      {/* Period 필터 바 (oh-crm 패턴: 섹션별 Booking/Check-in/Check-out + 프리셋) */}
      <div className="bg-card border border-border rounded-lg px-3 py-2 flex items-center gap-2 flex-wrap text-xs">
        <span className="text-muted-foreground font-medium">Period:</span>
        <div className="relative inline-flex items-center">
          <select
            value={dateType}
            onChange={(e) => setDateType(e.target.value as typeof dateType)}
            className="appearance-none pl-2 pr-6 py-1 border rounded bg-background hover:bg-accent cursor-pointer"
            aria-label="날짜 타입"
          >
            {DATE_TYPES.map((d) => (
              <option key={d.key} value={d.key}>{d.label}</option>
            ))}
          </select>
          <ChevronDown className="w-3 h-3 absolute right-1.5 pointer-events-none text-muted-foreground" />
        </div>
        <div className="relative inline-flex items-center">
          <select
            value={preset}
            onChange={(e) => setPreset(e.target.value as PresetKey)}
            className="appearance-none pl-2 pr-6 py-1 border rounded bg-background hover:bg-accent cursor-pointer"
            aria-label="기간 프리셋"
          >
            {PERIOD_PRESETS.map((p) => (
              <option key={p.key} value={p.key}>{p.label}</option>
            ))}
          </select>
          <ChevronDown className="w-3 h-3 absolute right-1.5 pointer-events-none text-muted-foreground" />
        </div>
        <div className="flex items-center gap-1">
          <CalendarIcon className="w-3 h-3 text-muted-foreground" />
          <input
            type="date"
            value={periodStart}
            onChange={(e) => setCustomStart(e.target.value)}
            disabled={preset !== 'custom'}
            className="h-6 text-xs border rounded px-1 bg-background w-[120px] disabled:opacity-60"
            aria-label="시작일"
          />
          <span className="text-muted-foreground">~</span>
          <input
            type="date"
            value={periodEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
            disabled={preset !== 'custom'}
            className="h-6 text-xs border rounded px-1 bg-background w-[120px] disabled:opacity-60"
            aria-label="종료일"
          />
        </div>
        <span className="text-[10px] text-muted-foreground ml-auto">
          ※ 실데이터 주간 스냅샷이라 실제 통계는 위 주간 선택을 따릅니다.
        </span>
      </div>

      {/* 사이드바 활성 필터 표시 */}
      {sidebarFilterActive && (
        <div className="flex items-center gap-2 text-xs flex-wrap">
          <span className="text-muted-foreground">사이드바 필터:</span>
          {filters.tier !== 'All' && (
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              Tier {filters.tier}
            </span>
          )}
          {picName && (
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              PIC {picName}
            </span>
          )}
          {filters.selectedChannelId && (
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              채널 {mockClients.find((c) => c.id === filters.selectedChannelId)?.name}
            </span>
          )}
          <span className="text-muted-foreground">→ {filteredChannels.length}개 채널 매칭</span>
        </div>
      )}

      {/* KPI Cards */}
      <section>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {kpiCards.map((card) => (
            <button
              key={card.title}
              onClick={() => toast.info(`${card.title} 상세 드릴다운`)}
              className="bg-card border border-border rounded-lg p-4 text-left hover:shadow-md hover:border-primary/30 transition-all"
            >
              <p className="text-sm text-muted-foreground mb-1">{card.title}</p>
              <p className="text-2xl font-bold tracking-tight mb-3">
                {card.isCurrency ? formatCurrency(card.value) : card.value.toLocaleString()}
              </p>
              <ChangeIndicator value={card.wow} label="WoW" />
            </button>
          ))}
          {/* Ctrip% gauge card */}
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">Ctrip TTV%</p>
            <p
              className={cn(
                'text-2xl font-bold tracking-tight mb-1',
                dependency.ctripPct > 0.35 ? 'text-red-500' : 'text-emerald-600'
              )}
            >
              {(dependency.ctripPct * 100).toFixed(1)}%
            </p>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full',
                  dependency.ctripPct > 0.35 ? 'bg-red-500' : 'bg-emerald-500'
                )}
                style={{ width: `${Math.min(100, dependency.ctripPct * 100)}%` }}
              />
              <div className="relative -top-1.5" style={{ marginLeft: '35%' }}>
                <div className="w-px h-3 bg-foreground/40" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">목표 ≤35% (CEO OKR)</p>
          </div>
        </div>
      </section>

      {/* Channel Top + Country Mix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <section className="lg:col-span-2 bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Channel Top {filteredTop5.length}</h3>
            <span className="text-xs text-muted-foreground">
              {sidebarFilterActive ? '사이드바 필터 적용 · WoW' : '실데이터 · WoW'}
            </span>
          </div>
          {filteredTop5.length === 0 ? (
            <div className="text-center py-8 text-xs text-muted-foreground">
              사이드바 필터에 매칭되는 채널이 없습니다
            </div>
          ) : (
          <div className="space-y-2">
            {filteredTop5.map((c, i) => {
              const pct = filteredTotal > 0 ? (c.ttv / filteredTotal) * 100 : 0
              return (
                <div key={c.channel} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
                  <span className="w-5 text-xs font-mono text-muted-foreground">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium truncate">{c.channel}</span>
                      <ChangeIndicator value={c.wow} label="" />
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <div className="h-1 flex-1 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {formatCurrency(c.ttv)}
                      </span>
                    </div>
                    <div className="flex gap-3 text-[10px] text-muted-foreground mt-0.5">
                      <span>RN {c.rn.toLocaleString()}</span>
                      <span>예약 {c.count.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          )}
        </section>

        <section className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">Country Mix</h3>
          <div className="space-y-2">
            {report.countries.slice(0, 6).map((c) => {
              const pct = (c.ttv / k.totalTTV) * 100
              return (
                <div key={c.country}>
                  <div className="flex items-center justify-between mb-1 gap-2">
                    <span className="text-sm font-medium">{c.country}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">{pct.toFixed(1)}%</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="flex gap-3 text-[10px] text-muted-foreground mt-0.5">
                    <span>{formatCurrency(c.ttv)}</span>
                    <span>RN {c.rn.toLocaleString()}</span>
                    {c.wow !== undefined && (
                      <span className={c.wow >= 0 ? 'text-emerald-600' : 'text-red-500'}>
                        WoW {(c.wow * 100).toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </div>

      {/* Dependency monitor */}
      <section className="bg-card border border-border rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-3">Dependency Monitor (CEO OKR v9 KR6)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Gauge label="Ctrip TTV%" value={dependency.ctripPct} target={0.35} threshold="≤35%" />
          <Gauge label="China B2B%" value={dependency.chinaPct} target={0.65} threshold="≤65%" />
          <Gauge label="Top3 Non-Ctrip%" value={dependency.top3Pct} target={null} threshold="—" />
        </div>
      </section>

      {/* Daily Trend */}
      <section className="bg-card border border-border rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-3">
          Daily Trend (4주 28일, Booking Date 기준)
        </h3>
        <DailyTrendChart data={report.dailyTrend} />
      </section>

      <KPISettingsModal open={kpiSettingsOpen} onClose={() => setKpiSettingsOpen(false)} />
    </div>
  )
}

function Gauge({ label, value, target, threshold }: { label: string; value: number; target: number | null; threshold: string }) {
  const exceeded = target !== null && value > target
  return (
    <div className="bg-background border border-border rounded-lg p-3">
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-[10px] text-muted-foreground">{threshold}</span>
      </div>
      <p
        className={cn(
          'text-2xl font-bold mb-2',
          exceeded ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'
        )}
      >
        {(value * 100).toFixed(1)}%
      </p>
      <div className="relative h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full', exceeded ? 'bg-red-500' : 'bg-emerald-500')}
          style={{ width: `${Math.min(100, value * 100)}%` }}
        />
        {target !== null && (
          <div
            className="absolute top-0 h-full w-px bg-foreground/40"
            style={{ left: `${target * 100}%` }}
          />
        )}
      </div>
    </div>
  )
}

function DailyTrendChart({ data }: { data: { date: string; ttv: number; revenue: number; count: number }[] }) {
  if (!data.length) {
    return (
      <div className="text-center py-12 text-sm text-muted-foreground">
        <p>표시할 일별 데이터가 없습니다</p>
      </div>
    )
  }
  const maxTTV = Math.max(0, ...data.map((d) => d.ttv))
  const maxCount = Math.max(0, ...data.map((d) => d.count))
  return (
    <div className="overflow-x-auto">
      <div className="flex items-end gap-1 min-w-[760px] h-32">
        {data.map((d) => {
          const ttvH = maxTTV > 0 ? (d.ttv / maxTTV) * 100 : 0
          const date = new Date(d.date)
          const isSat = date.getDay() === 6
          return (
            <div key={d.date} className="flex flex-col items-center flex-1 group" title={`${d.date}\nTTV ¥${(d.ttv / 1_000_000).toFixed(1)}M\n예약 ${d.count}`}>
              <div className="flex-1 flex items-end w-full">
                <div
                  className={cn('w-full rounded-t', isSat ? 'bg-primary' : 'bg-primary/60', 'group-hover:bg-primary')}
                  style={{ height: `${ttvH}%` }}
                />
              </div>
              <span className="text-[8px] text-muted-foreground mt-1 rotate-45 origin-bottom-left">
                {d.date.slice(5)}
              </span>
            </div>
          )
        })}
      </div>
      <div className="flex gap-3 text-[10px] text-muted-foreground mt-2">
        <span>최대 TTV ¥{(maxTTV / 1_000_000).toFixed(0)}M</span>
        <span>최대 예약 {maxCount.toLocaleString()}</span>
        <span>토요일은 진한 색</span>
      </div>
    </div>
  )
}
