import { useState, useEffect } from 'react'
import { api } from '../api/client'
import Spinner from '../components/Spinner'
import RoleBadge from '../components/RoleBadge'
import { Layers } from 'lucide-react'

const FORMATS = ['T20', 'ODI', 'Test']

function CategoryCard({ label, colorClass, borderClass, bgClass, description, players }) {
  return (
    <div className={`bg-white rounded-xl border ${borderClass} shadow-sm overflow-hidden`}>
      {/* Header bar */}
      <div className={`${bgClass} px-5 py-3 border-b ${borderClass}`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-800">{label}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{description}</p>
          </div>
          <span className={`text-2xl font-black ${colorClass}`}>{players.length}</span>
        </div>
      </div>

      {/* Players grid */}
      <div className="p-4">
        {players.length === 0 ? (
          <p className="text-sm text-gray-400 py-3 text-center">No players in this category</p>
        ) : (
          <div className="grid grid-cols-2 gap-1.5">
            {players.map(p => (
              <div key={p.name} className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
                <span className="text-sm text-gray-700 flex-1 truncate">{p.name}</span>
                <RoleBadge role={p.role} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function PlayerCategories() {
  const [fmt, setFmt]     = useState('T20')
  const [cats, setCats]   = useState({ team_a: [], team_b: [], team_c: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.playerCategories(fmt.toLowerCase())
      .then(d => setCats(d || { team_a: [], team_b: [], team_c: [] }))
      .catch(() => setCats({ team_a: [], team_b: [], team_c: [] }))
      .finally(() => setLoading(false))
  }, [fmt])

  const summary = [
    { label: 'Team A', count: cats.team_a.length, colorClass: 'text-teal-600', bgIconClass: 'bg-teal-50',  desc: 'All-round / Flexible' },
    { label: 'Team B', count: cats.team_b.length, colorClass: 'text-blue-600', bgIconClass: 'bg-blue-50',  desc: 'Moderate versatility' },
    { label: 'Team C', count: cats.team_c.length, colorClass: 'text-amber-600', bgIconClass: 'bg-amber-50', desc: 'Pure specialists' },
  ]

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Player Categories</h1>
        <p className="text-gray-500 text-sm">India squad classified by versatility across batting and bowling</p>
      </div>

      {/* Format tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {FORMATS.map(f => (
          <button key={f} onClick={() => setFmt(f)}
            className={`px-5 py-2 rounded-lg text-sm transition-all ${fmt === f ? 'tab-active' : 'tab-inactive'}`}>
            {f}
          </button>
        ))}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {summary.map(({ label, count, colorClass, bgIconClass, desc }) => (
          <div key={label} className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium mb-1">{label}</p>
                <p className={`text-4xl font-black ${colorClass}`}>{count}</p>
              </div>
              <div className={`${bgIconClass} p-3 rounded-lg`}>
                <Layers className={`w-5 h-5 ${colorClass}`} />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-3">{desc}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size={10} /></div>
      ) : (
        <div className="space-y-5">
          <CategoryCard
            label="Team A — Most Flexible"
            colorClass="text-teal-600"
            borderClass="border-teal-200"
            bgClass="bg-teal-50"
            description="Both batting & bowling profiles. Effective in any situation."
            players={cats.team_a}
          />
          <CategoryCard
            label="Team B — Moderate Versatility"
            colorClass="text-blue-600"
            borderClass="border-blue-200"
            bgClass="bg-blue-50"
            description="Primary skill with some secondary role contribution."
            players={cats.team_b}
          />
          <CategoryCard
            label="Team C — Specialists"
            colorClass="text-amber-600"
            borderClass="border-amber-200"
            bgClass="bg-amber-50"
            description="Pure specialist — batting only or bowling only."
            players={cats.team_c}
          />
        </div>
      )}
    </div>
  )
}
