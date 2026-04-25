import { useEffect, useMemo, useState } from 'react'
import {
  ArrowUpRight, ArrowDownRight, Loader2, FileDown, Share2, CheckCircle2,
  RefreshCw, Building2, AlertTriangle, Tag, Sparkles, Compass, Briefcase, ListChecks,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { formatCurrency } from '@/utils/kpiCalc'
import { toast } from 'sonner'
import {
  loadReport, AVAILABLE_WEEKS, LATEST_WEEK,
  type RealReport, type TeamActionRow,
} from '@/services/reportData'

const PIC_BY_NAME: Record<string, string> = {
  Ben: 'u-tm', Grace: 'u-grace', Jane: 'u-jane', Jasmine: 'u-jasmine', Sophia: 'u-grace',
}

interface BriefSection {
  title: string
  icon: typeof Building2
  color: string
  items: TeamActionRow[]
}

/**
 * BR-005-3 단일 귀속 분류 — if/else if 체인으로 한 row가 정확히 1개 섹션에만 들어감 (QA-006).
 * 우선순위: 이슈 → 프로모션 → 신규 → 오픈/테스트 → Next Week → 지역별(기본).
 */
function classify(report: RealReport): BriefSection[] {
  const rows = report.teamInput?.teamActions ?? []
  const sections: BriefSection[] = [
    { title: '신규 채널 개발', icon: Building2, color: 'text-emerald-600', items: [] },
    { title: '오픈/테스트', icon: Sparkles, color: 'text-cyan-600', items: [] },
    { title: '프로모션·영업', icon: Tag, color: 'text-violet-600', items: [] },
    { title: '이슈 대응', icon: AlertTriangle, color: 'text-red-600', items: [] },
    { title: '지역별 하이라이트', icon: Compass, color: 'text-blue-600', items: [] },
    { title: 'Next Week Focus', icon: ListChecks, color: 'text-amber-600', items: [] },
  ]
  for (const row of rows) {
    const t = (row.type || '').toLowerCase()
    const c = (row.content || '').toLowerCase()
    const a = (row.action || '').toLowerCase()
    if (t.includes('이슈') || t.includes('issue') || t.includes('문제')) {
      sections[3].items.push(row)
    } else if (t.includes('프로모션') || t.includes('promo')) {
      sections[2].items.push(row)
    } else if (t.includes('신규') || c.includes('new') || c.includes('agreement')) {
      sections[0].items.push(row)
    } else if (t.includes('test') || c.includes('go-live') || c.includes('테스트')) {
      sections[1].items.push(row)
    } else if (a.includes('next') || a.includes('plan') || a.includes('expect')) {
      sections[5].items.push(row)
    } else {
      sections[4].items.push(row)
    }
  }
  return sections
}

function aggregateContrib(report: RealReport) {
  const map = new Map<string, { count: number; channels: Set<string> }>()
  for (const row of report.teamInput?.teamActions ?? []) {
    const key = row.author
    const e = map.get(key) ?? { count: 0, channels: new Set() }
    e.count += 1
    e.channels.add(row.channel)
    map.set(key, e)
  }
  return Array.from(map.entries())
    .map(([author, v]) => ({
      author,
      userId: PIC_BY_NAME[author] ?? '?',
      activityCount: v.count,
      channelCount: v.channels.size,
    }))
    .sort((a, b) => b.activityCount - a.activityCount)
}

export default function WeeklyBriefPage() {
  const { isAtLeast } = useAuth()
  const canManage = isAtLeast('team_manager')

  const [week, setWeek] = useState<string>(LATEST_WEEK)
  const [report, setReport] = useState<RealReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<'Draft' | 'UnderReview' | 'Confirmed' | 'Published'>('Draft')

  useEffect(() => {
    setLoading(true)
    loadReport(week)
      .then(setReport)
      .finally(() => setLoading(false))
  }, [week])

  const sections = useMemo(() => (report ? classify(report) : []), [report])
  const teamContrib = useMemo(() => (report ? aggregateContrib(report) : []), [report])

  if (loading || !report) {
    return (
      <div className="max-w-6xl mx-auto py-20 flex flex-col items-center gap-3 text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="text-sm">Weekly Brief 로딩 중...</span>
      </div>
    )
  }

  const k = report.kpi
  const dep = report.ctrip
  const totalActions = report.teamInput?.teamActions?.length ?? 0

  const handleConfirm = () => {
    setStatus('Confirmed')
    toast.success('Weekly Sales Brief 확정', {
      description: '내부 PDF + 외부 공유 토큰(24시간) 생성 완료 (시뮬레이션)',
    })
  }
  const handleShare = () => {
    if (status !== 'Confirmed') {
      toast.error('Brief를 먼저 확정하세요')
      return
    }
    const shareUrl = `https://crm.omh.com/share/abc123-${week}`
    navigator.clipboard.writeText(shareUrl).catch(() => {})
    toast.success('외부 공유 URL이 클립보드에 복사됨', {
      description: `${shareUrl} (24시간 유효)`,
    })
  }
  const handleDownload = () => {
    if (status !== 'Confirmed') {
      toast.error('Brief를 먼저 확정하세요')
      return
    }
    toast.success('PDF 다운로드 시작 (시뮬레이션)')
  }
  const handleRegenerate = () => {
    if (status === 'Confirmed') {
      toast.error('이미 확정됨 — Manager 권한으로 status 되돌리기 후 재생성')
      return
    }
    toast('Brief 재생성 (시뮬레이션)')
  }

  const StatusBadge = () => {
    const colorMap = {
      Draft: 'bg-slate-500/10 text-slate-600 dark:text-slate-300',
      UnderReview: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
      Confirmed: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
      Published: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    }
    return (
      <span className={cn('text-xs font-medium px-2 py-1 rounded', colorMap[status])}>
        {status}
      </span>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Weekly Sales Brief</h2>
            <StatusBadge />
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {report.period.start} ~ {report.period.end} · 자동 집계: {totalActions}건 · sourceActivityIds 추적
          </p>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <select
            value={week}
            onChange={(e) => { setWeek(e.target.value); setStatus('Draft') }}
            className="px-3 py-1.5 text-xs bg-background border border-border rounded-md"
          >
            {AVAILABLE_WEEKS.map((w) => <option key={w} value={w}>{w}</option>)}
          </select>
          {canManage && (
            <>
              <button
                onClick={handleRegenerate}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-md border border-border hover:bg-accent"
              >
                <RefreshCw className="w-3.5 h-3.5" /> 재생성
              </button>
              {status !== 'Confirmed' && (
                <button
                  onClick={handleConfirm}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-md bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> 확정 → 전사 공유
                </button>
              )}
            </>
          )}
          <button
            onClick={handleDownload}
            disabled={status !== 'Confirmed'}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-md border border-border hover:bg-accent disabled:opacity-50"
          >
            <FileDown className="w-3.5 h-3.5" /> 내부 PDF
          </button>
          <button
            onClick={handleShare}
            disabled={status !== 'Confirmed'}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-md border border-border hover:bg-accent disabled:opacity-50"
          >
            <Share2 className="w-3.5 h-3.5" /> 24h 외부 링크
          </button>
        </div>
      </div>

      {/* KPI bar */}
      <section className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        <KpiTile label="Bookings" value={k.totalCount.toLocaleString()} wow={k.wowCount} />
        <KpiTile label="RN" value={k.totalRN.toLocaleString()} wow={k.wowRN} />
        <KpiTile label="TTV" value={formatCurrency(k.totalTTV)} wow={k.wowTTV} />
        <KpiTile label="Revenue" value={formatCurrency(k.totalRevenue)} wow={k.wowRevenue} />
        <KpiTile
          label="Ctrip%"
          value={`${(dep.ctripPct * 100).toFixed(1)}%`}
          wow={null}
          highlight={dep.ctripPct > 0.35 ? 'red' : 'green'}
        />
        <KpiTile
          label="China%"
          value={`${(dep.chinaPct * 100).toFixed(1)}%`}
          wow={null}
          highlight={dep.chinaPct > 0.65 ? 'red' : 'green'}
        />
        <KpiTile label="Top3 Non-Ctrip" value={`${(dep.top3Pct * 100).toFixed(1)}%`} wow={null} />
      </section>

      {/* 6 Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map((s) => {
          const Icon = s.icon
          return (
            <section key={s.title} className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Icon className={cn('w-4 h-4', s.color)} />
                <h3 className="text-sm font-semibold">{s.title}</h3>
                <span className="text-xs text-muted-foreground">({s.items.length})</span>
              </div>
              {s.items.length === 0 ? (
                <p className="text-xs text-muted-foreground py-3">해당 항목 없음</p>
              ) : (
                <ul className="space-y-2">
                  {s.items.slice(0, 6).map((row, i) => (
                    <li key={i} className="border-l-2 border-primary/30 pl-3 py-1">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-xs font-semibold">{row.channel}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{row.type}</span>
                        <span className="text-[10px] text-muted-foreground">· {row.author}</span>
                      </div>
                      <p className="text-xs text-foreground/80 mt-0.5">{row.content}</p>
                      {row.action && (
                        <p className="text-[11px] text-muted-foreground mt-0.5">↳ {row.action}</p>
                      )}
                    </li>
                  ))}
                  {s.items.length > 6 && (
                    <li className="text-[11px] text-muted-foreground italic pl-3">
                      … 외 {s.items.length - 6}건
                    </li>
                  )}
                </ul>
              )}
            </section>
          )
        })}
      </div>

      {/* Team Contribution */}
      <section className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Briefcase className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Team Contribution</h3>
        </div>
        <div className="space-y-2">
          {teamContrib.map((c) => {
            const max = teamContrib[0]?.activityCount ?? 1
            const pct = (c.activityCount / max) * 100
            return (
              <div key={c.author} className="flex items-center gap-3">
                <span className="w-20 text-sm font-medium shrink-0">{c.author}</span>
                <div className="flex-1 h-5 bg-muted rounded relative overflow-hidden">
                  <div
                    className="h-full bg-primary/70 rounded flex items-center px-2"
                    style={{ width: `${pct}%` }}
                  >
                    <span className="text-[10px] text-primary-foreground font-semibold">
                      {c.activityCount}건
                    </span>
                  </div>
                </div>
                <span className="w-24 text-xs text-muted-foreground tabular-nums shrink-0 text-right">
                  채널 {c.channelCount}개
                </span>
              </div>
            )
          })}
        </div>
      </section>

      {/* Decision Requests (REPORT decision 필드) */}
      {typeof report.decision === 'string' && (
        <section className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <ListChecks className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">의사결정 요청</h3>
          </div>
          <p className="text-xs text-muted-foreground">{report.decision}</p>
        </section>
      )}
    </div>
  )
}

function KpiTile({ label, value, wow, highlight }: { label: string; value: string; wow: number | null; highlight?: 'red' | 'green' }) {
  return (
    <div className="bg-card border border-border rounded-lg p-3">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
      <p
        className={cn(
          'text-lg font-bold tracking-tight mt-0.5',
          highlight === 'red' && 'text-red-500',
          highlight === 'green' && 'text-emerald-600 dark:text-emerald-400'
        )}
      >
        {value}
      </p>
      {wow !== null && (
        <span className={cn('inline-flex items-center gap-0.5 text-[10px] mt-1', wow >= 0 ? 'text-emerald-600' : 'text-red-500')}>
          {wow >= 0 ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
          {(wow * 100).toFixed(1)}%
        </span>
      )}
    </div>
  )
}
