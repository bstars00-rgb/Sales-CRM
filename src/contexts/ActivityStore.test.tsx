import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { ReactNode } from 'react'
import { AuthProvider, useAuth } from './AuthContext'
import { ActivityStoreProvider, useActivityStore, resetActivityStoreCounters } from './ActivityStore'

function wrapper({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ActivityStoreProvider>{children}</ActivityStoreProvider>
    </AuthProvider>
  )
}

function useStoreWithAuth() {
  const auth = useAuth()
  const store = useActivityStore()
  return { auth, store }
}

describe('ActivityStore.addTask', () => {
  beforeEach(() => {
    localStorage.clear()
    resetActivityStoreCounters()
  })

  it('user 없으면 null 반환 (R2-007)', () => {
    const { result } = renderHook(() => useActivityStore(), { wrapper: ActivityStoreProvider as any })
    let added: ReturnType<typeof result.current.addTask> | undefined
    act(() => {
      added = result.current.addTask({
        ownerUserId: 'unknown',
        date: '2026-04-25',
        category: 'NewDeal',
        title: 'X',
        status: 'Planned',
      })
    })
    expect(added).toBeNull()
  })

  it('정상 추가 시 빈 슬롯 rank 1 부여', () => {
    const { result } = renderHook(useStoreWithAuth, { wrapper })
    act(() => result.current.auth.login('ben@oh.com', 'demo'))
    let task: ReturnType<typeof result.current.store.addTask> | undefined
    act(() => {
      task = result.current.store.addTask({
        ownerUserId: 'u-tm',
        date: '2026-12-31',
        category: 'NewDeal',
        title: 'New',
        status: 'Planned',
      })
    })
    expect(task).not.toBeNull()
    expect(task!.rank).toBe(1)
  })

  it('6개 초과 차단 (TC-R2-003)', () => {
    const { result } = renderHook(useStoreWithAuth, { wrapper })
    act(() => result.current.auth.login('ben@oh.com', 'demo'))
    const date = '2026-12-30'
    act(() => {
      for (let i = 1; i <= 6; i++) {
        result.current.store.addTask({
          ownerUserId: 'u-tm',
          date,
          category: 'Internal',
          title: `Task ${i}`,
          status: 'Planned',
        })
      }
    })
    let seventh: ReturnType<typeof result.current.store.addTask> | undefined
    act(() => {
      seventh = result.current.store.addTask({
        ownerUserId: 'u-tm',
        date,
        category: 'Internal',
        title: '7th',
        status: 'Planned',
      })
    })
    expect(seventh).toBeNull()
  })
})

describe('ActivityStore.removeTask rank 재정렬', () => {
  beforeEach(() => {
    localStorage.clear()
    resetActivityStoreCounters()
  })

  it('중간 삭제 후 1..N 재정렬 (TC-R2-004 / QA-003)', () => {
    const { result } = renderHook(useStoreWithAuth, { wrapper })
    act(() => result.current.auth.login('ben@oh.com', 'demo'))
    const date = '2026-12-29'
    const ids: string[] = []
    act(() => {
      for (let i = 1; i <= 3; i++) {
        const t = result.current.store.addTask({
          ownerUserId: 'u-tm',
          date,
          category: 'Internal',
          title: `T${i}`,
          status: 'Planned',
        })
        if (t) ids.push(t.id)
      }
    })
    // 중간 삭제 (rank 2)
    act(() => result.current.store.removeTask(ids[1]))
    const remaining = result.current.store.getTasksByOwner('u-tm', date).sort((a, b) => a.rank - b.rank)
    expect(remaining).toHaveLength(2)
    expect(remaining[0].rank).toBe(1)
    expect(remaining[1].rank).toBe(2)
  })
})

describe('ActivityStore.toggleTaskDone', () => {
  beforeEach(() => {
    localStorage.clear()
    resetActivityStoreCounters()
  })

  it('Done 전환 시 Activity 자동 생성 + relatedTaskId 연결 (TC-R2-001 / QA-004)', () => {
    const { result } = renderHook(useStoreWithAuth, { wrapper })
    act(() => result.current.auth.login('ben@oh.com', 'demo'))
    const beforeCount = result.current.store.activities.length
    let task: ReturnType<typeof result.current.store.addTask> | undefined
    act(() => {
      task = result.current.store.addTask({
        ownerUserId: 'u-tm',
        date: '2026-12-28',
        channelId: 'c2',
        category: 'Promotion',
        title: 'Auto-activity test',
        status: 'Planned',
      })
    })
    expect(task).not.toBeNull()
    act(() => result.current.store.toggleTaskDone(task!.id))
    const updatedTask = result.current.store.tasks.find((t) => t.id === task!.id)
    expect(updatedTask?.status).toBe('Done')
    expect(updatedTask?.doneActivityIds?.length ?? 0).toBe(1)
    // 새 Activity가 생성됨
    expect(result.current.store.activities.length).toBe(beforeCount + 1)
    const created = result.current.store.activities.find((a) => a.relatedTaskId === task!.id)
    expect(created).toBeDefined()
    expect(created?.type).toBe('Promotion') // category 매핑
  })

  it('Done → InProgress 토글 시 Activity 미생성 (TC-R2-002)', () => {
    const { result } = renderHook(useStoreWithAuth, { wrapper })
    act(() => result.current.auth.login('ben@oh.com', 'demo'))
    let task: ReturnType<typeof result.current.store.addTask> | undefined
    act(() => {
      task = result.current.store.addTask({
        ownerUserId: 'u-tm',
        date: '2026-12-27',
        category: 'Internal',
        title: 'Toggle test',
        status: 'Planned',
      })
    })
    act(() => result.current.store.toggleTaskDone(task!.id))
    const countAfterDone = result.current.store.activities.length
    act(() => result.current.store.toggleTaskDone(task!.id))
    expect(result.current.store.activities.length).toBe(countAfterDone)
    expect(result.current.store.tasks.find((t) => t.id === task!.id)?.status).toBe('InProgress')
  })
})

describe('ActivityStore Activity ops', () => {
  beforeEach(() => {
    localStorage.clear()
    resetActivityStoreCounters()
  })

  it('addActivity → updateActivity → deleteActivity 라이프사이클', () => {
    const { result } = renderHook(useStoreWithAuth, { wrapper })
    act(() => result.current.auth.login('ben@oh.com', 'demo'))
    let added: ReturnType<typeof result.current.store.addActivity> | undefined
    act(() => {
      added = result.current.store.addActivity({
        channelId: 'c2',
        authorUserId: 'u-tm',
        type: 'Email',
        occurredAt: new Date().toISOString(),
        subject: 'Test email',
        content: 'Body',
        source: 'manual',
      })
    })
    expect(added).toBeDefined()
    act(() => result.current.store.updateActivity(added!.id, { subject: 'Updated' }))
    const found = result.current.store.activities.find((a) => a.id === added!.id)
    expect(found?.subject).toBe('Updated')
    act(() => result.current.store.deleteActivity(added!.id))
    expect(result.current.store.activities.find((a) => a.id === added!.id)).toBeUndefined()
  })
})
