import { useState, useEffect } from 'react'
import { api } from '../api/client'
import Spinner from '../components/Spinner'
import RoleBadge from '../components/RoleBadge'
import { Layers } from 'lucide-react'

const FORMATS = ['T20', 'ODI', 'Test']

function CategorySection({ label, color, description, players }) {
  return (
    <div className={`card border ${color}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-base font-bold text-neutral-100">{label}</h3>
          <p className="text-xs text-neutral-400 mt-0.5">{description}</p>
        </div>
        <span className="text-2xl font-black text-neutral-600">{players.length}</span>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {players.map(p => (
          <div key={p.name} className="flex items-center gap-2 bg-neutral-900/50 px-3 py-2 rounded-lg">
            <div className="w-1.5 h-1.5 rounded-full bg-current opacity-60 flex-shrink-0" />
            <span className="text-sm text-neutral-200 flex-1 truncate">{p.name}</span>
            <RoleBadge role={p.role} />
          </div>
        ))}
        {players.length === 0 && (
          <p className="col-span-2 text-sm text-neutral-500 py-2">No players in this category</p>
        )}
      </div>
    </div>
  )
}

export default function PlayerCategories() {
  const [fmt, setFmt] = useState('T20')
  const [cats, setCats] = useState({ team_a: [], team_b: [], team_c: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.playerCategories(fmt.toLowerCase())
      .then(d => setCats(d || { team_a: [], team_b: [], team_c: [] }))
      .catch(() => setCats({ team_a: [], team_b: [], team_c: [] }))
      .finally(() => setLoading(false))
  }, [fmt])

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Layers className="text-teal-400" size={22} />
        <h1 className="text-2xl font-bold text-neutral-100">Player Categories</h1>
      </div>

      {/* Format tabs */}
      <div className="flex gap-1 bg-neutral-900 p-1 rounded-xl w-fit">
        {FORMATS.map(f => (
          <button key={f} onClick={() => setFmt(f)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${fmt === f ? 'tab-active shadow' : 'tab-inactive'}`}>
            {f}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Team A', count: cats.team_a.length, color: 'text-teal-400',  desc: 'All-round / Most flexible' },
          { label: 'Team B', count: cats.team_b.length, color: 'text-blue-400',  desc: 'Moderate versatility' },
          { label: 'Team C', count: cats.team_c.length, color: 'text-amber-400', desc: 'Pure specialists' },
        ].map(({ label, count, color, desc }) => (
          <div key={label} className="card text-center">
            <p className={`text-3xl font-black ${color}`}>{count}</p>
            <p className="text-sm font-semibold text-neutral-200 mt-1">{label}</p>
            <p className="text-xs text-neutral-400 mt-0.5">{desc}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size={10} /></div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          <CategorySection
            label="Team A — Most Flexible"
            color="border-teal-600/40"
            description="Players who have both batting & bowling profiles. Can bat, bowl, or do both effectively in any situation."
            players={cats.team_a}
          />
          <CategorySection
            label="Team B — Moderate Versatility"
            color="border-blue-600/40"
            description="Players with a primary skill and some contribution in the secondary role."
            players={cats.team_b}
          />
          <CategorySection
            label="Team C — Specialists"
            color="border-amber-600/40"
            description="Pure specialists with a single focused skill set (batting only or bowling only)."
            players={cats.team_c}
          />
        </div>
      )}
    </div>
  )
}
