import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { clearSession, getSession } from '../auth/session'
import { useState } from 'react'
import ToastContainer from './ToastContainer'

const NAV = [
  { icon: 'dashboard',       label: 'Dashboard', to: '/dashboard' },
  { icon: 'account_balance', label: 'Portfolio',  to: '/portfolio' },
  { icon: 'flag',            label: 'Goals',      to: '/goals' },
  { icon: 'payments',        label: 'Income',     to: '/income' },
  { icon: 'pie_chart',       label: 'Budget',     to: '/budget' },
  { icon: 'insights',        label: 'Reports',    to: '/reports' },
  { icon: 'settings',        label: 'Settings',   to: '/settings' },
]

export default function Layout() {
  const navigate = useNavigate()
  const session = getSession()!
  const [mobileOpen, setMobileOpen] = useState(false)

  function handleLogout() {
    clearSession()
    navigate('/login', { replace: true })
  }


  const sidebar = (
    <aside className="flex flex-col h-full bg-surface border-r border-outline-variant/30">
      <div className="px-4 py-6 mb-2">
        <h1 className="font-headline-md text-headline-md font-bold text-secondary">Lumina Finance</h1>
        <p className="font-label-xs text-label-xs text-on-surface-variant uppercase tracking-widest">Financial Serenity</p>
      </div>

      <nav className="flex-grow flex flex-col gap-1 px-2">
        {NAV.map(({ icon, label, to }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-4 py-3 transition-all active:scale-95 font-label-sm text-label-sm ${
                isActive
                  ? 'bg-secondary-container text-on-secondary-container'
                  : 'text-on-surface-variant hover:bg-surface-container-high'
              }`
            }
          >
            <span className="material-symbols-outlined text-[20px]">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      <button
        onClick={handleLogout}
        className="mx-4 mb-2 flex items-center gap-2 px-4 py-3 rounded-lg text-on-surface-variant hover:bg-error-container hover:text-on-error-container transition-all font-label-sm text-label-sm active:scale-95"
      >
        <span className="material-symbols-outlined text-[20px]">logout</span>
        Sign Out
      </button>

      <div className="border-t border-outline-variant/30 pt-4 px-4 pb-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full teal-gradient flex items-center justify-center text-white font-bold text-sm shrink-0">
          {session.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex flex-col min-w-0">
          <span className="font-label-sm text-label-sm font-bold truncate">{session.name}</span>
          <span className="font-label-xs text-label-xs text-on-surface-variant truncate">{session.email}</span>
        </div>
      </div>
    </aside>
  )

  return (
    <div className="flex h-screen bg-surface overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden lg:block w-64 shrink-0 h-full">{sidebar}</div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative w-64 h-full">{sidebar}</div>
        </div>
      )}

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile topbar */}
        <div className="lg:hidden flex items-center gap-4 px-4 py-3 border-b border-outline-variant/30 bg-surface shrink-0">
          <button onClick={() => setMobileOpen(true)} className="text-on-surface-variant hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined">menu</span>
          </button>
          <span className="font-headline-md text-headline-md font-bold text-secondary">Lumina Finance</span>
        </div>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      <ToastContainer />
    </div>
  )
}
