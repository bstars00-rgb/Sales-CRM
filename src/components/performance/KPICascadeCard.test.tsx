import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AuthProvider } from '@/contexts/AuthContext'
import { FilterProvider } from '@/contexts/FilterContext'
import { mockUsers } from '@/mocks/users'
import KPICascadeCard from './KPICascadeCard'
import type { ReactNode } from 'react'

function setStoredUser(email: string) {
  const u = mockUsers.find((m) => m.email === email)
  if (u) localStorage.setItem('sales-crm:auth-user', JSON.stringify(u))
}

function Wrapper({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <FilterProvider>{children}</FilterProvider>
    </AuthProvider>
  )
}

describe('KPICascadeCard', () => {
  beforeEach(() => {
    localStorage.clear()
    setStoredUser('director@oh.com')
  })

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
    // T1 50% · T2 30% · T3 20% (Tier 가중치 카드)
    expect(screen.getByText(/T1.*50%/)).toBeInTheDocument()
    expect(screen.getByText(/T2.*30%/)).toBeInTheDocument()
    expect(screen.getByText(/T3.*20%/)).toBeInTheDocument()
  })

  it('시뮬레이션 배지 표시', () => {
    render(<KPICascadeCard />, { wrapper: Wrapper })
    expect(screen.getByText(/시뮬레이션 데이터/)).toBeInTheDocument()
  })

  it('SCM CRM read-only 안내 (BR-008-5)', () => {
    render(<KPICascadeCard />, { wrapper: Wrapper })
    expect(screen.getByText(/SCM CRM/)).toBeInTheDocument()
  })

  it('헤더 제목 표시', () => {
    render(<KPICascadeCard />, { wrapper: Wrapper })
    expect(screen.getByText(/KPI Cascade/)).toBeInTheDocument()
  })
})
