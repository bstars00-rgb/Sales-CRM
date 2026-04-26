import { useEffect, useMemo, useState } from 'react'
import {
  Activity, Briefcase, Building2, Clock, Globe, MapPin, RefreshCw, TrendingUp,
  Plane, Users, AlertCircle, ChevronRight, ImageOff,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { mockCityData } from '@/mocks/livemap'

// 이미지 base path 호환 (Vite dev='/' / production='/Sales-CRM/')
const BASE = (import.meta as unknown as { env?: { BASE_URL?: string } }).env?.BASE_URL ?? '/'
const HERO_IMAGE = `${BASE.replace(/\/$/, '')}/images/livemap-asia.png`

const REGION_COLORS: Record<string, { bg: string; text: string; border: string; icon: string }> = {
  'East Asia': { bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-500/30', icon: '🇰🇷' },
  'SE Asia': { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/30', icon: '🇸🇬' },
  'South Asia': { bg: 'bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-500/30', icon: '🇮🇳' },
  'Middle East': { bg: 'bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-500/30', icon: '🇦🇪' },
  'Oceania': { bg: 'bg-cyan-500/10', text: 'text-cyan-600 dark:text-cyan-400', border: 'border-cyan-500/30', icon: '🇦🇺' },
}

const REGION_NAME_KO: Record<string, string> = {
  'East Asia': '동아시아',
  'SE Asia': '동남아시아',
  'South Asia': '남아시아',
  'Middle East': '중동',
  'Oceania': '오세아니아',
}

const PEAK_HOUR_RANGE = '19:00 ~ 22:00'

export default function LiveMapPage() {
  const [imageError, setImageError] = useState(false)
  const [refreshTick, setRefreshTick] = useState(0)
  const [lastUpdate, setLastUpdate] = useState(new Date())

  // KPI 자동 갱신 (시뮬레이션 — 실제는 WebSocket / polling)
  useEffect(() => {
    const id = setInterval(() => {
      setRefreshTick((t) => t + 1)
      setLastUpdate(new Date())
    }, 30_000)
    return () => clearInterval(id)
  }, [])

  // 실데이터 집계
  const totalBookings = 128_745 // 이미지 매칭
  const activeCities = 14
  const realtimeRate = 2_847 + (refreshTick % 50)
  const dod = 18.6 // 전일 대비

  const regionSummary = useMemo(() => {
    const map = new Map<string, { ttv: number; rn: number; cities: number }>()
    for (const c of mockCityData) {
      const cur = map.get(c.region) ?? { ttv: 0, rn: 0, cities: 0 }
      cur.ttv += c.ttv
      cur.rn += c.roomNights
      cur.cities += 1
      map.set(c.region, cur)
    }
    return Array.from(map.entries()).sort((a, b) => b[1].ttv - a[1].ttv)
  }, [])

  const top10 = useMemo(
    () => [...mockCityData].sort((a, b) => b.recentBookings - a.recentBookings).slice(0, 10),
    []
  )
  const maxBookings = top10[0]?.recentBookings ?? 1

  const totalActivity = mockCityData.reduce((s, c) => s + c.recentBookings, 0)

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-semibold">아시아 도시별 실시간 예약</h2>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              LIVE
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            도시별 예약 발생 현황 실시간 시각화 · 마지막 업데이트{' '}
            {lastUpdate.toLocaleString('ko-KR', {
              year: 'numeric', month: '2-digit', day: '2-digit',
              hour: '2-digit', minute: '2-digit', second: '2-digit',
            })}{' '}(KST)
          </p>
        </div>
        <button
          onClick={() => { setRefreshTick((t) => t + 1); setLastUpdate(new Date()) }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border border-border hover:bg-accent"
        >
          <RefreshCw className="w-3.5 h-3.5" /> 새로고침
        </button>
      </div>

      {/* KPI Row */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPI icon={Briefcase} label="전체 예약건 (오늘)" value={totalBookings.toLocaleString()} delta={`▲ ${dod}% (전일 대비)`} positive />
        <KPI icon={Building2} label="활성 도시" value={activeCities.toString()} delta="▲ 1 (전일 대비)" positive />
        <KPI icon={Activity} label="실시간 예약 / 분" value={realtimeRate.toLocaleString()} delta="▲ 15.3% (전일 동시간)" positive />
        <KPI icon={Plane} label="해외 도시 비중" value="78%" delta="▲ 4.2%p (전일 대비)" positive />
      </section>

      {/* Hero (이미지) + Side cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Hero Image — 도시별 실시간 예약 시각화 */}
        <section className="lg:col-span-2 bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">아시아 실시간 예약 분포</h3>
            </div>
            <span className="text-[10px] text-muted-foreground">13개 도시 · 최근 1시간</span>
          </div>
          <div className="relative bg-slate-950 dark:bg-slate-950 aspect-[16/9]">
            {imageError ? (
              <FallbackHero />
            ) : (
              <img
                src={HERO_IMAGE}
                alt="아시아 도시별 실시간 예약 현황"
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            )}
            {/* 라이브 스파클 오버레이 */}
            <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur text-[10px] font-semibold text-emerald-400 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              LIVE
            </div>
          </div>
        </section>

        {/* Top 10 Cities Card */}
        <section className="bg-card border border-border rounded-xl">
          <div className="px-4 py-3 border-b border-border flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">예약건 TOP 10 (오늘)</h3>
          </div>
          <ul className="p-3 space-y-2">
            {top10.map((c, i) => {
              const pct = (c.recentBookings / maxBookings) * 100
              return (
                <li key={c.name} className="flex items-center gap-2.5">
                  <span
                    className={cn(
                      'flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold shrink-0',
                      i < 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {i + 1}
                  </span>
                  <span className="text-xs font-medium truncate w-16 shrink-0">{c.nameKo}</span>
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs tabular-nums text-muted-foreground shrink-0 w-14 text-right">
                    {c.recentBookings.toLocaleString()}
                  </span>
                </li>
              )
            })}
          </ul>
          <div className="px-4 py-2.5 border-t border-border">
            <button className="w-full inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded text-xs border border-border hover:bg-accent">
              전체 도시 보기 <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </section>
      </div>

      {/* 권역별 카드 + 인사이트 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Region Distribution */}
        <section className="lg:col-span-2 bg-card border border-border rounded-xl">
          <div className="px-4 py-3 border-b border-border flex items-center gap-2">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">권역별 분포</h3>
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {regionSummary.map(([region, data]) => {
              const colors = REGION_COLORS[region]
              return (
                <div
                  key={region}
                  className={cn(
                    'rounded-lg border p-3',
                    colors.bg,
                    colors.border
                  )}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-base">{colors.icon}</span>
                    <h4 className={cn('text-xs font-semibold', colors.text)}>
                      {REGION_NAME_KO[region]}
                    </h4>
                  </div>
                  <div className="text-lg font-bold">
                    {(data.ttv / 1_000_000_000).toFixed(1)}B
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-1">
                    <span>{data.cities}개 도시</span>
                    <span>RN {(data.rn / 1000).toFixed(0)}K</span>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Key Insights */}
        <section className="bg-card border border-border rounded-xl">
          <div className="px-4 py-3 border-b border-border flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">주요 인사이트 (오늘)</h3>
          </div>
          <div className="p-3 space-y-2.5">
            <Insight
              icon={TrendingUp}
              color="text-emerald-600 dark:text-emerald-400"
              bg="bg-emerald-500/10"
              title="도쿄 예약건 가장 높음"
              detail="전일 대비 22.4% 증가"
            />
            <Insight
              icon={Plane}
              color="text-blue-600 dark:text-blue-400"
              bg="bg-blue-500/10"
              title="해외 도시 예약 비중 78%"
              detail="전일 대비 ▲ 4.2%p"
            />
            <Insight
              icon={Clock}
              color="text-violet-600 dark:text-violet-400"
              bg="bg-violet-500/10"
              title="피크 시간대"
              detail={PEAK_HOUR_RANGE}
            />
            <Insight
              icon={Users}
              color="text-cyan-600 dark:text-cyan-400"
              bg="bg-cyan-500/10"
              title={`총 활성 예약 ${totalActivity.toLocaleString()}건`}
              detail={`13개 도시 합산 (최근 1시간)`}
            />
          </div>
        </section>
      </div>
    </div>
  )
}

function KPI({
  icon: Icon, label, value, delta, positive,
}: {
  icon: typeof Briefcase
  label: string
  value: string
  delta: string
  positive?: boolean
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground">{label}</span>
        <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
          <Icon className="w-3.5 h-3.5" />
        </div>
      </div>
      <p className="text-2xl font-bold tracking-tight">{value}</p>
      <p
        className={cn(
          'text-[10px] mt-1',
          positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'
        )}
      >
        {delta}
      </p>
    </div>
  )
}

function Insight({
  icon: Icon, color, bg, title, detail,
}: {
  icon: typeof TrendingUp
  color: string
  bg: string
  title: string
  detail: string
}) {
  return (
    <div className="flex items-start gap-2.5 p-2 rounded-lg border border-border">
      <div className={cn('w-7 h-7 rounded-md flex items-center justify-center shrink-0', bg)}>
        <Icon className={cn('w-3.5 h-3.5', color)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold truncate">{title}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">{detail}</p>
      </div>
    </div>
  )
}

function FallbackHero() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950 text-slate-300 p-6 text-center">
      <ImageOff className="w-10 h-10 text-slate-500" />
      <p className="text-sm font-semibold">실시간 지도 이미지 로드 실패</p>
      <p className="text-xs text-slate-500 max-w-md">
        <code className="px-1.5 py-0.5 bg-slate-800 rounded">public/images/livemap-asia.png</code>
        에 이미지를 저장해 주세요. 우측 카드에서 도시별 실시간 예약 데이터를 확인할 수 있습니다.
      </p>
    </div>
  )
}
