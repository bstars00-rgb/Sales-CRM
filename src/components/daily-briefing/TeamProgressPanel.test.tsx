import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { ActivityStoreProvider } from '@/contexts/ActivityStore'
import TeamProgressPanel from './TeamProgressPanel'
import type { ReactNode } from 'react'
import { useEffect } from 'react'

function Wrapper({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ActivityStoreProvider>{children}</ActivityStoreProvider>
    </AuthProvider>
  )
}

function LoginAs({ email, children }: { email: string; children: ReactNode }) {
  const { login, user } = useAuth()
  useEffect(() => {
    if (!user) login(email, 'demo')
  }, [login, email, user])
  if (!user) return null
  return <>{children}</>
}

describe('TeamProgressPanel', () => {
  beforeEach(() => localStorage.clear())

  it('Team Member 권한은 패널 렌더 X (null 반환)', () => {
    const { container } = render(
      <Wrapper>
        <LoginAs email="ben@oh.com">
          <TeamProgressPanel />
        </LoginAs>
      </Wrapper>
    )
    // ben(Team Member) 로그인 — 패널 텍스트 없음
    expect(container.textContent).not.toMatch(/팀원 진척률/)
  })

  it('Team Manager는 같은 region 팀원 표시', async () => {
    render(
      <Wrapper>
        <LoginAs email="teammgr@oh.com">
          <TeamProgressPanel />
        </LoginAs>
      </Wrapper>
    )
    // 비동기 로그인 → useEffect로 리렌더
    await act(() => Promise.resolve())
    expect(screen.queryByText(/팀원 진척률/)).toBeInTheDocument()
    // EA region team_members: Ben Park, Grace Kim
    expect(screen.queryByText(/Ben Park/)).toBeInTheDocument()
    expect(screen.queryByText(/Grace Kim/)).toBeInTheDocument()
  })

  it('Director는 모든 team_member 표시', async () => {
    render(
      <Wrapper>
        <LoginAs email="director@oh.com">
          <TeamProgressPanel />
        </LoginAs>
      </Wrapper>
    )
    await act(() => Promise.resolve())
    expect(screen.queryByText(/팀원 진척률/)).toBeInTheDocument()
    // Ben/Grace/Jane/Jasmine 모두
    expect(screen.queryByText(/Ben Park/)).toBeInTheDocument()
    expect(screen.queryByText(/Jane Lee/)).toBeInTheDocument()
    expect(screen.queryByText(/Jasmine Choi/)).toBeInTheDocument()
  })

  it('Part Manager는 동일 partId 팀원만 (TS-NEW-009)', async () => {
    render(
      <Wrapper>
        <LoginAs email="partmgr@oh.com">
          <TeamProgressPanel />
        </LoginAs>
      </Wrapper>
    )
    await act(() => Promise.resolve())
    expect(screen.queryByText(/팀원 진척률/)).toBeInTheDocument()
    // Ben(part-ea-1) 포함, 다른 partId 없는 팀원은 미포함
    expect(screen.queryByText(/Ben Park/)).toBeInTheDocument()
    // Jane은 SEA, partId 없음 → 미포함
    expect(screen.queryByText(/Jane Lee/)).not.toBeInTheDocument()
  })
})
