import { useState, useEffect } from 'react'
import { api } from '../api/client'
import Spinner from '../components/Spinner'
import { TrendingUp, Search, X, Plus } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts'

const FORMATS = ['All', 'T20', 'ODI', 'Test']
const COLORS = ['#14b8a6', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6']

const CHART_TOOLTIP_STYLE = {
  background: '#262626',
  border: '1px solid #404040',
  borderRadius: 8,
  color: '#e5e5e5',
}

export default function PlayerForm() {
  const [fmt, setFmt] = useState('All')
  const [allPlayers, setAllPlayers] = useState([])
  const [selected, setSelected] = useState([])
  const [formData, setFormData] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const [t20, odi, test] = await Promise.all([
          api.indiaPlayers('t20'),
          api.indiaPlayers('odi'),
          api.indiaPlayers('test'),
        ])
        const all = [...new Set([
          ...(t20.players || []),
          ...(odi.players || []),
          ...(test.players || []),
        ])].sort()
        setAllPlayers(all)
      } catch {}
    }
    load()
  }, [])

  useEffect(() => {
    if (selected.length === 0) { setFormData([]); return }
    setLoading(true)
    const fmtParam = fmt === 'All' ? null : fmt.toLowerCase()
    api.playerForm(selected, fmtParam, 5)
      .then(d => setFormData(d || []))
      .catch(() => setFormData([]))
      .finally(() => setLoading(false))
  }, [selected, fmt])

  function addPlayer(name) {
    if (!selected.includes(name) && selected.length < 5) {
      setSelected(s => [...s, name])
    }
    setSearch('')
    setShowDropdown(false)
  }

  function removePlayer(name) {
    setSelected(s => s.filter(p => p !== name))
  }

  const filtered = allPlayers.filter(p =>
    p.toLowerCase().includes(search.toLowerCase()) && !selected.includes(p)
  ).slice(0, 8)

  const chartData = (() => {
    const byPlayer = {}
    for (const p of selected) {
      byPlayer[p] = formData.filter(d => d.player === p)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
    }
    const maxLen = Math.max(...Object.values(byPlayer).map(arr => arr.length), 0)
    return Array.from({ length: maxLen }, (_, i) => {
      const row = { match: `M${i + 1}` }
      for (const [player, matches] of Object.entries(byPlayer)) {
        if (matches[i]) row[player] = matches[i].impact_score
      }
      return row
    })
  })()

  const tableByPlayer = {}
  for (const p of selected) {
    tableByPlayer[p] = formData.filter(d => d.player === p)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <TrendingUp className="text-teal-400" size={22} />
        <h1 className="text-2xl font-bold text-neutral-100">Player Form</h1>
      </div>

      {/* Format filter */}
      <div className="flex gap-1 bg-neutral-900 p-1 rounded-xl w-fit">
        {FORMATS.map(f => (
          <button key={f} onClick={() => setFmt(f)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${fmt === f ? 'tab-active shadow' : 'tab-inactive'}`}>
            {f}
          </button>
        ))}
      </div>

      {/* Player selector */}
      <div className="card space-y-3">
        <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
          Select Players (max 5)
        </p>

        {/* Selected chips */}
        <div className="flex flex-wrap gap-2 min-h-[36px]">
          {selected.map((p, i) => (
            <span key={p}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium"
              style={{ background: COLORS[i] + '20', border: `1px solid ${COLORS[i]}60`, color: COLORS[i] }}
            >
              {p}
              <button onClick={() => removePlayer(p)} className="hover:opacity-70">
                <X size={12} />
              </button>
            </span>
          ))}
          {selected.length < 5 && (
            <div className="relative">
              <div className="flex items-center gap-1.5 bg-neutral-700/50 border border-neutral-600/50 rounded-full px-3 py-1">
                <Search size={12} className="text-neutral-400" />
                <input
                  className="bg-transparent outline-none text-sm text-neutral-200 placeholder-neutral-500 w-36"
                  placeholder="Add player…"
                  value={search}
                  onChange={e => { setSearch(e.target.value); setShowDropdown(true) }}
                  onFocus={() => setShowDropdown(true)}
                />
              </div>
              {showDropdown && search && filtered.length > 0 && (
                <div className="absolute top-full mt-1 left-0 z-20 bg-neutral-800 border border-neutral-700 rounded-xl shadow-xl w-56 overflow-hidden">
                  {filtered.map(p => (
                    <button
                      key={p}
                      onClick={() => addPlayer(p)}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-neutral-700 text-sm text-neutral-200 text-left"
                    >
                      <Plus size={12} className="text-teal-400" />
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {selected.length === 0 ? (
        <div className="card flex flex-col items-center justify-center h-48 text-neutral-500">
          <TrendingUp size={40} className="mb-3 opacity-30" />
          <p>Select players to view their recent form</p>
        </div>
      ) : loading ? (
        <div className="flex justify-center py-20"><Spinner size={10} /></div>
      ) : (
        <>
          {/* Line chart */}
          <div className="card">
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-4">
              Impact Score — Last 5 Matches
            </p>
            {chartData.length === 0 ? (
              <p className="text-neutral-500 text-sm py-8 text-center">No match data found for selected players / format</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
                  <XAxis dataKey="match" tick={{ fill: '#a3a3a3', fontSize: 12 }} />
                  <YAxis domain={[0, 100]} tick={{ fill: '#a3a3a3', fontSize: 12 }} />
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                  <Legend wrapperStyle={{ fontSize: 12, color: '#a3a3a3' }} />
                  {selected.map((p, i) => (
                    <Line
                      key={p}
                      type="monotone"
                      dataKey={p}
                      stroke={COLORS[i]}
                      strokeWidth={2}
                      dot={{ r: 4, fill: COLORS[i] }}
                      activeDot={{ r: 6 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Per-player tables */}
          <div className="grid grid-cols-1 gap-4">
            {selected.map((p, i) => {
              const matches = tableByPlayer[p] || []
              return (
                <div key={p} className="card">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: COLORS[i] }} />
                    <h3 className="font-semibold text-neutral-100">{p}</h3>
                    <span className="text-xs text-neutral-400">— Last {matches.length} {fmt === 'All' ? '' : fmt} matches</span>
                  </div>
                  {matches.length === 0 ? (
                    <p className="text-neutral-500 text-sm">No data available</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-xs text-neutral-500 border-b border-neutral-700">
                            <th className="text-left pb-2">Date</th>
                            <th className="text-left pb-2">Format</th>
                            <th className="text-left pb-2 max-w-[160px]">Venue</th>
                            <th className="text-right pb-2">Impact</th>
                            <th className="text-right pb-2">Bat</th>
                            <th className="text-right pb-2">Bowl</th>
                            <th className="text-right pb-2">Runs</th>
                            <th className="text-right pb-2">Wkts</th>
                            <th className="text-right pb-2">SR</th>
                            <th className="text-right pb-2">Eco</th>
                          </tr>
                        </thead>
                        <tbody>
                          {matches.map((m, mi) => (
                            <tr key={mi} className="border-b border-neutral-800/50 hover:bg-neutral-700/30">
                              <td className="py-2 text-neutral-400">{m.date.slice(0, 10)}</td>
                              <td className="py-2">
                                <span className="text-xs font-medium text-neutral-300 uppercase">{m.format}</span>
                              </td>
                              <td className="py-2 text-neutral-400 max-w-[160px] truncate">{m.venue}</td>
                              <td className="py-2 text-right">
                                <span className="font-bold" style={{
                                  color: m.impact_score >= 70 ? '#14b8a6' : m.impact_score >= 50 ? '#3b82f6' : m.impact_score >= 30 ? '#f59e0b' : '#ef4444'
                                }}>{m.impact_score}</span>
                              </td>
                              <td className="py-2 text-right text-neutral-300">{m.bat_score}</td>
                              <td className="py-2 text-right text-neutral-300">{m.bowl_score}</td>
                              <td className="py-2 text-right text-neutral-300">{m.runs}</td>
                              <td className="py-2 text-right text-neutral-300">{m.wickets}</td>
                              <td className="py-2 text-right text-neutral-400">{m.strike_rate}</td>
                              <td className="py-2 text-right text-neutral-400">{m.economy}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
