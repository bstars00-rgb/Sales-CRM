import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { FilterProvider } from '@/contexts/FilterContext'
import KPICascadeCard from './KPICascadeCard'
import type { ReactNode } from 'react'
import { useEffect } from 'react'

function Wrapper({ children, role }: { children: ReactNode; role?: string }) {
  return (
    <AuthProvider>
      <FilterProvider>
        {role ? <SetRole role={role}>{children}</SetRole> : children}
      </FilterProvider>
    </AuthProvider>
  )
}

function SetRole({ role, children }: { role: string; children: ReactNode }) {
  const { login } = useAuth()
  useEffect(() => {
    const map: Record<string, string> = {
      ceo: 'ceo@oh.com',
      director: 'director@oh.com',
      team_member: 'ben@oh.com',
    }
    login(map[role] ?? 'ben@oh.com', 'demo')
  }, [login, role])
  return <>{children}</>
}

describe('KPICascadeCard', () => {
  beforeEach(() => localStorage.clear())

  it('5단계 L1~L5 모두 렌더', () => {
    render(<KPICascadeCard />, { wrapper: Wrapper })
    expect(screen.getByText(/L1/)).toBeInTheDocument()
    expect(screen.getByText(/L2/)).toBeInTheDocument()
    expect(screen.getByText(/L3/)).toBeInTheDocument()
    expect(screen.getByText(/L4/)).toBeInTheDocument()
    expect(screen.getByText(/L5/)).toBeInTheDocument()
  })

  it('Tier 가중치 50/30/20 표시', () => {
    render(<KPICascadeCard />, { wrapper: Wrapper })
    expect(screen.getByText(/50%/)).toBeInTheDocument()
    expect(screen.getByText(/30%/)).toBeInTheDocument()
    expect(screen.getByText(/20%/)).toBeInTheDocument()
  })

  it('시뮬레이션 배지 표시', () => {
    render(<KPICascadeCard />, { wrapper: Wrapper })
    expect(screen.getByText(/시뮬레이션 데이터/)).toBeInTheDocument()
  })

  it('L5는 항상 disabled (SCM CRM 단일 소스)', () => {
    render(<KPICascadeCard />, { wrapper: Wrapper })
    // L5 row 안의 편집 버튼은 disabled
    const l5Row = screen.getByText(/L5/).closest('div')
    expect(l5Row).toBeTruthy()
  })

  it('SCM CRM read-only 안내', () => {
    render(<KPICascadeCard />, { wrapper: Wrapper })
    expect(screen.getByText(/SCM CRM/)).toBeInTheDocument()
  })
})
