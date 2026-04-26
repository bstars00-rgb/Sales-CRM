import { NavLink } from 'react-router'
import {
  Sun,
  LayoutDashboard,
  Globe,
  BarChart3,
  Building2,
  TrendingUp,
  MapPin,
  Users,
  Plug,
  CalendarDays,
  GitBranch,
  FileText,
  FileSignature,
  Sparkles,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const TABS = [
  { to: '/briefing', label: 'Daily Briefing', icon: Sun },
  { to: '/', label: 'Overview', icon: LayoutDashboard },
  { to: '/weekly-brief', label: 'Weekly Brief', icon: FileText },
  { to: '/pipeline', label: 'Pipeline', icon: GitBranch },
  { to: '/destination', label: 'Destination', icon: Globe },
  { to: '/performance', label: 'Performance', icon: BarChart3 },
  { to: '/hotels', label: 'Hotels', icon: Building2 },
  { to: '/trends', label: 'Trends', icon: TrendingUp },
  { to: '/live-map', label: 'Live Map', icon: MapPin },
  { to: '/crm', label: 'CRM', icon: Users },
  { to: '/contracts', label: 'Contracts', icon: FileSignature },
  { to: '/decisions', label: 'Decisions', icon: Sparkles },
  { to: '/integration', label: 'Integration', icon: Plug },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/settings', label: 'Settings', icon: Settings },
] as const

export default function TabNavigation() {
  return (
    <nav className="bg-card border-b border-border shrink-0">
      <div className="flex overflow-x-auto scrollbar-thin">
        {TABS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap',
                'border-b-2 transition-colors shrink-0',
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              )
            }
          >
            <Icon className="w-4 h-4" />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
