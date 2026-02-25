import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import {
  Activity, BarChart2, Trophy, Layers, TrendingUp, LogOut, Crosshair
} from 'lucide-react'
import { api } from '../api/client'

const navItems = [
  { to: '/predict',      icon: Crosshair,   label: 'Predict XI' },
  { to: '/player-stats', icon: BarChart2,    label: 'Player Stats' },
  { to: '/team-stats',   icon: Trophy,       label: 'Team Stats' },
  { to: '/categories',   icon: Layers,       label: 'Player Categories' },
  { to: '/form',         icon: TrendingUp,   label: 'Player Form' },
]

export default function Layout() {
  const navigate = useNavigate()
  const username = localStorage.getItem('username') || 'User'

  async function handleLogout() {
    try { await api.logout() } catch {}
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    navigate('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col">
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-800">
          <span className="text-2xl">🏏</span>
          <div>
            <p className="font-bold text-pitch-400 leading-tight">Cricket</p>
            <p className="text-xs text-slate-400 leading-tight">Analytics Engine</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-pitch-600/20 text-pitch-400 border border-pitch-600/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                }`
              }
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="border-t border-slate-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-200">{username}</p>
              <p className="text-xs text-slate-500">Analyst</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-900/20 transition-colors"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto bg-slate-950">
        <Outlet />
      </main>
    </div>
  )
}
