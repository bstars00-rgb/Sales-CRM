import { useMemo } from 'react'
import { Users, CheckCircle2, Circle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { useActivityStore } from '@/contexts/ActivityStore'
import { mockUsers } from '@/mocks/users'

/**
 * Manager 이상에게만 노출 — 본인 팀(또는 권역)의 팀원 Critical 6 진척 + 오늘 Activity 수.
 * PL-003 수용 — 직급별 데모 효과 강화.
 */
export default function TeamProgressPanel() {
  const { user, isAtLeast } = useAuth()
  const { tasks, activities } = useActivityStore()

  const today = new Date().toISOString().slice(0, 10)

  const teamMembers = useMemo(() => {
    if (!user || !isAtLeast('part_manager')) return []
    if (isAtLeast('director')) {
      return mockUsers.filter((u) => u.role === 'team_member')
    }
    if (user.role === 'team_manager') {
      return mockUsers.filter((u) => u.role === 'team_member' && u.region === user.region)
    }
    if (user.role === 'part_manager' && user.partId) {
      return mockUsers.filter((u) => u.role === 'team_member' && u.partId === user.partId)
    }
    return []
  }, [user, isAtLeast])

  if (!user || !isAtLeast('part_manager')) return null

  if (teamMembers.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-base font-semibold">팀원 진척률</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          현재 등록된 팀원이 없습니다. Settings에서 팀원을 추가하세요.
        </p>
      </div>
    )
  }

  const rows = teamMembers.map((m) => {
    const todayTasks = tasks.filter((t) => t.ownerUserId === m.id && t.date === today)
    const doneCount = todayTasks.filter((t) => t.status === 'Done').length
    const totalCount = todayTasks.length
    const todayActivities = activities.filter(
      (a) => a.authorUserId === m.id && a.occurredAt.slice(0, 10) === today
    ).length
    const carryOver = todayTasks.filter((t) => t.carryOver).length
    return {
      user: m,
      doneCount,
      totalCount,
      todayActivities,
      carryOver,
      pct: totalCount > 0 ? (doneCount / totalCount) * 100 : 0,
    }
  })

  const teamDone = rows.reduce((s, r) => s + r.doneCount, 0)
  const teamTotal = rows.reduce((s, r) => s + r.totalCount, 0)
  const teamActivities = rows.reduce((s, r) => s + r.todayActivities, 0)

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-base font-semibold">팀원 진척률</h3>
          <span className="text-xs text-muted-foreground">
            {teamMembers.length}명 · 오늘 Critical 6 {teamDone}/{teamTotal} · Activity {teamActivities}건
          </span>
        </div>
      </div>
      <div className="space-y-2">
        {rows.map((r) => (
          <div
            key={r.user.id}
            className="flex items-center gap-3 p-2 rounded-lg border border-border bg-background"
          >
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-xs font-semibold text-primary">
                {r.user.name.charAt(0)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium truncate">{r.user.name}</span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {r.doneCount}/{r.totalCount} · {r.pct.toFixed(0)}%
                </span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full',
                    r.pct >= 80 ? 'bg-emerald-500' : r.pct >= 50 ? 'bg-amber-500' : 'bg-red-500'
                  )}
                  style={{ width: `${r.pct}%` }}
                />
              </div>
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-1">
                <span className="inline-flex items-center gap-0.5">
                  <CheckCircle2 className="w-2.5 h-2.5" /> Done {r.doneCount}
                </span>
                <span className="inline-flex items-center gap-0.5">
                  <Circle className="w-2.5 h-2.5" /> Total {r.totalCount}
                </span>
                <span className="inline-flex items-center gap-0.5">
                  Activity {r.todayActivities}건
                </span>
                {r.carryOver > 0 && (
                  <span className="inline-flex items-center gap-0.5 text-amber-600 dark:text-amber-400">
                    <AlertCircle className="w-2.5 h-2.5" /> 이월 {r.carryOver}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
