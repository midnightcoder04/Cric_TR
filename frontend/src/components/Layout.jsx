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
  const username = localStorage.getItem('username') || 'Admin'

  async function handleLogout() {
    try { await api.logout() } catch {}
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    navigate('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar — always dark */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-[72px]'
        } flex-shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col transition-all duration-300`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-800">
          <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <BarChart3 className="w-4 h-4 text-white" />
          </div>
          {sidebarOpen && (
            <div className="overflow-hidden">
              <p className="font-bold text-white text-sm leading-tight">CricketAI</p>
              <p className="text-xs text-gray-400 leading-tight">Analytics Engine</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-teal-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                } ${!sidebarOpen ? 'justify-center' : ''}`
              }
              title={!sidebarOpen ? label : undefined}
            >
              <Icon size={18} className="flex-shrink-0" />
              {sidebarOpen && <span className="truncate">{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-800 p-3 space-y-1">
          <button
            onClick={() => setSidebarOpen(o => !o)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-colors ${!sidebarOpen ? 'justify-center' : ''}`}
          >
            {sidebarOpen ? (
              <>
                <X size={18} className="flex-shrink-0" />
                <span>Collapse</span>
              </>
            ) : (
              <Menu size={18} />
            )}
          </button>

          <div className={`flex items-center gap-3 px-3 py-2 ${!sidebarOpen ? 'justify-center' : 'justify-between'}`}>
            {sidebarOpen && (
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-200 truncate">{username}</p>
                <p className="text-xs text-gray-500">Analyst</p>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-900/20 transition-colors flex-shrink-0"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content — light */}
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <Outlet />
      </main>
    </div>
  )
}
