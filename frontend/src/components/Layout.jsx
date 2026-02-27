import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import {
  BarChart3, BarChart2, Trophy, Layers, TrendingUp, LogOut, Crosshair, Menu, X
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
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const navigate = useNavigate()
  const username = localStorage.getItem('username') || 'User'

  async function handleLogout() {
    try { await api.logout() } catch {}
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    navigate('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-950">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } flex-shrink-0 bg-neutral-900 border-r border-neutral-800 flex flex-col transition-all duration-300`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-neutral-800">
          <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          {sidebarOpen && (
            <div>
              <p className="font-bold text-neutral-100 leading-tight">Cricket</p>
              <p className="text-xs text-neutral-500 leading-tight">Analytics Engine</p>
            </div>
          )}
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
                    ? 'bg-teal-600 text-white'
                    : 'text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800'
                }`
              }
            >
              <Icon size={17} className="flex-shrink-0" />
              {sidebarOpen && label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-neutral-800 p-3 space-y-1">
          {/* Collapse toggle */}
          <button
            onClick={() => setSidebarOpen(o => !o)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition-colors"
          >
            {sidebarOpen ? (
              <>
                <X size={17} className="flex-shrink-0" />
                <span>Collapse</span>
              </>
            ) : (
              <Menu size={17} className="flex-shrink-0" />
            )}
          </button>

          {/* User + logout */}
          <div className="flex items-center justify-between px-3 py-2">
            {sidebarOpen && (
              <div className="min-w-0">
                <p className="text-sm font-medium text-neutral-200 truncate">{username}</p>
                <p className="text-xs text-neutral-500">Analyst</p>
              </div>
            )}
            <button
              onClick={handleLogout}
              className={`p-2 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-red-900/20 transition-colors ${sidebarOpen ? '' : 'mx-auto'}`}
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto bg-neutral-950">
        <Outlet />
      </main>
    </div>
  )
}
