import { ChevronRight, Target, Building, Globe2, Users, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { useFilters } from '@/contexts/FilterContext'
import { formatCurrency } from '@/utils/kpiCalc'

/**
 * FR-008 KPI Cascade L1~L5 시각화 placeholder.
 * 정식 편집 UI는 Phase 1.5 (Director 권한 + audit log + SCM 연동).
 * 현 단계는 5단계 구조 + 시뮬레이션 가중치(Tier 50/30/20)를 시각적으로 표현.
 */

const CASCADE_LEVELS = [
  { level: 'L1', name: '전사 연간', icon: Target, editorRole: 'CEO / C-Level', value: '¥30B', sub: 'TTV 목표 (시뮬)' },
  { level: 'L2', name: '권역', icon: Globe2, editorRole: 'Regional Director', value: 'EA 50% / SEA 25% / SA 15%', sub: 'EA: ¥15B' },
  { level: 'L3', name: '채널 (Tier 가중치)', icon: Building, editorRole: 'Director', value: 'T1 50% · T2 30% · T3 20%', sub: 'OQ-007 정식 채택' },
  { level: 'L4', name: '팀원 (PIC)', icon: Users, editorRole: '자동 합산', value: 'Channel.picUserId', sub: 'Ben/Grace/Jane/Jasmine 자동' },
  { level: 'L5', name: '월별 시즌성', icon: Calendar, editorRole: 'SCM CRM (read-only)', value: 'SCM 단일 소스', sub: 'BR-008-5 — Sales 편집 불가' },
] as const

export default function KPICascadeCard() {
  const { isAtLeast } = useAuth()
  const canEdit = isAtLeast('director')

  return (
    <section className="bg-card border border-border rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Target className="w-4 h-4" />
            KPI Cascade L1~L5 (FR-008)
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            전사 → 권역 → 채널(Tier) → 팀원 → 월별 5단계 자동 배분
          </p>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400">
          시뮬레이션 데이터 (Phase 1.5에서 정식 편집 UI)
        </span>
      </div>

      <div className="space-y-2">
        {CASCADE_LEVELS.map((lv, idx) => {
          const Icon = lv.icon
          const isLast = idx === CASCADE_LEVELS.length - 1
          return (
            <div key={lv.level}>
              <div className="flex items-start gap-3 p-3 rounded-lg border border-border bg-background">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="text-xs font-mono text-muted-foreground">{lv.level}</span>
                    <span className="text-sm font-semibold">{lv.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                      편집: {lv.editorRole}
                    </span>
                  </div>
                  <div className="text-sm font-medium">{lv.value}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{lv.sub}</div>
                </div>
                <button
                  disabled={!canEdit || lv.level === 'L5'}
                  className={cn(
                    'shrink-0 px-2 py-1 rounded text-[10px] border border-border',
                    canEdit && lv.level !== 'L5'
                      ? 'hover:bg-accent text-foreground'
                      : 'text-muted-foreground/50 cursor-not-allowed'
                  )}
                  title={lv.level === 'L5' ? 'SCM CRM에서만 편집' : !canEdit ? 'Director 이상' : '편집 (Phase 1.5)'}
                >
                  편집
                </button>
              </div>
              {!isLast && (
                <div className="flex justify-center py-0.5">
                  <ChevronRight className="w-3 h-3 text-muted-foreground rotate-90" />
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-border">
        <MyTargetCard label="내 목표 (시뮬)" value="¥620M" hint="4월 시즌성 8.9%" />
        <MyTargetCard label="실적 (4/18 주)" value="¥420M" hint="달성률 67.7%" trend="warning" />
        <MyTargetCard label="권역 진척률" value="EA 67.7% / SEA 0%" hint="SCM 연동 후 자동" />
      </div>
    </section>
  )
}

function MyTargetCard({
  label,
  value,
  hint,
  trend,
}: {
  label: string
  value: string
  hint: string
  trend?: 'success' | 'warning' | 'danger'
}) {
  return (
    <div className="bg-background border border-border rounded-md p-3">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
      <p
        className={cn(
          'text-base font-bold mt-0.5',
          trend === 'success' && 'text-emerald-600 dark:text-emerald-400',
          trend === 'warning' && 'text-amber-600 dark:text-amber-400',
          trend === 'danger' && 'text-red-500'
        )}
      >
        {value}
      </p>
      <p className="text-[10px] text-muted-foreground mt-0.5">{hint}</p>
    </div>
  )
}
