import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { ChevronRight, FileText, Home, Landmark, LogOut, PanelLeftClose, PanelLeftOpen, Settings, Users } from 'lucide-react'

import { logoutFn } from '#/lib/auth/auth.functions'
import { ROLE_DASHBOARD_HOME, ROLE_LOAN_HOME } from '#/lib/auth/role-routes'
import type { AuthUser } from '#/lib/auth/types'
import { cn } from '#/lib/utils'

export function Sidebar({ user, active }: { user: AuthUser; active: string }) {
  const navigate = useNavigate()
  const logout = useServerFn(logoutFn)
  const [collapsed, setCollapsed] = useState(false)

  const navItems = [
    { label: 'Dashboard', icon: Home, href: ROLE_DASHBOARD_HOME[user.role] ?? '/coming-soon' },
    { label: 'Loan', icon: Landmark, href: ROLE_LOAN_HOME[user.role] ?? '/coming-soon' },
    { label: 'Customers', icon: Users, href: '/customers' },
    { label: 'Documents', icon: FileText, href: '/documents' },
    { label: 'Settings', icon: Settings, href: '/settings' },
  ] as const

  return (
    <aside
      className={cn(
        'flex shrink-0 flex-col gap-2 self-stretch bg-[var(--corio-sidebar-bg)] py-2 transition-[width] duration-150',
        collapsed ? 'w-[88px]' : 'w-[265px]',
      )}
    >
      <div className="flex h-[72px] items-center justify-between px-6">
        {!collapsed && <span className="font-['Inter_Display:SemiBold'] text-lg font-semibold text-white">Corio</span>}
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          className="flex shrink-0 cursor-pointer items-center justify-center text-white/80 hover:text-white"
        >
          {collapsed ? <PanelLeftOpen className="size-5" /> : <PanelLeftClose className="size-5" />}
        </button>
      </div>

      <nav className="flex flex-col gap-1.5 px-5 py-2.5">
        {navItems.map((item) => {
          const isActive = item.label === active
          const Icon = item.icon
          return (
            <button
              key={item.label}
              type="button"
              disabled={!item.href}
              onClick={() => item.href && navigate({ to: item.href })}
              title={item.label}
              className={cn(
                'flex w-full cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-left text-sm font-medium text-white transition-colors',
                collapsed && 'justify-center px-2',
                isActive ? 'bg-[var(--corio-blue-500)]' : 'opacity-80 hover:opacity-100 disabled:cursor-not-allowed',
              )}
            >
              <Icon className="size-5 shrink-0" />
              {!collapsed && item.label}
            </button>
          )
        })}
        <button
          type="button"
          title="Logout"
          onClick={async () => {
            await logout()
            await navigate({ to: '/login' })
          }}
          className={cn(
            'flex w-full cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-left text-sm font-medium text-white opacity-80 transition-colors hover:opacity-100',
            collapsed && 'justify-center px-2',
          )}
        >
          <LogOut className="size-5 shrink-0" />
          {!collapsed && 'Logout'}
        </button>
      </nav>

      <button
        type="button"
        onClick={() => navigate({ to: '/settings' })}
        className={cn(
          'mt-auto flex cursor-pointer items-center gap-2 rounded-2xl bg-white/10 p-3 text-left shadow-[0px_1px_2px_0px_rgba(228,229,231,0.24)] hover:bg-white/15',
          collapsed ? 'mx-3 justify-center' : 'mx-5 justify-between',
        )}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/20 text-sm font-semibold text-white">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="size-full object-cover" />
            ) : (
              user.name
                .split(' ')
                .map((part) => part[0])
                .slice(0, 2)
                .join('')
            )}
          </div>
          {!collapsed && (
            <div className="flex min-w-0 flex-col text-white">
              <span className="truncate text-sm font-semibold">{user.name}</span>
              <span className="truncate text-xs capitalize opacity-60">{user.role.replace('_', ' ')}</span>
            </div>
          )}
        </div>
        {!collapsed && <ChevronRight className="size-4 shrink-0 text-white/60" />}
      </button>
    </aside>
  )
}
