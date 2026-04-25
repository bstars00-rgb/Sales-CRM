import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router'
import { Sun, Moon, Monitor, LogIn } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useAuth, DEMO_USER_LIST } from '@/contexts/AuthContext'
import { ROLE_LABELS } from '@/types'
import { cn } from '@/lib/utils'

export default function LoginPage() {
  const { login, user } = useAuth()
  const { theme, setTheme } = useTheme()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const cycleTheme = () => {
    const next = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light'
    setTheme(next)
  }
  const ThemeIcon = theme === 'dark' ? Moon : theme === 'system' ? Monitor : Sun

  // 이미 로그인 → declarative redirect (Navigate 컴포넌트)
  if (user) {
    const target = ['ceo', 'c_level', 'regional_director', 'director'].includes(user.role)
      ? '/'
      : '/briefing'
    return <Navigate to={target} replace />
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    await new Promise((r) => setTimeout(r, 300)) // demo latency
    const result = login(email, password)
    if (!result.ok) {
      if (result.reason === 'locked' && result.lockUntil) {
        const mins = Math.ceil((result.lockUntil - Date.now()) / 60_000)
        setError(`5회 연속 실패로 ${mins}분간 잠금 — IT팀 문의`)
      } else {
        setError('이메일 또는 비밀번호가 올바르지 않습니다. (데모 비밀번호: demo)')
      }
      setSubmitting(false)
      return
    }
    // useEffect가 user 변경 감지하여 자동 라우팅
  }

  const quickLogin = (demoEmail: string) => {
    setEmail(demoEmail)
    setPassword('demo')
    login(demoEmail, 'demo')
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="h-14 px-6 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">OH</span>
          </div>
          <h1 className="text-base font-semibold tracking-tight">OhMyHotel Sales CRM</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={cycleTheme}
            className="p-2 rounded-md hover:bg-accent transition-colors"
            title={`테마: ${theme}`}
          >
            <ThemeIcon className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </header>

      {/* Body */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-[480px] bg-card border border-border rounded-xl shadow-sm p-8">
          <h2 className="text-xl font-semibold mb-1">로그인</h2>
          <p className="text-sm text-muted-foreground mb-6">
            OMH 계정으로 Sales CRM에 접속하세요.
          </p>

          {/* SSO Button (Phase 1.5 — Microsoft Azure AD MSAL) */}
          <button
            type="button"
            disabled
            className={cn(
              'w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg',
              'border border-border bg-background text-foreground/60',
              'cursor-not-allowed opacity-60'
            )}
            title="Phase 1.5에서 Azure AD SSO 활성화 예정"
          >
            <svg viewBox="0 0 23 23" className="w-4 h-4">
              <rect x="1" y="1" width="10" height="10" fill="#f25022" />
              <rect x="12" y="1" width="10" height="10" fill="#7fba00" />
              <rect x="1" y="12" width="10" height="10" fill="#00a4ef" />
              <rect x="12" y="12" width="10" height="10" fill="#ffb900" />
            </svg>
            <span className="text-sm font-medium">Microsoft 계정으로 로그인 (준비 중)</span>
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">또는</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit} className="space-y-3" aria-label="로그인 폼">
            <div>
              <label htmlFor="login-email" className="block text-xs font-medium text-foreground/80 mb-1">이메일</label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ben@oh.com"
                required
                autoComplete="email"
                aria-invalid={!!error}
                aria-describedby={error ? 'login-error' : undefined}
                className={cn(
                  'w-full px-3 py-2 rounded-lg text-sm',
                  'bg-background border border-border',
                  'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent'
                )}
              />
            </div>
            <div>
              <label htmlFor="login-password" className="block text-xs font-medium text-foreground/80 mb-1">비밀번호</label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="demo"
                required
                autoComplete="current-password"
                aria-invalid={!!error}
                aria-describedby={error ? 'login-error' : undefined}
                className={cn(
                  'w-full px-3 py-2 rounded-lg text-sm',
                  'bg-background border border-border',
                  'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent'
                )}
              />
            </div>
            {error && (
              <div
                id="login-error"
                role="alert"
                aria-live="polite"
                className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2"
              >
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={submitting}
              className={cn(
                'w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg',
                'bg-primary text-primary-foreground font-medium text-sm',
                'hover:bg-primary/90 transition-colors disabled:opacity-50'
              )}
            >
              <LogIn className="w-4 h-4" />
              {submitting ? '로그인 중...' : '로그인'}
            </button>
          </form>

          {/* Demo Quick Login */}
          <div className="mt-6 pt-5 border-t border-border">
            <p className="text-xs text-muted-foreground mb-2">데모 계정 빠른 로그인:</p>
            <div className="grid grid-cols-2 gap-1.5">
              {DEMO_USER_LIST.map((u) => (
                <button
                  key={u.id}
                  onClick={() => quickLogin(u.email)}
                  className={cn(
                    'text-left px-2.5 py-1.5 rounded-md text-xs',
                    'border border-border hover:bg-accent transition-colors'
                  )}
                >
                  <div className="font-medium truncate">{u.name}</div>
                  <div className="text-muted-foreground truncate">{ROLE_LABELS[u.role]}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>

      <footer className="px-6 py-4 text-xs text-muted-foreground text-center">
        OhMyHotel Sales CRM • v0.1 (Phase 1) • <a href="mailto:it@oh.com" className="hover:underline">IT 문의</a>
      </footer>
    </div>
  )
}
